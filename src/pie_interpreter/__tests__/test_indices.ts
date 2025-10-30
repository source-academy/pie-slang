import 'jest';
import { evaluatePie } from '../main'
import { inspect } from 'util';

describe("Parser Evaluate Integration Tests", () => {
  it("Evaluate myList (parameterized, no indices)", () => {
    const input = `
    (data Less-Than () ((j Nat) (k Nat))
      (zero-smallest ((n Nat)) (Less-Than () (zero (add1 n))))
      (add1-smaller ((j Nat) (k Nat) (j<k (type-Less-Than () (j k)))) (Less-Than () ((add1 j) (add1 k))))
      ind-Less-Than)

    (claim proof-0<1 (type-Less-Than () (zero (add1 zero))))
    (define proof-0<1 (data-zero-smallest zero))

    (claim proof-1<2 (type-Less-Than () ((add1 zero) (add1 (add1 zero)))))
    (define proof-1<2 (data-add1-smaller zero (add1 zero) proof-0<1))
    
    `;
    const result = evaluatePie(input);
    console.log(inspect(result, true, null, true));
  });
})