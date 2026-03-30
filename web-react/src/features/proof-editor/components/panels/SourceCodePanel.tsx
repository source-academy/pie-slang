import { useState, useCallback, useEffect } from 'react';
import Editor, { type OnMount, type BeforeMount, type Monaco } from '@monaco-editor/react';
import { useProofSession } from '../../hooks/useProofSession';
import { useGeneratedProofScript } from '../../store';
import { useExampleStore } from '../../store/example-store';
import { useEditorStore, type SyncStatus } from '../../store/editor-store';
import { extractPreamble } from '../../utils/generate-proof-script';
import { proofWorker } from '@/shared/lib/worker-client';
import { useProofStore } from '../../store';
import { useMetadataStore } from '../../store/metadata-store';
import { diagnosticsWorker } from '@/shared/lib/worker-client';

// ============================================
// Pie language registration helpers
// ============================================

function registerPieLanguage(monaco: Monaco) {
  // Register "pie" language if not already registered
  const langs = monaco.languages.getLanguages();
  if (langs.find((l) => l.id === 'pie')) return;

  monaco.languages.register({ id: 'pie' });

  monaco.languages.setMonarchTokensProvider('pie', {
    tokenizer: {
      root: [
        // Line comments
        [/;.*$/, 'comment'],
        // Strings
        [/"([^"\\]|\\.)*$/, 'string.invalid'],
        [/"/, 'string', '@string'],
        // Numbers
        [/\d+/, 'number'],
        // Keywords
        [
          /\b(claim|define|define-tactically|lambda|Pi|Sigma|the|rec-Nat|ind-Nat|ind-List|ind-Vec|ind-Either|ind-Absurd|replace|symm|cong|trans)\b/,
          'keyword',
        ],
        // Types
        [/\b(Nat|Atom|Trivial|Absurd|U|Pair|Either|List|Vec|->)\b/, 'type'],
        // Constructors / special values
        [/\b(zero|add1|same|sole|nil|vecnil|cons|car|cdr|left|right)\b/, 'variable'],
        // Tactics
        [/\b(intro|exact|split|exists|elim-Nat|elim-List|elim-Vec|elim-Either|elim-Equal|elim-Absurd|apply|then)\b/, 'string'],
        // Parentheses
        [/[()[\]]/, 'delimiter'],
        // Symbols / identifiers
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

function registerPieCompletions(monaco: Monaco) {
  monaco.languages.registerCompletionItemProvider('pie', {
    triggerCharacters: ['(', ' '],
    async provideCompletionItems(model, position) {
      const word = model.getWordUntilPosition(position);
      const range = {
        startLineNumber: position.lineNumber,
        endLineNumber: position.lineNumber,
        startColumn: word.startColumn,
        endColumn: word.endColumn,
      };

      const sourceCode = model.getValue();
      try {
        const items = await diagnosticsWorker.getCompletions(
          sourceCode,
          position.lineNumber,
          position.column
        );

        const { CompletionItemKind, CompletionItemInsertTextRule } = monaco.languages;
        const kindMap = {
          keyword: CompletionItemKind.Keyword,
          function: CompletionItemKind.Function,
          variable: CompletionItemKind.Variable,
          type: CompletionItemKind.Class,
        } as const;

        return {
          suggestions: items.map((item) => ({
            label: item.label,
            kind: kindMap[item.kind as keyof typeof kindMap] ?? CompletionItemKind.Text,
            detail: item.detail,
            insertText: item.insertText ?? item.label,
            insertTextRules: item.insertText
              ? CompletionItemInsertTextRule.InsertAsSnippet
              : undefined,
            range,
          })),
        };
      } catch {
        return { suggestions: [] };
      }
    },
  });
}

// ============================================
// Sync status badge
// ============================================

const STATUS_CONFIG: Record<SyncStatus, { label: string; className: string }> = {
  synced: { label: 'Synced', className: 'bg-green-100 text-green-800' },
  'code-edited': { label: 'Code edited', className: 'bg-yellow-100 text-yellow-800' },
  syncing: { label: 'Syncing…', className: 'bg-blue-100 text-blue-800' },
  'sync-failed': { label: 'Sync failed', className: 'bg-red-100 text-red-800' },
};

function SyncStatusBadge({ status }: { status: SyncStatus }) {
  const { label, className } = STATUS_CONFIG[status];
  return (
    <span className={`rounded px-2 py-0.5 text-xs font-medium ${className}`}>
      {status === 'syncing' && (
        <span className="mr-1 inline-block h-3 w-3 animate-spin rounded-full border-2 border-current border-t-transparent align-middle" />
      )}
      {label}
    </span>
  );
}

// ============================================
// Conflict modal
// ============================================

interface ConflictModalProps {
  onDiscard: () => void;
  onCancel: () => void;
}

function ConflictModal({ onDiscard, onCancel }: ConflictModalProps) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="mx-4 max-w-md rounded-lg border bg-card p-6 shadow-xl">
        <h2 className="mb-2 text-base font-semibold">Unsynced Code Changes</h2>
        <p className="mb-4 text-sm text-muted-foreground">
          You have unsaved code edits that have not been synced to the canvas.
          Continuing will discard these edits. You can click Cancel and use{' '}
          <strong>Sync to Canvas</strong> first to preserve your changes.
        </p>
        <div className="flex gap-2">
          <button
            className="flex-1 rounded-md bg-destructive px-3 py-2 text-sm font-medium text-destructive-foreground hover:bg-destructive/90"
            onClick={onDiscard}
          >
            Discard and continue
          </button>
          <button
            className="flex-1 rounded-md border px-3 py-2 text-sm font-medium hover:bg-muted"
            onClick={onCancel}
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}

// ============================================
// SourceCodePanel
// ============================================

/**
 * SourceCodePanel — Monaco-powered source code editor with Canvas sync.
 *
 * Architecture:
 * - Monaco edits the Pie source code (claims + definitions).
 * - Canvas is the runtime source of truth.
 * - "Sync to Canvas" rebuilds the proof session from Monaco content.
 * - Canvas changes update the "Generated Proof Script" section (read-only).
 * - Editor undo/redo is native to Monaco; canvas undo/redo is independent.
 */
export function SourceCodePanel() {
  const [isExpanded, setIsExpanded] = useState(true);
  const [showConflictModal, setShowConflictModal] = useState(false);
  const [pendingCanvasAction, setPendingCanvasAction] = useState<(() => void) | null>(null);

  // Editor store (Monaco value + sync state)
  const editorValue = useEditorStore((s) => s.editorValue);
  const claimName = useEditorStore((s) => s.claimName);
  const syncStatus = useEditorStore((s) => s.syncStatus);
  const dirtySinceLastSync = useEditorStore((s) => s.dirtySinceLastSync);
  const lastSyncError = useEditorStore((s) => s.lastSyncError);
  const hasUnsyncedConflict = useEditorStore((s) => s.hasUnsyncedConflict);

  const setEditorValue = useEditorStore((s) => s.setEditorValue);
  const setClaimName = useEditorStore((s) => s.setClaimName);
  const markDirty = useEditorStore((s) => s.markDirty);
  const clearDirty = useEditorStore((s) => s.clearDirty);
  const setGeneratedScript = useEditorStore((s) => s.setGeneratedScript);
  const setSyncStatus = useEditorStore((s) => s.setSyncStatus);
  const setSyncError = useEditorStore((s) => s.setSyncError);
  const setConflict = useEditorStore((s) => s.setConflict);
  const setPreamble = useEditorStore((s) => s.setPreamble);

  // Example store
  const exampleSource = useExampleStore((s) => s.exampleSource);
  const exampleClaim = useExampleStore((s) => s.exampleClaim);

  // Proof session (for startProof / legacy flow)
  const {
    startSession,
    isLoading,
    error,
    clearError,
    hasActiveSession,
    claimType,
  } = useProofSession();

  // Generated proof script from canvas
  const generatedScript = useGeneratedProofScript();

  // Proof store — for atomic sync-from-source updates
  const syncFromWorker = useProofStore((s) => s.syncFromWorker);
  const proofSessionId = useProofStore((s) => s.sessionId);
  const setGlobalContext = useProofStore((s) => s.setGlobalContext);
  const setMetadataClaimName = useMetadataStore((s) => s.setClaimName);
  const setMetadataGlobalContext = useMetadataStore((s) => s.setGlobalContext);
  const saveSnapshot = useProofStore((s) => s.saveSnapshot);

  // ----------------------------------------
  // Update editor value when example is loaded
  // ----------------------------------------
  useEffect(() => {
    if (exampleSource !== undefined) {
      setEditorValue(exampleSource);
      clearDirty();
      setSyncStatus('synced');
      setIsExpanded(true);
    }
  }, [exampleSource, setEditorValue, clearDirty, setSyncStatus]);

  useEffect(() => {
    if (exampleClaim !== undefined) {
      setClaimName(exampleClaim);
    }
  }, [exampleClaim, setClaimName]);

  // ----------------------------------------
  // Keep editor-store generated script in sync
  // ----------------------------------------
  useEffect(() => {
    setGeneratedScript(generatedScript ?? null);
  }, [generatedScript, setGeneratedScript]);

  // ----------------------------------------
  // Canvas → Code: auto-update Monaco when canvas changes
  // ----------------------------------------
  useEffect(() => {
    if (!generatedScript) return;
    // Only auto-update if the user hasn't made unsaved edits
    if (dirtySinceLastSync) return;
    const preamble = useEditorStore.getState().preamble;
    // Only update once a proof session has been started (preamble is set)
    if (preamble === null) return;

    const newValue = preamble ? `${preamble}\n\n${generatedScript}` : generatedScript;
    setEditorValue(newValue);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [generatedScript]);

  // ----------------------------------------
  // Monaco lifecycle callbacks
  // ----------------------------------------
  const handleBeforeMount: BeforeMount = useCallback((monaco) => {
    registerPieLanguage(monaco);
    registerPieCompletions(monaco);
  }, []);

  const handleMount: OnMount = useCallback((_editor, monaco) => {
    monaco.editor.setTheme('pie-dark');
  }, []);

  // ----------------------------------------
  // Editor change handler
  // ----------------------------------------
  const handleEditorChange = useCallback(
    (value: string | undefined) => {
      if (value === undefined) return;
      setEditorValue(value);
      markDirty();
    },
    [setEditorValue, markDirty]
  );

  // ----------------------------------------
  // Start Proof (legacy path — initial session start)
  // ----------------------------------------
  const handleStartProof = useCallback(async () => {
    if (!editorValue.trim() || !claimName.trim()) return;

    clearError();
    setSyncStatus('syncing');
    setSyncError(null);

    try {
      await startSession(editorValue, claimName);
      // Store the preamble — the full source at this point (no tactic block yet)
      setPreamble(extractPreamble(editorValue, claimName));
      clearDirty();
      setSyncStatus('synced');
      setIsExpanded(false);
    } catch (e) {
      console.error('Failed to start proof:', e);
      setSyncStatus('sync-failed');
      setSyncError(e instanceof Error ? e.message : String(e));
    }
  }, [editorValue, claimName, startSession, clearError, clearDirty, setSyncStatus, setSyncError, setPreamble]);

  // ----------------------------------------
  // Sync to Canvas (Code → Canvas manual apply)
  // ----------------------------------------
  const handleSyncToCanvas = useCallback(async () => {
    if (!editorValue.trim() || !claimName.trim()) return;

    setSyncStatus('syncing');
    setSyncError(null);

    try {
      const result = await proofWorker.syncFromSource(editorValue, claimName);

      if (result.success && result.proofTree && result.sessionId) {
        // Close old session if one exists
        if (proofSessionId) {
          try {
            await proofWorker.closeSession(proofSessionId);
          } catch {
            // Ignore close errors
          }
        }

        // Atomically update proof store
        syncFromWorker(result.proofTree, result.sessionId, claimName);
        saveSnapshot();

        // Update metadata stores
        if (result.globalContext) {
          setGlobalContext(result.globalContext);
          setMetadataGlobalContext(result.globalContext);
        }
        setMetadataClaimName(claimName);

        // Store preamble = source minus the define-tactically block
        setPreamble(extractPreamble(editorValue, claimName));
        clearDirty();
        setSyncStatus('synced');
        setConflict(false);
        setIsExpanded(false);
      } else {
        const errMsg = result.error ?? 'Sync failed';
        setSyncStatus('sync-failed');
        setSyncError(errMsg);
      }
    } catch (e) {
      const errMsg = e instanceof Error ? e.message : String(e);
      setSyncStatus('sync-failed');
      setSyncError(errMsg);
    }
  }, [
    editorValue,
    claimName,
    proofSessionId,
    syncFromWorker,
    saveSnapshot,
    setGlobalContext,
    setMetadataGlobalContext,
    setMetadataClaimName,
    clearDirty,
    setSyncStatus,
    setSyncError,
    setConflict,
    setPreamble,
  ]);

  // ----------------------------------------
  // Conflict modal helpers (exported via ref so ProofCanvas can call)
  // ----------------------------------------
  const confirmConflictAndProceed = useCallback(
    (action: () => void) => {
      if (dirtySinceLastSync) {
        setPendingCanvasAction(() => action);
        setShowConflictModal(true);
        setConflict(true);
      } else {
        action();
      }
    },
    [dirtySinceLastSync, setConflict]
  );
  // Make the helper available on window for other components (lightweight alternative to context)
  useEffect(() => {
    (window as unknown as Record<string, unknown>).confirmConflictAndProceed =
      confirmConflictAndProceed;
    return () => {
      delete (window as unknown as Record<string, unknown>).confirmConflictAndProceed;
    };
  }, [confirmConflictAndProceed]);

  const handleConflictDiscard = useCallback(() => {
    setShowConflictModal(false);
    clearDirty();
    setSyncStatus('synced');
    setConflict(false);
    if (pendingCanvasAction) {
      pendingCanvasAction();
      setPendingCanvasAction(null);
    }
  }, [pendingCanvasAction, clearDirty, setSyncStatus, setConflict]);

  const handleConflictCancel = useCallback(() => {
    setShowConflictModal(false);
    setPendingCanvasAction(null);
  }, []);

  const handleToggle = useCallback(() => {
    setIsExpanded((prev) => !prev);
  }, []);

  const isSyncing = syncStatus === 'syncing' || isLoading;

  return (
    <>
      {showConflictModal && (
        <ConflictModal
          onDiscard={handleConflictDiscard}
          onCancel={handleConflictCancel}
        />
      )}

      <div className="border-b bg-card">
        {/* Header */}
        <div
          className="flex cursor-pointer items-center justify-between px-4 py-2 hover:bg-muted/50"
          onClick={handleToggle}
        >
          <div className="flex items-center gap-2">
            <span className="text-lg">{isExpanded ? '▼' : '▶'}</span>
            <span className="font-medium">Source Code</span>
            {hasActiveSession && claimType && (
              <span className="ml-2 rounded bg-green-100 px-2 py-0.5 text-xs text-green-800">
                Proving: {claimName}
              </span>
            )}
            {/* Sync status badge */}
            <SyncStatusBadge status={syncStatus} />
            {hasUnsyncedConflict && (
              <span className="rounded bg-orange-100 px-2 py-0.5 text-xs text-orange-800">
                Conflict
              </span>
            )}
          </div>
          {hasActiveSession && (
            <span className="text-sm text-muted-foreground">
              Click to {isExpanded ? 'collapse' : 'expand'}
            </span>
          )}
        </div>

        {/* Collapsible content */}
        {isExpanded && (
          <div className="border-t px-4 pb-4 pt-2">
            <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
              {/* Monaco editor */}
              <div className="lg:col-span-2">
                <label className="mb-1 block text-sm font-medium text-muted-foreground">
                  Pie Source Code
                </label>
                <div className="overflow-hidden rounded-md border" style={{ height: '200px' }}>
                  <Editor
                    height="200px"
                    language="pie"
                    value={editorValue}
                    onChange={handleEditorChange}
                    beforeMount={handleBeforeMount}
                    onMount={handleMount}
                    options={{
                      minimap: { enabled: false },
                      fontSize: 13,
                      lineNumbers: 'on',
                      scrollBeyondLastLine: false,
                      wordWrap: 'on',
                      automaticLayout: true,
                      suggestOnTriggerCharacters: true,
                      quickSuggestions: true,
                      tabSize: 2,
                      insertSpaces: true,
                      readOnly: isSyncing,
                    }}
                  />
                </div>
              </div>

              {/* Claim name + action buttons */}
              <div className="flex flex-col gap-3">
                <div>
                  <label className="mb-1 block text-sm font-medium text-muted-foreground">
                    Claim to Prove
                  </label>
                  <input
                    type="text"
                    className="w-full rounded-md border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                    placeholder="e.g., +zero-identity"
                    value={claimName}
                    onChange={(e) => setClaimName(e.target.value)}
                    disabled={isSyncing}
                  />
                </div>

                {/* Start Proof button (initial session) */}
                {!hasActiveSession && (
                  <button
                    className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-50"
                    onClick={handleStartProof}
                    disabled={isSyncing || !editorValue.trim() || !claimName.trim()}
                  >
                    {isSyncing ? (
                      <span className="flex items-center justify-center gap-2">
                        <span className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                        Starting…
                      </span>
                    ) : (
                      'Start Proof'
                    )}
                  </button>
                )}

                {/* Sync to Canvas button (active session) */}
                {hasActiveSession && (
                  <button
                    className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-50"
                    onClick={handleSyncToCanvas}
                    disabled={isSyncing || !editorValue.trim() || !claimName.trim()}
                    title="Parse editor code and rebuild the canvas proof session"
                  >
                    {isSyncing ? (
                      <span className="flex items-center justify-center gap-2">
                        <span className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                        Syncing…
                      </span>
                    ) : (
                      'Sync to Canvas'
                    )}
                  </button>
                )}

                {/* Restart button (active session) */}
                {hasActiveSession && (
                  <button
                    className="rounded-md border px-4 py-2 text-sm font-medium hover:bg-muted disabled:cursor-not-allowed disabled:opacity-50"
                    onClick={handleStartProof}
                    disabled={isSyncing || !editorValue.trim() || !claimName.trim()}
                    title="Start fresh proof session (discards canvas state)"
                  >
                    Restart Proof
                  </button>
                )}

                {/* Error display */}
                {(error || (syncStatus === 'sync-failed' && lastSyncError)) && (
                  <div className="rounded-md border border-destructive/50 bg-destructive/10 p-2">
                    <div className="flex items-start justify-between gap-2">
                      <p className="text-xs text-destructive">
                        {lastSyncError ?? error}
                      </p>
                      <button
                        className="text-xs text-destructive hover:underline"
                        onClick={(e) => {
                          e.stopPropagation();
                          clearError();
                          setSyncError(null);
                          if (syncStatus === 'sync-failed') {
                            setSyncStatus(dirtySinceLastSync ? 'code-edited' : 'synced');
                          }
                        }}
                      >
                        Dismiss
                      </button>
                    </div>
                  </div>
                )}

                {/* Success indicator */}
                {hasActiveSession && !error && syncStatus === 'synced' && (
                  <div className="rounded-md border border-green-200 bg-green-50 p-2">
                    <p className="text-xs text-green-800">✓ Proof session active</p>
                    {claimType && (
                      <p className="mt-1 truncate font-mono text-xs text-green-700">
                        Type: {claimType}
                      </p>
                    )}
                  </div>
                )}
              </div>
            </div>

          </div>
        )}
      </div>
    </>
  );
}
