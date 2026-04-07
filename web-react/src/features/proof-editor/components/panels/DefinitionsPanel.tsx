import { useState } from 'react';
import { cn } from '@/shared/lib/utils';
import type { GlobalEntry } from '@pie/protocol';

interface DefinitionsPanelProps {
  definitions: GlobalEntry[];
  theorems: GlobalEntry[];
  onSelect?: (name: string) => void;
  collapsed?: boolean;
  onToggleCollapse?: () => void;
}

/**
 * DefinitionsPanel Component
 *
 * Scratch-style theorem library zone showing global definitions and theorems.
 * Theorems/claims can be dragged onto the proof canvas as lemma blocks.
 * Visual style uses Scratch-like colored blocks with notch indicators.
 */
export function DefinitionsPanel({
  definitions,
  theorems,
  onSelect,
  collapsed = false,
  onToggleCollapse,
}: DefinitionsPanelProps) {
  const [expandedSection, setExpandedSection] = useState<'definitions' | 'theorems' | null>('theorems');
  const [selectedItem, setSelectedItem] = useState<string | null>(null);

  const handleItemClick = (name: string) => {
    setSelectedItem(selectedItem === name ? null : name);
    onSelect?.(name);
  };

  if (collapsed) {
    return (
      <div className="w-10 border-l bg-gray-50 flex flex-col items-center pt-2">
        <button
          onClick={onToggleCollapse}
          className="p-2 rounded hover:bg-gray-200"
          title="Expand sidebar"
        >
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 19l-7-7 7-7m8 14l-7-7 7-7" />
          </svg>
        </button>
      </div>
    );
  }

  return (
    <div className="w-64 border-l bg-gray-50 flex flex-col overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between border-b bg-white p-3">
        <h2 className="font-semibold text-sm">Context</h2>
        {onToggleCollapse && (
          <button
            onClick={onToggleCollapse}
            className="p-1 rounded hover:bg-gray-100"
            title="Collapse sidebar"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 5l7 7-7 7M5 5l7 7-7 7" />
            </svg>
          </button>
        )}
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-2 space-y-2">
        {/* Theorem Library Zone */}
        {theorems.length > 0 && (
          <Section
            title="Theorem Library"
            count={theorems.length}
            expanded={expandedSection === 'theorems'}
            onToggle={() => setExpandedSection(expandedSection === 'theorems' ? null : 'theorems')}
            accentColor="green"
          >
            <div className="text-[10px] text-gray-400 px-1 mb-1">
              Drag onto canvas to use as lemma
            </div>
            {theorems.map((thm) => (
              <TheoremBlock
                key={thm.name}
                entry={thm}
                isSelected={selectedItem === thm.name}
                onClick={() => handleItemClick(thm.name)}
              />
            ))}
          </Section>
        )}

        {/* Definitions Section */}
        {definitions.length > 0 && (
          <Section
            title="Definitions"
            count={definitions.length}
            expanded={expandedSection === 'definitions'}
            onToggle={() => setExpandedSection(expandedSection === 'definitions' ? null : 'definitions')}
            accentColor="purple"
          >
            {definitions.map((def) => (
              <DefinitionBlock
                key={def.name}
                entry={def}
                isSelected={selectedItem === def.name}
                onClick={() => handleItemClick(def.name)}
              />
            ))}
          </Section>
        )}

        {/* Empty state */}
        {definitions.length === 0 && theorems.length === 0 && (
          <div className="text-center py-8 text-gray-500 text-sm">
            No definitions or theorems available.
            <br />
            Start a proof session to see context.
          </div>
        )}
      </div>
    </div>
  );
}

/**
 * Collapsible section with accent color
 */
