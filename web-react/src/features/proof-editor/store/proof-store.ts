import { create } from 'zustand';
import { immer } from 'zustand/middleware/immer';
import { subscribeWithSelector } from 'zustand/middleware';
import {
  applyNodeChanges,
  applyEdgeChanges,
  type NodeChange,
  type EdgeChange,
  type Connection,
} from '@xyflow/react';
import { nanoid } from 'nanoid';
import type {
  ProofStore,
  ProofState,
  ProofNode,
  ProofEdge,
  GoalNode,
  TacticNode,
  LemmaNode,
  ProofEdgeData,
  GoalNodeData,
  TacticNodeData,
} from './types';
import { convertProofTreeToReactFlow } from '../utils/convert-proof-tree';
import { generateProofScript } from '../utils/generate-proof-script';
import type { ProofTreeData } from '@/workers/proof-worker';

// Initial state
const initialState: ProofState = {
  nodes: [],
  edges: [],
  rootGoalId: null,
  isProofComplete: false,
  sessionId: null,
  lastSyncedState: null,
  proofTreeData: null,
  claimName: null,
  history: [],
  historyIndex: -1,
};

/**
 * Proof Store
 *
 * Manages the proof tree state including nodes, edges, and history.
 * Syncs with the proof worker for tactic application.
 */
export const useProofStore = create<ProofStore>()(
  subscribeWithSelector(
    immer((set, get) => ({
      ...initialState,

      // ================================================
      // Node Operations
      // ================================================

      addGoalNode: (data, position) => {
        const id = `goal-${nanoid(8)}`;
        set((state) => {
          const node: GoalNode = {
            id,
            type: 'goal',
            position,
            data,
          };
          state.nodes.push(node);
          if (!state.rootGoalId) {
            state.rootGoalId = id;
          }
        });
        return id;
      },

      addTacticNode: (data, position) => {
        const id = `tactic-${nanoid(8)}`;
        set((state) => {
          const node: TacticNode = {
            id,
            type: 'tactic',
            position,
            data,
          };
          state.nodes.push(node);
        });
        return id;
      },

      addLemmaNode: (data, position) => {
        const id = `lemma-${nanoid(8)}`;
        set((state) => {
          const node: LemmaNode = {
            id,
            type: 'lemma',
            position,
            data,
          };
          state.nodes.push(node);
        });
        return id;
      },

      updateNode: (id, data) => {
        set((state) => {
          const node = state.nodes.find((n) => n.id === id);
          if (node) {
            Object.assign(node.data, data);
          }
        });
      },

      removeNode: (id) => {
        set((state) => {
          // Check if we're removing an applied tactic node
          const nodeToRemove = state.nodes.find((n) => n.id === id);
          const isAppliedTactic = nodeToRemove?.type === 'tactic' &&
            (nodeToRemove.data as TacticNodeData).status === 'applied';

          // Remove the node and its edges
          state.nodes = state.nodes.filter((n) => n.id !== id);
          state.edges = state.edges.filter(
            (e) => e.source !== id && e.target !== id
          );

          // If we removed an applied tactic, the proof is no longer valid
          // Mark proof as incomplete and clear proof tree data
          if (isAppliedTactic) {
            state.isProofComplete = false;
            state.proofTreeData = null;

            // Also update any goal nodes that were marked complete by this tactic
            // to be pending again
            for (const node of state.nodes) {
              if (node.type === 'goal') {
                const goalData = node.data as GoalNodeData;
                // If this goal was completed, mark it as pending
                // (A more sophisticated approach would track which tactic completed which goal)
                if (goalData.status === 'completed') {
                  goalData.status = 'pending';
                  goalData.completedBy = undefined;
                }
              }
            }
          }
        });
      },

      // ================================================
      // Edge Operations
      // ================================================

      connectNodes: (sourceId, targetId, data) => {
        set((state) => {
          // Determine source and target handles based on edge kind
          let sourceHandle: string | undefined;
          let targetHandle: string | undefined;

          switch (data.kind) {
            case 'goal-to-tactic':
              sourceHandle = 'goal-output';
              targetHandle = 'goal-input';
              break;
            case 'tactic-to-goal':
              sourceHandle = 'tactic-output';
              targetHandle = 'goal-input';
              break;
            case 'context-to-tactic':
              // Source is the context variable handle on the goal
              sourceHandle = `ctx-${data.contextVarId}`;
              targetHandle = 'context-input';
              break;
            case 'lemma-to-tactic':
              sourceHandle = 'lemma-output';
              targetHandle = 'context-input';
              break;
          }

          const edge: ProofEdge = {
            id: `edge-${nanoid(8)}`,
            source: sourceId,
            target: targetId,
            sourceHandle,
            targetHandle,
            data,
          };
          state.edges.push(edge);
        });
      },

      removeEdge: (id) => {
        set((state) => {
          state.edges = state.edges.filter((e) => e.id !== id);
        });
      },

      // ================================================
      // Sync from Worker
      // ================================================

      syncFromWorker: (proofTree: ProofTreeData, sessionId: string, claimName?: string) => {
        set((state) => {
          const { nodes, edges } = convertProofTreeToReactFlow(proofTree);
          state.nodes = nodes;
          state.edges = edges;
          state.sessionId = sessionId;
          state.rootGoalId = proofTree.root.goal.id;
          state.isProofComplete = proofTree.isComplete;
          state.lastSyncedState = { nodes, edges };
          // Store proof tree data for script generation
          state.proofTreeData = proofTree;
          if (claimName) {
            state.claimName = claimName;
          }
        });
      },

      setClaimName: (name: string) => {
        set((state) => {
          state.claimName = name;
        });
      },

      // ================================================
      // History (Undo/Redo)
      // ================================================

      saveSnapshot: () => {
        set((state) => {
          const snapshot = {
            nodes: JSON.parse(JSON.stringify(state.nodes)) as ProofNode[],
            edges: JSON.parse(JSON.stringify(state.edges)) as ProofEdge[],
            timestamp: Date.now(),
          };
          // Truncate any redo history
          state.history = state.history.slice(0, state.historyIndex + 1);
          state.history.push(snapshot);
          state.historyIndex = state.history.length - 1;
        });
      },

      undo: () => {
        set((state) => {
          if (state.historyIndex > 0) {
            state.historyIndex -= 1;
            const snapshot = state.history[state.historyIndex];
            state.nodes = snapshot.nodes;
            state.edges = snapshot.edges;
          }
        });
      },

      redo: () => {
        set((state) => {
          if (state.historyIndex < state.history.length - 1) {
            state.historyIndex += 1;
            const snapshot = state.history[state.historyIndex];
            state.nodes = snapshot.nodes;
            state.edges = snapshot.edges;
          }
        });
      },

      // ================================================
      // Proof State
      // ================================================

      checkProofComplete: () => {
        set((state) => {
          const pendingGoals = state.nodes.filter(
            (n): n is GoalNode =>
              n.type === 'goal' && n.data.status === 'pending'
          );
          state.isProofComplete = pendingGoals.length === 0;
        });
      },

      reset: () => {
        set(() => initialState);
      },

      // ================================================
      // React Flow Handlers
      // ================================================

      onNodesChange: (changes: NodeChange<ProofNode>[]) => {
        set((state) => {
          state.nodes = applyNodeChanges(changes, state.nodes) as ProofNode[];
        });
      },

      onEdgesChange: (changes: EdgeChange<ProofEdge>[]) => {
        set((state) => {
          state.edges = applyEdgeChanges(changes, state.edges) as ProofEdge[];
        });
      },

      onConnect: (connection: Connection) => {
        const state = get();
        const sourceNode = state.nodes.find((n) => n.id === connection.source);
        const targetNode = state.nodes.find((n) => n.id === connection.target);

        if (sourceNode && targetNode && connection.source && connection.target) {
          const edgeData = getConnectionData(sourceNode, targetNode, connection);
          if (edgeData) {
            get().connectNodes(connection.source, connection.target, edgeData);
          }
        }
      },
    }))
  )
);

