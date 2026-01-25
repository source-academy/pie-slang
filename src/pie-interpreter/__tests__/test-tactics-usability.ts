import 'jest';
import { evaluatePie } from '../main';

/**
 * These tests verify that terms defined using tactics are actually usable
 * in subsequent computations. This is the key feature that was missing before
 * the proof term extraction implementation.
 */

describe("Tactic Usability Tests", () => {

  describe("IntroTactic + ExactTactic", () => {
    
    it("proves identity function and uses it", () => {
      const str = `
(claim identity
  (Π ((A U) (x A))
    A))

(define-tactically identity
  ((intro A)
   (intro x)
   (exact x)))

;; Use the tactically-defined identity function
(identity Nat 5)
`;
      const output = evaluatePie(str);
      expect(output).toContain("identity");
      expect(output).toContain("5: Nat");
    });

    it("proves simple equality and uses it", () => {
      const str = `
(claim +
  (→ Nat Nat Nat))

(define +
  (λ (n j)
    (iter-Nat n j (λ (x) (add1 x)))))

(claim +1=add1
  (Π ((n Nat))
    (= Nat (+ 1 n) (add1 n))))

(define-tactically +1=add1
  ((intro n)
   (exact (same (add1 n)))))

;; Use the proof with symm to show the other direction
(claim add1=+1
  (Π ((n Nat))
    (= Nat (add1 n) (+ 1 n))))

(define add1=+1
  (λ (n)
    (symm (+1=add1 n))))

(+1=add1 5)
(add1=+1 5)
`;
      const output = evaluatePie(str);
      expect(output).toContain("+1=add1");
      expect(output).toContain("add1=+1");
      expect(output).toContain("(same 6)");
    });
  });

  describe("EliminateNatTactic", () => {
    
    it("proves n=n using ind-Nat and uses it", () => {
      const str = `
(claim n=n
  (Π ((n Nat))
    (= Nat n n)))

(define-tactically n=n
  ((intro n)
   (elim-Nat n)
   (then
     (exact (same zero)))
   (then
     (intro n-1)
     (intro ih)
     (exact (same (add1 n-1))))))

;; Use n=n to prove symmetry is trivial for reflexive proofs
(claim symm-refl
  (Π ((n Nat))
    (= Nat n n)))

(define symm-refl
  (λ (n)
    (symm (n=n n))))

;; Verify the proof works for specific values
(n=n 0)
(n=n 5)
`;
      const output = evaluatePie(str);
      expect(output).toContain("n=n");
      expect(output).toContain("symm-refl");
      expect(output).toContain("(same 0)");
      expect(output).toContain("(same 5)");
    });

    it("proves 0+n=n using ind-Nat and uses it", () => {
      const str = `
(claim +
  (→ Nat Nat Nat))

(define +
  (λ (n j)
    (iter-Nat n j (λ (x) (add1 x)))))

(claim 0+n=n
  (Π ((n Nat))
    (= Nat (+ 0 n) n)))

(define-tactically 0+n=n
  ((intro n)
   (exact (same n))))

;; Use it to derive (+ 0 (+ 0 n)) = n
(claim 0+0+n=n
  (Π ((n Nat))
    (= Nat (+ 0 (+ 0 n)) n)))

(define 0+0+n=n
  (λ (n)
    (trans (0+n=n (+ 0 n)) (0+n=n n))))

(0+n=n 3)
(0+0+n=n 3)
`;
      const output = evaluatePie(str);
      expect(output).toContain("0+n=n");
      expect(output).toContain("0+0+n=n");
      expect(output).toContain("(same 3)");
    });
  });

  describe("ExistsTactic", () => {
    
    it("proves existential and uses car/cdr on it", () => {
      const str = `
(claim exists-nat
  (Σ ((n Nat))
    (= Nat n n)))

(define-tactically exists-nat
  ((exists 5 witness)
   (exact (same 5))))

;; Extract the witness and proof
(car exists-nat)
(cdr exists-nat)
`;
      const output = evaluatePie(str);
      expect(output).toContain("exists-nat");
      expect(output).toContain("5: Nat");
      expect(output).toContain("(same 5)");
    });

    it("proves nested existential", () => {
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
      expect(output).toContain("nested-exists");
      expect(output).toContain("3: Nat");
      expect(output).toContain("4: Nat");
    });
  });

  describe("LeftTactic and RightTactic", () => {
    
    it("proves Either and eliminates it", () => {
      const str = `
(claim left-nat
  (Either Nat Atom))

(define-tactically left-nat
  ((go-Left)
   (exact 42)))

(claim right-atom
  (Either Nat Atom))

(define-tactically right-atom
  ((go-Right)
   (exact 'hello)))

;; Use ind-Either on the tactically-defined values
(claim extract-left
  (→ (Either Nat Atom) Nat))

(define extract-left
  (λ (e)
    (ind-Either e
      (λ (x) Nat)
      (λ (n) n)
      (λ (a) 0))))

(extract-left left-nat)
(extract-left right-atom)
`;
      const output = evaluatePie(str);
      expect(output).toContain("left-nat");
      expect(output).toContain("right-atom");
      expect(output).toContain("42: Nat");
      expect(output).toContain("0: Nat");
    });
  });

  describe("SpiltTactic (split-Pair)", () => {
    
    it("proves pair and uses components", () => {
      const str = `
(claim pair-proof
  (Σ ((x Nat))
    Nat))

(define-tactically pair-proof
  ((split-Pair)
   (then (exact 10))
   (then (exact 20))))

(car pair-proof)
(cdr pair-proof)
`;
      const output = evaluatePie(str);
      expect(output).toContain("pair-proof");
      expect(output).toContain("10: Nat");
      expect(output).toContain("20: Nat");
    });
  });

  describe("EliminateListTactic", () => {
    
    it("proves property about lists and uses it", () => {
      const str = `
(claim list-length-type
  (Π ((E U) (xs (List E)))
    Nat))

(define-tactically list-length-type
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

;; Use it on actual lists
(list-length-type Nat nil)
(list-length-type Nat (:: 1 nil))
(list-length-type Nat (:: 1 (:: 2 (:: 3 nil))))
`;
      const output = evaluatePie(str);
      expect(output).toContain("list-length-type");
      expect(output).toContain("0: Nat");
      expect(output).toContain("1: Nat");
      expect(output).toContain("3: Nat");
    });
  });

  describe("EliminateEitherTactic", () => {
    
    it("proves and uses Either elimination", () => {
      const str = `
;; Simple Either elimination test
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

;; Test it
(either-to-nat (left 42))
(either-to-nat (right 'hello))
`;
      const output = evaluatePie(str);
      expect(output).toContain("either-to-nat");
      expect(output).toContain("42: Nat");
      expect(output).toContain("0: Nat");
    });

    it("proves complex Either elimination with induction", () => {
      const str = `
(claim +
  (→ Nat Nat Nat))

(define +
  (λ (n j)
    (iter-Nat n j (λ (x) (add1 x)))))

;; Either analysis using tactics with nested elim-Nat and elim-Either
(claim add-either
  (Π ((e (Either Nat Nat)))
    Nat))

(define-tactically add-either
  ((intro e)
   (elim-Either e)
   (then
     (intro l)
     (elim-Nat l)
     (then (exact 0))
     (then (intro n-1) (intro ih) (exact (add1 ih))))
   (then
     (intro r)
     (elim-Nat r)
     (then (exact 100))
     (then (intro n-1) (intro ih) (exact (add1 ih))))))

(add-either (left 5))
(add-either (right 3))
`;
      const output = evaluatePie(str);
      expect(output).toContain("add-either");
      expect(output).toContain("5: Nat");
      expect(output).toContain("103: Nat");
    });
  });

  describe("ApplyTactic", () => {
    
    it("proves goal using apply tactic and uses result", () => {
      const str = `
(claim f
  (→ Nat Nat))

(define f
  (λ (n) (add1 n)))

(claim has-successor
  (Π ((n Nat))
    Nat))

(define-tactically has-successor
  ((intro n)
   (apply f)
   (exact n)))

(has-successor 5)
(has-successor 10)
`;
      const output = evaluatePie(str);
      expect(output).toContain("has-successor");
      expect(output).toContain("6: Nat");
      expect(output).toContain("11: Nat");
    });
  });

  describe("Combined Tactics - Complex Proofs", () => {
    
    it("proves commutativity of addition at zero", () => {
      const str = `
(claim +
  (→ Nat Nat Nat))

(define +
  (λ (n j)
    (iter-Nat n j (λ (x) (add1 x)))))

(claim +-comm-zero
  (Π ((n Nat))
    (= Nat (+ n 0) (+ 0 n))))

(define-tactically +-comm-zero
  ((intro n)
   (elim-Nat n)
   (then
     (exact (same 0)))
   (then
     (intro n-1)
     (intro ih)
     (exact (cong ih (+ 1))))))

;; Use the proof
(+-comm-zero 0)
(+-comm-zero 3)
`;
      const output = evaluatePie(str);
      expect(output).toContain("+-comm-zero");
      expect(output).toContain("(same 0)");
      expect(output).toContain("(same 3)");
    });

    it("proves and uses function that depends on tactic proof", () => {
      const str = `
(claim +
  (→ Nat Nat Nat))

(define +
  (λ (n j)
    (iter-Nat n j (λ (x) (add1 x)))))

(claim +-assoc-type
  (Π ((a Nat) (b Nat) (c Nat))
    U))

(define +-assoc-type
  (λ (a b c)
    (= Nat (+ (+ a b) c) (+ a (+ b c)))))

(claim +-right-zero
  (Π ((n Nat))
    (= Nat (+ n 0) n)))

(define-tactically +-right-zero
  ((intro n)
   (elim-Nat n)
   (then
     (exact (same 0)))
   (then
     (intro n-1)
     (intro ih)
     (exact (cong ih (+ 1))))))

;; Use it in another proof
(claim simplify-with-zero
  (Π ((n Nat) (m Nat))
    (= Nat (+ n 0) n)))

(define simplify-with-zero
  (λ (n m)
    (+-right-zero n)))

(+-right-zero 5)
(simplify-with-zero 3 10)
`;
      const output = evaluatePie(str);
      expect(output).toContain("+-right-zero");
      expect(output).toContain("simplify-with-zero");
      expect(output).toContain("(same 5)");
      expect(output).toContain("(same 3)");
    });
  });

  describe("EliminateEqualTactic (ind-=)", () => {
    
    it("proves using equality elimination and uses it", () => {
      const str = `
(claim +
  (→ Nat Nat Nat))

(define +
  (λ (n j)
    (iter-Nat n j (λ (x) (add1 x)))))

(claim incr
  (→ Nat Nat))

(define incr
  (λ (n)
    (iter-Nat n 1 (+ 1))))

(claim incr=add1
  (Π ((n Nat))
    (= Nat (incr n) (add1 n))))

(claim base-incr=add1
  (= Nat (incr zero) (add1 zero)))

(define base-incr=add1
  (same (add1 zero)))

(claim mot-incr=add1
  (→ Nat U))

(define mot-incr=add1
  (λ (k)
    (= Nat (incr k) (add1 k))))

(claim step-incr=add1
  (Π ((n-1 Nat))
    (→ (= Nat (incr n-1) (add1 n-1))
      (= Nat (add1 (incr n-1)) (add1 (add1 n-1))))))

(define-tactically step-incr=add1
  ((intro n-1)
   (intro incr=add1n-1)
   (elim-Equal incr=add1n-1 (λ (x)
     (λ (proof-incr-n-1=x)
       (= Nat (add1 (incr n-1)) (add1 x)))))
   (exact (same (add1 (incr n-1))))))

;; Use step-incr=add1 in constructing incr=add1
(define incr=add1
  (λ (n)
    (ind-Nat n
      mot-incr=add1
      base-incr=add1
      step-incr=add1)))

;; Now use incr=add1
(incr=add1 0)
(incr=add1 3)
`;
      const output = evaluatePie(str);
      expect(output).toContain("step-incr=add1");
      expect(output).toContain("incr=add1");
    });
  });

  describe("EliminateAbsurdTactic", () => {
    
    it("proves from absurd and uses it", () => {
      const str = `
(claim absurd-elim
  (Π ((A U))
    (→ Absurd A)))

(define-tactically absurd-elim
  ((intro A)
   (intro prf)
   (elim-Absurd prf)))

;; Use it in another proof
(claim from-false-anything
  (Π ((proof Absurd))
    Nat))

(define from-false-anything
  (λ (proof)
    (absurd-elim Nat proof)))
`;
      const output = evaluatePie(str);
      expect(output).toContain("absurd-elim");
      expect(output).toContain("from-false-anything");
    });
  });

  describe("Proof reuse and composition", () => {
    
    it("chains multiple tactic proofs together", () => {
      const str = `
(claim +
  (→ Nat Nat Nat))

(define +
  (λ (n j)
    (iter-Nat n j (λ (x) (add1 x)))))

;; First proof by tactics
(claim succ-eq
  (Π ((n Nat) (m Nat))
    (→ (= Nat n m)
      (= Nat (add1 n) (add1 m)))))

(define-tactically succ-eq
  ((intro n)
   (intro m)
   (intro eq)
   (exact (cong eq (+ 1)))))

;; Second proof by tactics
(claim double-succ-eq
  (Π ((n Nat) (m Nat))
    (→ (= Nat n m)
      (= Nat (add1 (add1 n)) (add1 (add1 m))))))

(define-tactically double-succ-eq
  ((intro n)
   (intro m)
   (intro eq)
   (exact (cong (succ-eq n m eq) (+ 1)))))

;; Use them
(succ-eq 3 3 (same 3))
(double-succ-eq 5 5 (same 5))
`;
      const output = evaluatePie(str);
      expect(output).toContain("succ-eq");
      expect(output).toContain("double-succ-eq");
      expect(output).toContain("(same 4)");
      expect(output).toContain("(same 7)");
    });
  });
});

