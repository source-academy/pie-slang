import {
	createConnection,
	TextDocuments,
	Diagnostic,
	ProposedFeatures,
	InitializeParams,
	DidChangeConfigurationNotification,
	CompletionItem,
	CompletionItemKind,
	TextDocumentPositionParams,
	TextDocumentSyncKind,
	InitializeResult,
	DocumentDiagnosticReportKind,
	type DocumentDiagnosticReport,
	Hover,
	HoverParams,
	MarkupKind,
	Location,
	Position,
	DefinitionParams,
} from 'vscode-languageserver/node';

import { PIE_HOVER_INFO } from './pie-hover-info';

import {
	TextDocument
} from 'vscode-languageserver-textdocument';

import { analyzePieDocument } from './pie-analysis';

// Interface to store symbol definition information
interface SymbolDefinition {
	name: string;
	location: Location;
	type: 'claim' | 'define' | 'define-tactically';
	typeInfo?: string;
}

// Create a connection for the server
const connection = createConnection(ProposedFeatures.all);


// Create a simple text document manager.
const documents: TextDocuments<TextDocument> = new TextDocuments(TextDocument);

let hasConfigurationCapability = false;
let hasWorkspaceFolderCapability = false;

// Track user-defined symbols per document for go-to-definition and hover
const symbolDefinitions = new Map<string, Map<string, SymbolDefinition>>();

