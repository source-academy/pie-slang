// Test cases for ind-Vec functionality
// These tests cover basic usage, edge cases, and potential bug scenarios

import { evaluatePie } from "../main";

describe('basic test cases', () => {
  it('first of one', () => {
    const src = `
        (claim first-of-one
(Π ((E U ))
(→ (Vec E 1)
E)))
(define first-of-one
(λ (E)
(λ (es)
(head es))))`
    expect(() => evaluatePie(src)).not.toThrow();
  })

  it('first', () => {
    const src =
      `(claim first
(Π ((E U )
(l Nat))
(→ (Vec E (add1 l))
E)))

(define first
(λ (E l)
(λ (es)
(head es))))`
    expect(() => evaluatePie(src)).not.toThrow();
  })

  it('rest', () => {
    const src =
      `(claim rest
(Π ((E U )
(l Nat))
(→ (Vec E (add1 l))
(Vec E l))))

(define rest
(λ (E l)
(λ (es)
(tail es))))`
    expect(() => evaluatePie(src)).not.toThrow();
  })

  it('peas', () => {
    const src =
      `
(claim peas
(Π ((how-many-peas Nat))
(Vec Atom how-many-peas)))

(claim mot-peas
(→ Nat
U ))

(define mot-peas
(λ (k)
(Vec Atom k)))

(claim step-peas
(Π ((l-1 Nat))
(→ (mot-peas l-1)
(mot-peas (add1 l-1)))))
(define step-peas
(λ (l-1)
(λ (peasl-1)
(vec:: 'pea peasl-1))))

(define peas
(λ (how-many-peas)
(ind-Nat how-many-peas
mot-peas
vecnil
step-peas)))
`
    expect(() => evaluatePie(src)).not.toThrow();
  })
})

describe('ind-Vec test cases', () => {
  it('vecnil case', () => {
    const src =
      `(claim vec-length
  (Pi ((E U) (l Nat) )
    (-> (Vec E l)
        Nat)))

(claim mot-length
  (Pi ((E U)
       (len Nat))
    (-> (Vec E len)
        U)))

(define mot-length
  (lambda (E len)
    (lambda (es)
      Nat)))

(claim step-length
  (Pi ((E U)
       (len Nat)
       (e E)
       (es (Vec E len )))
    (-> (mot-length E len es)
        (mot-length E (add1 len) (vec:: e es)))))

(define step-length
  (lambda (E len e es)
    (lambda (vec-lengthes)
      (add1 vec-lengthes))))

(define vec-length
  (lambda (E n)
    (lambda (es)
  (ind-Vec n es
    (mot-length E)
    zero
    (step-length E)))))`
    expect(() => evaluatePie(src)).not.toThrow();
  })

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
    expect(() => evaluatePie(input)).not.toThrow();
  });
});
