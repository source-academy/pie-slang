import 'jest';
import { evaluatePie } from '../main'

describe("Test subtyping", () => {
  it("Evaluate Bool (no params, no indices)", () => {
    const input =
    `
    ;; Enhanced Subtype relation with injection constructor
(data Subtype () ((T1 U) (T2 U))
  (refl ((T U))
    (Subtype () (T T)))
  (trans ((T1 U) (T2 U) (T3 U)
          (p1 (type-Subtype () (T1 T2)))
          (p2 (type-Subtype () (T2 T3))))
    (Subtype () (T1 T3)))
  ;; Generic injection: if there exists a function A -> B, then A <: B
  (inject ((A U) (B U) (f (-> A B)))
    (Subtype () (A B)))
  ind-Subtype)

;; Coerce now handles injection case
(claim coerce
  (Pi ((A U) (B U))
    (-> (type-Subtype () (A B)) A B)))
(define coerce
  (lambda (A B proof val)
    ((elim-Subtype proof
      (lambda (t1 t2 sub) (-> t1 t2))
      (lambda (TT x) x)
      (lambda (T11 T22 T33 p1 p2 ih1 ih2 x)
        (ih2 (ih1 x)))
      (lambda (AA BB ff x) (ff x))
      )
      val)))

(data Even () ((n Nat))
  (zero-even ()
    (Even () (zero)))
  (add2-even ((k Nat) (k-even (type-Even () (k))))
    (Even () ((add1 (add1 k)))))
  ind-Even)

(claim even-to-nat
  (Pi ((n Nat))
    (-> (type-Even () (n)) Nat)))
(define even-to-nat
  (lambda (n proof)
    (elim-Even proof
      (lambda (m ev) Nat)
      zero
      (lambda (k prev ih) (add1 (add1 ih))))))

(claim even-subtype-nat
  (Pi ((n Nat))
    (type-Subtype () ((type-Even () (n)) Nat))))
(define even-subtype-nat
  (lambda (n)
    (data-inject (type-Even () (n)) Nat (even-to-nat n))))

(claim + (-> Nat Nat Nat))
(define +
  (lambda (a b)
    (rec-Nat a
      b
      (lambda (pred ih) (add1 ih)))))

(claim double (-> Nat Nat))
(define double
  (lambda (n)
    (+ n n)))

;; Use Even with double
(claim double-even
  (Pi ((n Nat))
    (-> (type-Even () (n)) Nat)))
(define double-even
  (lambda (n ev)
    (double (coerce (type-Even () (n)) Nat
                    (even-subtype-nat n)
                    ev))))


(claim even-four (type-Even () ((add1 (add1 (add1 (add1 zero)))))))
(define even-four
  (data-add2-even (add1 (add1 zero))
    (data-add2-even zero
      (data-zero-even))))

(claim result2 Nat)
(define result2 (double-even (add1 (add1 (add1 (add1 zero)))) even-four))
        `
    const result = evaluatePie(input);
    console.log(result);
  })
})