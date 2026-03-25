import 'jest';
import { evaluatePie } from '../../main';

const arithPreamble = `
(claim + (-> Nat Nat Nat))
(define + (lambda (n j) (iter-Nat n j (lambda (x) (add1 x)))))
(claim * (-> Nat Nat Nat))
(define * (lambda (n m) (iter-Nat n 0 (+ m))))
`;

const arithLemmas = `${arithPreamble}
(claim n+0=n (Pi ((n Nat)) (= Nat (+ n 0) n)))
(define n+0=n (lambda (n) (ind-Nat n (lambda (k) (= Nat (+ k 0) k)) (same 0) (lambda (n-1 ih) (cong ih (+ 1))))))

(claim +add1 (Pi ((n Nat) (m Nat)) (= Nat (+ n (add1 m)) (add1 (+ n m)))))
(define +add1 (lambda (n m) (ind-Nat n (lambda (k) (= Nat (+ k (add1 m)) (add1 (+ k m)))) (same (add1 m)) (lambda (n-1 ih) (cong ih (+ 1))))))

(claim +-comm (Pi ((n Nat) (m Nat)) (= Nat (+ n m) (+ m n))))
(define +-comm (lambda (n m) (ind-Nat n (lambda (k) (= Nat (+ k m) (+ m k))) (symm (n+0=n m)) (lambda (n-1 ih) (trans (cong ih (+ 1)) (symm (+add1 m n-1)))))))

(claim +-assoc (Pi ((a Nat) (b Nat) (c Nat)) (= Nat (+ (+ a b) c) (+ a (+ b c)))))
(define +-assoc (lambda (a b c) (ind-Nat a (lambda (k) (= Nat (+ (+ k b) c) (+ k (+ b c)))) (same (+ b c)) (lambda (a-1 ih) (cong ih (+ 1))))))
`;

const powPreamble = `${arithPreamble}
(claim pow (-> Nat Nat Nat))
(define pow (lambda (base exp) (iter-Nat exp 1 (* base))))
`;

