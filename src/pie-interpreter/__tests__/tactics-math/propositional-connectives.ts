import 'jest';
import { evaluatePie } from '../../main';

describe("Propositional Connectives", () => {

  describe("Conjunction (Pair/Σ)", () => {

    it("constructs a simple Nat pair using split-Pair", () => {
      const str = `
(claim nat-pair (Σ ((a Nat)) Nat))
(define-tactically nat-pair
  ((split-Pair)
   (then (exact 3))
   (then (exact 7))))
(car nat-pair)
(cdr nat-pair)
`;
      const output = evaluatePie(str);
      expect(output).toContain("3: Nat");
      expect(output).toContain("7: Nat");
    });

    it("constructs a pair of Trivial values", () => {
      const str = `
(claim triv-pair (Σ ((x Trivial)) Trivial))
(define-tactically triv-pair
  ((split-Pair)
   (then (exact sole))
   (then (exact sole))))
`;
      expect(() => evaluatePie(str)).not.toThrow();
    });

    it("constructs pair with Nat and Atom", () => {
      const str = `
(claim nat-atom-pair (Σ ((n Nat)) Atom))
(define-tactically nat-atom-pair
  ((split-Pair)
   (then (exact 42))
   (then (exact 'hello))))
(car nat-atom-pair)
(cdr nat-atom-pair)
`;
      const output = evaluatePie(str);
      expect(output).toContain("42: Nat");
      expect(output).toContain("'hello: Atom");
    });

    it("constructs pair with zero and same", () => {
      const str = `
(claim zero-refl (Σ ((n Nat)) (= Nat n n)))
(define-tactically zero-refl
  ((exists 0 n)
   (exact (same 0))))
(car zero-refl)
`;
      const output = evaluatePie(str);
      expect(output).toContain("0: Nat");
    });

    it("extracts first component of a pair using car", () => {
      const str = `
(claim my-pair (Σ ((x Nat)) Nat))
(define-tactically my-pair
  ((split-Pair)
   (then (exact 10))
   (then (exact 20))))
(claim first Nat)
(define first (car my-pair))
first
`;
      const output = evaluatePie(str);
      expect(output).toContain("10: Nat");
    });

    it("extracts second component of a pair using cdr", () => {
      const str = `
(claim my-pair (Σ ((x Nat)) Nat))
(define-tactically my-pair
  ((split-Pair)
   (then (exact 5))
   (then (exact 15))))
(claim second Nat)
(define second (cdr my-pair))
second
`;
      const output = evaluatePie(str);
      expect(output).toContain("15: Nat");
    });

    it("constructs pair with Atom and Nat", () => {
      const str = `
(claim atom-nat-pair (Σ ((a Atom)) Nat))
(define-tactically atom-nat-pair
  ((split-Pair)
   (then (exact 'world))
   (then (exact 99))))
`;
      expect(() => evaluatePie(str)).not.toThrow();
    });

    it("constructs pair with two Atom values", () => {
      const str = `
(claim atom-pair (Σ ((a Atom)) Atom))
(define-tactically atom-pair
  ((split-Pair)
   (then (exact 'left))
   (then (exact 'right))))
`;
      expect(() => evaluatePie(str)).not.toThrow();
    });

    it("constructs pair using exists tactic for dependent pair", () => {
      const str = `
(claim dep-pair (Σ ((n Nat)) (= Nat n 5)))
(define-tactically dep-pair
  ((exists 5 witness)
   (exact (same 5))))
(car dep-pair)
`;
      const output = evaluatePie(str);
      expect(output).toContain("5: Nat");
    });

    it("conjunction introduction for Nat pair with add1", () => {
      const str = `
(claim conj (Σ ((x Nat)) Nat))
(define-tactically conj
  ((split-Pair)
   (then (exact (add1 (add1 zero))))
   (then (exact (add1 zero)))))
(car conj)
(cdr conj)
`;
      const output = evaluatePie(str);
      expect(output).toContain("2: Nat");
      expect(output).toContain("1: Nat");
    });

    it("nested pair construction", () => {
      const str = `
(claim nested (Σ ((x Nat)) (Σ ((y Nat)) Nat)))
(define-tactically nested
  ((split-Pair)
   (then (exact 1))
   (then
     (split-Pair)
     (then (exact 2))
     (then (exact 3)))))
(car nested)
(car (cdr nested))
(cdr (cdr nested))
`;
      const output = evaluatePie(str);
      expect(output).toContain("1: Nat");
      expect(output).toContain("2: Nat");
      expect(output).toContain("3: Nat");
    });

    it("pair with equality proof", () => {
      const str = `
(claim eq-pair (Σ ((x Nat)) (= Nat x x)))
(define-tactically eq-pair
  ((exists 7 x)
   (exact (same 7))))
`;
      expect(() => evaluatePie(str)).not.toThrow();
    });

  });

  describe("Disjunction (Either)", () => {

    it("left injection into Either Nat Atom", () => {
      const str = `
(claim left-val (Either Nat Atom))
(define-tactically left-val
  ((go-Left)
   (exact 42)))
`;
      expect(() => evaluatePie(str)).not.toThrow();
    });

    it("right injection into Either Nat Atom", () => {
      const str = `
(claim right-val (Either Nat Atom))
(define-tactically right-val
  ((go-Right)
   (exact 'hello)))
`;
      expect(() => evaluatePie(str)).not.toThrow();
    });

    it("left injection into Either Atom Nat", () => {
      const str = `
(claim left-atom (Either Atom Nat))
(define-tactically left-atom
  ((go-Left)
   (exact 'yes)))
`;
      expect(() => evaluatePie(str)).not.toThrow();
    });

    it("right injection into Either Atom Nat", () => {
      const str = `
(claim right-nat (Either Atom Nat))
(define-tactically right-nat
  ((go-Right)
   (exact 100)))
`;
      expect(() => evaluatePie(str)).not.toThrow();
    });

    it("left injection with zero", () => {
      const str = `
(claim left-zero (Either Nat Trivial))
(define-tactically left-zero
  ((go-Left)
   (exact 0)))
`;
      expect(() => evaluatePie(str)).not.toThrow();
    });

    it("right injection with sole", () => {
      const str = `
(claim right-sole (Either Nat Trivial))
(define-tactically right-sole
  ((go-Right)
   (exact sole)))
`;
      expect(() => evaluatePie(str)).not.toThrow();
    });

    it("eliminates Either Nat Atom to Nat", () => {
      const str = `
(claim either-to-nat
  (Π ((e (Either Nat Atom)))
    Nat))
(define-tactically either-to-nat
  ((intro e)
   (elim-Either e)
   (then
     (intro n)
     (exact n))
   (then
     (intro a)
     (exact 0))))
(either-to-nat (left 5))
(either-to-nat (right 'x))
`;
      const output = evaluatePie(str);
      expect(output).toContain("5: Nat");
      expect(output).toContain("0: Nat");
    });

    it("eliminates Either Nat Nat to Nat by adding offset", () => {
      const str = `
(claim + (→ Nat Nat Nat))
(define + (λ (n j) (iter-Nat n j (λ (x) (add1 x)))))

(claim either-nat-nat
  (Π ((e (Either Nat Nat)))
    Nat))
(define-tactically either-nat-nat
  ((intro e)
   (elim-Either e)
   (then
     (intro n)
     (exact n))
   (then
     (intro m)
     (exact (+ 10 m)))))
(either-nat-nat (left 3))
(either-nat-nat (right 3))
`;
      const output = evaluatePie(str);
      expect(output).toContain("3: Nat");
      expect(output).toContain("13: Nat");
    });

    it("eliminates Either to produce Atom", () => {
      const str = `
(claim either-to-atom
  (Π ((e (Either Nat Atom)))
    Atom))
(define-tactically either-to-atom
  ((intro e)
   (elim-Either e)
   (then
     (intro n)
     (exact 'number))
   (then
     (intro a)
     (exact a))))
(either-to-atom (left 5))
(either-to-atom (right 'hi))
`;
      const output = evaluatePie(str);
      expect(output).toContain("'number: Atom");
      expect(output).toContain("'hi: Atom");
    });

    it("left injection into nested Either", () => {
      const str = `
(claim nested-left (Either Nat (Either Atom Trivial)))
(define-tactically nested-left
  ((go-Left)
   (exact 42)))
`;
      expect(() => evaluatePie(str)).not.toThrow();
    });

    it("right-left injection into nested Either", () => {
      const str = `
(claim nested-right-left (Either Nat (Either Atom Trivial)))
(define-tactically nested-right-left
  ((go-Right)
   (go-Left)
   (exact 'nested)))
`;
      expect(() => evaluatePie(str)).not.toThrow();
    });

    it("right-right injection into nested Either", () => {
      const str = `
(claim nested-right-right (Either Nat (Either Atom Trivial)))
(define-tactically nested-right-right
  ((go-Right)
   (go-Right)
   (exact sole)))
`;
      expect(() => evaluatePie(str)).not.toThrow();
    });

  });

  describe("Implication (→/Π)", () => {

    it("proves identity: A → A for Nat", () => {
      const str = `
(claim nat-id (→ Nat Nat))
(define-tactically nat-id
  ((intro n)
   (exact n)))
(nat-id 5)
`;
      const output = evaluatePie(str);
      expect(output).toContain("5: Nat");
    });

    it("proves identity: A → A for Atom", () => {
      const str = `
(claim atom-id (→ Atom Atom))
(define-tactically atom-id
  ((intro a)
   (exact a)))
(atom-id 'test)
`;
      const output = evaluatePie(str);
      expect(output).toContain("'test: Atom");
    });

    it("proves constant function: A → B → A", () => {
      const str = `
(claim const-fn (→ Nat Atom Nat))
(define-tactically const-fn
  ((intro n)
   (intro a)
   (exact n)))
(const-fn 7 'ignored)
`;
      const output = evaluatePie(str);
      expect(output).toContain("7: Nat");
    });

    it("proves modus ponens: given A and A→B, produce B", () => {
      const str = `
(claim f (→ Nat Atom))
(define f (λ (n) 'result))

(claim mp (→ Nat Atom))
(define-tactically mp
  ((intro n)
   (apply f)
   (exact n)))
(mp 5)
`;
      const output = evaluatePie(str);
      expect(output).toContain("'result: Atom");
    });

    it("proves function composition: (B→C) → (A→B) → A → C", () => {
      const str = `
(claim compose
  (→ (→ Nat Atom) (→ Atom Nat) Nat Nat))
(define-tactically compose
  ((intro g)
   (intro f)
   (intro x)
   (apply f)
   (apply g)
   (exact x)))
`;
      expect(() => evaluatePie(str)).not.toThrow();
    });

    it("proves polymorphic identity with Π", () => {
      const str = `
(claim poly-id
  (Π ((A U) (x A))
    A))
(define-tactically poly-id
  ((intro A)
   (intro x)
   (exact x)))
(poly-id Nat 10)
(poly-id Atom 'hi)
`;
      const output = evaluatePie(str);
      expect(output).toContain("10: Nat");
      expect(output).toContain("'hi: Atom");
    });

    it("proves flip: A → B → C given B → A → C", () => {
      const str = `
(claim flip
  (→ (→ Nat Atom Trivial) Atom Nat Trivial))
(define-tactically flip
  ((intro f)
   (intro b)
   (intro a)
   (exact (f a b))))
`;
      expect(() => evaluatePie(str)).not.toThrow();
    });

    it("proves implication chain: A→B, B→C gives A→C", () => {
      const str = `
(claim chain
  (→ (→ Nat Atom) (→ Atom Trivial) Nat Trivial))
(define-tactically chain
  ((intro f)
   (intro g)
   (intro n)
   (exact (g (f n)))))
(chain (λ (n) 'x) (λ (a) sole) 5)
`;
      const output = evaluatePie(str);
      expect(output).toContain("sole");
    });

    it("proves weakening: A → B → B", () => {
      const str = `
(claim weaken (→ Nat Atom Atom))
(define-tactically weaken
  ((intro n)
   (intro a)
   (exact a)))
(weaken 5 'kept)
`;
      const output = evaluatePie(str);
      expect(output).toContain("'kept: Atom");
    });

    it("proves apply function: (A→B) → A → B", () => {
      const str = `
(claim app
  (Π ((A U) (B U))
    (→ (→ A B) A B)))
(define-tactically app
  ((intro A)
   (intro B)
   (intro f)
   (intro x)
   (exact (f x))))
(app Nat Nat (λ (n) (add1 n)) 5)
`;
      const output = evaluatePie(str);
      expect(output).toContain("6: Nat");
    });

    it("proves double application", () => {
      const str = `
(claim double-app
  (→ (→ Nat Nat) Nat Nat))
(define-tactically double-app
  ((intro f)
   (intro x)
   (exact (f (f x)))))
(double-app (λ (n) (add1 n)) 0)
`;
      const output = evaluatePie(str);
      expect(output).toContain("2: Nat");
    });

    it("proves S combinator: (A→B→C) → (A→B) → A → C", () => {
      const str = `
(claim s-comb
  (→ (→ Nat Nat Nat) (→ Nat Nat) Nat Nat))
(define-tactically s-comb
  ((intro f)
   (intro g)
   (intro x)
   (exact (f x (g x)))))
`;
      expect(() => evaluatePie(str)).not.toThrow();
    });

  });

  describe("Distributive and Algebraic Laws", () => {

    it("commutativity of conjunction: swap pair components", () => {
      const str = `
(claim swap-pair
  (→ (Σ ((x Nat)) Atom)
     (Σ ((a Atom)) Nat)))
(define-tactically swap-pair
  ((intro p)
   (split-Pair)
   (then (exact (cdr p)))
   (then (exact (car p)))))
`;
      expect(() => evaluatePie(str)).not.toThrow();
    });

    it("commutativity of disjunction: swap Either", () => {
      const str = `
(claim swap-either
  (Π ((e (Either Nat Atom)))
    (Either Atom Nat)))
(define-tactically swap-either
  ((intro e)
   (elim-Either e)
   (then
     (intro n)
     (go-Right)
     (exact n))
   (then
     (intro a)
     (go-Left)
     (exact a))))
(swap-either (left 5))
(swap-either (right 'hi))
`;
      const output = evaluatePie(str);
      expect(output).toContain("(right 5)");
      expect(output).toContain("(left 'hi)");
    });

    it("projection from conjunction: first component", () => {
      const str = `
(claim proj1
  (→ (Σ ((x Nat)) Atom) Nat))
(define-tactically proj1
  ((intro p)
   (exact (car p))))
(proj1 (cons 5 'a))
`;
      const output = evaluatePie(str);
      expect(output).toContain("5: Nat");
    });

    it("projection from conjunction: second component", () => {
      const str = `
(claim proj2
  (→ (Σ ((x Nat)) Atom) Atom))
(define-tactically proj2
  ((intro p)
   (exact (cdr p))))
(proj2 (cons 5 'a))
`;
      const output = evaluatePie(str);
      expect(output).toContain("'a: Atom");
    });

    it("Either left factor: A → (Either A B)", () => {
      const str = `
(claim inject-left
  (Π ((A U) (B U))
    (→ A (Either A B))))
(define-tactically inject-left
  ((intro A)
   (intro B)
   (intro a)
   (go-Left)
   (exact a)))
`;
      expect(() => evaluatePie(str)).not.toThrow();
    });

    it("Either right factor: B → (Either A B)", () => {
      const str = `
(claim inject-right
  (Π ((A U) (B U))
    (→ B (Either A B))))
(define-tactically inject-right
  ((intro A)
   (intro B)
   (intro b)
   (go-Right)
   (exact b)))
`;
      expect(() => evaluatePie(str)).not.toThrow();
    });

    it("pair construction from two values", () => {
      const str = `
(claim make-pair
  (→ Nat Atom (Σ ((x Nat)) Atom)))
(define-tactically make-pair
  ((intro n)
   (intro a)
   (split-Pair)
   (then (exact n))
   (then (exact a))))
(car (make-pair 10 'ten))
(cdr (make-pair 10 'ten))
`;
      const output = evaluatePie(str);
      expect(output).toContain("10: Nat");
      expect(output).toContain("'ten: Atom");
    });

    it("distributive: pair with Either first component", () => {
      const str = `
(claim dist
  (→ (Σ ((e (Either Nat Atom))) Trivial)
     (Either (Σ ((n Nat)) Trivial) (Σ ((a Atom)) Trivial))))
(define dist
  (λ (p)
    (ind-Either (car p)
      (λ (x) (Either (Σ ((n Nat)) Trivial) (Σ ((a Atom)) Trivial)))
      (λ (n) (left (cons n (cdr p))))
      (λ (a) (right (cons a (cdr p)))))))
`;
      expect(() => evaluatePie(str)).not.toThrow();
    });

    it("currying: (Σ ((a Nat)) Atom) → C as Nat → Atom → C", () => {
      const str = `
(claim curry-pair
  (→ (→ (Σ ((a Nat)) Atom) Trivial)
     Nat Atom Trivial))
(define-tactically curry-pair
  ((intro f)
   (intro n)
   (intro a)
   (exact (f (cons n a)))))
`;
      expect(() => evaluatePie(str)).not.toThrow();
    });

    it("uncurrying: Nat → Atom → C as (Σ ((a Nat)) Atom) → C", () => {
      const str = `
(claim uncurry-pair
  (→ (→ Nat Atom Trivial)
     (Σ ((a Nat)) Atom) Trivial))
(define-tactically uncurry-pair
  ((intro f)
   (intro p)
   (exact (f (car p) (cdr p)))))
`;
      expect(() => evaluatePie(str)).not.toThrow();
    });

  });

  describe("Error Cases", () => {

    it("go-Left on non-Either type should fail", () => {
      const str = `
(claim bad-left Nat)
(define-tactically bad-left
  ((go-Left)
   (exact 5)))
`;
      expect(() => evaluatePie(str)).toThrow();
    });

    it("split-Pair on non-Σ type should fail", () => {
      const str = `
(claim bad-split Nat)
(define-tactically bad-split
  ((split-Pair)
   (then (exact 1))
   (then (exact 2))))
`;
      expect(() => evaluatePie(str)).toThrow();
    });

    it("go-Right on non-Either type should fail", () => {
      const str = `
(claim bad-right Atom)
(define-tactically bad-right
  ((go-Right)
   (exact 'x)))
`;
      expect(() => evaluatePie(str)).toThrow();
    });

    it("missing then block after elim-Either should fail", () => {
      const str = `
(claim bad-elim-either
  (Π ((e (Either Nat Atom)))
    Nat))
(define-tactically bad-elim-either
  ((intro e)
   (elim-Either e)
   (exact 5)
   (exact 0)))
`;
      expect(() => evaluatePie(str)).toThrow("Expected 'then' block to handle subgoal branch");
    });

  });

});
