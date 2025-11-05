import {
	BrowserMessageReader,
	BrowserMessageWriter,
	createConnection,
	TextDocuments,
	Diagnostic,
	DiagnosticSeverity,
	InitializeParams,
	CompletionItem,
	CompletionItemKind,
	TextDocumentPositionParams,
	TextDocumentSyncKind,
	InitializeResult,
	Hover,
	HoverParams,
	MarkupKind,
	Location,
	Position,
	DefinitionParams,
} from 'vscode-languageserver/browser';

import { TextDocument } from 'vscode-languageserver-textdocument';

import { pieDeclarationParser, Declaration, Claim, Definition, DefineTactically, schemeParse } from '../../src/pie_interpreter/parser/parser';
import { Context, initCtx, addClaimToContext, addDefineToContext } from '../../src/pie_interpreter/utils/context';
import { go, stop } from '../../src/pie_interpreter/types/utils';
import { ProofManager } from '../../src/pie_interpreter/tactics/proofmanager';
import { PIE_HOVER_INFO } from '../../src/language_server/server/src/pie_hover_info';

// Interface to store symbol definition information
interface SymbolDefinition {
	name: string;
	location: Location;
	type: 'claim' | 'define' | 'define-tactically';
	typeInfo?: string;
}

// Create message reader and writer for browser
const messageReader = new BrowserMessageReader(self);
const messageWriter = new BrowserMessageWriter(self);

// Create a connection for the server
const connection = createConnection(messageReader, messageWriter);

// Create a simple text document manager
const documents: TextDocuments<TextDocument> = new TextDocuments(TextDocument);

// Track user-defined symbols per document for go-to-definition and hover
const symbolDefinitions = new Map<string, Map<string, SymbolDefinition>>();

// Track user-defined symbols per document for completion
const documentSymbols = new Map<string, Map<string, CompletionItem>>();

connection.onInitialize((params: InitializeParams) => {
	const result: InitializeResult = {
		capabilities: {
			textDocumentSync: TextDocumentSyncKind.Incremental,
			// Tell the client that this server supports code completion
			completionProvider: {
				resolveProvider: true,
				triggerCharacters: ['(', ' ']
			},
			// Supports hover
			hoverProvider: true,
			// Definition provider
			definitionProvider: true
		}
	};
	return result;
});

connection.onInitialized(() => {
	connection.console.log('Pie Language Server initialized in browser');
});

// The content of a text document has changed
documents.onDidChangeContent(change => {
	// Extract user-defined symbols for completion
	const symbols = extractUserDefinedSymbols(change.document);
	documentSymbols.set(change.document.uri, symbols);

	// Extract symbol definitions for go-to-definition and hover
	const definitions = extractSymbolDefinitions(change.document);
	symbolDefinitions.set(change.document.uri, definitions);

	// Perform type checking and send diagnostics
	validateTextDocument(change.document);
});

// Only keep settings for open documents
documents.onDidClose(e => {
	documentSymbols.delete(e.document.uri);
	symbolDefinitions.delete(e.document.uri);
});

// Extract symbols when document is opened
documents.onDidOpen(change => {
	// Extract user-defined symbols for completion
	const symbols = extractUserDefinedSymbols(change.document);
	documentSymbols.set(change.document.uri, symbols);

	// Extract symbol definitions for go-to-definition and hover
	const definitions = extractSymbolDefinitions(change.document);
	symbolDefinitions.set(change.document.uri, definitions);

	// Perform initial validation
	validateTextDocument(change.document);
});

