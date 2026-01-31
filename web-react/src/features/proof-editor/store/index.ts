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
  DeleteConfirmation,
} from './types';

// Proof store
export {
  useProofStore,
  useProofNodes,
  useProofEdges,
  useIsProofComplete,
  useSessionId,
  useGlobalContext,
  useProofTreeData,
  useClaimNameFromProof,
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
  useDeleteConfirmation,
} from './ui-store';

// History store
export {
  useHistoryStore,
  useHistoryIndex,
  useHistoryLength,
} from './history-store';

export type {
  HistoryState,
  HistoryActions,
  HistoryStore,
} from './history-store';

// Metadata store
export {
  useMetadataStore,
  useGlobalContextFromMetadata,
  useClaimName,
  useDefinitions,
  useTheorems,
} from './metadata-store';

export type {
  GlobalContext,
  MetadataState,
  MetadataActions,
  MetadataStore,
} from './metadata-store';

// Example store
export {
  useExampleStore,
  useSelectedExample,
  useExampleSource,
  useExampleClaim,
} from './example-store';

export type {
  ExampleState,
  ExampleActions,
  ExampleStore,
} from './example-store';

// Hint store (from upstream)
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
