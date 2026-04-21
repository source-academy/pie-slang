import { useEffect, useCallback, useState } from 'react';
import { Providers } from './providers';
import { ProofCanvas } from '@/features/proof-editor/components/ProofCanvas';
import { DetailPanel } from '@/features/proof-editor/components/panels/DetailPanel';
import { TacticPalette } from '@/features/proof-editor/components/panels/TacticPalette';
import { SourceCodePanel } from '@/features/proof-editor/components/panels/SourceCodePanel';
import { AISettingsPanel } from '@/features/proof-editor/components/panels/AISettingsPanel';
import { useProofSession } from '@/features/proof-editor/hooks/useProofSession';
import { useKeyboardShortcuts } from '@/features/proof-editor/hooks/useKeyboardShortcuts';
import { useProofStore } from '@/features/proof-editor/store';
import { useExampleStore } from '@/features/proof-editor/store/example-store';
import { useMetadataStore } from '@/features/proof-editor/store/metadata-store';
import { setApplyTacticCallback, type ApplyTacticOptions } from '@/features/proof-editor/utils/tactic-callback';
import { EXAMPLES } from '@/features/proof-editor/data/examples';

function readSourceCollapsed(): boolean {
  try { return localStorage.getItem('pie.sourceCollapsed') === '1'; } catch { return false; }
}

function writeSourceCollapsed(v: boolean) {
  try { localStorage.setItem('pie.sourceCollapsed', v ? '1' : '0'); } catch {}
}

