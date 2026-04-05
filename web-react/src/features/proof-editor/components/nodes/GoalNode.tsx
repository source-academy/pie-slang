import { memo, useCallback, useState } from "react";
import { Handle, Position, useReactFlow, type NodeProps } from "@xyflow/react";
import { cn } from "@/shared/lib/utils";
import { Lightbulb, Loader2, Sparkles, ChevronRight, ChevronDown, X, AlertTriangle } from "lucide-react";
import type {
  GoalNode as GoalNodeType,
  ContextEntry,
  ErrorDetail,
} from "../../store/types";
import type { TacticType } from "@pie/protocol";
import { TACTIC_REQUIREMENTS } from "@pie/protocol";
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

      // Check if tactic needs parameters (derived from protocol)
      const reqs = TACTIC_REQUIREMENTS[tacticType as TacticType];
      const needsVariable = reqs?.variableName === true;
      const needsExpression = reqs?.expression === true;

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

  // Scope depth styling
  const depth = (data.depth as number) ?? 0;

  // Left accent border color — darker with deeper scope
  const DEPTH_LEFT_BORDER = [
    "border-l-blue-300",    // depth 0 — root
    "border-l-indigo-400",  // depth 1
    "border-l-violet-500",  // depth 2
    "border-l-purple-600",  // depth 3
    "border-l-fuchsia-700", // depth 4+
  ];
  const depthBorder = DEPTH_LEFT_BORDER[Math.min(depth, DEPTH_LEFT_BORDER.length - 1)];

  // Scope: split context into categories
  const inheritedEntries = data.context.filter((e) => !e.isNew);
  const newEntries = data.context.filter((e) => e.isNew);
  const totalBindings = data.context.length;

  // Further split into Global (definitions) vs Local (proof-introduced)
  const globalEntries = data.context.filter((e) => e.origin === "definition" || e.origin === "inherited");
  const localEntries = data.context.filter((e) => e.origin !== "definition" && e.origin !== "inherited");

  const handleGoalClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    selectNode(id);
  };

  return (
    <div
      className={cn(
        "min-w-[200px] max-w-[320px] rounded-lg border-2 border-l-[5px] shadow-sm transition-all",
        statusColors[data.status],
        depthBorder,
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
          <div className="mx-2 rounded-lg bg-white p-3 shadow-xl min-w-[220px]">
            <div className="mb-2 text-sm font-medium">
              {pendingTactic.needsParam === "variable"
                ? "Enter target variable:"
                : "Enter expression:"}
            </div>
            <input
              type="text"
              className="mb-1 w-full rounded border px-2 py-1 font-mono text-sm"
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
            {/* Live type match preview */}
            <TypeMatchPreview
              input={paramInput}
              context={data.context}
              goalType={data.goalType}
              tacticType={pendingTactic.type}
              needsParam={pendingTactic.needsParam}
            />
            <div className="flex gap-2 mt-2">
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
            {/* Scope indicator: Γ with binding count */}
            <span
              className={cn(
                "rounded-full px-1.5 py-0.5 text-[9px] font-bold font-mono leading-none",
                "bg-slate-100 text-slate-600",
              )}
              title={`Scope: ${totalBindings} binding${totalBindings !== 1 ? "s" : ""} (${inheritedEntries.length} inherited, ${newEntries.length} new)`}
            >
              Γ{totalBindings > 0 ? `·${totalBindings}` : ""}
            </span>
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

        {/* Collapsed branch indicator */}
        {isCollapsed && (
          <div className="mt-2 text-xs text-green-600 italic flex items-center gap-1">
            <ChevronRight className="w-3 h-3" />
            <span>Branch collapsed - click chevron to expand</span>
          </div>
        )}
      </div>

      {/* Scope: Environment display with Global/Local partitions */}
      {data.context.length > 0 && (
        <div className="border-t border-gray-200 px-3 py-2">
          <div className="mb-1.5 text-[10px] font-medium text-gray-400 tracking-wide">
            SCOPE
          </div>
          <div className="space-y-0.5">
            {/* Global bindings (definitions & theorems) */}
            {globalEntries.length > 0 && (
              <>
                <div className="flex items-center gap-1 mb-0.5">
                  <span className="text-[8px] font-semibold text-purple-400 tracking-widest">GLOBAL</span>
                  <span className="text-[8px] text-gray-300">({globalEntries.length})</span>
                </div>
                {globalEntries.map((entry) => (
                  <ScopeBinding key={entry.id} entry={entry} isNew={false} goalId={id} isSelected={selectedNodeId === `${id}-ctx-${entry.id}`} />
                ))}
              </>
            )}
            {/* Separator between global and local */}
            {globalEntries.length > 0 && localEntries.length > 0 && (
              <div className="border-t border-dashed border-blue-200 my-1" />
            )}
            {/* Local bindings (proof-introduced variables) */}
            {localEntries.length > 0 && (
              <>
                <div className="flex items-center gap-1 mb-0.5">
                  <span className="text-[8px] font-semibold text-blue-400 tracking-widest">LOCAL</span>
                  <span className="text-[8px] text-gray-300">({localEntries.length})</span>
                </div>
                {localEntries.map((entry) => (
                  <ScopeBinding key={entry.id} entry={entry} isNew={!!entry.isNew} goalId={id} isSelected={selectedNodeId === `${id}-ctx-${entry.id}`} />
                ))}
              </>
            )}
          </div>
        </div>
      )}

      {/* Goal type: ⊢ T */}
      <div className="border-t border-gray-200 px-3 py-2">
        <div className="flex items-start gap-1.5">
          <span className="font-mono text-sm text-gray-400 select-none shrink-0">⊢</span>
          <div className="rounded bg-white/50 p-1.5 font-mono text-sm break-all flex-1">
            {data.goalType}
          </div>
        </div>
      </div>

      {/* Type error visualization */}
      {data.lastTacticError && (
        <TypeErrorDisplay
          error={data.lastTacticError as ErrorDetail}
          failedTactic={data.lastFailedTactic as string | undefined}
          goalType={data.goalType}
          onDismiss={() => updateNode(id, { lastTacticError: undefined, lastFailedTactic: undefined })}
        />
      )}

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
 * ScopeBinding — compact display of one binding in the Environment.
 *
 * New entries (isNew=true) get green highlight; inherited entries are dimmed.
 * Origin tags (def / ih) are shown as tiny badges.
 */
const ORIGIN_TAG: Record<string, { label: string; cls: string } | undefined> = {
  definition:              { label: "def", cls: "bg-purple-200 text-purple-700" },
  inherited:               { label: "def", cls: "bg-purple-200 text-purple-700" },
  "inductive-hypothesis":  { label: "ih",  cls: "bg-orange-200 text-orange-700" },
};

function ScopeBinding({
  entry,
  isNew,
  isSelected,
}: {
  entry: ContextEntry;
  isNew: boolean;
  goalId: string;
  isSelected: boolean;
}) {
  const tag = ORIGIN_TAG[entry.origin];

  return (
    <div
      className={cn(
        "relative flex items-center gap-1.5 rounded px-1.5 py-0.5",
        isNew
          ? "bg-emerald-50 border border-emerald-200"
          : "bg-gray-50/50",
        isSelected && "ring-1 ring-primary",
      )}
    >
      {/* New indicator */}
      {isNew && (
        <span className="text-emerald-500 text-[10px] font-bold select-none">+</span>
      )}

      {/* Origin tag */}
      {tag && (
        <span className={cn("rounded px-1 py-0 text-[8px] font-medium leading-tight", tag.cls)}>
          {tag.label}
        </span>
      )}

      {/* name : type */}
      <span className={cn(
        "font-mono text-xs font-semibold",
        isNew ? "text-emerald-700" : "text-gray-500",
      )}>
        {entry.name}
      </span>
      <span className={cn("text-[10px]", isNew ? "text-emerald-400" : "text-gray-300")}>:</span>
      <span
        className={cn(
          "font-mono text-[11px] truncate max-w-[160px]",
          isNew ? "text-emerald-600" : "text-gray-400",
        )}
        title={entry.type}
      >
        {entry.type}
      </span>

      {/* Handle for connecting this variable to tactics */}
      <Handle
        type="source"
        position={Position.Right}
        id={`ctx-${entry.id}`}
        className={cn(
          "!right-[-6px] !h-2 !w-2 !border-2",
          isNew ? "!border-emerald-400 !bg-emerald-100" : "!border-gray-300 !bg-gray-100",
        )}
      />
    </div>
  );
}

/**
 * TypeMatchPreview — live preview of whether the entered variable/expression matches the goal.
 */
function TypeMatchPreview({
  input,
  context,
  goalType,
  tacticType,
  needsParam,
}: {
  input: string;
  context: ContextEntry[];
  goalType: string;
  tacticType: TacticType;
  needsParam: "variable" | "expression" | null;
}) {
  const trimmed = input.trim();
  if (!trimmed) return null;

  // For exact/exists: look up the expression in context (only simple identifiers)
  if (needsParam === "expression") {
    // Only preview for simple variable names (not S-expressions)
    if (trimmed.startsWith("(")) {
      return (
        <div className="text-[10px] text-gray-400 italic py-0.5">
          Expression — type checked on apply
        </div>
      );
    }

    const entry = context.find((e) => e.name === trimmed);
    if (!entry) {
      return (
        <div className="flex items-center gap-1 py-0.5">
          <span className="text-[10px] text-amber-600">?</span>
          <span className="text-[10px] text-amber-600 font-mono">{trimmed}</span>
          <span className="text-[10px] text-amber-500">not in scope</span>
        </div>
      );
    }

    // Compare type
    const matches = entry.type === goalType;
    return (
      <div className={cn("rounded px-1.5 py-1 mt-0.5", matches ? "bg-green-50" : "bg-red-50")}>
        <div className="flex items-center gap-1">
          <span className={cn("text-[10px] font-bold", matches ? "text-green-600" : "text-red-500")}>
            {matches ? "✓" : "✗"}
          </span>
          <span className="text-[10px] font-mono font-semibold text-gray-700">{trimmed}</span>
          <span className="text-[10px] text-gray-400">:</span>
          <span className={cn("text-[10px] font-mono", matches ? "text-green-600" : "text-red-500")}>
            {entry.type}
          </span>
        </div>
        {!matches && (
          <div className="text-[10px] text-red-400 mt-0.5">
            goal expects: <span className="font-mono">{goalType}</span>
          </div>
        )}
      </div>
    );
  }

  // For elimination tactics: show the variable's type
  if (needsParam === "variable") {
    const entry = context.find((e) => e.name === trimmed);
    if (!entry) {
      return (
        <div className="flex items-center gap-1 py-0.5">
          <span className="text-[10px] text-amber-600">?</span>
          <span className="text-[10px] font-mono text-amber-600">{trimmed}</span>
          <span className="text-[10px] text-amber-500">not in scope</span>
        </div>
      );
    }

    // For elim tactics, the variable should be of a specific type (Nat, List, etc.)
    const elimExpected: Record<string, string> = {
      elimNat: "Nat", elimList: "List", elimVec: "Vec",
      elimEither: "Either", elimEqual: "=", elimAbsurd: "Absurd",
    };
    const expectedType = elimExpected[tacticType];
    const typeMatches = expectedType ? entry.type.includes(expectedType) : true;

    return (
      <div className={cn("rounded px-1.5 py-1 mt-0.5", typeMatches ? "bg-blue-50" : "bg-red-50")}>
        <div className="flex items-center gap-1">
          <span className={cn("text-[10px] font-bold", typeMatches ? "text-blue-600" : "text-red-500")}>
            {typeMatches ? "✓" : "✗"}
          </span>
          <span className="text-[10px] font-mono font-semibold text-gray-700">{trimmed}</span>
          <span className="text-[10px] text-gray-400">:</span>
          <span className={cn("text-[10px] font-mono", typeMatches ? "text-blue-600" : "text-red-500")}>
            {entry.type}
          </span>
        </div>
        {!typeMatches && expectedType && (
          <div className="text-[10px] text-red-400 mt-0.5">
            {tacticType} expects type containing <span className="font-mono">{expectedType}</span>
          </div>
        )}
      </div>
    );
  }

  return null;
}

/**
 * TypeErrorDisplay — shows type mismatch / error details directly on the goal node.
 */
function TypeErrorDisplay({
  error,
  failedTactic,
  goalType,
  onDismiss,
}: {
  error: ErrorDetail;
  failedTactic?: string;
  goalType: string;
  onDismiss: () => void;
}) {
  return (
    <div className="border-t-2 border-red-300 bg-red-50 px-3 py-2">
      {/* Header with dismiss */}
      <div className="flex items-center justify-between mb-1">
        <div className="flex items-center gap-1">
          <AlertTriangle className="h-3 w-3 text-red-500" />
          <span className="text-[10px] font-medium text-red-600">
            {failedTactic ? `${failedTactic} failed` : "Type Error"}
          </span>
        </div>
        <button
          onClick={(e) => { e.stopPropagation(); onDismiss(); }}
          className="p-0.5 rounded hover:bg-red-200 text-red-400 hover:text-red-600"
        >
          <X className="h-3 w-3" />
        </button>
      </div>

      {error.kind === "type-mismatch" && (
        <div className="space-y-1">
          <div className="flex items-start gap-1">
            <span className="text-[10px] text-red-400 font-medium shrink-0 w-12">expect:</span>
            <span className="font-mono text-[11px] text-green-700 bg-green-50 rounded px-1 break-all">
              {error.expected || goalType}
            </span>
          </div>
          <div className="flex items-start gap-1">
            <span className="text-[10px] text-red-400 font-medium shrink-0 w-12">got:</span>
            <span className="font-mono text-[11px] text-red-700 bg-red-100 rounded px-1 break-all">
              {error.got}
            </span>
          </div>
        </div>
      )}

      {error.kind === "pi-type-hint" && (
        <div className="text-[11px] text-red-600">
          <span className="font-mono font-semibold">{error.lemmaName}</span>
          {" needs "}
          <span className="font-bold">{error.paramCount}</span>
          {" parameter(s) — use "}
          <span className="font-mono bg-red-100 rounded px-1">
            ({error.lemmaName} arg1{error.paramCount > 1 ? " arg2" : ""}{error.paramCount > 2 ? " ..." : ""})
          </span>
        </div>
      )}

      {error.kind === "generic" && (
        <div className="text-[11px] text-red-600 break-all line-clamp-3">
          {error.message}
        </div>
      )}
    </div>
  );
}

GoalNode.displayName = "GoalNode";
