import 'jest'
import { evaluatePie } from '../main';

describe("Pair (and) tests", () => {
    it("creates a simple Pair with cons", () => {
        const str = 
        `(claim test_and
  (Pair Nat Nat))

(define test_and
  (cons zero zero))`
        expect(() => evaluatePie(str)).not.toThrow();
        const result = evaluatePie(str);
        expect(result).toContain("test_and :");
        expect(result).toContain("Σ"); // Verify it's a Pair (Sigma) type
        expect(result).toContain("Nat");
    })

    it("creates a Pair with different values", () => {
        const str = 
        `(claim pair_test
  (Pair Nat Nat))

(define pair_test
  (cons zero (add1 zero)))`
        expect(() => evaluatePie(str)).not.toThrow();
        const result = evaluatePie(str);
        expect(result).toContain("pair_test :");
        expect(result).toContain("Σ"); // Verify it's a Pair (Sigma) type
        expect(result).toContain("pair_test = (cons 0 1)");
    })

    it("creates a Pair of different types", () => {
        const str = 
        `(claim mixed_pair
  (Pair Nat Atom))

(define mixed_pair
  (cons zero 'hello))`
        expect(() => evaluatePie(str)).not.toThrow();
        const result = evaluatePie(str);
        expect(result).toContain("mixed_pair :");
        expect(result).toContain("Σ"); // Verify it's a Pair (Sigma) type
        expect(result).toContain("Atom");
    })

    it("uses car to extract first element", () => {
        const str = 
        `(claim my_pair
  (Pair Nat Nat))

(define my_pair
  (cons (add1 zero) (add1 (add1 zero))))

(car my_pair)`
        expect(() => evaluatePie(str)).not.toThrow();
        const result = evaluatePie(str);
        expect(result).toContain("1:");
        expect(result).toContain("Nat");
    })

    it("uses cdr to extract second element", () => {
        const str = 
        `(claim my_pair
  (Pair Nat Nat))

(define my_pair
  (cons (add1 zero) (add1 (add1 zero))))

(cdr my_pair)`
        expect(() => evaluatePie(str)).not.toThrow();
        const result = evaluatePie(str);
        expect(result).toContain("2:");
        expect(result).toContain("Nat");
    })

    it("creates nested Pairs", () => {
        const str = 
        `(claim nested
  (Pair (Pair Nat Nat) Atom))

(define nested
  (cons (cons zero (add1 zero)) 'test))`
        expect(() => evaluatePie(str)).not.toThrow();
        const result = evaluatePie(str);
        expect(result).toContain("nested :");
        expect(result).toContain("Σ"); // Verify it's a Pair (Sigma) type
        expect(result).toContain("nested = (cons (cons 0 1) 'test)");
    })

    describe("tactic-based definitions", () => {
        it("creates Pair using exists tactic", () => {
            const str = 
            `(claim test_and
  (Pair Nat Nat))

(define-tactically test_and
     ((exists zero n)
      (exact zero)))`
            expect(() => evaluatePie(str)).not.toThrow();
            const result = evaluatePie(str);
            expect(result).toContain("test_and :");
            expect(result).toContain("test_and = (cons 0 0)");
        })

        it("creates Pair using split-Pair tactic", () => {
            const str = 
            `(claim test_and
  (Pair Nat Nat))

(define-tactically test_and
     ((split-Pair)
      (then (exact zero))
      (then (exact zero))))`
            expect(() => evaluatePie(str)).not.toThrow();
            const result = evaluatePie(str);
            expect(result).toContain("test_and :");
            expect(result).toContain("Σ"); // Verify it's a Pair (Sigma) type
            expect(result).toContain("test_and = (cons 0 0)");
        })

        it("creates Pair with different values using split-Pair tactic", () => {
            const str = 
            `(claim pair_vals
  (Pair Nat Nat))

(define-tactically pair_vals
     ((split-Pair)
      (then (exact (add1 zero)))
      (then (exact (add1 (add1 zero))))))`
            expect(() => evaluatePie(str)).not.toThrow();
            const result = evaluatePie(str);
            expect(result).toContain("pair_vals :");
            expect(result).toContain("Σ"); // Verify it's a Pair (Sigma) type
            expect(result).toContain("pair_vals = (cons 1 2)");
        })

        it("creates Pair of mixed types using split-Pair tactic", () => {
            const str = 
            `(claim mixed
  (Pair Nat Atom))

(define-tactically mixed
     ((split-Pair)
      (then (exact zero))
      (then (exact 'foo))))`
            expect(() => evaluatePie(str)).not.toThrow();
            const result = evaluatePie(str);
            expect(result).toContain("mixed :");
            expect(result).toContain("Σ"); // Verify it's a Pair (Sigma) type
            expect(result).toContain("mixed = (cons 0 'foo)");
        })
    })

    describe("error cases", () => {
        it("fails when types don't match", () => {
            const str = 
            `(claim bad_pair
  (Pair Nat Nat))

(define bad_pair
  (cons 'atom zero))`
            expect(() => evaluatePie(str)).toThrow();
        })

        it("fails when using car on non-Pair", () => {
            const str = 
            `(car zero)`
            expect(() => evaluatePie(str)).toThrow();
        })

        it("fails when using cdr on non-Pair", () => {
            const str = 
            `(cdr 'atom)`
            expect(() => evaluatePie(str)).toThrow();
        })
    })
}
)
