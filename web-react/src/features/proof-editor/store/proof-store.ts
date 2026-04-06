import { create } from "zustand";
import { immer } from "zustand/middleware/immer";
import { subscribeWithSelector } from "zustand/middleware";
import { enableMapSet } from "immer";

// Enable Map and Set support in immer
// Required for manualPositions Map to work correctly
enableMapSet();
import {
  applyNodeChanges,
  applyEdgeChanges,
  type NodeChange,
  type EdgeChange,
  type Connection,
} from "@xyflow/react";
import { nanoid } from "nanoid";
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
} from "./types";
import { convertProofTreeToReactFlow } from "../utils/convert-proof-tree";
import { generateProofScript } from "../utils/generate-proof-script";
import type { ProofTree, GlobalEntry } from "@pie/protocol";

// Track positions during drag (outside store to avoid re-renders)
const draggingPositions = new Map<string, { x: number; y: number }>();

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
  manualPositions: new Map(),
  collapsedBranches: new Set(),
  autoCollapseEnabled: true,
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
            type: "goal",
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
            type: "tactic",
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
            type: "lemma",
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
          const isAppliedTactic =
            nodeToRemove?.type === "tactic" &&
            (nodeToRemove.data as TacticNodeData).status === "applied";

          // Capture parent goal ID before deleting edges
          let parentGoalIdToReset: string | undefined;
          if (isAppliedTactic) {
            const parentEdge = state.edges.find(
              (e) => e.target === id && e.data?.kind === "goal-to-tactic",
            );
            parentGoalIdToReset = parentEdge?.source;
          }

          // Remove the node and its edges
          state.nodes = state.nodes.filter((n) => n.id !== id);
          state.edges = state.edges.filter(
            (e) => e.source !== id && e.target !== id,
          );

          // If we removed an applied tactic, mark proof as incomplete.
          // Reset only the directly connected parent goal to pending.
          // The next syncFromWorker() call will re-establish correct status.
          if (isAppliedTactic) {
            state.isProofComplete = false;
            state.proofTreeData = null;

            if (parentGoalIdToReset) {
              const parentGoal = state.nodes.find(
                (n) => n.id === parentGoalIdToReset,
              );
              if (parentGoal && parentGoal.type === "goal") {
                const goalData = parentGoal.data as GoalNodeData;
                goalData.status = "pending";
                goalData.completedBy = undefined;
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
            case "goal-to-tactic":
              sourceHandle = "goal-output";
              targetHandle = "goal-input";
              break;
            case "tactic-to-goal":
              sourceHandle = "tactic-output";
              targetHandle = "goal-input";
              break;
            case "context-to-tactic":
              // Source is the context variable handle on the goal
              sourceHandle = `ctx-${data.contextVarId}`;
              targetHandle = "context-input";
              break;
            case "lemma-to-tactic":
              sourceHandle = "lemma-output";
              targetHandle = "context-input";
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

      /**
       * Delete a tactic node and cascade delete all downstream nodes.
       * Also reverts the parent goal to 'pending' status.
       * Saves a snapshot before deletion for undo support.
       */
      deleteTacticCascade: (tacticId: string) => {
        // Save snapshot BEFORE deletion for undo
        get().saveSnapshot();

        set((state) => {
          // Find the tactic node
          const tacticNode = state.nodes.find((n) => n.id === tacticId && n.type === "tactic");

          // Derive parent goal from tactic ID pattern
          let parentGoalId: string | undefined;
          if (tacticId.startsWith("tactic-for-")) {
            parentGoalId = tacticId.replace("tactic-for-", "");
          } else if (tacticId.startsWith("tactic-completing-")) {
            parentGoalId = tacticId.replace("tactic-completing-", "");
          } else if (tacticNode?.type === "tactic") {
            parentGoalId = (tacticNode.data as TacticNodeData).connectedGoalId;
          }

          // Helper to get all child node IDs recursively
          const getDescendantIds = (nodeId: string): string[] => {
            const descendants: string[] = [];
            const childEdges = state.edges.filter((e) => e.source === nodeId);
            for (const edge of childEdges) {
              descendants.push(edge.target);
              descendants.push(...getDescendantIds(edge.target));
            }
            return [...new Set(descendants)];
          };

          // Get all descendant nodes to delete
          const nodesToDelete = new Set([tacticId, ...getDescendantIds(tacticId)]);

          // Remove all descendant nodes
          state.nodes = state.nodes.filter((n) => !nodesToDelete.has(n.id));

          // Remove all edges connected to deleted nodes
          state.edges = state.edges.filter(
            (e) => !nodesToDelete.has(e.source) && !nodesToDelete.has(e.target),
          );

          // Revert parent goal to 'pending' status
          if (parentGoalId) {
            const parentGoal = state.nodes.find((n) => n.id === parentGoalId);
            if (parentGoal && parentGoal.type === "goal") {
              (parentGoal.data as GoalNodeData).status = "pending";
              (parentGoal.data as GoalNodeData).completedBy = undefined;
            }
          }

          // Invalidate proof state
          state.isProofComplete = false;
          state.proofTreeData = null;
        });

        // Save snapshot AFTER deletion so redo can restore the post-deletion state
        get().saveSnapshot();
      },

      // ================================================
      // Sync from Worker
      // ================================================

      syncFromWorker: (
        proofTree: ProofTree,
        sessionId: string,
        claimName?: string,
        theorems?: GlobalEntry[],
      ) => {
        const { nodes, edges } = convertProofTreeToReactFlow(proofTree);
        const { manualPositions } = get();

        // Preserve existing lemma nodes or create new ones from theorems
        let lemmaNodes: ProofNode[] = [];
        if (theorems) {
          lemmaNodes = theorems.map((thm, index) => {
            // Find existing position if any
            const existingNode = get().nodes.find(n => n.id === `lemma-${thm.name}`);
            // Layout in a grid: 5 items per row
            const row = Math.floor(index / 5);
            const col = index % 5;
            const position = existingNode?.position || { x: col * 220, y: -200 - row * 100 };

            return {
              id: `lemma-${thm.name}`,
              type: "lemma",
              position,
              data: {
                kind: "lemma",
                name: thm.name,
                type: thm.type,
                source: thm.kind === "theorem" ? "proven" : thm.kind,
              },
            } as ProofNode;
          });
        } else {
          lemmaNodes = get().nodes.filter((n) => n.type === "lemma");
        }

        // Preserve existing custom edges connected to lemma nodes
        const existingLemmaEdges = get().edges.filter(
          (e) => get().nodes.find((n) => n.id === e.source && n.type === "lemma")
        );

        // Build a map of node IDs to their auto-calculated positions
        const autoPositions = new Map<string, { x: number; y: number }>();
        nodes.forEach((node) => {
          autoPositions.set(node.id, { ...node.position });
        });

        // Build parent-child relationships from edges
        const parentMap = new Map<string, string>(); // childId -> parentTacticId
        edges.forEach((edge) => {
          if (edge.data?.kind === "tactic-to-goal") {
            parentMap.set(edge.target, edge.source);
          }
        });

        // Calculate position deltas for nodes with manual positions
        const positionDeltas = new Map<string, { dx: number; dy: number }>();
        nodes.forEach((node) => {
          const manualPos = manualPositions.get(node.id);
          if (manualPos) {
            const autoPos = autoPositions.get(node.id)!;
            positionDeltas.set(node.id, {
              dx: manualPos.x - autoPos.x,
              dy: manualPos.y - autoPos.y,
            });
          }
        });

        // Apply manual positions and offset children
        const mergedNodes = nodes.map((node) => {
          const manualPos = manualPositions.get(node.id);
          if (manualPos) {
            return { ...node, position: manualPos };
          }

          // Check if this node's parent has been manually positioned
          const parentTacticId = parentMap.get(node.id);
          if (parentTacticId) {
            const parentDelta = positionDeltas.get(parentTacticId);
            if (parentDelta) {
              return {
                ...node,
                position: {
                  x: node.position.x + parentDelta.dx,
                  y: node.position.y + parentDelta.dy,
                },
              };
            }
          }

          // Check if this is a tactic and its parent goal has been moved
          if (node.id.startsWith("tactic-for-") || node.id.startsWith("tactic-completing-")) {
            const goalId = node.id.replace("tactic-for-", "").replace("tactic-completing-", "");
            const parentDelta = positionDeltas.get(goalId);
            if (parentDelta) {
              return {
                ...node,
                position: {
                  x: node.position.x + parentDelta.dx,
                  y: node.position.y + parentDelta.dy,
                },
              };
            }
          }

          return node;
        });

        set((state) => {
          // Clear stale collapsedBranches when starting a new proof session.
          // A new session is indicated by a new claimName being provided that
          // differs from the current one. Within the same session (e.g. after
          // applying a tactic), claimName is not passed, so collapse state is
          // preserved.
          if (claimName && claimName !== state.claimName) {
            state.collapsedBranches = new Set();
            state.manualPositions = new Map();
          }

          state.nodes = mergedNodes;
          state.edges = edges;
          state.sessionId = sessionId;
          state.rootGoalId = proofTree.root.goal.id;
          state.isProofComplete = proofTree.isComplete;
          state.lastSyncedState = { nodes: mergedNodes, edges };
          state.proofTreeData = proofTree;
          if (claimName) {
            state.claimName = claimName;
          }

          // Auto-collapse completed subtrees
          if (state.autoCollapseEnabled) {
            const findCollapsibleNodes = (node: typeof proofTree.root): string[] => {
              const result: string[] = [];
              // A node is collapsible if its subtree is complete AND it has visual
              // descendants: either subgoal children or a completing tactic node
              const hasVisualDescendants = node.children.length > 0 || !!node.completedBy;
              if (node.isSubtreeComplete && hasVisualDescendants) {
                result.push(node.goal.id);
              }
              // Check children for collapsible subtrees (only if this node is not complete)
              // This prevents nested collapse (if parent is collapsed, don't also collapse children)
              if (!node.isSubtreeComplete) {
                node.children.forEach(child => {
                  result.push(...findCollapsibleNodes(child));
                });
              }
              return result;
            };

            const collapsibleIds = findCollapsibleNodes(proofTree.root);
            collapsibleIds.forEach(id => {
              // Only auto-collapse if not already expanded by user
              if (!state.collapsedBranches.has(id)) {
                state.collapsedBranches.add(id);
                console.log(`[syncFromWorker] Auto-collapsing completed subtree: ${id}`);
              }
            });
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

      reset: () => {
        set(() => ({
          ...initialState,
          manualPositions: new Map(),
          collapsedBranches: new Set(),
        }));
      },

      // ================================================
      // Position Management
      // ================================================

      setManualPosition: (nodeId: string, position: { x: number; y: number }) => {
        set((state) => {
          state.manualPositions.set(nodeId, position);
        });
      },

      clearManualPositions: () => {
        set((state) => {
          state.manualPositions.clear();
        });
      },

      // ================================================
      // Branch Collapse Management
      // ================================================

      toggleBranchCollapse: (goalId: string) => {
        set((state) => {
          if (state.collapsedBranches.has(goalId)) {
            state.collapsedBranches.delete(goalId);
          } else {
            state.collapsedBranches.add(goalId);
          }
        });
      },

      expandAllBranches: () => {
        set((state) => {
          state.collapsedBranches.clear();
        });
      },

      setAutoCollapseEnabled: (enabled: boolean) => {
        set((state) => {
          state.autoCollapseEnabled = enabled;
        });
      },

      // ================================================
      // React Flow Handlers
      // ================================================

      onNodesChange: (changes: NodeChange<ProofNode>[]) => {
        set((state) => {
          // Handle side effects for removed nodes
          const removedIds = changes
            .filter((c) => c.type === "remove")
            .map((c) => c.id);

          if (removedIds.length > 0) {
            // Find nodes that are about to be removed
            const removedNodes = state.nodes.filter((n) =>
              removedIds.includes(n.id),
            );

            // Check if any applied tactic is being removed
            const isAppliedTactic = removedNodes.some(
              (n) =>
                n.type === "tactic" &&
                (n.data as TacticNodeData).status === "applied",
            );

            // Cleanup edges connected to removed nodes
            state.edges = state.edges.filter(
              (e) =>
                !removedIds.includes(e.source) &&
                !removedIds.includes(e.target),
            );

            // If we removed an applied tactic, invalidate proof and reset goals
            if (isAppliedTactic) {
              state.isProofComplete = false;
              state.proofTreeData = null;

              // Also update any goal nodes that were marked complete/todo by this tactic
              // to be pending again.
              // Note: Currently we reset ALL goals on any tactic removal because we operate
              // on a simplistic invalidation model. Ideally we'd only invalidate the subtree.
              for (const node of state.nodes) {
                if (node.type === "goal") {
                  const goalData = node.data as GoalNodeData;
                  if (
                    goalData.status === "completed" ||
                    goalData.status === "todo"
                  ) {
                    goalData.status = "pending";
                    goalData.completedBy = undefined;
                  }
                }
              }
            }
          }

          // Track position changes for manual position preservation
          for (const change of changes) {
            if (change.type === "position" && change.position) {
              // Track position during drag
              if (change.dragging === true) {
                draggingPositions.set(change.id, { ...change.position });
              }
              // On drag end, save to manualPositions
              if (change.dragging === false) {
                const finalPosition = change.position || draggingPositions.get(change.id);
                if (finalPosition) {
                  state.manualPositions.set(change.id, { ...finalPosition });
                }
                draggingPositions.delete(change.id);
              }
            }
          }

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

        if (
          sourceNode &&
          targetNode &&
          connection.source &&
          connection.target
        ) {
          const edgeData = getConnectionData(
            sourceNode,
            targetNode,
            connection,
          );
          if (edgeData) {
            get().connectNodes(connection.source, connection.target, edgeData);
          }
        }
      },
    })),
  ),
);

/**
 * Determine the edge data based on source and target nodes and connection handles
 */
function getConnectionData(
  source: ProofNode,
  target: ProofNode,
  connection: Connection,
): ProofEdgeData | null {
  // Goal → Tactic (from goal-output or context handle)
  if (source.type === "goal" && target.type === "tactic") {
    // Check if this is a context-to-tactic connection
    if (connection.sourceHandle?.startsWith("ctx-")) {
      const contextVarId = connection.sourceHandle.replace("ctx-", "");
      return {
        kind: "context-to-tactic",
        contextVarId,
      };
    }
    // Regular goal-to-tactic connection
    return { kind: "goal-to-tactic" };
  }

  // Tactic → Goal
  if (source.type === "tactic" && target.type === "goal") {
    return { kind: "tactic-to-goal" };
  }

  // Lemma → Tactic
  if (source.type === "lemma" && target.type === "tactic") {
    return { kind: "lemma-to-tactic" };
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
  nodes: ProofNode[],
): boolean {
  const sourceNode = nodes.find((n) => n.id === connection.source);
  const targetNode = nodes.find((n) => n.id === connection.target);

  if (!sourceNode || !targetNode) return false;

  // Goal → Tactic: goal-output or ctx-* handle to goal-input or context-input
  if (sourceNode.type === "goal" && targetNode.type === "tactic") {
    // Context handle to context-input
    if (connection.sourceHandle?.startsWith("ctx-")) {
      return connection.targetHandle === "context-input";
    }
    // Goal output to goal input
    return (
      connection.sourceHandle === "goal-output" &&
      connection.targetHandle === "goal-input"
    );
  }

  // Tactic → Goal: tactic-output to goal-input
  if (sourceNode.type === "tactic" && targetNode.type === "goal") {
    return (
      connection.sourceHandle === "tactic-output" &&
      connection.targetHandle === "goal-input"
    );
  }

  // Lemma → Tactic: lemma-output to context-input
  if (sourceNode.type === "lemma" && targetNode.type === "tactic") {
    return (
      connection.sourceHandle === "lemma-output" &&
      connection.targetHandle === "context-input"
    );
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
export const useClaimNameFromProof = () => useProofStore((s) => s.claimName);

// Global context selector (builds context from root goal)
export const useGlobalContext = () =>
  useProofStore((s) => {
    const rootGoal = s.nodes.find(
      (n) => n.type === "goal" && n.id === s.rootGoalId,
    );
    if (!rootGoal) return [];
    return (rootGoal.data as import("./types").GoalNodeData).context || [];
  });

// Position management selectors
export const useHasManualPositions = () =>
  useProofStore((s) => s.manualPositions.size > 0);
export const useClearManualPositions = () =>
  useProofStore((s) => s.clearManualPositions);

// Branch collapse selectors
export const useCollapsedBranches = () => useProofStore((s) => s.collapsedBranches);
export const useHasCollapsedBranches = () => useProofStore((s) => s.collapsedBranches.size > 0);
export const useToggleBranchCollapse = () => useProofStore((s) => s.toggleBranchCollapse);
export const useExpandAllBranches = () => useProofStore((s) => s.expandAllBranches);

// Selector for generated proof script
export const useGeneratedProofScript = () =>
  useProofStore((s) => {
    if (!s.proofTreeData || !s.claimName) return null;
    return generateProofScript(s.proofTreeData, s.claimName);
  });
