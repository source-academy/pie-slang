import { useState, useCallback, useEffect, useRef } from 'react';
import Editor, { type BeforeMount, type Monaco, type OnMount } from '@monaco-editor/react';
import { useProofSession } from '../../hooks/useProofSession';
import { useGeneratedProofScript } from '../../store';
import { useExampleStore } from '../../store/example-store';
import { diagnosticsWorker } from '@/shared/lib/worker-client';
import type { Diagnostic as WorkerDiagnostic } from '@/workers/diagnostics-worker';

/**
 * Sample Pie source code for demonstration.
 */
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

function once(monaco: Monaco, key: string, fn: () => void) {
  const m = monaco as Monaco & Record<string, boolean>;
  if (m[key]) return;
  m[key] = true;
  fn();
}

function registerPieLanguage(monaco: Monaco) {
  once(monaco, '__pieLanguageRegistered', () => {
    monaco.languages.register({ id: 'pie' });
    monaco.languages.setMonarchTokensProvider('pie', {
      tokenizer: {
        root: [
          [/;.*$/, 'comment'],
          [/\d+/, 'number'],
          [
            /\b(claim|define|define-tactically|lambda|Pi|Sigma|the|then)\b/,
            'keyword',
          ],
          [
            /\b(Nat|Atom|Trivial|Absurd|U|Pair|Either|List|Vec)\b|->|=/,
            'type',
          ],
          [
            /\b(zero|add1|same|sole|nil|cons|car|cdr|left|right|intro|exact|exists|apply|split-Pair|elim-Nat|elim-List|elim-Vec|elim-Either|elim-Equal|elim-Absurd)\b/,
            'variable',
          ],
          [/[()[\]]/, 'delimiter'],
          [/[^\s()[\]"]+/, 'identifier'],
        ],
      },
    });
    monaco.languages.setLanguageConfiguration('pie', {
      comments: { lineComment: ';' },
      brackets: [
        ['(', ')'],
        ['[', ']'],
      ],
      autoClosingPairs: [
        { open: '(', close: ')' },
        { open: '[', close: ']' },
        { open: '"', close: '"' },
      ],
      wordPattern: /[^\s()[\]"]+/g,
    });
  });
}

function registerPieCompletions(monaco: Monaco) {
  once(monaco, '__pieCompletionRegistered', () => {
    monaco.languages.registerCompletionItemProvider('pie', {
      triggerCharacters: ['(', '-', '=', ':'],
      async provideCompletionItems(model, position) {
        const word = model.getWordUntilPosition(position);
        const range = {
          startLineNumber: position.lineNumber,
          endLineNumber: position.lineNumber,
          startColumn: word.startColumn,
          endColumn: word.endColumn,
        };

        try {
          const items = await diagnosticsWorker.getCompletions(
            model.getValue(),
            position.lineNumber,
            position.column,
          );
          const kindMap = {
            keyword: monaco.languages.CompletionItemKind.Keyword,
            function: monaco.languages.CompletionItemKind.Function,
            variable: monaco.languages.CompletionItemKind.Variable,
            type: monaco.languages.CompletionItemKind.Class,
          };

          return {
            suggestions: items.map((item) => ({
              label: item.label,
              kind: kindMap[item.kind],
              detail: item.detail,
              insertText: item.insertText ?? item.label,
              insertTextRules: item.insertText
                ? monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet
                : undefined,
              range,
            })),
          };
        } catch {
          return { suggestions: [] };
        }
      },
    });
  });
}

function registerPieHover(monaco: Monaco) {
  once(monaco, '__pieHoverRegistered', () => {
    monaco.languages.registerHoverProvider('pie', {
      async provideHover(model, position) {
        const hover = await diagnosticsWorker.getHoverInfo(
          model.getValue(),
          position.lineNumber,
          position.column,
        );
        if (!hover) return null;

        return {
          contents: [
            { value: `**${hover.documentation ?? 'Pie symbol'}**` },
            { value: `\`\`\`pie\n${hover.type}\n\`\`\`` },
          ],
        };
      },
    });
  });
}

/**
 * SourceCodePanel - Collapsible panel for entering Pie source code and starting proofs.
 *
 * Features:
 * - Text area for Pie source code (claims, definitions)
 * - Input field for claim name to prove
 * - "Start Proof" button
 * - Auto-collapses after starting proof
 * - Shows loading and error states
 * - Displays generated proof script
 */
export function SourceCodePanel() {
  const [isExpanded, setIsExpanded] = useState(true);
  const [sourceCode, setSourceCode] = useState(SAMPLE_SOURCE);
  const [claimName, setClaimName] = useState('reflexivity');
  const [liveDiagnostics, setLiveDiagnostics] = useState<WorkerDiagnostic[]>([]);
  const editorRef = useRef<Parameters<OnMount>[0] | null>(null);
  const monacoRef = useRef<Parameters<OnMount>[1] | null>(null);

  // Get example from store
  const exampleSource = useExampleStore((s) => s.exampleSource);
  const exampleClaim = useExampleStore((s) => s.exampleClaim);

  // Update source/claim when example is selected
  useEffect(() => {
    if (exampleSource !== undefined) {
      setSourceCode(exampleSource);
      setIsExpanded(true); // Expand to show the loaded example
    }
  }, [exampleSource]);

  useEffect(() => {
    if (exampleClaim !== undefined) {
      setClaimName(exampleClaim);
    }
  }, [exampleClaim]);

  const {
    startSession,
    isLoading,
    error,
    clearError,
    hasActiveSession,
    claimType,
  } = useProofSession();

  // Get the generated proof script from the store
  const generatedScript = useGeneratedProofScript();

  const handleBeforeMount: BeforeMount = useCallback((monaco) => {
    registerPieLanguage(monaco);
    registerPieCompletions(monaco);
    registerPieHover(monaco);
  }, []);

  const handleEditorMount: OnMount = useCallback((editor, monaco) => {
    editorRef.current = editor;
    monacoRef.current = monaco;
  }, []);

  useEffect(() => {
    let isCancelled = false;
    const timer = window.setTimeout(async () => {
      const editor = editorRef.current;
      const monaco = monacoRef.current;
      const model = editor?.getModel();
      if (!editor || !monaco || !model) return;

      try {
        const result = await diagnosticsWorker.checkSource(sourceCode);
        if (isCancelled) return;

        monaco.editor.setModelMarkers(
          model,
          'pie',
          result.diagnostics.map((diagnostic) => ({
            severity:
              diagnostic.severity === 'error'
                ? monaco.MarkerSeverity.Error
                : monaco.MarkerSeverity.Warning,
            message: diagnostic.message,
            startLineNumber: diagnostic.range.startLine,
            startColumn: diagnostic.range.startColumn,
            endLineNumber: diagnostic.range.endLine,
            endColumn: diagnostic.range.endColumn,
          })),
        );
        setLiveDiagnostics(result.diagnostics);
      } catch {
        if (!isCancelled) {
          monaco.editor.setModelMarkers(model, 'pie', []);
          setLiveDiagnostics([]);
        }
      }
    }, 350);

    return () => {
      isCancelled = true;
      window.clearTimeout(timer);
    };
  }, [sourceCode]);

  const handleStartProof = useCallback(async () => {
    if (!sourceCode.trim() || !claimName.trim()) {
      return;
    }

    try {
      await startSession(sourceCode, claimName);
      // Auto-collapse on success
      setIsExpanded(false);
    } catch (e) {
      // Error is already set in the hook
      console.error('Failed to start proof:', e);
    }
  }, [sourceCode, claimName, startSession]);

  const handleToggle = useCallback(() => {
    setIsExpanded((prev) => !prev);
  }, []);

  return (
    <div className="border-b bg-card">
      {/* Header - always visible */}
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
            {/* Source code text area */}
            <div className="lg:col-span-2">
              <label className="mb-1 block text-sm font-medium text-muted-foreground">
                Pie Source Code
              </label>
              <div className="overflow-hidden rounded-md border">
                <Editor
                  height="160px"
                  language="pie"
                  value={sourceCode}
                  beforeMount={handleBeforeMount}
                  onMount={handleEditorMount}
                  onChange={(value) => setSourceCode(value ?? '')}
                  options={{
                    minimap: { enabled: false },
                    fontSize: 13,
                    lineNumbers: 'on',
                    scrollBeyondLastLine: false,
                    wordWrap: 'on',
                    automaticLayout: true,
                    tabSize: 2,
                    insertSpaces: true,
                    readOnly: isLoading,
                    quickSuggestions: { other: true, comments: false, strings: false },
                    suggestOnTriggerCharacters: true,
                  }}
                />
              </div>
              {liveDiagnostics.length > 0 && (
                <div className="mt-2 max-h-24 overflow-auto rounded-md border border-destructive/40 bg-destructive/10 p-2">
                  <p className="mb-1 text-xs font-semibold text-destructive">
                    {liveDiagnostics.length} source problem{liveDiagnostics.length > 1 ? 's' : ''}
                  </p>
                  <ul className="space-y-1 text-xs text-destructive">
                    {liveDiagnostics.slice(0, 4).map((diagnostic) => (
                      <li key={`${diagnostic.range.startLine}:${diagnostic.range.startColumn}:${diagnostic.message}`}>
                        <span className="font-mono">
                          {diagnostic.range.startLine}:{diagnostic.range.startColumn}
                        </span>{' '}
                        {diagnostic.message}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>

            {/* Claim name and button */}
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
                  disabled={isLoading}
                />
              </div>

              <button
                className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-50"
                onClick={handleStartProof}
                disabled={isLoading || !sourceCode.trim() || !claimName.trim()}
              >
                {isLoading ? (
                  <span className="flex items-center justify-center gap-2">
                    <span className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                    Starting...
                  </span>
                ) : hasActiveSession ? (
                  'Restart Proof'
                ) : (
                  'Start Proof'
                )}
              </button>

              {/* Error display */}
              {error && (
                <div className="rounded-md border border-destructive/50 bg-destructive/10 p-2">
                  <div className="flex items-start justify-between gap-2">
                    <p className="text-xs text-destructive">{error}</p>
                    <button
                      className="text-xs text-destructive hover:underline"
                      onClick={(e) => {
                        e.stopPropagation();
                        clearError();
                      }}
                    >
                      Dismiss
                    </button>
                  </div>
                </div>
              )}

              {/* Success indicator */}
              {hasActiveSession && !error && (
                <div className="rounded-md border border-green-200 bg-green-50 p-2">
                  <p className="text-xs text-green-800">
                    ✓ Proof session active
                  </p>
                  {claimType && (
                    <p className="mt-1 truncate font-mono text-xs text-green-700">
                      Type: {claimType}
                    </p>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Generated proof script - shown when proof is active */}
          {hasActiveSession && generatedScript && (
            <div className="mt-4 border-t pt-4">
              <div className="mb-2 flex items-center justify-between">
                <label className="text-sm font-medium text-muted-foreground">
                  Generated Proof Script
                </label>
                <button
                  className="rounded bg-secondary px-2 py-1 text-xs hover:bg-secondary/80"
                  onClick={(e) => {
                    e.stopPropagation();
                    navigator.clipboard.writeText(generatedScript);
                  }}
                  title="Copy to clipboard"
                >
                  Copy
                </button>
              </div>
              <pre className="max-h-48 overflow-auto rounded-md border bg-muted/50 p-3 font-mono text-sm">
                {generatedScript}
              </pre>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
