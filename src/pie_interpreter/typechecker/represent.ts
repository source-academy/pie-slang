import { Context, valInContext} from '../utils/context';
import { Source } from '../types/source';
import * as util from 'util';
import * as C from '../types/core';
import { go, goOn, Perhaps, PerhapsM } from '../types/utils';
import { readBack } from '../evaluator/utils';

/**
 * Represent the expression in the context.
 */
export function represent(ctx: Context, expr: Source): Perhaps<C.Core> {
  const outmeta = new PerhapsM<C.The>('outmeta');
  return goOn([[outmeta, () => expr.synth(ctx, new Map())]],
    () => {
      console.log(outmeta.value)
      const tv = valInContext(ctx, outmeta.value.type);
      const v = valInContext(ctx, outmeta.value.expr);
      return new go(
        new C.The(tv.readBackType(ctx), readBack(ctx, tv, v))
      );
    }
  );
}

export function normType(ctx: Context, src: Source): Perhaps<C.Core> {
  const eout = new PerhapsM<C.Core>('eout');
  return goOn(
    [[eout, () => src.isType(ctx, new Map())]],
    () => {
      return new go(valInContext(ctx, eout.value!).readBackType(ctx));
    }
  )
}
