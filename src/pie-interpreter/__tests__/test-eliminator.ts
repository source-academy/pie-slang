import 'jest';
import * as C from '../types/core';
import * as V from '../types/value';
import * as Evaluator from '../evaluator/evaluator';
import { Environment } from '../utils/environment';
import { readBack } from '../evaluator/utils';
import { Context } from '../utils/context';

// Test examples for doEliminator function using Core data structures

// Example 1: List elimination test
export function createListExample(): {
  listType: C.InductiveTypeConstructor,
  sampleList: C.Core,
  eliminator: C.Eliminator
} {

  const listType = new C.InductiveTypeConstructor(
    "List",
    [new C.Nat()], // parameters
    [],                   // no indices
  );

  // Create List constructors
  const nilConstructor = new C.Constructor(
    "nil",   // name
    0,       // constructor index
    "List",  // type: List A
    [],      // no arguments
    []       // no recursive arguments
  );

  // Create a sample list: cons 1 (cons 2 (cons 3 nil))
  // Create cons 3 nil
  const cons3Nil = new C.Constructor(
    "cons",  // name
    1,       // constructor index
    "List",  // type
    [
      new C.Add1(new C.Add1(new C.Add1(new C.Zero())))
    ],       // arguments (just head, not tail)
    [nilConstructor]  // recursive arguments (tail)
  );

  // Create cons 2 (cons 3 nil)
  const cons2 = new C.Constructor(
    "cons",  // name
    1,       // constructor index
    "List",  // type
    [new C.Add1(new C.Add1(new C.Zero()))], // just head
    [cons3Nil]  // recursive arguments (tail)
  );


  // Create eliminator for summing the list with proper lambda expressions
  const sumEliminator = new C.Eliminator(
    "List",
    cons2,
    new C.Lambda("xs", new C.Nat()), // motive: List A -> Nat
    [
      new C.Zero(), // base case: nil -> 0
      new C.Lambda("head",
        new C.Lambda("tail",
          new C.Lambda(
            'n',
            new C.Add1(new C.VarName('n'))
          )
        )
      ) // step case: head -> tail -> sum_tail -> add1 sum_tail
    ]
  );

  return {
    listType,
    sampleList: cons2,
    eliminator: sumEliminator
  };
}

// Jest test cases
describe("doEliminator tests", () => {

  it("should handle list elimination", () => {
    const env: Environment = new Map();
    const listExample = createListExample();

    expect(() => {
      const listResult = Evaluator.doEliminator(
        "List",
        listExample.sampleList.toLazy(env),
        listExample.eliminator.motive.toLazy(env),
        listExample.eliminator.methods.map(m => m.toLazy(env))
      );
      const context: Context = new Map();
      readBack(context, new V.Nat(), listResult);
    }).not.toThrow();
  });

  it("should test list elimination with specific values", () => {
    const env: Environment = new Map();
    const listExample = createListExample();

    const listResult = Evaluator.doEliminator(
      "List",
      listExample.sampleList.toLazy(env),
      listExample.eliminator.motive.toLazy(env),
      listExample.eliminator.methods.map(m => m.toLazy(env))
    );

    // Add specific assertions based on expected behavior
    expect(listResult).toBeDefined();
  });

});
