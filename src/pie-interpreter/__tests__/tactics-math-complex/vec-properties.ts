import 'jest';
import { evaluatePie } from '../../main';

const arithPreamble = `
(claim + (→ Nat Nat Nat))
(define + (λ (n j) (iter-Nat n j (λ (x) (add1 x)))))
`;

const arithLemmas = `${arithPreamble}
(claim n+0=n (Π ((n Nat)) (= Nat (+ n 0) n)))
(define n+0=n (λ (n) (ind-Nat n (λ (k) (= Nat (+ k 0) k)) (same 0) (λ (n-1 ih) (cong ih (+ 1))))))

(claim +add1 (Π ((n Nat) (m Nat)) (= Nat (+ n (add1 m)) (add1 (+ n m)))))
(define +add1 (λ (n m) (ind-Nat n (λ (k) (= Nat (+ k (add1 m)) (add1 (+ k m)))) (same (add1 m)) (λ (n-1 ih) (cong ih (+ 1))))))

(claim +-comm (Π ((n Nat) (m Nat)) (= Nat (+ n m) (+ m n))))
(define +-comm (λ (n m) (ind-Nat n (λ (k) (= Nat (+ k m) (+ m k))) (symm (n+0=n m)) (λ (n-1 ih) (trans (cong ih (+ 1)) (symm (+add1 m n-1)))))))

(claim +-assoc (Π ((a Nat) (b Nat) (c Nat)) (= Nat (+ (+ a b) c) (+ a (+ b c)))))
(define +-assoc (λ (a b c) (ind-Nat a (λ (k) (= Nat (+ (+ k b) c) (+ k (+ b c)))) (same (+ b c)) (λ (a-1 ih) (cong ih (+ 1))))))
`;

const vecPreamble = `${arithPreamble}
(claim replicate (Π ((E U) (n Nat)) (→ E (Vec E n))))
(define replicate (λ (E n e) (ind-Nat n (λ (k) (Vec E k)) vecnil (λ (n-1 ih) (vec:: e ih)))))
`;

const vecMapPreamble = `${arithPreamble}
(claim vec-map (Π ((A U) (B U) (n Nat)) (→ (→ A B) (Vec A n) (Vec B n))))
(define vec-map
  (λ (A B n f v)
    (ind-Vec n v
      (λ (k v) (Vec B k))
      vecnil
      (λ (k x xs acc) (vec:: (f x) acc)))))
`;

const vecAppendPreamble = `${arithPreamble}
(claim vec-append (Π ((E U) (n Nat) (m Nat)) (→ (Vec E n) (Vec E m) (Vec E (+ n m)))))
(define vec-append
  (λ (E n m vn vm)
    (ind-Vec n vn
      (λ (k v) (Vec E (+ k m)))
      vm
      (λ (k x xs acc) (vec:: x acc)))))
`;

const vecToListPreamble = `${arithPreamble}
(claim vec-to-list (Π ((E U) (n Nat)) (→ (Vec E n) (List E))))
(define vec-to-list
  (λ (E n v)
    (ind-Vec n v
      (λ (k v) (List E))
      (the (List E) nil)
      (λ (k x xs acc) (:: x acc)))))

(claim length (Π ((E U)) (→ (List E) Nat)))
(define length (λ (E xs) (rec-List xs 0 (λ (x rest n) (add1 n)))))
`;

