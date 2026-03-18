import 'jest';
import { evaluatePie } from '../../main';

const arithPreamble = `
(claim + (→ Nat Nat Nat))
(define + (λ (n j) (iter-Nat n j (λ (x) (add1 x)))))
(claim * (→ Nat Nat Nat))
(define * (λ (n m) (iter-Nat n 0 (+ m))))
`;

describe("Divisibility", () => {

  describe("Basic Divisibility Witnesses", () => {

    it("proves 1|1 with witness k=1", () => {
      const str = `${arithPreamble}
(claim 1-divides-1
  (Σ ((k Nat)) (= Nat (* 1 k) 1)))
(define-tactically 1-divides-1
  ((exists 1 k)
   (exact (same 1))))
(claim 1-divides-1-witness (= Nat (car 1-divides-1) 1))
(define-tactically 1-divides-1-witness
  ((exact (same 1))))
`;
      expect(() => evaluatePie(str)).not.toThrow();
    });

    it("proves 1|2 with witness k=2", () => {
      const str = `${arithPreamble}
(claim 1-divides-2
  (Σ ((k Nat)) (= Nat (* 1 k) 2)))
(define-tactically 1-divides-2
  ((exists 2 k)
   (exact (same 2))))
(claim 1-divides-2-witness (= Nat (car 1-divides-2) 2))
(define-tactically 1-divides-2-witness
  ((exact (same 2))))
`;
      expect(() => evaluatePie(str)).not.toThrow();
    });

    it("proves 1|3 with witness k=3", () => {
      const str = `${arithPreamble}
(claim 1-divides-3
  (Σ ((k Nat)) (= Nat (* 1 k) 3)))
(define-tactically 1-divides-3
  ((exists 3 k)
   (exact (same 3))))
(claim 1-divides-3-witness (= Nat (car 1-divides-3) 3))
(define-tactically 1-divides-3-witness
  ((exact (same 3))))
`;
      expect(() => evaluatePie(str)).not.toThrow();
    });

    it("proves 1|5 with witness k=5", () => {
      const str = `${arithPreamble}
(claim 1-divides-5
  (Σ ((k Nat)) (= Nat (* 1 k) 5)))
(define-tactically 1-divides-5
  ((exists 5 k)
   (exact (same 5))))
(claim 1-divides-5-witness (= Nat (car 1-divides-5) 5))
(define-tactically 1-divides-5-witness
  ((exact (same 5))))
`;
      expect(() => evaluatePie(str)).not.toThrow();
    });

    it("proves 1|10 with witness k=10", () => {
      const str = `${arithPreamble}
(claim 1-divides-10
  (Σ ((k Nat)) (= Nat (* 1 k) 10)))
(define-tactically 1-divides-10
  ((exists 10 k)
   (exact (same 10))))
(claim 1-divides-10-witness (= Nat (car 1-divides-10) 10))
(define-tactically 1-divides-10-witness
  ((exact (same 10))))
`;
      expect(() => evaluatePie(str)).not.toThrow();
    });

    it("proves 2|2 (n|n) with witness k=1", () => {
      const str = `${arithPreamble}
(claim 2-divides-2
  (Σ ((k Nat)) (= Nat (* 2 k) 2)))
(define-tactically 2-divides-2
  ((exists 1 k)
   (exact (same 2))))
(claim 2-divides-2-witness (= Nat (car 2-divides-2) 1))
(define-tactically 2-divides-2-witness
  ((exact (same 1))))
`;
      expect(() => evaluatePie(str)).not.toThrow();
    });

    it("proves 3|3 (n|n) with witness k=1", () => {
      const str = `${arithPreamble}
(claim 3-divides-3
  (Σ ((k Nat)) (= Nat (* 3 k) 3)))
(define-tactically 3-divides-3
  ((exists 1 k)
   (exact (same 3))))
(claim 3-divides-3-witness (= Nat (car 3-divides-3) 1))
(define-tactically 3-divides-3-witness
  ((exact (same 1))))
`;
      expect(() => evaluatePie(str)).not.toThrow();
    });

    it("proves 5|5 (n|n) with witness k=1", () => {
      const str = `${arithPreamble}
(claim 5-divides-5
  (Σ ((k Nat)) (= Nat (* 5 k) 5)))
(define-tactically 5-divides-5
  ((exists 1 k)
   (exact (same 5))))
(claim 5-divides-5-witness (= Nat (car 5-divides-5) 1))
(define-tactically 5-divides-5-witness
  ((exact (same 1))))
`;
      expect(() => evaluatePie(str)).not.toThrow();
    });

    it("proves 2|0 (n|0) with witness k=0", () => {
      const str = `${arithPreamble}
(claim 2-divides-0
  (Σ ((k Nat)) (= Nat (* 2 k) 0)))
(define-tactically 2-divides-0
  ((exists 0 k)
   (exact (same 0))))
(claim 2-divides-0-witness (= Nat (car 2-divides-0) 0))
(define-tactically 2-divides-0-witness
  ((exact (same 0))))
`;
      expect(() => evaluatePie(str)).not.toThrow();
    });

    it("proves 7|0 (n|0) with witness k=0", () => {
      const str = `${arithPreamble}
(claim 7-divides-0
  (Σ ((k Nat)) (= Nat (* 7 k) 0)))
(define-tactically 7-divides-0
  ((exists 0 k)
   (exact (same 0))))
(claim 7-divides-0-witness (= Nat (car 7-divides-0) 0))
(define-tactically 7-divides-0-witness
  ((exact (same 0))))
`;
      expect(() => evaluatePie(str)).not.toThrow();
    });

    it("proves 2|4 with witness k=2", () => {
      const str = `${arithPreamble}
(claim 2-divides-4
  (Σ ((k Nat)) (= Nat (* 2 k) 4)))
(define-tactically 2-divides-4
  ((exists 2 k)
   (exact (same 4))))
(claim 2-divides-4-witness (= Nat (car 2-divides-4) 2))
(define-tactically 2-divides-4-witness
  ((exact (same 2))))
`;
      expect(() => evaluatePie(str)).not.toThrow();
    });

    it("proves 2|6 with witness k=3", () => {
      const str = `${arithPreamble}
(claim 2-divides-6
  (Σ ((k Nat)) (= Nat (* 2 k) 6)))
(define-tactically 2-divides-6
  ((exists 3 k)
   (exact (same 6))))
(claim 2-divides-6-witness (= Nat (car 2-divides-6) 3))
(define-tactically 2-divides-6-witness
  ((exact (same 3))))
`;
      expect(() => evaluatePie(str)).not.toThrow();
    });

    it("proves 3|9 with witness k=3", () => {
      const str = `${arithPreamble}
(claim 3-divides-9
  (Σ ((k Nat)) (= Nat (* 3 k) 9)))
(define-tactically 3-divides-9
  ((exists 3 k)
   (exact (same 9))))
(claim 3-divides-9-witness (= Nat (car 3-divides-9) 3))
(define-tactically 3-divides-9-witness
  ((exact (same 3))))
`;
      expect(() => evaluatePie(str)).not.toThrow();
    });

    it("proves 3|12 with witness k=4", () => {
      const str = `${arithPreamble}
(claim 3-divides-12
  (Σ ((k Nat)) (= Nat (* 3 k) 12)))
(define-tactically 3-divides-12
  ((exists 4 k)
   (exact (same 12))))
(claim 3-divides-12-witness (= Nat (car 3-divides-12) 4))
(define-tactically 3-divides-12-witness
  ((exact (same 4))))
`;
      expect(() => evaluatePie(str)).not.toThrow();
    });

    it("proves 5|10 with witness k=2", () => {
      const str = `${arithPreamble}
(claim 5-divides-10
  (Σ ((k Nat)) (= Nat (* 5 k) 10)))
(define-tactically 5-divides-10
  ((exists 2 k)
   (exact (same 10))))
(claim 5-divides-10-witness (= Nat (car 5-divides-10) 2))
(define-tactically 5-divides-10-witness
  ((exact (same 2))))
`;
      expect(() => evaluatePie(str)).not.toThrow();
    });

  });

  describe("Universal Divisibility Properties", () => {

    it("proves d|0 for any d by providing witness 0", () => {
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

(claim d-divides-0
  (Π ((d Nat)) (Σ ((k Nat)) (= Nat (* d k) 0))))
(define-tactically d-divides-0
  ((intro d)
   (exists 0 k)
   (exact (n*0=0 d))))
`;
      expect(() => evaluatePie(str)).not.toThrow();
    });

    it("applies d|0 to d=4 and extracts witness", () => {
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

(claim d-divides-0
  (Π ((d Nat)) (Σ ((k Nat)) (= Nat (* d k) 0))))
(define-tactically d-divides-0
  ((intro d)
   (exists 0 k)
   (exact (n*0=0 d))))
(claim d-divides-0-at-4-witness (= Nat (car (d-divides-0 4)) 0))
(define-tactically d-divides-0-at-4-witness
  ((exact (same 0))))
`;
      expect(() => evaluatePie(str)).not.toThrow();
    });

    it("applies d|0 to d=100 and extracts witness", () => {
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

(claim d-divides-0
  (Π ((d Nat)) (Σ ((k Nat)) (= Nat (* d k) 0))))
(define-tactically d-divides-0
  ((intro d)
   (exists 0 k)
   (exact (n*0=0 d))))
(claim d-divides-0-at-100-witness (= Nat (car (d-divides-0 100)) 0))
(define-tactically d-divides-0-at-100-witness
  ((exact (same 0))))
`;
      expect(() => evaluatePie(str)).not.toThrow();
    });

    it("proves 4|8 with witness k=2", () => {
      const str = `${arithPreamble}
(claim 4-divides-8
  (Σ ((k Nat)) (= Nat (* 4 k) 8)))
(define-tactically 4-divides-8
  ((exists 2 k)
   (exact (same 8))))
(claim 4-divides-8-witness (= Nat (car 4-divides-8) 2))
(define-tactically 4-divides-8-witness
  ((exact (same 2))))
`;
      expect(() => evaluatePie(str)).not.toThrow();
    });

    it("proves 6|12 with witness k=2", () => {
      const str = `${arithPreamble}
(claim 6-divides-12
  (Σ ((k Nat)) (= Nat (* 6 k) 12)))
(define-tactically 6-divides-12
  ((exists 2 k)
   (exact (same 12))))
(claim 6-divides-12-witness (= Nat (car 6-divides-12) 2))
(define-tactically 6-divides-12-witness
  ((exact (same 2))))
`;
      expect(() => evaluatePie(str)).not.toThrow();
    });

    it("proves 4|16 with witness k=4", () => {
      const str = `${arithPreamble}
(claim 4-divides-16
  (Σ ((k Nat)) (= Nat (* 4 k) 16)))
(define-tactically 4-divides-16
  ((exists 4 k)
   (exact (same 16))))
(claim 4-divides-16-witness (= Nat (car 4-divides-16) 4))
(define-tactically 4-divides-16-witness
  ((exact (same 4))))
`;
      expect(() => evaluatePie(str)).not.toThrow();
    });

    it("proves 2|8 with witness k=4", () => {
      const str = `${arithPreamble}
(claim 2-divides-8
  (Σ ((k Nat)) (= Nat (* 2 k) 8)))
(define-tactically 2-divides-8
  ((exists 4 k)
   (exact (same 8))))
(claim 2-divides-8-witness (= Nat (car 2-divides-8) 4))
(define-tactically 2-divides-8-witness
  ((exact (same 4))))
`;
      expect(() => evaluatePie(str)).not.toThrow();
    });

    it("proves 2|10 with witness k=5", () => {
      const str = `${arithPreamble}
(claim 2-divides-10
  (Σ ((k Nat)) (= Nat (* 2 k) 10)))
(define-tactically 2-divides-10
  ((exists 5 k)
   (exact (same 10))))
(claim 2-divides-10-witness (= Nat (car 2-divides-10) 5))
(define-tactically 2-divides-10-witness
  ((exact (same 5))))
`;
      expect(() => evaluatePie(str)).not.toThrow();
    });

    it("proves 3|6 with witness k=2", () => {
      const str = `${arithPreamble}
(claim 3-divides-6
  (Σ ((k Nat)) (= Nat (* 3 k) 6)))
(define-tactically 3-divides-6
  ((exists 2 k)
   (exact (same 6))))
(claim 3-divides-6-witness (= Nat (car 3-divides-6) 2))
(define-tactically 3-divides-6-witness
  ((exact (same 2))))
`;
      expect(() => evaluatePie(str)).not.toThrow();
    });

    it("proves 3|15 with witness k=5", () => {
      const str = `${arithPreamble}
(claim 3-divides-15
  (Σ ((k Nat)) (= Nat (* 3 k) 15)))
(define-tactically 3-divides-15
  ((exists 5 k)
   (exact (same 15))))
(claim 3-divides-15-witness (= Nat (car 3-divides-15) 5))
(define-tactically 3-divides-15-witness
  ((exact (same 5))))
`;
      expect(() => evaluatePie(str)).not.toThrow();
    });

    it("proves 7|14 with witness k=2", () => {
      const str = `${arithPreamble}
(claim 7-divides-14
  (Σ ((k Nat)) (= Nat (* 7 k) 14)))
(define-tactically 7-divides-14
  ((exists 2 k)
   (exact (same 14))))
(claim 7-divides-14-witness (= Nat (car 7-divides-14) 2))
(define-tactically 7-divides-14-witness
  ((exact (same 2))))
`;
      expect(() => evaluatePie(str)).not.toThrow();
    });

    it("proves 5|15 with witness k=3", () => {
      const str = `${arithPreamble}
(claim 5-divides-15
  (Σ ((k Nat)) (= Nat (* 5 k) 15)))
(define-tactically 5-divides-15
  ((exists 3 k)
   (exact (same 15))))
(claim 5-divides-15-witness (= Nat (car 5-divides-15) 3))
(define-tactically 5-divides-15-witness
  ((exact (same 3))))
`;
      expect(() => evaluatePie(str)).not.toThrow();
    });

  });

  describe("Divisibility and Addition", () => {

    it("proves 2|4 and 2|6 bundled together", () => {
      const str = `${arithPreamble}
(claim div-pair
  (Σ ((k1 Nat)) (Σ ((k2 Nat))
    (Σ ((p1 (= Nat (* 2 k1) 4)))
      (= Nat (* 2 k2) 6)))))
(define-tactically div-pair
  ((exists 2 k1)
   (exists 3 k2)
   (split-Pair)
   (then (exact (same 4)))
   (then (exact (same 6)))))
(claim div-pair-witness (= Nat (car div-pair) 2))
(define-tactically div-pair-witness
  ((exact (same 2))))
`;
      expect(() => evaluatePie(str)).not.toThrow();
    });

    it("proves 3|6 and 3|9 bundled together", () => {
      const str = `${arithPreamble}
(claim div-pair-3
  (Σ ((k1 Nat)) (Σ ((k2 Nat))
    (Σ ((p1 (= Nat (* 3 k1) 6)))
      (= Nat (* 3 k2) 9)))))
(define-tactically div-pair-3
  ((exists 2 k1)
   (exists 3 k2)
   (split-Pair)
   (then (exact (same 6)))
   (then (exact (same 9)))))
(claim div-pair-3-witness (= Nat (car div-pair-3) 2))
(define-tactically div-pair-3-witness
  ((exact (same 2))))
`;
      expect(() => evaluatePie(str)).not.toThrow();
    });

    it("proves 2|2 with split-Pair for witness and proof", () => {
      const str = `${arithPreamble}
(claim 2-divides-2-pair
  (Σ ((k Nat)) (= Nat (* 2 k) 2)))
(define-tactically 2-divides-2-pair
  ((exists 1 k)
   (exact (same 2))))
(claim 2-divides-2-pair-car (= Nat (car 2-divides-2-pair) 1))
(define-tactically 2-divides-2-pair-car
  ((exact (same 1))))
(cdr 2-divides-2-pair)
`;
      const output = evaluatePie(str);
      expect(output).toContain("(same 2)");
    });

    it("proves 4|12 with witness k=3", () => {
      const str = `${arithPreamble}
(claim 4-divides-12
  (Σ ((k Nat)) (= Nat (* 4 k) 12)))
(define-tactically 4-divides-12
  ((exists 3 k)
   (exact (same 12))))
(claim 4-divides-12-witness (= Nat (car 4-divides-12) 3))
(define-tactically 4-divides-12-witness
  ((exact (same 3))))
`;
      expect(() => evaluatePie(str)).not.toThrow();
    });

    it("proves 6|18 with witness k=3", () => {
      const str = `${arithPreamble}
(claim 6-divides-18
  (Σ ((k Nat)) (= Nat (* 6 k) 18)))
(define-tactically 6-divides-18
  ((exists 3 k)
   (exact (same 18))))
(claim 6-divides-18-witness (= Nat (car 6-divides-18) 3))
(define-tactically 6-divides-18-witness
  ((exact (same 3))))
`;
      expect(() => evaluatePie(str)).not.toThrow();
    });

    it("proves 5|20 with witness k=4", () => {
      const str = `${arithPreamble}
(claim 5-divides-20
  (Σ ((k Nat)) (= Nat (* 5 k) 20)))
(define-tactically 5-divides-20
  ((exists 4 k)
   (exact (same 20))))
(claim 5-divides-20-witness (= Nat (car 5-divides-20) 4))
(define-tactically 5-divides-20-witness
  ((exact (same 4))))
`;
      expect(() => evaluatePie(str)).not.toThrow();
    });

    it("proves 2|12 with witness k=6", () => {
      const str = `${arithPreamble}
(claim 2-divides-12
  (Σ ((k Nat)) (= Nat (* 2 k) 12)))
(define-tactically 2-divides-12
  ((exists 6 k)
   (exact (same 12))))
(claim 2-divides-12-witness (= Nat (car 2-divides-12) 6))
(define-tactically 2-divides-12-witness
  ((exact (same 6))))
`;
      expect(() => evaluatePie(str)).not.toThrow();
    });

    it("proves 3|18 with witness k=6", () => {
      const str = `${arithPreamble}
(claim 3-divides-18
  (Σ ((k Nat)) (= Nat (* 3 k) 18)))
(define-tactically 3-divides-18
  ((exists 6 k)
   (exact (same 18))))
(claim 3-divides-18-witness (= Nat (car 3-divides-18) 6))
(define-tactically 3-divides-18-witness
  ((exact (same 6))))
`;
      expect(() => evaluatePie(str)).not.toThrow();
    });

    it("proves 4|20 with witness k=5", () => {
      const str = `${arithPreamble}
(claim 4-divides-20
  (Σ ((k Nat)) (= Nat (* 4 k) 20)))
(define-tactically 4-divides-20
  ((exists 5 k)
   (exact (same 20))))
(claim 4-divides-20-witness (= Nat (car 4-divides-20) 5))
(define-tactically 4-divides-20-witness
  ((exact (same 5))))
`;
      expect(() => evaluatePie(str)).not.toThrow();
    });

    it("proves 10|20 with witness k=2", () => {
      const str = `${arithPreamble}
(claim 10-divides-20
  (Σ ((k Nat)) (= Nat (* 10 k) 20)))
(define-tactically 10-divides-20
  ((exists 2 k)
   (exact (same 20))))
(claim 10-divides-20-witness (= Nat (car 10-divides-20) 2))
(define-tactically 10-divides-20-witness
  ((exact (same 2))))
`;
      expect(() => evaluatePie(str)).not.toThrow();
    });

  });

  describe("Divisibility Transitivity", () => {

    it("proves 2|4 and 4|8 chain: witnesses 2 and 2", () => {
      const str = `${arithPreamble}
(claim chain-2-4-8
  (Σ ((k1 Nat)) (Σ ((k2 Nat))
    (Σ ((p1 (= Nat (* 2 k1) 4)))
      (= Nat (* 4 k2) 8)))))
(define-tactically chain-2-4-8
  ((exists 2 k1)
   (exists 2 k2)
   (split-Pair)
   (then (exact (same 4)))
   (then (exact (same 8)))))
`;
      expect(() => evaluatePie(str)).not.toThrow();
    });

    it("proves 2|6 and 6|12 chain", () => {
      const str = `${arithPreamble}
(claim chain-2-6-12
  (Σ ((k1 Nat)) (Σ ((k2 Nat))
    (Σ ((p1 (= Nat (* 2 k1) 6)))
      (= Nat (* 6 k2) 12)))))
(define-tactically chain-2-6-12
  ((exists 3 k1)
   (exists 2 k2)
   (split-Pair)
   (then (exact (same 6)))
   (then (exact (same 12)))))
`;
      expect(() => evaluatePie(str)).not.toThrow();
    });

    it("proves 3|6 and 6|18 chain", () => {
      const str = `${arithPreamble}
(claim chain-3-6-18
  (Σ ((k1 Nat)) (Σ ((k2 Nat))
    (Σ ((p1 (= Nat (* 3 k1) 6)))
      (= Nat (* 6 k2) 18)))))
(define-tactically chain-3-6-18
  ((exists 2 k1)
   (exists 3 k2)
   (split-Pair)
   (then (exact (same 6)))
   (then (exact (same 18)))))
`;
      expect(() => evaluatePie(str)).not.toThrow();
    });

    it("proves 2|4 and 4|16 chain", () => {
      const str = `${arithPreamble}
(claim chain-2-4-16
  (Σ ((k1 Nat)) (Σ ((k2 Nat))
    (Σ ((p1 (= Nat (* 2 k1) 4)))
      (= Nat (* 4 k2) 16)))))
(define-tactically chain-2-4-16
  ((exists 2 k1)
   (exists 4 k2)
   (split-Pair)
   (then (exact (same 4)))
   (then (exact (same 16)))))
`;
      expect(() => evaluatePie(str)).not.toThrow();
    });

    it("proves 2|8 directly as consequence of 2|4|8", () => {
      const str = `${arithPreamble}
(claim 2-divides-8-direct
  (Σ ((k Nat)) (= Nat (* 2 k) 8)))
(define-tactically 2-divides-8-direct
  ((exists 4 k)
   (exact (same 8))))
(claim 2-divides-8-direct-witness (= Nat (car 2-divides-8-direct) 4))
(define-tactically 2-divides-8-direct-witness
  ((exact (same 4))))
`;
      expect(() => evaluatePie(str)).not.toThrow();
    });

    it("proves 2|16 directly", () => {
      const str = `${arithPreamble}
(claim 2-divides-16
  (Σ ((k Nat)) (= Nat (* 2 k) 16)))
(define-tactically 2-divides-16
  ((exists 8 k)
   (exact (same 16))))
(claim 2-divides-16-witness (= Nat (car 2-divides-16) 8))
(define-tactically 2-divides-16-witness
  ((exact (same 8))))
`;
      expect(() => evaluatePie(str)).not.toThrow();
    });

    it("proves 3|18 directly as consequence of 3|6|18", () => {
      const str = `${arithPreamble}
(claim 3-divides-18-direct
  (Σ ((k Nat)) (= Nat (* 3 k) 18)))
(define-tactically 3-divides-18-direct
  ((exists 6 k)
   (exact (same 18))))
(claim 3-divides-18-direct-witness (= Nat (car 3-divides-18-direct) 6))
(define-tactically 3-divides-18-direct-witness
  ((exact (same 6))))
`;
      expect(() => evaluatePie(str)).not.toThrow();
    });

    it("proves 5|25 with witness k=5", () => {
      const str = `${arithPreamble}
(claim 5-divides-25
  (Σ ((k Nat)) (= Nat (* 5 k) 25)))
(define-tactically 5-divides-25
  ((exists 5 k)
   (exact (same 25))))
(claim 5-divides-25-witness (= Nat (car 5-divides-25) 5))
(define-tactically 5-divides-25-witness
  ((exact (same 5))))
`;
      expect(() => evaluatePie(str)).not.toThrow();
    });

    it("proves 2|14 with witness k=7", () => {
      const str = `${arithPreamble}
(claim 2-divides-14
  (Σ ((k Nat)) (= Nat (* 2 k) 14)))
(define-tactically 2-divides-14
  ((exists 7 k)
   (exact (same 14))))
(claim 2-divides-14-witness (= Nat (car 2-divides-14) 7))
(define-tactically 2-divides-14-witness
  ((exact (same 7))))
`;
      expect(() => evaluatePie(str)).not.toThrow();
    });

    it("proves 7|21 with witness k=3", () => {
      const str = `${arithPreamble}
(claim 7-divides-21
  (Σ ((k Nat)) (= Nat (* 7 k) 21)))
(define-tactically 7-divides-21
  ((exists 3 k)
   (exact (same 21))))
(claim 7-divides-21-witness (= Nat (car 7-divides-21) 3))
(define-tactically 7-divides-21-witness
  ((exact (same 3))))
`;
      expect(() => evaluatePie(str)).not.toThrow();
    });

  });

  describe("Error Cases", () => {

    it("rejects wrong witness for 2|6", () => {
      const str = `${arithPreamble}
(claim bad-divides
  (Σ ((k Nat)) (= Nat (* 2 k) 6)))
(define-tactically bad-divides
  ((exists 2 k)
   (exact (same 6))))
`;
      expect(() => evaluatePie(str)).toThrow();
    });

    it("rejects incomplete divisibility proof (missing equality)", () => {
      const str = `${arithPreamble}
(claim incomplete-div
  (Σ ((k Nat)) (= Nat (* 2 k) 4)))
(define-tactically incomplete-div
  ((exists 2 k)))
`;
      expect(() => evaluatePie(str)).toThrow();
    });

    it("rejects exists on non-Sigma type", () => {
      const str = `
(claim bad-exists Nat)
(define-tactically bad-exists
  ((exists 5 k)))
`;
      expect(() => evaluatePie(str)).toThrow();
    });

  });

});
