import 'jest';
import { evaluatePie } from '../../main';

const arithPreamble = `
(claim + (→ Nat Nat Nat))
(define + (λ (n j) (iter-Nat n j (λ (x) (add1 x)))))

(claim * (→ Nat Nat Nat))
(define * (λ (n m) (iter-Nat n 0 (+ m))))
`;

describe("Simple Induction on Nat", () => {

  describe("Reflexivity and Identity", () => {

    it("proves 0=0 by same", () => {
      const str = `${arithPreamble}
(claim 0=0 (= Nat 0 0))
(define-tactically 0=0
  ((exact (same 0))))
0=0
`;
      const output = evaluatePie(str);
      expect(output).toContain("(same 0)");
    });

    it("proves 1=1 by same", () => {
      const str = `${arithPreamble}
(claim 1=1 (= Nat 1 1))
(define-tactically 1=1
  ((exact (same 1))))
1=1
`;
      const output = evaluatePie(str);
      expect(output).toContain("(same 1)");
    });

    it("proves 2=2 by same", () => {
      const str = `${arithPreamble}
(claim 2=2 (= Nat 2 2))
(define-tactically 2=2
  ((exact (same 2))))
2=2
`;
      const output = evaluatePie(str);
      expect(output).toContain("(same 2)");
    });

    it("proves 5=5 by same", () => {
      const str = `${arithPreamble}
(claim 5=5 (= Nat 5 5))
(define-tactically 5=5
  ((exact (same 5))))
5=5
`;
      const output = evaluatePie(str);
      expect(output).toContain("(same 5)");
    });

    it("proves n=n for all n by induction", () => {
      const str = `${arithPreamble}
(claim n=n (Π ((n Nat)) (= Nat n n)))
(define-tactically n=n
  ((intro n)
   (elim-Nat n)
   (then
     (exact (same 0)))
   (then
     (intro n-1)
     (intro ih)
     (exact (same (add1 n-1))))))
`;
      expect(() => evaluatePie(str)).not.toThrow();
    });

    it("proves 0+0=0 directly", () => {
      const str = `${arithPreamble}
(claim 0+0=0 (= Nat (+ 0 0) 0))
(define-tactically 0+0=0
  ((exact (same 0))))
`;
      expect(() => evaluatePie(str)).not.toThrow();
    });

    it("proves 1+1=2 directly", () => {
      const str = `${arithPreamble}
(claim 1+1=2 (= Nat (+ 1 1) 2))
(define-tactically 1+1=2
  ((exact (same 2))))
`;
      expect(() => evaluatePie(str)).not.toThrow();
    });

    it("proves 2+3=5 directly", () => {
      const str = `${arithPreamble}
(claim 2+3=5 (= Nat (+ 2 3) 5))
(define-tactically 2+3=5
  ((exact (same 5))))
`;
      expect(() => evaluatePie(str)).not.toThrow();
    });

    it("proves 3+4=7 directly", () => {
      const str = `${arithPreamble}
(claim 3+4=7 (= Nat (+ 3 4) 7))
(define-tactically 3+4=7
  ((exact (same 7))))
`;
      expect(() => evaluatePie(str)).not.toThrow();
    });

    it("proves 10=10 by same", () => {
      const str = `${arithPreamble}
(claim 10=10 (= Nat 10 10))
(define-tactically 10=10
  ((exact (same 10))))
`;
      expect(() => evaluatePie(str)).not.toThrow();
    });

  });

  describe("Addition with Zero", () => {

    it("proves 0+n=n without induction since + reduces on first arg", () => {
      const str = `${arithPreamble}
(claim 0+n=n (Π ((n Nat)) (= Nat (+ 0 n) n)))
(define-tactically 0+n=n
  ((intro n)
   (exact (same n))))
`;
      expect(() => evaluatePie(str)).not.toThrow();
    });

    it("proves n+0=n by induction on n", () => {
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
     (cong ih (+ 1)))))
`;
      expect(() => evaluatePie(str)).not.toThrow();
    });

    it("verifies n+0=n produces correct output for evaluation", () => {
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
     (cong ih (+ 1)))))
(n+0=n 3)
`;
      const output = evaluatePie(str);
      expect(output).toContain("(same 3)");
    });

    it("verifies n+0=n at n=0 returns (same 0)", () => {
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
     (cong ih (+ 1)))))
