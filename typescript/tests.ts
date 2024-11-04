import {
  Src, 
  SrcStx,
  initCtx,
  ctxToEnv,
} from './basics';
import {
  valOf,
} from './normalize';
import {} from './typechecker';
import {
  rep
} from './rep';

const nl = new Location();

describe("valOf", () => {
  it("should return ZERO", () => {
    const result0 = valOf(ctxToEnv(initCtx), ['the', 'Nat', 'zero'])
    expect(result0).toEqual('ZERO');
  });
});


describe ("lambda(var) var", () => {
  it("should return a pie expression") {
    const result = new Src(nl, ['the', new Src(nl, ['->', new Src(nl, 'Nat'), new Src(nl, 'Nat')]));
    expect
  })

  it("case lambda(x x) => x", () => {
    const ast = ['the', new Src(nl, ['->', new Src(nl, 'Nat'), new Src(nl, 'Nat'), new Src(nl, 'Nat')]), ['λ', ['my-var'], 'my-var']];
  })
  
});

