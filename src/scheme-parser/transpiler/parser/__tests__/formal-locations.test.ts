import { SchemeLexer } from "../../lexer/scheme-lexer";
import { SchemeParser } from "../scheme-parser";
import { ExpectedFormError } from "../parser-error";
import { Atomic, Extended } from "../../types/nodes/scheme-node-types";
import { Group } from "../../types/tokens/group";

function parse(source: string) {
  return new SchemeParser(source, new SchemeLexer(source).scanTokens(), 1).parse();
}

test.each([
  ["(lambda ((x)) x)", 1, 10],
  ["(define (f (x)) x)", 1, 12],
  ["(lambda ([x]) x)", 1, 10],
  ["(define (f [x]) x)", 1, 12],
  ["(lambda (((x))) x)", 1, 10],
  ["(define (f ((x))) x)", 1, 12],
  ["(lambda (()) x)", 1, 10],
  ["(lambda (x . (rest)) x)", 1, 14],
  ["(define (f x . (rest)) x)", 1, 16],
  ["(lambda (\n  (x)) x)", 2, 3],
  ["(define (f\n  (x)) x)", 2, 3],
] as const)("invalid grouped formal in %s has a usable diagnostic", (source, line, column) => {
  let caught: unknown;
  try {
    parse(source);
  } catch (error) {
    caught = error;
  }
  expect(caught).toBeInstanceOf(ExpectedFormError);
  expect(caught).not.toBeInstanceOf(TypeError);
  const error = caught as ExpectedFormError;
  expect(error.name).toBe("ExpectedTokenError");
  expect(error.expected).toBe("<identifier>");
  expect(error.form).toBeInstanceOf(Group);
  expect(error.loc).toEqual({ line, column });
  expect(error.loc).toEqual((error.form as Group).location.start);
  expect(error.message).toContain(`Syntax error at (${line}:${column})`);
  expect(error.message).toContain(source.split("\n")[line - 1]);
  expect(error.message).toContain("Expected '<identifier>'");
  expect(error.message).toContain(" ".repeat(column - 1) + "^");
});

test.each([
  "(lambda (1) 1)",
  "(define (f 1) 1)",
  '(lambda ("x") 1)',
])("non-identifier Token formals still get the existing syntax error: %s", source => {
  expect(() => parse(source)).toThrow(ExpectedFormError);
});

test.each([
  ["(lambda (x) x)", ["x"], undefined],
  ["(lambda (x y) x)", ["x", "y"], undefined],
  ["(lambda () 1)", [], undefined],
  ["(lambda args args)", [], "args"],
  ["(lambda (x . rest) x)", ["x"], "rest"],
  ["[lambda [x] x]", ["x"], undefined],
  ["(define (f x) x)", ["x"], undefined],
  ["(define (f) 1)", [], undefined],
  ["(define (f x . rest) x)", ["x"], "rest"],
] as const)("valid formals remain usable: %s", (source, names, rest) => {
  const nodes = parse(source);
  expect(nodes).toHaveLength(1);
  const [node] = nodes;
  if (!(node instanceof Atomic.Lambda || node instanceof Extended.FunctionDefinition)) {
    throw new Error("Expected a lambda or function definition");
  }
  expect(node.params.map(parameter => parameter.name)).toEqual(names);
  expect(node.rest?.name).toBe(rest);
});