(n+0=n 0)
`;
      const output = evaluatePie(str);
      expect(output).toContain("(same 0)");
    });

    it("verifies n+0=n at n=1 returns (same 1)", () => {
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
     (cong ih (+ 1)))))
(n+0=n 1)
`;
      const output = evaluatePie(str);
      expect(output).toContain("(same 1)");
    });

    it("verifies n+0=n at n=5 returns (same 5)", () => {
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
     (cong ih (+ 1)))))
(n+0=n 5)
`;
      const output = evaluatePie(str);
      expect(output).toContain("(same 5)");
    });

    it("proves 0+0=0+0 trivially", () => {
      const str = `${arithPreamble}
(claim trivial-add (= Nat (+ 0 0) (+ 0 0)))
(define-tactically trivial-add
  ((exact (same 0))))
`;
      expect(() => evaluatePie(str)).not.toThrow();
    });

    it("proves 0 is left identity for concrete 7", () => {
      const str = `${arithPreamble}
(claim left-id-7 (= Nat (+ 0 7) 7))
(define-tactically left-id-7
  ((exact (same 7))))
`;
      expect(() => evaluatePie(str)).not.toThrow();
    });

    it("proves 0 is left identity for concrete 10", () => {
      const str = `${arithPreamble}
(claim left-id-10 (= Nat (+ 0 10) 10))
(define-tactically left-id-10
  ((exact (same 10))))
`;
      expect(() => evaluatePie(str)).not.toThrow();
    });

    it("proves 0+n=n and applies it to 4", () => {
      const str = `${arithPreamble}
(claim 0+n=n (Π ((n Nat)) (= Nat (+ 0 n) n)))
(define-tactically 0+n=n
  ((intro n)
   (exact (same n))))
(0+n=n 4)
`;
      const output = evaluatePie(str);
      expect(output).toContain("(same 4)");
    });

  });

  describe("Successor Properties", () => {

    it("proves 1+n = add1(n) without induction", () => {
      const str = `${arithPreamble}
(claim 1+n=add1-n (Π ((n Nat)) (= Nat (+ 1 n) (add1 n))))
(define-tactically 1+n=add1-n
  ((intro n)
   (exact (same (add1 n)))))
`;
      expect(() => evaluatePie(str)).not.toThrow();
    });

    it("proves add1(n) = add1(n) by same", () => {
      const str = `${arithPreamble}
(claim succ-refl (Π ((n Nat)) (= Nat (add1 n) (add1 n))))
(define-tactically succ-refl
  ((intro n)
   (exact (same (add1 n)))))
`;
      expect(() => evaluatePie(str)).not.toThrow();
    });

    it("proves add1(n+m) = add1(n)+m since + recurses on first arg", () => {
      const str = `${arithPreamble}
(claim add1-plus (Π ((n Nat) (m Nat)) (= Nat (add1 (+ n m)) (+ (add1 n) m))))
(define-tactically add1-plus
  ((intro n)
   (intro m)
   (exact (same (add1 (+ n m))))))
`;
      expect(() => evaluatePie(str)).not.toThrow();
    });

    it("proves n+1 = add1(n) by induction on n", () => {
      const str = `${arithPreamble}
(claim n+1=add1-n (Π ((n Nat)) (= Nat (+ n 1) (add1 n))))
(define-tactically n+1=add1-n
  ((intro n)
   (elim-Nat n)
   (then
     (exact (same 1)))
   (then
     (intro n-1)
     (intro ih)
     (cong ih (+ 1)))))
`;
      expect(() => evaluatePie(str)).not.toThrow();
    });

    it("verifies n+1=add1(n) at n=0", () => {
      const str = `${arithPreamble}
(claim n+1=add1-n (Π ((n Nat)) (= Nat (+ n 1) (add1 n))))
(define-tactically n+1=add1-n
  ((intro n)
   (elim-Nat n)
   (then
     (exact (same 1)))
   (then
     (intro n-1)
     (intro ih)
     (cong ih (+ 1)))))
(n+1=add1-n 0)
`;
      const output = evaluatePie(str);
      expect(output).toContain("(same 1)");
    });

    it("verifies n+1=add1(n) at n=4", () => {
      const str = `${arithPreamble}
(claim n+1=add1-n (Π ((n Nat)) (= Nat (+ n 1) (add1 n))))
(define-tactically n+1=add1-n
  ((intro n)
   (elim-Nat n)
   (then
     (exact (same 1)))
   (then
     (intro n-1)
     (intro ih)
     (cong ih (+ 1)))))
