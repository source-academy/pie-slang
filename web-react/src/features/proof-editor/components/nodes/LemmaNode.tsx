import { memo, useState } from 'react';
import { Handle, Position, useEdges, type NodeProps } from '@xyflow/react';
import { cn } from '@/shared/lib/utils';
import { Lock, BookOpen, ShieldCheck } from 'lucide-react';
import type { LemmaNode as LemmaNodeType } from '../../store/types';

/**
 * Helper to extract parameter names and types from a Pi type string.
 * Handles both `(Π ((x Nat)) ...)` and `(Pi ((x Nat)) ...)`.
 * Returns [{ name, type }] for each Pi binder.
 */
export function extractParameters(typeString: string): string[] {
  if (!typeString) return [];
  const params: string[] = [];
  const regex = /\((?:Pi|Π)\s+\(\s*\(?\s*([^)\s]+)\s+[^)]+\)?\)/g;
  let match;
  while ((match = regex.exec(typeString)) !== null) {
    params.push(match[1]);
  }
  return params;
}

/**
 * Extract the result type (the part after all Pi binders).
 * e.g. "(Π ((n Nat)) (= Nat (+ n 0) n))" → "(= Nat (+ n 0) n)"
 */
function extractResultType(typeString: string): string {
  if (!typeString) return typeString;
  // Strip outermost Pi layers iteratively
  let s = typeString.trim();
  // Match (Π ((var Type)) REST) pattern and extract REST
  const piRegex = /^\((?:Pi|Π)\s+\(\(?[^)]+\)?\)\s+(.+)\)$/s;
  let match = s.match(piRegex);
  while (match) {
    s = match[1].trim();
    match = s.match(piRegex);
  }
  return s;
}

/**
 * LemmaNode Component
 *
 * Displays a lemma or theorem that can be used in proofs.
 * - Green styling for proven theorems, purple for definitions
 * - Hover tooltip shows full type signature
 * - Parameter handles show bound/unbound state via edge inspection
 * - Output handle connects to goals for direct application
 */
