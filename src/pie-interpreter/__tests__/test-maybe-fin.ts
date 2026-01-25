import 'jest'
import { evaluatePie } from '../main'

describe("Maybe type", () => {
  it("Maybe definition", () => {
    const str =
      `(claim Maybe
  (→ U
    U))

(define Maybe
  (λ (X)
    (Either X Trivial)))`
    expect(() => evaluatePie(str)).not.toThrow()
  })

  it("nothing constructor", () => {
    const str =
      `(claim Maybe
  (→ U
    U))

(define Maybe
  (λ (X)
    (Either X Trivial)))

(claim nothing
  (Π ((E U))
    (Maybe E)))

(define nothing
  (λ (E)
    (right sole)))`
    expect(() => evaluatePie(str)).not.toThrow()
  })

  it("just constructor", () => {
    const str =
      `(claim Maybe
  (→ U
    U))

(define Maybe
  (λ (X)
    (Either X Trivial)))

(claim just
  (Π ((E U))
    (→ E
      (Maybe E))))

(define just
  (λ (E e)
    (left e)))`
    expect(() => evaluatePie(str)).not.toThrow()
  })
})

describe("maybe-head and maybe-tail", () => {
  it("maybe-head definition", () => {
    const str =
      `(claim Maybe
  (→ U
    U))

(define Maybe
  (λ (X)
    (Either X Trivial)))

(claim nothing
  (Π ((E U))
    (Maybe E)))

(define nothing
  (λ (E)
    (right sole)))

(claim just
  (Π ((E U))
    (→ E
      (Maybe E))))

(define just
  (λ (E e)
    (left e)))

(claim maybe-head
  (Π ((E U))
    (→ (List E)
      (Maybe E))))

(define maybe-head
  (λ (E es)
    (rec-List es
      (nothing E)
      (λ (hd tl headtl)
        (just E hd)))))`
    expect(() => evaluatePie(str)).not.toThrow()
  })

  it("maybe-tail definition", () => {
    const str =
      `(claim Maybe
  (→ U
    U))

(define Maybe
  (λ (X)
    (Either X Trivial)))

(claim nothing
  (Π ((E U))
    (Maybe E)))

(define nothing
  (λ (E)
    (right sole)))

(claim just
  (Π ((E U))
    (→ E
      (Maybe E))))

(define just
  (λ (E e)
    (left e)))

(claim maybe-tail
  (Π ((E U))
    (→ (List E)
      (Maybe (List E)))))

(define maybe-tail
  (λ (E es)
    (rec-List es
      (nothing (List E))
      (λ (hd tl tailtl)
        (just (List E) tl)))))`
    expect(() => evaluatePie(str)).not.toThrow()
  })
})

describe("list-ref", () => {
  it("list-ref with step-list-ref", () => {
    const str =
      `(claim Maybe
  (→ U
    U))

(define Maybe
  (λ (X)
    (Either X Trivial)))

(claim nothing
  (Π ((E U))
    (Maybe E)))

(define nothing
  (λ (E)
    (right sole)))

(claim just
  (Π ((E U))
    (→ E
      (Maybe E))))

(define just
  (λ (E e)
    (left e)))

(claim maybe-head
  (Π ((E U))
    (→ (List E)
      (Maybe E))))

(define maybe-head
  (λ (E es)
    (rec-List es
      (nothing E)
      (λ (hd tl headtl)
        (just E hd)))))

(claim maybe-tail
  (Π ((E U))
    (→ (List E)
      (Maybe (List E)))))

(define maybe-tail
  (λ (E es)
    (rec-List es
      (nothing (List E))
      (λ (hd tl tailtl)
        (just (List E) tl)))))

(claim step-list-ref
  (Π ((E U))
    (→ Nat
      (→ (List E)
        (Maybe E))
      (→ (List E)
        (Maybe E)))))

(define step-list-ref
  (λ (E)
    (λ (n-1 list-ref-n-1)
      (λ (es)
        (ind-Either (maybe-tail E es)
          (λ (maybetl)
            (Maybe E))
          (λ (tl)
            (list-ref-n-1 tl))
          (λ (empty)
            (nothing E)))))))

(claim list-ref
  (Π ((E U))
    (→ Nat (List E)
      (Maybe E))))

(define list-ref
  (λ (E n)
    (rec-Nat n
      (maybe-head E)
      (step-list-ref E))))`
    expect(() => evaluatePie(str)).not.toThrow()
  })
})

