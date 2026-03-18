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
(poly-id Nat 42)
`;
      const output = evaluatePie(str);
      expect(output).toContain("42: Nat");
    });

    it("applies polymorphic identity to Atom", () => {
      const str = `
(claim poly-id (Π ((A U) (x A)) A))
(define-tactically poly-id
  ((intro A)
   (intro x)
   (exact x)))
(poly-id Atom 'hello)
`;
      const output = evaluatePie(str);
      expect(output).toContain("'hello: Atom");
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
(const-fn Nat Atom 5 'x)
`;
      const output = evaluatePie(str);
      expect(output).toContain("5: Nat");
    });

    it("defines identity on Nat: (→ Nat Nat)", () => {
      const str = `
(claim nat-id (→ Nat Nat))
(define-tactically nat-id
  ((intro n)
   (exact n)))
(nat-id 0)
(nat-id 7)
`;
      const output = evaluatePie(str);
      expect(output).toContain("0: Nat");
      expect(output).toContain("7: Nat");
    });

    it("defines constant Nat function ignoring Atom argument", () => {
      const str = `
(claim const-nat (→ Nat Atom Nat))
(define-tactically const-nat
  ((intro n)
   (intro a)
   (exact n)))
(const-nat 10 'ignored)
`;
      const output = evaluatePie(str);
      expect(output).toContain("10: Nat");
    });

    it("identity on Trivial", () => {
      const str = `
(claim triv-id (→ Trivial Trivial))
(define-tactically triv-id
  ((intro t)
   (exact t)))
(triv-id sole)
`;
      const output = evaluatePie(str);
      expect(output).toContain("sole: Trivial");
    });

    it("identity applied to zero returns zero", () => {
      const str = `
(claim id-nat (→ Nat Nat))
(define-tactically id-nat
  ((intro n)
   (exact n)))
(id-nat 0)
`;
      const output = evaluatePie(str);
      expect(output).toContain("0: Nat");
    });

    it("identity applied to add1 preserves value", () => {
      const str = `
(claim id-nat (→ Nat Nat))
(define-tactically id-nat
  ((intro n)
   (exact n)))
(id-nat (add1 (add1 (add1 zero))))
`;
      const output = evaluatePie(str);
      expect(output).toContain("3: Nat");
    });

    it("const returns first of two Nat arguments", () => {
      const str = `
(claim const2 (→ Nat Nat Nat))
(define-tactically const2
  ((intro a)
   (intro b)
   (exact a)))
(const2 99 1)
`;
      const output = evaluatePie(str);
      expect(output).toContain("99: Nat");
    });

    it("const returns Atom ignoring Nat", () => {
      const str = `
(claim const-atom (→ Atom Nat Atom))
(define-tactically const-atom
  ((intro a)
   (intro n)
   (exact a)))
(const-atom 'yes 100)
`;
      const output = evaluatePie(str);
      expect(output).toContain("'yes: Atom");
    });

    it("polymorphic identity on Trivial", () => {
      const str = `
(claim poly-id (Π ((A U) (x A)) A))
(define-tactically poly-id
  ((intro A)
   (intro x)
   (exact x)))
(poly-id Trivial sole)
`;
      const output = evaluatePie(str);
      expect(output).toContain("sole: Trivial");
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
(snd-fn Nat Atom 5 'hello)
`;
      const output = evaluatePie(str);
      expect(output).toContain("'hello: Atom");
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
(double-succ 3)
`;
      const output = evaluatePie(str);
      expect(output).toContain("5: Nat");
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
((compose Nat Nat Nat add1-fn add1-fn) 0)
`;
      const output = evaluatePie(str);
      expect(output).toContain("2: Nat");
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
((compose Nat Nat Nat id-nat add1-fn) 4)
`;
      const output = evaluatePie(str);
      expect(output).toContain("5: Nat");
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
((compose Nat Nat Nat add1-fn id-nat) 4)
`;
      const output = evaluatePie(str);
      expect(output).toContain("5: Nat");
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
(add3 0)
`;
      const output = evaluatePie(str);
      expect(output).toContain("3: Nat");
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
((compose Nat Nat Nat double add1-fn) 3)
`;
      const output = evaluatePie(str);
      expect(output).toContain("8: Nat");
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
((nat-compose add1-fn add1-fn) 10)
`;
      const output = evaluatePie(str);
      expect(output).toContain("12: Nat");
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
((compose Nat Nat Trivial to-triv add1-fn) 5)
`;
      const output = evaluatePie(str);
      expect(output).toContain("sole: Trivial");
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
((compose Nat Nat Nat id-nat id-nat) 42)
`;
      const output = evaluatePie(str);
      expect(output).toContain("42: Nat");
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
(lhs 0)
(rhs 0)
`;
      const output = evaluatePie(str);
      expect(output).toContain("3: Nat");
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
(app Nat Nat (λ (n) (add1 n)) 5)
`;
      const output = evaluatePie(str);
      expect(output).toContain("6: Nat");
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
((flip Nat Atom Nat pick-first) 'hello 42)
`;
      const output = evaluatePie(str);
      expect(output).toContain("42: Nat");
    });

    it("defines twice/double-apply: (Π ((A U)) (→ (→ A A) A A))", () => {
      const str = `
(claim twice (Π ((A U)) (→ (→ A A) A A)))
(define-tactically twice
  ((intro A)
   (intro f)
   (intro x)
   (exact (f (f x)))))
(twice Nat (λ (n) (add1 n)) 0)
`;
      const output = evaluatePie(str);
      expect(output).toContain("2: Nat");
    });

    it("twice applied to add1 on 5 gives 7", () => {
      const str = `
(claim twice (Π ((A U)) (→ (→ A A) A A)))
(define-tactically twice
  ((intro A)
   (intro f)
   (intro x)
   (exact (f (f x)))))
(twice Nat (λ (n) (add1 n)) 5)
`;
      const output = evaluatePie(str);
      expect(output).toContain("7: Nat");
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
(K-comb Nat Atom 7 'x)
`;
      const output = evaluatePie(str);
      expect(output).toContain("7: Nat");
    });

    it("I combinator is identity", () => {
      const str = `
(claim I-comb (Π ((A U)) (→ A A)))
(define-tactically I-comb
  ((intro A)
   (intro a)
   (exact a)))
(I-comb Nat 99)
`;
      const output = evaluatePie(str);
      expect(output).toContain("99: Nat");
    });

    it("thrice: apply function 3 times", () => {
      const str = `
(claim thrice (Π ((A U)) (→ (→ A A) A A)))
(define-tactically thrice
  ((intro A)
   (intro f)
   (intro x)
   (exact (f (f (f x))))))
(thrice Nat (λ (n) (add1 n)) 0)
`;
      const output = evaluatePie(str);
      expect(output).toContain("3: Nat");
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
(on Nat Nat Nat + (λ (n) (add1 n)) 2 3)
`;
      const output = evaluatePie(str);
      expect(output).toContain("7: Nat");
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
(pipe2 Nat Nat Nat (λ (n) (add1 n)) (λ (n) (add1 n)) 0)
`;
      const output = evaluatePie(str);
      expect(output).toContain("2: Nat");
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
(B-comb Nat Nat Nat (λ (n) (add1 n)) (λ (n) (add1 n)) 3)
`;
      const output = evaluatePie(str);
      expect(output).toContain("5: Nat");
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
(W-comb Nat Nat + 3)
`;
      const output = evaluatePie(str);
      expect(output).toContain("6: Nat");
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
(twice Nat id-nat 42)
`;
      const output = evaluatePie(str);
      expect(output).toContain("42: Nat");
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
((compose Nat Nat Nat id-nat f) 3)
`;
      const output = evaluatePie(str);
      expect(output).toContain("5: Nat");
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
((compose Nat Nat Nat f id-nat) 3)
`;
      const output = evaluatePie(str);
      expect(output).toContain("5: Nat");
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
(lhs 1)
(rhs 1)
`;
      const output = evaluatePie(str);
      // Both should give 4
      expect(output).toContain("4: Nat");
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
((compose Nat Nat Nat id-nat id-nat) 7)
`;
      const output = evaluatePie(str);
      expect(output).toContain("7: Nat");
    });

    it("Church numeral 2 as iterated composition", () => {
      const str = `
(claim church-2 (Π ((A U)) (→ (→ A A) (→ A A))))
(define-tactically church-2
  ((intro A)
   (intro f)
   (intro x)
   (exact (f (f x)))))
(church-2 Nat (λ (n) (add1 n)) 0)
`;
      const output = evaluatePie(str);
      expect(output).toContain("2: Nat");
    });

    it("Church numeral 3 as iterated composition", () => {
      const str = `
(claim church-3 (Π ((A U)) (→ (→ A A) (→ A A))))
(define-tactically church-3
  ((intro A)
   (intro f)
   (intro x)
   (exact (f (f (f x))))))
(church-3 Nat (λ (n) (add1 n)) 0)
`;
      const output = evaluatePie(str);
      expect(output).toContain("3: Nat");
    });

    it("Church numeral 0 as identity", () => {
      const str = `
(claim church-0 (Π ((A U)) (→ (→ A A) (→ A A))))
(define-tactically church-0
  ((intro A)
   (intro f)
   (intro x)
   (exact x)))
(church-0 Nat (λ (n) (add1 n)) 5)
`;
      const output = evaluatePie(str);
      expect(output).toContain("5: Nat");
    });

    it("Church numeral 1 applies once", () => {
      const str = `
(claim church-1 (Π ((A U)) (→ (→ A A) (→ A A))))
(define-tactically church-1
  ((intro A)
   (intro f)
   (intro x)
   (exact (f x))))
(church-1 Nat (λ (n) (add1 n)) 10)
`;
      const output = evaluatePie(str);
      expect(output).toContain("11: Nat");
    });

    it("compose with twice: twice . add1 = add 2", () => {
      const str = `
(claim twice (Π ((A U)) (→ (→ A A) A A)))
(define-tactically twice
  ((intro A)
   (intro f)
   (intro x)
   (exact (f (f x)))))
(twice Nat (λ (n) (add1 n)) 8)
`;
      const output = evaluatePie(str);
      expect(output).toContain("10: Nat");
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
(twice Nat (the (→ Nat Nat) (λ (x) (twice Nat add1-fn x))) 0)
`;
      const output = evaluatePie(str);
      expect(output).toContain("4: Nat");
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