export const LemmaNode = memo(function LemmaNode({
  id,
  data,
  selected,
}: NodeProps<LemmaNodeType>) {
  const [showTooltip, setShowTooltip] = useState(false);
  const allEdges = useEdges();

  const sourceLabels: Record<string, string> = {
    definition: 'def',
    claim: 'claim',
    proven: 'thm',
  };

  const sourceColors: Record<string, { border: string; bg: string; badge: string }> = {
    definition: { border: 'border-purple-400', bg: 'bg-purple-50', badge: 'bg-purple-500' },
    claim: { border: 'border-gray-400', bg: 'bg-gray-50', badge: 'bg-gray-500' },
    proven: { border: 'border-lemma', bg: 'bg-green-50', badge: 'bg-lemma' },
  };

  const colors = sourceColors[data.source] || sourceColors.proven;
  const parameters = extractParameters(data.type);
  const resultType = parameters.length > 0 ? extractResultType(data.type) : data.type;

  // Check which parameters are bound (have incoming context-to-lemma edges)
  const boundParams = new Map<string, string>(); // paramName → contextVarName
  for (const edge of allEdges) {
    if (edge.target === id && edge.data?.kind === 'context-to-lemma' && edge.targetHandle) {
      const paramName = edge.targetHandle.replace('lemma-input-', '');
      boundParams.set(paramName, (edge.data as any).contextVarId || '?');
    }
  }

  return (
    <div
      className={cn(
        'min-w-[160px] max-w-[260px] rounded-md border-2 p-2 shadow-sm transition-all relative',
        colors.border,
        colors.bg,
        selected && 'ring-2 ring-primary ring-offset-2'
      )}
      onMouseEnter={() => setShowTooltip(true)}
      onMouseLeave={() => setShowTooltip(false)}
    >
      {/* Full type tooltip on hover */}
      {showTooltip && data.type && (
        <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 z-50 pointer-events-none">
          <div className="bg-gray-900 text-white text-[10px] font-mono px-3 py-2 rounded-lg shadow-lg max-w-[320px] whitespace-pre-wrap leading-relaxed">
            <div className="text-green-300 font-semibold mb-1">{data.name}</div>
            <div>{data.type}</div>
          </div>
        </div>
      )}

      {/* Target handles for parameterized arguments */}
      {parameters.length > 0 ? (
        <div className="absolute -top-3 left-0 w-full flex justify-evenly">
          {parameters.map((param) => {
            const isBound = boundParams.has(param);
            return (
              <div key={param} className="relative flex flex-col items-center group">
                {/* Parameter label - always visible for Pi-type theorems */}
                <span className={cn(
                  "absolute -top-5 text-[10px] px-1 shadow-sm rounded whitespace-nowrap z-10 pointer-events-none transition-all",
                  isBound
                    ? "bg-green-100 text-green-700 font-semibold opacity-100"
                    : "bg-white text-gray-500 opacity-70 group-hover:opacity-100"
                )}>
                  {param}{isBound ? ' ✓' : ''}
                </span>
                <Handle
                  type="target"
                  position={Position.Top}
                  id={`lemma-input-${param}`}
                  className={cn(
                    "!h-3 !w-3 !border-2 relative !transform-none !top-0 !left-0",
                    isBound
                      ? "!border-green-500 !bg-green-200"
                      : "!border-lemma !bg-white"
                  )}
                />
              </div>
            );
          })}
        </div>
      ) : (
        /* Single input handle for direct application (0-argument theorems) */
        <Handle
          type="target"
          position={Position.Top}
          id="lemma-input"
          className={cn("!h-3 !w-3 !border-2 !bg-white", colors.border.replace('border-', '!border-'))}
        />
      )}

      {/* Header with source badge and scope isolation indicator */}
      <div className="mb-1 flex items-center justify-between mt-1">
        <div className="flex items-center gap-1.5 min-w-0">
          {/* Scope isolation icon for proven theorems */}
          {data.source === 'proven' && (
            <Lock className="h-3 w-3 text-green-600 shrink-0" />
          )}
          {data.source === 'definition' && (
            <BookOpen className="h-3 w-3 text-purple-500 shrink-0" />
          )}
          <span className={cn(
            "text-sm font-semibold truncate",
            data.source === 'proven' ? 'text-green-800' : data.source === 'definition' ? 'text-purple-800' : 'text-gray-700'
          )}>
            {data.name}
          </span>
        </div>
        <span className={cn("rounded px-1.5 py-0.5 text-xs font-medium text-white tracking-wide shrink-0", colors.badge)}>
          {sourceLabels[data.source] || data.source}
        </span>
      </div>
      {/* Scope isolation tooltip for proven theorems */}
      {data.source === 'proven' && (
        <div className="flex items-center gap-1 mb-1 px-0.5">
          <ShieldCheck className="h-2.5 w-2.5 text-green-500" />
          <span className="text-[9px] text-green-600 italic">sealed — internal variables not accessible</span>
        </div>
      )}

      {/* Type display: show result type compactly, parameters shown via handles */}
      {parameters.length > 0 ? (
        <div className="space-y-1">
          {/* Parameter summary */}
          <div className="flex flex-wrap gap-1">
            {parameters.map((param) => {
              const isBound = boundParams.has(param);
              return (
                <span key={param} className={cn(
                  "inline-flex items-center rounded px-1.5 py-0.5 text-[10px] font-mono",
                  isBound ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-500"
                )}>
                  {param}{isBound ? ' ✓' : ' ?'}
                </span>
              );
            })}
          </div>
          {/* Result type */}
          <div className="rounded bg-white/50 p-1.5 font-mono text-[10px] text-gray-700 break-all leading-tight">
            → {resultType}
          </div>
        </div>
      ) : (
        <div className="rounded bg-white/50 p-1.5 font-mono text-[10px] text-gray-700 break-all leading-tight">
          {data.type}
        </div>
      )}

      {/* Output handle (to goal for direct application) */}
      <Handle
        type="source"
        position={Position.Bottom}
        id="lemma-output"
        className={cn("!h-3 !w-3 !border-2 !bg-white", colors.border.replace('border-', '!border-'))}
      />
    </div>
  );
});

LemmaNode.displayName = 'LemmaNode';
