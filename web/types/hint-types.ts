// Shared TypeScript interfaces for the hint system

import { SerializableContext } from "../../src/pie-interpreter/utils/context";

/**
 * Request for generating a hint from the AI
 */
export interface HintRequest {
  type: 'todo' | 'tactic';
  expectedType?: string;
  goalInfo?: string;
  context: SerializableContext | string[];
  availableDefinitions: string[];
  hypotheses?: string[];
}

/**
 * Response from hint generation
 */
export interface HintResponse {
  hint: string;
  error?: string;
}

/**
 * Information about a TODO position in the code
 */
export interface TodoPosition {
  startLine: number;
  startColumn: number;
  endLine: number;
  endColumn: number;
  expectedType: string;
  availableDefinitions: string[];
}

/**
 * Information about a tactic hint opportunity
 */
export interface TacticHintPosition {
  startLine: number;
  startColumn: number;
  endLine: number;
  endColumn: number;
  goalType: string;
  hypotheses: string[];
  availableDefinitions: string[];
  isComplete: boolean;
}

/**
 * Worker message for TODO positions
 */
export interface TodoPositionsMessage {
  type: 'todo-positions-result';
  todos: TodoPosition[];
}

/**
 * Worker message for tactic hint positions
 */
export interface TacticPositionsMessage {
  type: 'tactic-positions-result';
  tactics: TacticHintPosition[];
}

/**
 * Worker message for hint request
 */
export interface HintRequestMessage {
  type: 'request-hint';
  position: { line: number; column: number };
  hintType: 'todo' | 'tactic';
}
