import { memo, useCallback, useState } from "react";
import { Handle, Position, useReactFlow, type NodeProps } from "@xyflow/react";
import { cn } from "@/shared/lib/utils";
import { Lightbulb, Loader2, Sparkles, ChevronRight, ChevronDown } from "lucide-react";
import type {
  GoalNode as GoalNodeType,
  ContextEntry,
  TacticType,
} from "../../store/types";
import {
  useUIStore,
  useGoalHintState,
  useHintStore,
  useProofStore,
} from "../../store";
import { TACTICS } from "../../data/tactics";
import { applyTactic as triggerApplyTactic } from "../../utils/tactic-callback";

// Re-export for backward compatibility
export { setApplyTacticCallback } from "../../utils/tactic-callback";

// Callback type for hint requests
type RequestHintCallback = (goalId: string) => void;

// Global callback for requesting hints (set by ProofCanvas)
let requestHintCallback: RequestHintCallback | null = null;

export function setRequestHintCallback(callback: RequestHintCallback | null) {
  requestHintCallback = callback;
}

function triggerRequestHint(goalId: string) {
  console.log(
    "[GoalNode] triggerRequestHint called for goalId:",
    goalId,
    "callback registered:",
    !!requestHintCallback,
  );
  if (requestHintCallback) {
    requestHintCallback(goalId);
  } else {
    console.warn("[GoalNode] No hint callback registered");
  }
}

/**
 * GoalNode Component
 *
 * Displays a goal to be proved with its type and context variables.
 * Context variables are shown as subblocks with handles that can connect to tactics.
 *
 * Color indicates status:
 * - Orange: Pending (not yet worked on)
 * - Amber: In-progress (currently being worked on)
 * - Green: Completed (solved by a tactic)
 */

