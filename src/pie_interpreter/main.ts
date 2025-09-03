import { schemeParse, pieDeclarationParser, Claim, Definition, SamenessCheck, DefineTactically } from './parser/parser'
import { checkSame, normType, represent } from './typechecker/represent';
import { go, stop } from './types/utils';
import { prettyPrintCore } from './unparser/pretty';
import { addClaimToContext, addDefineToContext, Define, initCtx } from './utils/context';
import { The } from './types/core';
import { readBack } from './evaluator/utils';
import { ProofManager } from './tactics/proofmanager';
import {inspect} from 'util';

export function evaluatePie(str: string): string {
  const astList = schemeParse(str);
  let ctx = initCtx;
  let output = "";
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
      const a = proofManager.startProof(src.name, ctx, src.location)
      if (a instanceof go) {
        message += a.result + '\n';
      } else if (a instanceof stop) {
        throw new Error("" + a.where + a.message);
      }
      for (const tactic of src.tactics) {
        const result = proofManager.applyTactic(tactic);
        if (result instanceof go) {
          message += result.result;
        } else if (result instanceof stop) {
          throw new Error("" + result.where + result.message);
        }

      }
      return message;
    } else {
      const result = represent(ctx, src);
      if (result instanceof go) {
        const core = result.result as The;
        output += `${prettyPrintCore(core.expr)}: ${prettyPrintCore(core.type)}\n`;
      } else if (result instanceof stop) {
        throw new Error(`${result.message} at ${result.where}`);
      }
    }
  }
    for (const [name, binder] of ctx) {
      if (binder instanceof Define) {
        output += name + " : " + prettyPrintCore(binder.type.readBackType(ctx)) + "\n";
        output += name + " = " + prettyPrintCore(readBack(ctx, binder.type, binder.value)) + "\n";
      } else {
        output += name + " : " + prettyPrintCore(binder.type.readBackType(ctx)) + "\n";
      }
    }
    return output;
  
}