/* eslint-disable no-console */
/* eslint-disable @typescript-eslint/no-explicit-any */

interface WorkerDiagnostic {
  severity: "error" | "warning";
  startLine: number;
  startColumn: number;
  endLine: number;
  endColumn: number;
  message: string;
}

interface ValidationResultMessage {
  type: "validation-result";
  diagnostics: WorkerDiagnostic[];
}

interface ValidationErrorMessage {
  type: "validation-error";
  error: string;
}

interface ContextInfoResult {
  type: "context-info-result";
  contextLines: string[];
  inTacticalProof: boolean;
  proofInfo: string | null;
  error?: string;
}

type WorkerResponse = ValidationResultMessage | ValidationErrorMessage | ContextInfoResult;

type MonacoDisposable = { dispose(): void };

// Callback type for context info updates
export type ContextInfoCallback = (
  contextLines: string[],
  inTacticalProof: boolean,
  proofInfo: string | null
) => void;

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
  private debouncedContextInfo: (() => void) | null = null;
  private diagnostics: WorkerDiagnostic[] = [];
  private contextInfoCallback: ContextInfoCallback | null = null;

  constructor(monacoInstance: any, editorInstance: any) {
    this.monaco = monacoInstance;
    this.editor = editorInstance;
  }

  /**
   * Set a callback to receive context info updates.
   */
  setContextInfoCallback(callback: ContextInfoCallback): void {
    this.contextInfoCallback = callback;
  }

  /**
   * Initialize the language client and connect it to the language server worker.
   */
  async start(): Promise<void> {
    // Use absolute path since this gets bundled into app.js at the root
    this.worker = new Worker("lsp/pie-lsp-worker-bundle.js");

    this.worker.onmessage = (event: MessageEvent<WorkerResponse>) => {
      this.handleWorkerMessage(event.data);
    };
    this.worker.onerror = (error) => {
      console.error("LSP Worker error:", error);
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
      this.worker.postMessage({ type: "validate", source });
    }, 220);

    // Debounced context info request
    this.debouncedContextInfo = this.debounce(() => {
      this.requestContextInfo();
    }, 100);

    const changeDisposable = this.editor?.onDidChangeModelContent?.(() => {
      if (this.debouncedValidate) {
        this.debouncedValidate();
      }
      if (this.debouncedContextInfo) {
        this.debouncedContextInfo();
      }
    });
    if (changeDisposable) {
      this.disposables.push(changeDisposable);
    }

    // Listen for cursor position changes
    const cursorDisposable = this.editor?.onDidChangeCursorPosition?.(() => {
      if (this.debouncedContextInfo) {
        this.debouncedContextInfo();
      }
    });
    if (cursorDisposable) {
      this.disposables.push(cursorDisposable);
    }

    const hoverDisposable = this.monaco.languages.registerHoverProvider("pie", {
      provideHover: (model: any, position: any) =>
        this.provideHover(model, position),
    });
    this.disposables.push(hoverDisposable);

    // Register completion provider
    const completionDisposable =
      this.monaco.languages.registerCompletionItemProvider("pie", {
        provideCompletionItems: (model: any, position: any) =>
          this.provideCompletionItems(model, position),
      });
    this.disposables.push(completionDisposable);

    // Register definition provider
    const definitionDisposable =
      this.monaco.languages.registerDefinitionProvider("pie", {
        provideDefinition: (model: any, position: any) =>
          this.provideDefinition(model, position),
      });
    this.disposables.push(definitionDisposable);

    if (this.debouncedValidate) {
      this.debouncedValidate();
    }
  }

  /**
   * Stop the language client and terminate the worker.
   */
  async stop(): Promise<void> {
    this.clearMarkers();

    this.disposables.forEach((disposable) => {
      if (disposable && typeof disposable.dispose === "function") {
        disposable.dispose();
      }
    });
    this.disposables = [];
    this.debouncedValidate = null;
    this.debouncedContextInfo = null;
    this.diagnostics = [];
    this.contextInfoCallback = null;

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

    if (message.type === "validation-result") {
      this.updateDiagnostics(message.diagnostics ?? []);
    } else if (message.type === "validation-error") {
      this.updateDiagnostics([
        {
          severity: "error",
          startLine: 1,
          startColumn: 1,
          endLine: 1,
          endColumn: 2,
          message: message.error,
        },
      ]);
    } else if (message.type === "context-info-result") {
      // Handle context info result
      if (this.contextInfoCallback) {
        this.contextInfoCallback(
          message.contextLines,
          message.inTacticalProof,
          message.proofInfo
        );
      }
    }
  }

  /**
   * Request context info at the current cursor position.
   */
  requestContextInfo(): void {
    if (!this.worker) {
      return;
    }
    
    const model = this.editor?.getModel?.();
    const position = this.editor?.getPosition?.();
    
    if (!model || !position) {
      return;
    }
    
    const source = model.getValue();
    this.worker.postMessage({
      type: "context-info",
      source,
      line: position.lineNumber - 1, // Convert to 0-based
      column: position.column - 1,
    });
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
      const endColumn = this.ensurePositiveNumber(
        diag.endColumn,
        startColumn + 1,
      );
      return {
        startLineNumber: startLine,
        startColumn,
        endLineNumber: endLine,
        endColumn,
        message: diag.message,
        severity:
          diag.severity === "warning"
            ? this.monaco.MarkerSeverity.Warning
            : this.monaco.MarkerSeverity.Error,
      };
    });

    this.monaco.editor.setModelMarkers(model, "pie-lsp", markers);
  }

  private async provideHover(
    model: any,
    position: { lineNumber: number; column: number },
  ) {
    if (!this.worker) {
      return null;
    }

    // First, check if there's a diagnostic at this position
    const diagnostic = this.diagnostics.find((diag) => {
      const startLine = this.ensurePositiveNumber(
        diag.startLine,
        position.lineNumber,
      );
      const endLine = this.ensurePositiveNumber(diag.endLine, startLine);
      const startColumn = this.ensurePositiveNumber(diag.startColumn, 1);
      const endColumn = this.ensurePositiveNumber(
        diag.endColumn,
        startColumn + 1,
      );

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

    if (diagnostic) {
      const startLine = this.ensurePositiveNumber(
        diagnostic.startLine,
        position.lineNumber,
      );
      const endLine = this.ensurePositiveNumber(diagnostic.endLine, startLine);
      const startColumn = this.ensurePositiveNumber(diagnostic.startColumn, 1);
      const endColumn = this.ensurePositiveNumber(
        diagnostic.endColumn,
        startColumn + 1,
      );

      return {
        contents: [
          {
            value: `**${diagnostic.severity === "warning" ? "Warning" : "Error"}**\n\n${diagnostic.message}`,
          },
        ],
        range: {
          startLineNumber: startLine,
          startColumn,
          endLineNumber: endLine,
          endColumn,
        },
      };
    }

    // If no diagnostic, request hover info from worker
    return new Promise((resolve) => {
      const handleHover = (event: MessageEvent) => {
        const message = event.data;
        if (message.type === "hover-result") {
          this.worker?.removeEventListener("message", handleHover);

          if (!message.hoverInfo) {
            resolve(null);
            return;
          }

          const info = message.hoverInfo;
          let markdownContent = `**${info.title}**\n\n${info.summary}`;

          if (info.details) {
            markdownContent += `\n\n${info.details}`;
          }

          if (info.examples) {
            markdownContent += `\n\n**Examples:**\n\`\`\`pie\n${info.examples}\n\`\`\``;
          }

          resolve({
            contents: [{ value: markdownContent }],
          });
        }
      };

      if (this.worker) {
        this.worker.addEventListener("message", handleHover);

        const source = model.getValue();
        this.worker.postMessage({
          type: "hover",
          source,
          line: position.lineNumber - 1,
          column: position.column - 1,
        });
      }

      // Timeout fallback
      setTimeout(() => {
        this.worker?.removeEventListener("message", handleHover);
        resolve(null);
      }, 1000);
    });
  }

  private async provideCompletionItems(
    model: any,
    position: any,
  ): Promise<any> {
    if (!this.worker) {
      return { suggestions: [] };
    }

    return new Promise((resolve) => {
      const handleCompletion = (event: MessageEvent) => {
        const message = event.data;
        if (message.type === "completion-result") {
          this.worker?.removeEventListener("message", handleCompletion);

          // Calculate the range to replace based on word boundaries
          const wordRange = message.wordRange;
          const range = wordRange
            ? {
                startLineNumber: position.lineNumber,
                startColumn: wordRange.start + 1, // Monaco uses 1-based columns
                endLineNumber: position.lineNumber,
                endColumn: wordRange.end + 1,
              }
            : {
                startLineNumber: position.lineNumber,
                startColumn: position.column,
                endLineNumber: position.lineNumber,
                endColumn: position.column,
              };

          const suggestions = message.completions.map((item: any) => {
            // Map kind strings to Monaco CompletionItemKind
            let kind = this.monaco.languages.CompletionItemKind.Text;
            switch (item.kind) {
              case "Keyword":
                kind = this.monaco.languages.CompletionItemKind.Keyword;
                break;
              case "Function":
                kind = this.monaco.languages.CompletionItemKind.Function;
                break;
              case "Variable":
                kind = this.monaco.languages.CompletionItemKind.Variable;
                break;
              case "TypeParameter":
                kind = this.monaco.languages.CompletionItemKind.Class;
                break;
              case "Value":
                kind = this.monaco.languages.CompletionItemKind.Value;
                break;
              case "Snippet":
                kind = this.monaco.languages.CompletionItemKind.Snippet;
                break;
            }

            return {
              label: item.label,
              kind,
              detail: item.detail,
              insertText: item.label,
              range,
            };
          });

          resolve({ suggestions });
        }
      };

      if (this.worker) {
        this.worker.addEventListener("message", handleCompletion);

        const source = model.getValue();
        this.worker.postMessage({
          type: "completion",
          source,
          line: position.lineNumber - 1,
          column: position.column - 1,
        });
      }

      // Timeout fallback
      setTimeout(() => {
        this.worker?.removeEventListener("message", handleCompletion);
        resolve({ suggestions: [] });
      }, 1000);
    });
  }

  private async provideDefinition(model: any, position: any): Promise<any> {
    if (!this.worker) {
      return null;
    }

    return new Promise((resolve) => {
      const handleDefinition = (event: MessageEvent) => {
        const message = event.data;
        if (message.type === "definition-result") {
          this.worker?.removeEventListener("message", handleDefinition);

          if (message.location) {
            resolve({
              uri: model.uri,
              range: {
                startLineNumber: message.location.line + 1,
                startColumn: message.location.startColumn + 1,
                endLineNumber: message.location.line + 1,
                endColumn: message.location.endColumn + 1,
              },
            });
          } else {
            resolve(null);
          }
        }
      };

      if (this.worker) {
        this.worker.addEventListener("message", handleDefinition);

        const source = model.getValue();
        this.worker.postMessage({
          type: "definition",
          source,
          line: position.lineNumber - 1,
          column: position.column - 1,
        });
      }

      // Timeout fallback
      setTimeout(() => {
        this.worker?.removeEventListener("message", handleDefinition);
        resolve(null);
      }, 1000);
    });
  }

  private clearMarkers(): void {
    const model = this.editor?.getModel?.();
    if (model) {
      this.monaco.editor.setModelMarkers(model, "pie-lsp", []);
    }
  }

  private ensurePositiveNumber(
    value: number | null | undefined,
    fallback: number,
  ): number {
    if (typeof value !== "number" || Number.isNaN(value)) {
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
  monaco.languages.register({ id: "pie" });

  // Register language configuration
  monaco.languages.setLanguageConfiguration("pie", {
    comments: {
      lineComment: ";",
      blockComment: ["#|", "|#"],
    },
    brackets: [["(", ")"]],
    autoClosingPairs: [{ open: "(", close: ")" }],
    surroundingPairs: [{ open: "(", close: ")" }],
    indentationRules: {
      // line that contains opening paren but not closing
      increaseIndentPattern: /^\s*\(.*[^)]$/,
      // closing
      decreaseIndentPattern: /^\s*\)/,
    },

    onEnterRules: [
      {
        // same thing as above
        beforeText: /^\s*\(.*[^)]$/,
        action: {
          indentAction: monaco.languages.IndentAction.Indent,
        },
      },
      {
        beforeText: /^\s*\(.*$/,
        afterText: /^\s*\)/,
        action: {
          indentAction: monaco.languages.IndentAction.IndentOutdent,
        },
      },
      {
        beforeText: /^.*$/,
        afterText: /^\s*\)/,
        action: {
          indentAction: monaco.languages.IndentAction.Outdent,
        },
      },
    ],
  });

  // Register a tokens provider for syntax highlighting
  monaco.languages.setMonarchTokensProvider("pie", {
    defaultToken: "",
    tokenPostfix: ".pie",

    keywords: [
      "lambda",
      "λ",
      "Pi",
      "Π",
      "Sigma",
      "Σ",
      "define",
      "claim",
      "the",
      "check-same",
      "define-tactically",
      "TODO",
      "U",
      "Nat",
      "Atom",
      "List",
      "Vec",
      "Either",
      "zero",
      "add1",
      "nil",
      "cons",
      "car",
      "cdr",
      "ind-Nat",
      "rec-Nat",
      "iter-Nat",
      "ind-List",
      "rec-List",
      "ind-Vec",
      "rec-Vec",
      "ind-=",
      "replace",
      "trans",
      "cong",
      "symm",
      "same",
      "left",
      "right",
      "ind-Either",
      "vecnil",
      "vec::",
      "which-Nat",
      "quote",
      "Pair",
      "Trivial",
      "sole",
      "::",
      "Absurd",
      "ind-Absurd",
      "=",
      "head",
      "tail",
      "Either",
      "->",
      "→",
      "exact",
      "intro",
      "exists",
      "elim-Nat",
      "elim-List",
      "elim-Vec",
      "elim-Equal",
      "elim-Either",
      "elim-Absurd",
      "split-Pair",
      "then",
      "apply",
      "go-Left",
      "go-Right",
    ],
    operators: [],

    // Common regular expressions
    symbols: /[=><!~?:&|+\-*/^%]+/,

    // Tokenizer rules
    tokenizer: {
      root: [
        // Whitespace
        { include: "@whitespace" },

        // Special forms and keywords
        [
          /\((?:lambda|λ|Pi|Π|Sigma|Σ|define|claim|the|check-same|define-tactically)\b/,
          "keyword",
        ],

        // Identifiers and keywords
        [
          /[a-zA-Z][a-zA-Z0-9\-_!?*+=<>λΠΣ→]*/,
          {
            cases: {
              "@keywords": "keyword",
              "@default": "identifier",
            },
          },
        ],

        // Numbers
        [/\d+/, "number"],

        // Strings
        [/"([^"\\]|\\.)*$/, "string.invalid"],
        [/"/, "string", "@string"],

        // Quoted atoms
        [/'[a-zA-Z][a-zA-Z0-9\-_!?*+=<>]*/, "string.quoted"],

        // Delimiters and operators
        [/[()[\]]/, "@brackets"],
        [
          /@symbols/,
          {
            cases: {
              "@operators": "operator",
              "@default": "",
            },
          },
        ],
      ],

      whitespace: [
        [/[ \t\r\n]+/, "white"],
        [/;.*$/, "comment"],
        [/#\|/, "comment", "@comment"],
      ],

      comment: [
        [/[^#|]+/, "comment"],
        [/\|#/, "comment", "@pop"],
        [/[#|]/, "comment"],
      ],

      string: [
        [/[^\\"]+/, "string"],
        [/\\./, "string.escape"],
        [/"/, "string", "@pop"],
      ],
    },
  });
}
