import 'jest';
import { evaluatePie } from '../../main';

const arithPreamble = `
(claim + (→ Nat Nat Nat))
(define + (λ (n j) (iter-Nat n j (λ (x) (add1 x)))))
(claim * (→ Nat Nat Nat))
(define * (λ (n m) (iter-Nat n 0 (+ m))))
`;

const mod2Def = `
(claim mod2 (→ Nat Nat))
(define mod2 (λ (n) (iter-Nat n 0 (λ (r) (which-Nat r 1 (λ (x) 0))))))
`;

const mod3Def = `
(claim mod3 (→ Nat Nat))
(define mod3 (λ (n) (iter-Nat n 0 (λ (r) (which-Nat r 1 (λ (x) (which-Nat x 2 (λ (y) 0))))))))
`;

describe("Modular Arithmetic", () => {

  describe("Mod 2 Computation", () => {

    it("computes mod2(0) = 0", () => {
      const str = `${arithPreamble}
${mod2Def}
(claim mod2-of-0 (= Nat (mod2 0) 0))
(define-tactically mod2-of-0
  ((exact (same 0))))
`;
      expect(() => evaluatePie(str)).not.toThrow();
    });

    it("computes mod2(1) = 1", () => {
      const str = `${arithPreamble}
${mod2Def}
(claim mod2-of-1 (= Nat (mod2 1) 1))
(define-tactically mod2-of-1
  ((exact (same 1))))
`;
      expect(() => evaluatePie(str)).not.toThrow();
    });

    it("computes mod2(2) = 0", () => {
      const str = `${arithPreamble}
${mod2Def}
(claim mod2-of-2 (= Nat (mod2 2) 0))
(define-tactically mod2-of-2
  ((exact (same 0))))
`;
      expect(() => evaluatePie(str)).not.toThrow();
    });

    it("computes mod2(3) = 1", () => {
      const str = `${arithPreamble}
${mod2Def}
(claim mod2-of-3 (= Nat (mod2 3) 1))
(define-tactically mod2-of-3
  ((exact (same 1))))
`;
      expect(() => evaluatePie(str)).not.toThrow();
    });

    it("computes mod2(4) = 0", () => {
      const str = `${arithPreamble}
${mod2Def}
(claim mod2-of-4 (= Nat (mod2 4) 0))
(define-tactically mod2-of-4
  ((exact (same 0))))
`;
      expect(() => evaluatePie(str)).not.toThrow();
    });

    it("computes mod2(5) = 1", () => {
      const str = `${arithPreamble}
${mod2Def}
(claim mod2-of-5 (= Nat (mod2 5) 1))
(define-tactically mod2-of-5
  ((exact (same 1))))
`;
      expect(() => evaluatePie(str)).not.toThrow();
    });

    it("computes mod2(6) = 0", () => {
      const str = `${arithPreamble}
${mod2Def}
(claim mod2-of-6 (= Nat (mod2 6) 0))
(define-tactically mod2-of-6
  ((exact (same 0))))
`;
      expect(() => evaluatePie(str)).not.toThrow();
    });

    it("computes mod2(7) = 1", () => {
      const str = `${arithPreamble}
${mod2Def}
(claim mod2-of-7 (= Nat (mod2 7) 1))
(define-tactically mod2-of-7
  ((exact (same 1))))
`;
      expect(() => evaluatePie(str)).not.toThrow();
    });

    it("proves mod2(4) = 0 as equality", () => {
      const str = `${arithPreamble}
${mod2Def}
(claim mod2-4-eq (= Nat (mod2 4) 0))
(define-tactically mod2-4-eq
  ((exact (same 0))))
`;
      expect(() => evaluatePie(str)).not.toThrow();
    });

    it("proves mod2(5) = 1 as equality", () => {
      const str = `${arithPreamble}
${mod2Def}
(claim mod2-5-eq (= Nat (mod2 5) 1))
(define-tactically mod2-5-eq
  ((exact (same 1))))
`;
      expect(() => evaluatePie(str)).not.toThrow();
    });

    it("computes mod2(10) = 0", () => {
      const str = `${arithPreamble}
${mod2Def}
(claim mod2-of-10 (= Nat (mod2 10) 0))
(define-tactically mod2-of-10
  ((exact (same 0))))
`;
      expect(() => evaluatePie(str)).not.toThrow();
    });

    it("computes mod2(11) = 1", () => {
      const str = `${arithPreamble}
${mod2Def}
(claim mod2-of-11 (= Nat (mod2 11) 1))
(define-tactically mod2-of-11
  ((exact (same 1))))
`;
      expect(() => evaluatePie(str)).not.toThrow();
    });

  });

  describe("Mod 3 Computation", () => {

    it("computes mod3(0) = 0", () => {
      const str = `${arithPreamble}
${mod3Def}
(claim mod3-of-0 (= Nat (mod3 0) 0))
(define-tactically mod3-of-0
  ((exact (same 0))))
`;
      expect(() => evaluatePie(str)).not.toThrow();
    });

    it("computes mod3(1) = 1", () => {
      const str = `${arithPreamble}
${mod3Def}
(claim mod3-of-1 (= Nat (mod3 1) 1))
(define-tactically mod3-of-1
  ((exact (same 1))))
`;
      expect(() => evaluatePie(str)).not.toThrow();
    });

    it("computes mod3(2) = 2", () => {
      const str = `${arithPreamble}
${mod3Def}
(claim mod3-of-2 (= Nat (mod3 2) 2))
(define-tactically mod3-of-2
  ((exact (same 2))))
`;
      expect(() => evaluatePie(str)).not.toThrow();
    });

    it("computes mod3(3) = 0", () => {
      const str = `${arithPreamble}
${mod3Def}
(claim mod3-of-3 (= Nat (mod3 3) 0))
(define-tactically mod3-of-3
  ((exact (same 0))))
`;
      expect(() => evaluatePie(str)).not.toThrow();
    });

    it("computes mod3(4) = 1", () => {
      const str = `${arithPreamble}
${mod3Def}
(claim mod3-of-4 (= Nat (mod3 4) 1))
(define-tactically mod3-of-4
  ((exact (same 1))))
`;
      expect(() => evaluatePie(str)).not.toThrow();
    });

    it("computes mod3(5) = 2", () => {
      const str = `${arithPreamble}
${mod3Def}
(claim mod3-of-5 (= Nat (mod3 5) 2))
(define-tactically mod3-of-5
  ((exact (same 2))))
`;
      expect(() => evaluatePie(str)).not.toThrow();
    });

    it("computes mod3(6) = 0", () => {
      const str = `${arithPreamble}
${mod3Def}
(claim mod3-of-6 (= Nat (mod3 6) 0))
(define-tactically mod3-of-6
  ((exact (same 0))))
`;
      expect(() => evaluatePie(str)).not.toThrow();
    });

    it("computes mod3(7) = 1", () => {
      const str = `${arithPreamble}
${mod3Def}
(claim mod3-of-7 (= Nat (mod3 7) 1))
(define-tactically mod3-of-7
  ((exact (same 1))))
`;
      expect(() => evaluatePie(str)).not.toThrow();
    });

    it("computes mod3(8) = 2", () => {
      const str = `${arithPreamble}
${mod3Def}
(claim mod3-of-8 (= Nat (mod3 8) 2))
(define-tactically mod3-of-8
  ((exact (same 2))))
`;
      expect(() => evaluatePie(str)).not.toThrow();
    });

    it("computes mod3(9) = 0", () => {
      const str = `${arithPreamble}
${mod3Def}
(claim mod3-of-9 (= Nat (mod3 9) 0))
(define-tactically mod3-of-9
  ((exact (same 0))))
`;
      expect(() => evaluatePie(str)).not.toThrow();
    });

  });

  describe("Congruence Properties", () => {

    it("proves 0 ≡ 2 (mod 2) via mod2", () => {
      const str = `${arithPreamble}
${mod2Def}
(claim cong-0-2-mod2 (= Nat (mod2 0) (mod2 2)))
(define-tactically cong-0-2-mod2
  ((exact (same 0))))
`;
      expect(() => evaluatePie(str)).not.toThrow();
    });

    it("proves 1 ≡ 3 (mod 2) via mod2", () => {
      const str = `${arithPreamble}
${mod2Def}
(claim cong-1-3-mod2 (= Nat (mod2 1) (mod2 3)))
(define-tactically cong-1-3-mod2
  ((exact (same 1))))
`;
      expect(() => evaluatePie(str)).not.toThrow();
    });

    it("proves 4 ≡ 6 (mod 2) via mod2", () => {
      const str = `${arithPreamble}
${mod2Def}
(claim cong-4-6-mod2 (= Nat (mod2 4) (mod2 6)))
(define-tactically cong-4-6-mod2
  ((exact (same 0))))
`;
      expect(() => evaluatePie(str)).not.toThrow();
    });

    it("proves 5 ≡ 7 (mod 2) via mod2", () => {
      const str = `${arithPreamble}
${mod2Def}
(claim cong-5-7-mod2 (= Nat (mod2 5) (mod2 7)))
(define-tactically cong-5-7-mod2
  ((exact (same 1))))
`;
      expect(() => evaluatePie(str)).not.toThrow();
    });

    it("proves 0 ≡ 3 (mod 3) via mod3", () => {
      const str = `${arithPreamble}
${mod3Def}
(claim cong-0-3-mod3 (= Nat (mod3 0) (mod3 3)))
(define-tactically cong-0-3-mod3
  ((exact (same 0))))
`;
      expect(() => evaluatePie(str)).not.toThrow();
    });

    it("proves 1 ≡ 4 (mod 3) via mod3", () => {
      const str = `${arithPreamble}
${mod3Def}
(claim cong-1-4-mod3 (= Nat (mod3 1) (mod3 4)))
(define-tactically cong-1-4-mod3
  ((exact (same 1))))
`;
      expect(() => evaluatePie(str)).not.toThrow();
    });

    it("proves 2 ≡ 5 (mod 3) via mod3", () => {
      const str = `${arithPreamble}
${mod3Def}
(claim cong-2-5-mod3 (= Nat (mod3 2) (mod3 5)))
(define-tactically cong-2-5-mod3
  ((exact (same 2))))
`;
      expect(() => evaluatePie(str)).not.toThrow();
    });

    it("proves 3 ≡ 6 (mod 3) via mod3", () => {
      const str = `${arithPreamble}
${mod3Def}
(claim cong-3-6-mod3 (= Nat (mod3 3) (mod3 6)))
(define-tactically cong-3-6-mod3
  ((exact (same 0))))
`;
      expect(() => evaluatePie(str)).not.toThrow();
    });

    it("proves 4 ≡ 7 (mod 3) via mod3", () => {
      const str = `${arithPreamble}
${mod3Def}
(claim cong-4-7-mod3 (= Nat (mod3 4) (mod3 7)))
(define-tactically cong-4-7-mod3
  ((exact (same 1))))
`;
      expect(() => evaluatePie(str)).not.toThrow();
    });

    it("proves 0 ≡ 6 (mod 3) via mod3 (transitive congruence)", () => {
      const str = `${arithPreamble}
${mod3Def}
(claim cong-0-6-mod3 (= Nat (mod3 0) (mod3 6)))
(define-tactically cong-0-6-mod3
  ((exact (same 0))))
`;
      expect(() => evaluatePie(str)).not.toThrow();
    });

    it("proves 2 ≡ 8 (mod 3) via mod3 (transitive congruence)", () => {
      const str = `${arithPreamble}
${mod3Def}
(claim cong-2-8-mod3 (= Nat (mod3 2) (mod3 8)))
(define-tactically cong-2-8-mod3
  ((exact (same 2))))
`;
      expect(() => evaluatePie(str)).not.toThrow();
    });

    it("proves 1 ≡ 7 (mod 3) via mod3 (transitive congruence)", () => {
      const str = `${arithPreamble}
${mod3Def}
(claim cong-1-7-mod3 (= Nat (mod3 1) (mod3 7)))
(define-tactically cong-1-7-mod3
  ((exact (same 1))))
`;
      expect(() => evaluatePie(str)).not.toThrow();
    });

  });

  describe("Remainder Properties", () => {

    it("proves mod2 result is 0 or 1 for input 0", () => {
      const str = `${arithPreamble}
${mod2Def}
(claim mod2-range-0 (Either (= Nat (mod2 0) 0) (= Nat (mod2 0) 1)))
(define-tactically mod2-range-0
  ((go-Left)
   (exact (same 0))))
`;
      expect(() => evaluatePie(str)).not.toThrow();
    });

    it("proves mod2 result is 0 or 1 for input 1", () => {
      const str = `${arithPreamble}
${mod2Def}
(claim mod2-range-1 (Either (= Nat (mod2 1) 0) (= Nat (mod2 1) 1)))
(define-tactically mod2-range-1
  ((go-Right)
   (exact (same 1))))
`;
      expect(() => evaluatePie(str)).not.toThrow();
    });

    it("proves mod2 result is 0 or 1 for input 2", () => {
      const str = `${arithPreamble}
${mod2Def}
(claim mod2-range-2 (Either (= Nat (mod2 2) 0) (= Nat (mod2 2) 1)))
(define-tactically mod2-range-2
  ((go-Left)
   (exact (same 0))))
`;
      expect(() => evaluatePie(str)).not.toThrow();
    });

    it("proves mod2 result is 0 or 1 for input 3", () => {
      const str = `${arithPreamble}
${mod2Def}
(claim mod2-range-3 (Either (= Nat (mod2 3) 0) (= Nat (mod2 3) 1)))
(define-tactically mod2-range-3
  ((go-Right)
   (exact (same 1))))
`;
      expect(() => evaluatePie(str)).not.toThrow();
    });

    it("proves mod2 result is 0 or 1 for input 8", () => {
      const str = `${arithPreamble}
${mod2Def}
(claim mod2-range-8 (Either (= Nat (mod2 8) 0) (= Nat (mod2 8) 1)))
(define-tactically mod2-range-8
  ((go-Left)
   (exact (same 0))))
`;
      expect(() => evaluatePie(str)).not.toThrow();
    });

    it("proves mod2 result is 0 or 1 for input 9", () => {
      const str = `${arithPreamble}
${mod2Def}
(claim mod2-range-9 (Either (= Nat (mod2 9) 0) (= Nat (mod2 9) 1)))
(define-tactically mod2-range-9
  ((go-Right)
   (exact (same 1))))
`;
      expect(() => evaluatePie(str)).not.toThrow();
    });

    it("proves mod3(0) is in {0,1,2} using nested Either", () => {
      const str = `${arithPreamble}
${mod3Def}
(claim mod3-range-0 (Either (= Nat (mod3 0) 0) (Either (= Nat (mod3 0) 1) (= Nat (mod3 0) 2))))
(define-tactically mod3-range-0
  ((go-Left)
   (exact (same 0))))
`;
      expect(() => evaluatePie(str)).not.toThrow();
    });

    it("proves mod3(1) is in {0,1,2} using nested Either", () => {
      const str = `${arithPreamble}
${mod3Def}
(claim mod3-range-1 (Either (= Nat (mod3 1) 0) (Either (= Nat (mod3 1) 1) (= Nat (mod3 1) 2))))
(define-tactically mod3-range-1
  ((go-Right)
   (go-Left)
   (exact (same 1))))
`;
      expect(() => evaluatePie(str)).not.toThrow();
    });

    it("proves mod3(2) is in {0,1,2} using nested Either", () => {
      const str = `${arithPreamble}
${mod3Def}
(claim mod3-range-2 (Either (= Nat (mod3 2) 0) (Either (= Nat (mod3 2) 1) (= Nat (mod3 2) 2))))
(define-tactically mod3-range-2
  ((go-Right)
   (go-Right)
   (exact (same 2))))
`;
      expect(() => evaluatePie(str)).not.toThrow();
    });

    it("proves mod3(5) is in {0,1,2} using nested Either", () => {
      const str = `${arithPreamble}
${mod3Def}
(claim mod3-range-5 (Either (= Nat (mod3 5) 0) (Either (= Nat (mod3 5) 1) (= Nat (mod3 5) 2))))
(define-tactically mod3-range-5
  ((go-Right)
   (go-Right)
   (exact (same 2))))
`;
      expect(() => evaluatePie(str)).not.toThrow();
    });

    it("proves mod3(6) is in {0,1,2} using nested Either", () => {
      const str = `${arithPreamble}
${mod3Def}
(claim mod3-range-6 (Either (= Nat (mod3 6) 0) (Either (= Nat (mod3 6) 1) (= Nat (mod3 6) 2))))
(define-tactically mod3-range-6
  ((go-Left)
   (exact (same 0))))
`;
      expect(() => evaluatePie(str)).not.toThrow();
    });

    it("proves mod3(9) is in {0,1,2} using nested Either", () => {
      const str = `${arithPreamble}
${mod3Def}
(claim mod3-range-9 (Either (= Nat (mod3 9) 0) (Either (= Nat (mod3 9) 1) (= Nat (mod3 9) 2))))
(define-tactically mod3-range-9
  ((go-Left)
   (exact (same 0))))
`;
      expect(() => evaluatePie(str)).not.toThrow();
    });

  });

  describe("Error Cases", () => {

    it("proves mod2(0) = 0 as equality via tactic", () => {
      const str = `${arithPreamble}
${mod2Def}
(claim mod2-0-eq (= Nat (mod2 0) 0))
(define-tactically mod2-0-eq
  ((exact (same 0))))
`;
      expect(() => evaluatePie(str)).not.toThrow();
    });

    it("rejects wrong mod2 equality: mod2(3) is not 0", () => {
      const str = `${arithPreamble}
${mod2Def}
(claim bad-mod2 (= Nat (mod2 3) 0))
(define-tactically bad-mod2
  ((exact (same 0))))
`;
      expect(() => evaluatePie(str)).toThrow();
    });

    it("rejects wrong mod3 equality: mod3(4) is not 0", () => {
      const str = `${arithPreamble}
${mod3Def}
(claim bad-mod3 (= Nat (mod3 4) 0))
(define-tactically bad-mod3
  ((exact (same 0))))
`;
      expect(() => evaluatePie(str)).toThrow();
    });

    it("rejects wrong congruence: 2 is not ≡ 3 (mod 2)", () => {
      const str = `${arithPreamble}
${mod2Def}
(claim bad-cong (= Nat (mod2 2) (mod2 3)))
(define-tactically bad-cong
  ((exact (same 0))))
`;
      expect(() => evaluatePie(str)).toThrow();
    });

  });

});