describe("Tactic Error Cases", () => {
  
  it("fails when proof is incomplete", () => {
    const str = `
(claim incomplete
  (Π ((n Nat))
    (= Nat n n)))

(define-tactically incomplete
  ((intro n)))
`;
    expect(() => evaluatePie(str)).toThrow(/incomplete/i);
  });

  it("fails when exact provides wrong type", () => {
    const str = `
(claim wrong-type
  Nat)

(define-tactically wrong-type
  ((exact 'hello)))
`;
    expect(() => evaluatePie(str)).toThrow();
  });

  it("fails when intro used on non-Pi type", () => {
    const str = `
(claim not-pi
  Nat)

(define-tactically not-pi
  ((intro x)
   (exact 5)))
`;
    expect(() => evaluatePie(str)).toThrow(/non-function/i);
  });

  it("fails when elim-Nat used on non-Nat", () => {
    const str = `
(claim bad-elim
  (Π ((x Atom))
    Atom))

(define-tactically bad-elim
  ((intro x)
   (elim-Nat x)
   (then (exact 'a))
   (then (intro n) (intro ih) (exact 'b))))
`;
    expect(() => evaluatePie(str)).toThrow(/non-Nat/i);
  });
});

describe("Tactic Integration with Regular Definitions", () => {
  
  it("mixes tactic and regular definitions", () => {
    const str = `
;; Regular definition
(claim f
  (→ Nat Nat))

(define f
  (λ (n) (add1 n)))

;; Tactic definition
(claim f-increases
  (Π ((n Nat))
    Nat))

(define-tactically f-increases
  ((intro n)
   (exact (f n))))

;; Regular definition using tactic definition
(claim g
  (→ Nat Nat))

(define g
  (λ (n) (f-increases n)))

;; Tactic definition using regular definition
(claim h
  (Π ((n Nat))
    Nat))

(define-tactically h
  ((intro n)
   (exact (g n))))

(f 5)
(f-increases 5)
(g 5)
(h 5)
`;
    const output = evaluatePie(str);
    expect(output).toContain("6: Nat");
  });
});
