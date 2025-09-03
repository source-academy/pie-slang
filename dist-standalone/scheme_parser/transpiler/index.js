"use strict";
/**
 * The main entry point of the scheme transpiler.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.ParserError = exports.LexerError = void 0;
exports.schemeParse = schemeParse;
const lexer_1 = require("./lexer");
const parser_1 = require("./parser");
const scheme_node_types_1 = require("./types/nodes/scheme-node-types");
const visitors_1 = require("./visitors");
const __1 = require("..");
const constants_1 = require("./types/constants");
var lexer_2 = require("./lexer");
Object.defineProperty(exports, "LexerError", { enumerable: true, get: function () { return lexer_2.LexerError; } });
var parser_2 = require("./parser");
Object.defineProperty(exports, "ParserError", { enumerable: true, get: function () { return parser_2.ParserError; } });
/**
 * wrap an s-expression in an eval call.
 */
function wrapInEval(body) {
    const evalObj = new scheme_node_types_1.Atomic.Identifier(body.location, "eval");
    return new scheme_node_types_1.Atomic.Application(body.location, evalObj, [body]);
}
/**
 * wrap an s-expression in a begin statement.
 * since we want an s-expression as return,
 * begin is represented as a list of expressions starting with "begin".
 */
function wrapInBegin(expressions) {
    // use the total location of the first and last expressions
    const dummyloc = expressions[0].location.merge(expressions[expressions.length - 1].location);
    const begin = new scheme_node_types_1.Atomic.Symbol(dummyloc, "begin");
    return new scheme_node_types_1.Extended.List(dummyloc, [begin, ...expressions]);
}
/**
 * Transpiles Scheme source code into an ESTree program.
 * @param source The Scheme source code
 * @param chapter The chapter of the Scheme language.
 *                If not provided, defaults to the latest version.
 * @returns
 */
function schemeParse(source, chapter = Infinity, encode) {
    // Instantiate the lexer
    const lexer = new lexer_1.SchemeLexer(source);
    // Generate tokens
    const tokens = lexer.scanTokens();
    // Instantiate the parser
    const parser = new parser_1.SchemeParser(source, tokens, chapter);
    // The Scheme AST is represented as an
    // array of expressions, which is all top-level expressions
    let finalAST;
    // Generate the first AST
    const firstAST = parser.parse();
    // We instantiate all the visitors
    const simplifier = visitors_1.Simplifier.create();
    const redefiner = visitors_1.Redefiner.create();
    const transpiler = visitors_1.Transpiler.create();
    if (chapter < constants_1.MACRO_CHAPTER) {
        // Then we simplify the AST
        const simplifiedAST = simplifier.simplify(firstAST);
        // Then we redefine the AST
        const redefinedAST = redefiner.redefine(simplifiedAST);
        finalAST = redefinedAST;
    }
    else {
        // Then we prepare the AST for evaluation within the CSET machine.
        // Take the imports from the AST
        const macroASTImports = firstAST.filter(e => e instanceof scheme_node_types_1.Atomic.Import);
        const macroASTRest = firstAST.filter(e => !(e instanceof scheme_node_types_1.Atomic.Import));
        // On the rest elements,
        // 1. If empty, do nothing
        // 2. If 1 element, wrap in eval call
        // 3. If more than one element, sequence as one begin statement, then wrap in eval call
        const macroASTformattedRest = macroASTRest.length === 0
            ? []
            : macroASTRest.length === 1
                ? [wrapInEval(macroASTRest[0])]
                : [wrapInEval(wrapInBegin(macroASTRest))];
        // Concatenate the imports and the rest
        finalAST = [...macroASTImports, ...macroASTformattedRest];
    }
    // Finally we transpile the AST
    const program = transpiler.transpile(finalAST);
    return encode ? (0, __1.estreeEncode)(program) : program;
}
//# sourceMappingURL=index.js.map