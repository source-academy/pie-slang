import { useCallback, useRef, useMemo, useEffect, useState } from "react";
import {
  ReactFlow,
  Background,
  Controls,
  MiniMap,
  useReactFlow,
  type NodeMouseHandler,
  type NodeChange,
  type Connection,
  type Node,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";

import { useProofStore, useUIStore, isValidConnection, useClearManualPositions, useHasManualPositions, useCollapsedBranches, useHasCollapsedBranches, useExpandAllBranches } from "../store";
import { nodeTypes } from "./nodes";
import { setRequestHintCallback } from "./nodes/GoalNode";
import { edgeTypes, getEdgeStyle } from "./edges";
import type {
  ProofNode,
  TacticType,
  GoalNode,
  TacticNode,
  TacticNodeData,
} from "../store/types";
import type { GhostTacticNodeData } from "./nodes/GhostTacticNode";
import { useDemoData } from "../hooks/useDemoData";
import { useHintSystem } from "../hooks/useHintSystem";
import { TACTICS } from "../data/tactics";
import { applyTactic as triggerApplyTactic } from "../utils/tactic-callback";

/**
 * ProofCanvas Component
 *
 * The main proof visualization canvas using React Flow.
 * Renders the proof tree with custom goal, tactic, and lemma nodes.
 */
export function ProofCanvas() {
  // Initialize demo data for testing
  useDemoData();

  const reactFlowWrapper = useRef<HTMLDivElement>(null);
  const { screenToFlowPosition } = useReactFlow();

  // State for delete confirmation dialog
  const [deleteConfirmation, setDeleteConfirmation] = useState<{
    nodeId: string;
    nodeName: string;
  } | null>(null);
  const [pendingChanges, setPendingChanges] = useState<
    NodeChange<ProofNode>[] | null
  >(null);

  // Get state from stores
  const nodes = useProofStore((s) => s.nodes);
  const edges = useProofStore((s) => s.edges);
  const sessionId = useProofStore((s) => s.sessionId);
  const onNodesChange = useProofStore((s) => s.onNodesChange);
  const onEdgesChange = useProofStore((s) => s.onEdgesChange);
  const storeOnConnect = useProofStore((s) => s.onConnect);
  const addTacticNode = useProofStore((s) => s.addTacticNode);
  const updateNode = useProofStore((s) => s.updateNode);

  const selectNode = useUIStore((s) => s.selectNode);
  const setHoveredNode = useUIStore((s) => s.setHoveredNode);
  const clearDragState = useUIStore((s) => s.clearDragState);

  // Position management
  const clearManualPositions = useClearManualPositions();
  const hasManualPositions = useHasManualPositions();

  // Branch collapse management
  const collapsedBranches = useCollapsedBranches();
  const hasCollapsedBranches = useHasCollapsedBranches();
  const expandAllBranches = useExpandAllBranches();

  // Hint system
  const {
    requestHint,
    getMoreDetail,
    acceptGhostNode,
    dismissGhostNode,
    goalHints,
  } = useHintSystem();

  // Register hint callback for GoalNode
  useEffect(() => {
    console.log("[ProofCanvas] Registering hint callback");
    setRequestHintCallback(requestHint);
    return () => {
      console.log("[ProofCanvas] Unregistering hint callback");
      setRequestHintCallback(null);
    };
  }, [requestHint]);

  /**
   * Intercept node changes to warn before deleting applied tactics
   */
  const handleNodesChange = useCallback(
    (changes: NodeChange<ProofNode>[]) => {
      // Check if any of the changes are removing an applied tactic
      const removeChanges = changes.filter((c) => c.type === "remove");

      for (const change of removeChanges) {
        if (change.type !== "remove") continue;

        const nodeToRemove = nodes.find((n) => n.id === change.id);
        if (!nodeToRemove) continue;

        // Check if it's an applied tactic
        if (nodeToRemove.type === "tactic") {
          const tacticData = nodeToRemove.data as TacticNodeData;
          if (tacticData.status === "applied") {
            // Show confirmation dialog
            setDeleteConfirmation({
              nodeId: change.id,
              nodeName: tacticData.displayName,
            });
            setPendingChanges(changes);
            return; // Don't apply changes yet
          }
        }

        // Check if it's a completed goal (also shouldn't be deleted easily)
        if (nodeToRemove.type === "goal") {
          const goalData = nodeToRemove.data;
          if (goalData.status === "completed") {
            setDeleteConfirmation({
              nodeId: change.id,
              nodeName: `Goal: ${goalData.goalType.substring(0, 30)}...`,
            });
            setPendingChanges(changes);
            return; // Don't apply changes yet
          }
        }
      }

      // No applied tactics being removed, proceed normally
      onNodesChange(changes);
    },
    [nodes, onNodesChange],
  );

  /**
   * Confirm deletion of applied tactic
   */
  const handleConfirmDelete = useCallback(() => {
    if (pendingChanges) {
      onNodesChange(pendingChanges);
    }
    setDeleteConfirmation(null);
    setPendingChanges(null);
  }, [pendingChanges, onNodesChange]);

  /**
   * Cancel deletion
   */
  const handleCancelDelete = useCallback(() => {
    setDeleteConfirmation(null);
    setPendingChanges(null);
  }, []);

  /**
   * Enhanced onConnect handler that:
   * 1. Creates the visual edge (via store)
   * 2. Detects goal↔tactic connections
   * 3. Updates tactic's connectedGoalId
   * 4. Triggers tactic application if tactic is ready
   */
  const handleConnect = useCallback(
    async (connection: Connection) => {
      // First, let the store create the edge
      storeOnConnect(connection);

      // Find source and target nodes
      const sourceNode = nodes.find((n) => n.id === connection.source);
      const targetNode = nodes.find((n) => n.id === connection.target);

      if (!sourceNode || !targetNode) return;

      // Identify goal and tactic in the connection
      let goalNode: GoalNode | undefined;
      let tacticNode: TacticNode | undefined;
      let isContextEdge = false;

      // Goal → Tactic (including context → tactic)
      if (sourceNode.type === "goal" && targetNode.type === "tactic") {
        goalNode = sourceNode as GoalNode;
        tacticNode = targetNode as TacticNode;
        isContextEdge = connection.sourceHandle?.startsWith("ctx-") ?? false;
      }
      // Tactic → Goal (reverse direction)
      else if (sourceNode.type === "tactic" && targetNode.type === "goal") {
        // Note: This is typically tactic-output → goal-input (for subgoals)
        // We don't trigger application for this direction
        return;
      }

      if (!goalNode || !tacticNode) return;

      // Handle context-to-tactic edge: update tactic's target parameter
      if (isContextEdge && connection.sourceHandle) {
        const contextVarId = connection.sourceHandle.replace("ctx-", "");
        const contextEntry = goalNode.data.context.find(
          (c) => c.id === contextVarId,
        );
        if (contextEntry) {
          updateNode(tacticNode.id, {
            parameters: {
              ...tacticNode.data.parameters,
              targetContextId: contextVarId,
              variableName: contextEntry.name,
            },
            connectedGoalId: goalNode.id,
            // Update status to 'ready' if this was the missing parameter
            status: "ready",
          });

          // Now trigger application since the tactic is ready
          console.log(
            "[ProofCanvas] Context edge connected, applying tactic:",
            tacticNode.data.tacticType,
          );
          await triggerApplyTactic(
            goalNode.id,
            tacticNode.data.tacticType,
            {
              ...tacticNode.data.parameters,
              targetContextId: contextVarId,
              variableName: contextEntry.name,
            },
            tacticNode.id, // Pass tactic node ID for error handling
          );
        }
        return;
      }

      // Handle goal-to-tactic edge: update connectedGoalId and maybe apply
      updateNode(tacticNode.id, {
        connectedGoalId: goalNode.id,
      });

      // Special handling for 'todo' tactic: update local state immediately
      if (tacticNode.data.tacticType === "todo") {
        // Mark goal as todo
        updateNode(goalNode.id, { status: "todo" });
        // Mark tactic as applied so it persists visuals
        updateNode(tacticNode.id, {
          status: "applied",
          connectedGoalId: goalNode.id,
        });

        // If no session (e.g. demo mode), don't try to call backend
        if (!sessionId) {
          console.log("[ProofCanvas] Todo tactic applied locally (no session)");
          return;
        }
      }

      // If tactic is already 'ready' (params complete), apply it
      if (
        tacticNode.data.status === "ready" ||
        tacticNode.data.tacticType === "todo"
      ) {
        console.log(
          "[ProofCanvas] Edge connected to ready tactic, applying:",
          tacticNode.data.tacticType,
        );
        await triggerApplyTactic(
          goalNode.id,
          tacticNode.data.tacticType,
          tacticNode.data.parameters,
          tacticNode.id, // Pass tactic node ID for error handling
        );
      }
    },
    [nodes, storeOnConnect, updateNode, sessionId],
  );

  // Handle node click for selection
  const onNodeClick: NodeMouseHandler<ProofNode> = useCallback(
    (_event, node) => {
      selectNode(node.id);
    },
    [selectNode],
  );

  // Handle node hover
  const onNodeMouseEnter: NodeMouseHandler<ProofNode> = useCallback(
    (_event, node) => {
      setHoveredNode(node.id);
    },
    [setHoveredNode],
  );

  const onNodeMouseLeave: NodeMouseHandler<ProofNode> = useCallback(() => {
    setHoveredNode(null);
  }, [setHoveredNode]);

  // Handle pane click to deselect
  const onPaneClick = useCallback(() => {
    selectNode(null);
  }, [selectNode]);

  // Handle drag over to allow drop
  const onDragOver = useCallback((event: React.DragEvent) => {
    event.preventDefault();
    event.dataTransfer.dropEffect = "copy";
  }, []);

  // Parameterless tactics are immediately ready (no params needed)
  const PARAMETERLESS_TACTICS = ["split", "left", "right", "todo"];

  // Handle drop to create a new tactic node
  const onDrop = useCallback(
    (event: React.DragEvent) => {
      event.preventDefault();

      const tacticType = event.dataTransfer.getData(
        "application/tactic-type",
      ) as TacticType;
      if (!tacticType) return;

      // Get tactic info
      const tacticInfo = TACTICS.find((t) => t.type === tacticType);
      if (!tacticInfo) return;

      // Convert screen position to flow position
      const position = screenToFlowPosition({
        x: event.clientX,
        y: event.clientY,
      });

      // Parameterless tactics start as 'ready', others start as 'incomplete'
      const isParameterless = PARAMETERLESS_TACTICS.includes(tacticType);
      const initialStatus = isParameterless ? "ready" : "incomplete";

      // Create the tactic node
      const newNodeId = addTacticNode(
        {
          kind: "tactic",
          tacticType,
          displayName: tacticInfo.displayName,
          parameters: {},
          status: initialStatus,
        },
        position,
      );

      // Select the new node
      selectNode(newNodeId);
      clearDragState();
    },
    [screenToFlowPosition, addTacticNode, selectNode, clearDragState],
  );

  // Validate connections before allowing them
  const handleIsValidConnection = useCallback(
    (
      connection:
        | Connection
        | {
            source: string;
            target: string;
            sourceHandle?: string | null;
            targetHandle?: string | null;
          },
    ) => {
      // Normalize the connection object
      const conn: Connection = {
        source: connection.source,
        target: connection.target,
        sourceHandle: connection.sourceHandle ?? null,
        targetHandle: connection.targetHandle ?? null,
      };

      // Basic structural validation
      if (!isValidConnection(conn, nodes)) return false;

      // Logic check: Prevent connecting to goals that are already completed or marked as todo
      const sourceNode = nodes.find((n) => n.id === conn.source);
      const targetNode = nodes.find((n) => n.id === conn.target);

      if (sourceNode?.type === "goal" && targetNode?.type === "tactic") {
        const goalData = sourceNode.data as { status?: string };
        if (goalData.status === "completed" || goalData.status === "todo") {
          return false;
        }
      }

      return true;
    },
    [nodes],
  );

  // Apply edge styles based on edge type
  const styledEdges = useMemo(() => {
    return edges.map((edge) => ({
      ...edge,
      style: getEdgeStyle(edge.data?.kind),
      animated: false, // No animated edges - use solid lines
    }));
  }, [edges]);

  // Create ghost nodes from hint state
  const ghostNodes = useMemo(() => {
    const ghosts: Node<GhostTacticNodeData>[] = [];

    for (const [goalId, hintState] of goalHints.entries()) {
      if (hintState.ghostNode && hintState.hints.length > 0) {
        const latestHint = hintState.hints[hintState.hints.length - 1];
        ghosts.push({
          id: hintState.ghostNode.id,
          type: "ghost",
          position: hintState.ghostNode.position,
          data: {
            kind: "ghost",
            goalId,
            hint: latestHint,
            isLoading: hintState.isLoading,
            onAccept: () => acceptGhostNode(goalId),
            onDismiss: () => dismissGhostNode(goalId),
            onMoreDetail: () => getMoreDetail(goalId),
          },
        });
      }
    }

    return ghosts;
  }, [goalHints, acceptGhostNode, dismissGhostNode, getMoreDetail]);

  // Compute which nodes should be hidden due to branch collapse
  const hiddenNodeIds = useMemo(() => {
    const hidden = new Set<string>();

    // Build parent-child map from edges
    const childrenMap = new Map<string, string[]>();
    edges.forEach(edge => {
      const children = childrenMap.get(edge.source) || [];
      children.push(edge.target);
      childrenMap.set(edge.source, children);
    });

    // Mark all descendants of collapsed nodes as hidden
    function markDescendants(nodeId: string) {
      const children = childrenMap.get(nodeId) || [];
      children.forEach(childId => {
        hidden.add(childId);
        markDescendants(childId);
      });
    }

    collapsedBranches.forEach(rootId => markDescendants(rootId));

    return hidden;
  }, [edges, collapsedBranches]);

  // Combine regular nodes with ghost nodes and apply hidden property
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const allNodes = useMemo(() => {
    const visibleNodes = nodes.map(node => ({
      ...node,
      hidden: hiddenNodeIds.has(node.id)
    }));
    return [...visibleNodes, ...ghostNodes] as any[];
  }, [nodes, ghostNodes, hiddenNodeIds]);

  // Create ghost edges connecting goals to ghost nodes
  const ghostEdges = useMemo(() => {
    return ghostNodes.map((ghost) => ({
      id: `edge-ghost-${ghost.id}`,
      source: ghost.data.goalId,
      target: ghost.id,
      sourceHandle: "goal-output",
      targetHandle: "ghost-input",
      style: {
        stroke: "#a855f7",
        strokeWidth: 2,
        strokeDasharray: "5,5",
      },
      animated: true,
    }));
  }, [ghostNodes]);

  // Combine regular edges with ghost edges
  const allEdges = useMemo(() => {
    return [...styledEdges, ...ghostEdges];
  }, [styledEdges, ghostEdges]);

  return (
    <div className="h-full w-full" ref={reactFlowWrapper}>
      <ReactFlow
        nodes={allNodes}
        edges={allEdges}
        onNodesChange={handleNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={handleConnect}
        isValidConnection={handleIsValidConnection}
        onNodeClick={onNodeClick}
        onNodeMouseEnter={onNodeMouseEnter}
        onNodeMouseLeave={onNodeMouseLeave}
        onPaneClick={onPaneClick}
        onDragOver={onDragOver}
        onDrop={onDrop}
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        nodeTypes={nodeTypes as any}
        edgeTypes={edgeTypes}
        fitView
        fitViewOptions={{
          padding: 0.2,
          maxZoom: 1.5,
        }}
        minZoom={0.1}
        maxZoom={2}
        defaultEdgeOptions={{
          type: "smoothstep",
          animated: false,
        }}
        connectionLineStyle={{ stroke: "#94a3b8", strokeWidth: 2 }}
        proOptions={{
          hideAttribution: true,
        }}
      >
        <Background color="#e5e7eb" gap={16} />
        <Controls />
        {/* Control buttons - Reset Layout and Expand All */}
        {(hasManualPositions || hasCollapsedBranches) && (
          <div className="absolute bottom-4 left-4 z-10 flex gap-2">
            {hasManualPositions && (
              <button
                onClick={clearManualPositions}
                className="flex items-center gap-1.5 rounded-md bg-white px-3 py-1.5 text-xs font-medium text-gray-700 shadow-md ring-1 ring-gray-200 hover:bg-gray-50"
                title="Reset nodes to auto-layout positions"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                  className="h-3.5 w-3.5"
                >
                  <path
                    fillRule="evenodd"
                    d="M15.312 11.424a5.5 5.5 0 01-9.201 2.466l-.312-.311h2.433a.75.75 0 000-1.5H3.989a.75.75 0 00-.75.75v4.242a.75.75 0 001.5 0v-2.43l.31.31a7 7 0 0011.712-3.138.75.75 0 00-1.449-.39zm1.23-3.723a.75.75 0 00.219-.53V2.929a.75.75 0 00-1.5 0V5.36l-.31-.31A7 7 0 003.239 8.188a.75.75 0 101.448.389A5.5 5.5 0 0113.89 6.11l.311.31h-2.432a.75.75 0 000 1.5h4.243a.75.75 0 00.53-.219z"
                    clipRule="evenodd"
                  />
                </svg>
                Reset Layout
              </button>
            )}
            {hasCollapsedBranches && (
              <button
                onClick={expandAllBranches}
                className="flex items-center gap-1.5 rounded-md bg-white px-3 py-1.5 text-xs font-medium text-gray-700 shadow-md ring-1 ring-gray-200 hover:bg-gray-50"
                title="Expand all collapsed branches"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                  className="h-3.5 w-3.5"
                >
                  <path
                    fillRule="evenodd"
                    d="M5.23 7.21a.75.75 0 011.06.02L10 11.168l3.71-3.938a.75.75 0 111.08 1.04l-4.25 4.5a.75.75 0 01-1.08 0l-4.25-4.5a.75.75 0 01.02-1.06z"
                    clipRule="evenodd"
                  />
                </svg>
                Expand All
              </button>
            )}
          </div>
        )}
        <MiniMap
          nodeStrokeColor={(node) => {
            if (node.type === "goal") {
              const data = node.data as { status?: string };
              if (data.status === "completed") return "#22c55e";
              if (data.status === "in-progress") return "#fbbf24";
              if (data.status === "todo") return "#e879f9";
              return "#f97316";
            }
            if (node.type === "tactic") return "#3b82f6";
            if (node.type === "lemma") return "#22c55e";
            if (node.type === "ghost") return "#a855f7"; // Purple for ghost nodes
            return "#6b7280";
          }}
          nodeColor={(node) => {
            if (node.type === "goal") {
              const data = node.data as { status?: string };
              if (data.status === "completed") return "#dcfce7";
              if (data.status === "in-progress") return "#fef3c7";
              if (data.status === "todo") return "#fce7f3";
              return "#ffedd5";
            }
            if (node.type === "tactic") return "#dbeafe";
            if (node.type === "lemma") return "#dcfce7";
            if (node.type === "ghost") return "#f3e8ff"; // Light purple for ghost nodes
            return "#f3f4f6";
          }}
          maskColor="rgba(0, 0, 0, 0.1)"
          className="!bottom-24 !right-4"
        />
      </ReactFlow>

      {/* Delete confirmation dialog */}
      {deleteConfirmation && (
        <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="mx-4 max-w-md rounded-lg bg-white p-6 shadow-xl">
            <h3 className="mb-2 text-lg font-semibold text-gray-900">
              Delete Applied Tactic?
            </h3>
            <p className="mb-4 text-sm text-gray-600">
              You are about to delete{" "}
              <strong>{deleteConfirmation.nodeName}</strong>. This will
              invalidate the current proof and you will need to restart or
              re-apply tactics.
            </p>
            <div className="flex justify-end gap-3">
              <button
                className="rounded-md px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100"
                onClick={handleCancelDelete}
              >
                Cancel
              </button>
              <button
                className="rounded-md bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700"
                onClick={handleConfirmDelete}
              >
                Delete Anyway
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
