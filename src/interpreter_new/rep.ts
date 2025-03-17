import { Context} from './types/contexts';
import { Source } from './types/source';
import * as Core from './types/core';
import { go, goOn, Perhaps, PerhapsM } from './types/utils';
import { readBack } from './normalize/utils';
import { Renaming } from './typechecker/utils';

export function rep(Γ: Context, e: Source): Perhaps<Core.Core> {
  const outmeta = new PerhapsM<Core.Core>('outmeta');

  return goOn([[outmeta, () => e.synth(Γ, new Renaming(new Map()))]],
    () => {
      const typeCore = (outmeta.value! as Core.The).type;
      const exprCore = (outmeta.value! as Core.The).expr;
      const tv = Γ.valInContext(typeCore)!;
      const v = Γ.valInContext(exprCore)!;
      return new go([new Core.The(tv.readBackType(Γ), readBack(Γ, tv, v))]);
    }
  );
}

export function normType(Γ: Context, src: Source): Perhaps<Core.Core> {
  const eout = new PerhapsM<Core.Core>('eout');
  return goOn(
    [[eout, () => src.isType(Γ, new Renaming())]],
    () => {
      return new go(Γ.valInContext(eout.value!).readBackType(Γ));
    }
  )
}