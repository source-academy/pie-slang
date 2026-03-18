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

(claim reverse (Π ((E U)) (→ (List E) (List E))))
(define reverse (λ (E xs) (rec-List xs (the (List E) nil) (λ (x rest acc) (append E acc (:: x nil))))))
`;

const arithLemmas = `
(claim n+0=n (Π ((n Nat)) (= Nat (+ n 0) n)))
(define-tactically n+0=n
  ((intro n) (elim-Nat n)
   (then (exact (same 0)))
   (then (intro n-1) (intro ih) (exact (cong ih (+ 1))))))

(claim +add1 (Π ((n Nat) (m Nat)) (= Nat (+ n (add1 m)) (add1 (+ n m)))))
(define-tactically +add1
  ((intro n) (intro m) (elim-Nat n)
   (then (exact (same (add1 m))))
   (then (intro n-1) (intro ih) (exact (cong ih (+ 1))))))

(claim +-assoc (Π ((a Nat) (b Nat) (c Nat)) (= Nat (+ (+ a b) c) (+ a (+ b c)))))
(define-tactically +-assoc
  ((intro a) (intro b) (intro c) (elim-Nat a)
   (then (exact (same (+ b c))))
   (then (intro a-1) (intro ih) (exact (cong ih (+ 1))))))
`;

describe("Universal List Properties — Complex Tactic Proofs", () => {

  describe("append-nil-right: append xs nil = xs", () => {

    it("proves append-nil-right by list induction with cong", () => {
      const str = `${listPreamble}
(claim append-nil-right (Π ((E U) (xs (List E))) (= (List E) (append E xs (the (List E) nil)) xs)))
(define append-nil-right
  (λ (E xs)
    (ind-List xs
      (λ (l) (= (List E) (append E l (the (List E) nil)) l))
      (same (the (List E) nil))
      (λ (x rest ih) (cong ih (the (→ (List E) (List E)) (λ (tl) (:: x tl))))))))
`;
      expect(() => evaluatePie(str)).not.toThrow();
    });

    it("proves append-nil-right via exact ind-List fallback", () => {
      const str = `${listPreamble}
(claim append-nil-right (Π ((E U) (xs (List E))) (= (List E) (append E xs (the (List E) nil)) xs)))
(define-tactically append-nil-right
  ((intro E) (intro xs)
   (exact (ind-List xs
     (λ (l) (= (List E) (append E l (the (List E) nil)) l))
     (same (the (List E) nil))
     (λ (x rest ih) (cong ih (the (→ (List E) (List E)) (λ (tl) (:: x tl)))))))))
`;
      expect(() => evaluatePie(str)).not.toThrow();
    });

    it("verifies append-nil-right on concrete (:: 1 (:: 2 nil))", () => {
      const str = `${listPreamble}
(claim append-nil-right (Π ((E U) (xs (List E))) (= (List E) (append E xs (the (List E) nil)) xs)))
(define-tactically append-nil-right
  ((intro E) (intro xs)
   (exact (ind-List xs
     (λ (l) (= (List E) (append E l (the (List E) nil)) l))
     (same (the (List E) nil))
     (λ (x rest ih) (cong ih (the (→ (List E) (List E)) (λ (tl) (:: x tl)))))))))
(append-nil-right Nat (:: 1 (:: 2 nil)))
`;
      const output = evaluatePie(str);
      expect(output).toContain("(same");
    });

    it("verifies append-nil-right on nil", () => {
      const str = `${listPreamble}
(claim append-nil-right (Π ((E U) (xs (List E))) (= (List E) (append E xs (the (List E) nil)) xs)))
(define-tactically append-nil-right
  ((intro E) (intro xs)
   (exact (ind-List xs
     (λ (l) (= (List E) (append E l (the (List E) nil)) l))
     (same (the (List E) nil))
     (λ (x rest ih) (cong ih (the (→ (List E) (List E)) (λ (tl) (:: x tl)))))))))
