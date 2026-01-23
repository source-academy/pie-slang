// prepends[i] is for chapter i + 2
const prepends = [
  `
(claim pearwise
  (→ Pear Pear
     Pear))

(define pearwise
  (λ (anjou bosc)
    (elim-Pear anjou
      (λ (a1 d1)
        (elim-Pear bosc
          (λ (a2 d2)
            (cons
              (a1 a2)
              (d1 d2))))))))
`,
  `(claim +
  (→ Nat Nat Nat))
(claim step-plus
  (→ Nat Nat))
(define step-plus
  (λ (n-1)
    (add1 n-1)))
(define +
  (λ (n j)
    (iter-Nat n
      j
      step-plus)))
(claim *
  (→ Nat Nat
      Nat))
(claim step-*
  (→ Nat Nat Nat
      Nat))

(define step-*
  (λ (j n-1 multn-1)
    (+ j multn-1)))

(define *
  (λ (n j)
    (rec-Nat n
      0
      (step-* j))))`,
];
