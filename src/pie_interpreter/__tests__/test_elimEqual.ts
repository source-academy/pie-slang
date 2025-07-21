import 'jest'
import { evaluatePie } from '../main';

describe("elimEqual", () => {
    it("Basic", () => {
        const str = `
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

(claim incr
(→ Nat
Nat))

(define incr
(λ (n)
(iter-Nat n
1
(+ 1))))

(claim incr=add1
(Π ((n Nat))
(= Nat (incr n) (add1 n))))

(claim base-incr=add1
(= Nat (incr zero) (add1 zero)))
(define base-incr=add1
(same (add1 zero)))

(claim mot-incr=add1
(→ Nat
U ))
(define mot-incr=add1
(λ (k)
(= Nat (incr k) (add1 k))))

(claim step-incr=add1
(Π ((n-1 Nat))
(→ (= Nat
(incr n-1)
(add1 n-1))
(= Nat
(add1
(incr n-1))
(add1
(add1 n-1))))))

(define step-incr=add1
  (λ (n-1)
    (λ (incr=add1n-1)
      (ind-= incr=add1n-1
        (λ (x)
          (λ (proof-incr-n-1=x)
            (= Nat (add1 (incr n-1)) (add1 x))))
        (same (add1 (incr n-1)))))))
        `;
        const output = evaluatePie(str);
        console.log(output);
    })

    it("Tactic", () => {
        const str = `
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

(claim incr
(→ Nat
Nat))

(define incr
(λ (n)
(iter-Nat n
1
(+ 1))))

(claim incr=add1
(Π ((n Nat))
(= Nat (incr n) (add1 n))))

(claim base-incr=add1
(= Nat (incr zero) (add1 zero)))
(define base-incr=add1
(same (add1 zero)))

(claim mot-incr=add1
(→ Nat
U ))
(define mot-incr=add1
(λ (k)
(= Nat (incr k) (add1 k))))

(claim step-incr=add1
(Π ((n-1 Nat))
(→ (= Nat
(incr n-1)
(add1 n-1))
(= Nat
(add1
(incr n-1))
(add1
(add1 n-1))))))

(define-tactically step-incr=add1
    ((intro n-1)
     (intro incr=add1n-1)
     (elimEqual incr=add1n-1 (λ (x)
          (λ (proof-incr-n-1=x)
            (= Nat (add1 (incr n-1)) (add1 x)))))
     (exact (same (add1 (incr n-1))))))
        `;
        const output = evaluatePie(str);
        console.log(output);
    })

    
})