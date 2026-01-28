import { memo } from 'react';
import { Handle, Position, type NodeProps } from '@xyflow/react';
import { cn } from '@/shared/lib/utils';
import type { TacticNode as TacticNodeType, TacticType } from '../../store/types';

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

/**
 * TacticNode Component
 *
 * Displays a tactic that was applied to transform a goal.
 * Blue styling to distinguish from goals.
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

  return (
    <div
      className={cn(
        'min-w-[140px] max-w-[220px] rounded-md border-2 p-2 shadow-sm transition-all',
        data.isValid
          ? 'border-tactic bg-blue-50'
          : 'border-red-400 bg-red-50',
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

      {/* Tactic name */}
      <div className="mb-1 flex items-center justify-between">
        <span
          className={cn(
            'rounded px-2 py-0.5 text-sm font-semibold',
            data.isValid
              ? 'bg-tactic text-white'
              : 'bg-red-400 text-white'
          )}
        >
          {data.displayName}
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

      {/* Parameters (if any other params) */}
      {data.parameters.expression && (
        <div className="mt-1 text-xs text-gray-600">
          {data.parameters.expression}
        </div>
      )}

      {/* Error message */}
      {!data.isValid && data.errorMessage && (
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
