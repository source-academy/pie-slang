/**
 * Simple browser-based language server for Pie
 * This provides diagnostics via a Web Worker without full LSP protocol
 */

import { pieDeclarationParser, Claim, Definition, DefineTactically, schemeParse } from '../../src/pie_interpreter/parser/parser';
import { Context, initCtx, addClaimToContext, addDefineToContext } from '../../src/pie_interpreter/utils/context';
import { go, stop } from '../../src/pie_interpreter/types/utils';
import { ProofManager } from '../../src/pie_interpreter/tactics/proofmanager';

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

	try {
		// Parse the document into declarations
		const astList = schemeParse(source);

		// Process each declaration
		for (const ast of astList) {
			const declaration = pieDeclarationParser.parseDeclaration(ast);
			const result = processDeclaration(declaration, context);
			diagnostics.push(...result.diagnostics);
			context = result.context;
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
function processDeclaration(decl: any, context: Context): { diagnostics: Diagnostic[], context: Context } {
	const diagnostics: Diagnostic[] = [];
	let newContext = context;

	try {
		if (decl instanceof Claim) {
			newContext = processClaimDeclaration(decl, context, diagnostics);
		} else if (decl instanceof Definition) {
			newContext = processDefineDeclaration(decl, context, diagnostics);
		} else if (decl instanceof DefineTactically) {
			newContext = processDefineTacticallyDeclaration(decl, context, diagnostics);
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

	return { diagnostics, context: newContext };
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

// Listen for messages from the main thread
self.onmessage = (event: MessageEvent) => {
	const { type, source } = event.data;

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
	}
};

console.log('Pie Language Server worker (simple) started');
