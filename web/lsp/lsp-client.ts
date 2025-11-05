import { MonacoLanguageClient } from 'monaco-languageclient';
import {
	BrowserMessageReader,
	BrowserMessageWriter,
	CloseAction,
	ErrorAction,
	MessageTransports
} from 'vscode-languageclient/browser';
import * as monaco from 'monaco-editor';

export class PieLanguageClient {
	private client: MonacoLanguageClient | null = null;
	private worker: Worker | null = null;

	/**
	 * Initialize the language client and connect it to the language server worker
	 */
	async start(): Promise<void> {
		// Create the language server worker
		this.worker = new Worker(new URL('./pie-lsp-worker-bundle.js', import.meta.url), { type: 'module' });

		// Create message reader and writer
		const reader = new BrowserMessageReader(this.worker);
		const writer = new BrowserMessageWriter(this.worker);

		const transports: MessageTransports = {
			reader,
			writer
		};

		// Create the language client
		this.client = new MonacoLanguageClient({
			name: 'Pie Language Client',
			clientOptions: {
				// Use 'pie' as the document selector
				documentSelector: [{ language: 'pie' }],
				// Disable the default error handler
				errorHandler: {
					error: () => ({ action: ErrorAction.Continue }),
					closed: () => ({ action: CloseAction.DoNotRestart })
				}
			},
			// Create a language client connection from the JSON-RPC connection on demand
			connectionProvider: {
				get: () => {
					return Promise.resolve(transports);
				}
			}
		});

		// Start the language client
		await this.client.start();
		console.log('Pie Language Client started');
	}

	/**
	 * Stop the language client and terminate the worker
	 */
	async stop(): Promise<void> {
		if (this.client) {
			await this.client.stop();
			this.client = null;
		}

		if (this.worker) {
			this.worker.terminate();
			this.worker = null;
		}

		console.log('Pie Language Client stopped');
	}

	/**
	 * Check if the client is running
	 */
	isRunning(): boolean {
		return this.client !== null && this.worker !== null;
	}
}

/**
 * Register the Pie language with Monaco Editor
 */
export function registerPieLanguage(monacoInstance: typeof monaco): void {
	// Register a new language
	monacoInstance.languages.register({ id: 'pie' });

	// Register language configuration
	monacoInstance.languages.setLanguageConfiguration('pie', {
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
	monacoInstance.languages.setMonarchTokensProvider('pie', {
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
		symbols: /[=><!~?:&|+\-*\/\^%]+/,

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
				[/"([^"\\]|\\.)*$/, 'string.invalid'], // non-terminated string
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
