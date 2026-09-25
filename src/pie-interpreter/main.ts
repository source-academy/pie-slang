import { PieFrontend, PieFrontendError } from './frontend';
import type { Context } from './utils/context';

function evaluatePieInternal(source: string, verbose: boolean): { output: string; context: Context } {
  const result = new PieFrontend().execute(source, { verbose });
  if (!result.success) throw new PieFrontendError(result.diagnostics);
  return { output: result.output, context: result.context };
}

export function evaluatePie(source: string): string {
  return evaluatePieInternal(source, false).output;
}

export function evaluatePieVerbose(source: string): string {
  return evaluatePieInternal(source, true).output;
}

/** Evaluate a complete program with a fresh context, preserving the existing API. */
export function evaluatePieAndGetContext(source: string): { output: string; context: Context } {
  return evaluatePieInternal(source, false);
}

export { PieFrontend, PieFrontendError } from './frontend';
