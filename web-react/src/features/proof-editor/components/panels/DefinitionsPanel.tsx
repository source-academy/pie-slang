import { useState } from 'react';
import { cn } from '@/shared/lib/utils';
import type { GlobalContextEntry } from '@/workers/proof-worker';

interface DefinitionsPanelProps {
  definitions: GlobalContextEntry[];
  theorems: GlobalContextEntry[];
  onSelect?: (name: string) => void;
  collapsed?: boolean;
  onToggleCollapse?: () => void;
}

/**
 * DefinitionsPanel Component
 *
 * A collapsible right sidebar showing global definitions and theorems
 * from the source code. Users can click on items to see their types
 * and copy names for use in expressions.
 */
export function DefinitionsPanel({
  definitions,
  theorems,
  onSelect,
  collapsed = false,
  onToggleCollapse,
}: DefinitionsPanelProps) {
  const [expandedSection, setExpandedSection] = useState<'definitions' | 'theorems' | null>('definitions');
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
        {/* Definitions Section */}
        {definitions.length > 0 && (
          <Section
            title="Definitions"
            count={definitions.length}
            expanded={expandedSection === 'definitions'}
            onToggle={() => setExpandedSection(expandedSection === 'definitions' ? null : 'definitions')}
          >
            {definitions.map((def) => (
              <ContextItem
                key={def.name}
                entry={def}
                isSelected={selectedItem === def.name}
                onClick={() => handleItemClick(def.name)}
              />
            ))}
          </Section>
        )}

        {/* Theorems Section */}
        {theorems.length > 0 && (
          <Section
            title="Theorems & Claims"
            count={theorems.length}
            expanded={expandedSection === 'theorems'}
            onToggle={() => setExpandedSection(expandedSection === 'theorems' ? null : 'theorems')}
          >
            {theorems.map((thm) => (
              <ContextItem
                key={thm.name}
                entry={thm}
                isSelected={selectedItem === thm.name}
                onClick={() => handleItemClick(thm.name)}
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
 * Collapsible section header
 */
function Section({
  title,
  count,
  expanded,
  onToggle,
  children,
}: {
  title: string;
  count: number;
  expanded: boolean;
  onToggle: () => void;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded border bg-white">
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
 * Individual context item (definition or theorem)
 */
function ContextItem({
  entry,
  isSelected,
  onClick,
}: {
  entry: GlobalContextEntry;
  isSelected: boolean;
  onClick: () => void;
}) {
  const kindBadge = {
    definition: { bg: 'bg-purple-100', text: 'text-purple-700', label: 'def' },
    claim: { bg: 'bg-amber-100', text: 'text-amber-700', label: 'claim' },
    theorem: { bg: 'bg-green-100', text: 'text-green-700', label: 'thm' },
  }[entry.kind];

  return (
    <div
      onClick={onClick}
      className={cn(
        'group cursor-pointer rounded px-2 py-1.5',
        'hover:bg-blue-50 border border-transparent hover:border-blue-200',
        isSelected && 'bg-blue-50 border-blue-200'
      )}
    >
      <div className="flex items-center gap-2">
        <span className={cn('text-[10px] px-1 rounded', kindBadge.bg, kindBadge.text)}>
          {kindBadge.label}
        </span>
        <span className="font-mono text-sm font-medium truncate" title={entry.name}>
          {entry.name}
        </span>
      </div>

      {/* Show type when selected */}
      {isSelected && (
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