(append-nil-right Nat (the (List Nat) nil))
`;
      const output = evaluatePie(str);
      expect(output).toContain("(same nil)");
    });

  });

  describe("append-assoc: append (append xs ys) zs = append xs (append ys zs)", () => {

    it("proves append-assoc by list induction with cong", () => {
      const str = `${listPreamble}
(claim append-assoc
  (Π ((E U) (xs (List E)) (ys (List E)) (zs (List E)))
    (= (List E) (append E (append E xs ys) zs) (append E xs (append E ys zs)))))
(define append-assoc
  (λ (E xs ys zs)
    (ind-List xs
      (λ (l) (= (List E) (append E (append E l ys) zs) (append E l (append E ys zs))))
      (same (append E ys zs))
      (λ (x rest ih) (cong ih (the (→ (List E) (List E)) (λ (tl) (:: x tl))))))))
`;
      expect(() => evaluatePie(str)).not.toThrow();
    });

    it("proves append-assoc via exact ind-List fallback", () => {
      const str = `${listPreamble}
(claim append-assoc
  (Π ((E U) (xs (List E)) (ys (List E)) (zs (List E)))
    (= (List E) (append E (append E xs ys) zs) (append E xs (append E ys zs)))))
(define-tactically append-assoc
  ((intro E) (intro xs) (intro ys) (intro zs)
   (exact (ind-List xs
     (λ (l) (= (List E) (append E (append E l ys) zs) (append E l (append E ys zs))))
     (same (append E ys zs))
     (λ (x rest ih) (cong ih (the (→ (List E) (List E)) (λ (tl) (:: x tl)))))))))
`;
      expect(() => evaluatePie(str)).not.toThrow();
    });

    it("verifies append-assoc on concrete lists", () => {
      const str = `${listPreamble}
(claim append-assoc
  (Π ((E U) (xs (List E)) (ys (List E)) (zs (List E)))
    (= (List E) (append E (append E xs ys) zs) (append E xs (append E ys zs)))))
(define-tactically append-assoc
  ((intro E) (intro xs) (intro ys) (intro zs)
   (exact (ind-List xs
     (λ (l) (= (List E) (append E (append E l ys) zs) (append E l (append E ys zs))))
     (same (append E ys zs))
     (λ (x rest ih) (cong ih (the (→ (List E) (List E)) (λ (tl) (:: x tl)))))))))
(append-assoc Nat (:: 1 nil) (:: 2 nil) (:: 3 nil))
`;
      const output = evaluatePie(str);
      expect(output).toContain("(same");
    });

    it("verifies append-assoc with nil first argument", () => {
      const str = `${listPreamble}
(claim append-assoc
  (Π ((E U) (xs (List E)) (ys (List E)) (zs (List E)))
    (= (List E) (append E (append E xs ys) zs) (append E xs (append E ys zs)))))
(define-tactically append-assoc
  ((intro E) (intro xs) (intro ys) (intro zs)
   (exact (ind-List xs
     (λ (l) (= (List E) (append E (append E l ys) zs) (append E l (append E ys zs))))
     (same (append E ys zs))
     (λ (x rest ih) (cong ih (the (→ (List E) (List E)) (λ (tl) (:: x tl)))))))))
(append-assoc Nat (the (List Nat) nil) (:: 1 (:: 2 nil)) (:: 3 nil))
`;
      const output = evaluatePie(str);
      expect(output).toContain("(same");
    });

  });

  describe("length-append: length (append xs ys) = length xs + length ys", () => {

    it("proves length-append by list induction with cong (+ 1)", () => {
      const str = `${listPreamble}${arithLemmas}
(claim length-append
  (Π ((E U) (xs (List E)) (ys (List E)))
    (= Nat (length E (append E xs ys)) (+ (length E xs) (length E ys)))))
(define length-append
  (λ (E xs ys)
    (ind-List xs
      (λ (l) (= Nat (length E (append E l ys)) (+ (length E l) (length E ys))))
      (same (length E ys))
      (λ (x rest ih) (cong ih (+ 1))))))
`;
      expect(() => evaluatePie(str)).not.toThrow();
    });

    it("proves length-append via exact ind-List fallback", () => {
      const str = `${listPreamble}${arithLemmas}