function Section({
  title,
  count,
  expanded,
  onToggle,
  accentColor,
  children,
}: {
  title: string;
  count: number;
  expanded: boolean;
  onToggle: () => void;
  accentColor: 'green' | 'purple';
  children: React.ReactNode;
}) {
  const accentStyles = {
    green: 'border-l-green-400',
    purple: 'border-l-purple-400',
  };

  return (
    <div className={cn("rounded border bg-white border-l-[3px]", accentStyles[accentColor])}>
      <button
        onClick={onToggle}
        className="flex w-full items-center justify-between p-2 text-left hover:bg-gray-50"
      >
        <span className="text-xs font-medium text-gray-700">
          {title}
          <span className="ml-1 text-gray-400">({count})</span>
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

      {expanded && (
        <div className="border-t px-1 py-1 space-y-0.5">
          {children}
        </div>
      )}
    </div>
  );
}

/**
 * Scratch-style theorem block — draggable onto canvas
 */
function TheoremBlock({
  entry,
  isSelected,
  onClick,
}: {
  entry: GlobalEntry;
  isSelected: boolean;
  onClick: () => void;
}) {
  const isProven = entry.kind === 'theorem';

  const handleDragStart = (e: React.DragEvent) => {
    e.dataTransfer.setData('application/theorem-name', entry.name);
    e.dataTransfer.setData('application/theorem-type', entry.type);
    e.dataTransfer.setData('application/theorem-kind', entry.kind);
    e.dataTransfer.effectAllowed = 'copy';
  };

  return (
    <div
      draggable
      onDragStart={handleDragStart}
      onClick={onClick}
      className={cn(
        'group rounded-md border-2 px-2 py-1.5 cursor-grab active:cursor-grabbing transition-all',
        isProven
          ? 'border-green-300 bg-green-50 hover:border-green-400 hover:shadow-sm'
          : 'border-amber-300 bg-amber-50 hover:border-amber-400 hover:shadow-sm',
        isSelected && 'ring-2 ring-primary ring-offset-1',
      )}
    >
      <div className="flex items-center gap-2">
        {/* Scratch-style notch indicator */}
        <div className={cn(
          "w-1.5 h-4 rounded-sm flex-shrink-0",
          isProven ? "bg-green-400" : "bg-amber-400",
        )} />
        <span className={cn(
          "text-[10px] px-1 rounded font-medium",
          isProven ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700',
        )}>
          {isProven ? 'thm' : 'claim'}
        </span>
        <span className="font-mono text-sm font-medium truncate" title={entry.name}>
          {entry.name}
        </span>
        <span className="ml-auto text-[10px] text-gray-400 group-hover:text-green-600 transition-colors">
          ↗
        </span>
      </div>

      {/* Show type when selected */}
      {isSelected && (
        <div className="mt-1.5 pl-5">
          <div className="font-mono text-[10px] text-gray-600 bg-white/70 rounded p-1.5 break-all leading-relaxed">
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

/**
 * Definition block — global context, non-draggable
 */
function DefinitionBlock({
  entry,
  isSelected,
  onClick,
}: {
  entry: GlobalContextEntry;
  isSelected: boolean;
  onClick: () => void;
}) {
  return (
    <div
      onClick={onClick}
      className={cn(
        'group rounded px-2 py-1.5 cursor-pointer transition-all',
        'border border-purple-200 bg-purple-50/50 hover:bg-purple-50 hover:border-purple-300',
        isSelected && 'bg-purple-50 border-purple-300',
      )}
    >
      <div className="flex items-center gap-2">
        <div className="w-1.5 h-4 rounded-sm flex-shrink-0 bg-purple-400" />
        <span className="text-[10px] px-1 rounded bg-purple-100 text-purple-700 font-medium">
          def
        </span>
        <span className="font-mono text-sm font-medium truncate text-purple-800" title={entry.name}>
          {entry.name}
        </span>
      </div>

      {/* Show type when selected */}
      {isSelected && (
        <div className="mt-1.5 pl-5">
          <div className="font-mono text-[10px] text-gray-600 bg-white/70 rounded p-1.5 break-all leading-relaxed">
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
