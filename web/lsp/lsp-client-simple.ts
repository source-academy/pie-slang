/**
 * Simple LSP client that connects Monaco Editor to our browser-based language server
 * without using monaco-languageclient (to avoid version conflicts)
 */

export class PieLanguageClient {
	private worker: Worker | null = null;

	/**
	 * Initialize the language client and connect it to the language server worker
	 */
	async start(): Promise<void> {
		// Create the language server worker
		this.worker = new Worker(new URL('./pie-lsp-worker-bundle.js', import.meta.url), { type: 'module' });

		console.log('Pie Language Server Worker created');

		// The worker will communicate via LSP messages
		// Monaco will handle the editor side through its built-in language features
		this.worker.onmessage = (event) => {
			console.log('LSP Worker message:', event.data);
		};

		this.worker.onerror = (error) => {
			console.error('LSP Worker error:', error);
		};
	}

	/**
	 * Stop the language client and terminate the worker
	 */
	async stop(): Promise<void> {
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
		return this.worker !== null;
	}
}

/**
 * Register the Pie language with Monaco Editor with syntax highlighting
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

	console.log('Pie language registered with Monaco');
}
