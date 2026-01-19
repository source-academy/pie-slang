import { schemeParse, pieDeclarationParser, Claim, Definition, SamenessCheck, DefineTactically } from '../src/pie_interpreter/parser/parser';
import { initCtx, addClaimToContext, addDefineToContext, addDefineTacticallyToContext, Context, Define } from '../src/pie_interpreter/utils/context';
import { checkSame, represent } from '../src/pie_interpreter/typechecker/represent';
import { go, stop, Message } from '../src/pie_interpreter/types/utils';
import { readBack } from '../src/pie_interpreter/evaluator/utils';
import { prettyPrintCore } from '../src/pie_interpreter/unparser/pretty';
import { DefineDatatypeSource, handleDefineDatatype } from '../src/pie_interpreter/typechecker/definedatatype';
import { ProofTreeData } from '../src/pie_interpreter/tactics/proofstate';

export interface Diagnostic {
  message: string;
  startLineNumber: number;
  startColumn: number;
  endLineNumber: number;
  endColumn: number;
  severity: 'error' | 'warning';
}

export interface AnalysisResult {
  diagnostics: Diagnostic[];
  summary: string;
  pretty?: string;
  messages?: string;
  proofTree?: ProofTreeData;
}

export function analyzePieSource(source: string): AnalysisResult {
  const trimmed = source.trim();
  if (!trimmed) {
    return {
      diagnostics: [],
      summary: 'Waiting for input…'
    };
  }

  const diagnostics: Diagnostic[] = [];
  const ctx = cloneContext(initCtx);
  let messages = '';
  let proofTree: ProofTreeData | undefined;

  try {
    const astList = schemeParse(source);

    for (const ast of astList) {
      const declaration = pieDeclarationParser.parseDeclaration(ast);
      const result = processDeclaration(ctx, declaration);
      // Capture message and proofTree even when there's a diagnostic
      // (e.g., incomplete proofs still have useful visualization data)
      if (result.message) {
        messages += result.message;
      }
      if (result.proofTree) {
        proofTree = result.proofTree;
      }
      if (result.diagnostic) {
        diagnostics.push(result.diagnostic);
        break;
      }
    }
  } catch (error) {
    diagnostics.push(parseThrownError(error));
  }

  const summary = diagnostics.length === 0
    ? 'No issues detected.'
    : diagnostics.some(item => item.severity === 'error') ? 'Errors detected.' : 'Warnings detected.';

  let pretty: string | undefined;
  if (diagnostics.length === 0) {
    const contextOutput = formatContext(ctx);
    // Combine messages (tactic output) with context output
    pretty = messages ? messages + '\n' + contextOutput : contextOutput;
  }

  return {
    diagnostics,
    summary,
    pretty,
    messages: messages || undefined,
    proofTree
  };
}

interface DeclarationResult {
  diagnostic: Diagnostic | null;
  message?: string;
  proofTree?: ProofTreeData;
}

function processDeclaration(ctx: Context, declaration: ReturnType<typeof pieDeclarationParser.parseDeclaration>): DeclarationResult {
  try {
    if (declaration instanceof Claim) {
      const result = addClaimToContext(ctx, declaration.name, declaration.location, declaration.type);
      if (result instanceof go) {
        assignContext(ctx, result.result);
        return { diagnostic: null };
      }
      return { diagnostic: diagnosticFromStop(result as stop) };
    } else if (declaration instanceof Definition) {
      const result = addDefineToContext(ctx, declaration.name, declaration.location, declaration.expr);
      if (result instanceof go) {
        assignContext(ctx, result.result);
        return { diagnostic: null };
      }
      return { diagnostic: diagnosticFromStop(result as stop) };
    } else if (declaration instanceof SamenessCheck) {
      const outcome = checkSame(ctx, declaration.location, declaration.type, declaration.left, declaration.right);
      if (outcome instanceof go) {
        return { diagnostic: null };
      }
      return { diagnostic: diagnosticFromStop(outcome as stop) };
    } else if (declaration instanceof DefineTactically) {
      const result = addDefineTacticallyToContext(ctx, declaration.name, declaration.location, declaration.tactics);
      if (result instanceof go) {
        assignContext(ctx, result.result.context);
        // Check if proof was incomplete
        if (result.result.isIncomplete) {
          const loc = declaration.location.locationToSrcLoc();
          return {
            diagnostic: {
              message: 'Proof incomplete. Not all goals have been solved.',
              startLineNumber: loc.startLine,
              startColumn: Math.max(1, loc.startColumn),
              endLineNumber: loc.endLine ?? loc.startLine,
              endColumn: Math.max(loc.endColumn ?? loc.startColumn + 1, loc.startColumn + 1),
              severity: 'error' as const
            },
            message: result.result.message,
            proofTree: result.result.proofTree
          };
        }
        return { diagnostic: null, message: result.result.message, proofTree: result.result.proofTree };
      }
      return { diagnostic: diagnosticFromStop(result as stop) };
    } else if (declaration instanceof DefineDatatypeSource) {
      const result = handleDefineDatatype(ctx, new Map(), declaration);
      if (result instanceof go) {
        assignContext(ctx, result.result);
        return { diagnostic: null };
      }
      return { diagnostic: diagnosticFromStop(result as stop) };
    } else {
      const outcome = represent(ctx, declaration);
      if (outcome instanceof go) {
        return { diagnostic: null };
      }
      return { diagnostic: diagnosticFromStop(outcome as stop) };
    }
  } catch (error) {
    return { diagnostic: parseThrownError(error) };
  }
}

