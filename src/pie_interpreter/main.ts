import {schemeParse, pieDeclarationParser, Claim, Definition, SamenessCheck} from './parser/parser'
import { checkSame, normType } from './typechecker/represent';
import { go, stop } from './types/utils';
import { prettyPrint } from './unparser/pretty';
import { addClaimToContext, addDefineToContext, Context, initCtx } from './utils/context';
import * as util from 'util';
import { Location } from './utils/locations';


export function evaluatePie(str){
  const astList = schemeParse(str);
  let ctx = initCtx;
  let output = "";
  for (const ast of astList) {
    const src = pieDeclarationParser.parseDeclaration(ast);
    let result;
    // console.log(util.inspect(src, false, null, true));
    if (src instanceof Claim) {
      result = addClaimToContext(ctx, src.name, src.location, src.type);
      if (result instanceof go) {
        ctx = result.result;
      } else {
        throw new Error("" + result.where + result.message);
      }
    } else if (src instanceof Definition) {
      result = addDefineToContext(ctx, src.name, src.location, src.expr);
      if (result instanceof go) {
        ctx = result.result;
      } else {
        throw new Error("" + result.where + result.message);
      }
    } else if (src instanceof SamenessCheck) {
      result = checkSame(ctx, src.location, src.type, src.left, src.right);
      if (result instanceof go) {
        ctx = result.result;
      } else {
        throw new Error("" + result.where + result.message);
      }
    } else {
      result = normType(ctx, src);
      if (result instanceof go) {
        output += prettyPrint(result.result);
      } else {
        throw new Error("" + result.where + result.message);
      }
    }
    return output;
  } 
// import { BasicEvaluator } from "../../conductor/src/conductor/runner";
// import { IRunnerPlugin } from "../../conductor/src/conductor/runner/types";
// import { Parser } from "./parser/parser";
// import { represent } from "./typechecker/represent";
// import { go } from "./types/utils";
// import { initCtx } from "./utils/context";
// import * as C from './types/core';

// export function parsePie(src: string) {
//   return Parser.parsePie(src);
// }

// export class PieEvaluator extends BasicEvaluator {

//   constructor(conductor: IRunnerPlugin) {
//     super(conductor);
//   }

//   async evaluateChunk(chunk: string): Promise<void> {
//     try {
//       const src = parsePie(chunk);
//       const res = (represent(initCtx, src) as go<C.Core>).result.prettyPrint();
//       this.conductor.sendOutput(`FUCK ${res}`);
//     } catch (error) {
//       // Handle errors and send them to the REPL
//       if (error instanceof Error) {
//         this.conductor.sendOutput(`Error: ${error.message}`);
//       } else {
//         this.conductor.sendOutput(`Error: ${String(error)}`);
//       }
//     }
//   }
}