function AppContent() {
  const { applyTactic, error, hasActiveSession } = useProofSession();
  const updateNode = useProofStore((s) => s.updateNode);
  const nodes = useProofStore((s) => s.nodes);
  const edges = useProofStore((s) => s.edges);
  const setManualPosition = useProofStore((s) => s.setManualPosition);
  const activeClaimName = useProofStore((s) => s.claimName);
  const sessionId = useProofStore((s) => s.sessionId);
  const [tacticError, setTacticError] = useState<string | null>(null);
  const [sourceCollapsed, setSourceCollapsed] = useState(readSourceCollapsed);
  const [aiPanelOpen, setAiPanelOpen] = useState(false);

  // Use keyboard shortcuts hook
  useKeyboardShortcuts();

  // Use example store
  const selectedExample = useExampleStore((s) => s.selectedExample);
  const selectExample = useExampleStore((s) => s.selectExample);

  // Use metadata store for global context (passed to DetailPanel)
  const globalContext = useMetadataStore((s) => s.globalContext);

  const handleCollapseSource = useCallback(() => {
    setSourceCollapsed(true);
    writeSourceCollapsed(true);
  }, []);

  const handleExpandSource = useCallback(() => {
    setSourceCollapsed(false);
    writeSourceCollapsed(false);
  }, []);

  // Set up the global callback for tactic application
  const handleApplyTactic = useCallback(async (options: ApplyTacticOptions) => {
    const { goalId, tacticType, params, tacticNodeId } = options;
    setTacticError(null);

    if (tacticNodeId) {
      const tacticNode = nodes.find(n => n.id === tacticNodeId);
      if (tacticNode) {
        const newTacticId = `tactic-for-${goalId}`;
        setManualPosition(newTacticId, { ...tacticNode.position });
      }
    }

    try {
      const result = await applyTactic(goalId, tacticType, params);
      if (!result.success) {
        const errorMsg = result.error || 'Tactic application failed';
        setTacticError(errorMsg);
        if (tacticNodeId) {
          updateNode(tacticNodeId, { status: 'error', errorMessage: errorMsg });
        }
      }
    } catch (e) {
      const errorMsg = e instanceof Error ? e.message : String(e);
      setTacticError(errorMsg);
      if (tacticNodeId) {
        updateNode(tacticNodeId, { status: 'error', errorMessage: errorMsg });
      }
    }
  }, [applyTactic, updateNode, nodes, setManualPosition]);

  useEffect(() => {
    setApplyTacticCallback(handleApplyTactic);
    return () => setApplyTacticCallback(null);
  }, [handleApplyTactic]);

  useEffect(() => {
    if (tacticError) {
      const timer = setTimeout(() => setTacticError(null), 5000);
      return () => clearTimeout(timer);
    }
  }, [tacticError]);

  const hasSession = Boolean(sessionId) || hasActiveSession;
  const openGoals = nodes.filter(n => n.type === 'goal' && (n.data as { status?: string }).status !== 'completed').length;
  const appliedTactics = nodes.filter(n => n.type === 'tactic' && (n.data as { status?: string }).status === 'applied').length;
  const displayError = tacticError || error;

  return (
    <div className="pe-app">

      {/* ============ TOP BAR ============ */}
      <header className="pe-topbar">
        <div className="pe-brand">
          <span className="pe-brand-pi">π</span>
          <span className="pe-brand-name">Pie</span>
          <span className="pe-brand-sub">· Proof Editor</span>
        </div>

        <div className="pe-sep" />

        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <span className="pe-tb-label">Example</span>
          <select
            className="pe-select"
            value={selectedExample}
            onChange={(e) => selectExample(e.target.value)}
          >
            <option value="">-- Select --</option>
            {EXAMPLES.map((ex) => (
              <option key={ex.id} value={ex.id}>{ex.name}</option>
            ))}
          </select>
        </div>

        {hasSession && (
          <>
            <div className="pe-sep" />
            <div className="pe-session-chip">
              <span className="chip-dot" />
              <span className="chip-muted">proving</span>
              <span className="chip-claim">{activeClaimName || '—'}</span>
            </div>
          </>
        )}

        <div className="pe-tb-right">
          {displayError ? (
            <span className="pe-error-pill">
              <span style={{ width: 6, height: 6, borderRadius: 3, background: 'var(--pe-err)', flexShrink: 0 }} />
              {displayError.length > 60 ? displayError.slice(0, 60) + '…' : displayError}
            </span>
          ) : (
            <span className="pe-auto-indicator" title="Source and canvas stay in sync automatically">
              <span className="pe-pulse" />
              Auto-sync on
            </span>
          )}
        </div>
      </header>

      {/* ============ MAIN 4-COLUMN GRID ============ */}
      <div className={`pe-main${sourceCollapsed ? ' source-collapsed' : ''}`}>

        {/* Collapsed stub */}
        <button
          className="pe-source-stub"
          onClick={handleExpandSource}
          title="Expand source panel"
          aria-label="Expand source panel"
        >
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round">
            <path d="M5 3l3 4-3 4" />
          </svg>
          <span className="pe-stub-label">Source</span>
          <span className="pe-stub-sync">
            <span style={{ display: 'block', width: 6, height: 6, borderRadius: 3, background: hasSession ? 'var(--pe-ok)' : 'var(--pe-faint)' }} />
          </span>
        </button>

        {/* Source rail */}
        <section className="pe-source">
          <SourceCodePanel
            onCollapse={handleCollapseSource}
          />
        </section>

        {/* Tactic palette */}
        <section className="pe-tactics">
          <TacticPalette />
        </section>

        {/* Canvas */}
        <section className="pe-canvas-wrap">
          <div className="pe-canvas-head">
            <div className="pe-breadcrumb">
              <span>proof</span>
              <svg width="10" height="10" viewBox="0 0 10 10" fill="none" stroke="#aaa" strokeWidth="1.6">
                <path d="M3.5 2l3 3-3 3" />
              </svg>
              <span className="cur">{activeClaimName || '—'}</span>
              {openGoals > 0 && (
                <>
                  <svg width="10" height="10" viewBox="0 0 10 10" fill="none" stroke="#aaa" strokeWidth="1.6">
                    <path d="M3.5 2l3 3-3 3" />
                  </svg>
                  <span style={{ color: 'var(--pe-goal-current)' }}>{openGoals} open goal{openGoals !== 1 ? 's' : ''}</span>
                </>
              )}
            </div>
            <div style={{ flex: 1 }} />
            <div className="pe-canvas-actions">
              <button className="pe-icon-btn" title="Auto-layout" id="pe-canvas-autolayout">
                <svg width="13" height="13" viewBox="0 0 13 13" fill="none" stroke="currentColor" strokeWidth="1.5">
                  <rect x="1" y="1" width="4" height="4" /><rect x="8" y="1" width="4" height="4" />
                  <rect x="4.5" y="8" width="4" height="4" />
                  <path d="M3 5v1.5h6.5V5M6.5 6.5V8" />
                </svg>
              </button>
              <button className="pe-icon-btn" title="Fit view" id="pe-canvas-fit">
                <svg width="13" height="13" viewBox="0 0 13 13" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
                  <path d="M1 4V1h3M12 4V1H9M1 9v3h3M12 9v3H9" />
                </svg>
              </button>
              <button
                className="pe-icon-btn"
                title="AI Hints settings"
                onClick={() => setAiPanelOpen((v) => !v)}
                style={aiPanelOpen ? { background: 'var(--pe-accent-soft)', color: 'var(--pe-accent)', borderColor: 'color-mix(in oklab, var(--pe-accent) 30%, var(--pe-line))' } : undefined}
              >
                <svg width="13" height="13" viewBox="0 0 13 13" fill="none" stroke="currentColor" strokeWidth="1.5">
                  <circle cx="6.5" cy="6.5" r="2" />
                  <path strokeLinecap="round" d="M6.5 1v1.5M6.5 10v1.5M1 6.5h1.5M10 6.5h1.5M2.6 2.6l1 1M9.4 9.4l1 1M9.4 2.6l-1 1M3.6 9.4l-1 1" />
                </svg>
              </button>
            </div>
          </div>

          {/* ReactFlow canvas — fills all remaining height */}
          <div style={{ flex: 1, minHeight: 0 }}>
            <ProofCanvas />
          </div>

          <div className="pe-canvas-status">
            {hasSession ? (
              <>
                <span className="pe-cs-item">
                  <span className="pe-cs-dot" />
                  {nodes.length} nodes · {edges.length} edges
                </span>
                {openGoals > 0 && (
                  <span className="pe-cs-item">{openGoals} open goal{openGoals !== 1 ? 's' : ''}</span>
                )}
                {appliedTactics > 0 && (
                  <span className="pe-cs-item">{appliedTactics} applied tactic{appliedTactics !== 1 ? 's' : ''}</span>
                )}
              </>
            ) : (
              <span className="pe-cs-item" style={{ color: 'var(--pe-faint)' }}>No active session · select an example or start a proof</span>
            )}
          </div>
        </section>

        {/* Detail rail */}
        <section className="pe-detail">
          <DetailPanel
            definitions={globalContext.definitions}
            theorems={globalContext.theorems}
          />
        </section>

      </div>
      {/* AI Settings flyout */}
      {aiPanelOpen && (
        <>
          <div
            style={{ position: 'fixed', inset: 0, zIndex: 39 }}
            onClick={() => setAiPanelOpen(false)}
          />
          <div className="pe-modal-overlay" style={{ pointerEvents: 'none' }}>
            <div className="pe-modal-panel" style={{ pointerEvents: 'auto' }}>
              <div className="pe-modal-head">
                <h3>AI Hints</h3>
                <button
                  className="pe-icon-btn"
                  onClick={() => setAiPanelOpen(false)}
                  style={{ border: 'none', background: 'none' }}
                >
                  <svg width="12" height="12" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round">
                    <path d="M2 2l8 8M10 2L2 10" />
                  </svg>
                </button>
              </div>
              <div className="pe-modal-body">
                <AISettingsPanel inModal />
              </div>
            </div>
          </div>
        </>
      )}

    </div>
  );
}

export function App() {
  return (
    <Providers>
      <AppContent />
    </Providers>
  );
}
