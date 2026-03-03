// src/describe/promptLLM.ts
// NOTE: This module uses Node.js-specific features (dotenv, process.env).
// It won't work in a browser/worker context without adaptation.

// Check if we're in Node.js environment
const isNodeEnv =
  typeof process !== "undefined" &&
  typeof process.versions !== "undefined" &&
  typeof process.versions.node !== "undefined";

function getGenAIClient() {
  if (!isNodeEnv) {
    throw new Error("describeGoal is only available in a Node.js environment.");
  }
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  require("dotenv/config");
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const { GoogleGenAI } = require("@google/genai");
  const apiKey = process.env.GOOGLE_API_KEY;
  if (!apiKey) {
    throw new Error(
      "GOOGLE_API_KEY environment variable is not set. " +
        "Please create a .env file in the project root with: GOOGLE_API_KEY=your_key_here",
    );
  }
  return new GoogleGenAI({ apiKey });
}

// ---------------------------------------------------------------------------
// Few-shot examples
// Each example shows a snippet of Pie code, the name of the goal to describe,
// and the expected natural-language description.
// ---------------------------------------------------------------------------

interface FewShotExample {
  pieCode: string;
  goalName: string;
  description: string;
}

const FEW_SHOT_EXAMPLES: FewShotExample[] = [
  {
    pieCode: `
(claim identity
  (Π ((A U))
    (→ A A)))

(define identity
  (λ (A a) a))
`.trim(),
    goalName: "identity",
    description:
      "The goal `identity` asserts the existence of a polymorphic identity function. " +
      "For any type `A` in the universe `U`, it produces a function that accepts a value of type `A` and returns that same value unchanged. " +
      "This is the simplest possible dependent function: it says every type has an identity endomorphism.",
  },
  {
    pieCode: `
(claim double
  (→ Nat Nat))

(define double
  (λ (n)
    (iter-Nat n
      0
      (λ (prev) (add1 (add1 prev))))))

(claim Even
  (→ Nat U))

(define Even
  (λ (n)
    (Σ ((half Nat))
      (= Nat n (double half)))))

(claim zero-is-even
  (Even 0))

(define zero-is-even
  (cons 0 (same 0)))
`.trim(),
    goalName: "zero-is-even",
    description:
      "The goal `zero-is-even` states that 0 is an even natural number. " +
      "Evenness is defined here as the existence of a natural number `half` such that `n` equals `double(half)`. " +
      "The proof witnesses this by providing `half = 0` together with the reflexivity proof `(same 0)`, " +
      "since `double(0) = 0`.",
  },
  {
    pieCode: `
(claim double
  (→ Nat Nat))

(define double
  (λ (n)
    (iter-Nat n
      0
      (λ (prev) (add1 (add1 prev))))))

(claim Even
  (→ Nat U))

(define Even
  (λ (n)
    (Σ ((half Nat))
      (= Nat n (double half)))))

(claim Odd
  (→ Nat U))

(define Odd
  (λ (n)
    (Σ ((half Nat))
      (= Nat n (add1 (double half))))))

(claim add1-even->odd
  (Π ((n Nat))
    (→ (Even n)
       (Odd (add1 n)))))
`.trim(),
    goalName: "add1-even->odd",
    description:
      "The goal `add1-even->odd` is a dependent proposition stating that adding 1 to an even number always yields an odd number. " +
      "It is universally quantified over all natural numbers `n`: given any proof that `n` is even, it returns a proof that `n + 1` is odd. " +
      "This forms one half of the inductive step in a proof that every natural number is either even or odd.",
  },
  {
    pieCode: `
(claim list-length
  (Π ((E U))
    (→ (List E) Nat)))

(define list-length
  (λ (E es)
    (rec-List es
      0
      (λ (e rest ih) (add1 ih)))))
`.trim(),
    goalName: "list-length",
    description:
      "The goal `list-length` claims that for any element type `E`, there is a function that maps a `List E` to a `Nat` representing its length. " +
      "The definition recurses over the list: the empty list has length 0, and each `cons` cell adds 1 to the length of the tail. " +
      "The result type is a plain `Nat`, so no dependent information about the length is tracked in the type.",
  },
  {
    pieCode: `
(claim plus
  (→ Nat Nat Nat))

(define plus
  (λ (m n)
    (iter-Nat m
      n
      (λ (prev) (add1 prev)))))

(claim plus-zero
  (Π ((n Nat))
    (= Nat (plus n 0) n)))

(define plus-zero
  (λ (n)
    (ind-Nat n
      (λ (k) (= Nat (plus k 0) k))
      (same 0)
      (λ (n-1 ih)
        (cong ih (λ (k) (add1 k)))))))
`.trim(),
    goalName: "plus-zero",
    description:
      "The goal `plus-zero` proves by induction on `n` that adding zero on the right is the identity for natural number addition. " +
      "The base case is immediate by reflexivity since `plus(0, 0)` reduces to `0`. " +
      "For the inductive step, the induction hypothesis gives equality for `n-1`, and `cong` lifts it through `add1` to obtain the result for `n`. " +
      "This is a classic example of how propositional equality and structural induction interact in a dependently-typed setting.",
  },
];

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function escapeRegExp(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

// ---------------------------------------------------------------------------
// Main exported function
// ---------------------------------------------------------------------------

/**
 * Queries Google Gemini to produce a natural-language description of a named
 * goal found inside a snippet of Pie code.
 *
 * @param pieCode  - A string containing valid Pie source code that declares the goal.
 * @param goalName - The name of the `claim` / goal to describe.
 * @returns A promise that resolves to a natural-language description string.
 */
export async function describeGoal(
  pieCode: string,
  goalName: string,
): Promise<string> {
  // validation
  const claimPattern = new RegExp(
    `\\(\\s*claim\\s+${escapeRegExp(goalName)}\\s`,
  );
  if (!claimPattern.test(pieCode)) {
    throw new Error(
      `No claim named '${goalName}' found in the provided Pie code.`,
    );
  }

  const genAI = getGenAIClient();

  // few shot learning
  const fewShotSection = FEW_SHOT_EXAMPLES.map(
    (ex, i) =>
      `### Example ${i + 1}\n` +
      `**Pie code:**\n\`\`\`\n${ex.pieCode}\n\`\`\`\n` +
      `**Goal name:** \`${ex.goalName}\`\n` +
      `**Description:** ${ex.description}`,
  ).join("\n\n");

  const prompt =
    `You are an expert in dependently-typed programming languages, specifically Pie ` +
    `(the language from "The Little Typer" by Daniel P. Friedman and David Thrane Christiansen). ` +
    `Your task is to read a snippet of Pie code and write a clear, accurate natural-language description ` +
    `of what a specific named goal (claim) means and asserts.\n\n` +
    `A good description:\n` +
    `- Explains what the type of the goal asserts in plain English\n` +
    `- Mentions key type-theoretic concepts (dependent types, induction, equality, etc.) where relevant\n` +
    `- Is precise but accessible to someone learning type theory\n` +
    `- Does NOT include code examples or Pie syntax in the reply\n` +
    `- Is 2-5 sentences long\n\n` +
    `---\n\n` +
    `## Few-shot examples\n\n` +
    fewShotSection +
    `\n\n---\n\n` +
    `## Your task\n\n` +
    `**Pie code:**\n\`\`\`\n${pieCode}\n\`\`\`\n` +
    `**Goal name:** \`${goalName}\`\n` +
    `**Description:**`;

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const result = await (genAI as any).models.generateContent({
    model: "gemini-2.5-flash",
    contents: prompt,
  });

  if (!result.text) {
    throw new Error("Gemini returned an empty response.");
  }

  return result.text.trim();
}
