// AI proxy for the Pie proof editor.
//
// Holds the Runpod and DeepSeek keys as Worker secrets so the public frontend
// never ships them. Exposes three routes:
//   GET  /health   Tactic LLM health (same shape as the local serve.py)
//   POST /predict  Tactic LLM prediction (same shape as the local serve.py)
//   POST /chat     General LLM completion for a frontend-built prompt
//
// The origin check stops other websites from using the proxy from a browser;
// it does not stop scripts, which can forge Origin. Spend is bounded by the
// per-IP rate limit, the request size caps below, max_tokens, Runpod's max
// worker count, and DeepSeek's prepaid balance.

interface RateLimiter {
  limit(options: { key: string }): Promise<{ success: boolean }>;
}

export interface Env {
  RUNPOD_ENDPOINT_URL: string;   // https://api.runpod.ai/v2/<id>
  RUNPOD_API_KEY: string;        // secret
  DEEPSEEK_API_KEY: string;      // secret
  ALLOWED_ORIGINS: string;       // comma-separated
  LIMITER?: RateLimiter;
}

const DEEPSEEK_ENDPOINT = "https://api.deepseek.com/chat/completions";
const DEEPSEEK_MODEL = "deepseek-flash";
const MAX_TOKENS = 2048;
const MAX_PROMPT_CHARS = 32_000;
const MAX_PREDICT_BYTES = 64_000;
// A cold 7B start takes ~80s. The free plan allows 50 subrequests per
// invocation, so poll every 5s for at most 30 polls.
const POLL_INTERVAL_MS = 5_000;
const MAX_POLLS = 30;

type Json = Record<string, unknown>;

function json(body: unknown, status: number, cors: HeadersInit): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...cors, "Content-Type": "application/json" },
  });
}

function corsHeaders(origin: string): HeadersInit {
  return {
    "Access-Control-Allow-Origin": origin,
    "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
    "Access-Control-Max-Age": "86400",
    Vary: "Origin",
  };
}

async function readJson(request: Request, maxBytes: number): Promise<Json | null> {
  const text = await request.text();
  if (text.length > maxBytes) return null;
  try {
    const value = JSON.parse(text);
    return value && typeof value === "object" && !Array.isArray(value) ? value : null;
  } catch {
    return null;
  }
}

function isContext(value: unknown): boolean {
  return Array.isArray(value) && value.every((entry) =>
    entry && typeof entry === "object" &&
    typeof (entry as Json).name === "string" && typeof (entry as Json).type === "string");
}

async function health(env: Env, cors: HeadersInit): Promise<Response> {
  const resp = await fetch(`${env.RUNPOD_ENDPOINT_URL}/health`, {
    headers: { Authorization: `Bearer ${env.RUNPOD_API_KEY}` },
  });
  return json({ status: resp.ok ? "ok" : "unavailable" }, resp.ok ? 200 : 502, cors);
}

async function predict(request: Request, env: Env, cors: HeadersInit): Promise<Response> {
  const body = await readJson(request, MAX_PREDICT_BYTES);
  if (!body || typeof body.goal !== "string" ||
      !isContext(body.globalContext) || !isContext(body.localContext)) {
    return json({ error: "Invalid prediction request." }, 400, cors);
  }
  const input = { goal: body.goal, globalContext: body.globalContext, localContext: body.localContext };
  const headers = {
    Authorization: `Bearer ${env.RUNPOD_API_KEY}`,
    "Content-Type": "application/json",
  };

  const sync = await fetch(`${env.RUNPOD_ENDPOINT_URL}/runsync`, {
    method: "POST",
    headers,
    body: JSON.stringify({ input }),
  });
  if (!sync.ok) return json({ error: "Tactic LLM unavailable." }, 502, cors);

  let job = await sync.json() as { id?: string; status?: string; output?: Json };
  for (let polls = 0; job.status !== "COMPLETED"; polls++) {
    if (!job.id || polls >= MAX_POLLS ||
        ["FAILED", "CANCELLED", "TIMED_OUT"].includes(job.status ?? "")) {
      return json({ error: "Tactic LLM did not finish." }, 504, cors);
    }
    await new Promise((resolve) => setTimeout(resolve, POLL_INTERVAL_MS));
    const status = await fetch(`${env.RUNPOD_ENDPOINT_URL}/status/${encodeURIComponent(job.id)}`, { headers });
    if (!status.ok) return json({ error: "Tactic LLM unavailable." }, 502, cors);
    job = await status.json() as typeof job;
  }

  const output = job.output ?? {};
  return json({
    tactic: output.tactic,
    tactic_head: output.tactic_head,
    category: output.category,
  }, 200, cors);
}

async function chat(request: Request, env: Env, cors: HeadersInit): Promise<Response> {
  const body = await readJson(request, MAX_PROMPT_CHARS + 1_000);
  if (!body || typeof body.prompt !== "string" || !body.prompt.trim() ||
      body.prompt.length > MAX_PROMPT_CHARS) {
    return json({ error: "Invalid chat request." }, 400, cors);
  }

  const resp = await fetch(DEEPSEEK_ENDPOINT, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${env.DEEPSEEK_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: DEEPSEEK_MODEL,
      messages: [{ role: "user", content: body.prompt }],
      stream: false,
      thinking: { type: "disabled" },
      max_tokens: MAX_TOKENS,
    }),
  });
  // Pass the status through so the client's 402/429 advice still applies, but
  // never forward upstream error bodies.
  if (!resp.ok) return json({ error: "General LLM request failed." }, resp.status, cors);

  const result = await resp.json() as {
    choices?: Array<{ finish_reason?: string; message?: { content?: unknown } }>;
  };
  const choice = result.choices?.[0];
  return json({
    choices: [{ finish_reason: choice?.finish_reason, message: { content: choice?.message?.content } }],
  }, 200, cors);
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const allowed = env.ALLOWED_ORIGINS.split(",").map((o) => o.trim()).filter(Boolean);
    const origin = request.headers.get("Origin") ?? "";
    if (!allowed.includes(origin)) {
      return new Response("Forbidden", { status: 403 });
    }
    const cors = corsHeaders(origin);
    if (request.method === "OPTIONS") return new Response(null, { status: 204, headers: cors });

    if (env.LIMITER) {
      const ip = request.headers.get("CF-Connecting-IP") ?? "unknown";
      const { success } = await env.LIMITER.limit({ key: ip });
      if (!success) return json({ error: "Rate limit reached." }, 429, cors);
    }

    const { pathname } = new URL(request.url);
    try {
      if (request.method === "GET" && pathname === "/health") return await health(env, cors);
      if (request.method === "POST" && pathname === "/predict") return await predict(request, env, cors);
      if (request.method === "POST" && pathname === "/chat") return await chat(request, env, cors);
      return json({ error: "Not found." }, 404, cors);
    } catch {
      return json({ error: "Upstream request failed." }, 502, cors);
    }
  },
};
