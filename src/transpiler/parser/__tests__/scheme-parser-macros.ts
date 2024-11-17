import { SchemeParser } from "../scheme-parser";
import { SchemeLexer } from "../../lexer";
import {
  Atomic,
  Extended,
  Expression,
} from "../../types/nodes/scheme-node-types";
import { Location, Position } from "../../types/location";

// Unfortunately, we are currently unable to test the parser in isolation from the
// lexer, as the parser depends on the lexer to generate tokens. Generating the tokens
// manually would be a lot of work and would duplicate the lexer logic.
// As a result, we will have to test the parser in conjunction with the lexer.
// We will avoid testing the more advanced features of the lexer here.

const dummyLocation = new Location(new Position(0, 0), new Position(0, 0));

// helper functions that will make creation of nodes a lot easier
function numericLiteral(value: string) {
  return new Atomic.NumericLiteral(dummyLocation, value);
}

function booleanLiteral(value: boolean) {
  return new Atomic.BooleanLiteral(dummyLocation, value);
}

function stringLiteral(value: string) {
  return new Atomic.StringLiteral(dummyLocation, value);
}

function identifier(value: string) {
  return new Atomic.Identifier(dummyLocation, value);
}

function lambda(
  body: Expression,
  params: Atomic.Identifier[],
  rest?: Atomic.Identifier
) {
  return new Atomic.Lambda(dummyLocation, body, params, rest);
}

function sequence(...expressions: Expression[]) {
  return new Atomic.Sequence(dummyLocation, expressions);
}

function definition(name: Atomic.Identifier, value: Expression) {
  return new Atomic.Definition(dummyLocation, name, value);
}

function functionDefinition(
  name: Atomic.Identifier,
  body: Expression,
  params: Atomic.Identifier[],
  rest?: Atomic.Identifier
) {
  return new Extended.FunctionDefinition(
    dummyLocation,
    name,
    body,
    params,
    rest
  );
}

function application(operator: Expression, operands: Expression[]) {
  return new Atomic.Application(dummyLocation, operator, operands);
}

function conditional(
  test: Expression,
  consequent: Expression,
  alternate?: Expression
) {
  return new Atomic.Conditional(
    dummyLocation,
    test,
    consequent,
    alternate ? alternate : identifier("undefined")
  );
}

function symbol(value: string) {
  return new Atomic.Symbol(dummyLocation, value);
}

function vector(...elements: Expression[]) {
  return new Atomic.Vector(dummyLocation, elements);
}

function list(...elements: Expression[]) {
  return new Extended.List(dummyLocation, elements);
}

function dottedList(elements: Expression[], rest: Expression) {
  return new Extended.List(dummyLocation, elements, rest);
}

function nil() {
  return new Atomic.Nil(dummyLocation);
}

function reassignment(name: Atomic.Identifier, value: Expression) {
  return new Atomic.Reassignment(dummyLocation, name, value);
}

function importNode(from: Atomic.StringLiteral, imports: Atomic.Identifier[]) {
  return new Atomic.Import(dummyLocation, from, imports);
}

function exportNode(
  definition: Atomic.Definition | Extended.FunctionDefinition
) {
  return new Atomic.Export(dummyLocation, definition);
}

function letNode(
  identifiers: Atomic.Identifier[],
  values: Expression[],
  body: Expression
) {
  return new Extended.Let(dummyLocation, identifiers, values, body);
}

function cond(
  predicates: Expression[],
  consequents: Expression[],
  elseClause?: Expression
) {
  return new Extended.Cond(dummyLocation, predicates, consequents, elseClause);
}

function begin(...expressions: Expression[]) {
  return new Extended.Begin(dummyLocation, expressions);
}

function delay(body: Expression) {
  return new Extended.Delay(dummyLocation, body);
}

// helper functions to help make testing the parser easier
function parse(input: string, chapter: number = Infinity): Expression[] {
  const lexer = new SchemeLexer(input);
  const parser = new SchemeParser(input, lexer.scanTokens(), chapter);
  return parser.parse();
}

function parseFirst(input: string, chapter: number = Infinity): Expression {
  return parse(input, chapter)[0];
}

test("parsing empty program returns nothing", () => {
  expect(parse("")).toEqual([]);
});

test("parses literals", () => {
  expect(parseFirst("1").equals(numericLiteral("1"))).toEqual(true);
  expect(parseFirst("1.0").equals(numericLiteral("1.0"))).toEqual(true);
  expect(parseFirst('"hello"').equals(stringLiteral("hello"))).toEqual(true);
  expect(parseFirst("#t").equals(booleanLiteral(true))).toEqual(true);
  expect(parseFirst("#f").equals(booleanLiteral(false))).toEqual(true);
});

test("parses symbols", () => {
  expect(parseFirst("hello").equals(symbol("hello"))).toEqual(true);
  expect(parseFirst("hello-world").equals(symbol("hello-world"))).toEqual(true);
  expect(parseFirst("hello?").equals(symbol("hello?"))).toEqual(true);
  expect(parseFirst("hello-world!").equals(symbol("hello-world!"))).toEqual(
    true
  );
});

test("parses with macros and without macros should have the same length", () => {
  const source = `
  (import "std" (list map))
  (define (square x) (* x x))
  (square 5/8)
  (begin (define x 5) (set! x 10) x)
  (define (square x) (begin (define x 5) (* x x)))
  `;
  const program = parse(source, 4);
  const programWithMacros = parse(source, 5);
  expect(program.length).toEqual(programWithMacros.length);
});
