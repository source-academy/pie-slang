/**
 * Simple browser-based language server for Pie
 * This provides diagnostics via a Web Worker without full LSP protocol
 */

import { pieDeclarationParser, Claim, Definition, DefineTactically, schemeParse } from '../../src/pie_interpreter/parser/parser';
import { DefineDatatypeSource } from '../../src/pie_interpreter/typechecker/definedatatype';
import { Context, initCtx, addClaimToContext, addDefineToContext } from '../../src/pie_interpreter/utils/context';
import { Renaming } from '../../src/pie_interpreter/typechecker/utils';
import { go, stop } from '../../src/pie_interpreter/types/utils';
import { ProofManager } from '../../src/pie_interpreter/tactics/proofmanager';
import { PIE_HOVER_INFO } from './pie_hover_info';

interface Diagnostic {
	severity: 'error' | 'warning';
	startLine: number;
	startColumn: number;
	endLine: number;
	endColumn: number;
	message: string;
}

interface ValidationResult {
	diagnostics: Diagnostic[];
}

// Helper function to convert Pie location to diagnostic range
function locationToRange(location: any): { startLine: number, startColumn: number, endLine: number, endColumn: number } {
	if (location && location.syntax) {
		return {
			startLine: location.syntax.start.line,
			startColumn: location.syntax.start.column,
			endLine: location.syntax.end.line,
			endColumn: location.syntax.end.column
		};
	}
	// Fallback to first line if no location info
	return {
		startLine: 0,
		startColumn: 0,
		endLine: 0,
		endColumn: 10
	};
}

// Main function to type check a Pie document and return diagnostics
function validatePieSource(source: string): ValidationResult {
	const diagnostics: Diagnostic[] = [];
	let context = initCtx;
	let renaming: Renaming = new Map();

	try {
		// Parse the document into declarations
		const astList = schemeParse(source);

		// Process each declaration
		for (const ast of astList) {
			const declaration = pieDeclarationParser.parseDeclaration(ast);
			const result = processDeclaration(declaration, context, renaming);
			diagnostics.push(...result.diagnostics);
			context = result.context;
			renaming = result.renaming;
		}

	} catch (error) {
		// Handle parsing errors
		const range = locationToRange(null);
		const diagnostic: Diagnostic = {
			severity: 'error',
			...range,
			message: `Parse error: ${error}`
		};
		diagnostics.push(diagnostic);
	}

	return { diagnostics };
}

// Process a single declaration for type checking
function processDeclaration(decl: any, context: Context, renaming: Renaming): { diagnostics: Diagnostic[], context: Context, renaming: Renaming } {
	const diagnostics: Diagnostic[] = [];
	let newContext = context;
	let newRenaming = renaming;

	try {
		if (decl instanceof Claim) {
			newContext = processClaimDeclaration(decl, context, diagnostics);
		} else if (decl instanceof Definition) {
			newContext = processDefineDeclaration(decl, context, diagnostics);
		} else if (decl instanceof DefineTactically) {
			newContext = processDefineTacticallyDeclaration(decl, context, diagnostics);
		} else if (decl instanceof DefineDatatypeSource) {
			const result = processDefineDatatypeDeclaration(decl, context, renaming, diagnostics);
			newContext = result.context;
			newRenaming = result.renaming;
		} else {
			const range = (decl as any).location ? locationToRange((decl as any).location) : locationToRange(null);
			const diagnostic: Diagnostic = {
				severity: 'warning',
				...range,
				message: `Unknown declaration type or unhandled expression`
			};
			diagnostics.push(diagnostic);
		}
	} catch (error) {
		const range = (decl as any).location ? locationToRange((decl as any).location) : locationToRange(null);
		const diagnostic: Diagnostic = {
			severity: 'error',
			...range,
			message: `Error processing declaration: ${error}`
		};
		diagnostics.push(diagnostic);
	}

	return { diagnostics, context: newContext, renaming: newRenaming };
}

