/**
 * An interface for a lexer.
 *
 * Takes source code and returns tokens
 * that represent each unit of data
 * in the source code.
 */
import { Token } from "../types/tokens/token";

export interface Lexer {
  scanTokens(): Token[];
}
