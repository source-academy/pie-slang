/**
 * A data structure representing a particular token.
 */
import { Position } from "../location";
import { TokenType } from ".";
export declare class Token {
    type: TokenType;
    lexeme: string;
    literal: any;
    start: number;
    end: number;
    pos: Position;
    endPos: Position;
    constructor(type: TokenType, lexeme: any, literal: any, start: number, end: number, line: number, col: number);
    /**
     * Converts a token to another representation of itself.
     * Especially useful for quotation tokens.
     * @returns A converted token.
     */
    convertToken(): Token;
    /**
     * For debugging.
     * @returns A string representation of the token.
     */
    toString(): string;
}
//# sourceMappingURL=token.d.ts.map