// Process define-datatype declarations (inductive types)
function processDefineDatatypeDeclaration(
	datatype: DefineDatatypeSource,
	context: Context,
	renaming: Renaming,
	diagnostics: Diagnostic[]
): { context: Context, renaming: Renaming } {
	try {
		const [newCtx, newRenaming] = datatype.normalizeConstructor(context, renaming);
		return { context: newCtx, renaming: newRenaming };
	} catch (error) {
		const range = locationToRange(datatype.location);
		diagnostics.push({
			severity: 'error',
			...range,
			message: `Error in datatype definition '${datatype.name}': ${error}`
		});
		return { context, renaming };
	}
}

// Process claim declarations
function processClaimDeclaration(claim: Claim, context: Context, diagnostics: Diagnostic[]): Context {
	try {
		const result = addClaimToContext(context, claim.name, claim.location, claim.type);
		if (result instanceof go) {
			return result.result;
		} else if (result instanceof stop) {
			const range = locationToRange(result.where);
			const diagnostic: Diagnostic = {
				severity: 'error',
				...range,
				message: `${result.message}`
			};
			diagnostics.push(diagnostic);
			return context;
		}
		return context;
	} catch (error) {
		const range = locationToRange(claim.location);
		const diagnostic: Diagnostic = {
			severity: 'error',
			...range,
			message: `Error in claim '${claim.name}': ${error}`
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
			const range = locationToRange(result.where);
			const diagnostic: Diagnostic = {
				severity: 'error',
				...range,
				message: `${result.message}`
			};
			diagnostics.push(diagnostic);
			return context;
		}
		return context;
	} catch (error) {
		const range = locationToRange(define.location);
		const diagnostic: Diagnostic = {
			severity: 'error',
			...range,
			message: `Error in definition '${define.name}': ${error}`
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
			const range = locationToRange(startResult.where);
			const diagnostic: Diagnostic = {
				severity: 'error',
				...range,
				message: `${startResult.message}`
			};
			diagnostics.push(diagnostic);
			return context;
		}

		// Apply each tactic
		for (const tactic of defineTactically.tactics) {
			const tacticResult = proofManager.applyTactic(tactic);
			if (tacticResult instanceof stop) {
				const range = locationToRange(tacticResult.where);
				const diagnostic: Diagnostic = {
					severity: 'error',
					...range,
					message: `Tactic error: ${tacticResult.message}`
				};
				diagnostics.push(diagnostic);
				return context;
			}
		}

		return context;
	} catch (error) {
		const range = locationToRange(defineTactically.location);
		const diagnostic: Diagnostic = {
			severity: 'error',
			...range,
			message: `Error in tactical definition '${defineTactically.name}': ${error}`
		};
		diagnostics.push(diagnostic);
		return context;
	}
}

