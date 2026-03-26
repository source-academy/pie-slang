/**
 * Tactic Agent — autonomous proof solver using a fine-tuned LLM.
 *
 * The agent loop:
 * 1. Start with global context + goal type
 * 2. Format prompt with context + goal (matching training data format)
 * 3. Call LLM to predict the next tactic
 * 4. Parse the tactic string and apply it via ProofManager
 * 5. If success → check if proof complete; if not, get next goal → go to 2
 * 6. If type error → include error in prompt → retry from 3
 * 7. Repeat until proof complete or max retries exhausted
 */

import { ProofManager } from '../tactics/proof-manager';
import { Goal } from '../tactics/proofstate';
import { Tactic } from '../tactics/tactics';
import { Context } from '../utils/context';
import { Location, Syntax } from '../utils/locations';
import { Position } from '../../scheme-parser/transpiler/types/location';
import { go, stop } from '../types/utils';
import { serializeContext, serializeGoal } from '../tactics/training-data-extractor';
import { Parser, schemeParse } from '../parser/parser';

// ---------------------------------------------------------------------------
// Tactic string parser — converts LLM output (toString format) to S-expression
// format that Parser.parseToTactics can handle.
// ---------------------------------------------------------------------------

/**
 * Parse a tactic string (as produced by Tactic.toString() / training data)
 * into a Tactic object. The toString() format matches the parser format
 * directly, so we just wrap in parens and parse.
 *
 * Examples:
 *   "intro n"           → (intro n)
 *   "exact (same 0)"    → (exact (same 0))
 *   "elim-Nat n"        → (elim-Nat n)
 *   "symm"              → (symm)
 *   "cong ih (+ 1)"     → (cong ih (+ 1))
 *   "exists 5 k"        → (exists 5 k)
 */
export function parseTacticString(tacticStr: string): Tactic {
  const trimmed = tacticStr.trim();

  // Extract keyword to decide wrapping
  const firstSpace = trimmed.indexOf(' ');
  const rest = firstSpace === -1 ? '' : trimmed.substring(firstSpace);

  // Wrap as S-expression: (keyword args...)
  const sexpr = rest ? `(${trimmed})` : `(${trimmed})`;

  // Parse through the scheme parser + tactic parser
  const elements = schemeParse(sexpr);

  return Parser.parseToTactics(elements[0]);
}

// ---------------------------------------------------------------------------
// LLM Predictor interface — abstraction over different model backends
// ---------------------------------------------------------------------------

export interface TacticPredictor {
  /**
   * Given the current proof state (context + goal), predict the next tactic.
   * Returns the raw tactic string (e.g., "intro n", "exact (same 0)").
   */
  predict(prompt: string): Promise<string>;
}

/**
 * HTTP-based predictor for a locally-served fine-tuned model.
 * Expects a POST endpoint that accepts { prompt: string } and returns { tactic: string }.
 */
export class LocalModelPredictor implements TacticPredictor {
  constructor(
    private endpoint: string = 'http://localhost:8000/predict',
  ) {}

  async predict(prompt: string): Promise<string> {
    const response = await fetch(this.endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ prompt }),
    });
    if (!response.ok) {
      throw new Error(`Model server error: ${response.status} ${response.statusText}`);
    }
    const data = await response.json() as { tactic: string };
    return data.tactic.trim();
  }
}

/**
 * Google Gemini-based predictor (for comparison / fallback).
 */
export class GeminiPredictor implements TacticPredictor {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private genAI: any;

  constructor(apiKey: string) {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const { GoogleGenAI } = require('@google/genai');
    this.genAI = new GoogleGenAI({ apiKey });
  }

  async predict(prompt: string): Promise<string> {
    const result = await this.genAI.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
    });
    return (result.text || '').trim()
      .replace(/^```[\w]*\n?/, '')
      .replace(/\n?```$/, '')
      .trim();
  }
}

// ---------------------------------------------------------------------------
// Prompt formatting — matches the training data format
// ---------------------------------------------------------------------------

function formatPrompt(
  goal: Goal,
  originalContext: Context,
  errorHistory: string[] = [],
): string {
  const { globalContext, localContext } = serializeContext(goal.context, originalContext);
  const goalStr = serializeGoal(goal);

  let prompt = `Predict the next tactic for the following proof state.

Global context:
${globalContext.map(e => `  ${e.name} : ${e.type}`).join('\n') || '  (empty)'}

Local context:
${localContext.map(e => `  ${e.name} : ${e.type}`).join('\n') || '  (empty)'}

Goal: ${goalStr}

Respond with ONLY the tactic (e.g., "intro n", "exact (same 0)", "ind-nat n", "symm").`;

  if (errorHistory.length > 0) {
    prompt += `\n\nPrevious attempts that failed:\n${errorHistory.map((e, i) => `  ${i + 1}. ${e}`).join('\n')}\nPlease try a different tactic.`;
  }

  return prompt;
}

