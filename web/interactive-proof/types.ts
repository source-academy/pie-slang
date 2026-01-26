/**
 * Type definitions for the Interactive Proof Mode.
 * Defines data structures for tactic blocks, validation, and controller state.
 */

import { SerializableGoal, SerializableGoalNode, ProofTreeData } from '../proof-tree/types';

// Re-export proof tree types for convenience
export { SerializableGoal, SerializableGoalNode, ProofTreeData };

/**
 * Types of tactics supported in interactive mode.
 */
export type TacticType =
  | 'intro'
  | 'exact'
  | 'exists'
  | 'left'
  | 'right'
  | 'split'
  | 'elimNat'
  | 'elimList'
  | 'elimVec'
  | 'elimEqual'
  | 'elimEither'
  | 'elimAbsurd';

/**
 * Data extracted from a tactic block.
 */
export interface TacticBlockData {
  type: TacticType;
  /** Variable name for intro, target for elim tactics */
  name?: string;
  /** Expression for exact/exists tactics (as string) */
  expression?: string;
}

/**
 * Result of client-side tactic validation.
 */
export interface TacticValidationResult {
  valid: boolean;
  reason?: string;
  /** Hints for what tactic might work */
  suggestions?: TacticType[];
}

/**
 * Metadata about a tactic for UI display.
 */
export interface TacticMetadata {
  type: TacticType;
  displayName: string;
  description: string;
  /** Goal type patterns this tactic applies to */
  applicablePatterns: string[];
  /** Whether this tactic requires additional input */
  requiresInput: 'none' | 'name' | 'expression';
  /** Color for visual display */
  color: string;
}

/**
 * Parsed type representation for validation.
 */
export interface ParsedType {
  kind: 'Pi' | 'Arrow' | 'Sigma' | 'Pair' | 'Either' | 'Nat' | 'List' | 'Vec' | 'Equal' | 'Atom' | 'Trivial' | 'Absurd' | 'U' | 'Application' | 'Variable' | 'Unknown';
  /** For binding forms (Pi, Sigma) */
  bindingName?: string;
  bindingType?: ParsedType;
  /** For function types */
  domain?: ParsedType;
  codomain?: ParsedType;
  /** For compound types */
  left?: ParsedType;
  right?: ParsedType;
  /** For parameterized types */
  elementType?: ParsedType;
  length?: ParsedType;
  /** For equality */
  baseType?: ParsedType;
  from?: ParsedType;
  to?: ParsedType;
  /** Original source text */
  sourceText: string;
}

/**
 * State of the interactive proof controller.
 */
export interface InteractiveProofState {
  /** Current proof tree data */
  proofTree: ProofTreeData | null;
  /** Currently selected goal ID */
  selectedGoalId: string | null;
  /** History of applied tactics for undo */
  history: TacticHistoryEntry[];
  /** Current history position (for redo) */
  historyPosition: number;
  /** Whether the proof is complete */
  isComplete: boolean;
  /** Claim name being proved */
  claimName: string | null;
}

/**
 * Entry in the tactic history for undo/redo.
 */
export interface TacticHistoryEntry {
  /** Goal the tactic was applied to */
  goalId: string;
  /** The tactic that was applied */
  tactic: TacticBlockData;
  /** Proof tree state before applying tactic */
  previousState: ProofTreeData;
}

/**
 * Message types for worker communication.
 */
export interface WorkerMessage {
  type: 'applyTactic' | 'validateTactic' | 'startInteractiveProof' | 'undoTactic';
  payload: ApplyTacticPayload | ValidateTacticPayload | StartProofPayload | UndoTacticPayload;
}

export interface ApplyTacticPayload {
  goalId: string;
  tactic: TacticBlockData;
  /** Full source context for evaluation */
  sourceContext: string;
}

export interface ValidateTacticPayload {
  goalId: string;
  tacticType: TacticType;
  goalType: string;
}

export interface StartProofPayload {
  claimName: string;
  /** Source code with the claim definition */
  sourceContext: string;
}

export interface UndoTacticPayload {
  /** Target history position */
  targetPosition: number;
}

/**
 * Response from worker for tactic operations.
 */
export interface WorkerTacticResponse {
  type: 'tacticResult' | 'validationResult' | 'proofStarted' | 'error';
  payload: TacticResultPayload | ValidationResultPayload | ProofStartedPayload | ErrorPayload;
}

