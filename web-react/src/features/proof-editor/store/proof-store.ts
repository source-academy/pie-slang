import { create } from "zustand";
import { immer } from "zustand/middleware/immer";
import { subscribeWithSelector } from "zustand/middleware";
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
import type { ProofTreeData } from "@/workers/proof-worker";

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
            type: "goal",
            position,
            data,
            deletable: false, // Prevent manual deletion
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
        }); // Check if data update affects proof completeness (e.g. status change)
        if ("status" in data || "tacticType" in data) {
          get().checkProofComplete();
        }
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
            const parentGoalIdToReset = parentEdge?.source;

            // 1. Reset ONLY the specific goal connected to this tactic
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

          // Remove the node and its edges
          state.nodes = state.nodes.filter((n) => n.id !== id);
          state.edges = state.edges.filter(
            (e) => e.source !== id && e.target !== id,
          );

          // If we removed an applied tactic, the proof might no longer be valid/complete
          // We clear the proof tree data as it's out of sync
          if (isAppliedTactic) {
            state.isProofComplete = false;
            state.proofTreeData = null;

            // 1. Reset ONLY the specific goal connected to this tactic
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

            // 2. Propagate status changes UP the tree (Negative & Positive propagation)
            // If a child becomes pending, the parent must become pending.
            // If all children become done, the parent becomes completed.
            let changed = true;
            // Limit iterations to prevent infinite loops in case of cycles (though trees strictly acyclic here)
            let iterations = 0;
            while (changed && iterations < 50) {
              changed = false;
              iterations++;

              for (const node of state.nodes) {
                if (node.type !== "goal") continue;
                const goalData = node.data as GoalNodeData;

                // Skip explicitly marked 'todo' roots (they are "done" by definition locally)
                if (goalData.status === "todo") continue;

                // Find applied tactic
                const tacticEdge = state.edges.find(
                  (e) =>
                    e.source === node.id && e.data?.kind === "goal-to-tactic",
                );

                if (!tacticEdge) {
                  // No tactic? Should be pending.
                  if (goalData.status !== "pending") {
                    goalData.status = "pending";
                    changed = true;
                  }
                  continue;
                }

                const tacticId = tacticEdge.target;
                const tacticNode = state.nodes.find((n) => n.id === tacticId);
                // If tactic missing or not applied -> pending
                // (Unless it's a incomplete tactic node... but status check handles that)
                if (
                  !tacticNode ||
                  (tacticNode.data as TacticNodeData).status !== "applied"
                ) {
                  if (goalData.status !== "pending") {
                    goalData.status = "pending";
                    changed = true;
                  }
                  continue;
                }

                // Check subgoals
                const childEdges = state.edges.filter(
                  (e) =>
                    e.source === tacticId && e.data?.kind === "tactic-to-goal",
                );

                if (childEdges.length > 0) {
                  const allChildrenDone = childEdges.every((edge) => {
                    const childNode = state.nodes.find(
                      (n) => n.id === edge.target,
                    );
                    const s = (childNode?.data as GoalNodeData)?.status;
                    return s === "completed" || s === "todo";
                  });

                  if (allChildrenDone) {
                    if (goalData.status !== "completed") {
                      goalData.status = "completed";
                      changed = true;
                    }
                  } else {
                    if (goalData.status === "completed") {
                      goalData.status = "pending";
                      changed = true;
                    }
                  }
                }
                // (If childEdges.length === 0, it's a leaf tactic like 'exact', status remains as set by worker/logic)
              }
            }
          }
        });
        get().checkProofComplete();
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
        get().checkProofComplete();
      },

      removeEdge: (id) => {
        set((state) => {
          state.edges = state.edges.filter((e) => e.id !== id);
        });
        get().checkProofComplete();
      },

      // ================================================
      // Sync from Worker
      // ================================================

      syncFromWorker: (
        proofTree: ProofTreeData,
        sessionId: string,
        claimName?: string,
      ) => {
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
          // Robust re-assessment of goal status (handles both completion and regression to pending)
          let changed = true;
          let iterations = 0;
          while (changed && iterations < 50) {
            changed = false;
            iterations++;

            for (const node of state.nodes) {
              if (node.type !== "goal") continue;
              const goalData = node.data as GoalNodeData;

              // 1. Preserve 'todo' status (explicitly set by user/worker)
              if (goalData.status === "todo") continue;

              // 2. Calculate correct status based on current graph connectivity
              let newStatus: GoalNodeData["status"] = "pending";

              const tacticEdge = state.edges.find(
                (e) =>
                  e.source === node.id && e.data?.kind === "goal-to-tactic",
              );

              if (tacticEdge) {
                const tacticNode = state.nodes.find(
                  (n) => n.id === tacticEdge.target,
                );
                // Status is only derived from APPLIED tactics
                if (
                  tacticNode &&
                  (tacticNode.data as TacticNodeData).status === "applied"
                ) {
                  const tData = tacticNode.data as TacticNodeData;

                  if (tData.tacticType === "todo") {
                    // 'todo' tactic completes the goal immediately
                    newStatus = "completed";
                  } else {
                    // Check subgoals
                    const childEdges = state.edges.filter(
                      (e) =>
                        e.source === tacticNode.id &&
                        e.data?.kind === "tactic-to-goal",
                    );

                    if (childEdges.length === 0) {
                      // Leaf tactic (e.g. "exact") -> completes goal
                      newStatus = "completed";
                    } else {
                      // Recursive check: all children must be done
                      const allChildrenDone = childEdges.every((edge) => {
                        const child = state.nodes.find(
                          (n) => n.id === edge.target,
                        );
                        const s = (child?.data as GoalNodeData)?.status;
                        return s === "completed" || s === "todo";
                      });

                      if (allChildrenDone) {
                        newStatus = "completed";
                      }
                      // else stays pending
                    }
                  }
                }
              }

              // Apply change if needed
              if (goalData.status !== newStatus) {
                goalData.status = newStatus;
                changed = true;
              }
            }
          }

          // Finally, check if the entire proof is arguably "complete" (no pending goals remained)
          const pendingGoals = state.nodes.filter(
            (n): n is GoalNode =>
              n.type === "goal" && n.data.status === "pending",
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
          // Filter out direct goal deletions from the changes
          // Users cannot manually delete goals (they must delete the tactic that created them)
          const changesToProcess = changes.filter((c) => {
            if (c.type === "remove") {
              const node = state.nodes.find((n) => n.id === c.id);
              return node?.type !== "goal";
            }
            return true;
          });

          // Handle side effects for removed nodes
          const removedIds = changesToProcess
            .filter((c) => c.type === "remove")
            .map((c) => c.id);

          if (removedIds.length > 0) {
            // Find nodes that are about to be removed
            const removedNodes = state.nodes.filter((n) =>
              removedIds.includes(n.id),
            );

            // Identify applied tactics being removed
            const removedAppliedTactics = removedNodes.filter(
              (n) =>
                n.type === "tactic" &&
                (n.data as TacticNodeData).status === "applied",
            );

            // Goals are no longer manually deletable, so this list will be empty from manual actions
            const removedGoals = removedNodes.filter((n) => n.type === "goal");

            // Set of IDs to be removed recursively (subtree)
            const extraIdsToRemove = new Set<string>();

            // 1. Handle deleted Tactics -> Remove subtree & reset parent goal
            if (removedAppliedTactics.length > 0) {
              state.isProofComplete = false;
              state.proofTreeData = null;

              removedAppliedTactics.forEach((tactic) => {
                const tacticData = tactic.data as TacticNodeData;

                // Reset connected parent goal
                let parentGoalId = tacticData.connectedGoalId;
                if (!parentGoalId) {
                  const parentEdge = state.edges.find(
                    (e) =>
                      e.target === tactic.id &&
                      e.data?.kind === "goal-to-tactic",
                  );
                  parentGoalId = parentEdge?.source;
                }

                if (parentGoalId && !removedIds.includes(parentGoalId)) {
                  const parent = state.nodes.find((n) => n.id === parentGoalId);
                  if (parent?.type === "goal") {
                    const gData = parent.data as GoalNodeData;
                    // Only reset if THIS was the tactic completing/working on it
                    // (Implicitly yes if connectedGoalId matches)
                    gData.status = "pending";
                    gData.completedBy = undefined;
                  }
                }

                // Add tactic to stack for subtree removal
                extraIdsToRemove.add(tactic.id);
              });
            }

            // 2. Handle deleted Goals -> (Should be empty now for manual deletions, but good to keep for robustness)
            if (removedGoals.length > 0) {
              removedGoals.forEach((goal) => {
                extraIdsToRemove.add(goal.id);
              });
            }

            // 3. Process recursive removal (BFS) for all starting points
            // This handles both explicit edges AND logical parent-child relationships
            const stack = Array.from(extraIdsToRemove);

            // Keep track of visited to avoid cycles, though graph should be acyclic
            const visited = new Set<string>([...removedIds, ...stack]);

            while (stack.length > 0) {
              const currentId = stack.pop()!;

              // A. Find outgoing edges to children
              const outgoingEdges = state.edges.filter(
                (e) => e.source === currentId,
              );

              for (const edge of outgoingEdges) {
                const targetId = edge.target;
                if (!visited.has(targetId)) {
                  visited.add(targetId);
                  extraIdsToRemove.add(targetId);
                  stack.push(targetId);
                }
              }

              // B. Find logical children (goals that claim this as parent)
              // This catches disconnected nodes that should be deleted
              const logicalGoalChildren = state.nodes.filter(
                (n) => n.type === "goal" && n.data?.parentGoalId === currentId,
              );

              for (const child of logicalGoalChildren) {
                if (!visited.has(child.id)) {
                  visited.add(child.id);
                  extraIdsToRemove.add(child.id);
                  stack.push(child.id);
                }
              }

              // C. Find logical child tactics (tactics that claim to be connected to this goal)
              // This catches applied tactics that might be momentarily disconnected visually
              const logicalTacticChildren = state.nodes.filter(
                (n) =>
                  n.type === "tactic" &&
                  (n.data as TacticNodeData).connectedGoalId === currentId,
              );

              for (const child of logicalTacticChildren) {
                if (!visited.has(child.id)) {
                  visited.add(child.id);
                  extraIdsToRemove.add(child.id);
                  stack.push(child.id);
                }
              }

              // D. Special Case: Deleting a Tactic should delete subgoals of its parent goal
              // If we are deleting a tactic, we should also delete goals that are children of the tactic's connected goal
              // (This assumes the tactic was the one that created them, which is generally true in this single-tactic-per-goal model)
              // We find the parent goal of this tactic
              const tacticNode = state.nodes.find(
                (n) => n.id === currentId && n.type === "tactic",
              );
              if (tacticNode) {
                const parentGoalId = (tacticNode.data as TacticNodeData)
                  .connectedGoalId;
                if (parentGoalId) {
                  // Find all goals that have this parentGoalId
                  const siblingGoals = state.nodes.filter(
                    (n) =>
                      n.type === "goal" &&
                      n.data?.parentGoalId === parentGoalId,
                  );
                  for (const child of siblingGoals) {
                    if (!visited.has(child.id)) {
                      visited.add(child.id);
                      extraIdsToRemove.add(child.id);
                      stack.push(child.id);
                    }
                  }
                }
              }
            }

            // Cleanup edges connected to ALL removed nodes (initially removed + subtree)
            const allIdsToRemove = [
              ...removedIds,
              ...Array.from(extraIdsToRemove),
            ];

            state.edges = state.edges.filter(
              (e) =>
                !allIdsToRemove.includes(e.source) &&
                !allIdsToRemove.includes(e.target),
            );

            // Remove the extra subtree nodes from state
            // (The initial 'removedIds' are handled by applyNodeChanges below)
            if (extraIdsToRemove.size > 0) {
              state.nodes = state.nodes.filter(
                (n) => !extraIdsToRemove.has(n.id),
              );
            }
          }

          state.nodes = applyNodeChanges(
            changesToProcess,
            state.nodes,
          ) as ProofNode[];
        });

        // Only check proof completeness if nodes were removed or added
        // Position changes/selection shouldn't affect logical state
        const hasStructuralChanges = changes.some(
          (c) => c.type === "remove" || c.type === "add",
        );
        if (hasStructuralChanges) {
          get().checkProofComplete();
        }
      },

      onEdgesChange: (changes: EdgeChange<ProofEdge>[]) => {
        set((state) => {
          state.edges = applyEdgeChanges(changes, state.edges) as ProofEdge[];
        });

        // Edges changing connectivity -> check completeness
        const hasStructuralChanges = changes.some(
          (c) => c.type === "remove" || c.type === "add",
        );
        if (hasStructuralChanges) {
          get().checkProofComplete();
        }
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

// Selector for generated proof script
export const useGeneratedProofScript = () =>
  useProofStore((s) => {
    if (!s.proofTreeData || !s.claimName) return null;
    return generateProofScript(s.proofTreeData, s.claimName);
  });
