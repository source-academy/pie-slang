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
(car 1-divides-1)
`;
      const output = evaluatePie(str);
      expect(output).toContain("1: Nat");
    });

    it("proves 1|2 with witness k=2", () => {
      const str = `${arithPreamble}
(claim 1-divides-2
  (Σ ((k Nat)) (= Nat (* 1 k) 2)))
(define-tactically 1-divides-2
  ((exists 2 k)
   (exact (same 2))))
(car 1-divides-2)
`;
      const output = evaluatePie(str);
      expect(output).toContain("2: Nat");
    });

    it("proves 1|3 with witness k=3", () => {
      const str = `${arithPreamble}
(claim 1-divides-3
  (Σ ((k Nat)) (= Nat (* 1 k) 3)))
(define-tactically 1-divides-3
  ((exists 3 k)
   (exact (same 3))))
(car 1-divides-3)
`;
      const output = evaluatePie(str);
      expect(output).toContain("3: Nat");
    });

    it("proves 1|5 with witness k=5", () => {
      const str = `${arithPreamble}
(claim 1-divides-5
  (Σ ((k Nat)) (= Nat (* 1 k) 5)))
(define-tactically 1-divides-5
  ((exists 5 k)
   (exact (same 5))))
(car 1-divides-5)
`;
      const output = evaluatePie(str);
      expect(output).toContain("5: Nat");
    });

    it("proves 1|10 with witness k=10", () => {
      const str = `${arithPreamble}
(claim 1-divides-10
  (Σ ((k Nat)) (= Nat (* 1 k) 10)))
(define-tactically 1-divides-10
  ((exists 10 k)
   (exact (same 10))))
(car 1-divides-10)
`;
      const output = evaluatePie(str);
      expect(output).toContain("10: Nat");
    });

    it("proves 2|2 (n|n) with witness k=1", () => {
      const str = `${arithPreamble}
(claim 2-divides-2
  (Σ ((k Nat)) (= Nat (* 2 k) 2)))
(define-tactically 2-divides-2
  ((exists 1 k)
   (exact (same 2))))
(car 2-divides-2)
`;
      const output = evaluatePie(str);
      expect(output).toContain("1: Nat");
    });

    it("proves 3|3 (n|n) with witness k=1", () => {
      const str = `${arithPreamble}
(claim 3-divides-3
  (Σ ((k Nat)) (= Nat (* 3 k) 3)))
(define-tactically 3-divides-3
  ((exists 1 k)
   (exact (same 3))))
(car 3-divides-3)
`;
      const output = evaluatePie(str);
      expect(output).toContain("1: Nat");
    });

    it("proves 5|5 (n|n) with witness k=1", () => {
      const str = `${arithPreamble}
(claim 5-divides-5
  (Σ ((k Nat)) (= Nat (* 5 k) 5)))
(define-tactically 5-divides-5
  ((exists 1 k)
   (exact (same 5))))
(car 5-divides-5)
`;
      const output = evaluatePie(str);
      expect(output).toContain("1: Nat");
    });

    it("proves 2|0 (n|0) with witness k=0", () => {
      const str = `${arithPreamble}
(claim 2-divides-0
  (Σ ((k Nat)) (= Nat (* 2 k) 0)))
(define-tactically 2-divides-0
  ((exists 0 k)
   (exact (same 0))))
(car 2-divides-0)
`;
      const output = evaluatePie(str);
      expect(output).toContain("0: Nat");
    });

    it("proves 7|0 (n|0) with witness k=0", () => {
      const str = `${arithPreamble}
(claim 7-divides-0
  (Σ ((k Nat)) (= Nat (* 7 k) 0)))
(define-tactically 7-divides-0
  ((exists 0 k)
   (exact (same 0))))
(car 7-divides-0)
`;
      const output = evaluatePie(str);
      expect(output).toContain("0: Nat");
    });

    it("proves 2|4 with witness k=2", () => {
      const str = `${arithPreamble}
