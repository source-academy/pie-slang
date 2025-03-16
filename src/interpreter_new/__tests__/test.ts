import 'jest';

import {Parser} from '../parser';
import * as util from 'util';
import {go} from '../types/utils';
import {initCtx} from '../types/contexts';


const parser = new Parser();

describe("demo", () => {

  it("Pie demo", () => {
    const src = parser.parsePie('(-> Nat Nat Nat Nat Nat)');
    const actual = new go(['the', 'U', ['Π', [[Symbol('x'), 'Nat']], 
                                         ['Π', [[Symbol('x₁'), 'Nat']], 
                                           ['Π', [[Symbol('x₂'), 'Nat']], 
                                             ['Π', [[Symbol('x₃'), 'Nat']], 
                                                  'Nat']]]]]);
    console.log('result', util.inspect(rep(initCtx, src), false, null, true));
    expect(rep(initCtx, src)).toEqualWithSymbols(actual);
                                                  
    });

  it("Sigma demo", () => {
    const src = parser.parsePie(
                        `(the (-> Trivial
                                         (Pair Trivial Trivial))
                                     (lambda (x)
                                       (cons x x)))`
                                       );
    const actual = new go(
        ['the', ['Π', [[Symbol('x'), 'Trivial']], 
        ['Σ', [[Symbol('x₁'), 'Trivial']], 'Trivial']], 
        ['λ', [Symbol('x')],['cons', Symbol('sole'), Symbol('sole')]]]);
    console.log('wcnm', util.inspect(rep(initCtx, src), false, null, true));
    expect(rep(initCtx, src)).toEqualWithSymbols(actual);
  });

});

test("Transforming function type -> to Π", () => {
  const parsed = parser.parsePie("(the (-> Nat Nat Nat) (lambda (x x) x))");
  const actual = new go(["the", ["Π", [["x", "Nat"]], ["Π", [["x₁", "Nat"]], "Nat"]], ["λ", ["x", "x"], "x"]])
  expect(parsed).toEqual(
    
  );
});

test("", () => {
  const parsed = parser.parsePie('(the (-> Nat Nat) (λ (z) z))');
  expect(parsed).toEqual(
    ["the", ['Π', [["x", 'Nat']], 'Nat'],['λ', ["z"], "z"]]
  )
});

test("Evaluating which-Nat expression", () => {
  const parsed = parser.parsePie("(which-Nat 1 2 (lambda (x) x))");
  expect(parsed).toEqual(["the", "Nat", "zero"]);
});

test("", () => {
  const parsed = parser.parsePie("(which-Nat 0 2 (lambda (x) x))");
  expect(parsed).toEqual(["the", "Nat", ["add1", ["add1", "zero"]]])
});

test("Transforming higher-order function type", () => {
  const parsed = parser.parsePie("(the (-> (-> Nat Nat) Nat Nat) (lambda (f x) (f x)))");
  expect(parsed).toEqual(
    ["the", 
      ["Π", [["x", ["Π", [["x", "Nat"]], "Nat"]]], ["Π", [["x₁", "Nat"]], "Nat"]], 
      ["λ", ["f"], ["λ", ["x"], ["f", "x"]]]
    ]
  );
});

test("Evaluating higher-order function with `which-Nat`", () => {
  const parsed = parser.parsePie(`
    (the (-> Nat (-> Nat Nat) Nat)
         (lambda (x f)
           (which-Nat 2 x f)))
  `);
  expect(parsed).toEqual(
    [
      "the",
      [
        "Π", 
        [["x", "Nat"]],
        [
          "Π", 
          [["x₁", ["Π", [["x₁", "Nat"]], "Nat"]]], 
          "Nat"
        ]
      ],
      ["λ", ["x"], ["λ", ["f"], ["f", ["add1", "zero"]]]]
    ]
  );
});

test("", () => {
  const parsed = parser.parsePie(`
    (the (-> Nat (-> Nat Nat) Nat)
         (lambda (x f)
           (which-Nat x (add1 (add1 zero)) f)))
  `);
  expect(parsed).toEqual(
    [
      "the",
      [
        "Π", 
        [["x", "Nat"]],
        [
          "Π", 
          [["x₁", ["Π", [["x₁", "Nat"]], "Nat"]]], 
          "Nat"
        ]
      ],
      ["λ", ["x"], ["λ", ["f"], ["which-Nat", "x", ["the", "Nat", ["add1", ["add1", "zero"]]] , ["λ", ["n"], ["f", "n"]]]]]
    ]
  );
});

