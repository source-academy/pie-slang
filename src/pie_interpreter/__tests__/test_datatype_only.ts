import 'jest';
import { evaluatePie } from '../main'

describe("Test datatype definition only", () => {
  it("Define Subtype", () => {
    const input = `
    (data Subtype () ((T1 U) (T2 U))
      (refl ((T U))
        (Subtype () (T T)))
      (trans ((T1 U) (T2 U) (T3 U)
              (p1 (type-Subtype () (T1 T2)))
              (p2 (type-Subtype () (T2 T3))))
        (Subtype () (T1 T3)))
      ind-Subtype)
    `;
    const result = evaluatePie(input);
    console.log("Success!");
  });
})
