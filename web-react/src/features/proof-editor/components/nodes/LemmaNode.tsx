import { memo } from 'react';
import { Handle, Position, type NodeProps } from '@xyflow/react';
import { cn } from '@/shared/lib/utils';
import type { LemmaNode as LemmaNodeType } from '../../store/types';

/**
 * LemmaNode Component
 *
 * Displays a lemma or theorem that can be used in proofs.
 * Green styling to indicate it's a proven/available fact.
 */
export const LemmaNode = memo(function LemmaNode({
  data,
  selected,
}: NodeProps<LemmaNodeType>) {
  const sourceLabels = {
    definition: 'def',
    claim: 'claim',
    proven: 'proven',
  };

  return (
    <div
      className={cn(
        'min-w-[160px] max-w-[240px] rounded-md border-2 border-lemma bg-green-50 p-2 shadow-sm transition-all',
        selected && 'ring-2 ring-primary ring-offset-2'
      )}
    >
      {/* Header with source badge */}
      <div className="mb-1 flex items-center justify-between">
        <span className="text-sm font-semibold text-green-800">
          {data.name}
        </span>
        <span className="rounded bg-lemma px-1.5 py-0.5 text-xs font-medium text-white">
          {sourceLabels[data.source]}
        </span>
      </div>

      {/* Lemma type */}
      <div className="rounded bg-white/50 p-1.5 font-mono text-xs text-gray-700">
        {data.type}
      </div>

      {/* Output handle (to tactic using this lemma) */}
      <Handle
        type="source"
        position={Position.Bottom}
        id="lemma-output"
        className="!h-3 !w-3 !border-2 !border-lemma !bg-white"
      />
    </div>
  );
});

LemmaNode.displayName = 'LemmaNode';