describe("Witnesses, Existentials, and Equality Rewriting", () => {

  // ===== Part 1: Equality Rewriting =====

  describe("Congruence and Rewriting", () => {

    it("1. general-cong: f applied to equal args gives equal results", () => {
      const str = `${arithPreamble}
(claim general-cong
  (Pi ((A U) (B U) (a A) (b A) (f (-> A B)))
    (-> (= A a b) (= B (f a) (f b)))))
(define-tactically general-cong
  ((intro A) (intro B) (intro a) (intro b) (intro f) (intro eq)
   (cong eq f)))
`;
      expect(() => evaluatePie(str)).not.toThrow();
    });

    it("2. cong2: two-argument congruence via trans", () => {
      const str = `${arithPreamble}
(claim cong2
  (Pi ((A U) (B U) (C U) (f (-> A B C)) (a A) (b A) (c B) (d B))
    (-> (= A a b) (= B c d) (= C (f a c) (f b d)))))
(define-tactically cong2
  ((intro A) (intro B) (intro C) (intro f)
   (intro a) (intro b) (intro c) (intro d)
   (intro eq1) (intro eq2)
   (trans (cong eq1 (the (-> A C) (lambda (x) (f x c)))) (cong eq2 (f b)))))
`;
      expect(() => evaluatePie(str)).not.toThrow();
    });

    it("3. transport: (= A a b) -> P(a) -> P(b) using replace", () => {
      const str = `${arithPreamble}
(claim transport
  (Pi ((A U) (a A) (b A))
    (-> (= A a b) (Pi ((P (-> A U))) (-> (P a) (P b))))))
(define-tactically transport
  ((intro A) (intro a) (intro b) (intro eq) (intro P) (intro pa)
   (rewrite eq P)
   (exact pa)))
`;
      expect(() => evaluatePie(str)).not.toThrow();
    });

    it("4. Leibniz-to-eq: Leibniz equality implies propositional equality", () => {
      const str = `
(claim Leibniz-to-eq
  (Pi ((A U) (a A) (b A))
    (-> (Pi ((P (-> A U))) (-> (P a) (P b)))
       (= A a b))))
(define-tactically Leibniz-to-eq
  ((intro A) (intro a) (intro b) (intro leibniz)
   (exact (leibniz (lambda (x) (= A a x)) (same a)))))
`;
      expect(() => evaluatePie(str)).not.toThrow();
    });

    it("5. symm-involutive: symm(symm(same 1)) = same 1", () => {
      const str = `
(claim symm-invol
  (= (= Nat 1 1) (symm (symm (the (= Nat 1 1) (same 1)))) (same 1)))
(define-tactically symm-invol
  ((exact (same (same 1)))))
`;
      expect(() => evaluatePie(str)).not.toThrow();
    });

    it("6. symm-involutive at zero", () => {
      const str = `
(claim symm-invol-0
  (= (= Nat 0 0) (symm (symm (the (= Nat 0 0) (same 0)))) (same 0)))
(define-tactically symm-invol-0
  ((exact (same (same 0)))))
`;
      expect(() => evaluatePie(str)).not.toThrow();
    });

    it("7. cong with add1: (= Nat 3 3) -> (= Nat (add1 3) (add1 3))", () => {
      const str = `
(claim cong-add1 (-> (= Nat 3 3) (= Nat (add1 3) (add1 3))))
(define-tactically cong-add1
  ((intro eq) (cong eq (the (-> Nat Nat) (lambda (x) (add1 x))))))
`;
      expect(() => evaluatePie(str)).not.toThrow();
    });

    it("8. cong chain: (= Nat 2 2) -> (= Nat 4 4) via double cong", () => {
      const str = `${arithPreamble}
(claim cong-double (-> (= Nat 2 2) (= Nat 4 4)))
(define-tactically cong-double
  ((intro eq) (cong (cong eq (+ 1)) (+ 1))))
`;
      expect(() => evaluatePie(str)).not.toThrow();
    });

  });

  // ===== Part 2: Perfect Square Witnesses =====

  describe("Perfect Square Witnesses", () => {

    it("9. sqrt(4)=2: witness k=2 with k*k=4", () => {
      const str = `${arithPreamble}
(claim sqrt-4 (Sigma ((k Nat)) (= Nat (* k k) 4)))
(define-tactically sqrt-4
  ((exists 2 k) (exact (same 4))))
`;
      expect(() => evaluatePie(str)).not.toThrow();
    });

    it("10. sqrt(9)=3: witness k=3 with k*k=9", () => {
      const str = `${arithPreamble}
(claim sqrt-9 (Sigma ((k Nat)) (= Nat (* k k) 9)))
(define-tactically sqrt-9
  ((exists 3 k) (exact (same 9))))
`;
      expect(() => evaluatePie(str)).not.toThrow();
    });

    it("11. sqrt(16)=4: witness k=4 with k*k=16", () => {
      const str = `${arithPreamble}
(claim sqrt-16 (Sigma ((k Nat)) (= Nat (* k k) 16)))
(define-tactically sqrt-16
  ((exists 4 k) (exact (same 16))))
`;
      expect(() => evaluatePie(str)).not.toThrow();
    });

    it("12. sqrt(25)=5: witness k=5 with k*k=25", () => {
      const str = `${arithPreamble}
(claim sqrt-25 (Sigma ((k Nat)) (= Nat (* k k) 25)))
(define-tactically sqrt-25
  ((exists 5 k) (exact (same 25))))
`;
      expect(() => evaluatePie(str)).not.toThrow();
    });

  });

  // ===== Part 3: Pythagorean Triples =====

  describe("Pythagorean Triples and Arithmetic", () => {

    it("13. proves 3^2+4^2=5^2", () => {
      const str = `${arithPreamble}
(claim pyth-3-4-5 (= Nat (+ (* 3 3) (* 4 4)) (* 5 5)))
(define-tactically pyth-3-4-5 ((exact (same 25))))
`;
      expect(() => evaluatePie(str)).not.toThrow();
    });

    it("14. proves 5^2+12^2=13^2", () => {
      const str = `${arithPreamble}
(claim pyth-5-12-13 (= Nat (+ (* 5 5) (* 12 12)) (* 13 13)))
(define-tactically pyth-5-12-13 ((exact (same 169))))
`;
      expect(() => evaluatePie(str)).not.toThrow();
    });

    it("15. proves 7+8=15", () => {
      const str = `${arithPreamble}
(claim sum-7-8 (= Nat (+ 7 8) 15))
(define-tactically sum-7-8 ((exact (same 15))))
`;
      expect(() => evaluatePie(str)).not.toThrow();
    });

    it("16. proves 6*7=42", () => {
      const str = `${arithPreamble}
(claim prod-6-7 (= Nat (* 6 7) 42))
(define-tactically prod-6-7 ((exact (same 42))))
`;
      expect(() => evaluatePie(str)).not.toThrow();
    });

  });

  // ===== Part 4: Factorization Witnesses =====

  describe("Factorization Witnesses", () => {

    it("17. factor-6: 6 = 2*3", () => {
      const str = `${arithPreamble}
(claim factor-6 (Sigma ((a Nat)) (Sigma ((b Nat)) (= Nat (* a b) 6))))
(define-tactically factor-6
  ((exists 2 a) (exists 3 b) (exact (same 6))))
`;
      expect(() => evaluatePie(str)).not.toThrow();
    });

    it("18. factor-12: 12 = 3*4", () => {
      const str = `${arithPreamble}
(claim factor-12 (Sigma ((a Nat)) (Sigma ((b Nat)) (= Nat (* a b) 12))))
(define-tactically factor-12
  ((exists 3 a) (exists 4 b) (exact (same 12))))
`;
      expect(() => evaluatePie(str)).not.toThrow();
    });

    it("19. factor-15: 15 = 3*5", () => {
      const str = `${arithPreamble}
(claim factor-15 (Sigma ((a Nat)) (Sigma ((b Nat)) (= Nat (* a b) 15))))
(define-tactically factor-15
  ((exists 3 a) (exists 5 b) (exact (same 15))))
`;
      expect(() => evaluatePie(str)).not.toThrow();
    });

    it("20. factor-20: 20 = 4*5", () => {
      const str = `${arithPreamble}
(claim factor-20 (Sigma ((a Nat)) (Sigma ((b Nat)) (= Nat (* a b) 20))))
(define-tactically factor-20
  ((exists 4 a) (exists 5 b) (exact (same 20))))
`;
      expect(() => evaluatePie(str)).not.toThrow();
    });

    it("21. sum-pair-10: 10 = 3+7", () => {
      const str = `${arithPreamble}
(claim sum-pair-10 (Sigma ((a Nat)) (Sigma ((b Nat)) (= Nat (+ a b) 10))))
(define-tactically sum-pair-10
  ((exists 3 a) (exists 7 b) (exact (same 10))))
`;
      expect(() => evaluatePie(str)).not.toThrow();
    });

    it("22. product-pair-21: 21 = 3*7", () => {
      const str = `${arithPreamble}
(claim product-21 (Sigma ((a Nat)) (Sigma ((b Nat)) (= Nat (* a b) 21))))
(define-tactically product-21
  ((exists 3 a) (exists 7 b) (exact (same 21))))
`;
      expect(() => evaluatePie(str)).not.toThrow();
    });

  });

  // ===== Part 5: Existential Even/Odd/Multiple =====

  describe("Existential Even/Odd/Multiple", () => {

    it("23. exists-even: 4 is even (n=4, k=2)", () => {
      const str = `${arithPreamble}
(claim exists-even (Sigma ((n Nat)) (Sigma ((k Nat)) (= Nat n (+ k k)))))
(define-tactically exists-even
  ((exists 4 n) (exists 2 k) (exact (same 4))))
`;
      expect(() => evaluatePie(str)).not.toThrow();
    });

    it("24. exists-odd: 5 is odd (n=5, k=2)", () => {
      const str = `${arithPreamble}
(claim exists-odd (Sigma ((n Nat)) (Sigma ((k Nat)) (= Nat n (add1 (+ k k))))))
(define-tactically exists-odd
  ((exists 5 n) (exists 2 k) (exact (same 5))))
`;
      expect(() => evaluatePie(str)).not.toThrow();
    });

    it("25. exists-multiple-of-3: 12 = 3*4", () => {
      const str = `${arithPreamble}
(claim exists-mult-3 (Sigma ((n Nat)) (Sigma ((k Nat)) (= Nat n (* 3 k)))))
(define-tactically exists-mult-3
  ((exists 12 n) (exists 4 k) (exact (same 12))))
`;
      expect(() => evaluatePie(str)).not.toThrow();
    });

    it("26. sum formulas: 1+2=3, 1+2+3=6, 1+2+3+4=10", () => {
      const str = `${arithPreamble}
(claim sum2 (= Nat (+ 1 2) 3))
(define-tactically sum2 ((exact (same 3))))
(claim sum3 (= Nat (+ (+ 1 2) 3) 6))
(define-tactically sum3 ((exact (same 6))))
(claim sum4 (= Nat (+ (+ (+ 1 2) 3) 4) 10))
(define-tactically sum4 ((exact (same 10))))
`;
      expect(() => evaluatePie(str)).not.toThrow();
    });

    it("27. consecutive sum: n + (n+1) for n=3 is 7", () => {
      const str = `${arithPreamble}
(claim consec (= Nat (+ 3 (add1 3)) 7))
(define-tactically consec ((exact (same 7))))
`;
      expect(() => evaluatePie(str)).not.toThrow();
    });

  });

  // ===== Part 6: Power Computations =====

  describe("Power Computations", () => {

    it("28. pow(2,1)=2", () => {
      const str = `${powPreamble}
(claim p (= Nat (pow 2 1) 2))
(define-tactically p ((exact (same 2))))
`;
      expect(() => evaluatePie(str)).not.toThrow();
    });

    it("29. pow(2,2)=4", () => {
      const str = `${powPreamble}
(claim p (= Nat (pow 2 2) 4))
(define-tactically p ((exact (same 4))))
`;
      expect(() => evaluatePie(str)).not.toThrow();
    });

    it("30. pow(2,3)=8", () => {
      const str = `${powPreamble}
(claim p (= Nat (pow 2 3) 8))
(define-tactically p ((exact (same 8))))
`;
      expect(() => evaluatePie(str)).not.toThrow();
    });

    it("31. pow(2,4)=16", () => {
      const str = `${powPreamble}
(claim p (= Nat (pow 2 4) 16))
(define-tactically p ((exact (same 16))))
`;
      expect(() => evaluatePie(str)).not.toThrow();
    });

    it("32. pow(3,2)=9", () => {
      const str = `${powPreamble}
(claim p (= Nat (pow 3 2) 9))
(define-tactically p ((exact (same 9))))
`;
      expect(() => evaluatePie(str)).not.toThrow();
    });

    it("33. pow(3,3)=27", () => {
      const str = `${powPreamble}
(claim p (= Nat (pow 3 3) 27))
(define-tactically p ((exact (same 27))))
`;
      expect(() => evaluatePie(str)).not.toThrow();
    });

  });

  // ===== Part 7: Witness Extraction =====

  describe("Witness Extraction via car/cdr", () => {

    it("34. extract witness from half-6: car = 3", () => {
      const str = `${arithPreamble}
(claim half-6 (Sigma ((k Nat)) (= Nat (* 2 k) 6)))
(define-tactically half-6 ((exists 3 k) (exact (same 6))))
(claim w (= Nat (car half-6) 3))
(define-tactically w ((exact (same 3))))
`;
      expect(() => evaluatePie(str)).not.toThrow();
    });

    it("35. extract first factor from nested sigma", () => {
      const str = `${arithPreamble}
(claim f6 (Sigma ((a Nat)) (Sigma ((b Nat)) (= Nat (* a b) 6))))
(define-tactically f6 ((exists 2 a) (exists 3 b) (exact (same 6))))
(claim f6-a (= Nat (car f6) 2))
(define-tactically f6-a ((exact (same 2))))
`;
      expect(() => evaluatePie(str)).not.toThrow();
    });

    it("36. extract second factor from nested sigma via car-cdr", () => {
      const str = `${arithPreamble}
(claim f10 (Sigma ((a Nat)) (Sigma ((b Nat)) (= Nat (* a b) 10))))
(define-tactically f10 ((exists 2 a) (exists 5 b) (exact (same 10))))
(claim f10-b (= Nat (car (cdr f10)) 5))
(define-tactically f10-b ((exact (same 5))))
`;
      expect(() => evaluatePie(str)).not.toThrow();
    });

    it("37. extract equality proof via cdr-cdr", () => {
      const str = `${arithPreamble}
(claim div9 (Sigma ((k Nat)) (= Nat (* 3 k) 9)))
(define-tactically div9 ((exists 3 k) (exact (same 9))))
(claim div9-eq (= Nat (* 3 (car div9)) 9))
(define-tactically div9-eq ((exact (cdr div9))))
`;
      expect(() => evaluatePie(str)).not.toThrow();
    });

    it("38. bundles two witnesses using split-Pair", () => {
      const str = `${arithPreamble}
(claim bundled
  (Sigma ((p1 (Sigma ((k Nat)) (= Nat (* 2 k) 4))))
    (Sigma ((k Nat)) (= Nat (* 3 k) 9))))
(define-tactically bundled
  ((split-Pair)
   (then (exists 2 k) (exact (same 4)))
   (then (exists 3 k) (exact (same 9)))))
(car (car bundled))
`;
      const output = evaluatePie(str);
      expect(output).toContain("2: Nat");
    });

  });

  // ===== Part 8: Constructive Choice =====

  describe("Constructive Choice from Either", () => {

    it("39. eliminates Either to produce sigma from left", () => {
      const str = `${arithPreamble}
(claim choose
  (-> (Either (Sigma ((k Nat)) (= Nat (* 2 k) 4))
              (Sigma ((k Nat)) (= Nat (* 3 k) 9)))
     (Sigma ((n Nat)) Nat)))
(define-tactically choose
  ((intro e) (elim-Either e)
   (then (intro lp) (exists (car lp) n) (exact (* 2 (car lp))))
   (then (intro rp) (exists (car rp) n) (exact (* 3 (car rp))))))
`;
      expect(() => evaluatePie(str)).not.toThrow();
    });

    it("40. eliminates Either Nat Nat to Sigma", () => {
      const str = `${arithPreamble}
(claim e2s (-> (Either Nat Nat) (Sigma ((n Nat)) Nat)))
(define-tactically e2s
  ((intro e) (elim-Either e)
   (then (intro l) (split-Pair) (then (exact l)) (then (exact (+ l l))))
   (then (intro r) (split-Pair) (then (exact r)) (then (exact (* r r))))))
(claim check-left (= Nat (car (e2s (left 3))) 3))
(define-tactically check-left ((exact (same 3))))
(claim check-right-cdr (= Nat (cdr (e2s (right 4))) 16))
(define-tactically check-right-cdr ((exact (same 16))))
`;
      expect(() => evaluatePie(str)).not.toThrow();
    });

  });

  // ===== Part 9: Dependent Witnesses =====

  describe("Dependent Witnesses", () => {

    it("41. double-exists: for every n, m=n+n exists", () => {
      const str = `${arithPreamble}
(claim double-exists (Pi ((n Nat)) (Sigma ((m Nat)) (= Nat m (+ n n)))))
(define-tactically double-exists
  ((intro n) (exists (+ n n) m) (exact (same (+ n n)))))
(claim de3 (= Nat (car (double-exists 3)) 6))
(define-tactically de3 ((exact (same 6))))
`;
      expect(() => evaluatePie(str)).not.toThrow();
    });

    it("42. square-exists: for every n, m=n*n exists", () => {
      const str = `${arithPreamble}
(claim square-exists (Pi ((n Nat)) (Sigma ((m Nat)) (= Nat m (* n n)))))
(define-tactically square-exists
  ((intro n) (exists (* n n) m) (exact (same (* n n)))))
(claim se4 (= Nat (car (square-exists 4)) 16))
(define-tactically se4 ((exact (same 16))))
`;
      expect(() => evaluatePie(str)).not.toThrow();
    });

    it("43. add1-exists: for every n, m=add1(n) exists", () => {
      const str = `${arithPreamble}
(claim succ-exists (Pi ((n Nat)) (Sigma ((m Nat)) (= Nat m (add1 n)))))
(define-tactically succ-exists
  ((intro n) (exists (add1 n) m) (exact (same (add1 n)))))
(claim se5 (= Nat (car (succ-exists 5)) 6))
(define-tactically se5 ((exact (same 6))))
`;
      expect(() => evaluatePie(str)).not.toThrow();
    });

  });

  // ===== Part 10: Replace and Transport =====

  describe("Replace and Transport in Action", () => {

    it("44. uses replace along (= Nat 3 3)", () => {
      const str = `${arithPreamble}
(claim replace-triv
  (-> (= Nat 3 3) (= Nat (+ 3 0) 3) (= Nat (+ 3 0) 3)))
(define-tactically replace-triv
  ((intro eq) (intro p)
   (rewrite eq (lambda (x) (= Nat (+ x 0) x)))
   (exact p)))
`;
      expect(() => evaluatePie(str)).not.toThrow();
    });

    it("45. uses replace to change predicate target", () => {
      const str = `${arithPreamble}
(claim transport-c
  (-> (= Nat 2 2) (Sigma ((k Nat)) (= Nat (+ 2 k) 5)) (Sigma ((k Nat)) (= Nat (+ 2 k) 5))))
(define-tactically transport-c
  ((intro eq) (intro witness)
   (rewrite eq (lambda (x) (Sigma ((k Nat)) (= Nat (+ x k) 5))))
   (exact witness)))
`;
      expect(() => evaluatePie(str)).not.toThrow();
    });

    it("46. symmetry on concrete equality", () => {
      const str = `
(claim symm-c (-> (= Nat 4 4) (= Nat 4 4)))
(define-tactically symm-c ((intro eq) (symm) (exact eq)))
`;
      expect(() => evaluatePie(str)).not.toThrow();
    });

    it("47. transitivity chain on concrete", () => {
      const str = `
(claim trans-c (-> (= Nat 7 7) (= Nat 7 7) (= Nat 7 7)))
(define-tactically trans-c ((intro e1) (intro e2) (trans e1 e2)))
`;
      expect(() => evaluatePie(str)).not.toThrow();
    });

  });

  // ===== Part 11: Error Cases =====

  describe("Error Cases", () => {

    it("48. rejects wrong witness: sqrt(4) != 3", () => {
      const str = `${arithPreamble}
(claim bad-sqrt (Sigma ((k Nat)) (= Nat (* k k) 4)))
(define-tactically bad-sqrt ((exists 3 k) (exact (same 4))))
`;
      expect(() => evaluatePie(str)).toThrow();
    });

    it("49. rejects type mismatch: Nat witness for Atom sigma", () => {
      const str = `
(claim bad-sigma (Sigma ((a Atom)) (= Atom a 'hello)))
(define-tactically bad-sigma ((exists 5 a) (exact (same 'hello))))
`;
      expect(() => evaluatePie(str)).toThrow();
    });

    it("50. rejects wrong product: 3*3 != 10", () => {
      const str = `${arithPreamble}
(claim bad-prod (= Nat (* 3 3) 10))
(define-tactically bad-prod ((exact (same 10))))
`;
      expect(() => evaluatePie(str)).toThrow();
    });

  });

});
