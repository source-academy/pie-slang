"use strict";
/**
 * A data structure representing a particular token.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.Token = void 0;
const location_1 = require("../location");
const _1 = require(".");
class Token {
    constructor(type, lexeme, literal, start, end, line, col) {
        this.type = type;
        this.lexeme = lexeme;
        this.literal = literal;
        this.start = start;
        this.end = end;
        this.pos = new location_1.Position(line, col);
        this.endPos = new location_1.Position(line, col + lexeme.length - 1);
    }
    /**
     * Converts a token to another representation of itself.
     * Especially useful for quotation tokens.
     * @returns A converted token.
     */
    convertToken() {
        switch (this.type) {
            case _1.TokenType.APOSTROPHE:
                return new Token(_1.TokenType.QUOTE, this.lexeme, this.literal, this.start, this.end, this.pos.line, this.pos.column);
            case _1.TokenType.BACKTICK:
                return new Token(_1.TokenType.QUASIQUOTE, this.lexeme, this.literal, this.start, this.end, this.pos.line, this.pos.column);
            case _1.TokenType.HASH_VECTOR:
                return new Token(_1.TokenType.VECTOR, this.lexeme, this.literal, this.start, this.end, this.pos.line, this.pos.column);
            case _1.TokenType.COMMA:
                return new Token(_1.TokenType.UNQUOTE, this.lexeme, this.literal, this.start, this.end, this.pos.line, this.pos.column);
            case _1.TokenType.COMMA_AT:
                return new Token(_1.TokenType.UNQUOTE_SPLICING, this.lexeme, this.literal, this.start, this.end, this.pos.line, this.pos.column);
            default:
                return this;
        }
    }
    /**
     * For debugging.
     * @returns A string representation of the token.
     */
    toString() {
        return `${this.lexeme}`;
    }
}
exports.Token = Token;
//# sourceMappingURL=token.js.map