/* eslint-disable no-console */
/* eslint-disable @typescript-eslint/no-explicit-any */

interface WorkerDiagnostic {
  severity: 'error' | 'warning';
  startLine: number;
  startColumn: number;
  endLine: number;
  endColumn: number;
  message: string;
}

interface ValidationResultMessage {
  type: 'validation-result';
  diagnostics: WorkerDiagnostic[];
}

interface ValidationErrorMessage {
  type: 'validation-error';
  error: string;
}

type WorkerResponse = ValidationResultMessage | ValidationErrorMessage;

type MonacoDisposable = { dispose(): void };

/**
 * Simple LSP client that connects Monaco Editor to our browser-based language server
 * without using monaco-languageclient (to avoid version conflicts).
 */
export class PieLanguageClient {
  private worker: Worker | null = null;
  private readonly monaco: any;
  private readonly editor: any;
  private disposables: MonacoDisposable[] = [];
  private debouncedValidate: (() => void) | null = null;
  private diagnostics: WorkerDiagnostic[] = [];

  constructor(monacoInstance: any, editorInstance: any) {
    this.monaco = monacoInstance;
    this.editor = editorInstance;
  }

  /**
   * Initialize the language client and connect it to the language server worker.
   */
  async start(): Promise<void> {
    this.worker = new Worker(new URL('./pie-lsp-worker-bundle.js', import.meta.url), { type: 'module' });

    this.worker.onmessage = (event: MessageEvent<WorkerResponse>) => {
      this.handleWorkerMessage(event.data);
    };
    this.worker.onerror = (error) => {
      console.error('LSP Worker error:', error);
    };

    const model = this.editor?.getModel?.();
    if (!model) {
      return;
    }

    this.debouncedValidate = this.debounce(() => {
      if (!this.worker) {
        return;
      }
      const source = model.getValue();
      this.worker.postMessage({ type: 'validate', source });
    }, 220);

    const changeDisposable = this.editor?.onDidChangeModelContent?.(() => {
      if (this.debouncedValidate) {
        this.debouncedValidate();
      }
    });
    if (changeDisposable) {
      this.disposables.push(changeDisposable);
    }

    const hoverDisposable = this.monaco.languages.registerHoverProvider('pie', {
      provideHover: (_model: any, position: any) => this.provideHover(position)
    });
    this.disposables.push(hoverDisposable);

    if (this.debouncedValidate) {
      this.debouncedValidate();
    }
  }

  /**
   * Stop the language client and terminate the worker.
   */
  async stop(): Promise<void> {
    this.clearMarkers();

    this.disposables.forEach(disposable => {
      if (disposable && typeof disposable.dispose === 'function') {
        disposable.dispose();
      }
    });
    this.disposables = [];
    this.debouncedValidate = null;
    this.diagnostics = [];

    if (this.worker) {
      this.worker.terminate();
      this.worker = null;
    }
  }

  /**
   * Check if the client is running.
   */
  isRunning(): boolean {
    return this.worker !== null;
  }

  private handleWorkerMessage(message: WorkerResponse): void {
    if (!message) {
      return;
    }

    if (message.type === 'validation-result') {
      this.updateDiagnostics(message.diagnostics ?? []);
    } else if (message.type === 'validation-error') {
      this.updateDiagnostics([
        {
          severity: 'error',
          startLine: 1,
          startColumn: 1,
          endLine: 1,
          endColumn: 2,
          message: message.error
        }
      ]);
    }
  }

  private updateDiagnostics(diagnostics: WorkerDiagnostic[]): void {
    this.diagnostics = diagnostics;
    const model = this.editor?.getModel?.();
    if (!model) {
      return;
    }

    const markers = diagnostics.map((diag) => {
      const startLine = this.ensurePositiveNumber(diag.startLine, 1);
      const endLine = this.ensurePositiveNumber(diag.endLine, startLine);
      const startColumn = this.ensurePositiveNumber(diag.startColumn, 1);
      const endColumn = this.ensurePositiveNumber(diag.endColumn, startColumn + 1);
      return {
        startLineNumber: startLine,
        startColumn,
        endLineNumber: endLine,
        endColumn,
        message: diag.message,
        severity: diag.severity === 'warning'
          ? this.monaco.MarkerSeverity.Warning
          : this.monaco.MarkerSeverity.Error
      };
    });

    this.monaco.editor.setModelMarkers(model, 'pie-lsp', markers);
  }