(claim length-append
  (Π ((E U) (xs (List E)) (ys (List E)))
    (= Nat (length E (append E xs ys)) (+ (length E xs) (length E ys)))))
(define-tactically length-append
  ((intro E) (intro xs) (intro ys)
   (exact (ind-List xs
     (λ (l) (= Nat (length E (append E l ys)) (+ (length E l) (length E ys))))
     (same (length E ys))
     (λ (x rest ih) (cong ih (+ 1)))))))
`;
      expect(() => evaluatePie(str)).not.toThrow();
    });

    it("verifies length-append on (:: 1 (:: 2 nil)) and (:: 3 nil)", () => {
      const str = `${listPreamble}${arithLemmas}
(claim length-append
  (Π ((E U) (xs (List E)) (ys (List E)))
    (= Nat (length E (append E xs ys)) (+ (length E xs) (length E ys)))))
(define-tactically length-append
  ((intro E) (intro xs) (intro ys)
   (exact (ind-List xs
     (λ (l) (= Nat (length E (append E l ys)) (+ (length E l) (length E ys))))
     (same (length E ys))
     (λ (x rest ih) (cong ih (+ 1)))))))
(length-append Nat (:: 1 (:: 2 nil)) (:: 3 nil))
`;
      const output = evaluatePie(str);
      expect(output).toContain("(same 3)");
    });

    it("verifies length-append with nil first argument", () => {
      const str = `${listPreamble}${arithLemmas}
(claim length-append
  (Π ((E U) (xs (List E)) (ys (List E)))
    (= Nat (length E (append E xs ys)) (+ (length E xs) (length E ys)))))
(define-tactically length-append
  ((intro E) (intro xs) (intro ys)
   (exact (ind-List xs
     (λ (l) (= Nat (length E (append E l ys)) (+ (length E l) (length E ys))))
     (same (length E ys))
     (λ (x rest ih) (cong ih (+ 1)))))))
(length-append Nat (the (List Nat) nil) (:: 1 (:: 2 nil)))
`;
      const output = evaluatePie(str);
      expect(output).toContain("(same 2)");
    });

  });

  describe("map-length: length (map f xs) = length xs", () => {

    it("proves map-length by list induction with cong (+ 1)", () => {
      const str = `${listPreamble}${arithLemmas}
(claim map-length
  (Π ((A U) (B U) (f (→ A B)) (xs (List A)))
    (= Nat (length B (map A B f xs)) (length A xs))))
(define map-length
  (λ (A B f xs)
    (ind-List xs
      (λ (l) (= Nat (length B (map A B f l)) (length A l)))
      (same 0)
      (λ (x rest ih) (cong ih (+ 1))))))
`;
      expect(() => evaluatePie(str)).not.toThrow();
    });

    it("proves map-length via exact ind-List fallback", () => {
      const str = `${listPreamble}${arithLemmas}
(claim map-length
  (Π ((A U) (B U) (f (→ A B)) (xs (List A)))
    (= Nat (length B (map A B f xs)) (length A xs))))
(define-tactically map-length
  ((intro A) (intro B) (intro f) (intro xs)
   (exact (ind-List xs
     (λ (l) (= Nat (length B (map A B f l)) (length A l)))
     (same 0)
     (λ (x rest ih) (cong ih (+ 1)))))))
`;
      expect(() => evaluatePie(str)).not.toThrow();
    });

    it("verifies map-length on (:: 1 (:: 2 (:: 3 nil))) with (+ 1)", () => {
      const str = `${listPreamble}${arithLemmas}
(claim map-length
  (Π ((A U) (B U) (f (→ A B)) (xs (List A)))
    (= Nat (length B (map A B f xs)) (length A xs))))
(define-tactically map-length
  ((intro A) (intro B) (intro f) (intro xs)
   (exact (ind-List xs
     (λ (l) (= Nat (length B (map A B f l)) (length A l)))
     (same 0)
     (λ (x rest ih) (cong ih (+ 1)))))))
