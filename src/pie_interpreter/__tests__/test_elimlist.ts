import 'jest';

import {evaluatePie} from '../main'
import { Claim, pieDeclarationParser, schemeParse } from '../parser/parser';
import { addClaimToContext, initCtx } from '../utils/context';
import { ProofManager } from '../tactics/proofmanager';
import { ExactTactic, IntroTactic } from '../tactics/tactics';
import { Name } from '../types/source';
import { go } from '../types/utils';

describe("elimlist", () => {
  it("Basic", () => {
    const str = `
(claim length
(Π ((E U ))
(→ (List E)
Nat)))

(claim step-length
(Π ((E U ))
(→ E (List E) Nat
Nat)))

(define step-length
(λ (E)
(λ (e es lengthes )
(add1 lengthes ))))

(define length
(λ (E)
(λ (es)
(rec-List es
0
(step-length E)))))

(claim list->vec
(Π ((E U )
(es (List E)))
(Vec E (length E es))))

(claim mot-list->vec
(Π ((E U ))
(→ (List E)
U )))

(define mot-list->vec
(λ (E)
(λ (es)
(Vec E (length E es)))))


(claim step-list->vec
(Π ((E U )
(e E)
(es (List E)))
(→ (mot-list->vec E es)
(mot-list->vec E (:: e es)))))

(define step-list->vec
(λ (E e es)
(λ (list->veces )
(vec:: e list->veces ))))


(define list->vec
(λ (E es)
(ind-List es
(mot-list->vec E)
vecnil
(step-list->vec E))))
`
    console.log(evaluatePie(str));
  })

  it("Tactic", () => {
    const str = `
(claim length
(Π ((E U ))
(→ (List E)
Nat)))

(claim step-length
(Π ((E U ))
(→ E (List E) Nat
Nat)))

(define step-length
(λ (E)
(λ (e es lengthes )
(add1 lengthes ))))

(define length
(λ (E)
(λ (es)
(rec-List es
0
(step-length E)))))

(claim list->vec
(Π ((E U )
(es (List E)))
(Vec E (length E es))))

(claim mot-list->vec
(Π ((E U ))
(→ (List E)
U )))

(define mot-list->vec
(λ (E)
(λ (es)
(Vec E (length E es)))))


(claim step-list->vec
(Π ((E U )
(e E)
(es (List E)))
(→ (mot-list->vec E es)
(mot-list->vec E (:: e es)))))

(define step-list->vec
(λ (E e es)
(λ (list->veces )
(vec:: e list->veces ))))


(define-tactically list->vec
  ((intro E)
   (intro es)
   (elimList es (mot-list->vec E))
   (exact vecnil)
   (exact (step-list->vec E)))
)
`
    console.log(evaluatePie(str))
  })
})

describe('elimvec', () => {
  it('Basic', () => {
    const str = 
    `
(claim +
  (→ Nat Nat
    Nat))

(claim step-plus
  (→ Nat
    Nat))

(define step-plus
  (λ (n-1)
    (add1 n-1 ) ))

(define +
  (λ (n j)
    (iter-Nat n
      j
      step-plus )))

(claim vec-append
(Π ((E U )
(l Nat)
(j Nat))
(→ (Vec E l) (Vec E j)
(Vec E (+ l j)))))

(claim mot-vec-append
(Π ((E U )
( j Nat)
(k Nat))
(→ (Vec E k)
U )))
(define mot-vec-append
(λ (E j k)
(λ (es)
(Vec E (+ k j)))))

(claim step-vec-append
(Π ((E U )
(j Nat)
(k Nat)
(e E)
(es (Vec E k)))
(→ (mot-vec-append E j
k es)
(mot-vec-append E j
(add1 k) (vec:: e es))))) 

(define step-vec-append
(λ (E j l-1 e es)
(λ (vec-appendes )
(vec:: e vec-appendes )))) 


(define vec-append
(λ (E l j)
(λ (es end)
(ind-Vec l es
(mot-vec-append E j)
end
(step-vec-append E j)))))
    `
    console.log(evaluatePie(str));
  })

  it('Tactic', () => {
    const str = 
    `
(claim +
  (→ Nat Nat
    Nat))

(claim step-plus
  (→ Nat
    Nat))

(define step-plus
  (λ (n-1)
    (add1 n-1 ) ))

(define +
  (λ (n j)
    (iter-Nat n
      j
      step-plus )))

(claim vec-append
(Π ((E U )
(l Nat)
(j Nat))
(→ (Vec E l) (Vec E j)
(Vec E (+ l j)))))

(claim mot-vec-append
(Π ((E U )
( j Nat)
(k Nat))
(→ (Vec E k)
U )))
(define mot-vec-append
(λ (E j k)
(λ (es)
(Vec E (+ k j)))))

(claim step-vec-append
(Π ((E U )
(j Nat)
(k Nat)
(e E)
(es (Vec E k)))
(→ (mot-vec-append E j
k es)
(mot-vec-append E j
(add1 k) (vec:: e es))))) 

(define step-vec-append
(λ (E j l-1 e es)
(λ (vec-appendes )
(vec:: e vec-appendes )))) 


(define-tactically vec-append
  ((intro E)
   (intro l)
   (intro j)
   (intro es)
   (intro end)
   (elimVec es (mot-vec-append E j) l)
   (exact end)
    (exact (step-vec-append E j))))
    `
    console.log(evaluatePie(str));
  })
})


  