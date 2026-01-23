import 'jest'
import { evaluatePie } from '../main'

describe("left and right", () => {
  it("left trivial", () => {
    const str =
      `(claim test_either
  (Either Nat Nat))

(define test_either
  (left zero))`
    console.log(evaluatePie(str))
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
    console.log(evaluatePie(str))
  })

  it("right trivial", () => {
    const str =
      `(claim test_either
  (Either Nat Nat))

  (define-tactically test_either
    ((go-Right)
     (exact zero)))
        `
    console.log(evaluatePie(str))
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
    console.log(evaluatePie(str))
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
    console.log(evaluatePie(str))
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
    console.log(evaluatePie(str))
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
    console.log(evaluatePie(str))
  })
})
