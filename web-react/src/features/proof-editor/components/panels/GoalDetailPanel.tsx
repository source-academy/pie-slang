import { useCallback, useEffect } from "react";
import { useProofStore, useUIStore } from "../../store";
import { useHintStore } from "../../store/hint-store";
import { useGoalDescriptionStore } from "../../store/goal-description-store";
import { describeGoalBrowser } from "../../lib/describeGoalBrowser";
import type { ContextEntry, GoalNode } from "../../store/types";
import { cn } from "@/shared/lib/utils";
import { RefreshCw, Sparkles } from "lucide-react";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/**
 * Build a minimal self-contained Pie snippet for a single goal.
 * Wraps the goal type in Π bindings for each context entry so the LLM
 * sees a well-formed claim it can describe.
 */
function buildGoalPieCode(
  goalType: string,
  context: ContextEntry[],
): { pieCode: string; goalName: string } {
  const goalName = "goal";
  let type: string;
  if (context.length > 0) {
    const bindings = context
      .map((e) => `(${e.name} ${e.type})`)
      .join("\n      ");
    type = `(Π (${bindings})\n    ${goalType})`;
  } else {
    type = goalType;
  }
  const pieCode = `(claim ${goalName}\n  ${type})`;
  return { pieCode, goalName };
}

/**
 * GoalDetailPanel Component
 *
 * Shows detailed information about the selected goal node.
 * Displayed as a side panel when a goal is selected.
 */
