import 'jest';
import { evaluatePie } from '../../main';

const parityPreamble = `
(claim + (→ Nat Nat Nat))
(define + (λ (n j) (iter-Nat n j (λ (x) (add1 x)))))
(claim double (→ Nat Nat))
(define double (λ (n) (iter-Nat n 0 (+ 2))))
(claim Even (→ Nat U))
(define Even (λ (n) (Σ ((half Nat)) (= Nat n (double half)))))
(claim Odd (→ Nat U))
(define Odd (λ (n) (Σ ((half Nat)) (= Nat n (add1 (double half))))))
`;

describe("Even and Odd Parity", () => {

  describe("Concrete Even Witnesses", () => {

    it("proves 0 is even with half=0", () => {
      const str = `${parityPreamble}
(claim even-0 (Even 0))
(define-tactically even-0
  ((exists 0 half)
   (exact (same 0))))
(claim even-0-witness (= Nat (car even-0) 0))
(define-tactically even-0-witness
  ((exact (same 0))))
`;
      expect(() => evaluatePie(str)).not.toThrow();
    });

    it("proves 2 is even with half=1", () => {
      const str = `${parityPreamble}
(claim even-2 (Even 2))
(define-tactically even-2
  ((exists 1 half)
   (exact (same 2))))
(claim even-2-witness (= Nat (car even-2) 1))
(define-tactically even-2-witness
  ((exact (same 1))))
`;
      expect(() => evaluatePie(str)).not.toThrow();
    });

    it("proves 4 is even with half=2", () => {
      const str = `${parityPreamble}
(claim even-4 (Even 4))
(define-tactically even-4
  ((exists 2 half)
   (exact (same 4))))
(claim even-4-witness (= Nat (car even-4) 2))
(define-tactically even-4-witness
  ((exact (same 2))))
`;
      expect(() => evaluatePie(str)).not.toThrow();
    });

    it("proves 6 is even with half=3", () => {
      const str = `${parityPreamble}
(claim even-6 (Even 6))
(define-tactically even-6
  ((exists 3 half)
   (exact (same 6))))
(claim even-6-witness (= Nat (car even-6) 3))
(define-tactically even-6-witness
  ((exact (same 3))))
`;
      expect(() => evaluatePie(str)).not.toThrow();
    });

    it("proves 8 is even with half=4", () => {
      const str = `${parityPreamble}
(claim even-8 (Even 8))
(define-tactically even-8
  ((exists 4 half)
   (exact (same 8))))
(claim even-8-witness (= Nat (car even-8) 4))
(define-tactically even-8-witness
  ((exact (same 4))))
`;
      expect(() => evaluatePie(str)).not.toThrow();
    });

    it("proves 10 is even with half=5", () => {
      const str = `${parityPreamble}
(claim even-10 (Even 10))
(define-tactically even-10
  ((exists 5 half)
   (exact (same 10))))
(claim even-10-witness (= Nat (car even-10) 5))
(define-tactically even-10-witness
  ((exact (same 5))))
`;
      expect(() => evaluatePie(str)).not.toThrow();
    });

    it("proves 12 is even with half=6", () => {
      const str = `${parityPreamble}
(claim even-12 (Even 12))
(define-tactically even-12
  ((exists 6 half)
   (exact (same 12))))
(claim even-12-witness (= Nat (car even-12) 6))
(define-tactically even-12-witness
  ((exact (same 6))))
`;
      expect(() => evaluatePie(str)).not.toThrow();
    });

    it("proves 20 is even with half=10", () => {
      const str = `${parityPreamble}
(claim even-20 (Even 20))
(define-tactically even-20
  ((exists 10 half)
   (exact (same 20))))
(claim even-20-witness (= Nat (car even-20) 10))
(define-tactically even-20-witness
  ((exact (same 10))))
`;
      expect(() => evaluatePie(str)).not.toThrow();
    });

  });

  describe("Concrete Odd Witnesses", () => {

    it("proves 1 is odd with half=0", () => {
      const str = `${parityPreamble}
(claim odd-1 (Odd 1))
(define-tactically odd-1
  ((exists 0 half)
   (exact (same 1))))
(claim odd-1-witness (= Nat (car odd-1) 0))
(define-tactically odd-1-witness
  ((exact (same 0))))
`;
      expect(() => evaluatePie(str)).not.toThrow();
    });

    it("proves 3 is odd with half=1", () => {
      const str = `${parityPreamble}
(claim odd-3 (Odd 3))
(define-tactically odd-3
  ((exists 1 half)
   (exact (same 3))))
(claim odd-3-witness (= Nat (car odd-3) 1))
(define-tactically odd-3-witness
  ((exact (same 1))))
`;
      expect(() => evaluatePie(str)).not.toThrow();
    });

    it("proves 5 is odd with half=2", () => {
      const str = `${parityPreamble}
(claim odd-5 (Odd 5))
(define-tactically odd-5
  ((exists 2 half)
   (exact (same 5))))
(claim odd-5-witness (= Nat (car odd-5) 2))
(define-tactically odd-5-witness
  ((exact (same 2))))
`;
      expect(() => evaluatePie(str)).not.toThrow();
    });

    it("proves 7 is odd with half=3", () => {
      const str = `${parityPreamble}
(claim odd-7 (Odd 7))
(define-tactically odd-7
  ((exists 3 half)
   (exact (same 7))))
(claim odd-7-witness (= Nat (car odd-7) 3))
(define-tactically odd-7-witness
  ((exact (same 3))))
`;
      expect(() => evaluatePie(str)).not.toThrow();
    });

    it("proves 9 is odd with half=4", () => {
      const str = `${parityPreamble}
(claim odd-9 (Odd 9))
(define-tactically odd-9
  ((exists 4 half)
   (exact (same 9))))
(claim odd-9-witness (= Nat (car odd-9) 4))
(define-tactically odd-9-witness
  ((exact (same 4))))
`;
      expect(() => evaluatePie(str)).not.toThrow();
    });

    it("proves 11 is odd with half=5", () => {
      const str = `${parityPreamble}
(claim odd-11 (Odd 11))
(define-tactically odd-11
  ((exists 5 half)
   (exact (same 11))))
(claim odd-11-witness (= Nat (car odd-11) 5))
(define-tactically odd-11-witness
  ((exact (same 5))))
`;
      expect(() => evaluatePie(str)).not.toThrow();
    });

    it("proves 13 is odd with half=6", () => {
      const str = `${parityPreamble}
(claim odd-13 (Odd 13))
(define-tactically odd-13
  ((exists 6 half)
   (exact (same 13))))
(claim odd-13-witness (= Nat (car odd-13) 6))
(define-tactically odd-13-witness
  ((exact (same 6))))
`;
      expect(() => evaluatePie(str)).not.toThrow();
    });

    it("proves 15 is odd with half=7", () => {
      const str = `${parityPreamble}
(claim odd-15 (Odd 15))
(define-tactically odd-15
  ((exists 7 half)
   (exact (same 15))))
(claim odd-15-witness (= Nat (car odd-15) 7))
(define-tactically odd-15-witness
  ((exact (same 7))))
`;
      expect(() => evaluatePie(str)).not.toThrow();
    });

  });

  describe("Parity Transitions", () => {

    it("proves if 0 is even then 1 is odd (concrete transition)", () => {
      const str = `${parityPreamble}
(claim even-0-implies-odd-1 (→ (Even 0) (Odd 1)))
(define-tactically even-0-implies-odd-1
  ((intro ev)
   (exists 0 half)
   (exact (same 1))))
`;
      expect(() => evaluatePie(str)).not.toThrow();
    });

    it("proves if 2 is even then 3 is odd (concrete transition)", () => {
      const str = `${parityPreamble}
(claim even-2-implies-odd-3 (→ (Even 2) (Odd 3)))
(define-tactically even-2-implies-odd-3
  ((intro ev)
   (exists 1 half)
   (exact (same 3))))
`;
      expect(() => evaluatePie(str)).not.toThrow();
    });

    it("proves if 4 is even then 5 is odd (concrete transition)", () => {
      const str = `${parityPreamble}
(claim even-4-implies-odd-5 (→ (Even 4) (Odd 5)))
(define-tactically even-4-implies-odd-5
  ((intro ev)
   (exists 2 half)
   (exact (same 5))))
`;
      expect(() => evaluatePie(str)).not.toThrow();
    });

    it("proves if 1 is odd then 2 is even (concrete transition)", () => {
      const str = `${parityPreamble}
(claim odd-1-implies-even-2 (→ (Odd 1) (Even 2)))
(define-tactically odd-1-implies-even-2
  ((intro od)
   (exists 1 half)
   (exact (same 2))))
`;
      expect(() => evaluatePie(str)).not.toThrow();
    });

    it("proves if 3 is odd then 4 is even (concrete transition)", () => {
      const str = `${parityPreamble}
(claim odd-3-implies-even-4 (→ (Odd 3) (Even 4)))
(define-tactically odd-3-implies-even-4
  ((intro od)
   (exists 2 half)
   (exact (same 4))))
`;
      expect(() => evaluatePie(str)).not.toThrow();
    });

    it("proves if 5 is odd then 6 is even (concrete transition)", () => {
      const str = `${parityPreamble}
(claim odd-5-implies-even-6 (→ (Odd 5) (Even 6)))
(define-tactically odd-5-implies-even-6
  ((intro od)
   (exists 3 half)
   (exact (same 6))))
`;
      expect(() => evaluatePie(str)).not.toThrow();
    });

    it("proves if 7 is odd then 8 is even (concrete transition)", () => {
      const str = `${parityPreamble}
(claim odd-7-implies-even-8 (→ (Odd 7) (Even 8)))
(define-tactically odd-7-implies-even-8
  ((intro od)
   (exists 4 half)
   (exact (same 8))))
`;
      expect(() => evaluatePie(str)).not.toThrow();
    });

    it("chains: even-0 implies odd-1 implies even-2", () => {
      const str = `${parityPreamble}
(claim chain-0-1-2
  (Σ ((e0 (Even 0))) (Σ ((o1 (Odd 1))) (Even 2))))
(define-tactically chain-0-1-2
  ((exists (cons 0 (same 0)) e0)
   (exists (cons 0 (same 1)) o1)
   (exists 1 half)
   (exact (same 2))))
`;
      expect(() => evaluatePie(str)).not.toThrow();
    });

    it("proves 6 is even and 7 is odd bundled", () => {
      const str = `${parityPreamble}
(claim even-6-odd-7
  (Σ ((e (Even 6))) (Odd 7)))
(define-tactically even-6-odd-7
  ((exists (cons 3 (same 6)) e)
   (exists 3 half)
   (exact (same 7))))
`;
      expect(() => evaluatePie(str)).not.toThrow();
    });

    it("proves 8 is even and 9 is odd bundled", () => {
      const str = `${parityPreamble}
(claim even-8-odd-9
  (Σ ((e (Even 8))) (Odd 9)))
(define-tactically even-8-odd-9
  ((exists (cons 4 (same 8)) e)
   (exists 4 half)
   (exact (same 9))))
`;
      expect(() => evaluatePie(str)).not.toThrow();
    });

  });

  describe("Parity of Sums", () => {

    it("proves 0+0 is even (sum of two even numbers)", () => {
      const str = `${parityPreamble}
(claim even-0-plus-0 (Even (+ 0 0)))
(define-tactically even-0-plus-0
  ((exists 0 half)
   (exact (same 0))))
`;
      expect(() => evaluatePie(str)).not.toThrow();
    });

    it("proves 2+2=4 is even", () => {
      const str = `${parityPreamble}
(claim even-2-plus-2 (Even (+ 2 2)))
(define-tactically even-2-plus-2
  ((exists 2 half)
   (exact (same 4))))
`;
      expect(() => evaluatePie(str)).not.toThrow();
    });

    it("proves 2+4=6 is even", () => {
      const str = `${parityPreamble}
(claim even-2-plus-4 (Even (+ 2 4)))
(define-tactically even-2-plus-4
  ((exists 3 half)
   (exact (same 6))))
`;
      expect(() => evaluatePie(str)).not.toThrow();
    });

    it("proves 4+6=10 is even", () => {
      const str = `${parityPreamble}
(claim even-4-plus-6 (Even (+ 4 6)))
(define-tactically even-4-plus-6
  ((exists 5 half)
   (exact (same 10))))
`;
      expect(() => evaluatePie(str)).not.toThrow();
    });

    it("proves 1+1=2 is even (sum of two odd numbers)", () => {
      const str = `${parityPreamble}
(claim even-1-plus-1 (Even (+ 1 1)))
(define-tactically even-1-plus-1
  ((exists 1 half)
   (exact (same 2))))
`;
      expect(() => evaluatePie(str)).not.toThrow();
    });

    it("proves 3+3=6 is even (sum of two odd numbers)", () => {
      const str = `${parityPreamble}
(claim even-3-plus-3 (Even (+ 3 3)))
(define-tactically even-3-plus-3
  ((exists 3 half)
   (exact (same 6))))
`;
      expect(() => evaluatePie(str)).not.toThrow();
    });

    it("proves 1+2=3 is odd (even + odd)", () => {
      const str = `${parityPreamble}
(claim odd-1-plus-2 (Odd (+ 1 2)))
(define-tactically odd-1-plus-2
  ((exists 1 half)
   (exact (same 3))))
`;
      expect(() => evaluatePie(str)).not.toThrow();
    });

    it("proves 2+3=5 is odd (even + odd)", () => {
      const str = `${parityPreamble}
(claim odd-2-plus-3 (Odd (+ 2 3)))
(define-tactically odd-2-plus-3
  ((exists 2 half)
   (exact (same 5))))
`;
      expect(() => evaluatePie(str)).not.toThrow();
    });

    it("proves 3+4=7 is odd (odd + even)", () => {
      const str = `${parityPreamble}
(claim odd-3-plus-4 (Odd (+ 3 4)))
(define-tactically odd-3-plus-4
  ((exists 3 half)
   (exact (same 7))))
`;
      expect(() => evaluatePie(str)).not.toThrow();
    });

    it("proves 5+6=11 is odd (odd + even)", () => {
      const str = `${parityPreamble}
(claim odd-5-plus-6 (Odd (+ 5 6)))
(define-tactically odd-5-plus-6
  ((exists 5 half)
   (exact (same 11))))
`;
      expect(() => evaluatePie(str)).not.toThrow();
    });

  });

  describe("Even or Odd (Totality)", () => {

    it("proves 0 is even or odd (left: even)", () => {
      const str = `${parityPreamble}
(claim parity-0 (Either (Even 0) (Odd 0)))
(define-tactically parity-0
  ((go-Left)
   (exists 0 half)
   (exact (same 0))))
`;
      expect(() => evaluatePie(str)).not.toThrow();
    });

    it("proves 1 is even or odd (right: odd)", () => {
      const str = `${parityPreamble}
(claim parity-1 (Either (Even 1) (Odd 1)))
(define-tactically parity-1
  ((go-Right)
   (exists 0 half)
   (exact (same 1))))
`;
      expect(() => evaluatePie(str)).not.toThrow();
    });

    it("proves 2 is even or odd (left: even)", () => {
      const str = `${parityPreamble}
(claim parity-2 (Either (Even 2) (Odd 2)))
(define-tactically parity-2
  ((go-Left)
   (exists 1 half)
   (exact (same 2))))
`;
      expect(() => evaluatePie(str)).not.toThrow();
    });

    it("proves 3 is even or odd (right: odd)", () => {
      const str = `${parityPreamble}
(claim parity-3 (Either (Even 3) (Odd 3)))
(define-tactically parity-3
  ((go-Right)
   (exists 1 half)
   (exact (same 3))))
`;
      expect(() => evaluatePie(str)).not.toThrow();
    });

    it("proves 4 is even or odd (left: even)", () => {
      const str = `${parityPreamble}
(claim parity-4 (Either (Even 4) (Odd 4)))
(define-tactically parity-4
  ((go-Left)
   (exists 2 half)
   (exact (same 4))))
`;
      expect(() => evaluatePie(str)).not.toThrow();
    });

    it("proves 5 is even or odd (right: odd)", () => {
      const str = `${parityPreamble}
(claim parity-5 (Either (Even 5) (Odd 5)))
(define-tactically parity-5
  ((go-Right)
   (exists 2 half)
   (exact (same 5))))
`;
      expect(() => evaluatePie(str)).not.toThrow();
    });

    it("proves 100 is even or odd (left: even)", () => {
      const str = `${parityPreamble}
(claim parity-100 (Either (Even 100) (Odd 100)))
(define-tactically parity-100
  ((go-Left)
   (exists 50 half)
   (exact (same 100))))
`;
      expect(() => evaluatePie(str)).not.toThrow();
    });

  });

  describe("Error Cases", () => {

    it("rejects elim-Nat on non-Nat value", () => {
      const str = `${parityPreamble}
(claim bad-elim (= Atom 'a 'a))
(define-tactically bad-elim
  ((elim-Nat 'a)
   (then (exact (same 'a)))
   (then (exact (same 'a)))))
`;
      expect(() => evaluatePie(str)).toThrow();
    });

    it("proves 14 is even with half=7", () => {
      const str = `${parityPreamble}
(claim even-14 (Even 14))
(define-tactically even-14
  ((exists 7 half)
   (exact (same 14))))
(claim even-14-witness (= Nat (car even-14) 7))
(define-tactically even-14-witness
  ((exact (same 7))))
`;
      expect(() => evaluatePie(str)).not.toThrow();
    });

    it("proves 17 is odd with half=8", () => {
      const str = `${parityPreamble}
(claim odd-17 (Odd 17))
(define-tactically odd-17
  ((exists 8 half)
   (exact (same 17))))
(claim odd-17-witness (= Nat (car odd-17) 8))
(define-tactically odd-17-witness
  ((exact (same 8))))
`;
      expect(() => evaluatePie(str)).not.toThrow();
    });

    it("proves 99 is odd with half=49", () => {
      const str = `${parityPreamble}
(claim odd-99 (Odd 99))
(define-tactically odd-99
  ((exists 49 half)
   (exact (same 99))))
(claim odd-99-witness (= Nat (car odd-99) 49))
(define-tactically odd-99-witness
  ((exact (same 49))))
`;
      expect(() => evaluatePie(str)).not.toThrow();
    });

    it("rejects wrong parity witness: 3 is not even with half=1", () => {
      const str = `${parityPreamble}
(claim bad-even-3 (Even 3))
(define-tactically bad-even-3
  ((exists 1 half)
   (exact (same 3))))
`;
      expect(() => evaluatePie(str)).toThrow();
    });

    it("rejects wrong parity witness: 4 is not odd with half=1", () => {
      const str = `${parityPreamble}
(claim bad-odd-4 (Odd 4))
(define-tactically bad-odd-4
  ((exists 1 half)
   (exact (same 4))))
`;
      expect(() => evaluatePie(str)).toThrow();
    });

    it("rejects incomplete even proof (missing equality)", () => {
      const str = `${parityPreamble}
(claim incomplete-even (Even 6))
(define-tactically incomplete-even
  ((exists 3 half)))
`;
      expect(() => evaluatePie(str)).toThrow();
    });

  });

});
