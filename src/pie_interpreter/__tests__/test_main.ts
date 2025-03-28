import 'jest';

import { evaluatePie } from '../main'

describe("demos", () => {
  it("Flip pair", () => {
    const src = `(claim flip
                    (Π ((A U)
                        (D U))
                      (→ (Pair A D) (Pair D A))))
                  (define flip
                    (λ (A D)
                      (λ (p)
                        (cons (cdr p) (car p)))))
                  (flip Atom Atom (cons 'hello 'world))`;
    console.log(evaluatePie(src));
  });

  it("Addition over nats", () => {
    const src =  `(claim addNat
                    (-> Nat Nat Nat)) 
                  (define addNat 
                    (lambda (x y) 
                      (ind-Nat x 
                        (lambda (x) Nat)
                        y 
                        (lambda (n-1 ih) (add1 ih)))))
                  (addNat 3 4)
                  (addNat 3 0)`;
    console.log(evaluatePie(src));
  });

  it("construct vector", () => {
    const src =  `(claim more-expectations (Vec Atom 3))
                  (define more-expectations 
                      (vec:: 'need-induction
                          (vec:: 'understood-induction
                              (vec:: 'built-function vecnil))))`;
    console.log(evaluatePie(src));
  });
});