(n+1=add1-n 4)
`;
      const output = evaluatePie(str);
      expect(output).toContain("(same 5)");
    });

    it("proves 2+n = add1(add1(n))", () => {
      const str = `${arithPreamble}
(claim 2+n=add1-add1-n (Π ((n Nat)) (= Nat (+ 2 n) (add1 (add1 n)))))
(define-tactically 2+n=add1-add1-n
  ((intro n)
   (exact (same (add1 (add1 n))))))
`;
      expect(() => evaluatePie(str)).not.toThrow();
    });

    it("proves add1(0) = 1", () => {
      const str = `${arithPreamble}
(claim succ-zero (= Nat (add1 0) 1))
(define-tactically succ-zero
  ((exact (same 1))))
`;
      expect(() => evaluatePie(str)).not.toThrow();
    });

    it("proves add1(add1(0)) = 2", () => {
      const str = `${arithPreamble}
(claim succ-succ-zero (= Nat (add1 (add1 0)) 2))
(define-tactically succ-succ-zero
  ((exact (same 2))))
`;
      expect(() => evaluatePie(str)).not.toThrow();
    });

    it("proves n+2 = add1(add1(n)) by induction on n", () => {
      const str = `${arithPreamble}
(claim n+2=add1-add1-n (Π ((n Nat)) (= Nat (+ n 2) (add1 (add1 n)))))
(define-tactically n+2=add1-add1-n
  ((intro n)
   (elim-Nat n)
   (then
     (exact (same 2)))
   (then
     (intro n-1)
     (intro ih)
     (cong ih (+ 1)))))
`;
      expect(() => evaluatePie(str)).not.toThrow();
    });

  });

  describe("Commutativity of Addition", () => {

    it("proves right successor: n+(add1 m) = add1(n+m) by induction on n", () => {
      const str = `${arithPreamble}
(claim +add1 (Π ((n Nat) (m Nat)) (= Nat (+ n (add1 m)) (add1 (+ n m)))))
(define-tactically +add1
  ((intro n)
   (intro m)
   (elim-Nat n)
   (then
     (exact (same (add1 m))))
   (then
     (intro n-1)
     (intro ih)
     (cong ih (+ 1)))))
`;
      expect(() => evaluatePie(str)).not.toThrow();
    });

    it("verifies +add1 at n=0, m=3", () => {
      const str = `${arithPreamble}
(claim +add1 (Π ((n Nat) (m Nat)) (= Nat (+ n (add1 m)) (add1 (+ n m)))))
(define-tactically +add1
  ((intro n)
   (intro m)
   (elim-Nat n)
   (then
     (exact (same (add1 m))))
   (then
     (intro n-1)
     (intro ih)
     (cong ih (+ 1)))))
(+add1 0 3)
`;
      const output = evaluatePie(str);
      expect(output).toContain("(same 4)");
    });

    it("verifies +add1 at n=2, m=3", () => {
      const str = `${arithPreamble}
(claim +add1 (Π ((n Nat) (m Nat)) (= Nat (+ n (add1 m)) (add1 (+ n m)))))
(define-tactically +add1
  ((intro n)
   (intro m)
   (elim-Nat n)
   (then
     (exact (same (add1 m))))
   (then
     (intro n-1)
     (intro ih)
     (cong ih (+ 1)))))
(+add1 2 3)
`;
      const output = evaluatePie(str);
      expect(output).toContain("(same 6)");
    });

    it("proves commutativity n+m = m+n using helper lemmas", () => {
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
     (cong ih (+ 1)))))

(claim +add1 (Π ((n Nat) (m Nat)) (= Nat (+ n (add1 m)) (add1 (+ n m)))))
(define-tactically +add1
  ((intro n)
   (intro m)
   (elim-Nat n)
   (then
     (exact (same (add1 m))))
   (then
     (intro n-1)
     (intro ih)
     (cong ih (+ 1)))))

(claim +-comm (Π ((n Nat) (m Nat)) (= Nat (+ n m) (+ m n))))
(define-tactically +-comm
  ((intro n)
   (intro m)
   (elim-Nat n)
   (then
     (symm)
     (exact (n+0=n m)))
   (then
     (intro n-1)
     (intro ih)
     (trans (cong ih (+ 1)) (symm (+add1 m n-1))))))
`;
      expect(() => evaluatePie(str)).not.toThrow();
    });

    it("verifies commutativity at 2+3 = 3+2", () => {
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
     (cong ih (+ 1)))))

