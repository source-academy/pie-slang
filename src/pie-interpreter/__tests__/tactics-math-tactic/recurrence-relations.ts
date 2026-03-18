import 'jest';
import { evaluatePie } from '../../main';

const arithPreamble = `
(claim + (→ Nat Nat Nat))
(define + (λ (n j) (iter-Nat n j (λ (x) (add1 x)))))

(claim * (→ Nat Nat Nat))
(define * (λ (n m) (iter-Nat n 0 (+ m))))
`;

const fibPreamble = `${arithPreamble}
(claim fib-pair (→ Nat (Σ ((a Nat)) Nat)))
(define fib-pair (λ (n)
  (ind-Nat n
    (λ (k) (Σ ((a Nat)) Nat))
    (the (Σ ((a Nat)) Nat) (cons 0 1))
    (λ (k prev)
      (the (Σ ((a Nat)) Nat) (cons (cdr prev) (+ (car prev) (cdr prev))))))))

(claim fib (→ Nat Nat))
(define fib (λ (n) (car (fib-pair n))))
`;

const factPreamble = `${arithPreamble}
(claim factorial (→ Nat Nat))
(define factorial (λ (n) (rec-Nat n 1 (λ (n-1 prev) (* (add1 n-1) prev)))))
`;

const triPreamble = `${arithPreamble}
(claim tri (→ Nat Nat))
(define tri (λ (n) (rec-Nat n 0 (λ (n-1 prev) (+ (add1 n-1) prev)))))
`;

const powPreamble = `${arithPreamble}
(claim pow2 (→ Nat Nat))
(define pow2 (λ (n) (iter-Nat n 1 (λ (x) (+ x x)))))
`;

