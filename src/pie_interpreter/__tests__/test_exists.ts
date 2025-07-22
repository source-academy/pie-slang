import 'jest';

import {evaluatePie} from '../main'

describe("demo", () => {
  it("Pie demo", () => {
    const src = 
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

(claim zero-is-even
(Even 0))

(define-tactically zero-is-even
((exists 0 x)
 (exact (same 0))))

`
    const result = evaluatePie(src);
    console.log(result);})
  })