(map-length Nat Nat (+ 1) (:: 1 (:: 2 (:: 3 nil))))
`;
      const output = evaluatePie(str);
      expect(output).toContain("(same 3)");
    });

    it("verifies map-length on nil", () => {
      const str = `${listPreamble}${arithLemmas}
(claim map-length
  (Π ((A U) (B U) (f (→ A B)) (xs (List A)))
    (= Nat (length B (map A B f xs)) (length A xs))))
(define-tactically map-length
  ((intro A) (intro B) (intro f) (intro xs)
   (exact (ind-List xs
     (λ (l) (= Nat (length B (map A B f l)) (length A l)))
     (same 0)
     (λ (x rest ih) (cong ih (+ 1)))))))
(map-length Nat Nat (+ 1) (the (List Nat) nil))
`;
      const output = evaluatePie(str);
      expect(output).toContain("(same 0)");
    });

  });

  describe("map-append: map f (append xs ys) = append (map f xs) (map f ys)", () => {

    it("proves map-append by list induction with cong", () => {
      const str = `${listPreamble}${arithLemmas}
(claim map-append
  (Π ((A U) (B U) (f (→ A B)) (xs (List A)) (ys (List A)))
    (= (List B) (map A B f (append A xs ys)) (append B (map A B f xs) (map A B f ys)))))
(define map-append
  (λ (A B f xs ys)
    (ind-List xs
      (λ (l) (= (List B) (map A B f (append A l ys)) (append B (map A B f l) (map A B f ys))))
      (same (map A B f ys))
      (λ (x rest ih) (cong ih (the (→ (List B) (List B)) (λ (tl) (:: (f x) tl))))))))
`;
      expect(() => evaluatePie(str)).not.toThrow();
    });

    it("proves map-append via exact ind-List fallback", () => {
      const str = `${listPreamble}${arithLemmas}
(claim map-append
  (Π ((A U) (B U) (f (→ A B)) (xs (List A)) (ys (List A)))
    (= (List B) (map A B f (append A xs ys)) (append B (map A B f xs) (map A B f ys)))))
(define-tactically map-append
  ((intro A) (intro B) (intro f) (intro xs) (intro ys)
   (exact (ind-List xs
     (λ (l) (= (List B) (map A B f (append A l ys)) (append B (map A B f l) (map A B f ys))))
     (same (map A B f ys))
     (λ (x rest ih) (cong ih (the (→ (List B) (List B)) (λ (tl) (:: (f x) tl)))))))))
`;
      expect(() => evaluatePie(str)).not.toThrow();
    });

    it("verifies map-append on concrete lists", () => {
      const str = `${listPreamble}${arithLemmas}
(claim map-append
  (Π ((A U) (B U) (f (→ A B)) (xs (List A)) (ys (List A)))
    (= (List B) (map A B f (append A xs ys)) (append B (map A B f xs) (map A B f ys)))))
(define-tactically map-append
  ((intro A) (intro B) (intro f) (intro xs) (intro ys)
   (exact (ind-List xs
     (λ (l) (= (List B) (map A B f (append A l ys)) (append B (map A B f l) (map A B f ys))))
     (same (map A B f ys))
     (λ (x rest ih) (cong ih (the (→ (List B) (List B)) (λ (tl) (:: (f x) tl)))))))))
(map-append Nat Nat (+ 1) (:: 1 (:: 2 nil)) (:: 3 nil))
`;
      const output = evaluatePie(str);
      expect(output).toContain("(same");
    });

    it("verifies map-append with nil first list", () => {
      const str = `${listPreamble}${arithLemmas}
(claim map-append
  (Π ((A U) (B U) (f (→ A B)) (xs (List A)) (ys (List A)))
    (= (List B) (map A B f (append A xs ys)) (append B (map A B f xs) (map A B f ys)))))
(define-tactically map-append
  ((intro A) (intro B) (intro f) (intro xs) (intro ys)
   (exact (ind-List xs
     (λ (l) (= (List B) (map A B f (append A l ys)) (append B (map A B f l) (map A B f ys))))
     (same (map A B f ys))
     (λ (x rest ih) (cong ih (the (→ (List B) (List B)) (λ (tl) (:: (f x) tl)))))))))
