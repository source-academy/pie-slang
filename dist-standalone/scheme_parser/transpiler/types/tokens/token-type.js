"use strict";
// Adapted from https://craftinginterpreters.com/scanning.html
// Adapted for Scheme use
Object.defineProperty(exports, "__esModule", { value: true });
exports.TokenType = void 0;
var TokenType;
(function (TokenType) {
    // + - * / % ^ ! = < > & | ~ etc are recognized as IDENTIFIERS
    // S-expression syntax
    TokenType[TokenType["LEFT_PAREN"] = 0] = "LEFT_PAREN";
    TokenType[TokenType["RIGHT_PAREN"] = 1] = "RIGHT_PAREN";
    TokenType[TokenType["LEFT_BRACKET"] = 2] = "LEFT_BRACKET";
    TokenType[TokenType["RIGHT_BRACKET"] = 3] = "RIGHT_BRACKET";
    TokenType[TokenType["DOT"] = 4] = "DOT";
    // Datum comments
    TokenType[TokenType["HASH_SEMICOLON"] = 5] = "HASH_SEMICOLON";
    // Atoms: Literals or Identifiers
    TokenType[TokenType["IDENTIFIER"] = 6] = "IDENTIFIER";
    TokenType[TokenType["NUMBER"] = 7] = "NUMBER";
    TokenType[TokenType["BOOLEAN"] = 8] = "BOOLEAN";
    TokenType[TokenType["STRING"] = 9] = "STRING";
    // SICP Chapter 1
    TokenType[TokenType["IF"] = 10] = "IF";
    TokenType[TokenType["LET"] = 11] = "LET";
    TokenType[TokenType["COND"] = 12] = "COND";
    TokenType[TokenType["ELSE"] = 13] = "ELSE";
    TokenType[TokenType["DEFINE"] = 14] = "DEFINE";
    TokenType[TokenType["LAMBDA"] = 15] = "LAMBDA";
    // SICP Chapter 2
    TokenType[TokenType["APOSTROPHE"] = 16] = "APOSTROPHE";
    TokenType[TokenType["BACKTICK"] = 17] = "BACKTICK";
    TokenType[TokenType["COMMA"] = 18] = "COMMA";
    TokenType[TokenType["COMMA_AT"] = 19] = "COMMA_AT";
    TokenType[TokenType["QUOTE"] = 20] = "QUOTE";
    TokenType[TokenType["QUASIQUOTE"] = 21] = "QUASIQUOTE";
    TokenType[TokenType["UNQUOTE"] = 22] = "UNQUOTE";
    TokenType[TokenType["UNQUOTE_SPLICING"] = 23] = "UNQUOTE_SPLICING";
    // SICP Chapter 3
    TokenType[TokenType["SET"] = 24] = "SET";
    TokenType[TokenType["BEGIN"] = 25] = "BEGIN";
    TokenType[TokenType["DELAY"] = 26] = "DELAY";
    // Other important keywords
    TokenType[TokenType["IMPORT"] = 27] = "IMPORT";
    TokenType[TokenType["EXPORT"] = 28] = "EXPORT";
    // keywords associated with macros
    TokenType[TokenType["DEFINE_SYNTAX"] = 29] = "DEFINE_SYNTAX";
    TokenType[TokenType["SYNTAX_RULES"] = 30] = "SYNTAX_RULES";
    // Not in scope at the moment
    TokenType[TokenType["HASH_VECTOR"] = 31] = "HASH_VECTOR";
    TokenType[TokenType["VECTOR"] = 32] = "VECTOR";
    // turning vector into a procedure call is better
    TokenType[TokenType["EOF"] = 33] = "EOF";
})(TokenType || (exports.TokenType = TokenType = {}));
//# sourceMappingURL=token-type.js.map