// ---------------------------------------------------------------------------
// Agent loop
// ---------------------------------------------------------------------------

export interface AgentResult {
  success: boolean;
  /** List of tactics applied (in order) */
  tactics: string[];
  /** Number of LLM calls made */
  llmCalls: number;
  /** Total retries due to errors */
  retries: number;
  /** Error message if failed */
  error?: string;
  /** Step-by-step log */
  log: string[];
}

export interface AgentOptions {
  /** Max retries per goal before giving up (default: 5) */
  maxRetriesPerGoal?: number;
  /** Max total LLM calls across the whole proof (default: 50) */
  maxTotalCalls?: number;
  /** Log each step to console (default: true) */
  verbose?: boolean;
}

/**
 * Run the tactic agent to automatically prove a claim.
 *
 * @param context - The global context (definitions, claims, etc.)
 * @param claimName - The name of the claim to prove
 * @param predictor - The LLM backend to use for tactic prediction
 * @param options - Agent configuration
 */
export async function runTacticAgent(
  context: Context,
  claimName: string,
  predictor: TacticPredictor,
  options: AgentOptions = {},
): Promise<AgentResult> {
  const {
    maxRetriesPerGoal = 5,
    maxTotalCalls = 50,
    verbose = true,
  } = options;

  const result: AgentResult = {
    success: false,
    tactics: [],
    llmCalls: 0,
    retries: 0,
    log: [],
  };

  function log(msg: string) {
    result.log.push(msg);
    if (verbose) console.log(`[TacticAgent] ${msg}`);
  }

  // Initialize proof
  const pm = new ProofManager();
  const startResult = pm.startProof(claimName, context, dummyLocation());
  if (startResult instanceof stop) {
    result.error = startResult.message.toString();
    log(`Failed to start proof: ${result.error}`);
    return result;
  }
  log(`Started proof of ${claimName}`);

  // Store original context for distinguishing global/local
  const originalContext = new Map(context);

  // Main loop
  while (!pm.currentState!.isComplete()) {
    if (result.llmCalls >= maxTotalCalls) {
      result.error = `Max total LLM calls (${maxTotalCalls}) exceeded`;
      log(result.error);
      return result;
    }

    const currentGoal = (pm.currentState!.getCurrentGoal() as go<Goal>).result;
    log(`\nGoal: ${serializeGoal(currentGoal)}`);

    let errorHistory: string[] = [];
    let goalSolved = false;

    for (let retry = 0; retry <= maxRetriesPerGoal; retry++) {
      if (result.llmCalls >= maxTotalCalls) {
        result.error = `Max total LLM calls (${maxTotalCalls}) exceeded`;
        log(result.error);
        return result;
      }

      // Format prompt and call LLM
      const prompt = formatPrompt(currentGoal, originalContext, errorHistory);
      result.llmCalls++;

      let tacticStr: string;
      try {
        tacticStr = await predictor.predict(prompt);
      } catch (e: unknown) {
        const msg = e instanceof Error ? e.message : String(e);
        log(`LLM call failed: ${msg}`);
        errorHistory.push(`LLM error: ${msg}`);
        result.retries++;
        continue;
      }
      log(`LLM predicted: ${tacticStr}`);

      // Parse the tactic string
      let tactic: Tactic;
      try {
        tactic = parseTacticString(tacticStr);
      } catch (e: unknown) {
        const msg = e instanceof Error ? e.message : String(e);
        log(`Parse error: ${msg}`);
        errorHistory.push(`"${tacticStr}" → parse error: ${msg}`);
        result.retries++;
        continue;
      }

      // Apply the tactic
      const applyResult = pm.applyTactic(tactic);
      if (applyResult instanceof stop) {
        const errMsg = applyResult.message.toString();
        log(`Tactic failed: ${errMsg}`);
        errorHistory.push(`"${tacticStr}" → ${errMsg}`);
        result.retries++;
        continue;
      }

      // Success — tactic applied
      result.tactics.push(tacticStr);
      log(`Applied: ${tacticStr}`);
      goalSolved = true;
      break;
    }

    if (!goalSolved) {
      result.error = `Failed to solve goal after ${maxRetriesPerGoal} retries: ${serializeGoal(currentGoal)}`;
      log(result.error);
      return result;
    }
  }

  result.success = true;
  log(`\nProof complete! Applied ${result.tactics.length} tactics in ${result.llmCalls} LLM calls.`);
  return result;
}

function dummyLocation(): Location {
  const pos = new Position(1, 0);
  const syntax = new Syntax(pos, pos, '');
  return new Location(syntax, false);
}
