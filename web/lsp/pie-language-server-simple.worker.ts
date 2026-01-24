/**
 * Simple browser-based language server for Pie
 * This provides diagnostics via a Web Worker without full LSP protocol
 */

import { pieDeclarationParser, Claim, Definition, DefineTactically, schemeParse } from '../../src/pie-interpreter/parser/parser';
import { TypeDefinition, handleTypeDefinition } from '../../src/pie-interpreter/typechecker/type-definition';
import { Context, initCtx, addClaimToContext, addDefineToContext, Binder, Define, Claim as ClaimBinder, Free, InductiveDatatypeBinder, ConstructorTypeBinder, EliminatorBinder, valInContext, bindVal, removeClaimFromContext } from '../../src/pie-interpreter/utils/context';
import { Renaming } from '../../src/pie-interpreter/typechecker/utils';
import { go, stop } from '../../src/pie-interpreter/types/utils';
import { ProofManager } from '../../src/pie-interpreter/tactics/proof-manager';
import { ProofState } from '../../src/pie-interpreter/tactics/proofstate';
import { Tactic, ThenTactic } from '../../src/pie-interpreter/tactics/tactics';
import { PIE_HOVER_INFO } from './pie_hover_info';
import { readBack } from '../../src/pie-interpreter/evaluator/utils';

interface Diagnostic {
	severity: 'error' | 'warning';
	startLine: number;
	startColumn: number;
	endLine: number;
	endColumn: number;
	message: string;
}

// Track declaration positions for line-based filtering
interface DeclarationInfo {
	name: string;
	kind: 'claim' | 'define' | 'define-tactically' | 'datatype';
	startLine: number;
	endLine: number;
	context: Context; // Context after this declaration is processed
}

// Track proof state at each tactic position - store pre-rendered strings for immutability
interface TacticStateSnapshot {
	startLine: number;
	startColumn: number;
	endLine: number;
	endColumn: number;
	proofTreeVisualization: string;
	currentGoalInfo: string;
	isComplete: boolean;
	tacticsApplied: number;
}

interface TacticalProofInfo {
	name: string;
	startLine: number;
	endLine: number;
	initialContext: Context;
	tacticSnapshots: TacticStateSnapshot[]; // Snapshot after each tactic
}

interface ValidationResult {
	diagnostics: Diagnostic[];
	declarations: DeclarationInfo[];
	tacticalProofs: TacticalProofInfo[];
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
	const declarations: DeclarationInfo[] = [];
	const tacticalProofs: TacticalProofInfo[] = [];
	let context = initCtx;
	let renaming: Renaming = new Map();

