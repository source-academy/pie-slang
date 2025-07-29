import 'jest'
import { evaluatePie } from '../main';

describe("absurd", () => {
    it("trivial", () => {
        const str = 
        `
        (claim test_absurd
  (Pi ((x Absurd) (B U))
    B))
    (define test_absurd
  (lambda (x B)
    (ind-Absurd
      x B)))`
        console.log(evaluatePie(str))

    })

    it("trivial tactic", () => {
        const str = 
        `
        (claim test_absurd
  (Pi ((x Absurd) (B U))
    B))
(define-tactically test_absurd
    ((intro x)
     (intro B)
     (elimAbsurd x B)))
        `
        console.log(evaluatePie(str))})
})