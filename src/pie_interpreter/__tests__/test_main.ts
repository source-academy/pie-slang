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
  it("construct vector through replicate function", () => {
    const src =  
    `
    (claim mot-replicate (-> U Nat U))
    (define mot-replicate (lambda (E k) (Vec E k)))
    (claim step-replicate 
      (Pi ((E U) (e E) (l-1 Nat)) 
        (-> (mot-replicate E l-1) (mot-replicate E (add1 l-1)))))
    (define step-replicate 
      (lambda (E e l-1)
        (lambda (step-l-1)
          (vec:: e step-l-1))))
    (claim replicate
      (Pi ((E U) (len Nat)) 
          (-> E (Vec E len))))
    (define replicate
      (lambda (E l)
          (lambda (e) 
            (ind-Nat l
            (mot-replicate E)
            vecnil
            (step-replicate E e)))))
    (replicate Atom 3 'caonima)`;
    console.log(evaluatePie(src));
  });

  it("list length", () => {
    const src =  
    `
    (claim step-replicate 
      (Pi ((E U) (e E) (l-1 Nat)) 
        (-> (mot-replicate E l-1) (mot-replicate E (add1 l-1)))))
    (define step-replicate 
      (lambda (E e l-1)
        (lambda (step-l-1)
          (vec:: e step-l-1))))
    (claim replicate
      (Pi ((E U) (len Nat)) 
          (-> E (Vec E len))))
    (define replicate
      (lambda (E l)
          (lambda (e) 
            (ind-Nat l
            (mot-replicate E)
            vecnil
            (step-replicate E e)))))
    (replicate Atom 3 'caonima)`;
    console.log(evaluatePie(src));
  });
  
});