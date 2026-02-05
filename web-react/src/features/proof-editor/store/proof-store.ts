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
} from './types';
import { convertProofTreeToReactFlow } from '../utils/convert-proof-tree';
import { generateProofScript } from '../utils/generate-proof-script';
import type { ProofTreeData } from '@/workers/proof-worker';
import { useHistoryStore } from './history-store';
import { useMetadataStore } from './metadata-store';

// Initial state
const initialState: ProofState = {
  nodes: [],
  edges: [],
  rootGoalId: null,
  isProofComplete: false,
  sessionId: null,
  lastSyncedState: null,
  globalContext: { definitions: [], theorems: [] },
  proofTreeData: null,
  claimName: null,
  history: [],
  historyIndex: -1,
  manualPositions: new Map(),
};

// Track high water mark for edge count per session to prevent stale sync race conditions
// This guards against React StrictMode double-renders and multiple hook instances
// causing older sync results to overwrite newer ones
const sessionEdgeHighWaterMark = new Map<string, number>();

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
          state.nodes = state.nodes.filter((n) => n.id !== id);
          state.edges = state.edges.filter(
            (e) => e.source !== id && e.target !== id
          );
        });
      },

      /**
       * Delete a tactic node and cascade delete all downstream nodes.
       * Also reverts the parent goal to 'pending' status.
       * Saves a snapshot before deletion for undo support.
       */
      deleteTacticCascade: (tacticId) => {
        // Save snapshot BEFORE deletion for undo
        get().saveSnapshot();

        set((state) => {
          console.log('[deleteTacticCascade] Called with tacticId:', tacticId);
          console.log('[deleteTacticCascade] All nodes:', state.nodes.map(n => ({
            id: n.id,
            type: n.type
          })));
          console.log('[deleteTacticCascade] All edges:', state.edges.map(e => ({
            id: e.id,
            source: e.source,
            target: e.target,
            kind: e.data?.kind
          })));

          // Find the tactic node to get its connected goal
          const tacticNode = state.nodes.find(n => n.id === tacticId && n.type === 'tactic');

          // Derive parent goal from tactic ID pattern or tactic data
          // Tactic IDs follow pattern: "tactic-for-{goalId}" or "tactic-completing-{goalId}"
          let parentGoalId: string | undefined;
          if (tacticId.startsWith('tactic-for-')) {
            parentGoalId = tacticId.replace('tactic-for-', '');
          } else if (tacticId.startsWith('tactic-completing-')) {
            parentGoalId = tacticId.replace('tactic-completing-', '');
          } else if (tacticNode?.type === 'tactic') {
            // Fall back to connectedGoalId from tactic data
            parentGoalId = (tacticNode.data as { connectedGoalId?: string }).connectedGoalId;
          }
          // Also try to find from edges if available
          if (!parentGoalId && state.edges.length > 0) {
            const parentEdge = state.edges.find(
              (e) => e.target === tacticId && e.data?.kind === 'goal-to-tactic'
            );
            parentGoalId = parentEdge?.source;
          }
          console.log('[deleteTacticCascade] Parent goal ID:', parentGoalId);

          // Helper to get all child node IDs recursively
          // Uses both edge data AND node parentGoalId for robustness
          function getDescendantIds(nodeId: string): string[] {
            const descendants: string[] = [];

            // Method 1: Use edges if available
            if (state.edges.length > 0) {
              const childEdges = state.edges.filter((e) => e.source === nodeId);
              for (const edge of childEdges) {
                descendants.push(edge.target);
                descendants.push(...getDescendantIds(edge.target));
              }
            }

            // Method 2: Use node data relationships (more robust when edges are empty)
            // For tactics: find goals whose parentGoalId matches the tactic's parent goal
            if (nodeId.startsWith('tactic-for-') || nodeId.startsWith('tactic-completing-')) {
              const tacticParentGoal = nodeId.replace('tactic-for-', '').replace('tactic-completing-', '');
              console.log(`[getDescendantIds] Looking for child goals of tactic. tacticParentGoal=${tacticParentGoal}`);
              // Find child goals that were created by this tactic
              // These are goals whose parentGoalId equals the tactic's parent goal
              // (because the tactic transforms the parent goal into child goals)
              for (const node of state.nodes) {
                if (node.type === 'goal') {
                  const goalData = node.data as { parentGoalId?: string };
                  console.log(`[getDescendantIds] Checking goal ${node.id}: parentGoalId=${goalData.parentGoalId}`);
                  if (node.id !== tacticParentGoal && goalData.parentGoalId === tacticParentGoal && !descendants.includes(node.id)) {
                    console.log(`[getDescendantIds] Found child goal: ${node.id}`);
                    descendants.push(node.id);
                    descendants.push(...getDescendantIds(node.id));
                  }
                }
              }
            }

            // For goals: find tactics that are connected to this goal
            if (nodeId.startsWith('goal')) {
              for (const node of state.nodes) {
                if (node.type === 'tactic') {
                  const tacticData = node.data as { connectedGoalId?: string };
                  if (tacticData.connectedGoalId === nodeId && !descendants.includes(node.id)) {
                    descendants.push(node.id);
                    descendants.push(...getDescendantIds(node.id));
                  }
                  // Also check ID pattern
                  if (node.id === `tactic-for-${nodeId}` || node.id === `tactic-completing-${nodeId}`) {
                    if (!descendants.includes(node.id)) {
                      descendants.push(node.id);
                      descendants.push(...getDescendantIds(node.id));
                    }
                  }
                }
              }
            }

            console.log(`[getDescendantIds] Node ${nodeId} descendants:`, descendants);
            return [...new Set(descendants)]; // Remove duplicates
          }

          // Get all descendant nodes to delete
          const nodesToDelete = new Set([tacticId, ...getDescendantIds(tacticId)]);
          console.log('[deleteTacticCascade] Nodes to delete:', Array.from(nodesToDelete));

          // Remove all descendant nodes
          state.nodes = state.nodes.filter((n) => !nodesToDelete.has(n.id));

          // Remove all edges connected to deleted nodes
          state.edges = state.edges.filter(
            (e) => !nodesToDelete.has(e.source) && !nodesToDelete.has(e.target)
          );

          // Revert parent goal to 'pending' status
          if (parentGoalId) {
            const parentGoal = state.nodes.find((n) => n.id === parentGoalId);
            if (parentGoal && parentGoal.type === 'goal') {
              (parentGoal as GoalNode).data.status = 'pending';
              (parentGoal as GoalNode).data.completedBy = undefined;
            }
          }

          // Update proof completion status
          const pendingGoals = state.nodes.filter(
            (n): n is GoalNode => n.type === 'goal' && n.data.status === 'pending'
          );
          state.isProofComplete = pendingGoals.length === 0;

          // Clear proof tree data since it's no longer valid
          state.proofTreeData = null;
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
        const { nodes, edges } = convertProofTreeToReactFlow(proofTree);
        const { manualPositions } = get();

        // Get the high water mark for this session
        const currentHighWaterMark = sessionEdgeHighWaterMark.get(sessionId) ?? 0;

        // Update high water mark if this sync has more edges
        if (edges.length > currentHighWaterMark) {
          sessionEdgeHighWaterMark.set(sessionId, edges.length);
        }

        // Guard against stale syncs: if we've seen more edges for this session before,
        // skip this sync (it's a stale result from StrictMode or async race conditions)
        const newHighWaterMark = sessionEdgeHighWaterMark.get(sessionId) ?? 0;
        console.log(`[syncFromWorker] sessionId=${sessionId}, edges=${edges.length}, highWaterMark=${newHighWaterMark}`);
        if (edges.length < newHighWaterMark) {
          console.log(`[syncFromWorker] Skipping stale sync (edges=${edges.length} < highWaterMark=${newHighWaterMark})`);
          return;
        }

        // Preserve manual positions for existing nodes
        const mergedNodes = nodes.map(node => {
          const manualPos = manualPositions.get(node.id);
          if (manualPos) {
            console.log(`[syncFromWorker] Preserving manual position for ${node.id}:`, manualPos);
            return { ...node, position: manualPos };
          }
          return node;
        });

        set((state) => {
          console.log(`[syncFromWorker] nodeCount=${mergedNodes.length}, edgeCount=${edges.length}`);
          if (edges.length > 0) {
            console.log('[syncFromWorker] edges:', JSON.stringify(edges.map(e => ({ id: e.id, source: e.source, target: e.target, kind: e.data?.kind }))));
          }
          state.nodes = mergedNodes;
          state.edges = edges;
          state.sessionId = sessionId;
          state.rootGoalId = proofTree.root.goal.id;
          state.isProofComplete = proofTree.isComplete;
          state.lastSyncedState = { nodes: mergedNodes, edges };
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
      // History (Undo/Redo) - Delegates to history-store
      // ================================================

      saveSnapshot: () => {
        const state = get();
        useHistoryStore.getState().saveSnapshot(state.nodes, state.edges);
      },

      undo: () => {
        const snapshot = useHistoryStore.getState().undo();
        if (snapshot) {
          set((state) => {
            state.nodes = snapshot.nodes;
            state.edges = snapshot.edges;
          });
        }
      },

      redo: () => {
        const snapshot = useHistoryStore.getState().redo();
        if (snapshot) {
          set((state) => {
            state.nodes = snapshot.nodes;
            state.edges = snapshot.edges;
          });
        }
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
        set(() => ({ ...initialState, manualPositions: new Map() }));
        useHistoryStore.getState().reset();
        useMetadataStore.getState().reset();
        // Clear high water marks for all sessions
        sessionEdgeHighWaterMark.clear();
      },

      // Delegates to metadata-store for backwards compatibility
      setGlobalContext: (context) => {
        useMetadataStore.getState().setGlobalContext(context);
        // Also keep in local state for backwards compatibility during transition
        set((state) => {
          state.globalContext = context;
        });
      },

      // ================================================
      // Manual Position Management
      // ================================================

      setManualPosition: (nodeId: string, position: { x: number; y: number }) => {
        set((state) => {
          state.manualPositions.set(nodeId, position);
        });
      },

      clearManualPositions: () => {
        set((state) => {
          state.manualPositions.clear();
          // Re-layout nodes by recalculating from proof tree data
          if (state.proofTreeData) {
            const { nodes } = convertProofTreeToReactFlow(state.proofTreeData);
            state.nodes = nodes.map(newNode => {
              // Preserve node data from current state, only update position
              const existingNode = state.nodes.find(n => n.id === newNode.id);
              if (existingNode) {
                return { ...existingNode, position: newNode.position };
              }
              return newNode;
            });
          }
        });
      },

      // ================================================
      // React Flow Handlers
      // ================================================

      onNodesChange: (changes: NodeChange<ProofNode>[]) => {
        set((state) => {
          // Track manual positions when user finishes dragging
          for (const change of changes) {
            if (change.type === 'position' && change.position && change.dragging === false) {
              // User finished dragging - save manual position
              console.log(`[onNodesChange] Saving manual position for ${change.id}:`, change.position);
              state.manualPositions.set(change.id, { ...change.position });
            }
          }
          state.nodes = applyNodeChanges(changes, state.nodes) as ProofNode[];
        });
      },

      onEdgesChange: (changes: EdgeChange<ProofEdge>[]) => {
        console.log('[onEdgesChange] Received changes:', changes);
        set((state) => {
          const beforeCount = state.edges.length;
          state.edges = applyEdgeChanges(changes, state.edges) as ProofEdge[];
          console.log('[onEdgesChange] Edge count:', beforeCount, '->', state.edges.length);
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
export const useGlobalContext = () => useProofStore((s) => s.globalContext);
export const useProofTreeData = () => useProofStore((s) => s.proofTreeData);
export const useClaimNameFromProof = () => useProofStore((s) => s.claimName);
export const useClearManualPositions = () => useProofStore((s) => s.clearManualPositions);
export const useHasManualPositions = () => useProofStore((s) => s.manualPositions.size > 0);

// Selector for generated proof script
export const useGeneratedProofScript = () => useProofStore((s) => {
  if (!s.proofTreeData || !s.claimName) return null;
  return generateProofScript(s.proofTreeData, s.claimName);
});
