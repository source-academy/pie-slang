// Types
export type {
  ContextEntry,
  TacticType,
  TacticParameters,
  TacticNodeStatus,
  GoalNodeData,
  TacticNodeData,
  LemmaNodeData,
  GoalNode,
  TacticNode,
  LemmaNode,
  ProofNode,
  ProofEdgeData,
  ProofEdge,
  HandleType,
  ProofSnapshot,
  ProofState,
  ProofActions,
  ProofStore,
  UIState,
  UIActions,
  UIStore,
} from './types';

// Proof store
export {
  useProofStore,
  useProofNodes,
  useProofEdges,
  useIsProofComplete,
  useSessionId,
  useProofTreeData,
  useClaimName,
  useGeneratedProofScript,
  isValidConnection,
} from './proof-store';

// UI store
export {
  useUIStore,
  useSelectedNodeId,
  useDraggingTactic,
  useHoveredNodeId,
  useValidDropTargets,
  useIsValidDropTarget,
} from './ui-store';

// Hint store
export {
  useHintStore,
  useGoalHintState,
  useActiveGhostNode,
  useHintApiKey,
  type GhostNode,
  type GoalHintState,
  type HintState,
  type HintActions,
  type HintStore,
} from './hint-store';
