"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
const node_1 = require("vscode-languageserver/node");
const vscode_languageserver_textdocument_1 = require("vscode-languageserver-textdocument");
const parser_1 = require("../../pie_interpreter/parser/parser");
const context_1 = require("../../pie_interpreter/utils/context");
const utils_1 = require("../../pie_interpreter/types/utils");
const S = __importStar(require("../../pie_interpreter/types/source"));
// Cache for type checking results to avoid re-checking unchanged content
const typeCheckCache = new Map();
// Helper function to compute a simple hash of document content
function computeContentHash(content) {
    let hash = 0;
    for (let i = 0; i < content.length; i++) {
        const char = content.charCodeAt(i);
        hash = ((hash << 5) - hash) + char;
        hash = hash & hash; // Convert to 32bit integer
    }
    return hash.toString();
}
// Convert Pie Location to LSP Range
function pieLocationToLspRange(location, document) {
    // If the location has source position information
    if (location.syntax) {
        const startPos = {
            line: location.syntax.start.line - 1, // LSP is 0-based, Pie might be 1-based
            character: location.syntax.start.column
        };
        const endPos = {
            line: location.syntax.end.line - 1,
            character: location.syntax.end.column
        };
        return { start: startPos, end: endPos };
    }
    // Fallback: return a range covering the first character if no precise location
    return {
        start: { line: 0, character: 0 },
        end: { line: 0, character: 1 }
    };
}
// Convert Pie error message to human-readable string
function messageToString(message) {
    return message.message.map(part => {
        if (typeof part === 'string') {
            return part;
        }
        else {
            // If part is an object with prettyPrint method
            return part.prettyPrint ? part.prettyPrint() : part.toString();
        }
    }).join(' ');
}
// Global storage for symbol definitions across all documents
const symbolDefinitions = new Map();
// Create a connection for the server, using Node's IPC as a transport.
// Also include all preview / proposed LSP features.
const connection = (0, node_1.createConnection)(node_1.ProposedFeatures.all);
connection.console.log('Pie Language Server starting...');
console.error('Pie Language Server starting via console.error...');
// Create a simple text document manager.
const documents = new node_1.TextDocuments(vscode_languageserver_textdocument_1.TextDocument);
let hasConfigurationCapability = false;
let hasWorkspaceFolderCapability = false;
let hasDiagnosticRelatedInformationCapability = false;
connection.onInitialize((params) => {
    connection.console.log('Server: onInitialize called'); // for test useage
    const capabilities = params.capabilities;
    hasConfigurationCapability = !!(capabilities.workspace && !!capabilities.workspace.configuration);
    hasWorkspaceFolderCapability = !!(capabilities.workspace && !!capabilities.workspace.workspaceFolders);
    hasDiagnosticRelatedInformationCapability = !!(capabilities.textDocument &&
        capabilities.textDocument.publishDiagnostics &&
        capabilities.textDocument.publishDiagnostics.relatedInformation);
    const result = {
        capabilities: {
            textDocumentSync: node_1.TextDocumentSyncKind.Incremental,
            // Tell the client that this server supports code completion.
            completionProvider: {
                resolveProvider: true,
                triggerCharacters: ['(', ' '] // Trigger character
            },
            // Supports hover
            hoverProvider: true,
            // Definition provider
            definitionProvider: true,
            diagnosticProvider: {
                interFileDependencies: false,
                workspaceDiagnostics: false
            }
        }
    };
    if (hasWorkspaceFolderCapability) {
        result.capabilities.workspace = {
            workspaceFolders: {
                supported: true
            }
        };
    }
    return result;
});
connection.onInitialized(() => {
    if (hasConfigurationCapability) {
        // Register for all configuration changes.
        connection.client.register(node_1.DidChangeConfigurationNotification.type, undefined);
    }
    if (hasWorkspaceFolderCapability) {
        connection.workspace.onDidChangeWorkspaceFolders(_event => {
            connection.console.log('Workspace folder change event received.');
        });
    }
    connection.console.log('Server: onInitialized called');
});
// The global settings, used when the `workspace/configuration` request is not supported by the client.
// Please note that this is not the case when using this server with the client provided in this example
// but could happen with other clients.
const defaultSettings = { maxNumberOfProblems: 1000 };
let globalSettings = defaultSettings;
// Cache the settings of all open documents
const documentSettings = new Map();
// Track user-defined symbols per document
const documentSymbols = new Map();
// Parse document to extract user-defined symbols
function extractUserDefinedSymbols(document) {
    const text = document.getText();
    const symbols = new Map();
    // Regular expressions for Pie constructs
    const definePattern = /\(define\s+([a-zA-Z][a-zA-Z0-9\-_!?*+=<>]*)/g;
    const claimPattern = /\(claim\s+([a-zA-Z][a-zA-Z0-9\-_!?*+=<>]*)\s+(.+?)\)/g;
    const defineTacticallyPattern = /\(define-tactically\s+([a-zA-Z][a-zA-Z0-9\-_!?*+=<>]*)/g;
    // Extract definitions
    let match;
    while ((match = definePattern.exec(text)) !== null) {
        const name = match[1];
        if (!symbols.has(name)) {
            symbols.set(name, {
                label: name,
                kind: node_1.CompletionItemKind.Function,
                detail: 'User-defined function',
                documentation: `Defined in this file`
            });
        }
    }
    // Extract claims (with type information)
    while ((match = claimPattern.exec(text)) !== null) {
        const name = match[1];
        const type = match[2];
        symbols.set(name, {
            label: name,
            kind: node_1.CompletionItemKind.Function,
            detail: type,
            documentation: `User-defined: ${name}\nType: ${type}`
        });
    }
    // Extract tactical definitions
    while ((match = defineTacticallyPattern.exec(text)) !== null) {
        const name = match[1];
        if (!symbols.has(name)) {
            symbols.set(name, {
                label: name,
                kind: node_1.CompletionItemKind.Function,
                detail: 'User-defined (tactical)',
                documentation: `Defined tactically in this file`
            });
        }
    }
    // Also extract lambda parameters in the current scope
    // This is more complex and would need proper s-expression parsing
    // For now, we'll do a simple extraction of common patterns
    return symbols;
}
function extractSymbolDefinitions(document) {
    const text = document.getText();
    const symbols = new Map();
    const uri = document.uri;
    // More precise regex patterns that capture the entire construct
    const definePattern = /\(define\s+([a-zA-Z][a-zA-Z0-9\-_!?*+=<>]*)/g;
    const claimPattern = /\(claim\s+([a-zA-Z][a-zA-Z0-9\-_!?*+=<>]*)\s+([^)]+)\)/g;
    const defineTacticallyPattern = /\(define-tactically\s+([a-zA-Z][a-zA-Z0-9\-_!?*+=<>]*)/g;
    // Helper function to find the position of a match in the document
    function getPositionFromOffset(offset) {
        const beforeMatch = text.substring(0, offset);
        const lines = beforeMatch.split('\n');
        return {
            line: lines.length - 1,
            character: lines[lines.length - 1].length
        };
    }
    // Helper function to find the end position of a symbol name
    function getEndPosition(startPos, symbolName) {
        return {
            line: startPos.line,
            character: startPos.character + symbolName.length
        };
    }
    // Extract define statements
    let match;
    while ((match = definePattern.exec(text)) !== null) {
        const name = match[1];
        const matchStart = match.index + match[0].indexOf(name); // Position of the symbol name
        const startPos = getPositionFromOffset(matchStart);
        const endPos = getEndPosition(startPos, name);
        symbols.set(name, {
            name,
            location: {
                uri,
                range: {
                    start: startPos,
                    end: endPos
                }
            },
            type: 'define'
        });
    }
    // Reset regex lastIndex for reuse
    claimPattern.lastIndex = 0;
    // Extract claim statements (with type information)
    while ((match = claimPattern.exec(text)) !== null) {
        const name = match[1];
        const typeInfo = match[2].trim();
        const matchStart = match.index + match[0].indexOf(name);
        const startPos = getPositionFromOffset(matchStart);
        const endPos = getEndPosition(startPos, name);
        symbols.set(name, {
            name,
            location: {
                uri,
                range: {
                    start: startPos,
                    end: endPos
                }
            },
            type: 'claim',
            typeInfo
        });
    }
    // Reset regex lastIndex for reuse
    defineTacticallyPattern.lastIndex = 0;
    // Extract define-tactically statements
    while ((match = defineTacticallyPattern.exec(text)) !== null) {
        const name = match[1];
        const matchStart = match.index + match[0].indexOf(name);
        const startPos = getPositionFromOffset(matchStart);
        const endPos = getEndPosition(startPos, name);
        symbols.set(name, {
            name,
            location: {
                uri,
                range: {
                    start: startPos,
                    end: endPos
                }
            },
            type: 'define-tactically'
        });
    }
    return symbols;
}
connection.onDidChangeConfiguration(change => {
    if (hasConfigurationCapability) {
        // Reset all cached document settings
        documentSettings.clear();
    }
    else {
        globalSettings = ((change.settings.languageServerExample || defaultSettings));
    }
    // Refresh the diagnostics since the `maxNumberOfProblems` could have changed.
    // We could optimize things here and re-fetch the setting first can compare it
    // to the existing setting, but this is out of scope for this example.
    connection.languages.diagnostics.refresh();
});
// Only keep settings for open documents
documents.onDidClose(e => {
    documentSymbols.delete(e.document.uri);
    documentSettings.delete(e.document.uri);
});
connection.languages.diagnostics.on(async (params) => {
    const document = documents.get(params.textDocument.uri);
    if (document !== undefined) {
        return {
            kind: node_1.DocumentDiagnosticReportKind.Full,
            items: await validateTextDocument(document)
        };
    }
    else {
        return {
            kind: node_1.DocumentDiagnosticReportKind.Full,
            items: []
        };
    }
});
// Update the document change handler to trigger validation
documents.onDidChangeContent(change => {
    // Clear cache for changed document
    typeCheckCache.delete(change.document.uri);
    // Extract symbols (existing functionality)
    const symbols = extractUserDefinedSymbols(change.document);
    documentSymbols.set(change.document.uri, symbols);
    // Trigger validation which will show diagnostics
    validateTextDocument(change.document).then(diagnostics => {
        connection.console.log(`Validation complete for ${change.document.uri}: ${diagnostics.length} issues`);
    }).catch(error => {
        connection.console.error(`Validation failed for ${change.document.uri}: ${error.message}`);
    });
});
// Handle document open events to initialize symbol tracking
documents.onDidOpen(event => {
    const uri = event.document.uri;
    connection.console.log(`Document opened: ${uri}`);
    // Extract and store symbol definitions
    const symbols = extractSymbolDefinitions(event.document);
    symbolDefinitions.set(uri, symbols);
    connection.console.log(`Initialized ${symbols.size} symbols for ${uri}`);
});
// Clean up cache when file is closed
documents.onDidClose(event => {
    const uri = event.document.uri;
    typeCheckCache.delete(uri);
    documentSymbols.delete(uri);
    documentSettings.delete(uri);
});
// Updated validateTextDocument function to replace the existing empty one
async function validateTextDocument(textDocument) {
    const uri = textDocument.uri;
    const contentHash = computeContentHash(textDocument.getText());
    // Check cache first
    const cached = typeCheckCache.get(uri);
    if (cached && cached.contentHash === contentHash) {
        return cached.result.diagnostics;
    }
    // Perform type checking
    const result = typeCheckPieDocument(textDocument);
    // Cache the result
    typeCheckCache.set(uri, { contentHash, result });
    connection.console.log(`Type checked ${uri}: found ${result.diagnostics.length} diagnostics`);
    return result.diagnostics;
}
connection.onDidChangeWatchedFiles(_change => {
    // Monitored files have change in VSCode
    connection.console.log('We received a file change event');
});
// Define Pie language keywords for auto-completion
const PIE_KEYWORDS = [
    // Core types
    { label: 'U', kind: node_1.CompletionItemKind.Keyword, data: 1 },
    { label: 'Nat', kind: node_1.CompletionItemKind.TypeParameter, data: 2 },
    { label: 'zero', kind: node_1.CompletionItemKind.Constructor, data: 3 },
    { label: 'add1', kind: node_1.CompletionItemKind.Constructor, data: 4 },
    { label: 'Atom', kind: node_1.CompletionItemKind.TypeParameter, data: 5 },
    { label: 'Trivial', kind: node_1.CompletionItemKind.TypeParameter, data: 6 },
    { label: 'sole', kind: node_1.CompletionItemKind.Constructor, data: 7 },
    { label: 'Absurd', kind: node_1.CompletionItemKind.TypeParameter, data: 8 },
    // Function types
    { label: '->', kind: node_1.CompletionItemKind.Operator, data: 9 },
    { label: '→', kind: node_1.CompletionItemKind.Operator, data: 10 },
    { label: 'Pi', kind: node_1.CompletionItemKind.Keyword, data: 11 },
    { label: 'Π', kind: node_1.CompletionItemKind.Keyword, data: 12 },
    { label: 'lambda', kind: node_1.CompletionItemKind.Keyword, data: 13 },
    { label: 'λ', kind: node_1.CompletionItemKind.Keyword, data: 14 },
    { label: 'the', kind: node_1.CompletionItemKind.Keyword, data: 15 },
    // Product/Pair types
    { label: 'Sigma', kind: node_1.CompletionItemKind.Keyword, data: 16 },
    { label: 'Σ', kind: node_1.CompletionItemKind.Keyword, data: 17 },
    { label: 'Pair', kind: node_1.CompletionItemKind.TypeParameter, data: 18 },
    { label: 'cons', kind: node_1.CompletionItemKind.Constructor, data: 19 },
    { label: 'car', kind: node_1.CompletionItemKind.Function, data: 20 },
    { label: 'cdr', kind: node_1.CompletionItemKind.Function, data: 21 },
    // List types
    { label: 'List', kind: node_1.CompletionItemKind.TypeParameter, data: 22 },
    { label: 'nil', kind: node_1.CompletionItemKind.Constructor, data: 23 },
    { label: '::', kind: node_1.CompletionItemKind.Operator, data: 24 },
    // Vector types
    { label: 'Vec', kind: node_1.CompletionItemKind.TypeParameter, data: 25 },
    { label: 'vecnil', kind: node_1.CompletionItemKind.Constructor, data: 26 },
    { label: 'vec::', kind: node_1.CompletionItemKind.Operator, data: 27 },
    { label: 'head', kind: node_1.CompletionItemKind.Function, data: 28 },
    { label: 'tail', kind: node_1.CompletionItemKind.Function, data: 29 },
    // Sum types
    { label: 'Either', kind: node_1.CompletionItemKind.TypeParameter, data: 30 },
    { label: 'left', kind: node_1.CompletionItemKind.Constructor, data: 31 },
    { label: 'right', kind: node_1.CompletionItemKind.Constructor, data: 32 },
    // Equality types
    { label: '=', kind: node_1.CompletionItemKind.Operator, data: 33 },
    { label: 'same', kind: node_1.CompletionItemKind.Constructor, data: 34 },
    // Eliminators
    { label: 'which-Nat', kind: node_1.CompletionItemKind.Function, data: 35 },
    { label: 'iter-Nat', kind: node_1.CompletionItemKind.Function, data: 36 },
    { label: 'rec-Nat', kind: node_1.CompletionItemKind.Function, data: 37 },
    { label: 'ind-Nat', kind: node_1.CompletionItemKind.Function, data: 38 },
    { label: 'rec-List', kind: node_1.CompletionItemKind.Function, data: 39 },
    { label: 'ind-List', kind: node_1.CompletionItemKind.Function, data: 40 },
    { label: 'ind-Vec', kind: node_1.CompletionItemKind.Function, data: 41 },
    { label: 'ind-Either', kind: node_1.CompletionItemKind.Function, data: 42 },
    { label: 'ind-=', kind: node_1.CompletionItemKind.Function, data: 43 },
    { label: 'ind-Absurd', kind: node_1.CompletionItemKind.Function, data: 44 },
    // Equality operations
    { label: 'replace', kind: node_1.CompletionItemKind.Function, data: 45 },
    { label: 'trans', kind: node_1.CompletionItemKind.Function, data: 46 },
    { label: 'cong', kind: node_1.CompletionItemKind.Function, data: 47 },
    { label: 'symm', kind: node_1.CompletionItemKind.Function, data: 48 },
    // Quoted atoms
    { label: 'quote', kind: node_1.CompletionItemKind.Constructor, data: 49 },
    // Development aid
    { label: 'TODO', kind: node_1.CompletionItemKind.Keyword, data: 50 },
    // Top-level declarations
    { label: 'claim', kind: node_1.CompletionItemKind.Keyword, data: 51 },
    { label: 'define', kind: node_1.CompletionItemKind.Keyword, data: 52 },
    { label: 'check-same', kind: node_1.CompletionItemKind.Keyword, data: 53 },
    { label: 'define-tactically', kind: node_1.CompletionItemKind.Keyword, data: 54 },
    // Tactics
    { label: 'exact', kind: node_1.CompletionItemKind.Method, data: 55 },
    { label: 'intro', kind: node_1.CompletionItemKind.Method, data: 56 },
    { label: 'exists', kind: node_1.CompletionItemKind.Method, data: 57 },
    { label: 'elimNat', kind: node_1.CompletionItemKind.Method, data: 58 },
    { label: 'elimList', kind: node_1.CompletionItemKind.Method, data: 59 },
    { label: 'elimVec', kind: node_1.CompletionItemKind.Method, data: 60 },
    { label: 'elimEqual', kind: node_1.CompletionItemKind.Method, data: 61 },
    { label: 'elimEither', kind: node_1.CompletionItemKind.Method, data: 62 },
    { label: 'elimAbsurd', kind: node_1.CompletionItemKind.Method, data: 63 },
    { label: 'split', kind: node_1.CompletionItemKind.Method, data: 64 }
];
// This handler provides the initial list of the completion items.
connection.onCompletion((params) => {
    connection.console.log('===== COMPLETION TRIGGERED =====');
    connection.console.log(`Document: ${params.textDocument.uri}`);
    connection.console.log(`Position: ${params.position.line}:${params.position.character}`);
    const document = documents.get(params.textDocument.uri);
    if (!document) {
        return PIE_KEYWORDS;
    }
    // Get or extract user symbols for this document
    let userSymbols = documentSymbols.get(params.textDocument.uri);
    if (!userSymbols) {
        userSymbols = extractUserDefinedSymbols(document);
        documentSymbols.set(params.textDocument.uri, userSymbols);
    }
    // Combine built-in keywords with user-defined symbols
    const allCompletions = [...PIE_KEYWORDS];
    // Add user-defined symbols
    userSymbols.forEach((item, name) => {
        // Check if we're not trying to complete the definition itself
        const position = params.position;
        const line = document.getText({
            start: { line: position.line, character: 0 },
            end: position
        });
        // Don't suggest the name if we're currently defining it
        if (!line.includes(`(define ${name}`) &&
            !line.includes(`(claim ${name}`) &&
            !line.includes(`(define-tactically ${name}`)) {
            allCompletions.push(item);
        }
    });
    connection.console.log(`Returning ${allCompletions.length} completions (${PIE_KEYWORDS.length} built-in, ${userSymbols.size} user-defined)`);
    return allCompletions;
});
// Function to get the word at a given position
function getWordAtPosition(document, position) {
    const text = document.getText();
    const lines = text.split('\n');
    if (position.line >= lines.length) {
        return null;
    }
    const line = lines[position.line];
    const character = position.character;
    if (character >= line.length) {
        return null;
    }
    // Define what constitutes a valid Pie identifier character
    const identifierRegex = /[a-zA-Z0-9\-_!?*+=<>]/;
    // Find the start of the word
    let start = character;
    while (start > 0 && identifierRegex.test(line[start - 1])) {
        start--;
    }
    // Find the end of the word
    let end = character;
    while (end < line.length && identifierRegex.test(line[end])) {
        end++;
    }
    // Return the word if it's not empty and starts with a letter
    const word = line.substring(start, end);
    if (word.length > 0 && /[a-zA-Z]/.test(word[0])) {
        return word;
    }
    return null;
}
// Handler for Go to Definition requests
connection.onDefinition((params) => {
    connection.console.log('===== GO TO DEFINITION TRIGGERED =====');
    connection.console.log(`Document: ${params.textDocument.uri}`);
    connection.console.log(`Position: ${params.position.line}:${params.position.character}`);
    const document = documents.get(params.textDocument.uri);
    if (!document) {
        connection.console.log('Document not found');
        return [];
    }
    // Get the word at the cursor position
    const word = getWordAtPosition(document, params.position);
    if (!word) {
        connection.console.log('No word found at position');
        return [];
    }
    connection.console.log(`Looking for definition of: ${word}`);
    // First, check the current document for definitions
    const currentDocSymbols = symbolDefinitions.get(params.textDocument.uri);
    if (currentDocSymbols && currentDocSymbols.has(word)) {
        const definition = currentDocSymbols.get(word);
        connection.console.log(`Found definition in current document: ${definition.type}`);
        return [definition.location];
    }
    // Then check all other documents (for workspace-wide definitions)
    for (const [uri, symbols] of symbolDefinitions) {
        if (uri !== params.textDocument.uri && symbols.has(word)) {
            const definition = symbols.get(word);
            connection.console.log(`Found definition in document ${uri}: ${definition.type}`);
            return [definition.location];
        }
    }
    connection.console.log(`No definition found for: ${word}`);
    return [];
});
// This handler resolves additional information for the item selected in the completion list.
connection.onCompletionResolve((item) => {
    switch (item.data) {
        case 1: // U
            item.detail = 'Type universe';
            item.documentation = 'The type of types in Pie';
            break;
        case 2: // Nat
            item.detail = 'Natural number type';
            item.documentation = 'The type of natural numbers (zero, add1 zero, add1 (add1 zero), ...)';
            break;
        case 3: // zero
            item.detail = 'Natural number constructor';
            item.documentation = 'The natural number zero';
            break;
        case 4: // add1
            item.detail = 'Natural number constructor';
            item.documentation = 'Successor function for natural numbers';
            break;
        case 5: // Atom
            item.detail = 'Atomic symbol type';
            item.documentation = 'The type of atomic symbols like \'foo, \'bar';
            break;
        case 6: // Trivial
            item.detail = 'Unit type';
            item.documentation = 'The type with exactly one value: sole';
            break;
        case 7: // sole
            item.detail = 'Unit value constructor';
            item.documentation = 'The only value of type Trivial';
            break;
        case 8: // Absurd
            item.detail = 'Empty type';
            item.documentation = 'The type with no values (false proposition)';
            break;
        case 9: // ->
        case 10: // →
            item.detail = 'Function type constructor';
            item.documentation = 'Non-dependent function type A -> B';
            break;
        case 11: // Pi
        case 12: // Π
            item.detail = 'Dependent function type';
            item.documentation = 'Dependent function type (Pi ((x A)) B) where B may depend on x';
            break;
        case 13: // lambda
        case 14: // λ
            item.detail = 'Lambda abstraction';
            item.documentation = 'Creates a function (lambda (x) body)';
            break;
        case 15: // the
            item.detail = 'Type annotation';
            item.documentation = 'Explicitly annotates the type of an expression (the T expr)';
            break;
        case 16: // Sigma
        case 17: // Σ
            item.detail = 'Dependent pair type';
            item.documentation = 'Dependent pair type (Sigma ((x A)) B) where B may depend on x';
            break;
        case 18: // Pair
            item.detail = 'Simple pair type';
            item.documentation = 'Non-dependent pair type (Pair A B)';
            break;
        case 19: // cons
            item.detail = 'Pair constructor';
            item.documentation = 'Creates a pair (cons a b)';
            break;
        case 20: // car
            item.detail = 'First projection';
            item.documentation = 'Gets the first element of a pair';
            break;
        case 21: // cdr
            item.detail = 'Second projection';
            item.documentation = 'Gets the second element of a pair';
            break;
        case 22: // List
            item.detail = 'List type constructor';
            item.documentation = 'The type of lists with elements of type A';
            break;
        case 23: // nil
            item.detail = 'Empty list constructor';
            item.documentation = 'The empty list';
            break;
        case 24: // ::
            item.detail = 'List cons operator';
            item.documentation = 'Prepends an element to a list (:: h t)';
            break;
        case 25: // Vec
            item.detail = 'Vector type constructor';
            item.documentation = 'The type of vectors with length n and elements of type A';
            break;
        case 26: // vecnil
            item.detail = 'Empty vector constructor';
            item.documentation = 'The empty vector of length zero';
            break;
        case 27: // vec::
            item.detail = 'Vector cons operator';
            item.documentation = 'Prepends an element to a vector (vec:: h t)';
            break;
        case 28: // head
            item.detail = 'Vector head accessor';
            item.documentation = 'Gets the first element of a non-empty vector';
            break;
        case 29: // tail
            item.detail = 'Vector tail accessor';
            item.documentation = 'Gets the tail of a non-empty vector';
            break;
        case 30: // Either
            item.detail = 'Sum type constructor';
            item.documentation = 'The type representing choice between two alternatives';
            break;
        case 31: // left
            item.detail = 'Left injection constructor';
            item.documentation = 'Injects a value into the left side of Either';
            break;
        case 32: // right
            item.detail = 'Right injection constructor';
            item.documentation = 'Injects a value into the right side of Either';
            break;
        case 33: // =
            item.detail = 'Equality type constructor';
            item.documentation = 'The type of equality proofs between two values';
            break;
        case 34: // same
            item.detail = 'Reflexivity constructor';
            item.documentation = 'The proof that any value is equal to itself';
            break;
        case 35: // which-Nat
            item.detail = 'Natural number eliminator';
            item.documentation = 'Case analysis on natural numbers';
            break;
        case 36: // iter-Nat
            item.detail = 'Natural number iterator';
            item.documentation = 'Iterates a function over natural numbers';
            break;
        case 37: // rec-Nat
            item.detail = 'Natural number recursion';
            item.documentation = 'Primitive recursion over natural numbers';
            break;
        case 38: // ind-Nat
            item.detail = 'Natural number induction';
            item.documentation = 'Induction principle for natural numbers';
            break;
        case 39: // rec-List
            item.detail = 'List recursion';
            item.documentation = 'Recursion principle for lists';
            break;
        case 40: // ind-List
            item.detail = 'List induction';
            item.documentation = 'Induction principle for lists';
            break;
        case 41: // ind-Vec
            item.detail = 'Vector induction';
            item.documentation = 'Induction principle for vectors';
            break;
        case 42: // ind-Either
            item.detail = 'Either elimination';
            item.documentation = 'Case analysis on Either types';
            break;
        case 43: // ind-=
            item.detail = 'Equality elimination';
            item.documentation = 'Elimination principle for equality proofs';
            break;
        case 44: // ind-Absurd
            item.detail = 'Absurd elimination';
            item.documentation = 'Ex falso principle - from false, anything follows';
            break;
        case 45: // replace
            item.detail = 'Equality substitution';
            item.documentation = 'Substitutes equals for equals in a type';
            break;
        case 46: // trans
            item.detail = 'Equality transitivity';
            item.documentation = 'If a = b and b = c, then a = c';
            break;
        case 47: // cong
            item.detail = 'Equality congruence';
            item.documentation = 'If a = b, then f(a) = f(b)';
            break;
        case 48: // symm
            item.detail = 'Equality symmetry';
            item.documentation = 'If a = b, then b = a';
            break;
        case 49: // quote
            item.detail = 'Quote constructor';
            item.documentation = 'Creates an atomic symbol (quote symbol)';
            break;
        case 50: // TODO
            item.detail = 'Development placeholder';
            item.documentation = 'Placeholder for incomplete proofs or definitions';
            break;
        case 51: // claim
            item.detail = 'Type declaration';
            item.documentation = 'Declares the type of a name (claim name type)';
            break;
        case 52: // define
            item.detail = 'Value definition';
            item.documentation = 'Defines the value of a name (define name body)';
            break;
        case 53: // check-same
            item.detail = 'Sameness checking';
            item.documentation = 'Checks if two expressions have the same type and normal form';
            break;
        case 54: // define-tactically
            item.detail = 'Tactical definition';
            item.documentation = 'Defines a value using tactics';
            break;
        case 55: // exact
            item.detail = 'Exact tactic';
            item.documentation = 'Provides an exact proof term';
            break;
        case 56: // intro
            item.detail = 'Introduction tactic';
            item.documentation = 'Introduces lambda or Pi variables';
            break;
        case 57: // exists
            item.detail = 'Existential tactic';
            item.documentation = 'Provides witness for Sigma types';
            break;
        case 58: // elimNat
            item.detail = 'Natural elimination tactic';
            item.documentation = 'Eliminates natural numbers tactically';
            break;
        case 59: // elimList
            item.detail = 'List elimination tactic';
            item.documentation = 'Eliminates lists tactically';
            break;
        case 60: // elimVec
            item.detail = 'Vector elimination tactic';
            item.documentation = 'Eliminates vectors tactically';
            break;
        case 61: // elimEqual
            item.detail = 'Equality elimination tactic';
            item.documentation = 'Eliminates equality proofs tactically';
            break;
        case 62: // elimEither
            item.detail = 'Either elimination tactic';
            item.documentation = 'Eliminates Either types tactically';
            break;
        case 63: // elimAbsurd
            item.detail = 'Absurd elimination tactic';
            item.documentation = 'Eliminates Absurd tactically (ex falso)';
            break;
        case 64: // split
            item.detail = 'Split tactic';
            item.documentation = 'Splits Sigma/product goals';
            break;
    }
    return item;
});
const PIE_HOVER_INFO = new Map([
    // Types
    ['U', {
            summary: 'The universe of types',
            details: 'U is the type of types. Any type (like Nat, Atom, or (Pair Nat Atom)) has type U.',
            examples: '(the U Nat)\n(the U (-> Nat Nat))'
        }],
    ['Nat', {
            summary: 'Natural numbers',
            details: 'The type of natural numbers, built from zero and add1.',
            examples: '(the Nat zero)\n(the Nat (add1 (add1 zero)))'
        }],
    ['Atom', {
            summary: 'Atomic symbols',
            details: 'The type of quoted symbols.',
            examples: "(the Atom 'foo)\n(the Atom 'bar)"
        }],
    ['List', {
            summary: 'List type constructor',
            details: 'Lists are either nil or constructed with :: (cons).',
            examples: '(the (List Nat) nil)\n(the (List Nat) (:: 1 (:: 2 nil)))'
        }],
    ['Vec', {
            summary: 'Length-indexed vectors',
            details: 'Vectors are lists with their length in the type.',
            examples: '(the (Vec Nat zero) vecnil)\n(the (Vec Nat (add1 zero)) (vec:: 1 vecnil))'
        }],
    ['Pair', {
            summary: 'Product type',
            details: 'Non-dependent pairs of values.',
            examples: '(the (Pair Nat Atom) (cons 1 \'foo))'
        }],
    ['Sigma', {
            summary: 'Dependent pair type',
            details: 'Dependent pairs where the type of the second component can depend on the first.',
            examples: '(the (Sigma ((n Nat)) (Vec Atom n)) (cons 2 (vec:: \'a (vec:: \'b vecnil))))'
        }],
    ['Pi', {
            summary: 'Dependent function type',
            details: 'Function type where the output type can depend on the input value.',
            examples: '(the (Pi ((n Nat)) (Vec Atom n)) (lambda (n) ...))'
        }],
    ['Either', {
            summary: 'Sum type',
            details: 'A value of Either L R is either a left L or a right R.',
            examples: '(the (Either Nat Atom) (left 5))\n(the (Either Nat Atom) (right \'foo))'
        }],
    ['Trivial', {
            summary: 'Unit type',
            details: 'The type with exactly one value: sole.',
            examples: '(the Trivial sole)'
        }],
    ['Absurd', {
            summary: 'Empty type',
            details: 'The type with no values. Represents falsity in propositions.',
            examples: '(the (-> Absurd Nat) (lambda (x) (ind-Absurd x Nat)))'
        }],
    // Constructors
    ['zero', {
            summary: 'Natural number zero',
            details: 'The base case for natural numbers.',
            examples: '(the Nat zero)'
        }],
    ['add1', {
            summary: 'Successor function',
            details: 'Constructs the next natural number.',
            examples: '(the Nat (add1 zero)) ; represents 1'
        }],
    ['nil', {
            summary: 'Empty list',
            details: 'The empty list for any element type.',
            examples: '(the (List Nat) nil)'
        }],
    ['cons', {
            summary: 'Pair constructor',
            details: 'Constructs a pair from two values.',
            examples: '(the (Pair Nat Atom) (cons 1 \'foo))'
        }],
    ['car', {
            summary: 'First projection',
            details: 'Extracts the first element of a pair.',
            examples: '(car (cons 1 \'foo)) ; evaluates to 1'
        }],
    ['cdr', {
            summary: 'Second projection',
            details: 'Extracts the second element of a pair.',
            examples: '(cdr (cons 1 \'foo)) ; evaluates to \'foo'
        }],
    ['sole', {
            summary: 'Unit value',
            details: 'The only inhabitant of Trivial.',
            examples: '(the Trivial sole)'
        }],
    ['same', {
            summary: 'Equality constructor',
            details: 'Constructs a proof that something equals itself.',
            examples: '(the (= Nat 2 2) (same 2))'
        }],
    ['left', {
            summary: 'Left injection',
            details: 'Injects a value into the left side of an Either.',
            examples: '(the (Either Nat Atom) (left 5))'
        }],
    ['right', {
            summary: 'Right injection',
            details: 'Injects a value into the right side of an Either.',
            examples: '(the (Either Nat Atom) (right \'foo))'
        }],
    // Core operations
    ['lambda', {
            summary: 'Function abstraction',
            details: 'Creates an anonymous function.',
            examples: '(lambda (x) (add1 x))'
        }],
    ['λ', {
            summary: 'Function abstraction (Unicode)',
            details: 'Unicode version of lambda.',
            examples: '(λ (x) (add1 x))'
        }],
    ['the', {
            summary: 'Type annotation',
            details: 'Explicitly specifies the type of an expression.',
            examples: '(the Nat 5)\n(the (-> Nat Nat) (lambda (x) x))'
        }],
    ['claim', {
            summary: 'Type declaration',
            details: 'Declares the type of a definition.',
            examples: '(claim identity (Pi ((A U)) (-> A A)))'
        }],
    ['define', {
            summary: 'Value definition',
            details: 'Defines a named value.',
            examples: '(define identity (lambda (A) (lambda (x) x)))'
        }],
    ['check-same', {
            summary: 'Type and value equality check',
            details: 'Verifies two expressions have the same type and normalize to the same value.',
            examples: '(check-same Nat (add1 (add1 zero)) 2)'
        }],
    // Eliminators
    ['which-Nat', {
            summary: 'Natural number case analysis',
            details: 'Pattern matching on natural numbers.',
            examples: '(which-Nat n\n  zero-case\n  (lambda (n-1) add1-case))'
        }],
    ['iter-Nat', {
            summary: 'Natural number iteration',
            details: 'Iterates a function n times.',
            examples: '(iter-Nat n\n  base\n  step-function)'
        }],
    ['rec-Nat', {
            summary: 'Natural number recursion',
            details: 'Primitive recursion on natural numbers.',
            examples: '(rec-Nat n\n  base\n  (lambda (n-1 rec-n-1) step))'
        }],
    ['ind-Nat', {
            summary: 'Natural number induction',
            details: 'Induction principle for natural numbers.',
            examples: '(ind-Nat n\n  motive\n  base\n  (lambda (n-1 ih) step))'
        }],
    ['replace', {
            summary: 'Equality substitution',
            details: 'Replaces equals for equals in a type.',
            examples: '(replace target\n  proof-of-equality\n  (lambda (x) motive))'
        }],
    ['trans', {
            summary: 'Transitivity of equality',
            details: 'Chains equality proofs.',
            examples: '(trans proof-a=b proof-b=c)'
        }],
    ['cong', {
            summary: 'Congruence of equality',
            details: 'Applies a function to both sides of an equality.',
            examples: '(cong proof-a=b function)'
        }],
    ['symm', {
            summary: 'Symmetry of equality',
            details: 'Reverses an equality proof.',
            examples: '(symm proof-a=b)'
        }],
    // Special
    ['TODO', {
            summary: 'Placeholder for incomplete code',
            details: 'Indicates a hole to be filled in later.',
            examples: '(define my-function TODO)'
        }],
    ['->', {
            summary: 'Function type',
            details: 'Non-dependent function type.',
            examples: '(the (-> Nat Nat) (lambda (x) (add1 x)))'
        }],
    ['→', {
            summary: 'Function type (Unicode)',
            details: 'Unicode version of ->.',
            examples: '(the (→ Nat Nat) (λ (x) (add1 x)))'
        }]
]);
connection.onHover((params) => {
    const document = documents.get(params.textDocument.uri);
    if (!document) {
        return null;
    }
    const word = getWordAtPosition(document, params.position);
    if (!word) {
        return null;
    }
    // Check for user-defined symbol
    const currentDocSymbols = symbolDefinitions.get(params.textDocument.uri);
    let definition;
    if (currentDocSymbols && currentDocSymbols.has(word)) {
        definition = currentDocSymbols.get(word);
    }
    else {
        // Check other documents
        for (const [uri, symbols] of symbolDefinitions) {
            if (symbols.has(word)) {
                definition = symbols.get(word);
                break;
            }
        }
    }
    if (definition) {
        let hoverText = `**${word}**\n\n`;
        hoverText += `Type: ${definition.type}\n`;
        if (definition.typeInfo) {
            hoverText += `Signature: \`${definition.typeInfo}\`\n`;
        }
        hoverText += `Defined in: ${definition.location.uri}\n`;
        hoverText += `Location: Line ${definition.location.range.start.line + 1}, Column ${definition.location.range.start.character + 1}`;
        return {
            contents: {
                kind: node_1.MarkupKind.Markdown,
                value: hoverText
            }
        };
    }
    // Fall back to built-in hover info if available
    (params) => {
        connection.console.log(`Hover requested at ${params.position.line}:${params.position.character}`);
        const document = documents.get(params.textDocument.uri);
        if (!document) {
            return null;
        }
        // Get the word at the hover position
        const text = document.getText();
        const offset = document.offsetAt(params.position);
        // Find word boundaries
        let start = offset;
        let end = offset;
        // Move start backwards to find word beginning
        while (start > 0 && /[a-zA-Z0-9_\-!?*+=<>λΠΣ→]/.test(text[start - 1])) {
            start--;
        }
        // Handle special case for quoted atoms
        if (start > 0 && text[start - 1] === "'") {
            start--;
        }
        // Move end forward to find word ending
        while (end < text.length && /[a-zA-Z0-9_\-!?*+=<>λΠΣ→]/.test(text[end])) {
            end++;
        }
        const word = text.substring(start, end);
        connection.console.log(`Hovering over word: "${word}"`);
        // Look up hover information
        const hoverInfo = PIE_HOVER_INFO.get(word);
        if (!hoverInfo) {
            // Check if it's a number
            if (/^\d+$/.test(word)) {
                return {
                    contents: {
                        kind: node_1.MarkupKind.Markdown,
                        value: `**Natural number literal**\n\nRepresents the Nat value ${word}`
                    }
                };
            }
            // Check if it's a quoted atom
            if (word.startsWith("'")) {
                return {
                    contents: {
                        kind: node_1.MarkupKind.Markdown,
                        value: `**Quoted atom**\n\nType: \`Atom\`\n\nValue: \`${word}\``
                    }
                };
            }
            return null;
        }
        // Build hover content
        let hoverContent = `**${word}**\n\n${hoverInfo.summary}`;
        if (hoverInfo.details) {
            hoverContent += `\n\n${hoverInfo.details}`;
        }
        if (hoverInfo.examples) {
            hoverContent += `\n\n**Examples:**\n\`\`\`pie\n${hoverInfo.examples}\n\`\`\``;
        }
        return {
            contents: {
                kind: node_1.MarkupKind.Markdown,
                value: hoverContent
            }
        };
    };
    return null;
});
// Main function to type check a Pie document and return diagnostics
function typeCheckPieDocument(document) {
    const text = document.getText();
    const diagnostics = [];
    let context = context_1.initCtx;
    try {
        // Parse the document into declarations
        const declarations = parsePieDeclarations(text);
        // Process each declaration
        for (const decl of declarations) {
            const declResult = processDeclaration(decl, context, document);
            if (declResult.diagnostics.length > 0) {
                diagnostics.push(...declResult.diagnostics);
            }
            // Update context with successful declarations for subsequent type checking
            context = declResult.context;
        }
    }
    catch (parseError) {
        // Handle parse errors
        const diagnostic = {
            severity: node_1.DiagnosticSeverity.Error,
            range: {
                start: { line: 0, character: 0 },
                end: { line: 0, character: text.length }
            },
            message: `Parse error: ${parseError}`,
            source: 'pie-type-checker'
        };
        diagnostics.push(diagnostic);
    }
    return { diagnostics, context };
}
// Parse the document into individual declarations
function parsePieDeclarations(text) {
    const declarations = [];
    try {
        // Use your existing scheme parser to get the AST
        const asts = (0, parser_1.schemeParse)(text);
        for (const ast of asts) {
            try {
                const declaration = parser_1.pieDeclarationParser.parseDeclaration(ast);
                declarations.push(declaration);
            }
            catch (error) {
                // Individual declaration parse error - we'll handle this in processDeclaration
                console.error('Failed to parse declaration:', error);
            }
        }
    }
    catch (error) {
        console.error('Failed to parse document:', error);
        throw error;
    }
    return declarations;
}
// Process a single declaration and return diagnostics + updated context
function processDeclaration(declaration, context, document) {
    const diagnostics = [];
    let newContext = context;
    try {
        if (declaration instanceof parser_1.Claim) {
            const result = processClaimDeclaration(declaration, context, document);
            diagnostics.push(...result.diagnostics);
            newContext = result.context;
        }
        else if (declaration instanceof parser_1.Definition) {
            const result = processDefinitionDeclaration(declaration, context, document);
            diagnostics.push(...result.diagnostics);
            newContext = result.context;
        }
        else if (declaration instanceof parser_1.DefineTactically) {
            const result = processDefineTacticallyDeclaration(declaration, context, document);
            diagnostics.push(...result.diagnostics);
            newContext = result.context;
        }
        else if (declaration instanceof S.Source) {
            // Handle standalone expressions
            const result = processExpressionDeclaration(declaration, context, document);
            diagnostics.push(...result.diagnostics);
            // Don't update context for standalone expressions
        }
    }
    catch (error) {
        const diagnostic = {
            severity: node_1.DiagnosticSeverity.Error,
            range: pieLocationToLspRange(declaration.location, document),
            message: `Error processing declaration: ${error}`,
            source: 'pie-type-checker'
        };
        diagnostics.push(diagnostic);
    }
    return { diagnostics, context: newContext };
}
// Process claim declarations
function processClaimDeclaration(claim, context, document) {
    const diagnostics = [];
    let newContext = context;
    try {
        // Type check the type expression
        const renames = new Map();
        const typeResult = claim.type.isType(context, renames);
        if (typeResult instanceof utils_1.stop) {
            const diagnostic = {
                severity: node_1.DiagnosticSeverity.Error,
                range: pieLocationToLspRange(typeResult.where, document),
                message: `Type error in claim: ${messageToString(typeResult.message)}`,
                source: 'pie-type-checker'
            };
            diagnostics.push(diagnostic);
        }
        else if (typeResult instanceof utils_1.go) {
            // Successfully type checked - add to context
            const typeCore = typeResult.result;
            const typeValue = typeCore.valOf(contextToEnvironment(context));
            newContext = (0, context_1.extendContext)(context, claim.name, new context_1.Claim(typeValue));
        }
    }
    catch (error) {
        const diagnostic = {
            severity: node_1.DiagnosticSeverity.Error,
            range: pieLocationToLspRange(claim.location, document),
            message: `Error in claim ${claim.name}: ${error}`,
            source: 'pie-type-checker'
        };
        diagnostics.push(diagnostic);
    }
    return { diagnostics, context: newContext };
}
// Process definition declarations
function processDefinitionDeclaration(definition, context, document) {
    const diagnostics = [];
    let newContext = context;
    try {
        // Check if there's a corresponding claim
        const claimBinding = context.get(definition.name);
        if (!(claimBinding instanceof context_1.Claim)) {
            const diagnostic = {
                severity: node_1.DiagnosticSeverity.Error,
                range: pieLocationToLspRange(definition.location, document),
                message: `No claim found for definition: ${definition.name}`,
                source: 'pie-type-checker'
            };
            diagnostics.push(diagnostic);
            return { diagnostics, context };
        }
        // Type check the definition against the claimed type
        const renames = new Map();
        const checkResult = definition.expr.check(context, renames, claimBinding.type);
        if (checkResult instanceof utils_1.stop) {
            const diagnostic = {
                severity: node_1.DiagnosticSeverity.Error,
                range: pieLocationToLspRange(checkResult.where, document),
                message: `Type error in definition ${definition.name}: ${messageToString(checkResult.message)}`,
                source: 'pie-type-checker'
            };
            diagnostics.push(diagnostic);
        }
        else if (checkResult instanceof utils_1.go) {
            // Successfully type checked - update context to replace claim with definition
            const definitionCore = checkResult.result;
            const definitionValue = definitionCore.valOf(contextToEnvironment(context));
            newContext = (0, context_1.extendContext)(context, definition.name, new context_1.Define(claimBinding.type, definitionValue));
        }
    }
    catch (error) {
        const diagnostic = {
            severity: node_1.DiagnosticSeverity.Error,
            range: pieLocationToLspRange(definition.location, document),
            message: `Error in definition ${definition.name}: ${error}`,
            source: 'pie-type-checker'
        };
        diagnostics.push(diagnostic);
    }
    return { diagnostics, context: newContext };
}
// Process define-tactically declarations
function processDefineTacticallyDeclaration(defineTactically, context, document) {
    const diagnostics = [];
    let newContext = context;
    // For now, we'll do basic validation - full tactical proof checking would be more complex
    try {
        const claimBinding = context.get(defineTactically.name);
        if (!(claimBinding instanceof context_1.Claim)) {
            const diagnostic = {
                severity: node_1.DiagnosticSeverity.Error,
                range: pieLocationToLspRange(defineTactically.location, document),
                message: `No claim found for tactical definition: ${defineTactically.name}`,
                source: 'pie-type-checker'
            };
            diagnostics.push(diagnostic);
            return { diagnostics, context };
        }
        // TODO: Implement tactical proof checking
        // For now, just accept all tactical definitions as valid
        const diagnostic = {
            severity: node_1.DiagnosticSeverity.Information,
            range: pieLocationToLspRange(defineTactically.location, document),
            message: `Tactical definition checking not yet implemented for: ${defineTactically.name}`,
            source: 'pie-type-checker'
        };
        diagnostics.push(diagnostic);
    }
    catch (error) {
        const diagnostic = {
            severity: node_1.DiagnosticSeverity.Error,
            range: pieLocationToLspRange(defineTactically.location, document),
            message: `Error in tactical definition ${defineTactically.name}: ${error}`,
            source: 'pie-type-checker'
        };
        diagnostics.push(diagnostic);
    }
    return { diagnostics, context: newContext };
}
// Process standalone expressions
function processExpressionDeclaration(expression, context, document) {
    const diagnostics = [];
    try {
        // Try to synthesize a type for the expression
        const renames = new Map();
        const synthResult = expression.synth(context, renames);
        if (synthResult instanceof utils_1.stop) {
            const diagnostic = {
                severity: node_1.DiagnosticSeverity.Error,
                range: pieLocationToLspRange(synthResult.where, document),
                message: `Type error: ${messageToString(synthResult.message)}`,
                source: 'pie-type-checker'
            };
            diagnostics.push(diagnostic);
        }
        // If successful, we don't need to report anything for standalone expressions
    }
    catch (error) {
        const diagnostic = {
            severity: node_1.DiagnosticSeverity.Error,
            range: pieLocationToLspRange(expression.location, document),
            message: `Error in expression: ${error}`,
            source: 'pie-type-checker'
        };
        diagnostics.push(diagnostic);
    }
    return { diagnostics, context };
}
// Helper to convert context to environment (you might need to adjust this)
function contextToEnvironment(context) {
    // This should convert your Context to an Environment for evaluation
    // You'll need to implement this based on your existing context/environment system
    return {}; // Placeholder
}
// Make the text document manager listen on the connection
// for open, change and close text document events
documents.listen(connection);
// Listen on the connection
connection.listen();
//# sourceMappingURL=server.js.map