import 'jest';

import { evaluatePie } from '../main'

describe("demo", () => {
  it("Pie demo", () => {
    const src = `(claim flip
(Π ((A U)
(D U))
(→ (Pair A D)
(Pair D A))))
(define flip
(λ (A D)
(λ (p)
(cons (cdr p) (car p)))))`
    console.log(evaluatePie(src));
  });
});