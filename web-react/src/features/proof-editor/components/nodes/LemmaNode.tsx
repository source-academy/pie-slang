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
/**
 * Helper to extract parameter names from a Pi type string
 * e.g., "(Pi (x Nat) (Pi (y Nat) ...))" -> ["x", "y"]
 */
export function extractParameters(typeString: string): string[] {
  const params: string[] = [];
  const regex = /\(Pi\s+\(\s*([^\s)]+)\s+[^)]+\)/g;
  let match;
  while ((match = regex.exec(typeString)) !== null) {
    params.push(match[1]);
  }
  return params;
}

export const LemmaNode = memo(function LemmaNode({
  data,
  selected,
}: NodeProps<LemmaNodeType>) {
  const sourceLabels = {
    definition: 'def',
    claim: 'claim',
    proven: 'proven',
  };

  const parameters = extractParameters(data.type);

  return (
    <div
      className={cn(
        'min-w-[160px] max-w-[240px] rounded-md border-2 border-lemma bg-green-50 p-2 shadow-sm transition-all relative',
        selected && 'ring-2 ring-primary ring-offset-2'
      )}
    >
      {/* Target handles for parameterized arguments */}
      {parameters.length > 0 ? (
        <div className="absolute -top-3 left-0 w-full flex justify-evenly">
          {parameters.map((param) => (
            <div key={param} className="relative flex flex-col items-center group">
              <span className="absolute -top-5 text-[10px] bg-white px-1 shadow-sm rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-10 pointer-events-none">
                {param}
              </span>
              <Handle
                type="target"
                position={Position.Top}
                id={`lemma-input-${param}`}
                className="!h-3 !w-3 !border-2 !border-lemma !bg-white relative !transform-none !top-0 !left-0"
              />
            </div>
          ))}
        </div>
      ) : (
        /* Single input handle for direct application (0-argument theorems) */
        <Handle
          type="target"
          position={Position.Top}
          id="lemma-input"
          className="!h-3 !w-3 !border-2 !border-lemma !bg-white"
        />
      )}

      {/* Header with source badge */}
      <div className="mb-1 flex items-center justify-between mt-1">
        <span className="text-sm font-semibold text-green-800">
          {data.name}
        </span>
        <span className="rounded bg-lemma px-1.5 py-0.5 text-xs font-medium text-white tracking-wide">
          {sourceLabels[data.source]}
        </span>
      </div>

      {/* Lemma type */}
      <div className="rounded bg-white/50 p-1.5 font-mono text-[10px] text-gray-700 break-all leading-tight">
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
