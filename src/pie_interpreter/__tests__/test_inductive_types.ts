import 'jest';

import { evaluatePie } from '../main'

describe("Bool_datatype", () => {
  it("Define Bool datatype", () => {
    const src = `
(data Bool () ()
  (true () (Bool))
  (false () (Bool))
  ind-Bool)
`;
    console.log(evaluatePie(src));
  });

  it("Use Bool constructors", () => {
    const src = `
(data Bool () ()
  (true () (Bool))
  (false () (Bool))
  ind-Bool)

(data-true)
(data-false)
`;
    console.log(evaluatePie(src));
  });

  it("Use Bool eliminator", () => {
    const src = `
(data Bool () ()
  (true () (Bool))
  (false () (Bool))
  ind-Bool)

(data-ind-Bool (data-true)
  (lambda (b) Nat)
  (add1 zero)
  zero)

(data-ind-Bool (data-false)
  (lambda (b) Nat)
  (add1 zero)
  zero)
`;
    console.log(evaluatePie(src));
  });

  it("Use Bool eliminator with wrapper function", () => {
    const src = `
(data Bool () ()
  (true () (Bool))
  (false () (Bool))
  ind-Bool)

(claim bool-to-nat (-> Bool Nat))
(define bool-to-nat
  (lambda (b)
    (data-ind-Bool b
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
  it("Define Less-Than datatype with indices", () => {
    const src = `
(data Less-Than () ((j Nat) (k Nat))
  (zero-smallest ((n Nat))
    (Less-Than zero (add1 n)))
  (add1-smaller ((j Nat) (k Nat) (j<k (Less-Than j k)))
    (Less-Than (add1 j) (add1 k)))
  ind-Less-Than)
`;
    console.log(evaluatePie(src));
  });

  it("Use Less-Than constructors", () => {
    const src = `
(data Less-Than () ((j Nat) (k Nat))
  (zero-smallest ((n Nat))
    (Less-Than zero (add1 n)))
  (add1-smaller ((j Nat) (k Nat) (j<k (Less-Than j k)))
    (Less-Than (add1 j) (add1 k)))
  ind-Less-Than)

(data-zero-smallest zero)
(data-zero-smallest (add1 zero))
(data-add1-smaller zero (add1 zero) (data-zero-smallest zero))
`;
    console.log(evaluatePie(src));
  });

  it("Debug add1-smaller constructor", () => {
    const src = `
(data Less-Than () ((j Nat) (k Nat))
  (zero-smallest ((n Nat))
    (Less-Than zero (add1 n)))
  (add1-smaller ((j Nat) (k Nat) (j<k (Less-Than j k)))
    (Less-Than (add1 j) (add1 k)))
  ind-Less-Than)

(data-add1-smaller zero (add1 zero) (data-zero-smallest zero))
`;
    console.log(evaluatePie(src));
  });

  it("Use Less-Than with claim/define", () => {
    const src = `
(data Less-Than () ((j Nat) (k Nat))
  (zero-smallest ((n Nat))
    (Less-Than zero (add1 n)))
  (add1-smaller ((j Nat) (k Nat) (j<k (Less-Than j k)))
    (Less-Than (add1 j) (add1 k)))
  ind-Less-Than)

(claim proof-0<1 (Less-Than zero (add1 zero)))
(define proof-0<1 (data-zero-smallest zero))

(claim proof-1<2 (Less-Than (add1 zero) (add1 (add1 zero))))
(define proof-1<2
  (data-add1-smaller zero (add1 zero) (data-zero-smallest zero)))
`;
    console.log(evaluatePie(src));
  });

  it("Use Less-Than eliminator with wrapper function", () => {
    const src = `
(data Less-Than () ((j Nat) (k Nat))
  (zero-smallest ((n Nat))
    (Less-Than zero (add1 n)))
  (add1-smaller ((j Nat) (k Nat) (j<k (Less-Than j k)))
    (Less-Than (add1 j) (add1 k)))
  ind-Less-Than)

(claim proof-0<1 (Less-Than zero (add1 zero)))
(define proof-0<1 (data-zero-smallest zero))

(claim extract-smaller
  (Pi ((j Nat) (k Nat))
    (-> (Less-Than j k) Nat)))

(define extract-smaller
  (lambda (j k proof)
    (data-ind-Less-Than proof
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
    (Less-Than zero (add1 n)))
  (add1-smaller ((j Nat) (k Nat) (j<k (Less-Than j k)))
    (Less-Than (add1 j) (add1 k)))
  ind-Less-Than)

(claim extract-smaller
  (Pi ((j Nat) (k Nat))
    (-> (Less-Than j k) Nat)))

(define extract-smaller
  (lambda (j k proof)
    (data-ind-Less-Than proof
      (lambda (j-idx k-idx p) Nat)
      (lambda (n) zero)
      (lambda (j-arg k-arg j<k-arg ih) (add1 ih)))))

(claim proof-2<4 (Less-Than (add1 (add1 zero)) (add1 (add1 (add1 (add1 zero))))))
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
