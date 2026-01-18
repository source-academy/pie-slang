import 'jest';

import { evaluatePie } from '../main'

describe("demo", () => {
  it("Pie demo", () => {
    const src =
      `
      (claim one Nat)
(define one ((the (-> Nat Nat) (lambda (x) (add1 x))) zero))`
    const result = evaluatePie(src)
  })})