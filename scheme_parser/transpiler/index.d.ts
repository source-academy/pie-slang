/**
 * The main entry point of the scheme transpiler.
 */
import { Program } from "estree";
export { LexerError } from "./lexer";
export { ParserError } from "./parser";
/**
 * Transpiles Scheme source code into an ESTree program.
 * @param source The Scheme source code
 * @param chapter The chapter of the Scheme language.
 *                If not provided, defaults to the latest version.
 * @returns
 */
export declare function schemeParse(source: string, chapter?: number, encode?: boolean): Program;
//# sourceMappingURL=index.d.ts.map