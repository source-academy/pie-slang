import * as C from "../types/core";

/**
 * Pretty print the Normalized Expression tree to a string.
 */
export function prettyPrint(expr: C.Core): string {
  return expr.prettyPrint();
}