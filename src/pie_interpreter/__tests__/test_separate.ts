import 'jest';
import { evaluatePie } from '../main'

describe("Parser Evaluate Integration Tests", () => {

it("Evaluate myVec (parameterized and indexed)", () => {
    const input = `
    (data myVec ((E U)) ((n Nat))
      (myVecNil () (myVec (E) (zero)))
      (myVecCons ((k Nat) (head E) (tail (type-myVec (E) (k)))) (myVec (E) ((add1 k))))
      ind-myVec)

    (claim empty-vec (type-myVec (Nat) (zero)))
    (define empty-vec (data-myVecNil))

    (claim one-vec (type-myVec (Nat) ((add1 zero))))
    (define one-vec (data-myVecCons zero (add1 zero) empty-vec))

    (claim vec-to-nat (Pi ((n Nat)) (-> (type-myVec (Nat) (n)) Nat)))
    (define vec-to-nat
      (lambda (n v)
        (elim-myVec v
          (lambda (len vec) Nat)
          zero
          (lambda (k h t ih) (add1 ih)))))

    (claim result Nat)
    (define result (vec-to-nat (add1 zero) one-vec))
    `;
    const result = evaluatePie(input);
  });
})