(claim 2-divides-4
  (Σ ((k Nat)) (= Nat (* 2 k) 4)))
(define-tactically 2-divides-4
  ((exists 2 k)
   (exact (same 4))))
(car 2-divides-4)
`;
      const output = evaluatePie(str);
      expect(output).toContain("2: Nat");
    });

    it("proves 2|6 with witness k=3", () => {
      const str = `${arithPreamble}
(claim 2-divides-6
  (Σ ((k Nat)) (= Nat (* 2 k) 6)))
(define-tactically 2-divides-6
  ((exists 3 k)
   (exact (same 6))))
(car 2-divides-6)
`;
      const output = evaluatePie(str);
      expect(output).toContain("3: Nat");
    });

    it("proves 3|9 with witness k=3", () => {
      const str = `${arithPreamble}
(claim 3-divides-9
  (Σ ((k Nat)) (= Nat (* 3 k) 9)))
(define-tactically 3-divides-9
  ((exists 3 k)
   (exact (same 9))))
(car 3-divides-9)
`;
      const output = evaluatePie(str);
      expect(output).toContain("3: Nat");
    });

    it("proves 3|12 with witness k=4", () => {
      const str = `${arithPreamble}
(claim 3-divides-12
  (Σ ((k Nat)) (= Nat (* 3 k) 12)))
(define-tactically 3-divides-12
  ((exists 4 k)
   (exact (same 12))))
(car 3-divides-12)
`;
      const output = evaluatePie(str);
      expect(output).toContain("4: Nat");
    });

    it("proves 5|10 with witness k=2", () => {
      const str = `${arithPreamble}
(claim 5-divides-10
  (Σ ((k Nat)) (= Nat (* 5 k) 10)))
(define-tactically 5-divides-10
  ((exists 2 k)
   (exact (same 10))))
(car 5-divides-10)
`;
      const output = evaluatePie(str);
      expect(output).toContain("2: Nat");
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
(car (d-divides-0 4))
`;
      const output = evaluatePie(str);
      expect(output).toContain("0: Nat");
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
(car (d-divides-0 100))
`;
      const output = evaluatePie(str);
      expect(output).toContain("0: Nat");
    });

    it("proves 4|8 with witness k=2", () => {
      const str = `${arithPreamble}
(claim 4-divides-8
  (Σ ((k Nat)) (= Nat (* 4 k) 8)))
(define-tactically 4-divides-8
  ((exists 2 k)
   (exact (same 8))))
(car 4-divides-8)
`;
      const output = evaluatePie(str);
      expect(output).toContain("2: Nat");
    });

    it("proves 6|12 with witness k=2", () => {
      const str = `${arithPreamble}
(claim 6-divides-12
  (Σ ((k Nat)) (= Nat (* 6 k) 12)))
(define-tactically 6-divides-12
  ((exists 2 k)
   (exact (same 12))))
(car 6-divides-12)
`;
      const output = evaluatePie(str);
      expect(output).toContain("2: Nat");
    });

    it("proves 4|16 with witness k=4", () => {
      const str = `${arithPreamble}
(claim 4-divides-16
  (Σ ((k Nat)) (= Nat (* 4 k) 16)))
(define-tactically 4-divides-16
  ((exists 4 k)
   (exact (same 16))))
(car 4-divides-16)
`;
      const output = evaluatePie(str);
      expect(output).toContain("4: Nat");
    });

    it("proves 2|8 with witness k=4", () => {
      const str = `${arithPreamble}
(claim 2-divides-8
  (Σ ((k Nat)) (= Nat (* 2 k) 8)))
(define-tactically 2-divides-8
  ((exists 4 k)
   (exact (same 8))))
(car 2-divides-8)
`;
      const output = evaluatePie(str);
      expect(output).toContain("4: Nat");
    });

    it("proves 2|10 with witness k=5", () => {
      const str = `${arithPreamble}
