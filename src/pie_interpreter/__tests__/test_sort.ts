import 'jest';
import { evaluatePie } from '../main'

describe("Parser Evaluate Integration Tests", () => {

it("Evaluate MyVec (parameterized and indexed)", () => {
    const input = `
    (data MyList ((E U)) ()
      (myNil () (MyList (E) ()))
      (myCons ((head E) (tail (MyList (E) ()))) (MyList (E) ()))
      ind-MyList)

    (data Less-Than () ((j Nat) (k Nat))
      (zero-smallest ((n Nat)) (Less-Than () (zero (add1 n))))
      (add1-smaller ((j Nat) (k Nat) (j<k (Less-Than () (j k)))) (Less-Than () ((add1 j) (add1 k))))
      ind-Less-Than)

    (data Sorted () ((xs (MyList (Nat) ())))
      (sorted-nil ()
        (Sorted () ((myNil))))
      (sorted-one ((x Nat))
        (Sorted () ((myCons x (myNil)))))
      (sorted-many ((x Nat) (y Nat) (rest (MyList (Nat) ()))
                    (x<=y (Less-Than () (x y)))
                    (sorted-rest (Sorted () ((myCons y rest)))))
        (Sorted () ((myCons x (myCons y rest)))))
  ind-Sorted)
    `;
    const result = evaluatePie(input);
    console.log(result)
  });
})
