import { useState, useCallback, useEffect, useRef } from 'react';
import Editor, { type OnMount, type BeforeMount, type Monaco } from '@monaco-editor/react';
import { useProofSession } from '../../hooks/useProofSession';
import { useGeneratedProofScript } from '../../store';
import { useExampleStore } from '../../store/example-store';

const SAMPLE_SOURCE = `; Define addition function
(claim + (-> Nat Nat Nat))
(define +
  (lambda (n m)
    (rec-Nat n
      m
      (lambda (n-1 +n-1)
        (add1 +n-1)))))

; Prove that n = n for all Nat
(claim reflexivity
  (Pi ((n Nat))
    (= Nat n n)))
`;

const PIE_GUARD = '__pieLanguageRegistered' as const;

function registerPieLanguage(monaco: Monaco) {
  const langs = monaco.languages.getLanguages();
  if (langs.find((l: { id: string }) => l.id === 'pie')) return;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  if ((monaco as any)[PIE_GUARD]) return;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  (monaco as any)[PIE_GUARD] = true;

  monaco.languages.register({ id: 'pie' });

  monaco.languages.setMonarchTokensProvider('pie', {
    tokenizer: {
      root: [
        [/;.*$/, 'comment'],
        [/"([^"\\]|\\.)*$/, 'string.invalid'],
        [/"/, 'string', '@string'],
        [/\d+/, 'number'],
        [
          /\b(claim|define|define-tactically|lambda|Pi|Sigma|the|rec-Nat|ind-Nat|ind-List|ind-Vec|ind-Either|ind-Absurd|replace|symm|cong|trans|data)\b/,
          'keyword',
        ],
        [/\b(Nat|Atom|Trivial|Absurd|U|Pair|Either|List|Vec|->)\b/, 'type'],
        [/\b(zero|add1|same|sole|nil|vecnil|cons|car|cdr|left|right)\b/, 'variable'],
        [
          /\b(intro|exact|split|exists|go-Left|go-Right|elim-Nat|elim-List|elim-Vec|elim-Either|elim-Equal|elim-Absurd|apply|then)\b/,
          'string',
        ],
        [/[()[\]]/, 'delimiter'],
        [/[a-zA-Z_][a-zA-Z0-9_\-?!*+/<>=]*/, 'identifier'],
      ],
      string: [
        [/[^\\"]+/, 'string'],
        [/\\./, 'string.escape'],
        [/"/, 'string', '@pop'],
      ],
    },
  });

  monaco.editor.defineTheme('pie-dark', {
    base: 'vs-dark',
    inherit: true,
    rules: [
      { token: 'keyword', foreground: 'C586C0', fontStyle: 'bold' },
      { token: 'type', foreground: '4EC9B0' },
      { token: 'variable', foreground: '9CDCFE' },
      { token: 'string', foreground: 'CE9178' },
      { token: 'number', foreground: 'B5CEA8' },
      { token: 'comment', foreground: '6A9955', fontStyle: 'italic' },
      { token: 'identifier', foreground: 'D4D4D4' },
      { token: 'delimiter', foreground: 'FFD700' },
    ],
    colors: {},
  });
}

interface SourceCodePanelProps {
  onCollapse?: () => void;
}

export function SourceCodePanel({ onCollapse }: SourceCodePanelProps) {
  const [sourceCode, setSourceCode] = useState(SAMPLE_SOURCE);
  const [claimName, setClaimName] = useState('reflexivity');
  const editorRef = useRef<Parameters<OnMount>[0] | null>(null);

  const exampleSource = useExampleStore((s) => s.exampleSource);
  const exampleClaim = useExampleStore((s) => s.exampleClaim);

  useEffect(() => {
    if (exampleSource !== undefined) setSourceCode(exampleSource);
  }, [exampleSource]);

  useEffect(() => {
    if (exampleClaim !== undefined) setClaimName(exampleClaim);
  }, [exampleClaim]);

  const {
    startSession,
    isLoading,
    error,
    clearError,
    hasActiveSession,
    claimType,
  } = useProofSession();

  const generatedScript = useGeneratedProofScript();

  const handleStartProof = useCallback(async () => {
    if (!sourceCode.trim() || !claimName.trim()) return;
    clearError();
    try {
      await startSession(sourceCode, claimName);
      onCollapse?.();
    } catch (e) {
      console.error('Failed to start proof:', e);
    }
  }, [sourceCode, claimName, startSession, clearError, onCollapse]);

  const handleBeforeMount: BeforeMount = useCallback((monaco) => {
    registerPieLanguage(monaco);
  }, []);

  const handleMount: OnMount = useCallback((editor, monaco) => {
    editorRef.current = editor;
    monaco.editor.setTheme('pie-dark');
  }, []);

  // Sync generated script back to editor when canvas changes
  useEffect(() => {
    if (!generatedScript || !editorRef.current) return;
    const currentVal = editorRef.current.getValue();
    if (!currentVal.includes('define-tactically') && generatedScript.includes('define-tactically')) return;
    // Don't auto-update if user is actively editing
  }, [generatedScript]);

  const syncBadgeClass = isLoading
    ? 'pe-sync-badge syncing'
    : hasActiveSession
      ? 'pe-sync-badge'
      : error
        ? 'pe-sync-badge error'
        : 'pe-sync-badge';

  const syncLabel = isLoading ? 'Syncing…' : hasActiveSession ? 'Active' : error ? 'Error' : 'Ready';

  return (
    <>
      {/* Panel head */}
      <div className="pe-panel-head">
        {onCollapse && (
          <button
            className="pe-icon-btn"
            onClick={onCollapse}
            title="Collapse source panel"
            aria-label="Collapse source panel"
            style={{ marginRight: -4, marginLeft: -4 }}
          >
            <svg width="12" height="12" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round">
              <path d="M9 3L6 7l3 4" />
            </svg>
          </button>
        )}
        <h3>Source</h3>
        <span className={syncBadgeClass}>
          <span className="dot" />
          {syncLabel}
        </span>
        <div style={{ flex: 1 }} />
        <span style={{ fontFamily: 'var(--pe-mono-font)', fontSize: 11, color: 'var(--pe-faint)' }}>
          Pie · UTF-8
        </span>
      </div>

      {/* Claim bar */}
      <div className="pe-source-claim">
        <label>Claim</label>
        <input
          className="pe-input"
          value={claimName}
          onChange={(e) => setClaimName(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleStartProof()}
          placeholder="e.g., +zero-identity"
          disabled={isLoading}
        />
        <button
          className="pe-btn"
          onClick={handleStartProof}
          disabled={isLoading || !sourceCode.trim() || !claimName.trim()}
          title={hasActiveSession ? 'Restart proof session' : 'Start proof session'}
        >
          {isLoading ? (
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5 }}>
              <span style={{ width: 10, height: 10, border: '2px solid currentColor', borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
              Starting…
            </span>
          ) : hasActiveSession ? 'Restart' : 'Start Proof'}
        </button>
      </div>

      {/* Monaco editor — fills remaining height */}
      <div className="pe-editor-frame">
        <span className="pe-gutter-info">Pie · UTF-8 · LF</span>
        <Editor
          height="100%"
          language="pie"
          value={sourceCode}
          onChange={(v) => { if (v !== undefined) setSourceCode(v); }}
          beforeMount={handleBeforeMount}
          onMount={handleMount}
          options={{
            minimap: { enabled: false },
            fontSize: 12.5,
            fontFamily: "'JetBrains Mono', ui-monospace, monospace",
            lineNumbers: 'on',
            scrollBeyondLastLine: false,
            wordWrap: 'on',
            automaticLayout: true,
            tabSize: 2,
            insertSpaces: true,
            readOnly: isLoading,
            padding: { top: 12 },
            scrollbar: { verticalScrollbarSize: 6, horizontalScrollbarSize: 6 },
            overviewRulerLanes: 0,
            folding: false,
            lineDecorationsWidth: 0,
          }}
        />
      </div>

      {/* Diagnostics / status strip */}
      <div className="pe-diag-strip">
        {error ? (
          <>
            <div className="pe-diag-head">
              <div className="title">
                <span style={{ color: 'var(--pe-err)' }}>Error</span>
              </div>
              <button
                style={{ fontSize: 10.5, color: 'var(--pe-err)', cursor: 'pointer', border: 'none', background: 'none', padding: '2px 4px' }}
                onClick={clearError}
              >
                Dismiss
              </button>
            </div>
            <ul className="pe-diag-list">
              <li className="pe-diag-row err">
                <span className="sev" />
                <span className="loc">proof</span>
                <span className="msg">{error}</span>
              </li>
            </ul>
          </>
        ) : hasActiveSession ? (
          <>
            <div className="pe-diag-head">
              <div className="title">
                <span style={{ color: 'var(--pe-ok)' }}>Active</span>
                <span>·</span>
                <span>{claimName}</span>
              </div>
            </div>
            <div className="pe-diag-ok">
              <span className="dot" />
              {claimType
                ? <>Session active · <span style={{ fontFamily: 'var(--pe-mono-font)', fontSize: 11 }}>{claimType.length > 50 ? claimType.slice(0, 50) + '…' : claimType}</span></>
                : 'Proof session active · canvas is live'
              }
            </div>
          </>
        ) : (
          <div className="pe-diag-ok" style={{ color: 'var(--pe-faint)' }}>
            <span style={{ width: 6, height: 6, borderRadius: 3, background: 'var(--pe-faint)', flexShrink: 0 }} />
            No active session · enter source code and start proof
          </div>
        )}
      </div>

      {/* Generated script (collapsible) */}
      {hasActiveSession && generatedScript && (
        <div style={{
          borderTop: '1px solid var(--pe-line-2)',
          background: 'var(--pe-surface-2)',
          flexShrink: 0,
          maxHeight: 120,
          overflow: 'auto',
          padding: '8px 14px',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
            <span style={{ fontSize: 10.5, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--pe-faint)', fontWeight: 600 }}>
              Generated script
            </span>
            <button
              className="pe-btn"
              style={{ fontSize: 10.5, padding: '1px 7px' }}
              onClick={() => navigator.clipboard.writeText(generatedScript)}
              title="Copy to clipboard"
            >
              Copy
            </button>
          </div>
          <pre style={{ margin: 0, fontFamily: 'var(--pe-mono-font)', fontSize: 11, color: 'var(--pe-ink-2)', whiteSpace: 'pre-wrap', wordBreak: 'break-all' }}>
            {generatedScript}
          </pre>
        </div>
      )}
    </>
  );
}
