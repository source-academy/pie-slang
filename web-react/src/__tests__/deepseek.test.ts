import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { callDeepSeek, DEEPSEEK_MODEL } from "@pie/solver/deepseek-client";
import { describeGoalBrowser } from "../features/proof-editor/lib/describeGoalBrowser";
import { explainTactic, generateProgressiveHint } from "@pie/solver/hint-generator";

const fakeKey = "test-deepseek-key";
beforeEach(() => {
  const data = new Map<string, string>();
  vi.stubGlobal("localStorage", {
    getItem: (key: string) => data.get(key) ?? null,
    setItem: (key: string, value: string) => data.set(key, value),
    removeItem: (key: string) => data.delete(key),
  });
});
const response = (content: string) => new Response(JSON.stringify({
  choices: [{ finish_reason: "stop", message: { content } }],
}), { status: 200 });

afterEach(() => {
  vi.unstubAllGlobals();
  vi.unstubAllEnvs();
  vi.restoreAllMocks();
  vi.useRealTimers();
});

describe("DeepSeek transport", () => {
  it("uses the official endpoint, Bearer auth and non-streaming content", async () => {
    const fetchMock = vi.fn().mockResolvedValue(response("  An explanation.  "));
    vi.stubGlobal("fetch", fetchMock);
    expect(await callDeepSeek(fakeKey, "Translate this goal")).toBe("An explanation.");
    const [url, options] = fetchMock.mock.calls[0];
    expect(url).toBe("https://api.deepseek.com/chat/completions");
    expect(options.headers.Authorization).toBe(`Bearer ${fakeKey}`);
    expect(JSON.parse(options.body)).toEqual({
      model: DEEPSEEK_MODEL,
      messages: [{ role: "user", content: "Translate this goal" }],
      stream: false, thinking: { type: "disabled" }, max_tokens: 2048,
    });
  });

  it("does not send a request without a key", async () => {
    const fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);
    await expect(callDeepSeek(" ", "goal")).rejects.toThrow("API key is not set");
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it.each([401, 402, 429, 500])("reports HTTP %s without echoing sensitive error bodies", async status => {
    const fetchMock = vi.fn().mockResolvedValue(new Response(fakeKey, { status }));
    vi.stubGlobal("fetch", fetchMock);
    const error = await callDeepSeek(fakeKey, "goal").catch(e => e as Error);
    expect(error).toBeInstanceOf(Error);
    expect((error as Error).message).toContain(`HTTP ${status}`);
    expect((error as Error).message).not.toContain(fakeKey);
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it("retries transient 503 responses", async () => {
    vi.useFakeTimers();
    const fetchMock = vi.fn().mockResolvedValueOnce(new Response("", { status: 503 }))
      .mockResolvedValueOnce(response("Ready"));
    vi.stubGlobal("fetch", fetchMock);
    const result = callDeepSeek(fakeKey, "goal");
    await vi.advanceTimersByTimeAsync(2000);
    expect(await result).toBe("Ready");
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });

  it("rejects empty answers", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(response(" ")));
    await expect(callDeepSeek(fakeKey, "goal")).rejects.toThrow("empty response");
  });

  it("rejects truncated answers", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(new Response(JSON.stringify({
      choices: [{ finish_reason: "length", message: { content: "partial" } }],
    }))));
    await expect(callDeepSeek(fakeKey, "goal")).rejects.toThrow("complete answer");
  });

  it("bounds a stalled request and sanitizes network errors", async () => {
    vi.useFakeTimers();
    vi.stubGlobal("fetch", vi.fn().mockImplementation((_url, options) => new Promise((_resolve, reject) => {
      options.signal.addEventListener("abort", () => reject(new Error(fakeKey)));
    })));
    const result = callDeepSeek(fakeKey, "goal").catch(e => e as Error);
    await vi.advanceTimersByTimeAsync(60_000);
    expect(((await result) as Error).message).toBe("DeepSeek request timed out. Please try again.");
  });
});

