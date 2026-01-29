import type { Node, Edge, NodeChange, EdgeChange, Connection } from '@xyflow/react';

// ============================================
// Context & Scope Types
// ============================================

export interface ContextEntry {
  id: string;
  name: string;           // Variable name (e.g., "n")
  type: string;           // Type expression (e.g., "Nat")
  origin: 'inherited' | 'introduced';
  introducedBy?: string;  // Tactic node ID that introduced this
}

// ============================================
// Tactic Types
// ============================================

export type TacticType =
  | 'intro'
  | 'exact'
  | 'split'
  | 'left'
  | 'right'
  | 'elimNat'
  | 'elimList'
  | 'elimVec'
  | 'elimEither'
  | 'elimEqual'
  | 'elimAbsurd'
  | 'apply';

export interface TacticParameters {
  variableName?: string;      // For intro
  targetContextId?: string;   // For elim tactics
  expression?: string;        // For exact
  lemmaId?: string;           // For apply
  [key: string]: unknown;     // Index signature for React Flow compatibility
}

// ============================================
// Node Data Types
// React Flow v12 requires data to be compatible with Record<string, unknown>
// ============================================

export interface GoalNodeData {
  kind: 'goal';
  goalType: string;           // The type to prove
  context: ContextEntry[];    // Scoped context for this goal
  status: 'pending' | 'in-progress' | 'completed';
  parentGoalId?: string;      // For scope inheritance
  completedBy?: string;       // Tactic that solved this goal
  [key: string]: unknown;     // Index signature for React Flow compatibility
}

/**
 * Tactic node status:
 * - 'incomplete': Tactic is on canvas but missing required parameters
 * - 'ready': All parameters provided, ready to apply (but not yet connected/applied)
 * - 'applied': Successfully applied to a goal, child goals created
 * - 'error': Tactic application failed (type error, invalid goal, etc.)
 */
export type TacticNodeStatus = 'incomplete' | 'ready' | 'applied' | 'error';

export interface TacticNodeData {
  kind: 'tactic';
  tacticType: TacticType;
  displayName: string;
  parameters: TacticParameters;
  status: TacticNodeStatus;
  connectedGoalId?: string;   // Which goal this tactic is connected to
  errorMessage?: string;      // Error message when status is 'error'
  [key: string]: unknown;     // Index signature for React Flow compatibility
}

export interface LemmaNodeData {
  kind: 'lemma';
  name: string;
  type: string;
  source: 'definition' | 'claim' | 'proven';
  [key: string]: unknown;     // Index signature for React Flow compatibility
}

// ============================================
// React Flow Node Union Types
// ============================================

export type GoalNode = Node<GoalNodeData, 'goal'>;
export type TacticNode = Node<TacticNodeData, 'tactic'>;
export type LemmaNode = Node<LemmaNodeData, 'lemma'>;

export type ProofNode = GoalNode | TacticNode | LemmaNode;

// ============================================
// Edge Types
// ============================================

export interface ProofEdgeData {
  kind: 'goal-to-tactic' | 'tactic-to-goal' | 'lemma-to-tactic' | 'context-to-tactic';
  outputIndex?: number;       // Which output port of tactic
  contextVarId?: string;      // Which context variable (for context-to-tactic edges)
  [key: string]: unknown;     // Index signature for React Flow compatibility
}

export type ProofEdge = Edge<ProofEdgeData>;

// ============================================
// Handle (Port) Types
// ============================================

export type HandleType = 'goal-input' | 'goal-output' | 'theorem-input' | 'theorem-output';

// ============================================
// History Types
// ============================================

export interface ProofSnapshot {
  nodes: ProofNode[];
  edges: ProofEdge[];
  timestamp: number;
}

// ============================================
// Proof Store Types
// ============================================

export interface ProofState {
  // React Flow state
  nodes: ProofNode[];
  edges: ProofEdge[];

  // Proof metadata
  rootGoalId: string | null;
  isProofComplete: boolean;

  // Session tracking (for worker sync)
  sessionId: string | null;
  lastSyncedState: { nodes: ProofNode[]; edges: ProofEdge[] } | null;

  // Global context (definitions/theorems from source code)
  globalContext: {
    definitions: Array<{ name: string; type: string; kind: 'definition' | 'claim' | 'theorem' }>;
    theorems: Array<{ name: string; type: string; kind: 'definition' | 'claim' | 'theorem' }>;
  };

  // History for undo/redo
  history: ProofSnapshot[];
  historyIndex: number;
}

export interface ProofActions {
  // Node operations
  addGoalNode: (goal: GoalNodeData, position: { x: number; y: number }) => string;
  addTacticNode: (tactic: TacticNodeData, position: { x: number; y: number }) => string;
  addLemmaNode: (lemma: LemmaNodeData, position: { x: number; y: number }) => string;
  updateNode: <T extends ProofNode>(id: string, data: Partial<T['data']>) => void;
  removeNode: (id: string) => void;

  // Edge operations
  connectNodes: (sourceId: string, targetId: string, data: ProofEdgeData) => void;
  removeEdge: (id: string) => void;

  // Sync from worker
  syncFromWorker: (proofTree: import('@/workers/proof-worker').ProofTreeData, sessionId: string) => void;

  // History
  saveSnapshot: () => void;
  undo: () => void;
  redo: () => void;

  // Proof state
  checkProofComplete: () => void;
  reset: () => void;
  setGlobalContext: (context: ProofState['globalContext']) => void;

  // React Flow handlers
  onNodesChange: (changes: NodeChange<ProofNode>[]) => void;
  onEdgesChange: (changes: EdgeChange<ProofEdge>[]) => void;
  onConnect: (connection: Connection) => void;
}

export type ProofStore = ProofState & ProofActions;

// ============================================
// UI Store Types
// ============================================

export interface UIState {
  selectedNodeId: string | null;
  draggingTactic: TacticType | null;
  hoveredNodeId: string | null;
  validDropTargets: string[];
}

export interface UIActions {
  selectNode: (id: string | null) => void;
  setDraggingTactic: (type: TacticType | null) => void;
  setHoveredNode: (id: string | null) => void;
  setValidDropTargets: (goalIds: string[]) => void;
  clearDragState: () => void;
}

export type UIStore = UIState & UIActions;