	try {
		// Parse the document into declarations
		const astList = schemeParse(source);

		// Process each declaration
		for (const ast of astList) {
			const declaration = pieDeclarationParser.parseDeclaration(ast);
			const result = processDeclaration(declaration, context, renaming, declarations, tacticalProofs);
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

	return { diagnostics, declarations, tacticalProofs };
}

// Process a single declaration for type checking
function processDeclaration(
	decl: any, 
	context: Context, 
	renaming: Renaming,
	declarations: DeclarationInfo[],
	tacticalProofs: TacticalProofInfo[]
): { diagnostics: Diagnostic[], context: Context, renaming: Renaming } {
	const diagnostics: Diagnostic[] = [];
	let newContext = context;
	let newRenaming = renaming;

	try {
		if (decl instanceof Claim) {
			const result = processClaimDeclaration(decl, context, diagnostics);
			newContext = result;
			// Track declaration
			const range = locationToRange(decl.location);
			declarations.push({
				name: decl.name,
				kind: 'claim',
				startLine: range.startLine,
				endLine: range.endLine,
				context: new Map(newContext)
			});
		} else if (decl instanceof Definition) {
			const result = processDefineDeclaration(decl, context, diagnostics);
			newContext = result;
			// Track declaration
			const range = locationToRange(decl.location);
			declarations.push({
				name: decl.name,
				kind: 'define',
				startLine: range.startLine,
				endLine: range.endLine,
				context: new Map(newContext)
			});
		} else if (decl instanceof DefineTactically) {
			const result = processDefineTacticallyDeclaration(decl, context, diagnostics, tacticalProofs);
			newContext = result;
			// Track declaration
			const range = locationToRange(decl.location);
			declarations.push({
				name: decl.name,
				kind: 'define-tactically',
				startLine: range.startLine,
				endLine: range.endLine,
				context: new Map(newContext)
			});
		} else if (decl instanceof TypeDefinition) {
			const result = processDefineDatatypeDeclaration(decl, context, renaming, diagnostics);
			newContext = result.context;
			newRenaming = result.renaming;
			// Track declaration
			const range = locationToRange(decl.location);
			declarations.push({
				name: decl.name,
				kind: 'datatype',
				startLine: range.startLine,
				endLine: range.endLine,
				context: new Map(newContext)
			});
		} else {
			const range = decl.location ? locationToRange(decl.location) : locationToRange(null);
			const diagnostic: Diagnostic = {
				severity: 'warning',
				...range,
				message: `Unknown declaration type or unhandled expression`
			};
			diagnostics.push(diagnostic);
		}
	} catch (error) {
		const range = decl.location ? locationToRange(decl.location) : locationToRange(null);
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
	datatype: TypeDefinition,
	context: Context,
	renaming: Renaming,
	diagnostics: Diagnostic[]
): { context: Context, renaming: Renaming } {
	try {
		const result = handleTypeDefinition(context, renaming, datatype);
		if (result instanceof go) {
			return { context: result.result, renaming };
		} else if (result instanceof stop) {
			const range = locationToRange(datatype.location);
			diagnostics.push({
				severity: 'error',
				...range,
				message: `Error in datatype definition '${datatype.name}': ${result.message}`
			});
			return { context, renaming };
		}
		return { context, renaming };
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
function processDefineTacticallyDeclaration(
	defineTactically: DefineTactically, 
	context: Context, 
	diagnostics: Diagnostic[],
	tacticalProofs: TacticalProofInfo[]
): Context {
	try {
		const proofManager = new ProofManager();
		const range = locationToRange(defineTactically.location);
		
		// Create tactical proof info to track states
		const tacticalProofInfo: TacticalProofInfo = {
			name: defineTactically.name,
			startLine: range.startLine,
			endLine: range.endLine,
			initialContext: new Map(context),
			tacticSnapshots: []
		};

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

		// Record initial state (at the start of the proof)
		if (proofManager.currentState) {
			tacticalProofInfo.tacticSnapshots.push(
				createProofStateSnapshot(proofManager.currentState, range.startLine, range.startColumn, range.startLine, range.startColumn, 0)
			);
		}

		// Counter for tactics applied
		let tacticCounter = 0;

		// Collect all tactic line ranges (including nested ones) for snapshot purposes
		function collectTacticRanges(tactics: Tactic[]): { tactic: Tactic, range: ReturnType<typeof locationToRange>, depth: number }[] {
			const result: { tactic: Tactic, range: ReturnType<typeof locationToRange>, depth: number }[] = [];
			
			function collect(tactics: Tactic[], depth: number) {
				for (const tactic of tactics) {
					const tacticRange = locationToRange(tactic.location);
					result.push({ tactic, range: tacticRange, depth });
					
					// If it's a ThenTactic, collect its inner tactics too
					if (tactic instanceof ThenTactic && (tactic as any).tactics) {
						const innerTactics = (tactic as any).tactics as Tactic[];
						collect(innerTactics, depth + 1);
					}
				}
			}
			
			collect(tactics, 0);
			return result;
		}

		// Get all tactic ranges sorted by line number
		const allTacticRanges = collectTacticRanges(defineTactically.tactics);
		allTacticRanges.sort((a, b) => a.range.startLine - b.range.startLine);

		// Recursive function to apply tactics and record snapshots
		// For ThenTactic, we manually handle its logic and apply inner tactics one-by-one
		// to capture intermediate states
		function applyTacticsWithSnapshots(tactics: Tactic[], state: ProofState): { state: ProofState | null, error: stop | null } {
			for (const tactic of tactics) {
				const tacticRange = locationToRange(tactic.location);

				// Record state BEFORE applying this tactic
				tacticCounter++;
				tacticalProofInfo.tacticSnapshots.push(
					createProofStateSnapshot(state, tacticRange.startLine, tacticRange.startColumn, tacticRange.endLine, tacticRange.endColumn, tacticCounter)
				);

				// Special handling for ThenTactic: apply inner tactics one-by-one
				if (tactic instanceof ThenTactic && (tactic as any).tactics) {
					const innerTactics = (tactic as any).tactics as Tactic[];

					// Replicate ThenTactic.apply() logic but apply inner tactics individually
					// Step 1: Consume a pending branch if any
					if (state.pendingBranches > 0) {
						state.pendingBranches--;
					}

					// Step 2: Save and clear pending branches for inner tactics
					const savedPendingBranches = state.pendingBranches;
					state.pendingBranches = 0;

					// Step 3: Apply inner tactics one-by-one with snapshot recording
					const innerResult = applyTacticsWithSnapshots(innerTactics, state);
					if (innerResult.error) {
						return innerResult;
					}
					state = innerResult.state!;

					// Step 4: Restore pending branches
					state.pendingBranches = savedPendingBranches;

					// Step 5: Move to next goal if no more pending branches
					if (state.pendingBranches === 0) {
						state.nextGoal();
					}
				} else {
					// Regular tactic: apply directly
					const tacticResult = tactic.apply(state);
					if (tacticResult instanceof stop) {
						return { state: null, error: tacticResult };
					}
					state = (tacticResult as go<ProofState>).result;
				}
			}
			return { state, error: null };
		}

		// Apply all top-level tactics with snapshot recording
		if (proofManager.currentState) {
			const result = applyTacticsWithSnapshots(defineTactically.tactics, proofManager.currentState);
			if (result.error) {
				const errorRange = locationToRange(result.error.where);
				const diagnostic: Diagnostic = {
					severity: 'error',
					...errorRange,
					message: `Tactic error: ${result.error.message}`
				};
				diagnostics.push(diagnostic);
				tacticalProofs.push(tacticalProofInfo);
				return context;
			}
			proofManager.currentState = result.state!;

			// Add a final snapshot for the completed proof state
			// This is shown when cursor is past the last tactic
			tacticCounter++;
			tacticalProofInfo.tacticSnapshots.push(
				createProofStateSnapshot(proofManager.currentState, range.endLine, range.endColumn, range.endLine, range.endColumn, tacticCounter)
			);
		}

		tacticalProofs.push(tacticalProofInfo);

		// If the proof is complete, add the definition to the context
		if (proofManager.currentState && proofManager.currentState.isComplete()) {
			// Get the claim from context
			const claim = context.get(defineTactically.name);
			if (claim instanceof ClaimBinder) {
				const type = claim.type;

				// Extract proof term from the goal tree
				const goalTree = proofManager.currentState.goalTree;
				const proofTerm = goalTree?.extractTerm();

				if (proofTerm) {
					// Evaluate the proof term and add to context
					const proofValue = valInContext(context, proofTerm);
					const newCtx = bindVal(removeClaimFromContext(context, defineTactically.name), defineTactically.name, type, proofValue);
					return newCtx;
				}
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

// Create an immutable snapshot of the proof state
function createProofStateSnapshot(
	state: ProofState,
	startLine: number,
	startColumn: number,
	endLine: number,
	endColumn: number,
	tacticsApplied: number
): TacticStateSnapshot {
	let proofTreeVisualization = '';
	let currentGoalInfo = '';

	try {
		proofTreeVisualization = state.visualizeTree();
	} catch {
		proofTreeVisualization = '<error visualizing tree>';
	}

	try {
		const currentGoalResult = state.getCurrentGoal();
		if (currentGoalResult instanceof go) {
			const goal = currentGoalResult.result;
			currentGoalInfo = goal.prettyPrintWithContext();
		} else {
			currentGoalInfo = 'No current goal';
		}
	} catch {
		currentGoalInfo = '<error getting goal>';
	}

	return {
		startLine,
		startColumn,
		endLine,
		endColumn,
		proofTreeVisualization,
		currentGoalInfo,
		isComplete: state.isComplete(),
		tacticsApplied
	};
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

// Cache for validation result (includes context tracking)
let cachedValidationSource = '';
let cachedValidationResult: ValidationResult | null = null;

function getCachedValidationResult(source: string): ValidationResult {
	if (source !== cachedValidationSource || !cachedValidationResult) {
		cachedValidationSource = source;
		cachedValidationResult = validatePieSource(source);
	}
	return cachedValidationResult;
}

// ANSI color codes for terminal-style formatting
// These will be interpreted by the display renderer
const COLORS = {
	DIM: '\x1b[2m',
	BRIGHT: '\x1b[1m',
	GREEN: '\x1b[32m',
	YELLOW: '\x1b[33m',
	CYAN: '\x1b[36m',
	RESET: '\x1b[0m',
};

// Format a binder for display with color codes
function formatBinder(name: string, binder: Binder, context: Context): string {
	try {
		if (binder instanceof Define) {
			// Show both type and value for defined terms
			const typeStr = binder.type.readBackType(context).prettyPrint();
			// Use readBack to properly convert the value to Core representation
			const valueStr = readBack(context, binder.type, binder.value).prettyPrint();
			// name : type = value (with colors: name bright, type dimmed, value bright)
			return `${COLORS.BRIGHT}${name}${COLORS.RESET} ${COLORS.DIM}: ${typeStr}${COLORS.RESET} = ${COLORS.BRIGHT}${valueStr}${COLORS.RESET}`;
		} else if (binder instanceof ClaimBinder) {
			const typeStr = binder.type.readBackType(context).prettyPrint();
			// claimed: name and "(claimed)" bright, type dimmed
			return `${COLORS.BRIGHT}${name}${COLORS.RESET} ${COLORS.DIM}: ${typeStr}${COLORS.RESET} ${COLORS.YELLOW}(claimed)${COLORS.RESET}`;
		} else if (binder instanceof Free) {
			const typeStr = binder.type.readBackType(context).prettyPrint();
			// free variable: name bright, type dimmed
			return `${COLORS.BRIGHT}${name}${COLORS.RESET} ${COLORS.DIM}: ${typeStr}${COLORS.RESET}`;
		} else if (binder instanceof InductiveDatatypeBinder) {
			return `${COLORS.BRIGHT}${name}${COLORS.RESET} ${COLORS.DIM}: U${COLORS.RESET} ${COLORS.CYAN}(inductive type)${COLORS.RESET}`;
		} else if (binder instanceof ConstructorTypeBinder) {
			return `${COLORS.BRIGHT}${name}${COLORS.RESET} ${COLORS.CYAN}(constructor)${COLORS.RESET}`;
		} else if (binder instanceof EliminatorBinder) {
			return `${COLORS.BRIGHT}${name}${COLORS.RESET} ${COLORS.CYAN}(eliminator)${COLORS.RESET}`;
		} else {
			return `${COLORS.BRIGHT}${name}${COLORS.RESET} ${COLORS.DIM}: ?${COLORS.RESET}`;
		}
	} catch {
		return `${COLORS.BRIGHT}${name}${COLORS.RESET} ${COLORS.DIM}: <error reading type>${COLORS.RESET}`;
	}
}

// Get context at a specific line, filtering to show only what's defined before that line
// Note: cursorLine and cursorColumn are 0-based (from Monaco), but stored line numbers are 1-based (from parser)
function getContextAtLine(
	validationResult: ValidationResult,
	cursorLine: number,
	cursorColumn: number = 0
): { contextLines: string[], inTacticalProof: boolean, proofInfo: string | null } {
	const contextLines: string[] = [];

	// Convert 0-based cursor line to 1-based for comparison with stored line numbers
	const cursorLine1Based = cursorLine + 1;
	// Column is also 1-based in the parser
	const cursorColumn1Based = cursorColumn + 1;

	// Check if we're inside a tactical proof
	for (const tacticalProof of validationResult.tacticalProofs) {
		if (cursorLine1Based >= tacticalProof.startLine && cursorLine1Based <= tacticalProof.endLine) {
			// We're inside a tactical proof - find the appropriate tactic snapshot
			// Sort snapshots by line number and tacticsApplied to ensure proper ordering
			const sortedSnapshots = [...tacticalProof.tacticSnapshots].sort((a, b) => {
				// Primary sort by startLine
				if (a.startLine !== b.startLine) return a.startLine - b.startLine;
				// Secondary sort by startColumn
				if (a.startColumn !== b.startColumn) return a.startColumn - b.startColumn;
				// Tertiary sort by tacticsApplied (earlier states first)
				return a.tacticsApplied - b.tacticsApplied;
			});

			// Find the appropriate snapshot based on cursor position
			// Each snapshot represents state BEFORE that tactic is applied
			// If cursor is past the tactic's end, show the NEXT snapshot (state after)
			let relevantSnapshot: TacticStateSnapshot | null = null;

			for (let i = 0; i < sortedSnapshots.length; i++) {
				const snapshot = sortedSnapshots[i];

				// Check if cursor is before or within this tactic's range
				const cursorBeforeTacticEnd =
					cursorLine1Based < snapshot.endLine ||
					(cursorLine1Based === snapshot.endLine && cursorColumn1Based <= snapshot.endColumn);

				const cursorAtOrAfterTacticStart =
					cursorLine1Based > snapshot.startLine ||
					(cursorLine1Based === snapshot.startLine && cursorColumn1Based >= snapshot.startColumn);

				if (cursorAtOrAfterTacticStart) {
					if (cursorBeforeTacticEnd) {
						// Cursor is within this tactic - show state BEFORE this tactic
						relevantSnapshot = snapshot;
					} else {
						// Cursor is past this tactic's end - look for the next snapshot
						// The next snapshot represents state after this tactic
						if (i + 1 < sortedSnapshots.length) {
							relevantSnapshot = sortedSnapshots[i + 1];
						} else {
							// No next snapshot - this was the last tactic, show its state
							relevantSnapshot = snapshot;
						}
					}
				}
			}

			// Fallback: if no snapshot found yet, use the first one
			if (!relevantSnapshot && sortedSnapshots.length > 0) {
				relevantSnapshot = sortedSnapshots[0];
			}

			if (relevantSnapshot) {
				const proofInfo = formatProofSnapshot(relevantSnapshot);

				// Also include context from before the tactical proof
				const ctx = tacticalProof.initialContext;
				for (const [name, binder] of ctx) {
					// Skip internal/special binders
					if (name.startsWith('_')) continue;
					contextLines.push(formatBinder(name, binder, ctx));
				}

				return { contextLines, inTacticalProof: true, proofInfo };
			}
		}
	}
	
	// Not in a tactical proof - show context defined before the cursor line
	// Find the last declaration that ends before or at the cursor line
	let relevantContext: Context = initCtx;
	
	for (const decl of validationResult.declarations) {
		// Use <= to include declarations that complete on the current line
		if (decl.endLine <= cursorLine1Based) {
			relevantContext = decl.context;
		}
	}
	
	// Format the context
	for (const [name, binder] of relevantContext) {
		// Skip internal/special binders
		if (name.startsWith('_')) continue;
		contextLines.push(formatBinder(name, binder, relevantContext));
	}
	
	return { contextLines, inTacticalProof: false, proofInfo: null };
}

// Format proof snapshot for display (Lean-style) with colors
function formatProofSnapshot(snapshot: TacticStateSnapshot): string {
	const lines: string[] = [];
	
	// Show proof tree visualization with colors
	lines.push(`${COLORS.CYAN}Proof Tree:${COLORS.RESET}`);
	// Color the proof tree - completed goals (✓) dimmed, current goal (→) bright
	const coloredTree = snapshot.proofTreeVisualization
		.split('\n')
		.map(line => {
			if (line.includes('✓')) {
				return `${COLORS.DIM}${line}${COLORS.RESET}`;
			} else if (line.includes('→')) {
				return `${COLORS.BRIGHT}${line}${COLORS.RESET}`;
			} else {
				return line;
			}
		})
		.join('\n');
	lines.push(coloredTree);
	lines.push('');
	
	// Show current goal context and target with colors
	// Parse and colorize the goal info
	const coloredGoalInfo = colorizeGoalInfo(snapshot.currentGoalInfo);
	lines.push(coloredGoalInfo);
	
	if (snapshot.isComplete) {
		lines.push('');
		lines.push(`${COLORS.GREEN}✓ All goals have been solved!${COLORS.RESET}`);
	}
	
	return lines.join('\n');
}

// Colorize goal info: types dimmed, names/values bright
// Uses state-based approach to handle multi-line types and goals
function colorizeGoalInfo(goalInfo: string): string {
	const lines = goalInfo.split('\n');
	const coloredLines: string[] = [];
	
	// Track current section: 'none', 'context', 'goal'
	let currentSection: 'none' | 'context' | 'goal' = 'none';
	// Track if we're in the middle of a multi-line type (in context)
	let inContextType = false;
	// Track if we're in the middle of a multi-line goal
	let inGoalType = false;
	
	for (const line of lines) {
		// Context header
		if (line.startsWith('Context:')) {
			currentSection = 'context';
			inContextType = false;
			coloredLines.push(`${COLORS.CYAN}Context:${COLORS.RESET}`);
			continue;
		}
		
		// Separator line - marks transition from context to goal
		if (line.includes('────')) {
			currentSection = 'goal';
			inContextType = false;
			coloredLines.push(`${COLORS.DIM}${line}${COLORS.RESET}`);
			continue;
		}
		
		// Goal line
		if (line.startsWith('Goal:')) {
			currentSection = 'goal';
			inGoalType = true;
			const goalType = line.substring(5).trim();
			coloredLines.push(`${COLORS.CYAN}Goal:${COLORS.RESET} ${COLORS.BRIGHT}${goalType}${COLORS.RESET}`);
			continue;
		}
		
		// No current goal message
		if (line === 'No current goal') {
			coloredLines.push(`${COLORS.DIM}${line}${COLORS.RESET}`);
			continue;
		}
		
		// In context section
		if (currentSection === 'context') {
			// Check if this is a new "name : type" line
			if (line.includes(' : ')) {
				const parts = line.split(' : ');
				if (parts.length >= 2) {
					const name = parts[0];
					const rest = parts.slice(1).join(' : ');
					coloredLines.push(`${COLORS.BRIGHT}${name}${COLORS.RESET} ${COLORS.DIM}: ${rest}${COLORS.RESET}`);
					inContextType = true;
					continue;
				}
			}
			// Continuation of a multi-line type in context - dim it
			if (inContextType) {
				coloredLines.push(`${COLORS.DIM}${line}${COLORS.RESET}`);
				continue;
			}
		}
		
		// In goal section (after separator or after Goal:)
		if (currentSection === 'goal' && inGoalType) {
			// Continuation of multi-line goal - bright
			coloredLines.push(`${COLORS.BRIGHT}${line}${COLORS.RESET}`);
			continue;
		}
		
		// Default: return line as-is
		coloredLines.push(line);
	}
	
	return coloredLines.join('\n');
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
		} catch {
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
		} catch {
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
		} catch {
			self.postMessage({
				type: 'hover-result',
				hoverInfo: null
			});
		}
	} else if (type === 'context-info') {
		try {
			// Get context information at the cursor position
			const validationResult = getCachedValidationResult(source);
			const contextInfo = getContextAtLine(validationResult, line, column);

			self.postMessage({
				type: 'context-info-result',
				contextLines: contextInfo.contextLines,
				inTacticalProof: contextInfo.inTacticalProof,
				proofInfo: contextInfo.proofInfo
			});
		} catch (error) {
			self.postMessage({
				type: 'context-info-result',
				contextLines: [],
				inTacticalProof: false,
				proofInfo: null,
				error: String(error)
			});
		}
	}
};

console.log('Pie Language Server worker (simple) started');
