import 'jest';

import { evaluatePie } from '../main'

describe("demo", () => {
    it("fact", () => {
        const src =
            `
    (claim add (-> Nat Nat Nat))
(define add (lambda (x y) (rec-Nat x y (lambda (n add-n-1) (add1 add-n-1)))))

(claim mult (-> Nat Nat Nat))
(define mult (lambda (x y) (rec-Nat x 0 (lambda (n mult-n-1) (add y mult-n-1)))))

(claim fact (-> Nat Nat))
(define fact
(lambda (n) (ind-Nat n (lambda (n) Nat)  (add1 0) (lambda (n fact-n-1) (mult (add1 n) fact-n-1)))))

(fact 5)`;
        console.log(evaluatePie(src));
    });

});
