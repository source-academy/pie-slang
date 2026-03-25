import 'jest';
import { evaluatePie } from '../../main';

describe("Proof Techniques", () => {

  describe("Direct Proofs", () => {

    it("proves identity: A → A for Nat", () => {
      const str = `
(claim id-nat (→ Nat Nat))
(define-tactically id-nat
  ((intro n)
   (exact n)))
(id-nat 42)
`;
      const output = evaluatePie(str);
      expect(output).toContain("42: Nat");
    });

    it("proves identity: A → A for Atom", () => {
      const str = `
(claim id-atom (→ Atom Atom))
(define-tactically id-atom
  ((intro a)
   (exact a)))
(id-atom 'hello)
`;
      const output = evaluatePie(str);
      expect(output).toContain("'hello: Atom");
    });

    it("proves polymorphic identity: Π(A:U). A → A", () => {
      const str = `
(claim poly-id
  (Π ((A U))
    (→ A A)))
(define-tactically poly-id
  ((intro A)
   (intro x)
   (exact x)))
(poly-id Nat 5)
(poly-id Atom 'test)
`;
      const output = evaluatePie(str);
      expect(output).toContain("5: Nat");
      expect(output).toContain("'test: Atom");
    });

    it("proves constant function: A → B → A", () => {
      const str = `
(claim const-fn (→ Nat Atom Nat))
(define-tactically const-fn
  ((intro n)
   (intro a)
   (exact n)))
(const-fn 10 'ignored)
`;
      const output = evaluatePie(str);
      expect(output).toContain("10: Nat");
    });

    it("proves polymorphic constant: Π(A B:U). A → B → A", () => {
      const str = `
(claim poly-const
  (Π ((A U) (B U))
    (→ A B A)))
(define-tactically poly-const
  ((intro A)
   (intro B)
   (intro a)
   (intro b)
   (exact a)))
(poly-const Nat Atom 7 'x)
`;
      const output = evaluatePie(str);
      expect(output).toContain("7: Nat");
    });

    it("proves second projection: A → B → B", () => {
      const str = `
(claim proj-snd (→ Nat Atom Atom))
(define-tactically proj-snd
  ((intro n)
   (intro a)
   (exact a)))
(proj-snd 5 'kept)
`;
      const output = evaluatePie(str);
      expect(output).toContain("'kept: Atom");
    });

    it("proves reflexivity of equality: n = n", () => {
      const str = `
(claim refl-nat
  (Π ((n Nat))
    (= Nat n n)))
(define-tactically refl-nat
  ((intro n)
   (exact (same n))))
(refl-nat 0)
(refl-nat 5)
`;
      const output = evaluatePie(str);
      expect(output).toContain("(same 0)");
      expect(output).toContain("(same 5)");
    });

    it("proves Trivial directly", () => {
      const str = `
(claim triv Trivial)
(define-tactically triv
  ((exact sole)))
`;
      expect(() => evaluatePie(str)).not.toThrow();
    });

    it("proves A → Trivial for any A", () => {
      const str = `
(claim to-trivial
  (Π ((A U))
    (→ A Trivial)))
(define-tactically to-trivial
  ((intro A)
   (intro a)
   (exact sole)))
`;
      expect(() => evaluatePie(str)).not.toThrow();
    });

    it("proves add1 preserves equality using cong", () => {
      const str = `
(claim + (→ Nat Nat Nat))
(define + (λ (n j) (iter-Nat n j (λ (x) (add1 x)))))

(claim succ-eq
  (Π ((n Nat) (m Nat))
    (→ (= Nat n m)
       (= Nat (add1 n) (add1 m)))))
(define-tactically succ-eq
  ((intro n)
   (intro m)
   (intro eq)
   (cong eq (+ 1))))
(succ-eq 3 3 (same 3))
`;
      const output = evaluatePie(str);
      expect(output).toContain("(same 4)");
    });

    it("proves symmetry of equality using symm", () => {
      const str = `
(claim my-symm
  (Π ((A U) (a A) (b A))
    (→ (= A a b) (= A b a))))
(define-tactically my-symm
  ((intro A)
   (intro a)
   (intro b)
   (intro eq)
   (symm)
   (exact eq)))
`;
      expect(() => evaluatePie(str)).not.toThrow();
    });

    it("proves transitivity of equality using trans", () => {
      const str = `
(claim my-trans
  (Π ((A U) (a A) (b A) (c A))
    (→ (= A a b) (= A b c) (= A a c))))
(define-tactically my-trans
  ((intro A)
   (intro a)
   (intro b)
   (intro c)
   (intro eq1)
   (intro eq2)
   (trans eq1 eq2)))
`;
      expect(() => evaluatePie(str)).not.toThrow();
    });

  });

  describe("Proof by Cases", () => {

    it("case analysis on Either: map both branches to Nat", () => {
      const str = `
(claim cases-either
  (Π ((e (Either Nat Atom)))
    Nat))
(define-tactically cases-either
  ((intro e)
   (elim-Either e)
   (then
     (intro n)
     (exact n))
   (then
     (intro a)
     (exact 0))))
(cases-either (left 7))
(cases-either (right 'x))
`;
      const output = evaluatePie(str);
      expect(output).toContain("7: Nat");
      expect(output).toContain("0: Nat");
    });

    it("case analysis on Nat: zero vs successor", () => {
      const str = `
(claim nat-cases
  (Π ((n Nat))
    Atom))
(define-tactically nat-cases
  ((intro n)
   (elim-Nat n)
   (then
     (exact 'zero))
   (then
     (intro n-1)
     (intro ih)
     (exact 'positive))))
(nat-cases 0)
(nat-cases 5)
`;
      const output = evaluatePie(str);
      expect(output).toContain("'zero: Atom");
      expect(output).toContain("'positive: Atom");
    });

    it("case analysis on Either Nat Nat with different processing", () => {
      const str = `
(claim + (→ Nat Nat Nat))
(define + (λ (n j) (iter-Nat n j (λ (x) (add1 x)))))

(claim process-either
  (Π ((e (Either Nat Nat)))
    Nat))
(define-tactically process-either
  ((intro e)
   (elim-Either e)
   (then
     (intro l)
     (exact (+ l 10)))
   (then
     (intro r)
     (exact (+ r 20)))))
(process-either (left 5))
(process-either (right 5))
`;
      const output = evaluatePie(str);
      expect(output).toContain("15: Nat");
      expect(output).toContain("25: Nat");
    });

    it("case analysis returning pairs", () => {
      const str = `
(claim case-to-pair
  (Π ((e (Either Nat Atom)))
    (Σ ((x Nat)) Atom)))
(define-tactically case-to-pair
  ((intro e)
   (elim-Either e)
   (then
     (intro n)
     (split-Pair)
     (then (exact n))
     (then (exact 'from-left)))
   (then
     (intro a)
     (split-Pair)
     (then (exact 0))
     (then (exact a)))))
(car (case-to-pair (left 7)))
(cdr (case-to-pair (right 'hi)))
`;
      const output = evaluatePie(str);
      expect(output).toContain("7: Nat");
      expect(output).toContain("'hi: Atom");
    });

    it("nested case analysis on two Eithers", () => {
      const str = `
(claim nested-cases
  (Π ((e1 (Either Nat Atom)) (e2 (Either Nat Atom)))
    Nat))
(define-tactically nested-cases
  ((intro e1)
   (intro e2)
   (elim-Either e1)
   (then
     (intro n1)
     (elim-Either e2)
     (then
       (intro n2)
       (exact 1))
     (then
       (intro a2)
       (exact 2)))
   (then
     (intro a1)
     (elim-Either e2)
     (then
       (intro n2)
       (exact 3))
     (then
       (intro a2)
       (exact 4)))))
(nested-cases (left 0) (left 0))
(nested-cases (left 0) (right 'x))
(nested-cases (right 'y) (left 0))
(nested-cases (right 'y) (right 'z))
`;
      const output = evaluatePie(str);
      expect(output).toContain("1: Nat");
      expect(output).toContain("2: Nat");
      expect(output).toContain("3: Nat");
      expect(output).toContain("4: Nat");
    });

    it("case analysis on Nat returning Either", () => {
      const str = `
(claim nat-to-either
  (Π ((n Nat))
    (Either Atom Nat)))
(define-tactically nat-to-either
  ((intro n)
   (elim-Nat n)
   (then
     (go-Left)
     (exact 'zero))
   (then
     (intro n-1)
     (intro ih)
     (go-Right)
     (exact n-1))))
(nat-to-either 0)
(nat-to-either 5)
`;
      const output = evaluatePie(str);
      expect(output).toContain("(left 'zero)");
      expect(output).toContain("(right 4)");
    });

    it("case analysis on Nat to compute predecessor", () => {
      const str = `
(claim pred
  (Π ((n Nat))
    Nat))
(define-tactically pred
  ((intro n)
   (elim-Nat n)
   (then
     (exact 0))
   (then
     (intro n-1)
     (intro ih)
     (exact n-1))))
(pred 0)
(pred 1)
(pred 5)
`;
      const output = evaluatePie(str);
      expect(output).toContain("0: Nat");
      expect(output).toContain("4: Nat");
    });

    it("case analysis on Nat to check if zero", () => {
      const str = `
(claim Bool U)
(define Bool (Either Trivial Trivial))
(claim true Bool)
(define true (left sole))
(claim false Bool)
(define false (right sole))

(claim is-zero
  (Π ((n Nat))
    Bool))
(define-tactically is-zero
  ((intro n)
   (elim-Nat n)
   (then
     (exact true))
   (then
     (intro n-1)
     (intro ih)
     (exact false))))
(is-zero 0)
(is-zero 3)
`;
      const output = evaluatePie(str);
      expect(output).toContain("(left sole)");
      expect(output).toContain("(right sole)");
    });

    it("case analysis on List: nil vs cons", () => {
      const str = `
(claim list-case
  (Π ((E U) (xs (List E)))
    Nat))
(define-tactically list-case
  ((intro E)
   (intro xs)
   (elim-List xs)
   (then
     (exact 0))
   (then
     (intro x)
     (intro rest)
     (intro ih)
     (exact (add1 ih)))))
(list-case Nat nil)
(list-case Nat (:: 1 (:: 2 nil)))
`;
      const output = evaluatePie(str);
      expect(output).toContain("0: Nat");
      expect(output).toContain("2: Nat");
    });

    it("case analysis combining Nat and Either", () => {
      const str = `
(claim combined
  (Π ((n Nat) (e (Either Atom Trivial)))
    Atom))
(define-tactically combined
  ((intro n)
   (intro e)
   (elim-Either e)
   (then
     (intro a)
     (exact a))
   (then
     (intro t)
     (exact 'trivial))))
(combined 0 (left 'hi))
(combined 0 (right sole))
`;
      const output = evaluatePie(str);
      expect(output).toContain("'hi: Atom");
      expect(output).toContain("'trivial: Atom");
    });

    it("triple Either elimination: three cases", () => {
      const str = `
(claim triple-case
  (Π ((e (Either Nat (Either Atom Trivial))))
    Nat))
(define-tactically triple-case
  ((intro e)
   (elim-Either e)
   (then
     (intro n)
     (exact n))
   (then
     (intro inner)
     (elim-Either inner)
     (then
       (intro a)
       (exact 100))
     (then
       (intro t)
       (exact 200)))))
(triple-case (left 42))
(triple-case (right (left 'x)))
(triple-case (right (right sole)))
`;
      const output = evaluatePie(str);
      expect(output).toContain("42: Nat");
      expect(output).toContain("100: Nat");
      expect(output).toContain("200: Nat");
    });

  });

  describe("Proof by Contrapositive", () => {

    it("contrapositive: (A→B) → (¬B→¬A)", () => {
      const str = `
(claim contrapositive
  (Π ((A U) (B U))
    (→ (→ A B) (→ (→ B Absurd) (→ A Absurd)))))
(define-tactically contrapositive
  ((intro A)
   (intro B)
   (intro f)
   (intro neg-b)
   (intro a)
   (exact (neg-b (f a)))))
`;
      expect(() => evaluatePie(str)).not.toThrow();
    });

    it("contrapositive specialized to Nat → Atom", () => {
      const str = `
(claim contra-nat-atom
  (→ (→ Nat Atom) (→ (→ Atom Absurd) (→ Nat Absurd))))
(define-tactically contra-nat-atom
  ((intro f)
   (intro neg-atom)
   (intro n)
   (apply neg-atom)
   (apply f)
   (exact n)))
`;
      expect(() => evaluatePie(str)).not.toThrow();
    });

    it("modus tollens as proof technique", () => {
      const str = `
(claim mt
  (Π ((A U) (B U))
    (→ (→ A B) (→ B Absurd) A Absurd)))
(define-tactically mt
  ((intro A)
   (intro B)
   (intro f)
   (intro neg-b)
   (intro a)
   (exact (neg-b (f a)))))
`;
      expect(() => evaluatePie(str)).not.toThrow();
    });

    it("contrapositive chain: three implications", () => {
      const str = `
(claim contra-chain
  (→ (→ Nat Atom)
     (→ Atom Trivial)
     (→ (→ Trivial Absurd) (→ Nat Absurd))))
(define-tactically contra-chain
  ((intro f)
   (intro g)
   (intro neg-t)
   (intro n)
   (exact (neg-t (g (f n))))))
`;
      expect(() => evaluatePie(str)).not.toThrow();
    });

    it("contrapositive with dependent types", () => {
      const str = `
(claim contra-dep
  (Π ((n Nat))
    (→ (→ (= Nat n n) Nat)
       (→ Nat Absurd)
       (→ (= Nat n n) Absurd))))
(define-tactically contra-dep
  ((intro n)
   (intro f)
   (intro neg-nat)
   (intro eq)
   (exact (neg-nat (f eq)))))
`;
      expect(() => evaluatePie(str)).not.toThrow();
    });

    it("double contrapositive: back to original direction for ¬¬", () => {
      const str = `
(claim dbl-contra
  (Π ((A U) (B U))
    (→ (→ A B)
       (→ (→ (→ A Absurd) Absurd)
          (→ (→ B Absurd) Absurd)))))
(define-tactically dbl-contra
  ((intro A)
   (intro B)
   (intro f)
   (intro nn-a)
   (intro neg-b)
   (exact (nn-a (λ (a) (neg-b (f a)))))))
`;
      expect(() => evaluatePie(str)).not.toThrow();
    });

    it("contrapositive with pair type", () => {
      const str = `
(claim contra-pair
  (→ (→ Nat (Σ ((x Nat)) Atom))
     (→ (→ (Σ ((x Nat)) Atom) Absurd)
        (→ Nat Absurd))))
(define-tactically contra-pair
  ((intro f)
   (intro neg-pair)
   (intro n)
   (exact (neg-pair (f n)))))
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
   (intro neg-e)
   (intro n)
   (exact (neg-e (f n)))))
`;
      expect(() => evaluatePie(str)).not.toThrow();
    });

    it("proof by contrapositive using apply tactic", () => {
      const str = `
(claim contra-apply
  (→ (→ Nat Atom) (→ Atom Absurd) Nat Absurd))
(define-tactically contra-apply
  ((intro f)
   (intro neg-a)
   (intro n)
   (apply neg-a)
   (apply f)
   (exact n)))
`;
      expect(() => evaluatePie(str)).not.toThrow();
    });

    it("contrapositive preserves proof composition", () => {
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

  });

  describe("Proof Composition", () => {

    it("function composition: (B→C) → (A→B) → A → C", () => {
      const str = `
(claim compose
  (Π ((A U) (B U) (C U))
    (→ (→ B C) (→ A B) A C)))
(define-tactically compose
  ((intro A)
   (intro B)
   (intro C)
   (intro g)
   (intro f)
   (intro a)
   (exact (g (f a)))))
(compose Nat Nat Nat (λ (n) (add1 n)) (λ (n) (add1 n)) 0)
`;
      const output = evaluatePie(str);
      expect(output).toContain("2: Nat");
    });

    it("compose using apply tactic", () => {
      const str = `
(claim compose-apply
  (→ (→ Nat Atom) (→ Atom Trivial) Nat Trivial))
(define-tactically compose-apply
  ((intro f)
   (intro g)
   (intro n)
   (apply g)
   (apply f)
   (exact n)))
`;
      expect(() => evaluatePie(str)).not.toThrow();
    });

    it("triple composition", () => {
      const str = `
(claim triple-compose
  (→ (→ Nat Nat) (→ Nat Nat) (→ Nat Nat) Nat Nat))
(define-tactically triple-compose
  ((intro f)
   (intro g)
   (intro h)
   (intro n)
   (exact (f (g (h n))))))
(triple-compose (λ (n) (add1 n)) (λ (n) (add1 n)) (λ (n) (add1 n)) 0)
`;
      const output = evaluatePie(str);
      expect(output).toContain("3: Nat");
    });

    it("proof reuse: use one tactic proof in another", () => {
      const str = `
(claim + (→ Nat Nat Nat))
(define + (λ (n j) (iter-Nat n j (λ (x) (add1 x)))))

(claim right-zero
  (Π ((n Nat))
    (= Nat (+ n 0) n)))
(define-tactically right-zero
  ((intro n)
   (elim-Nat n)
   (then
     (exact (same 0)))
   (then
     (intro n-1)
     (intro ih)
     (cong ih (+ 1)))))

(claim right-zero-symm
  (Π ((n Nat))
    (= Nat n (+ n 0))))
(define right-zero-symm
  (λ (n) (symm (right-zero n))))
(right-zero 5)
(right-zero-symm 5)
`;
      const output = evaluatePie(str);
      expect(output).toContain("(same 5)");
    });

    it("currying proof: pair elimination to curried form", () => {
      const str = `
(claim curry
  (Π ((A U) (B U) (C U))
    (→ (→ (Σ ((a A)) B) C)
       A B C)))
(define-tactically curry
  ((intro A)
   (intro B)
   (intro C)
   (intro f)
   (intro a)
   (intro b)
   (exact (f (cons a b)))))
`;
      expect(() => evaluatePie(str)).not.toThrow();
    });

    it("uncurrying proof: curried form to pair-based", () => {
      const str = `
(claim uncurry
  (Π ((A U) (B U) (C U))
    (→ (→ A B C)
       (Σ ((a A)) B) C)))
(define-tactically uncurry
  ((intro A)
   (intro B)
   (intro C)
   (intro f)
   (intro p)
   (exact (f (car p) (cdr p)))))
`;
      expect(() => evaluatePie(str)).not.toThrow();
    });

    it("diagonal: A → A × A (as Σ)", () => {
      const str = `
(claim diagonal
  (Π ((A U))
    (→ A (Σ ((x A)) A))))
(define-tactically diagonal
  ((intro A)
   (intro a)
   (split-Pair)
   (then (exact a))
   (then (exact a))))
`;
      expect(() => evaluatePie(str)).not.toThrow();
    });

    it("swap: A × B → B × A (as Σ)", () => {
      const str = `
(claim swap
  (→ (Σ ((x Nat)) Atom) (Σ ((a Atom)) Nat)))
(define-tactically swap
  ((intro p)
   (split-Pair)
   (then (exact (cdr p)))
   (then (exact (car p)))))
(car (swap (cons 5 'hi)))
(cdr (swap (cons 5 'hi)))
`;
      const output = evaluatePie(str);
      expect(output).toContain("'hi: Atom");
      expect(output).toContain("5: Nat");
    });

    it("proof with multiple tactic definitions composed", () => {
      const str = `
(claim f (→ Nat Nat))
(define f (λ (n) (add1 n)))

(claim g (→ Nat Nat))
(define-tactically g
  ((intro n)
   (apply f)
   (apply f)
   (exact n)))

(claim h (→ Nat Nat))
(define-tactically h
  ((intro n)
   (exact (g (g n)))))

(g 0)
(h 0)
`;
      const output = evaluatePie(str);
      expect(output).toContain("2: Nat");
      expect(output).toContain("4: Nat");
    });

    it("proof with weakening and contraction patterns", () => {
      const str = `
(claim weaken
  (Π ((A U) (B U))
    (→ A B A)))
(define-tactically weaken
  ((intro A)
   (intro B)
   (intro a)
   (intro b)
   (exact a)))
(weaken Nat Atom 42 'ignored)
`;
      const output = evaluatePie(str);
      expect(output).toContain("42: Nat");
    });

    it("bimap on pairs: apply different functions to each component", () => {
      const str = `
(claim bimap
  (→ (→ Nat Nat) (→ Atom Atom) (Σ ((x Nat)) Atom) (Σ ((y Nat)) Atom)))
(define-tactically bimap
  ((intro f)
   (intro g)
   (intro p)
   (split-Pair)
   (then (exact (f (car p))))
   (then (exact (g (cdr p))))))
(car (bimap (λ (n) (add1 n)) (λ (a) 'mapped) (cons 5 'x)))
(cdr (bimap (λ (n) (add1 n)) (λ (a) 'mapped) (cons 5 'x)))
`;
      const output = evaluatePie(str);
      expect(output).toContain("6: Nat");
      expect(output).toContain("'mapped: Atom");
    });

    it("Either bimap: apply functions to respective branches", () => {
      const str = `
(claim either-bimap
  (→ (→ Nat Nat) (→ Atom Atom) (Either Nat Atom) (Either Nat Atom)))
(define-tactically either-bimap
  ((intro f)
   (intro g)
   (intro e)
   (elim-Either e)
   (then
     (intro n)
     (go-Left)
     (exact (f n)))
   (then
     (intro a)
     (go-Right)
     (exact (g a)))))
`;
      expect(() => evaluatePie(str)).not.toThrow();
    });

  });

  describe("Error Cases", () => {

    it("missing then block after elim-Nat should fail", () => {
      const str = `
(claim bad-nat-elim
  (Π ((n Nat))
    Nat))
(define-tactically bad-nat-elim
  ((intro n)
   (elim-Nat n)
   (exact 0)
   (exact 1)))
`;
      expect(() => evaluatePie(str)).toThrow("Expected 'then' block to handle subgoal branch");
    });

    it("wrong exact type should fail", () => {
      const str = `
(claim wrong-type Nat)
(define-tactically wrong-type
  ((exact 'not-a-nat)))
`;
      expect(() => evaluatePie(str)).toThrow();
    });

    it("intro on non-function type should fail", () => {
      const str = `
(claim bad Nat)
(define-tactically bad
  ((intro x)
   (exact 5)))
`;
      expect(() => evaluatePie(str)).toThrow(/non-function/i);
    });

    it("incomplete proof should fail", () => {
      const str = `
(claim incomplete (→ Nat Nat))
(define-tactically incomplete
  ((intro n)))
`;
      expect(() => evaluatePie(str)).toThrow(/incomplete/i);
    });

    it("elim-Nat on non-Nat should fail", () => {
      const str = `
(claim bad-elim
  (Π ((a Atom))
    Atom))
(define-tactically bad-elim
  ((intro a)
   (elim-Nat a)
   (then (exact 'x))
   (then (intro n) (intro ih) (exact 'y))))
`;
      expect(() => evaluatePie(str)).toThrow(/non-Nat/i);
    });

  });

});
