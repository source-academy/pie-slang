import { useState } from 'react';
import { cn } from '@/shared/lib/utils';
import { useUIStore } from '../../store';
import {
  getTacticsByCategory,
  CATEGORY_NAMES,
  type TacticInfo,
  type TacticCategory,
} from '../../data/tactics';

/**
 * TacticPalette Component
 *
 * A collapsible side panel displaying available tactics organized by category.
 * Tactics can be dragged onto the canvas to create new tactic nodes.
 */
export function TacticPalette() {
  const [expandedCategories, setExpandedCategories] = useState<Set<TacticCategory>>(
    new Set(['introduction', 'elimination'])
  );
  const tacticsByCategory = getTacticsByCategory();

  const toggleCategory = (category: TacticCategory) => {
    setExpandedCategories((prev) => {
      const next = new Set(prev);
      if (next.has(category)) {
        next.delete(category);
      } else {
        next.add(category);
      }
      return next;
    });
  };

  return (
    <div className="w-56 border-r bg-gray-50 overflow-y-auto">
      {/* Header */}
      <div className="border-b bg-white p-3">
        <h2 className="font-semibold text-sm">Tactics</h2>
        <p className="text-xs text-gray-500 mt-1">Drag onto a goal</p>
      </div>

      {/* Categories */}
      <div className="p-2 space-y-1">
        {(Object.keys(tacticsByCategory) as TacticCategory[]).map((category) => (
          <CategorySection
            key={category}
            category={category}
            tactics={tacticsByCategory[category]}
            isExpanded={expandedCategories.has(category)}
            onToggle={() => toggleCategory(category)}
          />
        ))}
      </div>
    </div>
  );
}

/**
 * Category section with collapsible tactic list
 */
function CategorySection({
  category,
  tactics,
  isExpanded,
  onToggle,
}: {
  category: TacticCategory;
  tactics: TacticInfo[];
  isExpanded: boolean;
  onToggle: () => void;
}) {
  return (
    <div className="rounded border bg-white">
      {/* Category header */}
      <button
        onClick={onToggle}
        className="flex w-full items-center justify-between p-2 text-left hover:bg-gray-50"
      >
        <span className="text-xs font-medium text-gray-700">
          {CATEGORY_NAMES[category]}
        </span>
        <svg
          className={cn(
            'h-4 w-4 text-gray-400 transition-transform',
            isExpanded && 'rotate-180'
          )}
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M19 9l-7 7-7-7"
          />
        </svg>
      </button>

      {/* Tactic list */}
      {isExpanded && (
        <div className="border-t px-1 py-1 space-y-0.5">
          {tactics.map((tactic) => (
            <DraggableTactic key={tactic.type} tactic={tactic} />
          ))}
        </div>
      )}
    </div>
  );
}

/**
 * Individual draggable tactic item
 */
function DraggableTactic({ tactic }: { tactic: TacticInfo }) {
  const setDraggingTactic = useUIStore((s) => s.setDraggingTactic);
  const clearDragState = useUIStore((s) => s.clearDragState);

  const handleDragStart = (e: React.DragEvent) => {
    // Set the tactic type as drag data
    e.dataTransfer.setData('application/tactic-type', tactic.type);
    e.dataTransfer.effectAllowed = 'copy';
    setDraggingTactic(tactic.type);
  };

  const handleDragEnd = () => {
    clearDragState();
  };

  return (
    <div
      draggable
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
      className={cn(
        'group flex items-center gap-2 rounded px-2 py-1.5 cursor-grab',
        'hover:bg-blue-50 active:cursor-grabbing',
        'border border-transparent hover:border-blue-200'
      )}
      title={tactic.description}
    >
      {/* Tactic icon/badge */}
      <span
        className={cn(
          'flex h-5 w-5 items-center justify-center rounded text-[10px] font-bold',
          tactic.requiresContextVar
            ? 'bg-purple-100 text-purple-700'
            : 'bg-blue-100 text-blue-700'
        )}
      >
        {tactic.displayName.charAt(0).toUpperCase()}
      </span>

      {/* Tactic name */}
      <span className="text-sm font-mono">{tactic.displayName}</span>

      {/* Context indicator */}
      {tactic.requiresContextVar && (
        <span className="ml-auto text-[10px] text-purple-500" title="Requires context variable">
          ctx
        </span>
      )}
    </div>
  );
}