export const GoalNode = memo(function GoalNode({
  id,
  data,
  selected,
}: NodeProps<GoalNodeType>) {
  const selectNode = useUIStore((s) => s.selectNode);
  const selectedNodeId = useUIStore((s) => s.selectedNodeId);
  const hintState = useGoalHintState(id);
  const hasApiKey = useHintStore((s) => !!s.apiKey);

  const { getNode } = useReactFlow(); // Helper to access node properties like position

  // Store access for direct manipulation (rendering updates locally without session)
  const addTacticNode = useProofStore((s) => s.addTacticNode);
  const connectNodes = useProofStore((s) => s.connectNodes);
  const updateNode = useProofStore((s) => s.updateNode);
  const sessionId = useProofStore((s) => s.sessionId);

  const [isDragOver, setIsDragOver] = useState(false);
  const [pendingTactic, setPendingTactic] = useState<{
    type: TacticType;
    needsParam: "variable" | "expression" | null;
  } | null>(null);
  const [paramInput, setParamInput] = useState("");

  // Collapse state
  const isCollapsed = useProofStore((s) => s.collapsedBranches.has(id));
  const toggleCollapse = useProofStore((s) => s.toggleBranchCollapse);
  const isCollapsible = data.isSubtreeComplete && data.status === 'completed';

  // Handle hint button click
  const handleHintClick = useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation();
      console.log("[GoalNode] handleHintClick - goalId:", id);
      triggerRequestHint(id);
    },
    [id],
  );

  // Handle drag over
  const handleDragOver = useCallback(
    (e: React.DragEvent) => {
      // If goal is completed or todo, don't accept drops (let event bubble or default)
      if (data.status === "completed" || data.status === "todo") {
        return;
      }

      e.preventDefault();
      e.stopPropagation();
      e.dataTransfer.dropEffect = "copy";
      setIsDragOver(true);
    },
    [data.status],
  );

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);
  }, []);

  // Handle drop
  const handleDrop = useCallback(
    async (e: React.DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      setIsDragOver(false);

      if (data.status === "completed" || data.status === "todo") return;

      const tacticType = e.dataTransfer.getData(
        "application/tactic-type",
      ) as TacticType;
      if (!tacticType) return;

      const tacticInfo = TACTICS.find((t) => t.type === tacticType);
      if (!tacticInfo) return;

      // Check if tactic needs parameters
      const needsVariable = [
        "elimNat",
        "elimList",
        "elimEither",
        "elimAbsurd",
        "elimVec",
        "elimEqual",
      ].includes(tacticType);
      const needsExpression = ["exact", "exists"].includes(tacticType);

      if (needsVariable) {
        setPendingTactic({ type: tacticType, needsParam: "variable" });
        setParamInput("");
      } else if (needsExpression) {
        setPendingTactic({ type: tacticType, needsParam: "expression" });
        setParamInput("");
      } else {
        // Special handling for 'todo' tactic if no session is active (demo mode)
        if (tacticType === "todo" && !sessionId) {
          console.log("[GoalNode] Applying todo tactic locally (no session)");

          // Get current node position
          const currentNode = getNode(id);
          const currentPos = currentNode?.position ?? { x: 0, y: 0 };

          // 1. Create the tactic node below the goal
          const tacticNodeId = addTacticNode(
            {
              kind: "tactic",
              tacticType: "todo",
              displayName: "todo",
              parameters: {},
              status: "applied",
              connectedGoalId: id,
            },
            // Position it below the goal
            { x: currentPos.x, y: currentPos.y + 150 },
          );

          // 2. Connect goal to tactic
          connectNodes(id, tacticNodeId, { kind: "goal-to-tactic" });

          // 3. Update goal status
          updateNode(id, { status: "todo" });

          return;
        }

        // Standard behavior: trigger apply tactic callback
        await triggerApplyTactic(id, tacticType, {});
      }
    },
    [
      id,
      data.status,
      sessionId,
      addTacticNode,
      connectNodes,
      updateNode,
      getNode,
    ],
  );

  // Handle parameter submission
  const handleSubmitParam = useCallback(async () => {
    if (!pendingTactic || !paramInput.trim()) return;

    const params =
      pendingTactic.needsParam === "variable"
        ? { variableName: paramInput.trim() }
        : { expression: paramInput.trim() };
    await triggerApplyTactic(id, pendingTactic.type, params);

    setPendingTactic(null);
    setParamInput("");
  }, [id, pendingTactic, paramInput]);

  const handleCancelParam = useCallback(() => {
    setPendingTactic(null);
    setParamInput("");
  }, []);

  const statusColors = {
    pending: "border-goal-pending bg-orange-50",
    "in-progress": "border-goal-current bg-amber-50",
    completed: "border-goal-complete bg-green-50",
    todo: "border-pink-400 bg-pink-50",
  };

  const statusBadgeColors = {
    pending: "bg-goal-pending text-white",
    "in-progress": "bg-goal-current text-black",
    completed: "bg-goal-complete text-white",
    todo: "bg-pink-400 text-white",
  };

  const handleGoalClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    selectNode(id);
  };

  return (
    <div
      className={cn(
        "min-w-[200px] max-w-[320px] rounded-lg border-2 shadow-sm transition-all",
        statusColors[data.status],
        selected && "ring-2 ring-primary ring-offset-2",
        isDragOver &&
          data.status !== "completed" &&
          data.status !== "todo" &&
          "ring-4 ring-blue-400 ring-offset-2",
        isCollapsed && "ring-2 ring-green-400 ring-offset-1",
      )}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      {/* Parameter input modal */}
      {pendingTactic && (
        <div className="absolute inset-0 z-50 flex items-center justify-center rounded-lg bg-black/50">
          <div className="mx-2 rounded-lg bg-white p-3 shadow-xl">
            <div className="mb-2 text-sm font-medium">
              {pendingTactic.needsParam === "variable"
                ? "Enter target variable:"
                : "Enter expression:"}
            </div>
            <input
              type="text"
              className="mb-2 w-full rounded border px-2 py-1 font-mono text-sm"
              placeholder={
                pendingTactic.needsParam === "variable"
                  ? "e.g., n"
                  : "e.g., (same n)"
              }
              value={paramInput}
              onChange={(e) => setParamInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") handleSubmitParam();
                if (e.key === "Escape") handleCancelParam();
              }}
              autoFocus
            />
            <div className="flex gap-2">
              <button
                className="flex-1 rounded bg-blue-500 px-2 py-1 text-xs text-white hover:bg-blue-600"
                onClick={handleSubmitParam}
              >
                Apply
              </button>
              <button
                className="flex-1 rounded bg-gray-200 px-2 py-1 text-xs hover:bg-gray-300"
                onClick={handleCancelParam}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Drop indicator */}
      {isDragOver && data.status !== "completed" && data.status !== "todo" && (
        <div className="absolute inset-0 flex items-center justify-center rounded-lg bg-blue-500/20">
          <span className="rounded bg-blue-500 px-2 py-1 text-sm font-medium text-white">
            Drop tactic here
          </span>
        </div>
      )}

      {/* Input handle (from parent tactic) */}
      <Handle
        type="target"
        position={Position.Top}
        id="goal-input"
        className="!h-3 !w-3 !border-2 !border-gray-400 !bg-white"
      />

      {/* Goal header and type - clickable for details */}
      <div
        className="cursor-pointer p-3 hover:bg-white/30"
        onClick={handleGoalClick}
      >
        {/* Header with status badge and hint button */}
        <div className="mb-2 flex items-center justify-between">
          <div className="flex items-center gap-2">
            {/* Collapse toggle for completed subtrees */}
            {isCollapsible && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  toggleCollapse(id);
                }}
                className="p-0.5 hover:bg-gray-200 rounded transition-colors"
                title={isCollapsed ? 'Expand branch' : 'Collapse branch'}
              >
                {isCollapsed ? (
                  <ChevronRight className="w-4 h-4 text-green-600" />
                ) : (
                  <ChevronDown className="w-4 h-4 text-green-600" />
                )}
              </button>
            )}
            <span className="text-xs font-medium text-gray-500">Goal</span>
            {/* Hint button - only show for non-completed goals */}
            {data.status !== "completed" && data.status !== "todo" && (
              <button
                onClick={handleHintClick}
                className={cn(
                  "flex items-center justify-center gap-0.5 rounded-full px-1.5 py-1",
                  hasApiKey
                    ? "bg-gradient-to-r from-purple-500 to-pink-500 text-white hover:from-purple-600 hover:to-pink-600"
                    : "bg-purple-100 text-purple-600 hover:bg-purple-200",
                  "transition-all duration-150",
                  hintState?.isLoading && "animate-pulse",
                )}
                title={
                  hasApiKey
                    ? "Get AI hint"
                    : "Get hint (configure API key for AI hints)"
                }
              >
                {hintState?.isLoading ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                ) : hasApiKey ? (
                  <Sparkles className="h-3.5 w-3.5" />
                ) : (
                  <Lightbulb className="h-3.5 w-3.5" />
                )}
              </button>
            )}
          </div>
          <span
            className={cn(
              "rounded-full px-2 py-0.5 text-xs font-medium",
              statusBadgeColors[data.status],
            )}
          >
            {data.status === "in-progress" ? "current" : data.status}
          </span>
        </div>

        {/* Goal type */}
        <div className="rounded bg-white/50 p-2 font-mono text-sm break-all">
          {data.goalType}
        </div>

        {/* Collapsed branch indicator */}
        {isCollapsed && (
          <div className="mt-2 text-xs text-green-600 italic flex items-center gap-1">
            <ChevronRight className="w-3 h-3" />
            <span>Branch collapsed - click chevron to expand</span>
          </div>
        )}
      </div>

      {/* Context variables as subblocks - only show local (introduced) variables */}
      {(() => {
        const localContext = data.context.filter(
          (entry) => entry.origin === "introduced",
        );
        return localContext.length > 0 ? (
          <div className="border-t border-gray-200 p-2">
            <div className="mb-2 text-xs font-medium text-gray-500">
              Local Context
            </div>
            <div className="space-y-1">
              {localContext.map((entry) => (
                <ContextVarBlock
                  key={entry.id}
                  entry={entry}
                  goalId={id}
                  isSelected={selectedNodeId === `${id}-ctx-${entry.id}`}
                />
              ))}
            </div>
          </div>
        ) : null;
      })()}

      {/* Output handle (to tactic) */}
      <Handle
        type="source"
        position={Position.Bottom}
        id="goal-output"
        className="!h-3 !w-3 !border-2 !border-gray-400 !bg-white"
      />
    </div>
  );
});