(claim 2-divides-10
  (Σ ((k Nat)) (= Nat (* 2 k) 10)))
(define-tactically 2-divides-10
  ((exists 5 k)
   (exact (same 10))))
(car 2-divides-10)
`;
      const output = evaluatePie(str);
      expect(output).toContain("5: Nat");
    });

    it("proves 3|6 with witness k=2", () => {
      const str = `${arithPreamble}
(claim 3-divides-6
  (Σ ((k Nat)) (= Nat (* 3 k) 6)))
(define-tactically 3-divides-6
  ((exists 2 k)
   (exact (same 6))))
(car 3-divides-6)
`;
      const output = evaluatePie(str);
      expect(output).toContain("2: Nat");
    });

    it("proves 3|15 with witness k=5", () => {
      const str = `${arithPreamble}
(claim 3-divides-15
  (Σ ((k Nat)) (= Nat (* 3 k) 15)))
(define-tactically 3-divides-15
  ((exists 5 k)
   (exact (same 15))))
(car 3-divides-15)
`;
      const output = evaluatePie(str);
      expect(output).toContain("5: Nat");
    });

    it("proves 7|14 with witness k=2", () => {
      const str = `${arithPreamble}
(claim 7-divides-14
  (Σ ((k Nat)) (= Nat (* 7 k) 14)))
(define-tactically 7-divides-14
  ((exists 2 k)
   (exact (same 14))))
(car 7-divides-14)
`;
      const output = evaluatePie(str);
      expect(output).toContain("2: Nat");
    });

    it("proves 5|15 with witness k=3", () => {
      const str = `${arithPreamble}
(claim 5-divides-15
  (Σ ((k Nat)) (= Nat (* 5 k) 15)))
(define-tactically 5-divides-15
  ((exists 3 k)
   (exact (same 15))))
(car 5-divides-15)
`;
      const output = evaluatePie(str);
      expect(output).toContain("3: Nat");
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
(car div-pair)
`;
      const output = evaluatePie(str);
      expect(output).toContain("2: Nat");
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
(car div-pair-3)
`;
      const output = evaluatePie(str);
      expect(output).toContain("2: Nat");
    });

    it("proves 2|2 with split-Pair for witness and proof", () => {
      const str = `${arithPreamble}
(claim 2-divides-2-pair
  (Σ ((k Nat)) (= Nat (* 2 k) 2)))
(define-tactically 2-divides-2-pair
  ((exists 1 k)
   (exact (same 2))))
(car 2-divides-2-pair)
(cdr 2-divides-2-pair)
`;
      const output = evaluatePie(str);
      expect(output).toContain("1: Nat");
      expect(output).toContain("(same 2)");
    });

    it("proves 4|12 with witness k=3", () => {
      const str = `${arithPreamble}
(claim 4-divides-12
  (Σ ((k Nat)) (= Nat (* 4 k) 12)))
(define-tactically 4-divides-12
  ((exists 3 k)
   (exact (same 12))))
(car 4-divides-12)
`;
      const output = evaluatePie(str);
      expect(output).toContain("3: Nat");
    });

    it("proves 6|18 with witness k=3", () => {
      const str = `${arithPreamble}
(claim 6-divides-18
  (Σ ((k Nat)) (= Nat (* 6 k) 18)))
(define-tactically 6-divides-18
  ((exists 3 k)
   (exact (same 18))))
(car 6-divides-18)
`;
      const output = evaluatePie(str);
      expect(output).toContain("3: Nat");
    });

    it("proves 5|20 with witness k=4", () => {
      const str = `${arithPreamble}
(claim 5-divides-20
  (Σ ((k Nat)) (= Nat (* 5 k) 20)))
(define-tactically 5-divides-20
  ((exists 4 k)
   (exact (same 20))))
