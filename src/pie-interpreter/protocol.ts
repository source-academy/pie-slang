/**
 * Proof Session Protocol
 *
 * Shared types for communication between the Pie interpreter and any
 * frontend (web UI, CLI, AI agent, LSP). This is the SINGLE SOURCE OF
 * TRUTH for the API contract.
 *
 * Rules:
 * - All types here use plain serializable data (strings, numbers, booleans, arrays, objects).
 * - No Value, Core, Source, or Context types — those are internal to the interpreter.
 * - All type representations are pre-rendered strings (via readBack → prettyPrint/sugarType).
 * - Frontend code imports from here. Interpreter code exports conforming to here.
 */

// ============================================================================
// Proof State (what the prover sees)
// ============================================================================

/** A single context entry — a variable or definition in scope. */
export interface ContextEntry {
  name: string;
  /** Pretty-printed type string, e.g. "(→ Nat Nat)" */
  type: string;
  /** Which tactic introduced this variable, if any. Absent for globals. */
  introducedBy?: string;
}

/** A proof goal — an obligation the prover must discharge. */
export interface Goal {
  /** Unique identifier for this goal within the proof tree. */
  id: string;
  /** The type to be proved, pretty-printed. May be sugared with type aliases. */
  type: string;
  /** The fully expanded type (no sugar). Only set if different from `type`. */
  expandedType?: string;
  /** Variables and definitions in scope for this goal. */
  context: ContextEntry[];
  /** Whether this goal has been solved. */
  isComplete: boolean;
  /** Whether this is the goal currently being worked on. */
  isCurrent: boolean;
}

/** Structured representation of an applied tactic. */
export interface AppliedTactic {
  tacticType: TacticType;
  params: TacticParams;
  displayString: string;
}

/** A node in the proof tree. Goals form a tree via tactic application. */
export interface GoalNode {
  goal: Goal;
  /** Child goals produced by the tactic applied to this goal. */
  children: GoalNode[];
  /** The tactic that was applied to this goal. */
  appliedTactic?: AppliedTactic;
  /** For leaf goals solved directly, the tactic that closed it. */
  completedBy?: AppliedTactic;
  /** Whether this goal and all descendants are complete. */
  isSubtreeComplete?: boolean;
}

/** The complete proof tree state. */
export interface ProofTree {
  root: GoalNode;
  /** Whether the entire proof is complete. */
  isComplete: boolean;
  /** ID of the goal currently being worked on, or null if proof is complete. */
  currentGoalId: string | null;
}

// ============================================================================
// Tactic application
// ============================================================================

/**
 * Tactic types supported by the proof assistant.
 *
 * To add a new tactic:
 * 1. Add it here.
 * 2. Implement it in tactics/tactics.ts.
 * 3. Register it in parser/parser.ts.
 * 4. Handle it in the proof worker's applyTactic switch.
 */
export type TacticType =
  | "intro"
  | "exact"
  | "exists"
  | "split"
  | "left"
  | "right"
  | "elimNat"
  | "elimList"
  | "elimVec"
  | "elimEither"
  | "elimEqual"
  | "elimAbsurd"
  | "apply"
  | "todo";

/** Parameters for tactic application. Which fields are required depends on the tactic. */
export interface TacticParams {
  /** Variable name for intro, elimination, exists tactics. */
  variableName?: string;
  /** Pie expression string for exact, exists, apply tactics. */
  expression?: string;
}

/**
 * Which parameters each tactic requires.
 * Use this to validate before sending a request.
 */
export const TACTIC_REQUIREMENTS: Record<TacticType, { variableName?: boolean; expression?: boolean }> = {
  intro:       { variableName: false }, // optional: auto-generated if omitted
  exact:       { expression: true },
  exists:      { expression: true, variableName: false },
  split:       {},
  left:        {},
  right:       {},
  elimNat:     { variableName: true },
  elimList:    { variableName: true },
  elimVec:     { variableName: true },
  elimEither:  { variableName: true },
  elimEqual:   { variableName: true },
  elimAbsurd:  { variableName: true },
  apply:       { expression: true },
  todo:        {},
};

// ============================================================================
// Session lifecycle
// ============================================================================

/** A named definition or theorem available in the proof context. */
export interface GlobalEntry {
  name: string;
  type: string;
  kind: "definition" | "claim" | "theorem";
}

/** Request to start a proof session. */
export interface StartSessionRequest {
  /** Pie source code containing claims and definitions. */
  sourceCode: string;
  /** Name of the claim to prove. */
  claimName: string;
}

/** Response from starting a proof session. */
export interface StartSessionResponse {
  sessionId: string;
  proofTree: ProofTree;
  /** Global context: definitions and theorems available in scope. */
  globalContext: {
    definitions: GlobalEntry[];
    theorems: GlobalEntry[];
  };
  /** The type of the claim being proved. */
  claimType: string;
}

/** Request to apply a tactic. */
export interface ApplyTacticRequest {
  sessionId: string;
  /** The goal to apply the tactic to. */
  goalId: string;
  tactic: TacticType;
  params?: TacticParams;
}

/** Response from applying a tactic. */
export interface ApplyTacticResponse {
  success: boolean;
  /** Updated proof tree after tactic application. */
  proofTree: ProofTree;
  /** Error message if success is false. */
  error?: string;
}

// ============================================================================
// Hint system
// ============================================================================

/** Progressive hint levels: increasingly specific. */
export type HintLevel = "category" | "tactic" | "full";

/** Tactic categories for category-level hints. */
export type TacticCategory = "introduction" | "elimination" | "constructor" | "application";

export interface HintRequest {
  sessionId: string;
  goalId: string;
  /** What level of hint to provide. */
  currentLevel: HintLevel;
  previousHint?: HintResponse;
  /** API key for AI-powered hints (optional). */
  apiKey?: string;
  /** URL of the local LoRA tactic prediction server (optional). */
  loraServerUrl?: string;
}

export interface HintResponse {
  level: HintLevel;
  category?: TacticCategory;
  tacticType?: string;
  parameters?: Record<string, string>;
  explanation: string;
  confidence: number;
  /** Where the tactic prediction came from. */
  source?: "lora" | "gemini" | "rule-based";
}

// ============================================================================
// File scanning
// ============================================================================

export interface ScanFileRequest {
  sourceCode: string;
}

export interface ScanFileResponse {
  definitions: GlobalEntry[];
  theorems: GlobalEntry[];
  claims: GlobalEntry[];
}

// ============================================================================
// Interactive evaluation (for AI agents / batch proving)
// ============================================================================

/**
 * State passed to an interactive tactic provider (LLM, script, etc.).
 * This is the text-based protocol used by evaluatePieInteractive().
 * Unlike the session-based protocol above, this is a callback interface
 * where the interpreter drives the loop.
 */
export interface InteractiveProofState {
  theoremName: string;
  theoremType: string;
  step: number;
  globalContext: ContextEntry[];
  localContext: ContextEntry[];
  goal: string;
  complete: boolean;
  pendingBranches: number;
  /** Error from previous tactic attempt, if any. */
  error?: string;
}