export interface TacticResultPayload {
  success: boolean;
  proofTree?: ProofTreeData;
  message?: string;
  generatedCode?: string;
}

export interface ValidationResultPayload {
  valid: boolean;
  reason?: string;
}

export interface ProofStartedPayload {
  proofTree: ProofTreeData;
  claimType: string;
}

export interface ErrorPayload {
  message: string;
  details?: string;
}

/**
 * Drag state for tactic drag-and-drop.
 */
export interface DragState {
  isDragging: boolean;
  tacticData: TacticBlockData | null;
  sourceElement: HTMLElement | null;
  ghostElement: HTMLElement | null;
  validDropTargets: string[];
}

/**
 * Event emitted when a goal is targeted by drag.
 */
export interface GoalDragEvent {
  goalId: string;
  isValid: boolean;
  tacticData: TacticBlockData;
}

/**
 * Configuration for the interactive proof controller.
 */
export interface InteractiveProofConfig {
  /** Container for the proof tree visualization */
  treeContainer: HTMLElement;
  /** Container for the tactic palette */
  paletteContainer: HTMLElement;
  /** Container for goal details */
  detailsContainer: HTMLElement;
  /** Callback when proof state changes */
  onStateChange?: (state: InteractiveProofState) => void;
  /** Callback when proof is complete */
  onProofComplete?: (generatedCode: string) => void;
  /** Callback for error display */
  onError?: (message: string) => void;
  /** Callback to modify source code (insert tactic) */
  onModifySource?: (modifiedSource: string) => void;
}

/**
 * All available tactics with their metadata.
 */
export const TACTIC_METADATA: Record<TacticType, TacticMetadata> = {
  intro: {
    type: 'intro',
    displayName: 'intro',
    description: 'Introduce a variable from a Pi/Arrow type',
    applicablePatterns: ['Pi', 'Arrow', '->'],
    requiresInput: 'name',
    color: '#f59e0b'
  },
  exact: {
    type: 'exact',
    displayName: 'exact',
    description: 'Provide an exact proof term',
    applicablePatterns: ['*'],
    requiresInput: 'expression',
    color: '#f59e0b'
  },
  exists: {
    type: 'exists',
    displayName: 'exists',
    description: 'Provide a witness for a Sigma type',
    applicablePatterns: ['Sigma', 'Pair'],
    requiresInput: 'expression',
    color: '#f59e0b'
  },
  left: {
    type: 'left',
    displayName: 'left',
    description: 'Choose the left side of an Either type',
    applicablePatterns: ['Either'],
    requiresInput: 'none',
    color: '#f59e0b'
  },
  right: {
    type: 'right',
    displayName: 'right',
    description: 'Choose the right side of an Either type',
    applicablePatterns: ['Either'],
    requiresInput: 'none',
    color: '#f59e0b'
  },
  split: {
    type: 'split',
    displayName: 'split',
    description: 'Split a Pair/Sigma goal into two subgoals',
    applicablePatterns: ['Pair', 'Sigma'],
    requiresInput: 'none',
    color: '#f59e0b'
  },
  elimNat: {
    type: 'elimNat',
    displayName: 'elimNat',
    description: 'Induction on a natural number',
    applicablePatterns: ['*'],
    requiresInput: 'name',
    color: '#f59e0b'
  },
  elimList: {
    type: 'elimList',
    displayName: 'elimList',
    description: 'Induction on a list',
    applicablePatterns: ['*'],
    requiresInput: 'name',
    color: '#f59e0b'
  },
  elimVec: {
    type: 'elimVec',
    displayName: 'elimVec',
    description: 'Induction on a vector',
    applicablePatterns: ['*'],
    requiresInput: 'name',
    color: '#f59e0b'
  },
  elimEqual: {
    type: 'elimEqual',
    displayName: 'elimEqual',
    description: 'Eliminate an equality proof',
    applicablePatterns: ['*'],
    requiresInput: 'name',
    color: '#f59e0b'
  },
  elimEither: {
    type: 'elimEither',
    displayName: 'elimEither',
    description: 'Case analysis on an Either value',
    applicablePatterns: ['*'],
    requiresInput: 'name',
    color: '#f59e0b'
  },
  elimAbsurd: {
    type: 'elimAbsurd',
    displayName: 'elimAbsurd',
    description: 'Eliminate an Absurd value (ex falso)',
    applicablePatterns: ['*'],
    requiresInput: 'name',
    color: '#f59e0b'
  }
};
