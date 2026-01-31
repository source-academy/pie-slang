import { memo, useCallback } from 'react';
import { Handle, Position, type NodeProps, type Node } from '@xyflow/react';
import { cn } from '@/shared/lib/utils';
import { ChevronRight, Check, X, Loader2, Sparkles, Cpu } from 'lucide-react';
import type { HintLevel, ProgressiveHintResponse } from '@/workers/proof-worker';
import { useHintStore } from '../../store';

/**
 * Data for a ghost tactic node
 */
export interface GhostTacticNodeData {
  kind: 'ghost';
  goalId: string;
  hint: ProgressiveHintResponse;
  isLoading: boolean;
  onAccept: () => void;
  onDismiss: () => void;
  onMoreDetail: () => void;
  [key: string]: unknown;
}

export type GhostTacticNode = Node<GhostTacticNodeData, 'ghost'>;

/**
 * Get display text for hint level
 */
function getLevelDisplay(level: HintLevel): string {
  switch (level) {
    case 'category':
      return 'Category Hint';
    case 'tactic':
      return 'Tactic Hint';
    case 'full':
      return 'Full Hint';
  }
}

/**
 * Get category display name
 */
function getCategoryDisplay(category?: string): string {
  switch (category) {
    case 'introduction':
      return 'Introduction';
    case 'elimination':
      return 'Elimination';
    case 'constructor':
      return 'Constructor';
    case 'application':
      return 'Application';
    default:
      return category || 'Unknown';
  }
}

/**
 * GhostTacticNode Component
 *
 * Displays a semi-transparent "ghost" tactic suggestion.
 * Shows progressive hints: category → tactic → full params.
 *
 * Features:
 * - Lightbulb icon indicates it's a hint
 * - "More detail" button to get next level
 * - Accept/Dismiss buttons
 * - Confidence indicator
 */
