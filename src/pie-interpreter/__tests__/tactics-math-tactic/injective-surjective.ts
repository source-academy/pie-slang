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
(claim add1-inj-3-3-result (= (= Nat 3 3) (add1-inj-3-3 (same 4)) (same 3)))
(define-tactically add1-inj-3-3-result
  ((exact (same (same 3)))))
`;
      expect(() => evaluatePie(str)).not.toThrow();
    });

    it("add1 injective: concrete case add1(0)=add1(0) → 0=0", () => {
      const str = `${predPreamble}
(claim add1-inj-0-0
  (→ (= Nat (add1 0) (add1 0)) (= Nat 0 0)))
(define-tactically add1-inj-0-0
  ((intro eq)
   (exact (cong eq (the (→ Nat Nat) pred)))))
(claim add1-inj-0-0-result (= (= Nat 0 0) (add1-inj-0-0 (same 1)) (same 0)))
(define-tactically add1-inj-0-0-result
  ((exact (same (same 0)))))
`;
      expect(() => evaluatePie(str)).not.toThrow();
    });

    it("add1 injective: concrete case add1(5)=add1(5) → 5=5", () => {
      const str = `${predPreamble}
(claim add1-inj-5-5
  (→ (= Nat (add1 5) (add1 5)) (= Nat 5 5)))
(define-tactically add1-inj-5-5
  ((intro eq)
   (exact (cong eq (the (→ Nat Nat) pred)))))
(claim add1-inj-5-5-result (= (= Nat 5 5) (add1-inj-5-5 (same 6)) (same 5)))
(define-tactically add1-inj-5-5-result
  ((exact (same (same 5)))))
