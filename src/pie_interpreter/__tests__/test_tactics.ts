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
; test
 ((intro n)
  (exact (same (add1 n)))))
`
    console.log(evaluatePie(str));
  });



//   it("Renaming0", () => {
//     const str = 
//     `
//     (claim renaming0 
//       (Π ((x Nat))
//         (Π ((x Nat))
//           Nat)))
    
//     (define renaming0
//     (λ (x)
//       (λ (x)
//         x)))`
//     console.log(evaluatePie(str));
//   })

//   it("Renaming0-Tac", () => {
//     const str = 
//     `
//     (claim renaming0-tac 
//       (Π ((x Nat))
//         (Π ((x Nat))
//           Nat)))
    
//     (define-tactically renaming0-tac
//     ((intro x)
//      (intro x)
//      (exact x)))`
//     console.log(evaluatePie(str));
//   })

//   it("Renaming1", () => {
//     const str = 
//     `
//     (claim problematic-capture
//       (Π ((n Nat) (P (→ Nat U)))
//         (Π ((n (P n)))  
//           (P n))))      
    
//     (define problematic-capture
//       (λ (n P)
//         (λ (n)
//           n)))`
//     console.log(evaluatePie(str));
//   })

//   it("Renaming1-Tac", () => {
//     const str = 
//     `
//     (claim problematic-capture-tac
//       (Π ((n Nat) (P (→ Nat U)))
//         (Π ((n (P n)))  
//           (P n))))      
    
//     (define-tactically problematic-capture-tac
//       ((intro n)
//        (intro P)
//        (intro n)
//        (exact n)))`
//     console.log(evaluatePie(str));
//   });

//   it("Reference to captured variable", () => {
//   const str = `
//     (claim captured-reference  
//       (Π ((x Nat))
//         (Π ((P (→ Nat U)))
//           (Π ((x (P x)))        
//             (Π ((y (P x)))      ; This (P x) should use outer x, not inner x
//               (P x))))))        ; This (P x) should use outer x
    
//            (define-tactically captured-reference
//       ((intro x)      ; x₁ : Nat (outer)
//        (intro P)      ; P : (→ Nat U)  
//        (intro x)      ; x₂ : (P x₁) (inner) - need to track that this x should be renamed
//        (intro y)      ; y : (P x₁) - the P x should still refer to x₁
//        (exact y)))    ; Should work since y : (P x₁) and goal is (P x₁)   
//   `;
  
//   console.log(evaluatePie(str));
// });
});

describe("EliminateTactic Tests", () => {
  
  it("Simple Nat elimination - prove n = n", () => {
    const str = 
    `
(claim n=n
  (Π ((n Nat))
    (= Nat n n)))

(define-tactically n=n
  ((intro n)
   (elimNat n (λ (k) (= Nat k k)))
   ; After eliminate, we get 3 goals:
   ; 1. Motive: (Π (k Nat) U)  
   ; 2. Base: (motive zero)
   ; 3. Step: (Π (n-1 Nat) (→ (motive n-1) (motive (add1 n-1))))
   (exact (same zero))             ; Solve base case
   (intro n-1)                     ; Introduce variables for step case
   (intro ih)
   (exact (same (add1 n-1)))))     ; Solve step case
`;
    console.log(evaluatePie(str));});

  it("Simple List elimination", () => {
    const str = `

`;
    console.log(evaluatePie(str));
  });
});