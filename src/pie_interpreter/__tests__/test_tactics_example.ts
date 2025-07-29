import 'jest'
import { evaluatePie } from '../main';

describe("examples", () => {
    it("even and odd", () => {
        const str =
        `
(claim +
  (→ Nat Nat
    Nat))

(claim step-plus
  (→ Nat
    Nat))

(define step-plus
  (λ (n-1)
    (add1 n-1 ) ))

(define +
  (λ (n j)
    (iter-Nat n
      j
      step-plus )))

(claim double
  (→ Nat
    Nat))

(define double
  (λ (n)
    (iter-Nat n
      0
      (+ 2))))


(claim Even
(→ Nat
U ))
(define Even
(λ (n)
(Σ ((half Nat))
(= Nat n (double half )))))

(claim Odd
(→ Nat
U ))
(define Odd
(λ (n)
(Σ ((haf Nat))
(= Nat n (add1 (double haf )))))) 

(claim zero-is-even
(Even 0))
(define zero-is-even
(cons 0
(same 0)))

(claim add1-even->odd
(Π ((n Nat))
(→ (Even n)
(Odd (add1 n)))))

(define add1-even->odd
(λ (n en)
(cons (car en)
(cong (cdr en) (+ 1)))))

(claim add1-odd->even
(Π ((n Nat))
(→ (Odd n)
(Even (add1 n)))))

(define add1-odd->even
(λ (n on)
(cons (add1 (car on))
(cong (cdr on) (+ 1)))))

(claim even-or-odd
(Π ((n Nat))
(Either (Even n) (Odd n))))

(claim mot-even-or-odd
(→ Nat
U )) 

(define mot-even-or-odd
(λ (k)
(Either (Even k) (Odd k))))

(claim step-even-or-odd
(Π ((n-1 Nat))
(→ (mot-even-or-odd n-1)
(mot-even-or-odd (add1 n-1)))))

(define step-even-or-odd
(λ (n-1)
(λ (e-or-on-1)
(ind-Either e-or-on-1
(λ (e-or-on-1)
(mot-even-or-odd
(add1 n-1)))
(λ (en-1)
(right
(add1-even->odd
n-1 en-1)))
(λ (on-1)
(left
(add1-odd->even
n-1 on-1)))))))

(define even-or-odd
(λ (n)
(ind-Nat n
mot-even-or-odd
(left zero-is-even)
step-even-or-odd)))


        `
        console.log(evaluatePie(str))
    })

    it("even and odd tactics", () => {
        const str =
        `
(claim +
  (→ Nat Nat
    Nat))

(claim step-plus
  (→ Nat
    Nat))

(define step-plus
  (λ (n-1)
    (add1 n-1 ) ))

(define +
  (λ (n j)
    (iter-Nat n
      j
      step-plus )))

(claim double
  (→ Nat
    Nat))

(define double
  (λ (n)
    (iter-Nat n
      0
      (+ 2))))


(claim Even
(→ Nat
U ))
(define Even
(λ (n)
(Σ ((half Nat))
(= Nat n (double half )))))

(claim Odd
(→ Nat
U ))
(define Odd
(λ (n)
(Σ ((haf Nat))
(= Nat n (add1 (double haf )))))) 

(claim zero-is-even
(Even 0))
(define zero-is-even
(cons 0
(same 0)))

(claim add1-even->odd
(Π ((n Nat))
(→ (Even n)
(Odd (add1 n)))))

(define add1-even->odd
(λ (n en)
(cons (car en)
(cong (cdr en) (+ 1)))))

(claim add1-odd->even
(Π ((n Nat))
(→ (Odd n)
(Even (add1 n)))))

(define add1-odd->even
(λ (n on)
(cons (add1 (car on))
(cong (cdr on) (+ 1)))))

(claim even-or-odd
(Π ((n Nat))
(Either (Even n) (Odd n))))

(claim mot-even-or-odd
(→ Nat
U )) 

(define mot-even-or-odd
(λ (k)
(Either (Even k) (Odd k))))

(define-tactically even-or-odd
  ( (intro n)
    (elimNat n mot-even-or-odd)
    (left)
    (exact zero-is-even)
    (intro n-1)
    (intro e-or-on-1)
    (elimEither e-or-on-1 (λ (e-or-on-1)
(mot-even-or-odd
(add1 n-1))))
    (intro xr)
    (right)
    (exact ((add1-even->odd n-1) xr))
    (intro x1)
    (left)
    (exact ((add1-odd->even n-1) x1))
   ))


        `
        console.log(evaluatePie(str))
    })
})