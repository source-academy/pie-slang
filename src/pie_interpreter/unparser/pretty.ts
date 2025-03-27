import { Core } from "../types/core";
import { Value } from "../types/value";
import { Source } from "../types/source";

/**
 * Pretty print the Normalized Expression tree to a string.
 */
export function prettyPrintCore(expr: Core): string {
  return expr.prettyPrint();
}

export function prettyPrintValue(expr: Value): string {
  return expr.prettyPrint();
}

export function prettyPrintSource(expr: Source): string {
  return expr.prettyPrint();
}