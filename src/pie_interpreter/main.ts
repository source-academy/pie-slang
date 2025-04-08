import { schemeParse, pieDeclarationParser, Claim, Definition, SamenessCheck, DefineTactically } from './parser/parser'
import { checkSame, normType } from './typechecker/represent';
import { go, stop } from './types/utils';
import { prettyPrintCore } from './unparser/pretty';
import { addClaimToContext, addDefineToContext, Define, initCtx } from './utils/context';

import { Core } from './types/core';
import { readBack } from './evaluator/utils';
import { ProofManager } from './tactics/proofmanager';

export function evaluatePie(str): string {
  const astList = schemeParse(str);
  let ctx = initCtx;
  for (const ast of astList) {
    const src = pieDeclarationParser.parseDeclaration(ast);
    if (src instanceof Claim) {
      const result = addClaimToContext(ctx, src.name, src.location, src.type);
      if (result instanceof go) {
        ctx = result.result;
      } else if (result instanceof stop) {
        throw new Error("" + result.where + result.message);
      }
    } else if (src instanceof Definition) {
      const result = addDefineToContext(ctx, src.name, src.location, src.expr);
      if (result instanceof go) {
        ctx = result.result;
      } else if (result instanceof stop) {
        throw new Error("" + result.where + result.message);
      }
    } else if (src instanceof SamenessCheck) {
      const result = checkSame(ctx, src.location, src.type, src.left, src.right);
      if (result instanceof go) {
        ctx = result.result;
      } else if (result instanceof stop) {
        throw new Error("" + result.where + result.message);
      }
    } else if (src instanceof DefineTactically) {
      const proofManager = new ProofManager();
      let message = ''
      message += (proofManager.startProof(src.name, ctx, src.location) as go<string>).result;

      for (const tactic of src.tactics) {
        const result = proofManager.applyTactic(src.name, tactic);
        if (result instanceof go) {
          message += result.result;
        } else if (result instanceof stop) {
          throw new Error("" + result.where + result.message);
        }

      }
      return message;
    } else {
      const result = normType(ctx, src);
      if (result instanceof go) {
        const core = result.result as Core;
        console.log(core.prettyPrint());
      } else if (result instanceof stop) {
        throw new Error("" + result.where + result.message);
      }
    }
  }
    let output = "";
    for (const [name, binder] of ctx) {
      if (binder instanceof Define) {
        // console.log(name + " : " + prettyPrintCore(binder.type.readBackType(ctx)));
        // console.log(name + " = " + prettyPrintCore(readBack(ctx, binder.type, binder.value)));
        output += name + " : " + prettyPrintCore(binder.type.readBackType(ctx)) + "\n";
        output += name + " = " + prettyPrintCore(readBack(ctx, binder.type, binder.value)) + "\n";
      } else {
        // console.log(name + " : " + prettyPrintCore(binder.type.readBackType(ctx)));
        output += name + " : " + prettyPrintCore(binder.type.readBackType(ctx)) + "\n";
      }
    }
    return output;
  
}