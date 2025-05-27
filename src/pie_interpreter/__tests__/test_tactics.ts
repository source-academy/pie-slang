import 'jest';

import {evaluatePie} from '../main'
import { Claim, pieDeclarationParser, schemeParse } from '../parser/parser';
import { addClaimToContext, initCtx } from '../utils/context';
import { ProofManager } from '../tactics/proofmanager';
import { ExactTactic, IntroTactic } from '../tactics/tactics';
import { Name } from '../types/source';
import { go } from '../types/utils';

describe("demo", () => {
  it("Pie demo", () => {
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

(define-tactically +=add1
 ((intro n)
  (exact (same (add1 n)))))
`
//  (define-tactically +=add1
// ((intro n) 
//  (exact (same (add1 n)))))
// (define +1=add1
// (λ (n)
// (same (add1 n)))) 
    console.log(evaluatePie(str));
    // const astList = schemeParse(str);
    // const src = (pieDeclarationParser.parseDeclaration(astList[0]) as Claim);
    // let ctx = initCtx;
    // // const result = addClaimToContext(ctx, src.name, src.location, src.type);
    // const proof = new ProofManager();
    // const result0 = proof.startProof(src.name, src.type, ctx, src.location);
    // const tactic0 = new IntroTactic(src.location, 'n');
    // const result1 = proof.applyTactic(src.name, tactic0);
    // const tactic1 = new ExactTactic(src.location, new Name(src.location, 'n'));
    // const result2 = proof.applyTactic(src.name, tactic1);
    // console.log((result0 as go<string>).result);
    // console.log((result1 as go<string>).result);
    // console.log((result2 as go<string>).result);
  });
});