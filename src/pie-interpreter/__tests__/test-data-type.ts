import 'jest';
import { evaluatePie } from '../main'

describe("Test datatype definition only", () => {
  it("Define Subtype", () => {
    const input = `
    (data Subtype () ((T1 U) (T2 U))
      (refl ((T U))
        (Subtype () (T T)))
      (trans ((T1 U) (T2 U) (T3 U)
              (p1 (Subtype () (T1 T2)))
              (p2 (Subtype () (T2 T3))))
        (Subtype () (T1 T3)))
      ind-Subtype)
    `;
    expect(() => evaluatePie(input)).not.toThrow();
  });

  it("Evaluate Less-Than (no params, indexed)", () => {
    const input = `
    ;; Define Less Than relation using our new inductive type definiton
    (data Less-Than () ((j Nat) (k Nat))
      (zero-smallest ((n Nat)) (Less-Than () (zero (add1 n))))
      (add1-smaller ((j Nat) (k Nat) (j<k (Less-Than () (j k)))) (Less-Than () ((add1 j) (add1 k))))
      ind-Less-Than)

    (claim proof-0<1 (Less-Than () (zero (add1 zero))))
    (define proof-0<1 (zero-smallest zero))

    (claim proof-1<2 (Less-Than () ((add1 zero) (add1 (add1 zero)))))
    (define proof-1<2 (add1-smaller zero (add1 zero) proof-0<1))

    (claim extract-smaller
      (Pi ((j Nat) (k Nat))
        (-> (Less-Than () (j k)) Nat)))
    (define extract-smaller
      (lambda (j k proof)
        (ind-Less-Than proof
          (lambda (j-idx k-idx p) Nat)
          (lambda (n) zero)
          (lambda (j-arg k-arg j<k-arg ih) (add1 ih)))))

    (claim result Nat)
    (define result (extract-smaller zero (add1 zero) proof-0<1))
    `;
    expect(() => evaluatePie(input)).not.toThrow();
  });
})

describe("Test subtyping", () => {
  it("Evaluate Bool (no params, no indices)", () => {
    const input =
      `
(data Subtype () ((T1 U) (T2 U))
  (refl ((T U))
    (Subtype () (T T)))
  (trans ((T1 U) (T2 U) (T3 U)
          (p1 (Subtype () (T1 T2)))
          (p2 (Subtype () (T2 T3))))
    (Subtype () (T1 T3)))
  ;; Generic injection: if there exists a function A -> B, then A <: B
  (inject ((A U) (B U) (f (-> A B)))
    (Subtype () (A B)))
  ind-Subtype)

(claim coerce
  (Pi ((A U) (B U))
    (-> (Subtype () (A B)) A B)))
(define coerce
  (lambda (A B proof val)
    ((ind-Subtype proof
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
  (add2-even ((k Nat) (k-even (Even () (k))))
    (Even () ((add1 (add1 k)))))
  ind-Even)

(claim even-to-nat
  (Pi ((n Nat))
    (-> (Even () (n)) Nat)))
(define even-to-nat
  (lambda (n proof)
    (ind-Even proof
      (lambda (m ev) Nat)
      zero
      (lambda (k prev ih) (add1 (add1 ih))))))

(claim even-subtype-nat
  (Pi ((n Nat))
    (Subtype () ((Even () (n)) Nat))))
(define even-subtype-nat
  (lambda (n)
    (inject (Even () (n)) Nat (even-to-nat n))))

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
    (-> (Even () (n)) Nat)))
(define double-even
  (lambda (n ev)
    (double (coerce (Even () (n)) Nat
                    (even-subtype-nat n)
                    ev))))


(claim even-four (Even () ((add1 (add1 (add1 (add1 zero)))))))
(define even-four
  (add2-even (add1 (add1 zero))
    (add2-even zero
      (zero-even))))

(claim result2 Nat)
(define result2 (double-even (add1 (add1 (add1 (add1 zero)))) even-four))
        `
    expect(() => evaluatePie(input)).not.toThrow();
  })
})