/**
 * Context Variable Subblock
 *
 * Displays a local context variable inside a goal node.
 * Has a handle on the right side that can connect to tactics that need this variable
 * (e.g., elimNat, elimList, apply).
 */
function ContextVarBlock({
  entry,
  isSelected,
}: {
  entry: ContextEntry;
  goalId: string; // kept for future use
  isSelected: boolean;
}) {
  return (
    <div
      className={cn(
        "relative flex items-center justify-between rounded border border-blue-300 bg-blue-50 px-2 py-1",
        isSelected && "ring-1 ring-primary",
      )}
    >
      <div className="flex items-center gap-2">
        <span className="font-mono text-sm font-semibold text-blue-700">
          {entry.name}
        </span>
        <span className="text-xs text-gray-500">:</span>
        <span
          className="font-mono text-xs text-gray-600 truncate max-w-[140px]"
          title={entry.type}
        >
          {entry.type}
        </span>
      </div>

      {/* Handle for connecting this variable to tactics */}
      <Handle
        type="source"
        position={Position.Right}
        id={`ctx-${entry.id}`}
        className="!right-[-6px] !h-2.5 !w-2.5 !border-2 !border-blue-400 !bg-blue-100"
      />
    </div>
  );
}

GoalNode.displayName = "GoalNode";
