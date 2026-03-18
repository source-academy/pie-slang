import 'jest';
import { evaluatePie } from '../../main';

describe("Quantifiers and Predicates", () => {

  describe("Universal Quantification (Π)", () => {

    it("proves ∀n:Nat. n = n (reflexivity)", () => {
      const str = `
(claim forall-refl
  (Π ((n Nat))
    (= Nat n n)))
(define-tactically forall-refl
  ((intro n)
   (exact (same n))))
(forall-refl 0)
(forall-refl 7)
`;
      const output = evaluatePie(str);
      expect(output).toContain("(same 0)");
      expect(output).toContain("(same 7)");
    });

    it("proves ∀a:Atom. a = a (reflexivity for Atom)", () => {
      const str = `
(claim forall-refl-atom
  (Π ((a Atom))
    (= Atom a a)))
(define-tactically forall-refl-atom
  ((intro a)
   (exact (same a))))
`;
      expect(() => evaluatePie(str)).not.toThrow();
    });

    it("proves ∀n:Nat. Trivial", () => {
      const str = `
(claim forall-trivial
  (Π ((n Nat))
    Trivial))
(define-tactically forall-trivial
  ((intro n)
   (exact sole)))
`;
      expect(() => evaluatePie(str)).not.toThrow();
    });

    it("proves ∀A:U. A → A (polymorphic identity)", () => {
      const str = `
(claim forall-id
  (Π ((A U))
    (→ A A)))
(define-tactically forall-id
  ((intro A)
   (intro a)
   (exact a)))
(forall-id Nat 42)
`;
      const output = evaluatePie(str);
      expect(output).toContain("42: Nat");
    });

    it("proves ∀n:Nat. add1(n) = add1(n)", () => {
      const str = `
(claim forall-succ-refl
  (Π ((n Nat))
    (= Nat (add1 n) (add1 n))))
(define-tactically forall-succ-refl
  ((intro n)
   (exact (same (add1 n)))))
`;
      expect(() => evaluatePie(str)).not.toThrow();
    });

    it("proves ∀n:Nat. ∃m:Nat. m = n (existence from universal)", () => {
      const str = `
(claim forall-to-exists
  (Π ((n Nat))
    (Σ ((m Nat))
      (= Nat m n))))
(define-tactically forall-to-exists
  ((intro n)
   (exists n witness)
   (exact (same n))))
(car (forall-to-exists 5))
`;
      const output = evaluatePie(str);
      expect(output).toContain("5: Nat");
    });

    it("proves ∀n m:Nat. n = m → m = n (symmetry)", () => {
      const str = `
(claim forall-symm
  (Π ((n Nat) (m Nat))
    (→ (= Nat n m) (= Nat m n))))
(define-tactically forall-symm
  ((intro n)
   (intro m)
   (intro eq)
   (exact (symm eq))))
`;
      expect(() => evaluatePie(str)).not.toThrow();
    });

    it("proves ∀n:Nat. (Either (= Nat n n) Absurd)", () => {
      const str = `
(claim forall-either-refl
  (Π ((n Nat))
    (Either (= Nat n n) Absurd)))
(define-tactically forall-either-refl
  ((intro n)
   (go-Left)
   (exact (same n))))
`;
      expect(() => evaluatePie(str)).not.toThrow();
    });

    it("proves ∀(A:U)(B:U). A → B → A (K combinator)", () => {
      const str = `
(claim K
  (Π ((A U) (B U))
    (→ A B A)))
(define-tactically K
  ((intro A)
   (intro B)
   (intro a)
   (intro b)
   (exact a)))
(K Nat Atom 7 'ignored)
`;
      const output = evaluatePie(str);
      expect(output).toContain("7: Nat");
    });

    it("proves ∀n:Nat. n+0=n using induction", () => {
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
     (exact (cong ih (+ 1))))))
(right-zero 0)
(right-zero 3)
`;
      const output = evaluatePie(str);
      expect(output).toContain("(same 0)");
      expect(output).toContain("(same 3)");
    });

    it("proves ∀n:Nat. 0+n=n (trivially by reduction)", () => {
      const str = `
(claim + (→ Nat Nat Nat))
(define + (λ (n j) (iter-Nat n j (λ (x) (add1 x)))))

(claim left-zero
  (Π ((n Nat))
    (= Nat (+ 0 n) n)))
(define-tactically left-zero
  ((intro n)
   (exact (same n))))
(left-zero 5)
`;
      const output = evaluatePie(str);
      expect(output).toContain("(same 5)");
    });

    it("proves ∀n:Nat. 1+n = add1(n)", () => {
      const str = `
(claim + (→ Nat Nat Nat))
(define + (λ (n j) (iter-Nat n j (λ (x) (add1 x)))))

(claim one-plus
  (Π ((n Nat))
    (= Nat (+ 1 n) (add1 n))))
(define-tactically one-plus
  ((intro n)
   (exact (same (add1 n)))))
(one-plus 4)
`;
      const output = evaluatePie(str);
      expect(output).toContain("(same 5)");
    });

  });

  describe("Existential Quantification (Σ)", () => {

    it("proves ∃n:Nat. n = 0 with witness 0", () => {
      const str = `
(claim exists-zero
  (Σ ((n Nat))
    (= Nat n 0)))
(define-tactically exists-zero
  ((exists 0 n)
   (exact (same 0))))
(car exists-zero)
`;
      const output = evaluatePie(str);
      expect(output).toContain("0: Nat");
    });

    it("proves ∃n:Nat. n = 5 with witness 5", () => {
      const str = `
(claim exists-five
  (Σ ((n Nat))
    (= Nat n 5)))
(define-tactically exists-five
  ((exists 5 n)
   (exact (same 5))))
(car exists-five)
`;
      const output = evaluatePie(str);
      expect(output).toContain("5: Nat");
    });

    it("proves ∃n:Nat. n = n with witness 42", () => {
      const str = `
(claim exists-refl
  (Σ ((n Nat))
    (= Nat n n)))
(define-tactically exists-refl
  ((exists 42 n)
   (exact (same 42))))
(car exists-refl)
`;
      const output = evaluatePie(str);
      expect(output).toContain("42: Nat");
    });

    it("proves existential with Atom witness", () => {
      const str = `
(claim exists-atom
  (Σ ((a Atom))
    (= Atom a 'hello)))
(define-tactically exists-atom
  ((exists 'hello a)
   (exact (same 'hello))))
(car exists-atom)
`;
      const output = evaluatePie(str);
      expect(output).toContain("'hello: Atom");
    });

    it("proves ∃n:Nat. (add1 n) = 3 with witness 2", () => {
      const str = `
(claim exists-pred
  (Σ ((n Nat))
    (= Nat (add1 n) 3)))
(define-tactically exists-pred
  ((exists 2 n)
   (exact (same 3))))
(car exists-pred)
`;
      const output = evaluatePie(str);
      expect(output).toContain("2: Nat");
    });

    it("proves nested existential: ∃n.∃m. add1(n)=m", () => {
      const str = `
(claim nested-exists
  (Σ ((n Nat))
    (Σ ((m Nat))
      (= Nat (add1 n) m))))
(define-tactically nested-exists
  ((exists 3 n)
   (exists 4 m)
   (exact (same 4))))
(car nested-exists)
(car (cdr nested-exists))
`;
      const output = evaluatePie(str);
      expect(output).toContain("3: Nat");
      expect(output).toContain("4: Nat");
    });

    it("proves existential with Trivial", () => {
      const str = `
(claim exists-triv
  (Σ ((t Trivial))
    (= Trivial t sole)))
(define-tactically exists-triv
  ((exists sole t)
   (exact (same sole))))
`;
      expect(() => evaluatePie(str)).not.toThrow();
    });

    it("proves existential pair using split-Pair", () => {
      const str = `
(claim pair-via-split
  (Σ ((n Nat)) Atom))
(define-tactically pair-via-split
  ((split-Pair)
   (then (exact 10))
   (then (exact 'ten))))
(car pair-via-split)
(cdr pair-via-split)
`;
      const output = evaluatePie(str);
      expect(output).toContain("10: Nat");
      expect(output).toContain("'ten: Atom");
    });

    it("proves ∃n:Nat. ∃m:Nat. n=m with same witness", () => {
      const str = `
(claim exists-eq
  (Σ ((n Nat))
    (Σ ((m Nat))
      (= Nat n m))))
(define-tactically exists-eq
  ((exists 7 n)
   (exists 7 m)
   (exact (same 7))))
(car exists-eq)
(car (cdr exists-eq))
`;
      const output = evaluatePie(str);
      expect(output).toContain("7: Nat");
    });

    it("proves existential with computed witness", () => {
      const str = `
(claim + (→ Nat Nat Nat))
(define + (λ (n j) (iter-Nat n j (λ (x) (add1 x)))))

(claim exists-sum
  (Σ ((n Nat))
    (= Nat n (+ 2 3))))
(define-tactically exists-sum
  ((exists 5 n)
   (exact (same 5))))
(car exists-sum)
`;
      const output = evaluatePie(str);
      expect(output).toContain("5: Nat");
    });

    it("proves existential with Either type in predicate", () => {
      const str = `
(claim exists-either
  (Σ ((n Nat))
    (Either (= Nat n 0) (= Nat n 1))))
(define-tactically exists-either
  ((exists 0 n)
   (go-Left)
   (exact (same 0))))
`;
      expect(() => evaluatePie(str)).not.toThrow();
    });

    it("proves existential with right branch of Either", () => {
      const str = `
(claim exists-either-right
  (Σ ((n Nat))
    (Either (= Nat n 0) (= Nat n 1))))
(define-tactically exists-either-right
  ((exists 1 n)
   (go-Right)
   (exact (same 1))))
`;
      expect(() => evaluatePie(str)).not.toThrow();
    });

  });

  describe("Witness Extraction", () => {

    it("extracts witness from existential using car", () => {
      const str = `
(claim my-exists
  (Σ ((n Nat)) (= Nat n 10)))
(define-tactically my-exists
  ((exists 10 n)
   (exact (same 10))))
(claim witness Nat)
(define witness (car my-exists))
witness
`;
      const output = evaluatePie(str);
      expect(output).toContain("10: Nat");
    });

    it("extracts proof from existential using cdr", () => {
      const str = `
(claim my-exists
  (Σ ((n Nat)) (= Nat n 5)))
(define-tactically my-exists
  ((exists 5 n)
   (exact (same 5))))
(cdr my-exists)
`;
      const output = evaluatePie(str);
      expect(output).toContain("(same 5)");
    });

    it("uses extracted witness in computation", () => {
      const str = `
(claim + (→ Nat Nat Nat))
(define + (λ (n j) (iter-Nat n j (λ (x) (add1 x)))))

(claim my-pair
  (Σ ((n Nat)) Nat))
(define-tactically my-pair
  ((split-Pair)
   (then (exact 3))
   (then (exact 7))))
(+ (car my-pair) (cdr my-pair))
`;
      const output = evaluatePie(str);
      expect(output).toContain("10: Nat");
    });

    it("extracts from nested existential", () => {
      const str = `
(claim nested
  (Σ ((n Nat))
    (Σ ((m Nat))
      (= Nat n m))))
(define-tactically nested
  ((exists 4 n)
   (exists 4 m)
   (exact (same 4))))
(car nested)
(car (cdr nested))
(cdr (cdr nested))
`;
      const output = evaluatePie(str);
      expect(output).toContain("4: Nat");
      expect(output).toContain("(same 4)");
    });

    it("extracts and uses witness from Atom existential", () => {
      const str = `
(claim atom-exists
  (Σ ((a Atom)) Nat))
(define-tactically atom-exists
  ((split-Pair)
   (then (exact 'myatom))
   (then (exact 99))))
(car atom-exists)
(cdr atom-exists)
`;
      const output = evaluatePie(str);
      expect(output).toContain("'myatom: Atom");
      expect(output).toContain("99: Nat");
    });

    it("maps over existential: transform witness", () => {
      const str = `
(claim exists-map
  (→ (Σ ((n Nat)) (= Nat n n))
     (Σ ((m Nat)) (= Nat m m))))
(define-tactically exists-map
  ((intro p)
   (exists (add1 (car p)) m)
   (exact (same (add1 (car p))))))
(car (exists-map (cons 5 (same 5))))
`;
      const output = evaluatePie(str);
      expect(output).toContain("6: Nat");
    });

    it("extracts both components and rebuilds pair", () => {
      const str = `
(claim rebuild
  (→ (Σ ((n Nat)) Atom) (Σ ((n Nat)) Atom)))
(define-tactically rebuild
  ((intro p)
   (split-Pair)
   (then (exact (car p)))
   (then (exact (cdr p)))))
(car (rebuild (cons 5 'x)))
(cdr (rebuild (cons 5 'x)))
`;
      const output = evaluatePie(str);
      expect(output).toContain("5: Nat");
      expect(output).toContain("'x: Atom");
    });

    it("swap components of existential pair", () => {
      const str = `
(claim swap-exists
  (→ (Σ ((n Nat)) Atom) (Σ ((a Atom)) Nat)))
(define-tactically swap-exists
  ((intro p)
   (split-Pair)
   (then (exact (cdr p)))
   (then (exact (car p)))))
(car (swap-exists (cons 3 'hi)))
(cdr (swap-exists (cons 3 'hi)))
`;
      const output = evaluatePie(str);
      expect(output).toContain("'hi: Atom");
      expect(output).toContain("3: Nat");
    });

    it("projects from deeply nested existential", () => {
      const str = `
(claim deep
  (Σ ((a Nat))
    (Σ ((b Nat))
      (Σ ((c Nat))
        Trivial))))
(define-tactically deep
  ((exists 1 a)
   (exists 2 b)
   (exists 3 c)
   (exact sole)))
(car deep)
(car (cdr deep))
(car (cdr (cdr deep)))
`;
      const output = evaluatePie(str);
      expect(output).toContain("1: Nat");
      expect(output).toContain("2: Nat");
      expect(output).toContain("3: Nat");
    });

    it("uses extracted witness as function argument", () => {
      const str = `
(claim f (→ Nat Nat))
(define f (λ (n) (add1 (add1 n))))

(claim my-exists
  (Σ ((n Nat)) (= Nat n 3)))
(define-tactically my-exists
  ((exists 3 n)
   (exact (same 3))))
(f (car my-exists))
`;
      const output = evaluatePie(str);
      expect(output).toContain("5: Nat");
    });

  });

  describe("Nested Quantifiers", () => {

    it("proves ∀A:U. ∀x:A. A (trivial universal)", () => {
      const str = `
(claim trivial-forall
  (Π ((A U) (x A))
    A))
(define-tactically trivial-forall
  ((intro A)
   (intro x)
   (exact x)))
(trivial-forall Nat 5)
`;
      const output = evaluatePie(str);
      expect(output).toContain("5: Nat");
    });

    it("proves ∀A B:U. A → B → A", () => {
      const str = `
(claim proj-first
  (Π ((A U) (B U))
    (→ A B A)))
(define-tactically proj-first
  ((intro A)
   (intro B)
   (intro a)
   (intro b)
   (exact a)))
`;
      expect(() => evaluatePie(str)).not.toThrow();
    });

    it("proves ∀A B:U. A → B → B", () => {
      const str = `
(claim proj-second
  (Π ((A U) (B U))
    (→ A B B)))
(define-tactically proj-second
  ((intro A)
   (intro B)
   (intro a)
   (intro b)
   (exact b)))
`;
      expect(() => evaluatePie(str)).not.toThrow();
    });

    it("proves ∀n:Nat. ∃m:Nat. m = add1(n)", () => {
      const str = `
(claim succ-exists
  (Π ((n Nat))
    (Σ ((m Nat))
      (= Nat m (add1 n)))))
(define-tactically succ-exists
  ((intro n)
   (exists (add1 n) m)
   (exact (same (add1 n)))))
(car (succ-exists 5))
`;
      const output = evaluatePie(str);
      expect(output).toContain("6: Nat");
    });

    it("proves ∀n m:Nat. n=m → add1(n)=add1(m)", () => {
      const str = `
(claim + (→ Nat Nat Nat))
(define + (λ (n j) (iter-Nat n j (λ (x) (add1 x)))))

(claim cong-succ
  (Π ((n Nat) (m Nat))
    (→ (= Nat n m)
       (= Nat (add1 n) (add1 m)))))
(define-tactically cong-succ
  ((intro n)
   (intro m)
   (intro eq)
   (exact (cong eq (+ 1)))))
(cong-succ 3 3 (same 3))
`;
      const output = evaluatePie(str);
      expect(output).toContain("(same 4)");
    });

    it("proves ∀A:U. ∀x:A. ∃y:A. x=y", () => {
      const str = `
(claim forall-exists-eq
  (Π ((A U) (x A))
    (Σ ((y A))
      (= A x y))))
(define-tactically forall-exists-eq
  ((intro A)
   (intro x)
   (exists x y)
   (exact (same x))))
`;
      expect(() => evaluatePie(str)).not.toThrow();
    });

    it("proves ∀P:Nat→U. P(0) → ∃n:Nat. P(n)", () => {
      const str = `
(claim base-to-exists
  (Π ((P (→ Nat U)))
    (→ (P 0)
       (Σ ((n Nat)) (P n)))))
(define-tactically base-to-exists
  ((intro P)
   (intro p0)
   (exists 0 n)
   (exact p0)))
`;
      expect(() => evaluatePie(str)).not.toThrow();
    });

    it("proves ∀(A B:U). (Σ((x A))B) → A (first projection)", () => {
      const str = `
(claim fst
  (Π ((A U) (B U))
    (→ (Σ ((x A)) B) A)))
(define-tactically fst
  ((intro A)
   (intro B)
   (intro p)
   (exact (car p))))
(fst Nat Atom (cons 5 'x))
`;
      const output = evaluatePie(str);
      expect(output).toContain("5: Nat");
    });

    it("proves ∀(A B:U). (Σ((x A))B) → B (second projection, non-dependent)", () => {
      const str = `
(claim snd
  (→ (Σ ((x Nat)) Atom) Atom))
(define-tactically snd
  ((intro p)
   (exact (cdr p))))
(snd (cons 5 'hello))
`;
      const output = evaluatePie(str);
      expect(output).toContain("'hello: Atom");
    });

    it("proves ∀n:Nat. ∃m:Nat. ∃k:Nat. m+k = n with m=0, k=n", () => {
      const str = `
(claim + (→ Nat Nat Nat))
(define + (λ (n j) (iter-Nat n j (λ (x) (add1 x)))))

(claim decompose
  (Π ((n Nat))
    (Σ ((m Nat))
      (Σ ((k Nat))
        (= Nat (+ m k) n)))))
(define-tactically decompose
  ((intro n)
   (exists 0 m)
   (exists n k)
   (exact (same n))))
(car (decompose 5))
(car (cdr (decompose 5)))
`;
      const output = evaluatePie(str);
      expect(output).toContain("0: Nat");
      expect(output).toContain("5: Nat");
    });

    it("proves ∀A:U. (∀x:A. Trivial)", () => {
      const str = `
(claim all-trivial
  (Π ((A U) (x A))
    Trivial))
(define-tactically all-trivial
  ((intro A)
   (intro x)
   (exact sole)))
`;
      expect(() => evaluatePie(str)).not.toThrow();
    });

    it("proves instantiation: (∀x:Nat. P(x)) → P(5)", () => {
      const str = `
(claim instantiate
  (Π ((P (→ Nat U)))
    (→ (Π ((x Nat)) (P x))
       (P 5))))
(define-tactically instantiate
  ((intro P)
   (intro forall-p)
   (exact (forall-p 5))))
`;
      expect(() => evaluatePie(str)).not.toThrow();
    });

  });

  describe("Error Cases", () => {

    it("exists on non-Σ type should fail", () => {
      const str = `
(claim bad-exists Nat)
(define-tactically bad-exists
  ((exists 5 n)
   (exact (same 5))))
`;
      expect(() => evaluatePie(str)).toThrow();
    });

    it("incomplete universal proof should fail", () => {
      const str = `
(claim bad-forall
  (Π ((n Nat))
    (= Nat n n)))
(define-tactically bad-forall
  ((intro n)))
`;
      expect(() => evaluatePie(str)).toThrow(/incomplete/i);
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

    it("wrong witness type in exists should fail", () => {
      const str = `
(claim bad-witness
  (Σ ((n Nat))
    (= Nat n 5)))
(define-tactically bad-witness
  ((exists 'hello n)
   (exact (same 5))))
`;
      expect(() => evaluatePie(str)).toThrow();
    });

  });

});
