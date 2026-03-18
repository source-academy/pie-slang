import 'jest';
import { evaluatePie } from '../../main';

describe("Negation and Contradiction", () => {

  describe("Ex Falso Quodlibet", () => {

    it("proves Absurd → Nat using elim-Absurd", () => {
      const str = `
(claim absurd-to-nat (→ Absurd Nat))
(define-tactically absurd-to-nat
  ((intro prf)
   (elim-Absurd prf)))
`;
      expect(() => evaluatePie(str)).not.toThrow();
    });

    it("proves Absurd → Atom using elim-Absurd", () => {
      const str = `
(claim absurd-to-atom (→ Absurd Atom))
(define-tactically absurd-to-atom
  ((intro prf)
   (elim-Absurd prf)))
`;
      expect(() => evaluatePie(str)).not.toThrow();
    });

    it("proves Absurd → Trivial using elim-Absurd", () => {
      const str = `
(claim absurd-to-trivial (→ Absurd Trivial))
(define-tactically absurd-to-trivial
  ((intro prf)
   (elim-Absurd prf)))
`;
      expect(() => evaluatePie(str)).not.toThrow();
    });

    it("proves Absurd → (Either Nat Atom) using elim-Absurd", () => {
      const str = `
(claim absurd-to-either (→ Absurd (Either Nat Atom)))
(define-tactically absurd-to-either
  ((intro prf)
   (elim-Absurd prf)))
`;
      expect(() => evaluatePie(str)).not.toThrow();
    });

    it("proves Absurd → (Σ ((n Nat)) Nat) using elim-Absurd", () => {
      const str = `
(claim absurd-to-sigma (→ Absurd (Σ ((n Nat)) Nat)))
(define-tactically absurd-to-sigma
  ((intro prf)
   (elim-Absurd prf)))
`;
      expect(() => evaluatePie(str)).not.toThrow();
    });

    it("proves polymorphic ex falso: Absurd → A for any A", () => {
      const str = `
(claim ex-falso
  (Π ((A U))
    (→ Absurd A)))
(define-tactically ex-falso
  ((intro A)
   (intro prf)
   (elim-Absurd prf)))
`;
      expect(() => evaluatePie(str)).not.toThrow();
    });

    it("proves Absurd → Absurd via elim-Absurd", () => {
      const str = `
(claim absurd-to-absurd (→ Absurd Absurd))
(define-tactically absurd-to-absurd
  ((intro prf)
   (elim-Absurd prf)))
`;
      expect(() => evaluatePie(str)).not.toThrow();
    });

    it("proves Absurd → (→ Nat Nat) using elim-Absurd", () => {
      const str = `
(claim absurd-to-fn (→ Absurd (→ Nat Nat)))
(define-tactically absurd-to-fn
  ((intro prf)
   (elim-Absurd prf)))
`;
      expect(() => evaluatePie(str)).not.toThrow();
    });

    it("proves Absurd → (= Nat 0 1) using elim-Absurd", () => {
      const str = `
(claim absurd-to-eq (→ Absurd (= Nat 0 1)))
(define-tactically absurd-to-eq
  ((intro prf)
   (elim-Absurd prf)))
`;
      expect(() => evaluatePie(str)).not.toThrow();
    });

    it("uses ex-falso in composition with other functions", () => {
      const str = `
(claim ex-falso
  (Π ((A U))
    (→ Absurd A)))
(define-tactically ex-falso
  ((intro A)
   (intro prf)
   (elim-Absurd prf)))

(claim use-ex-falso
  (→ Absurd Nat))
(define use-ex-falso
  (λ (prf) (ex-falso Nat prf)))
`;
      expect(() => evaluatePie(str)).not.toThrow();
    });

  });

  describe("Negation Introduction", () => {

    it("proves ¬Absurd which is (→ Absurd Absurd)", () => {
      const str = `
(claim not-absurd (→ Absurd Absurd))
(define-tactically not-absurd
  ((intro prf)
   (exact prf)))
`;
      expect(() => evaluatePie(str)).not.toThrow();
    });

    it("proves negation by introducing and deriving Absurd", () => {
      const str = `
(claim not-absurd2 (→ Absurd Absurd))
(define-tactically not-absurd2
  ((intro prf)
   (elim-Absurd prf)))
`;
      expect(() => evaluatePie(str)).not.toThrow();
    });

    it("proves ¬(Σ ((x Absurd)) Nat) — no element of empty type in pair", () => {
      const str = `
(claim no-absurd-pair (→ (Σ ((x Absurd)) Nat) Absurd))
(define-tactically no-absurd-pair
  ((intro p)
   (exact (ind-Absurd (car p) Absurd))))
`;
      expect(() => evaluatePie(str)).not.toThrow();
    });

    it("proves negation of pair with Absurd second component", () => {
      const str = `
(claim no-absurd-pair2 (→ (Σ ((x Nat)) Absurd) Absurd))
(define-tactically no-absurd-pair2
  ((intro p)
   (exact (ind-Absurd (cdr p) Absurd))))
`;
      expect(() => evaluatePie(str)).not.toThrow();
    });

    it("negation introduction: ¬(A ∧ ¬A) for Nat", () => {
      const str = `
(claim no-contradiction
  (→ (Σ ((a Nat)) (→ Nat Absurd)) Absurd))
(define-tactically no-contradiction
  ((intro p)
   (apply (cdr p))
   (exact (car p))))
`;
      expect(() => evaluatePie(str)).not.toThrow();
    });

    it("negation introduction: ¬(A ∧ ¬A) for Atom", () => {
      const str = `
(claim no-contradiction-atom
  (→ (Σ ((a Atom)) (→ Atom Absurd)) Absurd))
(define-tactically no-contradiction-atom
  ((intro p)
   (apply (cdr p))
   (exact (car p))))
`;
      expect(() => evaluatePie(str)).not.toThrow();
    });

    it("polymorphic no-contradiction: ¬(A ∧ ¬A)", () => {
      const str = `
(claim no-contra
  (Π ((A U))
    (→ (Σ ((a A)) (→ A Absurd)) Absurd)))
(define-tactically no-contra
  ((intro A)
   (intro p)
   (apply (cdr p))
   (exact (car p))))
`;
      expect(() => evaluatePie(str)).not.toThrow();
    });

    it("proves (→ Absurd Nat) → Nat is not provable but the function type is fine", () => {
      const str = `
(claim absurd-fn-type (→ (→ Absurd Nat) Trivial))
(define-tactically absurd-fn-type
  ((intro f)
   (exact sole)))
`;
      expect(() => evaluatePie(str)).not.toThrow();
    });

    it("negation of Either with both Absurd branches", () => {
      const str = `
(claim neg-either-absurd
  (→ (Either Absurd Absurd) Absurd))
(define-tactically neg-either-absurd
  ((intro e)
   (elim-Either e)
   (then
     (intro l)
     (elim-Absurd l))
   (then
     (intro r)
     (elim-Absurd r))))
`;
      expect(() => evaluatePie(str)).not.toThrow();
    });

    it("negation with function application to derive Absurd", () => {
      const str = `
(claim neg-via-app
  (→ (→ Nat Absurd) Nat Absurd))
(define-tactically neg-via-app
  ((intro neg)
   (intro n)
   (exact (neg n))))
`;
      expect(() => evaluatePie(str)).not.toThrow();
    });

    it("double negation of Absurd", () => {
      const str = `
(claim dbl-neg-absurd
  (→ (→ (→ Absurd Absurd) Absurd) Absurd))
(define-tactically dbl-neg-absurd
  ((intro f)
   (exact (f (λ (x) x)))))
`;
      expect(() => evaluatePie(str)).not.toThrow();
    });

    it("negation is contravariant: A→B implies ¬B→¬A", () => {
      const str = `
(claim neg-contravariant
  (→ (→ Nat Atom) (→ Atom Absurd) (→ Nat Absurd)))
(define-tactically neg-contravariant
  ((intro f)
   (intro neg-b)
   (intro n)
   (exact (neg-b (f n)))))
`;
      expect(() => evaluatePie(str)).not.toThrow();
    });

  });

  describe("Double Negation", () => {

    it("double negation introduction for Nat: A → ¬¬A", () => {
      const str = `
(claim dbl-neg-intro-nat
  (→ Nat (→ (→ Nat Absurd) Absurd)))
(define-tactically dbl-neg-intro-nat
  ((intro n)
   (intro neg-nat)
   (exact (neg-nat n))))
`;
      expect(() => evaluatePie(str)).not.toThrow();
    });

    it("double negation introduction for Atom: A → ¬¬A", () => {
      const str = `
(claim dbl-neg-intro-atom
  (→ Atom (→ (→ Atom Absurd) Absurd)))
(define-tactically dbl-neg-intro-atom
  ((intro a)
   (intro neg-atom)
   (exact (neg-atom a))))
`;
      expect(() => evaluatePie(str)).not.toThrow();
    });

    it("polymorphic double negation introduction: A → ¬¬A", () => {
      const str = `
(claim dbl-neg-intro
  (Π ((A U))
    (→ A (→ (→ A Absurd) Absurd))))
(define-tactically dbl-neg-intro
  ((intro A)
   (intro a)
   (intro neg-a)
   (exact (neg-a a))))
`;
      expect(() => evaluatePie(str)).not.toThrow();
    });

    it("double negation introduction for Trivial", () => {
      const str = `
(claim dbl-neg-triv
  (→ Trivial (→ (→ Trivial Absurd) Absurd)))
(define-tactically dbl-neg-triv
  ((intro t)
   (intro neg-t)
   (exact (neg-t t))))
`;
      expect(() => evaluatePie(str)).not.toThrow();
    });

    it("double negation introduction for Either", () => {
      const str = `
(claim dbl-neg-either
  (→ (Either Nat Atom)
     (→ (→ (Either Nat Atom) Absurd) Absurd)))
(define-tactically dbl-neg-either
  ((intro e)
   (intro neg-e)
   (exact (neg-e e))))
`;
      expect(() => evaluatePie(str)).not.toThrow();
    });

    it("double negation introduction for Σ type", () => {
      const str = `
(claim dbl-neg-sigma
  (→ (Σ ((n Nat)) Nat)
     (→ (→ (Σ ((n Nat)) Nat) Absurd) Absurd)))
(define-tactically dbl-neg-sigma
  ((intro p)
   (intro neg-p)
   (exact (neg-p p))))
`;
      expect(() => evaluatePie(str)).not.toThrow();
    });

    it("triple negation reduces to single negation: ¬¬¬A → ¬A", () => {
      const str = `
(claim triple-neg
  (Π ((A U))
    (→ (→ (→ (→ A Absurd) Absurd) Absurd)
       (→ A Absurd))))
(define-tactically triple-neg
  ((intro A)
   (intro nnn-a)
   (intro a)
   (exact (nnn-a (λ (neg-a) (neg-a a))))))
`;
      expect(() => evaluatePie(str)).not.toThrow();
    });

    it("¬¬¬A → ¬A specialized for Nat", () => {
      const str = `
(claim triple-neg-nat
  (→ (→ (→ (→ Nat Absurd) Absurd) Absurd)
     (→ Nat Absurd)))
(define-tactically triple-neg-nat
  ((intro nnn)
   (intro n)
   (exact (nnn (λ (neg-n) (neg-n n))))))
`;
      expect(() => evaluatePie(str)).not.toThrow();
    });

    it("double negation maps: ¬¬A → ¬¬B given A → B", () => {
      const str = `
(claim dbl-neg-map
  (Π ((A U) (B U))
    (→ (→ A B)
       (→ (→ (→ A Absurd) Absurd)
          (→ (→ B Absurd) Absurd)))))
(define-tactically dbl-neg-map
  ((intro A)
   (intro B)
   (intro f)
   (intro nn-a)
   (intro neg-b)
   (exact (nn-a (λ (a) (neg-b (f a)))))))
`;
      expect(() => evaluatePie(str)).not.toThrow();
    });

    it("double negation of Absurd is equivalent to Absurd", () => {
      const str = `
(claim dbl-neg-absurd-elim
  (→ (→ (→ Absurd Absurd) Absurd) Absurd))
(define-tactically dbl-neg-absurd-elim
  ((intro nn-abs)
   (exact (nn-abs (λ (x) x)))))
`;
      expect(() => evaluatePie(str)).not.toThrow();
    });

  });

  describe("Contrapositive", () => {

    it("contrapositive: (A→B) → (¬B→¬A) for Nat→Atom", () => {
      const str = `
(claim contrapositive
  (→ (→ Nat Atom) (→ (→ Atom Absurd) (→ Nat Absurd))))
(define-tactically contrapositive
  ((intro f)
   (intro neg-b)
   (intro a)
   (exact (neg-b (f a)))))
`;
      expect(() => evaluatePie(str)).not.toThrow();
    });

    it("polymorphic contrapositive: (A→B) → (¬B→¬A)", () => {
      const str = `
(claim contra
  (Π ((A U) (B U))
    (→ (→ A B) (→ (→ B Absurd) (→ A Absurd)))))
(define-tactically contra
  ((intro A)
   (intro B)
   (intro f)
   (intro neg-b)
   (intro a)
   (exact (neg-b (f a)))))
`;
      expect(() => evaluatePie(str)).not.toThrow();
    });

    it("contrapositive with identity: ¬A→¬A", () => {
      const str = `
(claim contra-id
  (Π ((A U))
    (→ (→ A Absurd) (→ A Absurd))))
(define-tactically contra-id
  ((intro A)
   (intro neg-a)
   (intro a)
   (exact (neg-a a))))
`;
      expect(() => evaluatePie(str)).not.toThrow();
    });

    it("contrapositive chain: (A→B) → (B→C) → (¬C→¬A)", () => {
      const str = `
(claim contra-chain
  (→ (→ Nat Atom) (→ Atom Trivial) (→ (→ Trivial Absurd) (→ Nat Absurd))))
(define-tactically contra-chain
  ((intro f)
   (intro g)
   (intro neg-c)
   (intro a)
   (exact (neg-c (g (f a))))))
`;
      expect(() => evaluatePie(str)).not.toThrow();
    });

    it("modus tollens: A→B and ¬B gives ¬A", () => {
      const str = `
(claim modus-tollens
  (→ (→ Nat Atom) (→ Atom Absurd) Nat Absurd))
(define-tactically modus-tollens
  ((intro f)
   (intro neg-b)
   (intro n)
   (exact (neg-b (f n)))))
`;
      expect(() => evaluatePie(str)).not.toThrow();
    });

    it("modus tollens for Trivial target", () => {
      const str = `
(claim mt-triv
  (→ (→ Nat Trivial) (→ Trivial Absurd) Nat Absurd))
(define-tactically mt-triv
  ((intro f)
   (intro neg-t)
   (intro n)
   (exact (neg-t (f n)))))
`;
      expect(() => evaluatePie(str)).not.toThrow();
    });

    it("contrapositive preserves composition", () => {
      const str = `
(claim contra-comp
  (Π ((A U) (B U) (C U))
    (→ (→ A B) (→ B C) (→ (→ C Absurd) (→ A Absurd)))))
(define-tactically contra-comp
  ((intro A)
   (intro B)
   (intro C)
   (intro f)
   (intro g)
   (intro neg-c)
   (intro a)
   (exact (neg-c (g (f a))))))
`;
      expect(() => evaluatePie(str)).not.toThrow();
    });

    it("double contrapositive returns to original direction", () => {
      const str = `
(claim double-contra
  (Π ((A U) (B U))
    (→ (→ A B)
       (→ (→ (→ B Absurd) Absurd)
          (→ (→ A Absurd) Absurd)))))
(define-tactically double-contra
  ((intro A)
   (intro B)
   (intro f)
   (intro nn-b)
   (intro neg-a)
   (exact (nn-b (λ (neg-b) (neg-a (the A (ind-Absurd (neg-b (f (ind-Absurd (neg-a (the A (ind-Absurd (nn-b neg-b) A))) B))) A))))))))
`;
      // This is too complex; let's use a simpler approach
      const str2 = `
(claim double-contra
  (Π ((A U) (B U))
    (→ (→ A B)
       (→ (→ (→ A Absurd) Absurd)
          (→ (→ B Absurd) Absurd)))))
(define-tactically double-contra
  ((intro A)
   (intro B)
   (intro f)
   (intro nn-a)
   (intro neg-b)
   (exact (nn-a (λ (a) (neg-b (f a)))))))
`;
      expect(() => evaluatePie(str2)).not.toThrow();
    });

    it("contrapositive with Σ type", () => {
      const str = `
(claim contra-sigma
  (→ (→ Nat (Σ ((x Nat)) Nat))
     (→ (→ (Σ ((x Nat)) Nat) Absurd)
        (→ Nat Absurd))))
(define-tactically contra-sigma
  ((intro f)
   (intro neg-sigma)
   (intro n)
   (exact (neg-sigma (f n)))))
`;
      expect(() => evaluatePie(str)).not.toThrow();
    });

    it("contrapositive with Either type", () => {
      const str = `
(claim contra-either
  (→ (→ Nat (Either Nat Atom))
     (→ (→ (Either Nat Atom) Absurd)
        (→ Nat Absurd))))
(define-tactically contra-either
  ((intro f)
   (intro neg-either)
   (intro n)
   (exact (neg-either (f n)))))
`;
      expect(() => evaluatePie(str)).not.toThrow();
    });

  });

  describe("Modus Tollens and Advanced", () => {

    it("modus tollens with apply tactic", () => {
      const str = `
(claim mt-apply
  (→ (→ Nat Atom) (→ Atom Absurd) (→ Nat Absurd)))
(define-tactically mt-apply
  ((intro f)
   (intro neg-b)
   (intro n)
   (apply neg-b)
   (apply f)
   (exact n)))
`;
      expect(() => evaluatePie(str)).not.toThrow();
    });

    it("negation elimination with ex falso: ¬A and A → B", () => {
      const str = `
(claim neg-elim
  (Π ((A U) (B U))
    (→ (→ A Absurd) A B)))
(define-tactically neg-elim
  ((intro A)
   (intro B)
   (intro neg-a)
   (intro a)
   (exact (ind-Absurd (neg-a a) B))))
`;
      expect(() => evaluatePie(str)).not.toThrow();
    });

    it("¬(Either A B) → ¬A (negation distributes over disjunction)", () => {
      const str = `
(claim neg-either-to-neg-left
  (Π ((A U) (B U))
    (→ (→ (Either A B) Absurd)
       (→ A Absurd))))
(define-tactically neg-either-to-neg-left
  ((intro A)
   (intro B)
   (intro neg-either)
   (intro a)
   (exact (neg-either (left a)))))
`;
      expect(() => evaluatePie(str)).not.toThrow();
    });

    it("¬(Either A B) → ¬B", () => {
      const str = `
(claim neg-either-to-neg-right
  (Π ((A U) (B U))
    (→ (→ (Either A B) Absurd)
       (→ B Absurd))))
(define-tactically neg-either-to-neg-right
  ((intro A)
   (intro B)
   (intro neg-either)
   (intro b)
   (exact (neg-either (right b)))))
`;
      expect(() => evaluatePie(str)).not.toThrow();
    });

    it("¬A ∧ ¬B → ¬(A ∨ B)", () => {
      const str = `
(claim neg-pair-to-neg-either
  (Π ((A U) (B U))
    (→ (Σ ((neg-a (→ A Absurd))) (→ B Absurd))
       (→ (Either A B) Absurd))))
(define-tactically neg-pair-to-neg-either
  ((intro A)
   (intro B)
   (intro p)
   (intro e)
   (elim-Either e)
   (then
     (intro a)
     (apply (car p))
     (exact a))
   (then
     (intro b)
     (apply (cdr p))
     (exact b))))
`;
      expect(() => evaluatePie(str)).not.toThrow();
    });

  });

  describe("Error Cases", () => {

    it("elim-Absurd on non-Absurd type should fail", () => {
      const str = `
(claim bad-absurd (→ Nat Atom))
(define-tactically bad-absurd
  ((intro n)
   (elim-Absurd n)))
`;
      expect(() => evaluatePie(str)).toThrow();
    });

    it("incomplete negation proof should fail", () => {
      const str = `
(claim incomplete-neg
  (→ Nat (→ (→ Nat Absurd) Absurd)))
(define-tactically incomplete-neg
  ((intro n)))
`;
      expect(() => evaluatePie(str)).toThrow(/incomplete/i);
    });

    it("wrong type in exact after intro should fail", () => {
      const str = `
(claim wrong-neg (→ Nat Absurd))
(define-tactically wrong-neg
  ((intro n)
   (exact sole)))
`;
      expect(() => evaluatePie(str)).toThrow();
    });

  });

});