export function GoalDetailPanel() {
  const selectedNodeId = useUIStore((s) => s.selectedNodeId);
  const nodes = useProofStore((s) => s.nodes);
  const selectNode = useUIStore((s) => s.selectNode);

  // AI / description state
  const apiKey = useHintStore((s) => s.apiKey);
  const setLoading = useGoalDescriptionStore((s) => s.setLoading);
  const setDescription = useGoalDescriptionStore((s) => s.setDescription);
  const setError = useGoalDescriptionStore((s) => s.setError);
  const descEntry = useGoalDescriptionStore((s) =>
    selectedNodeId ? s.descriptions.get(selectedNodeId) : undefined,
  );

  // Find the selected node
  const selectedNode = nodes.find(
    (n): n is GoalNode => n.id === selectedNodeId && n.type === "goal",
  );

  // ---------------------------------------------------------------------------
  // Description fetching — per-goal: builds a Pie snippet from this goal's
  // own type and context, so each goal gets a distinct description.
  // ---------------------------------------------------------------------------
  const fetchDescription = useCallback(
    async (nodeId: string, goalNode: GoalNode) => {
      if (!apiKey) return;
      setLoading(nodeId);
      try {
        const { pieCode, goalName } = buildGoalPieCode(
          goalNode.data.goalType,
          goalNode.data.context,
        );
        const text = await describeGoalBrowser(pieCode, goalName, apiKey);
        setDescription(nodeId, text);
      } catch (e) {
        setError(nodeId, e instanceof Error ? e.message : String(e));
      }
    },
    [apiKey, setLoading, setDescription, setError],
  );

  // Lazily trigger on first open of this goal's panel
  useEffect(() => {
    if (!selectedNodeId || !selectedNode) return;
    if (!apiKey) return;
    // Only auto-fetch if we have no cached entry for this node yet
    if (!descEntry) {
      fetchDescription(selectedNodeId, selectedNode);
    }
  }, [selectedNodeId, selectedNode, apiKey, descEntry, fetchDescription]);

  // ---------------------------------------------------------------------------
  // Render
  // ---------------------------------------------------------------------------
  if (!selectedNode) {
    return (
      <div className="w-80 border-l bg-gray-50 p-4">
        <p className="text-sm text-gray-500">Click on a goal to see details</p>
      </div>
    );
  }

  const { data } = selectedNode;

  const statusColors = {
    todo: "bg-goal-pending",
    pending: "bg-goal-pending",
    "in-progress": "bg-goal-current",
    completed: "bg-goal-complete",
  };

  return (
    <div className="w-80 border-l bg-white overflow-y-auto">
      {/* Header */}
      <div className="flex items-center justify-between border-b p-4">
        <h2 className="font-semibold">Goal Details</h2>
        <button
          onClick={() => selectNode(null)}
          className="rounded p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-600"
        >
          <svg
            className="h-5 w-5"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M6 18L18 6M6 6l12 12"
            />
          </svg>
        </button>
      </div>

      {/* Status */}
      <div className="border-b p-4">
        <div className="mb-1 text-xs font-medium text-gray-500">Status</div>
        <div className="flex items-center gap-2">
          <span
            className={cn("h-3 w-3 rounded-full", statusColors[data.status])}
          />
          <span className="text-sm font-medium capitalize">
            {data.status === "in-progress" ? "Current" : data.status}
          </span>
        </div>
      </div>

      {/* Goal Type */}
      <div className="border-b p-4">
        <div className="mb-2 text-xs font-medium text-gray-500">Goal Type</div>
        <div className="rounded bg-gray-50 p-3 font-mono text-sm break-all">
          {data.goalType}
        </div>
        {data.expandedGoalType ? (
          <details className="mt-2">
            <summary className="cursor-pointer text-xs text-gray-500 hover:text-gray-700">
              Show expanded type
            </summary>
            <div className="mt-2 rounded bg-gray-100 p-3 font-mono text-xs text-gray-600 break-all">
              {data.expandedGoalType as string}
            </div>
          </details>
        ) : null}
      </div>

      {/* Overview (AI-generated description) */}
      <div className="border-b p-4">
        <div className="mb-2 flex items-center justify-between">
          <div className="flex items-center gap-1.5">
            <Sparkles className="h-3.5 w-3.5 text-purple-500" />
            <span className="text-xs font-medium text-gray-500">Overview</span>
          </div>
          {apiKey && (
            <button
              onClick={() =>
                selectedNodeId &&
                selectedNode &&
                fetchDescription(selectedNodeId, selectedNode)
              }
              disabled={descEntry?.isLoading}
              title="Refresh description"
              className={cn(
                "flex items-center gap-1 rounded px-2 py-0.5 text-xs font-medium transition-colors",
                "border border-purple-200 bg-purple-50 text-purple-700",
                "hover:bg-purple-100 hover:border-purple-300",
                "disabled:cursor-not-allowed disabled:opacity-50",
              )}
            >
              <RefreshCw
                className={cn(
                  "h-3 w-3",
                  descEntry?.isLoading && "animate-spin",
                )}
              />
              {descEntry?.isLoading ? "Generating…" : "Refresh"}
            </button>
          )}
        </div>

        {!apiKey ? (
          <p className="text-xs text-gray-400 italic">
            Configure a Gemini API key in AI Settings to enable goal
            descriptions.
          </p>
        ) : descEntry?.isLoading ? (
          <div className="flex items-center gap-2 text-xs text-purple-600">
            <RefreshCw className="h-3 w-3 animate-spin" />
            Generating description…
          </div>
        ) : descEntry?.error ? (
          <p className="text-xs text-red-500">{descEntry.error}</p>
        ) : descEntry?.text ? (
          <p className="text-sm leading-relaxed text-gray-700">
            {descEntry.text}
          </p>
        ) : (
          <p className="text-xs text-gray-400 italic">Fetching…</p>
        )}
      </div>

      {/* Context */}
      <div className="p-4">
        <div className="mb-2 text-xs font-medium text-gray-500">
          Context ({data.context.length} binding
          {data.context.length !== 1 ? "s" : ""})
        </div>
        {data.context.length === 0 ? (
          <p className="text-sm text-gray-400 italic">No context bindings</p>
        ) : (
          <div className="space-y-2">
            {data.context.map((entry) => (
              <div
                key={entry.id}
                className={cn(
                  "rounded border p-2",
                  entry.origin === "introduced"
                    ? "border-blue-200 bg-blue-50"
                    : "border-gray-200 bg-gray-50",
                )}
              >
                <div className="flex items-center justify-between">
                  <span className="font-mono text-sm font-semibold text-blue-700">
                    {entry.name}
                  </span>
                  {entry.origin === "introduced" && (
                    <span className="rounded bg-blue-200 px-1.5 py-0.5 text-[10px] text-blue-700">
                      introduced
                    </span>
                  )}
                </div>
                <div className="mt-1 font-mono text-xs text-gray-600">
                  : {entry.type}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Parent Goal */}
      {data.parentGoalId && (
        <div className="border-t p-4">
          <div className="mb-1 text-xs font-medium text-gray-500">
            Parent Goal
          </div>
          <button
            onClick={() => selectNode(data.parentGoalId!)}
            className="text-sm text-blue-600 hover:underline"
          >
            Go to parent →
          </button>
        </div>
      )}

      {/* Node ID (for debugging) */}
      <div className="border-t p-4">
        <div className="mb-1 text-xs font-medium text-gray-500">Node ID</div>
        <code className="text-xs text-gray-400">{selectedNode.id}</code>
      </div>
    </div>
  );
}