describe("Recurrence Relations", () => {

  describe("Fibonacci", () => {

    it("computes fib(0) = 0", () => {
      const str = `${fibPreamble}
(claim fib0-result (= Nat (fib 0) 0))
(define-tactically fib0-result
  ((exact (same 0))))
`;
      expect(() => evaluatePie(str)).not.toThrow();
    });

    it("computes fib(1) = 1", () => {
      const str = `${fibPreamble}
(claim fib1-result (= Nat (fib 1) 1))
(define-tactically fib1-result
  ((exact (same 1))))
`;
      expect(() => evaluatePie(str)).not.toThrow();
    });

    it("computes fib(2) = 1", () => {
      const str = `${fibPreamble}
(claim fib2-result (= Nat (fib 2) 1))
(define-tactically fib2-result
  ((exact (same 1))))
`;
      expect(() => evaluatePie(str)).not.toThrow();
    });

    it("computes fib(3) = 2", () => {
      const str = `${fibPreamble}
(claim fib3-result (= Nat (fib 3) 2))
(define-tactically fib3-result
  ((exact (same 2))))
`;
      expect(() => evaluatePie(str)).not.toThrow();
    });

    it("computes fib(4) = 3", () => {
      const str = `${fibPreamble}
(claim fib4-result (= Nat (fib 4) 3))
(define-tactically fib4-result
  ((exact (same 3))))
`;
      expect(() => evaluatePie(str)).not.toThrow();
    });

    it("computes fib(5) = 5", () => {
      const str = `${fibPreamble}
(claim fib5-result (= Nat (fib 5) 5))
(define-tactically fib5-result
  ((exact (same 5))))
`;
      expect(() => evaluatePie(str)).not.toThrow();
    });

    it("computes fib(6) = 8", () => {
      const str = `${fibPreamble}
(claim fib6-result (= Nat (fib 6) 8))
(define-tactically fib6-result
  ((exact (same 8))))
`;
      expect(() => evaluatePie(str)).not.toThrow();
    });

    it("computes fib(7) = 13", () => {
      const str = `${fibPreamble}
(claim fib7-result (= Nat (fib 7) 13))
(define-tactically fib7-result
  ((exact (same 13))))
`;
      expect(() => evaluatePie(str)).not.toThrow();
    });

    it("computes fib(10) = 55", () => {
      const str = `${fibPreamble}
(claim fib10-result (= Nat (fib 10) 55))
(define-tactically fib10-result
  ((exact (same 55))))
`;
      expect(() => evaluatePie(str)).not.toThrow();
    });

    it("proves fib(0) = 0 by same", () => {
      const str = `${fibPreamble}
(claim fib0 (= Nat (fib 0) 0))
(define-tactically fib0
  ((exact (same 0))))
`;
      expect(() => evaluatePie(str)).not.toThrow();
    });

    it("proves fib(1) = 1 by same", () => {
      const str = `${fibPreamble}
(claim fib1 (= Nat (fib 1) 1))
(define-tactically fib1
  ((exact (same 1))))
`;
      expect(() => evaluatePie(str)).not.toThrow();
    });

    it("proves fib(5) = 5 by same", () => {
      const str = `${fibPreamble}
(claim fib5 (= Nat (fib 5) 5))
(define-tactically fib5
  ((exact (same 5))))
`;
      expect(() => evaluatePie(str)).not.toThrow();
    });

  });

  describe("Triangular Numbers", () => {

    it("computes tri(0) = 0", () => {
      const str = `${triPreamble}
(claim tri0-result (= Nat (tri 0) 0))
(define-tactically tri0-result
  ((exact (same 0))))
`;
      expect(() => evaluatePie(str)).not.toThrow();
    });

    it("computes tri(1) = 1", () => {
      const str = `${triPreamble}
(claim tri1-result (= Nat (tri 1) 1))
(define-tactically tri1-result
  ((exact (same 1))))
`;
      expect(() => evaluatePie(str)).not.toThrow();
    });

    it("computes tri(2) = 3", () => {
      const str = `${triPreamble}
(claim tri2-result (= Nat (tri 2) 3))
(define-tactically tri2-result
  ((exact (same 3))))
`;
      expect(() => evaluatePie(str)).not.toThrow();
    });

    it("computes tri(3) = 6", () => {
      const str = `${triPreamble}
(claim tri3-result (= Nat (tri 3) 6))
(define-tactically tri3-result
  ((exact (same 6))))
`;
      expect(() => evaluatePie(str)).not.toThrow();
    });

    it("computes tri(4) = 10", () => {
      const str = `${triPreamble}
(claim tri4-result (= Nat (tri 4) 10))
(define-tactically tri4-result
  ((exact (same 10))))
`;
      expect(() => evaluatePie(str)).not.toThrow();
    });

    it("computes tri(5) = 15", () => {
      const str = `${triPreamble}
(claim tri5-result (= Nat (tri 5) 15))
(define-tactically tri5-result
  ((exact (same 15))))
`;
      expect(() => evaluatePie(str)).not.toThrow();
    });

    it("proves tri(3) = 6 by same", () => {
      const str = `${triPreamble}
(claim tri3 (= Nat (tri 3) 6))
(define-tactically tri3
  ((exact (same 6))))
`;
      expect(() => evaluatePie(str)).not.toThrow();
    });

    it("proves tri(4) = 10 by same", () => {
      const str = `${triPreamble}
(claim tri4 (= Nat (tri 4) 10))
(define-tactically tri4
  ((exact (same 10))))
`;
      expect(() => evaluatePie(str)).not.toThrow();
    });

    it("verifies 2*tri(3) = 3*4 (the formula n*(n+1)/2 doubled)", () => {
      const str = `${triPreamble}
(claim double-tri3 (= Nat (* 2 (tri 3)) (* 3 4)))
(define-tactically double-tri3
  ((exact (same 12))))
`;
      expect(() => evaluatePie(str)).not.toThrow();
    });

    it("verifies 2*tri(5) = 5*6", () => {
      const str = `${triPreamble}
(claim double-tri5 (= Nat (* 2 (tri 5)) (* 5 6)))
(define-tactically double-tri5
  ((exact (same 30))))
`;
      expect(() => evaluatePie(str)).not.toThrow();
    });

  });

  describe("Factorial", () => {

    it("computes factorial(0) = 1", () => {
      const str = `${factPreamble}
(claim fact0-result (= Nat (factorial 0) 1))
(define-tactically fact0-result
  ((exact (same 1))))
`;
      expect(() => evaluatePie(str)).not.toThrow();
    });

    it("computes factorial(1) = 1", () => {
      const str = `${factPreamble}
(claim fact1-result (= Nat (factorial 1) 1))
(define-tactically fact1-result
  ((exact (same 1))))
`;
      expect(() => evaluatePie(str)).not.toThrow();
    });

    it("computes factorial(2) = 2", () => {
      const str = `${factPreamble}
(claim fact2-result (= Nat (factorial 2) 2))
(define-tactically fact2-result
  ((exact (same 2))))
`;
      expect(() => evaluatePie(str)).not.toThrow();
    });

    it("computes factorial(3) = 6", () => {
      const str = `${factPreamble}
(claim fact3-result (= Nat (factorial 3) 6))
(define-tactically fact3-result
  ((exact (same 6))))
`;
      expect(() => evaluatePie(str)).not.toThrow();
    });

    it("computes factorial(4) = 24", () => {
      const str = `${factPreamble}
(claim fact4-result (= Nat (factorial 4) 24))
(define-tactically fact4-result
  ((exact (same 24))))
`;
      expect(() => evaluatePie(str)).not.toThrow();
    });

    it("computes factorial(5) = 120", () => {
      const str = `${factPreamble}
(claim fact5-result (= Nat (factorial 5) 120))
(define-tactically fact5-result
  ((exact (same 120))))
`;
      expect(() => evaluatePie(str)).not.toThrow();
    });

    it("proves factorial(0) = 1 by same", () => {
      const str = `${factPreamble}
(claim fact0 (= Nat (factorial 0) 1))
(define-tactically fact0
  ((exact (same 1))))
`;
      expect(() => evaluatePie(str)).not.toThrow();
    });

    it("proves factorial(3) = 6 by same", () => {
      const str = `${factPreamble}
(claim fact3 (= Nat (factorial 3) 6))
(define-tactically fact3
  ((exact (same 6))))
`;
      expect(() => evaluatePie(str)).not.toThrow();
    });

    it("proves factorial(4) = 4 * factorial(3) by computation", () => {
      const str = `${factPreamble}
(claim fact4-step (= Nat (factorial 4) (* 4 (factorial 3))))
(define-tactically fact4-step
  ((exact (same 24))))
`;
      expect(() => evaluatePie(str)).not.toThrow();
    });

    it("proves factorial(5) = 5 * factorial(4) by computation", () => {
      const str = `${factPreamble}
(claim fact5-step (= Nat (factorial 5) (* 5 (factorial 4))))
(define-tactically fact5-step
  ((exact (same 120))))
`;
      expect(() => evaluatePie(str)).not.toThrow();
    });

  });

  describe("Powers and Exponential", () => {

    it("computes pow2(0) = 1", () => {
      const str = `${powPreamble}
(claim pow2-0-result (= Nat (pow2 0) 1))
(define-tactically pow2-0-result
  ((exact (same 1))))
`;
      expect(() => evaluatePie(str)).not.toThrow();
    });

    it("computes pow2(1) = 2", () => {
      const str = `${powPreamble}
(claim pow2-1-result (= Nat (pow2 1) 2))
(define-tactically pow2-1-result
  ((exact (same 2))))
`;
      expect(() => evaluatePie(str)).not.toThrow();
    });

    it("computes pow2(2) = 4", () => {
      const str = `${powPreamble}
(claim pow2-2-result (= Nat (pow2 2) 4))
(define-tactically pow2-2-result
  ((exact (same 4))))
`;
      expect(() => evaluatePie(str)).not.toThrow();
    });

    it("computes pow2(3) = 8", () => {
      const str = `${powPreamble}
(claim pow2-3-result (= Nat (pow2 3) 8))
(define-tactically pow2-3-result
  ((exact (same 8))))
`;
      expect(() => evaluatePie(str)).not.toThrow();
    });

    it("computes pow2(4) = 16", () => {
      const str = `${powPreamble}
(claim pow2-4-result (= Nat (pow2 4) 16))
(define-tactically pow2-4-result
  ((exact (same 16))))
`;
      expect(() => evaluatePie(str)).not.toThrow();
    });

    it("computes pow2(5) = 32", () => {
      const str = `${powPreamble}
(claim pow2-5-result (= Nat (pow2 5) 32))
(define-tactically pow2-5-result
  ((exact (same 32))))
`;
      expect(() => evaluatePie(str)).not.toThrow();
    });

    it("proves pow2(3) = 8 by same", () => {
      const str = `${powPreamble}
(claim pow2-3 (= Nat (pow2 3) 8))
(define-tactically pow2-3
  ((exact (same 8))))
`;
      expect(() => evaluatePie(str)).not.toThrow();
    });

    it("defines general power function and computes 3^2 = 9", () => {
      const str = `${arithPreamble}
(claim pow (→ Nat Nat Nat))
(define pow (λ (base exp) (iter-Nat exp 1 (* base))))
(claim pow-3-2-result (= Nat (pow 3 2) 9))
(define-tactically pow-3-2-result
  ((exact (same 9))))
`;
      expect(() => evaluatePie(str)).not.toThrow();
    });

    it("computes 2^4 = 16 with general power", () => {
      const str = `${arithPreamble}
(claim pow (→ Nat Nat Nat))
(define pow (λ (base exp) (iter-Nat exp 1 (* base))))
(claim pow-2-4-result (= Nat (pow 2 4) 16))
(define-tactically pow-2-4-result
  ((exact (same 16))))
`;
      expect(() => evaluatePie(str)).not.toThrow();
    });

    it("proves pow(n, 0) = 1 for concrete n=5", () => {
      const str = `${arithPreamble}
(claim pow (→ Nat Nat Nat))
(define pow (λ (base exp) (iter-Nat exp 1 (* base))))
(claim pow-0 (= Nat (pow 5 0) 1))
(define-tactically pow-0
  ((exact (same 1))))
`;
      expect(() => evaluatePie(str)).not.toThrow();
    });

  });

  describe("Sum Formulas", () => {

    it("verifies sum 1..3 = tri(3) = 6", () => {
      const str = `${triPreamble}
(claim sum-1-to-3 (= Nat (+ 1 (+ 2 3)) (tri 3)))
(define-tactically sum-1-to-3
  ((exact (same 6))))
`;
      expect(() => evaluatePie(str)).not.toThrow();
    });

    it("verifies sum 1..4 = tri(4) = 10", () => {
      const str = `${triPreamble}
(claim sum-1-to-4 (= Nat (+ 1 (+ 2 (+ 3 4))) (tri 4)))
(define-tactically sum-1-to-4
  ((exact (same 10))))
`;
      expect(() => evaluatePie(str)).not.toThrow();
    });

    it("verifies sum 1..5 = tri(5) = 15", () => {
      const str = `${triPreamble}
(claim sum-1-to-5 (= Nat (+ 1 (+ 2 (+ 3 (+ 4 5)))) (tri 5)))
(define-tactically sum-1-to-5
  ((exact (same 15))))
`;
      expect(() => evaluatePie(str)).not.toThrow();
    });

    it("verifies fib(n) + fib(n+1) = fib(n+2) for n=4: fib(4)+fib(5)=fib(6)", () => {
      const str = `${fibPreamble}
(claim fib-recurrence (= Nat (+ (fib 4) (fib 5)) (fib 6)))
(define-tactically fib-recurrence
  ((exact (same 8))))
`;
      expect(() => evaluatePie(str)).not.toThrow();
    });

    it("verifies fib(n) + fib(n+1) = fib(n+2) for n=5: fib(5)+fib(6)=fib(7)", () => {
      const str = `${fibPreamble}
(claim fib-recurrence2 (= Nat (+ (fib 5) (fib 6)) (fib 7)))
(define-tactically fib-recurrence2
  ((exact (same 13))))
`;
      expect(() => evaluatePie(str)).not.toThrow();
    });

  });

  describe("Error Cases", () => {

    it("fails when factorial is given wrong base case", () => {
      const str = `${arithPreamble}
(claim bad-fact (→ Nat Nat))
(define bad-fact (λ (n) (rec-Nat n 0 (λ (n-1 prev) (* (add1 n-1) prev)))))
(claim bad-fact-check (= Nat (bad-fact 3) 6))
(define-tactically bad-fact-check
  ((exact (same 6))))
`;
      expect(() => evaluatePie(str)).toThrow();
    });

    it("fails when trying to prove fib(3) = 3 (it is 2)", () => {
      const str = `${fibPreamble}
(claim fib3-wrong (= Nat (fib 3) 3))
(define-tactically fib3-wrong
  ((exact (same 3))))
`;
      expect(() => evaluatePie(str)).toThrow();
    });

    it("fails when claiming tri(3) = 5 (it is 6)", () => {
      const str = `${triPreamble}
(claim tri3-wrong (= Nat (tri 3) 5))
(define-tactically tri3-wrong
  ((exact (same 5))))
`;
      expect(() => evaluatePie(str)).toThrow();
    });

  });

});
