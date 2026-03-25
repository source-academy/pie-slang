import 'jest';
import { evaluatePie } from '../../main';

describe("Quantifiers and Predicates", () => {

  describe("Universal Quantification (Pi)", () => {

    it("proves forall n:Nat. n = n (reflexivity)", () => {
      const str = `
(claim forall-refl
  (Pi ((n Nat))
    (= Nat n n)))
(define-tactically forall-refl
  ((intro n)
   (exact (same n))))
(claim forall-refl-at-0 (= (= Nat 0 0) (forall-refl 0) (same 0)))
(define-tactically forall-refl-at-0
  ((exact (same (same 0)))))
(claim forall-refl-at-7 (= (= Nat 7 7) (forall-refl 7) (same 7)))
(define-tactically forall-refl-at-7
  ((exact (same (same 7)))))
`;
      expect(() => evaluatePie(str)).not.toThrow();
    });

    it("proves forall a:Atom. a = a (reflexivity for Atom)", () => {
      const str = `
(claim forall-refl-atom
  (Pi ((a Atom))
    (= Atom a a)))
(define-tactically forall-refl-atom
  ((intro a)
   (exact (same a))))
`;
      expect(() => evaluatePie(str)).not.toThrow();
    });

    it("proves forall n:Nat. Trivial", () => {
      const str = `
(claim forall-trivial
  (Pi ((n Nat))
    Trivial))
(define-tactically forall-trivial
  ((intro n)
   (exact sole)))
`;
      expect(() => evaluatePie(str)).not.toThrow();
    });

    it("proves forall A:U. A -> A (polymorphic identity)", () => {
      const str = `
(claim forall-id
  (Pi ((A U))
    (-> A A)))
(define-tactically forall-id
  ((intro A)
   (intro a)
   (exact a)))
(claim forall-id-nat-42 (= Nat (forall-id Nat 42) 42))
(define-tactically forall-id-nat-42
  ((exact (same 42))))
`;
      expect(() => evaluatePie(str)).not.toThrow();
    });

    it("proves forall n:Nat. add1(n) = add1(n)", () => {
      const str = `
(claim forall-succ-refl
  (Pi ((n Nat))
    (= Nat (add1 n) (add1 n))))
(define-tactically forall-succ-refl
  ((intro n)
   (exact (same (add1 n)))))
`;
      expect(() => evaluatePie(str)).not.toThrow();
    });

    it("proves forall n:Nat. exists m:Nat. m = n (existence from universal)", () => {
      const str = `
(claim forall-to-exists
  (Pi ((n Nat))
    (Sigma ((m Nat))
      (= Nat m n))))
(define-tactically forall-to-exists
  ((intro n)
   (exists n witness)
   (exact (same n))))
(claim car-forall-to-exists-5 (= Nat (car (forall-to-exists 5)) 5))
(define-tactically car-forall-to-exists-5
  ((exact (same 5))))
`;
      expect(() => evaluatePie(str)).not.toThrow();
    });

    it("proves forall n m:Nat. n = m -> m = n (symmetry)", () => {
      const str = `
(claim forall-symm
  (Pi ((n Nat) (m Nat))
    (-> (= Nat n m) (= Nat m n))))
(define-tactically forall-symm
  ((intro n)
   (intro m)
   (intro eq)
   (symm)
   (exact eq)))
`;
      expect(() => evaluatePie(str)).not.toThrow();
    });

    it("proves forall n:Nat. (Either (= Nat n n) Absurd)", () => {
      const str = `
(claim forall-either-refl
  (Pi ((n Nat))
    (Either (= Nat n n) Absurd)))
(define-tactically forall-either-refl
  ((intro n)
   (go-Left)
   (exact (same n))))
`;
      expect(() => evaluatePie(str)).not.toThrow();
    });

    it("proves forall (A:U)(B:U). A -> B -> A (K combinator)", () => {
      const str = `
(claim K
  (Pi ((A U) (B U))
    (-> A B A)))
(define-tactically K
  ((intro A)
   (intro B)
   (intro a)
   (intro b)
   (exact a)))
(claim K-nat-atom-7 (= Nat (K Nat Atom 7 'ignored) 7))
(define-tactically K-nat-atom-7
  ((exact (same 7))))
`;
      expect(() => evaluatePie(str)).not.toThrow();
    });

    it("proves forall n:Nat. n+0=n using induction", () => {
      const str = `
(claim + (-> Nat Nat Nat))
(define + (lambda (n j) (iter-Nat n j (lambda (x) (add1 x)))))

(claim right-zero
  (Pi ((n Nat))
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
(claim right-zero-at-0 (= (= Nat 0 0) (right-zero 0) (same 0)))
(define-tactically right-zero-at-0
  ((exact (same (same 0)))))
(claim right-zero-at-3 (= (= Nat 3 3) (right-zero 3) (same 3)))
(define-tactically right-zero-at-3
  ((exact (same (same 3)))))
`;
      expect(() => evaluatePie(str)).not.toThrow();
    });

    it("proves forall n:Nat. 0+n=n (trivially by reduction)", () => {
      const str = `
(claim + (-> Nat Nat Nat))
(define + (lambda (n j) (iter-Nat n j (lambda (x) (add1 x)))))

(claim left-zero
  (Pi ((n Nat))
    (= Nat (+ 0 n) n)))
(define-tactically left-zero
  ((intro n)
   (exact (same n))))
(claim left-zero-at-5 (= (= Nat 5 5) (left-zero 5) (same 5)))
(define-tactically left-zero-at-5
  ((exact (same (same 5)))))
`;
      expect(() => evaluatePie(str)).not.toThrow();
    });

    it("proves forall n:Nat. 1+n = add1(n)", () => {
      const str = `
(claim + (-> Nat Nat Nat))
(define + (lambda (n j) (iter-Nat n j (lambda (x) (add1 x)))))

(claim one-plus
  (Pi ((n Nat))
    (= Nat (+ 1 n) (add1 n))))
(define-tactically one-plus
  ((intro n)
   (exact (same (add1 n)))))
(claim one-plus-at-4 (= (= Nat 5 5) (one-plus 4) (same 5)))
(define-tactically one-plus-at-4
  ((exact (same (same 5)))))
`;
      expect(() => evaluatePie(str)).not.toThrow();
    });

  });

  describe("Existential Quantification (Sigma)", () => {

    it("proves exists n:Nat. n = 0 with witness 0", () => {
      const str = `
(claim exists-zero
  (Sigma ((n Nat))
    (= Nat n 0)))
(define-tactically exists-zero
  ((exists 0 n)
   (exact (same 0))))
(claim car-exists-zero (= Nat (car exists-zero) 0))
(define-tactically car-exists-zero
  ((exact (same 0))))
`;
      expect(() => evaluatePie(str)).not.toThrow();
    });

    it("proves exists n:Nat. n = 5 with witness 5", () => {
      const str = `
(claim exists-five
  (Sigma ((n Nat))
    (= Nat n 5)))
(define-tactically exists-five
  ((exists 5 n)
   (exact (same 5))))
(claim car-exists-five (= Nat (car exists-five) 5))
(define-tactically car-exists-five
  ((exact (same 5))))
`;
      expect(() => evaluatePie(str)).not.toThrow();
    });

    it("proves exists n:Nat. n = n with witness 42", () => {
      const str = `
(claim exists-refl
  (Sigma ((n Nat))
    (= Nat n n)))
(define-tactically exists-refl
  ((exists 42 n)
   (exact (same 42))))
(claim car-exists-refl (= Nat (car exists-refl) 42))
(define-tactically car-exists-refl
  ((exact (same 42))))
`;
      expect(() => evaluatePie(str)).not.toThrow();
    });

    it("proves existential with Atom witness", () => {
      const str = `
(claim exists-atom
  (Sigma ((a Atom))
    (= Atom a 'hello)))
(define-tactically exists-atom
  ((exists 'hello a)
   (exact (same 'hello))))
(claim car-exists-atom (= Atom (car exists-atom) 'hello))
(define-tactically car-exists-atom
  ((exact (same 'hello))))
`;
      expect(() => evaluatePie(str)).not.toThrow();
    });

    it("proves exists n:Nat. (add1 n) = 3 with witness 2", () => {
      const str = `
(claim exists-pred
  (Sigma ((n Nat))
    (= Nat (add1 n) 3)))
(define-tactically exists-pred
  ((exists 2 n)
   (exact (same 3))))
(claim car-exists-pred (= Nat (car exists-pred) 2))
(define-tactically car-exists-pred
  ((exact (same 2))))
`;
      expect(() => evaluatePie(str)).not.toThrow();
    });

    it("proves nested existential: exists n. exists m. add1(n)=m", () => {
      const str = `
(claim nested-exists
  (Sigma ((n Nat))
    (Sigma ((m Nat))
      (= Nat (add1 n) m))))
(define-tactically nested-exists
  ((exists 3 n)
   (exists 4 m)
   (exact (same 4))))
(claim car-nested-exists (= Nat (car nested-exists) 3))
(define-tactically car-nested-exists
  ((exact (same 3))))
(claim car-cdr-nested-exists (= Nat (car (cdr nested-exists)) 4))
(define-tactically car-cdr-nested-exists
  ((exact (same 4))))
`;
      expect(() => evaluatePie(str)).not.toThrow();
    });

    it("proves existential with Trivial", () => {
      const str = `
(claim exists-triv
  (Sigma ((t Trivial))
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
  (Sigma ((n Nat)) Atom))
(define-tactically pair-via-split
  ((split-Pair)
   (then (exact 10))
   (then (exact 'ten))))
(claim car-pair-via-split (= Nat (car pair-via-split) 10))
(define-tactically car-pair-via-split
  ((exact (same 10))))
(claim cdr-pair-via-split (= Atom (cdr pair-via-split) 'ten))
(define-tactically cdr-pair-via-split
  ((exact (same 'ten))))
`;
      expect(() => evaluatePie(str)).not.toThrow();
    });

    it("proves exists n:Nat. exists m:Nat. n=m with same witness", () => {
      const str = `
(claim exists-eq
  (Sigma ((n Nat))
    (Sigma ((m Nat))
      (= Nat n m))))
(define-tactically exists-eq
  ((exists 7 n)
   (exists 7 m)
   (exact (same 7))))
(claim car-exists-eq (= Nat (car exists-eq) 7))
(define-tactically car-exists-eq
  ((exact (same 7))))
(claim car-cdr-exists-eq (= Nat (car (cdr exists-eq)) 7))
(define-tactically car-cdr-exists-eq
  ((exact (same 7))))
`;
      expect(() => evaluatePie(str)).not.toThrow();
    });

    it("proves existential with computed witness", () => {
      const str = `
(claim + (-> Nat Nat Nat))
(define + (lambda (n j) (iter-Nat n j (lambda (x) (add1 x)))))

(claim exists-sum
  (Sigma ((n Nat))
    (= Nat n (+ 2 3))))
(define-tactically exists-sum
  ((exists 5 n)
   (exact (same 5))))
(claim car-exists-sum (= Nat (car exists-sum) 5))
(define-tactically car-exists-sum
  ((exact (same 5))))
`;
      expect(() => evaluatePie(str)).not.toThrow();
    });

    it("proves existential with Either type in predicate", () => {
      const str = `
(claim exists-either
  (Sigma ((n Nat))
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
  (Sigma ((n Nat))
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
  (Sigma ((n Nat)) (= Nat n 10)))
(define-tactically my-exists
  ((exists 10 n)
   (exact (same 10))))
(claim witness Nat)
(define witness (car my-exists))
(claim witness-is-10 (= Nat witness 10))
(define-tactically witness-is-10
  ((exact (same 10))))
`;
      expect(() => evaluatePie(str)).not.toThrow();
    });

    it("extracts proof from existential using cdr", () => {
      const str = `
(claim my-exists
  (Sigma ((n Nat)) (= Nat n 5)))
(define-tactically my-exists
  ((exists 5 n)
   (exact (same 5))))
(claim cdr-my-exists (= (= Nat 5 5) (cdr my-exists) (same 5)))
(define-tactically cdr-my-exists
  ((exact (same (same 5)))))
`;
      expect(() => evaluatePie(str)).not.toThrow();
    });

    it("uses extracted witness in computation", () => {
      const str = `
(claim + (-> Nat Nat Nat))
(define + (lambda (n j) (iter-Nat n j (lambda (x) (add1 x)))))

(claim my-pair
  (Sigma ((n Nat)) Nat))
(define-tactically my-pair
  ((split-Pair)
   (then (exact 3))
   (then (exact 7))))
(claim sum-pair (= Nat (+ (car my-pair) (cdr my-pair)) 10))
(define-tactically sum-pair
  ((exact (same 10))))
`;
      expect(() => evaluatePie(str)).not.toThrow();
    });

    it("extracts from nested existential", () => {
      const str = `
(claim nested
  (Sigma ((n Nat))
    (Sigma ((m Nat))
      (= Nat n m))))
(define-tactically nested
  ((exists 4 n)
   (exists 4 m)
   (exact (same 4))))
(claim car-nested (= Nat (car nested) 4))
(define-tactically car-nested
  ((exact (same 4))))
(claim car-cdr-nested (= Nat (car (cdr nested)) 4))
(define-tactically car-cdr-nested
  ((exact (same 4))))
(claim cdr-cdr-nested (= (= Nat 4 4) (cdr (cdr nested)) (same 4)))
(define-tactically cdr-cdr-nested
  ((exact (same (same 4)))))
`;
      expect(() => evaluatePie(str)).not.toThrow();
    });

    it("extracts and uses witness from Atom existential", () => {
      const str = `
(claim atom-exists
  (Sigma ((a Atom)) Nat))
(define-tactically atom-exists
  ((split-Pair)
   (then (exact 'myatom))
   (then (exact 99))))
(claim car-atom-exists (= Atom (car atom-exists) 'myatom))
(define-tactically car-atom-exists
  ((exact (same 'myatom))))
(claim cdr-atom-exists (= Nat (cdr atom-exists) 99))
(define-tactically cdr-atom-exists
  ((exact (same 99))))
`;
      expect(() => evaluatePie(str)).not.toThrow();
    });

    it("maps over existential: transform witness", () => {
      const str = `
(claim exists-map
  (-> (Sigma ((n Nat)) (= Nat n n))
     (Sigma ((m Nat)) (= Nat m m))))
(define-tactically exists-map
  ((intro p)
   (exists (add1 (car p)) m)
   (exact (same (add1 (car p))))))
(claim car-exists-map-5 (= Nat (car (exists-map (cons 5 (same 5)))) 6))
(define-tactically car-exists-map-5
  ((exact (same 6))))
`;
      expect(() => evaluatePie(str)).not.toThrow();
    });

    it("extracts both components and rebuilds pair", () => {
      const str = `
(claim rebuild
  (-> (Sigma ((n Nat)) Atom) (Sigma ((n Nat)) Atom)))
(define-tactically rebuild
  ((intro p)
   (split-Pair)
   (then (exact (car p)))
   (then (exact (cdr p)))))
(claim car-rebuild-5-x (= Nat (car (rebuild (cons 5 'x))) 5))
(define-tactically car-rebuild-5-x
  ((exact (same 5))))
(claim cdr-rebuild-5-x (= Atom (cdr (rebuild (cons 5 'x))) 'x))
(define-tactically cdr-rebuild-5-x
  ((exact (same 'x))))
`;
      expect(() => evaluatePie(str)).not.toThrow();
    });

    it("swap components of existential pair", () => {
      const str = `
(claim swap-exists
  (-> (Sigma ((n Nat)) Atom) (Sigma ((a Atom)) Nat)))
(define-tactically swap-exists
  ((intro p)
   (split-Pair)
   (then (exact (cdr p)))
   (then (exact (car p)))))
(claim car-swap-3-hi (= Atom (car (swap-exists (cons 3 'hi))) 'hi))
(define-tactically car-swap-3-hi
  ((exact (same 'hi))))
(claim cdr-swap-3-hi (= Nat (cdr (swap-exists (cons 3 'hi))) 3))
(define-tactically cdr-swap-3-hi
  ((exact (same 3))))
`;
      expect(() => evaluatePie(str)).not.toThrow();
    });

    it("projects from deeply nested existential", () => {
      const str = `
(claim deep
  (Sigma ((a Nat))
    (Sigma ((b Nat))
      (Sigma ((c Nat))
        Trivial))))
(define-tactically deep
  ((exists 1 a)
   (exists 2 b)
   (exists 3 c)
   (exact sole)))
(claim car-deep (= Nat (car deep) 1))
(define-tactically car-deep
  ((exact (same 1))))
(claim car-cdr-deep (= Nat (car (cdr deep)) 2))
(define-tactically car-cdr-deep
  ((exact (same 2))))
(claim car-cdr-cdr-deep (= Nat (car (cdr (cdr deep))) 3))
(define-tactically car-cdr-cdr-deep
  ((exact (same 3))))
`;
      expect(() => evaluatePie(str)).not.toThrow();
    });

    it("uses extracted witness as function argument", () => {
      const str = `
(claim f (-> Nat Nat))
(define f (lambda (n) (add1 (add1 n))))

(claim my-exists
  (Sigma ((n Nat)) (= Nat n 3)))
(define-tactically my-exists
  ((exists 3 n)
   (exact (same 3))))
(claim f-car-my-exists (= Nat (f (car my-exists)) 5))
(define-tactically f-car-my-exists
  ((exact (same 5))))
`;
      expect(() => evaluatePie(str)).not.toThrow();
    });

  });

  describe("Nested Quantifiers", () => {

    it("proves forall A:U. forall x:A. A (trivial universal)", () => {
      const str = `
(claim trivial-forall
  (Pi ((A U) (x A))
    A))
(define-tactically trivial-forall
  ((intro A)
   (intro x)
   (exact x)))
(claim trivial-forall-nat-5 (= Nat (trivial-forall Nat 5) 5))
(define-tactically trivial-forall-nat-5
  ((exact (same 5))))
`;
      expect(() => evaluatePie(str)).not.toThrow();
    });

    it("proves forall A B:U. A -> B -> A", () => {
      const str = `
(claim proj-first
  (Pi ((A U) (B U))
    (-> A B A)))
(define-tactically proj-first
  ((intro A)
   (intro B)
   (intro a)
   (intro b)
   (exact a)))
`;
      expect(() => evaluatePie(str)).not.toThrow();
    });

    it("proves forall A B:U. A -> B -> B", () => {
      const str = `
(claim proj-second
  (Pi ((A U) (B U))
    (-> A B B)))
(define-tactically proj-second
  ((intro A)
   (intro B)
   (intro a)
   (intro b)
   (exact b)))
`;
      expect(() => evaluatePie(str)).not.toThrow();
    });

    it("proves forall n:Nat. exists m:Nat. m = add1(n)", () => {
      const str = `
(claim succ-exists
  (Pi ((n Nat))
    (Sigma ((m Nat))
      (= Nat m (add1 n)))))
(define-tactically succ-exists
  ((intro n)
   (exists (add1 n) m)
   (exact (same (add1 n)))))
(claim car-succ-exists-5 (= Nat (car (succ-exists 5)) 6))
(define-tactically car-succ-exists-5
  ((exact (same 6))))
`;
      expect(() => evaluatePie(str)).not.toThrow();
    });

    it("proves forall n m:Nat. n=m -> add1(n)=add1(m)", () => {
      const str = `
(claim + (-> Nat Nat Nat))
(define + (lambda (n j) (iter-Nat n j (lambda (x) (add1 x)))))

(claim cong-succ
  (Pi ((n Nat) (m Nat))
    (-> (= Nat n m)
       (= Nat (add1 n) (add1 m)))))
(define-tactically cong-succ
  ((intro n)
   (intro m)
   (intro eq)
   (cong eq (+ 1))))
(claim cong-succ-3-3 (= (= Nat 4 4) (cong-succ 3 3 (same 3)) (same 4)))
(define-tactically cong-succ-3-3
  ((exact (same (same 4)))))
`;
      expect(() => evaluatePie(str)).not.toThrow();
    });

    it("proves forall A:U. forall x:A. exists y:A. x=y", () => {
      const str = `
(claim forall-exists-eq
  (Pi ((A U) (x A))
    (Sigma ((y A))
      (= A x y))))
(define-tactically forall-exists-eq
  ((intro A)
   (intro x)
   (exists x y)
   (exact (same x))))
`;
      expect(() => evaluatePie(str)).not.toThrow();
    });

    it("proves forall P:Nat->U. P(0) -> exists n:Nat. P(n)", () => {
      const str = `
(claim base-to-exists
  (Pi ((P (-> Nat U)))
    (-> (P 0)
       (Sigma ((n Nat)) (P n)))))
(define-tactically base-to-exists
  ((intro P)
   (intro p0)
   (exists 0 n)
   (exact p0)))
`;
      expect(() => evaluatePie(str)).not.toThrow();
    });

    it("proves forall (A B:U). (Sigma((x A))B) -> A (first projection)", () => {
      const str = `
(claim fst
  (Pi ((A U) (B U))
    (-> (Sigma ((x A)) B) A)))
(define-tactically fst
  ((intro A)
   (intro B)
   (intro p)
   (exact (car p))))
(claim fst-nat-atom-5-x (= Nat (fst Nat Atom (cons 5 'x)) 5))
(define-tactically fst-nat-atom-5-x
  ((exact (same 5))))
`;
      expect(() => evaluatePie(str)).not.toThrow();
    });

    it("proves forall (A B:U). (Sigma((x A))B) -> B (second projection, non-dependent)", () => {
      const str = `
(claim snd
  (-> (Sigma ((x Nat)) Atom) Atom))
(define-tactically snd
  ((intro p)
   (exact (cdr p))))
(claim snd-5-hello (= Atom (snd (cons 5 'hello)) 'hello))
(define-tactically snd-5-hello
  ((exact (same 'hello))))
`;
      expect(() => evaluatePie(str)).not.toThrow();
    });

    it("proves forall n:Nat. exists m:Nat. exists k:Nat. m+k = n with m=0, k=n", () => {
      const str = `
(claim + (-> Nat Nat Nat))
(define + (lambda (n j) (iter-Nat n j (lambda (x) (add1 x)))))

(claim decompose
  (Pi ((n Nat))
    (Sigma ((m Nat))
      (Sigma ((k Nat))
        (= Nat (+ m k) n)))))
(define-tactically decompose
  ((intro n)
   (exists 0 m)
   (exists n k)
   (exact (same n))))
(claim car-decompose-5 (= Nat (car (decompose 5)) 0))
(define-tactically car-decompose-5
  ((exact (same 0))))
(claim car-cdr-decompose-5 (= Nat (car (cdr (decompose 5))) 5))
(define-tactically car-cdr-decompose-5
  ((exact (same 5))))
`;
      expect(() => evaluatePie(str)).not.toThrow();
    });

    it("proves forall A:U. (forall x:A. Trivial)", () => {
      const str = `
(claim all-trivial
  (Pi ((A U) (x A))
    Trivial))
(define-tactically all-trivial
  ((intro A)
   (intro x)
   (exact sole)))
`;
      expect(() => evaluatePie(str)).not.toThrow();
    });

    it("proves instantiation: (forall x:Nat. P(x)) -> P(5)", () => {
      const str = `
(claim instantiate
  (Pi ((P (-> Nat U)))
    (-> (Pi ((x Nat)) (P x))
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

    it("exists on non-Sigma type should fail", () => {
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
  (Pi ((n Nat))
    (= Nat n n)))
(define-tactically bad-forall
  ((intro n)))
`;
      expect(() => evaluatePie(str)).toThrow(/incomplete/i);
    });

    it("split-Pair on non-Sigma type should fail", () => {
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
  (Sigma ((n Nat))
    (= Nat n 5)))
(define-tactically bad-witness
  ((exists 'hello n)
   (exact (same 5))))
`;
      expect(() => evaluatePie(str)).toThrow();
    });

  });

});