(map-append Nat Nat (+ 1) (the (List Nat) nil) (:: 3 (:: 4 nil)))
`;
      const output = evaluatePie(str);
      expect(output).toContain("(same");
    });

  });

  describe("map-id: map id xs = xs", () => {

    it("proves map-id by list induction with cong", () => {
      const str = `${listPreamble}${arithLemmas}
(claim map-id
  (Π ((A U) (xs (List A)))
    (= (List A) (map A A (λ (x) x) xs) xs)))
(define map-id
  (λ (A xs)
    (ind-List xs
      (λ (l) (= (List A) (map A A (λ (x) x) l) l))
      (same (the (List A) nil))
      (λ (x rest ih) (cong ih (the (→ (List A) (List A)) (λ (tl) (:: x tl))))))))
`;
      expect(() => evaluatePie(str)).not.toThrow();
    });

    it("proves map-id via exact ind-List fallback", () => {
      const str = `${listPreamble}${arithLemmas}
(claim map-id
  (Π ((A U) (xs (List A)))
    (= (List A) (map A A (λ (x) x) xs) xs)))
(define-tactically map-id
  ((intro A) (intro xs)
   (exact (ind-List xs
     (λ (l) (= (List A) (map A A (λ (x) x) l) l))
     (same (the (List A) nil))
     (λ (x rest ih) (cong ih (the (→ (List A) (List A)) (λ (tl) (:: x tl)))))))))
`;
      expect(() => evaluatePie(str)).not.toThrow();
    });

    it("verifies map-id on concrete (:: 1 (:: 2 (:: 3 nil)))", () => {
      const str = `${listPreamble}${arithLemmas}
(claim map-id
  (Π ((A U) (xs (List A)))
    (= (List A) (map A A (λ (x) x) xs) xs)))
(define-tactically map-id
  ((intro A) (intro xs)
   (exact (ind-List xs
     (λ (l) (= (List A) (map A A (λ (x) x) l) l))
     (same (the (List A) nil))
     (λ (x rest ih) (cong ih (the (→ (List A) (List A)) (λ (tl) (:: x tl)))))))))
(map-id Nat (:: 1 (:: 2 (:: 3 nil))))
`;
      const output = evaluatePie(str);
      expect(output).toContain("(same");
    });

    it("verifies map-id on nil", () => {
      const str = `${listPreamble}${arithLemmas}
(claim map-id
  (Π ((A U) (xs (List A)))
    (= (List A) (map A A (λ (x) x) xs) xs)))
(define-tactically map-id
  ((intro A) (intro xs)
   (exact (ind-List xs
     (λ (l) (= (List A) (map A A (λ (x) x) l) l))
     (same (the (List A) nil))
     (λ (x rest ih) (cong ih (the (→ (List A) (List A)) (λ (tl) (:: x tl)))))))))
(map-id Nat (the (List Nat) nil))
`;
      const output = evaluatePie(str);
      expect(output).toContain("(same nil)");
    });

  });

  describe("reverse-nil and reverse-singleton", () => {

    it("proves reverse-nil: reverse nil = nil", () => {
      const str = `${listPreamble}
(claim reverse-nil (Π ((E U)) (= (List E) (reverse E (the (List E) nil)) (the (List E) nil))))
(define-tactically reverse-nil
  ((intro E) (exact (same (the (List E) nil)))))
`;
      expect(() => evaluatePie(str)).not.toThrow();
    });

    it("verifies reverse-nil at Nat", () => {
      const str = `${listPreamble}
(claim reverse-nil (Π ((E U)) (= (List E) (reverse E (the (List E) nil)) (the (List E) nil))))
(define-tactically reverse-nil
  ((intro E) (exact (same (the (List E) nil)))))
(reverse-nil Nat)
`;
      const output = evaluatePie(str);
      expect(output).toContain("(same nil)");
    });

    it("verifies reverse-nil at Atom", () => {
      const str = `${listPreamble}