  private provideHover(position: { lineNumber: number; column: number; }) {
    const diagnostic = this.diagnostics.find((diag) => {
      const startLine = this.ensurePositiveNumber(diag.startLine, position.lineNumber);
      const endLine = this.ensurePositiveNumber(diag.endLine, startLine);
      const startColumn = this.ensurePositiveNumber(diag.startColumn, 1);
      const endColumn = this.ensurePositiveNumber(diag.endColumn, startColumn + 1);

      if (position.lineNumber < startLine || position.lineNumber > endLine) {
        return false;
      }
      if (position.lineNumber === startLine && position.column < startColumn) {
        return false;
      }
      if (position.lineNumber === endLine && position.column > endColumn) {
        return false;
      }
      return true;
    });

    if (!diagnostic) {
      return null;
    }

    const startLine = this.ensurePositiveNumber(diagnostic.startLine, position.lineNumber);
    const endLine = this.ensurePositiveNumber(diagnostic.endLine, startLine);
    const startColumn = this.ensurePositiveNumber(diagnostic.startColumn, 1);
    const endColumn = this.ensurePositiveNumber(diagnostic.endColumn, startColumn + 1);

    return {
      contents: [
        { value: `**${diagnostic.severity === 'warning' ? 'Warning' : 'Error'}**\\n\\n${diagnostic.message}` }
      ],
      range: {
        startLineNumber: startLine,
        startColumn,
        endLineNumber: endLine,
        endColumn
      }
    };
  }

  private clearMarkers(): void {
    const model = this.editor?.getModel?.();
    if (model) {
      this.monaco.editor.setModelMarkers(model, 'pie-lsp', []);
    }
  }

  private ensurePositiveNumber(value: number | null | undefined, fallback: number): number {
    if (typeof value !== 'number' || Number.isNaN(value)) {
      return fallback;
    }
    return value < 1 ? fallback : value;
  }

  private debounce(fn: () => void, delay: number): () => void {
    let handle: number | null = null;
    return () => {
      if (handle !== null) {
        window.clearTimeout(handle);
      }
      handle = window.setTimeout(() => {
        handle = null;
        fn();
      }, delay);
    };
  }
}

/**
 * Register the Pie language with Monaco Editor with syntax highlighting.
 */
export function registerPieLanguage(monaco: any): void {
  // Register a new language
  monaco.languages.register({ id: 'pie' });

  // Register language configuration
  monaco.languages.setLanguageConfiguration('pie', {
    comments: {
      lineComment: ';',
      blockComment: ['#|', '|#']
    },
    brackets: [
      ['(', ')'],
      ['[', ']'],
      ['{', '}']
    ],
    autoClosingPairs: [
      { open: '(', close: ')' },
      { open: '[', close: ']' },
      { open: '{', close: '}' },
      { open: '"', close: '"' }
    ],
    surroundingPairs: [
      { open: '(', close: ')' },
      { open: '[', close: ']' },
      { open: '{', close: '}' },
      { open: '"', close: '"' }
    ]
  });

  // Register a tokens provider for syntax highlighting
  monaco.languages.setMonarchTokensProvider('pie', {
    defaultToken: '',
    tokenPostfix: '.pie',

    keywords: [
      'lambda', 'λ', 'Pi', 'Π', 'Sigma', 'Σ',
      'define', 'claim', 'the', 'check-same',
      'define-tactically', 'TODO',
      'U', 'Universe', 'Nat', 'Atom', 'List', 'Vec', 'Either',
      'zero', 'add1', 'nil', 'cons', 'car', 'cdr',
      'ind-Nat', 'rec-Nat', 'iter-Nat',
      'ind-List', 'rec-List',
      'ind-Vec', 'rec-Vec',
      'ind-Either',
      'replace', 'trans', 'cong', 'symm', 'same',
      'left', 'right', 'ind-Either',
      'vecnil', 'vec::'
    ],

    operators: [
      '->', '→', '=', '::'
    ],

    // Common regular expressions
    symbols: /[=><!~?:&|+\-*\/^%]+/,

    // Tokenizer rules
    tokenizer: {
      root: [
        // Whitespace
        { include: '@whitespace' },

        // Special forms and keywords
        [/\((?:lambda|λ|Pi|Π|Sigma|Σ|define|claim|the|check-same|define-tactically)\b/, 'keyword'],

        // Identifiers and keywords
        [/[a-zA-Z][a-zA-Z0-9\-_!?*+=<>λΠΣ→]*/, {
          cases: {
            '@keywords': 'keyword',
            '@default': 'identifier'
          }
        }],

        // Numbers
        [/\d+/, 'number'],

        // Strings
        [/"([^"\\]|\\.)*$/, 'string.invalid'],
        [/"/, 'string', '@string'],

        // Quoted atoms
        [/'[a-zA-Z][a-zA-Z0-9\-_!?*+=<>]*/, 'string.quoted'],

        // Delimiters and operators
        [/[()[\]]/, '@brackets'],
        [/@symbols/, {
          cases: {
            '@operators': 'operator',
            '@default': ''
          }
        }],
      ],

      whitespace: [
        [/[ \t\r\n]+/, 'white'],
        [/;.*$/, 'comment'],
        [/#\|/, 'comment', '@comment'],
      ],

      comment: [
        [/[^#|]+/, 'comment'],
        [/\|#/, 'comment', '@pop'],
        [/[#|]/, 'comment']
      ],

      string: [
        [/[^\\"]+/, 'string'],
        [/\\./, 'string.escape'],
        [/"/, 'string', '@pop']
      ],
    },
  });
}
