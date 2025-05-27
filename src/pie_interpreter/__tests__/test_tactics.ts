import 'jest';

import {evaluatePie} from '../main'
import { Claim, pieDeclarationParser, schemeParse } from '../parser/parser';
import { addClaimToContext, initCtx } from '../utils/context';
import { ProofManager } from '../tactics/proofmanager';
import { ExactTactic, IntroTactic } from '../tactics/tactics';
import { Name } from '../types/source';
import { go } from '../types/utils';

describe("demo", () => {
  it("Basic", () => {
    const str = 
    `
(claim +
(→ Nat Nat
Nat))

(claim step-+
(→ Nat
Nat))
(define step-+
(λ ( +n-1)
(add1 +n-1 ) ))

(define +
(λ (n j)
(iter-Nat n
j
step-+ )))

(claim +1=add1
(Π ((n Nat))
(= Nat (+ 1 n) (add1 n))))

(define-tactically +1=add1
 ((intro n)
  (exact (same (add1 n)))))
`
    console.log(evaluatePie(str));
  });

  it("Renaming0", () => {
    const str = 
    `
    (claim renaming0 
      (Π ((x Nat))
        (Π ((x Nat))
          Nat)))
    
    (define renaming0
    (λ (x)
      (λ (x)
        x)))`
    console.log(evaluatePie(str));
  })

  it("Renaming0-Tac", () => {
    const str = 
    `
    (claim renaming0-tac 
      (Π ((x Nat))
        (Π ((x Nat))
          Nat)))
    
    (define-tactically renaming0-tac
    ((intro x)
     (intro x)
     (exact x)))`
    console.log(evaluatePie(str));
  })
});