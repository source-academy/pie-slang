import type {
  Node,
  Edge,
  NodeChange,
  EdgeChange,
  Connection,
} from "@xyflow/react";
import type {
  TacticType,
  TacticParams,
  ContextEntry as ProtoContextEntry,
  ProofTree,
  GlobalEntry,
} from "@pie/protocol";

// Re-export protocol types used widely across the frontend
export type { TacticType };

// ============================================
// Context & Scope Types
// UI extends protocol ContextEntry with display-layer fields
// ============================================

export interface ContextEntry extends ProtoContextEntry {
  id: string;
  origin: "inherited" | "introduced";
}

// ============================================
// Tactic Types
// UI extends protocol TacticParams with frontend-specific fields
// ============================================

export interface TacticParameters extends TacticParams {
  targetContextId?: string; // For elim tactics (UI: which context block was connected)
  lemmaId?: string; // For apply (UI: which lemma node was connected)
  [key: string]: unknown; // Index signature for React Flow compatibility
}

// ============================================
// Node Data Types
// React Flow v12 requires data to be compatible with Record<string, unknown>
// ============================================

export interface GoalNodeData {
  kind: "goal";
  goalType: string; // The type to prove
  context: ContextEntry[]; // Scoped context for this goal
  status: "pending" | "in-progress" | "completed" | "todo";
  parentGoalId?: string; // For scope inheritance
  completedBy?: string; // Tactic that solved this goal
  isSubtreeComplete?: boolean; // For collapse eligibility
  [key: string]: unknown; // Index signature for React Flow compatibility
}

/**
 * Tactic node status:
 * - 'incomplete': Tactic is on canvas but missing required parameters
 * - 'ready': All parameters provided, ready to apply (but not yet connected/applied)
 * - 'applied': Successfully applied to a goal, child goals created
 * - 'error': Tactic application failed (type error, invalid goal, etc.)
 */
export type TacticNodeStatus = "incomplete" | "ready" | "applied" | "error";

export interface TacticNodeData {
  kind: "tactic";
  tacticType: TacticType;
  displayName: string;
  parameters: TacticParameters;
  status: TacticNodeStatus;
  connectedGoalId?: string; // Which goal this tactic is connected to
  errorMessage?: string; // Error message when status is 'error'
  [key: string]: unknown; // Index signature for React Flow compatibility
}

export interface LemmaNodeData {
  kind: "lemma";
  name: string;
  type: string;
  source: "definition" | "claim" | "proven";
  [key: string]: unknown; // Index signature for React Flow compatibility
}

// ============================================
// React Flow Node Union Types
// ============================================

export type GoalNode = Node<GoalNodeData, "goal">;
export type TacticNode = Node<TacticNodeData, "tactic">;
export type LemmaNode = Node<LemmaNodeData, "lemma">;

export type ProofNode = GoalNode | TacticNode | LemmaNode;

// ============================================
// Edge Types
// ============================================

export interface ProofEdgeData {
  kind:
    | "goal-to-tactic"
    | "tactic-to-goal"
    | "lemma-to-tactic"
    | "context-to-tactic";
  outputIndex?: number; // Which output port of tactic
  contextVarId?: string; // Which context variable (for context-to-tactic edges)
  [key: string]: unknown; // Index signature for React Flow compatibility
}

export type ProofEdge = Edge<ProofEdgeData>;

// ============================================
// Handle (Port) Types
// ============================================

export type HandleType =
  | "goal-input"
  | "goal-output"
  | "theorem-input"
  | "theorem-output";

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

  // Proof tree data for script generation
  proofTreeData: ProofTree | null;
  claimName: string | null;

  // History for undo/redo
  history: ProofSnapshot[];
  historyIndex: number;

  // Position preservation
  manualPositions: Map<string, { x: number; y: number }>;

  // Branch collapse state
  collapsedBranches: Set<string>;  // Set of goal IDs whose subtrees are collapsed
  autoCollapseEnabled: boolean;    // Whether to auto-collapse completed subtrees
}

export interface ProofActions {
  // Node operations
  addGoalNode: (
    goal: GoalNodeData,
    position: { x: number; y: number },
  ) => string;
  addTacticNode: (
    tactic: TacticNodeData,
    position: { x: number; y: number },
  ) => string;
  addLemmaNode: (
    lemma: LemmaNodeData,
    position: { x: number; y: number },
  ) => string;
  updateNode: <T extends ProofNode>(
    id: string,
    data: Partial<T["data"]>,
  ) => void;
  removeNode: (id: string) => void;

  // Edge operations
  connectNodes: (
    sourceId: string,
    targetId: string,
    data: ProofEdgeData,
  ) => void;
  removeEdge: (id: string) => void;

  // Cascade delete
  deleteTacticCascade: (tacticId: string) => void;

  // Sync from worker
  syncFromWorker: (
    proofTree: ProofTree,
    sessionId: string,
    claimName?: string,
    theorems?: GlobalEntry[],
  ) => void;

  // Set claim name (used when starting a session)
  setClaimName: (name: string) => void;

  // History
  saveSnapshot: () => void;
  undo: () => void;
  redo: () => void;

  // Proof state
  reset: () => void;

  // React Flow handlers
  onNodesChange: (changes: NodeChange<ProofNode>[]) => void;
  onEdgesChange: (changes: EdgeChange<ProofEdge>[]) => void;
  onConnect: (connection: Connection) => void;

  // Position management
  setManualPosition: (nodeId: string, position: { x: number; y: number }) => void;
  clearManualPositions: () => void;
  // Apply auto-layout positions without recording them as manual overrides
  setLayoutPositions: (positions: Map<string, { x: number; y: number }>) => void;

  // Branch collapse management
  toggleBranchCollapse: (goalId: string) => void;
  expandAllBranches: () => void;
  setAutoCollapseEnabled: (enabled: boolean) => void;
}

export type ProofStore = ProofState & ProofActions;

// ============================================
// UI Store Types
// ============================================

export interface DeleteConfirmation {
  nodeId: string;
  pendingChanges?: NodeChange<ProofNode>[];
}

export interface UIState {
  selectedNodeId: string | null;
  draggingTactic: TacticType | null;
  hoveredNodeId: string | null;
  validDropTargets: string[];
  deleteConfirmation: DeleteConfirmation | null;
}

export interface UIActions {
  selectNode: (id: string | null) => void;
  setDraggingTactic: (type: TacticType | null) => void;
  setHoveredNode: (id: string | null) => void;
  setValidDropTargets: (goalIds: string[]) => void;
  clearDragState: () => void;
  requestDelete: (nodeId: string, pendingChanges: NodeChange<ProofNode>[]) => void;
  confirmDelete: () => void;
  cancelDelete: () => void;
}

export type UIStore = UIState & UIActions;
