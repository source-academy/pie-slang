import { stop } from '../types/utils';
import type { Location } from '../utils/locations';

/** Plain data, suitable for workers and editors. Lines and columns are zero-based. */
export interface DiagnosticRange {
  startLine: number;
  startColumn: number;
  endLine: number;
  endColumn: number;
}

export interface Diagnostic {
  severity: 'error' | 'warning' | 'info' | 'hint';
  message: string;
  range: DiagnosticRange;
  source: 'parser' | 'typechecker';
}

interface SourcePosition {
  line: number;
  column: number;
}

interface SourceSpan {
  start: SourcePosition;
  end: SourcePosition;
}

function isPosition(value: unknown): value is SourcePosition {
  return typeof value === 'object' && value !== null &&
    'line' in value && typeof value.line === 'number' &&
    'column' in value && typeof value.column === 'number';
}

function rangeOf(span: SourceSpan): DiagnosticRange {
  return {
    startLine: Math.max(0, span.start.line - 1),
    startColumn: Math.max(0, span.start.column),
    endLine: Math.max(0, span.end.line - 1),
    endColumn: Math.max(0, span.end.column),
  };
}

export function diagnosticFromError(
  error: unknown,
  source: Diagnostic['source'],
  fallback?: Location | SourceSpan,
): Diagnostic {
  let span = fallback && ('syntax' in fallback ? fallback.syntax : fallback);
  let message: string;
  if (error instanceof stop) {
    span = error.where.syntax;
    message = error.message.toString();
  } else {
    message = error instanceof Error ? error.message : `${error}`;
    // Scheme lexer/parser errors carry a one-based line in `loc`.
    if (typeof error === 'object' && error !== null && 'loc' in error && isPosition(error.loc)) {
      span = { start: error.loc, end: { ...error.loc, column: error.loc.column + 1 } };
    }
  }
  return {
    severity: 'error',
    message,
    source,
    range: span ? rangeOf(span) : { startLine: 0, startColumn: 0, endLine: 0, endColumn: 1 },
  };
}

export class PieFrontendError extends Error {
  constructor(public readonly diagnostics: readonly Diagnostic[]) {
    // Message-only hosts need a readable location; editor ranges stay zero-based.
    super(diagnostics.map(({ message, range }) =>
      `${message} (line ${range.startLine + 1}, column ${range.startColumn + 1})`,
    ).join('\n'));
    this.name = 'PieFrontendError';
  }
}
