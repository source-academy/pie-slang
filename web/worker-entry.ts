import { schemeParse, pieDeclarationParser, Claim, Definition, SamenessCheck, DefineTactically, Tactic } from '../src/pie_interpreter/parser/parser';
import { initCtx, addClaimToContext, addDefineToContext, Context, Define } from '../src/pie_interpreter/utils/context';
import { checkSame, represent } from '../src/pie_interpreter/typechecker/represent';
import { go, stop, Message } from '../src/pie_interpreter/types/utils';
import { type Location } from '../src/pie_interpreter/utils/locations';
import { ProofManager } from '../src/pie_interpreter/tactics/proofmanager';
import { readBack } from '../src/pie_interpreter/evaluator/utils';
import { prettyPrintCore } from '../src/pie_interpreter/unparser/pretty';

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

  try {
    const astList = schemeParse(source);

    for (const ast of astList) {
      const declaration = pieDeclarationParser.parseDeclaration(ast);
      const diagnostic = processDeclaration(ctx, declaration);
      if (diagnostic) {
        diagnostics.push(diagnostic);
        break;
      }
    }
  } catch (error) {
    diagnostics.push(parseThrownError(error));
  }

  const summary = diagnostics.length === 0
    ? 'No issues detected.'
    : diagnostics.some(item => item.severity === 'error') ? 'Errors detected.' : 'Warnings detected.';

  return {
    diagnostics,
    summary,
    pretty: diagnostics.length === 0 ? formatContext(ctx) : undefined
  };
}

function processDeclaration(ctx: Context, declaration: ReturnType<typeof pieDeclarationParser.parseDeclaration>): Diagnostic | null {
  try {
    if (declaration instanceof Claim) {
      const result = addClaimToContext(ctx, declaration.name, declaration.location, declaration.type);
      if (result instanceof go) {
        assignContext(ctx, result.result);
        return null;
      }
      return diagnosticFromStop(result as stop);
    } else if (declaration instanceof Definition) {
      const result = addDefineToContext(ctx, declaration.name, declaration.location, declaration.expr);
      if (result instanceof go) {
        assignContext(ctx, result.result);
        return null;
      }
      return diagnosticFromStop(result as stop);
    } else if (declaration instanceof SamenessCheck) {
      const outcome = checkSame(ctx, declaration.location, declaration.type, declaration.left, declaration.right);
      if (outcome instanceof go) {
        return null;
      }
      return diagnosticFromStop(outcome as stop);
    } else if (declaration instanceof DefineTactically) {
      return processDefineTactically(ctx, declaration);
    } else {
      const outcome = represent(ctx, declaration);
      if (outcome instanceof go) {
        return null;
      }
      return diagnosticFromStop(outcome as stop);
    }
  } catch (error) {
    return parseThrownError(error);
  }
}

function processDefineTactically(ctx: Context, declaration: DefineTactically): Diagnostic | null {
  const proofManager = new ProofManager();
  const start = proofManager.startProof(declaration.name, ctx, declaration.location);
  if (start instanceof stop) {
    return diagnosticFromStop(start);
  }

  for (const tactic of declaration.tactics as Tactic[]) {
    const result = proofManager.applyTactic(tactic);
    if (result instanceof stop) {
      return diagnosticFromStop(result);
    }
  }
  return null;
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
