import 'jest';

import {evaluatePie} from '../main'

describe("demo", () => {
  it("Basic", () => {
    const str = 
    `
(claim +
(→ Nat Nat
Nat))

(claim step-+
(→ Nat
Nat))
(define step-+
(λ ( +n-1)
(add1 +n-1 ) ))

(define +
(λ (n j)
(iter-Nat n
j
step-+ )))

(claim +1=add1
(Π ((n Nat))
(= Nat (+ 1 n) (add1 n))))

(define-tactically +1=add1
; test
 ((intro n)
  (exact (same (add1 n)))))
`
    console.log(evaluatePie(str));
  });
});

describe("EliminateTactic Tests", () => {
  
  it("Simple Nat elimination - prove n = n", () => {
    const str = 
    `
(claim n=n
  (Π ((n Nat))
    (= Nat n n)))

(define-tactically n=n
  ((intro n)
   (elim-Nat n)
   (then
     (exact (same zero)))             ; Solve base case
   (then
     (intro n-1)                     ; Introduce variables for step case
     (intro ih)
     (exact (same (add1 n-1))))))     ; Solve step case
`;
    console.log(evaluatePie(str));});

});
