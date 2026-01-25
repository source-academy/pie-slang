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

    (claim my-true (Bool () ()))
    (define my-true (true))

    (claim my-false (Bool () ()))
    (define my-false (false))

    (claim bool-to-nat (-> (Bool () ()) Nat))
    (define bool-to-nat
      (lambda (b)
        (ind-Bool b
          (lambda (x) Nat)
          (add1 zero)
          zero)))

    (claim result1 Nat)
    (define result1 (bool-to-nat my-true))

    (claim result2 Nat)
    (define result2 (bool-to-nat my-false))
    `;
    expect(() => testParser(input)).not.toThrow();
  });

  it("Parse MyNat (no params, no indices)", () => {
    const input = `
    (data MyNat () ()
      (myZero () (MyNat () ()))
      (mySucc ((n (MyNat () ()))) (MyNat () ()))
      ind-MyNat)

    (claim zero-nat (MyNat () ()))
    (define zero-nat (myZero))

    (claim two-nat (MyNat () ()))
    (define two-nat (mySucc (mySucc zero-nat)))

    (claim count (-> (MyNat () ()) Nat))
    (define count
      (lambda (n)
        (ind-MyNat n
          (lambda (x) Nat)
          zero
          (lambda (n-1 ih) (add1 ih)))))

    (claim result Nat)
    (define result (count two-nat))
    `;
    expect(() => testParser(input)).not.toThrow();
  });

  it("Parse MyList (parameterized, no indices)", () => {
    const input = `
    (data MyList ((E U)) ()
      (myNil () (MyList (E) ()))
      (myCons ((head E) (tail (MyList (E) ()))) (MyList (E) ()))
      ind-MyList)

    (claim empty-list (MyList (Nat) ()))
    (define empty-list (myNil))

    (claim one-elem-list (MyList (Nat) ()))
    (define one-elem-list (myCons zero empty-list))

    (claim two-elem-list (MyList (Nat) ()))
    (define two-elem-list (myCons (add1 zero) one-elem-list))

    (claim nat-list-length (-> (MyList (Nat) ()) Nat))
    (define nat-list-length
      (lambda (xs)
        (ind-MyList xs
          (lambda (l) Nat)
          zero
          (lambda (h t ih) (add1 ih)))))

    (claim result Nat)
    (define result (nat-list-length two-elem-list))
    `;
    expect(() => testParser(input)).not.toThrow();
  });

  it("Parse MyVec (parameterized and indexed)", () => {
    const input = `
    (data MyVec ((E U)) ((n Nat))
      (myVecNil () (MyVec (E) (zero)))
      (myVecCons ((k Nat) (head E) (tail (MyVec (E) (k)))) (MyVec (E) ((add1 k))))
      ind-MyVec)

    (claim empty-vec (MyVec (Nat) (zero)))
    (define empty-vec (myVecNil))

    (claim one-vec (MyVec (Nat) ((add1 zero))))
    (define one-vec (myVecCons zero (add1 zero) empty-vec))

    (claim vec-to-nat (Pi ((n Nat)) (-> (MyVec (Nat) (n)) Nat)))
    (define vec-to-nat
      (lambda (n v)
        (ind-MyVec v
          (lambda (len vec) Nat)
          zero
          (lambda (k h t ih) (add1 ih)))))

    (claim result Nat)
    (define result (vec-to-nat (add1 zero) one-vec))
    `;
    expect(() => testParser(input)).not.toThrow();
  });

  it("Parse Less-Than (no params, indexed)", () => {
    const input = `
    (data Less-Than () ((j Nat) (k Nat))
      (zero-smallest ((n Nat)) (Less-Than () (zero (add1 n))))
      (add1-smaller ((j Nat) (k Nat) (j<k (Less-Than () (j k)))) (Less-Than () ((add1 j) (add1 k))))
      ind-Less-Than)

    (claim proof-0<1 (Less-Than () (zero (add1 zero))))
    (define proof-0<1 (zero-smallest zero))

    (claim proof-1<2 (Less-Than () ((add1 zero) (add1 (add1 zero)))))
    (define proof-1<2 (add1-smaller zero (add1 zero) proof-0<1))

    (claim extract-smaller
      (Pi ((j Nat) (k Nat))
        (-> (Less-Than () (j k)) Nat)))
    (define extract-smaller
      (lambda (j k proof)
        (ind-Less-Than proof
          (lambda (j-idx k-idx p) Nat)
          (lambda (n) zero)
          (lambda (j-arg k-arg j<k-arg ih) (add1 ih)))))

    (claim result Nat)
    (define result (extract-smaller zero (add1 zero) proof-0<1))
    `;
    expect(() => testParser(input)).not.toThrow();
  });

  it("Parse MyEither (parameterized, no indices)", () => {
    const input = `
    (data MyEither ((L U) (R U)) ()
      (myLeft ((value L)) (MyEither (L R) ()))
      (myRight ((value R)) (MyEither (L R) ()))
      ind-MyEither)

    (claim left-val (MyEither (Nat Atom) ()))
    (define left-val (myLeft zero))

    (claim right-val (MyEither (Nat Atom) ()))
    (define right-val (myRight (quote foo)))

    (claim either-to-nat (-> (MyEither (Nat Atom) ()) Nat))
    (define either-to-nat
      (lambda (e)
        (ind-MyEither e
          (lambda (x) Nat)
          (lambda (lval) (add1 zero))
          (lambda (rval) zero))))

    (claim result1 Nat)
    (define result1 (either-to-nat left-val))

    (claim result2 Nat)
    (define result2 (either-to-nat right-val))
    `;
    expect(() => testParser(input)).not.toThrow();
  });
})