(claim reverse-nil (Π ((E U)) (= (List E) (reverse E (the (List E) nil)) (the (List E) nil))))
(define-tactically reverse-nil
  ((intro E) (exact (same (the (List E) nil)))))
(reverse-nil Atom)
`;
      const output = evaluatePie(str);
      expect(output).toContain("(same nil)");
    });

    it("proves reverse-singleton: reverse (:: x nil) = (:: x nil)", () => {
      const str = `${listPreamble}
(claim reverse-singleton (Π ((E U) (x E)) (= (List E) (reverse E (:: x nil)) (:: x nil))))
(define-tactically reverse-singleton
  ((intro E) (intro x) (exact (same (:: x nil)))))
`;
      expect(() => evaluatePie(str)).not.toThrow();
    });

    it("verifies reverse-singleton at concrete Nat value 42", () => {
      const str = `${listPreamble}
(claim reverse-singleton (Π ((E U) (x E)) (= (List E) (reverse E (:: x nil)) (:: x nil))))
(define-tactically reverse-singleton
  ((intro E) (intro x) (exact (same (:: x nil)))))
(reverse-singleton Nat 42)
`;
      const output = evaluatePie(str);
      expect(output).toContain("(same");
    });

    it("verifies reverse-singleton at Atom value 'hello", () => {
      const str = `${listPreamble}
(claim reverse-singleton (Π ((E U) (x E)) (= (List E) (reverse E (:: x nil)) (:: x nil))))
(define-tactically reverse-singleton
  ((intro E) (intro x) (exact (same (:: x nil)))))
