import { useState } from 'react';
import { cn } from '@/shared/lib/utils';
import { useUIStore } from '../../store';
import {
  getTacticsByCategory,
  CATEGORY_NAMES,
  type TacticInfo,
  type TacticCategory,
} from '../../data/tactics';
import type { GlobalContextEntry } from '@/workers/proof-worker';

/**
 * LeftSidebar Component
 *
 * Unified sidebar combining:
 * 1. Tactics (organized by category, draggable onto goals)
 * 2. Definitions (global definitions from source code)
 * 3. Theorems/Claims (proved theorems, draggable onto goals as lemmas)
 */

interface LeftSidebarProps {
  definitions: GlobalContextEntry[];
  theorems: GlobalContextEntry[];
}

export function LeftSidebar({ definitions, theorems }: LeftSidebarProps) {
  // Track which sections are expanded (all start expanded)
  const [expandedSections, setExpandedSections] = useState<Set<string>>(
    new Set(['tactics', 'definitions', 'theorems'])
  );

  // Track which tactic categories are expanded
  const [expandedCategories, setExpandedCategories] = useState<Set<TacticCategory>>(
    new Set(['introduction', 'elimination'])
  );

  const tacticsByCategory = getTacticsByCategory();

  const toggleSection = (section: string) => {
    setExpandedSections((prev) => {
      const next = new Set(prev);
      if (next.has(section)) {
        next.delete(section);
      } else {
        next.add(section);
      }
      return next;
    });
  };

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
    <div className="w-64 border-r bg-gray-50 flex flex-col overflow-hidden">
      {/* Header */}
      <div className="border-b bg-white p-3">
        <h2 className="font-semibold text-sm">Proof Tools</h2>
        <p className="text-xs text-gray-500 mt-1">Drag onto a goal to apply</p>
      </div>

      {/* Scrollable content */}
      <div className="flex-1 overflow-y-auto p-2 space-y-2">
        {/* Tactics Section */}
        <SectionHeader
          title="Tactics"
          expanded={expandedSections.has('tactics')}
          onToggle={() => toggleSection('tactics')}
        />
        {expandedSections.has('tactics') && (
          <div className="space-y-1 ml-1">
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
        )}

        {/* Definitions Section */}
        {definitions.length > 0 && (
          <>
            <SectionHeader
              title={`Definitions (${definitions.length})`}
              expanded={expandedSections.has('definitions')}
              onToggle={() => toggleSection('definitions')}
            />
            {expandedSections.has('definitions') && (
              <div className="space-y-0.5 ml-1">
                {definitions.map((def) => (
                  <ContextItemDraggable key={def.name} entry={def} />
                ))}
              </div>
            )}
          </>
        )}

        {/* Theorems/Claims Section */}
        {theorems.length > 0 && (
          <>
            <SectionHeader
              title={`Theorems & Claims (${theorems.length})`}
              expanded={expandedSections.has('theorems')}
              onToggle={() => toggleSection('theorems')}
            />
            {expandedSections.has('theorems') && (
              <div className="space-y-0.5 ml-1">
                {theorems.map((thm) => (
                  <ContextItemDraggable key={thm.name} entry={thm} canApply />
                ))}
              </div>
            )}
          </>
        )}

        {/* Empty state for definitions/theorems */}
        {definitions.length === 0 && theorems.length === 0 && (
          <div className="text-center py-4 text-gray-500 text-xs">
            Start a proof session to see definitions and theorems.
          </div>
        )}
      </div>
    </div>
  );
}

/**
 * Section header with collapse/expand toggle
 */
function SectionHeader({
  title,
  expanded,
  onToggle,
}: {
  title: string;
  expanded: boolean;
  onToggle: () => void;
}) {
  return (
    <button
      onClick={onToggle}
      className="flex w-full items-center justify-between p-2 text-left hover:bg-gray-100 rounded"
    >
      <span className="text-xs font-semibold text-gray-700 uppercase tracking-wide">
        {title}
      </span>
      <svg
        className={cn(
          'h-4 w-4 text-gray-400 transition-transform',
          expanded && 'rotate-180'
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
  );
}

/**
 * Category section for tactics (nested under Tactics section)
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
      <span className="text-sm font-mono">{tactic.displayName}</span>
      {tactic.requiresContextVar && (
        <span className="ml-auto text-[10px] text-purple-500" title="Requires context variable">
          ctx
        </span>
      )}
    </div>
  );
}

/**
 * Draggable context item (definition or theorem)
 * - Definitions: draggable for reference but not directly applicable
 * - Theorems: draggable and can be dropped on goals to apply as lemmas
 */
function ContextItemDraggable({
  entry,
  canApply = false,
}: {
  entry: GlobalContextEntry;
  canApply?: boolean;
}) {
  const [showType, setShowType] = useState(false);

  const handleDragStart = (e: React.DragEvent) => {
    // Set theorem/definition data for drop handling
    e.dataTransfer.setData('application/theorem-name', entry.name);
    e.dataTransfer.setData('application/theorem-type', entry.type);
    e.dataTransfer.setData('application/theorem-kind', entry.kind);
    e.dataTransfer.effectAllowed = 'copy';
  };

  const kindBadge = {
    definition: { bg: 'bg-purple-100', text: 'text-purple-700', label: 'def' },
    claim: { bg: 'bg-amber-100', text: 'text-amber-700', label: 'claim' },
    theorem: { bg: 'bg-green-100', text: 'text-green-700', label: 'thm' },
  }[entry.kind];

  return (
    <div
      draggable={canApply}
      onDragStart={canApply ? handleDragStart : undefined}
      onClick={() => setShowType(!showType)}
      className={cn(
        'group rounded px-2 py-1.5',
        'hover:bg-blue-50 border border-transparent hover:border-blue-200',
        canApply ? 'cursor-grab active:cursor-grabbing' : 'cursor-pointer'
      )}
    >
      <div className="flex items-center gap-2">
        <span className={cn('text-[10px] px-1 rounded', kindBadge.bg, kindBadge.text)}>
          {kindBadge.label}
        </span>
        <span className="font-mono text-sm font-medium truncate" title={entry.name}>
          {entry.name}
        </span>
        {canApply && (
          <span className="ml-auto text-[10px] text-green-600" title="Drag to goal to apply">
            ↗
          </span>
        )}
      </div>

      {/* Expandable type display */}
      {showType && (
        <div className="mt-1 pl-6">
          <div className="text-[10px] text-gray-500 mb-0.5">Type:</div>
          <div className="font-mono text-xs text-gray-700 bg-gray-100 rounded p-1 break-all">
            {entry.type}
          </div>
          <button
            onClick={(e) => {
              e.stopPropagation();
              navigator.clipboard.writeText(entry.name);
            }}
            className="mt-1 text-[10px] text-blue-600 hover:text-blue-800"
          >
            Copy name
          </button>
        </div>
      )}
    </div>
  );
}