// Parse document to extract user-defined symbols
function extractUserDefinedSymbols(document: TextDocument): Map<string, CompletionItem> {
	const text = document.getText();
	const symbols = new Map<string, CompletionItem>();

	// Regular expressions for Pie constructs
	const definePattern = /\(define\s+([a-zA-Z][a-zA-Z0-9\-_!?*+=<>]*)/g;
	const claimPattern = /\(claim\s+([a-zA-Z][a-zA-Z0-9\-_!?*+=<>]*)\s+(.+?)\)/g;
	const defineTacticallyPattern = /\(define-tactically\s+([a-zA-Z][a-zA-Z0-9\-_!?*+=<>]*)/g;

	// Extract define symbols
	let match: RegExpExecArray | null;
	while ((match = definePattern.exec(text)) !== null) {
		const symbolName = match[1];
		symbols.set(symbolName, {
			label: symbolName,
			kind: CompletionItemKind.Function,
			detail: 'User-defined function'
		});
	}

	// Extract claim symbols
	while ((match = claimPattern.exec(text)) !== null) {
		const symbolName = match[1];
		const typeSpec = match[2];
		symbols.set(symbolName, {
			label: symbolName,
			kind: CompletionItemKind.Variable,
			detail: `Claimed type: ${typeSpec}`
		});
	}

	// Extract define-tactically symbols
	while ((match = defineTacticallyPattern.exec(text)) !== null) {
		const symbolName = match[1];
		symbols.set(symbolName, {
			label: symbolName,
			kind: CompletionItemKind.Function,
			detail: 'Tactically defined function'
		});
	}

	return symbols;
}

// Extract symbol definitions for go-to-definition and hover
function extractSymbolDefinitions(document: TextDocument): Map<string, SymbolDefinition> {
	const text = document.getText();
	const lines = text.split('\n');
	const symbols = new Map<string, SymbolDefinition>();

	// Regular expressions for Pie constructs with line tracking
	const definePattern = /\(define\s+([a-zA-Z][a-zA-Z0-9\-_!?*+=<>]*)/;
	const claimPattern = /\(claim\s+([a-zA-Z][a-zA-Z0-9\-_!?*+=<>]*)\s+(.+?)\)/;
	const defineTacticallyPattern = /\(define-tactically\s+([a-zA-Z][a-zA-Z0-9\-_!?*+=<>]*)/;

	lines.forEach((line, lineIndex) => {
		// Check for define
		let match = definePattern.exec(line);
		if (match) {
			const symbolName = match[1];
			const startCol = line.indexOf(symbolName);
			symbols.set(symbolName, {
				name: symbolName,
				location: {
					uri: document.uri,
					range: {
						start: { line: lineIndex, character: startCol },
						end: { line: lineIndex, character: startCol + symbolName.length }
					}
				},
				type: 'define'
			});
		}

		// Check for claim
		match = claimPattern.exec(line);
		if (match) {
			const symbolName = match[1];
			const typeSpec = match[2];
			const startCol = line.indexOf(symbolName);
			symbols.set(symbolName, {
				name: symbolName,
				location: {
					uri: document.uri,
					range: {
						start: { line: lineIndex, character: startCol },
						end: { line: lineIndex, character: startCol + symbolName.length }
					}
				},
				type: 'claim',
				typeInfo: typeSpec
			});
		}

		// Check for define-tactically
		match = defineTacticallyPattern.exec(line);
		if (match) {
			const symbolName = match[1];
			const startCol = line.indexOf(symbolName);
			symbols.set(symbolName, {
				name: symbolName,
				location: {
					uri: document.uri,
					range: {
						start: { line: lineIndex, character: startCol },
						end: { line: lineIndex, character: startCol + symbolName.length }
					}
				},
				type: 'define-tactically'
			});
		}
	});

	return symbols;
}

// Get word at cursor position
function getWordAtPosition(document: TextDocument, position: Position): string | null {
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

	// Define what constitutes an identifier in Pie
	const identifierRegex = /[a-zA-Z0-9_\-!?*+=<>λΠΣ→]/;

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

// Hover handler
connection.onHover((params: HoverParams): Hover | null => {
	const document = documents.get(params.textDocument.uri);
	if (!document) {
		return null;
	}

	const word = getWordAtPosition(document, params.position);
	if (!word) {
		return null;
	}

	// Check for user-defined symbol first
	const currentDocSymbols = symbolDefinitions.get(params.textDocument.uri);
	let definition: SymbolDefinition | undefined;

	if (currentDocSymbols && currentDocSymbols.has(word)) {
		definition = currentDocSymbols.get(word);
	} else {
		// Check other documents
		for (const [, symbols] of symbolDefinitions) {
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

		const fileName = definition.location.uri.split('/').pop() || definition.location.uri;
		hoverText += `Defined in: ${fileName}\n`;
		hoverText += `Location: Line ${definition.location.range.start.line + 1}, Column ${definition.location.range.start.character + 1}`;

		return {
			contents: {
				kind: MarkupKind.Markdown,
				value: hoverText
			}
		};
	}

	// Fall back to built-in hover info
	const hoverInfo = PIE_HOVER_INFO.get(word);
	if (hoverInfo) {
		let hoverContent = `**${word}**\n\n${hoverInfo.summary}`;

		if (hoverInfo.details) {
			hoverContent += `\n\n${hoverInfo.details}`;
		}

		if (hoverInfo.examples) {
			hoverContent += `\n\n**Examples:**\n\`\`\`pie\n${hoverInfo.examples}\n\`\`\``;
		}

		return {
			contents: {
				kind: MarkupKind.Markdown,
				value: hoverContent
			}
		};
	}

	return null;
});

// Handler for Go to Definition requests
connection.onDefinition((params: DefinitionParams): Location[] => {
	const document = documents.get(params.textDocument.uri);
	if (!document) {
		return [];
	}

	// Get the word at the cursor position
	const word = getWordAtPosition(document, params.position);
	if (!word) {
		return [];
	}

	// First, check the current document for definitions
	const currentDocSymbols = symbolDefinitions.get(params.textDocument.uri);
	if (currentDocSymbols && currentDocSymbols.has(word)) {
		const definition = currentDocSymbols.get(word)!;
		return [definition.location];
	}

	// Then check all other documents (for workspace-wide definitions)
	for (const [documentUri, symbols] of symbolDefinitions) {
		if (documentUri !== params.textDocument.uri && symbols.has(word)) {
			const definition = symbols.get(word)!;
			return [definition.location];
		}
	}

	return [];
});

// Built-in Pie completions
const PIE_COMPLETIONS: CompletionItem[] = [
	// Basic types
	{ label: 'Nat', kind: CompletionItemKind.TypeParameter, detail: 'Natural numbers' },
	{ label: 'Atom', kind: CompletionItemKind.TypeParameter, detail: 'Atomic values' },
	{ label: 'Universe', kind: CompletionItemKind.TypeParameter, detail: 'Type of types' },
	{ label: 'U', kind: CompletionItemKind.TypeParameter, detail: 'Type of types (short)' },

	// Constructors
	{ label: 'zero', kind: CompletionItemKind.Value, detail: 'Natural number zero' },
	{ label: 'add1', kind: CompletionItemKind.Function, detail: 'Add one to a natural number' },
	{ label: 'nil', kind: CompletionItemKind.Value, detail: 'Empty list' },
	{ label: '::', kind: CompletionItemKind.Function, detail: 'List constructor' },
	{ label: 'cons', kind: CompletionItemKind.Function, detail: 'Pair constructor' },
	{ label: 'same', kind: CompletionItemKind.Function, detail: 'Reflexivity of equality' },

	// Functions
	{ label: 'lambda', kind: CompletionItemKind.Keyword, detail: 'Anonymous function' },
	{ label: 'λ', kind: CompletionItemKind.Keyword, detail: 'Anonymous function (Unicode)' },
	{ label: 'the', kind: CompletionItemKind.Keyword, detail: 'Type annotation' },
	{ label: 'car', kind: CompletionItemKind.Function, detail: 'First element of pair' },
	{ label: 'cdr', kind: CompletionItemKind.Function, detail: 'Second element of pair' },

	// Dependent types
	{ label: 'Pi', kind: CompletionItemKind.TypeParameter, detail: 'Dependent function type' },
	{ label: 'Π', kind: CompletionItemKind.TypeParameter, detail: 'Dependent function type (Unicode)' },
	{ label: 'Sigma', kind: CompletionItemKind.TypeParameter, detail: 'Dependent pair type' },
	{ label: 'Σ', kind: CompletionItemKind.TypeParameter, detail: 'Dependent pair type (Unicode)' },

	// Type constructors
	{ label: 'List', kind: CompletionItemKind.TypeParameter, detail: 'List type constructor' },
	{ label: 'Pair', kind: CompletionItemKind.TypeParameter, detail: 'Pair type constructor' },
	{ label: '->', kind: CompletionItemKind.TypeParameter, detail: 'Function type' },
	{ label: '→', kind: CompletionItemKind.TypeParameter, detail: 'Function type (Unicode)' },
	{ label: '=', kind: CompletionItemKind.TypeParameter, detail: 'Equality type' },

	// Equality functions
	{ label: 'replace', kind: CompletionItemKind.Function, detail: 'Substitution of equals for equals' },
	{ label: 'trans', kind: CompletionItemKind.Function, detail: 'Transitivity of equality' },
	{ label: 'cong', kind: CompletionItemKind.Function, detail: 'Congruence of equality' },
	{ label: 'symm', kind: CompletionItemKind.Function, detail: 'Symmetry of equality' },

	// Special
	{ label: 'TODO', kind: CompletionItemKind.Snippet, detail: 'Placeholder for incomplete code' },

	// Top-level forms
	{ label: 'define', kind: CompletionItemKind.Keyword, detail: 'Define a function or value' },
	{ label: 'claim', kind: CompletionItemKind.Keyword, detail: 'Claim the type of a name' },
	{ label: 'define-tactically', kind: CompletionItemKind.Keyword, detail: 'Define using tactics' }
];

// This handler provides the initial list of completion items
connection.onCompletion(
	(_textDocumentPosition: TextDocumentPositionParams): CompletionItem[] => {
		const document = documents.get(_textDocumentPosition.textDocument.uri);
		if (!document) {
			return PIE_COMPLETIONS;
		}

		// Get user-defined symbols for this document
		const userSymbols = documentSymbols.get(_textDocumentPosition.textDocument.uri);

		if (userSymbols) {
			// Combine built-in completions with user-defined symbols
			return [...PIE_COMPLETIONS, ...Array.from(userSymbols.values())];
		}

		return PIE_COMPLETIONS;
	}
);

// This handler resolves additional information for the item selected in the completion list
connection.onCompletionResolve(
	(item: CompletionItem): CompletionItem => {
		return item;
	}
);

// Helper function to convert Pie location to VS Code range
function locationToRange(location: any): { start: { line: number, character: number }, end: { line: number, character: number } } {
	if (location && location.syntax) {
		return {
			start: { line: location.syntax.start.line, character: location.syntax.start.column },
			end: { line: location.syntax.end.line, character: location.syntax.end.column }
		};
	}
	// Fallback to first line if no location info
	return {
		start: { line: 0, character: 0 },
		end: { line: 0, character: 10 }
	};
}

// Main function to type check a Pie document and return diagnostics
function typeCheckPieDocument(document: TextDocument): Diagnostic[] {
	const text = document.getText();
	const diagnostics: Diagnostic[] = [];
	let context = initCtx;

	try {
		// Parse the document into declarations
		const declarations = parsePieDeclarations(text);

		// Process each declaration
		for (const decl of declarations) {
			const declResult = processDeclaration(decl, context, document);
			diagnostics.push(...declResult.diagnostics);
			context = declResult.context;
		}

	} catch (error) {
		// Handle parsing errors - try to get location from error if available
		let range = { start: { line: 0, character: 0 }, end: { line: 0, character: 100 } };

		// Check if error has location information
		if (error && typeof error === 'object' && 'location' in error) {
			range = locationToRange((error as any).location);
		}

		const diagnostic: Diagnostic = {
			severity: DiagnosticSeverity.Error,
			range,
			message: `Parse error: ${error}`,
			source: 'Pie Language Server'
		};
		diagnostics.push(diagnostic);
	}

	return diagnostics;
}

// Parse Pie declarations from text
function parsePieDeclarations(text: string): Declaration[] {
	const declarations: Declaration[] = [];

	// First parse with scheme parser to get AST nodes
	const astList = schemeParse(text);

	// Then parse each AST node as a declaration
	for (const ast of astList) {
		const declaration = pieDeclarationParser.parseDeclaration(ast);
		declarations.push(declaration);
	}

	return declarations;
}

// Process a single declaration for type checking
function processDeclaration(decl: Declaration, context: Context, _document: TextDocument): { diagnostics: Diagnostic[], context: Context } {
	const diagnostics: Diagnostic[] = [];
	let newContext = context;

	try {
		if (decl instanceof Claim) {
			// Process claim declaration
			newContext = processClaimDeclaration(decl, context, diagnostics);
		} else if (decl instanceof Definition) {
			// Process define declaration
			newContext = processDefineDeclaration(decl, context, diagnostics);
		} else if (decl instanceof DefineTactically) {
			// Process define-tactically declaration
			newContext = processDefineTacticallyDeclaration(decl, context, diagnostics);
		} else {
			// Unknown declaration type or Source expression
			const range = (decl as any).location ? locationToRange((decl as any).location) : locationToRange(null);
			const diagnostic: Diagnostic = {
				severity: DiagnosticSeverity.Warning,
				range,
				message: `Unknown declaration type or unhandled expression`,
				source: 'Pie Language Server'
			};
			diagnostics.push(diagnostic);
		}
	} catch (error) {
		const range = (decl as any).location ? locationToRange((decl as any).location) : locationToRange(null);
		const diagnostic: Diagnostic = {
			severity: DiagnosticSeverity.Error,
			range,
			message: `Error processing declaration: ${error}`,
			source: 'Pie Language Server'
		};
		diagnostics.push(diagnostic);
	}

	return { diagnostics, context: newContext };
}

// Process claim declarations
function processClaimDeclaration(claim: Claim, context: Context, diagnostics: Diagnostic[]): Context {
	try {
		const result = addClaimToContext(context, claim.name, claim.location, claim.type);
		if (result instanceof go) {
			return result.result;
		} else if (result instanceof stop) {
			const diagnostic: Diagnostic = {
				severity: DiagnosticSeverity.Error,
				range: {
					start: { line: result.where.syntax.start.line, character: result.where.syntax.start.column },
					end: { line: result.where.syntax.end.line, character: result.where.syntax.end.column }
				},
				message: `${result.message}`,
				source: 'Pie Language Server'
			};
			diagnostics.push(diagnostic);
			return context;
		}
		return context;
	} catch (error) {
		const range = locationToRange(claim.location);
		const diagnostic: Diagnostic = {
			severity: DiagnosticSeverity.Error,
			range,
			message: `Error in claim '${claim.name}': ${error}`,
			source: 'Pie Language Server'
		};
		diagnostics.push(diagnostic);
		return context;
	}
}

// Process define declarations
function processDefineDeclaration(define: Definition, context: Context, diagnostics: Diagnostic[]): Context {
	try {
		const result = addDefineToContext(context, define.name, define.location, define.expr);
		if (result instanceof go) {
			return result.result;
		} else if (result instanceof stop) {
			const diagnostic: Diagnostic = {
				severity: DiagnosticSeverity.Error,
				range: {
					start: { line: result.where.syntax.start.line, character: result.where.syntax.start.column },
					end: { line: result.where.syntax.end.line, character: result.where.syntax.end.column }
				},
				message: `${result.message}`,
				source: 'Pie Language Server'
			};
			diagnostics.push(diagnostic);
			return context;
		}
		return context;
	} catch (error) {
		const range = locationToRange(define.location);
		const diagnostic: Diagnostic = {
			severity: DiagnosticSeverity.Error,
			range,
			message: `Error in definition '${define.name}': ${error}`,
			source: 'Pie Language Server'
		};
		diagnostics.push(diagnostic);
		return context;
	}
}

// Process define-tactically declarations
function processDefineTacticallyDeclaration(defineTactically: DefineTactically, context: Context, diagnostics: Diagnostic[]): Context {
	try {
		const proofManager = new ProofManager();

		// Start the proof
		const startResult = proofManager.startProof(defineTactically.name, context, defineTactically.location);
		if (startResult instanceof stop) {
			const diagnostic: Diagnostic = {
				severity: DiagnosticSeverity.Error,
				range: {
					start: { line: startResult.where.syntax.start.line, character: startResult.where.syntax.start.column },
					end: { line: startResult.where.syntax.end.line, character: startResult.where.syntax.end.column }
				},
				message: `${startResult.message}`,
				source: 'Pie Language Server'
			};
			diagnostics.push(diagnostic);
			return context;
		}

		// Apply each tactic
		for (const tactic of defineTactically.tactics) {
			const tacticResult = proofManager.applyTactic(tactic);
			if (tacticResult instanceof stop) {
				const diagnostic: Diagnostic = {
					severity: DiagnosticSeverity.Error,
					range: {
						start: { line: tacticResult.where.syntax.start.line, character: tacticResult.where.syntax.start.column },
						end: { line: tacticResult.where.syntax.end.line, character: tacticResult.where.syntax.end.column }
					},
					message: `Tactic error: ${tacticResult.message}`,
					source: 'Pie Language Server'
				};
				diagnostics.push(diagnostic);
				return context;
			}
		}

		// TODO: Update this when ProofManager provides context access
		return context;
	} catch (error) {
		const range = locationToRange(defineTactically.location);
		const diagnostic: Diagnostic = {
			severity: DiagnosticSeverity.Error,
			range,
			message: `Error in tactical definition '${defineTactically.name}': ${error}`,
			source: 'Pie Language Server'
		};
		diagnostics.push(diagnostic);
		return context;
	}
}

async function validateTextDocument(textDocument: TextDocument): Promise<void> {
	// Perform type checking
	const diagnostics = typeCheckPieDocument(textDocument);

	// Send the computed diagnostics
	connection.sendDiagnostics({ uri: textDocument.uri, diagnostics });
}

// Make the text document manager listen on the connection
// for open, change and close text document events
documents.listen(connection);

// Listen on the connection
connection.listen();

console.log('Pie Language Server worker started');
