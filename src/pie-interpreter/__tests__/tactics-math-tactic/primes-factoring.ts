import 'jest';
import { evaluatePie } from '../../main';

const arithPreamble = `
(claim + (→ Nat Nat Nat))
(define + (λ (n j) (iter-Nat n j (λ (x) (add1 x)))))
(claim * (→ Nat Nat Nat))
(define * (λ (n m) (iter-Nat n 0 (+ m))))
`;

describe("Primes and Factoring", () => {

  describe("Compositeness Witnesses", () => {

    it("proves 4 = 2*2 as factorization witness", () => {
      const str = `${arithPreamble}
(claim factor-4
  (Σ ((a Nat)) (Σ ((b Nat)) (= Nat (* a b) 4))))
(define-tactically factor-4
  ((exists 2 a)
   (exists 2 b)
   (exact (same 4))))
(claim car-factor-4 (= Nat (car factor-4) 2))
(define-tactically car-factor-4
  ((exact (same 2))))
`;
      expect(() => evaluatePie(str)).not.toThrow();
    });

    it("proves 6 = 2*3 as factorization witness", () => {
      const str = `${arithPreamble}
(claim factor-6
  (Σ ((a Nat)) (Σ ((b Nat)) (= Nat (* a b) 6))))
(define-tactically factor-6
  ((exists 2 a)
   (exists 3 b)
   (exact (same 6))))
(claim car-factor-6 (= Nat (car factor-6) 2))
(define-tactically car-factor-6
  ((exact (same 2))))
`;
      expect(() => evaluatePie(str)).not.toThrow();
    });

    it("proves 6 = 3*2 as alternative factorization", () => {
      const str = `${arithPreamble}
(claim factor-6-alt
  (Σ ((a Nat)) (Σ ((b Nat)) (= Nat (* a b) 6))))
(define-tactically factor-6-alt
  ((exists 3 a)
   (exists 2 b)
   (exact (same 6))))
(claim car-factor-6-alt (= Nat (car factor-6-alt) 3))
(define-tactically car-factor-6-alt
  ((exact (same 3))))
`;
      expect(() => evaluatePie(str)).not.toThrow();
    });

    it("proves 8 = 2*4 as factorization witness", () => {
      const str = `${arithPreamble}
(claim factor-8
  (Σ ((a Nat)) (Σ ((b Nat)) (= Nat (* a b) 8))))
(define-tactically factor-8
  ((exists 2 a)
   (exists 4 b)
   (exact (same 8))))
(claim car-factor-8 (= Nat (car factor-8) 2))
(define-tactically car-factor-8
  ((exact (same 2))))
`;
      expect(() => evaluatePie(str)).not.toThrow();
    });

    it("proves 9 = 3*3 as factorization witness", () => {
      const str = `${arithPreamble}
(claim factor-9
  (Σ ((a Nat)) (Σ ((b Nat)) (= Nat (* a b) 9))))
(define-tactically factor-9
  ((exists 3 a)
   (exists 3 b)
   (exact (same 9))))
(claim car-factor-9 (= Nat (car factor-9) 3))
(define-tactically car-factor-9
  ((exact (same 3))))
`;
      expect(() => evaluatePie(str)).not.toThrow();
    });

    it("proves 10 = 2*5 as factorization witness", () => {
      const str = `${arithPreamble}
(claim factor-10
  (Σ ((a Nat)) (Σ ((b Nat)) (= Nat (* a b) 10))))
(define-tactically factor-10
  ((exists 2 a)
   (exists 5 b)
   (exact (same 10))))
(claim car-factor-10 (= Nat (car factor-10) 2))
(define-tactically car-factor-10
  ((exact (same 2))))
`;
      expect(() => evaluatePie(str)).not.toThrow();
    });

    it("proves 12 = 3*4 as factorization witness", () => {
      const str = `${arithPreamble}
(claim factor-12
  (Σ ((a Nat)) (Σ ((b Nat)) (= Nat (* a b) 12))))
(define-tactically factor-12
  ((exists 3 a)
   (exists 4 b)
   (exact (same 12))))
(claim car-factor-12 (= Nat (car factor-12) 3))
(define-tactically car-factor-12
  ((exact (same 3))))
`;
      expect(() => evaluatePie(str)).not.toThrow();
    });

    it("proves 12 = 2*6 as alternative factorization", () => {
      const str = `${arithPreamble}
(claim factor-12-alt
  (Σ ((a Nat)) (Σ ((b Nat)) (= Nat (* a b) 12))))
(define-tactically factor-12-alt
  ((exists 2 a)
   (exists 6 b)
   (exact (same 12))))
(claim car-factor-12-alt (= Nat (car factor-12-alt) 2))
(define-tactically car-factor-12-alt
  ((exact (same 2))))
`;
      expect(() => evaluatePie(str)).not.toThrow();
    });

    it("proves 15 = 3*5 as factorization witness", () => {
      const str = `${arithPreamble}
(claim factor-15
  (Σ ((a Nat)) (Σ ((b Nat)) (= Nat (* a b) 15))))
(define-tactically factor-15
  ((exists 3 a)
   (exists 5 b)
   (exact (same 15))))
(claim car-factor-15 (= Nat (car factor-15) 3))
(define-tactically car-factor-15
  ((exact (same 3))))
`;
      expect(() => evaluatePie(str)).not.toThrow();
    });

    it("proves 15 = 5*3 as alternative factorization", () => {
      const str = `${arithPreamble}
(claim factor-15-alt
  (Σ ((a Nat)) (Σ ((b Nat)) (= Nat (* a b) 15))))
(define-tactically factor-15-alt
  ((exists 5 a)
   (exists 3 b)
   (exact (same 15))))
(claim car-factor-15-alt (= Nat (car factor-15-alt) 5))
(define-tactically car-factor-15-alt
  ((exact (same 5))))
`;
      expect(() => evaluatePie(str)).not.toThrow();
    });

    it("proves 16 = 4*4 as factorization witness", () => {
      const str = `${arithPreamble}
(claim factor-16
  (Σ ((a Nat)) (Σ ((b Nat)) (= Nat (* a b) 16))))
(define-tactically factor-16
  ((exists 4 a)
   (exists 4 b)
   (exact (same 16))))
(claim car-factor-16 (= Nat (car factor-16) 4))
(define-tactically car-factor-16
  ((exact (same 4))))
`;
      expect(() => evaluatePie(str)).not.toThrow();
    });

    it("proves 20 = 4*5 as factorization witness", () => {
      const str = `${arithPreamble}
(claim factor-20
  (Σ ((a Nat)) (Σ ((b Nat)) (= Nat (* a b) 20))))
(define-tactically factor-20
  ((exists 4 a)
   (exists 5 b)
   (exact (same 20))))
(claim car-factor-20 (= Nat (car factor-20) 4))
(define-tactically car-factor-20
  ((exact (same 4))))
`;
      expect(() => evaluatePie(str)).not.toThrow();
    });

  });

  describe("Concrete Factorizations", () => {

    it("extracts both factors of 6 = 2*3", () => {
      const str = `${arithPreamble}
(claim factor-6-full
  (Σ ((a Nat)) (Σ ((b Nat)) (= Nat (* a b) 6))))
(define-tactically factor-6-full
  ((exists 2 a)
   (exists 3 b)
   (exact (same 6))))
(claim car-factor-6-full (= Nat (car factor-6-full) 2))
(define-tactically car-factor-6-full
  ((exact (same 2))))
(claim car-cdr-factor-6-full (= Nat (car (cdr factor-6-full)) 3))
(define-tactically car-cdr-factor-6-full
  ((exact (same 3))))
`;
      expect(() => evaluatePie(str)).not.toThrow();
    });

    it("extracts both factors of 10 = 2*5", () => {
      const str = `${arithPreamble}
(claim factor-10-full
  (Σ ((a Nat)) (Σ ((b Nat)) (= Nat (* a b) 10))))
(define-tactically factor-10-full
  ((exists 2 a)
   (exists 5 b)
   (exact (same 10))))
(claim car-factor-10-full (= Nat (car factor-10-full) 2))
(define-tactically car-factor-10-full
  ((exact (same 2))))
(claim car-cdr-factor-10-full (= Nat (car (cdr factor-10-full)) 5))
(define-tactically car-cdr-factor-10-full
  ((exact (same 5))))
`;
      expect(() => evaluatePie(str)).not.toThrow();
    });

    it("extracts both factors of 21 = 3*7", () => {
      const str = `${arithPreamble}
(claim factor-21
  (Σ ((a Nat)) (Σ ((b Nat)) (= Nat (* a b) 21))))
(define-tactically factor-21
  ((exists 3 a)
   (exists 7 b)
   (exact (same 21))))
(claim car-factor-21 (= Nat (car factor-21) 3))
(define-tactically car-factor-21
  ((exact (same 3))))
(claim car-cdr-factor-21 (= Nat (car (cdr factor-21)) 7))
(define-tactically car-cdr-factor-21
  ((exact (same 7))))
`;
      expect(() => evaluatePie(str)).not.toThrow();
    });

    it("proves 18 = 2*9", () => {
      const str = `${arithPreamble}
(claim factor-18-2-9
  (Σ ((a Nat)) (Σ ((b Nat)) (= Nat (* a b) 18))))
(define-tactically factor-18-2-9
  ((exists 2 a)
   (exists 9 b)
   (exact (same 18))))
(claim car-factor-18-2-9 (= Nat (car factor-18-2-9) 2))
(define-tactically car-factor-18-2-9
  ((exact (same 2))))
`;
      expect(() => evaluatePie(str)).not.toThrow();
    });

    it("proves 18 = 3*6", () => {
      const str = `${arithPreamble}
(claim factor-18-3-6
  (Σ ((a Nat)) (Σ ((b Nat)) (= Nat (* a b) 18))))
(define-tactically factor-18-3-6
  ((exists 3 a)
   (exists 6 b)
   (exact (same 18))))
(claim car-factor-18-3-6 (= Nat (car factor-18-3-6) 3))
(define-tactically car-factor-18-3-6
  ((exact (same 3))))
`;
      expect(() => evaluatePie(str)).not.toThrow();
    });

    it("proves 24 = 4*6", () => {
      const str = `${arithPreamble}
(claim factor-24
  (Σ ((a Nat)) (Σ ((b Nat)) (= Nat (* a b) 24))))
(define-tactically factor-24
  ((exists 4 a)
   (exists 6 b)
   (exact (same 24))))
(claim car-factor-24 (= Nat (car factor-24) 4))
(define-tactically car-factor-24
  ((exact (same 4))))
`;
      expect(() => evaluatePie(str)).not.toThrow();
    });

    it("proves 25 = 5*5", () => {
      const str = `${arithPreamble}
(claim factor-25
  (Σ ((a Nat)) (Σ ((b Nat)) (= Nat (* a b) 25))))
(define-tactically factor-25
  ((exists 5 a)
   (exists 5 b)
   (exact (same 25))))
(claim car-factor-25 (= Nat (car factor-25) 5))
(define-tactically car-factor-25
  ((exact (same 5))))
`;
      expect(() => evaluatePie(str)).not.toThrow();
    });

    it("proves 14 = 2*7", () => {
      const str = `${arithPreamble}
(claim factor-14
  (Σ ((a Nat)) (Σ ((b Nat)) (= Nat (* a b) 14))))
(define-tactically factor-14
  ((exists 2 a)
   (exists 7 b)
   (exact (same 14))))
(claim car-factor-14 (= Nat (car factor-14) 2))
(define-tactically car-factor-14
  ((exact (same 2))))
`;
      expect(() => evaluatePie(str)).not.toThrow();
    });

    it("verifies * computes 3*7 = 21", () => {
      const str = `${arithPreamble}
(claim mul-3-7 (= Nat (* 3 7) 21))
(define-tactically mul-3-7
  ((exact (same 21))))
`;
      expect(() => evaluatePie(str)).not.toThrow();
    });

    it("verifies * computes 4*6 = 24", () => {
      const str = `${arithPreamble}
(claim mul-4-6 (= Nat (* 4 6) 24))
(define-tactically mul-4-6
  ((exact (same 24))))
`;
      expect(() => evaluatePie(str)).not.toThrow();
    });

    it("verifies * computes 5*5 = 25", () => {
      const str = `${arithPreamble}
(claim mul-5-5 (= Nat (* 5 5) 25))
(define-tactically mul-5-5
  ((exact (same 25))))
`;
      expect(() => evaluatePie(str)).not.toThrow();
    });

    it("verifies * computes 6*7 = 42", () => {
      const str = `${arithPreamble}
(claim mul-6-7 (= Nat (* 6 7) 42))
(define-tactically mul-6-7
  ((exact (same 42))))
`;
      expect(() => evaluatePie(str)).not.toThrow();
    });

  });

  describe("Primality Concepts", () => {

    it("proves n = 1*n for n=5 (trivial factorization)", () => {
      const str = `${arithPreamble}
(claim trivial-factor-5 (= Nat (* 1 5) 5))
(define-tactically trivial-factor-5
  ((exact (same 5))))
`;
      expect(() => evaluatePie(str)).not.toThrow();
    });

    it("proves n = n*1 for n=7 (trivial factorization)", () => {
      const str = `${arithPreamble}
(claim trivial-factor-7 (= Nat (* 7 1) 7))
(define-tactically trivial-factor-7
  ((exact (same 7))))
`;
      expect(() => evaluatePie(str)).not.toThrow();
    });

    it("proves n = 1*n for n=2 (trivial factorization)", () => {
      const str = `${arithPreamble}
(claim trivial-factor-2 (= Nat (* 1 2) 2))
(define-tactically trivial-factor-2
  ((exact (same 2))))
`;
      expect(() => evaluatePie(str)).not.toThrow();
    });

    it("proves n = 1*n for n=3 (trivial factorization)", () => {
      const str = `${arithPreamble}
(claim trivial-factor-3 (= Nat (* 1 3) 3))
(define-tactically trivial-factor-3
  ((exact (same 3))))
`;
      expect(() => evaluatePie(str)).not.toThrow();
    });

    it("proves n = 1*n for n=11 (trivial factorization)", () => {
      const str = `${arithPreamble}
(claim trivial-factor-11 (= Nat (* 1 11) 11))
(define-tactically trivial-factor-11
  ((exact (same 11))))
`;
      expect(() => evaluatePie(str)).not.toThrow();
    });

    it("proves n = 1*n for n=13 (trivial factorization)", () => {
      const str = `${arithPreamble}
(claim trivial-factor-13 (= Nat (* 1 13) 13))
(define-tactically trivial-factor-13
  ((exact (same 13))))
`;
      expect(() => evaluatePie(str)).not.toThrow();
    });

    it("proves 4 is composite: 4 = (add1 (add1 a)) * (add1 (add1 b)) with a=0, b=0", () => {
      const str = `${arithPreamble}
(claim composite-4
  (Σ ((a Nat)) (Σ ((b Nat)) (= Nat (* (add1 (add1 a)) (add1 (add1 b))) 4))))
(define-tactically composite-4
  ((exists 0 a)
   (exists 0 b)
   (exact (same 4))))
`;
      expect(() => evaluatePie(str)).not.toThrow();
    });

    it("proves 6 is composite: 6 = (add1 (add1 a)) * (add1 (add1 b)) with a=0, b=1", () => {
      const str = `${arithPreamble}
(claim composite-6
  (Σ ((a Nat)) (Σ ((b Nat)) (= Nat (* (add1 (add1 a)) (add1 (add1 b))) 6))))
(define-tactically composite-6
  ((exists 0 a)
   (exists 1 b)
   (exact (same 6))))
`;
      expect(() => evaluatePie(str)).not.toThrow();
    });

    it("proves 9 is composite: 9 = (add1 (add1 a)) * (add1 (add1 b)) with a=1, b=1", () => {
      const str = `${arithPreamble}
(claim composite-9
  (Σ ((a Nat)) (Σ ((b Nat)) (= Nat (* (add1 (add1 a)) (add1 (add1 b))) 9))))
(define-tactically composite-9
  ((exists 1 a)
   (exists 1 b)
   (exact (same 9))))
`;
      expect(() => evaluatePie(str)).not.toThrow();
    });

    it("proves 8 is composite: 8 = (add1 (add1 a)) * (add1 (add1 b)) with a=0, b=2", () => {
      const str = `${arithPreamble}
(claim composite-8
  (Σ ((a Nat)) (Σ ((b Nat)) (= Nat (* (add1 (add1 a)) (add1 (add1 b))) 8))))
(define-tactically composite-8
  ((exists 0 a)
   (exists 2 b)
   (exact (same 8))))
`;
      expect(() => evaluatePie(str)).not.toThrow();
    });

    it("proves 10 is composite: 10 = 2*5 with offset encoding a=0, b=3", () => {
      const str = `${arithPreamble}
(claim composite-10
  (Σ ((a Nat)) (Σ ((b Nat)) (= Nat (* (add1 (add1 a)) (add1 (add1 b))) 10))))
(define-tactically composite-10
  ((exists 0 a)
   (exists 3 b)
   (exact (same 10))))
`;
      expect(() => evaluatePie(str)).not.toThrow();
    });

    it("proves 25 is composite: 25 = 5*5 with offset encoding a=3, b=3", () => {
      const str = `${arithPreamble}
(claim composite-25
  (Σ ((a Nat)) (Σ ((b Nat)) (= Nat (* (add1 (add1 a)) (add1 (add1 b))) 25))))
(define-tactically composite-25
  ((exists 3 a)
   (exists 3 b)
   (exact (same 25))))
`;
      expect(() => evaluatePie(str)).not.toThrow();
    });

  });

  describe("Factoring Properties", () => {

    it("proves n*0 = 0 for n=5", () => {
      const str = `${arithPreamble}
(claim times-5-0 (= Nat (* 5 0) 0))
(define-tactically times-5-0
  ((exact (same 0))))
`;
      expect(() => evaluatePie(str)).not.toThrow();
    });

    it("proves 0*n = 0 for n=7", () => {
      const str = `${arithPreamble}
(claim times-0-7 (= Nat (* 0 7) 0))
(define-tactically times-0-7
  ((exact (same 0))))
`;
      expect(() => evaluatePie(str)).not.toThrow();
    });

    it("proves 1*n = n for n=4 by computation", () => {
      const str = `${arithPreamble}
(claim times-1-4 (= Nat (* 1 4) 4))
(define-tactically times-1-4
  ((exact (same 4))))
`;
      expect(() => evaluatePie(str)).not.toThrow();
    });

    it("proves 2*3 = 3*2 by computation (commutativity instance)", () => {
      const str = `${arithPreamble}
(claim times-comm-2-3 (= Nat (* 2 3) (* 3 2)))
(define-tactically times-comm-2-3
  ((exact (same 6))))
`;
      expect(() => evaluatePie(str)).not.toThrow();
    });

    it("proves 3*4 = 4*3 by computation (commutativity instance)", () => {
      const str = `${arithPreamble}
(claim times-comm-3-4 (= Nat (* 3 4) (* 4 3)))
(define-tactically times-comm-3-4
  ((exact (same 12))))
`;
      expect(() => evaluatePie(str)).not.toThrow();
    });

    it("proves 2*5 = 5*2 by computation (commutativity instance)", () => {
      const str = `${arithPreamble}
(claim times-comm-2-5 (= Nat (* 2 5) (* 5 2)))
(define-tactically times-comm-2-5
  ((exact (same 10))))
`;
      expect(() => evaluatePie(str)).not.toThrow();
    });

    it("proves (2*3)*2 = 2*(3*2) by computation (associativity instance)", () => {
      const str = `${arithPreamble}
(claim times-assoc-2-3-2 (= Nat (* (* 2 3) 2) (* 2 (* 3 2))))
(define-tactically times-assoc-2-3-2
  ((exact (same 12))))
`;
      expect(() => evaluatePie(str)).not.toThrow();
    });

    it("proves 2*(3+4) = 2*3 + 2*4 by computation (distributivity instance)", () => {
      const str = `${arithPreamble}
(claim distrib-2-3-4 (= Nat (* 2 (+ 3 4)) (+ (* 2 3) (* 2 4))))
(define-tactically distrib-2-3-4
  ((exact (same 14))))
`;
      expect(() => evaluatePie(str)).not.toThrow();
    });

    it("proves 3*(2+5) = 3*2 + 3*5 by computation (distributivity instance)", () => {
      const str = `${arithPreamble}
(claim distrib-3-2-5 (= Nat (* 3 (+ 2 5)) (+ (* 3 2) (* 3 5))))
(define-tactically distrib-3-2-5
  ((exact (same 21))))
`;
      expect(() => evaluatePie(str)).not.toThrow();
    });

    it("proves n*1 = n for n=6 by computation", () => {
      const str = `${arithPreamble}
(claim times-6-1 (= Nat (* 6 1) 6))
(define-tactically times-6-1
  ((exact (same 6))))
`;
      expect(() => evaluatePie(str)).not.toThrow();
    });

  });

  describe("Error Cases", () => {

    it("verifies * computes 2*7 = 14", () => {
      const str = `${arithPreamble}
(claim mul-2-7 (= Nat (* 2 7) 14))
(define-tactically mul-2-7
  ((exact (same 14))))
`;
      expect(() => evaluatePie(str)).not.toThrow();
    });

    it("rejects wrong factorization: 7 is not 2*3", () => {
      const str = `${arithPreamble}
(claim bad-factor
  (Σ ((a Nat)) (Σ ((b Nat)) (= Nat (* a b) 7))))
(define-tactically bad-factor
  ((exists 2 a)
   (exists 3 b)
   (exact (same 7))))
`;
      expect(() => evaluatePie(str)).toThrow();
    });

    it("rejects wrong compositeness witness for 5", () => {
      const str = `${arithPreamble}
(claim bad-composite-5
  (Σ ((a Nat)) (Σ ((b Nat)) (= Nat (* (add1 (add1 a)) (add1 (add1 b))) 5))))
(define-tactically bad-composite-5
  ((exists 0 a)
   (exists 0 b)
   (exact (same 5))))
`;
      expect(() => evaluatePie(str)).toThrow();
    });

    it("rejects incomplete factorization proof", () => {
      const str = `${arithPreamble}
(claim incomplete-factor
  (Σ ((a Nat)) (Σ ((b Nat)) (= Nat (* a b) 6))))
(define-tactically incomplete-factor
  ((exists 2 a)))
`;
      expect(() => evaluatePie(str)).toThrow();
    });

  });

});
