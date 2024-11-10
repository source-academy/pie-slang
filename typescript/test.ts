import {
  Src, 
  SrcStx,
  initCtx,
  ctxToEnv,
  BindingSite,
  MetaVar,
  go,
} from './basics';
import 'jest';
import {
  valOf,
  PIType,
} from './normalize';
import {} from './typechecker';

import {
  rep
} from './rep';

import { Location, Syntax } from './locations';
const nl = new Location(new Syntax(Symbol('a'), Symbol('b'), 0,0,0,0), true);

declare global {
  namespace jest {
    interface Matchers<R> {
      toEqualWithSymbols(expected: any): R;
    }
  }
}

expect.extend({
  toEqualWithSymbols(received, expected) {
    const pass = this.equals(received, expected, [
      (a, b) => {
        if (typeof a === 'symbol' && typeof b === 'symbol') {
          return a.description === b.description;
        }
        return undefined; // Use default equality check
      }
    ]);

    if (pass) {
      return {
        message: () => `expected ${received} not to equal ${expected}`,
        pass: true,
      };
    } else {
      return {
        message: () => `expected ${received} to equal ${expected}`,
        pass: false,
      };
    }
  }
});

describe("valOf", () => {
  it("should return ZERO", () => {
    const result0 = valOf(ctxToEnv(initCtx), ['the', 'Nat', 'zero'])
    expect(result0).toEqual('ZERO');
  });
});

describe("lambda(var) var", () => {
  it("should return a pie expression", () => {
    const result = rep(initCtx, new Src(nl, ['the', new Src(nl, ['->', new Src(nl, 'Nat'), new Src(nl, 'Nat'), []]), 
  new Src(nl, ['λ', [new BindingSite(nl, Symbol('myVar'))], new Src(nl, Symbol('x'))])]));
    const actual = new go(['the', ['Π', [[Symbol('x'), 'Nat']], 'Nat'], ['λ', [Symbol('myVar')], Symbol('myVar')]]);
    expect(result).toEqualWithSymbols(actual);
  });

  it("case lambda(z) => z", () => {
    const z = Symbol('z');  // Create single instance
    const x = Symbol('x');
    
    const src = new Src(nl, [
      'the', 
      new Src(nl, ['->', new Src(nl, 'Nat'), new Src(nl, 'Nat'), []]), 
      new Src(nl, ['λ', [new BindingSite(nl, z)], new Src(nl, z)])
    ]);

    const actual = new go([
      'the', 
      ['Π', [[x, 'Nat']], 'Nat'], 
      ['λ', [z], z]
    ]);

    expect(rep(initCtx, src)).toEqualWithSymbols(actual);
  });

  it("case lambda(x x) => x", () => {
    const src = new Src(nl, ['the', 
                            new Src(nl, ['->', new Src(nl, 'Nat'), new Src(nl, 'Nat'), [new Src(nl, 'Nat')]]), 
                            new Src(nl, ['λ', [new BindingSite(nl, Symbol('x')), new BindingSite(nl, Symbol('x'))], 
                                              new Src(nl, Symbol('x'))])]);
    const actual = new go(['the', ['Π', [[Symbol('x'), 'Nat']], ['Π', [[Symbol('x₁'), 'Nat']], 'Nat']], ['λ', [Symbol('x')], ['λ', [Symbol('x₁')], Symbol('x₁')]]]);
    expect(rep(initCtx,src)).toEqualWithSymbols(actual);       
  })

  
});
