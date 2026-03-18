import 'jest';
import { evaluatePie } from '../../main';

const arithPreamble = `
(claim + (-> Nat Nat Nat))
(define + (lambda (n j) (iter-Nat n j (lambda (x) (add1 x)))))
(claim * (-> Nat Nat Nat))
(define * (lambda (n m) (iter-Nat n 0 (+ m))))
`;

// ---------------------------------------------------------------------------
// Discrimination preamble: pred + zero-not-succ + succ-not-zero + add1-injective
// ---------------------------------------------------------------------------

const discrimPreamble = `${arithPreamble}
(claim pred (-> Nat Nat))
(define pred (lambda (n) (which-Nat n 0 (lambda (n-1) n-1))))

(claim zero-not-succ
  (Pi ((n Nat)) (-> (= Nat 0 (add1 n)) Absurd)))
(define-tactically zero-not-succ
  ((intro n) (intro eq)
   (exact (replace eq (lambda (x) (which-Nat x Trivial (lambda (k) Absurd))) sole))))

(claim succ-not-zero
  (Pi ((n Nat)) (-> (= Nat (add1 n) 0) Absurd)))
(define-tactically succ-not-zero
  ((intro n) (intro eq)
   (exact (replace (symm eq) (lambda (x) (which-Nat x Trivial (lambda (k) Absurd))) sole))))

(claim add1-injective
  (Pi ((n Nat) (m Nat)) (-> (= Nat (add1 n) (add1 m)) (= Nat n m))))
(define-tactically add1-injective
  ((intro n) (intro m) (intro eq)
   (exact (cong eq pred))))
`;

// ---------------------------------------------------------------------------
// Min/Max/Monus preamble
// ---------------------------------------------------------------------------

const monusPreamble = `${arithPreamble}
(claim pred (-> Nat Nat))
(define pred (lambda (n) (which-Nat n 0 (lambda (n-1) n-1))))

(claim monus (-> Nat Nat Nat))
(define monus (lambda (n m) (iter-Nat m n pred)))

(claim min (-> Nat Nat Nat))
(define min (lambda (a b) (monus a (monus a b))))

(claim max (-> Nat Nat Nat))
(define max (lambda (a b) (+ b (monus a b))))

(claim n+0=n (Pi ((n Nat)) (= Nat (+ n 0) n)))
(define-tactically n+0=n
  ((intro n) (elim-Nat n)
   (then (exact (same 0)))
   (then (intro n-1) (intro ih) (exact (cong ih (+ 1))))))
`;

// ---------------------------------------------------------------------------
// Modular arithmetic preamble
// ---------------------------------------------------------------------------

const mod2Preamble = `${arithPreamble}
(claim mod2 (-> Nat Nat))
(define mod2 (lambda (n) (iter-Nat n 0 (lambda (prev) (which-Nat prev 1 (lambda (k) 0))))))
`;

// ---------------------------------------------------------------------------
// Bool preamble (Either Trivial Trivial)
// ---------------------------------------------------------------------------

const boolPreamble = `
(claim Bool U)
(define Bool (Either Trivial Trivial))
(claim true Bool)
(define true (left sole))
(claim false Bool)
(define false (right sole))

(claim bool-to-nat (-> Bool Nat))
(define bool-to-nat
  (lambda (b) (ind-Either b (lambda (x) Nat) (lambda (l) 1) (lambda (r) 0))))
`;

// ===========================================================================
// Tests
// ===========================================================================

