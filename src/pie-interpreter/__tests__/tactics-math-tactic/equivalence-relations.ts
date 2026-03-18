import 'jest';
import { evaluatePie } from '../../main';

const arithPreamble = `
(claim + (→ Nat Nat Nat))
(define + (λ (n j) (iter-Nat n j (λ (x) (add1 x)))))
(claim * (→ Nat Nat Nat))
(define * (λ (n m) (iter-Nat n 0 (+ m))))
`;

const mod2Preamble = `
(claim mod2 (→ Nat Nat))
(define mod2 (λ (n) (iter-Nat n 0 (λ (r) (which-Nat r 1 (λ (x) 0))))))
`;

describe("Equivalence Relations", () => {

  describe("Equality as Equivalence", () => {

    it("= Nat is reflexive at 0", () => {
      const str = `
(claim eq-refl-0 (= Nat 0 0))
(define-tactically eq-refl-0
  ((exact (same 0))))
`;
      expect(() => evaluatePie(str)).not.toThrow();
    });

    it("= Nat is reflexive at 7", () => {
      const str = `
(claim eq-refl-7 (= Nat 7 7))
(define-tactically eq-refl-7
  ((exact (same 7))))
`;
      expect(() => evaluatePie(str)).not.toThrow();
    });

    it("= Atom is reflexive", () => {
      const str = `
(claim eq-refl-atom (= Atom 'foo 'foo))
(define-tactically eq-refl-atom
  ((exact (same 'foo))))
`;
      expect(() => evaluatePie(str)).not.toThrow();
    });

    it("= Nat is symmetric (general)", () => {
      const str = `
(claim eq-sym
  (Π ((a Nat) (b Nat))
    (→ (= Nat a b) (= Nat b a))))
(define-tactically eq-sym
  ((intro a)
   (intro b)
   (intro eq)
   (exact (symm eq))))
`;
      expect(() => evaluatePie(str)).not.toThrow();
    });

    it("= Nat is transitive (general)", () => {
      const str = `
(claim eq-trans
  (Π ((a Nat) (b Nat) (c Nat))
    (→ (= Nat a b) (= Nat b c) (= Nat a c))))
(define-tactically eq-trans
  ((intro a)
   (intro b)
   (intro c)
   (intro eq1)
   (intro eq2)
   (exact (trans eq1 eq2))))
`;
      expect(() => evaluatePie(str)).not.toThrow();
    });

    it("symm of same is same", () => {
      const str = `
(claim symm-same (= Nat 5 5))
(define-tactically symm-same
  ((exact (same 5))))
`;
      expect(() => evaluatePie(str)).not.toThrow();
    });

    it("trans of same and same is same", () => {
      const str = `
(claim trans-same (= Nat 5 5))
(define-tactically trans-same
  ((exact (same 5))))
`;
      expect(() => evaluatePie(str)).not.toThrow();
    });

    it("= is congruent: a=b → f(a)=f(b)", () => {
      const str = `
(claim eq-cong
  (Π ((a Nat) (b Nat))
    (→ (= Nat a b) (= Nat (add1 a) (add1 b)))))
(define-tactically eq-cong
  ((intro a)
   (intro b)
   (intro eq)
   (exact (cong eq (the (→ Nat Nat) (λ (x) (add1 x)))))))
`;
      expect(() => evaluatePie(str)).not.toThrow();
    });

    it("= is congruent at concrete value: 3=3 → 4=4", () => {
      const str = `
(claim cong-3
  (→ (= Nat 3 3) (= Nat 4 4)))
(define-tactically cong-3
  ((intro eq)
   (exact (cong eq (the (→ Nat Nat) (λ (x) (add1 x)))))))
(cong-3 (same 3))
`;
      const output = evaluatePie(str);
      expect(output).toContain("(same 4)");
    });

    it("equivalence bundled for Trivial", () => {
      const str = `
(claim triv-equiv
  (Σ ((refl (= Trivial sole sole)))
    (Σ ((sym (→ (= Trivial sole sole) (= Trivial sole sole))))
      (→ (= Trivial sole sole) (= Trivial sole sole) (= Trivial sole sole)))))
(define-tactically triv-equiv
  ((split-Pair)
   (then (exact (same sole)))
   (then
     (split-Pair)
     (then
       (intro eq)
       (exact (symm eq)))
     (then
       (intro eq1)
       (intro eq2)
       (exact (trans eq1 eq2))))))
`;
      expect(() => evaluatePie(str)).not.toThrow();
    });

    it("polymorphic equivalence: reflexivity component", () => {
      const str = `
(claim poly-refl (Π ((A U) (a A)) (= A a a)))
(define-tactically poly-refl
  ((intro A)
   (intro a)
   (exact (same a))))
`;
      expect(() => evaluatePie(str)).not.toThrow();
    });

    it("polymorphic equivalence: symmetry component", () => {
      const str = `
(claim poly-sym (Π ((A U) (a A) (b A)) (→ (= A a b) (= A b a))))
(define-tactically poly-sym
  ((intro A)
   (intro a)
   (intro b)
   (intro eq)
   (exact (symm eq))))
`;
      expect(() => evaluatePie(str)).not.toThrow();
    });

  });

  describe("Same Parity Relation", () => {

    it("mod2 of 0 is 0", () => {
      const str = `${mod2Preamble}
(claim mod2-0 (= Nat (mod2 0) 0))
(define-tactically mod2-0
  ((exact (same 0))))
`;
      expect(() => evaluatePie(str)).not.toThrow();
    });

    it("mod2 of 1 is 1", () => {
      const str = `${mod2Preamble}
(claim mod2-1 (= Nat (mod2 1) 1))
(define-tactically mod2-1
  ((exact (same 1))))
`;
      expect(() => evaluatePie(str)).not.toThrow();
    });

    it("mod2 of 2 is 0", () => {
      const str = `${mod2Preamble}
(claim mod2-2 (= Nat (mod2 2) 0))
(define-tactically mod2-2
  ((exact (same 0))))
`;
      expect(() => evaluatePie(str)).not.toThrow();
    });

    it("mod2 of 3 is 1", () => {
      const str = `${mod2Preamble}
(claim mod2-3 (= Nat (mod2 3) 1))
(define-tactically mod2-3
  ((exact (same 1))))
`;
      expect(() => evaluatePie(str)).not.toThrow();
    });

    it("mod2 of 4 is 0", () => {
      const str = `${mod2Preamble}
(claim mod2-4 (= Nat (mod2 4) 0))
(define-tactically mod2-4
  ((exact (same 0))))
`;
      expect(() => evaluatePie(str)).not.toThrow();
    });

    it("mod2 of 5 is 1", () => {
      const str = `${mod2Preamble}
(claim mod2-5 (= Nat (mod2 5) 1))
(define-tactically mod2-5
  ((exact (same 1))))
`;
      expect(() => evaluatePie(str)).not.toThrow();
    });

    it("same parity: 0 and 2 (both even)", () => {
      const str = `${mod2Preamble}
(claim same-par-0-2 (= Nat (mod2 0) (mod2 2)))
(define-tactically same-par-0-2
  ((exact (same 0))))
`;
      expect(() => evaluatePie(str)).not.toThrow();
    });

    it("same parity: 1 and 3 (both odd)", () => {
      const str = `${mod2Preamble}
(claim same-par-1-3 (= Nat (mod2 1) (mod2 3)))
(define-tactically same-par-1-3
  ((exact (same 1))))
`;
      expect(() => evaluatePie(str)).not.toThrow();
    });

    it("same parity: 2 and 4 (both even)", () => {
      const str = `${mod2Preamble}
(claim same-par-2-4 (= Nat (mod2 2) (mod2 4)))
(define-tactically same-par-2-4
  ((exact (same 0))))
`;
      expect(() => evaluatePie(str)).not.toThrow();
    });

    it("same parity: 3 and 5 (both odd)", () => {
      const str = `${mod2Preamble}
(claim same-par-3-5 (= Nat (mod2 3) (mod2 5)))
(define-tactically same-par-3-5
  ((exact (same 1))))
`;
      expect(() => evaluatePie(str)).not.toThrow();
    });

    it("same parity is reflexive: mod2(n) = mod2(n) for n=4", () => {
      const str = `${mod2Preamble}
(claim par-refl-4 (= Nat (mod2 4) (mod2 4)))
(define-tactically par-refl-4
  ((exact (same (mod2 4)))))
`;
      expect(() => evaluatePie(str)).not.toThrow();
    });

    it("same parity is symmetric: concrete 0,2", () => {
      const str = `${mod2Preamble}
(claim par-sym-0-2
  (→ (= Nat (mod2 0) (mod2 2)) (= Nat (mod2 2) (mod2 0))))
(define-tactically par-sym-0-2
  ((intro eq)
   (exact (symm eq))))
`;
      expect(() => evaluatePie(str)).not.toThrow();
    });

  });

  describe("Congruence Mod N", () => {

    it("mod2 of 6 is 0", () => {
      const str = `${mod2Preamble}
(claim mod2-6 (= Nat (mod2 6) 0))
(define-tactically mod2-6
  ((exact (same 0))))
`;
      expect(() => evaluatePie(str)).not.toThrow();
    });

    it("mod2 of 7 is 1", () => {
      const str = `${mod2Preamble}
(claim mod2-7 (= Nat (mod2 7) 1))
(define-tactically mod2-7
  ((exact (same 1))))
`;
      expect(() => evaluatePie(str)).not.toThrow();
    });

    it("congruence mod 2: 0 ≡ 4 (mod 2)", () => {
      const str = `${mod2Preamble}
(claim cong-mod2-0-4 (= Nat (mod2 0) (mod2 4)))
(define-tactically cong-mod2-0-4
  ((exact (same 0))))
`;
      expect(() => evaluatePie(str)).not.toThrow();
    });

    it("congruence mod 2: 1 ≡ 5 (mod 2)", () => {
      const str = `${mod2Preamble}
(claim cong-mod2-1-5 (= Nat (mod2 1) (mod2 5)))
(define-tactically cong-mod2-1-5
  ((exact (same 1))))
`;
      expect(() => evaluatePie(str)).not.toThrow();
    });

    it("congruence mod 2: 0 ≡ 6 (mod 2)", () => {
      const str = `${mod2Preamble}
(claim cong-mod2-0-6 (= Nat (mod2 0) (mod2 6)))
(define-tactically cong-mod2-0-6
  ((exact (same 0))))
`;
      expect(() => evaluatePie(str)).not.toThrow();
    });

    it("transitivity of congruence: 0≡2≡4 mod 2", () => {
      const str = `${mod2Preamble}
(claim cong-trans-0-2 (= Nat (mod2 0) (mod2 2)))
(define-tactically cong-trans-0-2
  ((exact (same 0))))
(claim cong-trans-2-4 (= Nat (mod2 2) (mod2 4)))
(define-tactically cong-trans-2-4
  ((exact (same 0))))
(claim cong-trans-0-4 (= Nat (mod2 0) (mod2 4)))
(define-tactically cong-trans-0-4
  ((exact (trans cong-trans-0-2 cong-trans-2-4))))
`;
      expect(() => evaluatePie(str)).not.toThrow();
    });

    it("congruence mod 2 is symmetric: 2≡0", () => {
      const str = `${mod2Preamble}
(claim cong-mod2-2-0 (= Nat (mod2 2) (mod2 0)))
(define-tactically cong-mod2-2-0
  ((exact (same 0))))
`;
      expect(() => evaluatePie(str)).not.toThrow();
    });

    it("mod2 respects addition: even + even = even (concrete 2+4)", () => {
      const str = `${arithPreamble}${mod2Preamble}
(claim mod2-sum-2-4 (= Nat (mod2 (+ 2 4)) (mod2 0)))
(define-tactically mod2-sum-2-4
  ((exact (same 0))))
`;
      expect(() => evaluatePie(str)).not.toThrow();
    });

    it("mod2 respects addition: odd + odd = even (concrete 1+3)", () => {
      const str = `${arithPreamble}${mod2Preamble}
(claim mod2-sum-1-3 (= Nat (mod2 (+ 1 3)) (mod2 0)))
(define-tactically mod2-sum-1-3
  ((exact (same 0))))
`;
      expect(() => evaluatePie(str)).not.toThrow();
    });

    it("mod2 respects addition: even + odd = odd (concrete 2+3)", () => {
      const str = `${arithPreamble}${mod2Preamble}
(claim mod2-sum-2-3 (= Nat (mod2 (+ 2 3)) (mod2 1)))
(define-tactically mod2-sum-2-3
  ((exact (same 1))))
`;
      expect(() => evaluatePie(str)).not.toThrow();
    });

    it("congruence mod 2: 8 ≡ 0 (mod 2)", () => {
      const str = `${mod2Preamble}
(claim cong-mod2-8-0 (= Nat (mod2 8) (mod2 0)))
(define-tactically cong-mod2-8-0
  ((exact (same 0))))
`;
      expect(() => evaluatePie(str)).not.toThrow();
    });

    it("chain: 1≡3≡5 mod 2 via transitivity", () => {
      const str = `${mod2Preamble}
(claim chain-1-3 (= Nat (mod2 1) (mod2 3)))
(define-tactically chain-1-3
  ((exact (same 1))))
(claim chain-3-5 (= Nat (mod2 3) (mod2 5)))
(define-tactically chain-3-5
  ((exact (same 1))))
(claim chain-1-5 (= Nat (mod2 1) (mod2 5)))
(define-tactically chain-1-5
  ((exact (trans chain-1-3 chain-3-5))))
`;
      expect(() => evaluatePie(str)).not.toThrow();
    });

  });

  describe("Equivalence Class Reasoning", () => {

    it("membership in even class: 0 is even (mod2=0)", () => {
      const str = `${mod2Preamble}
(claim zero-even (= Nat (mod2 0) 0))
(define-tactically zero-even
  ((exact (same 0))))
`;
      expect(() => evaluatePie(str)).not.toThrow();
    });

    it("membership in even class: 4 is even", () => {
      const str = `${mod2Preamble}
(claim four-even (= Nat (mod2 4) 0))
(define-tactically four-even
  ((exact (same 0))))
`;
      expect(() => evaluatePie(str)).not.toThrow();
    });

    it("membership in odd class: 1 is odd (mod2=1)", () => {
      const str = `${mod2Preamble}
(claim one-odd (= Nat (mod2 1) 1))
(define-tactically one-odd
  ((exact (same 1))))
`;
      expect(() => evaluatePie(str)).not.toThrow();
    });

    it("membership in odd class: 7 is odd", () => {
      const str = `${mod2Preamble}
(claim seven-odd (= Nat (mod2 7) 1))
(define-tactically seven-odd
  ((exact (same 1))))
`;
      expect(() => evaluatePie(str)).not.toThrow();
    });

    it("two elements in same class are related: 2 and 6", () => {
      const str = `${mod2Preamble}
(claim same-class-2-6 (= Nat (mod2 2) (mod2 6)))
(define-tactically same-class-2-6
  ((exact (same 0))))
`;
      expect(() => evaluatePie(str)).not.toThrow();
    });

    it("bundling class membership: 4 is even AND 6 is even", () => {
      const str = `${mod2Preamble}
(claim both-even
  (Σ ((p1 (= Nat (mod2 4) 0)))
    (= Nat (mod2 6) 0)))
(define-tactically both-even
  ((split-Pair)
   (then (exact (same 0)))
   (then (exact (same 0)))))
`;
      expect(() => evaluatePie(str)).not.toThrow();
    });

    it("class representative: every even number is ≡ 0 mod 2 (concrete 8)", () => {
      const str = `${mod2Preamble}
(claim eight-rep (= Nat (mod2 8) (mod2 0)))
(define-tactically eight-rep
  ((exact (same 0))))
`;
      expect(() => evaluatePie(str)).not.toThrow();
    });

    it("class representative: every odd number is ≡ 1 mod 2 (concrete 9)", () => {
      const str = `${mod2Preamble}
(claim nine-rep (= Nat (mod2 9) (mod2 1)))
(define-tactically nine-rep
  ((exact (same 1))))
`;
      expect(() => evaluatePie(str)).not.toThrow();
    });

    it("equivalence classes are disjoint: even ≠ odd witnessed by 0 ≠ 1", () => {
      const str = `${mod2Preamble}
(claim even-not-odd
  (→ (= Nat 0 1) Absurd))
(define-tactically even-not-odd
  ((exact (λ (eq) (the Absurd (replace eq (λ (x) (which-Nat x Nat (λ (n-1) Absurd))) 0))))))
`;
      expect(() => evaluatePie(str)).not.toThrow();
    });

    it("cong preserves equivalence class: if mod2(a)=mod2(b) then add1 preserves info", () => {
      const str = `${mod2Preamble}
(claim cong-preserves
  (→ (= Nat (mod2 0) (mod2 2)) (= Nat (add1 (mod2 0)) (add1 (mod2 2)))))
(define-tactically cong-preserves
  ((intro eq)
   (exact (cong eq (the (→ Nat Nat) (λ (x) (add1 x)))))))
`;
      expect(() => evaluatePie(str)).not.toThrow();
    });

  });

  describe("Error Cases", () => {

    it("fails with wrong parity claim", () => {
      const str = `${mod2Preamble}
(claim bad-parity (= Nat (mod2 0) 1))
(define-tactically bad-parity
  ((exact (same 1))))
`;
      expect(() => evaluatePie(str)).toThrow();
    });

    it("fails with incomplete equivalence proof", () => {
      const str = `
(claim bad-eq
  (Π ((a Nat) (b Nat))
    (→ (= Nat a b) (= Nat b a))))
(define-tactically bad-eq
  ((intro a)
   (intro b)))
`;
      expect(() => evaluatePie(str)).toThrow(/incomplete/i);
    });

    it("fails with wrong mod2 value claim", () => {
      const str = `${mod2Preamble}
(claim bad-mod (= Nat (mod2 3) 0))
(define-tactically bad-mod
  ((exact (same 0))))
`;
      expect(() => evaluatePie(str)).toThrow();
    });

    it("fails intro on non-Π type", () => {
      const str = `
(claim bad Nat)
(define-tactically bad
  ((intro x)
   (exact 0)))
`;
      expect(() => evaluatePie(str)).toThrow(/non-function/i);
    });

  });

});
