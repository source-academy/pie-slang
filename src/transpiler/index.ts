/**
 * The main entry point of the scheme transpiler.
 */

import { SchemeLexer } from "./lexer";
import { SchemeParser } from "./parser";
import { Atomic, Expression, Extended } from "./types/nodes/scheme-node-types";
import { Program } from "estree";

import { Simplifier, Transpiler, Redefiner } from "./visitors";
import { estreeEncode } from "..";
import { MACRO_CHAPTER } from "./types/constants";

export { LexerError } from "./lexer";
export { ParserError } from "./parser";

/**
 * wrap an s-expression in an eval call.
 */
function wrapInEval(body: Expression): Expression {
  const evalObj = new Atomic.Identifier(body.location, "eval");
  return new Atomic.Application(body.location, evalObj, [body]);
}

/**
 * wrap an s-expression in a begin statement.
 * since we want an s-expression as return,
 * begin is represented as a list of expressions starting with "begin".
 */
function wrapInBegin(expressions: Expression[]): Expression {
  // use the total location of the first and last expressions
  const dummyloc = expressions[0].location.merge(
    expressions[expressions.length - 1].location
  );
  const begin = new Atomic.Symbol(dummyloc, "begin");
  return new Extended.List(dummyloc, [begin, ...expressions]);
}

/**
 * Transpiles Scheme source code into an ESTree program.
 * @param source The Scheme source code
 * @param chapter The chapter of the Scheme language.
 *                If not provided, defaults to the latest version.
 * @returns
 */
export function schemeParse(
  source: string,
  chapter: number = Infinity,
  encode?: boolean
): Program {
  // Instantiate the lexer
  const lexer = new SchemeLexer(source);

  // Generate tokens
  const tokens = lexer.scanTokens();

  // Instantiate the parser
  const parser = new SchemeParser(source, tokens, chapter);

  // The Scheme AST is represented as an
  // array of expressions, which is all top-level expressions

  let finalAST: Expression[];

  // Generate the first AST
  const firstAST: Expression[] = parser.parse();

  // We instantiate all the visitors
  const simplifier = Simplifier.create();
  const redefiner = Redefiner.create();
  const transpiler = Transpiler.create();

  if (chapter < MACRO_CHAPTER) {
    // Then we simplify the AST
    const simplifiedAST: Expression[] = simplifier.simplify(firstAST);

    // Then we redefine the AST
    const redefinedAST: Expression[] = redefiner.redefine(simplifiedAST);

    finalAST = redefinedAST;
  } else {
    // Then we prepare the AST for evaluation within the CSET machine.
    // Take the imports from the AST
    const macroASTImports: Expression[] = firstAST.filter(
      e => e instanceof Atomic.Import
    );
    const macroASTRest: Expression[] = firstAST.filter(
      e => !(e instanceof Atomic.Import)
    );

    // On the rest elements,
    // 1. If empty, do nothing
    // 2. If 1 element, wrap in eval call
    // 3. If more than one element, sequence as one begin statement, then wrap in eval call
    const macroASTformattedRest: Expression[] =
      macroASTRest.length === 0
        ? []
        : macroASTRest.length === 1
          ? [wrapInEval(macroASTRest[0])]
          : [wrapInEval(wrapInBegin(macroASTRest))];

    // Concatenate the imports and the rest
    finalAST = [...macroASTImports, ...macroASTformattedRest];
  }

  // Finally we transpile the AST
  const program: Program = transpiler.transpile(finalAST);

  return encode ? (estreeEncode(program) as Program) : program;
}
