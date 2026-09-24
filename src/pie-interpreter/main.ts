import { ProgramSession, ProgramSessionError } from './session';
import type { Context } from './utils/context';

function evaluatePieInternal(source: string, verbose: boolean): { output: string; context: Context } {
  const result = new ProgramSession().execute(source, { verbose });
  if (!result.success) throw new ProgramSessionError(result.diagnostics);
  return { output: result.output, context: result.context };
}

export function evaluatePie(source: string): string {
  return evaluatePieInternal(source, false).output;
}

export function evaluatePieVerbose(source: string): string {
  return evaluatePieInternal(source, true).output;
}

/** Evaluate a complete program in a fresh session, preserving the existing API. */
export function evaluatePieAndGetContext(source: string): { output: string; context: Context } {
  return evaluatePieInternal(source, false);
}

export { ProgramSession, ProgramSessionError } from './session';
