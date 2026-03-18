import 'jest';
import { evaluatePie } from '../../main';

const arithPreamble = `
(claim + (-> Nat Nat Nat))
(define + (lambda (n j) (iter-Nat n j (lambda (x) (add1 x)))))
(claim * (-> Nat Nat Nat))
(define * (lambda (n m) (iter-Nat n 0 (+ m))))
`;

const multPreamble = `${arithPreamble}
(claim n+0=n (Pi ((n Nat)) (= Nat (+ n 0) n)))
(define-tactically n+0=n
  ((intro n) (elim-Nat n)
   (then (exact (same 0)))
   (then (intro n-1) (intro ih) (exact (cong ih (+ 1))))))

(claim +add1 (Pi ((n Nat) (m Nat)) (= Nat (+ n (add1 m)) (add1 (+ n m)))))
(define-tactically +add1
  ((intro n) (intro m) (elim-Nat n)
   (then (exact (same (add1 m))))
   (then (intro n-1) (intro ih) (exact (cong ih (+ 1))))))

(claim +-comm (Pi ((n Nat) (m Nat)) (= Nat (+ n m) (+ m n))))
(define-tactically +-comm
  ((intro n) (intro m) (elim-Nat n)
   (then (exact (symm (n+0=n m))))
   (then (intro n-1) (intro ih)
     (exact (trans (cong ih (+ 1)) (symm (+add1 m n-1)))))))

(claim +-assoc (Pi ((a Nat) (b Nat) (c Nat)) (= Nat (+ (+ a b) c) (+ a (+ b c)))))
(define-tactically +-assoc
  ((intro a) (intro b) (intro c) (elim-Nat a)
   (then (exact (same (+ b c))))
   (then (intro a-1) (intro ih) (exact (cong ih (+ 1))))))
`;

