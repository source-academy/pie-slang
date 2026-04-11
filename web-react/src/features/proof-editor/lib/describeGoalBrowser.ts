// Browser-compatible goal type → plain English translator.
// Takes a specific goal type + context (not source code), produces a short
// literal translation for beginners who can't read Pie syntax.

import { GoogleGenAI } from "@google/genai";

// ---------------------------------------------------------------------------
// Prompt
// ---------------------------------------------------------------------------

function buildPrompt(
  goalType: string,
  context: Array<{ name: string; type: string }>,
): string {
  const contextString =
    context.length > 0
      ? context.map((c) => `  ${c.name} : ${c.type}`).join("\n")
      : "(none)";

  return `You translate Pie type expressions into plain English. Pie is a dependently-typed language from "The Little Typer".

Given a goal type and the variables in scope, produce a SHORT literal translation (1-2 sentences). Do NOT explain how to prove it. Do NOT be pedagogical. Just say what the type means.

Conventions:
- (Π ((n Nat)) ...) means "for all natural numbers n, ..."
- (Π ((x A)) B) means "for all x of type A, B" — always translate the Π wrapper
- (→ A B) means "if A then B" or "given A, produce B"
- (= Nat a b) means "a equals b (as natural numbers)"
- (Σ ((x A)) B) means "there exists an x of type A such that B"
- (Either A B) means "either A or B"
- (Pair A B) means "a pair of A and B"
- Nat means "natural number", U means "type/universe"
- (add1 n) means "n + 1", 0 means zero
- (List E) means "a list of E values"
- When context has free variables, mention what they are naturally.
- Translate user-defined names literally (Even, Odd, double, plus, etc.)
- IMPORTANT: Always translate EVERY Π wrapper. Never skip the outermost one.

### Example 1
Goal type: (Π ((n Nat)) (Either (Even n) (Odd n)))
Context:
(none)
Translation: For all natural numbers n, n is either even or odd.

### Example 2
Goal type: (Odd (add1 n-1))
Context:
  n-1 : Nat
  x : (Even n-1)
Translation: n-1 + 1 is odd, given that n-1 is even.

### Example 3
Goal type: (= Nat (add1 (plus n-1 0)) (add1 n-1))
Context:
  n-1 : Nat
  ih : (= Nat (plus n-1 0) n-1)
Translation: plus(n-1, 0) + 1 equals n-1 + 1.

### Example 4
Goal type: (Σ ((half Nat)) (= Nat n (double half)))
Context:
  n : Nat
Translation: There exists a natural number "half" such that n equals double(half) — i.e., n is even.

### Example 5
Goal type: (Either (Even 0) (Odd 0))
Context:
(none)
Translation: Zero is either even or odd.

### Example 6
Goal type: (Π ((E U)) (→ (List E) Nat))
Context:
(none)
Translation: For any type E, given a list of E values, produce a natural number.

### Example 7
Goal type: (Π ((x (Even n-1))) (Either (Even (add1 n-1)) (Odd (add1 n-1))))
Context:
  n-1 : Nat
Translation: For all proofs x that n-1 is even, n-1 + 1 is either even or odd. (In other words: if n-1 is even, then n-1 + 1 is either even or odd.)

## Your task
Goal type: ${goalType}
Context:
${contextString}
Translation:`;
}

// ---------------------------------------------------------------------------
// Exported function
// ---------------------------------------------------------------------------

/**
 * Translate a Pie goal type into a short plain-English sentence.
 *
 * @param goalType  - The goal's type string (sugared Pie syntax).
 * @param context   - Variables in scope for this goal.
 * @param apiKey    - Google Gemini API key.
 * @returns A short literal translation of the goal type.
 */
export async function describeGoalBrowser(
  goalType: string,
  context: Array<{ name: string; type: string }>,
  apiKey: string,
): Promise<string> {
  const genAI = new GoogleGenAI({ apiKey });

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const result = await (genAI as any).models.generateContent({
    model: "gemini-2.5-flash",
    contents: buildPrompt(goalType, context),
  });

  if (!result.text) {
    throw new Error("Gemini returned an empty response.");
  }

  return result.text.trim();
}
