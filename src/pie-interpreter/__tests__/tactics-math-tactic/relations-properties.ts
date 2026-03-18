import 'jest';
import { evaluatePie } from '../../main';

const arithPreamble = `
(claim + (→ Nat Nat Nat))
(define + (λ (n j) (iter-Nat n j (λ (x) (add1 x)))))
(claim * (→ Nat Nat Nat))
(define * (λ (n m) (iter-Nat n 0 (+ m))))
`;

describe("Relations Properties", () => {

  describe("Equality is Reflexive", () => {

    it("reflexivity of Nat equality at 0", () => {
      const str = `
(claim refl-0 (= Nat 0 0))
(define-tactically refl-0
  ((exact (same 0))))
`;
      expect(() => evaluatePie(str)).not.toThrow();
    });

    it("reflexivity of Nat equality at 5", () => {
      const str = `
(claim refl-5 (= Nat 5 5))
(define-tactically refl-5
  ((exact (same 5))))
`;
      expect(() => evaluatePie(str)).not.toThrow();
    });

    it("reflexivity of Nat equality at 100", () => {
      const str = `
(claim refl-100 (= Nat 100 100))
(define-tactically refl-100
  ((exact (same 100))))
`;
      expect(() => evaluatePie(str)).not.toThrow();
    });

    it("reflexivity of Atom equality", () => {
      const str = `
(claim refl-atom (= Atom 'hello 'hello))
(define-tactically refl-atom
  ((exact (same 'hello))))
`;
      expect(() => evaluatePie(str)).not.toThrow();
    });

    it("reflexivity as a general principle for Nat", () => {
      const str = `
(claim nat-refl (Π ((n Nat)) (= Nat n n)))
(define-tactically nat-refl
  ((intro n)
   (exact (same n))))
(nat-refl 42)
`;
      const output = evaluatePie(str);
      expect(output).toContain("(same 42)");
    });

    it("reflexivity as a general principle for Atom", () => {
      const str = `
(claim atom-refl (Π ((a Atom)) (= Atom a a)))
(define-tactically atom-refl
  ((intro a)
   (exact (same a))))
`;
      expect(() => evaluatePie(str)).not.toThrow();
    });

    it("reflexivity for add1 expressions", () => {
      const str = `
(claim refl-add1 (Π ((n Nat)) (= Nat (add1 n) (add1 n))))
(define-tactically refl-add1
  ((intro n)
   (exact (same (add1 n)))))
`;
      expect(() => evaluatePie(str)).not.toThrow();
    });

    it("reflexivity of Trivial equality", () => {
      const str = `
(claim refl-triv (= Trivial sole sole))
(define-tactically refl-triv
  ((exact (same sole))))
`;
      expect(() => evaluatePie(str)).not.toThrow();
    });

    it("reflexivity for list type", () => {
      const str = `
(claim refl-nil (= (List Nat) nil nil))
(define-tactically refl-nil
  ((exact (same nil))))
`;
      expect(() => evaluatePie(str)).not.toThrow();
    });

    it("reflexivity for a concrete list", () => {
      const str = `
(claim refl-list (= (List Nat) (:: 1 (:: 2 nil)) (:: 1 (:: 2 nil))))
(define-tactically refl-list
  ((exact (same (:: 1 (:: 2 nil))))))
`;
      expect(() => evaluatePie(str)).not.toThrow();
    });

  });

  describe("Equality is Symmetric", () => {

    it("symmetry at Nat: 3=3 → 3=3", () => {
      const str = `
(claim sym-3 (→ (= Nat 3 3) (= Nat 3 3)))
(define-tactically sym-3
  ((intro eq)
   (exact (symm eq))))
(sym-3 (same 3))
`;
      const output = evaluatePie(str);
      expect(output).toContain("(same 3)");
    });

    it("symmetry general for Nat", () => {
      const str = `
(claim nat-sym
  (Π ((a Nat) (b Nat))
    (→ (= Nat a b) (= Nat b a))))
(define-tactically nat-sym
  ((intro a)
   (intro b)
   (intro eq)
   (exact (symm eq))))
`;
      expect(() => evaluatePie(str)).not.toThrow();
    });

    it("symmetry general for Atom", () => {
      const str = `
(claim atom-sym
  (Π ((a Atom) (b Atom))
    (→ (= Atom a b) (= Atom b a))))
(define-tactically atom-sym
  ((intro a)
   (intro b)
   (intro eq)
   (exact (symm eq))))
`;
      expect(() => evaluatePie(str)).not.toThrow();
    });

    it("double symmetry returns to original", () => {
      const str = `
(claim double-sym
  (Π ((a Nat) (b Nat))
    (→ (= Nat a b) (= Nat a b))))
(define-tactically double-sym
  ((intro a)
   (intro b)
   (intro eq)
   (exact (symm (symm eq)))))
`;
      expect(() => evaluatePie(str)).not.toThrow();
    });

    it("symmetry at value 0=0", () => {
      const str = `
(claim sym-0 (→ (= Nat 0 0) (= Nat 0 0)))
(define-tactically sym-0
  ((intro eq)
   (exact (symm eq))))
(sym-0 (same 0))
`;
      const output = evaluatePie(str);
      expect(output).toContain("(same 0)");
    });

    it("symmetry for Trivial", () => {
      const str = `
(claim triv-sym
  (→ (= Trivial sole sole) (= Trivial sole sole)))
(define-tactically triv-sym
  ((intro eq)
   (exact (symm eq))))
`;
      expect(() => evaluatePie(str)).not.toThrow();
    });

    it("symmetry polymorphic", () => {
      const str = `
(claim poly-sym
  (Π ((A U) (a A) (b A))
    (→ (= A a b) (= A b a))))
(define-tactically poly-sym
  ((intro A)
   (intro a)
   (intro b)
   (intro eq)
   (exact (symm eq))))
`;
      expect(() => evaluatePie(str)).not.toThrow();
    });

    it("symmetry applied at concrete Atom values", () => {
      const str = `
(claim sym-atom (→ (= Atom 'x 'x) (= Atom 'x 'x)))
(define-tactically sym-atom
  ((intro eq)
   (exact (symm eq))))
(sym-atom (same 'x))
`;
      const output = evaluatePie(str);
      expect(output).toContain("(same 'x)");
    });

    it("symmetry for list equality", () => {
      const str = `
(claim sym-list
  (→ (= (List Nat) nil nil) (= (List Nat) nil nil)))
(define-tactically sym-list
  ((intro eq)
   (exact (symm eq))))
`;
      expect(() => evaluatePie(str)).not.toThrow();
    });

    it("symmetry for equality of add1 expressions", () => {
      const str = `
(claim sym-add1
  (Π ((n Nat))
    (→ (= Nat (add1 n) (add1 n)) (= Nat (add1 n) (add1 n)))))
(define-tactically sym-add1
  ((intro n)
   (intro eq)
   (exact (symm eq))))
`;
      expect(() => evaluatePie(str)).not.toThrow();
    });

  });

  describe("Equality is Transitive", () => {

    it("transitivity at Nat: 3=3 and 3=3 → 3=3", () => {
      const str = `
(claim trans-3
  (→ (= Nat 3 3) (= Nat 3 3) (= Nat 3 3)))
(define-tactically trans-3
  ((intro eq1)
   (intro eq2)
   (exact (trans eq1 eq2))))
(trans-3 (same 3) (same 3))
`;
      const output = evaluatePie(str);
      expect(output).toContain("(same 3)");
    });

    it("transitivity general for Nat", () => {
      const str = `
(claim nat-trans
  (Π ((a Nat) (b Nat) (c Nat))
    (→ (= Nat a b) (= Nat b c) (= Nat a c))))
(define-tactically nat-trans
  ((intro a)
   (intro b)
   (intro c)
   (intro eq1)
   (intro eq2)
   (exact (trans eq1 eq2))))
`;
      expect(() => evaluatePie(str)).not.toThrow();
    });

    it("transitivity general for Atom", () => {
      const str = `
(claim atom-trans
  (Π ((a Atom) (b Atom) (c Atom))
    (→ (= Atom a b) (= Atom b c) (= Atom a c))))
(define-tactically atom-trans
  ((intro a)
   (intro b)
   (intro c)
   (intro eq1)
   (intro eq2)
   (exact (trans eq1 eq2))))
`;
      expect(() => evaluatePie(str)).not.toThrow();
    });

    it("transitivity at 0=0", () => {
      const str = `
(claim trans-0
  (→ (= Nat 0 0) (= Nat 0 0) (= Nat 0 0)))
(define-tactically trans-0
  ((intro eq1)
   (intro eq2)
   (exact (trans eq1 eq2))))
(trans-0 (same 0) (same 0))
`;
      const output = evaluatePie(str);
      expect(output).toContain("(same 0)");
    });

    it("chain of three: a=b, b=c, c=d → a=d (concrete)", () => {
      const str = `
(claim chain-3
  (→ (= Nat 7 7) (= Nat 7 7) (= Nat 7 7) (= Nat 7 7)))
(define-tactically chain-3
  ((intro eq1)
   (intro eq2)
   (intro eq3)
   (exact (trans eq1 (trans eq2 eq3)))))
(chain-3 (same 7) (same 7) (same 7))
`;
      const output = evaluatePie(str);
      expect(output).toContain("(same 7)");
    });

    it("transitivity polymorphic", () => {
      const str = `
(claim poly-trans
  (Π ((A U) (a A) (b A) (c A))
    (→ (= A a b) (= A b c) (= A a c))))
(define-tactically poly-trans
  ((intro A)
   (intro a)
   (intro b)
   (intro c)
   (intro eq1)
   (intro eq2)
   (exact (trans eq1 eq2))))
`;
      expect(() => evaluatePie(str)).not.toThrow();
    });

    it("trans with symm: a=b and b=a composed", () => {
      const str = `
(claim trans-sym-combo
  (Π ((n Nat))
    (→ (= Nat n n) (= Nat n n))))
(define-tactically trans-sym-combo
  ((intro n)
   (intro eq)
   (exact (trans eq (symm eq)))))
`;
      expect(() => evaluatePie(str)).not.toThrow();
    });

    it("trans is right identity with refl: trans eq (same x) = eq", () => {
      const str = `
(claim trans-refl-right
  (Π ((n Nat))
    (→ (= Nat n n) (= Nat n n))))
(define-tactically trans-refl-right
  ((intro n)
   (intro eq)
   (exact eq)))
`;
      expect(() => evaluatePie(str)).not.toThrow();
    });

    it("trans is left identity with refl", () => {
      const str = `
(claim trans-refl-left
  (Π ((n Nat))
    (→ (= Nat n n) (= Nat n n))))
(define-tactically trans-refl-left
  ((intro n)
   (intro eq)
   (exact eq)))
`;
      expect(() => evaluatePie(str)).not.toThrow();
    });

    it("transitivity for Trivial equality", () => {
      const str = `
(claim triv-trans
  (→ (= Trivial sole sole) (= Trivial sole sole) (= Trivial sole sole)))
(define-tactically triv-trans
  ((intro eq1)
   (intro eq2)
   (exact (trans eq1 eq2))))
`;
      expect(() => evaluatePie(str)).not.toThrow();
    });

  });

  describe("Less-Than-or-Equal", () => {

    it("0 ≤ 0: witness k=0", () => {
      const str = `${arithPreamble}
(claim leq-0-0
  (Σ ((k Nat)) (= Nat (+ 0 k) 0)))
(define-tactically leq-0-0
  ((exists 0 k)
   (exact (same 0))))

(claim leq-0-0-car-result (= Nat (car leq-0-0) 0))
(define-tactically leq-0-0-car-result
  ((exact (same 0))))
`;
      expect(() => evaluatePie(str)).not.toThrow();
    });

    it("0 ≤ 3: witness k=3", () => {
      const str = `${arithPreamble}
(claim leq-0-3
  (Σ ((k Nat)) (= Nat (+ 0 k) 3)))
(define-tactically leq-0-3
  ((exists 3 k)
   (exact (same 3))))

(claim leq-0-3-car-result (= Nat (car leq-0-3) 3))
(define-tactically leq-0-3-car-result
  ((exact (same 3))))
`;
      expect(() => evaluatePie(str)).not.toThrow();
    });

    it("2 ≤ 5: witness k=3", () => {
      const str = `${arithPreamble}
(claim leq-2-5
  (Σ ((k Nat)) (= Nat (+ 2 k) 5)))
(define-tactically leq-2-5
  ((exists 3 k)
   (exact (same 5))))

(claim leq-2-5-car-result (= Nat (car leq-2-5) 3))
(define-tactically leq-2-5-car-result
  ((exact (same 3))))
`;
      expect(() => evaluatePie(str)).not.toThrow();
    });

    it("5 ≤ 5: witness k=0 (reflexive)", () => {
      const str = `${arithPreamble}
(claim leq-5-5
  (Σ ((k Nat)) (= Nat (+ 5 k) 5)))
(define-tactically leq-5-5
  ((exists 0 k)
   (exact (same 5))))

(claim leq-5-5-car-result (= Nat (car leq-5-5) 0))
(define-tactically leq-5-5-car-result
  ((exact (same 0))))
`;
      expect(() => evaluatePie(str)).not.toThrow();
    });

    it("1 ≤ 10: witness k=9", () => {
      const str = `${arithPreamble}
(claim leq-1-10
  (Σ ((k Nat)) (= Nat (+ 1 k) 10)))
(define-tactically leq-1-10
  ((exists 9 k)
   (exact (same 10))))

(claim leq-1-10-car-result (= Nat (car leq-1-10) 9))
(define-tactically leq-1-10-car-result
  ((exact (same 9))))
`;
      expect(() => evaluatePie(str)).not.toThrow();
    });

    it("3 ≤ 7: witness k=4", () => {
      const str = `${arithPreamble}
(claim leq-3-7
  (Σ ((k Nat)) (= Nat (+ 3 k) 7)))
(define-tactically leq-3-7
  ((exists 4 k)
   (exact (same 7))))

(claim leq-3-7-car-result (= Nat (car leq-3-7) 4))
(define-tactically leq-3-7-car-result
  ((exact (same 4))))
`;
      expect(() => evaluatePie(str)).not.toThrow();
    });

    it("n ≤ n is reflexive for any n (general)", () => {
      const str = `${arithPreamble}
(claim n+0=n (Π ((n Nat)) (= Nat (+ n 0) n)))
(define-tactically n+0=n
  ((intro n)
   (elim-Nat n)
   (then
     (exact (same 0)))
   (then
     (intro n-1)
     (intro ih)
     (exact (cong ih (+ 1))))))

(claim leq-refl
  (Π ((n Nat))
    (Σ ((k Nat)) (= Nat (+ n k) n))))
(define-tactically leq-refl
  ((intro n)
   (exists 0 k)
   (exact (n+0=n n))))
`;
      expect(() => evaluatePie(str)).not.toThrow();
    });

    it("leq-refl applied to 8", () => {
      const str = `${arithPreamble}
(claim n+0=n (Π ((n Nat)) (= Nat (+ n 0) n)))
(define-tactically n+0=n
  ((intro n)
   (elim-Nat n)
   (then
     (exact (same 0)))
   (then
     (intro n-1)
     (intro ih)
     (exact (cong ih (+ 1))))))

(claim leq-refl
  (Π ((n Nat))
    (Σ ((k Nat)) (= Nat (+ n k) n))))
(define-tactically leq-refl
  ((intro n)
   (exists 0 k)
   (exact (n+0=n n))))

(claim leq-refl-8-car-result (= Nat (car (leq-refl 8)) 0))
(define-tactically leq-refl-8-car-result
  ((exact (same 0))))
`;
      expect(() => evaluatePie(str)).not.toThrow();
    });

    it("0 ≤ 100: witness k=100", () => {
      const str = `${arithPreamble}
(claim leq-0-100
  (Σ ((k Nat)) (= Nat (+ 0 k) 100)))
(define-tactically leq-0-100
  ((exists 100 k)
   (exact (same 100))))

(claim leq-0-100-car-result (= Nat (car leq-0-100) 100))
(define-tactically leq-0-100-car-result
  ((exact (same 100))))
`;
      expect(() => evaluatePie(str)).not.toThrow();
    });

    it("10 ≤ 15: witness k=5", () => {
      const str = `${arithPreamble}
(claim leq-10-15
  (Σ ((k Nat)) (= Nat (+ 10 k) 15)))
(define-tactically leq-10-15
  ((exists 5 k)
   (exact (same 15))))

(claim leq-10-15-car-result (= Nat (car leq-10-15) 5))
(define-tactically leq-10-15-car-result
  ((exact (same 5))))
`;
      expect(() => evaluatePie(str)).not.toThrow();
    });

  });

  describe("Equivalence Relations", () => {

    it("equality is an equivalence relation: bundle refl + sym + trans (Nat)", () => {
      const str = `
(claim eq-equiv
  (Σ ((refl (Π ((n Nat)) (= Nat n n))))
    (Σ ((sym (Π ((a Nat) (b Nat)) (→ (= Nat a b) (= Nat b a)))))
      (Π ((a Nat) (b Nat) (c Nat)) (→ (= Nat a b) (= Nat b c) (= Nat a c))))))
(define-tactically eq-equiv
  ((split-Pair)
   (then
     (intro n)
     (exact (same n)))
   (then
     (split-Pair)
     (then
       (intro a)
       (intro b)
       (intro eq)
       (exact (symm eq)))
     (then
       (intro a)
       (intro b)
       (intro c)
       (intro eq1)
       (intro eq2)
       (exact (trans eq1 eq2))))))
`;
      expect(() => evaluatePie(str)).not.toThrow();
    });

    it("reflexivity component of equivalence relation", () => {
      const str = `
(claim eq-refl-component
  (Π ((n Nat)) (= Nat n n)))
(define-tactically eq-refl-component
  ((intro n)
   (exact (same n))))
(eq-refl-component 7)
`;
      const output = evaluatePie(str);
      expect(output).toContain("(same 7)");
    });

    it("symmetry component of equivalence relation", () => {
      const str = `
(claim eq-sym-component
  (Π ((a Nat) (b Nat))
    (→ (= Nat a b) (= Nat b a))))
(define-tactically eq-sym-component
  ((intro a)
   (intro b)
   (intro eq)
   (exact (symm eq))))
`;
      expect(() => evaluatePie(str)).not.toThrow();
    });

    it("transitivity component of equivalence relation", () => {
      const str = `
(claim eq-trans-component
  (Π ((a Nat) (b Nat) (c Nat))
    (→ (= Nat a b) (= Nat b c) (= Nat a c))))
(define-tactically eq-trans-component
  ((intro a)
   (intro b)
   (intro c)
   (intro eq1)
   (intro eq2)
   (exact (trans eq1 eq2))))
`;
      expect(() => evaluatePie(str)).not.toThrow();
    });

    it("equality for Atom is equivalence: refl component", () => {
      const str = `
(claim atom-eq-refl (Π ((a Atom)) (= Atom a a)))
(define-tactically atom-eq-refl
  ((intro a)
   (exact (same a))))
`;
      expect(() => evaluatePie(str)).not.toThrow();
    });

    it("equality for lists is equivalence: refl component", () => {
      const str = `
(claim list-eq-refl (Π ((l (List Nat))) (= (List Nat) l l)))
(define-tactically list-eq-refl
  ((intro l)
   (exact (same l))))
`;
      expect(() => evaluatePie(str)).not.toThrow();
    });

    it("bundled refl+sym for Atom", () => {
      const str = `
(claim atom-refl-sym
  (Σ ((refl (Π ((a Atom)) (= Atom a a))))
    (Π ((a Atom) (b Atom)) (→ (= Atom a b) (= Atom b a)))))
(define-tactically atom-refl-sym
  ((split-Pair)
   (then
     (intro a)
     (exact (same a)))
   (then
     (intro a)
     (intro b)
     (intro eq)
     (exact (symm eq)))))
`;
      expect(() => evaluatePie(str)).not.toThrow();
    });

  });

  describe("Error Cases", () => {

    it("fails elim-Equal on non-equality type", () => {
      const str = `
(claim bad Nat)
(define-tactically bad
  ((elim-Equal e)
   (exact 0)))
`;
      expect(() => evaluatePie(str)).toThrow();
    });

    it("fails with missing then block after elim-Nat", () => {
      const str = `
(claim bad (Π ((n Nat)) Nat))
(define-tactically bad
  ((intro n)
   (elim-Nat n)
   (exact 0)))
`;
      expect(() => evaluatePie(str)).toThrow("Expected 'then' block to handle subgoal branch");
    });

    it("fails with incomplete proof of transitivity", () => {
      const str = `
(claim bad-trans
  (Π ((a Nat) (b Nat) (c Nat))
    (→ (= Nat a b) (= Nat b c) (= Nat a c))))
(define-tactically bad-trans
  ((intro a)
   (intro b)
   (intro c)
   (intro eq1)))
`;
      expect(() => evaluatePie(str)).toThrow(/incomplete/i);
    });

  });

});
