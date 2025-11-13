import 'jest';
import { evaluatePie } from '../main'

describe("Parser Evaluate Integration Tests", () => {

it("Evaluate myVec (parameterized and indexed)", () => {
    const input = `
    (data myList ((E U)) ()
      (myNil () (myList (E) ()))
      (myCons ((head E) (tail (type-myList (E) ()))) (myList (E) ()))
      ind-myList)

    (claim empty-list (type-myList (Nat) ()))
    (define empty-list (data-myNil))

    (claim one-elem-list (type-myList (Nat) ()))
    (define one-elem-list (data-myCons zero empty-list))

    (claim two-elem-list (type-myList (Nat) ()))
    (define two-elem-list (data-myCons (add1 zero) one-elem-list))

    (claim nat-list-length (-> (type-myList (Nat) ()) Nat))
    (define nat-list-length
      (lambda (xs)
        (elim-myList xs
          (lambda (l) Nat)
          zero
          (lambda (h t ih) (add1 ih)))))

    (claim result Nat)
    (define result (nat-list-length two-elem-list))
    `;
    const result = evaluatePie(input);
    console.log(result)
  });
})