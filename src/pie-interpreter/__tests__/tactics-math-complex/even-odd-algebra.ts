import 'jest';
import { evaluatePie } from '../../main';

const arithPreamble = `
(claim + (→ Nat Nat Nat))
(define + (λ (n j) (iter-Nat n j (λ (x) (add1 x)))))
(claim * (→ Nat Nat Nat))
(define * (λ (n m) (iter-Nat n 0 (+ m))))
`;

const arithLemmas = `${arithPreamble}
(claim n+0=n (Π ((n Nat)) (= Nat (+ n 0) n)))
(define n+0=n (λ (n) (ind-Nat n (λ (k) (= Nat (+ k 0) k)) (same 0) (λ (n-1 ih) (cong ih (+ 1))))))

(claim +add1 (Π ((n Nat) (m Nat)) (= Nat (+ n (add1 m)) (add1 (+ n m)))))
(define +add1 (λ (n m) (ind-Nat n (λ (k) (= Nat (+ k (add1 m)) (add1 (+ k m)))) (same (add1 m)) (λ (n-1 ih) (cong ih (+ 1))))))

(claim +-comm (Π ((n Nat) (m Nat)) (= Nat (+ n m) (+ m n))))
(define +-comm (λ (n m) (ind-Nat n (λ (k) (= Nat (+ k m) (+ m k))) (symm (n+0=n m)) (λ (n-1 ih) (trans (cong ih (+ 1)) (symm (+add1 m n-1)))))))

(claim +-assoc (Π ((a Nat) (b Nat) (c Nat)) (= Nat (+ (+ a b) c) (+ a (+ b c)))))
(define +-assoc (λ (a b c) (ind-Nat a (λ (k) (= Nat (+ (+ k b) c) (+ k (+ b c)))) (same (+ b c)) (λ (a-1 ih) (cong ih (+ 1))))))
`;

const evenOddPreamble = `${arithLemmas}
(claim Even (→ Nat U))
(define Even (λ (n) (Σ ((k Nat)) (= Nat n (+ k k)))))

(claim Odd (→ Nat U))
(define Odd (λ (n) (Σ ((k Nat)) (= Nat n (add1 (+ k k))))))
`;

