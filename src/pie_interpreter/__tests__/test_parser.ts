import 'jest';
import { schemeParse, pieDeclarationParser } from '../parser/parser';

function testParser(input: string) {
  const parsed = schemeParse(input);
  return pieDeclarationParser.parseDeclaration(parsed[0]);
}

describe("Inductive Types Parser", () => {
  it("Parse Bool (no params, no indices)", () => {
    const input =
    `(data Bool () ()
      (true () (Bool () ()))
      (false () (Bool () ()))
      ind-Bool)

    (claim my-true (type-Bool () ()))
    (define my-true (data-true))

    (claim my-false (type-Bool () ()))
    (define my-false (data-false))

    (claim bool-to-nat (-> (type-Bool () ()) Nat))
    (define bool-to-nat
      (lambda (b)
        (elim-Bool b
          (lambda (x) Nat)
          (add1 zero)
          zero)))

    (claim result1 Nat)
    (define result1 (bool-to-nat my-true))

    (claim result2 Nat)
    (define result2 (bool-to-nat my-false))
    `;
    const result = testParser(input);
  });

  it("Parse myNat (no params, no indices)", () => {
    const input = `
    (data myNat () ()
      (myZero () (myNat () ()))
      (mySucc ((n (type-myNat () ()))) (myNat () ()))
      ind-myNat)

    (claim zero-nat (type-myNat () ()))
    (define zero-nat (data-myZero))

    (claim two-nat (type-myNat () ()))
    (define two-nat (data-mySucc (data-mySucc zero-nat)))

    (claim count (-> (type-myNat () ()) Nat))
    (define count
      (lambda (n)
        (elim-myNat n
          (lambda (x) Nat)
          zero
          (lambda (n-1 ih) (add1 ih)))))

    (claim result Nat)
    (define result (count two-nat))
    `;
    const result = testParser(input);
  });

  it("Parse myList (parameterized, no indices)", () => {
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
    const result = testParser(input);
  });

  it("Parse myVec (parameterized and indexed)", () => {
    const input = `
    (data myVec ((E U)) ((n Nat))
      (myVecNil () (myVec (E) (zero)))
      (myVecCons ((k Nat) (head E) (tail (type-myVec (E) (k)))) (myVec (E) ((add1 k))))
      ind-myVec)

    (claim empty-vec (type-myVec (Nat) (zero)))
    (define empty-vec (data-myVecNil))

    (claim one-vec (type-myVec (Nat) ((add1 zero))))
    (define one-vec (data-myVecCons zero (add1 zero) empty-vec))

    (claim vec-to-nat (Pi ((n Nat)) (-> (type-myVec (Nat) (n)) Nat)))
    (define vec-to-nat
      (lambda (n v)
        (elim-myVec v
          (lambda (len vec) Nat)
          zero
          (lambda (k h t ih) (add1 ih)))))

    (claim result Nat)
    (define result (vec-to-nat (add1 zero) one-vec))
    `;
    const result = testParser(input);
  });

  it("Parse Less-Than (no params, indexed)", () => {
    const input = `
    (data Less-Than () ((j Nat) (k Nat))
      (zero-smallest ((n Nat)) (Less-Than () (zero (add1 n))))
      (add1-smaller ((j Nat) (k Nat) (j<k (type-Less-Than () (j k)))) (Less-Than () ((add1 j) (add1 k))))
      ind-Less-Than)

    (claim proof-0<1 (type-Less-Than () (zero (add1 zero))))
    (define proof-0<1 (data-zero-smallest zero))

    (claim proof-1<2 (type-Less-Than () ((add1 zero) (add1 (add1 zero)))))
    (define proof-1<2 (data-add1-smaller zero (add1 zero) proof-0<1))

    (claim extract-smaller
      (Pi ((j Nat) (k Nat))
        (-> (type-Less-Than () (j k)) Nat)))
    (define extract-smaller
      (lambda (j k proof)
        (elim-Less-Than proof
          (lambda (j-idx k-idx p) Nat)
          (lambda (n) zero)
          (lambda (j-arg k-arg j<k-arg ih) (add1 ih)))))

    (claim result Nat)
    (define result (extract-smaller zero (add1 zero) proof-0<1))
    `;
    const result = testParser(input);
  });

  it("Parse myEither (parameterized, no indices)", () => {
    const input = `
    (data myEither ((L U) (R U)) ()
      (myLeft ((value L)) (myEither (L R) ()))
      (myRight ((value R)) (myEither (L R) ()))
      ind-myEither)

    (claim left-val (type-myEither (Nat Atom) ()))
    (define left-val (data-myLeft zero))

    (claim right-val (type-myEither (Nat Atom) ()))
    (define right-val (data-myRight (quote foo)))

    (claim either-to-nat (-> (type-myEither (Nat Atom) ()) Nat))
    (define either-to-nat
      (lambda (e)
        (elim-myEither e
          (lambda (x) Nat)
          (lambda (lval) (add1 zero))
          (lambda (rval) zero))))

    (claim result1 Nat)
    (define result1 (either-to-nat left-val))

    (claim result2 Nat)
    (define result2 (either-to-nat right-val))
    `;
    const result = testParser(input);
  });
})
