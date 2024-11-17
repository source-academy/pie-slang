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
function parse(input: string, chapter: number = 4): Expression[] {
  const lexer = new SchemeLexer(input);
  const parser = new SchemeParser(input, lexer.scanTokens(), chapter);
  return parser.parse();
}

function parseFirst(input: string, chapter: number = 4): Expression {
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

test("parses identifiers", () => {
  expect(parseFirst("hello").equals(identifier("hello"))).toEqual(true);
  expect(parseFirst("hello-world").equals(identifier("hello-world"))).toEqual(
    true
  );
  expect(parseFirst("hello?").equals(identifier("hello?"))).toEqual(true);
  expect(parseFirst("hello-world!").equals(identifier("hello-world!"))).toEqual(
    true
  );
});

test("parses lambda functions", () => {
  expect(
    parseFirst("(lambda () 1)").equals(lambda(numericLiteral("1"), []))
  ).toEqual(true);
  expect(
    parseFirst("(lambda (x) x)").equals(
      lambda(identifier("x"), [identifier("x")])
    )
  ).toEqual(true);
  expect(
    parseFirst("(lambda (x y) x)").equals(
      lambda(identifier("x"), [identifier("x"), identifier("y")])
    )
  ).toEqual(true);
  expect(
    parseFirst("(lambda (x y z) x)").equals(
      lambda(identifier("x"), [
        identifier("x"),
        identifier("y"),
        identifier("z"),
      ])
    )
  ).toEqual(true);
});

test("parses variadic lambda functions", () => {
  expect(
    parseFirst("(lambda x x)").equals(
      lambda(identifier("x"), [], identifier("x"))
    )
  ).toEqual(true);
  expect(
    parseFirst("(lambda (x . y) x)").equals(
      lambda(identifier("x"), [identifier("x")], identifier("y"))
    )
  ).toEqual(true);
  expect(
    parseFirst("(lambda (x y . z) x)").equals(
      lambda(
        identifier("x"),
        [identifier("x"), identifier("y")],
        identifier("z")
      )
    )
  ).toEqual(true);
});

test("parses functions with body", () => {
  expect(
    parseFirst("(lambda () x x)").equals(
      lambda(sequence(identifier("x"), identifier("x")), [])
    )
  ).toEqual(true);
});

test("parses definitions", () => {
  expect(
    parseFirst("(define x 1)").equals(
      definition(identifier("x"), numericLiteral("1"))
    )
  ).toEqual(true);
  expect(
    parseFirst("(define x 1.0)").equals(
      definition(identifier("x"), numericLiteral("1.0"))
    )
  ).toEqual(true);
  expect(
    parseFirst('(define x "hello")').equals(
      definition(identifier("x"), stringLiteral("hello"))
    )
  ).toEqual(true);
  expect(
    parseFirst("(define x #t)").equals(
      definition(identifier("x"), booleanLiteral(true))
    )
  ).toEqual(true);
  expect(
    parseFirst("(define x #f)").equals(
      definition(identifier("x"), booleanLiteral(false))
    )
  ).toEqual(true);
  expect(
    parseFirst("(define x (lambda (x) x))").equals(
      definition(identifier("x"), lambda(identifier("x"), [identifier("x")]))
    )
  ).toEqual(true);
});

test("parses function definitions", () => {
  expect(
    parseFirst("(define (f x) x)").equals(
      functionDefinition(identifier("f"), identifier("x"), [identifier("x")])
    )
  ).toEqual(true);
  expect(
    parseFirst("(define (f x y) x y)").equals(
      functionDefinition(
        identifier("f"),
        sequence(identifier("x"), identifier("y")),
        [identifier("x"), identifier("y")]
      )
    )
  ).toEqual(true);
});

test("parses applications", () => {
  expect(parseFirst("(f)").equals(application(identifier("f"), []))).toEqual(
    true
  );
  expect(
    parseFirst("(f x)").equals(application(identifier("f"), [identifier("x")]))
  ).toEqual(true);
  expect(
    parseFirst("(f x y)").equals(
      application(identifier("f"), [identifier("x"), identifier("y")])
    )
  ).toEqual(true);
  expect(
    parseFirst("((lambda (x) x) 1)").equals(
      application(lambda(identifier("x"), [identifier("x")]), [
        numericLiteral("1"),
      ])
    )
  ).toEqual(true);
});

test("parses conditionals", () => {
  expect(
    parseFirst("(if #t 1 2)").equals(
      conditional(
        booleanLiteral(true),
        numericLiteral("1"),
        numericLiteral("2")
      )
    )
  ).toEqual(true);
  expect(
    parseFirst("(if #f 1)").equals(
      conditional(booleanLiteral(false), numericLiteral("1"))
    )
  ).toEqual(true);
});

test("parses quoted literals and identifiers", () => {
  expect(parseFirst("'1").equals(numericLiteral("1"))).toEqual(true);
  expect(parseFirst("'1.0").equals(numericLiteral("1.0"))).toEqual(true);
  expect(parseFirst('\'"hello"').equals(stringLiteral("hello"))).toEqual(true);
  expect(parseFirst("'hello").equals(symbol("hello"))).toEqual(true);
});

test("parses quoted vectors (everything inside should be quoted)", () => {
  expect(
    parseFirst("'#(1 2 3)").equals(
      vector(numericLiteral("1"), numericLiteral("2"), numericLiteral("3"))
    )
  ).toEqual(true);
  expect(
    parseFirst("'#(1 2 3 4)").equals(
      vector(
        numericLiteral("1"),
        numericLiteral("2"),
        numericLiteral("3"),
        numericLiteral("4")
      )
    )
  ).toEqual(true);
  expect(
    parseFirst("'#(1 testy 3 4 5)").equals(
      vector(
        numericLiteral("1"),
        symbol("testy"),
        numericLiteral("3"),
        numericLiteral("4"),
        numericLiteral("5")
      )
    )
  ).toEqual(true);
});

test("parses quotations in lists", () => {
  expect(
    parseFirst("'(1 2 3)").equals(
      list(numericLiteral("1"), numericLiteral("2"), numericLiteral("3"))
    )
  ).toEqual(true);
  expect(
    parseFirst('\'("1" (2 3) 4)').equals(
      list(
        stringLiteral("1"),
        list(numericLiteral("2"), numericLiteral("3")),
        numericLiteral("4")
      )
    )
  ).toEqual(true);
  expect(
    parseFirst("'(1 (2 (3 will-this be a symbol)) 5)").equals(
      list(
        numericLiteral("1"),
        list(
          numericLiteral("2"),
          list(
            numericLiteral("3"),
            symbol("will-this"),
            symbol("be"),
            symbol("a"),
            symbol("symbol")
          )
        ),
        numericLiteral("5")
      )
    )
  ).toEqual(true);
});

test("parses the empty list", () => {
  expect(parseFirst("'()").equals(nil())).toEqual(true);
});

test("parses dotted lists", () => {
  expect(
    parseFirst("'(1 . 2)").equals(
      dottedList([numericLiteral("1")], numericLiteral("2"))
    )
  ).toEqual(true);
  expect(
    parseFirst("'(1 2 . 3)").equals(
      dottedList(
        [numericLiteral("1"), numericLiteral("2")],
        numericLiteral("3")
      )
    )
  ).toEqual(true);
  expect(
    parseFirst("'((1 2 . 3) 2 3 . 4)").equals(
      dottedList(
        [
          dottedList(
            [numericLiteral("1"), numericLiteral("2")],
            numericLiteral("3")
          ),
          numericLiteral("2"),
          numericLiteral("3"),
        ],
        numericLiteral("4")
      )
    )
  ).toEqual(true);
});

test("parses nested lists", () => {
  expect(
    parseFirst("'(1 (2 3) 4)").equals(
      list(
        numericLiteral("1"),
        list(numericLiteral("2"), numericLiteral("3")),
        numericLiteral("4")
      )
    )
  ).toEqual(true);
});

test("parses quasiquoted lists", () => {
  expect(
    parseFirst("`(1 2 3)").equals(
      list(numericLiteral("1"), numericLiteral("2"), numericLiteral("3"))
    )
  ).toEqual(true);
  // the application is unquoted!
  expect(
    parseFirst("`(1 (2 ,(+ 1 2)) 4)").equals(
      list(
        numericLiteral("1"),
        list(
          numericLiteral("2"),
          application(identifier("+"), [
            numericLiteral("1"),
            numericLiteral("2"),
          ])
        ),
        numericLiteral("4")
      )
    )
  ).toEqual(true);
});

/*
quasiquotation will be left for semester 1 ay2425

test("does not throw on parsing quasiquoted structures with unquote-splicing", () => {
  expect(() => parse("`(1 2 ,@a 4)")).not.toThrow();
  expect(() => parse("`(1 (2 ,@a) 5)")).not.toThrow();
  expect(() => parse("`(1 ,@(list 1 2 3) 3 4)")).not.toThrow();
});
*/

test("should throw on a unquote without an external quote", () => {
  expect(() => parse(",1")).toThrow();
});

test("parses reassignments", () => {
  expect(
    parseFirst("(set! x 1)").equals(
      reassignment(identifier("x"), numericLiteral("1"))
    )
  ).toEqual(true);
});

// the return value of reassignment is UNSPECIFIED in R7RS.
// for scm-slang, we choose to have it emit the value of the assignment,
// similar to javascript.
test("parses nested reassignments", () => {
  expect(
    parseFirst("(set! x (set! y 1))").equals(
      reassignment(
        identifier("x"),
        reassignment(identifier("y"), numericLiteral("1"))
      )
    )
  ).toEqual(true);
});

test("parses import statements", () => {
  expect(
    parseFirst('(import "path" (a b c d))').equals(
      importNode(stringLiteral("path"), [
        identifier("a"),
        identifier("b"),
        identifier("c"),
        identifier("d"),
      ])
    )
  ).toEqual(true);
});

test("parses export statements", () => {
  expect(
    parseFirst("(export (define a 1))").equals(
      exportNode(definition(identifier("a"), numericLiteral("1")))
    )
  ).toEqual(true);
});

test("parses vector literals (which are equal to their quoted equivalents - everything is quoted)", () => {
  expect(parseFirst("#(1 2 3)").equals(parseFirst("'#(1 2 3)"))).toEqual(true);
  expect(
    parseFirst("#(1 testy 3 4 5)").equals(parseFirst("'#(1 testy 3 4 5)"))
  ).toEqual(true);
});

test("parses vector literals with nested lists", () => {
  // observe - (testy) is not treated as an application, but a list
  expect(
    parseFirst("#(1 (testy) 4)").equals(
      vector(numericLiteral("1"), list(symbol("testy")), numericLiteral("4"))
    )
  ).toEqual(true);
});

test("parses let expressions", () => {
  expect(
    parseFirst("(let () 1)").equals(letNode([], [], numericLiteral("1")))
  ).toEqual(true);
  expect(
    parseFirst("(let ((x 3)) (= x 1))").equals(
      letNode(
        [identifier("x")],
        [numericLiteral("3")],
        application(identifier("="), [identifier("x"), numericLiteral("1")])
      )
    )
  ).toEqual(true);
});

test("parses cond expressions", () => {
  expect(
    parseFirst("(cond ((= 1 1) 1))").equals(
      cond(
        [
          application(identifier("="), [
            numericLiteral("1"),
            numericLiteral("1"),
          ]),
        ],
        [numericLiteral("1")]
      )
    )
  ).toEqual(true);
  expect(
    parseFirst("(cond (else 1))").equals(cond([], [], numericLiteral("1")))
  ).toEqual(true);

  // more than one "return value" becomes a sequence
  expect(
    parseFirst("(cond ((foo) (bar) (baz)))").equals(
      cond(
        [application(identifier("foo"), [])],
        [
          sequence(
            application(identifier("bar"), []),
            application(identifier("baz"), [])
          ),
        ]
      )
    )
  ).toEqual(true);

  // testing all features
  expect(
    parseFirst("(cond ((= 1 1) 1 ) ((= 2 2) 2 2) (else 3))").equals(
      cond(
        [
          application(identifier("="), [
            numericLiteral("1"),
            numericLiteral("1"),
          ]),
          application(identifier("="), [
            numericLiteral("2"),
            numericLiteral("2"),
          ]),
        ],
        [
          numericLiteral("1"),
          sequence(numericLiteral("2"), numericLiteral("2")),
        ],
        numericLiteral("3")
      )
    )
  ).toEqual(true);
});

test("parses begin expressions", () => {
  expect(parseFirst("(begin 1)").equals(begin(numericLiteral("1")))).toEqual(
    true
  );
  expect(
    parseFirst("(begin 1 2)").equals(
      begin(numericLiteral("1"), numericLiteral("2"))
    )
  ).toEqual(true);
});

test("parses delay expressions", () => {
  expect(parseFirst("(delay 1)").equals(delay(numericLiteral("1")))).toEqual(
    true
  );
  expect(
    parseFirst("(delay (begin 1 2))").equals(
      delay(begin(numericLiteral("1"), numericLiteral("2")))
    )
  ).toEqual(true);
});

test("ignores datum comments", () => {
  // an empty program
  expect(parse("#; (this-should-be-ignored)")).toHaveLength(0);

  // only (but-this-should-not) should be parsed
  expect(
    parseFirst("#; (this-should-be-ignored) (but-this-should-not)").equals(
      application(identifier("but-this-should-not"), [])
    )
  ).toEqual(true);
});

test("ignores line comments", () => {
  expect(
    parseFirst("; this is a comment\n1").equals(numericLiteral("1"))
  ).toEqual(true);
});

test("ignores block comments", () => {
  expect(
    parseFirst(`
  (you-won't-see-2 1 #| 2 |# 3)
  `).equals(
      application(identifier("you-won't-see-2"), [
        numericLiteral("1"),
        numericLiteral("3"),
      ])
    )
  ).toEqual(true);
});

test("able to parse a program with all features", () => {
  expect(() =>
    parse(`
#|

a test of the parser

|#

#; (this-should-be-ignored) (but-this-should-not)

(import "rune" (square stack beside_n))

(export (define 你好世界 1))

;testinng the tokenizer name rules
#t
bad#name,butstillvalid!
#f
'a
a'
\`a
a\`
\`(a b ,c d, )

(define a 1)
(define (f x) (+ x a))
(define (g x f) (f (+ x a)))
(cond [(= (g 1 f) 3) 'great]
      [(= (g 1 f) 4) 'fail]
      [else 'fail])
(if #t 'great 'fail)
(if #f 'fail)

(let ((x 1)) (+ 1 1 1 1) (- 1 1 1) 4)
(let ((x 1) (y 2)) (+ x y))
(lambda () (+ x 1))
(define nullary (lambda () (+ 1 1 1 1) (- 1 1 1) 4))

(lambda x x)
(lambda (. x) x)
(lambda (x . y) y)

(define (test x) x)
(define (test x y) x y)
(define (test . x) x)

(cond [(= 1 1)]
      [(= 1 2) 'fail 1])

(if #t 1 (begin (error "help!") 1 2 3))

'(hello my 1 friend)

\`(one is equal to ,(/ 100 100))
'(a . b)

(set! a 2)

(((((((((1)))))))))

(= #t true)
`)
  ).not.toThrow();
});

test("rejects a program with lower chapter than expected", () => {
  expect(() => parse("'(delay stack beside_n)", 1)).toThrow();
});
