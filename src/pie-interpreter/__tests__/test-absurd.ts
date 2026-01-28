import 'jest'
import { evaluatePie } from '../main';

describe("Absurd (empty type)", () => {
  describe("basic elimination principle", () => {
    it("defines ind-Absurd eliminator manually", () => {
      const str =
        `(claim test_absurd
  (Pi ((x Absurd) (B U))
    B))

(define test_absurd
  (lambda (x B)
    (ind-Absurd x B)))`
      expect(() => evaluatePie(str)).not.toThrow();
      const result = evaluatePie(str);
      expect(result).toContain("test_absurd :");
      expect(result).toContain("Absurd");
    })

    it("eliminates Absurd to prove Nat", () => {
      const str =
        `(claim absurd-to-nat
  (-> Absurd Nat))

(define absurd-to-nat
  (lambda (x)
    (ind-Absurd x Nat)))`
      expect(() => evaluatePie(str)).not.toThrow();
      const result = evaluatePie(str);
      expect(result).toContain("absurd-to-nat :");
      expect(result).toContain("Absurd");
      expect(result).toContain("Nat");
    })

    it("eliminates Absurd to prove Atom", () => {
      const str =
        `(claim absurd-to-atom
  (-> Absurd Atom))

(define absurd-to-atom
  (lambda (x)
    (ind-Absurd x Atom)))`
      expect(() => evaluatePie(str)).not.toThrow();
      const result = evaluatePie(str);
      expect(result).toContain("absurd-to-atom");
    })

    it("eliminates Absurd to prove any type", () => {
      const str =
        `(claim absurd-elim
  (Pi ((A U))
    (-> Absurd A)))

(define absurd-elim
  (lambda (A x)
    (ind-Absurd x A)))`
      expect(() => evaluatePie(str)).not.toThrow();
      const result = evaluatePie(str);
      expect(result).toContain("absurd-elim");
      expect(result).toContain("Π"); // Pi type
    })
  })

  describe("tactic-based definitions", () => {
    it("uses elim-Absurd tactic", () => {
      const str =
        `(claim test_absurd
  (Pi ((x Absurd) (B U))
    B))

(define-tactically test_absurd
    ((intro x)
     (intro B)
     (elim-Absurd x)))`
      expect(() => evaluatePie(str)).not.toThrow();
      const result = evaluatePie(str);
      expect(result).toContain("test_absurd :");
      expect(result).toContain("Absurd");
    })

    it("proves Nat from Absurd using tactics", () => {
      const str =
        `(claim from-absurd
  (-> Absurd Nat))

(define-tactically from-absurd
    ((intro abs)
     (elim-Absurd abs)))`
      expect(() => evaluatePie(str)).not.toThrow();
      const result = evaluatePie(str);
      expect(result).toContain("from-absurd");
    })

    it("proves polymorphic eliminator using tactics", () => {
      const str =
        `(claim absurd-elim
  (Pi ((A U))
    (-> Absurd A)))

(define-tactically absurd-elim
  ((intro A)
   (intro prf)
   (elim-Absurd prf)))`
      expect(() => evaluatePie(str)).not.toThrow();
      const result = evaluatePie(str);
      expect(result).toContain("absurd-elim");
    })
  })

  describe("ex falso quodlibet (from falsehood, anything)", () => {
    it("proves anything from Absurd - Nat case", () => {
      const str =
        `(claim anything-from-false
  (-> Absurd Nat))

(define anything-from-false
  (lambda (impossible)
    (ind-Absurd impossible Nat)))`
      expect(() => evaluatePie(str)).not.toThrow();
      const result = evaluatePie(str);
      expect(result).toContain("anything-from-false");
    })

    it("proves a Pair from Absurd", () => {
      const str =
        `(claim pair-from-false
  (-> Absurd (Pair Nat Atom)))

(define pair-from-false
  (lambda (impossible)
    (ind-Absurd impossible (Pair Nat Atom))))`
      expect(() => evaluatePie(str)).not.toThrow();
      const result = evaluatePie(str);
      expect(result).toContain("pair-from-false");
      expect(result).toContain("Σ"); // Pair is Sigma type
    })

    it("proves higher-order type from Absurd", () => {
      const str =
        `(claim function-from-false
  (-> Absurd (-> Nat Nat)))

(define function-from-false
  (lambda (impossible)
    (ind-Absurd impossible (-> Nat Nat))))`
      expect(() => evaluatePie(str)).not.toThrow();
      const result = evaluatePie(str);
      expect(result).toContain("function-from-false");
    })
  })

  describe("composition with other proofs", () => {
    it("uses absurd eliminator in another proof", () => {
      const str =
        `(claim absurd-elim
  (Pi ((A U))
    (-> Absurd A)))

(define-tactically absurd-elim
  ((intro A)
   (intro prf)
   (elim-Absurd prf)))

(claim from-false-nat
  (-> Absurd Nat))

(define from-false-nat
  (lambda (proof)
    (absurd-elim Nat proof)))`
      expect(() => evaluatePie(str)).not.toThrow();
      const result = evaluatePie(str);
      expect(result).toContain("absurd-elim");
      expect(result).toContain("from-false-nat");
    })

    it("eliminates Absurd in nested context", () => {
      const str =
        `(claim nested-absurd
  (-> (-> Nat Absurd) Nat Nat))

(define nested-absurd
  (lambda (f n)
    (ind-Absurd (f n) Nat)))`
      expect(() => evaluatePie(str)).not.toThrow();
      const result = evaluatePie(str);
      expect(result).toContain("nested-absurd");
    })
  })

  describe("error cases", () => {
    it("fails when not providing Absurd value to ind-Absurd", () => {
      const str =
        `(claim bad-absurd
  Nat)

(define bad-absurd
  (ind-Absurd zero Nat))`
      expect(() => evaluatePie(str)).toThrow();
    })

    it("fails with incorrect type in eliminator", () => {
      const str =
        `(claim wrong-type
  (-> Nat Nat))

(define wrong-type
  (lambda (x)
    (ind-Absurd x Nat)))`
      expect(() => evaluatePie(str)).toThrow();
    })
  })
})
