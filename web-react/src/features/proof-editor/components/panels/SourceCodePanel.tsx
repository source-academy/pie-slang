import { useState, useCallback, useEffect, useRef } from 'react';
import Editor, { type OnMount, type BeforeMount, type Monaco } from '@monaco-editor/react';
import { useProofSession } from '../../hooks/useProofSession';
import { useGeneratedProofScript } from '../../store';
import { useExampleStore } from '../../store/example-store';
import { useEditorStore, type SyncStatus } from '../../store/editor-store';
import {
  ensureGeneratedCanvasComment,
  extractPreamble,
} from '../../utils/generate-proof-script';
import { proofWorker } from '@/shared/lib/worker-client';
import { useProofStore } from '../../store';
import { useMetadataStore } from '../../store/metadata-store';
import { diagnosticsWorker } from '@/shared/lib/worker-client';
import type { Diagnostic as WorkerDiagnostic } from '@/workers/diagnostics-worker';

// ============================================
// Pie language registration helpers
// ============================================

// Guard via a property on the Monaco instance — survives HMR
// (module-level booleans get reset on HMR but the Monaco singleton persists).
const PIE_GUARD = '__pieCompletionsRegistered' as const;

function registerPieLanguage(monaco: Monaco) {
  // Register "pie" language if not already registered
  const langs = monaco.languages.getLanguages();
  if (langs.find((l: { id: string }) => l.id === 'pie')) return;

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

  monaco.languages.setLanguageConfiguration('pie', {
    comments: {
      lineComment: ';',
    },
    brackets: [
      ['(', ')'],
      ['[', ']'],
    ],
    autoClosingPairs: [
      { open: '(', close: ')' },
      { open: '[', close: ']' },
      { open: '"', close: '"' },
    ],
    surroundingPairs: [
      { open: '(', close: ')' },
      { open: '[', close: ']' },
      { open: '"', close: '"' },
    ],
    // Pie identifiers commonly include symbolic characters like `+`, `-`, `:` and `=`.
    wordPattern: /[^\s()[\]"]+/g,
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
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const guarded = monaco as any;
  if (guarded[PIE_GUARD]) return;
  guarded[PIE_GUARD] = true;

  monaco.languages.registerCompletionItemProvider('pie', {
    triggerCharacters: ['('],
    async provideCompletionItems(model: import('monaco-editor').editor.ITextModel, position: import('monaco-editor').Position) {
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

function getSessionSource(
  source: string,
  claimName: string,
  activeProofClaimName: string | null
): string {
  return extractPreamble(source, activeProofClaimName ?? claimName);
}

// ============================================
// Sync status badge
// ============================================

const STATUS_CONFIG: Record<SyncStatus, { label: string; className: string }> = {
  synced: { label: 'Synced', className: 'bg-green-100 text-green-800' },
  dirty: { label: 'Code edited', className: 'bg-yellow-100 text-yellow-800' },
  syncing: { label: 'Syncing…', className: 'bg-blue-100 text-blue-800' },
  error: { label: 'Sync failed', className: 'bg-red-100 text-red-800' },
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
  const [isMaximized, setIsMaximized] = useState(false);
  const [showConflictModal, setShowConflictModal] = useState(false);
  const [liveDiagnostics, setLiveDiagnostics] = useState<
    Array<{ message: string; severity: 'error' | 'warning'; startLine: number }>
  >([]);
  const [pendingCanvasAction, setPendingCanvasAction] = useState<(() => void) | null>(null);

  // Flag set before we programmatically update Monaco (canvas→code sync).
  // Prevents the resulting onChange callback from falsely calling markDirty().
  const isProgrammaticUpdate = useRef(false);

  // Editor store (Monaco value + sync state)
  const editorValue = useEditorStore((s) => s.editorValue);
  const claimName = useEditorStore((s) => s.claimName);
  const syncStatus = useEditorStore((s) => s.syncStatus);
  const dirtySinceLastSync = useEditorStore((s) => s.dirtySinceLastSync);
  const lastSyncError = useEditorStore((s) => s.lastSyncError);
  const hasUnsyncedConflict = useEditorStore((s) => s.hasUnsyncedConflict);
  const preamble = useEditorStore((s) => s.preamble);

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
  const proofSessionId = useProofStore((s) => s.sessionId);
  const activeProofClaimName = useProofStore((s) => s.claimName);
  const setMetadataClaimName = useMetadataStore((s) => s.setClaimName);

  // ----------------------------------------
  // Update editor value when example is loaded
  // ----------------------------------------
  useEffect(() => {
    if (exampleSource !== undefined) {
      isProgrammaticUpdate.current = true;
      setEditorValue(exampleSource);
      setPreamble(null);
      setConflict(false);
      if (hasActiveSession) {
        markDirty();
      } else {
        clearDirty();
        setSyncStatus('synced');
      }
      setIsExpanded(true);
    }
  }, [
    exampleSource,
    hasActiveSession,
    setEditorValue,
    setPreamble,
    setConflict,
    markDirty,
    clearDirty,
    setSyncStatus,
  ]);

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
    // Only update once a proof session has been started (preamble is set)
    if (preamble === null) return;

    const normalizedGeneratedScript = ensureGeneratedCanvasComment(generatedScript);
    const newValue = preamble
      ? `${preamble}\n${normalizedGeneratedScript}`
      : normalizedGeneratedScript;
    if (newValue === useEditorStore.getState().editorValue) return;
    // Mark as programmatic so the resulting onChange callback skips markDirty()
    isProgrammaticUpdate.current = true;
    setEditorValue(newValue);
  }, [dirtySinceLastSync, generatedScript, preamble, setEditorValue]);

  // ----------------------------------------
  // Monaco lifecycle callbacks
  // ----------------------------------------
  const handleBeforeMount: BeforeMount = useCallback((monaco) => {
    registerPieLanguage(monaco);
    registerPieCompletions(monaco);
  }, []);

  const editorRef = useRef<Parameters<OnMount>[0] | null>(null);
  const monacoRef = useRef<Parameters<OnMount>[1] | null>(null);
  const editorDisposablesRef = useRef<Array<{ dispose(): void }>>([]);
  const [isEditorReady, setIsEditorReady] = useState(false);

  const handleMount: OnMount = useCallback((editor, monaco) => {
    editorRef.current = editor;
    monacoRef.current = monaco;
    monaco.editor.setTheme('pie-dark');
    editorDisposablesRef.current.forEach((disposable) => disposable.dispose());
    editorDisposablesRef.current = [];
    setIsEditorReady(true);
  }, []);

  useEffect(() => {
    return () => {
      editorDisposablesRef.current.forEach((disposable) => disposable.dispose());
      editorDisposablesRef.current = [];
    };
  }, []);

  // ----------------------------------------
  // Real-time diagnostics → Monaco markers
  // ----------------------------------------
  useEffect(() => {
    let isCancelled = false;
    const handle = window.setTimeout(async () => {
      const editor = editorRef.current;
      const monaco = monacoRef.current;
      if (!editor || !monaco) return;
      const model = editor.getModel();
      if (!model) return;
      try {
        const result = await diagnosticsWorker.checkSource(editorValue);
        const diagnostics = result.diagnostics || [];
        if (isCancelled) return;
        const markers = diagnostics.map((d: WorkerDiagnostic) => ({
          severity:
            d.severity === 'error'
              ? monaco.MarkerSeverity.Error
              : monaco.MarkerSeverity.Warning,
          message: d.message,
          startLineNumber: d.range.startLine,
          startColumn: d.range.startColumn,
          endLineNumber: d.range.endLine,
          endColumn: d.range.endColumn,
        }));
        monaco.editor.setModelMarkers(model, 'pie', markers);
        setLiveDiagnostics(
          diagnostics.map((d: WorkerDiagnostic) => ({
            message: d.message,
            severity: d.severity === 'error' ? 'error' : 'warning',
            startLine: d.range.startLine,
          }))
        );
      } catch {
        if (!isCancelled) {
          monaco.editor.setModelMarkers(model, 'pie', []);
          setLiveDiagnostics([]);
        }
      }
    }, 400);
    return () => {
      isCancelled = true;
      window.clearTimeout(handle);
    };
  }, [editorValue, isEditorReady]);

  // ----------------------------------------
  // Editor change handler
  // ----------------------------------------
  const handleEditorChange = useCallback(
    (value: string | undefined) => {
      if (value === undefined) return;
      setEditorValue(value);
      // Skip markDirty() when the change came from the canvas→code auto-sync,
      // not from the user actually typing.
      if (isProgrammaticUpdate.current) {
        isProgrammaticUpdate.current = false;
        return;
      }
      markDirty();
    },
    [setEditorValue, markDirty]
  );

  // ----------------------------------------
  // Start Proof (legacy path — initial session start)
  // ----------------------------------------
  const handleStartProof = useCallback(async () => {
    const sourceForSession = getSessionSource(
      editorValue,
      claimName,
      activeProofClaimName
    );
    if (!sourceForSession.trim() || !claimName.trim()) return;

    clearError();
    setSyncStatus('syncing');
    setSyncError(null);

    try {
      const result = await startSession(sourceForSession, claimName);
      if (proofSessionId && proofSessionId !== result.sessionId) {
        try {
          await proofWorker.closeSession(proofSessionId);
        } catch {
          // Ignore close errors on replaced sessions
        }
      }
      // Store the preamble used to start the fresh session.
      setPreamble(sourceForSession);
      clearDirty();
      setSyncStatus('synced');
      setIsExpanded(false);
    } catch (e) {
      setSyncStatus('error');
      setSyncError(e instanceof Error ? e.message : 'Failed to start proof');
    }
  }, [
    editorValue,
    claimName,
    activeProofClaimName,
    startSession,
    proofSessionId,
    clearError,
    clearDirty,
    setSyncStatus,
    setSyncError,
    setPreamble,
  ]);

  // ----------------------------------------
  // Sync to Canvas (Code → Canvas manual apply)
  // ----------------------------------------
  const handleSyncToCanvas = useCallback(async () => {
    const sourceForSession = getSessionSource(
      editorValue,
      claimName,
      activeProofClaimName
    );
    if (!sourceForSession.trim() || !claimName.trim()) return;

    setSyncStatus('syncing');
    setSyncError(null);

    try {
      // Close old session if one exists
      if (proofSessionId) {
        try {
          await proofWorker.closeSession(proofSessionId);
        } catch {
          // Ignore close errors
        }
      }

      await startSession(sourceForSession, claimName);

      // Store the preamble used to rebuild the session.
      setPreamble(sourceForSession);
      clearDirty();
      setSyncStatus('synced');
      setConflict(false);
      setIsExpanded(false);
    } catch (e) {
      const errMsg = e instanceof Error ? e.message : 'Failed to sync source to canvas';
      setSyncStatus('error');
      setSyncError(errMsg);
    }
  }, [
    editorValue,
    claimName,
    activeProofClaimName,
    proofSessionId,
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
  // Register the conflict callback with the shared editor store.
  // This replaces the window.confirmConflictAndProceed anti-pattern:
  // other components (e.g. App.tsx) call useEditorStore.getState().triggerConflictGuard()
  // and the store dispatches here if needed.
  const registerConflictCallback = useEditorStore((s) => s.registerConflictCallback);
  useEffect(() => {
    registerConflictCallback(confirmConflictAndProceed);
    return () => {
      registerConflictCallback(null);
    };
  }, [confirmConflictAndProceed, registerConflictCallback]);

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
  const displayedError =
    syncStatus === 'error' ? (lastSyncError ?? error) : error;

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
                <div className="mb-1 flex items-center justify-between">
                  <label className="block text-sm font-medium text-muted-foreground">
                    Pie Source Code
                  </label>
                  <button
                    type="button"
                    className="rounded border px-2 py-0.5 text-xs hover:bg-muted"
                    onClick={() => setIsMaximized(true)}
                    title="Expand editor to fullscreen"
                  >
                    ⤢ Expand
                  </button>
                </div>
                <div
                  className={
                    isMaximized
                      ? 'fixed inset-4 z-50 flex flex-col overflow-hidden rounded-lg border bg-card shadow-2xl'
                      : 'overflow-hidden rounded-md border'
                  }
                  style={isMaximized ? undefined : { height: '200px' }}
                >
                  {isMaximized && (
                    <div className="flex items-center justify-between border-b bg-muted/50 px-3 py-1.5">
                      <span className="text-sm font-medium">Pie Source Code</span>
                      <button
                        type="button"
                        className="rounded border px-2 py-0.5 text-xs hover:bg-muted"
                        onClick={() => setIsMaximized(false)}
                        title="Close fullscreen editor"
                      >
                        ⤡ Close
                      </button>
                    </div>
                  )}
                  <Editor
                    height={isMaximized ? '100%' : '200px'}
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
                      quickSuggestions: { other: true, comments: false, strings: false },
                      quickSuggestionsDelay: 50,
                      acceptSuggestionOnCommitCharacter: false,
                      acceptSuggestionOnEnter: 'off',
                      tabCompletion: 'on',
                      wordBasedSuggestions: 'off',
                      suggest: {
                        showWords: false,
                        showSnippets: false,
                        filterGraceful: true,
                      },
                      tabSize: 2,
                      insertSpaces: true,
                      readOnly: isSyncing,
                    }}
                  />
                  {isMaximized && (
                    <div className="border-t bg-background px-3 py-2">
                      {liveDiagnostics.length > 0 ? (
                        <div className="rounded-md border border-destructive/50 bg-destructive/10 p-2">
                          <p className="mb-1 text-xs font-semibold text-destructive">
                            ✗ {liveDiagnostics.length} problem{liveDiagnostics.length > 1 ? 's' : ''} in source
                          </p>
                          <ul className="max-h-24 space-y-0.5 overflow-auto text-xs text-destructive">
                            {liveDiagnostics.slice(0, 5).map((d, i) => (
                              <li key={i} className="font-mono">
                                line {d.startLine}: {d.message}
                              </li>
                            ))}
                            {liveDiagnostics.length > 5 && (
                              <li className="italic">…and {liveDiagnostics.length - 5} more</li>
                            )}
                          </ul>
                        </div>
                      ) : editorValue.trim() ? (
                        <p className="rounded-md border border-green-200 bg-green-50 px-2 py-1 text-xs font-semibold text-green-800">
                          ✓ No errors — source typechecks
                        </p>
                      ) : null}
                    </div>
                  )}
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

                {/* Live diagnostics banner */}
                {liveDiagnostics.length > 0 ? (
                  <div className="rounded-md border border-destructive/50 bg-destructive/10 p-2">
                    <p className="mb-1 text-xs font-semibold text-destructive">
                      ✗ {liveDiagnostics.length} problem{liveDiagnostics.length > 1 ? 's' : ''} in source
                    </p>
                    <ul className="space-y-0.5 text-xs text-destructive">
                      {liveDiagnostics.slice(0, 5).map((d, i) => (
                        <li key={i} className="font-mono">
                          line {d.startLine}: {d.message}
                        </li>
                      ))}
                      {liveDiagnostics.length > 5 && (
                        <li className="italic">…and {liveDiagnostics.length - 5} more</li>
                      )}
                    </ul>
                  </div>
                ) : editorValue.trim() ? (
                  <div className="rounded-md border border-green-200 bg-green-50 p-2">
                    <p className="text-xs font-semibold text-green-800">
                      ✓ No errors — source typechecks
                    </p>
                  </div>
                ) : null}

                {/* Error display */}
                {displayedError && (
                  <div className="rounded-md border border-destructive/50 bg-destructive/10 p-2">
                    <div className="flex items-start justify-between gap-2">
                      <p className="text-xs text-destructive">{displayedError}</p>
                      <button
                        className="text-xs text-destructive hover:underline"
                        onClick={(e) => {
                          e.stopPropagation();
                          clearError();
                          setSyncError(null);
                          if (syncStatus === 'error') {
                            setSyncStatus(dirtySinceLastSync ? 'dirty' : 'synced');
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
