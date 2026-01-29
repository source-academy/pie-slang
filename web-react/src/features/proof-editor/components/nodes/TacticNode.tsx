import { memo, useState, useCallback } from 'react';
import { Handle, Position, type NodeProps } from '@xyflow/react';
import { cn } from '@/shared/lib/utils';
import { useProofStore } from '../../store';
import type { TacticNode as TacticNodeType, TacticType, TacticNodeStatus } from '../../store/types';
import { applyTactic as triggerApplyTactic } from '../../utils/tactic-callback';

// Tactics that require a context variable input
const CONTEXT_INPUT_TACTICS: TacticType[] = [
  'elimNat',
  'elimList',
  'elimVec',
  'elimEither',
  'elimEqual',
  'elimAbsurd',
  'apply',
];

// Tactics that don't need any parameters (immediately ready)
const PARAMETERLESS_TACTICS: TacticType[] = ['split', 'left', 'right'];

// Status-based styling
const STATUS_STYLES: Record<TacticNodeStatus, { border: string; bg: string; badge: string }> = {
  incomplete: {
    border: 'border-amber-400',
    bg: 'bg-amber-50',
    badge: 'bg-amber-400 text-white',
  },
  ready: {
    border: 'border-tactic',
    bg: 'bg-blue-50',
    badge: 'bg-tactic text-white',
  },
  applied: {
    border: 'border-green-500',
    bg: 'bg-green-50',
    badge: 'bg-green-500 text-white',
  },
  error: {
    border: 'border-red-400',
    bg: 'bg-red-50',
    badge: 'bg-red-400 text-white',
  },
};

/**
 * TacticNode Component
 *
 * Displays a tactic that can be connected to goals.
 * Color indicates status:
 * - Amber: Incomplete (missing parameters)
 * - Blue: Ready (parameters filled, ready to apply)
 * - Green: Applied (successfully applied to a goal)
 * - Red: Error (application failed)
 *
 * Has two input handles:
 * - Top: goal input (all tactics)
 * - Left: context variable input (elimination/apply tactics only)
 *
 * Shows inline parameter inputs when in 'incomplete' status.
 */
export const TacticNode = memo(function TacticNode({
  id,
  data,
  selected,
}: NodeProps<TacticNodeType>) {
  const needsContextInput = CONTEXT_INPUT_TACTICS.includes(data.tacticType);
  const isParameterless = PARAMETERLESS_TACTICS.includes(data.tacticType);
  const styles = STATUS_STYLES[data.status];
  const deleteTacticCascade = useProofStore((s) => s.deleteTacticCascade);

  // Show inline input when incomplete and not a context-requiring or parameterless tactic
  const showInlineInput = data.status === 'incomplete' && !needsContextInput && !isParameterless;

  // Handle delete button click
  const handleDelete = useCallback(() => {
    deleteTacticCascade(id);
  }, [id, deleteTacticCascade]);

  return (
    <div
      className={cn(
        'min-w-[140px] max-w-[220px] rounded-md border-2 p-2 shadow-sm transition-all',
        styles.border,
        styles.bg,
        selected && 'ring-2 ring-primary ring-offset-2'
      )}
    >
      {/* Input handle from goal (top) */}
      <Handle
        type="target"
        position={Position.Top}
        id="goal-input"
        className="!h-3 !w-3 !border-2 !border-tactic !bg-white"
      />

      {/* Input handle from context variable (left) - only for elim/apply tactics */}
      {needsContextInput && (
        <Handle
          type="target"
          position={Position.Left}
          id="context-input"
          className="!left-[-6px] !h-2.5 !w-2.5 !border-2 !border-blue-400 !bg-blue-100"
          style={{ top: '50%' }}
        />
      )}

      {/* Tactic name and status */}
      <div className="mb-1 flex items-center justify-between gap-2">
        <span className={cn('rounded px-2 py-0.5 text-sm font-semibold', styles.badge)}>
          {data.displayName}
        </span>
        <div className="flex items-center gap-1">
          {/* Status indicator */}
          <span className="text-[10px] text-gray-500">
            {data.status === 'incomplete' && '⏳'}
            {data.status === 'ready' && '✓'}
            {data.status === 'applied' && '✔'}
            {data.status === 'error' && '✗'}
          </span>
          {/* Delete button */}
          <button
            onClick={handleDelete}
            className="nodrag text-[10px] text-gray-400 hover:text-red-500 transition-colors px-1"
            title="Delete tactic and all child goals"
          >
            ✕
          </button>
        </div>
      </div>

      {/* Inline parameter input for intro tactic */}
      {showInlineInput && data.tacticType === 'intro' && (
        <IntroParamInput
          nodeId={id}
          currentName={data.parameters.variableName}
          connectedGoalId={data.connectedGoalId}
        />
      )}

      {/* Inline parameter input for exact tactic */}
      {showInlineInput && data.tacticType === 'exact' && (
        <ExactParamInput
          nodeId={id}
          currentExpr={data.parameters.expression}
          connectedGoalId={data.connectedGoalId}
        />
      )}

      {/* Context input indicator for elim tactics (incomplete state) */}
      {data.status === 'incomplete' && needsContextInput && !data.parameters.targetContextId && (
        <div className="mt-1 rounded bg-purple-50 p-1.5 text-[10px] text-purple-600">
          Connect a variable from goal context to the left handle
        </div>
      )}

      {/* Context variable indicator (when configured) */}
      {needsContextInput && data.parameters.targetContextId && (
        <div className="mt-1 flex items-center gap-1 text-xs text-blue-600">
          <span className="rounded bg-blue-100 px-1 py-0.5">
            target: {data.parameters.variableName || data.parameters.targetContextId}
          </span>
        </div>
      )}

      {/* Variable name parameter display (for intro, when not editing) */}
      {data.status !== 'incomplete' && data.parameters.variableName && !needsContextInput && (
        <div className="mt-1 text-xs text-gray-600">
          <span className="font-mono">{data.parameters.variableName}</span>
        </div>
      )}

      {/* Expression parameter display (for exact, when not editing) */}
      {data.status !== 'incomplete' && data.parameters.expression && (
        <div className="mt-1 text-xs text-gray-600 font-mono truncate" title={data.parameters.expression}>
          {data.parameters.expression}
        </div>
      )}

      {/* Error message */}
      {data.status === 'error' && data.errorMessage && (
        <div className="mt-1 rounded bg-red-100 p-1 text-xs text-red-600">
          {data.errorMessage}
        </div>
      )}

      {/* Output handle (to subgoals) */}
      <Handle
        type="source"
        position={Position.Bottom}
        id="tactic-output"
        className="!h-3 !w-3 !border-2 !border-tactic !bg-white"
      />
    </div>
  );
});