/**
 * Determine the edge data based on source and target nodes and connection handles
 */
function getConnectionData(
  source: ProofNode,
  target: ProofNode,
  connection: Connection
): ProofEdgeData | null {
  // Goal → Tactic (from goal-output or context handle)
  if (source.type === 'goal' && target.type === 'tactic') {
    // Check if this is a context-to-tactic connection
    if (connection.sourceHandle?.startsWith('ctx-')) {
      const contextVarId = connection.sourceHandle.replace('ctx-', '');
      return {
        kind: 'context-to-tactic',
        contextVarId,
      };
    }
    // Regular goal-to-tactic connection
    return { kind: 'goal-to-tactic' };
  }

  // Tactic → Goal
  if (source.type === 'tactic' && target.type === 'goal') {
    return { kind: 'tactic-to-goal' };
  }

  // Lemma → Tactic
  if (source.type === 'lemma' && target.type === 'tactic') {
    return { kind: 'lemma-to-tactic' };
  }

  // Invalid connection
  return null;
}

/**
 * Check if a connection between two nodes is valid
 * Used by React Flow's isValidConnection prop
 */
export function isValidConnection(
  connection: Connection,
  nodes: ProofNode[]
): boolean {
  const sourceNode = nodes.find((n) => n.id === connection.source);
  const targetNode = nodes.find((n) => n.id === connection.target);

  if (!sourceNode || !targetNode) return false;

  // Goal → Tactic: goal-output or ctx-* handle to goal-input or context-input
  if (sourceNode.type === 'goal' && targetNode.type === 'tactic') {
    // Context handle to context-input
    if (connection.sourceHandle?.startsWith('ctx-')) {
      return connection.targetHandle === 'context-input';
    }
    // Goal output to goal input
    return connection.sourceHandle === 'goal-output' && connection.targetHandle === 'goal-input';
  }

  // Tactic → Goal: tactic-output to goal-input
  if (sourceNode.type === 'tactic' && targetNode.type === 'goal') {
    return connection.sourceHandle === 'tactic-output' && connection.targetHandle === 'goal-input';
  }

  // Lemma → Tactic: lemma-output to context-input
  if (sourceNode.type === 'lemma' && targetNode.type === 'tactic') {
    return connection.sourceHandle === 'lemma-output' && connection.targetHandle === 'context-input';
  }

  // All other combinations are invalid
  return false;
}

// Convenience selectors
export const useProofNodes = () => useProofStore((s) => s.nodes);
export const useProofEdges = () => useProofStore((s) => s.edges);
export const useIsProofComplete = () => useProofStore((s) => s.isProofComplete);
export const useSessionId = () => useProofStore((s) => s.sessionId);
export const useProofTreeData = () => useProofStore((s) => s.proofTreeData);
export const useClaimName = () => useProofStore((s) => s.claimName);

// Selector for generated proof script
export const useGeneratedProofScript = () => useProofStore((s) => {
  if (!s.proofTreeData || !s.claimName) return null;
  return generateProofScript(s.proofTreeData, s.claimName);
});