(claim +add1 (Π ((n Nat) (m Nat)) (= Nat (+ n (add1 m)) (add1 (+ n m)))))
(define-tactically +add1
  ((intro n)
   (intro m)
   (elim-Nat n)
   (then
     (exact (same (add1 m))))
   (then
     (intro n-1)
     (intro ih)
     (cong ih (+ 1)))))

(claim +-comm (Π ((n Nat) (m Nat)) (= Nat (+ n m) (+ m n))))
(define-tactically +-comm
  ((intro n)
   (intro m)
   (elim-Nat n)
   (then
     (symm)
     (exact (n+0=n m)))
   (then
     (intro n-1)
     (intro ih)
     (trans (cong ih (+ 1)) (symm (+add1 m n-1))))))
(+-comm 2 3)
`;
      const output = evaluatePie(str);
      expect(output).toContain("(same 5)");
    });

    it("verifies commutativity at 0+5 = 5+0", () => {
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
     (cong ih (+ 1)))))

(claim +add1 (Π ((n Nat) (m Nat)) (= Nat (+ n (add1 m)) (add1 (+ n m)))))
(define-tactically +add1
  ((intro n)
   (intro m)
   (elim-Nat n)
   (then
     (exact (same (add1 m))))
   (then
     (intro n-1)
     (intro ih)
     (cong ih (+ 1)))))

(claim +-comm (Π ((n Nat) (m Nat)) (= Nat (+ n m) (+ m n))))
(define-tactically +-comm
  ((intro n)
   (intro m)
   (elim-Nat n)
   (then
     (symm)
     (exact (n+0=n m)))
   (then
     (intro n-1)
     (intro ih)
     (trans (cong ih (+ 1)) (symm (+add1 m n-1))))))
(+-comm 0 5)
`;
      const output = evaluatePie(str);
      expect(output).toContain("(same 5)");
    });

    it("proves concrete 3+2=2+3 directly by computation", () => {
      const str = `${arithPreamble}
(claim concrete-comm (= Nat (+ 3 2) (+ 2 3)))
(define-tactically concrete-comm
  ((exact (same 5))))
`;
      expect(() => evaluatePie(str)).not.toThrow();
    });

    it("proves concrete 4+1=1+4 directly by computation", () => {
      const str = `${arithPreamble}
(claim concrete-comm2 (= Nat (+ 4 1) (+ 1 4)))
(define-tactically concrete-comm2
  ((exact (same 5))))
`;
      expect(() => evaluatePie(str)).not.toThrow();
    });

    it("proves concrete 0+n=n+0 at n=7 by computation", () => {
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
     (cong ih (+ 1)))))
(n+0=n 7)
`;
      const output = evaluatePie(str);
      expect(output).toContain("(same 7)");
    });

    it("proves +add1 at n=5, m=0", () => {
      const str = `${arithPreamble}
(claim +add1 (Π ((n Nat) (m Nat)) (= Nat (+ n (add1 m)) (add1 (+ n m)))))
(define-tactically +add1
  ((intro n)
   (intro m)
   (elim-Nat n)
   (then
     (exact (same (add1 m))))
   (then
     (intro n-1)
     (intro ih)
     (cong ih (+ 1)))))
(+add1 5 0)
`;
      const output = evaluatePie(str);
      expect(output).toContain("(same 6)");
    });

  });

  describe("Associativity of Addition", () => {

    it("proves associativity (a+b)+c = a+(b+c) by induction on a", () => {
      const str = `${arithPreamble}
(claim +-assoc (Π ((a Nat) (b Nat) (c Nat)) (= Nat (+ (+ a b) c) (+ a (+ b c)))))
(define-tactically +-assoc
  ((intro a)
   (intro b)
   (intro c)
   (elim-Nat a)
   (then
     (exact (same (+ b c))))
   (then
     (intro a-1)
     (intro ih)
     (cong ih (+ 1)))))
`;
      expect(() => evaluatePie(str)).not.toThrow();
    });

    it("verifies associativity at (1+2)+3 = 1+(2+3)", () => {
      const str = `${arithPreamble}