TacticNode.displayName = 'TacticNode';

/**
 * Inline parameter input for intro tactic
 */
function IntroParamInput({
  nodeId,
  currentName,
  connectedGoalId,
}: {
  nodeId: string;
  currentName?: string;
  connectedGoalId?: string;
}) {
  const [value, setValue] = useState(currentName || '');
  const updateNode = useProofStore((s) => s.updateNode);

  const handleSubmit = useCallback(async () => {
    if (value.trim()) {
      const params = { variableName: value.trim() };

      // Update node state
      updateNode(nodeId, {
        parameters: params,
        displayName: `intro ${value.trim()}`,
        status: 'ready',
      });

      // If already connected to a goal, trigger application
      if (connectedGoalId) {
        console.log('[TacticNode] Params set and connected, applying intro');
        await triggerApplyTactic(connectedGoalId, 'intro', params, nodeId);
      }
    }
  }, [nodeId, value, updateNode, connectedGoalId]);

  return (
    <div className="mt-1 nodrag">
      <input
        type="text"
        value={value}
        onChange={(e) => setValue(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === 'Enter') {
            e.preventDefault();
            handleSubmit();
          }
        }}
        placeholder="variable name"
        className="w-full rounded border border-gray-300 px-1.5 py-0.5 text-xs font-mono focus:border-blue-400 focus:outline-none"
        autoFocus
      />
      <button
        onClick={handleSubmit}
        disabled={!value.trim()}
        className="mt-1 w-full rounded bg-tactic px-2 py-0.5 text-[10px] text-white hover:bg-blue-600 disabled:bg-gray-300"
      >
        {connectedGoalId ? 'Apply' : 'Set'}
      </button>
    </div>
  );
}

/**
 * Inline parameter input for exact tactic
 */
function ExactParamInput({
  nodeId,
  currentExpr,
  connectedGoalId,
}: {
  nodeId: string;
  currentExpr?: string;
  connectedGoalId?: string;
}) {
  const [value, setValue] = useState(currentExpr || '');
  const updateNode = useProofStore((s) => s.updateNode);

  const handleSubmit = useCallback(async () => {
    if (value.trim()) {
      const params = { expression: value.trim() };

      // Update node state
      updateNode(nodeId, {
        parameters: params,
        status: 'ready',
      });

      // If already connected to a goal, trigger application
      if (connectedGoalId) {
        console.log('[TacticNode] Params set and connected, applying exact');
        await triggerApplyTactic(connectedGoalId, 'exact', params, nodeId);
      }
    }
  }, [nodeId, value, updateNode, connectedGoalId]);

  return (
    <div className="mt-1 nodrag">
      <input
        type="text"
        value={value}
        onChange={(e) => setValue(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === 'Enter') {
            e.preventDefault();
            handleSubmit();
          }
        }}
        placeholder="expression"
        className="w-full rounded border border-gray-300 px-1.5 py-0.5 text-xs font-mono focus:border-blue-400 focus:outline-none"
        autoFocus
      />
      <button
        onClick={handleSubmit}
        disabled={!value.trim()}
        className="mt-1 w-full rounded bg-tactic px-2 py-0.5 text-[10px] text-white hover:bg-blue-600 disabled:bg-gray-300"
      >
        {connectedGoalId ? 'Apply' : 'Set'}
      </button>
    </div>
  );
}
