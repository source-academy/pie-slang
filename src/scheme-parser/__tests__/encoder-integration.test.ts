import type { Identifier, Literal, Program } from "estree";
import { generate } from "escodegen";
import { Script, runInNewContext } from "node:vm";
import {
  decode, encode, estreeDecode, estreeEncode, LexerError, ParserError,
  schemeParse, unparse,
} from "..";
import { encode as leafEncode, decode as leafDecode } from "../utils/identifier-encoding";
import { estreeEncode as visitEncode, estreeDecode as visitDecode } from "../utils/encoder-visitor";
import { schemeParse as transpile, LexerError as lexerErrors, ParserError as parserErrors } from "../transpiler";
import { unparse as reverseParse } from "../utils/reverse_parser";

test("the public entry re-exports the historical API without replacement wrappers", () => {
  expect(encode).toBe(leafEncode);
  expect(decode).toBe(leafDecode);
  expect(estreeEncode).toBe(visitEncode);
  expect(estreeDecode).toBe(visitDecode);
  expect(schemeParse).toBe(transpile);
  expect(unparse).toBe(reverseParse);
  expect(LexerError).toBe(lexerErrors);
  expect(ParserError).toBe(parserErrors);
});

test.each(["null?", "$45$", "$scheme_aWY$61$"])(
  "AST traversal handles shared identifier %s once and leaves literal data alone",
  name => {
    const shared: Identifier = { type: "Identifier", name };
    const literal: Literal = { type: "Literal", value: "null?", raw: '"null?"' };
    const ast: Program = {
      type: "Program",
      sourceType: "script",
      body: [{
        type: "ExpressionStatement",
        expression: {
          type: "CallExpression", callee: shared, arguments: [literal, shared], optional: false,
        },
      }],
    };
    // Separate visits with a literal: Acorn itself skips adjacent repeated nodes.
    // Names that resemble escapes also detect accidental double-decoding.
    const original = JSON.stringify(ast);
    expect(estreeEncode(ast)).toBe(ast);
    expect(shared.name).toBe(encode(name));
    expect(shared).not.toHaveProperty("encoded", true);
    expect(literal.value).toBe("null?");
    expect(literal.raw).toBe('"null?"');
    expect(estreeDecode(ast)).toBe(ast);
    expect(shared.name).toBe(name);
    expect(shared).not.toHaveProperty("decoded", true);
    expect(JSON.stringify(ast)).toBe(original);
    // Flags must not block another separate encode/decode cycle.
    estreeEncode(ast);
    expect(shared.name).toBe(encode(name));
    estreeDecode(ast);
    expect(JSON.stringify(ast)).toBe(original);
  }
);

test.each(["is-empty?", "make-splice", "class", "eval", "$scheme_x", "变量"])(
  "encoded declarations and references execute consistently for %s",
  name => {
    const source = `(define (${name} x) x) (${name} #t)`;
    const program = schemeParse(source, 1, true);
    const javascript = generate(program);
    expect(javascript).toContain(encode(name));
    // These identity functions need no external Scheme runtime or mocks.
    expect(runInNewContext(`"use strict";\n${javascript}`)).toBe(true);
    const raw = schemeParse(source, 1, false);
    expect(unparse(estreeDecode(program))).toBe(unparse(raw));
  }
);

test("the encoding flag remains opt-in and does not encode string literals", () => {
  const source = '(define (keep? x) x) (keep? "class $scheme_x null?")';
  const raw = schemeParse(source, 1);
  expect(unparse(raw)).toContain("keep?");
  expect(raw).toEqual(schemeParse(source, 1, false));
  const encoded = schemeParse(source, 1, true);
  expect(generate(encoded)).toContain("keep$63$");
  expect(runInNewContext(generate(encoded))).toBe("class $scheme_x null?");
  expect(unparse(raw)).toContain("keep?");
});

test.each(["`(,@xs)", "`(,@(append xs ys))", "`((a ,@xs) ,@ys)"])(
  "quasiquote with splice reaches syntactically valid JavaScript: %s",
  source => {
    const javascript = generate(schemeParse(source, 2, true));
    expect(javascript).toContain("make$45$splice");
    // Syntax check only: list/splice evaluation needs the separate Scheme runtime.
    expect(() => new Script(javascript)).not.toThrow();
  }
);

test("the default macro route encodes eval and still generates valid JavaScript", () => {
  const javascript = generate(schemeParse("#t", undefined, true));
  expect(javascript).toContain("$scheme_ZXZhbA$61$$61$");
  expect(() => new Script(javascript)).not.toThrow();
});

test("the public entry preserves lexer and parser error identities", () => {
  expect(() => schemeParse('"unterminated', 1, true)).toThrow(LexerError.UnexpectedEOFError);
  expect(() => schemeParse("(lambda ((x)) x)", 1, true)).toThrow(ParserError.ExpectedFormError);
});
