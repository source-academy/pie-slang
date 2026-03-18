import 'jest';
import { evaluatePie } from '../../main';

const arithPreamble = `
(claim + (→ Nat Nat Nat))
(define + (λ (n j) (iter-Nat n j (λ (x) (add1 x)))))
(claim * (→ Nat Nat Nat))
(define * (λ (n m) (iter-Nat n 0 (+ m))))
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

(claim n*0=0 (Π ((n Nat)) (= Nat (* n 0) 0)))
(define n*0=0 (λ (n) (ind-Nat n (λ (k) (= Nat (* k 0) 0)) (same 0) (λ (n-1 ih) ih))))

(claim n*1=n (Π ((n Nat)) (= Nat (* n 1) n)))
(define n*1=n (λ (n) (ind-Nat n (λ (k) (= Nat (* k 1) k)) (same 0) (λ (n-1 ih) (cong ih (+ 1))))))

(claim 1*n=n (Π ((n Nat)) (= Nat (* 1 n) n)))
(define 1*n=n (λ (n) (n+0=n n)))
`;

const sumPreamble = `${arithLemmas}
(claim tri (→ Nat Nat))
(define tri (λ (n) (rec-Nat n 0 (λ (n-1 acc) (+ (add1 n-1) acc)))))

(claim pow (→ Nat Nat Nat))
(define pow (λ (base exp) (iter-Nat exp 1 (* base))))

(claim sum-odd (→ Nat Nat))
(define sum-odd (λ (n) (rec-Nat n 0 (λ (n-1 acc) (+ acc (add1 (+ n-1 n-1)))))))

(claim fact (→ Nat Nat))
(define fact (λ (n) (rec-Nat n 1 (λ (n-1 acc) (* (add1 n-1) acc)))))

(claim double (→ Nat Nat))
(define double (λ (n) (+ n n)))
`;

