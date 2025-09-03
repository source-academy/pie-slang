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
exports.UnsupportedTokenError = exports.DisallowedTokenError = exports.MissingFormError = exports.ExpectedFormError = exports.UnexpectedFormError = exports.UnexpectedEOFError = exports.ParenthesisMismatchError = exports.GenericSyntaxError = exports.ParserError = void 0;
function extractLine(source, pos) {
    var lines = source.split("\n");
    return lines[pos.line - 1];
}
function showPoint(pos) {
    return "^".padStart(pos.column, " ");
}
var ParserError = /** @class */ (function (_super) {
    __extends(ParserError, _super);
    function ParserError(message, pos) {
        var _this = _super.call(this, "Syntax error at (".concat(pos.line, ":").concat(pos.column, ")\n").concat(message)) || this;
        _this.loc = pos;
        return _this;
    }
    ParserError.prototype.toString = function () {
        return this.message;
    };
    return ParserError;
}(SyntaxError));
exports.ParserError = ParserError;
var GenericSyntaxError = /** @class */ (function (_super) {
    __extends(GenericSyntaxError, _super);
    function GenericSyntaxError(source, pos) {
        var _this = _super.call(this, extractLine(source, pos) + "\n" + showPoint(pos), pos) || this;
        _this.name = "GenericSyntaxError";
        return _this;
    }
    return GenericSyntaxError;
}(ParserError));
exports.GenericSyntaxError = GenericSyntaxError;
var ParenthesisMismatchError = /** @class */ (function (_super) {
    __extends(ParenthesisMismatchError, _super);
    function ParenthesisMismatchError(source, pos) {
        var _this = _super.call(this, extractLine(source, pos) +
            "\n" +
            showPoint(pos) +
            "\n" +
            "Mismatched parenthesis", pos) || this;
        _this.name = "ParenthesisMismatchError";
        return _this;
    }
    return ParenthesisMismatchError;
}(ParserError));
exports.ParenthesisMismatchError = ParenthesisMismatchError;
var UnexpectedEOFError = /** @class */ (function (_super) {
    __extends(UnexpectedEOFError, _super);
    function UnexpectedEOFError(source, pos) {
        var _this = _super.call(this, extractLine(source, pos) + "\n" + "Unexpected EOF", pos) || this;
        _this.name = "UnexpectedEOFError";
        return _this;
    }
    return UnexpectedEOFError;
}(ParserError));
exports.UnexpectedEOFError = UnexpectedEOFError;
var UnexpectedFormError = /** @class */ (function (_super) {
    __extends(UnexpectedFormError, _super);
    function UnexpectedFormError(source, pos, form) {
        var _this = _super.call(this, extractLine(source, pos) +
            "\n" +
            showPoint(pos) +
            "\n" +
            "Unexpected '".concat(form, "'"), pos) || this;
        _this.form = form;
        _this.name = "UnexpectedTokenError";
        return _this;
    }
    return UnexpectedFormError;
}(ParserError));
exports.UnexpectedFormError = UnexpectedFormError;
var ExpectedFormError = /** @class */ (function (_super) {
    __extends(ExpectedFormError, _super);
    function ExpectedFormError(source, pos, form, expected) {
        var _this = _super.call(this, extractLine(source, pos) +
            "\n" +
            showPoint(pos) +
            "\n" +
            "Expected '".concat(expected, "' but got '").concat(form, "'"), pos) || this;
        _this.form = form;
        _this.expected = expected;
        _this.name = "ExpectedTokenError";
        return _this;
    }
    return ExpectedFormError;
}(ParserError));
exports.ExpectedFormError = ExpectedFormError;
var MissingFormError = /** @class */ (function (_super) {
    __extends(MissingFormError, _super);
    function MissingFormError(source, pos, expected) {
        var _this = _super.call(this, extractLine(source, pos) +
            "\n" +
            showPoint(pos) +
            "\n" +
            "Expected '".concat(expected, "'"), pos) || this;
        _this.expected = expected;
        _this.name = "MissingTokenError";
        return _this;
    }
    return MissingFormError;
}(ParserError));
exports.MissingFormError = MissingFormError;
var DisallowedTokenError = /** @class */ (function (_super) {
    __extends(DisallowedTokenError, _super);
    function DisallowedTokenError(source, pos, token, chapter) {
        var _this = _super.call(this, extractLine(source, pos) +
            "\n" +
            showPoint(pos) +
            "\n" +
            "Syntax '".concat(token, "' not allowed at Scheme \u00A7").concat(chapter), pos) || this;
        _this.token = token;
        _this.name = "DisallowedTokenError";
        return _this;
    }
    return DisallowedTokenError;
}(ParserError));
exports.DisallowedTokenError = DisallowedTokenError;
var UnsupportedTokenError = /** @class */ (function (_super) {
    __extends(UnsupportedTokenError, _super);
    function UnsupportedTokenError(source, pos, token) {
        var _this = _super.call(this, extractLine(source, pos) +
            "\n" +
            showPoint(pos) +
            "\n" +
            "Syntax '".concat(token, "' not supported yet"), pos) || this;
        _this.token = token;
        _this.name = "UnsupportedTokenError";
        return _this;
    }
    return UnsupportedTokenError;
}(ParserError));
exports.UnsupportedTokenError = UnsupportedTokenError;