describe("Complex Decidability, Modular Arithmetic, and Min/Max/Monus Properties", () => {

  // =========================================================================
  // Section 1: Decidability / Discrimination
  // =========================================================================

  describe("Section 1: Decidability and Discrimination", () => {

    // 1. zero-not-succ
    it("1. zero-not-succ: 0 is not equal to any successor", () => {
      const str = `${arithPreamble}
(claim zero-not-succ
  (Pi ((n Nat)) (-> (= Nat 0 (add1 n)) Absurd)))
(define-tactically zero-not-succ
  ((intro n) (intro eq)
   (exact (replace eq (lambda (x) (which-Nat x Trivial (lambda (k) Absurd))) sole))))
`;
      expect(() => evaluatePie(str)).not.toThrow();
    });

    // 2. succ-not-zero
    it("2. succ-not-zero: no successor equals zero", () => {
      const str = `${arithPreamble}
(claim succ-not-zero
  (Pi ((n Nat)) (-> (= Nat (add1 n) 0) Absurd)))
(define-tactically succ-not-zero
  ((intro n) (intro eq)
   (exact (replace (symm eq) (lambda (x) (which-Nat x Trivial (lambda (k) Absurd))) sole))))
`;
      expect(() => evaluatePie(str)).not.toThrow();
    });

    // 3. add1-injective
    it("3. add1-injective: successor is injective via cong with pred", () => {
      const str = `${arithPreamble}
(claim pred (-> Nat Nat))
(define pred (lambda (n) (which-Nat n 0 (lambda (n-1) n-1))))

(claim add1-injective
  (Pi ((n Nat) (m Nat)) (-> (= Nat (add1 n) (add1 m)) (= Nat n m))))
(define-tactically add1-injective
  ((intro n) (intro m) (intro eq)
   (exact (cong eq pred))))
`;
      expect(() => evaluatePie(str)).not.toThrow();
    });

    // 4. zero-not-one: concrete instance
    it("4. zero-not-one: 0 ≠ 1", () => {
      const str = `${arithPreamble}
(claim zero-not-one (-> (= Nat 0 1) Absurd))
(define-tactically zero-not-one
  ((intro eq)
   (exact (replace eq (lambda (x) (which-Nat x Trivial (lambda (k) Absurd))) sole))))
`;
      expect(() => evaluatePie(str)).not.toThrow();
    });

    // 5. zero-not-two: concrete instance
    it("5. zero-not-two: 0 ≠ 2", () => {
      const str = `${arithPreamble}
(claim zero-not-two (-> (= Nat 0 2) Absurd))
(define-tactically zero-not-two
  ((intro eq)
   (exact (replace eq (lambda (x) (which-Nat x Trivial (lambda (k) Absurd))) sole))))
`;
      expect(() => evaluatePie(str)).not.toThrow();
    });

    // 6. one-not-two: uses add1-injective to reduce to 0≠1
    it("6. one-not-two: 1 ≠ 2 via add1-injective then zero-not-succ", () => {
      const str = `${discrimPreamble}
(claim one-not-two (-> (= Nat 1 2) Absurd))
(define-tactically one-not-two
  ((intro eq)
   (exact (zero-not-succ 0 (add1-injective 0 1 eq)))))
`;
      expect(() => evaluatePie(str)).not.toThrow();
    });

    // 7. nat-succ-neq-self: n ≠ add1(n) by induction
    it("7. nat-succ-neq-self: no natural number equals its own successor", () => {
      const str = `${discrimPreamble}
(claim nat-succ-neq-self
  (Pi ((n Nat)) (-> (= Nat n (add1 n)) Absurd)))
(define-tactically nat-succ-neq-self
  ((intro n) (elim-Nat n)
   (then
     (intro eq)
     (exact (zero-not-succ 0 eq)))
   (then
     (intro n-1)
     (intro ih)
     (intro eq)
     (exact (ih (add1-injective n-1 (add1 n-1) eq))))))
`;
      expect(() => evaluatePie(str)).not.toThrow();
    });

    // 8. two-not-zero: concrete 2 ≠ 0
    it("8. two-not-zero: 2 ≠ 0", () => {
      const str = `${arithPreamble}
(claim two-not-zero (-> (= Nat 2 0) Absurd))
(define-tactically two-not-zero
  ((intro eq)
   (exact (replace (symm eq) (lambda (x) (which-Nat x Trivial (lambda (k) Absurd))) sole))))
`;
      expect(() => evaluatePie(str)).not.toThrow();
    });

    // 9. three-not-two: 3 ≠ 2 via add1-injective chain
    it("9. three-not-two: 3 ≠ 2 via injectivity", () => {
      const str = `${discrimPreamble}
(claim three-not-two (-> (= Nat 3 2) Absurd))
(define-tactically three-not-two
  ((intro eq)
   (exact (succ-not-zero 0
     (add1-injective 1 0
       (add1-injective 2 1 eq))))))
`;
      expect(() => evaluatePie(str)).not.toThrow();
    });

    // 10. succ-injective-contrapositive: if n≠m then add1(n)≠add1(m)
    it("10. succ-injective-contrapositive: n ≠ m implies add1(n) ≠ add1(m)", () => {
      const str = `${discrimPreamble}
(claim succ-inj-contra
  (Pi ((n Nat) (m Nat))
    (-> (-> (= Nat n m) Absurd)
        (-> (= Nat (add1 n) (add1 m)) Absurd))))
(define-tactically succ-inj-contra
  ((intro n) (intro m) (intro neq) (intro eq)
   (exact (neq (add1-injective n m eq)))))
`;
      expect(() => evaluatePie(str)).not.toThrow();
    });
  });

  // =========================================================================
  // Section 2: Pred and Min/Max/Monus Properties
  // =========================================================================

  describe("Section 2: Pred, Min, Max, and Monus Properties", () => {

    // 11. pred-succ: pred(add1(n)) = n
    it("11. pred-succ: predecessor of successor is identity", () => {
      const str = `${monusPreamble}
(claim pred-succ (Pi ((n Nat)) (= Nat (pred (add1 n)) n)))
(define-tactically pred-succ
  ((intro n) (exact (same n))))
`;
      expect(() => evaluatePie(str)).not.toThrow();
    });

    // 12. pred-zero: pred(0) = 0
    it("12. pred-zero: predecessor of zero is zero", () => {
      const str = `${monusPreamble}
(claim pred-zero (= Nat (pred 0) 0))
(define-tactically pred-zero
  ((exact (same 0))))
`;
      expect(() => evaluatePie(str)).not.toThrow();
    });

    // 13. monus-0-right: monus(n, 0) = n
    it("13. monus-0-right: subtracting zero yields the original", () => {
      const str = `${monusPreamble}
(claim monus-0-right (Pi ((n Nat)) (= Nat (monus n 0) n)))
(define-tactically monus-0-right
  ((intro n) (exact (same n))))
`;
      expect(() => evaluatePie(str)).not.toThrow();
    });

    // 14. monus-0-left: monus(0, n) = 0
    it("14. monus-0-left: subtracting from zero yields zero", () => {
      const str = `${monusPreamble}
(claim monus-0-left (Pi ((n Nat)) (= Nat (monus 0 n) 0)))
(define monus-0-left
  (lambda (n)
    (ind-Nat n
      (lambda (k) (= Nat (monus 0 k) 0))
      (same 0)
      (lambda (n-1 ih) (cong ih pred)))))
`;
      expect(() => evaluatePie(str)).not.toThrow();
    });

    // 15. min-zero-left: min(0, n) = 0
    it("15. min-zero-left: minimum of zero and anything is zero", () => {
      const str = `${monusPreamble}
(claim monus-0-left (Pi ((n Nat)) (= Nat (monus 0 n) 0)))
(define monus-0-left
  (lambda (n)
    (ind-Nat n
      (lambda (k) (= Nat (monus 0 k) 0))
      (same 0)
      (lambda (n-1 ih) (cong ih pred)))))

(claim min-zero-left (Pi ((n Nat)) (= Nat (min 0 n) 0)))
(define-tactically min-zero-left
  ((intro n) (exact (monus-0-left (monus 0 n)))))
`;
      expect(() => evaluatePie(str)).not.toThrow();
    });

    // 16. min-zero-right: min(n, 0) = 0
    it("16. min-zero-right: minimum with zero on right is zero", () => {
      const str = `${monusPreamble}
(claim monus-succ-succ
  (Pi ((n Nat) (m Nat)) (= Nat (monus (add1 n) (add1 m)) (monus n m))))
(define monus-succ-succ
  (lambda (n m)
    (ind-Nat m
      (lambda (k) (= Nat (pred (iter-Nat k (add1 n) pred)) (iter-Nat k n pred)))
      (same n)
      (lambda (m-1 ih) (cong ih pred)))))

(claim monus-self (Pi ((n Nat)) (= Nat (monus n n) 0)))
(define monus-self
  (lambda (n)
    (ind-Nat n
      (lambda (k) (= Nat (monus k k) 0))
      (same 0)
      (lambda (n-1 ih) (trans (monus-succ-succ n-1 n-1) ih)))))

(claim min-zero-right (Pi ((n Nat)) (= Nat (min n 0) 0)))
(define-tactically min-zero-right
  ((intro n) (exact (monus-self n))))
`;
      expect(() => evaluatePie(str)).not.toThrow();
    });

    // 17. max-zero-left: max(0, n) = n
    it("17. max-zero-left: maximum of zero and n is n", () => {
      const str = `${monusPreamble}
(claim monus-0-left (Pi ((n Nat)) (= Nat (monus 0 n) 0)))
(define monus-0-left
  (lambda (n)
    (ind-Nat n
      (lambda (k) (= Nat (monus 0 k) 0))
      (same 0)
      (lambda (n-1 ih) (cong ih pred)))))

(claim max-zero-left (Pi ((n Nat)) (= Nat (max 0 n) n)))
(define max-zero-left
  (lambda (n)
    (replace (symm (monus-0-left n))
      (lambda (x) (= Nat (+ n x) n))
      (n+0=n n))))
`;
      expect(() => evaluatePie(str)).not.toThrow();
    });

    // 18. max-zero-right: max(n, 0) = n
    it("18. max-zero-right: maximum of n and zero is n", () => {
      const str = `${monusPreamble}
(claim max-zero-right (Pi ((n Nat)) (= Nat (max n 0) n)))
(define-tactically max-zero-right
  ((intro n) (exact (same n))))
`;
      expect(() => evaluatePie(str)).not.toThrow();
    });

    // 19. monus-succ-succ: monus(add1(n), add1(m)) = monus(n, m) (by computation via pred)
    it("19. monus-1-1: monus(1,1) = 0 (concrete)", () => {
      const str = `${monusPreamble}
(claim monus-1-1 (= Nat (monus 1 1) 0))
(define-tactically monus-1-1
  ((exact (same 0))))
`;
      expect(() => evaluatePie(str)).not.toThrow();
    });

    // 20. monus-2-1: monus(2,1) = 1 (concrete)
    it("20. monus-2-1: monus(2,1) = 1 (concrete)", () => {
      const str = `${monusPreamble}
(claim monus-2-1 (= Nat (monus 2 1) 1))
(define-tactically monus-2-1
  ((exact (same 1))))
`;
      expect(() => evaluatePie(str)).not.toThrow();
    });

    // 21. monus-3-2: monus(3,2) = 1 (concrete)
    it("21. monus-3-2: monus(3,2) = 1 (concrete)", () => {
      const str = `${monusPreamble}
(claim monus-3-2 (= Nat (monus 3 2) 1))
(define-tactically monus-3-2
  ((exact (same 1))))
`;
      expect(() => evaluatePie(str)).not.toThrow();
    });

    // 22. min-concrete: min(3,5) = 3
    it("22. min-concrete: min(3,5) = 3", () => {
      const str = `${monusPreamble}
(claim min-3-5 (= Nat (min 3 5) 3))
(define-tactically min-3-5
  ((exact (same 3))))
`;
      expect(() => evaluatePie(str)).not.toThrow();
    });

    // 23. max-concrete: max(3,5) = 5
    it("23. max-concrete: max(3,5) = 5", () => {
      const str = `${monusPreamble}
(claim max-3-5 (= Nat (max 3 5) 5))
(define-tactically max-3-5
  ((exact (same 5))))
`;
      expect(() => evaluatePie(str)).not.toThrow();
    });

    // 24. min-idem: min(n, n) = n  (requires monus-self which needs induction)
    it("24. min-same: min(n,n) = n by monus-self", () => {
      const str = `${monusPreamble}
(claim monus-succ-succ
  (Pi ((n Nat) (m Nat)) (= Nat (monus (add1 n) (add1 m)) (monus n m))))
(define monus-succ-succ
  (lambda (n m)
    (ind-Nat m
      (lambda (k) (= Nat (pred (iter-Nat k (add1 n) pred)) (iter-Nat k n pred)))
      (same n)
      (lambda (m-1 ih) (cong ih pred)))))

(claim monus-self (Pi ((n Nat)) (= Nat (monus n n) 0)))
(define monus-self
  (lambda (n)
    (ind-Nat n
      (lambda (k) (= Nat (monus k k) 0))
      (same 0)
      (lambda (n-1 ih) (trans (monus-succ-succ n-1 n-1) ih)))))

(claim min-same (Pi ((n Nat)) (= Nat (min n n) n)))
(define min-same
  (lambda (n)
    (replace (symm (monus-self n))
      (lambda (x) (= Nat (monus n x) n))
      (same n))))
`;
      expect(() => evaluatePie(str)).not.toThrow();
    });

    // 25. max-same: max(n, n) = n
    it("25. max-same: max(n,n) = n by monus-self and n+0=n", () => {
      const str = `${monusPreamble}
(claim monus-succ-succ
  (Pi ((n Nat) (m Nat)) (= Nat (monus (add1 n) (add1 m)) (monus n m))))
(define monus-succ-succ
  (lambda (n m)
    (ind-Nat m
      (lambda (k) (= Nat (pred (iter-Nat k (add1 n) pred)) (iter-Nat k n pred)))
      (same n)
      (lambda (m-1 ih) (cong ih pred)))))

(claim monus-self (Pi ((n Nat)) (= Nat (monus n n) 0)))
(define monus-self
  (lambda (n)
    (ind-Nat n
      (lambda (k) (= Nat (monus k k) 0))
      (same 0)
      (lambda (n-1 ih) (trans (monus-succ-succ n-1 n-1) ih)))))

(claim max-same (Pi ((n Nat)) (= Nat (max n n) n)))
(define max-same
  (lambda (n)
    (replace (symm (monus-self n))
      (lambda (x) (= Nat (+ n x) n))
      (n+0=n n))))
`;
      expect(() => evaluatePie(str)).not.toThrow();
    });

    // 26. monus-self: n - n = 0 for all n (standalone)
    it("26. monus-self: n minus n is always zero", () => {
      const str = `${monusPreamble}
(claim monus-succ-succ
  (Pi ((n Nat) (m Nat)) (= Nat (monus (add1 n) (add1 m)) (monus n m))))
(define monus-succ-succ
  (lambda (n m)
    (ind-Nat m
      (lambda (k) (= Nat (pred (iter-Nat k (add1 n) pred)) (iter-Nat k n pred)))
      (same n)
      (lambda (m-1 ih) (cong ih pred)))))

(claim monus-self (Pi ((n Nat)) (= Nat (monus n n) 0)))
(define monus-self
  (lambda (n)
    (ind-Nat n
      (lambda (k) (= Nat (monus k k) 0))
      (same 0)
      (lambda (n-1 ih) (trans (monus-succ-succ n-1 n-1) ih)))))
`;
      expect(() => evaluatePie(str)).not.toThrow();
    });
  });

  // =========================================================================
  // Section 3: Modular Arithmetic
  // =========================================================================

  describe("Section 3: Modular Arithmetic", () => {

    // 27. mod2-0-is-0
    it("27. mod2-0-is-0: mod2(0) = 0 by computation", () => {
      const str = `${mod2Preamble}
(claim mod2-0-is-0 (= Nat (mod2 0) 0))
(define-tactically mod2-0-is-0
  ((exact (same 0))))
`;
      expect(() => evaluatePie(str)).not.toThrow();
    });

    // 28. mod2-1-is-1
    it("28. mod2-1-is-1: mod2(1) = 1 by computation", () => {
      const str = `${mod2Preamble}
(claim mod2-1-is-1 (= Nat (mod2 1) 1))
(define-tactically mod2-1-is-1
  ((exact (same 1))))
`;
      expect(() => evaluatePie(str)).not.toThrow();
    });

    // 29. mod2-2-is-0
    it("29. mod2-2-is-0: mod2(2) = 0 by computation", () => {
      const str = `${mod2Preamble}
(claim mod2-2-is-0 (= Nat (mod2 2) 0))
(define-tactically mod2-2-is-0
  ((exact (same 0))))
`;
      expect(() => evaluatePie(str)).not.toThrow();
    });

    // 30. mod2-3-is-1
    it("30. mod2-3-is-1: mod2(3) = 1 by computation", () => {
      const str = `${mod2Preamble}
(claim mod2-3-is-1 (= Nat (mod2 3) 1))
(define-tactically mod2-3-is-1
  ((exact (same 1))))
`;
      expect(() => evaluatePie(str)).not.toThrow();
    });

    // 31. mod2-4-is-0
    it("31. mod2-4-is-0: mod2(4) = 0 by computation", () => {
      const str = `${mod2Preamble}
(claim mod2-4-is-0 (= Nat (mod2 4) 0))
(define-tactically mod2-4-is-0
  ((exact (same 0))))
`;
      expect(() => evaluatePie(str)).not.toThrow();
    });

    // 32. even-not-odd: 0 ≠ 1 as representative witness
    it("32. even-not-odd: mod2-classes 0 and 1 are distinct", () => {
      const str = `${mod2Preamble}
(claim even-not-odd (-> (= Nat 0 1) Absurd))
(define-tactically even-not-odd
  ((intro eq)
   (exact (replace eq (lambda (x) (which-Nat x Trivial (lambda (k) Absurd))) sole))))
`;
      expect(() => evaluatePie(str)).not.toThrow();
    });

    // 33. mod2 preserves under +2: mod2(n) = mod2(n+2) for concrete cases
    it("33. mod2-plus2-0: mod2(0) = mod2(2) by computation", () => {
      const str = `${mod2Preamble}
(claim mod2-plus2-0 (= Nat (mod2 0) (mod2 2)))
(define-tactically mod2-plus2-0
  ((exact (same 0))))
`;
      expect(() => evaluatePie(str)).not.toThrow();
    });

    // 34. mod2-plus2 for 1
    it("34. mod2-plus2-1: mod2(1) = mod2(3) by computation", () => {
      const str = `${mod2Preamble}
(claim mod2-plus2-1 (= Nat (mod2 1) (mod2 3)))
(define-tactically mod2-plus2-1
  ((exact (same 1))))
`;
      expect(() => evaluatePie(str)).not.toThrow();
    });

    // 35. sum of two even numbers is even (concrete): mod2(0+2) = 0
    it("35. even-plus-even: mod2(0+2) = 0 concrete", () => {
      const str = `${mod2Preamble}
(claim even-sum (= Nat (mod2 (+ 0 2)) 0))
(define-tactically even-sum
  ((exact (same 0))))
`;
      expect(() => evaluatePie(str)).not.toThrow();
    });

    // 36. mod3: define and test
    it("36. mod3 concrete values: mod3(0)=0, mod3(3)=0, mod3(5)=2", () => {
      const str = `${arithPreamble}
(claim mod3 (-> Nat Nat))
(define mod3
  (lambda (n)
    (iter-Nat n 0
      (lambda (r)
        (which-Nat r 1
          (lambda (x) (which-Nat x 2 (lambda (y) 0))))))))

(claim mod3-0 (= Nat (mod3 0) 0))
(define-tactically mod3-0
  ((exact (same 0))))

(claim mod3-3 (= Nat (mod3 3) 0))
(define-tactically mod3-3
  ((exact (same 0))))

(claim mod3-5 (= Nat (mod3 5) 2))
(define-tactically mod3-5
  ((exact (same 2))))
`;
      expect(() => evaluatePie(str)).not.toThrow();
    });
  });

  // =========================================================================
  // Section 4: Bool Decidable Equality and Distinctness Witnesses
  // =========================================================================

  describe("Section 4: Bool Decidable Equality and Distinctness", () => {

    // 37. left-not-right: (left sole) ≠ (right sole) for Bool
    it("37. left-not-right: true ≠ false for Bool", () => {
      const str = `${boolPreamble}
(claim left-not-right
  (-> (= Bool true false) Absurd))
(define-tactically left-not-right
  ((intro eq)
   (exact (replace (cong eq bool-to-nat)
     (lambda (x) (which-Nat x Absurd (lambda (k) Trivial)))
     sole))))
`;
      expect(() => evaluatePie(str)).not.toThrow();
    });

    // 38. right-not-left: false ≠ true
    it("38. right-not-left: false ≠ true for Bool", () => {
      const str = `${boolPreamble}
(claim right-not-left
  (-> (= Bool false true) Absurd))
(define-tactically right-not-left
  ((intro eq)
   (exact (replace (cong eq bool-to-nat)
     (lambda (x) (which-Nat x Trivial (lambda (k) Absurd)))
     sole))))
`;
      expect(() => evaluatePie(str)).not.toThrow();
    });

    // 39. two-distinct-bools: there exist two distinct Bool values
    it("39. two-distinct-bools: witness two distinct Bool values", () => {
      const str = `${boolPreamble}
(claim left-not-right
  (-> (= Bool true false) Absurd))
(define left-not-right
  (lambda (eq)
    (replace (cong eq bool-to-nat)
      (lambda (x) (which-Nat x Absurd (lambda (k) Trivial)))
      sole)))

(claim two-distinct-bools
  (Sigma ((a Bool))
    (Sigma ((b Bool))
      (-> (= Bool a b) Absurd))))
(define-tactically two-distinct-bools
  ((exists true a)
   (exists false b)
   (exact left-not-right)))
`;
      expect(() => evaluatePie(str)).not.toThrow();
    });

    // 40. bool-dec-eq-same-left: deciding equality for true=true
    it("40. bool-dec-eq-same-left: true = true is decidable (left case)", () => {
      const str = `${boolPreamble}
(claim true-eq-true
  (Either (= Bool true true) (-> (= Bool true true) Absurd)))
(define-tactically true-eq-true
  ((go-Left) (exact (same true))))
`;
      expect(() => evaluatePie(str)).not.toThrow();
    });

    // 41. bool-dec-eq-same-right: deciding equality for false=false
    it("41. bool-dec-eq-same-right: false = false is decidable", () => {
      const str = `${boolPreamble}
(claim false-eq-false
  (Either (= Bool false false) (-> (= Bool false false) Absurd)))
(define-tactically false-eq-false
  ((go-Left) (exact (same false))))
`;
      expect(() => evaluatePie(str)).not.toThrow();
    });

    // 42. bool-dec-eq-diff: deciding true ≠ false
    it("42. bool-dec-eq-diff: true ≠ false is decidable", () => {
      const str = `${boolPreamble}
(claim true-neq-false
  (Either (= Bool true false) (-> (= Bool true false) Absurd)))
(define-tactically true-neq-false
  ((go-Right)
   (intro eq)
   (exact (replace (cong eq bool-to-nat)
     (lambda (x) (which-Nat x Absurd (lambda (k) Trivial)))
     sole))))
`;
      expect(() => evaluatePie(str)).not.toThrow();
    });

    // 43. bool-dec-eq-diff-2: false ≠ true is decidable
    it("43. bool-dec-eq-diff-2: false ≠ true is decidable", () => {
      const str = `${boolPreamble}
(claim false-neq-true
  (Either (= Bool false true) (-> (= Bool false true) Absurd)))
(define-tactically false-neq-true
  ((go-Right)
   (intro eq)
   (exact (replace (cong eq bool-to-nat)
     (lambda (x) (which-Nat x Trivial (lambda (k) Absurd)))
     sole))))
`;
      expect(() => evaluatePie(str)).not.toThrow();
    });
  });

  // =========================================================================
  // Section 5: Three Distinct Nats and Combined Properties
  // =========================================================================

  describe("Section 5: Three Distinct Nats and Combined Properties", () => {

    // 44. three-distinct-nats
    it("44. three-distinct-nats: witness 0, 1, 2 with all pairwise inequalities", () => {
      const str = `${discrimPreamble}
(claim three-distinct-nats
  (Sigma ((a Nat))
    (Sigma ((b Nat))
      (Sigma ((c Nat))
        (Sigma ((ab (-> (= Nat a b) Absurd)))
          (Sigma ((bc (-> (= Nat b c) Absurd)))
            (-> (= Nat a c) Absurd)))))))
(define-tactically three-distinct-nats
  ((exists 0 a) (exists 1 b) (exists 2 c)
   (exists (lambda (eq) (zero-not-succ 0 eq)) ab)
   (exists (lambda (eq) (zero-not-succ 0 (add1-injective 0 1 eq))) bc)
   (exact (lambda (eq) (zero-not-succ 1 eq)))))
`;
      expect(() => evaluatePie(str)).not.toThrow();
    });

    // 45. n-neq-n+2: no natural number equals itself plus 2
    it("45. n-neq-n+2: n ≠ n+2 for all n", () => {
      const str = `${discrimPreamble}
(claim nat-succ-neq-self
  (Pi ((n Nat)) (-> (= Nat n (add1 n)) Absurd)))
(define-tactically nat-succ-neq-self
  ((intro n) (elim-Nat n)
   (then (intro eq) (exact (zero-not-succ 0 eq)))
   (then (intro n-1) (intro ih) (intro eq)
     (exact (ih (add1-injective n-1 (add1 n-1) eq))))))

(claim n-neq-n+2
  (Pi ((n Nat)) (-> (= Nat n (add1 (add1 n))) Absurd)))
(define-tactically n-neq-n+2
  ((intro n) (elim-Nat n)
   (then (intro eq) (exact (zero-not-succ 1 eq)))
   (then (intro n-1) (intro ih) (intro eq)
     (exact (ih (add1-injective n-1 (add1 (add1 n-1)) eq))))))
`;
      expect(() => evaluatePie(str)).not.toThrow();
    });

    // 46. decidability of 0 = n for concrete small n
    it("46. decide-0-eq-0: 0 = 0 is decidable (equal case)", () => {
      const str = `${arithPreamble}
(claim decide-0-eq-0
  (Either (= Nat 0 0) (-> (= Nat 0 0) Absurd)))
(define-tactically decide-0-eq-0
  ((go-Left) (exact (same 0))))
`;
      expect(() => evaluatePie(str)).not.toThrow();
    });

    // 47. decide-0-eq-1: 0 = 1 is decidable (not equal case)
    it("47. decide-0-eq-1: 0 = 1 is decidable (not-equal case)", () => {
      const str = `${arithPreamble}
(claim decide-0-eq-1
  (Either (= Nat 0 1) (-> (= Nat 0 1) Absurd)))
(define-tactically decide-0-eq-1
  ((go-Right)
   (intro eq)
   (exact (replace eq (lambda (x) (which-Nat x Trivial (lambda (k) Absurd))) sole))))
`;
      expect(() => evaluatePie(str)).not.toThrow();
    });

    // 48. combined: if monus(n,0)=n and 0≠1, then monus(0,0)≠monus(1,0)
    it("48. monus-discriminates: monus(0,0) ≠ monus(1,0)", () => {
      const str = `${monusPreamble}
(claim monus-discrim
  (-> (= Nat (monus 0 0) (monus 1 0)) Absurd))
(define-tactically monus-discrim
  ((intro eq)
   (exact (replace eq (lambda (x) (which-Nat x Trivial (lambda (k) Absurd))) sole))))
`;
      expect(() => evaluatePie(str)).not.toThrow();
    });

    // 49. symmetry of discrimination: wrapping succ-not-zero with symm
    it("49. symm-discrim: if add1(n) = 0 leads to Absurd, so does 0 = add1(n) via symm", () => {
      const str = `${discrimPreamble}
(claim symm-discrim
  (Pi ((n Nat))
    (-> (-> (= Nat (add1 n) 0) Absurd)
        (-> (= Nat 0 (add1 n)) Absurd))))
(define-tactically symm-discrim
  ((intro n) (intro f) (intro eq)
   (exact (f (symm eq)))))
`;
      expect(() => evaluatePie(str)).not.toThrow();
    });

    // 50. transitivity of inequality witness: if a≠b and b=c then a≠c
    it("50. neq-transport: if a ≠ b and b = c then a ≠ c", () => {
      const str = `${arithPreamble}
(claim neq-transport
  (Pi ((a Nat) (b Nat) (c Nat))
    (-> (-> (= Nat a b) Absurd)
        (= Nat b c)
        (-> (= Nat a c) Absurd))))
(define-tactically neq-transport
  ((intro a) (intro b) (intro c)
   (intro neq) (intro bc) (intro ac)
   (exact (neq (trans ac (symm bc))))))
`;
      expect(() => evaluatePie(str)).not.toThrow();
    });
  });
});
