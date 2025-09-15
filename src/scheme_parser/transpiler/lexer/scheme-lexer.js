"use strict";
// Thanks to Ken Jin (py-slang) for the great resource
// https://craftinginterpreters.com/scanning.html
// This tokenizer/lexer is a modified version, inspired by both the
// tokenizer/lexer above as well as Ken Jin's py-slang tokenizer/lexer.
// It has been adapted to be written in typescript for scheme.
// Crafting Interpreters: https://craftinginterpreters.com/
// py-slang: https://github.com/source-academy/py-slang
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.SchemeLexer = void 0;
const core_math_1 = require("../../core-math");
const token_1 = require("../types/tokens/token");
const token_type_1 = require("../types/tokens/token-type");
const LexerError = __importStar(require("./lexer-error"));
// syntactic keywords in the scheme language
let keywords = new Map([
    [".", token_type_1.TokenType.DOT],
    ["if", token_type_1.TokenType.IF],
    ["let", token_type_1.TokenType.LET],
    ["cond", token_type_1.TokenType.COND],
    ["else", token_type_1.TokenType.ELSE],
    ["set!", token_type_1.TokenType.SET],
    ["begin", token_type_1.TokenType.BEGIN],
    ["delay", token_type_1.TokenType.DELAY],
    ["quote", token_type_1.TokenType.QUOTE],
    ["export", token_type_1.TokenType.EXPORT],
    ["import", token_type_1.TokenType.IMPORT],
    ["define", token_type_1.TokenType.DEFINE],
    ["lambda", token_type_1.TokenType.LAMBDA],
    ["define-syntax", token_type_1.TokenType.DEFINE_SYNTAX],
    ["syntax-rules", token_type_1.TokenType.SYNTAX_RULES],
]);
class SchemeLexer {
    constructor(source) {
        this.start = 0;
        this.current = 0;
        this.line = 1;
        this.col = 0;
        this.source = source;
        this.tokens = [];
    }
    isAtEnd() {
        return this.current >= this.source.length;
    }
    advance() {
        // get the next character
        this.col++;
        return this.source.charAt(this.current++);
    }
    jump() {
        // when you want to ignore a character
        this.start = this.current;
        this.col++;
        this.current++;
    }
    addToken(type, literal = null) {
        const text = this.source.substring(this.start, this.current);
        this.tokens.push(new token_1.Token(type, text, literal, this.start, this.current, this.line, this.col));
    }
    scanTokens() {
        while (!this.isAtEnd()) {
            this.start = this.current;
            this.scanToken();
        }
        this.tokens.push(new token_1.Token(token_type_1.TokenType.EOF, "", null, this.start, this.current, this.line, this.col));
        return this.tokens;
    }
    scanToken() {
        const c = this.advance();
        switch (c) {
            case "(":
                this.addToken(token_type_1.TokenType.LEFT_PAREN);
                break;
            case ")":
                this.addToken(token_type_1.TokenType.RIGHT_PAREN);
                break;
            case "[":
                this.addToken(token_type_1.TokenType.LEFT_BRACKET);
                break;
            case "]":
                this.addToken(token_type_1.TokenType.RIGHT_BRACKET);
                break;
            case "'":
                this.addToken(token_type_1.TokenType.APOSTROPHE);
                break;
            case "`":
                this.addToken(token_type_1.TokenType.BACKTICK);
                break;
            case ",":
                if (this.match("@")) {
                    this.addToken(token_type_1.TokenType.COMMA_AT);
                    break;
                }
                this.addToken(token_type_1.TokenType.COMMA);
                break;
            case "#":
                // by itself, it is an error
                if (this.match("t") || this.match("f")) {
                    this.booleanToken();
                }
                else if (this.match("|")) {
                    // a multiline comment
                    this.comment();
                }
                else if (this.match(";")) {
                    // a datum comment
                    this.addToken(token_type_1.TokenType.HASH_SEMICOLON);
                }
                else if (this.peek() === "(" || this.peek() === "[") {
                    // We keep the hash character and the parenthesis/bracket
                    // separate as our parentheses matching systems
                    // will suffer with 4 possible left grouping tokens!
                    // ensure that the next character is a vector
                    this.addToken(token_type_1.TokenType.HASH_VECTOR);
                }
                else {
                    // chars are not currently supported
                    throw new LexerError.UnexpectedCharacterError(this.line, this.col, c);
                }
                break;
            case ";":
                // a comment
                while (this.peek() != "\n" && !this.isAtEnd())
                    this.advance();
                break;
            // double character tokens not currently needed
            case " ":
            case "\r":
            case "\t":
                // ignore whitespace
                break;
            case "\n":
                this.line++;
                this.col = 0;
                break;
            case '"':
                this.stringToken();
                break;
            case "|":
                this.identifierTokenLoose();
                break;
            default:
                // Deviates slightly from the original lexer.
                // Scheme allows for identifiers to start with a digit
                // or include a specific set of symbols.
                if (this.isDigit(c) ||
                    c === "-" ||
                    c === "+" ||
                    c === "." ||
                    c === "i" || // inf
                    c === "n" // nan
                ) {
                    // may or may not be a number
                    this.identifierNumberToken();
                }
                else if (this.isValidIdentifier(c)) {
                    // filtered out the potential numbers
                    // these are definitely identifiers
                    this.identifierToken();
                }
                else {
                    throw new LexerError.UnexpectedCharacterError(this.line, this.col, c);
                }
                break;
        }
    }
    comment() {
        while (!(this.peek() == "|" && this.peekNext() == "#") && !this.isAtEnd()) {
            if (this.peek() === "\n") {
                this.line++;
                this.col = 0;
            }
            this.advance();
        }
        if (this.isAtEnd()) {
            throw new LexerError.UnexpectedEOFError(this.line, this.col);
        }
        this.jump();
        this.jump();
    }
    identifierToken() {
        while (this.isValidIdentifier(this.peek()))
            this.advance();
        this.addToken(this.checkKeyword());
    }
    identifierTokenLoose() {
        // this is a special case for identifiers
        // add the first |
        this.advance();
        while (this.peek() != "|" && !this.isAtEnd()) {
            if (this.peek() === "\n") {
                this.line++;
                this.col = 0;
            }
            this.advance();
        }
        if (this.isAtEnd()) {
            throw new LexerError.UnexpectedEOFError(this.line, this.col);
        }
        // add the last |
        this.advance();
        this.addToken(this.checkKeyword());
    }
    identifierNumberToken() {
        // we first obtain the entire identifier
        while (this.isValidIdentifier(this.peek())) {
            this.advance();
        }
        const lexeme = this.source.substring(this.start, this.current);
        if ((0, core_math_1.stringIsSchemeNumber)(lexeme)) {
            this.addToken(token_type_1.TokenType.NUMBER, lexeme);
            return;
        }
        this.addToken(this.checkKeyword());
    }
    checkKeyword() {
        var text = this.source.substring(this.start, this.current);
        if (keywords.has(text)) {
            return keywords.get(text);
        }
        return token_type_1.TokenType.IDENTIFIER;
    }
    stringToken() {
        while (this.peek() != '"' && !this.isAtEnd()) {
            if (this.peek() === "\n") {
                this.line++;
                this.col = 0;
            }
            this.advance();
        }
        if (this.isAtEnd()) {
            throw new LexerError.UnexpectedEOFError(this.line, this.col);
        }
        // closing "
        this.advance();
        // trim the surrounding quotes
        const value = this.source.substring(this.start + 1, this.current - 1);
        this.addToken(token_type_1.TokenType.STRING, value);
    }
    booleanToken() {
        this.addToken(token_type_1.TokenType.BOOLEAN, this.peekPrev() === "t" ? true : false);
    }
    match(expected) {
        if (this.isAtEnd())
            return false;
        if (this.source.charAt(this.current) != expected)
            return false;
        this.current++;
        return true;
    }
    peek() {
        if (this.isAtEnd())
            return "\0";
        return this.source.charAt(this.current);
    }
    peekNext() {
        if (this.current + 1 >= this.source.length)
            return "\0";
        return this.source.charAt(this.current + 1);
    }
    peekPrev() {
        if (this.current - 1 < 0)
            return "\0";
        return this.source.charAt(this.current - 1);
    }
    isDigit(c) {
        return c >= "0" && c <= "9";
    }
    isSpecialSyntax(c) {
        return (c === "(" || c === ")" || c === "[" || c === "]" || c === ";" || c === "|");
    }
    isValidIdentifier(c) {
        return !this.isWhitespace(c) && !this.isSpecialSyntax(c);
    }
    isWhitespace(c) {
        return c === " " || c === "\0" || c === "\n" || c === "\r" || c === "\t";
    }
}
exports.SchemeLexer = SchemeLexer;
//# sourceMappingURL=scheme-lexer.js.map