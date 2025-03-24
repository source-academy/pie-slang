import {schemeParse, pieDeclarationParser, Claim, Definition, SamenessCheck} from './parser/parser'
import { checkSame, normType } from './typechecker/represent';
import { go, stop } from './types/utils';
import { prettyPrint } from './unparser/pretty';
import { addClaimToContext, addDefineToContext, Context, initCtx } from './utils/context';
import * as util from 'util';
import { Location } from './utils/locations';


export function evaluatePie(str) {
  const astList = schemeParse(str);
  let ctx = initCtx;
  for (const ast of astList) {
    const src = pieDeclarationParser.parseDeclaration(ast);
    let result;
    if (src instanceof Claim) {
      result = addClaimToContext(ctx, src.name, src.location, src.type);
    } else if (src instanceof Definition) {
      result = addDefineToContext(ctx, src.name, src.location, src.expr);
    } else if (src instanceof SamenessCheck) {
      result = checkSame(ctx, src.location, src.type, src.left, src.right);
    } else {
      result = normType(ctx, src);
      if (result instanceof go) {
        prettyPrint(result.result);
      } 
    }
    if (result instanceof stop) {
      throw new Error("" + result.where + result.message);
    }

  } 
}