(claim +-assoc (Π ((a Nat) (b Nat) (c Nat)) (= Nat (+ (+ a b) c) (+ a (+ b c)))))
(define-tactically +-assoc
  ((intro a)
   (intro b)
   (intro c)
   (elim-Nat a)
   (then
     (exact (same (+ b c))))
   (then
     (intro a-1)
     (intro ih)
     (cong ih (+ 1)))))
(+-assoc 1 2 3)
`;
      const output = evaluatePie(str);
      expect(output).toContain("(same 6)");
    });

    it("verifies associativity at (0+3)+4 = 0+(3+4)", () => {
      const str = `${arithPreamble}
(claim +-assoc (Π ((a Nat) (b Nat) (c Nat)) (= Nat (+ (+ a b) c) (+ a (+ b c)))))
(define-tactically +-assoc
  ((intro a)
   (intro b)
   (intro c)
   (elim-Nat a)
   (then
     (exact (same (+ b c))))
   (then
     (intro a-1)
     (intro ih)
     (cong ih (+ 1)))))
(+-assoc 0 3 4)
`;
      const output = evaluatePie(str);
      expect(output).toContain("(same 7)");
    });

    it("verifies associativity at (2+2)+2 = 2+(2+2)", () => {
      const str = `${arithPreamble}
(claim +-assoc (Π ((a Nat) (b Nat) (c Nat)) (= Nat (+ (+ a b) c) (+ a (+ b c)))))
(define-tactically +-assoc
  ((intro a)
   (intro b)
   (intro c)
   (elim-Nat a)
   (then
     (exact (same (+ b c))))
   (then
     (intro a-1)
     (intro ih)
     (cong ih (+ 1)))))
(+-assoc 2 2 2)
`;
      const output = evaluatePie(str);
      expect(output).toContain("(same 6)");
    });

    it("proves concrete (2+3)+4 = 2+(3+4) by computation", () => {
      const str = `${arithPreamble}
(claim concrete-assoc (= Nat (+ (+ 2 3) 4) (+ 2 (+ 3 4))))
(define-tactically concrete-assoc
  ((exact (same 9))))
`;
      expect(() => evaluatePie(str)).not.toThrow();
    });

    it("proves concrete (0+0)+0 = 0+(0+0) by computation", () => {
      const str = `${arithPreamble}
(claim trivial-assoc (= Nat (+ (+ 0 0) 0) (+ 0 (+ 0 0))))
(define-tactically trivial-assoc
  ((exact (same 0))))
`;
      expect(() => evaluatePie(str)).not.toThrow();
    });

    it("verifies associativity at (3+0)+2 = 3+(0+2)", () => {
      const str = `${arithPreamble}
(claim +-assoc (Π ((a Nat) (b Nat) (c Nat)) (= Nat (+ (+ a b) c) (+ a (+ b c)))))
(define-tactically +-assoc
  ((intro a)
   (intro b)
   (intro c)
   (elim-Nat a)
   (then
     (exact (same (+ b c))))
   (then
     (intro a-1)
     (intro ih)
     (cong ih (+ 1)))))
(+-assoc 3 0 2)
`;
      const output = evaluatePie(str);
      expect(output).toContain("(same 5)");
    });

  });

  describe("Error Cases", () => {

    it("fails when then block is missing after elim-Nat", () => {
      const str = `${arithPreamble}
(claim bad-proof (Π ((n Nat)) (= Nat (+ n 0) n)))
(define-tactically bad-proof
  ((intro n)
   (elim-Nat n)
   (exact (same 0))
   (intro n-1)
   (intro ih)
   (exact (cong ih (+ 1)))))
`;
      expect(() => evaluatePie(str)).toThrow();
    });

    it("fails when only base case is provided for induction", () => {
      const str = `${arithPreamble}
(claim incomplete (Π ((n Nat)) (= Nat (+ n 0) n)))
(define-tactically incomplete
  ((intro n)
   (elim-Nat n)
   (then
     (exact (same 0)))))
`;
      expect(() => evaluatePie(str)).toThrow();
    });

    it("fails when elim-Nat is used on a non-Nat type", () => {
      const str = `${arithPreamble}
(claim bad-elim (Π ((x Atom)) Atom))
(define-tactically bad-elim
  ((intro x)
   (elim-Nat x)
   (then
     (exact 'base))
   (then
     (intro n-1)
     (intro ih)
     (exact 'step))))
`;
      expect(() => evaluatePie(str)).toThrow();
    });

  });

});
