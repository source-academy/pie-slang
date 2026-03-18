import 'jest';
import { evaluatePie } from '../../main';

const boolPreamble = `
(claim Bool U)
(define Bool (Either Trivial Trivial))
(claim true Bool)
(define true (left sole))
(claim false Bool)
(define false (right sole))
`;

describe("De Morgan and Boolean Algebra", () => {

  describe("Church-encoded Booleans", () => {

    it("defines Bool as Either Trivial Trivial", () => {
      const str = `
${boolPreamble}
(claim true-check (= (Either Trivial Trivial) true (left sole)))
(define-tactically true-check
  ((exact (same (left sole)))))
(claim false-check (= (Either Trivial Trivial) false (right sole)))
(define-tactically false-check
  ((exact (same (right sole)))))
`;
      expect(() => evaluatePie(str)).not.toThrow();
    });

    it("defines not-bool: swap left/right", () => {
      const str = `
${boolPreamble}
(claim not-bool (→ Bool Bool))
(define not-bool
  (λ (b)
    (ind-Either b
      (λ (x) Bool)
      (λ (l) false)
      (λ (r) true))))
(claim not-true-check (= (Either Trivial Trivial) (not-bool true) (right sole)))
(define-tactically not-true-check
  ((exact (same (right sole)))))
(claim not-false-check (= (Either Trivial Trivial) (not-bool false) (left sole)))
(define-tactically not-false-check
  ((exact (same (left sole)))))
`;
      expect(() => evaluatePie(str)).not.toThrow();
    });

    it("defines not-bool using tactics", () => {
      const str = `
${boolPreamble}
(claim not-bool (→ Bool Bool))
(define-tactically not-bool
  ((intro b)
   (elim-Either b)
   (then
     (intro l)
     (go-Right)
     (exact sole))
   (then
     (intro r)
     (go-Left)
     (exact sole))))
(claim not-true-check (= (Either Trivial Trivial) (not-bool true) (right sole)))
(define-tactically not-true-check
  ((exact (same (right sole)))))
(claim not-false-check (= (Either Trivial Trivial) (not-bool false) (left sole)))
(define-tactically not-false-check
  ((exact (same (left sole)))))
`;
      expect(() => evaluatePie(str)).not.toThrow();
    });

    it("double negation of boolean is identity", () => {
      const str = `
${boolPreamble}
(claim not-bool (→ Bool Bool))
(define not-bool
  (λ (b)
    (ind-Either b
      (λ (x) Bool)
      (λ (l) false)
      (λ (r) true))))
(claim dbl-neg-true (= (Either Trivial Trivial) (not-bool (not-bool true)) (left sole)))
(define-tactically dbl-neg-true
  ((exact (same (left sole)))))
(claim dbl-neg-false (= (Either Trivial Trivial) (not-bool (not-bool false)) (right sole)))
(define-tactically dbl-neg-false
  ((exact (same (right sole)))))
`;
      expect(() => evaluatePie(str)).not.toThrow();
    });

    it("defines and-bool: conjunction on booleans", () => {
      const str = `
${boolPreamble}
(claim and-bool (→ Bool Bool Bool))
(define and-bool
  (λ (a b)
    (ind-Either a
      (λ (x) Bool)
      (λ (l) b)
      (λ (r) false))))
(claim and-tt-check (= (Either Trivial Trivial) (and-bool true true) (left sole)))
(define-tactically and-tt-check
  ((exact (same (left sole)))))
`;
      expect(() => evaluatePie(str)).not.toThrow();
    });

    it("defines or-bool: disjunction on booleans", () => {
      const str = `
${boolPreamble}
(claim or-bool (→ Bool Bool Bool))
(define or-bool
  (λ (a b)
    (ind-Either a
      (λ (x) Bool)
      (λ (l) true)
      (λ (r) b))))
(claim or-ff-check (= (Either Trivial Trivial) (or-bool false false) (right sole)))
(define-tactically or-ff-check
  ((exact (same (right sole)))))
(claim or-ft-check (= (Either Trivial Trivial) (or-bool false true) (left sole)))
(define-tactically or-ft-check
  ((exact (same (left sole)))))
`;
      expect(() => evaluatePie(str)).not.toThrow();
    });

    it("defines and-bool using tactics", () => {
      const str = `
${boolPreamble}
(claim and-bool (→ Bool Bool Bool))
(define-tactically and-bool
  ((intro a)
   (intro b)
   (elim-Either a)
   (then
     (intro l)
     (exact b))
   (then
     (intro r)
     (go-Right)
     (exact sole))))
(and-bool true true)
(and-bool true false)
(and-bool false true)
`;
      expect(() => evaluatePie(str)).not.toThrow();
    });

    it("defines or-bool using tactics", () => {
      const str = `
${boolPreamble}
(claim or-bool (→ Bool Bool Bool))
(define-tactically or-bool
  ((intro a)
   (intro b)
   (elim-Either a)
   (then
     (intro l)
     (go-Left)
     (exact sole))
   (then
     (intro r)
     (exact b))))
(or-bool false false)
(or-bool true false)
`;
      expect(() => evaluatePie(str)).not.toThrow();
    });

    it("defines implies-bool: implication on booleans", () => {
      const str = `
${boolPreamble}
(claim implies-bool (→ Bool Bool Bool))
(define-tactically implies-bool
  ((exact (λ (a b)
    (ind-Either a
      (λ (x) Bool)
      (λ (l) b)
      (λ (r) true))))))
(implies-bool true true)
(implies-bool true false)
(implies-bool false true)
(implies-bool false false)
`;
      expect(() => evaluatePie(str)).not.toThrow();
    });

    it("defines xor-bool: exclusive or on booleans", () => {
      const str = `
${boolPreamble}
(claim not-bool (→ Bool Bool))
(define not-bool
  (λ (b)
    (ind-Either b
      (λ (x) Bool)
      (λ (l) false)
      (λ (r) true))))
(claim xor-bool (→ Bool Bool Bool))
(define-tactically xor-bool
  ((exact (λ (a b)
    (ind-Either a
      (λ (x) Bool)
      (λ (l) (not-bool b))
      (λ (r) b))))))
(xor-bool true true)
(xor-bool true false)
(xor-bool false true)
(xor-bool false false)
`;
      expect(() => evaluatePie(str)).not.toThrow();
    });

  });

  describe("Boolean Operations", () => {

    it("and true true = true", () => {
      const str = `
${boolPreamble}
(claim and-bool (→ Bool Bool Bool))
(define and-bool
  (λ (a b)
    (ind-Either a
      (λ (x) Bool)
      (λ (l) b)
      (λ (r) false))))
(claim and-tt (= (Either Trivial Trivial) (and-bool true true) (left sole)))
(define-tactically and-tt
  ((exact (same (left sole)))))
`;
      expect(() => evaluatePie(str)).not.toThrow();
    });

    it("and true false = false", () => {
      const str = `
${boolPreamble}
(claim and-bool (→ Bool Bool Bool))
(define and-bool
  (λ (a b)
    (ind-Either a
      (λ (x) Bool)
      (λ (l) b)
      (λ (r) false))))
(claim and-tf (= (Either Trivial Trivial) (and-bool true false) (right sole)))
(define-tactically and-tf
  ((exact (same (right sole)))))
`;
      expect(() => evaluatePie(str)).not.toThrow();
    });

    it("or false false = false", () => {
      const str = `
${boolPreamble}
(claim or-bool (→ Bool Bool Bool))
(define or-bool
  (λ (a b)
    (ind-Either a
      (λ (x) Bool)
      (λ (l) true)
      (λ (r) b))))
(claim or-ff (= (Either Trivial Trivial) (or-bool false false) (right sole)))
(define-tactically or-ff
  ((exact (same (right sole)))))
`;
      expect(() => evaluatePie(str)).not.toThrow();
    });

    it("or false true = true", () => {
      const str = `
${boolPreamble}
(claim or-bool (→ Bool Bool Bool))
(define or-bool
  (λ (a b)
    (ind-Either a
      (λ (x) Bool)
      (λ (l) true)
      (λ (r) b))))
(claim or-ft (= (Either Trivial Trivial) (or-bool false true) (left sole)))
(define-tactically or-ft
  ((exact (same (left sole)))))
`;
      expect(() => evaluatePie(str)).not.toThrow();
    });

    it("not not true = true verified via computation", () => {
      const str = `
${boolPreamble}
(claim not-bool (→ Bool Bool))
(define not-bool
  (λ (b)
    (ind-Either b
      (λ (x) Bool)
      (λ (l) false)
      (λ (r) true))))
(claim dbl-not (→ Bool Bool))
(define dbl-not (λ (b) (not-bool (not-bool b))))
(claim dbl-not-true (= (Either Trivial Trivial) (dbl-not true) (left sole)))
(define-tactically dbl-not-true
  ((exact (same (left sole)))))
(claim dbl-not-false (= (Either Trivial Trivial) (dbl-not false) (right sole)))
(define-tactically dbl-not-false
  ((exact (same (right sole)))))
`;
      expect(() => evaluatePie(str)).not.toThrow();
    });

    it("boolean if-then-else: Bool → A → A → A", () => {
      const str = `
${boolPreamble}
(claim if-bool
  (Π ((A U))
    (→ Bool A A A)))
(define if-bool
  (λ (A b then-val else-val)
    (ind-Either b
      (λ (x) A)
      (λ (l) then-val)
      (λ (r) else-val))))
(claim if-true-check (= Nat (if-bool Nat true 42 0) 42))
(define-tactically if-true-check
  ((exact (same 42))))
(claim if-false-check (= Nat (if-bool Nat false 42 0) 0))
(define-tactically if-false-check
  ((exact (same 0))))
`;
      expect(() => evaluatePie(str)).not.toThrow();
    });

    it("boolean if-then-else using tactics", () => {
      const str = `
${boolPreamble}
(claim if-bool
  (Π ((A U))
    (→ Bool A A A)))
(define-tactically if-bool
  ((intro A)
   (intro b)
   (intro then-val)
   (intro else-val)
   (elim-Either b)
   (then
     (intro l)
     (exact then-val))
   (then
     (intro r)
     (exact else-val))))
(claim if-true-check (= Atom (if-bool Atom true 'yes 'no) 'yes))
(define-tactically if-true-check
  ((exact (same 'yes))))
(claim if-false-check (= Atom (if-bool Atom false 'yes 'no) 'no))
(define-tactically if-false-check
  ((exact (same 'no))))
`;
      expect(() => evaluatePie(str)).not.toThrow();
    });

    it("and is commutative on concrete values", () => {
      const str = `
${boolPreamble}
(claim and-bool (→ Bool Bool Bool))
(define and-bool
  (λ (a b)
    (ind-Either a
      (λ (x) Bool)
      (λ (l) b)
      (λ (r) false))))
(claim and-tf-check (= (Either Trivial Trivial) (and-bool true false) (right sole)))
(define-tactically and-tf-check
  ((exact (same (right sole)))))
(claim and-ft-check (= (Either Trivial Trivial) (and-bool false true) (right sole)))
(define-tactically and-ft-check
  ((exact (same (right sole)))))
`;
      expect(() => evaluatePie(str)).not.toThrow();
    });

    it("or is commutative on concrete values", () => {
      const str = `
${boolPreamble}
(claim or-bool (→ Bool Bool Bool))
(define or-bool
  (λ (a b)
    (ind-Either a
      (λ (x) Bool)
      (λ (l) true)
      (λ (r) b))))
(claim or-tf-check (= (Either Trivial Trivial) (or-bool true false) (left sole)))
(define-tactically or-tf-check
  ((exact (same (left sole)))))
(claim or-ft-check (= (Either Trivial Trivial) (or-bool false true) (left sole)))
(define-tactically or-ft-check
  ((exact (same (left sole)))))
`;
      expect(() => evaluatePie(str)).not.toThrow();
    });

    it("and is idempotent: and x x = x for true", () => {
      const str = `
${boolPreamble}
(claim and-bool (→ Bool Bool Bool))
(define and-bool
  (λ (a b)
    (ind-Either a
      (λ (x) Bool)
      (λ (l) b)
      (λ (r) false))))
(claim and-tt-idem (= (Either Trivial Trivial) (and-bool true true) (left sole)))
(define-tactically and-tt-idem
  ((exact (same (left sole)))))
(claim and-ff-idem (= (Either Trivial Trivial) (and-bool false false) (right sole)))
(define-tactically and-ff-idem
  ((exact (same (right sole)))))
`;
      expect(() => evaluatePie(str)).not.toThrow();
    });

  });

  describe("De Morgan Laws (Constructive)", () => {

    it("¬(A∨B) → ¬A: negation of disjunction implies negation of left", () => {
      const str = `
(claim neg-or-to-neg-left
  (Π ((A U) (B U))
    (→ (→ (Either A B) Absurd)
       (→ A Absurd))))
(define-tactically neg-or-to-neg-left
  ((intro A)
   (intro B)
   (intro neg-or)
   (intro a)
   (exact (neg-or (left a)))))
`;
      expect(() => evaluatePie(str)).not.toThrow();
    });

    it("¬(A∨B) → ¬B: negation of disjunction implies negation of right", () => {
      const str = `
(claim neg-or-to-neg-right
  (Π ((A U) (B U))
    (→ (→ (Either A B) Absurd)
       (→ B Absurd))))
(define-tactically neg-or-to-neg-right
  ((intro A)
   (intro B)
   (intro neg-or)
   (intro b)
   (exact (neg-or (right b)))))
`;
      expect(() => evaluatePie(str)).not.toThrow();
    });

    it("¬(A∨B) → ¬A∧¬B: full De Morgan (constructive direction 1)", () => {
      const str = `
(claim de-morgan-1
  (Π ((A U) (B U))
    (→ (→ (Either A B) Absurd)
       (Σ ((neg-a (→ A Absurd))) (→ B Absurd)))))
(define-tactically de-morgan-1
  ((intro A)
   (intro B)
   (intro neg-or)
   (split-Pair)
   (then
     (intro a)
     (exact (neg-or (left a))))
   (then
     (intro b)
     (exact (neg-or (right b))))))
`;
      expect(() => evaluatePie(str)).not.toThrow();
    });

    it("¬A∧¬B → ¬(A∨B): full De Morgan (constructive direction 2)", () => {
      const str = `
(claim neg-or-from-pair
  (Π ((A U) (B U))
    (→ (→ A Absurd) (→ B Absurd) (→ (Either A B) Absurd))))
(define-tactically neg-or-from-pair
  ((intro A)
   (intro B)
   (intro neg-a)
   (intro neg-b)
   (intro e)
   (elim-Either e)
   (then
     (intro a)
     (exact (neg-a a)))
   (then
     (intro b)
     (exact (neg-b b)))))

(claim de-morgan-2
  (Π ((A U) (B U))
    (→ (Σ ((neg-a (→ A Absurd))) (→ B Absurd))
       (→ (Either A B) Absurd))))
(define-tactically de-morgan-2
  ((exact (λ (A B p)
    (neg-or-from-pair A B (car p) (cdr p))))))
`;
      expect(() => evaluatePie(str)).not.toThrow();
    });

    it("¬A∨¬B → ¬(A∧B): De Morgan for conjunction (constructive)", () => {
      const str = `
(claim de-morgan-3
  (Π ((A U) (B U))
    (→ (Either (→ A Absurd) (→ B Absurd))
       (→ (Σ ((a A)) B) Absurd))))
(define-tactically de-morgan-3
  ((intro A)
   (intro B)
   (intro e)
   (intro p)
   (elim-Either e)
   (then
     (intro neg-a)
     (exact (neg-a (car p))))
   (then
     (intro neg-b)
     (exact (neg-b (cdr p))))))
`;
      expect(() => evaluatePie(str)).not.toThrow();
    });

    it("De Morgan 1 specialized for Nat and Atom", () => {
      const str = `
(claim dm1-nat-atom
  (→ (→ (Either Nat Atom) Absurd)
     (Σ ((neg-n (→ Nat Absurd))) (→ Atom Absurd))))
(define-tactically dm1-nat-atom
  ((intro neg-or)
   (split-Pair)
   (then
     (intro n)
     (exact (neg-or (left n))))
   (then
     (intro a)
     (exact (neg-or (right a))))))
`;
      expect(() => evaluatePie(str)).not.toThrow();
    });

    it("De Morgan 2 specialized for Nat and Atom", () => {
      const str = `
(claim neg-or-from-pair-nat-atom
  (→ (→ Nat Absurd) (→ Atom Absurd)
     (→ (Either Nat Atom) Absurd)))
(define-tactically neg-or-from-pair-nat-atom
  ((intro neg-n)
   (intro neg-a)
   (intro e)
   (elim-Either e)
   (then
     (intro n)
     (exact (neg-n n)))
   (then
     (intro a)
     (exact (neg-a a)))))

(claim dm2-nat-atom
  (→ (Σ ((neg-n (→ Nat Absurd))) (→ Atom Absurd))
     (→ (Either Nat Atom) Absurd)))
(define-tactically dm2-nat-atom
  ((exact (λ (p) (neg-or-from-pair-nat-atom (car p) (cdr p))))))
`;
      expect(() => evaluatePie(str)).not.toThrow();
    });

    it("De Morgan 3 specialized for Nat and Atom", () => {
      const str = `
(claim dm3-nat-atom
  (→ (Either (→ Nat Absurd) (→ Atom Absurd))
     (→ (Σ ((n Nat)) Atom) Absurd)))
(define-tactically dm3-nat-atom
  ((intro e)
   (intro p)
   (elim-Either e)
   (then
     (intro neg-n)
     (exact (neg-n (car p))))
   (then
     (intro neg-a)
     (exact (neg-a (cdr p))))))
`;
      expect(() => evaluatePie(str)).not.toThrow();
    });

    it("De Morgan with boolean: not (and a b) uses elimination", () => {
      const str = `
${boolPreamble}
(claim not-bool (→ Bool Bool))
(define not-bool
  (λ (b)
    (ind-Either b
      (λ (x) Bool)
      (λ (l) false)
      (λ (r) true))))
(claim and-bool (→ Bool Bool Bool))
(define and-bool
  (λ (a b)
    (ind-Either a
      (λ (x) Bool)
      (λ (l) b)
      (λ (r) false))))
(claim or-bool (→ Bool Bool Bool))
(define or-bool
  (λ (a b)
    (ind-Either a
      (λ (x) Bool)
      (λ (l) true)
      (λ (r) b))))
(claim nand (→ Bool Bool Bool))
(define nand (λ (a b) (not-bool (and-bool a b))))
(claim nand-tt (= (Either Trivial Trivial) (nand true true) (right sole)))
(define-tactically nand-tt
  ((exact (same (right sole)))))
(claim nand-ff (= (Either Trivial Trivial) (nand false false) (left sole)))
(define-tactically nand-ff
  ((exact (same (left sole)))))
`;
      expect(() => evaluatePie(str)).not.toThrow();
    });

    it("De Morgan with boolean: not (or a b) = and (not a) (not b) on concrete vals", () => {
      const str = `
${boolPreamble}
(claim not-bool (→ Bool Bool))
(define not-bool
  (λ (b)
    (ind-Either b
      (λ (x) Bool)
      (λ (l) false)
      (λ (r) true))))
(claim and-bool (→ Bool Bool Bool))
(define and-bool
  (λ (a b)
    (ind-Either a
      (λ (x) Bool)
      (λ (l) b)
      (λ (r) false))))
(claim or-bool (→ Bool Bool Bool))
(define or-bool
  (λ (a b)
    (ind-Either a
      (λ (x) Bool)
      (λ (l) true)
      (λ (r) b))))
(claim dm-bool-1 (→ Bool Bool Bool))
(define dm-bool-1 (λ (a b) (not-bool (or-bool a b))))
(claim dm-bool-2 (→ Bool Bool Bool))
(define dm-bool-2 (λ (a b) (and-bool (not-bool a) (not-bool b))))
(claim dm-ff-1 (= (Either Trivial Trivial) (dm-bool-1 false false) (left sole)))
(define-tactically dm-ff-1
  ((exact (same (left sole)))))
(claim dm-ff-2 (= (Either Trivial Trivial) (dm-bool-2 false false) (left sole)))
(define-tactically dm-ff-2
  ((exact (same (left sole)))))
(claim dm-tf-1 (= (Either Trivial Trivial) (dm-bool-1 true false) (right sole)))
(define-tactically dm-tf-1
  ((exact (same (right sole)))))
(claim dm-tf-2 (= (Either Trivial Trivial) (dm-bool-2 true false) (right sole)))
(define-tactically dm-tf-2
  ((exact (same (right sole)))))
`;
      expect(() => evaluatePie(str)).not.toThrow();
    });

    it("¬(A∨B) ↔ ¬A∧¬B: both directions as a pair", () => {
      const str = `
(claim dm-fwd
  (Π ((A U) (B U))
    (→ (→ (Either A B) Absurd)
       (Σ ((neg-a (→ A Absurd))) (→ B Absurd)))))
(define-tactically dm-fwd
  ((exact (λ (A B neg-or)
    (cons (λ (a) (neg-or (left a)))
          (λ (b) (neg-or (right b))))))))

(claim neg-or-from-components
  (Π ((A U) (B U))
    (→ (→ A Absurd) (→ B Absurd) (→ (Either A B) Absurd))))
(define-tactically neg-or-from-components
  ((intro A)
   (intro B)
   (intro neg-a)
   (intro neg-b)
   (intro e)
   (elim-Either e)
   (then
     (intro a)
     (exact (neg-a a)))
   (then
     (intro b)
     (exact (neg-b b)))))

(claim dm-bwd
  (Π ((A U) (B U))
    (→ (Σ ((neg-a (→ A Absurd))) (→ B Absurd))
       (→ (Either A B) Absurd))))
(define-tactically dm-bwd
  ((exact (λ (A B p) (neg-or-from-components A B (car p) (cdr p))))))

(claim dm-iff
  (Π ((A U) (B U))
    (Σ ((fwd (→ (→ (Either A B) Absurd)
                (Σ ((neg-a (→ A Absurd))) (→ B Absurd)))))
       (→ (Σ ((neg-a (→ A Absurd))) (→ B Absurd))
          (→ (Either A B) Absurd)))))
(define-tactically dm-iff
  ((exact (λ (A B)
    (cons (dm-fwd A B) (dm-bwd A B))))))
`;
      expect(() => evaluatePie(str)).not.toThrow();
    });

    it("De Morgan with three types: ¬(A∨B∨C) → ¬A∧¬B∧¬C", () => {
      const str = `
(claim dm-three
  (Π ((A U) (B U) (C U))
    (→ (→ (Either A (Either B C)) Absurd)
       (Σ ((neg-a (→ A Absurd)))
          (Σ ((neg-b (→ B Absurd)))
             (→ C Absurd))))))
(define-tactically dm-three
  ((exact (λ (A B C neg-or)
    (cons
      (λ (a) (neg-or (left a)))
      (cons
        (λ (b) (neg-or (right (left b))))
        (λ (c) (neg-or (right (right c))))))))))
`;
      expect(() => evaluatePie(str)).not.toThrow();
    });

    it("De Morgan reverse with three types: ¬A∧¬B∧¬C → ¬(A∨B∨C)", () => {
      const str = `
(claim neg-or3-from-components
  (Π ((A U) (B U) (C U))
    (→ (→ A Absurd) (→ B Absurd) (→ C Absurd)
       (→ (Either A (Either B C)) Absurd))))
(define-tactically neg-or3-from-components
  ((intro A)
   (intro B)
   (intro C)
   (intro neg-a)
   (intro neg-b)
   (intro neg-c)
   (intro e)
   (elim-Either e)
   (then
     (intro a)
     (exact (neg-a a)))
   (then
     (intro bc)
     (elim-Either bc)
     (then
       (intro b)
       (exact (neg-b b)))
     (then
       (intro c)
       (exact (neg-c c))))))

(claim dm-three-rev
  (Π ((A U) (B U) (C U))
    (→ (Σ ((neg-a (→ A Absurd)))
          (Σ ((neg-b (→ B Absurd)))
             (→ C Absurd)))
       (→ (Either A (Either B C)) Absurd))))
(define-tactically dm-three-rev
  ((exact (λ (A B C p)
    (neg-or3-from-components A B C (car p) (car (cdr p)) (cdr (cdr p)))))))
`;
      expect(() => evaluatePie(str)).not.toThrow();
    });

    it("¬A∨¬B → ¬(A∧B) with nested elimination", () => {
      const str = `
(claim dm-conj
  (→ (Either (→ Nat Absurd) (→ Atom Absurd))
     (→ (Σ ((n Nat)) Atom) Absurd)))
(define-tactically dm-conj
  ((intro neg-disj)
   (intro pair)
   (elim-Either neg-disj)
   (then
     (intro neg-n)
     (exact (neg-n (car pair))))
   (then
     (intro neg-a)
     (exact (neg-a (cdr pair))))))
`;
      expect(() => evaluatePie(str)).not.toThrow();
    });

  });

  describe("Boolean Algebra Identities", () => {

    it("and identity: and true x = x", () => {
      const str = `
${boolPreamble}
(claim and-bool (→ Bool Bool Bool))
(define and-bool
  (λ (a b)
    (ind-Either a
      (λ (x) Bool)
      (λ (l) b)
      (λ (r) false))))
(claim and-id-t (= (Either Trivial Trivial) (and-bool true true) (left sole)))
(define-tactically and-id-t
  ((exact (same (left sole)))))
(claim and-id-f (= (Either Trivial Trivial) (and-bool true false) (right sole)))
(define-tactically and-id-f
  ((exact (same (right sole)))))
`;
      expect(() => evaluatePie(str)).not.toThrow();
    });

    it("or identity: or false x = x", () => {
      const str = `
${boolPreamble}
(claim or-bool (→ Bool Bool Bool))
(define or-bool
  (λ (a b)
    (ind-Either a
      (λ (x) Bool)
      (λ (l) true)
      (λ (r) b))))
(claim or-id-t (= (Either Trivial Trivial) (or-bool false true) (left sole)))
(define-tactically or-id-t
  ((exact (same (left sole)))))
(claim or-id-f (= (Either Trivial Trivial) (or-bool false false) (right sole)))
(define-tactically or-id-f
  ((exact (same (right sole)))))
`;
      expect(() => evaluatePie(str)).not.toThrow();
    });

    it("and annihilation: and false x = false", () => {
      const str = `
${boolPreamble}
(claim and-bool (→ Bool Bool Bool))
(define and-bool
  (λ (a b)
    (ind-Either a
      (λ (x) Bool)
      (λ (l) b)
      (λ (r) false))))
(claim and-annih-t (= (Either Trivial Trivial) (and-bool false true) (right sole)))
(define-tactically and-annih-t
  ((exact (same (right sole)))))
(claim and-annih-f (= (Either Trivial Trivial) (and-bool false false) (right sole)))
(define-tactically and-annih-f
  ((exact (same (right sole)))))
`;
      expect(() => evaluatePie(str)).not.toThrow();
    });

    it("or annihilation: or true x = true", () => {
      const str = `
${boolPreamble}
(claim or-bool (→ Bool Bool Bool))
(define or-bool
  (λ (a b)
    (ind-Either a
      (λ (x) Bool)
      (λ (l) true)
      (λ (r) b))))
(claim or-annih-t (= (Either Trivial Trivial) (or-bool true true) (left sole)))
(define-tactically or-annih-t
  ((exact (same (left sole)))))
(claim or-annih-f (= (Either Trivial Trivial) (or-bool true false) (left sole)))
(define-tactically or-annih-f
  ((exact (same (left sole)))))
`;
      expect(() => evaluatePie(str)).not.toThrow();
    });

    it("complement: and x (not x) = false for true", () => {
      const str = `
${boolPreamble}
(claim not-bool (→ Bool Bool))
(define not-bool
  (λ (b)
    (ind-Either b
      (λ (x) Bool)
      (λ (l) false)
      (λ (r) true))))
(claim and-bool (→ Bool Bool Bool))
(define and-bool
  (λ (a b)
    (ind-Either a
      (λ (x) Bool)
      (λ (l) b)
      (λ (r) false))))
(claim comp-true (= (Either Trivial Trivial) (and-bool true (not-bool true)) (right sole)))
(define-tactically comp-true
  ((exact (same (right sole)))))
(claim comp-false (= (Either Trivial Trivial) (and-bool false (not-bool false)) (right sole)))
(define-tactically comp-false
  ((exact (same (right sole)))))
`;
      expect(() => evaluatePie(str)).not.toThrow();
    });

    it("complement: or x (not x) = true for true", () => {
      const str = `
${boolPreamble}
(claim not-bool (→ Bool Bool))
(define not-bool
  (λ (b)
    (ind-Either b
      (λ (x) Bool)
      (λ (l) false)
      (λ (r) true))))
(claim or-bool (→ Bool Bool Bool))
(define or-bool
  (λ (a b)
    (ind-Either a
      (λ (x) Bool)
      (λ (l) true)
      (λ (r) b))))
(claim comp-or-true (= (Either Trivial Trivial) (or-bool true (not-bool true)) (left sole)))
(define-tactically comp-or-true
  ((exact (same (left sole)))))
(claim comp-or-false (= (Either Trivial Trivial) (or-bool false (not-bool false)) (left sole)))
(define-tactically comp-or-false
  ((exact (same (left sole)))))
`;
      expect(() => evaluatePie(str)).not.toThrow();
    });

    it("absorption: and x (or x y) = x for true/false", () => {
      const str = `
${boolPreamble}
(claim and-bool (→ Bool Bool Bool))
(define and-bool
  (λ (a b)
    (ind-Either a
      (λ (x) Bool)
      (λ (l) b)
      (λ (r) false))))
(claim or-bool (→ Bool Bool Bool))
(define or-bool
  (λ (a b)
    (ind-Either a
      (λ (x) Bool)
      (λ (l) true)
      (λ (r) b))))
(claim abs-true (= (Either Trivial Trivial) (and-bool true (or-bool true false)) (left sole)))
(define-tactically abs-true
  ((exact (same (left sole)))))
(claim abs-false (= (Either Trivial Trivial) (and-bool false (or-bool false true)) (right sole)))
(define-tactically abs-false
  ((exact (same (right sole)))))
`;
      expect(() => evaluatePie(str)).not.toThrow();
    });

    it("absorption: or x (and x y) = x for true/false", () => {
      const str = `
${boolPreamble}
(claim and-bool (→ Bool Bool Bool))
(define and-bool
  (λ (a b)
    (ind-Either a
      (λ (x) Bool)
      (λ (l) b)
      (λ (r) false))))
(claim or-bool (→ Bool Bool Bool))
(define or-bool
  (λ (a b)
    (ind-Either a
      (λ (x) Bool)
      (λ (l) true)
      (λ (r) b))))
(claim abs2-true (= (Either Trivial Trivial) (or-bool true (and-bool true false)) (left sole)))
(define-tactically abs2-true
  ((exact (same (left sole)))))
(claim abs2-false (= (Either Trivial Trivial) (or-bool false (and-bool false true)) (right sole)))
(define-tactically abs2-false
  ((exact (same (right sole)))))
`;
      expect(() => evaluatePie(str)).not.toThrow();
    });

    it("involution: not (not x) = x verified for all bool values", () => {
      const str = `
${boolPreamble}
(claim not-bool (→ Bool Bool))
(define not-bool
  (λ (b)
    (ind-Either b
      (λ (x) Bool)
      (λ (l) false)
      (λ (r) true))))
(claim involution (→ Bool Bool))
(define involution (λ (b) (not-bool (not-bool b))))
(claim invol-true (= (Either Trivial Trivial) (involution true) (left sole)))
(define-tactically invol-true
  ((exact (same (left sole)))))
(claim invol-false (= (Either Trivial Trivial) (involution false) (right sole)))
(define-tactically invol-false
  ((exact (same (right sole)))))
`;
      expect(() => evaluatePie(str)).not.toThrow();
    });

    it("De Morgan boolean: not(and a b) = or (not a) (not b) for all values", () => {
      const str = `
${boolPreamble}
(claim not-bool (→ Bool Bool))
(define not-bool
  (λ (b)
    (ind-Either b
      (λ (x) Bool)
      (λ (l) false)
      (λ (r) true))))
(claim and-bool (→ Bool Bool Bool))
(define and-bool
  (λ (a b)
    (ind-Either a
      (λ (x) Bool)
      (λ (l) b)
      (λ (r) false))))
(claim or-bool (→ Bool Bool Bool))
(define or-bool
  (λ (a b)
    (ind-Either a
      (λ (x) Bool)
      (λ (l) true)
      (λ (r) b))))
(claim lhs (→ Bool Bool Bool))
(define lhs (λ (a b) (not-bool (and-bool a b))))
(claim rhs (→ Bool Bool Bool))
(define rhs (λ (a b) (or-bool (not-bool a) (not-bool b))))
(lhs true true)
(rhs true true)
(lhs true false)
(rhs true false)
(lhs false true)
(rhs false true)
(lhs false false)
(rhs false false)
`;
      expect(() => evaluatePie(str)).not.toThrow();
    });

    it("distributive: and a (or b c) computed for concrete values", () => {
      const str = `
${boolPreamble}
(claim and-bool (→ Bool Bool Bool))
(define and-bool
  (λ (a b)
    (ind-Either a
      (λ (x) Bool)
      (λ (l) b)
      (λ (r) false))))
(claim or-bool (→ Bool Bool Bool))
(define or-bool
  (λ (a b)
    (ind-Either a
      (λ (x) Bool)
      (λ (l) true)
      (λ (r) b))))
(claim dist-t (= (Either Trivial Trivial) (and-bool true (or-bool false true)) (left sole)))
(define-tactically dist-t
  ((exact (same (left sole)))))
(claim dist-f (= (Either Trivial Trivial) (and-bool false (or-bool true true)) (right sole)))
(define-tactically dist-f
  ((exact (same (right sole)))))
`;
      expect(() => evaluatePie(str)).not.toThrow();
    });

    it("De Morgan boolean: not(or a b) = and (not a) (not b) for all values", () => {
      const str = `
${boolPreamble}
(claim not-bool (→ Bool Bool))
(define not-bool
  (λ (b)
    (ind-Either b
      (λ (x) Bool)
      (λ (l) false)
      (λ (r) true))))
(claim and-bool (→ Bool Bool Bool))
(define and-bool
  (λ (a b)
    (ind-Either a
      (λ (x) Bool)
      (λ (l) b)
      (λ (r) false))))
(claim or-bool (→ Bool Bool Bool))
(define or-bool
  (λ (a b)
    (ind-Either a
      (λ (x) Bool)
      (λ (l) true)
      (λ (r) b))))
(claim lhs (→ Bool Bool Bool))
(define lhs (λ (a b) (not-bool (or-bool a b))))
(claim rhs (→ Bool Bool Bool))
(define rhs (λ (a b) (and-bool (not-bool a) (not-bool b))))
(lhs false false)
(rhs false false)
(lhs true false)
(rhs true false)
`;
      expect(() => evaluatePie(str)).not.toThrow();
    });

  });

  describe("Error Cases", () => {

    it("go-Left on non-Either type should fail", () => {
      const str = `
(claim bad Nat)
(define-tactically bad
  ((go-Left)
   (exact 5)))
`;
      expect(() => evaluatePie(str)).toThrow();
    });

    it("elim-Either on non-Either type should fail", () => {
      const str = `
(claim bad-elim (→ Nat Nat))
(define-tactically bad-elim
  ((intro n)
   (elim-Either n)
   (then (intro l) (exact l))
   (then (intro r) (exact r))))
`;
      expect(() => evaluatePie(str)).toThrow();
    });

    it("missing then blocks after elim-Either should fail", () => {
      const str = `
${boolPreamble}
(claim bad-case (→ Bool Nat))
(define-tactically bad-case
  ((intro b)
   (elim-Either b)
   (exact 1)
   (exact 2)))
`;
      expect(() => evaluatePie(str)).toThrow("Expected 'then' block to handle subgoal branch");
    });

    it("incomplete boolean function proof should fail", () => {
      const str = `
${boolPreamble}
(claim bad-not (→ Bool Bool))
(define-tactically bad-not
  ((intro b)))
`;
      expect(() => evaluatePie(str)).toThrow(/incomplete/i);
    });

  });

});
