import {
  Ctx,
  Src,
  Perhaps,
  Core,
  TSMetaCore,
  goOn,
  go,
  Loc,
  TSMetaValue,
} from './basics';

import {
  synth,
  isType,
  check,
  convert,
} from './typechecker';

import {
  readBack,
  readBackType,
  valInCtx,
} from './normalize';

function rep(Γ: Ctx, e: Src): Perhaps<Core> {
  const outmeta = new TSMetaCore(null, Symbol('outmeta'));
  return goOn([[outmeta, () => synth(Γ, [], e)]],
    () => {
      const tv = valInCtx(Γ, outmeta.value![1])!;
      const v = valInCtx(Γ, outmeta.value![2])!;
      return new go(['the', readBackType(Γ, tv), readBack(Γ, tv, v)]);
    }
  );
}

function normType(Γ: Ctx, src: Src): Perhaps<Core> {
  const eout = new TSMetaCore(null, Symbol('eout'));
  return goOn(
    [[eout, () => isType(Γ, [], src)]],
    () => {
      return new go(readBackType(Γ, valInCtx(Γ, eout.value!)!));
    }
  )
}

function norm(Γ: Ctx, src: Src): Perhaps<Core> {
  const theeout = new TSMetaCore(null, Symbol('theeout'));
  const result = goOn(
    [[theeout, () => synth(Γ, [], src)]],
    () => {
      const tv = valInCtx(Γ, theeout.value![1])!;
      const v = valInCtx(Γ, theeout.value![2])!;
      return new go(['the', readBackType(Γ, tv), readBack(Γ, tv, v)]);
    }
  )
  if (result instanceof go) {
    return result;
  } else {
    const norm = normType(Γ, src);
    if (norm instanceof go) {
      return norm;
    } else {
      return result;
    }
  }
}
function typeOrExpr(Γ: Ctx, e: Src): Perhaps<Ctx> {
  const result = rep(Γ, e);
  if (result instanceof go) {
    (() => {
      return new go(Γ);
    })() as Perhaps<Ctx>;
  } else {
    const norm = normType(Γ, e);
    if (norm instanceof go) {
      (() => {
        return new go(Γ);
      })() as Perhaps<Ctx>;
    } else {
      return result as Perhaps<Ctx>;
    }
  }
  return result as Perhaps<Ctx>;
}
function checkSame(Γ: Ctx, loc: Loc, t: Src, a: Src, b: Src): Perhaps<void> {
  const tout = new TSMetaCore(null, Symbol('tout'));
  const tv = new TSMetaValue(null, Symbol('tv'));
  const aout = new TSMetaCore(null, Symbol('aout'));
  const bout = new TSMetaCore(null, Symbol('bout'));
  const av = new TSMetaValue(null, Symbol('av'));
  const bv = new TSMetaValue(null, Symbol('bv'));
  return goOn(
    [
      [tout, () => isType(Γ, [], t)],
      [tv, () => new go(valInCtx(Γ, tout.value!))],
      [aout, () => check(Γ, [], a, tv.value!)],
      [bout, () => check(Γ, [], b, tv.value!)],
      [av, () => new go(valInCtx(Γ, aout.value!))],
      [bv, () => new go(valInCtx(Γ, bout.value!))],
    ],
    () => convert(Γ, loc, tv.value!, av.value!, bv.value!)
  )
}

export{
  rep,
  normType,
  norm,
  typeOrExpr,
  checkSame,
}