// Built-in Pie completions
const PIE_COMPLETIONS = [
	// Basic types
	{ label: 'Nat', kind: 'TypeParameter', detail: 'Natural numbers' },
	{ label: 'Atom', kind: 'TypeParameter', detail: 'Atomic values' },
	{ label: 'Universe', kind: 'TypeParameter', detail: 'Type of types' },
	{ label: 'U', kind: 'TypeParameter', detail: 'Type of types (short)' },

	// Constructors
	{ label: 'zero', kind: 'Value', detail: 'Natural number zero' },
	{ label: 'add1', kind: 'Function', detail: 'Add one to a natural number' },
	{ label: 'nil', kind: 'Value', detail: 'Empty list' },
	{ label: '::', kind: 'Function', detail: 'List constructor' },
	{ label: 'cons', kind: 'Function', detail: 'Pair constructor' },
	{ label: 'same', kind: 'Function', detail: 'Reflexivity of equality' },

	// Functions
	{ label: 'lambda', kind: 'Keyword', detail: 'Anonymous function' },
	{ label: 'λ', kind: 'Keyword', detail: 'Anonymous function (Unicode)' },
	{ label: 'the', kind: 'Keyword', detail: 'Type annotation' },
	{ label: 'car', kind: 'Function', detail: 'First element of pair' },
	{ label: 'cdr', kind: 'Function', detail: 'Second element of pair' },

	// Dependent types
	{ label: 'Pi', kind: 'TypeParameter', detail: 'Dependent function type' },
	{ label: 'Π', kind: 'TypeParameter', detail: 'Dependent function type (Unicode)' },
	{ label: 'Sigma', kind: 'TypeParameter', detail: 'Dependent pair type' },
	{ label: 'Σ', kind: 'TypeParameter', detail: 'Dependent pair type (Unicode)' },

	// Type constructors
	{ label: 'List', kind: 'TypeParameter', detail: 'List type constructor' },
	{ label: 'Pair', kind: 'TypeParameter', detail: 'Pair type constructor' },
	{ label: 'Vec', kind: 'TypeParameter', detail: 'Vector type constructor' },
	{ label: 'Either', kind: 'TypeParameter', detail: 'Either type constructor' },
	{ label: '->', kind: 'TypeParameter', detail: 'Function type' },
	{ label: '→', kind: 'TypeParameter', detail: 'Function type (Unicode)' },
	{ label: '=', kind: 'TypeParameter', detail: 'Equality type' },

	// Vector constructors
	{ label: 'vecnil', kind: 'Value', detail: 'Empty vector' },
	{ label: 'vec::', kind: 'Function', detail: 'Vector constructor' },

	// Either constructors
	{ label: 'left', kind: 'Function', detail: 'Left Either constructor' },
	{ label: 'right', kind: 'Function', detail: 'Right Either constructor' },

	// Eliminators
	{ label: 'which-Nat', kind: 'Function', detail: 'Case analysis for Nat' },
	{ label: 'iter-Nat', kind: 'Function', detail: 'Iteration over Nat' },
	{ label: 'rec-Nat', kind: 'Function', detail: 'Recursion over Nat' },
	{ label: 'ind-Nat', kind: 'Function', detail: 'Induction over Nat' },
	{ label: 'rec-List', kind: 'Function', detail: 'Recursion over List' },
	{ label: 'ind-List', kind: 'Function', detail: 'Induction over List' },
	{ label: 'ind-Vec', kind: 'Function', detail: 'Induction over Vec' },
	{ label: 'ind-Either', kind: 'Function', detail: 'Case analysis for Either' },

	// Equality functions
	{ label: 'replace', kind: 'Function', detail: 'Substitution of equals for equals' },
	{ label: 'trans', kind: 'Function', detail: 'Transitivity of equality' },
	{ label: 'cong', kind: 'Function', detail: 'Congruence of equality' },
	{ label: 'symm', kind: 'Function', detail: 'Symmetry of equality' },
	{ label: 'ind-=', kind: 'Function', detail: 'Induction for equality' },

	// Special
	{ label: 'TODO', kind: 'Snippet', detail: 'Placeholder for incomplete code' },
	{ label: 'check-same', kind: 'Keyword', detail: 'Check equality' },

	// Top-level forms
	{ label: 'define', kind: 'Keyword', detail: 'Define a function or value' },
	{ label: 'claim', kind: 'Keyword', detail: 'Claim the type of a name' },
	{ label: 'define-tactically', kind: 'Keyword', detail: 'Define using tactics' }
];

interface SymbolDefinition {
	name: string;
	line: number;
	startColumn: number;
	endColumn: number;
	type: 'define' | 'claim' | 'define-tactically';
	typeInfo?: string;
}