export const GhostTacticNode = memo(function GhostTacticNode({
  data,
  selected,
}: NodeProps<GhostTacticNode>) {
  const { hint, isLoading, onAccept, onDismiss, onMoreDetail } = data as GhostTacticNodeData;
  const hasApiKey = useHintStore((s) => !!s.apiKey);
  const isAIPowered = hasApiKey;

  const handleAccept = useCallback(() => {
    onAccept();
  }, [onAccept]);

  const handleDismiss = useCallback(() => {
    onDismiss();
  }, [onDismiss]);

  const handleMoreDetail = useCallback(() => {
    onMoreDetail();
  }, [onMoreDetail]);

  // Determine if we can show more detail
  const canShowMore = hint.level !== 'full';

  // Confidence color
  const confidenceColor =
    hint.confidence >= 0.8
      ? 'text-green-600'
      : hint.confidence >= 0.5
        ? 'text-amber-600'
        : 'text-gray-500';

  return (
    <div
      className={cn(
        'min-w-[180px] max-w-[280px] rounded-lg border-2 border-dashed',
        'border-purple-400 bg-purple-50/80 backdrop-blur-sm',
        'shadow-lg shadow-purple-200/50',
        'transition-all duration-200',
        selected && 'ring-2 ring-purple-500 ring-offset-2',
        isLoading && 'animate-pulse'
      )}
    >
      {/* Input handle (connects from goal) */}
      <Handle
        type="target"
        position={Position.Top}
        id="ghost-input"
        className="!h-3 !w-3 !border-2 !border-purple-400 !bg-purple-100"
      />

      {/* Header */}
      <div className="flex items-center justify-between border-b border-purple-200 px-3 py-2">
        <div className="flex items-center gap-2">
          {isAIPowered ? (
            <Sparkles className="h-4 w-4 text-purple-500" />
          ) : (
            <Cpu className="h-4 w-4 text-purple-500" />
          )}
          <span className="text-xs font-medium text-purple-700">
            {getLevelDisplay(hint.level)}
          </span>
          {/* AI/Rule badge */}
          <span className={cn(
            'rounded-full px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wide',
            isAIPowered
              ? 'bg-gradient-to-r from-purple-500 to-pink-500 text-white'
              : 'bg-gray-200 text-gray-600'
          )}>
            {isAIPowered ? 'AI' : 'Rule'}
          </span>
        </div>
        <span className={cn('text-[10px] font-medium', confidenceColor)}>
          {Math.round(hint.confidence * 100)}%
        </span>
      </div>

      {/* Content */}
      <div className="p-3">
        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-2">
            <Loader2 className="h-5 w-5 animate-spin text-purple-500" />
            <span className="mt-1 text-sm text-purple-600">
              {isAIPowered ? 'AI is analyzing...' : 'Analyzing...'}
            </span>
          </div>
        ) : (
          <>
            {/* Category level hint */}
            {hint.level === 'category' && hint.category && (
              <div className="mb-2">
                <span className="inline-block rounded-full bg-purple-200 px-2 py-0.5 text-sm font-semibold text-purple-700">
                  {getCategoryDisplay(hint.category)}
                </span>
              </div>
            )}

            {/* Tactic level hint */}
            {(hint.level === 'tactic' || hint.level === 'full') && hint.tacticType && (
              <div className="mb-2">
                <span className="inline-block rounded bg-purple-500 px-2 py-0.5 text-sm font-semibold text-white">
                  {hint.tacticType}
                </span>
                {hint.category && (
                  <span className="ml-2 text-xs text-purple-600">
                    ({getCategoryDisplay(hint.category)})
                  </span>
                )}
              </div>
            )}

            {/* Full level hint - show parameters */}
            {hint.level === 'full' && hint.parameters && Object.keys(hint.parameters).length > 0 && (
              <div className="mb-2 rounded bg-purple-100 p-2">
                {Object.entries(hint.parameters).map(([key, value]) => (
                  <div key={key} className="font-mono text-xs">
                    <span className="text-purple-600">{key}:</span>{' '}
                    <span className="text-purple-800">{value}</span>
                  </div>
                ))}
              </div>
            )}

            {/* Explanation */}
            <p className="text-xs text-gray-600 leading-relaxed">
              {hint.explanation}
            </p>
          </>
        )}
      </div>

      {/* Actions */}
      {!isLoading && (
        <div className="flex items-center justify-between border-t border-purple-200 px-2 py-2">
          <div className="flex gap-1">
            {/* Accept button - only show when we have a tactic */}
            {hint.tacticType && (
              <button
                onClick={handleAccept}
                className={cn(
                  'flex items-center gap-1 rounded px-2 py-1',
                  'bg-green-500 text-white text-xs font-medium',
                  'hover:bg-green-600 transition-colors'
                )}
              >
                <Check className="h-3 w-3" />
                Accept
              </button>
            )}

            {/* More detail button */}
            {canShowMore && (
              <button
                onClick={handleMoreDetail}
                className={cn(
                  'flex items-center gap-1 rounded px-2 py-1',
                  'bg-purple-500 text-white text-xs font-medium',
                  'hover:bg-purple-600 transition-colors'
                )}
              >
                <ChevronRight className="h-3 w-3" />
                More
              </button>
            )}
          </div>

          {/* Dismiss button */}
          <button
            onClick={handleDismiss}
            className={cn(
              'flex items-center gap-1 rounded px-2 py-1',
              'bg-gray-200 text-gray-600 text-xs',
              'hover:bg-gray-300 transition-colors'
            )}
          >
            <X className="h-3 w-3" />
          </button>
        </div>
      )}

      {/* Output handle (for visual connection to subgoals) */}
      <Handle
        type="source"
        position={Position.Bottom}
        id="ghost-output"
        className="!h-3 !w-3 !border-2 !border-purple-400 !bg-purple-100"
      />
    </div>
  );
});

GhostTacticNode.displayName = 'GhostTacticNode';
