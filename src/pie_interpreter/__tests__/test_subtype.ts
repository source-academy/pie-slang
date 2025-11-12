import 'jest';
import { evaluatePie } from '../main'

describe("Test subtyping", () => {
  it("Evaluate Bool (no params, no indices)", () => {
    const input =
    `
    ;; Generic subtyping relation - no hardcoded types
(data Subtype () ((T1 U) (T2 U))
  (refl ((T U))
    (Subtype () (T T)))
  (trans ((T1 U) (T2 U) (T3 U)
          (p1 (type-Subtype () (T1 T2)))
          (p2 (type-Subtype () (T2 T3))))
    (Subtype () (T1 T3)))
  ind-Subtype)
  

;; Coercion function
(claim coerce
  (Pi ((T1 U) (T2 U))
    (-> (type-Subtype () (T1 T2))
        T1
        T2)))

(claim basic (type-Subtype () (Nat Nat)))

(define basic (data-refl Nat))

(define coerce
  (lambda (T1 T2 proof val)
    (elim-Subtype proof
      (lambda (t1 t2 sub) (-> t1 t2))
      ;; refl case
      (lambda (TT x) x)
      ;; trans case
      (lambda (T1 T2 T3 p1 p2 x)
        (coerce T2 T3 p2 (coerce T1 T2 p1 x))))))

;; Now A is just a variable, user provides subtyping proof
(claim use-with-nat
  (Pi ((A U))
    (-> (type-Subtype () (A Nat))  ;; proof that A <: Nat
        A                           ;; value of type A
        Nat)))                      ;; result

(define use-with-nat
  (lambda (A proof x)
    (add1 (coerce A Nat proof x))))

;; User calls it with ANY type A and appropriate proof
;; (use-with-nat MyType my-subtyping-proof my-value)`
    const result = evaluatePie(input);
    console.log(result);
  })
})