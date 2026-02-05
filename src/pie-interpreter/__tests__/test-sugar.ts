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

    // Get the Even definition and apply it to a neutral variable 'n'
    const evenDef = ctx.get('Even') as Define;
    const lambda = evenDef.value as Lambda;

    // Create the parameter type value (Nat) and a neutral variable
    const { Nat: NatValue, Neutral } = require('../types/value');
    const { Variable } = require('../types/neutral');
    const { bindFree } = require('../utils/context');

    const natValue = new NatValue();
    const neutralN = new Neutral(natValue, new Variable('n'));

    // Apply Even to the neutral to get (Even n) as a Value
    const evenOfN = lambda.body.valOfClosure(neutralN);

    // Call readBackType to get the Core form (this expands 'double' to 'iter-Nat')
    const readBackCtx = bindFree(ctx, 'n', natValue);
    const readBackCore = evenOfN.readBackType(readBackCtx);

    // Verify it contains iter-Nat (normalized form)
    expect(readBackCore.prettyPrint()).toContain('iter-Nat');

    // Create a sugarer and test sugaring
    const sugarer = new TypeSugarer(ctx);
    const sugared = sugarer.sugar(readBackCore, readBackCtx);

    // Should sugar to (Even n)
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

    // Get Even and apply it to a neutral variable 'n'
    const evenDef = ctx.get('Even') as Define;
    const lambda = evenDef.value as Lambda;

    const { Nat: NatValue, Neutral } = require('../types/value');
    const { Variable } = require('../types/neutral');
    const { bindFree } = require('../utils/context');

    const natValue = new NatValue();
    const neutralN = new Neutral(natValue, new Variable('n'));
    const evenOfN = lambda.body.valOfClosure(neutralN);
    const readBackCtx = bindFree(ctx, 'n', natValue);
    const readBackCore = evenOfN.readBackType(readBackCtx);

    // Use the convenience function
    const sugared = sugarType(readBackCore, readBackCtx);
    expect(sugared).toBe('(Even n)');
  });

  it("should match specific argument values", () => {
    const ctx = setupEvenContext();

    // Get Even and apply it to the value zero
    const evenDef = ctx.get('Even') as Define;
    const lambda = evenDef.value as Lambda;

    const { Zero: ZeroValue } = require('../types/value');

    // Apply Even to zero to get (Even 0) as a Value
    const zeroValue = new ZeroValue();
    const evenOfZero = lambda.body.valOfClosure(zeroValue);

    // Call readBackType to get the normalized Core
    const readBackCore = evenOfZero.readBackType(ctx);

    // The Core should contain 0 and iter-Nat
    const prettyPrinted = readBackCore.prettyPrint();
    expect(prettyPrinted).toContain('iter-Nat');
    expect(prettyPrinted).toContain('0');

    // Create a sugarer and test sugaring
    const sugarer = new TypeSugarer(ctx);
    const sugared = sugarer.sugar(readBackCore, ctx);

    // Should sugar to (Even 0)
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
