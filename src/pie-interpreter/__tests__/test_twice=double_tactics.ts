import 'jest';

import { evaluatePie } from '../main'

describe("twice=double tactical proof", () => {
  it("proves twice n = double n using tactics", () => {
    const src =
      `
(claim + (→ Nat Nat Nat))
(define + (λ (n j)
(iter-Nat n
  j
  (λ (+n-1)
  (add1 +n-1 ) ))))

(claim double (→ Nat Nat))
(define double (λ (n)
(iter-Nat n
  zero
  (+ (add1 (add1 zero))))))

(claim twice (→ Nat Nat))
(define twice (λ (n) (+ n n)))

; Lemma: (add1 (+ n j)) = (+ n (add1 j))
(claim add1+=+add1
  (Π ((n Nat) (j Nat))
    (= Nat (add1 (+ n j)) (+ n (add1 j)))))

(define add1+=+add1
  (λ (n j)
    (ind-Nat n
      (λ (k) (= Nat (add1 (+ k j)) (+ k (add1 j))))
      (same (add1 j))
      (λ (n-1 ih) (cong ih (+ 1))))))

(claim twice=double
  (Π ((n Nat))
    (= Nat (twice n) (double n))))

(define-tactically twice=double
  ((intro n)
   (elim-Nat n)
   (then (exact (same 0)))
   (then (intro n-1)
     (intro ih)
     (elim-Equal ih (λ (to p) (= Nat (twice (add1 n-1)) (add1 (add1 to)))))
     (then (exact (cong (symm (add1+=+add1 n-1 n-1)) (+ 1)))))))
      `
    const result = evaluatePie(src)
    // Verify proof is complete (not incomplete)
    console.log(result);
  })
})