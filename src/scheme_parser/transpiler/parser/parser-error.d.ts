import { Datum } from "../types/tokens/datum";
import { Token } from "../types/tokens/token";
import { Position } from "estree";
export declare abstract class ParserError extends SyntaxError {
    loc: Position;
    constructor(message: string, pos: Position);
    toString(): string;
}
export declare class GenericSyntaxError extends ParserError {
    constructor(source: string, pos: Position);
}
export declare class ParenthesisMismatchError extends ParserError {
    constructor(source: string, pos: Position);
}
export declare class UnexpectedEOFError extends ParserError {
    constructor(source: string, pos: Position);
}
export declare class UnexpectedFormError extends ParserError {
    form: Datum;
    constructor(source: string, pos: Position, form: Datum);
}
export declare class ExpectedFormError extends ParserError {
    form: Datum;
    expected: string;
    constructor(source: string, pos: Position, form: Datum, expected: string);
}
export declare class MissingFormError extends ParserError {
    expected: string;
    constructor(source: string, pos: Position, expected: string);
}
export declare class DisallowedTokenError extends ParserError {
    token: Token;
    constructor(source: string, pos: Position, token: Token, chapter: number);
}
export declare class UnsupportedTokenError extends ParserError {
    token: Token;
    constructor(source: string, pos: Position, token: Token);
}
//# sourceMappingURL=parser-error.d.ts.map