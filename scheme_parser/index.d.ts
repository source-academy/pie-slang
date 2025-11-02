export * from "./utils/encoder-visitor";
export { unparse } from "./utils/reverse_parser";
export { LexerError } from "./transpiler";
export { ParserError } from "./transpiler";
export { schemeParse } from "./transpiler";
/**
 * Takes a Scheme identifier and encodes it to follow JS naming conventions.
 *
 * @param identifier An identifier name.
 * @returns An encoded identifier that follows JS naming conventions.
 */
export declare function encode(identifier: string): string;
/**
 * Takes a JS identifier and decodes it to follow Scheme naming conventions.
 *
 * @param identifier An encoded identifier name.
 * @returns A decoded identifier that follows Scheme naming conventions.
 */
export declare function decode(identifier: string): string;
//# sourceMappingURL=index.d.ts.map