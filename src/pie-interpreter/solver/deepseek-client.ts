import { loggedAiFetch, type AiCallMeta } from "./ai-call-log";
/** Shared by browser goal translation and worker hint explanations. */
export const DEEPSEEK_MODEL = "deepseek-flash";
const ENDPOINT = "https://api.deepseek.com/chat/completions";

/**
 * How to reach the General LLM: the user's own DeepSeek key (a plain string,
 * or `apiKey`), or a proxy that holds the key server-side (`proxyUrl`). A
 * user's own key takes priority over the proxy.
 */
export type GeneralLlmAccess = string | { apiKey?: string | null; proxyUrl?: string | null };

function resolveAccess(access: GeneralLlmAccess | undefined): { key: string; proxyUrl: string } {
  const key = (typeof access === "string" ? access : access?.apiKey ?? "").trim();
  const proxyUrl = typeof access === "string" ? "" : (access?.proxyUrl ?? "").trim().replace(/\/+$/, "");
  return { key, proxyUrl };
}

export function hasGeneralLlm(access: GeneralLlmAccess | undefined): boolean {
  const { key, proxyUrl } = resolveAccess(access);
  return !!(key || proxyUrl);
}

export async function callDeepSeek(access: GeneralLlmAccess, prompt: string, operation: AiCallMeta['operation'] = 'hint'): Promise<string> {
  const { key, proxyUrl } = resolveAccess(access);
  if (!key && !proxyUrl) throw new Error("DeepSeek API key is not set.");

  // Preserve the previous transient-503 retry policy, without switching providers.
  for (let attempt = 0; attempt <= 2; attempt++) {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 60_000);
    let response: Response;
    let payload: unknown;
    try {
      // The proxy adds the key, model and limits itself; it returns the same
      // `choices` shape as DeepSeek.
      response = key
        ? await loggedAiFetch({ provider: 'deepseek', operation }, ENDPOINT, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${key}`,
          },
          body: JSON.stringify({
            model: DEEPSEEK_MODEL,
            messages: [{ role: "user", content: prompt }],
            stream: false,
            thinking: { type: "disabled" },
            max_tokens: 2048,
          }),
          signal: controller.signal,
        })
        : await loggedAiFetch({ provider: 'deepseek', operation }, `${proxyUrl}/chat`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ prompt, operation }),
          signal: controller.signal,
        });
      // Never expose raw error bodies: upstream errors may echo request data.
      if (response.ok) payload = await response.json();
    } catch {
      throw new Error(controller.signal.aborted
        ? "DeepSeek request timed out. Please try again."
        : "DeepSeek request failed. Check your connection and try again.");
    } finally {
      clearTimeout(timeout);
    }

    if (response.status === 503 && attempt < 2) {
      await new Promise(resolve => setTimeout(resolve, 2000 * Math.pow(2, attempt)));
      continue;
    }
    if (!response.ok) {
      const advice = response.status === 401 ? " Check your DeepSeek API key."
        : response.status === 402 ? " Check your DeepSeek account balance."
        : response.status === 429 ? " Rate limit reached; try again later." : "";
      throw new Error(`DeepSeek API returned HTTP ${response.status}.${advice}`);
    }

    const result = payload as {
      choices?: Array<{ finish_reason?: string; message?: { content?: unknown } }>;
    } | null;
    const choice = result?.choices?.[0];
    if (choice?.finish_reason && choice.finish_reason !== "stop") {
      throw new Error("DeepSeek did not return a complete answer. Please try again.");
    }
    const content = choice?.message?.content;
    if (typeof content !== "string" || !content.trim()) {
      throw new Error("DeepSeek returned an empty response.");
    }
    return content.trim();
  }
  throw new Error("DeepSeek is temporarily unavailable.");
}
