import 'jest';
import { evaluatePie } from '../../main';

const arithPreamble = `
(claim + (→ Nat Nat Nat))
(define + (λ (n j) (iter-Nat n j (λ (x) (add1 x)))))

(claim * (→ Nat Nat Nat))
(define * (λ (n m) (iter-Nat n 0 (+ m))))
`;

const listPreamble = `${arithPreamble}
(claim length (Π ((E U)) (→ (List E) Nat)))
(define length (λ (E xs) (rec-List xs 0 (λ (x rest n) (add1 n)))))

(claim append (Π ((E U)) (→ (List E) (List E) (List E))))
(define append (λ (E xs ys) (rec-List xs ys (λ (x rest acc) (:: x acc)))))

(claim map (Π ((A U) (B U)) (→ (→ A B) (List A) (List B))))
(define map (λ (A B f xs) (rec-List xs (the (List B) nil) (λ (x rest acc) (:: (f x) acc)))))

(claim sum (→ (List Nat) Nat))
(define sum (λ (xs) (rec-List xs 0 (λ (x rest acc) (+ x acc)))))
`;

describe("Structural Induction on Lists", () => {

  describe("Basic List Functions", () => {

    it("computes length of nil = 0", () => {
      const str = `${listPreamble}
(claim length-nil-result (= Nat (length Nat (the (List Nat) nil)) 0))
(define-tactically length-nil-result
  ((exact (same 0))))
`;
      expect(() => evaluatePie(str)).not.toThrow();
    });

    it("computes length of (:: 1 nil) = 1", () => {
      const str = `${listPreamble}
(claim length-1-result (= Nat (length Nat (:: 1 nil)) 1))
(define-tactically length-1-result
  ((exact (same 1))))
`;
      expect(() => evaluatePie(str)).not.toThrow();
    });

    it("computes length of (:: 1 (:: 2 (:: 3 nil))) = 3", () => {
      const str = `${listPreamble}
(claim length-3-result (= Nat (length Nat (:: 1 (:: 2 (:: 3 nil)))) 3))
(define-tactically length-3-result
  ((exact (same 3))))
`;
      expect(() => evaluatePie(str)).not.toThrow();
    });

    it("computes sum of nil = 0", () => {
      const str = `${listPreamble}
(claim sum-nil-result (= Nat (sum (the (List Nat) nil)) 0))
(define-tactically sum-nil-result
  ((exact (same 0))))
`;
      expect(() => evaluatePie(str)).not.toThrow();
    });

    it("computes sum of (:: 1 (:: 2 (:: 3 nil))) = 6", () => {
      const str = `${listPreamble}
(claim sum-3-result (= Nat (sum (:: 1 (:: 2 (:: 3 nil)))) 6))
(define-tactically sum-3-result
  ((exact (same 6))))
`;
      expect(() => evaluatePie(str)).not.toThrow();
    });

    it("computes sum of (:: 5 nil) = 5", () => {
      const str = `${listPreamble}
(claim sum-1-result (= Nat (sum (:: 5 nil)) 5))
(define-tactically sum-1-result
  ((exact (same 5))))
`;
      expect(() => evaluatePie(str)).not.toThrow();
    });

    it("computes append of nil and (:: 1 nil)", () => {
      const str = `${listPreamble}
(claim append-nil-result (= Nat (length Nat (append Nat (the (List Nat) nil) (:: 1 nil))) 1))
(define-tactically append-nil-result
  ((exact (same 1))))
`;
      expect(() => evaluatePie(str)).not.toThrow();
    });

    it("computes append of (:: 1 nil) and (:: 2 nil) has length 2", () => {
      const str = `${listPreamble}
(claim append-len-result (= Nat (length Nat (append Nat (:: 1 nil) (:: 2 nil))) 2))
(define-tactically append-len-result
  ((exact (same 2))))
`;
      expect(() => evaluatePie(str)).not.toThrow();
    });

    it("computes map add1 over (:: 1 (:: 2 nil)) gives length 2", () => {
      const str = `${listPreamble}
(claim map-len-result (= Nat (length Nat (map Nat Nat (+ 1) (:: 1 (:: 2 nil)))) 2))
(define-tactically map-len-result
  ((exact (same 2))))
`;
      expect(() => evaluatePie(str)).not.toThrow();
    });

    it("defines product of list and computes product of (:: 2 (:: 3 nil)) = 6", () => {
      const str = `${listPreamble}
(claim product (→ (List Nat) Nat))
(define product (λ (xs) (rec-List xs 1 (λ (x rest acc) (* x acc)))))
(claim product-result (= Nat (product (:: 2 (:: 3 nil))) 6))
(define-tactically product-result
  ((exact (same 6))))
`;
      expect(() => evaluatePie(str)).not.toThrow();
    });

    it("computes product of nil = 1", () => {
      const str = `${listPreamble}
(claim product (→ (List Nat) Nat))
(define product (λ (xs) (rec-List xs 1 (λ (x rest acc) (* x acc)))))
(claim product-nil-result (= Nat (product (the (List Nat) nil)) 1))
(define-tactically product-nil-result
  ((exact (same 1))))
`;
      expect(() => evaluatePie(str)).not.toThrow();
    });

    it("computes length of 5-element list = 5", () => {
      const str = `${listPreamble}
(claim length-5-result (= Nat (length Nat (:: 1 (:: 2 (:: 3 (:: 4 (:: 5 nil)))))) 5))
(define-tactically length-5-result
  ((exact (same 5))))
`;
      expect(() => evaluatePie(str)).not.toThrow();
    });

  });

  describe("Append and Map", () => {

    it("proves append nil ys = ys for concrete ys", () => {
      const str = `${listPreamble}
(claim append-nil-ys (= (List Nat) (append Nat (the (List Nat) nil) (:: 1 (:: 2 nil))) (:: 1 (:: 2 nil))))
(define-tactically append-nil-ys
  ((exact (same (:: 1 (:: 2 nil))))))
`;
      expect(() => evaluatePie(str)).not.toThrow();
    });

    it("proves append (:: 1 nil) (:: 2 nil) = (:: 1 (:: 2 nil))", () => {
      const str = `${listPreamble}
(claim append-singleton (= (List Nat) (append Nat (:: 1 nil) (:: 2 nil)) (:: 1 (:: 2 nil))))
(define-tactically append-singleton
  ((exact (same (:: 1 (:: 2 nil))))))
`;
      expect(() => evaluatePie(str)).not.toThrow();
    });

    it("defines length tactically using elim-List", () => {
      const str = `${arithPreamble}
(claim tac-length (Π ((E U)) (→ (List E) Nat)))
(define-tactically tac-length
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
(claim tac-length-result (= Nat (tac-length Nat (:: 1 (:: 2 (:: 3 nil)))) 3))
(define-tactically tac-length-result
  ((exact (same 3))))
`;
      expect(() => evaluatePie(str)).not.toThrow();
    });

    it("defines sum tactically using elim-List", () => {
      const str = `${arithPreamble}
(claim tac-sum (→ (List Nat) Nat))
(define-tactically tac-sum
  ((intro xs)
   (elim-List xs)
   (then
     (exact 0))
   (then
     (intro x)
     (intro rest)
     (intro ih)
     (exact (+ x ih)))))
(claim tac-sum-result (= Nat (tac-sum (:: 3 (:: 4 (:: 5 nil)))) 12))
(define-tactically tac-sum-result
  ((exact (same 12))))
`;
      expect(() => evaluatePie(str)).not.toThrow();
    });

    it("defines append tactically using elim-List", () => {
      const str = `${arithPreamble}
(claim tac-append (Π ((E U)) (→ (List E) (List E) (List E))))
(define-tactically tac-append
  ((intro E)
   (intro xs)
   (intro ys)
   (elim-List xs)
   (then
     (exact ys))
   (then
     (intro x)
     (intro rest)
     (intro ih)
     (exact (:: x ih)))))
(tac-append Nat (:: 1 (:: 2 nil)) (:: 3 nil))
`;
      expect(() => evaluatePie(str)).not.toThrow();
    });

    it("defines map tactically using elim-List", () => {
      const str = `${arithPreamble}
(claim tac-map (Π ((A U) (B U)) (→ (→ A B) (List A) (List B))))
(define-tactically tac-map
  ((intro A)
   (intro B)
   (intro f)
   (intro xs)
   (elim-List xs)
   (then
     (exact (the (List B) nil)))
   (then
     (intro x)
     (intro rest)
     (intro ih)
     (exact (:: (f x) ih)))))
`;
      expect(() => evaluatePie(str)).not.toThrow();
    });

    it("tactically defined map produces correct length", () => {
      const str = `${listPreamble}
(claim tac-map (Π ((A U) (B U)) (→ (→ A B) (List A) (List B))))
(define-tactically tac-map
  ((intro A)
   (intro B)
   (intro f)
   (intro xs)
   (elim-List xs)
   (then
     (exact (the (List B) nil)))
   (then
     (intro x)
     (intro rest)
     (intro ih)
     (exact (:: (f x) ih)))))
(claim tac-map-len-result (= Nat (length Nat (tac-map Nat Nat (+ 1) (:: 1 (:: 2 (:: 3 nil))))) 3))
(define-tactically tac-map-len-result
  ((exact (same 3))))
`;
      expect(() => evaluatePie(str)).not.toThrow();
    });

    it("map over nil produces nil", () => {
      const str = `${listPreamble}
(claim map-nil (= (List Nat) (map Nat Nat (+ 1) (the (List Nat) nil)) (the (List Nat) nil)))
(define-tactically map-nil
  ((exact (same (the (List Nat) nil)))))
`;
      expect(() => evaluatePie(str)).not.toThrow();
    });

    it("map (+ 1) over (:: 0 nil) = (:: 1 nil)", () => {
      const str = `${listPreamble}
(claim map-one (= (List Nat) (map Nat Nat (+ 1) (:: 0 nil)) (:: 1 nil)))
(define-tactically map-one
  ((exact (same (:: 1 nil)))))
`;
      expect(() => evaluatePie(str)).not.toThrow();
    });

    it("sum of appended lists equals sum of sums for concrete case", () => {
      const str = `${listPreamble}
(claim sum-append (= Nat (sum (append Nat (:: 1 (:: 2 nil)) (:: 3 nil))) (+ (sum (:: 1 (:: 2 nil))) (sum (:: 3 nil)))))
(define-tactically sum-append
  ((exact (same 6))))
`;
      expect(() => evaluatePie(str)).not.toThrow();
    });

    it("length of append equals sum of lengths for concrete case", () => {
      const str = `${listPreamble}
(claim len-append (= Nat (length Nat (append Nat (:: 1 (:: 2 nil)) (:: 3 nil))) (+ (length Nat (:: 1 (:: 2 nil))) (length Nat (:: 3 nil)))))
(define-tactically len-append
  ((exact (same 3))))
`;
      expect(() => evaluatePie(str)).not.toThrow();
    });

    it("defines a count function that counts elements equal to a given nat", () => {
      const str = `${listPreamble}
(claim tac-count-zeros (→ (List Nat) Nat))
(define-tactically tac-count-zeros
  ((intro xs)
   (elim-List xs)
   (then
     (exact 0))
   (then
     (intro x)
     (intro rest)
     (intro ih)
     (exact (+ (which-Nat x 1 (λ (n-1) 0)) ih)))))
(claim count-zeros-result (= Nat (tac-count-zeros (:: 0 (:: 1 (:: 0 (:: 2 (:: 0 nil)))))) 3))
(define-tactically count-zeros-result
  ((exact (same 3))))
`;
      expect(() => evaluatePie(str)).not.toThrow();
    });

  });

  describe("List Properties", () => {

    it("proves append nil xs = xs for all xs by exact same", () => {
      const str = `${listPreamble}
(claim append-nil (Π ((E U) (xs (List E))) (= (List E) (append E (the (List E) nil) xs) xs)))
(define-tactically append-nil
  ((intro E)
   (intro xs)
   (exact (same xs))))
`;
      expect(() => evaluatePie(str)).not.toThrow();
    });

    it("proves append nil xs = xs for all xs (polymorphic)", () => {
      const str = `${listPreamble}
(claim append-nil-xs (Π ((E U) (xs (List E))) (= (List E) (append E (the (List E) nil) xs) xs)))
(define-tactically append-nil-xs
  ((intro E)
   (intro xs)
   (exact (same xs))))
`;
      expect(() => evaluatePie(str)).not.toThrow();
    });

    it("verifies append nil xs = xs at concrete Nat list", () => {
      const str = `${listPreamble}
(claim append-nil-concrete (= (List Nat) (append Nat (the (List Nat) nil) (:: 1 (:: 2 nil))) (:: 1 (:: 2 nil))))
(define-tactically append-nil-concrete
  ((exact (same (:: 1 (:: 2 nil))))))
`;
      expect(() => evaluatePie(str)).not.toThrow();
    });

    it("proves length of nil is 0 tactically", () => {
      const str = `${listPreamble}
(claim length-nil (Π ((E U)) (= Nat (length E (the (List E) nil)) 0)))
(define-tactically length-nil
  ((intro E)
   (exact (same 0))))
`;
      expect(() => evaluatePie(str)).not.toThrow();
    });

    it("proves length of cons is add1 of length for concrete case", () => {
      const str = `${listPreamble}
(claim length-cons-concrete (= Nat (length Nat (:: 5 (:: 3 nil))) (add1 (length Nat (:: 3 nil)))))
(define-tactically length-cons-concrete
  ((exact (same 2))))
`;
      expect(() => evaluatePie(str)).not.toThrow();
    });

    it("proves map preserves length for concrete list", () => {
      const str = `${listPreamble}
(claim map-length (= Nat (length Nat (map Nat Nat (+ 1) (:: 1 (:: 2 (:: 3 nil))))) (length Nat (:: 1 (:: 2 (:: 3 nil))))))
(define-tactically map-length
  ((exact (same 3))))
`;
      expect(() => evaluatePie(str)).not.toThrow();
    });

    it("proves concrete append associativity", () => {
      const str = `${listPreamble}
(claim append-assoc-concrete
  (= (List Nat)
    (append Nat (append Nat (:: 1 nil) (:: 2 nil)) (:: 3 nil))
    (append Nat (:: 1 nil) (append Nat (:: 2 nil) (:: 3 nil)))))
(define-tactically append-assoc-concrete
  ((exact (same (:: 1 (:: 2 (:: 3 nil)))))))
`;
      expect(() => evaluatePie(str)).not.toThrow();
    });

    it("proves sum(:: x nil) = x for concrete x=7", () => {
      const str = `${listPreamble}
(claim sum-singleton (= Nat (sum (:: 7 nil)) 7))
(define-tactically sum-singleton
  ((exact (same 7))))
`;
      expect(() => evaluatePie(str)).not.toThrow();
    });

    it("proves map f (:: x nil) = (:: (f x) nil) for concrete case", () => {
      const str = `${listPreamble}
(claim map-singleton (= (List Nat) (map Nat Nat (+ 3) (:: 2 nil)) (:: 5 nil)))
(define-tactically map-singleton
  ((exact (same (:: 5 nil)))))
`;
      expect(() => evaluatePie(str)).not.toThrow();
    });

    it("defines reverse using snoc helper for concrete test", () => {
      const str = `${listPreamble}
(claim snoc (Π ((E U)) (→ (List E) E (List E))))
(define snoc (λ (E xs x) (append E xs (:: x nil))))

(claim reverse (Π ((E U)) (→ (List E) (List E))))
(define reverse (λ (E xs) (rec-List xs (the (List E) nil) (λ (x rest acc) (snoc E acc x)))))

(claim rev-len-result (= Nat (length Nat (reverse Nat (:: 1 (:: 2 (:: 3 nil))))) 3))
(define-tactically rev-len-result
  ((exact (same 3))))
`;
      expect(() => evaluatePie(str)).not.toThrow();
    });

    it("proves length of reversed list equals length of original for concrete case", () => {
      const str = `${listPreamble}
(claim snoc (Π ((E U)) (→ (List E) E (List E))))
(define snoc (λ (E xs x) (append E xs (:: x nil))))

(claim reverse (Π ((E U)) (→ (List E) (List E))))
(define reverse (λ (E xs) (rec-List xs (the (List E) nil) (λ (x rest acc) (snoc E acc x)))))

(claim rev-length-concrete (= Nat (length Nat (reverse Nat (:: 1 (:: 2 nil)))) (length Nat (:: 1 (:: 2 nil)))))
(define-tactically rev-length-concrete
  ((exact (same 2))))
`;
      expect(() => evaluatePie(str)).not.toThrow();
    });

  });

  describe("Advanced List Proofs", () => {

    it("proves length of sum over list is always Nat by elim-List", () => {
      const str = `${listPreamble}
(claim list-to-nat (→ (List Nat) Nat))
(define-tactically list-to-nat
  ((intro xs)
   (elim-List xs)
   (then
     (exact 0))
   (then
     (intro x)
     (intro rest)
     (intro ih)
     (exact (+ x ih)))))
(claim list-to-nat-result (= Nat (list-to-nat (:: 10 (:: 20 (:: 30 nil)))) 60))
(define-tactically list-to-nat-result
  ((exact (same 60))))
`;
      expect(() => evaluatePie(str)).not.toThrow();
    });

    it("proves all elements contribute to list length via elim-List", () => {
      const str = `${listPreamble}
(claim list-double-length (→ (List Nat) Nat))
(define-tactically list-double-length
  ((intro xs)
   (elim-List xs)
   (then
     (exact 0))
   (then
     (intro x)
     (intro rest)
     (intro ih)
     (exact (+ 2 ih)))))
(claim list-double-length-result (= Nat (list-double-length (:: 1 (:: 2 (:: 3 nil)))) 6))
(define-tactically list-double-length-result
  ((exact (same 6))))
`;
      expect(() => evaluatePie(str)).not.toThrow();
    });

    it("proves map over nil is nil for all f", () => {
      const str = `${listPreamble}
(claim map-nil-general (Π ((A U) (B U) (f (→ A B))) (= (List B) (map A B f (the (List A) nil)) (the (List B) nil))))
(define-tactically map-nil-general
  ((intro A)
   (intro B)
   (intro f)
   (exact (same (the (List B) nil)))))
`;
      expect(() => evaluatePie(str)).not.toThrow();
    });

    it("proves length of cons is successor of length for all lists", () => {
      const str = `${listPreamble}
(claim length-cons
  (Π ((E U) (x E) (xs (List E)))
    (= Nat (length E (:: x xs)) (add1 (length E xs)))))
(define-tactically length-cons
  ((intro E)
   (intro x)
   (intro xs)
   (exact (same (add1 (length E xs))))))
`;
      expect(() => evaluatePie(str)).not.toThrow();
    });

    it("proves map distributes over append for concrete case", () => {
      const str = `${listPreamble}
(claim map-append-concrete
  (= (List Nat)
    (map Nat Nat (+ 1) (append Nat (:: 1 nil) (:: 2 nil)))
    (append Nat (map Nat Nat (+ 1) (:: 1 nil)) (map Nat Nat (+ 1) (:: 2 nil)))))
(define-tactically map-append-concrete
  ((exact (same (:: 2 (:: 3 nil))))))
`;
      expect(() => evaluatePie(str)).not.toThrow();
    });

    it("defines filter-like function: keep zeros only", () => {
      const str = `${listPreamble}
(claim keep-zeros (→ (List Nat) (List Nat)))
(define keep-zeros
  (λ (xs) (rec-List xs (the (List Nat) nil)
    (λ (x rest acc) (which-Nat x (:: 0 acc) (λ (n-1) acc))))))
(claim keep-zeros-result (= Nat (length Nat (keep-zeros (:: 0 (:: 1 (:: 0 (:: 3 nil)))))) 2))
(define-tactically keep-zeros-result
  ((exact (same 2))))
`;
      expect(() => evaluatePie(str)).not.toThrow();
    });

    it("proves sum of (:: a (:: b nil)) = a+b for concrete a=3 b=4", () => {
      const str = `${listPreamble}
(claim sum-pair (= Nat (sum (:: 3 (:: 4 nil))) (+ 3 4)))
(define-tactically sum-pair
  ((exact (same 7))))
`;
      expect(() => evaluatePie(str)).not.toThrow();
    });

    it("tactically counts list elements using elim-List", () => {
      const str = `${arithPreamble}
(claim tac-length (Π ((E U)) (→ (List E) Nat)))
(define-tactically tac-length
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
(tac-length Nat (:: 'a (:: 'b nil)))
`;
      expect(() => evaluatePie(str)).toThrow();
    });

    it("tactically counts Atom list elements using elim-List", () => {
      const str = `${arithPreamble}
(claim tac-length (Π ((E U)) (→ (List E) Nat)))
(define-tactically tac-length
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
(claim tac-length-atom-result (= Nat (tac-length Atom (:: 'a (:: 'b nil))) 2))
(define-tactically tac-length-atom-result
  ((exact (same 2))))
`;
      expect(() => evaluatePie(str)).not.toThrow();
    });

    it("proves append (:: 1 (:: 2 nil)) nil = (:: 1 (:: 2 nil)) by computation", () => {
      const str = `${listPreamble}
(claim append-concrete-nil (= (List Nat) (append Nat (:: 1 (:: 2 nil)) (the (List Nat) nil)) (:: 1 (:: 2 nil))))
(define-tactically append-concrete-nil
  ((exact (same (:: 1 (:: 2 nil))))))
`;
      expect(() => evaluatePie(str)).not.toThrow();
    });

    it("sum of (:: 10 (:: 20 (:: 30 nil))) = 60", () => {
      const str = `${listPreamble}
(claim sum-30 (= Nat (sum (:: 10 (:: 20 (:: 30 nil)))) 60))
(define-tactically sum-30
  ((exact (same 60))))
`;
      expect(() => evaluatePie(str)).not.toThrow();
    });

    it("map-map fusion for concrete case", () => {
      const str = `${listPreamble}
(claim map-map-concrete
  (= (List Nat)
    (map Nat Nat (+ 1) (map Nat Nat (+ 2) (:: 1 (:: 2 nil))))
    (map Nat Nat (+ 3) (:: 1 (:: 2 nil)))))
(define-tactically map-map-concrete
  ((exact (same (:: 4 (:: 5 nil))))))
`;
      expect(() => evaluatePie(str)).not.toThrow();
    });

  });

  describe("Error Cases", () => {

    it("fails when elim-List is used on a Nat", () => {
      const str = `${listPreamble}
(claim bad-list-elim (Π ((n Nat)) Nat))
(define-tactically bad-list-elim
  ((intro n)
   (elim-List n)
   (then
     (exact 0))
   (then
     (intro x)
     (intro rest)
     (intro ih)
     (exact (add1 ih)))))
`;
      expect(() => evaluatePie(str)).toThrow();
    });

    it("fails when then block is missing after elim-List", () => {
      const str = `${listPreamble}
(claim bad-then (Π ((E U)) (→ (List E) Nat)))
(define-tactically bad-then
  ((intro E)
   (intro xs)
   (elim-List xs)
   (exact 0)
   (intro x)
   (intro rest)
   (intro ih)
   (exact (add1 ih))))
`;
      expect(() => evaluatePie(str)).toThrow();
    });

    it("fails with incomplete list induction (nil case only)", () => {
      const str = `${listPreamble}
(claim incomplete-list (Π ((E U)) (→ (List E) Nat)))
(define-tactically incomplete-list
  ((intro E)
   (intro xs)
   (elim-List xs)
   (then
     (exact 0))))
`;
      expect(() => evaluatePie(str)).toThrow();
    });

  });

});