describe("Absurd type", () => {
  it("similarly-absurd identity", () => {
    const str =
      `(claim similarly-absurd
  (→ Absurd
    Absurd))

(define similarly-absurd
  (λ (x)
    x))`
    expect(() => evaluatePie(str)).not.toThrow()
  })

  it("ind-Absurd usage", () => {
    const str =
      `(claim absurd-implies-anything
  (Π ((A U))
    (→ Absurd
      A)))

(define absurd-implies-anything
  (λ (A)
    (λ (impossible)
      (ind-Absurd impossible
        A))))`
    expect(() => evaluatePie(str)).not.toThrow()
  })
})

describe("Fin type", () => {
  it("Fin definition", () => {
    const str =
      `(claim Maybe
  (→ U
    U))

(define Maybe
  (λ (X)
    (Either X Trivial)))

(claim Fin
  (→ Nat
    U))

(define Fin
  (λ (n)
    (iter-Nat n
      Absurd
      Maybe)))`
    expect(() => evaluatePie(str)).not.toThrow()
  })

  it("fzero constructor", () => {
    const str =
      `(claim Maybe
  (→ U
    U))

(define Maybe
  (λ (X)
    (Either X Trivial)))

(claim Fin
  (→ Nat
    U))

(define Fin
  (λ (n)
    (iter-Nat n
      Absurd
      Maybe)))

(claim nothing
  (Π ((E U))
    (Maybe E)))

(define nothing
  (λ (E)
    (right sole)))

(claim fzero
  (Π ((n Nat))
    (Fin (add1 n))))

(define fzero
  (λ (n)
    (nothing (Fin n))))`
    expect(() => evaluatePie(str)).not.toThrow()
  })

  it("fadd1 constructor", () => {
    const str =
      `(claim Maybe
  (→ U
    U))

(define Maybe
  (λ (X)
    (Either X Trivial)))

(claim Fin
  (→ Nat
    U))

(define Fin
  (λ (n)
    (iter-Nat n
      Absurd
      Maybe)))

(claim just
  (Π ((E U))
    (→ E
      (Maybe E))))

(define just
  (λ (E e)
    (left e)))

(claim fadd1
  (Π ((n Nat))
    (→ (Fin n)
      (Fin (add1 n)))))

(define fadd1
  (λ (n)
    (λ (i-1)
      (just (Fin n) i-1))))`
    expect(() => evaluatePie(str)).not.toThrow()
  })
})

