import {
  Src, 
  SrcStx,
  initCtx,
  ctxToEnv,
  BindingSite,
  MetaVar,
  go,
} from './basics';
import {
  valOf,
  PIType,
} from './normalize';
import {} from './typechecker';

import {
  rep
} from './rep';

import { Location, Syntax } from './locations';
const nl =  null !// new Location(new Syntax(Symbol('a'), Symbol('b'), 0,0,0,0), true);

describe("valOf", () => {
  it("should return ZERO", () => {
    const result0 = valOf(ctxToEnv(initCtx), ['the', 'Nat', 'zero'])
    expect(result0).toEqual('ZERO');
  });
});


describe ("lambda(var) var", () => {
  it("should return a pie expression", () => {
    const result = rep(initCtx, new Src(nl, ['the', new Src(nl, ['->', new Src(nl, 'Nat'), new Src(nl, 'Nat'), []]), 
  new Src(nl, ['λ', [new BindingSite(nl, Symbol('myVar'))], new Src(nl, Symbol('x'))])]));
    const actual = new go(['the', ['Π', ['x', 'Nat'], 'Nat'], ['λ', 'myVar', 'myVar']]);
    expect(result).toEqual(actual);
  });

  it("case lambda(x x) => x", () => {
    const src = new Src(nl, ['the', 
                            new Src(nl, ['->', new Src(nl, 'Nat'), new Src(nl, 'Nat'), [new Src(nl, 'Nat')]]), 
                            new Src(nl, ['λ', [new BindingSite(nl, Symbol('x')), new BindingSite(nl, Symbol('x'))], 
                                              new Src(nl, Symbol('x'))])]);
    const actual = new go(['the', ['Π', ['x', 'Nat'], ['Π', ['x1', 'Nat'], 'Nat']], ['λ', 'x', ['λ', 'x1', 'x1']]]);
    expect(rep(initCtx,src)).toEqual(actual);       
  })
  
  it("case lambda(z) => z", () => {
    const src = new Src(nl, ['the', new Src(nl, ['->', new Src(nl, 'Nat'), new Src(nl, 'Nat'), []]), new Src(nl, ['λ', [new BindingSite(nl, Symbol('z'))], new Src(nl, Symbol('z1'))])]);
    const actual = new go(['the', ['Π', ['z', 'Nat'], 'Nat', 'z']])
    expect(rep(initCtx, src)).toEqual(actual);  
  })
});

