/**
 * Serializable types for proof tree visualization.
 * These types can be safely passed between workers and the main thread.
 */

export interface ContextEntry {
  name: string;
  type: string;  // Pretty-printed type
}

export interface SerializableGoal {
  id: string;
  type: string;           // Pretty-printed goal type
  contextEntries: ContextEntry[];
  isComplete: boolean;
  isCurrent: boolean;
}

export interface SerializableGoalNode {
  goal: SerializableGoal;
  children: SerializableGoalNode[];
  appliedTactic?: string;  // Tactic that was applied to create children
  completedBy?: string;    // Tactic that directly solved this leaf goal
}

export interface ProofTreeData {
  root: SerializableGoalNode;
  isComplete: boolean;
  currentGoalId: string | null;
}

/**
 * Parsed S-expression node for type visualization.
 */
export interface TypeNode {
  kind: string;           // "Π", "Σ", "Either", "Nat", etc.
  value?: string;         // For atoms
  children: TypeNode[];
  isAtom: boolean;
  sourceText: string;     // Original text
  abbreviation: string;   // Collapsed display
}

/**
 * Categories for color-coding type constructors.
 */
export type TypeConstructorCategory =
  | 'pi'        // Π, →
  | 'sigma'     // Σ
  | 'either'    // Either, Left, Right
  | 'equality'  // =, same, cong, symm
  | 'list'      // List, ::, nil
  | 'vec'       // Vec, vec::, vecnil
  | 'nat'       // Nat, zero, add1
  | 'universe'  // U, Atom, Trivial
  | 'lambda'    // λ
  | 'variable'  // Variables
  | 'default';  // Fallback
