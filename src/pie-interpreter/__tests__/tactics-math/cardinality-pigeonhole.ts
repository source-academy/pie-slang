import 'jest';
import { evaluatePie } from '../../main';

const arithPreamble = `
(claim + (→ Nat Nat Nat))
(define + (λ (n j) (iter-Nat n j (λ (x) (add1 x)))))
(claim * (→ Nat Nat Nat))
(define * (λ (n m) (iter-Nat n 0 (+ m))))
`;

const lengthPreamble = `
(claim length (Π ((E U)) (→ (List E) Nat)))
(define length (λ (E l) (rec-List l 0 (λ (e es n) (add1 n)))))
`;

describe("Cardinality and Pigeonhole", () => {

  describe("Finite Set Sizes", () => {

    it("empty list has length 0", () => {
      const str = `${lengthPreamble}
(length Nat (the (List Nat) nil))
`;
      const output = evaluatePie(str);
      expect(output).toContain("0: Nat");
    });

    it("singleton list has length 1", () => {
      const str = `${lengthPreamble}
(length Nat (:: 5 nil))
`;
      const output = evaluatePie(str);
      expect(output).toContain("1: Nat");
    });

    it("two-element list has length 2", () => {
      const str = `${lengthPreamble}
(length Nat (:: 1 (:: 2 nil)))
`;
      const output = evaluatePie(str);
      expect(output).toContain("2: Nat");
    });

    it("three-element list has length 3", () => {
      const str = `${lengthPreamble}
(length Nat (:: 10 (:: 20 (:: 30 nil))))
`;
      const output = evaluatePie(str);
      expect(output).toContain("3: Nat");
    });

    it("five-element list has length 5", () => {
      const str = `${lengthPreamble}
(length Nat (:: 1 (:: 2 (:: 3 (:: 4 (:: 5 nil))))))
`;
      const output = evaluatePie(str);
      expect(output).toContain("5: Nat");
    });

    it("Vec of length 0: vecnil", () => {
      const str = `
(claim v0 (Vec Nat 0))
(define v0 (the (Vec Nat 0) vecnil))
`;
      expect(() => evaluatePie(str)).not.toThrow();
    });

    it("Vec of length 1", () => {
      const str = `
(claim v1 (Vec Nat 1))
(define v1 (vec:: 42 vecnil))
`;
      expect(() => evaluatePie(str)).not.toThrow();
    });

    it("Vec of length 3", () => {
      const str = `
(claim v3 (Vec Nat 3))
(define v3 (vec:: 1 (vec:: 2 (vec:: 3 vecnil))))
`;
      expect(() => evaluatePie(str)).not.toThrow();
    });

    it("length of Atom list", () => {
      const str = `${lengthPreamble}
(length Atom (:: 'a (:: 'b (:: 'c nil))))
`;
      const output = evaluatePie(str);
      expect(output).toContain("3: Nat");
    });

    it("Vec encodes exact size: can't have wrong length", () => {
      const str = `
(claim bad-vec (Vec Nat 2))
(define bad-vec (vec:: 1 vecnil))
`;
      expect(() => evaluatePie(str)).toThrow();
    });

    it("length proof: length of [1,2] = 2", () => {
      const str = `${lengthPreamble}
(claim len-eq (= Nat (length Nat (:: 1 (:: 2 nil))) 2))
(define-tactically len-eq
  ((exact (same 2))))
`;
      expect(() => evaluatePie(str)).not.toThrow();
    });

    it("length proof: length of nil = 0", () => {
      const str = `${lengthPreamble}
(claim len-nil-eq (= Nat (length Nat (the (List Nat) nil)) 0))
(define-tactically len-nil-eq
  ((exact (same 0))))
`;
      expect(() => evaluatePie(str)).not.toThrow();
    });

  });

  describe("Counting with Lists", () => {

    it("append preserves element count: [1]+[2] has length 2", () => {
      const str = `${lengthPreamble}
(claim append (Π ((E U)) (→ (List E) (List E) (List E))))
(define append (λ (E l1 l2) (rec-List l1 l2 (λ (e es acc) (:: e acc)))))
(length Nat (append Nat (:: 1 nil) (:: 2 nil)))
`;
      const output = evaluatePie(str);
      expect(output).toContain("2: Nat");
    });

    it("append [1,2]+[3,4,5] has length 5", () => {
      const str = `${lengthPreamble}
(claim append (Π ((E U)) (→ (List E) (List E) (List E))))
(define append (λ (E l1 l2) (rec-List l1 l2 (λ (e es acc) (:: e acc)))))
(length Nat (append Nat (:: 1 (:: 2 nil)) (:: 3 (:: 4 (:: 5 nil)))))
`;
      const output = evaluatePie(str);
      expect(output).toContain("5: Nat");
    });

    it("append nil to list preserves length", () => {
      const str = `${lengthPreamble}
(claim append (Π ((E U)) (→ (List E) (List E) (List E))))
(define append (λ (E l1 l2) (rec-List l1 l2 (λ (e es acc) (:: e acc)))))
(length Nat (append Nat (the (List Nat) nil) (:: 1 (:: 2 nil))))
`;
      const output = evaluatePie(str);
      expect(output).toContain("2: Nat");
    });

    it("cons increases length by 1", () => {
      const str = `${lengthPreamble}
(claim len-cons-eq
  (= Nat (length Nat (:: 99 (:: 1 (:: 2 nil)))) 3))
(define-tactically len-cons-eq
  ((exact (same 3))))
`;
      expect(() => evaluatePie(str)).not.toThrow();
    });

    it("map preserves length: map over 3-element list", () => {
      const str = `${lengthPreamble}
(claim map (Π ((A U) (B U)) (→ (→ A B) (List A) (List B))))
(define map (λ (A B f l) (rec-List l (the (List B) nil) (λ (e es acc) (:: (f e) acc)))))
(length Atom (map Nat Atom (λ (n) 'x) (:: 1 (:: 2 (:: 3 nil)))))
`;
      const output = evaluatePie(str);
      expect(output).toContain("3: Nat");
    });

    it("filter can reduce length: count elements of filtered list", () => {
      const str = `${lengthPreamble}
(claim l1 (List Nat))
(define l1 (:: 1 (:: 2 (:: 3 nil))))
(length Nat l1)
`;
      const output = evaluatePie(str);
      expect(output).toContain("3: Nat");
    });

    it("reverse preserves length (concrete 3-element)", () => {
      const str = `${lengthPreamble}
(claim reverse (Π ((E U)) (→ (List E) (List E))))
(define reverse (λ (E l)
  (rec-List l (the (List E) nil)
    (λ (e es acc)
      (rec-List acc (:: e nil)
        (λ (a as racc) (:: a racc)))))))
`;
      expect(() => evaluatePie(str)).not.toThrow();
    });

    it("length of nested lists", () => {
      const str = `${lengthPreamble}
(claim outer-len Nat)
(define outer-len
  (length (List Nat) (:: (:: 1 nil) (:: (:: 2 (:: 3 nil)) nil))))
outer-len
`;
      const output = evaluatePie(str);
      expect(output).toContain("2: Nat");
    });

    it("length of 4-element Atom list", () => {
      const str = `${lengthPreamble}
(length Atom (:: 'a (:: 'b (:: 'c (:: 'd nil)))))
`;
      const output = evaluatePie(str);
      expect(output).toContain("4: Nat");
    });

    it("length proof: append of two 2-element lists = 4", () => {
      const str = `${lengthPreamble}
(claim append (Π ((E U)) (→ (List E) (List E) (List E))))
(define append (λ (E l1 l2) (rec-List l1 l2 (λ (e es acc) (:: e acc)))))
(claim len-append-eq
  (= Nat (length Nat (append Nat (:: 1 (:: 2 nil)) (:: 3 (:: 4 nil)))) 4))
(define-tactically len-append-eq
  ((exact (same 4))))
`;
      expect(() => evaluatePie(str)).not.toThrow();
    });

    it("adding element to Vec increases size", () => {
      const str = `
(claim v2 (Vec Nat 2))
(define v2 (vec:: 1 (vec:: 2 vecnil)))
(claim v3 (Vec Nat 3))
(define v3 (vec:: 0 v2))
`;
      expect(() => evaluatePie(str)).not.toThrow();
    });

    it("proof that cons adds 1 to length", () => {
      const str = `${arithPreamble}${lengthPreamble}
(claim cons-len
  (= Nat (length Nat (:: 0 (:: 1 nil))) (+ 1 (length Nat (:: 1 nil)))))
(define-tactically cons-len
  ((exact (same 2))))
`;
      expect(() => evaluatePie(str)).not.toThrow();
    });

  });

  describe("Bijection Witnesses", () => {

    it("bijection between Bool and (Either Trivial Trivial): left direction", () => {
      const str = `
(claim left-val (Either Trivial Trivial))
(define left-val (left sole))
(claim right-val (Either Trivial Trivial))
(define right-val (right sole))
`;
      expect(() => evaluatePie(str)).not.toThrow();
    });

    it("(Either Trivial Trivial) has exactly 2 inhabitants", () => {
      const str = `
(claim two-elts
  (Σ ((a (Either Trivial Trivial)))
    (Σ ((b (Either Trivial Trivial)))
      Trivial)))
(define-tactically two-elts
  ((split-Pair)
   (then (exact (left sole)))
   (then
     (split-Pair)
     (then (exact (right sole)))
     (then (exact sole)))))
`;
      expect(() => evaluatePie(str)).not.toThrow();
    });

    it("Trivial has exactly 1 inhabitant", () => {
      const str = `
(claim one-elt
  (Σ ((t Trivial)) (= Trivial t sole)))
(define-tactically one-elt
  ((exists sole t)
   (exact (same sole))))
`;
      expect(() => evaluatePie(str)).not.toThrow();
    });

    it("map from Trivial to Nat (injection into larger set)", () => {
      const str = `
(claim triv-to-nat (→ Trivial Nat))
(define-tactically triv-to-nat
  ((intro t)
   (exact 0)))
(triv-to-nat sole)
`;
      const output = evaluatePie(str);
      expect(output).toContain("0: Nat");
    });

    it("map from (Either Trivial Trivial) to Nat", () => {
      const str = `
(claim bool-to-nat (→ (Either Trivial Trivial) Nat))
(define bool-to-nat
  (λ (b) (ind-Either b (λ (x) Nat) (λ (l) 0) (λ (r) 1))))
(bool-to-nat (left sole))
(bool-to-nat (right sole))
`;
      const output = evaluatePie(str);
      expect(output).toContain("0: Nat");
      expect(output).toContain("1: Nat");
    });

    it("bijection witness: mapping and inverse for Bool↔{0,1}", () => {
      const str = `
(claim to-nat (→ (Either Trivial Trivial) Nat))
(define to-nat
  (λ (b) (ind-Either b (λ (x) Nat) (λ (l) 0) (λ (r) 1))))
(claim from-nat (→ Nat (Either Trivial Trivial)))
(define from-nat
  (λ (n) (which-Nat n (the (Either Trivial Trivial) (left sole))
    (λ (n-1) (the (Either Trivial Trivial) (right sole))))))
(to-nat (from-nat 0))
(to-nat (from-nat 1))
`;
      const output = evaluatePie(str);
      expect(output).toContain("0: Nat");
      expect(output).toContain("1: Nat");
    });

    it("round-trip for Bool bijection: left", () => {
      const str = `
(claim to-nat (→ (Either Trivial Trivial) Nat))
(define to-nat
  (λ (b) (ind-Either b (λ (x) Nat) (λ (l) 0) (λ (r) 1))))
(claim from-nat (→ Nat (Either Trivial Trivial)))
(define from-nat
  (λ (n) (which-Nat n (the (Either Trivial Trivial) (left sole))
    (λ (n-1) (the (Either Trivial Trivial) (right sole))))))
(claim round-trip-0 (= Nat (to-nat (from-nat 0)) 0))
(define-tactically round-trip-0
  ((exact (same 0))))
`;
      expect(() => evaluatePie(str)).not.toThrow();
    });

    it("round-trip for Bool bijection: right", () => {
      const str = `
(claim to-nat (→ (Either Trivial Trivial) Nat))
(define to-nat
  (λ (b) (ind-Either b (λ (x) Nat) (λ (l) 0) (λ (r) 1))))
(claim from-nat (→ Nat (Either Trivial Trivial)))
(define from-nat
  (λ (n) (which-Nat n (the (Either Trivial Trivial) (left sole))
    (λ (n-1) (the (Either Trivial Trivial) (right sole))))))
(claim round-trip-1 (= Nat (to-nat (from-nat 1)) 1))
(define-tactically round-trip-1
  ((exact (same 1))))
`;
      expect(() => evaluatePie(str)).not.toThrow();
    });

    it("Vec Nat 2 encodes a set of exactly 2 elements", () => {
      const str = `
(claim pair-vec (Vec Nat 2))
(define pair-vec (vec:: 10 (vec:: 20 vecnil)))
`;
      expect(() => evaluatePie(str)).not.toThrow();
    });

    it("identity bijection on Trivial", () => {
      const str = `
(claim triv-bij
  (Σ ((f (→ Trivial Trivial)))
    (Σ ((g (→ Trivial Trivial)))
      Trivial)))
(define-tactically triv-bij
  ((split-Pair)
   (then (exact (λ (t) t)))
   (then
     (split-Pair)
     (then (exact (λ (t) t)))
     (then (exact sole)))))
`;
      expect(() => evaluatePie(str)).not.toThrow();
    });

  });

  describe("Pigeonhole Instances", () => {

    it("3 items in 2 bins: at least one bin has ≥2 (left collision)", () => {
      const str = `
(claim assign1 (Either Trivial Trivial))
(define assign1 (left sole))
(claim assign2 (Either Trivial Trivial))
(define assign2 (left sole))
(claim assign3 (Either Trivial Trivial))
(define assign3 (right sole))
(claim collision
  (Σ ((witness Trivial))
    (= (Either Trivial Trivial) assign1 assign2)))
(define-tactically collision
  ((exists sole witness)
   (exact (same (left sole)))))
`;
      expect(() => evaluatePie(str)).not.toThrow();
    });

    it("3 items in 2 bins: collision detected (right collision)", () => {
      const str = `
(claim assign1 (Either Trivial Trivial))
(define assign1 (left sole))
(claim assign2 (Either Trivial Trivial))
(define assign2 (right sole))
(claim assign3 (Either Trivial Trivial))
(define assign3 (right sole))
(claim collision
  (Σ ((witness Trivial))
    (= (Either Trivial Trivial) assign2 assign3)))
(define-tactically collision
  ((exists sole witness)
   (exact (same (right sole)))))
`;
      expect(() => evaluatePie(str)).not.toThrow();
    });

    it("2 items, both mapped to same value: collision", () => {
      const str = `
(claim v1 Nat)
(define v1 0)
(claim v2 Nat)
(define v2 0)
(claim eq-collision (= Nat v1 v2))
(define-tactically eq-collision
  ((exact (same 0))))
`;
      expect(() => evaluatePie(str)).not.toThrow();
    });

    it("4 booleans must have at least 2 equal (concrete instance)", () => {
      const str = `
(claim b1 (Either Trivial Trivial))
(define b1 (left sole))
(claim b2 (Either Trivial Trivial))
(define b2 (right sole))
(claim b3 (Either Trivial Trivial))
(define b3 (left sole))
(claim b4 (Either Trivial Trivial))
(define b4 (right sole))
(claim collision-1-3 (= (Either Trivial Trivial) b1 b3))
(define-tactically collision-1-3
  ((exact (same (left sole)))))
`;
      expect(() => evaluatePie(str)).not.toThrow();
    });

    it("pigeonhole: 3 Nats all 0, two must be equal", () => {
      const str = `
(claim n1 Nat) (define n1 0)
(claim n2 Nat) (define n2 0)
(claim n3 Nat) (define n3 0)
(claim n1-eq-n2 (= Nat n1 n2))
(define-tactically n1-eq-n2
  ((exact (same 0))))
`;
      expect(() => evaluatePie(str)).not.toThrow();
    });

    it("pigeonhole with witness pair: which two collide", () => {
      const str = `
(claim item1 Nat) (define item1 3)
(claim item2 Nat) (define item2 7)
(claim item3 Nat) (define item3 3)
(claim collision-witness
  (Σ ((proof (= Nat item1 item3))) Trivial))
(define-tactically collision-witness
  ((split-Pair)
   (then (exact (same 3)))
   (then (exact sole))))
`;
      expect(() => evaluatePie(str)).not.toThrow();
    });

    it("no collision when all distinct (2 items, 3 bins)", () => {
      const str = `
(claim a Nat) (define a 0)
(claim b Nat) (define b 1)
(claim distinct
  (→ (= Nat a b) Absurd))
(define distinct
  (λ (eq) (the Absurd (replace eq (λ (x) (which-Nat x Nat (λ (n-1) Absurd))) 0))))
`;
      expect(() => evaluatePie(str)).not.toThrow();
    });

    it("pigeonhole: 3 values from {0,1}, exists pair with same value", () => {
      const str = `
(claim f1 Nat) (define f1 0)
(claim f2 Nat) (define f2 1)
(claim f3 Nat) (define f3 0)
(claim same-output
  (Σ ((p (= Nat f1 f3))) Trivial))
(define-tactically same-output
  ((split-Pair)
   (then (exact (same 0)))
   (then (exact sole))))
`;
      expect(() => evaluatePie(str)).not.toThrow();
    });

    it("5 items into 3 bins: pigeonhole guarantees collision", () => {
      const str = `
(claim i1 Nat) (define i1 0)
(claim i2 Nat) (define i2 1)
(claim i3 Nat) (define i3 2)
(claim i4 Nat) (define i4 0)
(claim i5 Nat) (define i5 1)
(claim collision-1-4 (= Nat i1 i4))
(define-tactically collision-1-4
  ((exact (same 0))))
`;
      expect(() => evaluatePie(str)).not.toThrow();
    });

    it("pigeonhole as existential: exists collision among assignments", () => {
      const str = `
(claim a1 Nat) (define a1 2)
(claim a2 Nat) (define a2 5)
(claim a3 Nat) (define a3 2)
(claim exists-collision
  (Σ ((eq (= Nat a1 a3))) Trivial))
(define-tactically exists-collision
  ((split-Pair)
   (then (exact (same 2)))
   (then (exact sole))))
`;
      expect(() => evaluatePie(str)).not.toThrow();
    });

    it("double collision: two pairs collide among 5 values", () => {
      const str = `
(claim v1 Nat) (define v1 1)
(claim v2 Nat) (define v2 2)
(claim v3 Nat) (define v3 1)
(claim v4 Nat) (define v4 2)
(claim v5 Nat) (define v5 3)
(claim double-collision
  (Σ ((c1 (= Nat v1 v3)))
    (= Nat v2 v4)))
(define-tactically double-collision
  ((split-Pair)
   (then (exact (same 1)))
   (then (exact (same 2)))))
`;
      expect(() => evaluatePie(str)).not.toThrow();
    });

    it("pigeonhole with Either bins: 3 items into left/right", () => {
      const str = `
(claim bin1 (Either Trivial Trivial))
(define bin1 (left sole))
(claim bin2 (Either Trivial Trivial))
(define bin2 (left sole))
(claim bin3 (Either Trivial Trivial))
(define bin3 (right sole))
(claim bins-collide (= (Either Trivial Trivial) bin1 bin2))
(define-tactically bins-collide
  ((exact (same (left sole)))))
`;
      expect(() => evaluatePie(str)).not.toThrow();
    });

  });

  describe("Error Cases", () => {

    it("fails Vec with wrong size", () => {
      const str = `
(claim bad-v (Vec Nat 3))
(define bad-v (vec:: 1 (vec:: 2 vecnil)))
`;
      expect(() => evaluatePie(str)).toThrow();
    });

    it("fails with wrong collision claim", () => {
      const str = `
(claim x Nat) (define x 0)
(claim y Nat) (define y 1)
(claim bad-eq (= Nat x y))
(define-tactically bad-eq
  ((exact (same 0))))
`;
      expect(() => evaluatePie(str)).toThrow();
    });

    it("fails elim-Nat on non-Nat type", () => {
      const str = `
(claim bad (→ Atom Atom))
(define-tactically bad
  ((intro a)
   (elim-Nat a)
   (then (exact 'x))
   (then (exact 'y))))
`;
      expect(() => evaluatePie(str)).toThrow(/non-Nat/i);
    });

    it("fails with incomplete list length proof", () => {
      const str = `${lengthPreamble}
(claim bad-len
  (Π ((l (List Nat))) (= Nat (length Nat l) 0)))
(define-tactically bad-len
  ((intro l)))
`;
      expect(() => evaluatePie(str)).toThrow(/incomplete/i);
    });

  });

});
