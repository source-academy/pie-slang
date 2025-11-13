import 'jest';
import { evaluatePie } from '../main'

describe("Parser Evaluate Integration Tests", () => {

it("Evaluate Less-Than (no params, indexed)", () => {
    const input = `
    (data Less-Than () ((j Nat) (k Nat))
      (zero-smallest ((n Nat)) (Less-Than () (zero (add1 n))))
      (add1-smaller ((j Nat) (k Nat) (j<k (type-Less-Than () (j k)))) (Less-Than () ((add1 j) (add1 k))))
      ind-Less-Than)

    (claim proof-0<1 (type-Less-Than () (zero (add1 zero))))
    (define proof-0<1 (data-zero-smallest zero))

    (claim proof-1<2 (type-Less-Than () ((add1 zero) (add1 (add1 zero)))))
    (define proof-1<2 (data-add1-smaller zero (add1 zero) proof-0<1))

    (claim extract-smaller
      (Pi ((j Nat) (k Nat))
        (-> (type-Less-Than () (j k)) Nat)))
    (define extract-smaller
      (lambda (j k proof)
        (elim-Less-Than proof
          (lambda (j-idx k-idx p) Nat)
          (lambda (n) zero)
          (lambda (j-arg k-arg j<k-arg ih) (add1 ih)))))

    (claim result Nat)
    (define result (extract-smaller zero (add1 zero) proof-0<1))
    `;
    const result = evaluatePie(input);
    console.log(result)
  });
})