function diagnosticFromStop(result: stop): Diagnostic {
  const loc = result.where.locationToSrcLoc();
  return {
    message: formatMessage(result.message),
    startLineNumber: loc.startLine,
    startColumn: Math.max(1, loc.startColumn),
    endLineNumber: loc.endLine ?? loc.startLine,
    endColumn: Math.max(loc.endColumn ?? loc.startColumn + 1, loc.startColumn + 1),
    severity: 'error'
  };
}

function parseThrownError(error: unknown): Diagnostic {
  if (error instanceof Error) {
    const message = error.message || 'Unknown error';
    const parsed = parseLocationFromMessage(message);
    return parsed ?? fallbackDiagnostic(message);
  }
  return fallbackDiagnostic(typeof error === 'string' ? error : 'Unknown error');
}

function parseLocationFromMessage(message: string): Diagnostic | null {
  const goOnMatch = /Error message: (.*) at (.*):(\d+):(\d+)/s.exec(message);
  if (goOnMatch) {
    const [, rawMsg, , line, column] = goOnMatch;
    return {
      message: cleanMessage(rawMsg),
      startLineNumber: Number(line),
      startColumn: Number(column),
      endLineNumber: Number(line),
      endColumn: Number(column) + 1,
      severity: 'error'
    };
  }

  const genericMatch = /(.*):(\d+):(\d+)(.*)/s.exec(message);
  if (genericMatch) {
    const [, , line, column, tail] = genericMatch;
    const msg = message.replace(/^[^:]+:\d+:\d+/, '').trim();
    return {
      message: cleanMessage(msg || tail || 'Error'),
      startLineNumber: Number(line),
      startColumn: Number(column),
      endLineNumber: Number(line),
      endColumn: Number(column) + 1,
      severity: 'error'
    };
  }

  return null;
}

function fallbackDiagnostic(message: string): Diagnostic {
  return {
    message: cleanMessage(message),
    startLineNumber: 1,
    startColumn: 1,
    endLineNumber: 1,
    endColumn: 2,
    severity: 'error'
  };
}

function cleanMessage(message: string): string {
  return message
    .replace(/^\[|\]$/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

function formatMessage(message: Message): string {
  return message.message
    .map(part => typeof part === 'string' ? part : part.prettyPrint())
    .join(' ');
}

function cloneContext(ctx: Context): Context {
  return new Map(ctx);
}

function assignContext(target: Context, next: Context): void {
  target.clear();
  for (const [key, value] of next) {
    target.set(key, value);
  }
}

function formatContext(ctx: Context): string {
  const lines: string[] = [];
  for (const [name, binder] of ctx) {
    if (binder instanceof Define) {
      const type = prettyPrintCore(binder.type.readBackType(ctx));
      const value = prettyPrintCore(readBack(ctx, binder.type, binder.value));
      lines.push(`${name} : ${type}`);
      lines.push(`${name} = ${value}`);
    } else if (binder.type) {
      const type = prettyPrintCore(binder.type.readBackType(ctx));
      lines.push(`${name} : ${type}`);
    }
  }
  return lines.join('\n');
}