describe("Translation and More use DeepSeek", () => {
  it("translates a goal with the same transport", async () => {
    const fetchMock = vi.fn().mockResolvedValue(response("Every natural number is even or odd."));
    vi.stubGlobal("fetch", fetchMock);
    expect(await describeGoalBrowser("(Π (n Nat) (Either (Even n) (Odd n)))", [], fakeKey))
      .toBe("Every natural number is even or odd.");
    expect(JSON.parse(fetchMock.mock.calls[0][1].body).messages[0].content).toContain("(Even n)");
  });

  it.each(["category", "tactic", "full"] as const)("explains the LoRA tactic at %s level", async level => {
    vi.spyOn(console, "log").mockImplementation(() => {});
    const fetchMock = vi.fn().mockResolvedValue(response(JSON.stringify({
      explanation: "Assume an arbitrary natural number to prove the universal claim.", confidence: 0.95,
    })));
    vi.stubGlobal("fetch", fetchMock);
    const hint = await explainTactic(fakeKey, {
      predictedTactic: "intro n", tacticCategory: "introduction",
      goalType: "(Π (n Nat) (Either (Even n) (Odd n)))", context: [], level,
    });
    expect(hint.explanation).toContain("universal claim");
    expect(hint.explanationSource).toBe("deepseek");
    expect(hint.level).toBe(level);
    if (level !== "category") expect(hint.tacticType).toBe("intro");
    if (level === "full") expect(hint.parameters).toEqual({ variableName: "n" });
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it("supports the no-LoRA progressive hint path", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(response(JSON.stringify({
      category: "introduction", explanation: "Introduce the natural number.", confidence: 0.9,
    }))));
    const hint = await generateProgressiveHint(fakeKey, {
      goalType: "(Π (n Nat) Nat)", context: [], availableTactics: ["intro"], currentLevel: "category",
    });
    expect(hint.explanation).toBe("Introduce the natural number.");
  });

  it("retains the existing template fallback on API failure", async () => {
    vi.spyOn(console, "log").mockImplementation(() => {});
    vi.spyOn(console, "warn").mockImplementation(() => {});
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(new Response("", { status: 401 })));
    const hint = await explainTactic(fakeKey, {
      predictedTactic: "intro n", tacticCategory: "introduction", goalType: "(Π (n Nat) Nat)",
      context: [], level: "tactic",
    });
    expect(hint.explanation).toBe("Use the intro tactic for this goal.");
    expect(hint.explanationSource).toBe("template");
  });

  it("marks a no-key LoRA explanation as a template without calling the API", async () => {
    const fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);
    const hint = await explainTactic("", {
      predictedTactic: "intro n", tacticCategory: "introduction", goalType: "(Pi ((n Nat)) Nat)",
      context: [], level: "full",
    });
    expect(hint.explanationSource).toBe("template");
    expect(hint.parameters).toEqual({ variableName: "n" });
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it.each(['not JSON', '{}', '{"explanation":""}'])(
    "does not credit General LLM when its response supplies no usable explanation: %s", async content => {
      vi.stubGlobal("fetch", vi.fn().mockResolvedValue(response(content)));
      const hint = await explainTactic(fakeKey, {
        predictedTactic: "intro n", tacticCategory: "introduction", goalType: "(Pi ((n Nat)) Nat)",
        context: [], level: "full",
      });
      expect(hint.explanationSource).toBe("template");
      expect(hint.tacticType).toBe("intro");
      expect(hint.parameters).toEqual({ variableName: "n" });
    },
  );

  it("keeps the Tactic LLM suggestion authoritative when General LLM explains it", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(response(JSON.stringify({
      tacticType: "exact", parameters: { expression: "zero" }, explanation: "Introduce n.",
    }))));
    const hint = await explainTactic(fakeKey, {
      predictedTactic: "intro n", tacticCategory: "introduction", goalType: "(Pi ((n Nat)) Nat)",
      context: [], level: "full",
    });
    expect(hint.explanationSource).toBe("deepseek");
    expect(hint.tacticType).toBe("intro");
    expect(hint.parameters).toEqual({ variableName: "n" });
  });
});

describe("Provider key isolation", () => {
  it("never reuses or deletes the existing Google key", async () => {
    vi.resetModules();
    vi.stubEnv("VITE_DEEPSEEK_API_KEY", "");
    vi.stubEnv("VITE_GOOGLE_API_KEY", "old-google-env-test-key");
    localStorage.setItem("pie-slang:gemini-api-key", "old-google-test-key");
    localStorage.setItem("pie-slang:lora-api-key", "runpod-test-key");
    const { useHintStore } = await import("../features/proof-editor/store/hint-store");
    expect(useHintStore.getState().apiKey).toBeNull();
    expect(useHintStore.getState().loraApiKey).toBe("runpod-test-key");
    useHintStore.getState().setApiKey(fakeKey);
    expect(localStorage.getItem("pie-slang:deepseek-api-key")).toBe(fakeKey);
    useHintStore.getState().setApiKey(null);
    expect(localStorage.getItem("pie-slang:deepseek-api-key")).toBeNull();
    expect(localStorage.getItem("pie-slang:gemini-api-key")).toBe("old-google-test-key");
  });
});
