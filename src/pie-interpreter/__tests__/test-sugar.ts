import 'jest';
import { evaluatePieAndGetContext } from '../main';
import { TypeSugarer, sugarType } from '../unparser/sugar';
import * as C from '../types/core';
import { Context, Define } from '../utils/context';
import { Lambda } from '../types/value';
import { FirstOrderClosure } from '../types/utils';

describe("Type Sugaring Tests", () => {

  /**
   * Helper to setup a context with Even definition
   */
  function setupEvenContext(): Context {
    const str = `
(claim +
  (→ Nat Nat Nat))

(claim step-plus (→ Nat Nat))
(define step-plus (λ (n-1) (add1 n-1)))
(define + (λ (n j) (iter-Nat n j step-plus)))

(claim double (→ Nat Nat))
(define double (λ (n) (iter-Nat n 0 (+ 2))))

(claim Even (→ Nat U))
(define Even (λ (n) (Σ ((half Nat)) (= Nat n (double half)))))

(claim Odd (→ Nat U))
(define Odd (λ (n) (Σ ((half Nat)) (= Nat n (add1 (double half))))))
`;
    const result = evaluatePieAndGetContext(str);
    return result.context;
  }

  it("should identify type-level definitions", () => {
    const ctx = setupEvenContext();
    const sugarer = new TypeSugarer(ctx);

    const typeDefNames = sugarer.getTypeDefinitionNames();
    expect(typeDefNames).toContain('Even');
    expect(typeDefNames).toContain('Odd');
    // + and double return Nat, not U, so they shouldn't be type definitions
    expect(typeDefNames).not.toContain('+');
    expect(typeDefNames).not.toContain('double');
  });

  it("should extract lambda bodies from type definitions", () => {
    const ctx = setupEvenContext();
    const evenDef = ctx.get('Even');

    expect(evenDef).toBeInstanceOf(Define);
    if (evenDef instanceof Define) {
      const value = evenDef.value;
      expect(value).toBeInstanceOf(Lambda);
      if (value instanceof Lambda) {
        expect(value.argName).toBe('n');
        expect(value.body).toBeInstanceOf(FirstOrderClosure);
        if (value.body instanceof FirstOrderClosure) {
          expect(value.body.varName).toBe('n');
          expect(value.body.expr).toBeInstanceOf(C.Sigma);
        }
      }
    }
  });

  it("should sugar (Sigma ((half Nat)) (= Nat n ...)) as (Even n)", () => {
    const ctx = setupEvenContext();

    // Get the Even definition and apply it to a variable 'n' to get the body
    const evenDef = ctx.get('Even') as Define;
    const lambda = evenDef.value as Lambda;
    const body = lambda.body as FirstOrderClosure;

    // The body.expr should be a Sigma type template
    const template = body.expr;
    expect(template).toBeInstanceOf(C.Sigma);

    // Create a sugarer and test sugaring on the template itself
    const sugarer = new TypeSugarer(ctx);
    const sugared = sugarer.sugar(template, ctx);

    // The template IS the body, so when matching against Even's body with pattern var 'n',
    // 'n' matches to VarName('n'), so we should get "(Even n)"
    expect(sugared).toBe('(Even n)');
  });

  it("should fall back to prettyPrint for non-matching types", () => {
    const ctx = setupEvenContext();
    const sugarer = new TypeSugarer(ctx);

    // A simple Nat type should not match Even
    const natCore = new C.Nat();
    const sugared = sugarer.sugar(natCore, ctx);
    expect(sugared).toBe('Nat');
  });

  it("sugarType function should work with context", () => {
    const ctx = setupEvenContext();

    // Get Even's body directly
    const evenDef = ctx.get('Even') as Define;
    const lambda = evenDef.value as Lambda;
    const body = lambda.body as FirstOrderClosure;
    const template = body.expr;

    // Use the convenience function
    const sugared = sugarType(template, ctx);
    expect(sugared).toBe('(Even n)');
  });

  it("should match specific argument values", () => {
    const ctx = setupEvenContext();
    const sugarer = new TypeSugarer(ctx);

    // Get Even's lambda body
    const evenDef = ctx.get('Even') as Define;
    const lambda = evenDef.value as Lambda;
    const body = lambda.body as FirstOrderClosure;

    // The body.expr is (Σ ((half Nat)) (= Nat n (double half)))
    // If we substitute n with Zero, we get (Σ ((half Nat)) (= Nat 0 (double half)))
    // which should sugar to (Even 0)

    // For this test, we'd need to actually substitute and evaluate,
    // which is more complex. For now, just verify the pattern matching works
    // with the original template.

    // Create a Sigma with 0 instead of n
    const sigmaWithZero = new C.Sigma(
      'half',
      new C.Nat(),
      new C.Equal(
        new C.Nat(),
        new C.Zero(),  // n replaced with 0
        new C.Application(new C.VarName('double'), new C.VarName('half'))
      )
    );

    const sugared = sugarer.sugar(sigmaWithZero, ctx);
    expect(sugared).toBe('(Even 0)');
  });

  it("should sugar readBackType output correctly (the real use case)", () => {
    // This is the actual bug fix test: types from readBackType have
    // expanded forms like iter-Nat, not source forms like (double half)
    const str = `
(claim +
  (→ Nat Nat Nat))

(claim step-plus (→ Nat Nat))
(define step-plus (λ (n-1) (add1 n-1)))
(define + (λ (n j) (iter-Nat n j step-plus)))

(claim double (→ Nat Nat))
(define double (λ (n) (iter-Nat n 0 (+ 2))))

(claim Even (→ Nat U))
(define Even (λ (n) (Σ ((half Nat)) (= Nat n (double half)))))
`;
    const result = evaluatePieAndGetContext(str);
    const ctx = result.context;

    // Get the Even definition and apply it to get the actual type Value
    const evenDef = ctx.get('Even') as Define;
    const evenLambda = evenDef.value as Lambda;

    // Create the parameter type value (Nat)
    const natValue = new (require('../types/value').Nat)();

    // Create a neutral variable to apply Even to
    const { Neutral } = require('../types/value');
    const { Variable } = require('../types/neutral');
    const { bindFree } = require('../utils/context');
    const neutralN = new Neutral(natValue, new Variable('n'));

    // Apply Even to the neutral to get (Even n) as a Value
    const evenOfN = evenLambda.body.valOfClosure(neutralN);

    // Now call readBackType - this is what the actual proof system does
    const readBackCtx = bindFree(ctx, 'n', natValue);
    const readBackCore = evenOfN.readBackType(readBackCtx);

    // The readBackCore should contain iter-Nat (the expanded form)
    // not (double half) (the source form)
    const prettyPrinted = readBackCore.prettyPrint();
    expect(prettyPrinted).toContain('iter-Nat');
    expect(prettyPrinted).not.toContain('double');

    // Now test that the sugarer correctly recognizes this as (Even n)
    const sugarer = new TypeSugarer(ctx);
    const sugared = sugarer.sugar(readBackCore, readBackCtx);
    expect(sugared).toBe('(Even n)');
  });
});