describe("vec-ref", () => {
  it("base-vec-ref with ind-Absurd", () => {
    const str =
      `(claim Maybe
  (→ U
    U))

(define Maybe
  (λ (X)
    (Either X Trivial)))

(claim Fin
  (→ Nat
    U))

(define Fin
  (λ (n)
    (iter-Nat n
      Absurd
      Maybe)))

(claim base-vec-ref
  (Π ((E U))
    (→ (Fin zero) (Vec E zero)
      E)))

(define base-vec-ref
  (λ (E)
    (λ (no-value-ever es)
      (ind-Absurd no-value-ever
        E))))`
    expect(() => evaluatePie(str)).not.toThrow()
  })

  it("step-vec-ref definition", () => {
    const str =
      `(claim Maybe
  (→ U
    U))

(define Maybe
  (λ (X)
    (Either X Trivial)))

(claim Fin
  (→ Nat
    U))

(define Fin
  (λ (n)
    (iter-Nat n
      Absurd
      Maybe)))

(claim step-vec-ref
  (Π ((E U)
      (ℓ-1 Nat))
    (→ (→ (Fin ℓ-1)
          (Vec E ℓ-1)
          E)
      (→ (Fin (add1 ℓ-1))
        (Vec E (add1 ℓ-1))
        E))))

(define step-vec-ref
  (λ (E ℓ-1)
    (λ (vec-ref-ℓ-1)
      (λ (i es)
        (ind-Either i
          (λ (i)
            E)
          (λ (i-1)
            (vec-ref-ℓ-1
              i-1 (tail es)))
          (λ (triv)
            (head es)))))))`
    expect(() => evaluatePie(str)).not.toThrow()
  })

  it("complete vec-ref definition", () => {
    const str =
      `(claim Maybe
  (→ U
    U))

(define Maybe
  (λ (X)
    (Either X Trivial)))

(claim Fin
  (→ Nat
    U))

(define Fin
  (λ (n)
    (iter-Nat n
      Absurd
      Maybe)))

(claim base-vec-ref
  (Π ((E U))
    (→ (Fin zero) (Vec E zero)
      E)))

(define base-vec-ref
  (λ (E)
    (λ (no-value-ever es)
      (ind-Absurd no-value-ever
        E))))

(claim step-vec-ref
  (Π ((E U)
      (ℓ-1 Nat))
    (→ (→ (Fin ℓ-1)
          (Vec E ℓ-1)
          E)
      (→ (Fin (add1 ℓ-1))
        (Vec E (add1 ℓ-1))
        E))))

(define step-vec-ref
  (λ (E ℓ-1)
    (λ (vec-ref-ℓ-1)
      (λ (i es)
        (ind-Either i
          (λ (i)
            E)
          (λ (i-1)
            (vec-ref-ℓ-1
              i-1 (tail es)))
          (λ (triv)
            (head es)))))))

(claim vec-ref
  (Π ((E U)
      (ℓ Nat))
    (→ (Fin ℓ) (Vec E ℓ)
      E)))

(define vec-ref
  (λ (E ℓ)
    (ind-Nat ℓ
      (λ (k)
        (→ (Fin k) (Vec E k)
          E))
      (base-vec-ref E)
      (step-vec-ref E))))`
    expect(() => evaluatePie(str)).not.toThrow()
  })

  it("vec-ref with menu example", () => {
    const str =
      `(claim Maybe
  (→ U
    U))

(define Maybe
  (λ (X)
    (Either X Trivial)))

(claim nothing
  (Π ((E U))
    (Maybe E)))

(define nothing
  (λ (E)
    (right sole)))

(claim just
  (Π ((E U))
    (→ E
      (Maybe E))))

(define just
  (λ (E e)
    (left e)))

(claim Fin
  (→ Nat
    U))

(define Fin
  (λ (n)
    (iter-Nat n
      Absurd
      Maybe)))

(claim fzero
  (Π ((n Nat))
    (Fin (add1 n))))

(define fzero
  (λ (n)
    (nothing (Fin n))))

(claim fadd1
  (Π ((n Nat))
    (→ (Fin n)
      (Fin (add1 n)))))

(define fadd1
  (λ (n)
    (λ (i-1)
      (just (Fin n) i-1))))

(claim base-vec-ref
  (Π ((E U))
    (→ (Fin zero) (Vec E zero)
      E)))

(define base-vec-ref
  (λ (E)
    (λ (no-value-ever es)
      (ind-Absurd no-value-ever
        E))))

(claim step-vec-ref
  (Π ((E U)
      (ℓ-1 Nat))
    (→ (→ (Fin ℓ-1)
          (Vec E ℓ-1)
          E)
      (→ (Fin (add1 ℓ-1))
        (Vec E (add1 ℓ-1))
        E))))

(define step-vec-ref
  (λ (E ℓ-1)
    (λ (vec-ref-ℓ-1)
      (λ (i es)
        (ind-Either i
          (λ (i)
            E)
          (λ (i-1)
            (vec-ref-ℓ-1
              i-1 (tail es)))
          (λ (triv)
            (head es)))))))

(claim vec-ref
  (Π ((E U)
      (ℓ Nat))
    (→ (Fin ℓ) (Vec E ℓ)
      E)))

(define vec-ref
  (λ (E ℓ)
    (ind-Nat ℓ
      (λ (k)
        (→ (Fin k) (Vec E k)
          E))
      (base-vec-ref E)
      (step-vec-ref E))))

(claim menu
  (Vec Atom 4))

(define menu
  (vec:: 'ratatouille
    (vec:: 'kartoffelmad
      (vec:: 'hero
        (vec:: 'prinsesstarta vecnil)))))

(claim second-item Atom)
(define second-item
  (vec-ref Atom 4
    (fadd1 3
      (fzero 2))
    menu))`
    expect(() => evaluatePie(str)).not.toThrow()
  })
})
