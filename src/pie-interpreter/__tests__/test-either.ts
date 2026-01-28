import 'jest'
import { evaluatePie } from '../main'

describe("left and right", () => {
  it("left trivial", () => {
    const str =
      `(claim test_either
  (Either Nat Nat))

(define test_either
  (left zero))`
    expect(() => evaluatePie(str)).not.toThrow()
  })

  it("left trivial tactic", () => {
    const str =
      `
        (claim test_either
  (Either Nat Nat))

  (define-tactically test_either
    ((go-Left)
     (exact zero)))
        `
    expect(() => evaluatePie(str)).not.toThrow()
  })

  it("right trivial", () => {
    const str =
      `(claim test_either
  (Either Nat Nat))

  (define-tactically test_either
    ((go-Right)
     (exact zero)))
        `
    expect(() => evaluatePie(str)).not.toThrow()
  })
}
)

describe("elim-Either", () => {
  it("trivial", () => {
    const str =
      `(claim either-swap
  (Pi ((A U) (B U))
    (-> (Either A B)
        (Either B A))))

(define either-swap
  (lambda (A B e)
    (ind-Either e
                (lambda (_) (Either B A))
                (lambda (x) (right x))
                (lambda (x) (left x)))))`
    expect(() => evaluatePie(str)).not.toThrow()
  })

  it("trivial tactic ver0", () => {
    const str =
      `(claim either-swap
  (Pi ((A U) (B U))
    (-> (Either A B)
        (Either B A))))

        (define-tactically either-swap
          ((intro A)
           (intro B)
           (intro e)
           (elim-Either e)
           (then (exact (lambda (x) (right x))))
           (then (exact (lambda (x) (left x))))))`
    expect(() => evaluatePie(str)).not.toThrow()
  })

  it("trivial tactic ver1", () => {
    const str =
      `(claim either-swap
  (Pi ((A U) (B U))
    (-> (Either A B)
        (Either B A))))

        (define-tactically either-swap
          ((intro A)
           (intro B)
           (intro e)
           (elim-Either e)
           (then
             (intro x)
             (exact (right x)))
           (then
             (intro x)
             (exact (left x)))))`
    expect(() => evaluatePie(str)).not.toThrow()
  })

  it("trivial tactic ver2", () => {
    const str =
      `(claim either-swap
  (Pi ((A U) (B U))
    (-> (Either A B)
        (Either B A))))

        (define-tactically either-swap
          ((intro A)
           (intro B)
           (intro e)
           (elim-Either e)
           (then
             (intro x)
             (go-Right)
             (exact x))
           (then
             (intro x)
             (go-Left)
             (exact x))))`
    expect(() => evaluatePie(str)).not.toThrow()
  })
})

describe("Two-Fun tautology", () => {
  it("tautology with iter-Nat", () => {
    const str =
      `(claim Two
  U)
(define Two
  (Either Trivial Trivial))

(claim Two-Fun
  (→ Nat
    U))
(define Two-Fun
  (λ (n)
    (iter-Nat n
      Two
      (λ (type)
        (→ Two
          type)))))

(claim both-left
  (→ Two Two
    Two))
(define both-left
  (λ (a b)
    (ind-Either a
      (λ (c)
        Two)
      (λ (left-sole)
        b)
      (λ (right-sole)
        (right sole)))))

(claim step-taut
  (Π ((n-1 Nat))
    (→ (→ (Two-Fun n-1)
        Two)
      (→ (Two-Fun (add1 n-1))
        Two))))
(define step-taut
  (λ (n-1 tautn-1)
    (λ (f)
      (both-left
        (tautn-1
          (f (left sole)))
        (tautn-1
          (f (right sole)))))))

(claim taut
  (Π ((n Nat))
    (→ (Two-Fun n)
      Two)))
(define taut
  (λ (n)
    (ind-Nat n
      (λ (k)
        (→ (Two-Fun k)
          Two))
      (λ (x)
        x)
      step-taut)))`
    expect(() => evaluatePie(str)).not.toThrow()
  })
})
