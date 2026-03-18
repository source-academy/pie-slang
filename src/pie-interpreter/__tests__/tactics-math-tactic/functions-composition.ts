import 'jest';
import { evaluatePie } from '../../main';

describe("Functions and Composition", () => {

  describe("Identity and Constant", () => {

    it("defines polymorphic identity: (Π ((A U) (x A)) A)", () => {
      const str = `
(claim poly-id (Π ((A U) (x A)) A))
(define-tactically poly-id
  ((intro A)
   (intro x)
   (exact x)))
(claim poly-id-result (= Nat (poly-id Nat 42) 42))
(define-tactically poly-id-result
  ((exact (same 42))))
`;
      expect(() => evaluatePie(str)).not.toThrow();
    });

    it("applies polymorphic identity to Atom", () => {
      const str = `
(claim poly-id (Π ((A U) (x A)) A))
(define-tactically poly-id
  ((intro A)
   (intro x)
   (exact x)))
(claim poly-id-atom-result (= Atom (poly-id Atom 'hello) 'hello))
(define-tactically poly-id-atom-result
  ((exact (same 'hello))))
`;
      expect(() => evaluatePie(str)).not.toThrow();
    });

    it("defines constant function: (Π ((A U) (B U) (a A) (b B)) A)", () => {
      const str = `
(claim const-fn (Π ((A U) (B U) (a A) (b B)) A))
(define-tactically const-fn
  ((intro A)
   (intro B)
   (intro a)
   (intro b)
   (exact a)))
(claim const-fn-result (= Nat (const-fn Nat Atom 5 'x) 5))
(define-tactically const-fn-result
  ((exact (same 5))))
`;
      expect(() => evaluatePie(str)).not.toThrow();
    });

    it("defines identity on Nat: (→ Nat Nat)", () => {
      const str = `
(claim nat-id (→ Nat Nat))
(define-tactically nat-id
  ((intro n)
   (exact n)))
(claim nat-id-0-result (= Nat (nat-id 0) 0))
(define-tactically nat-id-0-result
  ((exact (same 0))))
(claim nat-id-7-result (= Nat (nat-id 7) 7))
(define-tactically nat-id-7-result
  ((exact (same 7))))
`;
      expect(() => evaluatePie(str)).not.toThrow();
    });

    it("defines constant Nat function ignoring Atom argument", () => {
      const str = `
(claim const-nat (→ Nat Atom Nat))
(define-tactically const-nat
  ((intro n)
   (intro a)
   (exact n)))
(claim const-nat-result (= Nat (const-nat 10 'ignored) 10))
(define-tactically const-nat-result
  ((exact (same 10))))
`;
      expect(() => evaluatePie(str)).not.toThrow();
    });

    it("identity on Trivial", () => {
      const str = `
(claim triv-id (→ Trivial Trivial))
(define-tactically triv-id
  ((intro t)
   (exact t)))
(claim triv-id-result (= Trivial (triv-id sole) sole))
(define-tactically triv-id-result
  ((exact (same sole))))
`;
      expect(() => evaluatePie(str)).not.toThrow();
    });

    it("identity applied to zero returns zero", () => {
      const str = `
(claim id-nat (→ Nat Nat))
(define-tactically id-nat
  ((intro n)
   (exact n)))
(claim id-nat-0-result (= Nat (id-nat 0) 0))
(define-tactically id-nat-0-result
  ((exact (same 0))))
`;
      expect(() => evaluatePie(str)).not.toThrow();
    });

    it("identity applied to add1 preserves value", () => {
      const str = `
(claim id-nat (→ Nat Nat))
(define-tactically id-nat
  ((intro n)
   (exact n)))
(claim id-nat-3-result (= Nat (id-nat (add1 (add1 (add1 zero)))) 3))
(define-tactically id-nat-3-result
  ((exact (same 3))))
`;
      expect(() => evaluatePie(str)).not.toThrow();
    });

    it("const returns first of two Nat arguments", () => {
      const str = `
(claim const2 (→ Nat Nat Nat))
(define-tactically const2
  ((intro a)
   (intro b)
   (exact a)))
(claim const2-result (= Nat (const2 99 1) 99))
(define-tactically const2-result
  ((exact (same 99))))
`;
      expect(() => evaluatePie(str)).not.toThrow();
    });

    it("const returns Atom ignoring Nat", () => {
      const str = `
(claim const-atom (→ Atom Nat Atom))
(define-tactically const-atom
  ((intro a)
   (intro n)
   (exact a)))
(claim const-atom-result (= Atom (const-atom 'yes 100) 'yes))
(define-tactically const-atom-result
  ((exact (same 'yes))))
`;
      expect(() => evaluatePie(str)).not.toThrow();
    });

    it("polymorphic identity on Trivial", () => {
      const str = `
(claim poly-id (Π ((A U) (x A)) A))
(define-tactically poly-id
  ((intro A)
   (intro x)
   (exact x)))
(claim poly-id-triv-result (= Trivial (poly-id Trivial sole) sole))
(define-tactically poly-id-triv-result
  ((exact (same sole))))
`;
      expect(() => evaluatePie(str)).not.toThrow();
    });

    it("second-projector function: returns second argument", () => {
      const str = `
(claim snd-fn (Π ((A U) (B U) (a A) (b B)) B))
(define-tactically snd-fn
  ((intro A)
   (intro B)
   (intro a)
   (intro b)
   (exact b)))
(claim snd-fn-result (= Atom (snd-fn Nat Atom 5 'hello) 'hello))
(define-tactically snd-fn-result
  ((exact (same 'hello))))
`;
      expect(() => evaluatePie(str)).not.toThrow();
    });

  });

  describe("Composition", () => {

    it("defines compose: (Π ((A U) (B U) (C U)) (→ (→ B C) (→ A B) (→ A C)))", () => {
      const str = `
(claim compose (Π ((A U) (B U) (C U)) (→ (→ B C) (→ A B) (→ A C))))
(define-tactically compose
  ((intro A)
   (intro B)
   (intro C)
   (intro g)
   (intro f)
   (intro x)
   (exact (g (f x)))))
`;
      expect(() => evaluatePie(str)).not.toThrow();
    });

    it("compose add1 add1 applied to 3 gives 5", () => {
      const str = `
(claim compose (Π ((A U) (B U) (C U)) (→ (→ B C) (→ A B) (→ A C))))
(define-tactically compose
  ((intro A)
   (intro B)
   (intro C)
   (intro g)
   (intro f)
   (intro x)
   (exact (g (f x)))))
(claim add1-fn (→ Nat Nat))
(define add1-fn (λ (n) (add1 n)))
(claim double-succ (→ Nat Nat))
(define double-succ (compose Nat Nat Nat add1-fn add1-fn))
(claim double-succ-result (= Nat (double-succ 3) 5))
(define-tactically double-succ-result
  ((exact (same 5))))
`;
      expect(() => evaluatePie(str)).not.toThrow();
    });

    it("compose add1 add1 applied to 0 gives 2", () => {
      const str = `
(claim compose (Π ((A U) (B U) (C U)) (→ (→ B C) (→ A B) (→ A C))))
(define-tactically compose
  ((intro A)
   (intro B)
   (intro C)
   (intro g)
   (intro f)
   (intro x)
   (exact (g (f x)))))
(claim add1-fn (→ Nat Nat))
(define add1-fn (λ (n) (add1 n)))
(claim compose-add1-0-result (= Nat ((compose Nat Nat Nat add1-fn add1-fn) 0) 2))
(define-tactically compose-add1-0-result
  ((exact (same 2))))
`;
      expect(() => evaluatePie(str)).not.toThrow();
    });

    it("compose with identity on left: compose id f = f (concrete)", () => {
      const str = `
(claim compose (Π ((A U) (B U) (C U)) (→ (→ B C) (→ A B) (→ A C))))
(define-tactically compose
  ((intro A)
   (intro B)
   (intro C)
   (intro g)
   (intro f)
   (intro x)
   (exact (g (f x)))))
(claim id-nat (→ Nat Nat))
(define id-nat (λ (n) n))
(claim add1-fn (→ Nat Nat))
(define add1-fn (λ (n) (add1 n)))
(claim compose-id-left-result (= Nat ((compose Nat Nat Nat id-nat add1-fn) 4) 5))
(define-tactically compose-id-left-result
  ((exact (same 5))))
`;
      expect(() => evaluatePie(str)).not.toThrow();
    });

    it("compose with identity on right: compose f id = f (concrete)", () => {
      const str = `
(claim compose (Π ((A U) (B U) (C U)) (→ (→ B C) (→ A B) (→ A C))))
(define-tactically compose
  ((intro A)
   (intro B)
   (intro C)
   (intro g)
   (intro f)
   (intro x)
   (exact (g (f x)))))
(claim id-nat (→ Nat Nat))
(define id-nat (λ (n) n))
(claim add1-fn (→ Nat Nat))
(define add1-fn (λ (n) (add1 n)))
(claim compose-id-right-result (= Nat ((compose Nat Nat Nat add1-fn id-nat) 4) 5))
(define-tactically compose-id-right-result
  ((exact (same 5))))
`;
      expect(() => evaluatePie(str)).not.toThrow();
    });

    it("triple compose: add1 three times to 0 gives 3", () => {
      const str = `
(claim compose (Π ((A U) (B U) (C U)) (→ (→ B C) (→ A B) (→ A C))))
(define-tactically compose
  ((intro A)
   (intro B)
   (intro C)
   (intro g)
   (intro f)
   (intro x)
   (exact (g (f x)))))
(claim add1-fn (→ Nat Nat))
(define add1-fn (λ (n) (add1 n)))
(claim add2 (→ Nat Nat))
(define add2 (compose Nat Nat Nat add1-fn add1-fn))
(claim add3 (→ Nat Nat))
(define add3 (compose Nat Nat Nat add1-fn add2))
(claim add3-result (= Nat (add3 0) 3))
(define-tactically add3-result
  ((exact (same 3))))
`;
      expect(() => evaluatePie(str)).not.toThrow();
    });

    it("compose Nat functions: add1 then double (iter-based)", () => {
      const str = `
(claim + (→ Nat Nat Nat))
(define + (λ (n j) (iter-Nat n j (λ (x) (add1 x)))))
(claim compose (Π ((A U) (B U) (C U)) (→ (→ B C) (→ A B) (→ A C))))
(define-tactically compose
  ((intro A)
   (intro B)
   (intro C)
   (intro g)
   (intro f)
   (intro x)
   (exact (g (f x)))))
(claim add1-fn (→ Nat Nat))
(define add1-fn (λ (n) (add1 n)))
(claim double (→ Nat Nat))
(define double (λ (n) (+ n n)))
(claim compose-double-add1-result (= Nat ((compose Nat Nat Nat double add1-fn) 3) 8))
(define-tactically compose-double-add1-result
  ((exact (same 8))))
`;
      expect(() => evaluatePie(str)).not.toThrow();
    });

    it("monomorphic compose for Nat", () => {
      const str = `
(claim nat-compose (→ (→ Nat Nat) (→ Nat Nat) (→ Nat Nat)))
(define-tactically nat-compose
  ((intro g)
   (intro f)
   (intro x)
   (exact (g (f x)))))
(claim add1-fn (→ Nat Nat))
(define add1-fn (λ (n) (add1 n)))
(claim nat-compose-result (= Nat ((nat-compose add1-fn add1-fn) 10) 12))
(define-tactically nat-compose-result
  ((exact (same 12))))
`;
      expect(() => evaluatePie(str)).not.toThrow();
    });

    it("compose across different types: Nat → Nat → Atom", () => {
      const str = `
(claim compose (Π ((A U) (B U) (C U)) (→ (→ B C) (→ A B) (→ A C))))
(define-tactically compose
  ((intro A)
   (intro B)
   (intro C)
   (intro g)
   (intro f)
   (intro x)
   (exact (g (f x)))))
(claim to-triv (→ Nat Trivial))
(define to-triv (λ (n) sole))
(claim add1-fn (→ Nat Nat))
(define add1-fn (λ (n) (add1 n)))
(claim compose-cross-result (= Trivial ((compose Nat Nat Trivial to-triv add1-fn) 5) sole))
(define-tactically compose-cross-result
  ((exact (same sole))))
`;
      expect(() => evaluatePie(str)).not.toThrow();
    });

    it("compose preserves id on both sides for same input", () => {
      const str = `
(claim compose (Π ((A U) (B U) (C U)) (→ (→ B C) (→ A B) (→ A C))))
(define-tactically compose
  ((intro A)
   (intro B)
   (intro C)
   (intro g)
   (intro f)
   (intro x)
   (exact (g (f x)))))
(claim id-nat (→ Nat Nat))
(define id-nat (λ (n) n))
(claim compose-id-id-result (= Nat ((compose Nat Nat Nat id-nat id-nat) 42) 42))
(define-tactically compose-id-id-result
  ((exact (same 42))))
`;
      expect(() => evaluatePie(str)).not.toThrow();
    });

    it("associativity of composition at concrete value", () => {
      const str = `
(claim compose (Π ((A U) (B U) (C U)) (→ (→ B C) (→ A B) (→ A C))))
(define-tactically compose
  ((intro A)
   (intro B)
   (intro C)
   (intro g)
   (intro f)
   (intro x)
   (exact (g (f x)))))
(claim f1 (→ Nat Nat))
(define f1 (λ (n) (add1 n)))
(claim f2 (→ Nat Nat))
(define f2 (λ (n) (add1 n)))
(claim f3 (→ Nat Nat))
(define f3 (λ (n) (add1 n)))
(claim lhs (→ Nat Nat))
(define lhs (compose Nat Nat Nat (compose Nat Nat Nat f1 f2) f3))
(claim rhs (→ Nat Nat))
(define rhs (compose Nat Nat Nat f1 (compose Nat Nat Nat f2 f3)))
(claim assoc-lhs-result (= Nat (lhs 0) 3))
(define-tactically assoc-lhs-result
  ((exact (same 3))))
(claim assoc-rhs-result (= Nat (rhs 0) 3))
(define-tactically assoc-rhs-result
  ((exact (same 3))))
`;
      expect(() => evaluatePie(str)).not.toThrow();
    });

  });

  describe("Combinators", () => {

    it("defines application/eval: (Π ((A U) (B U)) (→ (→ A B) A B))", () => {
      const str = `
(claim app (Π ((A U) (B U)) (→ (→ A B) A B)))
(define-tactically app
  ((intro A)
   (intro B)
   (intro f)
   (intro x)
   (exact (f x))))
(claim app-result (= Nat (app Nat Nat (λ (n) (add1 n)) 5) 6))
(define-tactically app-result
  ((exact (same 6))))
`;
      expect(() => evaluatePie(str)).not.toThrow();
    });

    it("defines flip: (Π ((A U) (B U) (C U)) (→ (→ A B C) (→ B A C)))", () => {
      const str = `
(claim flip (Π ((A U) (B U) (C U)) (→ (→ A B C) (→ B A C))))
(define-tactically flip
  ((intro A)
   (intro B)
   (intro C)
   (intro f)
   (intro b)
   (intro a)
   (exact (f a b))))
`;
      expect(() => evaluatePie(str)).not.toThrow();
    });

    it("flip with concrete subtraction-like function", () => {
      const str = `
(claim flip (Π ((A U) (B U) (C U)) (→ (→ A B C) (→ B A C))))
(define-tactically flip
  ((intro A)
   (intro B)
   (intro C)
   (intro f)
   (intro b)
   (intro a)
   (exact (f a b))))
(claim pick-first (→ Nat Atom Nat))
(define pick-first (λ (n a) n))
(claim flip-result (= Nat ((flip Nat Atom Nat pick-first) 'hello 42) 42))
(define-tactically flip-result
  ((exact (same 42))))
`;
      expect(() => evaluatePie(str)).not.toThrow();
    });

    it("defines twice/double-apply: (Π ((A U)) (→ (→ A A) A A))", () => {
      const str = `
(claim twice (Π ((A U)) (→ (→ A A) A A)))
(define-tactically twice
  ((intro A)
   (intro f)
   (intro x)
   (exact (f (f x)))))
(claim twice-result (= Nat (twice Nat (λ (n) (add1 n)) 0) 2))
(define-tactically twice-result
  ((exact (same 2))))
`;
      expect(() => evaluatePie(str)).not.toThrow();
    });

    it("twice applied to add1 on 5 gives 7", () => {
      const str = `
(claim twice (Π ((A U)) (→ (→ A A) A A)))
(define-tactically twice
  ((intro A)
   (intro f)
   (intro x)
   (exact (f (f x)))))
(claim twice-5-result (= Nat (twice Nat (λ (n) (add1 n)) 5) 7))
(define-tactically twice-5-result
  ((exact (same 7))))
`;
      expect(() => evaluatePie(str)).not.toThrow();
    });

    it("S combinator: (Π ((A U) (B U) (C U)) (→ (→ A B C) (→ A B) A C))", () => {
      const str = `
(claim S-comb (Π ((A U) (B U) (C U)) (→ (→ A B C) (→ A B) A C)))
(define-tactically S-comb
  ((intro A)
   (intro B)
   (intro C)
   (intro f)
   (intro g)
   (intro x)
   (exact (f x (g x)))))
`;
      expect(() => evaluatePie(str)).not.toThrow();
    });

    it("K combinator is const", () => {
      const str = `
(claim K-comb (Π ((A U) (B U)) (→ A B A)))
(define-tactically K-comb
  ((intro A)
   (intro B)
   (intro a)
   (intro b)
   (exact a)))
(claim K-comb-result (= Nat (K-comb Nat Atom 7 'x) 7))
(define-tactically K-comb-result
  ((exact (same 7))))
`;
      expect(() => evaluatePie(str)).not.toThrow();
    });

    it("I combinator is identity", () => {
      const str = `
(claim I-comb (Π ((A U)) (→ A A)))
(define-tactically I-comb
  ((intro A)
   (intro a)
   (exact a)))
(claim I-comb-result (= Nat (I-comb Nat 99) 99))
(define-tactically I-comb-result
  ((exact (same 99))))
`;
      expect(() => evaluatePie(str)).not.toThrow();
    });

    it("thrice: apply function 3 times", () => {
      const str = `
(claim thrice (Π ((A U)) (→ (→ A A) A A)))
(define-tactically thrice
  ((intro A)
   (intro f)
   (intro x)
   (exact (f (f (f x))))))
(claim thrice-result (= Nat (thrice Nat (λ (n) (add1 n)) 0) 3))
(define-tactically thrice-result
  ((exact (same 3))))
`;
      expect(() => evaluatePie(str)).not.toThrow();
    });

    it("on combinator: apply unary function then binary", () => {
      const str = `
(claim + (→ Nat Nat Nat))
(define + (λ (n j) (iter-Nat n j (λ (x) (add1 x)))))
(claim on (Π ((A U) (B U) (C U)) (→ (→ B B C) (→ A B) A A C)))
(define-tactically on
  ((intro A)
   (intro B)
   (intro C)
   (intro combine)
   (intro f)
   (intro x)
   (intro y)
   (exact (combine (f x) (f y)))))
(claim on-result (= Nat (on Nat Nat Nat + (λ (n) (add1 n)) 2 3) 7))
(define-tactically on-result
  ((exact (same 7))))
`;
      expect(() => evaluatePie(str)).not.toThrow();
    });

    it("pipe: apply two functions in sequence", () => {
      const str = `
(claim pipe2 (Π ((A U) (B U) (C U)) (→ (→ A B) (→ B C) A C)))
(define-tactically pipe2
  ((intro A)
   (intro B)
   (intro C)
   (intro f)
   (intro g)
   (intro x)
   (exact (g (f x)))))
(claim pipe2-result (= Nat (pipe2 Nat Nat Nat (λ (n) (add1 n)) (λ (n) (add1 n)) 0) 2))
(define-tactically pipe2-result
  ((exact (same 2))))
`;
      expect(() => evaluatePie(str)).not.toThrow();
    });

    it("B combinator (compose): (Π ((A U) (B U) (C U)) (→ (→ B C) (→ A B) A C))", () => {
      const str = `
(claim B-comb (Π ((A U) (B U) (C U)) (→ (→ B C) (→ A B) A C)))
(define-tactically B-comb
  ((intro A)
   (intro B)
   (intro C)
   (intro g)
   (intro f)
   (intro x)
   (exact (g (f x)))))
(claim B-comb-result (= Nat (B-comb Nat Nat Nat (λ (n) (add1 n)) (λ (n) (add1 n)) 3) 5))
(define-tactically B-comb-result
  ((exact (same 5))))
`;
      expect(() => evaluatePie(str)).not.toThrow();
    });

    it("W combinator (duplicate): (Π ((A U) (B U)) (→ (→ A A B) A B))", () => {
      const str = `
(claim + (→ Nat Nat Nat))
(define + (λ (n j) (iter-Nat n j (λ (x) (add1 x)))))
(claim W-comb (Π ((A U) (B U)) (→ (→ A A B) A B)))
(define-tactically W-comb
  ((intro A)
   (intro B)
   (intro f)
   (intro x)
   (exact (f x x))))
(claim W-comb-result (= Nat (W-comb Nat Nat + 3) 6))
(define-tactically W-comb-result
  ((exact (same 6))))
`;
      expect(() => evaluatePie(str)).not.toThrow();
    });

    it("apply id twice is still id", () => {
      const str = `
(claim twice (Π ((A U)) (→ (→ A A) A A)))
(define-tactically twice
  ((intro A)
   (intro f)
   (intro x)
   (exact (f (f x)))))
(claim id-nat (→ Nat Nat))
(define id-nat (λ (n) n))
(claim twice-id-result (= Nat (twice Nat id-nat 42) 42))
(define-tactically twice-id-result
  ((exact (same 42))))
`;
      expect(() => evaluatePie(str)).not.toThrow();
    });

  });

  describe("Composition Laws", () => {

    it("compose id f = f verified at value 3", () => {
      const str = `
(claim compose (Π ((A U) (B U) (C U)) (→ (→ B C) (→ A B) (→ A C))))
(define-tactically compose
  ((intro A)
   (intro B)
   (intro C)
   (intro g)
   (intro f)
   (intro x)
   (exact (g (f x)))))
(claim id-nat (→ Nat Nat))
(define id-nat (λ (n) n))
(claim f (→ Nat Nat))
(define f (λ (n) (add1 (add1 n))))
(claim compose-id-f-result (= Nat ((compose Nat Nat Nat id-nat f) 3) 5))
(define-tactically compose-id-f-result
  ((exact (same 5))))
`;
      expect(() => evaluatePie(str)).not.toThrow();
    });

    it("compose f id = f verified at value 3", () => {
      const str = `
(claim compose (Π ((A U) (B U) (C U)) (→ (→ B C) (→ A B) (→ A C))))
(define-tactically compose
  ((intro A)
   (intro B)
   (intro C)
   (intro g)
   (intro f)
   (intro x)
   (exact (g (f x)))))
(claim id-nat (→ Nat Nat))
(define id-nat (λ (n) n))
(claim f (→ Nat Nat))
(define f (λ (n) (add1 (add1 n))))
(claim compose-f-id-result (= Nat ((compose Nat Nat Nat f id-nat) 3) 5))
(define-tactically compose-f-id-result
  ((exact (same 5))))
`;
      expect(() => evaluatePie(str)).not.toThrow();
    });

    it("associativity: (h . g) . f = h . (g . f) at value 1", () => {
      const str = `
(claim compose (Π ((A U) (B U) (C U)) (→ (→ B C) (→ A B) (→ A C))))
(define-tactically compose
  ((intro A)
   (intro B)
   (intro C)
   (intro g)
   (intro f)
   (intro x)
   (exact (g (f x)))))
(claim h (→ Nat Nat))
(define h (λ (n) (add1 n)))
(claim g (→ Nat Nat))
(define g (λ (n) (add1 n)))
(claim f (→ Nat Nat))
(define f (λ (n) (add1 n)))
(claim lhs (→ Nat Nat))
(define lhs (compose Nat Nat Nat (compose Nat Nat Nat h g) f))
(claim rhs (→ Nat Nat))
(define rhs (compose Nat Nat Nat h (compose Nat Nat Nat g f)))
(claim assoc-lhs-1 (= Nat (lhs 1) 4))
(define-tactically assoc-lhs-1
  ((exact (same 4))))
(claim assoc-rhs-1 (= Nat (rhs 1) 4))
(define-tactically assoc-rhs-1
  ((exact (same 4))))
`;
      expect(() => evaluatePie(str)).not.toThrow();
    });

    it("compose id id = id at value 7", () => {
      const str = `
(claim compose (Π ((A U) (B U) (C U)) (→ (→ B C) (→ A B) (→ A C))))
(define-tactically compose
  ((intro A)
   (intro B)
   (intro C)
   (intro g)
   (intro f)
   (intro x)
   (exact (g (f x)))))
(claim id-nat (→ Nat Nat))
(define id-nat (λ (n) n))
(claim compose-id-id-7-result (= Nat ((compose Nat Nat Nat id-nat id-nat) 7) 7))
(define-tactically compose-id-id-7-result
  ((exact (same 7))))
`;
      expect(() => evaluatePie(str)).not.toThrow();
    });

    it("Church numeral 2 as iterated composition", () => {
      const str = `
(claim church-2 (Π ((A U)) (→ (→ A A) (→ A A))))
(define-tactically church-2
  ((intro A)
   (intro f)
   (intro x)
   (exact (f (f x)))))
(claim church-2-result (= Nat (church-2 Nat (λ (n) (add1 n)) 0) 2))
(define-tactically church-2-result
  ((exact (same 2))))
`;
      expect(() => evaluatePie(str)).not.toThrow();
    });

    it("Church numeral 3 as iterated composition", () => {
      const str = `
(claim church-3 (Π ((A U)) (→ (→ A A) (→ A A))))
(define-tactically church-3
  ((intro A)
   (intro f)
   (intro x)
   (exact (f (f (f x))))))
(claim church-3-result (= Nat (church-3 Nat (λ (n) (add1 n)) 0) 3))
(define-tactically church-3-result
  ((exact (same 3))))
`;
      expect(() => evaluatePie(str)).not.toThrow();
    });

    it("Church numeral 0 as identity", () => {
      const str = `
(claim church-0 (Π ((A U)) (→ (→ A A) (→ A A))))
(define-tactically church-0
  ((intro A)
   (intro f)
   (intro x)
   (exact x)))
(claim church-0-result (= Nat (church-0 Nat (λ (n) (add1 n)) 5) 5))
(define-tactically church-0-result
  ((exact (same 5))))
`;
      expect(() => evaluatePie(str)).not.toThrow();
    });

    it("Church numeral 1 applies once", () => {
      const str = `
(claim church-1 (Π ((A U)) (→ (→ A A) (→ A A))))
(define-tactically church-1
  ((intro A)
   (intro f)
   (intro x)
   (exact (f x))))
(claim church-1-result (= Nat (church-1 Nat (λ (n) (add1 n)) 10) 11))
(define-tactically church-1-result
  ((exact (same 11))))
`;
      expect(() => evaluatePie(str)).not.toThrow();
    });

    it("compose with twice: twice . add1 = add 2", () => {
      const str = `
(claim twice (Π ((A U)) (→ (→ A A) A A)))
(define-tactically twice
  ((intro A)
   (intro f)
   (intro x)
   (exact (f (f x)))))
(claim twice-add1-result (= Nat (twice Nat (λ (n) (add1 n)) 8) 10))
(define-tactically twice-add1-result
  ((exact (same 10))))
`;
      expect(() => evaluatePie(str)).not.toThrow();
    });

    it("four applications via twice-of-twice", () => {
      const str = `
(claim twice (Π ((A U)) (→ (→ A A) A A)))
(define-tactically twice
  ((intro A)
   (intro f)
   (intro x)
   (exact (f (f x)))))
(claim add1-fn (→ Nat Nat))
(define add1-fn (λ (n) (add1 n)))
(claim four-result (= Nat (twice Nat (the (→ Nat Nat) (λ (x) (twice Nat add1-fn x))) 0) 4))
(define-tactically four-result
  ((exact (same 4))))
`;
      expect(() => evaluatePie(str)).not.toThrow();
    });

  });

  describe("Error Cases", () => {

    it("fails intro on non-function type", () => {
      const str = `
(claim bad Nat)
(define-tactically bad
  ((intro x)
   (exact 0)))
`;
      expect(() => evaluatePie(str)).toThrow(/non-function/i);
    });

    it("fails with incomplete function proof", () => {
      const str = `
(claim f (→ Nat Nat))
(define-tactically f
  ((intro n)))
`;
      expect(() => evaluatePie(str)).toThrow(/incomplete/i);
    });

    it("fails with wrong return type in function body", () => {
      const str = `
(claim f (→ Nat Atom))
(define-tactically f
  ((intro n)
   (exact n)))
`;
      expect(() => evaluatePie(str)).toThrow();
    });

  });

});
