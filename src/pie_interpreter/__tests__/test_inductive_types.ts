import 'jest';

import { evaluatePie } from '../main'

describe("Bool_datatype", () => {
  const definition = 
  `(data Bool () ()
      (true () (Bool () ()))
      (false () (Bool () ()))
    ind-Bool)
  `
  
  it("Use Bool constructors", () => {
    const src = definition + 
    `
    (data-true)
    (data-false)
    `;
    console.log(evaluatePie(src));
  });

  it("Use Bool eliminator", () => {
    const src = definition +
    `
    (elim-Bool (data-true)
      (lambda (b) Nat)
      (add1 zero)
      zero)

(elim-Bool (data-false)
  (lambda (b) Nat)
  (add1 zero)
  zero)
`;
    console.log(evaluatePie(src));
  });

  it("Use Bool eliminator with wrapper function", () => {
    const src = definition + `
    (claim bool-to-nat (-> (type-Bool () ()) Nat))
    (define bool-to-nat
      (lambda (b)
        (elim-Bool b
          (lambda (x) Nat)
          (add1 zero)
          zero)))

(bool-to-nat (data-true))
(bool-to-nat (data-false))
`;
    console.log(evaluatePie(src));
  });
});

describe("LessThan_datatype", () => {
  const definition =
  `(data Less-Than () ((j Nat) (k Nat))
  (zero-smallest ((n Nat))
    (Less-Than () (zero (add1 n))))
  (add1-smaller ((j Nat) (k Nat) (j<k (Less-Than j k)))
    (Less-Than () ((add1 j) (add1 k))))
  ind-Less-Than)`
  it("Define Less-Than datatype with indices", () => {
    const src = definition
    console.log(evaluatePie(src));
  });

  it("Use Less-Than constructors", () => {
    const src = definition + 
    `
    (data-zero-smallest zero)
    (data-zero-smallest (add1 zero))
    (data-add1-smaller zero (add1 zero) (data-zero-smallest zero))`;
    console.log(evaluatePie(src));
  });

  it("Debug add1-smaller constructor", () => {
    const src = definition +
    `(data-add1-smaller zero (add1 zero) (data-zero-smallest zero))`;
    console.log(evaluatePie(src));
  });

  it("Use Less-Than with claim/define", () => {
    const src = definition +`
(claim proof-0<1 (type-Less-Than () (zero (add1 zero))))
(define proof-0<1 (data-zero-smallest zero))

(claim proof-1<2 (type-Less-Than () ((add1 zero) (add1 (add1 zero)))))
(define proof-1<2
  (data-add1-smaller zero (add1 zero) (data-zero-smallest zero)))
`;
    console.log(evaluatePie(src));
  });

  it("Use Less-Than eliminator with wrapper function", () => {
    const src = definition + `

(claim proof-0<1 (type-Less-Than () (zero (add1 zero))))
(define proof-0<1 (data-zero-smallest zero))

(claim extract-smaller
  (Pi ((j Nat) (k Nat))
    (-> (type-Less-Than () (j k)) Nat)))

(define extract-smaller
  (lambda (j k proof)
    (elim-Less-Than proof
      (lambda (j-idx k-idx p) Nat)
      (lambda (n) zero)
      (lambda (j-arg k-arg j<k-arg ih) (add1 ih)))))

(claim result-0 Nat)
(define result-0 (extract-smaller zero (add1 zero) proof-0<1))
`;
    console.log(evaluatePie(src));
  });

  it("Use extract-smaller on larger proof (returns non-zero)", () => {
    const src = `
(data Less-Than () ((j Nat) (k Nat))
  (zero-smallest ((n Nat))
    (Less-Than () (zero (add1 n))))
  (add1-smaller ((j Nat) (k Nat) (j<k (Less-Than j k)))
    (Less-Than (add1 j) (add1 k)))
  ind-Less-Than)

(claim extract-smaller
  (Pi ((j Nat) (k Nat))
    (-> (type-Less-Than () (j k)) Nat)))

(define extract-smaller
  (lambda (j k proof)
    (elim-Less-Than proof
      (lambda (j-idx k-idx p) Nat)
      (lambda (n) zero)
      (lambda (j-arg k-arg j<k-arg ih) (add1 ih)))))

(claim proof-2<4 (type-Less-Than () ((add1 (add1 zero)) (add1 (add1 (add1 (add1 zero)))))))
(define proof-2<4
  (data-add1-smaller
    (add1 zero)
    (add1 (add1 (add1 zero)))
    (data-add1-smaller
      zero
      (add1 (add1 zero))
      (data-zero-smallest (add1 zero)))))

(claim result-2 Nat)
(define result-2 (extract-smaller (add1 (add1 zero)) (add1 (add1 (add1 (add1 zero)))) proof-2<4))
`;
    console.log(evaluatePie(src));
  });
});