describe("Vec Properties — Complex Tactic Proofs", () => {

  describe("Vec construction and basic properties", () => {

    it("1. constructs Vec Nat 0 as vecnil", () => {
      const str = `${arithPreamble}
(the (Vec Nat 0) vecnil)
`;
      expect(() => evaluatePie(str)).not.toThrow();
    });

    it("2. constructs Vec Nat 1 with vec:: 42 vecnil", () => {
      const str = `${arithPreamble}
(the (Vec Nat 1) (vec:: 42 vecnil))
`;
      expect(() => evaluatePie(str)).not.toThrow();
    });

    it("3. constructs Vec Nat 2 with vec:: 1 (vec:: 2 vecnil)", () => {
      const str = `${arithPreamble}
(the (Vec Nat 2) (vec:: 1 (vec:: 2 vecnil)))
`;
      expect(() => evaluatePie(str)).not.toThrow();
    });

    it("4. constructs Vec Nat 3 with vec:: 1 (vec:: 2 (vec:: 3 vecnil))", () => {
      const str = `${arithPreamble}
(the (Vec Nat 3) (vec:: 1 (vec:: 2 (vec:: 3 vecnil))))
`;
      expect(() => evaluatePie(str)).not.toThrow();
    });

    it("5. head of singleton vec equals element", () => {
      const str = `${arithPreamble}
(claim head-singleton (= Nat (head (the (Vec Nat 1) (vec:: 42 vecnil))) 42))
(define-tactically head-singleton
  ((exact (same 42))))
`;
      expect(() => evaluatePie(str)).not.toThrow();
    });

    it("6. head of (vec:: 1 (vec:: 2 vecnil)) equals 1", () => {
      const str = `${arithPreamble}
(claim head-two (= Nat (head (the (Vec Nat 2) (vec:: 1 (vec:: 2 vecnil)))) 1))
(define-tactically head-two
  ((exact (same 1))))
`;
      expect(() => evaluatePie(str)).not.toThrow();
    });

    it("7. tail of (vec:: 1 (vec:: 2 vecnil)) has type Vec Nat 1", () => {
      const str = `${arithPreamble}
(the (Vec Nat 1) (tail (the (Vec Nat 2) (vec:: 1 (vec:: 2 vecnil)))))
`;
      expect(() => evaluatePie(str)).not.toThrow();
    });

  });

  describe("Vec map (length-preserving)", () => {

    it("8. defines vec-map tactically using exact with ind-Vec", () => {
      const str = `${arithPreamble}
(claim vec-map (Π ((A U) (B U) (n Nat)) (→ (→ A B) (Vec A n) (Vec B n))))
(define-tactically vec-map
  ((exact (λ (A B n f v)
    (ind-Vec n v
      (λ (k v) (Vec B k))
      vecnil
      (λ (k x xs acc) (vec:: (f x) acc)))))))
`;
      expect(() => evaluatePie(str)).not.toThrow();
    });

    it("9. vec-map (+ 1) on (vec:: 1 (vec:: 2 vecnil)) head is 2", () => {
      const str = `${vecMapPreamble}
(claim map-head-check (= Nat (head (vec-map Nat Nat 2 (+ 1) (the (Vec Nat 2) (vec:: 1 (vec:: 2 vecnil))))) 2))
(define-tactically map-head-check
  ((exact (same 2))))
`;
      expect(() => evaluatePie(str)).not.toThrow();
    });

    it("10. vec-map (+ 1) on (vec:: 1 (vec:: 2 vecnil)) second element is 3", () => {
      const str = `${vecMapPreamble}
(claim map-second-check (= Nat (head (tail (vec-map Nat Nat 2 (+ 1) (the (Vec Nat 2) (vec:: 1 (vec:: 2 vecnil)))))) 3))
(define-tactically map-second-check
  ((exact (same 3))))
`;
      expect(() => evaluatePie(str)).not.toThrow();
    });

    it("11. vec-map over vecnil returns vecnil", () => {
      const str = `${vecMapPreamble}
(the (Vec Nat 0) (vec-map Nat Nat 0 (+ 1) (the (Vec Nat 0) vecnil)))
`;
      expect(() => evaluatePie(str)).not.toThrow();
    });

    it("12. vec-map (+ 10) on 3-element vec gives correct first element", () => {
      const str = `${vecMapPreamble}
(claim map-plus10 (= Nat (head (vec-map Nat Nat 3 (+ 10) (the (Vec Nat 3) (vec:: 1 (vec:: 2 (vec:: 3 vecnil)))))) 11))
(define-tactically map-plus10
  ((exact (same 11))))
`;
      expect(() => evaluatePie(str)).not.toThrow();
    });

  });

  describe("Replicate (build vec of n copies)", () => {

    it("13. defines replicate tactically using elim-Nat", () => {
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
`;
      expect(() => evaluatePie(str)).not.toThrow();
    });

    it("14. head of replicate 1 x equals x", () => {
      const str = `${vecPreamble}
(claim rep-head (= Nat (head (replicate Nat 1 99)) 99))
(define-tactically rep-head
  ((exact (same 99))))
`;
      expect(() => evaluatePie(str)).not.toThrow();
    });

    it("15. replicate 0 produces vecnil", () => {
      const str = `${vecPreamble}
(the (Vec Nat 0) (replicate Nat 0 42))
`;
      expect(() => evaluatePie(str)).not.toThrow();
    });

    it("16. replicate 3 produces correct vec — all elements equal", () => {
      const str = `${vecPreamble}
(claim rep-third (= Nat (head (tail (tail (replicate Nat 3 7)))) 7))
(define-tactically rep-third
  ((exact (same 7))))
`;
      expect(() => evaluatePie(str)).not.toThrow();
    });

    it("17. replicate 5 has correct type Vec Nat 5", () => {
      const str = `${vecPreamble}
(the (Vec Nat 5) (replicate Nat 5 0))
`;
      expect(() => evaluatePie(str)).not.toThrow();
    });

  });

  describe("Vec append (length adds)", () => {

    it("18. defines vec-append tactically using exact with ind-Vec", () => {
      const str = `${arithPreamble}
(claim vec-append (Π ((E U) (n Nat) (m Nat)) (→ (Vec E n) (Vec E m) (Vec E (+ n m)))))
(define-tactically vec-append
  ((exact (λ (E n m vn vm)
    (ind-Vec n vn
      (λ (k v) (Vec E (+ k m)))
      vm
      (λ (k x xs acc) (vec:: x acc)))))))
`;
      expect(() => evaluatePie(str)).not.toThrow();
    });

    it("19. vec-append of vecnil and v gives v (head check)", () => {
      const str = `${vecAppendPreamble}
(claim append-nil-head (= Nat (head (vec-append Nat 0 2 (the (Vec Nat 0) vecnil) (the (Vec Nat 2) (vec:: 10 (vec:: 20 vecnil))))) 10))
(define-tactically append-nil-head
  ((exact (same 10))))
`;
      expect(() => evaluatePie(str)).not.toThrow();
    });

    it("20. vec-append of two 1-element vecs gives 2-element vec", () => {
      const str = `${vecAppendPreamble}
(claim append-1-1 (= Nat (head (vec-append Nat 1 1 (the (Vec Nat 1) (vec:: 1 vecnil)) (the (Vec Nat 1) (vec:: 2 vecnil)))) 1))
(define-tactically append-1-1
  ((exact (same 1))))
`;
      expect(() => evaluatePie(str)).not.toThrow();
    });

    it("21. second element of vec-append is from second vec", () => {
      const str = `${vecAppendPreamble}
(claim append-second (= Nat (head (tail (vec-append Nat 1 1 (the (Vec Nat 1) (vec:: 1 vecnil)) (the (Vec Nat 1) (vec:: 2 vecnil))))) 2))
(define-tactically append-second
  ((exact (same 2))))
`;
      expect(() => evaluatePie(str)).not.toThrow();
    });

    it("22. vec-append (vec:: 1 (vec:: 2 vecnil)) (vec:: 3 vecnil) has type Vec Nat 3", () => {
      const str = `${vecAppendPreamble}
(the (Vec Nat 3) (vec-append Nat 2 1 (the (Vec Nat 2) (vec:: 1 (vec:: 2 vecnil))) (the (Vec Nat 1) (vec:: 3 vecnil))))
`;
      expect(() => evaluatePie(str)).not.toThrow();
    });

    it("23. vec-append third element is from second vec", () => {
      const str = `${vecAppendPreamble}
(claim append-third (= Nat (head (tail (tail (vec-append Nat 2 1 (the (Vec Nat 2) (vec:: 1 (vec:: 2 vecnil))) (the (Vec Nat 1) (vec:: 3 vecnil)))))) 3))
(define-tactically append-third
  ((exact (same 3))))
`;
      expect(() => evaluatePie(str)).not.toThrow();
    });

    it("24. vec-append using elim-Vec tactic with explicit motive", () => {
      const str = `${arithPreamble}
(claim mot-vec-append
  (Π ((E U) (j Nat) (k Nat))
    (→ (Vec E k) U)))
(define mot-vec-append
  (λ (E j k)
    (λ (es)
      (Vec E (+ k j)))))

(claim step-vec-append
  (Π ((E U) (j Nat) (k Nat) (e E) (es (Vec E k)))
    (→ (mot-vec-append E j k es)
        (mot-vec-append E j (add1 k) (vec:: e es)))))
(define step-vec-append
  (λ (E j l-1 e es)
    (λ (vec-appendes)
      (vec:: e vec-appendes))))

(claim vec-append (Π ((E U) (l Nat) (j Nat)) (→ (Vec E l) (Vec E j) (Vec E (+ l j)))))
(define-tactically vec-append
  ((intro E)
   (intro l)
   (intro j)
   (intro es)
   (intro end)
   (elim-Vec es (mot-vec-append E j) l)
   (then (exact end))
   (then (exact (step-vec-append E j)))))
`;
      expect(() => evaluatePie(str)).not.toThrow();
    });

    it("25. vec-append of two 2-element vecs produces 4-element vec", () => {
      const str = `${vecAppendPreamble}
(the (Vec Nat 4) (vec-append Nat 2 2 (the (Vec Nat 2) (vec:: 1 (vec:: 2 vecnil))) (the (Vec Nat 2) (vec:: 3 (vec:: 4 vecnil)))))
`;
      expect(() => evaluatePie(str)).not.toThrow();
    });

  });

  describe("Vec to List conversion", () => {

    it("26. defines vec-to-list using ind-Vec", () => {
      const str = `${arithPreamble}
(claim vec-to-list (Π ((E U) (n Nat)) (→ (Vec E n) (List E))))
(define-tactically vec-to-list
  ((exact (λ (E n v)
    (ind-Vec n v
      (λ (k v) (List E))
      (the (List E) nil)
      (λ (k x xs acc) (:: x acc)))))))
`;
      expect(() => evaluatePie(str)).not.toThrow();
    });

    it("27. vec-to-list of vecnil is nil", () => {
      const str = `${vecToListPreamble}
(claim vtl-nil (= Nat (length Nat (vec-to-list Nat 0 (the (Vec Nat 0) vecnil))) 0))
(define-tactically vtl-nil
  ((exact (same 0))))
`;
      expect(() => evaluatePie(str)).not.toThrow();
    });

    it("28. vec-to-list of 3-element vec has length 3", () => {
      const str = `${vecToListPreamble}
(claim vtl-len3 (= Nat (length Nat (vec-to-list Nat 3 (the (Vec Nat 3) (vec:: 1 (vec:: 2 (vec:: 3 vecnil)))))) 3))
(define-tactically vtl-len3
  ((exact (same 3))))
`;
      expect(() => evaluatePie(str)).not.toThrow();
    });

    it("29. vec-to-list of 1-element vec has length 1", () => {
      const str = `${vecToListPreamble}
(claim vtl-len1 (= Nat (length Nat (vec-to-list Nat 1 (the (Vec Nat 1) (vec:: 99 vecnil)))) 1))
(define-tactically vtl-len1
  ((exact (same 1))))
`;
      expect(() => evaluatePie(str)).not.toThrow();
    });

    it("30. vec-to-list of 2-element Atom vec has length 2", () => {
      const str = `${vecToListPreamble}
(claim vtl-atom-len (= Nat (length Atom (vec-to-list Atom 2 (the (Vec Atom 2) (vec:: 'a (vec:: 'b vecnil))))) 2))
(define-tactically vtl-atom-len
  ((exact (same 2))))
`;
      expect(() => evaluatePie(str)).not.toThrow();
    });

  });

  describe("Vec properties via ind-Vec", () => {

    it("31. vec-map id on singleton equals singleton (concrete check)", () => {
      const str = `${vecMapPreamble}
(claim id-nat (→ Nat Nat))
(define id-nat (λ (x) x))
(claim map-id-single (= Nat (head (vec-map Nat Nat 1 id-nat (the (Vec Nat 1) (vec:: 5 vecnil)))) 5))
(define-tactically map-id-single
  ((exact (same 5))))
`;
      expect(() => evaluatePie(str)).not.toThrow();
    });

    it("32. vec-map id on 2-element vec preserves both elements", () => {
      const str = `${vecMapPreamble}
(claim id-nat (→ Nat Nat))
(define id-nat (λ (x) x))
(claim map-id-second (= Nat (head (tail (vec-map Nat Nat 2 id-nat (the (Vec Nat 2) (vec:: 3 (vec:: 7 vecnil)))))) 7))
(define-tactically map-id-second
  ((exact (same 7))))
`;
      expect(() => evaluatePie(str)).not.toThrow();
    });

    it("33. vec-sum via ind-Vec sums correctly", () => {
      const str = `${arithPreamble}
(claim vec-sum (Π ((n Nat)) (→ (Vec Nat n) Nat)))
(define vec-sum
  (λ (n v)
    (ind-Vec n v
      (λ (k v) Nat)
      0
      (λ (k x xs acc) (+ x acc)))))
(claim sum-check (= Nat (vec-sum 3 (the (Vec Nat 3) (vec:: 1 (vec:: 2 (vec:: 3 vecnil))))) 6))
(define-tactically sum-check
  ((exact (same 6))))
`;
      expect(() => evaluatePie(str)).not.toThrow();
    });

    it("34. vec-sum of empty vec is 0", () => {
      const str = `${arithPreamble}
(claim vec-sum (Π ((n Nat)) (→ (Vec Nat n) Nat)))
(define vec-sum
  (λ (n v)
    (ind-Vec n v
      (λ (k v) Nat)
      0
      (λ (k x xs acc) (+ x acc)))))
(claim sum-nil (= Nat (vec-sum 0 (the (Vec Nat 0) vecnil)) 0))
(define-tactically sum-nil
  ((exact (same 0))))
`;
      expect(() => evaluatePie(str)).not.toThrow();
    });

    it("35. vec-count via ind-Vec counts elements", () => {
      const str = `${arithPreamble}
(claim vec-count (Π ((n Nat)) (→ (Vec Nat n) Nat)))
(define vec-count
  (λ (n v)
    (ind-Vec n v
      (λ (k v) Nat)
      0
      (λ (k x xs acc) (add1 acc)))))
(claim count-check (= Nat (vec-count 3 (the (Vec Nat 3) (vec:: 1 (vec:: 2 (vec:: 3 vecnil))))) 3))
(define-tactically count-check
  ((exact (same 3))))
`;
      expect(() => evaluatePie(str)).not.toThrow();
    });

    it("36. vec-sum of appended vecs equals sum of parts (concrete)", () => {
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
(claim sum-append (= Nat (vec-sum 3 (vec-append Nat 2 1 (the (Vec Nat 2) (vec:: 1 (vec:: 2 vecnil))) (the (Vec Nat 1) (vec:: 3 vecnil)))) (+ (vec-sum 2 (the (Vec Nat 2) (vec:: 1 (vec:: 2 vecnil)))) (vec-sum 1 (the (Vec Nat 1) (vec:: 3 vecnil))))))
(define-tactically sum-append
  ((exact (same 6))))
`;
      expect(() => evaluatePie(str)).not.toThrow();
    });

  });

  describe("Concrete verification tests", () => {

    it("37. vec-map (+ 1) on (vec:: 10 (vec:: 20 (vec:: 30 vecnil))) head is 11", () => {
      const str = `${vecMapPreamble}
(claim map-check-37 (= Nat (head (vec-map Nat Nat 3 (+ 1) (the (Vec Nat 3) (vec:: 10 (vec:: 20 (vec:: 30 vecnil)))))) 11))
(define-tactically map-check-37
  ((exact (same 11))))
`;
      expect(() => evaluatePie(str)).not.toThrow();
    });

    it("38. vec-map (+ 1) on 3-element vec third element is 31", () => {
      const str = `${vecMapPreamble}
(claim map-check-38 (= Nat (head (tail (tail (vec-map Nat Nat 3 (+ 1) (the (Vec Nat 3) (vec:: 10 (vec:: 20 (vec:: 30 vecnil)))))))) 31))
(define-tactically map-check-38
  ((exact (same 31))))
`;
      expect(() => evaluatePie(str)).not.toThrow();
    });

    it("39. vec-append concrete: first vec element preserved", () => {
      const str = `${vecAppendPreamble}
(claim append-check-39 (= Nat (head (vec-append Nat 2 2 (the (Vec Nat 2) (vec:: 5 (vec:: 6 vecnil))) (the (Vec Nat 2) (vec:: 7 (vec:: 8 vecnil))))) 5))
(define-tactically append-check-39
  ((exact (same 5))))
`;
      expect(() => evaluatePie(str)).not.toThrow();
    });

    it("40. vec-append concrete: append two singleton vecs and check head", () => {
      const str = `${vecAppendPreamble}
(claim append-check-40
  (= Nat (head (vec-append Nat 1 1
    (the (Vec Nat 1) (vec:: 5 vecnil))
    (the (Vec Nat 1) (vec:: 8 vecnil)))) 5))
(define-tactically append-check-40
  ((exact (same 5))))
`;
      expect(() => evaluatePie(str)).not.toThrow();
    });

    it("41. replicate 4 all same value — check second element", () => {
      const str = `${vecPreamble}
(claim rep-check-41 (= Nat (head (tail (replicate Nat 4 13))) 13))
(define-tactically rep-check-41
  ((exact (same 13))))
`;
      expect(() => evaluatePie(str)).not.toThrow();
    });

    it("42. replicate with Atom type check head", () => {
      const str = `${vecPreamble}
(claim rep-atom-42 (= Atom (head (replicate Atom 3 'foo)) 'foo))
(define-tactically rep-atom-42
  ((exact (same 'foo))))
`;
      expect(() => evaluatePie(str)).not.toThrow();
    });

    it("43. head of tail of tail in 3-element vec equals third element", () => {
      const str = `${arithPreamble}
(claim htt (= Nat (head (tail (tail (the (Vec Nat 3) (vec:: 100 (vec:: 200 (vec:: 300 vecnil))))))) 300))
(define-tactically htt
  ((exact (same 300))))
`;
      expect(() => evaluatePie(str)).not.toThrow();
    });

    it("44. vec-map with id-nat on vec preserves head", () => {
      const str = `${vecMapPreamble}
(claim id-nat (→ Nat Nat))
(define id-nat (λ (x) x))
(claim map-id-44 (= Nat (head (vec-map Nat Nat 3 id-nat (the (Vec Nat 3) (vec:: 42 (vec:: 7 (vec:: 13 vecnil)))))) 42))
(define-tactically map-id-44
  ((exact (same 42))))
`;
      expect(() => evaluatePie(str)).not.toThrow();
    });

  });

  describe("Error and edge cases", () => {

    it("45. fails when taking head of vecnil", () => {
      const str = `${arithPreamble}
(head vecnil)
`;
      expect(() => evaluatePie(str)).toThrow();
    });

    it("46. fails when wrong length annotation (3 for 2 elements)", () => {
      const str = `${arithPreamble}
(the (Vec Nat 3) (vec:: 1 (vec:: 2 vecnil)))
`;
      expect(() => evaluatePie(str)).toThrow();
    });

    it("47. fails when vec:: element type mismatches (Atom in Vec Nat)", () => {
      const str = `${arithPreamble}
(the (Vec Nat 1) (vec:: 'hello vecnil))
`;
      expect(() => evaluatePie(str)).toThrow();
    });

    it("48. fails when tail is applied to vecnil", () => {
      const str = `${arithPreamble}
(tail vecnil)
`;
      expect(() => evaluatePie(str)).toThrow();
    });

    it("49. fails when too many elements for declared length (1 for 2 elements)", () => {
      const str = `${arithPreamble}
(the (Vec Nat 1) (vec:: 1 (vec:: 2 vecnil)))
`;
      expect(() => evaluatePie(str)).toThrow();
    });

    it("50. fails when vec-map applied with wrong element type", () => {
      const str = `${vecMapPreamble}
(vec-map Nat Nat 2 (+ 1) (the (Vec Atom 2) (vec:: 'a (vec:: 'b vecnil))))
`;
      expect(() => evaluatePie(str)).toThrow();
    });

  });

});
