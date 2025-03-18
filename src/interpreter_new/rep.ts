import { Context, valInContext} from './types/contexts';
import { Source } from './types/source';
import * as util from 'util';
import * as C from './types/core';
import { go, goOn, Perhaps, PerhapsM } from './types/utils';
import { readBack } from './normalize/utils';
import { Renaming } from './typechecker/utils';

export function rep(ctx: Context, expr: Source): Perhaps<C.Core> {
  const outmeta = new PerhapsM<C.The>('outmeta');

  return goOn([[outmeta, () => expr.synth(ctx, new Renaming(new Map()))]],
    () => {
      const tv = valInContext(ctx, outmeta.value.type);
      const v = valInContext(ctx, outmeta.value.expr);
      // console.log(expr, "TYPE: ", util.inspect(tv, false, null, true), "VALUE: ", util.inspect(v, false, null, true));
      return new go(
        [new C.The(tv.readBackType(ctx), readBack(ctx, tv, v))]
      );
    }
  );
}

/* export function normType(Γ: Context, src: Source): Perhaps<C.Core> {
  const eout = new PerhapsM<C.Core>('eout');
  return goOn(
    [[eout, () => src.isType(Γ, new Renaming())]],
    () => {
      return new go(Γ.valInContext(eout.value!).readBackType(Γ));
    }
  )
} */