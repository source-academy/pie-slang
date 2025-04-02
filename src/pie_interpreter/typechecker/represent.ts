import * as C from '../types/core';
import * as V from '../types/value';

import { Context, valInContext} from '../utils/context';
import { Source } from '../types/source';
import { go, goOn, Perhaps, PerhapsM } from '../types/utils';
import { readBack } from '../evaluator/utils';
import { Location } from '../utils/locations';
import { convert } from './utils';

/**
 * Represent the expression in the context.
 */
export function represent(ctx: Context, expr: Source): Perhaps<C.Core> {
  const outmeta = new PerhapsM<C.The>('outmeta');
  return goOn([[outmeta, () => expr.synth(ctx, new Map())]],
    () => {
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

// (: check-same (-> Ctx Loc Src Src Src (Perhaps Void)))
// (define (check-same Γ loc t a b)
//   (go-on ((t-out (is-type Γ '() t))
//           (tv (go (val-in-ctx Γ t-out)))
//           (a-out (check Γ '() a tv))
//           (b-out (check Γ '() b tv))
//           (av (go (val-in-ctx Γ a-out)))
//           (bv (go (val-in-ctx Γ b-out))))
//     (convert Γ loc tv av bv)))

export function checkSame(ctx: Context, where: Location, t: Source, a: Source, b: Source): Perhaps<undefined> {
  const typeOut = new PerhapsM<C.Core>('tOut');
  const typeValue = new PerhapsM<V.Value>('tv');
  const leftOut = new PerhapsM<C.Core>('aOut');
  const rightOut = new PerhapsM<C.Core>('bOut');
  const leftValue = new PerhapsM<V.Value>('av');
  const rightValue = new PerhapsM<V.Value>('bv');
  return goOn(
    [
      [typeOut, () => t.isType(ctx, new Map())],
      [typeValue, () => valInContext(ctx, typeOut.value).readBackType(ctx)],
      [leftOut, () => a.check(ctx, new Map(), typeValue.value)],
      [rightOut, () => b.check(ctx, new Map(), typeValue.value)],
      [leftValue, () => valInContext(ctx, leftOut.value)],
      [rightValue, () => valInContext(ctx, rightOut.value)]
    ],
    () => {
      return convert(ctx, where, typeValue.value, leftValue.value, rightValue.value);
    }
  );
}
