import 'jest';
import { evaluatePie } from '../main'

describe("Debug constructor with type params", () => {
  it("Just define the datatype and constructor", () => {
    const input =
    `(data Subtype () ((T1 U) (T2 U))
  (refl ((T U))
    (Subtype () (T T)))
  ind-Subtype)

;; Test: can we construct a refl?
(claim nat-refl (Subtype () (Nat Nat)))
(define nat-refl (data-refl Nat))`;
    const result = evaluatePie(input);
    console.log(result);
  })
})