describe("Summation Formulas and Power Laws — Complex Tactic Proofs", () => {

  // ===== Part 1: Triangular Numbers Concrete Verifications =====

  it("1. tri(0) = 0", () => {
    const str = `${sumPreamble}
(claim tri-0 (= Nat (tri 0) 0))
(define-tactically tri-0
  ((exact (same 0))))
tri-0
`;
    const output = evaluatePie(str);
    expect(output).toContain("(same 0)");
  });

  it("2. tri(1) = 1", () => {
    const str = `${sumPreamble}
(claim tri-1 (= Nat (tri 1) 1))
(define-tactically tri-1
  ((exact (same 1))))
tri-1
`;
    const output = evaluatePie(str);
    expect(output).toContain("(same 1)");
  });

  it("3. tri(2) = 3", () => {
    const str = `${sumPreamble}
(claim tri-2 (= Nat (tri 2) 3))
(define-tactically tri-2
  ((exact (same 3))))
tri-2
`;
    const output = evaluatePie(str);
    expect(output).toContain("(same 3)");
  });

  it("4. tri(3) = 6", () => {
    const str = `${sumPreamble}
(claim tri-3 (= Nat (tri 3) 6))
(define-tactically tri-3
  ((exact (same 6))))
tri-3
`;
    const output = evaluatePie(str);
    expect(output).toContain("(same 6)");
  });

  it("5. tri(4) = 10", () => {
    const str = `${sumPreamble}
(claim tri-4 (= Nat (tri 4) 10))
(define-tactically tri-4
  ((exact (same 10))))
tri-4
`;
    const output = evaluatePie(str);
    expect(output).toContain("(same 10)");
  });

  it("6. tri(5) = 15", () => {
    const str = `${sumPreamble}
(claim tri-5 (= Nat (tri 5) 15))
(define-tactically tri-5
  ((exact (same 15))))
tri-5
`;
    const output = evaluatePie(str);
    expect(output).toContain("(same 15)");
  });

  // ===== Part 2: Power Function Concrete Verifications =====

  it("7. pow(2,0) = 1", () => {
    const str = `${sumPreamble}
(claim pow-2-0 (= Nat (pow 2 0) 1))
(define-tactically pow-2-0
  ((exact (same 1))))
pow-2-0
`;
    const output = evaluatePie(str);
    expect(output).toContain("(same 1)");
  });

  it("8. pow(2,1) = 2", () => {
    const str = `${sumPreamble}
(claim pow-2-1 (= Nat (pow 2 1) 2))
(define-tactically pow-2-1
  ((exact (same 2))))
pow-2-1
`;
    const output = evaluatePie(str);
    expect(output).toContain("(same 2)");
  });

  it("9. pow(2,2) = 4", () => {
    const str = `${sumPreamble}
(claim pow-2-2 (= Nat (pow 2 2) 4))
(define-tactically pow-2-2
  ((exact (same 4))))
pow-2-2
`;
    const output = evaluatePie(str);
    expect(output).toContain("(same 4)");
  });

  it("10. pow(2,3) = 8", () => {
    const str = `${sumPreamble}
(claim pow-2-3 (= Nat (pow 2 3) 8))
(define-tactically pow-2-3
  ((exact (same 8))))
pow-2-3
`;
    const output = evaluatePie(str);
    expect(output).toContain("(same 8)");
  });

  it("11. pow(2,4) = 16", () => {
    const str = `${sumPreamble}
(claim pow-2-4 (= Nat (pow 2 4) 16))
(define-tactically pow-2-4
  ((exact (same 16))))
pow-2-4
`;
    const output = evaluatePie(str);
    expect(output).toContain("(same 16)");
  });

  it("12. pow(3,0) = 1", () => {
    const str = `${sumPreamble}
(claim pow-3-0 (= Nat (pow 3 0) 1))
(define-tactically pow-3-0
  ((exact (same 1))))
pow-3-0
`;
    const output = evaluatePie(str);
    expect(output).toContain("(same 1)");
  });

  it("13. pow(3,1) = 3", () => {
    const str = `${sumPreamble}
(claim pow-3-1 (= Nat (pow 3 1) 3))
(define-tactically pow-3-1
  ((exact (same 3))))
pow-3-1
`;
    const output = evaluatePie(str);
    expect(output).toContain("(same 3)");
  });

  it("14. pow(3,2) = 9", () => {
    const str = `${sumPreamble}
(claim pow-3-2 (= Nat (pow 3 2) 9))
(define-tactically pow-3-2
  ((exact (same 9))))
pow-3-2
`;
    const output = evaluatePie(str);
    expect(output).toContain("(same 9)");
  });

  it("15. pow(3,3) = 27", () => {
    const str = `${sumPreamble}
(claim pow-3-3 (= Nat (pow 3 3) 27))
(define-tactically pow-3-3
  ((exact (same 27))))
pow-3-3
`;
    const output = evaluatePie(str);
    expect(output).toContain("(same 27)");
  });

  // ===== Part 3: Power Laws =====

  it("16. n^0 = 1 for all n", () => {
    const str = `${sumPreamble}
(claim pow-n-0 (Π ((n Nat)) (= Nat (pow n 0) 1)))
(define-tactically pow-n-0
  ((intro n)
   (exact (same 1))))
pow-n-0
`;
    const output = evaluatePie(str);
    expect(output).toContain("pow-n-0");
  });

  it("17. n^1 = n for all n (using n*1=n)", () => {
    const str = `${sumPreamble}
(claim pow-n-1 (Π ((n Nat)) (= Nat (pow n 1) n)))
(define-tactically pow-n-1
  ((intro n)
   (exact (n*1=n n))))
pow-n-1
`;
    const output = evaluatePie(str);
    expect(output).toContain("pow-n-1");
  });

  it("18. 1^n = 1 for all n", () => {
    const str = `${sumPreamble}
(claim pow-1-n (Π ((n Nat)) (= Nat (pow 1 n) 1)))
(define pow-1-n (λ (n) (ind-Nat n (λ (k) (= Nat (pow 1 k) 1)) (same 1) (λ (n-1 ih) (trans (n+0=n (pow 1 n-1)) ih)))))
pow-1-n
`;
    const output = evaluatePie(str);
    expect(output).toContain("pow-1-n");
  });

  it("19. 0^(add1 n) = 0 for all n", () => {
    const str = `${sumPreamble}
(claim pow-0-succ (Π ((n Nat)) (= Nat (pow 0 (add1 n)) 0)))
(define-tactically pow-0-succ
  ((intro n)
   (exact (same 0))))
pow-0-succ
`;
    const output = evaluatePie(str);
    expect(output).toContain("pow-0-succ");
  });

  // ===== Part 4: Sum of First n Odd Numbers = n^2 =====

  it("20. sum-odd(0) = 0 = pow(0,2)", () => {
    const str = `${sumPreamble}
(claim sum-odd-0 (= Nat (sum-odd 0) (pow 0 2)))
(define-tactically sum-odd-0
  ((exact (same 0))))
sum-odd-0
`;
    const output = evaluatePie(str);
    expect(output).toContain("(same 0)");
  });

  it("21. sum-odd(1) = 1 = pow(1,2)", () => {
    const str = `${sumPreamble}
(claim sum-odd-1 (= Nat (sum-odd 1) (pow 1 2)))
(define-tactically sum-odd-1
  ((exact (same 1))))
sum-odd-1
`;
    const output = evaluatePie(str);
    expect(output).toContain("(same 1)");
  });

  it("22. sum-odd(2) = 4 = pow(2,2)", () => {
    const str = `${sumPreamble}
(claim sum-odd-2 (= Nat (sum-odd 2) (pow 2 2)))
(define-tactically sum-odd-2
  ((exact (same 4))))
sum-odd-2
`;
    const output = evaluatePie(str);
    expect(output).toContain("(same 4)");
  });

  it("23. sum-odd(3) = 9 = pow(3,2)", () => {
    const str = `${sumPreamble}
(claim sum-odd-3 (= Nat (sum-odd 3) (pow 3 2)))
(define-tactically sum-odd-3
  ((exact (same 9))))
sum-odd-3
`;
    const output = evaluatePie(str);
    expect(output).toContain("(same 9)");
  });

  it("24. sum-odd(4) = 16 = pow(4,2)", () => {
    const str = `${sumPreamble}
(claim sum-odd-4 (= Nat (sum-odd 4) (pow 4 2)))
(define-tactically sum-odd-4
  ((exact (same 16))))
sum-odd-4
`;
    const output = evaluatePie(str);
    expect(output).toContain("(same 16)");
  });

  it("25. sum-odd(5) = 25 = pow(5,2)", () => {
    const str = `${sumPreamble}
(claim sum-odd-5 (= Nat (sum-odd 5) (pow 5 2)))
(define-tactically sum-odd-5
  ((exact (same 25))))
sum-odd-5
`;
    const output = evaluatePie(str);
    expect(output).toContain("(same 25)");
  });

  // ===== Part 5: Factorial Computations =====

  it("26. fact(0) = 1", () => {
    const str = `${sumPreamble}
(claim fact-0 (= Nat (fact 0) 1))
(define-tactically fact-0
  ((exact (same 1))))
fact-0
`;
    const output = evaluatePie(str);
    expect(output).toContain("(same 1)");
  });

  it("27. fact(1) = 1", () => {
    const str = `${sumPreamble}
(claim fact-1 (= Nat (fact 1) 1))
(define-tactically fact-1
  ((exact (same 1))))
fact-1
`;
    const output = evaluatePie(str);
    expect(output).toContain("(same 1)");
  });

  it("28. fact(2) = 2", () => {
    const str = `${sumPreamble}
(claim fact-2 (= Nat (fact 2) 2))
(define-tactically fact-2
  ((exact (same 2))))
fact-2
`;
    const output = evaluatePie(str);
    expect(output).toContain("(same 2)");
  });

  it("29. fact(3) = 6", () => {
    const str = `${sumPreamble}
(claim fact-3 (= Nat (fact 3) 6))
(define-tactically fact-3
  ((exact (same 6))))
fact-3
`;
    const output = evaluatePie(str);
    expect(output).toContain("(same 6)");
  });

  it("30. fact(4) = 24", () => {
    const str = `${sumPreamble}
(claim fact-4 (= Nat (fact 4) 24))
(define-tactically fact-4
  ((exact (same 24))))
fact-4
`;
    const output = evaluatePie(str);
    expect(output).toContain("(same 24)");
  });

  it("31. fact(5) = 120", () => {
    const str = `${sumPreamble}
(claim fact-5 (= Nat (fact 5) 120))
(define-tactically fact-5
  ((exact (same 120))))
fact-5
`;
    const output = evaluatePie(str);
    expect(output).toContain("(same 120)");
  });

  // ===== Part 6: Double Function Properties =====

  it("32. double(0) = 0", () => {
    const str = `${sumPreamble}
(claim double-0 (= Nat (double 0) 0))
(define-tactically double-0
  ((exact (same 0))))
double-0
`;
    const output = evaluatePie(str);
    expect(output).toContain("(same 0)");
  });

  it("33. double(1) = 2", () => {
    const str = `${sumPreamble}
(claim double-1 (= Nat (double 1) 2))
(define-tactically double-1
  ((exact (same 2))))
double-1
`;
    const output = evaluatePie(str);
    expect(output).toContain("(same 2)");
  });

  it("34. double(2) = 4", () => {
    const str = `${sumPreamble}
(claim double-2 (= Nat (double 2) 4))
(define-tactically double-2
  ((exact (same 4))))
double-2
`;
    const output = evaluatePie(str);
    expect(output).toContain("(same 4)");
  });

  it("35. double(3) = 6", () => {
    const str = `${sumPreamble}
(claim double-3 (= Nat (double 3) 6))
(define-tactically double-3
  ((exact (same 6))))
double-3
`;
    const output = evaluatePie(str);
    expect(output).toContain("(same 6)");
  });

  it("36. double n is even: exists k such that double n = k + k", () => {
    const str = `${sumPreamble}
(claim double-is-even (Π ((n Nat)) (Σ ((k Nat)) (= Nat (double n) (+ k k)))))
(define-tactically double-is-even
  ((intro n)
   (exists n k)
   (exact (same (double n)))))
double-is-even
`;
    const output = evaluatePie(str);
    expect(output).toContain("double-is-even");
  });

  it("37. double(add1 n) = add1(add1(double n))", () => {
    const str = `${sumPreamble}
(claim double-add1 (Π ((n Nat)) (= Nat (double (add1 n)) (add1 (add1 (double n))))))
(define double-add1 (λ (n) (cong (+add1 n n) (+ 1))))
double-add1
`;
    const output = evaluatePie(str);
    expect(output).toContain("double-add1");
  });

  // ===== Part 7: Gauss Formula Verifications (2*tri(n) = n*(n+1)) =====

  it("38. 2*tri(0) = 0*(0+1) = 0", () => {
    const str = `${sumPreamble}
(claim gauss-0 (= Nat (* 2 (tri 0)) (* 0 (+ 0 1))))
(define-tactically gauss-0
  ((exact (same 0))))
gauss-0
`;
    const output = evaluatePie(str);
    expect(output).toContain("(same 0)");
  });

  it("39. 2*tri(1) = 1*(1+1) = 2", () => {
    const str = `${sumPreamble}
(claim gauss-1 (= Nat (* 2 (tri 1)) (* 1 (+ 1 1))))
(define-tactically gauss-1
  ((exact (same 2))))
gauss-1
`;
    const output = evaluatePie(str);
    expect(output).toContain("(same 2)");
  });

  it("40. 2*tri(2) = 2*(2+1) = 6", () => {
    const str = `${sumPreamble}
(claim gauss-2 (= Nat (* 2 (tri 2)) (* 2 (+ 2 1))))
(define-tactically gauss-2
  ((exact (same 6))))
gauss-2
`;
    const output = evaluatePie(str);
    expect(output).toContain("(same 6)");
  });

  it("41. 2*tri(3) = 3*(3+1) = 12", () => {
    const str = `${sumPreamble}
(claim gauss-3 (= Nat (* 2 (tri 3)) (* 3 (+ 3 1))))
(define-tactically gauss-3
  ((exact (same 12))))
gauss-3
`;
    const output = evaluatePie(str);
    expect(output).toContain("(same 12)");
  });

  it("42. 2*tri(4) = 4*(4+1) = 20", () => {
    const str = `${sumPreamble}
(claim gauss-4 (= Nat (* 2 (tri 4)) (* 4 (+ 4 1))))
(define-tactically gauss-4
  ((exact (same 20))))
gauss-4
`;
    const output = evaluatePie(str);
    expect(output).toContain("(same 20)");
  });

  // ===== Part 8: Mixed Cross-Verifications =====

  it("43. pow(2,3) + pow(2,3) = pow(2,4)", () => {
    const str = `${sumPreamble}
(claim pow-double (= Nat (+ (pow 2 3) (pow 2 3)) (pow 2 4)))
(define-tactically pow-double
  ((exact (same 16))))
pow-double
`;
    const output = evaluatePie(str);
    expect(output).toContain("(same 16)");
  });

  it("44. fact(3) = tri(3)", () => {
    const str = `${sumPreamble}
(claim fact3-eq-tri3 (= Nat (fact 3) (tri 3)))
(define-tactically fact3-eq-tri3
  ((exact (same 6))))
fact3-eq-tri3
`;
    const output = evaluatePie(str);
    expect(output).toContain("(same 6)");
  });

  it("45. sum-odd(3) = pow(3,2)", () => {
    const str = `${sumPreamble}
(claim sum-odd-3-eq-pow (= Nat (sum-odd 3) (pow 3 2)))
(define-tactically sum-odd-3-eq-pow
  ((exact (same 9))))
sum-odd-3-eq-pow
`;
    const output = evaluatePie(str);
    expect(output).toContain("(same 9)");
  });

  it("46. tri(3) * 2 = 3 * (3 + 1)", () => {
    const str = `${sumPreamble}
(claim gauss-3-alt (= Nat (* (tri 3) 2) (* 3 (+ 3 1))))
(define-tactically gauss-3-alt
  ((exact (same 12))))
gauss-3-alt
`;
    const output = evaluatePie(str);
    expect(output).toContain("(same 12)");
  });

  // ===== Part 9: Error and Edge Cases =====

  it("47. wrong power claim: pow(2,3) = 7 should fail", () => {
    const str = `${sumPreamble}
(claim wrong-pow (= Nat (pow 2 3) 7))
(define-tactically wrong-pow
  ((exact (same 7))))
wrong-pow
`;
    expect(() => evaluatePie(str)).toThrow();
  });

  it("48. wrong factorial claim: fact(4) = 25 should fail", () => {
    const str = `${sumPreamble}
(claim wrong-fact (= Nat (fact 4) 25))
(define-tactically wrong-fact
  ((exact (same 25))))
wrong-fact
`;
    expect(() => evaluatePie(str)).toThrow();
  });

  it("49. wrong sum-odd claim: sum-odd(3) = 8 should fail", () => {
    const str = `${sumPreamble}
(claim wrong-sum-odd (= Nat (sum-odd 3) 8))
(define-tactically wrong-sum-odd
  ((exact (same 8))))
wrong-sum-odd
`;
    expect(() => evaluatePie(str)).toThrow();
  });

  it("50. wrong tri claim: tri(4) = 11 should fail", () => {
    const str = `${sumPreamble}
(claim wrong-tri (= Nat (tri 4) 11))
(define-tactically wrong-tri
  ((exact (same 11))))
wrong-tri
`;
    expect(() => evaluatePie(str)).toThrow();
  });

});
