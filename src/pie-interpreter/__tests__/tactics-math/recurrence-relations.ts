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
(fib 0)
`;
      const output = evaluatePie(str);
      expect(output).toContain("0: Nat");
    });

    it("computes fib(1) = 1", () => {
      const str = `${fibPreamble}
(fib 1)
`;
      const output = evaluatePie(str);
      expect(output).toContain("1: Nat");
    });

    it("computes fib(2) = 1", () => {
      const str = `${fibPreamble}
(fib 2)
`;
      const output = evaluatePie(str);
      expect(output).toContain("1: Nat");
    });

    it("computes fib(3) = 2", () => {
      const str = `${fibPreamble}
(fib 3)
`;
      const output = evaluatePie(str);
      expect(output).toContain("2: Nat");
    });

    it("computes fib(4) = 3", () => {
      const str = `${fibPreamble}
(fib 4)
`;
      const output = evaluatePie(str);
      expect(output).toContain("3: Nat");
    });

    it("computes fib(5) = 5", () => {
      const str = `${fibPreamble}
(fib 5)
`;
      const output = evaluatePie(str);
      expect(output).toContain("5: Nat");
    });

    it("computes fib(6) = 8", () => {
      const str = `${fibPreamble}
(fib 6)
`;
      const output = evaluatePie(str);
      expect(output).toContain("8: Nat");
    });

    it("computes fib(7) = 13", () => {
      const str = `${fibPreamble}
(fib 7)
`;
      const output = evaluatePie(str);
      expect(output).toContain("13: Nat");
    });

    it("computes fib(10) = 55", () => {
      const str = `${fibPreamble}
(fib 10)
`;
      const output = evaluatePie(str);
      expect(output).toContain("55: Nat");
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
(tri 0)
`;
      const output = evaluatePie(str);
      expect(output).toContain("0: Nat");
    });

    it("computes tri(1) = 1", () => {
      const str = `${triPreamble}
(tri 1)
`;
      const output = evaluatePie(str);
      expect(output).toContain("1: Nat");
    });

    it("computes tri(2) = 3", () => {
      const str = `${triPreamble}
(tri 2)
`;
      const output = evaluatePie(str);
      expect(output).toContain("3: Nat");
    });

    it("computes tri(3) = 6", () => {
      const str = `${triPreamble}
(tri 3)
`;
      const output = evaluatePie(str);
      expect(output).toContain("6: Nat");
    });

    it("computes tri(4) = 10", () => {
      const str = `${triPreamble}
(tri 4)
`;
      const output = evaluatePie(str);
      expect(output).toContain("10: Nat");
    });

    it("computes tri(5) = 15", () => {
      const str = `${triPreamble}
(tri 5)
`;
      const output = evaluatePie(str);
      expect(output).toContain("15: Nat");
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
(factorial 0)
`;
      const output = evaluatePie(str);
      expect(output).toContain("1: Nat");
    });

    it("computes factorial(1) = 1", () => {
      const str = `${factPreamble}
(factorial 1)
`;
      const output = evaluatePie(str);
      expect(output).toContain("1: Nat");
    });

    it("computes factorial(2) = 2", () => {
      const str = `${factPreamble}
(factorial 2)
`;
      const output = evaluatePie(str);
      expect(output).toContain("2: Nat");
    });

    it("computes factorial(3) = 6", () => {
      const str = `${factPreamble}
(factorial 3)
`;
      const output = evaluatePie(str);
      expect(output).toContain("6: Nat");
    });

    it("computes factorial(4) = 24", () => {
      const str = `${factPreamble}
(factorial 4)
`;
      const output = evaluatePie(str);
      expect(output).toContain("24: Nat");
    });

    it("computes factorial(5) = 120", () => {
      const str = `${factPreamble}
(factorial 5)
`;
      const output = evaluatePie(str);
      expect(output).toContain("120: Nat");
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
(pow2 0)
`;
      const output = evaluatePie(str);
      expect(output).toContain("1: Nat");
    });

    it("computes pow2(1) = 2", () => {
      const str = `${powPreamble}
(pow2 1)
`;
      const output = evaluatePie(str);
      expect(output).toContain("2: Nat");
    });

    it("computes pow2(2) = 4", () => {
      const str = `${powPreamble}
(pow2 2)
`;
      const output = evaluatePie(str);
      expect(output).toContain("4: Nat");
    });

    it("computes pow2(3) = 8", () => {
      const str = `${powPreamble}
(pow2 3)
`;
      const output = evaluatePie(str);
      expect(output).toContain("8: Nat");
    });

    it("computes pow2(4) = 16", () => {
      const str = `${powPreamble}
(pow2 4)
`;
      const output = evaluatePie(str);
      expect(output).toContain("16: Nat");
    });

    it("computes pow2(5) = 32", () => {
      const str = `${powPreamble}
(pow2 5)
`;
      const output = evaluatePie(str);
      expect(output).toContain("32: Nat");
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
(pow 3 2)
`;
      const output = evaluatePie(str);
      expect(output).toContain("9: Nat");
    });

    it("computes 2^4 = 16 with general power", () => {
      const str = `${arithPreamble}
(claim pow (→ Nat Nat Nat))
(define pow (λ (base exp) (iter-Nat exp 1 (* base))))
(pow 2 4)
`;
      const output = evaluatePie(str);
      expect(output).toContain("16: Nat");
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
