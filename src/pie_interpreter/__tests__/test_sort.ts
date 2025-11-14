import 'jest';
import { evaluatePie } from '../main'

describe("Parser Evaluate Integration Tests", () => {

it("Evaluate myVec (parameterized and indexed)", () => {
    const input = `
    (data myList ((E U)) ()
      (myNil () (myList (E) ()))
      (myCons ((head E) (tail (type-myList (E) ()))) (myList (E) ()))
      ind-myList)

    (data Less-Than () ((j Nat) (k Nat))
      (zero-smallest ((n Nat)) (Less-Than () (zero (add1 n))))
      (add1-smaller ((j Nat) (k Nat) (j<k (type-Less-Than () (j k)))) (Less-Than () ((add1 j) (add1 k))))
      ind-Less-Than)

    (data Sorted () ((xs (type-myList (Nat) ())))
      (sorted-nil ()
        (Sorted () ((data-myNil))))
      (sorted-one ((x Nat))
        (Sorted () ((data-myCons x (data-myNil)))))
      (sorted-many ((x Nat) (y Nat) (rest (type-myList (Nat) ()))
                    (x<=y (type-Less-Than () (x y)))
                    (sorted-rest (type-Sorted () ((data-myCons y rest)))))
        (Sorted () ((data-myCons x (data-myCons y rest)))))
  ind-Sorted)
    `;
    const result = evaluatePie(input);
    console.log(result)
  });
})