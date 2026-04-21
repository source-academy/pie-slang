import { useState } from 'react';
import { useProofStore, useUIStore } from '../../store';
import type { GoalNode } from '../../store/types';
import { TACTICS } from '../../data/tactics';
import type { GlobalEntry } from '@pie/protocol';

interface DetailPanelProps {
  definitions?: GlobalEntry[];
  theorems?: GlobalEntry[];
}

type Tab = 'details' | 'context' | 'history';

// Suggested tactics based on goal type heuristics
function getSuggestedTactics(goalType: string): string[] {
  const suggestions: string[] = [];
  if (goalType.includes('Pi') || goalType.includes('->')) suggestions.push('intro');
  if (goalType.includes('Sigma') || goalType.includes('Pair')) suggestions.push('split', 'exists');
  if (goalType.includes('Either')) suggestions.push('left', 'right');
  if (goalType.includes('= Nat') || goalType.includes('Nat')) suggestions.push('elimNat', 'exact');
  if (goalType.includes('= ')) suggestions.push('symm', 'cong');
  suggestions.push('exact');
  return [...new Set(suggestions)].slice(0, 5);
}

export function DetailPanel({ definitions = [], theorems = [] }: DetailPanelProps) {
  const [activeTab, setActiveTab] = useState<Tab>('details');
  const [selectedDef, setSelectedDef] = useState<string | null>(null);

  const selectedNodeId = useUIStore((s) => s.selectedNodeId);
  const selectNode = useUIStore((s) => s.selectNode);
  const nodes = useProofStore((s) => s.nodes);

  const selectedNode = nodes.find((n) => n.id === selectedNodeId);
  const goalNode = selectedNode?.type === 'goal'
    ? (selectedNode as GoalNode)
    : null;

  const suggestions = goalNode
    ? getSuggestedTactics(goalNode.data.goalType)
    : [];

  const hasContent = selectedNode || definitions.length > 0 || theorems.length > 0;

  return (
    <>
      {/* Tabs */}
      <div className="pe-detail-tabs">
        {(['details', 'context', 'history'] as Tab[]).map((tab) => (
          <button
            key={tab}
            className={`pe-detail-tab${activeTab === tab ? ' active' : ''}`}
            onClick={() => setActiveTab(tab)}
          >
            {tab.charAt(0).toUpperCase() + tab.slice(1)}
          </button>
        ))}
      </div>

      <div className="pe-detail-body">

        {/* ── DETAILS TAB ── */}
        {activeTab === 'details' && (
          <>
            {/* Selected node info */}
            {selectedNode ? (
              <div className="pe-d-section" style={{ paddingBottom: 10 }}>
                <div className="pe-d-section-hd">
                  <span className="pe-d-section-label">
                    {selectedNode.type === 'goal'
                      ? `Goal${goalNode?.data.status ? ` · ${goalNode.data.status}` : ''}`
                      : selectedNode.type === 'tactic'
                        ? 'Tactic'
                        : selectedNode.type}
                  </span>
                  <button
                    onClick={() => selectNode(null)}
                    style={{ border: 'none', background: 'none', cursor: 'pointer', color: 'var(--pe-faint)', padding: 2, borderRadius: 3 }}
                    title="Deselect"
                  >
                    <svg width="10" height="10" viewBox="0 0 10 10" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round">
                      <path d="M2 2l6 6M8 2L2 8" />
                    </svg>
                  </button>
                </div>

                {goalNode && (
                  <>
                    <div className="pe-big-type">{goalNode.data.goalType}</div>
                    <div className="pe-meta">
                      <span><b>ctx</b> {goalNode.data.context.length} var{goalNode.data.context.length !== 1 ? 's' : ''}</span>
                      {goalNode.data.parentGoalId && (
                        <span
                          style={{ cursor: 'pointer', color: 'var(--pe-accent)' }}
                          onClick={() => goalNode.data.parentGoalId && selectNode(goalNode.data.parentGoalId)}
                        >
                          ↑ parent
                        </span>
                      )}
                    </div>
                  </>
                )}

                {selectedNode.type === 'tactic' && (
                  <div style={{ fontFamily: 'var(--pe-mono-font)', fontSize: 13, fontWeight: 600, color: 'var(--pe-ink)', marginTop: 4 }}>
                    {(selectedNode.data as { displayName?: string }).displayName ?? 'tactic'}
                  </div>
                )}
              </div>
            ) : !hasContent && (
              <div className="pe-d-section" style={{ color: 'var(--pe-faint)', fontSize: 12 }}>
                Click a node to see details
              </div>
            )}

            {/* Suggested tactics (only when goal selected) */}
            {goalNode && suggestions.length > 0 && (
              <div className="pe-d-section">
                <div className="pe-d-section-hd">
                  <span className="pe-d-section-label">Suggested tactics</span>
                </div>
                <div className="pe-suggested">
                  {suggestions.map((name) => (
                    <span key={name} className="pe-chip" title={TACTICS.find(t => t.type === name)?.description}>
                      {name}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Definitions */}
            {definitions.length > 0 && (
              <div className="pe-d-section">
                <div className="pe-d-section-hd">
                  <span className="pe-d-section-label">Definitions</span>
                  <span className="pe-d-section-count">{definitions.length}</span>
                </div>
                {definitions.map((def) => (
                  <ContextItem
                    key={def.name}
                    entry={def}
                    kind="def"
                    isSelected={selectedDef === def.name}
                    onClick={() => setSelectedDef(selectedDef === def.name ? null : def.name)}
                  />
                ))}
              </div>
            )}

            {/* Theorems & claims */}
            {theorems.length > 0 && (
              <div className="pe-d-section">
                <div className="pe-d-section-hd">
                  <span className="pe-d-section-label">Theorems &amp; claims</span>
                  <span className="pe-d-section-count">{theorems.length}</span>
                </div>
                {theorems.map((thm) => (
                  <ContextItem
                    key={thm.name}
                    entry={thm}
                    kind={thm.kind === 'claim' ? 'claim' : 'thm'}
                    isSelected={selectedDef === thm.name}
                    onClick={() => setSelectedDef(selectedDef === thm.name ? null : thm.name)}
                  />
                ))}
              </div>
            )}

            {!selectedNode && definitions.length === 0 && theorems.length === 0 && (
              <div className="pe-d-section" style={{ color: 'var(--pe-faint)', fontSize: 12 }}>
                No definitions yet · start a proof session to see context
              </div>
            )}
          </>
        )}

        {/* ── CONTEXT TAB ── */}
        {activeTab === 'context' && (
          <>
            {goalNode ? (
              <div className="pe-d-section">
                <div className="pe-d-section-hd">
                  <span className="pe-d-section-label">Local context</span>
                  <span className="pe-d-section-count">{goalNode.data.context.length}</span>
                </div>
                {goalNode.data.context.length === 0 ? (
                  <div style={{ color: 'var(--pe-faint)', fontSize: 12, fontStyle: 'italic' }}>No bindings in scope</div>
                ) : (
                  goalNode.data.context.map((entry) => (
                    <div key={entry.id} className="pe-ctx-row">
                      <span>
                        <span className="pe-ctx-var">{entry.name}</span>
                        <span className="pe-ctx-type"> : {entry.type}</span>
                      </span>
                      {entry.origin === 'introduced' && (
                        <span style={{
                          fontSize: 9.5,
                          padding: '1px 5px',
                          borderRadius: 99,
                          background: 'color-mix(in oklab, var(--pe-accent) 10%, white)',
                          color: 'var(--pe-accent)',
                          border: '1px solid color-mix(in oklab, var(--pe-accent) 22%, white)',
                          fontFamily: 'var(--pe-mono-font)',
                        }}>
                          intro
                        </span>
                      )}
                    </div>
                  ))
                )}
              </div>
            ) : (
              <div className="pe-d-section" style={{ color: 'var(--pe-faint)', fontSize: 12 }}>
                Select a goal node to see its local context
              </div>
            )}
          </>
        )}

        {/* ── HISTORY TAB ── */}
        {activeTab === 'history' && (
          <div className="pe-d-section" style={{ color: 'var(--pe-faint)', fontSize: 12 }}>
            Proof history coming soon
          </div>
        )}

      </div>
    </>
  );
}

function ContextItem({
  entry,
  kind,
  isSelected,
  onClick,
}: {
  entry: GlobalEntry;
  kind: 'def' | 'thm' | 'claim';
  isSelected: boolean;
  onClick: () => void;
}) {
  return (
    <div
      className={`pe-d-row${isSelected ? ' active' : ''}`}
      onClick={onClick}
    >
      <span className={`pe-kindtag ${kind}`}>{kind}</span>
      <span className="pe-d-name">{entry.name}</span>
      <span className="pe-d-type" title={entry.type}>{entry.type}</span>
    </div>
  );
}
