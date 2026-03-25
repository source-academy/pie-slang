import 'jest';
import { evaluatePie } from '../../main';

const arithPreamble = `
(claim + (→ Nat Nat Nat))
(define + (λ (n j) (iter-Nat n j (λ (x) (add1 x)))))

(claim * (→ Nat Nat Nat))
(define * (λ (n m) (iter-Nat n 0 (+ m))))
`;

const predPreamble = `${arithPreamble}
(claim pred (→ Nat Nat))
(define pred (λ (n) (which-Nat n 0 (λ (n-1) n-1))))
`;

const monusPreamble = `${predPreamble}
(claim monus (→ Nat Nat Nat))
(define monus (λ (n m) (iter-Nat m n pred)))
`;

const minMaxPreamble = `${monusPreamble}
(claim min (→ Nat Nat Nat))
(define min (λ (a b) (monus a (monus a b))))

(claim max (→ Nat Nat Nat))
(define max (λ (a b) (+ b (monus a b))))
`;

describe("Strong Induction Patterns", () => {

  describe("Predecessor and Which-Nat", () => {

    it("computes pred(0) = 0", () => {
      const str = `${predPreamble}
(claim pred0-result (= Nat (pred 0) 0))
(define-tactically pred0-result
  ((exact (same 0))))
`;
      expect(() => evaluatePie(str)).not.toThrow();
    });

    it("computes pred(1) = 0", () => {
      const str = `${predPreamble}
(claim pred1-result (= Nat (pred 1) 0))
(define-tactically pred1-result
  ((exact (same 0))))
`;
      expect(() => evaluatePie(str)).not.toThrow();
    });

    it("computes pred(2) = 1", () => {
      const str = `${predPreamble}
(claim pred2-result (= Nat (pred 2) 1))
(define-tactically pred2-result
  ((exact (same 1))))
`;
      expect(() => evaluatePie(str)).not.toThrow();
    });

    it("computes pred(5) = 4", () => {
      const str = `${predPreamble}
(claim pred5-result (= Nat (pred 5) 4))
(define-tactically pred5-result
  ((exact (same 4))))
`;
      expect(() => evaluatePie(str)).not.toThrow();
    });

    it("computes pred(10) = 9", () => {
      const str = `${predPreamble}
(claim pred10-result (= Nat (pred 10) 9))
(define-tactically pred10-result
  ((exact (same 9))))
`;
      expect(() => evaluatePie(str)).not.toThrow();
    });

    it("proves pred(add1(n)) = n for concrete n=3", () => {
      const str = `${predPreamble}
(claim pred-succ-3 (= Nat (pred (add1 3)) 3))
(define-tactically pred-succ-3
  ((exact (same 3))))
`;
      expect(() => evaluatePie(str)).not.toThrow();
    });

    it("proves pred(add1(n)) = n for all n using which-Nat reduction", () => {
      const str = `${predPreamble}
(claim pred-succ (Π ((n Nat)) (= Nat (pred (add1 n)) n)))
(define-tactically pred-succ
  ((intro n)
   (exact (same n))))
`;
      expect(() => evaluatePie(str)).not.toThrow();
    });

    it("defines which-Nat based is-zero predicate and tests on 0", () => {
      const str = `${arithPreamble}
(claim is-zero (→ Nat Nat))
(define is-zero (λ (n) (which-Nat n 1 (λ (n-1) 0))))
(claim is-zero-0-result (= Nat (is-zero 0) 1))
(define-tactically is-zero-0-result
  ((exact (same 1))))
`;
      expect(() => evaluatePie(str)).not.toThrow();
    });

    it("tests is-zero on 1 returns 0", () => {
      const str = `${arithPreamble}
(claim is-zero (→ Nat Nat))
(define is-zero (λ (n) (which-Nat n 1 (λ (n-1) 0))))
(claim is-zero-1-result (= Nat (is-zero 1) 0))
(define-tactically is-zero-1-result
  ((exact (same 0))))
`;
      expect(() => evaluatePie(str)).not.toThrow();
    });

    it("tests is-zero on 5 returns 0", () => {
      const str = `${arithPreamble}
(claim is-zero (→ Nat Nat))
(define is-zero (λ (n) (which-Nat n 1 (λ (n-1) 0))))
(claim is-zero-5-result (= Nat (is-zero 5) 0))
(define-tactically is-zero-5-result
  ((exact (same 0))))
`;
      expect(() => evaluatePie(str)).not.toThrow();
    });

  });

  describe("Monus (Truncated Subtraction)", () => {

    it("computes monus(0, 0) = 0", () => {
      const str = `${monusPreamble}
(claim monus-0-0-result (= Nat (monus 0 0) 0))
(define-tactically monus-0-0-result
  ((exact (same 0))))
`;
      expect(() => evaluatePie(str)).not.toThrow();
    });

    it("computes monus(5, 0) = 5", () => {
      const str = `${monusPreamble}
(claim monus-5-0-result (= Nat (monus 5 0) 5))
(define-tactically monus-5-0-result
  ((exact (same 5))))
`;
      expect(() => evaluatePie(str)).not.toThrow();
    });

    it("computes monus(5, 3) = 2", () => {
      const str = `${monusPreamble}
(claim monus-5-3-result (= Nat (monus 5 3) 2))
(define-tactically monus-5-3-result
  ((exact (same 2))))
`;
      expect(() => evaluatePie(str)).not.toThrow();
    });

    it("computes monus(3, 5) = 0 (truncated)", () => {
      const str = `${monusPreamble}
(claim monus-3-5-result (= Nat (monus 3 5) 0))
(define-tactically monus-3-5-result
  ((exact (same 0))))
`;
      expect(() => evaluatePie(str)).not.toThrow();
    });

    it("computes monus(5, 5) = 0", () => {
      const str = `${monusPreamble}
(claim monus-5-5-result (= Nat (monus 5 5) 0))
(define-tactically monus-5-5-result
  ((exact (same 0))))
`;
      expect(() => evaluatePie(str)).not.toThrow();
    });

    it("computes monus(7, 2) = 5", () => {
      const str = `${monusPreamble}
(claim monus-7-2-result (= Nat (monus 7 2) 5))
(define-tactically monus-7-2-result
  ((exact (same 5))))
`;
      expect(() => evaluatePie(str)).not.toThrow();
    });

    it("computes monus(10, 4) = 6", () => {
      const str = `${monusPreamble}
(claim monus-10-4-result (= Nat (monus 10 4) 6))
(define-tactically monus-10-4-result
  ((exact (same 6))))
`;
      expect(() => evaluatePie(str)).not.toThrow();
    });

    it("computes monus(1, 1) = 0", () => {
      const str = `${monusPreamble}
(claim monus-1-1-result (= Nat (monus 1 1) 0))
(define-tactically monus-1-1-result
  ((exact (same 0))))
`;
      expect(() => evaluatePie(str)).not.toThrow();
    });

    it("proves monus(n, 0) = n for concrete n=4", () => {
      const str = `${monusPreamble}
(claim monus-n-0 (= Nat (monus 4 0) 4))
(define-tactically monus-n-0
  ((exact (same 4))))
`;
      expect(() => evaluatePie(str)).not.toThrow();
    });

    it("proves monus(0, n) = 0 for concrete n=3", () => {
      const str = `${monusPreamble}
(claim monus-0-n (= Nat (monus 0 3) 0))
(define-tactically monus-0-n
  ((exact (same 0))))
`;
      expect(() => evaluatePie(str)).not.toThrow();
    });

  });

  describe("Min and Max", () => {

    it("computes min(3, 5) = 3", () => {
      const str = `${minMaxPreamble}
(claim min-3-5-result (= Nat (min 3 5) 3))
(define-tactically min-3-5-result
  ((exact (same 3))))
`;
      expect(() => evaluatePie(str)).not.toThrow();
    });

    it("computes min(5, 3) = 3", () => {
      const str = `${minMaxPreamble}
(claim min-5-3-result (= Nat (min 5 3) 3))
(define-tactically min-5-3-result
  ((exact (same 3))))
`;
      expect(() => evaluatePie(str)).not.toThrow();
    });

    it("computes min(0, 5) = 0", () => {
      const str = `${minMaxPreamble}
(claim min-0-5-result (= Nat (min 0 5) 0))
(define-tactically min-0-5-result
  ((exact (same 0))))
`;
      expect(() => evaluatePie(str)).not.toThrow();
    });

    it("computes min(4, 4) = 4", () => {
      const str = `${minMaxPreamble}
(claim min-4-4-result (= Nat (min 4 4) 4))
(define-tactically min-4-4-result
  ((exact (same 4))))
`;
      expect(() => evaluatePie(str)).not.toThrow();
    });

    it("computes max(3, 5) = 5", () => {
      const str = `${minMaxPreamble}
(claim max-3-5-result (= Nat (max 3 5) 5))
(define-tactically max-3-5-result
  ((exact (same 5))))
`;
      expect(() => evaluatePie(str)).not.toThrow();
    });

    it("computes max(5, 3) = 5", () => {
      const str = `${minMaxPreamble}
(claim max-5-3-result (= Nat (max 5 3) 5))
(define-tactically max-5-3-result
  ((exact (same 5))))
`;
      expect(() => evaluatePie(str)).not.toThrow();
    });

    it("computes max(0, 0) = 0", () => {
      const str = `${minMaxPreamble}
(claim max-0-0-result (= Nat (max 0 0) 0))
(define-tactically max-0-0-result
  ((exact (same 0))))
`;
      expect(() => evaluatePie(str)).not.toThrow();
    });

    it("computes max(7, 2) = 7", () => {
      const str = `${minMaxPreamble}
(claim max-7-2-result (= Nat (max 7 2) 7))
(define-tactically max-7-2-result
  ((exact (same 7))))
`;
      expect(() => evaluatePie(str)).not.toThrow();
    });

    it("proves min(3,5) = 3 by same", () => {
      const str = `${minMaxPreamble}
(claim min-3-5 (= Nat (min 3 5) 3))
(define-tactically min-3-5
  ((exact (same 3))))
`;
      expect(() => evaluatePie(str)).not.toThrow();
    });

    it("proves max(3,5) = 5 by same", () => {
      const str = `${minMaxPreamble}
(claim max-3-5 (= Nat (max 3 5) 5))
(define-tactically max-3-5
  ((exact (same 5))))
`;
      expect(() => evaluatePie(str)).not.toThrow();
    });

  });

  describe("Double Recursion", () => {

    it("defines double via rec-Nat and computes double(0) = 0", () => {
      const str = `${arithPreamble}
(claim double (→ Nat Nat))
(define double (λ (n) (rec-Nat n 0 (λ (n-1 prev) (add1 (add1 prev))))))
(claim double-0-result (= Nat (double 0) 0))
(define-tactically double-0-result
  ((exact (same 0))))
`;
      expect(() => evaluatePie(str)).not.toThrow();
    });

    it("computes double(1) = 2", () => {
      const str = `${arithPreamble}
(claim double (→ Nat Nat))
(define double (λ (n) (rec-Nat n 0 (λ (n-1 prev) (add1 (add1 prev))))))
(claim double-1-result (= Nat (double 1) 2))
(define-tactically double-1-result
  ((exact (same 2))))
`;
      expect(() => evaluatePie(str)).not.toThrow();
    });

    it("computes double(3) = 6", () => {
      const str = `${arithPreamble}
(claim double (→ Nat Nat))
(define double (λ (n) (rec-Nat n 0 (λ (n-1 prev) (add1 (add1 prev))))))
(claim double-3-result (= Nat (double 3) 6))
(define-tactically double-3-result
  ((exact (same 6))))
`;
      expect(() => evaluatePie(str)).not.toThrow();
    });

    it("computes double(5) = 10", () => {
      const str = `${arithPreamble}
(claim double (→ Nat Nat))
(define double (λ (n) (rec-Nat n 0 (λ (n-1 prev) (add1 (add1 prev))))))
(claim double-5-result (= Nat (double 5) 10))
(define-tactically double-5-result
  ((exact (same 10))))
`;
      expect(() => evaluatePie(str)).not.toThrow();
    });

    it("proves double(n) = n+n by induction on n", () => {
      const str = `${arithPreamble}
(claim double (→ Nat Nat))
(define double (λ (n) (rec-Nat n 0 (λ (n-1 prev) (add1 (add1 prev))))))

(claim +add1 (Π ((n Nat) (m Nat)) (= Nat (+ n (add1 m)) (add1 (+ n m)))))
(define-tactically +add1
  ((intro n)
   (intro m)
   (elim-Nat n)
   (then
     (exact (same (add1 m))))
   (then
     (intro n-1)
     (intro ih)
     (cong ih (+ 1)))))

(claim double=n+n (Π ((n Nat)) (= Nat (double n) (+ n n))))
(define-tactically double=n+n
  ((intro n)
   (elim-Nat n)
   (then
     (exact (same 0)))
   (then
     (intro n-1)
     (intro ih)
     (trans (cong ih (+ 2)) (cong (symm (+add1 n-1 n-1)) (+ 1))))))
`;
      expect(() => evaluatePie(str)).not.toThrow();
    });

    it("defines a step-by-2 function and computes step2(3) = 6", () => {
      const str = `${arithPreamble}
(claim step2 (→ Nat Nat))
(define step2 (λ (n) (iter-Nat n 0 (λ (x) (add1 (add1 x))))))
(claim step2-3-result (= Nat (step2 3) 6))
(define-tactically step2-3-result
  ((exact (same 6))))
`;
      expect(() => evaluatePie(str)).not.toThrow();
    });

    it("defines half via rec-Nat pair trick and computes half(0) = 0", () => {
      const str = `${arithPreamble}
(claim half-pair (→ Nat (Σ ((a Nat)) Nat)))
(define half-pair (λ (n) (rec-Nat n (the (Σ ((a Nat)) Nat) (cons 0 0))
  (λ (n-1 prev)
    (the (Σ ((a Nat)) Nat) (cons (cdr prev) (add1 (car prev))))))))

(claim half (→ Nat Nat))
(define half (λ (n) (car (half-pair n))))
(claim half-0-result (= Nat (half 0) 0))
(define-tactically half-0-result
  ((exact (same 0))))
`;
      expect(() => evaluatePie(str)).not.toThrow();
    });

    it("computes half(1) = 0", () => {
      const str = `${arithPreamble}
(claim half-pair (→ Nat (Σ ((a Nat)) Nat)))
(define half-pair (λ (n) (rec-Nat n (the (Σ ((a Nat)) Nat) (cons 0 0))
  (λ (n-1 prev)
    (the (Σ ((a Nat)) Nat) (cons (cdr prev) (add1 (car prev))))))))

(claim half (→ Nat Nat))
(define half (λ (n) (car (half-pair n))))
(claim half-1-result (= Nat (half 1) 0))
(define-tactically half-1-result
  ((exact (same 0))))
`;
      expect(() => evaluatePie(str)).not.toThrow();
    });

    it("computes half(4) = 2", () => {
      const str = `${arithPreamble}
(claim half-pair (→ Nat (Σ ((a Nat)) Nat)))
(define half-pair (λ (n) (rec-Nat n (the (Σ ((a Nat)) Nat) (cons 0 0))
  (λ (n-1 prev)
    (the (Σ ((a Nat)) Nat) (cons (cdr prev) (add1 (car prev))))))))

(claim half (→ Nat Nat))
(define half (λ (n) (car (half-pair n))))
(claim half-4-result (= Nat (half 4) 2))
(define-tactically half-4-result
  ((exact (same 2))))
`;
      expect(() => evaluatePie(str)).not.toThrow();
    });

    it("computes half(6) = 3", () => {
      const str = `${arithPreamble}
(claim half-pair (→ Nat (Σ ((a Nat)) Nat)))
(define half-pair (λ (n) (rec-Nat n (the (Σ ((a Nat)) Nat) (cons 0 0))
  (λ (n-1 prev)
    (the (Σ ((a Nat)) Nat) (cons (cdr prev) (add1 (car prev))))))))

(claim half (→ Nat Nat))
(define half (λ (n) (car (half-pair n))))
(claim half-6-result (= Nat (half 6) 3))
(define-tactically half-6-result
  ((exact (same 3))))
`;
      expect(() => evaluatePie(str)).not.toThrow();
    });

  });

  describe("Nested Induction Proofs", () => {

    it("proves n*0 = 0 by induction on n", () => {
      const str = `${arithPreamble}
(claim n*0=0 (Π ((n Nat)) (= Nat (* n 0) 0)))
(define-tactically n*0=0
  ((intro n)
   (elim-Nat n)
   (then
     (exact (same 0)))
   (then
     (intro n-1)
     (intro ih)
     (exact ih))))
`;
      expect(() => evaluatePie(str)).not.toThrow();
    });

    it("verifies n*0=0 at n=5", () => {
      const str = `${arithPreamble}
(claim n*0=0 (Π ((n Nat)) (= Nat (* n 0) 0)))
(define-tactically n*0=0
  ((intro n)
   (elim-Nat n)
   (then
     (exact (same 0)))
   (then
     (intro n-1)
     (intro ih)
     (exact ih))))
(n*0=0 5)
`;
      const output = evaluatePie(str);
      expect(output).toContain("(same 0)");
    });

    it("proves 0*n = 0 directly since * reduces on first arg", () => {
      const str = `${arithPreamble}
(claim 0*n=0 (Π ((n Nat)) (= Nat (* 0 n) 0)))
(define-tactically 0*n=0
  ((intro n)
   (exact (same 0))))
`;
      expect(() => evaluatePie(str)).not.toThrow();
    });

    it("proves 1*n = n using n+0=n lemma since (* 1 n) reduces to (+ n 0)", () => {
      const str = `${arithPreamble}
(claim n+0=n (Π ((n Nat)) (= Nat (+ n 0) n)))
(define-tactically n+0=n
  ((intro n)
   (elim-Nat n)
   (then
     (exact (same 0)))
   (then
     (intro n-1)
     (intro ih)
     (cong ih (+ 1)))))

(claim 1*n=n (Π ((n Nat)) (= Nat (* 1 n) n)))
(define-tactically 1*n=n
  ((intro n)
   (exact (n+0=n n))))
`;
      expect(() => evaluatePie(str)).not.toThrow();
    });

    it("proves concrete 2*3 = 6", () => {
      const str = `${arithPreamble}
(claim 2*3=6 (= Nat (* 2 3) 6))
(define-tactically 2*3=6
  ((exact (same 6))))
`;
      expect(() => evaluatePie(str)).not.toThrow();
    });

    it("proves concrete 3*4 = 12", () => {
      const str = `${arithPreamble}
(claim 3*4=12 (= Nat (* 3 4) 12))
(define-tactically 3*4=12
  ((exact (same 12))))
`;
      expect(() => evaluatePie(str)).not.toThrow();
    });

    it("proves n*1 = n by induction on n", () => {
      const str = `${arithPreamble}
(claim n+0=n (Π ((n Nat)) (= Nat (+ n 0) n)))
(define-tactically n+0=n
  ((intro n)
   (elim-Nat n)
   (then
     (exact (same 0)))
   (then
     (intro n-1)
     (intro ih)
     (cong ih (+ 1)))))

(claim n*1=n (Π ((n Nat)) (= Nat (* n 1) n)))
(define-tactically n*1=n
  ((intro n)
   (elim-Nat n)
   (then
     (exact (same 0)))
   (then
     (intro n-1)
     (intro ih)
     (cong ih (+ 1)))))
`;
      expect(() => evaluatePie(str)).not.toThrow();
    });

  });

  describe("Error Cases", () => {

    it("fails when elim-Nat is applied to a pair", () => {
      const str = `${arithPreamble}
(claim bad (Π ((p (Σ ((x Nat)) Nat))) Nat))
(define-tactically bad
  ((intro p)
   (elim-Nat p)
   (then
     (exact 0))
   (then
     (intro n-1)
     (intro ih)
     (exact ih))))
`;
      expect(() => evaluatePie(str)).toThrow();
    });

    it("fails when step case uses wrong type in cong", () => {
      const str = `${arithPreamble}
(claim bad-step (Π ((n Nat)) (= Nat (+ n 0) n)))
(define-tactically bad-step
  ((intro n)
   (elim-Nat n)
   (then
     (exact (same 0)))
   (then
     (intro n-1)
     (intro ih)
     (exact (cong ih (* 2))))))
`;
      expect(() => evaluatePie(str)).toThrow();
    });

    it("fails with three then blocks after elim-Nat (expects exactly two)", () => {
      const str = `${arithPreamble}
(claim too-many (Π ((n Nat)) (= Nat n n)))
(define-tactically too-many
  ((intro n)
   (elim-Nat n)
   (then
     (exact (same 0)))
   (then
     (intro n-1)
     (intro ih)
     (exact (same (add1 n-1))))
   (then
     (exact (same 0)))))
`;
      expect(() => evaluatePie(str)).toThrow();
    });

  });

});
