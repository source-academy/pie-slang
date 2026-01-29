import 'jest';

import { evaluatePie } from '../main'

describe("demo", () => {
  it("Pie demo", () => {
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

(claim twice=double
  (Π ((n Nat))
    (= Nat (twice n) (double n))))

(claim add1+=+add1
  (Π ((n Nat)
    (j Nat))
  (= Nat
    (add1 (+ n j))
    (+ n (add1 j)))))

(claim mot-add1+=+add1 (→ Nat Nat U ))
(define mot-add1+=+add1
  (λ (j k)
    (= Nat
    (add1 (+ k j))
    (+ k (add1 j)))))

(claim step-add1+=+add1
  (Π ((j Nat) (n-1 Nat))
    (→ (mot-add1+=+add1 j n-1)
      (mot-add1+=+add1 j (add1 n-1)))))

(define step-add1+=+add1
  (λ ( j n-1)
    (λ (add1+=+add1n-1)
        (cong add1+=+add1n-1
        (+ 1)))))

(define add1+=+add1
(λ (n j)
(ind-Nat n
(mot-add1+=+add1 j)
(same (add1 j))
(step-add1+=+add1 j))))

(claim mot-twice=double
(→ Nat
U ))
(define mot-twice=double
(λ (k)
(= Nat
(twice k)
(double k))))

(claim step-twice=double
(Π ((n-1 Nat))
(→ (mot-twice=double n-1)
(mot-twice=double (add1 n-1)))))

(claim mot-step-twice=double (→ Nat Nat U))

(define mot-step-twice=double
  (λ (n-1 k)
     (= Nat (add1 k)
            (add1 (add1 (double n-1))))))

(define step-twice=double
(λ (n-1)
(λ (twice=doublen-1)
(replace (add1+=+add1 n-1 n-1)
(mot-step-twice=double n-1)
(cong twice=doublen-1
(+ (add1 (add1 zero))))))))
      `
    const result = evaluatePie(src)
  })})