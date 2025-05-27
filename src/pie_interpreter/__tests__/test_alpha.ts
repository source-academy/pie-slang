import 'jest'

import { alphaEquiv } from '../utils/alphaeqv'
import * as C from '../types/core';

describe("alpha equivalence", () => {
  it("should check alpha equivalence of two expressions", () => {
    const expr1 = new C.Pi('x', new C.Nat, new C.VarName('x'));
    const expr2 = new C.Pi('y', new C.Nat, new C.VarName('y'));
    
    expect(alphaEquiv(expr1, expr2)).toBe(true);
  });

  
});