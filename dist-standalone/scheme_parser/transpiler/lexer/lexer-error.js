"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.UnexpectedEOFError = exports.UnexpectedCharacterError = exports.LexerError = void 0;
class LexerError extends SyntaxError {
    constructor(message, line, col) {
        super(message);
        this.loc = {
            line: line,
            column: col,
        };
    }
    toString() {
        return this.message;
    }
}
exports.LexerError = LexerError;
class UnexpectedCharacterError extends LexerError {
    constructor(line, col, char) {
        super(`Unexpected character \'${char}\' (${line}:${col})`, line, col);
        this.char = char;
        this.name = "UnexpectedCharacterError";
    }
}
exports.UnexpectedCharacterError = UnexpectedCharacterError;
class UnexpectedEOFError extends LexerError {
    constructor(line, col) {
        super(`Unexpected EOF (${line}:${col})`, line, col);
        this.name = "UnexpectedEOFError";
    }
}
exports.UnexpectedEOFError = UnexpectedEOFError;
//# sourceMappingURL=lexer-error.js.map