// Extract user-defined symbols from source
function extractUserDefinedSymbols(source: string): {
	completions: any[],
	definitions: Map<string, SymbolDefinition>
} {
	const completions: any[] = [];
	const definitions = new Map<string, SymbolDefinition>();
	const lines = source.split('\n');

	// Regular expressions for Pie constructs
	const definePattern = /\(define\s+([a-zA-Z][a-zA-Z0-9\-_!?*+=<>]*)/;
	const claimPattern = /\(claim\s+([a-zA-Z][a-zA-Z0-9\-_!?*+=<>]*)\s+(.+?)\)/;
	const defineTacticallyPattern = /\(define-tactically\s+([a-zA-Z][a-zA-Z0-9\-_!?*+=<>]*)/;

	lines.forEach((line, lineIndex) => {
		// Check for define
		let match = definePattern.exec(line);
		if (match) {
			const symbolName = match[1];
			const startCol = line.indexOf(symbolName);

			completions.push({
				label: symbolName,
				kind: 'Function',
				detail: 'User-defined function'
			});

			definitions.set(symbolName, {
				name: symbolName,
				line: lineIndex,
				startColumn: startCol,
				endColumn: startCol + symbolName.length,
				type: 'define'
			});
		}

		// Check for claim
		match = claimPattern.exec(line);
		if (match) {
			const symbolName = match[1];
			const typeSpec = match[2];
			const startCol = line.indexOf(symbolName);

			completions.push({
				label: symbolName,
				kind: 'Variable',
				detail: `Claimed type: ${typeSpec.substring(0, 50)}${typeSpec.length > 50 ? '...' : ''}`
			});

			definitions.set(symbolName, {
				name: symbolName,
				line: lineIndex,
				startColumn: startCol,
				endColumn: startCol + symbolName.length,
				type: 'claim',
				typeInfo: typeSpec
			});
		}

		// Check for define-tactically
		match = defineTacticallyPattern.exec(line);
		if (match) {
			const symbolName = match[1];
			const startCol = line.indexOf(symbolName);

			completions.push({
				label: symbolName,
				kind: 'Function',
				detail: 'Tactically defined function'
			});

			definitions.set(symbolName, {
				name: symbolName,
				line: lineIndex,
				startColumn: startCol,
				endColumn: startCol + symbolName.length,
				type: 'define-tactically'
			});
		}
	});

	return { completions, definitions };
}

// Get word at cursor position
function getWordAtPosition(source: string, line: number, column: number): string | null {
	const lines = source.split('\n');

	if (line >= lines.length) {
		return null;
	}

	const lineText = lines[line];

	if (column >= lineText.length) {
		return null;
	}

	// Define what constitutes an identifier in Pie
	const identifierRegex = /[a-zA-Z0-9_\-!?*+=<>λΠΣ→]/;

	// Find start of word
	let start = column;
	while (start > 0 && identifierRegex.test(lineText[start - 1])) {
		start--;
	}

	// Find end of word
	let end = column;
	while (end < lineText.length && identifierRegex.test(lineText[end])) {
		end++;
	}

	if (start === end) {
		return null;
	}

	return lineText.substring(start, end);
}

// Get word at position along with its range and cursor offset within the word
function getWordAndRange(source: string, line: number, column: number): { word: string, start: number, end: number, cursorOffset: number } | null {
	const lines = source.split('\n');

	if (line >= lines.length) {
		return null;
	}

	const lineText = lines[line];

	// Define what constitutes an identifier in Pie
	const identifierRegex = /[a-zA-Z0-9_\-!?*+=<>λΠΣ→]/;

	// Find start of word
	let start = column;
	while (start > 0 && identifierRegex.test(lineText[start - 1])) {
		start--;
	}

	// Find end of word
	let end = column;
	while (end < lineText.length && identifierRegex.test(lineText[end])) {
		end++;
	}

	if (start === end) {
		return null;
	}

	return {
		word: lineText.substring(start, end),
		start,
		end,
		cursorOffset: column - start
	};
}

// Cache for symbols (avoid re-parsing on every completion request)
let cachedSource = '';
let cachedSymbols: { completions: any[], definitions: Map<string, SymbolDefinition> } | null = null;

function getSymbols(source: string) {
	if (source !== cachedSource) {
		cachedSource = source;
		cachedSymbols = extractUserDefinedSymbols(source);
	}
	return cachedSymbols!;
}

// Listen for messages from the main thread
self.onmessage = (event: MessageEvent) => {
	const { type, source, line, column } = event.data;

	if (type === 'validate') {
		try {
			const result = validatePieSource(source);
			self.postMessage({
				type: 'validation-result',
				diagnostics: result.diagnostics
			});
		} catch (error) {
			self.postMessage({
				type: 'validation-error',
				error: String(error)
			});
		}
	} else if (type === 'completion') {
		try {
			// Get the word at cursor position for prefix filtering
			const wordInfo = getWordAndRange(source, line, column);
			const prefix = wordInfo ? wordInfo.word.substring(0, wordInfo.cursorOffset) : '';

			const symbols = getSymbols(source);
			let allCompletions = [...PIE_COMPLETIONS, ...symbols.completions];

			// Filter completions based on prefix
			if (prefix) {
				allCompletions = allCompletions.filter(item =>
					item.label.toLowerCase().startsWith(prefix.toLowerCase())
				);

				// Sort by relevance: exact prefix match > case-sensitive match > case-insensitive match
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

			self.postMessage({
				type: 'completion-result',
				completions: allCompletions,
				wordRange: wordInfo ? { start: wordInfo.start, end: wordInfo.end } : null
			});
		} catch (error) {
			self.postMessage({
				type: 'completion-result',
				completions: PIE_COMPLETIONS,
				wordRange: null
			});
		}
	} else if (type === 'definition') {
		try {
			const word = getWordAtPosition(source, line, column);
			if (!word) {
				self.postMessage({
					type: 'definition-result',
					location: null
				});
				return;
			}

			const symbols = getSymbols(source);
			const definition = symbols.definitions.get(word);

			if (definition) {
				self.postMessage({
					type: 'definition-result',
					location: {
						line: definition.line,
						startColumn: definition.startColumn,
						endColumn: definition.endColumn
					}
				});
			} else {
				self.postMessage({
					type: 'definition-result',
					location: null
				});
			}
		} catch (error) {
			self.postMessage({
				type: 'definition-result',
				location: null
			});
		}
	} else if (type === 'hover') {
		try {
			const word = getWordAtPosition(source, line, column);
			if (!word) {
				self.postMessage({
					type: 'hover-result',
					hoverInfo: null
				});
				return;
			}

			// Check for user-defined symbols first
			const symbols = getSymbols(source);
			const definition = symbols.definitions.get(word);

			if (definition) {
				const hoverInfo = {
					title: word,
					summary: `User-defined ${definition.type}`,
					details: definition.typeInfo ? `Type: ${definition.typeInfo}` : undefined,
					examples: undefined
				};
				self.postMessage({
					type: 'hover-result',
					hoverInfo
				});
				return;
			}

			// Fall back to built-in hover info
			const builtinInfo = PIE_HOVER_INFO.get(word);
			if (builtinInfo) {
				self.postMessage({
					type: 'hover-result',
					hoverInfo: {
						title: word,
						summary: builtinInfo.summary,
						details: builtinInfo.details,
						examples: builtinInfo.examples
					}
				});
				return;
			}

			// Check if it's a number
			if (/^\d+$/.test(word)) {
				self.postMessage({
					type: 'hover-result',
					hoverInfo: {
						title: 'Natural number literal',
						summary: `Represents the Nat value ${word}`,
						details: undefined,
						examples: undefined
					}
				});
				return;
			}

			// Check if it's a quoted atom
			if (word.startsWith("'")) {
				self.postMessage({
					type: 'hover-result',
					hoverInfo: {
						title: 'Quoted atom',
						summary: `Type: Atom`,
						details: `Value: ${word}`,
						examples: undefined
					}
				});
				return;
			}

			// No hover info found
			self.postMessage({
				type: 'hover-result',
				hoverInfo: null
			});
		} catch (error) {
			self.postMessage({
				type: 'hover-result',
				hoverInfo: null
			});
		}
	}
};

console.log('Pie Language Server worker (simple) started');
