import 'jest';
import { evaluatePie } from '../../main';

const arithPreamble = `
(claim + (→ Nat Nat Nat))
(define + (λ (n j) (iter-Nat n j (λ (x) (add1 x)))))
(claim * (→ Nat Nat Nat))
(define * (λ (n m) (iter-Nat n 0 (+ m))))
`;

const monusDef = `
(claim monus (→ Nat Nat Nat))
(define monus (λ (n m) (iter-Nat m n (λ (x) (which-Nat x 0 (λ (y) y))))))
`;

const minMaxDef = `
(claim min (→ Nat Nat Nat))
(define min (λ (a b) (monus a (monus a b))))
(claim max (→ Nat Nat Nat))
(define max (λ (a b) (+ b (monus a b))))
`;

describe("GCD and Euclidean Properties", () => {

  describe("GCD Base Cases", () => {

    it("proves gcd(0,0)=0 trivially as (= Nat 0 0)", () => {
      const str = `
(claim gcd-0-0 (= Nat 0 0))
(define-tactically gcd-0-0
  ((exact (same 0))))
`;
      expect(() => evaluatePie(str)).not.toThrow();
    });

    it("states gcd(n,0)=n for n=5 as equality", () => {
      const str = `
(claim gcd-5-0 (= Nat 5 5))
(define-tactically gcd-5-0
  ((exact (same 5))))
`;
      expect(() => evaluatePie(str)).not.toThrow();
    });

    it("states gcd(0,n)=n for n=7 as equality", () => {
      const str = `
(claim gcd-0-7 (= Nat 7 7))
(define-tactically gcd-0-7
  ((exact (same 7))))
`;
      expect(() => evaluatePie(str)).not.toThrow();
    });

    it("states gcd(n,n)=n for n=3 as equality", () => {
      const str = `
(claim gcd-3-3 (= Nat 3 3))
(define-tactically gcd-3-3
  ((exact (same 3))))
`;
      expect(() => evaluatePie(str)).not.toThrow();
    });

    it("states gcd(1,n)=1 for n=10 as equality", () => {
      const str = `
(claim gcd-1-10 (= Nat 1 1))
(define-tactically gcd-1-10
  ((exact (same 1))))
`;
      expect(() => evaluatePie(str)).not.toThrow();
    });

    it("states gcd(n,1)=1 for n=8 as equality", () => {
      const str = `
(claim gcd-8-1 (= Nat 1 1))
(define-tactically gcd-8-1
  ((exact (same 1))))
`;
      expect(() => evaluatePie(str)).not.toThrow();
    });

    it("verifies gcd(2,4) common divisor: 2|2 and 2|4", () => {
      const str = `${arithPreamble}
(claim gcd-2-4-witness
  (Σ ((k1 Nat)) (Σ ((k2 Nat))
    (Σ ((p1 (= Nat (* 2 k1) 2)))
      (= Nat (* 2 k2) 4)))))
(define-tactically gcd-2-4-witness
  ((exists 1 k1)
   (exists 2 k2)
   (split-Pair)
   (then (exact (same 2)))
   (then (exact (same 4)))))
`;
      expect(() => evaluatePie(str)).not.toThrow();
    });

    it("verifies gcd(3,6) common divisor: 3|3 and 3|6", () => {
      const str = `${arithPreamble}
(claim gcd-3-6-witness
  (Σ ((k1 Nat)) (Σ ((k2 Nat))
    (Σ ((p1 (= Nat (* 3 k1) 3)))
      (= Nat (* 3 k2) 6)))))
(define-tactically gcd-3-6-witness
  ((exists 1 k1)
   (exists 2 k2)
   (split-Pair)
   (then (exact (same 3)))
   (then (exact (same 6)))))
`;
      expect(() => evaluatePie(str)).not.toThrow();
    });

    it("verifies gcd(4,6) common divisor: 2|4 and 2|6", () => {
      const str = `${arithPreamble}
(claim gcd-4-6-witness
  (Σ ((k1 Nat)) (Σ ((k2 Nat))
    (Σ ((p1 (= Nat (* 2 k1) 4)))
      (= Nat (* 2 k2) 6)))))
(define-tactically gcd-4-6-witness
  ((exists 2 k1)
   (exists 3 k2)
   (split-Pair)
   (then (exact (same 4)))
   (then (exact (same 6)))))
`;
      expect(() => evaluatePie(str)).not.toThrow();
    });

    it("verifies gcd(6,9) common divisor: 3|6 and 3|9", () => {
      const str = `${arithPreamble}
(claim gcd-6-9-witness
  (Σ ((k1 Nat)) (Σ ((k2 Nat))
    (Σ ((p1 (= Nat (* 3 k1) 6)))
      (= Nat (* 3 k2) 9)))))
(define-tactically gcd-6-9-witness
  ((exists 2 k1)
   (exists 3 k2)
   (split-Pair)
   (then (exact (same 6)))
   (then (exact (same 9)))))
`;
      expect(() => evaluatePie(str)).not.toThrow();
    });

    it("verifies gcd(12,8) common divisor: 4|12 and 4|8", () => {
      const str = `${arithPreamble}
(claim gcd-12-8-witness
  (Σ ((k1 Nat)) (Σ ((k2 Nat))
    (Σ ((p1 (= Nat (* 4 k1) 12)))
      (= Nat (* 4 k2) 8)))))
(define-tactically gcd-12-8-witness
  ((exists 3 k1)
   (exists 2 k2)
   (split-Pair)
   (then (exact (same 12)))
   (then (exact (same 8)))))
`;
      expect(() => evaluatePie(str)).not.toThrow();
    });

    it("verifies gcd(10,15) common divisor: 5|10 and 5|15", () => {
      const str = `${arithPreamble}
(claim gcd-10-15-witness
  (Σ ((k1 Nat)) (Σ ((k2 Nat))
    (Σ ((p1 (= Nat (* 5 k1) 10)))
      (= Nat (* 5 k2) 15)))))
(define-tactically gcd-10-15-witness
  ((exists 2 k1)
   (exists 3 k2)
   (split-Pair)
   (then (exact (same 10)))
   (then (exact (same 15)))))
`;
      expect(() => evaluatePie(str)).not.toThrow();
    });

  });

  describe("GCD Computation", () => {

    it("computes monus(5,3) = 2", () => {
      const str = `${arithPreamble}
${monusDef}
(monus 5 3)
`;
      const output = evaluatePie(str);
      expect(output).toContain("2: Nat");
    });

    it("computes monus(3,5) = 0", () => {
      const str = `${arithPreamble}
${monusDef}
(monus 3 5)
`;
      const output = evaluatePie(str);
      expect(output).toContain("0: Nat");
    });

    it("computes monus(7,3) = 4", () => {
      const str = `${arithPreamble}
${monusDef}
(monus 7 3)
`;
      const output = evaluatePie(str);
      expect(output).toContain("4: Nat");
    });

    it("computes monus(0,5) = 0", () => {
      const str = `${arithPreamble}
${monusDef}
(monus 0 5)
`;
      const output = evaluatePie(str);
      expect(output).toContain("0: Nat");
    });

    it("computes monus(10,10) = 0", () => {
      const str = `${arithPreamble}
${monusDef}
(monus 10 10)
`;
      const output = evaluatePie(str);
      expect(output).toContain("0: Nat");
    });

    it("computes monus(6,2) = 4", () => {
      const str = `${arithPreamble}
${monusDef}
(monus 6 2)
`;
      const output = evaluatePie(str);
      expect(output).toContain("4: Nat");
    });

    it("computes monus(1,0) = 1", () => {
      const str = `${arithPreamble}
${monusDef}
(monus 1 0)
`;
      const output = evaluatePie(str);
      expect(output).toContain("1: Nat");
    });

    it("computes monus(4,4) = 0", () => {
      const str = `${arithPreamble}
${monusDef}
(monus 4 4)
`;
      const output = evaluatePie(str);
      expect(output).toContain("0: Nat");
    });

    it("computes monus(8,3) = 5", () => {
      const str = `${arithPreamble}
${monusDef}
(monus 8 3)
`;
      const output = evaluatePie(str);
      expect(output).toContain("5: Nat");
    });

    it("computes monus(9,7) = 2", () => {
      const str = `${arithPreamble}
${monusDef}
(monus 9 7)
`;
      const output = evaluatePie(str);
      expect(output).toContain("2: Nat");
    });

    it("computes monus(2,0) = 2", () => {
      const str = `${arithPreamble}
${monusDef}
(monus 2 0)
`;
      const output = evaluatePie(str);
      expect(output).toContain("2: Nat");
    });

    it("computes monus(100,99) = 1", () => {
      const str = `${arithPreamble}
${monusDef}
(monus 100 99)
`;
      const output = evaluatePie(str);
      expect(output).toContain("1: Nat");
    });

  });

  describe("Monus (Truncated Subtraction)", () => {

    it("proves monus(5,3) = 2 as equality", () => {
      const str = `${arithPreamble}
${monusDef}
(claim monus-5-3 (= Nat (monus 5 3) 2))
(define-tactically monus-5-3
  ((exact (same 2))))
`;
      expect(() => evaluatePie(str)).not.toThrow();
    });

    it("proves monus(3,5) = 0 as equality", () => {
      const str = `${arithPreamble}
${monusDef}
(claim monus-3-5 (= Nat (monus 3 5) 0))
(define-tactically monus-3-5
  ((exact (same 0))))
`;
      expect(() => evaluatePie(str)).not.toThrow();
    });

    it("proves monus(n,0) = n for n=4 as equality", () => {
      const str = `${arithPreamble}
${monusDef}
(claim monus-4-0 (= Nat (monus 4 0) 4))
(define-tactically monus-4-0
  ((exact (same 4))))
`;
      expect(() => evaluatePie(str)).not.toThrow();
    });

    it("proves monus(0,n) = 0 for n=3 as equality", () => {
      const str = `${arithPreamble}
${monusDef}
(claim monus-0-3 (= Nat (monus 0 3) 0))
(define-tactically monus-0-3
  ((exact (same 0))))
`;
      expect(() => evaluatePie(str)).not.toThrow();
    });

    it("proves monus(n,n) = 0 for n=6 as equality", () => {
      const str = `${arithPreamble}
${monusDef}
(claim monus-6-6 (= Nat (monus 6 6) 0))
(define-tactically monus-6-6
  ((exact (same 0))))
`;
      expect(() => evaluatePie(str)).not.toThrow();
    });

    it("proves monus(7,2) = 5 as equality", () => {
      const str = `${arithPreamble}
${monusDef}
(claim monus-7-2 (= Nat (monus 7 2) 5))
(define-tactically monus-7-2
  ((exact (same 5))))
`;
      expect(() => evaluatePie(str)).not.toThrow();
    });

    it("proves monus(10,4) = 6 as equality", () => {
      const str = `${arithPreamble}
${monusDef}
(claim monus-10-4 (= Nat (monus 10 4) 6))
(define-tactically monus-10-4
  ((exact (same 6))))
`;
      expect(() => evaluatePie(str)).not.toThrow();
    });

    it("proves monus(8,8) = 0 as equality", () => {
      const str = `${arithPreamble}
${monusDef}
(claim monus-8-8 (= Nat (monus 8 8) 0))
(define-tactically monus-8-8
  ((exact (same 0))))
`;
      expect(() => evaluatePie(str)).not.toThrow();
    });

    it("proves monus(1,1) = 0 as equality", () => {
      const str = `${arithPreamble}
${monusDef}
(claim monus-1-1 (= Nat (monus 1 1) 0))
(define-tactically monus-1-1
  ((exact (same 0))))
`;
      expect(() => evaluatePie(str)).not.toThrow();
    });

    it("proves a + monus(b,a) >= b for concrete case a=3, b=7", () => {
      const str = `${arithPreamble}
${monusDef}
(claim sum-monus (= Nat (+ 3 (monus 7 3)) 7))
(define-tactically sum-monus
  ((exact (same 7))))
`;
      expect(() => evaluatePie(str)).not.toThrow();
    });

  });

  describe("GCD Properties", () => {

    it("gcd(6,4) is 2: 2 divides both 6 and 4", () => {
      const str = `${arithPreamble}
(claim gcd-6-4
  (Σ ((d Nat)) (Σ ((k1 Nat)) (Σ ((k2 Nat))
    (Σ ((p1 (= Nat (* d k1) 6)))
      (= Nat (* d k2) 4))))))
(define-tactically gcd-6-4
  ((exists 2 d)
   (exists 3 k1)
   (exists 2 k2)
   (split-Pair)
   (then (exact (same 6)))
   (then (exact (same 4)))))
(car gcd-6-4)
`;
      const output = evaluatePie(str);
      expect(output).toContain("2: Nat");
    });

    it("gcd(9,6) is 3: 3 divides both 9 and 6", () => {
      const str = `${arithPreamble}
(claim gcd-9-6
  (Σ ((d Nat)) (Σ ((k1 Nat)) (Σ ((k2 Nat))
    (Σ ((p1 (= Nat (* d k1) 9)))
      (= Nat (* d k2) 6))))))
(define-tactically gcd-9-6
  ((exists 3 d)
   (exists 3 k1)
   (exists 2 k2)
   (split-Pair)
   (then (exact (same 9)))
   (then (exact (same 6)))))
(car gcd-9-6)
`;
      const output = evaluatePie(str);
      expect(output).toContain("3: Nat");
    });

    it("gcd(8,12) is 4: 4 divides both 8 and 12", () => {
      const str = `${arithPreamble}
(claim gcd-8-12
  (Σ ((d Nat)) (Σ ((k1 Nat)) (Σ ((k2 Nat))
    (Σ ((p1 (= Nat (* d k1) 8)))
      (= Nat (* d k2) 12))))))
(define-tactically gcd-8-12
  ((exists 4 d)
   (exists 2 k1)
   (exists 3 k2)
   (split-Pair)
   (then (exact (same 8)))
   (then (exact (same 12)))))
(car gcd-8-12)
`;
      const output = evaluatePie(str);
      expect(output).toContain("4: Nat");
    });

    it("gcd(15,10) is 5: 5 divides both 15 and 10", () => {
      const str = `${arithPreamble}
(claim gcd-15-10
  (Σ ((d Nat)) (Σ ((k1 Nat)) (Σ ((k2 Nat))
    (Σ ((p1 (= Nat (* d k1) 15)))
      (= Nat (* d k2) 10))))))
(define-tactically gcd-15-10
  ((exists 5 d)
   (exists 3 k1)
   (exists 2 k2)
   (split-Pair)
   (then (exact (same 15)))
   (then (exact (same 10)))))
(car gcd-15-10)
`;
      const output = evaluatePie(str);
      expect(output).toContain("5: Nat");
    });

    it("gcd(14,21) is 7: 7 divides both 14 and 21", () => {
      const str = `${arithPreamble}
(claim gcd-14-21
  (Σ ((d Nat)) (Σ ((k1 Nat)) (Σ ((k2 Nat))
    (Σ ((p1 (= Nat (* d k1) 14)))
      (= Nat (* d k2) 21))))))
(define-tactically gcd-14-21
  ((exists 7 d)
   (exists 2 k1)
   (exists 3 k2)
   (split-Pair)
   (then (exact (same 14)))
   (then (exact (same 21)))))
(car gcd-14-21)
`;
      const output = evaluatePie(str);
      expect(output).toContain("7: Nat");
    });

    it("gcd(18,12) is 6: 6 divides both 18 and 12", () => {
      const str = `${arithPreamble}
(claim gcd-18-12
  (Σ ((d Nat)) (Σ ((k1 Nat)) (Σ ((k2 Nat))
    (Σ ((p1 (= Nat (* d k1) 18)))
      (= Nat (* d k2) 12))))))
(define-tactically gcd-18-12
  ((exists 6 d)
   (exists 3 k1)
   (exists 2 k2)
   (split-Pair)
   (then (exact (same 18)))
   (then (exact (same 12)))))
(car gcd-18-12)
`;
      const output = evaluatePie(str);
      expect(output).toContain("6: Nat");
    });

    it("Bezout-like: 2*3 - 1*4 = 2 for gcd(4,6)=2 using monus", () => {
      const str = `${arithPreamble}
${monusDef}
(claim bezout-4-6 (= Nat (monus (* 2 3) (* 1 4)) 2))
(define-tactically bezout-4-6
  ((exact (same 2))))
`;
      expect(() => evaluatePie(str)).not.toThrow();
    });

    it("Bezout-like: 2*5 - 3*3 = 1 for gcd(3,5)=1 using monus", () => {
      const str = `${arithPreamble}
${monusDef}
(claim bezout-3-5 (= Nat (monus (* 2 5) (* 3 3)) 1))
(define-tactically bezout-3-5
  ((exact (same 1))))
`;
      expect(() => evaluatePie(str)).not.toThrow();
    });

    it("gcd(20,15) is 5: 5 divides both 20 and 15", () => {
      const str = `${arithPreamble}
(claim gcd-20-15
  (Σ ((d Nat)) (Σ ((k1 Nat)) (Σ ((k2 Nat))
    (Σ ((p1 (= Nat (* d k1) 20)))
      (= Nat (* d k2) 15))))))
(define-tactically gcd-20-15
  ((exists 5 d)
   (exists 4 k1)
   (exists 3 k2)
   (split-Pair)
   (then (exact (same 20)))
   (then (exact (same 15)))))
(car gcd-20-15)
`;
      const output = evaluatePie(str);
      expect(output).toContain("5: Nat");
    });

    it("gcd(16,24) is 8: 8 divides both 16 and 24", () => {
      const str = `${arithPreamble}
(claim gcd-16-24
  (Σ ((d Nat)) (Σ ((k1 Nat)) (Σ ((k2 Nat))
    (Σ ((p1 (= Nat (* d k1) 16)))
      (= Nat (* d k2) 24))))))
(define-tactically gcd-16-24
  ((exists 8 d)
   (exists 2 k1)
   (exists 3 k2)
   (split-Pair)
   (then (exact (same 16)))
   (then (exact (same 24)))))
(car gcd-16-24)
`;
      const output = evaluatePie(str);
      expect(output).toContain("8: Nat");
    });

    it("coprime: gcd(7,9) is 1: 1 divides both 7 and 9", () => {
      const str = `${arithPreamble}
(claim coprime-7-9
  (Σ ((k1 Nat)) (Σ ((k2 Nat))
    (Σ ((p1 (= Nat (* 1 k1) 7)))
      (= Nat (* 1 k2) 9)))))
(define-tactically coprime-7-9
  ((exists 7 k1)
   (exists 9 k2)
   (split-Pair)
   (then (exact (same 7)))
   (then (exact (same 9)))))
`;
      expect(() => evaluatePie(str)).not.toThrow();
    });

    it("coprime: gcd(5,7) is 1: 1 divides both 5 and 7", () => {
      const str = `${arithPreamble}
(claim coprime-5-7
  (Σ ((k1 Nat)) (Σ ((k2 Nat))
    (Σ ((p1 (= Nat (* 1 k1) 5)))
      (= Nat (* 1 k2) 7)))))
(define-tactically coprime-5-7
  ((exists 5 k1)
   (exists 7 k2)
   (split-Pair)
   (then (exact (same 5)))
   (then (exact (same 7)))))
`;
      expect(() => evaluatePie(str)).not.toThrow();
    });

    it("coprime: gcd(3,8) is 1: 1 divides both 3 and 8", () => {
      const str = `${arithPreamble}
(claim coprime-3-8
  (Σ ((k1 Nat)) (Σ ((k2 Nat))
    (Σ ((p1 (= Nat (* 1 k1) 3)))
      (= Nat (* 1 k2) 8)))))
(define-tactically coprime-3-8
  ((exists 3 k1)
   (exists 8 k2)
   (split-Pair)
   (then (exact (same 3)))
   (then (exact (same 8)))))
`;
      expect(() => evaluatePie(str)).not.toThrow();
    });

  });

  describe("Error Cases", () => {

    it("rejects wrong common divisor witness", () => {
      const str = `${arithPreamble}
(claim bad-gcd
  (Σ ((k Nat)) (= Nat (* 3 k) 8)))
(define-tactically bad-gcd
  ((exists 2 k)
   (exact (same 8))))
`;
      expect(() => evaluatePie(str)).toThrow();
    });

    it("rejects monus with non-Nat argument in type position", () => {
      const str = `${arithPreamble}
${monusDef}
(claim bad-monus (= Nat (monus 5 3) 5))
(define-tactically bad-monus
  ((exact (same 5))))
`;
      expect(() => evaluatePie(str)).toThrow();
    });

    it("rejects split-Pair on non-pair type", () => {
      const str = `
(claim bad-split Nat)
(define-tactically bad-split
  ((split-Pair)
   (then (exact 1))
   (then (exact 2))))
`;
      expect(() => evaluatePie(str)).toThrow();
    });

  });

});
