"use strict";
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
var __exportStar = (this && this.__exportStar) || function(m, exports) {
    for (var p in m) if (p !== "default" && !Object.prototype.hasOwnProperty.call(exports, p)) __createBinding(exports, m, p);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.schemeParse = exports.ParserError = exports.LexerError = exports.unparse = void 0;
exports.encode = encode;
exports.decode = decode;
const js_base64_1 = require("js-base64");
__exportStar(require("./utils/encoder-visitor"), exports);
var reverse_parser_1 = require("./utils/reverse_parser");
Object.defineProperty(exports, "unparse", { enumerable: true, get: function () { return reverse_parser_1.unparse; } });
var transpiler_1 = require("./transpiler");
Object.defineProperty(exports, "LexerError", { enumerable: true, get: function () { return transpiler_1.LexerError; } });
var transpiler_2 = require("./transpiler");
Object.defineProperty(exports, "ParserError", { enumerable: true, get: function () { return transpiler_2.ParserError; } });
var transpiler_3 = require("./transpiler");
Object.defineProperty(exports, "schemeParse", { enumerable: true, get: function () { return transpiler_3.schemeParse; } });
const JS_KEYWORDS = [
    "break",
    "case",
    "catch",
    "class",
    "const",
    "continue",
    "debugger",
    "default",
    "delete",
    "do",
    "else",
    "eval",
    "export",
    "extends",
    "false",
    "finally",
    "for",
    "function",
    "if",
    "import",
    "in",
    "instanceof",
    "new",
    "return",
    "super",
    "switch",
    "this",
    "throw",
    "true",
    "try",
    "typeof",
    "var",
    "void",
    "while",
    "with",
    "yield",
    "enum",
    "await",
    "implements",
    "package",
    "protected",
    "static",
    "interface",
    "private",
    "public",
];
/**
 * Takes a Scheme identifier and encodes it to follow JS naming conventions.
 *
 * @param identifier An identifier name.
 * @returns An encoded identifier that follows JS naming conventions.
 */
function encode(identifier) {
    if (JS_KEYWORDS.includes(identifier) || identifier.startsWith("$scheme_")) {
        return ("$scheme_" +
            (0, js_base64_1.encode)(identifier).replace(/([^a-zA-Z0-9_])/g, (match) => `\$${match.charCodeAt(0)}\$`));
    }
    else {
        return identifier.replace(/([^a-zA-Z0-9_])/g, (match) => `\$${match.charCodeAt(0)}\$`);
    }
}
/**
 * Takes a JS identifier and decodes it to follow Scheme naming conventions.
 *
 * @param identifier An encoded identifier name.
 * @returns A decoded identifier that follows Scheme naming conventions.
 */
function decode(identifier) {
    if (identifier.startsWith("$scheme_")) {
        return (0, js_base64_1.decode)(identifier
            .slice(8)
            .replace(/\$([0-9]+)\$/g, (_, code) => String.fromCharCode(parseInt(code))));
    }
    else {
        return identifier.replace(/\$([0-9]+)\$/g, (_, code) => String.fromCharCode(parseInt(code)));
    }
}
//# sourceMappingURL=index.js.map