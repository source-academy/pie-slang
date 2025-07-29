import 'jest'

import { alphaEquiv } from '../utils/alphaeqv'
import * as C from '../types/core';

describe("alpha equivalence", () => {
  
  describe("Variable tests", () => {
    it("should check alpha equivalence of bound variables with different names", () => {
      const expr1 = new C.Pi('x', new C.Nat(), new C.VarName('x'));
      const expr2 = new C.Pi('y', new C.Nat(), new C.VarName('y'));
      
      expect(alphaEquiv(expr1, expr2)).toBe(true);
    });

    it("should check alpha equivalence of lambda expressions with different parameter names", () => {
      const expr1 = new C.Lambda('x', new C.VarName('x'));
      const expr2 = new C.Lambda('y', new C.VarName('y'));
      
      expect(alphaEquiv(expr1, expr2)).toBe(true);
    });

    it("should distinguish bound from free variables", () => {
      const expr1 = new C.Lambda('x', new C.VarName('x'));  // bound x
      const expr2 = new C.Lambda('y', new C.VarName('x'));  // free x
      
      expect(alphaEquiv(expr1, expr2)).toBe(false);
    });

    it("should check equivalence of same free variables", () => {
      const expr1 = new C.Lambda('x', new C.VarName('y'));  // free y
      const expr2 = new C.Lambda('z', new C.VarName('y'));  // free y
      
      expect(alphaEquiv(expr1, expr2)).toBe(true);
    });

    it("should distinguish different free variables", () => {
      const expr1 = new C.Lambda('x', new C.VarName('y'));  // free y
      const expr2 = new C.Lambda('z', new C.VarName('w'));  // free w
      
      expect(alphaEquiv(expr1, expr2)).toBe(false);
    });
  });

  describe("Lambda expression tests", () => {
    it("should handle nested lambda expressions", () => {
      const expr1 = new C.Lambda('x', new C.Lambda('y', new C.VarName('x')));
      const expr2 = new C.Lambda('a', new C.Lambda('b', new C.VarName('a')));
      
      expect(alphaEquiv(expr1, expr2)).toBe(true);
    });

    it("should distinguish different variable references in nested lambdas", () => {
      const expr1 = new C.Lambda('x', new C.Lambda('y', new C.VarName('x')));
      const expr2 = new C.Lambda('a', new C.Lambda('b', new C.VarName('b')));
      
      expect(alphaEquiv(expr1, expr2)).toBe(false);
    });

    it("should handle shadowing correctly", () => {
      const expr1 = new C.Lambda('x', new C.Lambda('x', new C.VarName('x')));
      const expr2 = new C.Lambda('y', new C.Lambda('z', new C.VarName('z')));
      
      expect(alphaEquiv(expr1, expr2)).toBe(true);
    });
  });

  describe("Pi type tests", () => {
    it("should handle dependent function types", () => {
      // (Π (x Nat) (Π (y Nat) Nat)) - simple non-dependent case
      const expr1 = new C.Pi('x', new C.Nat(), new C.Pi('y', new C.Nat(), new C.VarName('x')));
      const expr2 = new C.Pi('a', new C.Nat(), new C.Pi('b', new C.Nat(), new C.VarName('a')));
      
      expect(alphaEquiv(expr1, expr2)).toBe(true);
    });

    it("should distinguish Pi types with different argument types", () => {
      const expr1 = new C.Pi('x', new C.Nat(), new C.VarName('x'));
      const expr2 = new C.Pi('x', new C.Atom(), new C.VarName('x'));
      
      expect(alphaEquiv(expr1, expr2)).toBe(false);
    });

    it("should handle Pi types with free variables in body", () => {
      const expr1 = new C.Pi('x', new C.Nat(), new C.VarName('z'));  // z is free
      const expr2 = new C.Pi('y', new C.Nat(), new C.VarName('z'));  // z is free
      
      expect(alphaEquiv(expr1, expr2)).toBe(true);
    });

    it("should handle function types (non-dependent Pi)", () => {
      // (Π (x Nat) Atom) ≡ (Π (y Nat) Atom) - function type Nat -> Atom
      const expr1 = new C.Pi('x', new C.Nat(), new C.Atom());
      const expr2 = new C.Pi('y', new C.Nat(), new C.Atom());
      
      expect(alphaEquiv(expr1, expr2)).toBe(true);
    });
  });

  describe("Sigma type tests", () => {
    it("should handle dependent pair types", () => {
      // (Σ (x Nat) Atom) - pair where second component doesn't depend on first
      const expr1 = new C.Sigma('x', new C.Nat(), new C.Atom());
      const expr2 = new C.Sigma('y', new C.Nat(), new C.Atom());
      
      expect(alphaEquiv(expr1, expr2)).toBe(true);
    });

    it("should handle nested Sigma types", () => {
      // (Σ (x Nat) (Σ (y Atom) Trivial))
      const expr1 = new C.Sigma('x', new C.Nat(), new C.Sigma('y', new C.Atom(), new C.Trivial()));
      const expr2 = new C.Sigma('a', new C.Nat(), new C.Sigma('b', new C.Atom(), new C.Trivial()));
      
      expect(alphaEquiv(expr1, expr2)).toBe(true);
    });

    it("should handle Sigma types with free variables in body", () => {
      const expr1 = new C.Sigma('x', new C.Nat(), new C.VarName('T'));  // T is free type variable
      const expr2 = new C.Sigma('y', new C.Nat(), new C.VarName('T'));  // T is free type variable
      
      expect(alphaEquiv(expr1, expr2)).toBe(true);
    });
  });
  describe("Application tests", () => {
    it("should handle simple applications", () => {
      const expr1 = new C.Application(new C.Lambda('x', new C.VarName('x')), new C.Zero());
      const expr2 = new C.Application(new C.Lambda('y', new C.VarName('y')), new C.Zero());
      
      expect(alphaEquiv(expr1, expr2)).toBe(true);
    });

    it("should distinguish different applications", () => {
      const expr1 = new C.Application(new C.Lambda('x', new C.VarName('x')), new C.Zero());
      const expr2 = new C.Application(new C.Lambda('y', new C.VarName('y')), new C.Add1(new C.Zero()));
      
      expect(alphaEquiv(expr1, expr2)).toBe(false);
    });

    it("should handle nested applications", () => {
      const expr1 = new C.Application(
        new C.Lambda('x', 
          new C.Application(new C.VarName('x'), new C.Zero())),
        new C.Lambda('y', 
          new C.Application(new C.VarName('y'), new C.Add1(new C.Zero())))
      );
      
      const expr2 = new C.Application(
        new C.Lambda('a', 
          new C.Application(new C.VarName('a'), new C.Zero())),
        new C.Lambda('b', 
          new C.Application(new C.VarName('b'), new C.Add1(new C.Zero())))
      );
      
      expect(alphaEquiv(expr1, expr2)).toBe(true);
    });
  });

  describe("Natural number tests", () => {
    it("should handle zero", () => {
      expect(alphaEquiv(new C.Zero(), new C.Zero())).toBe(true);
    });

    it("should handle add1", () => {
      const expr1 = new C.Add1(new C.Zero());
      const expr2 = new C.Add1(new C.Zero());
      
      expect(alphaEquiv(expr1, expr2)).toBe(true);
    });

    it("should distinguish different natural numbers", () => {
      const expr1 = new C.Add1(new C.Zero());
      const expr2 = new C.Add1(new C.Add1(new C.Zero()));
      
      expect(alphaEquiv(expr1, expr2)).toBe(false);
    });
  });

  describe("Quote tests", () => {
    it("should handle atom quotes", () => {
      const expr1 = new C.Quote('hello');
      const expr2 = new C.Quote('hello');
      
      expect(alphaEquiv(expr1, expr2)).toBe(true);
    });

    it("should distinguish different quotes", () => {
      const expr1 = new C.Quote('hello');
      const expr2 = new C.Quote('world');
      
      expect(alphaEquiv(expr1, expr2)).toBe(false);
    });
  });

  describe("Pair tests", () => {
    it("should handle cons expressions", () => {
      const expr1 = new C.Cons(new C.Zero(), new C.Quote('a'));
      const expr2 = new C.Cons(new C.Zero(), new C.Quote('a'));
      
      expect(alphaEquiv(expr1, expr2)).toBe(true);
    });

    it("should handle car and cdr", () => {
      const pair = new C.Cons(new C.Zero(), new C.Quote('a'));
      const expr1 = new C.Car(pair);
      const expr2 = new C.Car(pair);
      
      expect(alphaEquiv(expr1, expr2)).toBe(true);
    });
  });

  describe("List tests", () => {
    it("should handle list types", () => {
      const expr1 = new C.List(new C.Nat());
      const expr2 = new C.List(new C.Nat());
      
      expect(alphaEquiv(expr1, expr2)).toBe(true);
    });

    it("should handle nil", () => {
      expect(alphaEquiv(new C.Nil(), new C.Nil())).toBe(true);
    });

    it("should handle list cons", () => {
      const expr1 = new C.ListCons(new C.Zero(), new C.Nil());
      const expr2 = new C.ListCons(new C.Zero(), new C.Nil());
      
      expect(alphaEquiv(expr1, expr2)).toBe(true);
    });
  });

  describe("Equality tests", () => {
    it("should handle equality types", () => {
      const expr1 = new C.Equal(new C.Nat(), new C.Zero(), new C.Zero());
      const expr2 = new C.Equal(new C.Nat(), new C.Add1(new C.Zero()), new C.Add1(new C.Zero()));
      
      expect(alphaEquiv(expr1, expr2)).toBe(false);
    });

    it("should handle same", () => {
      const expr1 = new C.Same(new C.Zero());
      const expr2 = new C.Same(new C.Add1(new C.Zero()));
      
      expect(alphaEquiv(expr1, expr2)).toBe(false);
    });

    it("should handle replace", () => {
      const target = new C.VarName('eq');
      const motive = new C.Lambda('x', new C.Universe());
      const base = new C.VarName('proof');
      
      const expr1 = new C.Replace(target, motive, base);
      const expr2 = new C.Replace(target, motive, base);
      
      expect(alphaEquiv(expr1, expr2)).toBe(true);
    });
  });

  describe("Vector tests", () => {
    it("should handle vector types", () => {
      const expr1 = new C.Vec(new C.Nat(), new C.Zero());
      const expr2 = new C.Vec(new C.Nat(), new C.Zero());
      
      expect(alphaEquiv(expr1, expr2)).toBe(true);
    });

    it("should handle vecnil", () => {
      expect(alphaEquiv(new C.VecNil(), new C.VecNil())).toBe(true);
    });

    it("should handle vec::", () => {
      const expr1 = new C.VecCons(new C.Zero(), new C.VecNil());
      const expr2 = new C.VecCons(new C.Zero(), new C.VecNil());
      
      expect(alphaEquiv(expr1, expr2)).toBe(true);
    });
  });

  describe("Either tests", () => {
    it("should handle Either types", () => {
      const expr1 = new C.Either(new C.Nat(), new C.Atom());
      const expr2 = new C.Either(new C.Nat(), new C.Atom());
      
      expect(alphaEquiv(expr1, expr2)).toBe(true);
    });

    it("should handle left and right", () => {
      const expr1 = new C.Left(new C.Zero());
      const expr2 = new C.Left(new C.Zero());
      
      expect(alphaEquiv(expr1, expr2)).toBe(true);
      
      const expr3 = new C.Right(new C.Quote('a'));
      const expr4 = new C.Right(new C.Quote('a'));
      
      expect(alphaEquiv(expr3, expr4)).toBe(true);
    });

    it("should distinguish left from right", () => {
      const expr1 = new C.Left(new C.Zero());
      const expr2 = new C.Right(new C.Zero());
      
      expect(alphaEquiv(expr1, expr2)).toBe(false);
    });
  });

  describe("The annotation tests", () => {
    it("should handle type annotations", () => {
      const expr1 = new C.The(new C.Nat(), new C.Zero());
      const expr2 = new C.The(new C.Nat(), new C.Zero());
      
      expect(alphaEquiv(expr1, expr2)).toBe(true);
    });

    it("should handle the annotations with bound variables", () => {
      const expr1 = new C.Lambda('x', new C.The(new C.Nat(), new C.VarName('x')));
      const expr2 = new C.Lambda('y', new C.The(new C.Nat(), new C.VarName('y')));
      
      expect(alphaEquiv(expr1, expr2)).toBe(true);
    });
  });

  describe("Complex expression tests", () => {
    it("should handle complex nested expressions", () => {
      // (λ (f) (λ (x) (f x))) ≡ (λ (g) (λ (y) (g y)))
      const expr1 = new C.Lambda('f', 
        new C.Lambda('x', 
          new C.Application(new C.VarName('f'), new C.VarName('x'))));
      
      const expr2 = new C.Lambda('g', 
        new C.Lambda('y', 
          new C.Application(new C.VarName('g'), new C.VarName('y'))));
      
      expect(alphaEquiv(expr1, expr2)).toBe(true);
    });

    it("should handle dependent types with applications", () => {
      // (Π (A U) (Π (f (Π (x A) A)) (f zero))) - where zero is a term, not f applied to f
      const innerPi = new C.Pi('x', new C.VarName('A'), new C.VarName('A'));
      const expr1 = new C.Pi('A', new C.Universe(), 
        new C.Pi('f', innerPi,
          new C.Application(new C.VarName('f'), new C.Zero())));
      
      const innerPi2 = new C.Pi('y', new C.VarName('B'), new C.VarName('B'));
      const expr2 = new C.Pi('B', new C.Universe(), 
        new C.Pi('g', innerPi2,
          new C.Application(new C.VarName('g'), new C.Zero())));
      
      expect(alphaEquiv(expr1, expr2)).toBe(true);
    });

    it("should distinguish structurally different expressions", () => {
      const expr1 = new C.Lambda('x', new C.Lambda('y', new C.VarName('x')));
      const expr2 = new C.Lambda('x', new C.VarName('x'));
      
      expect(alphaEquiv(expr1, expr2)).toBe(false);
    });
  });

  describe("Edge cases", () => {
    it("should handle empty expressions correctly", () => {
      expect(alphaEquiv(new C.Sole(), new C.Sole())).toBe(true);
    });

    it("should handle completely different expression types", () => {
      expect(alphaEquiv(new C.Nat(), new C.Lambda('x', new C.VarName('x')))).toBe(false);
    });

    it("should handle self-referencing expressions", () => {
      const expr1 = new C.Lambda('x', new C.VarName('x'));
      const expr2 = new C.Lambda('x', new C.VarName('x'));
      
      expect(alphaEquiv(expr1, expr2)).toBe(true);
    });
  });
});