/* eslint-disable no-console */
/* eslint-disable @typescript-eslint/no-explicit-any */
/**
 * Simple LSP client that connects Monaco Editor to our browser-based language server
 * without using monaco-languageclient (to avoid version conflicts).
 */
export class PieLanguageClient {
    constructor(monacoInstance, editorInstance) {
        this.worker = null;
        this.disposables = [];
        this.debouncedValidate = null;
        this.diagnostics = [];
        this.monaco = monacoInstance;
        this.editor = editorInstance;
    }
    /**
     * Initialize the language client and connect it to the language server worker.
     */
    async start() {
        this.worker = new Worker(new URL("./pie-lsp-worker-bundle.js", import.meta.url), { type: "module" });
        this.worker.onmessage = (event) => {
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
        const changeDisposable = this.editor?.onDidChangeModelContent?.(() => {
            if (this.debouncedValidate) {
                this.debouncedValidate();
            }
        });
        if (changeDisposable) {
            this.disposables.push(changeDisposable);
        }
        const hoverDisposable = this.monaco.languages.registerHoverProvider("pie", {
            provideHover: (model, position) => this.provideHover(model, position),
        });
        this.disposables.push(hoverDisposable);
        // Register completion provider
        const completionDisposable = this.monaco.languages.registerCompletionItemProvider("pie", {
            provideCompletionItems: (model, position) => this.provideCompletionItems(model, position),
        });
        this.disposables.push(completionDisposable);
        // Register definition provider
        const definitionDisposable = this.monaco.languages.registerDefinitionProvider("pie", {
            provideDefinition: (model, position) => this.provideDefinition(model, position),
        });
        this.disposables.push(definitionDisposable);
        if (this.debouncedValidate) {
            this.debouncedValidate();
        }
    }
    /**
     * Stop the language client and terminate the worker.
     */
    async stop() {
        this.clearMarkers();
        this.disposables.forEach((disposable) => {
            if (disposable && typeof disposable.dispose === "function") {
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
    isRunning() {
        return this.worker !== null;
    }
    handleWorkerMessage(message) {
        if (!message) {
            return;
        }
        if (message.type === "validation-result") {
            this.updateDiagnostics(message.diagnostics ?? []);
        }
        else if (message.type === "validation-error") {
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
        }
    }
    updateDiagnostics(diagnostics) {
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
                severity: diag.severity === "warning"
                    ? this.monaco.MarkerSeverity.Warning
                    : this.monaco.MarkerSeverity.Error,
            };
        });
        this.monaco.editor.setModelMarkers(model, "pie-lsp", markers);
    }
    async provideHover(model, position) {
        if (!this.worker) {
            return null;
        }
        // First, check if there's a diagnostic at this position
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
        if (diagnostic) {
            const startLine = this.ensurePositiveNumber(diagnostic.startLine, position.lineNumber);
            const endLine = this.ensurePositiveNumber(diagnostic.endLine, startLine);
            const startColumn = this.ensurePositiveNumber(diagnostic.startColumn, 1);
            const endColumn = this.ensurePositiveNumber(diagnostic.endColumn, startColumn + 1);
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
            const handleHover = (event) => {
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
    async provideCompletionItems(model, position) {
        if (!this.worker) {
            return { suggestions: [] };
        }
        return new Promise((resolve) => {
            const handleCompletion = (event) => {
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
                    const suggestions = message.completions.map((item) => {
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
    async provideDefinition(model, position) {
        if (!this.worker) {
            return null;
        }
        return new Promise((resolve) => {
            const handleDefinition = (event) => {
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
                    }
                    else {
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
    clearMarkers() {
        const model = this.editor?.getModel?.();
        if (model) {
            this.monaco.editor.setModelMarkers(model, "pie-lsp", []);
        }
    }
    ensurePositiveNumber(value, fallback) {
        if (typeof value !== "number" || Number.isNaN(value)) {
            return fallback;
        }
        return value < 1 ? fallback : value;
    }
    debounce(fn, delay) {
        let handle = null;
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
export function registerPieLanguage(monaco) {
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
//# sourceMappingURL=lsp-client-simple.js.map