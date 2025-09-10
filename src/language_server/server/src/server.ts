import {
	createConnection,
	TextDocuments,
	Diagnostic,
	DiagnosticSeverity,
	ProposedFeatures,
	InitializeParams,
	DidChangeConfigurationNotification,
	CompletionItem,
	CompletionItemKind,
	TextDocumentPositionParams,
	TextDocumentSyncKind,
	InitializeResult,
	DocumentDiagnosticReportKind,
	type DocumentDiagnosticReport
} from 'vscode-languageserver/node';

import {
	TextDocument
} from 'vscode-languageserver-textdocument';

// Create a connection for the server, using Node's IPC as a transport.
// Also include all preview / proposed LSP features.
const connection = createConnection(ProposedFeatures.all);

connection.console.log('Pie Language Server starting...');
console.error('Pie Language Server starting via console.error...'); // This might show up in different places

// Create a simple text document manager.
const documents = new TextDocuments(TextDocument);

let hasConfigurationCapability = false;
let hasWorkspaceFolderCapability = false;
let hasDiagnosticRelatedInformationCapability = false;

connection.onInitialize((params: InitializeParams) => {
	connection.console.log('Server: onInitialize called'); // for test useage
	const capabilities = params.capabilities;

	// Does the client support the `workspace/configuration` request?
	// If not, we fall back using global settings.
	hasConfigurationCapability = !!(
		capabilities.workspace && !!capabilities.workspace.configuration
	);
	hasWorkspaceFolderCapability = !!(
		capabilities.workspace && !!capabilities.workspace.workspaceFolders
	);
	hasDiagnosticRelatedInformationCapability = !!(
		capabilities.textDocument &&
		capabilities.textDocument.publishDiagnostics &&
		capabilities.textDocument.publishDiagnostics.relatedInformation
	);

	const result: InitializeResult = {
		capabilities: {
			textDocumentSync: TextDocumentSyncKind.Incremental,
			// Tell the client that this server supports code completion.
			completionProvider: {
				resolveProvider: true,
				triggerCharacters: ['(', ' ', '-']  // Add this line
			},
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
	connection.console.log('Server: onInitialized called');
});

// The example settings
interface ExampleSettings {
	maxNumberOfProblems: number;
}

// The global settings, used when the `workspace/configuration` request is not supported by the client.
// Please note that this is not the case when using this server with the client provided in this example
// but could happen with other clients.
const defaultSettings: ExampleSettings = { maxNumberOfProblems: 1000 };
let globalSettings: ExampleSettings = defaultSettings;

// Cache the settings of all open documents
const documentSettings = new Map<string, Thenable<ExampleSettings>>();

connection.onDidChangeConfiguration(change => {
	if (hasConfigurationCapability) {
		// Reset all cached document settings
		documentSettings.clear();
	} else {
		globalSettings = (
			(change.settings.languageServerExample || defaultSettings)
		);
	}
	// Refresh the diagnostics since the `maxNumberOfProblems` could have changed.
	// We could optimize things here and re-fetch the setting first can compare it
	// to the existing setting, but this is out of scope for this example.
	connection.languages.diagnostics.refresh();
});

function getDocumentSettings(resource: string): Thenable<ExampleSettings> {
	if (!hasConfigurationCapability) {
		return Promise.resolve(globalSettings);
	}
	let result = documentSettings.get(resource);
	if (!result) {
		result = connection.workspace.getConfiguration({
			scopeUri: resource,
			section: 'PieLanguageServer'
		});
		documentSettings.set(resource, result);
	}
	return result;
}

// Only keep settings for open documents
documents.onDidClose(e => {
	documentSettings.delete(e.document.uri);
});


connection.languages.diagnostics.on(async (params) => {
	const document = documents.get(params.textDocument.uri);
	if (document !== undefined) {
		return {
			kind: DocumentDiagnosticReportKind.Full,
			items: await validateTextDocument(document)
		} satisfies DocumentDiagnosticReport;
	} else {
		// We don't know the document. We can either try to read it from disk
		// or we don't report problems for it.
		return {
			kind: DocumentDiagnosticReportKind.Full,
			items: []
		} satisfies DocumentDiagnosticReport;
	}
});

// The content of a text document has changed. This event is emitted
// when the text document first opened or when its content has changed.
documents.onDidChangeContent(change => {
	validateTextDocument(change.document);
});

async function validateTextDocument(textDocument: TextDocument): Promise<Diagnostic[]> {
	// In this simple example we get the settings for every validate run.
	const settings = await getDocumentSettings(textDocument.uri);

	// The validator creates diagnostics for all uppercase words length 2 and more
	const text = textDocument.getText();
	const pattern = /\b[A-Z]{2,}\b/g;
	let m: RegExpExecArray | null;

	let problems = 0;
	const diagnostics: Diagnostic[] = [];
	while ((m = pattern.exec(text)) && problems < settings.maxNumberOfProblems) {
		problems++;
		const diagnostic: Diagnostic = {
			severity: DiagnosticSeverity.Warning,
			range: {
				start: textDocument.positionAt(m.index),
				end: textDocument.positionAt(m.index + m[0].length)
			},
			message: `${m[0]} is all uppercase.`,
			source: 'ex'
		};
		if (hasDiagnosticRelatedInformationCapability) {
			diagnostic.relatedInformation = [
				{
					location: {
						uri: textDocument.uri,
						range: Object.assign({}, diagnostic.range)
					},
					message: 'Spelling matters'
				},
				{
					location: {
						uri: textDocument.uri,
						range: Object.assign({}, diagnostic.range)
					},
					message: 'Particularly for names'
				}
			];
		}
		diagnostics.push(diagnostic);
	}
	return diagnostics;
}

connection.onDidChangeWatchedFiles(_change => {
	// Monitored files have change in VSCode
	connection.console.log('We received a file change event');
});

// Define Pie language keywords for auto-completion
const PIE_KEYWORDS: CompletionItem[] = [
	// Core types
	{ label: 'U', kind: CompletionItemKind.Keyword, data: 1 },
	{ label: 'Nat', kind: CompletionItemKind.TypeParameter, data: 2 },
	{ label: 'zero', kind: CompletionItemKind.Constructor, data: 3 },
	{ label: 'add1', kind: CompletionItemKind.Constructor, data: 4 },
	{ label: 'Atom', kind: CompletionItemKind.TypeParameter, data: 5 },
	{ label: 'Trivial', kind: CompletionItemKind.TypeParameter, data: 6 },
	{ label: 'sole', kind: CompletionItemKind.Constructor, data: 7 },
	{ label: 'Absurd', kind: CompletionItemKind.TypeParameter, data: 8 },
	
	// Function types
	{ label: '->', kind: CompletionItemKind.Operator, data: 9 },
	{ label: '→', kind: CompletionItemKind.Operator, data: 10 },
	{ label: 'Pi', kind: CompletionItemKind.Keyword, data: 11 },
	{ label: 'Π', kind: CompletionItemKind.Keyword, data: 12 },
	{ label: 'lambda', kind: CompletionItemKind.Keyword, data: 13 },
	{ label: 'λ', kind: CompletionItemKind.Keyword, data: 14 },
	{ label: 'the', kind: CompletionItemKind.Keyword, data: 15 },
	
	// Product/Pair types
	{ label: 'Sigma', kind: CompletionItemKind.Keyword, data: 16 },
	{ label: 'Σ', kind: CompletionItemKind.Keyword, data: 17 },
	{ label: 'Pair', kind: CompletionItemKind.TypeParameter, data: 18 },
	{ label: 'cons', kind: CompletionItemKind.Constructor, data: 19 },
	{ label: 'car', kind: CompletionItemKind.Function, data: 20 },
	{ label: 'cdr', kind: CompletionItemKind.Function, data: 21 },
	
	// List types
	{ label: 'List', kind: CompletionItemKind.TypeParameter, data: 22 },
	{ label: 'nil', kind: CompletionItemKind.Constructor, data: 23 },
	{ label: '::', kind: CompletionItemKind.Operator, data: 24 },
	
	// Vector types
	{ label: 'Vec', kind: CompletionItemKind.TypeParameter, data: 25 },
	{ label: 'vecnil', kind: CompletionItemKind.Constructor, data: 26 },
	{ label: 'vec::', kind: CompletionItemKind.Operator, data: 27 },
	{ label: 'head', kind: CompletionItemKind.Function, data: 28 },
	{ label: 'tail', kind: CompletionItemKind.Function, data: 29 },
	
	// Sum types
	{ label: 'Either', kind: CompletionItemKind.TypeParameter, data: 30 },
	{ label: 'left', kind: CompletionItemKind.Constructor, data: 31 },
	{ label: 'right', kind: CompletionItemKind.Constructor, data: 32 },
	
	// Equality types
	{ label: '=', kind: CompletionItemKind.Operator, data: 33 },
	{ label: 'same', kind: CompletionItemKind.Constructor, data: 34 },
	
	// Eliminators
	{ label: 'which-Nat', kind: CompletionItemKind.Function, data: 35 },
	{ label: 'iter-Nat', kind: CompletionItemKind.Function, data: 36 },
	{ label: 'rec-Nat', kind: CompletionItemKind.Function, data: 37 },
	{ label: 'ind-Nat', kind: CompletionItemKind.Function, data: 38 },
	{ label: 'rec-List', kind: CompletionItemKind.Function, data: 39 },
	{ label: 'ind-List', kind: CompletionItemKind.Function, data: 40 },
	{ label: 'ind-Vec', kind: CompletionItemKind.Function, data: 41 },
	{ label: 'ind-Either', kind: CompletionItemKind.Function, data: 42 },
	{ label: 'ind-=', kind: CompletionItemKind.Function, data: 43 },
	{ label: 'ind-Absurd', kind: CompletionItemKind.Function, data: 44 },
	
	// Equality operations
	{ label: 'replace', kind: CompletionItemKind.Function, data: 45 },
	{ label: 'trans', kind: CompletionItemKind.Function, data: 46 },
	{ label: 'cong', kind: CompletionItemKind.Function, data: 47 },
	{ label: 'symm', kind: CompletionItemKind.Function, data: 48 },
	
	// Quoted atoms
	{ label: 'quote', kind: CompletionItemKind.Constructor, data: 49 },
	
	// Development aid
	{ label: 'TODO', kind: CompletionItemKind.Keyword, data: 50 },
	
	// Top-level declarations
	{ label: 'claim', kind: CompletionItemKind.Keyword, data: 51 },
	{ label: 'define', kind: CompletionItemKind.Keyword, data: 52 },
	{ label: 'check-same', kind: CompletionItemKind.Keyword, data: 53 },
	{ label: 'define-tactically', kind: CompletionItemKind.Keyword, data: 54 },
	
	// Tactics
	{ label: 'exact', kind: CompletionItemKind.Method, data: 55 },
	{ label: 'intro', kind: CompletionItemKind.Method, data: 56 },
	{ label: 'exists', kind: CompletionItemKind.Method, data: 57 },
	{ label: 'elimNat', kind: CompletionItemKind.Method, data: 58 },
	{ label: 'elimList', kind: CompletionItemKind.Method, data: 59 },
	{ label: 'elimVec', kind: CompletionItemKind.Method, data: 60 },
	{ label: 'elimEqual', kind: CompletionItemKind.Method, data: 61 },
	{ label: 'elimEither', kind: CompletionItemKind.Method, data: 62 },
	{ label: 'elimAbsurd', kind: CompletionItemKind.Method, data: 63 },
	{ label: 'split', kind: CompletionItemKind.Method, data: 64 }
];

// This handler provides the initial list of the completion items.
connection.onCompletion(
	(_textDocumentPosition: TextDocumentPositionParams): CompletionItem[] => {
		connection.console.log('Completion requested!');
		connection.console.log(`Returning ${PIE_KEYWORDS.length} keywords`);
		return PIE_KEYWORDS;
	}
);

// This handler resolves additional information for the item selected in
// the completion list.
connection.onCompletionResolve(
	(item: CompletionItem): CompletionItem => {
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
	}
);

// Make the text document manager listen on the connection
// for open, change and close text document events
documents.listen(connection);

// Listen on the connection
connection.listen();