`;
      expect(() => evaluatePie(str)).not.toThrow();
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
(claim id-inj-result (= (= Nat 3 3) (id-inj (same 3)) (same 3)))
(define-tactically id-inj-result
  ((exact (same (same 3)))))
`;
      expect(() => evaluatePie(str)).not.toThrow();
    });

    it("identity injective at value 0", () => {
      const str = `
(claim id-inj-0
  (→ (= Nat 0 0) (= Nat 0 0)))
(define-tactically id-inj-0
  ((intro eq)
   (exact eq)))
(claim id-inj-0-result (= (= Nat 0 0) (id-inj-0 (same 0)) (same 0)))
(define-tactically id-inj-0-result
  ((exact (same (same 0)))))
`;
      expect(() => evaluatePie(str)).not.toThrow();
    });

    it("cong preserves equality along pred", () => {
      const str = `${predPreamble}
(claim cong-pred-eq
  (→ (= Nat 4 4) (= Nat (pred 4) (pred 4))))
(define-tactically cong-pred-eq
  ((intro eq)
   (exact (cong eq (the (→ Nat Nat) pred)))))
(claim cong-pred-eq-result (= (= Nat 3 3) (cong-pred-eq (same 4)) (same 3)))
(define-tactically cong-pred-eq-result
  ((exact (same (same 3)))))
`;
      expect(() => evaluatePie(str)).not.toThrow();
    });

    it("cong preserves equality along add1", () => {
      const str = `
(claim cong-add1-eq
  (→ (= Nat 2 2) (= Nat (add1 2) (add1 2))))
(define-tactically cong-add1-eq
  ((intro eq)
   (exact (cong eq (the (→ Nat Nat) (λ (x) (add1 x)))))))
(claim cong-add1-eq-result (= (= Nat 3 3) (cong-add1-eq (same 2)) (same 3)))
(define-tactically cong-add1-eq-result
  ((exact (same (same 3)))))
`;
      expect(() => evaluatePie(str)).not.toThrow();
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
(claim add1-inj-7-7-result (= (= Nat 7 7) (add1-injective 7 7 (same 8)) (same 7)))
(define-tactically add1-inj-7-7-result
  ((exact (same (same 7)))))
`;
      expect(() => evaluatePie(str)).not.toThrow();
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
(claim add2-inj-result (= (= Nat 3 3) (add2-inj (same 5)) (same 3)))
(define-tactically add2-inj-result
  ((exact (same (same 3)))))
`;
      expect(() => evaluatePie(str)).not.toThrow();
    });

    it("injectivity via two applications of cong-pred", () => {
      const str = `${predPreamble}
(claim two-step-inj
  (→ (= Nat (add1 (add1 1)) (add1 (add1 1))) (= Nat 1 1)))
(define-tactically two-step-inj
  ((intro eq)
   (exact (cong eq (the (→ Nat Nat) (λ (x) (pred (pred x))))))))
(claim two-step-inj-result (= (= Nat 1 1) (two-step-inj (same 3)) (same 1)))
(define-tactically two-step-inj-result
  ((exact (same (same 1)))))
`;
      expect(() => evaluatePie(str)).not.toThrow();
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
(claim left-cancel-0-0-result (= (= Nat 0 0) (add1-injective 0 0 (same 1)) (same 0)))
(define-tactically left-cancel-0-0-result
  ((exact (same (same 0)))))
`;
      expect(() => evaluatePie(str)).not.toThrow();
    });

    it("transport injectivity evidence: 4=4 from 5=5", () => {
      const str = `${predPreamble}
(claim transport-inj
  (→ (= Nat 5 5) (= Nat 4 4)))
(define-tactically transport-inj
  ((intro eq)
   (exact (cong eq (the (→ Nat Nat) pred)))))
(claim transport-inj-result (= (= Nat 4 4) (transport-inj (same 5)) (same 4)))
(define-tactically transport-inj-result
  ((exact (same (same 4)))))
`;
      expect(() => evaluatePie(str)).not.toThrow();
    });

    it("injectivity chain: add1(add1(n))=add1(add1(m)) → n=m at n=m=0", () => {
      const str = `${predPreamble}
(claim double-add1-inj
  (→ (= Nat (add1 (add1 0)) (add1 (add1 0))) (= Nat 0 0)))
(define-tactically double-add1-inj
  ((intro eq)
   (exact (cong eq (the (→ Nat Nat) (λ (x) (pred (pred x))))))))
(claim double-add1-inj-result (= (= Nat 0 0) (double-add1-inj (same 2)) (same 0)))
(define-tactically double-add1-inj-result
  ((exact (same (same 0)))))
`;
      expect(() => evaluatePie(str)).not.toThrow();
    });

    it("injectivity of add1 yields pred equality", () => {
      const str = `${predPreamble}
(claim extract-pred
  (→ (= Nat 10 10) (= Nat 9 9)))
(define-tactically extract-pred
  ((intro eq)
   (exact (cong eq (the (→ Nat Nat) pred)))))
(claim extract-pred-result (= (= Nat 9 9) (extract-pred (same 10)) (same 9)))
(define-tactically extract-pred-result
  ((exact (same (same 9)))))
`;
      expect(() => evaluatePie(str)).not.toThrow();
    });

    it("cong with const function maps any equality to 0=0", () => {
      const str = `
(claim const-zero-eq
  (→ (= Nat 5 5) (= Nat 0 0)))
(define-tactically const-zero-eq
  ((intro eq)
   (exact (cong eq (the (→ Nat Nat) (λ (x) 0))))))
(claim const-zero-eq-result (= (= Nat 0 0) (const-zero-eq (same 5)) (same 0)))
(define-tactically const-zero-eq-result
  ((exact (same (same 0)))))
`;
      expect(() => evaluatePie(str)).not.toThrow();
    });

    it("cong with add1 lifts 3=3 to 4=4", () => {
      const str = `
(claim lift-eq
  (→ (= Nat 3 3) (= Nat 4 4)))
(define-tactically lift-eq
  ((intro eq)
   (exact (cong eq (the (→ Nat Nat) (λ (x) (add1 x)))))))
(claim lift-eq-result (= (= Nat 4 4) (lift-eq (same 3)) (same 4)))
(define-tactically lift-eq-result
  ((exact (same (same 4)))))
`;
      expect(() => evaluatePie(str)).not.toThrow();
    });

    it("cong with double: 2=2 → 4=4", () => {
      const str = `${arithPreamble}
(claim cong-double
  (→ (= Nat 2 2) (= Nat (+ 2 2) (+ 2 2))))
(define-tactically cong-double
  ((intro eq)
   (exact (cong eq (the (→ Nat Nat) (λ (x) (+ x x)))))))
(claim cong-double-result (= (= Nat 4 4) (cong-double (same 2)) (same 4)))
(define-tactically cong-double-result
  ((exact (same (same 4)))))
`;
      expect(() => evaluatePie(str)).not.toThrow();
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
(claim inj-2-2-result (= (= Nat 2 2) (add1-injective 2 2 (same 3)) (same 2)))
(define-tactically inj-2-2-result
  ((exact (same (same 2)))))
`;
      expect(() => evaluatePie(str)).not.toThrow();
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
(claim inj-9-9-result (= (= Nat 9 9) (add1-injective 9 9 (same 10)) (same 9)))
(define-tactically inj-9-9-result
  ((exact (same (same 9)))))
`;
      expect(() => evaluatePie(str)).not.toThrow();
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
(claim car-id-surj-3 (= Nat (car id-surj-3) 3))
(define-tactically car-id-surj-3
  ((exact (same 3))))
`;
      expect(() => evaluatePie(str)).not.toThrow();
    });

    it("identity surjective at 0", () => {
      const str = `
(claim id-surj-0
  (Σ ((x Nat)) (= Nat x 0)))
(define-tactically id-surj-0
  ((exists 0 x)
   (exact (same 0))))
(claim car-id-surj-0 (= Nat (car id-surj-0) 0))
(define-tactically car-id-surj-0
  ((exact (same 0))))
`;
      expect(() => evaluatePie(str)).not.toThrow();
    });

    it("identity surjective at 10", () => {
      const str = `
(claim id-surj-10
  (Σ ((x Nat)) (= Nat x 10)))
(define-tactically id-surj-10
  ((exists 10 x)
   (exact (same 10))))
(claim car-id-surj-10 (= Nat (car id-surj-10) 10))
(define-tactically car-id-surj-10
  ((exact (same 10))))
`;
      expect(() => evaluatePie(str)).not.toThrow();
    });

    it("add1 surjective onto 5: witness is 4", () => {
      const str = `
(claim add1-surj-5
  (Σ ((x Nat)) (= Nat (add1 x) 5)))
(define-tactically add1-surj-5
  ((exists 4 x)
   (exact (same 5))))
(claim car-add1-surj-5 (= Nat (car add1-surj-5) 4))
(define-tactically car-add1-surj-5
  ((exact (same 4))))
`;
      expect(() => evaluatePie(str)).not.toThrow();
    });

    it("add1 surjective onto 1: witness is 0", () => {
      const str = `
(claim add1-surj-1
  (Σ ((x Nat)) (= Nat (add1 x) 1)))
(define-tactically add1-surj-1
  ((exists 0 x)
   (exact (same 1))))
(claim car-add1-surj-1 (= Nat (car add1-surj-1) 0))
(define-tactically car-add1-surj-1
  ((exact (same 0))))
`;
      expect(() => evaluatePie(str)).not.toThrow();
    });

    it("add1 surjective onto 100: witness is 99", () => {
      const str = `
(claim add1-surj-100
  (Σ ((x Nat)) (= Nat (add1 x) 100)))
(define-tactically add1-surj-100
  ((exists 99 x)
   (exact (same 100))))
(claim car-add1-surj-100 (= Nat (car add1-surj-100) 99))
(define-tactically car-add1-surj-100
  ((exact (same 99))))
`;
      expect(() => evaluatePie(str)).not.toThrow();
    });

    it("double surjective onto 6: witness is 3", () => {
      const str = `${arithPreamble}
(claim double-surj-6
  (Σ ((x Nat)) (= Nat (+ x x) 6)))
(define-tactically double-surj-6
  ((exists 3 x)
   (exact (same 6))))
(claim car-double-surj-6 (= Nat (car double-surj-6) 3))
(define-tactically car-double-surj-6
  ((exact (same 3))))
`;
      expect(() => evaluatePie(str)).not.toThrow();
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
(claim car-id-surj-42 (= Nat (car (id-surj-gen 42)) 42))
(define-tactically car-id-surj-42
  ((exact (same 42))))
`;
      expect(() => evaluatePie(str)).not.toThrow();
    });

    it("triple surjective onto 9: witness is 3", () => {
      const str = `${arithPreamble}
(claim triple-surj-9
  (Σ ((x Nat)) (= Nat (* 3 x) 9)))
(define-tactically triple-surj-9
  ((exists 3 x)
   (exact (same 9))))
(claim car-triple-surj-9 (= Nat (car triple-surj-9) 3))
(define-tactically car-triple-surj-9
  ((exact (same 3))))
`;
      expect(() => evaluatePie(str)).not.toThrow();
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
(claim comp-inj-result (= (= Nat 2 2) (comp-inj (same 4)) (same 2)))
(define-tactically comp-inj-result
  ((exact (same (same 2)))))
`;
      expect(() => evaluatePie(str)).not.toThrow();
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
(claim comp-inj-0-result (= (= Nat 0 0) (comp-inj-0 (same 2)) (same 0)))
(define-tactically comp-inj-0-result
  ((exact (same (same 0)))))
`;
      expect(() => evaluatePie(str)).not.toThrow();
    });

    it("surjectivity of composition: if f,g surjective, so is g.f (concrete)", () => {
      const str = `
(claim comp-surj-5
  (Σ ((x Nat)) (= Nat (add1 (add1 x)) 5)))
(define-tactically comp-surj-5
  ((exists 3 x)
   (exact (same 5))))
(claim car-comp-surj-5 (= Nat (car comp-surj-5) 3))
(define-tactically car-comp-surj-5
  ((exact (same 3))))
`;
      expect(() => evaluatePie(str)).not.toThrow();
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
(claim car-comp-surj-3 (= Nat (car comp-surj-3) 1))
(define-tactically car-comp-surj-3
  ((exact (same 1))))
`;
      expect(() => evaluatePie(str)).not.toThrow();
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
(claim car-double-add1-surj-10 (= Nat (car double-add1-surj-10) 8))
(define-tactically car-double-add1-surj-10
  ((exact (same 8))))
`;
      expect(() => evaluatePie(str)).not.toThrow();
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
(claim inj-4-4-result (= (= Nat 4 4) (add1-injective 4 4 (same 5)) (same 4)))
(define-tactically inj-4-4-result
  ((exact (same (same 4)))))
`;
      expect(() => evaluatePie(str)).not.toThrow();
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
(claim car-add1-surj-3 (= Nat (car (add1-surj 3)) 3))
(define-tactically car-add1-surj-3
  ((exact (same 3))))
`;
      expect(() => evaluatePie(str)).not.toThrow();
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