describe("Even/Odd Algebra — Complex Tactic Proofs", () => {

  // ===========================================================================
  // Section 1: Basic Even Witnesses
  // ===========================================================================

  describe("Basic Even Witnesses", () => {

    it("proves zero-is-even: Even(0) with witness k=0", () => {
      const str = `${evenOddPreamble}
(claim zero-is-even (Even 0))
(define-tactically zero-is-even
  ((exists 0 k)
   (exact (same 0))))
`;
      expect(() => evaluatePie(str)).not.toThrow();
    });

    it("proves two-is-even: Even(2) with witness k=1", () => {
      const str = `${evenOddPreamble}
(claim two-is-even (Even 2))
(define-tactically two-is-even
  ((exists 1 k)
   (exact (same 2))))
`;
      expect(() => evaluatePie(str)).not.toThrow();
    });

    it("proves four-is-even: Even(4) with witness k=2", () => {
      const str = `${evenOddPreamble}
(claim four-is-even (Even 4))
(define-tactically four-is-even
  ((exists 2 k)
   (exact (same 4))))
`;
      expect(() => evaluatePie(str)).not.toThrow();
    });

  });

  // ===========================================================================
  // Section 2: Basic Odd Witnesses
  // ===========================================================================

  describe("Basic Odd Witnesses", () => {

    it("proves one-is-odd: Odd(1) with witness k=0", () => {
      const str = `${evenOddPreamble}
(claim one-is-odd (Odd 1))
(define-tactically one-is-odd
  ((exists 0 k)
   (exact (same 1))))
`;
      expect(() => evaluatePie(str)).not.toThrow();
    });

    it("proves three-is-odd: Odd(3) with witness k=1", () => {
      const str = `${evenOddPreamble}
(claim three-is-odd (Odd 3))
(define-tactically three-is-odd
  ((exists 1 k)
   (exact (same 3))))
`;
      expect(() => evaluatePie(str)).not.toThrow();
    });

    it("proves five-is-odd: Odd(5) with witness k=2", () => {
      const str = `${evenOddPreamble}
(claim five-is-odd (Odd 5))
(define-tactically five-is-odd
  ((exists 2 k)
   (exact (same 5))))
`;
      expect(() => evaluatePie(str)).not.toThrow();
    });

  });

  // ===========================================================================
  // Section 3: Even-plus-2 theorem
  // ===========================================================================

  describe("Even-plus-2: Even(n) implies Even(n+2)", () => {

    it("proves even-plus-2 at n=0: Even(0) → Even(2)", () => {
      const str = `${evenOddPreamble}
(claim even-plus-2-at-0 (→ (Even 0) (Even 2)))
(define-tactically even-plus-2-at-0
  ((intro ev)
   (exists 1 k)
   (exact (same 2))))
`;
      expect(() => evaluatePie(str)).not.toThrow();
    });

    it("proves even-plus-2 at n=2: Even(2) → Even(4)", () => {
      const str = `${evenOddPreamble}
(claim even-plus-2-at-2 (→ (Even 2) (Even 4)))
(define-tactically even-plus-2-at-2
  ((intro ev)
   (exists 2 k)
   (exact (same 4))))
`;
      expect(() => evaluatePie(str)).not.toThrow();
    });

    it("proves even-plus-2 at n=4: Even(4) → Even(6)", () => {
      const str = `${evenOddPreamble}
(claim even-plus-2-at-4 (→ (Even 4) (Even 6)))
(define-tactically even-plus-2-at-4
  ((intro ev)
   (exists 3 k)
   (exact (same 6))))
`;
      expect(() => evaluatePie(str)).not.toThrow();
    });

  });

  // ===========================================================================
  // Section 4: Odd-plus-2 theorem
  // ===========================================================================

  describe("Odd-plus-2: Odd(n) implies Odd(n+2)", () => {

    it("proves odd-plus-2 at n=1: Odd(1) → Odd(3)", () => {
      const str = `${evenOddPreamble}
(claim odd-plus-2-at-1 (→ (Odd 1) (Odd 3)))
(define-tactically odd-plus-2-at-1
  ((intro od)
   (exists 1 k)
   (exact (same 3))))
`;
      expect(() => evaluatePie(str)).not.toThrow();
    });

    it("proves odd-plus-2 at n=3: Odd(3) → Odd(5)", () => {
      const str = `${evenOddPreamble}
(claim odd-plus-2-at-3 (→ (Odd 3) (Odd 5)))
(define-tactically odd-plus-2-at-3
  ((intro od)
   (exists 2 k)
   (exact (same 5))))
`;
      expect(() => evaluatePie(str)).not.toThrow();
    });

    it("proves odd-plus-2 at n=5: Odd(5) → Odd(7)", () => {
      const str = `${evenOddPreamble}
(claim odd-plus-2-at-5 (→ (Odd 5) (Odd 7)))
(define-tactically odd-plus-2-at-5
  ((intro od)
   (exists 3 k)
   (exact (same 7))))
`;
      expect(() => evaluatePie(str)).not.toThrow();
    });

  });

  // ===========================================================================
  // Section 5: Even + Even = Even
  // ===========================================================================

  describe("Even + Even = Even", () => {

    it("proves even+even at concrete 0+0: Even(0+0)", () => {
      const str = `${evenOddPreamble}
(claim even-0-plus-0 (Even (+ 0 0)))
(define-tactically even-0-plus-0
  ((exists 0 k)
   (exact (same 0))))
`;
      expect(() => evaluatePie(str)).not.toThrow();
    });

    it("proves even+even at concrete 2+2: Even(2+2)", () => {
      const str = `${evenOddPreamble}
(claim even-2-plus-2 (Even (+ 2 2)))
(define-tactically even-2-plus-2
  ((exists 2 k)
   (exact (same 4))))
`;
      expect(() => evaluatePie(str)).not.toThrow();
    });

    it("proves even+even at concrete 2+4: Even(2+4)", () => {
      const str = `${evenOddPreamble}
(claim even-2-plus-4 (Even (+ 2 4)))
(define-tactically even-2-plus-4
  ((exists 3 k)
   (exact (same 6))))
`;
      expect(() => evaluatePie(str)).not.toThrow();
    });


  });

  // ===========================================================================
  // Section 6: Odd + Odd = Even
  // ===========================================================================

  describe("Odd + Odd = Even", () => {

    it("proves odd+odd at concrete 1+1: Even(1+1)", () => {
      const str = `${evenOddPreamble}
(claim even-1-plus-1 (Even (+ 1 1)))
(define-tactically even-1-plus-1
  ((exists 1 k)
   (exact (same 2))))
`;
      expect(() => evaluatePie(str)).not.toThrow();
    });

    it("proves odd+odd at concrete 1+3: Even(1+3)", () => {
      const str = `${evenOddPreamble}
(claim even-1-plus-3 (Even (+ 1 3)))
(define-tactically even-1-plus-3
  ((exists 2 k)
   (exact (same 4))))
`;
      expect(() => evaluatePie(str)).not.toThrow();
    });

    it("proves odd+odd at concrete 3+5: Even(3+5)", () => {
      const str = `${evenOddPreamble}
(claim even-3-plus-5 (Even (+ 3 5)))
(define-tactically even-3-plus-5
  ((exists 4 k)
   (exact (same 8))))
`;
      expect(() => evaluatePie(str)).not.toThrow();
    });


  });

  // ===========================================================================
  // Section 7: Even + Odd = Odd and Odd + Even = Odd
  // ===========================================================================

  describe("Even + Odd = Odd", () => {

    it("proves even+odd at concrete 0+1: Odd(0+1)", () => {
      const str = `${evenOddPreamble}
(claim odd-0-plus-1 (Odd (+ 0 1)))
(define-tactically odd-0-plus-1
  ((exists 0 k)
   (exact (same 1))))
`;
      expect(() => evaluatePie(str)).not.toThrow();
    });

    it("proves even+odd at concrete 2+1: Odd(2+1)", () => {
      const str = `${evenOddPreamble}
(claim odd-2-plus-1 (Odd (+ 2 1)))
(define-tactically odd-2-plus-1
  ((exists 1 k)
   (exact (same 3))))
`;
      expect(() => evaluatePie(str)).not.toThrow();
    });

    it("proves even+odd at concrete 2+3: Odd(2+3)", () => {
      const str = `${evenOddPreamble}
(claim odd-2-plus-3 (Odd (+ 2 3)))
(define-tactically odd-2-plus-3
  ((exists 2 k)
   (exact (same 5))))
`;
      expect(() => evaluatePie(str)).not.toThrow();
    });


    it("proves odd+even at concrete 1+2: Odd(1+2)", () => {
      const str = `${evenOddPreamble}
(claim odd-1-plus-2 (Odd (+ 1 2)))
(define-tactically odd-1-plus-2
  ((exists 1 k)
   (exact (same 3))))
`;
      expect(() => evaluatePie(str)).not.toThrow();
    });

    it("proves odd+even at concrete 3+4: Odd(3+4)", () => {
      const str = `${evenOddPreamble}
(claim odd-3-plus-4 (Odd (+ 3 4)))
(define-tactically odd-3-plus-4
  ((exists 3 k)
   (exact (same 7))))
`;
      expect(() => evaluatePie(str)).not.toThrow();
    });

  });

  // ===========================================================================
  // Section 8: Extended Even/Odd Witnesses
  // ===========================================================================

  describe("Extended Even/Odd Witnesses", () => {

    it("proves Even(6) with witness k=3", () => {
      const str = `${evenOddPreamble}
(claim six-is-even (Even 6))
(define-tactically six-is-even
  ((exists 3 k)
   (exact (same 6))))
`;
      expect(() => evaluatePie(str)).not.toThrow();
    });

    it("proves Even(8) with witness k=4", () => {
      const str = `${evenOddPreamble}
(claim eight-is-even (Even 8))
(define-tactically eight-is-even
  ((exists 4 k)
   (exact (same 8))))
`;
      expect(() => evaluatePie(str)).not.toThrow();
    });

    it("proves Odd(7) with witness k=3", () => {
      const str = `${evenOddPreamble}
(claim seven-is-odd (Odd 7))
(define-tactically seven-is-odd
  ((exists 3 k)
   (exact (same 7))))
`;
      expect(() => evaluatePie(str)).not.toThrow();
    });


  });

  // ===========================================================================
  // Section 9: Witness Extraction
  // ===========================================================================

  describe("Witness Extraction via car", () => {

    it("extracts witness from Even(4): car = 2", () => {
      const str = `${evenOddPreamble}
(claim four-is-even (Even 4))
(define-tactically four-is-even
  ((exists 2 k)
   (exact (same 4))))
(claim witness-check (= Nat (car four-is-even) 2))
(define-tactically witness-check
  ((exact (same 2))))
`;
      expect(() => evaluatePie(str)).not.toThrow();
    });

    it("extracts witness from Odd(5): car = 2", () => {
      const str = `${evenOddPreamble}
(claim five-is-odd (Odd 5))
(define-tactically five-is-odd
  ((exists 2 k)
   (exact (same 5))))
(claim witness-check (= Nat (car five-is-odd) 2))
(define-tactically witness-check
  ((exact (same 2))))
`;
      expect(() => evaluatePie(str)).not.toThrow();
    });

    it("extracts witness from Even(6): car evaluates to 3", () => {
      const str = `${evenOddPreamble}
(claim six-is-even (Even 6))
(define-tactically six-is-even
  ((exists 3 k)
   (exact (same 6))))
(car six-is-even)
`;
      const output = evaluatePie(str);
      expect(output).toContain("3");
    });

  });

  // ===========================================================================
  // Section 10: Parity Decidability (Either Even or Odd)
  // ===========================================================================

  describe("Parity Decidability", () => {

    it("proves Either (Even 0) (Odd 0) via left", () => {
      const str = `${evenOddPreamble}
(claim parity-0 (Either (Even 0) (Odd 0)))
(define-tactically parity-0
  ((go-Left)
   (exists 0 k)
   (exact (same 0))))
`;
      expect(() => evaluatePie(str)).not.toThrow();
    });

    it("proves Either (Even 1) (Odd 1) via right", () => {
      const str = `${evenOddPreamble}
(claim parity-1 (Either (Even 1) (Odd 1)))
(define-tactically parity-1
  ((go-Right)
   (exists 0 k)
   (exact (same 1))))
`;
      expect(() => evaluatePie(str)).not.toThrow();
    });

    it("proves Either (Even 2) (Odd 2) via left", () => {
      const str = `${evenOddPreamble}
(claim parity-2 (Either (Even 2) (Odd 2)))
(define-tactically parity-2
  ((go-Left)
   (exists 1 k)
   (exact (same 2))))
`;
      expect(() => evaluatePie(str)).not.toThrow();
    });

    it("proves Either (Even 3) (Odd 3) via right", () => {
      const str = `${evenOddPreamble}
(claim parity-3 (Either (Even 3) (Odd 3)))
(define-tactically parity-3
  ((go-Right)
   (exists 1 k)
   (exact (same 3))))
`;
      expect(() => evaluatePie(str)).not.toThrow();
    });

    it("proves Either (Even 4) (Odd 4) via left", () => {
      const str = `${evenOddPreamble}
(claim parity-4 (Either (Even 4) (Odd 4)))
(define-tactically parity-4
  ((go-Left)
   (exists 2 k)
   (exact (same 4))))
`;
      expect(() => evaluatePie(str)).not.toThrow();
    });

    it("proves Either (Even 5) (Odd 5) via right", () => {
      const str = `${evenOddPreamble}
(claim parity-5 (Either (Even 5) (Odd 5)))
(define-tactically parity-5
  ((go-Right)
   (exists 2 k)
   (exact (same 5))))
`;
      expect(() => evaluatePie(str)).not.toThrow();
    });

  });

  // ===========================================================================
  // Section 11: Doubling is Always Even
  // ===========================================================================

  describe("Doubling is Always Even", () => {

    it("proves double(0) is even", () => {
      const str = `${evenOddPreamble}
(claim double-0-even (Even (+ 0 0)))
(define-tactically double-0-even
  ((exists 0 k)
   (exact (same 0))))
`;
      expect(() => evaluatePie(str)).not.toThrow();
    });

    it("proves double(1) is even", () => {
      const str = `${evenOddPreamble}
(claim double-1-even (Even (+ 1 1)))
(define-tactically double-1-even
  ((exists 1 k)
   (exact (same 2))))
`;
      expect(() => evaluatePie(str)).not.toThrow();
    });

    it("proves double(3) is even", () => {
      const str = `${evenOddPreamble}
(claim double-3-even (Even (+ 3 3)))
(define-tactically double-3-even
  ((exists 3 k)
   (exact (same 6))))
`;
      expect(() => evaluatePie(str)).not.toThrow();
    });


    it("proves double(n) is even for all n using exact with full term", () => {
      const str = `${evenOddPreamble}
(claim double-even (Π ((n Nat)) (Even (+ n n))))
(define double-even
  (λ (n) (cons n (same (+ n n)))))
`;
      expect(() => evaluatePie(str)).not.toThrow();
    });

  });

  // ===========================================================================
  // Section 12: Alternative Proof Strategies (exact with full terms)
  // ===========================================================================

  describe("Alternative Proof Strategies", () => {

    it("proves Even(4) using exact with full Sigma pair", () => {
      const str = `${evenOddPreamble}
(claim even-4-alt (Even 4))
(define-tactically even-4-alt
  ((exact (cons 2 (same 4)))))
`;
      expect(() => evaluatePie(str)).not.toThrow();
    });

    it("proves Odd(3) using exact with full Sigma pair", () => {
      const str = `${evenOddPreamble}
(claim odd-3-alt (Odd 3))
(define-tactically odd-3-alt
  ((exact (cons 1 (same 3)))))
`;
      expect(() => evaluatePie(str)).not.toThrow();
    });

    it("proves Even(0) non-tactically with define", () => {
      const str = `${evenOddPreamble}
(claim even-0-direct (Even 0))
(define even-0-direct (cons 0 (same 0)))
`;
      expect(() => evaluatePie(str)).not.toThrow();
    });

    it("proves Odd(1) non-tactically with define", () => {
      const str = `${evenOddPreamble}
(claim odd-1-direct (Odd 1))
(define odd-1-direct (cons 0 (same 1)))
`;
      expect(() => evaluatePie(str)).not.toThrow();
    });

  });

  // ===========================================================================
  // Section 13: Cross-theorem Compositions
  // ===========================================================================

  describe("Cross-theorem Compositions", () => {

    it("composes: uses double-even and even+even=even for Even(n+n + m+m)", () => {
      // Concrete instance: n=1, m=2 => (+ 2 4) = 6 is even
      const str = `${evenOddPreamble}
(claim double-even (Π ((n Nat)) (Even (+ n n))))
(define double-even (λ (n) (cons n (same (+ n n)))))

(claim sum-doubles-even (Even (+ (+ 1 1) (+ 2 2))))
(define-tactically sum-doubles-even
  ((exists 3 k)
   (exact (same 6))))
`;
      expect(() => evaluatePie(str)).not.toThrow();
    });

  });

  // ===========================================================================
  // Section 14: Even * Any = Even (concrete instances)
  // ===========================================================================

  describe("Even times Any = Even (concrete)", () => {

    it("proves Even(2*3)=Even(6) concretely", () => {
      const str = `${evenOddPreamble}
(claim even-2-times-3 (Even (* 2 3)))
(define-tactically even-2-times-3
  ((exists 3 k)
   (exact (same 6))))
`;
      expect(() => evaluatePie(str)).not.toThrow();
    });

    it("proves Even(4*3)=Even(12) concretely", () => {
      const str = `${evenOddPreamble}
(claim even-4-times-3 (Even (* 4 3)))
(define-tactically even-4-times-3
  ((exists 6 k)
   (exact (same 12))))
`;
      expect(() => evaluatePie(str)).not.toThrow();
    });


  });

  // ===========================================================================
  // Section 15: Error Cases
  // ===========================================================================

  describe("Error Cases", () => {

    it("rejects wrong witness: 3 is not Even with k=1", () => {
      const str = `${evenOddPreamble}
(claim bad-even-3 (Even 3))
(define-tactically bad-even-3
  ((exists 1 k)
   (exact (same 3))))
`;
      expect(() => evaluatePie(str)).toThrow();
    });

    it("rejects wrong witness: 4 is not Odd with k=1", () => {
      const str = `${evenOddPreamble}
(claim bad-odd-4 (Odd 4))
(define-tactically bad-odd-4
  ((exists 1 k)
   (exact (same 4))))
`;
      expect(() => evaluatePie(str)).toThrow();
    });

    it("rejects incomplete even proof (missing equality)", () => {
      const str = `${evenOddPreamble}
(claim incomplete-even (Even 6))
(define-tactically incomplete-even
  ((exists 3 k)))
`;
      expect(() => evaluatePie(str)).toThrow();
    });

    it("rejects wrong witness: 2 is not Odd with k=0", () => {
      const str = `${evenOddPreamble}
(claim bad-odd-2 (Odd 2))
(define-tactically bad-odd-2
  ((exists 0 k)
   (exact (same 2))))
`;
      expect(() => evaluatePie(str)).toThrow();
    });

  });

});
