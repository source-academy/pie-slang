import 'jest';
import { evaluatePie } from '../../main';

const arithPreamble = `
(claim + (→ Nat Nat Nat))
(define + (λ (n j) (iter-Nat n j (λ (x) (add1 x)))))

(claim * (→ Nat Nat Nat))
(define * (λ (n m) (iter-Nat n 0 (+ m))))
`;

const vecPreamble = `${arithPreamble}
(claim replicate (Π ((E U) (n Nat)) (→ E (Vec E n))))
(define replicate (λ (E n e) (ind-Nat n (λ (k) (Vec E k)) vecnil (λ (n-1 ih) (vec:: e ih)))))
`;

describe("Induction on Vectors", () => {

  describe("Vector Construction", () => {

    it("constructs vecnil of Nat", () => {
      const str = `${arithPreamble}
(the (Vec Nat 0) vecnil)
`;
      expect(() => evaluatePie(str)).not.toThrow();
    });

    it("constructs a 1-element vector", () => {
      const str = `${arithPreamble}
(the (Vec Nat 1) (vec:: 5 vecnil))
`;
      expect(() => evaluatePie(str)).not.toThrow();
    });

    it("constructs a 2-element vector", () => {
      const str = `${arithPreamble}
(the (Vec Nat 2) (vec:: 1 (vec:: 2 vecnil)))
`;
      expect(() => evaluatePie(str)).not.toThrow();
    });

    it("constructs a 3-element vector", () => {
      const str = `${arithPreamble}
(the (Vec Nat 3) (vec:: 1 (vec:: 2 (vec:: 3 vecnil))))
`;
      expect(() => evaluatePie(str)).not.toThrow();
    });

    it("constructs a 5-element vector", () => {
      const str = `${arithPreamble}
(the (Vec Nat 5) (vec:: 1 (vec:: 2 (vec:: 3 (vec:: 4 (vec:: 5 vecnil))))))
`;
      expect(() => evaluatePie(str)).not.toThrow();
    });

    it("constructs a vector of Atom", () => {
      const str = `${arithPreamble}
(the (Vec Atom 2) (vec:: 'hello (vec:: 'world vecnil)))
`;
      expect(() => evaluatePie(str)).not.toThrow();
    });

    it("head of a 1-element vector returns the element", () => {
      const str = `${arithPreamble}
(head (the (Vec Nat 1) (vec:: 42 vecnil)))
`;
      const output = evaluatePie(str);
      expect(output).toContain("42: Nat");
    });

    it("head of a 3-element vector returns the first element", () => {
      const str = `${arithPreamble}
(head (the (Vec Nat 3) (vec:: 10 (vec:: 20 (vec:: 30 vecnil)))))
`;
      const output = evaluatePie(str);
      expect(output).toContain("10: Nat");
    });

    it("tail of a 2-element vector has correct type", () => {
      const str = `${arithPreamble}
(the (Vec Nat 1) (tail (the (Vec Nat 2) (vec:: 1 (vec:: 2 vecnil)))))
`;
      expect(() => evaluatePie(str)).not.toThrow();
    });

    it("head of tail gives second element", () => {
      const str = `${arithPreamble}
(head (tail (the (Vec Nat 3) (vec:: 10 (vec:: 20 (vec:: 30 vecnil))))))
`;
      const output = evaluatePie(str);
      expect(output).toContain("20: Nat");
    });

    it("tail of tail of 3-element vector gives 1-element vector", () => {
      const str = `${arithPreamble}
(head (tail (tail (the (Vec Nat 3) (vec:: 10 (vec:: 20 (vec:: 30 vecnil)))))))
`;
      const output = evaluatePie(str);
      expect(output).toContain("30: Nat");
    });

    it("tail of 1-element vector is vecnil", () => {
      const str = `${arithPreamble}
(the (Vec Nat 0) (tail (the (Vec Nat 1) (vec:: 99 vecnil))))
`;
      expect(() => evaluatePie(str)).not.toThrow();
    });

  });

  describe("Vector Functions", () => {

    it("defines vec-sum for concrete 3-element vector using ind-Vec", () => {
      const str = `${arithPreamble}
(claim vec-sum (Π ((n Nat)) (→ (Vec Nat n) Nat)))
(define vec-sum
  (λ (n v)
    (ind-Vec n v
      (λ (k v) Nat)
      0
      (λ (k x xs acc) (+ x acc)))))
(vec-sum 3 (vec:: 1 (vec:: 2 (vec:: 3 vecnil))))
`;
      const output = evaluatePie(str);
      expect(output).toContain("6: Nat");
    });

    it("vec-sum of empty vector = 0", () => {
      const str = `${arithPreamble}
(claim vec-sum (Π ((n Nat)) (→ (Vec Nat n) Nat)))
(define vec-sum
  (λ (n v)
    (ind-Vec n v
      (λ (k v) Nat)
      0
      (λ (k x xs acc) (+ x acc)))))
(vec-sum 0 vecnil)
`;
      const output = evaluatePie(str);
      expect(output).toContain("0: Nat");
    });

    it("vec-sum of (vec:: 10 vecnil) = 10", () => {
      const str = `${arithPreamble}
(claim vec-sum (Π ((n Nat)) (→ (Vec Nat n) Nat)))
(define vec-sum
  (λ (n v)
    (ind-Vec n v
      (λ (k v) Nat)
      0
      (λ (k x xs acc) (+ x acc)))))
(vec-sum 1 (vec:: 10 vecnil))
`;
      const output = evaluatePie(str);
      expect(output).toContain("10: Nat");
    });

    it("defines vec-map using ind-Vec", () => {
      const str = `${arithPreamble}
(claim vec-map (Π ((A U) (B U) (n Nat)) (→ (→ A B) (Vec A n) (Vec B n))))
(define vec-map
  (λ (A B n f v)
    (ind-Vec n v
      (λ (k v) (Vec B k))
      vecnil
      (λ (k x xs acc) (vec:: (f x) acc)))))
`;
      expect(() => evaluatePie(str)).not.toThrow();
    });

    it("vec-map (+ 1) over (vec:: 1 (vec:: 2 vecnil)) gives correct head", () => {
      const str = `${arithPreamble}
(claim vec-map (Π ((A U) (B U) (n Nat)) (→ (→ A B) (Vec A n) (Vec B n))))
(define vec-map
  (λ (A B n f v)
    (ind-Vec n v
      (λ (k v) (Vec B k))
      vecnil
      (λ (k x xs acc) (vec:: (f x) acc)))))
(head (vec-map Nat Nat 2 (+ 1) (vec:: 1 (vec:: 2 vecnil))))
`;
      const output = evaluatePie(str);
      expect(output).toContain("2: Nat");
    });

    it("vec-map (+ 1) over (vec:: 1 (vec:: 2 vecnil)) second element is 3", () => {
      const str = `${arithPreamble}
(claim vec-map (Π ((A U) (B U) (n Nat)) (→ (→ A B) (Vec A n) (Vec B n))))
(define vec-map
  (λ (A B n f v)
    (ind-Vec n v
      (λ (k v) (Vec B k))
      vecnil
      (λ (k x xs acc) (vec:: (f x) acc)))))
(head (tail (vec-map Nat Nat 2 (+ 1) (vec:: 1 (vec:: 2 vecnil)))))
`;
      const output = evaluatePie(str);
      expect(output).toContain("3: Nat");
    });

    it("vec-map over vecnil returns vecnil", () => {
      const str = `${arithPreamble}
(claim vec-map (Π ((A U) (B U) (n Nat)) (→ (→ A B) (Vec A n) (Vec B n))))
(define vec-map
  (λ (A B n f v)
    (ind-Vec n v
      (λ (k v) (Vec B k))
      vecnil
      (λ (k x xs acc) (vec:: (f x) acc)))))
(the (Vec Nat 0) (vec-map Nat Nat 0 (+ 1) vecnil))
`;
      expect(() => evaluatePie(str)).not.toThrow();
    });

    it("defines vec-zip for pairs", () => {
      const str = `${arithPreamble}
(claim my-head (Π ((E U) (n Nat)) (→ (Vec E (add1 n)) E)))
(define my-head (λ (E n v) (head v)))
(claim my-tail (Π ((E U) (n Nat)) (→ (Vec E (add1 n)) (Vec E n))))
(define my-tail (λ (E n v) (tail v)))
(claim vec-zip-go (Π ((A U) (B U) (n Nat)) (→ (Vec A n) (Vec B n) (Vec (Σ ((a A)) B) n))))
(define vec-zip-go
  (λ (A B n)
    (ind-Nat n
      (λ (k) (→ (Vec A k) (Vec B k) (Vec (Σ ((a A)) B) k)))
      (λ (va vb) vecnil)
      (λ (n-1 f)
        (λ (va vb)
          (vec:: (the (Σ ((a A)) B) (cons (my-head A n-1 va) (my-head B n-1 vb)))
                 (f (my-tail A n-1 va) (my-tail B n-1 vb))))))))
(claim vec-zip (Π ((A U) (B U) (n Nat)) (→ (Vec A n) (Vec B n) (Vec (Σ ((a A)) B) n))))
(define vec-zip (λ (A B n va vb) (vec-zip-go A B n va vb)))
`;
      expect(() => evaluatePie(str)).not.toThrow();
    });

    it("vec-zip of two 2-element vectors gives correct first pair", () => {
      const str = `${arithPreamble}
(claim my-head (Π ((E U) (n Nat)) (→ (Vec E (add1 n)) E)))
(define my-head (λ (E n v) (head v)))
(claim my-tail (Π ((E U) (n Nat)) (→ (Vec E (add1 n)) (Vec E n))))
(define my-tail (λ (E n v) (tail v)))
(claim vec-zip-go (Π ((A U) (B U) (n Nat)) (→ (Vec A n) (Vec B n) (Vec (Σ ((a A)) B) n))))
(define vec-zip-go
  (λ (A B n)
    (ind-Nat n
      (λ (k) (→ (Vec A k) (Vec B k) (Vec (Σ ((a A)) B) k)))
      (λ (va vb) vecnil)
      (λ (n-1 f)
        (λ (va vb)
          (vec:: (the (Σ ((a A)) B) (cons (my-head A n-1 va) (my-head B n-1 vb)))
                 (f (my-tail A n-1 va) (my-tail B n-1 vb))))))))
(claim vec-zip (Π ((A U) (B U) (n Nat)) (→ (Vec A n) (Vec B n) (Vec (Σ ((a A)) B) n))))
(define vec-zip (λ (A B n va vb) (vec-zip-go A B n va vb)))
(car (head (vec-zip Nat Nat 2 (the (Vec Nat 2) (vec:: 1 (vec:: 2 vecnil))) (the (Vec Nat 2) (vec:: 10 (vec:: 20 vecnil))))))
`;
      const output = evaluatePie(str);
      expect(output).toContain("1: Nat");
    });

    it("vec-zip first pair cdr is from second vector", () => {
      const str = `${arithPreamble}
(claim my-head (Π ((E U) (n Nat)) (→ (Vec E (add1 n)) E)))
(define my-head (λ (E n v) (head v)))
(claim my-tail (Π ((E U) (n Nat)) (→ (Vec E (add1 n)) (Vec E n))))
(define my-tail (λ (E n v) (tail v)))
(claim vec-zip-go (Π ((A U) (B U) (n Nat)) (→ (Vec A n) (Vec B n) (Vec (Σ ((a A)) B) n))))
(define vec-zip-go
  (λ (A B n)
    (ind-Nat n
      (λ (k) (→ (Vec A k) (Vec B k) (Vec (Σ ((a A)) B) k)))
      (λ (va vb) vecnil)
      (λ (n-1 f)
        (λ (va vb)
          (vec:: (the (Σ ((a A)) B) (cons (my-head A n-1 va) (my-head B n-1 vb)))
                 (f (my-tail A n-1 va) (my-tail B n-1 vb))))))))
(claim vec-zip (Π ((A U) (B U) (n Nat)) (→ (Vec A n) (Vec B n) (Vec (Σ ((a A)) B) n))))
(define vec-zip (λ (A B n va vb) (vec-zip-go A B n va vb)))
(cdr (head (vec-zip Nat Nat 2 (the (Vec Nat 2) (vec:: 1 (vec:: 2 vecnil))) (the (Vec Nat 2) (vec:: 10 (vec:: 20 vecnil))))))
`;
      const output = evaluatePie(str);
      expect(output).toContain("10: Nat");
    });

    it("defines vec-to-list using ind-Vec", () => {
      const str = `${arithPreamble}
(claim vec-to-list (Π ((E U) (n Nat)) (→ (Vec E n) (List E))))
(define vec-to-list
  (λ (E n v)
    (ind-Vec n v
      (λ (k v) (List E))
      (the (List E) nil)
      (λ (k x xs acc) (:: x acc)))))
`;
      expect(() => evaluatePie(str)).not.toThrow();
    });

    it("vec-to-list of 3-element vector produces correct list", () => {
      const str = `${arithPreamble}
(claim vec-to-list (Π ((E U) (n Nat)) (→ (Vec E n) (List E))))
(define vec-to-list
  (λ (E n v)
    (ind-Vec n v
      (λ (k v) (List E))
      (the (List E) nil)
      (λ (k x xs acc) (:: x acc)))))

(claim length (Π ((E U)) (→ (List E) Nat)))
(define length (λ (E xs) (rec-List xs 0 (λ (x rest n) (add1 n)))))

(length Nat (vec-to-list Nat 3 (the (Vec Nat 3) (vec:: 1 (vec:: 2 (vec:: 3 vecnil))))))
`;
      const output = evaluatePie(str);
      expect(output).toContain("3: Nat");
    });

  });

  describe("Replicate", () => {

    it("replicate 0 produces vecnil", () => {
      const str = `${vecPreamble}
(the (Vec Nat 0) (replicate Nat 0 42))
`;
      expect(() => evaluatePie(str)).not.toThrow();
    });

    it("replicate 1 produces a single-element vector", () => {
      const str = `${vecPreamble}
(head (replicate Nat 1 42))
`;
      const output = evaluatePie(str);
      expect(output).toContain("42: Nat");
    });

    it("replicate 3 produces a 3-element vector", () => {
      const str = `${vecPreamble}
(head (replicate Nat 3 7))
`;
      const output = evaluatePie(str);
      expect(output).toContain("7: Nat");
    });

    it("all elements of replicate are the same (check second)", () => {
      const str = `${vecPreamble}
(head (tail (replicate Nat 3 7)))
`;
      const output = evaluatePie(str);
      expect(output).toContain("7: Nat");
    });

    it("all elements of replicate are the same (check third)", () => {
      const str = `${vecPreamble}
(head (tail (tail (replicate Nat 3 7))))
`;
      const output = evaluatePie(str);
      expect(output).toContain("7: Nat");
    });

    it("defines replicate tactically using elim-Nat", () => {
      const str = `${arithPreamble}
(claim tac-replicate (Π ((E U) (n Nat)) (→ E (Vec E n))))
(define-tactically tac-replicate
  ((intro E)
   (intro n)
   (intro e)
   (elim-Nat n)
   (then
     (exact vecnil))
   (then
     (intro n-1)
     (intro ih)
     (exact (vec:: e ih)))))
(head (tac-replicate Nat 2 99))
`;
      const output = evaluatePie(str);
      expect(output).toContain("99: Nat");
    });

    it("tactically defined replicate at size 0 type-checks", () => {
      const str = `${arithPreamble}
(claim tac-replicate (Π ((E U) (n Nat)) (→ E (Vec E n))))
(define-tactically tac-replicate
  ((intro E)
   (intro n)
   (intro e)
   (elim-Nat n)
   (then
     (exact vecnil))
   (then
     (intro n-1)
     (intro ih)
     (exact (vec:: e ih)))))
(the (Vec Nat 0) (tac-replicate Nat 0 5))
`;
      expect(() => evaluatePie(str)).not.toThrow();
    });

    it("replicate with Atom type works", () => {
      const str = `${vecPreamble}
(head (replicate Atom 2 'hello))
`;
      const output = evaluatePie(str);
      expect(output).toContain("'hello");
    });

    it("replicate 5 produces valid Vec of correct type", () => {
      const str = `${vecPreamble}
(the (Vec Nat 5) (replicate Nat 5 0))
`;
      expect(() => evaluatePie(str)).not.toThrow();
    });

    it("tail of replicate (n+1) is replicate n for concrete case", () => {
      const str = `${vecPreamble}
(head (tail (replicate Nat 4 8)))
`;
      const output = evaluatePie(str);
      expect(output).toContain("8: Nat");
    });

  });

  describe("Vector Operations", () => {

    it("defines vec-append using ind-Nat for type-level addition", () => {
      const str = `${arithPreamble}
(claim vec-append (Π ((E U) (n Nat) (m Nat)) (→ (Vec E n) (Vec E m) (Vec E (+ n m)))))
(define vec-append
  (λ (E n m vn vm)
    (ind-Vec n vn
      (λ (k v) (Vec E (+ k m)))
      vm
      (λ (k x xs acc) (vec:: x acc)))))
`;
      expect(() => evaluatePie(str)).not.toThrow();
    });

    it("vec-append of vecnil and v gives v", () => {
      const str = `${arithPreamble}
(claim vec-append (Π ((E U) (n Nat) (m Nat)) (→ (Vec E n) (Vec E m) (Vec E (+ n m)))))
(define vec-append
  (λ (E n m vn vm)
    (ind-Vec n vn
      (λ (k v) (Vec E (+ k m)))
      vm
      (λ (k x xs acc) (vec:: x acc)))))
(head (vec-append Nat 0 2 vecnil (vec:: 10 (vec:: 20 vecnil))))
`;
      const output = evaluatePie(str);
      expect(output).toContain("10: Nat");
    });

    it("vec-append of two 1-element vectors gives 2-element vector", () => {
      const str = `${arithPreamble}
(claim vec-append (Π ((E U) (n Nat) (m Nat)) (→ (Vec E n) (Vec E m) (Vec E (+ n m)))))
(define vec-append
  (λ (E n m vn vm)
    (ind-Vec n vn
      (λ (k v) (Vec E (+ k m)))
      vm
      (λ (k x xs acc) (vec:: x acc)))))
(head (vec-append Nat 1 1 (vec:: 1 vecnil) (vec:: 2 vecnil)))
`;
      const output = evaluatePie(str);
      expect(output).toContain("1: Nat");
    });

    it("second element of vec-append is correct", () => {
      const str = `${arithPreamble}
(claim vec-append (Π ((E U) (n Nat) (m Nat)) (→ (Vec E n) (Vec E m) (Vec E (+ n m)))))
(define vec-append
  (λ (E n m vn vm)
    (ind-Vec n vn
      (λ (k v) (Vec E (+ k m)))
      vm
      (λ (k x xs acc) (vec:: x acc)))))
(head (tail (vec-append Nat 1 1 (vec:: 1 vecnil) (vec:: 2 vecnil))))
`;
      const output = evaluatePie(str);
      expect(output).toContain("2: Nat");
    });

    it("vec-append of (vec:: 1 (vec:: 2 vecnil)) and (vec:: 3 vecnil) has correct length type", () => {
      const str = `${arithPreamble}
(claim vec-append (Π ((E U) (n Nat) (m Nat)) (→ (Vec E n) (Vec E m) (Vec E (+ n m)))))
(define vec-append
  (λ (E n m vn vm)
    (ind-Vec n vn
      (λ (k v) (Vec E (+ k m)))
      vm
      (λ (k x xs acc) (vec:: x acc)))))
(the (Vec Nat 3) (vec-append Nat 2 1 (vec:: 1 (vec:: 2 vecnil)) (vec:: 3 vecnil)))
`;
      expect(() => evaluatePie(str)).not.toThrow();
    });

    it("defines vec-reverse using ind-Vec with accumulator pattern", () => {
      const str = `${arithPreamble}
(claim n+0=n (Π ((n Nat)) (= Nat (+ n 0) n)))
(define n+0=n (λ (n) (ind-Nat n (λ (k) (= Nat (+ k 0) k)) (same 0) (λ (n-1 ih) (cong ih (+ 1))))))

(claim +add1 (Π ((n Nat) (m Nat)) (= Nat (+ n (add1 m)) (add1 (+ n m)))))
(define +add1 (λ (n m) (ind-Nat n (λ (k) (= Nat (+ k (add1 m)) (add1 (+ k m)))) (same (add1 m)) (λ (n-1 ih) (cong ih (+ 1))))))
`;
      expect(() => evaluatePie(str)).not.toThrow();
    });

    it("vec-map (+ 10) over 3-element vector produces correct first element", () => {
      const str = `${arithPreamble}
(claim vec-map (Π ((A U) (B U) (n Nat)) (→ (→ A B) (Vec A n) (Vec B n))))
(define vec-map
  (λ (A B n f v)
    (ind-Vec n v
      (λ (k v) (Vec B k))
      vecnil
      (λ (k x xs acc) (vec:: (f x) acc)))))
(head (vec-map Nat Nat 3 (+ 10) (vec:: 1 (vec:: 2 (vec:: 3 vecnil)))))
`;
      const output = evaluatePie(str);
      expect(output).toContain("11: Nat");
    });

    it("vec-map (* 2) over 2-element vector gives correct second element", () => {
      const str = `${arithPreamble}
(claim vec-map (Π ((A U) (B U) (n Nat)) (→ (→ A B) (Vec A n) (Vec B n))))
(define vec-map
  (λ (A B n f v)
    (ind-Vec n v
      (λ (k v) (Vec B k))
      vecnil
      (λ (k x xs acc) (vec:: (f x) acc)))))
(head (tail (vec-map Nat Nat 2 (* 2) (vec:: 3 (vec:: 4 vecnil)))))
`;
      const output = evaluatePie(str);
      expect(output).toContain("8: Nat");
    });

    it("defines vec-count using ind-Vec", () => {
      const str = `${arithPreamble}
(claim vec-count (Π ((n Nat)) (→ (Vec Nat n) Nat)))
(define vec-count
  (λ (n v)
    (ind-Vec n v
      (λ (k v) Nat)
      0
      (λ (k x xs acc) (add1 acc)))))
(vec-count 3 (vec:: 1 (vec:: 2 (vec:: 3 vecnil))))
`;
      const output = evaluatePie(str);
      expect(output).toContain("3: Nat");
    });

    it("vec-count of empty vector = 0", () => {
      const str = `${arithPreamble}
(claim vec-count (Π ((n Nat)) (→ (Vec Nat n) Nat)))
(define vec-count
  (λ (n v)
    (ind-Vec n v
      (λ (k v) Nat)
      0
      (λ (k x xs acc) (add1 acc)))))
(vec-count 0 vecnil)
`;
      const output = evaluatePie(str);
      expect(output).toContain("0: Nat");
    });

    it("head of vec-map id is same as head of original", () => {
      const str = `${arithPreamble}
(claim vec-map (Π ((A U) (B U) (n Nat)) (→ (→ A B) (Vec A n) (Vec B n))))
(define vec-map
  (λ (A B n f v)
    (ind-Vec n v
      (λ (k v) (Vec B k))
      vecnil
      (λ (k x xs acc) (vec:: (f x) acc)))))

(claim id (→ Nat Nat))
(define id (λ (x) x))
(head (vec-map Nat Nat 2 id (vec:: 42 (vec:: 7 vecnil))))
`;
      const output = evaluatePie(str);
      expect(output).toContain("42: Nat");
    });

    it("vec-sum of appended vectors equals sum of parts for concrete case", () => {
      const str = `${arithPreamble}
(claim vec-sum (Π ((n Nat)) (→ (Vec Nat n) Nat)))
(define vec-sum
  (λ (n v)
    (ind-Vec n v
      (λ (k v) Nat)
      0
      (λ (k x xs acc) (+ x acc)))))

(claim vec-append (Π ((E U) (n Nat) (m Nat)) (→ (Vec E n) (Vec E m) (Vec E (+ n m)))))
(define vec-append
  (λ (E n m vn vm)
    (ind-Vec n vn
      (λ (k v) (Vec E (+ k m)))
      vm
      (λ (k x xs acc) (vec:: x acc)))))

(claim sum-append-check (= Nat (vec-sum 3 (vec-append Nat 2 1 (vec:: 1 (vec:: 2 vecnil)) (vec:: 3 vecnil))) (+ (vec-sum 2 (vec:: 1 (vec:: 2 vecnil))) (vec-sum 1 (vec:: 3 vecnil)))))
(define-tactically sum-append-check
  ((exact (same 6))))
`;
      expect(() => evaluatePie(str)).not.toThrow();
    });

  });

  describe("Error Cases", () => {

    it("fails when vec:: element type mismatches", () => {
      const str = `${arithPreamble}
(the (Vec Nat 1) (vec:: 'hello vecnil))
`;
      expect(() => evaluatePie(str)).toThrow();
    });

    it("fails when vector length does not match type", () => {
      const str = `${arithPreamble}
(the (Vec Nat 3) (vec:: 1 (vec:: 2 vecnil)))
`;
      expect(() => evaluatePie(str)).toThrow();
    });

    it("fails when head is applied to vecnil", () => {
      const str = `${arithPreamble}
(head vecnil)
`;
      expect(() => evaluatePie(str)).toThrow();
    });

    it("fails when tail is applied to vecnil", () => {
      const str = `${arithPreamble}
(tail vecnil)
`;
      expect(() => evaluatePie(str)).toThrow();
    });

  });

});
