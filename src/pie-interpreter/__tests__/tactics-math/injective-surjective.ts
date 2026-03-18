import 'jest';
import { evaluatePie } from '../../main';

const arithPreamble = `
(claim + (→ Nat Nat Nat))
(define + (λ (n j) (iter-Nat n j (λ (x) (add1 x)))))
(claim * (→ Nat Nat Nat))
(define * (λ (n m) (iter-Nat n 0 (+ m))))
`;

const predPreamble = `
(claim pred (→ Nat Nat))
(define pred (λ (n) (which-Nat n 0 (λ (n-1) n-1))))
`;

describe("Injective, Surjective, and Bijective", () => {

  describe("Injectivity Basics", () => {

    it("add1 injective: concrete case add1(3)=add1(3) → 3=3", () => {
      const str = `${predPreamble}
(claim add1-inj-3-3
  (→ (= Nat (add1 3) (add1 3)) (= Nat 3 3)))
(define-tactically add1-inj-3-3
  ((intro eq)
   (exact (cong eq (the (→ Nat Nat) pred)))))
(add1-inj-3-3 (same 4))
`;
      const output = evaluatePie(str);
      expect(output).toContain("(same 3)");
    });

    it("add1 injective: concrete case add1(0)=add1(0) → 0=0", () => {
      const str = `${predPreamble}
(claim add1-inj-0-0
  (→ (= Nat (add1 0) (add1 0)) (= Nat 0 0)))
(define-tactically add1-inj-0-0
  ((intro eq)
   (exact (cong eq (the (→ Nat Nat) pred)))))
(add1-inj-0-0 (same 1))
`;
      const output = evaluatePie(str);
      expect(output).toContain("(same 0)");
    });

    it("add1 injective: concrete case add1(5)=add1(5) → 5=5", () => {
      const str = `${predPreamble}
(claim add1-inj-5-5
  (→ (= Nat (add1 5) (add1 5)) (= Nat 5 5)))
(define-tactically add1-inj-5-5
  ((intro eq)
   (exact (cong eq (the (→ Nat Nat) pred)))))
(add1-inj-5-5 (same 6))
`;
      const output = evaluatePie(str);
      expect(output).toContain("(same 5)");
    });

    it("pred(add1(n)) = n for n=0", () => {
      const str = `${predPreamble}
(claim pred-add1-0 (= Nat (pred (add1 0)) 0))
(define-tactically pred-add1-0
  ((exact (same 0))))
`;
      expect(() => evaluatePie(str)).not.toThrow();
    });

    it("pred(add1(n)) = n for n=5", () => {
      const str = `${predPreamble}
(claim pred-add1-5 (= Nat (pred (add1 5)) 5))
(define-tactically pred-add1-5
  ((exact (same 5))))
`;
      expect(() => evaluatePie(str)).not.toThrow();
    });

    it("pred(add1(n)) = n for n=10", () => {
      const str = `${predPreamble}
(claim pred-add1-10 (= Nat (pred (add1 10)) 10))
(define-tactically pred-add1-10
  ((exact (same 10))))
`;
      expect(() => evaluatePie(str)).not.toThrow();
    });

    it("identity is injective: concrete case id(3)=id(3) → 3=3", () => {
      const str = `
(claim id-inj
  (→ (= Nat 3 3) (= Nat 3 3)))
(define-tactically id-inj
  ((intro eq)
   (exact eq)))
(id-inj (same 3))
`;
      const output = evaluatePie(str);
      expect(output).toContain("(same 3)");
    });

    it("identity injective at value 0", () => {
      const str = `
(claim id-inj-0
  (→ (= Nat 0 0) (= Nat 0 0)))
(define-tactically id-inj-0
  ((intro eq)
   (exact eq)))
(id-inj-0 (same 0))
`;
      const output = evaluatePie(str);
      expect(output).toContain("(same 0)");
    });

    it("cong preserves equality along pred", () => {
      const str = `${predPreamble}
(claim cong-pred-eq
  (→ (= Nat 4 4) (= Nat (pred 4) (pred 4))))
(define-tactically cong-pred-eq
  ((intro eq)
   (exact (cong eq (the (→ Nat Nat) pred)))))
(cong-pred-eq (same 4))
`;
      const output = evaluatePie(str);
      expect(output).toContain("(same 3)");
    });

    it("cong preserves equality along add1", () => {
      const str = `
(claim cong-add1-eq
  (→ (= Nat 2 2) (= Nat (add1 2) (add1 2))))
(define-tactically cong-add1-eq
  ((intro eq)
   (exact (cong eq (the (→ Nat Nat) (λ (x) (add1 x)))))))
(cong-add1-eq (same 2))
`;
      const output = evaluatePie(str);
      expect(output).toContain("(same 3)");
    });

    it("injectivity statement for add1 as general type", () => {
      const str = `${predPreamble}
(claim add1-injective
  (Π ((n Nat) (m Nat))
    (→ (= Nat (add1 n) (add1 m)) (= Nat n m))))
(define-tactically add1-injective
  ((intro n)
   (intro m)
   (intro eq)
   (exact (cong eq (the (→ Nat Nat) pred)))))
`;
      expect(() => evaluatePie(str)).not.toThrow();
    });

    it("add1-injective applied to concrete equal values", () => {
      const str = `${predPreamble}
(claim add1-injective
  (Π ((n Nat) (m Nat))
    (→ (= Nat (add1 n) (add1 m)) (= Nat n m))))
(define-tactically add1-injective
  ((intro n)
   (intro m)
   (intro eq)
   (exact (cong eq (the (→ Nat Nat) pred)))))
(add1-injective 7 7 (same 8))
`;
      const output = evaluatePie(str);
      expect(output).toContain("(same 7)");
    });

  });

  describe("Injectivity of Specific Functions", () => {

    it("double is injective at concrete values: double(2)=double(2) → 2=2", () => {
      const str = `${arithPreamble}
(claim double (→ Nat Nat))
(define double (λ (n) (+ n n)))
(claim double-2-eq (= Nat (double 2) (double 2)))
(define-tactically double-2-eq
  ((exact (same (double 2)))))
`;
      expect(() => evaluatePie(str)).not.toThrow();
    });

    it("add1 composed twice is injective: concrete case", () => {
      const str = `${predPreamble}
(claim pred2 (→ Nat Nat))
(define pred2 (λ (n) (pred (pred n))))
(claim add2-inj
  (→ (= Nat (add1 (add1 3)) (add1 (add1 3))) (= Nat 3 3)))
(define-tactically add2-inj
  ((intro eq)
   (exact (cong eq (the (→ Nat Nat) pred2)))))
(add2-inj (same 5))
`;
      const output = evaluatePie(str);
      expect(output).toContain("(same 3)");
    });

    it("injectivity via two applications of cong-pred", () => {
      const str = `${predPreamble}
(claim two-step-inj
  (→ (= Nat (add1 (add1 1)) (add1 (add1 1))) (= Nat 1 1)))
(define-tactically two-step-inj
  ((intro eq)
   (exact (cong eq (the (→ Nat Nat) (λ (x) (pred (pred x))))))))
(two-step-inj (same 3))
`;
      const output = evaluatePie(str);
      expect(output).toContain("(same 1)");
    });

    it("left-cancellation: if add1(n)=add1(m) then n=m, instantiated", () => {
      const str = `${predPreamble}
(claim add1-injective
  (Π ((n Nat) (m Nat))
    (→ (= Nat (add1 n) (add1 m)) (= Nat n m))))
(define-tactically add1-injective
  ((intro n)
   (intro m)
   (intro eq)
   (exact (cong eq (the (→ Nat Nat) pred)))))
(add1-injective 0 0 (same 1))
`;
      const output = evaluatePie(str);
      expect(output).toContain("(same 0)");
    });

    it("transport injectivity evidence: 4=4 from 5=5", () => {
      const str = `${predPreamble}
(claim transport-inj
  (→ (= Nat 5 5) (= Nat 4 4)))
(define-tactically transport-inj
  ((intro eq)
   (exact (cong eq (the (→ Nat Nat) pred)))))
(transport-inj (same 5))
`;
      const output = evaluatePie(str);
      expect(output).toContain("(same 4)");
    });

    it("injectivity chain: add1(add1(n))=add1(add1(m)) → n=m at n=m=0", () => {
      const str = `${predPreamble}
(claim double-add1-inj
  (→ (= Nat (add1 (add1 0)) (add1 (add1 0))) (= Nat 0 0)))
(define-tactically double-add1-inj
  ((intro eq)
   (exact (cong eq (the (→ Nat Nat) (λ (x) (pred (pred x))))))))
(double-add1-inj (same 2))
`;
      const output = evaluatePie(str);
      expect(output).toContain("(same 0)");
    });

    it("injectivity of add1 yields pred equality", () => {
      const str = `${predPreamble}
(claim extract-pred
  (→ (= Nat 10 10) (= Nat 9 9)))
(define-tactically extract-pred
  ((intro eq)
   (exact (cong eq (the (→ Nat Nat) pred)))))
(extract-pred (same 10))
`;
      const output = evaluatePie(str);
      expect(output).toContain("(same 9)");
    });

    it("cong with const function maps any equality to 0=0", () => {
      const str = `
(claim const-zero-eq
  (→ (= Nat 5 5) (= Nat 0 0)))
(define-tactically const-zero-eq
  ((intro eq)
   (exact (cong eq (the (→ Nat Nat) (λ (x) 0))))))
(const-zero-eq (same 5))
`;
      const output = evaluatePie(str);
      expect(output).toContain("(same 0)");
    });

    it("cong with add1 lifts 3=3 to 4=4", () => {
      const str = `
(claim lift-eq
  (→ (= Nat 3 3) (= Nat 4 4)))
(define-tactically lift-eq
  ((intro eq)
   (exact (cong eq (the (→ Nat Nat) (λ (x) (add1 x)))))))
(lift-eq (same 3))
`;
      const output = evaluatePie(str);
      expect(output).toContain("(same 4)");
    });

    it("cong with double: 2=2 → 4=4", () => {
      const str = `${arithPreamble}
(claim cong-double
  (→ (= Nat 2 2) (= Nat (+ 2 2) (+ 2 2))))
(define-tactically cong-double
  ((intro eq)
   (exact (cong eq (the (→ Nat Nat) (λ (x) (+ x x)))))))
(cong-double (same 2))
`;
      const output = evaluatePie(str);
      expect(output).toContain("(same 4)");
    });

    it("injective general form at n=m=2", () => {
      const str = `${predPreamble}
(claim add1-injective
  (Π ((n Nat) (m Nat))
    (→ (= Nat (add1 n) (add1 m)) (= Nat n m))))
(define-tactically add1-injective
  ((intro n)
   (intro m)
   (intro eq)
   (exact (cong eq (the (→ Nat Nat) pred)))))
(add1-injective 2 2 (same 3))
`;
      const output = evaluatePie(str);
      expect(output).toContain("(same 2)");
    });

    it("injective general form at n=m=9", () => {
      const str = `${predPreamble}
(claim add1-injective
  (Π ((n Nat) (m Nat))
    (→ (= Nat (add1 n) (add1 m)) (= Nat n m))))
(define-tactically add1-injective
  ((intro n)
   (intro m)
   (intro eq)
   (exact (cong eq (the (→ Nat Nat) pred)))))
(add1-injective 9 9 (same 10))
`;
      const output = evaluatePie(str);
      expect(output).toContain("(same 9)");
    });

  });

  describe("Surjectivity", () => {

    it("identity is surjective: witness for y is y itself", () => {
      const str = `
(claim id-surj-3
  (Σ ((x Nat)) (= Nat x 3)))
(define-tactically id-surj-3
  ((exists 3 x)
   (exact (same 3))))
(car id-surj-3)
`;
      const output = evaluatePie(str);
      expect(output).toContain("3: Nat");
    });

    it("identity surjective at 0", () => {
      const str = `
(claim id-surj-0
  (Σ ((x Nat)) (= Nat x 0)))
(define-tactically id-surj-0
  ((exists 0 x)
   (exact (same 0))))
(car id-surj-0)
`;
      const output = evaluatePie(str);
      expect(output).toContain("0: Nat");
    });

    it("identity surjective at 10", () => {
      const str = `
(claim id-surj-10
  (Σ ((x Nat)) (= Nat x 10)))
(define-tactically id-surj-10
  ((exists 10 x)
   (exact (same 10))))
(car id-surj-10)
`;
      const output = evaluatePie(str);
      expect(output).toContain("10: Nat");
    });

    it("add1 surjective onto 5: witness is 4", () => {
      const str = `
(claim add1-surj-5
  (Σ ((x Nat)) (= Nat (add1 x) 5)))
(define-tactically add1-surj-5
  ((exists 4 x)
   (exact (same 5))))
(car add1-surj-5)
`;
      const output = evaluatePie(str);
      expect(output).toContain("4: Nat");
    });

    it("add1 surjective onto 1: witness is 0", () => {
      const str = `
(claim add1-surj-1
  (Σ ((x Nat)) (= Nat (add1 x) 1)))
(define-tactically add1-surj-1
  ((exists 0 x)
   (exact (same 1))))
(car add1-surj-1)
`;
      const output = evaluatePie(str);
      expect(output).toContain("0: Nat");
    });

    it("add1 surjective onto 100: witness is 99", () => {
      const str = `
(claim add1-surj-100
  (Σ ((x Nat)) (= Nat (add1 x) 100)))
(define-tactically add1-surj-100
  ((exists 99 x)
   (exact (same 100))))
(car add1-surj-100)
`;
      const output = evaluatePie(str);
      expect(output).toContain("99: Nat");
    });

    it("double surjective onto 6: witness is 3", () => {
      const str = `${arithPreamble}
(claim double-surj-6
  (Σ ((x Nat)) (= Nat (+ x x) 6)))
(define-tactically double-surj-6
  ((exists 3 x)
   (exact (same 6))))
(car double-surj-6)
`;
      const output = evaluatePie(str);
      expect(output).toContain("3: Nat");
    });

    it("surjectivity general form for id", () => {
      const str = `
(claim id-surj-gen
  (Π ((y Nat))
    (Σ ((x Nat)) (= Nat x y))))
(define-tactically id-surj-gen
  ((intro y)
   (exists y x)
   (exact (same y))))
`;
      expect(() => evaluatePie(str)).not.toThrow();
    });

    it("id surjectivity applied to 42", () => {
      const str = `
(claim id-surj-gen
  (Π ((y Nat))
    (Σ ((x Nat)) (= Nat x y))))
(define-tactically id-surj-gen
  ((intro y)
   (exists y x)
   (exact (same y))))
(car (id-surj-gen 42))
`;
      const output = evaluatePie(str);
      expect(output).toContain("42: Nat");
    });

    it("triple surjective onto 9: witness is 3", () => {
      const str = `${arithPreamble}
(claim triple-surj-9
  (Σ ((x Nat)) (= Nat (* 3 x) 9)))
(define-tactically triple-surj-9
  ((exists 3 x)
   (exact (same 9))))
(car triple-surj-9)
`;
      const output = evaluatePie(str);
      expect(output).toContain("3: Nat");
    });

  });

  describe("Composition Properties", () => {

    it("composition of injectives is injective: concrete add1.add1", () => {
      const str = `${predPreamble}
(claim pred2 (→ Nat Nat))
(define pred2 (λ (n) (pred (pred n))))
(claim comp-inj
  (→ (= Nat (add1 (add1 2)) (add1 (add1 2))) (= Nat 2 2)))
(define-tactically comp-inj
  ((intro eq)
   (exact (cong eq (the (→ Nat Nat) pred2)))))
(comp-inj (same 4))
`;
      const output = evaluatePie(str);
      expect(output).toContain("(same 2)");
    });

    it("injective . injective = injective at value 0", () => {
      const str = `${predPreamble}
(claim pred2 (→ Nat Nat))
(define pred2 (λ (n) (pred (pred n))))
(claim comp-inj-0
  (→ (= Nat (add1 (add1 0)) (add1 (add1 0))) (= Nat 0 0)))
(define-tactically comp-inj-0
  ((intro eq)
   (exact (cong eq (the (→ Nat Nat) pred2)))))
(comp-inj-0 (same 2))
`;
      const output = evaluatePie(str);
      expect(output).toContain("(same 0)");
    });

    it("surjectivity of composition: if f,g surjective, so is g.f (concrete)", () => {
      const str = `
(claim comp-surj-5
  (Σ ((x Nat)) (= Nat (add1 (add1 x)) 5)))
(define-tactically comp-surj-5
  ((exists 3 x)
   (exact (same 5))))
(car comp-surj-5)
`;
      const output = evaluatePie(str);
      expect(output).toContain("3: Nat");
    });

    it("bijection witness: injection + surjection for id at 3", () => {
      const str = `
(claim id-bij-3
  (Σ ((inj (→ (= Nat 3 3) (= Nat 3 3))))
    (Σ ((preimage Nat)) (= Nat preimage 3))))
(define-tactically id-bij-3
  ((split-Pair)
   (then (exact (λ (eq) eq)))
   (then
     (exists 3 preimage)
     (exact (same 3)))))
`;
      expect(() => evaluatePie(str)).not.toThrow();
    });

    it("bijection as pair of injection evidence and surjection evidence", () => {
      const str = `
(claim bij-witness
  (Σ ((inj-proof (→ (= Nat 5 5) (= Nat 5 5))))
    (Σ ((x Nat)) (= Nat x 5))))
(define-tactically bij-witness
  ((split-Pair)
   (then (exact (λ (eq) eq)))
   (then
     (exists 5 x)
     (exact (same 5)))))
`;
      expect(() => evaluatePie(str)).not.toThrow();
    });

    it("inverse witness: pred is left-inverse of add1 at 4", () => {
      const str = `${predPreamble}
(claim pred-left-inv-4 (= Nat (pred (add1 4)) 4))
(define-tactically pred-left-inv-4
  ((exact (same 4))))
`;
      expect(() => evaluatePie(str)).not.toThrow();
    });

    it("inverse witness: pred is left-inverse of add1 at 0", () => {
      const str = `${predPreamble}
(claim pred-left-inv-0 (= Nat (pred (add1 0)) 0))
(define-tactically pred-left-inv-0
  ((exact (same 0))))
`;
      expect(() => evaluatePie(str)).not.toThrow();
    });

    it("bundled bijection: injection and surjection in one Sigma", () => {
      const str = `${predPreamble}
(claim bij-add1-at-7
  (Σ ((inj (→ (= Nat (add1 7) (add1 7)) (= Nat 7 7))))
    (Σ ((x Nat)) (= Nat (add1 x) 8))))
(define-tactically bij-add1-at-7
  ((split-Pair)
   (then (exact (λ (eq) (cong eq (the (→ Nat Nat) pred)))))
   (then
     (exists 7 x)
     (exact (same 8)))))
`;
      expect(() => evaluatePie(str)).not.toThrow();
    });

    it("comp surjective onto 3 via add1 composed with add1", () => {
      const str = `
(claim comp-surj-3
  (Σ ((x Nat)) (= Nat (add1 (add1 x)) 3)))
(define-tactically comp-surj-3
  ((exists 1 x)
   (exact (same 3))))
(car comp-surj-3)
`;
      const output = evaluatePie(str);
      expect(output).toContain("1: Nat");
    });

    it("inverse pair: both directions for concrete values", () => {
      const str = `${predPreamble}
(claim round-trip-7
  (Σ ((p1 (= Nat (pred (add1 7)) 7)))
    (= Nat (add1 (pred (add1 7))) (add1 7))))
(define-tactically round-trip-7
  ((split-Pair)
   (then (exact (same 7)))
   (then (exact (same 8)))))
`;
      expect(() => evaluatePie(str)).not.toThrow();
    });

    it("composition of surjections: add1 twice surjective onto 10", () => {
      const str = `
(claim double-add1-surj-10
  (Σ ((x Nat)) (= Nat (add1 (add1 x)) 10)))
(define-tactically double-add1-surj-10
  ((exists 8 x)
   (exact (same 10))))
(car double-add1-surj-10)
`;
      const output = evaluatePie(str);
      expect(output).toContain("8: Nat");
    });

    it("general injectivity form with add1 applied to 4,4", () => {
      const str = `${predPreamble}
(claim add1-injective
  (Π ((n Nat) (m Nat))
    (→ (= Nat (add1 n) (add1 m)) (= Nat n m))))
(define-tactically add1-injective
  ((intro n)
   (intro m)
   (intro eq)
   (exact (cong eq (the (→ Nat Nat) pred)))))
(add1-injective 4 4 (same 5))
`;
      const output = evaluatePie(str);
      expect(output).toContain("(same 4)");
    });

  });

  describe("Error Cases", () => {

    it("general surjectivity for add1 onto positive Nats at 3", () => {
      const str = `
(claim add1-surj
  (Π ((y Nat))
    (Σ ((x Nat)) (= Nat (add1 x) (add1 y)))))
(define-tactically add1-surj
  ((intro y)
   (exists y x)
   (exact (same (add1 y)))))
(car (add1-surj 3))
`;
      const output = evaluatePie(str);
      expect(output).toContain("3: Nat");
    });

    it("fails with wrong witness type in surjectivity", () => {
      const str = `
(claim bad-surj
  (Σ ((x Nat)) (= Nat (add1 x) 5)))
(define-tactically bad-surj
  ((exists 5 x)
   (exact (same 5))))
`;
      expect(() => evaluatePie(str)).toThrow();
    });

    it("fails with incomplete injectivity proof", () => {
      const str = `${predPreamble}
(claim bad-inj
  (Π ((n Nat) (m Nat))
    (→ (= Nat (add1 n) (add1 m)) (= Nat n m))))
(define-tactically bad-inj
  ((intro n)
   (intro m)))
`;
      expect(() => evaluatePie(str)).toThrow(/incomplete/i);
    });

    it("fails when using elim-Equal on non-equality type", () => {
      const str = `
(claim bad Nat)
(define-tactically bad
  ((elim-Equal e)
   (exact 0)))
`;
      expect(() => evaluatePie(str)).toThrow();
    });

  });

});
