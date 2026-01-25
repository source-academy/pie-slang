import { Position } from "../types/location";
export declare abstract class LexerError extends SyntaxError {
    loc: Position;
    constructor(message: string, line: number, col: number);
    toString(): string;
}
export declare class UnexpectedCharacterError extends LexerError {
    char: string;
    constructor(line: number, col: number, char: string);
}
export declare class UnexpectedEOFError extends LexerError {
    constructor(line: number, col: number);
}
//# sourceMappingURL=lexer-error.d.ts.map