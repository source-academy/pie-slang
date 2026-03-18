import 'jest';
import { evaluatePie } from '../../main';

const boolPreamble = `
(claim Bool U)
(define Bool (Either Trivial Trivial))
(claim true Bool)
(define true (left sole))
(claim false Bool)
(define false (right sole))

(claim not-bool (→ Bool Bool))
(define not-bool
  (λ (b) (ind-Either b (λ (x) Bool) (λ (l) false) (λ (r) true))))

(claim and-bool (→ Bool Bool Bool))
(define and-bool
  (λ (a b) (ind-Either a (λ (x) Bool) (λ (l) b) (λ (r) false))))

(claim or-bool (→ Bool Bool Bool))
(define or-bool
  (λ (a b) (ind-Either a (λ (x) Bool) (λ (l) true) (λ (r) b))))

(claim xor-bool (→ Bool Bool Bool))
(define xor-bool
  (λ (a b) (ind-Either a (λ (x) Bool) (λ (l) (not-bool b)) (λ (r) b))))

(claim implies-bool (→ Bool Bool Bool))
(define implies-bool
  (λ (a b) (ind-Either a (λ (x) Bool) (λ (l) b) (λ (r) true))))
`;

describe("Complex Boolean Algebra and Propositional Logic Tactics", () => {

  // ---------------------------------------------------------------------------
  // Part 1: Boolean Algebra (= Bool equality proofs via case analysis)
  // ---------------------------------------------------------------------------

  describe("Part 1: Boolean Algebra Identities", () => {

    // 1. Double negation: not(not(a)) = a
    it("1. not-not: double negation is identity", () => {
      const str = `
${boolPreamble}
(claim not-not
  (Π ((a Bool)) (= Bool (not-bool (not-bool a)) a)))
(define-tactically not-not
  ((intro a)
   (elim-Either a)
   (then (intro l) (exact (same (left sole))))
   (then (intro r) (exact (same (right sole))))))
`;
      expect(() => evaluatePie(str)).not.toThrow();
    });

    // 2. and-comm: and(a, b) = and(b, a)
    it("2. and-comm: conjunction is commutative", () => {
      const str = `
${boolPreamble}
(claim and-comm
  (Π ((a Bool) (b Bool)) (= Bool (and-bool a b) (and-bool b a))))
(define-tactically and-comm
  ((intro a) (intro b)
   (elim-Either a)
   (then (intro la)
     (elim-Either b)
     (then (intro lb) (exact (same (left sole))))
     (then (intro rb) (exact (same (right sole)))))
   (then (intro ra)
     (elim-Either b)
     (then (intro lb) (exact (same (right sole))))
     (then (intro rb) (exact (same (right sole)))))))
`;
      expect(() => evaluatePie(str)).not.toThrow();
    });

    // 3. or-comm: or(a, b) = or(b, a)
    it("3. or-comm: disjunction is commutative", () => {
      const str = `
${boolPreamble}
(claim or-comm
  (Π ((a Bool) (b Bool)) (= Bool (or-bool a b) (or-bool b a))))
(define-tactically or-comm
  ((intro a) (intro b)
   (elim-Either a)
   (then (intro la)
     (elim-Either b)
     (then (intro lb) (exact (same (left sole))))
     (then (intro rb) (exact (same (left sole)))))
   (then (intro ra)
     (elim-Either b)
     (then (intro lb) (exact (same (left sole))))
     (then (intro rb) (exact (same (right sole)))))))
`;
      expect(() => evaluatePie(str)).not.toThrow();
    });

    // 4. and-assoc: and(and(a, b), c) = and(a, and(b, c))
    it("4. and-assoc: conjunction is associative", () => {
      const str = `
${boolPreamble}
(claim and-assoc
  (Π ((a Bool) (b Bool) (c Bool))
    (= Bool (and-bool (and-bool a b) c) (and-bool a (and-bool b c)))))
(define and-assoc
  (λ (a b c)
    (ind-Either a (λ (x) (= Bool (and-bool (and-bool x b) c) (and-bool x (and-bool b c))))
      (λ (la) (ind-Either b (λ (y) (= Bool (and-bool (and-bool (left sole) y) c) (and-bool (left sole) (and-bool y c))))
        (λ (lb) (ind-Either c (λ (z) (= Bool (and-bool (and-bool (left sole) (left sole)) z) (and-bool (left sole) (and-bool (left sole) z))))
          (λ (lc) (same (left sole)))
          (λ (rc) (same (right sole)))))
        (λ (rb) (ind-Either c (λ (z) (= Bool (and-bool (and-bool (left sole) (right sole)) z) (and-bool (left sole) (and-bool (right sole) z))))
          (λ (lc) (same (right sole)))
          (λ (rc) (same (right sole)))))))
      (λ (ra) (ind-Either b (λ (y) (= Bool (and-bool (and-bool (right sole) y) c) (and-bool (right sole) (and-bool y c))))
        (λ (lb) (ind-Either c (λ (z) (= Bool (and-bool (and-bool (right sole) (left sole)) z) (and-bool (right sole) (and-bool (left sole) z))))
          (λ (lc) (same (right sole)))
          (λ (rc) (same (right sole)))))
        (λ (rb) (ind-Either c (λ (z) (= Bool (and-bool (and-bool (right sole) (right sole)) z) (and-bool (right sole) (and-bool (right sole) z))))
          (λ (lc) (same (right sole)))
          (λ (rc) (same (right sole))))))))))
`;
      expect(() => evaluatePie(str)).not.toThrow();
    });

    // 5. or-assoc: or(or(a, b), c) = or(a, or(b, c))
    it("5. or-assoc: disjunction is associative", () => {
      const str = `
${boolPreamble}
(claim or-assoc
  (Π ((a Bool) (b Bool) (c Bool))
    (= Bool (or-bool (or-bool a b) c) (or-bool a (or-bool b c)))))
(define or-assoc
  (λ (a b c)
    (ind-Either a (λ (x) (= Bool (or-bool (or-bool x b) c) (or-bool x (or-bool b c))))
      (λ (la) (ind-Either b (λ (y) (= Bool (or-bool (or-bool (left sole) y) c) (or-bool (left sole) (or-bool y c))))
        (λ (lb) (ind-Either c (λ (z) (= Bool (or-bool (or-bool (left sole) (left sole)) z) (or-bool (left sole) (or-bool (left sole) z))))
          (λ (lc) (same (left sole)))
          (λ (rc) (same (left sole)))))
        (λ (rb) (ind-Either c (λ (z) (= Bool (or-bool (or-bool (left sole) (right sole)) z) (or-bool (left sole) (or-bool (right sole) z))))
          (λ (lc) (same (left sole)))
          (λ (rc) (same (left sole)))))))
      (λ (ra) (ind-Either b (λ (y) (= Bool (or-bool (or-bool (right sole) y) c) (or-bool (right sole) (or-bool y c))))
        (λ (lb) (ind-Either c (λ (z) (= Bool (or-bool (or-bool (right sole) (left sole)) z) (or-bool (right sole) (or-bool (left sole) z))))
          (λ (lc) (same (left sole)))
          (λ (rc) (same (left sole)))))
        (λ (rb) (ind-Either c (λ (z) (= Bool (or-bool (or-bool (right sole) (right sole)) z) (or-bool (right sole) (or-bool (right sole) z))))
          (λ (lc) (same (left sole)))
          (λ (rc) (same (right sole))))))))))
`;
      expect(() => evaluatePie(str)).not.toThrow();
    });

    // 6. and-dist-or: and(a, or(b, c)) = or(and(a, b), and(a, c))
    it("6. and-dist-or: conjunction distributes over disjunction", () => {
      const str = `
${boolPreamble}
(claim and-dist-or
  (Π ((a Bool) (b Bool) (c Bool))
    (= Bool (and-bool a (or-bool b c)) (or-bool (and-bool a b) (and-bool a c)))))
(define and-dist-or
  (λ (a b c)
    (ind-Either a (λ (x) (= Bool (and-bool x (or-bool b c)) (or-bool (and-bool x b) (and-bool x c))))
      (λ (la) (ind-Either b (λ (y) (= Bool (and-bool (left sole) (or-bool y c)) (or-bool (and-bool (left sole) y) (and-bool (left sole) c))))
        (λ (lb) (ind-Either c (λ (z) (= Bool (and-bool (left sole) (or-bool (left sole) z)) (or-bool (and-bool (left sole) (left sole)) (and-bool (left sole) z))))
          (λ (lc) (same (left sole)))
          (λ (rc) (same (left sole)))))
        (λ (rb) (ind-Either c (λ (z) (= Bool (and-bool (left sole) (or-bool (right sole) z)) (or-bool (and-bool (left sole) (right sole)) (and-bool (left sole) z))))
          (λ (lc) (same (left sole)))
          (λ (rc) (same (right sole)))))))
      (λ (ra) (ind-Either b (λ (y) (= Bool (and-bool (right sole) (or-bool y c)) (or-bool (and-bool (right sole) y) (and-bool (right sole) c))))
        (λ (lb) (ind-Either c (λ (z) (= Bool (and-bool (right sole) (or-bool (left sole) z)) (or-bool (and-bool (right sole) (left sole)) (and-bool (right sole) z))))
          (λ (lc) (same (right sole)))
          (λ (rc) (same (right sole)))))
        (λ (rb) (ind-Either c (λ (z) (= Bool (and-bool (right sole) (or-bool (right sole) z)) (or-bool (and-bool (right sole) (right sole)) (and-bool (right sole) z))))
          (λ (lc) (same (right sole)))
          (λ (rc) (same (right sole))))))))))
`;
      expect(() => evaluatePie(str)).not.toThrow();
    });

    // 7. or-dist-and: or(a, and(b, c)) = and(or(a, b), or(a, c))
    it("7. or-dist-and: disjunction distributes over conjunction", () => {
      const str = `
${boolPreamble}
(claim or-dist-and
  (Π ((a Bool) (b Bool) (c Bool))
    (= Bool (or-bool a (and-bool b c)) (and-bool (or-bool a b) (or-bool a c)))))
(define or-dist-and
  (λ (a b c)
    (ind-Either a (λ (x) (= Bool (or-bool x (and-bool b c)) (and-bool (or-bool x b) (or-bool x c))))
      (λ (la) (ind-Either b (λ (y) (= Bool (or-bool (left sole) (and-bool y c)) (and-bool (or-bool (left sole) y) (or-bool (left sole) c))))
        (λ (lb) (ind-Either c (λ (z) (= Bool (or-bool (left sole) (and-bool (left sole) z)) (and-bool (or-bool (left sole) (left sole)) (or-bool (left sole) z))))
          (λ (lc) (same (left sole)))
          (λ (rc) (same (left sole)))))
        (λ (rb) (ind-Either c (λ (z) (= Bool (or-bool (left sole) (and-bool (right sole) z)) (and-bool (or-bool (left sole) (right sole)) (or-bool (left sole) z))))
          (λ (lc) (same (left sole)))
          (λ (rc) (same (left sole)))))))
      (λ (ra) (ind-Either b (λ (y) (= Bool (or-bool (right sole) (and-bool y c)) (and-bool (or-bool (right sole) y) (or-bool (right sole) c))))
        (λ (lb) (ind-Either c (λ (z) (= Bool (or-bool (right sole) (and-bool (left sole) z)) (and-bool (or-bool (right sole) (left sole)) (or-bool (right sole) z))))
          (λ (lc) (same (left sole)))
          (λ (rc) (same (right sole)))))
        (λ (rb) (ind-Either c (λ (z) (= Bool (or-bool (right sole) (and-bool (right sole) z)) (and-bool (or-bool (right sole) (right sole)) (or-bool (right sole) z))))
          (λ (lc) (same (right sole)))
          (λ (rc) (same (right sole))))))))))
`;
      expect(() => evaluatePie(str)).not.toThrow();
    });

    // 8. and-absorb: and(a, or(a, b)) = a
    it("8. and-absorb: conjunction absorbs disjunction", () => {
      const str = `
${boolPreamble}
(claim and-absorb
  (Π ((a Bool) (b Bool)) (= Bool (and-bool a (or-bool a b)) a)))
(define-tactically and-absorb
  ((intro a) (intro b)
   (elim-Either a)
   (then (intro la)
     (elim-Either b)
     (then (intro lb) (exact (same (left sole))))
     (then (intro rb) (exact (same (left sole)))))
   (then (intro ra)
     (elim-Either b)
     (then (intro lb) (exact (same (right sole))))
     (then (intro rb) (exact (same (right sole)))))))
`;
      expect(() => evaluatePie(str)).not.toThrow();
    });

    // 9. or-absorb: or(a, and(a, b)) = a
    it("9. or-absorb: disjunction absorbs conjunction", () => {
      const str = `
${boolPreamble}
(claim or-absorb
  (Π ((a Bool) (b Bool)) (= Bool (or-bool a (and-bool a b)) a)))
(define-tactically or-absorb
  ((intro a) (intro b)
   (elim-Either a)
   (then (intro la)
     (elim-Either b)
     (then (intro lb) (exact (same (left sole))))
     (then (intro rb) (exact (same (left sole)))))
   (then (intro ra)
     (elim-Either b)
     (then (intro lb) (exact (same (right sole))))
     (then (intro rb) (exact (same (right sole)))))))
`;
      expect(() => evaluatePie(str)).not.toThrow();
    });

    // 10. xor-comm: xor(a, b) = xor(b, a)
    it("10. xor-comm: exclusive or is commutative", () => {
      const str = `
${boolPreamble}
(claim xor-comm
  (Π ((a Bool) (b Bool)) (= Bool (xor-bool a b) (xor-bool b a))))
(define-tactically xor-comm
  ((intro a) (intro b)
   (elim-Either a)
   (then (intro la)
     (elim-Either b)
     (then (intro lb) (exact (same (right sole))))
     (then (intro rb) (exact (same (left sole)))))
   (then (intro ra)
     (elim-Either b)
     (then (intro lb) (exact (same (left sole))))
     (then (intro rb) (exact (same (right sole)))))))
`;
      expect(() => evaluatePie(str)).not.toThrow();
    });

    // 11. not-and (De Morgan): not(and(a, b)) = or(not(a), not(b))
    it("11. not-and: De Morgan law for conjunction", () => {
      const str = `
${boolPreamble}
(claim not-and
  (Π ((a Bool) (b Bool))
    (= Bool (not-bool (and-bool a b)) (or-bool (not-bool a) (not-bool b)))))
(define-tactically not-and
  ((intro a) (intro b)
   (elim-Either a)
   (then (intro la)
     (elim-Either b)
     (then (intro lb) (exact (same (right sole))))
     (then (intro rb) (exact (same (left sole)))))
   (then (intro ra)
     (elim-Either b)
     (then (intro lb) (exact (same (left sole))))
     (then (intro rb) (exact (same (left sole)))))))
`;
      expect(() => evaluatePie(str)).not.toThrow();
    });

    // 12. not-or (De Morgan): not(or(a, b)) = and(not(a), not(b))
    it("12. not-or: De Morgan law for disjunction", () => {
      const str = `
${boolPreamble}
(claim not-or
  (Π ((a Bool) (b Bool))
    (= Bool (not-bool (or-bool a b)) (and-bool (not-bool a) (not-bool b)))))
(define-tactically not-or
  ((intro a) (intro b)
   (elim-Either a)
   (then (intro la)
     (elim-Either b)
     (then (intro lb) (exact (same (right sole))))
     (then (intro rb) (exact (same (right sole)))))
   (then (intro ra)
     (elim-Either b)
     (then (intro lb) (exact (same (right sole))))
     (then (intro rb) (exact (same (left sole)))))))
`;
      expect(() => evaluatePie(str)).not.toThrow();
    });

  });

  // ---------------------------------------------------------------------------
  // Part 2: Propositional Logic (type-level proofs)
  // ---------------------------------------------------------------------------

  describe("Part 2: Propositional Logic (Type-Level)", () => {

    // 13. curry: (A x B -> C) -> A -> B -> C
    it("13. curry: currying a function on pairs", () => {
      const str = `
(claim curry-fn
  (Π ((A U) (B U) (C U))
    (→ (→ (Σ ((a A)) B) C) (→ A B C))))
(define-tactically curry-fn
  ((intro A) (intro B) (intro C) (intro f) (intro a) (intro b)
   (exact (f (the (Σ ((a A)) B) (cons a b))))))
`;
      expect(() => evaluatePie(str)).not.toThrow();
    });

    // 14. uncurry: (A -> B -> C) -> (A x B -> C)
    it("14. uncurry: uncurrying a function to pairs", () => {
      const str = `
(claim uncurry-fn
  (Π ((A U) (B U) (C U))
    (→ (→ A B C) (→ (Σ ((a A)) B) C))))
(define-tactically uncurry-fn
  ((intro A) (intro B) (intro C) (intro f) (intro p)
   (exact (f (car p) (cdr p)))))
`;
      expect(() => evaluatePie(str)).not.toThrow();
    });

    // 15. and-comm (type-level): A x B -> B x A
    it("15. and-comm-type: pair commutativity at the type level", () => {
      const str = `
(claim and-comm-type
  (Π ((A U) (B U))
    (→ (Σ ((a A)) B) (Σ ((b B)) A))))
(define-tactically and-comm-type
  ((intro A) (intro B) (intro p)
   (exists (cdr p) b)
   (exact (car p))))
`;
      expect(() => evaluatePie(str)).not.toThrow();
    });

    // 16. or-comm (type-level): A + B -> B + A
    it("16. or-comm-type: Either commutativity at the type level", () => {
      const str = `
(claim or-comm-type
  (Π ((A U) (B U))
    (→ (Either A B) (Either B A))))
(define-tactically or-comm-type
  ((intro A) (intro B) (intro e)
   (elim-Either e)
   (then (intro a) (go-Right) (exact a))
   (then (intro b) (go-Left) (exact b))))
`;
      expect(() => evaluatePie(str)).not.toThrow();
    });

    // 17. constructive-dilemma: (A -> C) -> (B -> D) -> A + B -> C + D
    it("17. constructive-dilemma: mapping over Either with two functions", () => {
      const str = `
(claim constructive-dilemma
  (Π ((A U) (B U) (C U) (D U))
    (→ (→ A C) (→ B D) (Either A B) (Either C D))))
(define-tactically constructive-dilemma
  ((intro A) (intro B) (intro C) (intro D) (intro f) (intro g) (intro e)
   (elim-Either e)
   (then (intro a) (go-Left) (exact (f a)))
   (then (intro b) (go-Right) (exact (g b)))))
`;
      expect(() => evaluatePie(str)).not.toThrow();
    });

    // 18. contrapositive: (A -> B) -> (not B -> not A)
    it("18. contrapositive: reversing implication via negation", () => {
      const str = `
(claim contrapositive
  (Π ((A U) (B U))
    (→ (→ A B) (→ (→ B Absurd) (→ A Absurd)))))
(define-tactically contrapositive
  ((intro A) (intro B) (intro f) (intro neg-b) (intro a)
   (exact (neg-b (f a)))))
`;
      expect(() => evaluatePie(str)).not.toThrow();
    });

    // 19. dn-intro: A -> not(not A)
    it("19. dn-intro: double negation introduction", () => {
      const str = `
(claim dn-intro
  (Π ((A U))
    (→ A (→ (→ A Absurd) Absurd))))
(define-tactically dn-intro
  ((intro A) (intro a) (intro neg-a)
   (exact (neg-a a))))
`;
      expect(() => evaluatePie(str)).not.toThrow();
    });

    // 20. non-contradiction: A x (not A) -> Absurd
    it("20. non-contradiction: a proof and its negation yield Absurd", () => {
      const str = `
(claim non-contradiction
  (Π ((A U))
    (→ (Σ ((a A)) (→ A Absurd)) Absurd)))

(claim non-contradiction-helper
  (Π ((A U)) (→ A (→ A Absurd) Absurd)))
(define non-contradiction-helper
  (λ (A a neg-a) (neg-a a)))

(define non-contradiction
  (λ (A p) (non-contradiction-helper A (car p) (cdr p))))
`;
      expect(() => evaluatePie(str)).not.toThrow();
    });

    // 21. weak-excluded-middle: not(not(A + not A))
    it("21. weak-excluded-middle: double negation of excluded middle", () => {
      const str = `
(claim weak-em
  (Π ((A U))
    (→ (→ (Either A (→ A Absurd)) Absurd) Absurd)))
(define-tactically weak-em
  ((intro A) (intro f)
   (exact (f (right (λ (a) (f (left a))))))))
`;
      expect(() => evaluatePie(str)).not.toThrow();
    });

    // 22. or-elim-neg: A + B -> not A -> B
    it("22. or-elim-neg: eliminating a disjunction with a negation", () => {
      const str = `
(claim or-elim-neg
  (Π ((A U) (B U))
    (→ (Either A B) (→ A Absurd) B)))
(define-tactically or-elim-neg
  ((intro A) (intro B) (intro e) (intro neg-a)
   (elim-Either e)
   (then (intro a) (exact (ind-Absurd (neg-a a) B)))
   (then (intro b) (exact b))))
`;
      expect(() => evaluatePie(str)).not.toThrow();
    });

    // 23. dist-arrow-and: (A -> B x C) -> (A -> B) x (A -> C)
    it("23. dist-arrow-and: distributing arrow over conjunction", () => {
      const str = `
(claim dist-arrow-and
  (Π ((A U) (B U) (C U))
    (→ (→ A (Σ ((b B)) C))
       (Σ ((f (→ A B))) (→ A C)))))
(define-tactically dist-arrow-and
  ((intro A) (intro B) (intro C) (intro f)
   (exists (λ (a) (car (f a))) g)
   (exact (λ (a) (cdr (f a))))))
`;
      expect(() => evaluatePie(str)).not.toThrow();
    });

    // 24. pair-assoc-lr: (A x B) x C -> A x (B x C)
    it("24. pair-assoc-lr: left-to-right pair reassociation", () => {
      const str = `
(claim pair-assoc-lr
  (Π ((A U) (B U) (C U))
    (→ (Σ ((ab (Σ ((a A)) B))) C)
       (Σ ((a A)) (Σ ((b B)) C)))))
(define-tactically pair-assoc-lr
  ((intro A) (intro B) (intro C) (intro p)
   (exists (car (car p)) a)
   (exists (cdr (car p)) b)
   (exact (cdr p))))
`;
      expect(() => evaluatePie(str)).not.toThrow();
    });

    // 25. pair-assoc-rl: A x (B x C) -> (A x B) x C
    it("25. pair-assoc-rl: right-to-left pair reassociation", () => {
      const str = `
(claim pair-assoc-rl
  (Π ((A U) (B U) (C U))
    (→ (Σ ((a A)) (Σ ((b B)) C))
       (Σ ((ab (Σ ((a A)) B))) C))))
(define-tactically pair-assoc-rl
  ((intro A) (intro B) (intro C) (intro p)
   (exists (the (Σ ((a A)) B) (cons (car p) (car (cdr p)))) ab)
   (exact (cdr (cdr p)))))
`;
      expect(() => evaluatePie(str)).not.toThrow();
    });

  });

  // ---------------------------------------------------------------------------
  // Part 3: Additional Boolean Identities
  // ---------------------------------------------------------------------------

  describe("Part 3: XOR Properties", () => {

    it("26. xor-assoc: xor is associative", () => {
      const str = `
${boolPreamble}
(claim xor-assoc
  (Π ((a Bool) (b Bool) (c Bool))
    (= Bool (xor-bool (xor-bool a b) c) (xor-bool a (xor-bool b c)))))
(define xor-assoc
  (λ (a b c)
    (ind-Either a (λ (x) (= Bool (xor-bool (xor-bool x b) c) (xor-bool x (xor-bool b c))))
      (λ (la) (ind-Either b (λ (y) (= Bool (xor-bool (xor-bool (left sole) y) c) (xor-bool (left sole) (xor-bool y c))))
        (λ (lb) (ind-Either c (λ (z) (= Bool (xor-bool (xor-bool (left sole) (left sole)) z) (xor-bool (left sole) (xor-bool (left sole) z))))
          (λ (lc) (same (left sole)))
          (λ (rc) (same (right sole)))))
        (λ (rb) (ind-Either c (λ (z) (= Bool (xor-bool (xor-bool (left sole) (right sole)) z) (xor-bool (left sole) (xor-bool (right sole) z))))
          (λ (lc) (same (right sole)))
          (λ (rc) (same (left sole)))))))
      (λ (ra) (ind-Either b (λ (y) (= Bool (xor-bool (xor-bool (right sole) y) c) (xor-bool (right sole) (xor-bool y c))))
        (λ (lb) (ind-Either c (λ (z) (= Bool (xor-bool (xor-bool (right sole) (left sole)) z) (xor-bool (right sole) (xor-bool (left sole) z))))
          (λ (lc) (same (right sole)))
          (λ (rc) (same (left sole)))))
        (λ (rb) (ind-Either c (λ (z) (= Bool (xor-bool (xor-bool (right sole) (right sole)) z) (xor-bool (right sole) (xor-bool (right sole) z))))
          (λ (lc) (same (left sole)))
          (λ (rc) (same (right sole))))))))))
`;
      expect(() => evaluatePie(str)).not.toThrow();
    });

    it("27. xor-self-false: xor(a,a) = false", () => {
      const str = `
${boolPreamble}
(claim xor-self
  (Π ((a Bool)) (= Bool (xor-bool a a) false)))
(define-tactically xor-self
  ((intro a) (elim-Either a)
   (then (intro la) (exact (same (right sole))))
   (then (intro ra) (exact (same (right sole))))))
`;
      expect(() => evaluatePie(str)).not.toThrow();
    });

    it("28. xor-false-id: xor(a, false) = a", () => {
      const str = `
${boolPreamble}
(claim xor-false-id
  (Π ((a Bool)) (= Bool (xor-bool a false) a)))
(define-tactically xor-false-id
  ((intro a) (elim-Either a)
   (then (intro la) (exact (same (left sole))))
   (then (intro ra) (exact (same (right sole))))))
`;
      expect(() => evaluatePie(str)).not.toThrow();
    });

    it("29. xor-true-not: xor(a, true) = not(a)", () => {
      const str = `
${boolPreamble}
(claim xor-true-not
  (Π ((a Bool)) (= Bool (xor-bool a true) (not-bool a))))
(define-tactically xor-true-not
  ((intro a) (elim-Either a)
   (then (intro la) (exact (same (right sole))))
   (then (intro ra) (exact (same (left sole))))))
`;
      expect(() => evaluatePie(str)).not.toThrow();
    });

  });

  describe("Part 4: Implication Properties", () => {

    it("30. implies-refl: implies(a,a) = true", () => {
      const str = `
${boolPreamble}
(claim implies-refl
  (Π ((a Bool)) (= Bool (implies-bool a a) true)))
(define-tactically implies-refl
  ((intro a) (elim-Either a)
   (then (intro la) (exact (same (left sole))))
   (then (intro ra) (exact (same (left sole))))))
`;
      expect(() => evaluatePie(str)).not.toThrow();
    });

    it("31. implies-true: implies(true, b) = b", () => {
      const str = `
${boolPreamble}
(claim implies-true
  (Π ((b Bool)) (= Bool (implies-bool true b) b)))
(define-tactically implies-true
  ((intro b) (elim-Either b)
   (then (intro lb) (exact (same (left sole))))
   (then (intro rb) (exact (same (right sole))))))
`;
      expect(() => evaluatePie(str)).not.toThrow();
    });

    it("32. implies-false: implies(false, b) = true", () => {
      const str = `
${boolPreamble}
(claim implies-false
  (Π ((b Bool)) (= Bool (implies-bool false b) true)))
(define-tactically implies-false
  ((intro b) (elim-Either b)
   (then (intro lb) (exact (same (left sole))))
   (then (intro rb) (exact (same (left sole))))))
`;
      expect(() => evaluatePie(str)).not.toThrow();
    });

    it("33. not-implies: not(implies(a,b)) = and(a, not(b))", () => {
      const str = `
${boolPreamble}
(claim not-implies
  (Π ((a Bool) (b Bool))
    (= Bool (not-bool (implies-bool a b)) (and-bool a (not-bool b)))))
(define-tactically not-implies
  ((intro a) (intro b)
   (elim-Either a)
   (then (intro la) (elim-Either b)
     (then (intro lb) (exact (same (right sole))))
     (then (intro rb) (exact (same (left sole)))))
   (then (intro ra) (elim-Either b)
     (then (intro lb) (exact (same (right sole))))
     (then (intro rb) (exact (same (right sole)))))))
`;
      expect(() => evaluatePie(str)).not.toThrow();
    });

  });

  describe("Part 5: Additional Type-Level Logic", () => {

    it("34. Either-assoc: Either (Either A B) C -> Either A (Either B C)", () => {
      const str = `
(claim Either-assoc
  (Π ((A U) (B U) (C U))
    (→ (Either (Either A B) C) (Either A (Either B C)))))
(define-tactically Either-assoc
  ((intro A) (intro B) (intro C) (intro e)
   (elim-Either e)
   (then (intro ab) (elim-Either ab)
     (then (intro a) (go-Left) (exact a))
     (then (intro b) (go-Right) (go-Left) (exact b)))
   (then (intro c) (go-Right) (go-Right) (exact c))))
`;
      expect(() => evaluatePie(str)).not.toThrow();
    });

    it("35. S-combinator: (A->B->C) -> (A->B) -> A -> C", () => {
      const str = `
(claim S-comb
  (Π ((A U) (B U) (C U))
    (→ (→ A B C) (→ A B) A C)))
(define-tactically S-comb
  ((intro A) (intro B) (intro C) (intro f) (intro g) (intro a)
   (exact (f a (g a)))))
`;
      expect(() => evaluatePie(str)).not.toThrow();
    });

    it("36. ex-falso: Absurd -> A", () => {
      const str = `
(claim ex-falso (Π ((A U)) (→ Absurd A)))
(define-tactically ex-falso
  ((intro A) (intro bot) (exact (ind-Absurd bot A))))
`;
      expect(() => evaluatePie(str)).not.toThrow();
    });

    it("37. modus-tollens: (A->B) -> not(B) -> not(A)", () => {
      const str = `
(claim modus-tollens
  (Π ((A U) (B U))
    (→ (→ A B) (→ B Absurd) (→ A Absurd))))
(define-tactically modus-tollens
  ((intro A) (intro B) (intro f) (intro neg-b) (intro a)
   (exact (neg-b (f a)))))
`;
      expect(() => evaluatePie(str)).not.toThrow();
    });

    it("38. flip: (A -> B -> C) -> (B -> A -> C)", () => {
      const str = `
(claim flip-fn
  (Π ((A U) (B U) (C U))
    (→ (→ A B C) (→ B A C))))
(define-tactically flip-fn
  ((intro A) (intro B) (intro C) (intro f) (intro b) (intro a)
   (exact (f a b))))
`;
      expect(() => evaluatePie(str)).not.toThrow();
    });

    it("39. compose: (B -> C) -> (A -> B) -> (A -> C)", () => {
      const str = `
(claim compose-fn
  (Π ((A U) (B U) (C U))
    (→ (→ B C) (→ A B) A C)))
(define-tactically compose-fn
  ((intro A) (intro B) (intro C) (intro g) (intro f) (intro a)
   (exact (g (f a)))))
`;
      expect(() => evaluatePie(str)).not.toThrow();
    });

    it("40. and-elim-left: A x B -> A", () => {
      const str = `
(claim and-elim-left
  (Π ((A U) (B U)) (→ (Σ ((a A)) B) A)))
(define-tactically and-elim-left
  ((intro A) (intro B) (intro p) (exact (car p))))
`;
      expect(() => evaluatePie(str)).not.toThrow();
    });

    it("41. and-elim-right: A x B -> B", () => {
      const str = `
(claim and-elim-right
  (Π ((A U) (B U)) (→ (Σ ((a A)) B) B)))
(define-tactically and-elim-right
  ((intro A) (intro B) (intro p) (exact (cdr p))))
`;
      expect(() => evaluatePie(str)).not.toThrow();
    });

    it("42. and-intro: A -> B -> A x B", () => {
      const str = `
(claim and-intro
  (Π ((A U) (B U)) (→ A B (Σ ((a A)) B))))
(define-tactically and-intro
  ((intro A) (intro B) (intro a) (intro b)
   (exists a x) (exact b)))
`;
      expect(() => evaluatePie(str)).not.toThrow();
    });

    it("43. or-intro-left: A -> Either A B", () => {
      const str = `
(claim or-intro-left
  (Π ((A U) (B U)) (→ A (Either A B))))
(define-tactically or-intro-left
  ((intro A) (intro B) (intro a) (go-Left) (exact a)))
`;
      expect(() => evaluatePie(str)).not.toThrow();
    });

    it("44. or-intro-right: B -> Either A B", () => {
      const str = `
(claim or-intro-right
  (Π ((A U) (B U)) (→ B (Either A B))))
(define-tactically or-intro-right
  ((intro A) (intro B) (intro b) (go-Right) (exact b)))
`;
      expect(() => evaluatePie(str)).not.toThrow();
    });

  });

  describe("Part 6: Concrete Boolean Verifications", () => {

    it("45. and(true,true) = true", () => {
      const str = `
${boolPreamble}
(claim and-tt (= Bool (and-bool true true) true))
(define-tactically and-tt ((exact (same (left sole)))))
`;
      expect(() => evaluatePie(str)).not.toThrow();
    });

    it("46. or(false,false) = false", () => {
      const str = `
${boolPreamble}
(claim or-ff (= Bool (or-bool false false) false))
(define-tactically or-ff ((exact (same (right sole)))))
`;
      expect(() => evaluatePie(str)).not.toThrow();
    });

    it("47. not(true) = false", () => {
      const str = `
${boolPreamble}
(claim not-t (= Bool (not-bool true) false))
(define-tactically not-t ((exact (same (right sole)))))
`;
      expect(() => evaluatePie(str)).not.toThrow();
    });

    it("48. not(false) = true", () => {
      const str = `
${boolPreamble}
(claim not-f (= Bool (not-bool false) true))
(define-tactically not-f ((exact (same (left sole)))))
`;
      expect(() => evaluatePie(str)).not.toThrow();
    });

    it("49. implies(true,false) = false", () => {
      const str = `
${boolPreamble}
(claim imp-tf (= Bool (implies-bool true false) false))
(define-tactically imp-tf ((exact (same (right sole)))))
`;
      expect(() => evaluatePie(str)).not.toThrow();
    });

    it("50. xor(true,false) = true", () => {
      const str = `
${boolPreamble}
(claim xor-tf (= Bool (xor-bool true false) true))
(define-tactically xor-tf ((exact (same (left sole)))))
`;
      expect(() => evaluatePie(str)).not.toThrow();
    });

  });

});
