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

const lePreamble = `${arithLemmas}
(claim Le (→ Nat Nat U))
(define Le (λ (n m) (Σ ((k Nat)) (= Nat (+ n k) m))))
`;

const divPreamble = `${arithLemmas}
(claim n*0=0 (Π ((n Nat)) (= Nat (* n 0) 0)))
(define n*0=0 (λ (n) (ind-Nat n (λ (k) (= Nat (* k 0) 0)) (same 0) (λ (n-1 ih) ih))))

(claim n*1=n (Π ((n Nat)) (= Nat (* n 1) n)))
(define n*1=n (λ (n) (ind-Nat n (λ (k) (= Nat (* k 1) k)) (same 0) (λ (n-1 ih) (cong ih (+ 1))))))

(claim 1*n=n (Π ((n Nat)) (= Nat (* 1 n) n)))
(define 1*n=n (λ (n) (n+0=n n)))

(claim Divides (→ Nat Nat U))
(define Divides (λ (d n) (Σ ((k Nat)) (= Nat (* d k) n))))
`;

describe("Order Relations and Divisibility", () => {

  // =========================================================================
  // Part 1: Order Relations (Le)
  // =========================================================================

  describe("Le: Reflexivity and Basic Properties", () => {

    it("proves le-refl: n <= n with witness k=0", () => {
      const str = `${lePreamble}
(claim le-refl (Π ((n Nat)) (Le n n)))
(define-tactically le-refl
  ((intro n)
   (exists 0 k)
   (exact (n+0=n n))))
`;
      expect(() => evaluatePie(str)).not.toThrow();
    });

    it("verifies le-refl at n=5 extracts witness 0", () => {
      const str = `${lePreamble}
(claim le-refl (Π ((n Nat)) (Le n n)))
(define-tactically le-refl
  ((intro n)
   (exists 0 k)
   (exact (n+0=n n))))
(car (le-refl 5))
`;
      const output = evaluatePie(str);
      expect(output).toContain("0: Nat");
    });

    it("proves zero-le: 0 <= n for all n", () => {
      const str = `${lePreamble}
(claim zero-le (Π ((n Nat)) (Le 0 n)))
(define-tactically zero-le
  ((intro n)
   (exists n k)
   (exact (same n))))
`;
      expect(() => evaluatePie(str)).not.toThrow();
    });

    it("verifies zero-le at n=7 extracts witness 7", () => {
      const str = `${lePreamble}
(claim zero-le (Π ((n Nat)) (Le 0 n)))
(define-tactically zero-le
  ((intro n)
   (exists n k)
   (exact (same n))))
(car (zero-le 7))
`;
      const output = evaluatePie(str);
      expect(output).toContain("7: Nat");
    });

    it("proves le-succ: n <= n+1 with witness k=1", () => {
      const str = `${lePreamble}
(claim le-succ (Π ((n Nat)) (Le n (add1 n))))
(define-tactically le-succ
  ((intro n)
   (exists 1 k)
   (trans (+add1 n 0) (cong (n+0=n n) (+ 1)))))
`;
      expect(() => evaluatePie(str)).not.toThrow();
    });

    it("verifies le-succ at n=3 extracts witness 1", () => {
      const str = `${lePreamble}
(claim le-succ (Π ((n Nat)) (Le n (add1 n))))
(define-tactically le-succ
  ((intro n)
   (exists 1 k)
   (trans (+add1 n 0) (cong (n+0=n n) (+ 1)))))
(car (le-succ 3))
`;
      const output = evaluatePie(str);
      expect(output).toContain("1: Nat");
    });

  });

  describe("Le: Monotonicity", () => {

    it("proves le-succ-mono: n <= m implies (add1 n) <= (add1 m)", () => {
      const str = `${lePreamble}
(claim le-succ-mono
  (Π ((n Nat) (m Nat))
    (→ (Σ ((k Nat)) (= Nat (+ n k) m))
       (Σ ((k Nat)) (= Nat (+ (add1 n) k) (add1 m))))))
(define-tactically le-succ-mono
  ((intro n)
   (intro m)
   (intro p)
   (exists (car p) k)
   (cong (cdr p) (+ 1))))
`;
      expect(() => evaluatePie(str)).not.toThrow();
    });

    it("verifies le-succ-mono on concrete Le 2 5 witness", () => {
      const str = `${lePreamble}
(claim le-succ-mono
  (Π ((n Nat) (m Nat))
    (→ (Σ ((k Nat)) (= Nat (+ n k) m))
       (Σ ((k Nat)) (= Nat (+ (add1 n) k) (add1 m))))))
(define-tactically le-succ-mono
  ((intro n)
   (intro m)
   (intro p)
   (exists (car p) k)
   (cong (cdr p) (+ 1))))

(claim le-2-5 (Le 2 5))
(define-tactically le-2-5
  ((exists 3 k)
   (exact (same 5))))

(car (le-succ-mono 2 5 le-2-5))
`;
      const output = evaluatePie(str);
      expect(output).toContain("3: Nat");
    });

  });

  describe("Le: Addition Properties", () => {

    it("proves le-plus-right: n <= n + m", () => {
      const str = `${lePreamble}
(claim le-plus-right (Π ((n Nat) (m Nat)) (Le n (+ n m))))
(define-tactically le-plus-right
  ((intro n)
   (intro m)
   (exists m k)
   (exact (same (+ n m)))))
`;
      expect(() => evaluatePie(str)).not.toThrow();
    });

    it("verifies le-plus-right at n=3, m=4 extracts witness 4", () => {
      const str = `${lePreamble}
(claim le-plus-right (Π ((n Nat) (m Nat)) (Le n (+ n m))))
(define-tactically le-plus-right
  ((intro n)
   (intro m)
   (exists m k)
   (exact (same (+ n m)))))
(car (le-plus-right 3 4))
`;
      const output = evaluatePie(str);
      expect(output).toContain("4: Nat");
    });

    it("proves le-plus-left: m <= n + m using commutativity", () => {
      const str = `${lePreamble}
(claim le-plus-left (Π ((n Nat) (m Nat)) (Le m (+ n m))))
(define-tactically le-plus-left
  ((intro n)
   (intro m)
   (exists n k)
   (exact (+-comm m n))))
`;
      expect(() => evaluatePie(str)).not.toThrow();
    });

    it("verifies le-plus-left at n=5, m=2 extracts witness 5", () => {
      const str = `${lePreamble}
(claim le-plus-left (Π ((n Nat) (m Nat)) (Le m (+ n m))))
(define-tactically le-plus-left
  ((intro n)
   (intro m)
   (exists n k)
   (exact (+-comm m n))))
(car (le-plus-left 5 2))
`;
      const output = evaluatePie(str);
      expect(output).toContain("5: Nat");
    });

  });

  describe("Le: Transitivity", () => {

    it("proves le-trans: n <= m and m <= k implies n <= k", () => {
      const str = `${lePreamble}
(claim le-trans
  (Π ((n Nat) (m Nat) (k Nat))
    (→ (Σ ((j1 Nat)) (= Nat (+ n j1) m))
       (Σ ((j2 Nat)) (= Nat (+ m j2) k))
       (Σ ((j Nat)) (= Nat (+ n j) k)))))
(define-tactically le-trans
  ((intro n)
   (intro m)
   (intro k)
   (intro p1)
   (intro p2)
   (exists (+ (car p1) (car p2)) j)
   (trans (symm (+-assoc n (car p1) (car p2)))
            (trans (cong (cdr p1) (the (→ Nat Nat) (λ (x) (+ x (car p2)))))
              (cdr p2)))))
`;
      expect(() => evaluatePie(str)).not.toThrow();
    });

    it("verifies le-trans on Le 1 3 and Le 3 6", () => {
      const str = `${lePreamble}
(claim le-trans
  (Π ((n Nat) (m Nat) (k Nat))
    (→ (Σ ((j1 Nat)) (= Nat (+ n j1) m))
       (Σ ((j2 Nat)) (= Nat (+ m j2) k))
       (Σ ((j Nat)) (= Nat (+ n j) k)))))
(define-tactically le-trans
  ((intro n)
   (intro m)
   (intro k)
   (intro p1)
   (intro p2)
   (exists (+ (car p1) (car p2)) j)
   (trans (symm (+-assoc n (car p1) (car p2)))
            (trans (cong (cdr p1) (the (→ Nat Nat) (λ (x) (+ x (car p2)))))
              (cdr p2)))))

(claim le-1-3 (Le 1 3))
(define-tactically le-1-3
  ((exists 2 k)
   (exact (same 3))))

(claim le-3-6 (Le 3 6))
(define-tactically le-3-6
  ((exists 3 k)
   (exact (same 6))))

(car (le-trans 1 3 6 le-1-3 le-3-6))
`;
      const output = evaluatePie(str);
      expect(output).toContain("5: Nat");
    });

  });

  describe("Le: Weakening", () => {

    it("proves le-weaken: n <= m implies n <= add1 m", () => {
      const str = `${lePreamble}
(claim le-weaken (Π ((n Nat) (m Nat)) (→ (Le n m) (Le n (add1 m)))))
(define-tactically le-weaken
  ((intro n)
   (intro m)
   (intro p)
   (exists (add1 (car p)) k)
   (trans (+add1 n (car p)) (cong (cdr p) (+ 1)))))
`;
      expect(() => evaluatePie(str)).not.toThrow();
    });

    it("verifies le-weaken: Le 2 5 implies Le 2 6", () => {
      const str = `${lePreamble}
(claim le-weaken (Π ((n Nat) (m Nat)) (→ (Le n m) (Le n (add1 m)))))
(define-tactically le-weaken
  ((intro n)
   (intro m)
   (intro p)
   (exists (add1 (car p)) k)
   (trans (+add1 n (car p)) (cong (cdr p) (+ 1)))))

(claim le-2-5 (Le 2 5))
(define-tactically le-2-5
  ((exists 3 k)
   (exact (same 5))))

(car (le-weaken 2 5 le-2-5))
`;
      const output = evaluatePie(str);
      expect(output).toContain("4: Nat");
    });

  });

  describe("Le: Concrete Instances", () => {

    it("proves Le 0 0 (reflexivity at zero)", () => {
      const str = `${lePreamble}
(claim le-0-0 (Le 0 0))
(define-tactically le-0-0
  ((exists 0 k)
   (exact (same 0))))
(car le-0-0)
`;
      const output = evaluatePie(str);
      expect(output).toContain("0: Nat");
    });

    it("proves Le 0 5", () => {
      const str = `${lePreamble}
(claim le-0-5 (Le 0 5))
(define-tactically le-0-5
  ((exists 5 k)
   (exact (same 5))))
(car le-0-5)
`;
      const output = evaluatePie(str);
      expect(output).toContain("5: Nat");
    });

    it("proves Le 3 7 with witness 4", () => {
      const str = `${lePreamble}
(claim le-3-7 (Le 3 7))
(define-tactically le-3-7
  ((exists 4 k)
   (exact (same 7))))
(car le-3-7)
`;
      const output = evaluatePie(str);
      expect(output).toContain("4: Nat");
    });

    it("proves Le 2 10 with witness 8", () => {
      const str = `${lePreamble}
(claim le-2-10 (Le 2 10))
(define-tactically le-2-10
  ((exists 8 k)
   (exact (same 10))))
(car le-2-10)
`;
      const output = evaluatePie(str);
      expect(output).toContain("8: Nat");
    });

    it("proves Le 5 5 (reflexivity at 5)", () => {
      const str = `${lePreamble}
(claim le-5-5 (Le 5 5))
(define-tactically le-5-5
  ((exists 0 k)
   (exact (n+0=n 5))))
(car le-5-5)
`;
      const output = evaluatePie(str);
      expect(output).toContain("0: Nat");
    });

  });

  // =========================================================================
  // Part 2: Divisibility
  // =========================================================================

  describe("Divides: Basic Universal Properties", () => {

    it("proves one-divides-all: 1 | n for all n", () => {
      const str = `${divPreamble}
(claim one-divides-all (Π ((n Nat)) (Divides 1 n)))
(define-tactically one-divides-all
  ((intro n)
   (exists n k)
   (exact (1*n=n n))))
`;
      expect(() => evaluatePie(str)).not.toThrow();
    });

    it("verifies one-divides-all at n=7 extracts witness 7", () => {
      const str = `${divPreamble}
(claim one-divides-all (Π ((n Nat)) (Divides 1 n)))
(define-tactically one-divides-all
  ((intro n)
   (exists n k)
   (exact (1*n=n n))))
(car (one-divides-all 7))
`;
      const output = evaluatePie(str);
      expect(output).toContain("7: Nat");
    });

    it("proves divides-zero: n | 0 for all n", () => {
      const str = `${divPreamble}
(claim divides-zero (Π ((n Nat)) (Divides n 0)))
(define-tactically divides-zero
  ((intro n)
   (exists 0 k)
   (exact (n*0=0 n))))
`;
      expect(() => evaluatePie(str)).not.toThrow();
    });

    it("verifies divides-zero at n=13 extracts witness 0", () => {
      const str = `${divPreamble}
(claim divides-zero (Π ((n Nat)) (Divides n 0)))
(define-tactically divides-zero
  ((intro n)
   (exists 0 k)
   (exact (n*0=0 n))))
(car (divides-zero 13))
`;
      const output = evaluatePie(str);
      expect(output).toContain("0: Nat");
    });

    it("proves divides-refl: n | n for all n", () => {
      const str = `${divPreamble}
(claim divides-refl (Π ((n Nat)) (Divides n n)))
(define-tactically divides-refl
  ((intro n)
   (exists 1 k)
   (exact (n*1=n n))))
`;
      expect(() => evaluatePie(str)).not.toThrow();
    });

    it("verifies divides-refl at n=9 extracts witness 1", () => {
      const str = `${divPreamble}
(claim divides-refl (Π ((n Nat)) (Divides n n)))
(define-tactically divides-refl
  ((intro n)
   (exists 1 k)
   (exact (n*1=n n))))
(car (divides-refl 9))
`;
      const output = evaluatePie(str);
      expect(output).toContain("1: Nat");
    });

  });

  describe("Divides: Concrete Instances", () => {

    it("proves Divides 2 6 with witness 3", () => {
      const str = `${divPreamble}
(claim div-2-6 (Divides 2 6))
(define-tactically div-2-6
  ((exists 3 k)
   (exact (same 6))))
(car div-2-6)
`;
      const output = evaluatePie(str);
      expect(output).toContain("3: Nat");
    });

    it("proves Divides 3 12 with witness 4", () => {
      const str = `${divPreamble}
(claim div-3-12 (Divides 3 12))
(define-tactically div-3-12
  ((exists 4 k)
   (exact (same 12))))
(car div-3-12)
`;
      const output = evaluatePie(str);
      expect(output).toContain("4: Nat");
    });

    it("proves Divides 4 20 with witness 5", () => {
      const str = `${divPreamble}
(claim div-4-20 (Divides 4 20))
(define-tactically div-4-20
  ((exists 5 k)
   (exact (same 20))))
(car div-4-20)
`;
      const output = evaluatePie(str);
      expect(output).toContain("5: Nat");
    });

    it("proves Divides 5 0 with witness 0", () => {
      const str = `${divPreamble}
(claim div-5-0 (Divides 5 0))
(define-tactically div-5-0
  ((exists 0 k)
   (exact (n*0=0 5))))
(car div-5-0)
`;
      const output = evaluatePie(str);
      expect(output).toContain("0: Nat");
    });

    it("proves Divides 7 21 with witness 3", () => {
      const str = `${divPreamble}
(claim div-7-21 (Divides 7 21))
(define-tactically div-7-21
  ((exists 3 k)
   (exact (same 21))))
(car div-7-21)
`;
      const output = evaluatePie(str);
      expect(output).toContain("3: Nat");
    });

  });

  describe("Divides: Bundled Proofs", () => {

    it("proves both 2|4 and 2|6 as a pair", () => {
      const str = `${divPreamble}
(claim div-pair
  (Σ ((p1 (Divides 2 4))) (Divides 2 6)))
(define-tactically div-pair
  ((split-Pair)
   (then
     (exists 2 k)
     (exact (same 4)))
   (then
     (exists 3 k)
     (exact (same 6)))))
`;
      expect(() => evaluatePie(str)).not.toThrow();
    });

    it("proves both 3|9 and 3|15 as a pair", () => {
      const str = `${divPreamble}
(claim div-pair-3
  (Σ ((p1 (Divides 3 9))) (Divides 3 15)))
(define-tactically div-pair-3
  ((split-Pair)
   (then
     (exists 3 k)
     (exact (same 9)))
   (then
     (exists 5 k)
     (exact (same 15)))))
`;
      expect(() => evaluatePie(str)).not.toThrow();
    });

  });

  describe("Combined: Le and Divides Together", () => {

    it("proves Le 0 6 and Divides 2 6 bundled", () => {
      const str = `${arithLemmas}
(claim Le (→ Nat Nat U))
(define Le (λ (n m) (Σ ((k Nat)) (= Nat (+ n k) m))))

(claim n*0=0 (Π ((n Nat)) (= Nat (* n 0) 0)))
(define n*0=0 (λ (n) (ind-Nat n (λ (k) (= Nat (* k 0) 0)) (same 0) (λ (n-1 ih) ih))))

(claim Divides (→ Nat Nat U))
(define Divides (λ (d n) (Σ ((k Nat)) (= Nat (* d k) n))))

(claim le-and-div
  (Σ ((p1 (Le 0 6))) (Divides 2 6)))
(define-tactically le-and-div
  ((split-Pair)
   (then
     (exists 6 k)
     (exact (same 6)))
   (then
     (exists 3 k)
     (exact (same 6)))))
`;
      expect(() => evaluatePie(str)).not.toThrow();
    });

    it("proves Le 3 9 and Divides 3 9 bundled", () => {
      const str = `${arithLemmas}
(claim Le (→ Nat Nat U))
(define Le (λ (n m) (Σ ((k Nat)) (= Nat (+ n k) m))))

(claim n*0=0 (Π ((n Nat)) (= Nat (* n 0) 0)))
(define n*0=0 (λ (n) (ind-Nat n (λ (k) (= Nat (* k 0) 0)) (same 0) (λ (n-1 ih) ih))))

(claim Divides (→ Nat Nat U))
(define Divides (λ (d n) (Σ ((k Nat)) (= Nat (* d k) n))))

(claim le-and-div-9
  (Σ ((p1 (Le 3 9))) (Divides 3 9)))
(define-tactically le-and-div-9
  ((split-Pair)
   (then
     (exists 6 k)
     (exact (same 9)))
   (then
     (exists 3 k)
     (exact (same 9)))))
`;
      expect(() => evaluatePie(str)).not.toThrow();
    });

  });

  describe("Le: Additional Properties", () => {

    it("proves le-plus-both: n <= n + m + k (sum of two additions)", () => {
      const str = `${lePreamble}
(claim le-plus-both (Π ((n Nat) (m Nat) (k Nat)) (Le n (+ n (+ m k)))))
(define-tactically le-plus-both
  ((intro n)
   (intro m)
   (intro k)
   (exists (+ m k) j)
   (exact (same (+ n (+ m k))))))
`;
      expect(() => evaluatePie(str)).not.toThrow();
    });

    it("proves le-zero-is-zero: Le n 0 implies n = 0 for n=0", () => {
      const str = `${lePreamble}
(claim le-0-0-witness (Le 0 0))
(define-tactically le-0-0-witness
  ((exists 0 k)
   (exact (same 0))))
(car le-0-0-witness)
`;
      const output = evaluatePie(str);
      expect(output).toContain("0: Nat");
    });

    it("proves Le 1 1 (reflexivity at 1)", () => {
      const str = `${lePreamble}
(claim le-1-1 (Le 1 1))
(define-tactically le-1-1
  ((exists 0 k)
   (exact (n+0=n 1))))
(car le-1-1)
`;
      const output = evaluatePie(str);
      expect(output).toContain("0: Nat");
    });

  });

  describe("Divides: Universal with Application", () => {

    it("proves one-divides-all and applies to n=0", () => {
      const str = `${divPreamble}
(claim one-divides-all (Π ((n Nat)) (Divides 1 n)))
(define-tactically one-divides-all
  ((intro n)
   (exists n k)
   (exact (1*n=n n))))
(car (one-divides-all 0))
`;
      const output = evaluatePie(str);
      expect(output).toContain("0: Nat");
    });

    it("proves one-divides-all and applies to n=100", () => {
      const str = `${divPreamble}
(claim one-divides-all (Π ((n Nat)) (Divides 1 n)))
(define-tactically one-divides-all
  ((intro n)
   (exists n k)
   (exact (1*n=n n))))
(car (one-divides-all 100))
`;
      const output = evaluatePie(str);
      expect(output).toContain("100: Nat");
    });

    it("proves divides-refl and applies to n=0", () => {
      const str = `${divPreamble}
(claim divides-refl (Π ((n Nat)) (Divides n n)))
(define-tactically divides-refl
  ((intro n)
   (exists 1 k)
   (exact (n*1=n n))))
(car (divides-refl 0))
`;
      const output = evaluatePie(str);
      expect(output).toContain("1: Nat");
    });

    it("proves divides-zero and applies to n=42", () => {
      const str = `${divPreamble}
(claim divides-zero (Π ((n Nat)) (Divides n 0)))
(define-tactically divides-zero
  ((intro n)
   (exists 0 k)
   (exact (n*0=0 n))))
(car (divides-zero 42))
`;
      const output = evaluatePie(str);
      expect(output).toContain("0: Nat");
    });

  });

  describe("Error Cases", () => {

    it("rejects wrong witness for Le 3 4 (witness 2 gives 5, not 4)", () => {
      const str = `${lePreamble}
(claim bad-le (Le 3 4))
(define-tactically bad-le
  ((exists 2 k)
   (exact (same 4))))
`;
      expect(() => evaluatePie(str)).toThrow();
    });

    it("rejects Le proof with incomplete tactic (missing equality proof)", () => {
      const str = `${lePreamble}
(claim bad-le-2 (Le 2 5))
(define-tactically bad-le-2
  ((exists 3 k)))
`;
      expect(() => evaluatePie(str)).toThrow();
    });

    it("rejects wrong witness for Divides 3 7 (no k where 3*k = 7)", () => {
      const str = `${divPreamble}
(claim bad-div (Divides 3 7))
(define-tactically bad-div
  ((exists 2 k)
   (exact (same 7))))
`;
      expect(() => evaluatePie(str)).toThrow();
    });

    it("rejects exists on non-Sigma type in Le context", () => {
      const str = `
(claim bad-exists Nat)
(define-tactically bad-exists
  ((exists 5 k)))
`;
      expect(() => evaluatePie(str)).toThrow();
    });

    it("verifies le-refl at n=7 extracts witness 0", () => {
      const str = `${lePreamble}
(claim le-refl (Π ((n Nat)) (Le n n)))
(define-tactically le-refl
  ((intro n) (exists 0 k) (exact (n+0=n n))))
(car (le-refl 7))
`;
      const output = evaluatePie(str);
      expect(output).toContain("0: Nat");
    });

    it("verifies 1 divides 7 extracts witness 7", () => {
      const str = `${divPreamble}
(claim one-div-all (Π ((n Nat)) (Divides 1 n)))
(define-tactically one-div-all
  ((intro n) (exists n k) (exact (n+0=n n))))
(car (one-div-all 7))
`;
      const output = evaluatePie(str);
      expect(output).toContain("7: Nat");
    });

    it("verifies n divides 0 extracts witness 0", () => {
      const str = `${divPreamble}
(claim n-div-0 (Π ((n Nat)) (Divides n 0)))
(define-tactically n-div-0
  ((intro n) (exists 0 k) (exact (n*0=0 n))))
(car (n-div-0 5))
`;
      const output = evaluatePie(str);
      expect(output).toContain("0: Nat");
    });

  });

});
