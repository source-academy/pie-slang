import { memo } from 'react';
import { Handle, Position, type NodeProps } from '@xyflow/react';
import { cn } from '@/shared/lib/utils';
import type { TacticNode as TacticNodeType, TacticType, TacticNodeStatus } from '../../store/types';

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
 */
export const TacticNode = memo(function TacticNode({
  data,
  selected,
}: NodeProps<TacticNodeType>) {
  const needsContextInput = CONTEXT_INPUT_TACTICS.includes(data.tacticType);
  const styles = STATUS_STYLES[data.status];

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
        {/* Status indicator */}
        <span className="text-[10px] text-gray-500">
          {data.status === 'incomplete' && '⏳'}
          {data.status === 'ready' && '✓'}
          {data.status === 'applied' && '✔'}
          {data.status === 'error' && '✗'}
        </span>
      </div>

      {/* Context variable indicator (if using one) */}
      {needsContextInput && data.parameters.targetContextId && (
        <div className="mt-1 flex items-center gap-1 text-xs text-blue-600">
          <span className="rounded bg-blue-100 px-1 py-0.5">
            target: {data.parameters.variableName || data.parameters.targetContextId}
          </span>
        </div>
      )}

      {/* Variable name parameter (for intro) */}
      {data.parameters.variableName && !needsContextInput && (
        <div className="mt-1 text-xs text-gray-600">
          <span className="font-mono">{data.parameters.variableName}</span>
        </div>
      )}

      {/* Expression parameter (for exact/exists) */}
      {data.parameters.expression && (
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