describe("Complex Multiplication Properties", () => {

  describe("Foundation: Multiplication by Zero and One", () => {

    it("proves n*0=0 by induction on n", () => {
      const str = `${multPreamble}
(claim n*0=0 (Pi ((n Nat)) (= Nat (* n 0) 0)))
(define-tactically n*0=0
  ((intro n) (elim-Nat n)
   (then (exact (same 0)))
   (then (intro n-1) (intro ih) (exact ih))))
`;
      expect(() => evaluatePie(str)).not.toThrow();
    });

    it("proves 0*n=0 directly since (* 0 n) reduces to 0", () => {
      const str = `${multPreamble}
(claim 0*n=0 (Pi ((n Nat)) (= Nat (* 0 n) 0)))
(define-tactically 0*n=0
  ((intro n) (exact (same 0))))
`;
      expect(() => evaluatePie(str)).not.toThrow();
    });

    it("proves 1*n=n since (* 1 n) = (+ n (* 0 n)) = (+ n 0)", () => {
      const str = `${multPreamble}
(claim 1*n=n (Pi ((n Nat)) (= Nat (* 1 n) n)))
(define-tactically 1*n=n
  ((intro n) (exact (n+0=n n))))
`;
      expect(() => evaluatePie(str)).not.toThrow();
    });

    it("proves n*1=n by induction on n", () => {
      const str = `${multPreamble}
(claim n*1=n (Pi ((n Nat)) (= Nat (* n 1) n)))
(define-tactically n*1=n
  ((intro n) (elim-Nat n)
   (then (exact (same 0)))
   (then (intro n-1) (intro ih) (exact (cong ih (+ 1))))))
`;
      expect(() => evaluatePie(str)).not.toThrow();
    });

  });

  describe("Key Lemma: Multiplication Distributes Over Successor", () => {

    it("proves *-add1: n*(add1 m) = n + n*m by induction on n", () => {
      const str = `${multPreamble}
(claim +-swap (Pi ((a Nat) (b Nat) (c Nat)) (= Nat (+ a (+ b c)) (+ b (+ a c)))))
(define-tactically +-swap
  ((intro a) (intro b) (intro c)
   (exact
     (trans (symm (+-assoc a b c))
       (trans (replace (+-comm a b)
                (the (-> Nat U) (lambda (x) (= Nat (+ (+ a b) c) (+ x c))))
                (same (+ (+ a b) c)))
         (+-assoc b a c))))))

(claim *-add1 (Pi ((n Nat) (m Nat)) (= Nat (* n (add1 m)) (+ n (* n m)))))
(define-tactically *-add1
  ((intro n) (intro m) (elim-Nat n)
   (then (exact (same 0)))
   (then (intro n-1) (intro ih)
     (exact
       (trans (cong ih (+ (add1 m)))
         (cong (+-swap m n-1 (* n-1 m)) (+ 1)))))))
`;
      expect(() => evaluatePie(str)).not.toThrow();
    });

  });

  describe("Commutativity of Multiplication", () => {

    it("proves *-comm: n*m = m*n using n*0=0 and *-add1", () => {
      const str = `${multPreamble}
(claim +-swap (Pi ((a Nat) (b Nat) (c Nat)) (= Nat (+ a (+ b c)) (+ b (+ a c)))))
(define-tactically +-swap
  ((intro a) (intro b) (intro c)
   (exact
     (trans (symm (+-assoc a b c))
       (trans (replace (+-comm a b)
                (the (-> Nat U) (lambda (x) (= Nat (+ (+ a b) c) (+ x c))))
                (same (+ (+ a b) c)))
         (+-assoc b a c))))))

(claim n*0=0 (Pi ((n Nat)) (= Nat (* n 0) 0)))
(define-tactically n*0=0
  ((intro n) (elim-Nat n)
   (then (exact (same 0)))
   (then (intro n-1) (intro ih) (exact ih))))

(claim *-add1 (Pi ((n Nat) (m Nat)) (= Nat (* n (add1 m)) (+ n (* n m)))))
(define-tactically *-add1
  ((intro n) (intro m) (elim-Nat n)
   (then (exact (same 0)))
   (then (intro n-1) (intro ih)
     (exact
       (trans (cong ih (+ (add1 m)))
         (cong (+-swap m n-1 (* n-1 m)) (+ 1)))))))

(claim *-comm (Pi ((n Nat) (m Nat)) (= Nat (* n m) (* m n))))
(define-tactically *-comm
  ((intro n) (intro m) (elim-Nat m)
   (then (exact (n*0=0 n)))
   (then (intro m-1) (intro ih)
     (exact (trans (*-add1 n m-1) (cong ih (+ n)))))))
`;
      expect(() => evaluatePie(str)).not.toThrow();
    });

  });

  describe("Left Distributivity of Multiplication Over Addition", () => {

    it("proves *-dist-left: n*(m+k) = n*m + n*k by induction on n", () => {
      const str = `${multPreamble}
(claim +-swap (Pi ((a Nat) (b Nat) (c Nat)) (= Nat (+ a (+ b c)) (+ b (+ a c)))))
(define-tactically +-swap
  ((intro a) (intro b) (intro c)
   (exact
     (trans (symm (+-assoc a b c))
       (trans (replace (+-comm a b)
                (the (-> Nat U) (lambda (x) (= Nat (+ (+ a b) c) (+ x c))))
                (same (+ (+ a b) c)))
         (+-assoc b a c))))))

(claim +swap4 (Pi ((m Nat) (k Nat) (a Nat) (b Nat))
  (= Nat (+ (+ m k) (+ a b)) (+ (+ m a) (+ k b)))))
(define-tactically +swap4
  ((intro m) (intro k) (intro a) (intro b)
   (exact
     (trans (+-assoc m k (+ a b))
       (trans (cong (+-swap k a b) (+ m))
         (symm (+-assoc m a (+ k b))))))))

(claim *-dist-left (Pi ((n Nat) (m Nat) (k Nat))
  (= Nat (* n (+ m k)) (+ (* n m) (* n k)))))
(define-tactically *-dist-left
  ((intro n) (intro m) (intro k) (elim-Nat n)
   (then (exact (same 0)))
   (then (intro n-1) (intro ih)
     (exact
       (trans (cong ih (+ (+ m k)))
         (+swap4 m k (* n-1 m) (* n-1 k)))))))
`;
      expect(() => evaluatePie(str)).not.toThrow();
    });

  });

  describe("Associativity of Multiplication", () => {

    it("proves *-assoc: (a*b)*c = a*(b*c) by induction on a", () => {
      const str = `${multPreamble}
(claim +-swap (Pi ((a Nat) (b Nat) (c Nat)) (= Nat (+ a (+ b c)) (+ b (+ a c)))))
(define-tactically +-swap
  ((intro a) (intro b) (intro c)
   (exact
     (trans (symm (+-assoc a b c))
       (trans (replace (+-comm a b)
                (the (-> Nat U) (lambda (x) (= Nat (+ (+ a b) c) (+ x c))))
                (same (+ (+ a b) c)))
         (+-assoc b a c))))))

(claim n*0=0 (Pi ((n Nat)) (= Nat (* n 0) 0)))
(define-tactically n*0=0
  ((intro n) (elim-Nat n)
   (then (exact (same 0)))
   (then (intro n-1) (intro ih) (exact ih))))

(claim *-add1 (Pi ((n Nat) (m Nat)) (= Nat (* n (add1 m)) (+ n (* n m)))))
(define-tactically *-add1
  ((intro n) (intro m) (elim-Nat n)
   (then (exact (same 0)))
   (then (intro n-1) (intro ih)
     (exact
       (trans (cong ih (+ (add1 m)))
         (cong (+-swap m n-1 (* n-1 m)) (+ 1)))))))

(claim *-comm (Pi ((n Nat) (m Nat)) (= Nat (* n m) (* m n))))
(define-tactically *-comm
  ((intro n) (intro m) (elim-Nat m)
   (then (exact (n*0=0 n)))
   (then (intro m-1) (intro ih)
     (exact (trans (*-add1 n m-1) (cong ih (+ n)))))))

(claim +swap4 (Pi ((m Nat) (k Nat) (a Nat) (b Nat))
  (= Nat (+ (+ m k) (+ a b)) (+ (+ m a) (+ k b)))))
(define-tactically +swap4
  ((intro m) (intro k) (intro a) (intro b)
   (exact
     (trans (+-assoc m k (+ a b))
       (trans (cong (+-swap k a b) (+ m))
         (symm (+-assoc m a (+ k b))))))))

(claim *-dist-left (Pi ((n Nat) (m Nat) (k Nat))
  (= Nat (* n (+ m k)) (+ (* n m) (* n k)))))
(define-tactically *-dist-left
  ((intro n) (intro m) (intro k) (elim-Nat n)
   (then (exact (same 0)))
   (then (intro n-1) (intro ih)
     (exact
       (trans (cong ih (+ (+ m k)))
         (+swap4 m k (* n-1 m) (* n-1 k)))))))

(claim *-dist-right (Pi ((n Nat) (m Nat) (k Nat))
  (= Nat (* (+ m k) n) (+ (* m n) (* k n)))))
(define-tactically *-dist-right
  ((intro n) (intro m) (intro k)
   (exact
     (trans (*-comm (+ m k) n)
       (trans (*-dist-left n m k)
         (trans (cong (*-comm n m) (the (-> Nat Nat) (lambda (y) (+ y (* n k)))))
           (cong (*-comm n k) (+ (* m n)))))))))

(claim *-assoc (Pi ((a Nat) (b Nat) (c Nat))
  (= Nat (* (* a b) c) (* a (* b c)))))
(define-tactically *-assoc
  ((intro a) (intro b) (intro c) (elim-Nat a)
   (then (exact (same 0)))
   (then (intro a-1) (intro ih)
     (exact
       (trans (*-dist-right c b (* a-1 b))
         (cong ih (+ (* b c))))))))
`;
      expect(() => evaluatePie(str)).not.toThrow();
    });

  });

  describe("Equality Rewriting Principles", () => {

    it("proves cong2: a=b and c=d implies f(a,c) = f(b,d)", () => {
      const str = `${arithPreamble}
(claim cong2
  (Pi ((A U) (B U) (C U) (f (-> A B C)) (a A) (b A) (c B) (d B))
    (-> (= A a b) (= B c d) (= C (f a c) (f b d)))))
(define-tactically cong2
  ((intro A) (intro B) (intro C) (intro f)
   (intro a) (intro b) (intro c) (intro d)
   (intro eq1) (intro eq2)
   (exact (trans (cong eq1 (the (-> A C) (lambda (x) (f x c)))) (cong eq2 (f b))))))
`;
      expect(() => evaluatePie(str)).not.toThrow();
    });

    it("proves transport: (= A a b) -> P(a) -> P(b) using replace", () => {
      const str = `${arithPreamble}
(claim transport
  (Pi ((A U) (a A) (b A))
    (-> (= A a b) (Pi ((P (-> A U))) (-> (P a) (P b))))))
(define-tactically transport
  ((intro A) (intro a) (intro b)
   (intro eq) (intro P) (intro pa)
   (exact (replace eq P pa))))
`;
      expect(() => evaluatePie(str)).not.toThrow();
    });

  });

  describe("Verification: Concrete Instantiations", () => {

    it("verifies 2*3 = 3*2 by computation", () => {
      const str = `${arithPreamble}
(claim 2*3=3*2 (= Nat (* 2 3) (* 3 2)))
(define-tactically 2*3=3*2
  ((exact (same 6))))
`;
      expect(() => evaluatePie(str)).not.toThrow();
    });

    it("verifies 3*4 = 12 by computation", () => {
      const str = `${arithPreamble}
(claim 3*4=12 (= Nat (* 3 4) 12))
(define-tactically 3*4=12
  ((exact (same 12))))
`;
      expect(() => evaluatePie(str)).not.toThrow();
    });

    it("verifies (2*3)*4 = 2*(3*4) by computation", () => {
      const str = `${arithPreamble}
(claim assoc-2-3-4 (= Nat (* (* 2 3) 4) (* 2 (* 3 4))))
(define-tactically assoc-2-3-4
  ((exact (same 24))))
`;
      expect(() => evaluatePie(str)).not.toThrow();
    });

    it("verifies 2*(3+4) = 2*3 + 2*4 by computation", () => {
      const str = `${arithPreamble}
(claim dist-2-3-4 (= Nat (* 2 (+ 3 4)) (+ (* 2 3) (* 2 4))))
(define-tactically dist-2-3-4
  ((exact (same 14))))
`;
      expect(() => evaluatePie(str)).not.toThrow();
    });

    it("verifies n*0=0 at n=5 evaluates to (same 0)", () => {
      const str = `${multPreamble}
(claim n*0=0 (Pi ((n Nat)) (= Nat (* n 0) 0)))
(define-tactically n*0=0
  ((intro n) (elim-Nat n)
   (then (exact (same 0)))
   (then (intro n-1) (intro ih) (exact ih))))
(n*0=0 5)
`;
      const output = evaluatePie(str);
      expect(output).toContain("(same 0)");
    });

    it("verifies 1*n=n at n=7 evaluates to (same 7)", () => {
      const str = `${multPreamble}
(claim 1*n=n (Pi ((n Nat)) (= Nat (* 1 n) n)))
(define-tactically 1*n=n
  ((intro n) (exact (n+0=n n))))
(1*n=n 7)
`;
      const output = evaluatePie(str);
      expect(output).toContain("(same 7)");
    });

    it("verifies n*1=n at n=4 evaluates to (same 4)", () => {
      const str = `${multPreamble}
(claim n*1=n (Pi ((n Nat)) (= Nat (* n 1) n)))
(define-tactically n*1=n
  ((intro n) (elim-Nat n)
   (then (exact (same 0)))
   (then (intro n-1) (intro ih) (exact (cong ih (+ 1))))))
(n*1=n 4)
`;
      const output = evaluatePie(str);
      expect(output).toContain("(same 4)");
    });

    it("verifies 5*3 = 15 by computation", () => {
      const str = `${arithPreamble}
(claim 5*3=15 (= Nat (* 5 3) 15))
(define-tactically 5*3=15
  ((exact (same 15))))
`;
      expect(() => evaluatePie(str)).not.toThrow();
    });

    it("verifies 4*5 = 20 by computation", () => {
      const str = `${arithPreamble}
(claim 4*5=20 (= Nat (* 4 5) 20))
(define-tactically 4*5=20
  ((exact (same 20))))
`;
      expect(() => evaluatePie(str)).not.toThrow();
    });

    it("verifies 0*100 = 0 by computation", () => {
      const str = `${arithPreamble}
(claim 0*100=0 (= Nat (* 0 100) 0))
(define-tactically 0*100=0
  ((exact (same 0))))
`;
      expect(() => evaluatePie(str)).not.toThrow();
    });

    it("verifies 100*0 = 0 using n*0=0 lemma", () => {
      const str = `${multPreamble}
(claim n*0=0 (Pi ((n Nat)) (= Nat (* n 0) 0)))
(define-tactically n*0=0
  ((intro n) (elim-Nat n)
   (then (exact (same 0)))
   (then (intro n-1) (intro ih) (exact ih))))
(claim 100*0=0 (= Nat (* 100 0) 0))
(define-tactically 100*0=0
  ((exact (n*0=0 100))))
`;
      expect(() => evaluatePie(str)).not.toThrow();
    });

    it("verifies 3*5 = 5*3 by computation", () => {
      const str = `${arithPreamble}
(claim 3*5=5*3 (= Nat (* 3 5) (* 5 3)))
(define-tactically 3*5=5*3
  ((exact (same 15))))
`;
      expect(() => evaluatePie(str)).not.toThrow();
    });

    it("verifies 7*2 = 2*7 by computation", () => {
      const str = `${arithPreamble}
(claim 7*2=2*7 (= Nat (* 7 2) (* 2 7)))
(define-tactically 7*2=2*7
  ((exact (same 14))))
`;
      expect(() => evaluatePie(str)).not.toThrow();
    });

    it("verifies (1*5)*3 = 1*(5*3) associativity by computation", () => {
      const str = `${arithPreamble}
(claim assoc-1-5-3 (= Nat (* (* 1 5) 3) (* 1 (* 5 3))))
(define-tactically assoc-1-5-3
  ((exact (same 15))))
`;
      expect(() => evaluatePie(str)).not.toThrow();
    });

    it("verifies 3*(2+4) = 3*2 + 3*4 left distributivity by computation", () => {
      const str = `${arithPreamble}
(claim dist-3-2-4 (= Nat (* 3 (+ 2 4)) (+ (* 3 2) (* 3 4))))
(define-tactically dist-3-2-4
  ((exact (same 18))))
`;
      expect(() => evaluatePie(str)).not.toThrow();
    });

    it("verifies 2*(5+3) = 2*5 + 2*3 left distributivity by computation", () => {
      const str = `${arithPreamble}
(claim dist-2-5-3 (= Nat (* 2 (+ 5 3)) (+ (* 2 5) (* 2 3))))
(define-tactically dist-2-5-3
  ((exact (same 16))))
`;
      expect(() => evaluatePie(str)).not.toThrow();
    });

  });

  describe("Standalone Helper Lemmas", () => {

    it("proves +-swap as a standalone lemma: a+(b+c) = b+(a+c)", () => {
      const str = `${multPreamble}
(claim +-swap (Pi ((a Nat) (b Nat) (c Nat)) (= Nat (+ a (+ b c)) (+ b (+ a c)))))
(define-tactically +-swap
  ((intro a) (intro b) (intro c)
   (exact
     (trans (symm (+-assoc a b c))
       (trans (replace (+-comm a b)
                (the (-> Nat U) (lambda (x) (= Nat (+ (+ a b) c) (+ x c))))
                (same (+ (+ a b) c)))
         (+-assoc b a c))))))
`;
      expect(() => evaluatePie(str)).not.toThrow();
    });

    it("verifies +-swap at concrete values: 2+(3+4) = 3+(2+4)", () => {
      const str = `${multPreamble}
(claim +-swap (Pi ((a Nat) (b Nat) (c Nat)) (= Nat (+ a (+ b c)) (+ b (+ a c)))))
(define-tactically +-swap
  ((intro a) (intro b) (intro c)
   (exact
     (trans (symm (+-assoc a b c))
       (trans (replace (+-comm a b)
                (the (-> Nat U) (lambda (x) (= Nat (+ (+ a b) c) (+ x c))))
                (same (+ (+ a b) c)))
         (+-assoc b a c))))))
(+-swap 2 3 4)
`;
      const output = evaluatePie(str);
      expect(output).toContain("(same 9)");
    });

    it("proves +swap4 as a standalone lemma: (m+k)+(a+b) = (m+a)+(k+b)", () => {
      const str = `${multPreamble}
(claim +-swap (Pi ((a Nat) (b Nat) (c Nat)) (= Nat (+ a (+ b c)) (+ b (+ a c)))))
(define-tactically +-swap
  ((intro a) (intro b) (intro c)
   (exact
     (trans (symm (+-assoc a b c))
       (trans (replace (+-comm a b)
                (the (-> Nat U) (lambda (x) (= Nat (+ (+ a b) c) (+ x c))))
                (same (+ (+ a b) c)))
         (+-assoc b a c))))))

(claim +swap4 (Pi ((m Nat) (k Nat) (a Nat) (b Nat))
  (= Nat (+ (+ m k) (+ a b)) (+ (+ m a) (+ k b)))))
(define-tactically +swap4
  ((intro m) (intro k) (intro a) (intro b)
   (exact
     (trans (+-assoc m k (+ a b))
       (trans (cong (+-swap k a b) (+ m))
         (symm (+-assoc m a (+ k b))))))))
`;
      expect(() => evaluatePie(str)).not.toThrow();
    });

    it("verifies +swap4 at concrete values: (1+2)+(3+4) = (1+3)+(2+4)", () => {
      const str = `${multPreamble}
(claim +-swap (Pi ((a Nat) (b Nat) (c Nat)) (= Nat (+ a (+ b c)) (+ b (+ a c)))))
(define-tactically +-swap
  ((intro a) (intro b) (intro c)
   (exact
     (trans (symm (+-assoc a b c))
       (trans (replace (+-comm a b)
                (the (-> Nat U) (lambda (x) (= Nat (+ (+ a b) c) (+ x c))))
                (same (+ (+ a b) c)))
         (+-assoc b a c))))))

(claim +swap4 (Pi ((m Nat) (k Nat) (a Nat) (b Nat))
  (= Nat (+ (+ m k) (+ a b)) (+ (+ m a) (+ k b)))))
(define-tactically +swap4
  ((intro m) (intro k) (intro a) (intro b)
   (exact
     (trans (+-assoc m k (+ a b))
       (trans (cong (+-swap k a b) (+ m))
         (symm (+-assoc m a (+ k b))))))))
(+swap4 1 2 3 4)
`;
      const output = evaluatePie(str);
      expect(output).toContain("(same 10)");
    });

    it("proves *-dist-right as a standalone theorem", () => {
      const str = `${multPreamble}
(claim +-swap (Pi ((a Nat) (b Nat) (c Nat)) (= Nat (+ a (+ b c)) (+ b (+ a c)))))
(define-tactically +-swap
  ((intro a) (intro b) (intro c)
   (exact
     (trans (symm (+-assoc a b c))
       (trans (replace (+-comm a b)
                (the (-> Nat U) (lambda (x) (= Nat (+ (+ a b) c) (+ x c))))
                (same (+ (+ a b) c)))
         (+-assoc b a c))))))

(claim n*0=0 (Pi ((n Nat)) (= Nat (* n 0) 0)))
(define-tactically n*0=0
  ((intro n) (elim-Nat n)
   (then (exact (same 0)))
   (then (intro n-1) (intro ih) (exact ih))))

(claim *-add1 (Pi ((n Nat) (m Nat)) (= Nat (* n (add1 m)) (+ n (* n m)))))
(define-tactically *-add1
  ((intro n) (intro m) (elim-Nat n)
   (then (exact (same 0)))
   (then (intro n-1) (intro ih)
     (exact
       (trans (cong ih (+ (add1 m)))
         (cong (+-swap m n-1 (* n-1 m)) (+ 1)))))))

(claim *-comm (Pi ((n Nat) (m Nat)) (= Nat (* n m) (* m n))))
(define-tactically *-comm
  ((intro n) (intro m) (elim-Nat m)
   (then (exact (n*0=0 n)))
   (then (intro m-1) (intro ih)
     (exact (trans (*-add1 n m-1) (cong ih (+ n)))))))

(claim +swap4 (Pi ((m Nat) (k Nat) (a Nat) (b Nat))
  (= Nat (+ (+ m k) (+ a b)) (+ (+ m a) (+ k b)))))
(define-tactically +swap4
  ((intro m) (intro k) (intro a) (intro b)
   (exact
     (trans (+-assoc m k (+ a b))
       (trans (cong (+-swap k a b) (+ m))
         (symm (+-assoc m a (+ k b))))))))

(claim *-dist-left (Pi ((n Nat) (m Nat) (k Nat))
  (= Nat (* n (+ m k)) (+ (* n m) (* n k)))))
(define-tactically *-dist-left
  ((intro n) (intro m) (intro k) (elim-Nat n)
   (then (exact (same 0)))
   (then (intro n-1) (intro ih)
     (exact
       (trans (cong ih (+ (+ m k)))
         (+swap4 m k (* n-1 m) (* n-1 k)))))))

(claim *-dist-right (Pi ((n Nat) (m Nat) (k Nat))
  (= Nat (* (+ m k) n) (+ (* m n) (* k n)))))
(define-tactically *-dist-right
  ((intro n) (intro m) (intro k)
   (exact
     (trans (*-comm (+ m k) n)
       (trans (*-dist-left n m k)
         (trans (cong (*-comm n m) (the (-> Nat Nat) (lambda (y) (+ y (* n k)))))
           (cong (*-comm n k) (+ (* m n)))))))))
`;
      expect(() => evaluatePie(str)).not.toThrow();
    });

    it("verifies *-dist-right at (2+3)*4 = 2*4 + 3*4 = 20", () => {
      const str = `${arithPreamble}
(claim dist-right-check (= Nat (* (+ 2 3) 4) (+ (* 2 4) (* 3 4))))
(define-tactically dist-right-check
  ((exact (same 20))))
`;
      expect(() => evaluatePie(str)).not.toThrow();
    });

    it("verifies *-dist-right at (1+4)*3 = 1*3 + 4*3 = 15", () => {
      const str = `${arithPreamble}
(claim dist-right-check-2 (= Nat (* (+ 1 4) 3) (+ (* 1 3) (* 4 3))))
(define-tactically dist-right-check-2
  ((exact (same 15))))
`;
      expect(() => evaluatePie(str)).not.toThrow();
    });

  });

  describe("n*2 = n+n and Squared Expansion", () => {

    it("verifies n*2 = n+n at n=0 by computation", () => {
      const str = `${arithPreamble}
(claim check-0 (= Nat (* 0 2) (+ 0 0)))
(define-tactically check-0
  ((exact (same 0))))
`;
      expect(() => evaluatePie(str)).not.toThrow();
    });

    it("verifies n*2 = n+n at n=3 by computation", () => {
      const str = `${arithPreamble}
(claim check-3 (= Nat (* 3 2) (+ 3 3)))
(define-tactically check-3
  ((exact (same 6))))
`;
      expect(() => evaluatePie(str)).not.toThrow();
    });

    it("verifies n*2 = n+n at n=7 by computation", () => {
      const str = `${arithPreamble}
(claim check-7 (= Nat (* 7 2) (+ 7 7)))
(define-tactically check-7
  ((exact (same 14))))
`;
      expect(() => evaluatePie(str)).not.toThrow();
    });

    it("verifies (2+1)*(2+1) = 2*2 + 2*2 + 1 = 9 (squared expansion at n=2)", () => {
      const str = `${arithPreamble}
(claim sq-2 (= Nat (* 3 3) (+ (+ (* 2 2) (+ (* 2 1) (* 1 2))) (* 1 1))))
(define-tactically sq-2
  ((exact (same 9))))
`;
      expect(() => evaluatePie(str)).not.toThrow();
    });

    it("verifies (3+1)*(3+1) = 3*3 + 2*3 + 1 = 16 (squared expansion at n=3)", () => {
      const str = `${arithPreamble}
(claim sq-3 (= Nat (* 4 4) (+ (+ (* 3 3) (+ 3 3)) 1)))
(define-tactically sq-3
  ((exact (same 16))))
`;
      expect(() => evaluatePie(str)).not.toThrow();
    });

    it("verifies 6*6 = 36 by computation", () => {
      const str = `${arithPreamble}
(claim 6sq (= Nat (* 6 6) 36))
(define-tactically 6sq
  ((exact (same 36))))
`;
      expect(() => evaluatePie(str)).not.toThrow();
    });

  });

  describe("Alternative Proof Strategies", () => {

    it("proves 0*n=0 using exact with the annotation directly", () => {
      const str = `${multPreamble}
(claim 0*n=0-alt (Pi ((n Nat)) (= Nat (* 0 n) 0)))
(define-tactically 0*n=0-alt
  ((intro n)
   (exact (the (= Nat 0 0) (same 0)))))
`;
      expect(() => evaluatePie(str)).not.toThrow();
    });

    it("proves n*0=0 using exact with ind-Nat expression directly", () => {
      const str = `${multPreamble}
(claim n*0=0-alt (Pi ((n Nat)) (= Nat (* n 0) 0)))
(define-tactically n*0=0-alt
  ((intro n)
   (exact (ind-Nat n
     (lambda (k) (= Nat (* k 0) 0))
     (same 0)
     (lambda (n-1 ih) ih)))))
`;
      expect(() => evaluatePie(str)).not.toThrow();
    });

    it("proves 1*n=n using exact with ind-Nat for n+0=n directly", () => {
      const str = `${multPreamble}
(claim 1*n=n-alt (Pi ((n Nat)) (= Nat (* 1 n) n)))
(define-tactically 1*n=n-alt
  ((intro n)
   (exact (ind-Nat n
     (lambda (k) (= Nat (+ k 0) k))
     (same 0)
     (lambda (n-1 ih) (cong ih (+ 1)))))))
`;
      expect(() => evaluatePie(str)).not.toThrow();
    });

  });

  describe("*-add1 Concrete Verifications", () => {

    it("verifies *-add1 at n=3, m=2: 3*(add1 2) = 3 + 3*2", () => {
      const str = `${arithPreamble}
(claim add1-check (= Nat (* 3 3) (+ 3 (* 3 2))))
(define-tactically add1-check
  ((exact (same 9))))
`;
      expect(() => evaluatePie(str)).not.toThrow();
    });

    it("verifies *-add1 at n=4, m=0: 4*(add1 0) = 4 + 4*0", () => {
      const str = `${arithPreamble}
(claim add1-check-2 (= Nat (* 4 1) (+ 4 (* 4 0))))
(define-tactically add1-check-2
  ((exact (same 4))))
`;
      expect(() => evaluatePie(str)).not.toThrow();
    });

    it("verifies *-add1 at n=5, m=1: 5*(add1 1) = 5 + 5*1", () => {
      const str = `${arithPreamble}
(claim add1-check-3 (= Nat (* 5 2) (+ 5 (* 5 1))))
(define-tactically add1-check-3
  ((exact (same 10))))
`;
      expect(() => evaluatePie(str)).not.toThrow();
    });

  });

  describe("Error Cases: Wrong Multiplication Claims", () => {

    it("rejects 2*3 = 7 (wrong result)", () => {
      const str = `${arithPreamble}
(claim bad-mult (= Nat (* 2 3) 7))
(define-tactically bad-mult
  ((exact (same 7))))
`;
      expect(() => evaluatePie(str)).toThrow();
    });

    it("rejects 4*4 = 15 (wrong result)", () => {
      const str = `${arithPreamble}
(claim bad-mult-2 (= Nat (* 4 4) 15))
(define-tactically bad-mult-2
  ((exact (same 15))))
`;
      expect(() => evaluatePie(str)).toThrow();
    });

    it("rejects claiming 3*3 = 3+3 (9 != 6)", () => {
      const str = `${arithPreamble}
(claim bad-eq (= Nat (* 3 3) (+ 3 3)))
(define-tactically bad-eq
  ((exact (same 9))))
`;
      expect(() => evaluatePie(str)).toThrow();
    });

    it("rejects claiming 2*2 = 5 (4 != 5)", () => {
      const str = `${arithPreamble}
(claim bad-sq (= Nat (* 2 2) 5))
(define-tactically bad-sq
  ((exact (same 5))))
`;
      expect(() => evaluatePie(str)).toThrow();
    });

    it("rejects claiming 7*0 = 1 (0 != 1)", () => {
      const str = `${arithPreamble}
(claim bad-zero (= Nat (* 7 0) 1))
(define-tactically bad-zero
  ((exact (same 1))))
`;
      expect(() => evaluatePie(str)).toThrow();
    });

  });

});