(car 5-divides-20)
`;
      const output = evaluatePie(str);
      expect(output).toContain("4: Nat");
    });

    it("proves 2|12 with witness k=6", () => {
      const str = `${arithPreamble}
(claim 2-divides-12
  (Σ ((k Nat)) (= Nat (* 2 k) 12)))
(define-tactically 2-divides-12
  ((exists 6 k)
   (exact (same 12))))
(car 2-divides-12)
`;
      const output = evaluatePie(str);
      expect(output).toContain("6: Nat");
    });

    it("proves 3|18 with witness k=6", () => {
      const str = `${arithPreamble}
(claim 3-divides-18
  (Σ ((k Nat)) (= Nat (* 3 k) 18)))
(define-tactically 3-divides-18
  ((exists 6 k)
   (exact (same 18))))
(car 3-divides-18)
`;
      const output = evaluatePie(str);
      expect(output).toContain("6: Nat");
    });

    it("proves 4|20 with witness k=5", () => {
      const str = `${arithPreamble}
(claim 4-divides-20
  (Σ ((k Nat)) (= Nat (* 4 k) 20)))
(define-tactically 4-divides-20
  ((exists 5 k)
   (exact (same 20))))
(car 4-divides-20)
`;
      const output = evaluatePie(str);
      expect(output).toContain("5: Nat");
    });

    it("proves 10|20 with witness k=2", () => {
      const str = `${arithPreamble}
(claim 10-divides-20
  (Σ ((k Nat)) (= Nat (* 10 k) 20)))
(define-tactically 10-divides-20
  ((exists 2 k)
   (exact (same 20))))
(car 10-divides-20)
`;
      const output = evaluatePie(str);
      expect(output).toContain("2: Nat");
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
(car 2-divides-8-direct)
`;
      const output = evaluatePie(str);
      expect(output).toContain("4: Nat");
    });

    it("proves 2|16 directly", () => {
      const str = `${arithPreamble}
(claim 2-divides-16
  (Σ ((k Nat)) (= Nat (* 2 k) 16)))
(define-tactically 2-divides-16
  ((exists 8 k)
   (exact (same 16))))
(car 2-divides-16)
`;
      const output = evaluatePie(str);
      expect(output).toContain("8: Nat");
    });

    it("proves 3|18 directly as consequence of 3|6|18", () => {
      const str = `${arithPreamble}
(claim 3-divides-18-direct
  (Σ ((k Nat)) (= Nat (* 3 k) 18)))
(define-tactically 3-divides-18-direct
  ((exists 6 k)
   (exact (same 18))))
(car 3-divides-18-direct)
`;
      const output = evaluatePie(str);
      expect(output).toContain("6: Nat");
    });

    it("proves 5|25 with witness k=5", () => {
      const str = `${arithPreamble}
(claim 5-divides-25
  (Σ ((k Nat)) (= Nat (* 5 k) 25)))
(define-tactically 5-divides-25
  ((exists 5 k)
   (exact (same 25))))
(car 5-divides-25)
`;
      const output = evaluatePie(str);
      expect(output).toContain("5: Nat");
    });

    it("proves 2|14 with witness k=7", () => {
      const str = `${arithPreamble}
(claim 2-divides-14
  (Σ ((k Nat)) (= Nat (* 2 k) 14)))
(define-tactically 2-divides-14
  ((exists 7 k)
   (exact (same 14))))
(car 2-divides-14)
`;
      const output = evaluatePie(str);
      expect(output).toContain("7: Nat");
    });

    it("proves 7|21 with witness k=3", () => {
      const str = `${arithPreamble}
(claim 7-divides-21
  (Σ ((k Nat)) (= Nat (* 7 k) 21)))
(define-tactically 7-divides-21
  ((exists 3 k)
   (exact (same 21))))
(car 7-divides-21)
`;
      const output = evaluatePie(str);
      expect(output).toContain("3: Nat");
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
