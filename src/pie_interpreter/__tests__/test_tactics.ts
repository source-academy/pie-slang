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
    `(claim identity (-> Nat Nat))
    (define-tactically identity
    ((intro n) (exact n)))`
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