connection.onInitialize((params: InitializeParams) => {
	const capabilities = params.capabilities;

	// Does the client support the `workspace/configuration` request?
	// If not, we fall back using global settings.
	hasConfigurationCapability = !!(
		capabilities.workspace && !!capabilities.workspace.configuration
	);
	hasWorkspaceFolderCapability = !!(
		capabilities.workspace && !!capabilities.workspace.workspaceFolders
	);

	const result: InitializeResult = {
		capabilities: {
			textDocumentSync: TextDocumentSyncKind.Incremental,
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
		connection.client.register(DidChangeConfigurationNotification.type, undefined);
	}
	if (hasWorkspaceFolderCapability) {
		connection.workspace.onDidChangeWorkspaceFolders(_event => {
			connection.console.log('Workspace folder change event received.');
		});
	}
});


interface Settings {
	maxNumberOfProblems: number;
}


// Cache the settings of all open documents
const documentSettings = new Map<string, Thenable<Settings>>();

// Track user-defined symbols per document
const documentSymbols = new Map<string, Map<string, CompletionItem>>();

connection.onDidChangeConfiguration(_change => {
	if (hasConfigurationCapability) {
		// Reset all cached document settings
		documentSettings.clear();
	}
	// Refresh the diagnostics since the `maxNumberOfProblems` could have changed.
	// We could optimize things here and re-fetch the setting first can compare it
	// to the existing setting, but this is out of scope for this example.
	connection.languages.diagnostics.refresh();
});


// The content of a text document has changed. This event is emitted
// when the text document first opened or when its content has changed.
documents.onDidChangeContent(change => {
	connection.console.log('Document content changed');
	
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
	documentSettings.delete(e.document.uri);
	documentSymbols.delete(e.document.uri);
	symbolDefinitions.delete(e.document.uri);
});

// Extract symbols when document is opened
documents.onDidOpen(change => {
	connection.console.log('Document opened: ' + change.document.uri);

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

// Get word at position with range information
function getWordAndRange(document: TextDocument, position: Position): { word: string, start: number, end: number, cursorOffset: number } | null {
	const text = document.getText();
	const lines = text.split('\n');

	if (position.line >= lines.length) {
		return null;
	}

	const line = lines[position.line];
	const character = position.character;

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

	if (start === end) {
		return null;
	}

	return {
		word: line.substring(start, end),
		start,
		end,
		cursorOffset: character - start
	};
}

// Hover handler
connection.onHover((params: HoverParams): Hover | null => {
	connection.console.log(`Hover requested at ${params.position.line}:${params.position.character}`);
	
	const document = documents.get(params.textDocument.uri);
	if (!document) {
		return null;
	}
	
	const word = getWordAtPosition(document, params.position);
	if (!word) {
		return null;
	}
	
	connection.console.log(`Hovering over word: "${word}"`);
	
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
	
	// Check if it's a number
	if (/^\d+$/.test(word)) {
		return {
			contents: {
				kind: MarkupKind.Markdown,
				value: `**Natural number literal**\n\nRepresents the Nat value ${word}`
			}
		};
	}
	
	// Check if it's a quoted atom
	if (word.startsWith("'")) {
		return {
			contents: {
				kind: MarkupKind.Markdown,
				value: `**Quoted atom**\n\nType: \`Atom\`\n\nValue: \`${word}\``
			}
		};
	}
	
	return null;
});

// Handler for Go to Definition requests
connection.onDefinition((params: DefinitionParams): Location[] => {
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
		const definition = currentDocSymbols.get(word)!;
		connection.console.log(`Found definition in current document: ${definition.type}`);
		return [definition.location];
	}

	// Then check all other documents (for workspace-wide definitions)
	for (const [documentUri, symbols] of symbolDefinitions) {
		if (documentUri !== params.textDocument.uri && symbols.has(word)) {
			const definition = symbols.get(word)!;
			connection.console.log(`Found definition in document ${documentUri}: ${definition.type}`);
			return [definition.location];
		}
	}
	
	connection.console.log(`No definition found for: ${word}`);
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

// This handler provides the initial list of completion items.
connection.onCompletion(
	(_textDocumentPosition: TextDocumentPositionParams): CompletionItem[] => {
		const document = documents.get(_textDocumentPosition.textDocument.uri);
		if (!document) {
			return PIE_COMPLETIONS;
		}

		// Get the word at cursor for prefix filtering
		const wordInfo = getWordAndRange(document, _textDocumentPosition.position);
		const prefix = wordInfo ? wordInfo.word.substring(0, wordInfo.cursorOffset) : '';

		// Get user-defined symbols for this document
		const userSymbols = documentSymbols.get(_textDocumentPosition.textDocument.uri);

		// Combine built-in completions with user-defined symbols
		let allCompletions = userSymbols
			? [...PIE_COMPLETIONS, ...Array.from(userSymbols.values())]
			: PIE_COMPLETIONS;

		// Filter completions based on prefix
		if (prefix) {
			allCompletions = allCompletions.filter(item =>
				item.label.toLowerCase().startsWith(prefix.toLowerCase())
			);

			// Sort by relevance
			allCompletions.sort((a, b) => {
				const aLabel = a.label;
				const bLabel = b.label;

				// Exact match gets highest priority
				if (aLabel === prefix && bLabel !== prefix) return -1;
				if (bLabel === prefix && aLabel !== prefix) return 1;

				// Case-sensitive prefix match
				const aStartsWith = aLabel.startsWith(prefix);
				const bStartsWith = bLabel.startsWith(prefix);
				if (aStartsWith && !bStartsWith) return -1;
				if (bStartsWith && !aStartsWith) return 1;

				// Then sort alphabetically
				return aLabel.localeCompare(bLabel);
			});
		}

		// Add textEdit to replace the word range if we found one
		if (wordInfo) {
			allCompletions = allCompletions.map(item => ({
				...item,
				textEdit: {
					range: {
						start: { line: _textDocumentPosition.position.line, character: wordInfo.start },
						end: { line: _textDocumentPosition.position.line, character: wordInfo.end }
					},
					newText: item.label
				}
			}));
		}

		return allCompletions;
	}
);

// This handler resolves additional information for the item selected in the completion list.
connection.onCompletionResolve(
	(item: CompletionItem): CompletionItem => {
		return item;
	}
);

// The editor delegates declaration handling to the same session as execution.
function typeCheckPieDocument(document: TextDocument) {
    return analyzePieDocument(document.getText());
}

async function validateTextDocument(textDocument: TextDocument): Promise<void> {
	// Perform type checking
	const result = typeCheckPieDocument(textDocument);
	// let problems = 0;
	const diagnostics: Diagnostic[] = [];

	// Add type checking diagnostics
	diagnostics.push(...result.diagnostics);
	// problems += result.diagnostics.length;

	// Send the computed diagnostics to VSCode.
	connection.sendDiagnostics({ uri: textDocument.uri, diagnostics });
}


connection.onDidChangeWatchedFiles(_change => {
	// Monitored files have change in VSCode
	connection.console.log('We received a file change event');
});


connection.onRequest('custom/documentSymbols', (params: { textDocument: { uri: string } }) => {
	const symbols = symbolDefinitions.get(params.textDocument.uri);
	if (symbols) {
		return Array.from(symbols.entries()).map(([name, def]) => ({
			name,
			type: def.type,
			location: def.location
		}));
	}
	return [];
});

// Diagnostic provider
connection.languages.diagnostics.on(async (params) => {
	const document = documents.get(params.textDocument.uri);
	if (document !== undefined) {
		const result = typeCheckPieDocument(document);
		return {
			kind: DocumentDiagnosticReportKind.Full,
			items: result.diagnostics
		} satisfies DocumentDiagnosticReport;
	} else {
		return {
			kind: DocumentDiagnosticReportKind.Full,
			items: []
		} satisfies DocumentDiagnosticReport;
	}
});

// Make the text document manager listen on the connection
// for open, change and close text document events
documents.listen(connection);

// Listen on the connection
connection.listen();