(reverse-singleton Atom 'hello)
`;
      const output = evaluatePie(str);
      expect(output).toContain("(same");
    });

  });

  describe("Combined lemma usage", () => {

    it("uses append-nil-right and append-assoc together", () => {
      const str = `${listPreamble}${arithLemmas}
(claim append-nil-right (Π ((E U) (xs (List E))) (= (List E) (append E xs (the (List E) nil)) xs)))
(define-tactically append-nil-right
  ((intro E) (intro xs)
   (exact (ind-List xs
     (λ (l) (= (List E) (append E l (the (List E) nil)) l))
     (same (the (List E) nil))
     (λ (x rest ih) (cong ih (the (→ (List E) (List E)) (λ (tl) (:: x tl)))))))))

(claim append-assoc
  (Π ((E U) (xs (List E)) (ys (List E)) (zs (List E)))
    (= (List E) (append E (append E xs ys) zs) (append E xs (append E ys zs)))))
(define-tactically append-assoc
  ((intro E) (intro xs) (intro ys) (intro zs)
   (exact (ind-List xs
     (λ (l) (= (List E) (append E (append E l ys) zs) (append E l (append E ys zs))))
     (same (append E ys zs))
     (λ (x rest ih) (cong ih (the (→ (List E) (List E)) (λ (tl) (:: x tl)))))))))

(append-nil-right Nat (:: 1 (:: 2 nil)))
`;
      const output = evaluatePie(str);
      expect(output).toContain("(same");
    });

    it("uses length-append and map-length together", () => {
      const str = `${listPreamble}${arithLemmas}
(claim length-append
  (Π ((E U) (xs (List E)) (ys (List E)))
    (= Nat (length E (append E xs ys)) (+ (length E xs) (length E ys)))))
(define-tactically length-append
  ((intro E) (intro xs) (intro ys)
   (exact (ind-List xs
     (λ (l) (= Nat (length E (append E l ys)) (+ (length E l) (length E ys))))
     (same (length E ys))
     (λ (x rest ih) (cong ih (+ 1)))))))

(claim map-length
  (Π ((A U) (B U) (f (→ A B)) (xs (List A)))
    (= Nat (length B (map A B f xs)) (length A xs))))
(define-tactically map-length
  ((intro A) (intro B) (intro f) (intro xs)
   (exact (ind-List xs
     (λ (l) (= Nat (length B (map A B f l)) (length A l)))
     (same 0)
     (λ (x rest ih) (cong ih (+ 1)))))))

(length-append Nat (:: 1 (:: 2 nil)) (:: 3 (:: 4 nil)))
`;
      const output = evaluatePie(str);
      expect(output).toContain("(same 4)");
    });

    it("uses map-id and map-append together", () => {
      const str = `${listPreamble}${arithLemmas}
(claim map-id
  (Π ((A U) (xs (List A)))
    (= (List A) (map A A (λ (x) x) xs) xs)))
(define-tactically map-id
  ((intro A) (intro xs)
   (exact (ind-List xs
     (λ (l) (= (List A) (map A A (λ (x) x) l) l))
     (same (the (List A) nil))
     (λ (x rest ih) (cong ih (the (→ (List A) (List A)) (λ (tl) (:: x tl)))))))))

(claim map-append
  (Π ((A U) (B U) (f (→ A B)) (xs (List A)) (ys (List A)))
    (= (List B) (map A B f (append A xs ys)) (append B (map A B f xs) (map A B f ys)))))
(define-tactically map-append
  ((intro A) (intro B) (intro f) (intro xs) (intro ys)
   (exact (ind-List xs
     (λ (l) (= (List B) (map A B f (append A l ys)) (append B (map A B f l) (map A B f ys))))
     (same (map A B f ys))
     (λ (x rest ih) (cong ih (the (→ (List B) (List B)) (λ (tl) (:: (f x) tl)))))))))

(map-id Nat (:: 5 (:: 10 nil)))
`;
      const output = evaluatePie(str);
      expect(output).toContain("(same");
    });

  });

  describe("Error cases for list algebra", () => {

    it("fails when elim-List is used on a Nat argument", () => {
      const str = `${listPreamble}
(claim bad-elim (Π ((n Nat)) Nat))
(define-tactically bad-elim
  ((intro n) (elim-List n)
   (then (exact 0))
   (then (intro x) (intro rest) (intro ih) (exact ih))))
`;
      expect(() => evaluatePie(str)).toThrow();
    });

    it("fails when cons case is missing in list induction", () => {
      const str = `${listPreamble}
(claim incomplete (Π ((E U)) (→ (List E) Nat)))
(define-tactically incomplete
  ((intro E) (intro xs) (elim-List xs)
   (then (exact 0))))
`;
      expect(() => evaluatePie(str)).toThrow();
    });

    it("fails when wrong type is given to cong function", () => {
      const str = `${listPreamble}
(claim bad-cong (Π ((E U) (xs (List E))) (= (List E) (append E xs (the (List E) nil)) xs)))
(define-tactically bad-cong
  ((intro E) (intro xs) (elim-List xs)
   (then (exact (same (the (List E) nil))))
   (then (intro x) (intro rest) (intro ih)
         (cong ih (+ 1)))))
`;
      expect(() => evaluatePie(str)).toThrow();
    });

  });

  describe("Sum properties", () => {

    it("proves sum nil = 0", () => {
      const str = `${listPreamble}
(claim sum-nil (= Nat (sum (the (List Nat) nil)) 0))
(define-tactically sum-nil ((exact (same 0))))
`;
      expect(() => evaluatePie(str)).not.toThrow();
    });

    it("verifies sum (:: 1 (:: 2 (:: 3 nil))) = 6", () => {
      const str = `${listPreamble}
(claim sum-123 (= Nat (sum (:: 1 (:: 2 (:: 3 nil)))) 6))
(define-tactically sum-123 ((exact (same 6))))
`;
      expect(() => evaluatePie(str)).not.toThrow();
    });

    it("verifies sum (:: 10 nil) = 10", () => {
      const str = `${listPreamble}
(claim sum-10 (= Nat (sum (:: 10 nil)) 10))
(define-tactically sum-10 ((exact (same 10))))
`;
      expect(() => evaluatePie(str)).not.toThrow();
    });

    it("verifies sum (:: 5 (:: 5 nil)) = 10", () => {
      const str = `${listPreamble}
(claim sum-55 (= Nat (sum (:: 5 (:: 5 nil))) 10))
(define-tactically sum-55 ((exact (same 10))))
`;
      expect(() => evaluatePie(str)).not.toThrow();
    });

  });

  describe("Map composition", () => {

    it("verifies map (+ 10) on (:: 1 (:: 2 nil)) gives (:: 11 (:: 12 nil))", () => {
      const str = `${listPreamble}${arithLemmas}
(claim map-add10 (= (List Nat) (map Nat Nat (+ 10) (:: 1 (:: 2 nil))) (:: 11 (:: 12 nil))))
(define-tactically map-add10 ((exact (same (:: 11 (:: 12 nil))))))
`;
      expect(() => evaluatePie(str)).not.toThrow();
    });

    it("verifies map (* 2) on (:: 3 (:: 4 nil)) gives (:: 6 (:: 8 nil))", () => {
      const str = `${listPreamble}${arithLemmas}
(claim map-times2 (= (List Nat) (map Nat Nat (* 2) (:: 3 (:: 4 nil))) (:: 6 (:: 8 nil))))
(define-tactically map-times2 ((exact (same (:: 6 (:: 8 nil))))))
`;
      expect(() => evaluatePie(str)).not.toThrow();
    });

  });

  describe("Additional concrete verifications", () => {

    it("verifies length of (:: 'a (:: 'b (:: 'c nil))) = 3", () => {
      const str = `${listPreamble}
(claim len-abc (= Nat (length Atom (:: 'a (:: 'b (:: 'c nil)))) 3))
(define-tactically len-abc ((exact (same 3))))
`;
      expect(() => evaluatePie(str)).not.toThrow();
    });

    it("verifies length nil = 0", () => {
      const str = `${listPreamble}
(claim len-nil (= Nat (length Nat (the (List Nat) nil)) 0))
(define-tactically len-nil ((exact (same 0))))
`;
      expect(() => evaluatePie(str)).not.toThrow();
    });

    it("verifies append of two concrete Atom lists", () => {
      const str = `${listPreamble}
(append Atom (:: 'a (:: 'b nil)) (:: 'c nil))
`;
      const output = evaluatePie(str);
      expect(output).toContain("'a");
      expect(output).toContain("'c");
    });

    it("verifies map (+ 1) on (:: 0 (:: 1 (:: 2 nil)))", () => {
      const str = `${listPreamble}
(map Nat Nat (+ 1) (:: 0 (:: 1 (:: 2 nil))))
`;
      const output = evaluatePie(str);
      expect(output).toContain("1");
      expect(output).toContain("3");
    });

    it("verifies reverse (:: 1 (:: 2 (:: 3 nil))) computes", () => {
      const str = `${listPreamble}
(reverse Nat (:: 1 (:: 2 (:: 3 nil))))
`;
      const output = evaluatePie(str);
      expect(output).toContain("3");
    });

    it("verifies sum of appended lists equals sum of each", () => {
      const str = `${listPreamble}${arithLemmas}
(claim sum-app-concrete
  (= Nat (sum (append Nat (:: 1 (:: 2 nil)) (:: 3 (:: 4 nil)))) (+ (sum (:: 1 (:: 2 nil))) (sum (:: 3 (:: 4 nil))))))
(define-tactically sum-app-concrete ((exact (same 10))))
`;
      expect(() => evaluatePie(str)).not.toThrow();
    });

    it("verifies length of (:: 1 (:: 2 (:: 3 (:: 4 nil)))) = 4", () => {
      const str = `${listPreamble}
(claim len-4 (= Nat (length Nat (:: 1 (:: 2 (:: 3 (:: 4 nil))))) 4))
(define-tactically len-4 ((exact (same 4))))
`;
      expect(() => evaluatePie(str)).not.toThrow();
    });

    it("verifies sum (:: 1 (:: 2 (:: 3 (:: 4 nil)))) = 10", () => {
      const str = `${listPreamble}
(claim sum-1234 (= Nat (sum (:: 1 (:: 2 (:: 3 (:: 4 nil))))) 10))
(define-tactically sum-1234 ((exact (same 10))))
`;
      expect(() => evaluatePie(str)).not.toThrow();
    });

  });

});
