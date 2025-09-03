"use strict";
var __extends = (this && this.__extends) || (function () {
    var extendStatics = function (d, b) {
        extendStatics = Object.setPrototypeOf ||
            ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
            function (d, b) { for (var p in b) if (Object.prototype.hasOwnProperty.call(b, p)) d[p] = b[p]; };
        return extendStatics(d, b);
    };
    return function (d, b) {
        if (typeof b !== "function" && b !== null)
            throw new TypeError("Class extends value " + String(b) + " is not a constructor or null");
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.UnexpectedEOFError = exports.UnexpectedCharacterError = exports.LexerError = void 0;
var LexerError = /** @class */ (function (_super) {
    __extends(LexerError, _super);
    function LexerError(message, line, col) {
        var _this = _super.call(this, message) || this;
        _this.loc = {
            line: line,
            column: col,
        };
        return _this;
    }
    LexerError.prototype.toString = function () {
        return this.message;
    };
    return LexerError;
}(SyntaxError));
exports.LexerError = LexerError;
var UnexpectedCharacterError = /** @class */ (function (_super) {
    __extends(UnexpectedCharacterError, _super);
    function UnexpectedCharacterError(line, col, char) {
        var _this = _super.call(this, "Unexpected character '".concat(char, "' (").concat(line, ":").concat(col, ")"), line, col) || this;
        _this.char = char;
        _this.name = "UnexpectedCharacterError";
        return _this;
    }
    return UnexpectedCharacterError;
}(LexerError));
exports.UnexpectedCharacterError = UnexpectedCharacterError;
var UnexpectedEOFError = /** @class */ (function (_super) {
    __extends(UnexpectedEOFError, _super);
    function UnexpectedEOFError(line, col) {
        var _this = _super.call(this, "Unexpected EOF (".concat(line, ":").concat(col, ")"), line, col) || this;
        _this.name = "UnexpectedEOFError";
        return _this;
    }
    return UnexpectedEOFError;
}(LexerError));
exports.UnexpectedEOFError = UnexpectedEOFError;
