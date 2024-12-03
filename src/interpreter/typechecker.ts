import {
  Loc,
  Core,
  SerializableCtx,
  Ctx,
  Src,
  Perhaps,
  srcStx,
  go,
  freshBinder,
  goOn,
  srcLoc,
  bindFree,
  Binder,
  stop,
  Def,
  Value,
  PI,
  fresh,
  Claim,
  bindVal,
  TSMeta,
  TSMetaValue,
  TSMetaCore,
  N_Var,
  NEU,
  isVarName,
  varType,
  SIGMA,
  LIST,
  EQUAL,
  TSMetaVoid,
  VEC,
  ADD1,
  EITHER,
  FO_CLOS,
  HO_CLOS,
  ctxToEnv,
  MetaVar,
  LIST_CONS,
  SAME,
  LEFT,
  RIGHT,
} from './basics'

import {
  valInCtx,
  now,
  readBack,
  readBackType,
  valOfClosure,
  readBackContext,
  doAp,
  indVecStepType,
  PIType,
} from './normalize'
import { alphaEquiv } from './alpha'
import { isForInfo, Location, locationToSrcLoc, notForInfo } from './locations'

import { match, P } from 'ts-pattern'
import { isForInStatement } from 'typescript'

/*
  ###  Reporting information  ###

  The info hook is a procedure to be called by the type checker to
  report information about the type of an expression.  The info hook
  is called with the position in the source file that it is providing
  information about, and the information.

  The information is one of the following:

   - 'definition, which means that the source position represents a
     defined name. This is used in the interactive slide package to
     enable having the same fonts for defined names as are used in
     The Little Typer.

  - `(binding-site ,TYPE) registers that the position binds a
    variable whose type is TYPE. This is used for tooltips in
    DrRacket as well as in the slides.

  - `(is-type ,TYPE) registers that the position represents the type
    TYPE.

  - `(has-type ,TYPE) registers that the position represents an
    expression with the type TYPE, discovered either through checking
    or synthesis. This is used for tooltips in DrRacket and for
    display in slides.

  - `(TODO ,Γ ,TYPE) registers that the position is a TODO that is
    expected to have the type TYPE in context Γ. This is used for
    tooltips in DrRacket, for the todo-list plugin in DrRacket, and
    for display in slides.
*/

type What = 'definition'
  | ['binding-site', Core]
  | ['is-type', Core]
  | ['has-type', Core]
  | ['TODO', SerializableCtx, Core];

function PieInfoHook(where: Loc, what: What): void {

}

function SendPieInfo(where: Loc, what: What): void {
  if (isForInfo(where)) {
    PieInfoHook(where, what);
  }
}

type Renaming = [symbol: Symbol, renamed: Symbol][];

// Function to rename a symbol using the Renaming list
function rename(r: Renaming, x: Symbol): Symbol {
  const pair = r.find(([symbol]) => symbol.description === x.description);
  return pair ? pair[1] : x;
}

// Function to extend the Renaming list with a new pair
function extendRenaming(r: Renaming, from: Symbol, to: Symbol): Renaming {
  return [[from, to], ...r];
}

function isType(Γ: Ctx, r: Renaming, input: Src): Perhaps<Core> {
  const theType: Perhaps<Core> = match(srcStx(input))
    .with('U', () => new go('U'))
    .with('Nat', () => {
      return new go('Nat');
    })
    .with(['->', P._, P._, P.array()], ([_, A, B, arr]) => {
      if (arr.length === 0) {
        const x = freshBinder(Γ, B, Symbol('x'));
        const Aout = new TSMetaCore(null, Symbol('Aout'));
        const Bout = new TSMetaCore(null, Symbol('Bout'));
        return goOn(
          [[Aout, () => isType(Γ, r, A)],
          [Bout, () => {
            const bf = bindFree(Γ, x, valInCtx(Γ, Aout.value!)!);
            return isType(bf, r, B)
          }],],
          () => {
            return new go(['Π', [[x, Aout.value!]], Bout.value!]);
          }
        );
      } else {
        const [C, ...rest] = arr;
        const x = freshBinder(Γ, makeApp(B, C, rest), Symbol('x'));
        const Aout = new TSMetaCore(null, Symbol('Aout'));
        const tout = new TSMetaCore(null, Symbol('tout'));
        return goOn(
          [[Aout, () => isType(Γ, r, A)],
          [tout, () => isType(bindFree(Γ, x, valInCtx(Γ, Aout.value!)!), r,
            new Src(srcLoc(input), ['->', B, C, rest]))]],
          () => new go(['Π', [[x, Aout.value!]], tout.value!])
        )
      }
    })
    .with(['Π', P._, P._], ([_, arr, B]) => {
      
      if (arr.length === 1) {
        const [bd, A] = arr[0];
        const y = fresh(Γ, bd.varName);
        const xloc = bd.loc;
        const Aout = new TSMetaCore(null, Symbol('Aout'));
        const Aoutv = new TSMetaValue(null, Symbol('Aoutv'));
        const Bout = new TSMetaCore(null, Symbol('Bout'));
        return goOn(
          [
            [Aout, () => isType(Γ, r, A)],
            [Aoutv, () => new go(valInCtx(Γ, Aout.value!)!)],
            [Bout, () => isType(
              bindFree(Γ, y, Aoutv.value!),
              extendRenaming(r, bd.varName, y), B)
            ]
          ],
          (() => {
            PieInfoHook(xloc, ['binding-site', Aout.value!]);
            return new go(['Π', [[y, Aout.value!]], Bout.value!])
          })
        )

      } else if (arr.length > 1) {
        const [[bd, A], [y, A1], ...rest] = arr;
        const xloc = bd.loc;
        const x = bd.varName;
        const z = fresh(Γ, x);
        const Aout = new TSMetaCore(null, Symbol('Aout'));
        const Aoutv = new TSMetaValue(null, Symbol('Aoutv'));
        const Bout = new TSMetaCore(null, Symbol('Bout'));
        return goOn(
          [
            [Aout, () => isType(Γ, r, A)],
            [Aoutv, () => new go(valInCtx(Γ, Aout.value!)!)],
            [Bout, () => 
              isType(
                bindFree(Γ, z, Aoutv.value!),
                extendRenaming(r, x, z),
                new Src(srcLoc(input), ['Π', [[y, A1], ...rest], B])
              )
            ]
          ],
          (() => {
            PieInfoHook(xloc, ['binding-site', Aout.value!]);
            return new go(['Π', [[z, Aout.value!]], Bout.value!])
          })
        )
      }
    })
    .with('Atom', () => new go('Atom'))
    .with(['Pair', P._, P._], ([_, A, D]) => {
      const x = freshBinder(Γ, D, Symbol('x'));
      const Aout = new TSMetaCore(null, Symbol('Aout'));
      const Dout = new TSMetaCore(null, Symbol('Dout'));
      return goOn(
        [[Aout, () => isType(Γ, r, A)],
        [Dout, () => isType(bindFree(Γ, x, valInCtx(Γ, Aout.value!)!), r, D)],],
        () => new go(['Σ', [[x, Aout.value!]], Dout.value!])
      );
    })
    .with(['Σ', P._, P._], ([_, arr, D]) => {
      if (arr.length === 1) {
        const [bd, A] = arr[0];
        const y = fresh(Γ, bd.varName);
        const xloc = bd.loc;
        const Aout = new TSMetaCore(null, Symbol('Aout'));
        const Aoutv = new TSMetaValue(null, Symbol('Aoutv'));
        const Dout = new TSMetaCore(null, Symbol('Dout'));
        return goOn(
          [
            [Aout, () => isType(Γ, r, A)],
            [Aoutv, () => new go(valInCtx(Γ, Aout.value!)!)],
            [Dout, () => isType(bindFree(Γ, y, Aoutv.value!),
              extendRenaming(r, bd.varName, y), D)]
          ],
          (() => {
            PieInfoHook(xloc, ['binding-site', Aout.value!]);
            return new go(['Σ', [[y, Aout.value!]], Dout.value!])
          })
        )
      } else if (arr.length > 1) {
        const [[bd, A], [y, A1], ...rest] = arr;
        const xloc = bd.loc;
        const x = bd.varName;
        const z = fresh(Γ, x);
        const Aout = new TSMetaCore(null, Symbol('Aout'));
        const Aoutv = new TSMetaValue(null, Symbol('Aoutv'));
        const Dout = new TSMetaCore(null, Symbol('Dout'));
        return goOn(
          [
            [Aout, () => isType(Γ, r, A)],
            [Aoutv, () => new go(valInCtx(Γ, Aout.value!)!)],
            [Dout, () => isType(bindFree(Γ, z, Aoutv.value!),
              extendRenaming(r, x, z),
              new Src(srcLoc(input), ['Σ', [[y, A1], ...rest], D]))]
          ],
          (() => {
            PieInfoHook(xloc, ['binding-site', Aout.value!]);
            return new go(['Σ', [[z, Aout.value!]], Dout.value!])
          })
        )
      }
    })
    .with('Trivial', () => new go('Trivial'))
    .with(['List', P._], ([_, E]) => {
      const Eout = new TSMetaCore(null, Symbol('Eout'));
      return goOn(
        [[Eout, () => isType(Γ, r, E)]],
        () => new go(['List', Eout.value!])
      );
    })
    .with('Absurd', () => new go('Absurd'))
    .with(['=', P._, P._, P._], ([_, A, from, to]) => {
      const Aout = new TSMetaCore(null, Symbol('Aout'));
      const Av = new TSMetaValue(null, Symbol('Av'));
      const fromv = new TSMetaCore(null, Symbol('fromv'));
      const tov = new TSMetaCore(null, Symbol('tov'));
      return goOn(
        [
          [Aout, () => isType(Γ, r, A)],
          [Av, () => new go(valInCtx(Γ, Aout.value!)!)],
          [fromv, () => check(Γ, r, from, Av.value!)],
          [tov, () => check(Γ, r, to, Av.value!)],
        ],
        () => new go(['=', Aout.value!, fromv.value!, tov.value!])
      );
    })
    .with(['Vec', P._, P._], ([_, E, len]) => {
      const Eout = new TSMetaCore(null, Symbol('Eout'));
      const lenout = new TSMetaCore(null, Symbol('lenout'));
      return goOn(
        [
          [Eout, () => isType(Γ, r, E)],
          [lenout, () => check(Γ, r, len, 'NAT')],
        ],
        () => new go(['Vec', Eout.value!, lenout.value!])
      );
    })
    .with(['Either', P._, P._], ([_, L, R]) => {
      const Lout = new TSMetaCore(null, Symbol('Lout'));
      const Rout = new TSMetaCore(null, Symbol('Rout'));
      return goOn(
        [
          [Lout, () => isType(Γ, r, L)],
          [Rout, () => isType(Γ, r, R)],
        ],
        () => new go(['Either', Lout.value!, Rout.value!])
      );
    })
    .otherwise(other => {
      const result = check(Γ, r, new Src(srcLoc(input), other), 'UNIVERSE');
      if (result instanceof go) {
        return result;
      } else if ((typeof other === 'symbol') && (isVarName(other))) {
        const othertv = new TSMetaValue(null, Symbol('othertv'));
        return goOn(
          [[othertv, () => varType(Γ, srcLoc(input), other)!]],
          () => new stop(srcLoc(input), [`Expected U but got ${othertv.value!}.`])
        )
      } else {
        return new stop(srcLoc(input), [`Not a type`]);
      }
    }
    )!;
  const t = new TSMetaCore(null, Symbol('t'));
  return goOn([[t, () => theType]],
    (() => {
      SendPieInfo(srcLoc(input), ['is-type', t.value!]);
      return new go(t.value!);
    })
  );
}

// ### Check the form of judgment Γ ⊢ e synth ↝ (the c c)
function synth(Γ: Ctx, r: Renaming, e: Src): Perhaps<['the', Core, Core]> {
  const theExpr = match(srcStx(e))
    .with('Nat', () => new go(['the', 'U', 'Nat']))
    .with('U', () => new stop(srcLoc(e), ["U is a type, but it does not have a type."]))
    .with(['->', P._, P._, P.array()], ([_, A, B, arr]) => {
      if (arr.length === 0) {
        const z = freshBinder(Γ, B, Symbol('x'));
        const Aout = new TSMetaCore(null, Symbol('Aout'));
        const Bout = new TSMetaCore(null, Symbol('Bout'));
        return goOn(
          [[Aout, () => check(Γ, r, A, 'UNIVERSE')],
          [Bout, () => check(bindFree(Γ, z, valInCtx(Γ, Aout.value!)!),
            r, B, 'UNIVERSE')],],
          (() => {
            return new go(['the', 'U', ['Π', [[z, Aout.value!]], Bout.value!]])
          })
        );
      } else {
        const [C, ...rest] = arr;
        const z = freshBinder(Γ, makeApp(B, C, rest), Symbol('x'));
        const Aout = new TSMetaCore(null, Symbol('Aout'));
        const tout = new TSMetaCore(null, Symbol('tout'));
        return goOn(
          [
            [Aout, () => check(Γ, r, A, 'UNIVERSE')],
            [tout, () => check(
              bindFree(Γ, z, valInCtx(Γ, Aout.value!)!),
              r,
              new Src(notForInfo(srcLoc(e)), ['->', B, C, rest]),
              'UNIVERSE'
            )
            ]
          ],
          (() => {
            return new go(['the', 'U', ['Π', [[z, Aout.value!]], tout.value!]])
          }))
      }
    })
    .with(['Π', P._, P._], ([_, arr, B]) => {
      if (arr.length === 1) {
        const [bd, A] = arr[0];
        const xhat = fresh(Γ, bd.varName);
        const xloc = bd.loc;
        const Aout = new TSMetaCore(null, Symbol('Aout'));
        const Bout = new TSMetaCore(null, Symbol('Bout'));
        return goOn(
          [
            [Aout, () => check(Γ, r, A, 'UNIVERSE')],
            [Bout, () => check(bindFree(Γ, xhat, valInCtx(Γ, Aout.value!)!),
              extendRenaming(r, bd.varName, xhat), B, 'UNIVERSE')],
          ],
          (() => {
            PieInfoHook(xloc, ['binding-site', Aout.value!]);
            return new go(['the', 'U', ['Π', [[xhat, Aout.value!]], Bout.value!]]);
          })
        )
      } else if (arr.length > 1) {
        const [[bd, A], [y, A1], ...rest] = arr;
        const xloc = bd.loc;
        const x = bd.varName;
        const xhat = fresh(Γ, x);
        const Aout = new TSMetaCore(null, Symbol('Aout'));
        const Bout = new TSMetaCore(null, Symbol('Bout'));
        return goOn(
          [
            [Aout, () => check(Γ, r, A, 'UNIVERSE')],
            [Bout, () => check(bindFree(Γ, xhat, valInCtx(Γ, Aout.value!)!),
              extendRenaming(r, x, xhat),
              new Src(notForInfo(srcLoc(e)), ['Π', [[y, A1], ...rest], B]),
              'UNIVERSE')],
          ],
          (() => {
            PieInfoHook(xloc, ['binding-site', Aout.value!]);
            return new go(['the', 'U', ['Π', [[xhat, Aout.value!]], Bout.value!]])
          })
        )
      }
    })
    .with('zero', () => new go(['the', 'Nat', 'zero']))
    .with(['add1', P._], ([_, n]) => {
      const nout = new TSMetaCore(null, Symbol('nout'));
      return goOn(
        [[nout, () => check(Γ, r, n, 'NAT')]],
        () => new go(['the', 'Nat', ['add1', nout.value!]])
      );
    })
    .with(['which-Nat', P._, P._, P._], ([_, tgt, b, s]) => {
      const tgtout = new TSMetaCore(null, Symbol('tgtout'));
      const b_rst = new TSMetaCore(null, Symbol('b_rst'));
      const sout = new TSMetaCore(null, Symbol('sout'));
      return goOn([
        [tgtout, () => check(Γ, r, tgt, 'NAT')],
        [b_rst, () => synth(Γ, r, b)],
        [sout, () => check(Γ, r, s,
          (() => {
            const n_minus_1 = fresh(Γ, Symbol('n_minus_1'));
            return new PI(n_minus_1, 'NAT', new FO_CLOS(ctxToEnv(Γ), n_minus_1, b_rst.value![1]));
          })()
        )],
      ],
        () =>
          new go(
            ['the', b_rst.value![1],
              ['which-Nat', tgtout.value!, ['the', b_rst.value![1], b_rst.value![2]], sout.value!]
            ]
          ));
    })
    .with(['iter-Nat', P._, P._, P._], ([_, tgt, b, s]) => {
      const tgtout = new TSMetaCore(null, Symbol('tgtout'));
      const b_rst = new TSMetaCore(null, Symbol('b_rst'));
      const sout = new TSMetaCore(null, Symbol('sout'));
      return goOn([
        [tgtout, () => check(Γ, r, tgt, 'NAT')],
        [b_rst, () => synth(Γ, r, b)],
        [sout, () => check(Γ, r, s,
          (() => {
            const old = fresh(Γ, Symbol('old'));
            return valInCtx(Γ, ['Π', [[old, b_rst.value![1]]], b_rst.value![1]])!;
          })()
        )],
      ],
        () =>
          new go(
            ['the', b_rst.value![1],
              ['iter-Nat', tgtout.value!, ['the', b_rst.value![1], b_rst.value![2]], sout.value!]
            ]
          ));
    })
    .with(['rec-Nat', P._, P._, P._], ([_, tgt, b, s]) => {
      const tgtout = new TSMetaCore(null, Symbol('tgtout'));
      const b_rst = new TSMetaCore(null, Symbol('b_rst'));
      const sout = new TSMetaCore(null, Symbol('sout'));
      return goOn([
        [tgtout, () => check(Γ, r, tgt, 'NAT')],
        [b_rst, () => synth(Γ, r, b)],
        [sout, () => check(Γ, r, s,
          (() => {
            const n_minus_1 = fresh(Γ, Symbol('n_minus_1'));
            const old = fresh(Γ, Symbol('old'));
            return valInCtx(Γ, ['Π', [[n_minus_1, 'Nat']], ['Π', [[old, b_rst.value![1]]], b_rst.value![1]]])!;
          })()
        )],
      ],
        () =>
          new go(
            ['the', b_rst.value![1],
              ['rec-Nat', tgtout.value!, ['the', b_rst.value![1], b_rst.value![2]], sout.value!]
            ]
          ));
    })
    .with(['ind-Nat', P._, P._, P._, P._], ([_, tgt, mot, b, s]) => {
      const tgtout = new TSMetaCore(null, Symbol('tgtout'));
      const motout = new TSMetaCore(null, Symbol('motout'));
      const motval = new TSMetaValue(null, Symbol('motval'));
      const bout = new TSMetaCore(null, Symbol('bout'));
      const sout = new TSMetaCore(null, Symbol('sout'));
      return goOn([
        [tgtout, () => check(Γ, r, tgt, 'NAT')],
        [motout, () => check(Γ, r, mot, new PI(Symbol('n'), 'NAT', new HO_CLOS((n) => 'UNIVERSE')))],
        [motval, () => new go(valInCtx(Γ, motout.value!)!)],
        [bout, () => check(Γ, r, b, doAp(motval.value!, 'ZERO')!)],
        [sout, () => {
          const n_minus_1 = new MetaVar(null, 'NAT', Symbol('n_minus_1'));
          const ih = new MetaVar(null, doAp(motval.value!, 'NAT')!, Symbol('ih'));
          return check(Γ, r, s,
            PIType([
              [n_minus_1.name, n_minus_1.varType],
              [ih.name, ih.varType]
            ],
              doAp(motval, new ADD1(n_minus_1))!)!
          )
        }
        ],
      ],
        () =>
          new go(
            ['the', [motout.value!, tgtout.value!,],
              ['ind-Nat', tgtout.value!, motout.value!, bout.value!, sout.value!]
            ]
          ));
    })
    .with('Atom', () => new go(['the', 'U', 'Atom']))
    .with(['Pair', P._, P._], ([_, A, D]) => {
      const a = fresh(Γ, Symbol('a'));
      const Aout = new TSMetaCore(null, Symbol('Aout'));
      const Dout = new TSMetaCore(null, Symbol('Dout'));
      return goOn(
        [
          [Aout, () => check(Γ, r, A, 'UNIVERSE')],
          [Dout, () => check(bindFree(Γ, a, valInCtx(Γ, Aout.value!)!), r, D, 'UNIVERSE')],
        ],
        () => new go(['the', 'U', ['Σ', [[a, Aout.value!]], Dout.value!]])
      );
    })
    .with(['Σ', P._, P._], ([_, arr, D]) => {
      if (arr.length === 1) {
        const [bd, A] = arr[0];
        const xloc = bd.loc;
        const x = bd.varName;
        const xhat = fresh(Γ, x);
        const Aout = new TSMetaCore(null, Symbol('Aout'));
        const Dout = new TSMetaCore(null, Symbol('Dout'));
        return goOn(
          [
            [Aout, () => check(Γ, r, A, 'UNIVERSE')],
            [Dout, () => check(bindFree(Γ, xhat, valInCtx(Γ, Aout.value!)!),
              extendRenaming(r, bd.varName, xhat), D, 'UNIVERSE')],
          ],
          (() => {
            PieInfoHook(xloc, ['binding-site', Aout.value!]);
            return new go(['the', 'U', ['Σ', [[xhat, Aout.value!]], Dout.value!]])
          })
        )
      } else if (arr.length > 1) {
        const [[bd, A], [y, A1], ...rest] = arr;
        const xloc = bd.loc;
        const x = bd.varName;
        const xhat = fresh(Γ, x);
        const Aout = new TSMetaCore(null, Symbol('Aout'));
        const Dout = new TSMetaCore(null, Symbol('Dout'));
        return goOn(
          [
            [Aout, () => check(Γ, r, A, 'UNIVERSE')],
            [Dout, () => check(bindFree(Γ, xhat, valInCtx(Γ, Aout.value!)!),
              extendRenaming(r, x, xhat),
              new Src(notForInfo(srcLoc(e)), ['Σ', [[y, A1], ...rest], D]),
              'UNIVERSE')],
          ],
          (() => {
            PieInfoHook(xloc, ['binding-site', Aout.value!]);
            return new go(['the', 'U', ['Σ', [[xhat, Aout.value!]], Dout.value!]])
          })
        )
      }
    })
    .with(['car', P._], ([_, p]) => {
      const p_rst = new TSMetaCore(null, Symbol('p_rst'));
      return goOn(
        [[p_rst, () => synth(Γ, r, p)]],
        () => {
          const val = valInCtx(Γ, p_rst.value![1])!;
          if (val instanceof SIGMA) {
            const [x, A, clos] = [val.carName, val.carType, val.cdrType];
            return new go(['the', readBackType(Γ, A), ['car', p_rst.value![2]]]);
          } else {
            return new stop(srcLoc(e), [`car requires a Pair type, but was used as a: ${readBackType(Γ, val)}.`]);
          }
        }
      )
    })
    .with(['cdr', P._], ([_, p]) => {
      const p_rst = new TSMetaCore(null, Symbol('p_rst'));
      return goOn(
        [[p_rst, () => synth(Γ, r, p)]],
        () => {
          const result = valInCtx(Γ, p_rst.value![1])!;
          if (result instanceof SIGMA) {
            const [x, A, clos] = [result.carName, result.carType, result.cdrType];
            return new go(['the', valOfClosure(clos, new NEU(A, new N_Var(x)))!, ['cdr', p_rst.value![2]]]);
          } else {
            return new stop(srcLoc(e), [`cdr requires a Pair type, but was used as a: ${readBackType(Γ, result)}.`]);
          }
        }
      )
    })
    .with(['quote', P._], ([_, a]) => {
      if (atomOk(a)) {
        return new go(['the', 'Atom', ['quote', a]]);
      } else return new stop(srcLoc(e), ['Atoms consist of letters and hyphens.']);
    })
    .with(['Trivial'], (_) => new go(['the', 'U', 'Trivial']))
    .with(['sole'], (_) => new go(['the', 'Trivial', 'sole']))
    .with(['ind-List', P._, P._, P._, P._], ([_, tgt, mot, b, s]) => {
      const themeta = new TSMetaCore(null, Symbol('themeta'));
      const motout = new TSMetaCore(null, Symbol('motout'));
      const motval = new TSMetaValue(null, Symbol('motval'));
      const bout = new TSMetaCore(null, Symbol('bout'));
      const sout = new TSMetaCore(null, Symbol('sout'));
      return goOn(
        [
          [themeta, () => synth(Γ, r, tgt)],
        ],
        (() => {
          const mtc = valInCtx(Γ, themeta.value![1])!;
          if (mtc instanceof LIST) {
            const E = mtc.entryType;
            const e = new MetaVar(null, E, Symbol('e'));
            const es = new MetaVar(null, new LIST(E), Symbol('es'));
            const ih = new MetaVar(null, doAp(motval.value!, es)!, Symbol('ih'));
            return goOn([
              [
                motout,
                () => check(Γ, r, mot,
                  new PI(Symbol('xs'), new LIST(E), new FO_CLOS(ctxToEnv(Γ), Symbol('xs'), 'U')))
              ],
              [motval, () => new go(valInCtx(Γ, motout.value!)!)],
              [bout, () => check(Γ, r, b, doAp(motval.value!, 'NIL')!)],
              [sout, () => check(Γ, r, s,
                PIType([
                  [e.name, e.varType],
                  [es.name, es.varType],
                  [ih.name, ih.varType],
                ],
                  doAp(motval.value!, new LIST_CONS(e.value!, es.value!))!
                )
              )],
            ],
              () =>
                new go(
                  ['the', [motout.value!, themeta.value![2]],
                    ['ind-List', themeta.value![2], motout.value!, bout.value!, sout.value!]
                  ]
                )
            );
          } else {
            return new stop(srcLoc(e), [`Not a List: ${readBackType(Γ, mtc)}.`]);
          }
        })()
      );
    })
    .with(['rec-List', P._, P._, P._], ([_, tgt, b, s]) => {
      const tgtt = new TSMetaCore(null, Symbol('tgtt'));
      const tgtout = new TSMetaCore(null, Symbol('tgtout'));
      const themeta = new TSMetaCore(null, Symbol('themeta'));
      return goOn(
        [[themeta, () => synth(Γ, r, tgt)]],
        (() => {
          const mtc = valInCtx(Γ, themeta.value![1])!;
          if (mtc instanceof LIST) {
            const E = mtc.entryType;
            const themeta_2 = new TSMetaCore(null, Symbol('themeta_2'));
            const btval = new TSMetaValue(null, Symbol('btval'));
            const sout = new TSMetaCore(null, Symbol('sout'));
            const e = new MetaVar(null, E, Symbol('e'));
            const es = new MetaVar(null, new LIST(E), Symbol('es'));
            const ih = new MetaVar(null, btval, Symbol('ih'));
            return goOn([
              [themeta_2, () => synth(Γ, r, b)],
              [btval, () => new go(valInCtx(Γ, themeta_2.value![1])!)],
              [sout,
                () => check(Γ, r, s,
                  PIType([
                    [e.name, e.varType],
                    [es.name, es.varType],
                    [ih.name, ih.varType],
                  ],
                    btval.value!
                  )
                )
              ]],
              () =>
                new go(
                  ['the', themeta_2.value![1],
                    ['rec-List', themeta.value![2], ['the', themeta_2.value![1]], sout.value!]
                  ]
                )
            );
          }
        })()
      );
    })
    .with(['List', P._], ([_, E]) => {
      const Eout = new TSMetaCore(null, Symbol('Eout'));
      return goOn(
        [[Eout, () => check(Γ, r, E, 'UNIVERSE')]],
        () => new go(['the', 'U', ['List', Eout.value!]])
      );
    })
    .with(['::', P._, P._], ([_, e, es]) => {
      const e_rst = new TSMetaCore(null, Symbol('e_rst'));
      const esout = new TSMetaCore(null, Symbol('esout'));
      return goOn(
        [
          [e_rst, () => synth(Γ, r, e)],
          [esout, () => check(Γ, r, es, valInCtx(Γ, ['List', e_rst.value![1]])!)]
        ],
        () => new go(['the', ['List', e_rst.value![1]], ['::', e_rst.value!, esout.value!]])
      )
    })
    .with('Absurd', () => new go(['the', 'U', 'Absurd']))
    .with(['ind-Absurd', P._, P._], ([_, tgt, mot]) => {
      const tgtout = new TSMetaCore(null, Symbol('tgtout'));
      const motout = new TSMetaCore(null, Symbol('motout'));
      return goOn([
        [tgtout, () => check(Γ, r, tgt, 'ABSURD')],
        [motout, () => check(Γ, r, mot, 'UNIVERSE')],
      ],
        () =>
          new go(
            ['the', motout.value!,
              ['ind-Absurd', tgtout.value!, motout.value!]
            ]
          ));
    })
    .with(['=', P._, P._, P._], ([_, A, from, to]) => {
      const Aout = new TSMetaCore(null, Symbol('Aout'));
      const Av = new TSMetaValue(null, Symbol('Av'));
      const from_out = new TSMetaCore(null, Symbol('fromv'));
      const to_out = new TSMetaCore(null, Symbol('tov'));
      return goOn(
        [
          [Aout, () => check(Γ, r, A, 'UNIVERSE')],
          [Av, () => new go(valInCtx(Γ, Aout.value!)!)],
          [from_out, () => check(Γ, r, from, Av.value!)],
          [to_out, () => check(Γ, r, to, Av.value!)],
        ],
        () =>
          new go(['the', 'U', ['=', Av.value!, from_out.value!, to_out.value!]])
      );
    })
    .with(['replace', P._, P._, P._], ([_, tgt, mot, b]) => {
      const tgt_rst = new TSMetaCore(null, Symbol('tgt_rst'));
      const motout = new TSMetaCore(null, Symbol('motout'));
      const bout = new TSMetaCore(null, Symbol('bout'));
      return goOn(
        [[tgt_rst, () => synth(Γ, r, tgt)]],
        () => {
          const result = valInCtx(Γ, tgt_rst.value![1])!;
          if (result instanceof EQUAL) {
            const [Av, fromv, tov] = [result.type, result.from, result.to];
            const x = new MetaVar(null, Av, Symbol('x'));
            return goOn(
              [
                [motout, () => check(Γ, r, mot, PIType([[x.name, x.varType]], 'UNIVERSE'))],
                [bout, () => check(Γ, r, b, doAp(valInCtx(Γ, motout.value!)!, fromv)!)],
              ],
              () => new go(['the',
                readBackType(Γ, doAp(valInCtx(Γ, motout.value!)!, tov)!),
                ['replace', tgt_rst.value![2], motout.value!, bout.value!]])
            );
          } else {
            return new stop(srcLoc(e), [`Expected an expression with = type, but the type was: ${tgt_rst.value![1]}.`]);
          }
        }
      );
    })
    .with(['trans', P._, P._], ([_, p1, p2]) => {
      const p1_rst = new TSMetaCore(null, Symbol('p1_rst'));
      const p2_rst = new TSMetaCore(null, Symbol('p2_rst'));
      return goOn(
        [
          [p1_rst, () => synth(Γ, r, p1)],
          [p2_rst, () => synth(Γ, r, p2)],
        ],
        () => {
          const result1 = valInCtx(Γ, p1_rst.value![1])!;
          const result2 = valInCtx(Γ, p2_rst.value![1])!;
          if (result1 instanceof EQUAL && result2 instanceof EQUAL) {
            const [Av, fromv, midv] = [result1.type, result1.from, result1.to];
            const [Bv, midv2, tov] = [result2.type, result2.from, result2.to];
            const ph1 = new TSMetaVoid(null, Symbol('ph1'));
            const ph2 = new TSMetaVoid(null, Symbol('ph2'));
            return goOn(
              [
                [ph1, () => sameType(Γ, srcLoc(e), Av, Bv)],
                [ph2, () => convert(Γ, srcLoc(e), Av, midv, midv2)!],
              ],
              () => new go(['the',
                readBackType(Γ, new EQUAL(Av, fromv, tov)),
                ['trans', p1_rst.value![2], p2_rst.value![2]]])
            )
          } else {
            return new stop(srcLoc(e), [`Expcted =, got ${readBackType(Γ, result1)} 
              and ${readBackType(Γ, result2)}.`]);
          }
        });
    })
    .with(['cong', P._, P._], ([_, p, f]) => {
      const p_rst = new TSMetaCore(null, Symbol('p_rst'));
      const f_rst = new TSMetaCore(null, Symbol('f_rst'));
      return goOn(
        [
          [p_rst, () => synth(Γ, r, p)],
          [f_rst, () => synth(Γ, r, f)],
        ],
        () => {
          const result1 = valInCtx(Γ, p_rst.value![1])!;
          const result2 = valInCtx(Γ, f_rst.value![1])!;
          if (result1 instanceof EQUAL) {
            const [Av, fromv, tov] = [result1.type, result1.from, result1.to];
            if (result2 instanceof PI) {
              const [x, Bv, c] = [result2.argName, result2.argType, result2.resultType];
              const ph = new TSMetaVoid(null, Symbol('ph'));
              const Cv = new TSMetaValue(null, Symbol('Cv'));
              const fv = new TSMetaValue(null, Symbol('fv'));
              return goOn(
                [
                  [ph, () => sameType(Γ, srcLoc(e), Av, Bv)],
                  [Cv, () => new go(valOfClosure(c, fromv))],
                  [fv, () => new go(valInCtx(Γ, f_rst.value![2])!)],
                ],
                () => new go(['the',
                  ['=',
                    readBackType(Γ, Cv.value!),
                    readBack(Γ, Cv.value!, doAp(fv.value!, fromv)!),
                    readBack(Γ, Cv.value!, doAp(fv.value!, tov)!),
                  ],
                  ['cong', p_rst.value![2], readBackType(Γ, Cv.value!), f_rst.value![2]]
                ]))
            } else {
              return new stop(srcLoc(e), [`Expected a function type, got ${readBackType(Γ, result2)}.`]);
            }
          } else {
            return new stop(srcLoc(e), [`Expected an = type, got ${readBackType(Γ, result1)}.`]);
          }
        }
      )
    })
    .with(['symm', P._], ([_, p]) => {
      const p_rst = new TSMetaCore(null, Symbol('p_rst'));
      return goOn(
        [[p_rst, () => synth(Γ, r, p)]],
        () => {
          const result = valInCtx(Γ, p_rst.value![1])!;
          if (result instanceof EQUAL) {
            const [Av, fromv, tov] = [result.type, result.from, result.to];
            return new go(['the', readBackType(Γ, new EQUAL(Av, tov, fromv)),
              ['symm', p_rst.value![2]]]);
          } else {
            return new stop(srcLoc(e), [`Expected an = type, got ${readBackType(Γ, result)}.`]);
          }
        }
      );
    })
    .with(['ind-=', P._, P._, P._], ([_, tgt, mot, base]) => {
      const tgt_rst = new TSMetaCore(null, Symbol('tgt_rst'));
      const motout = new TSMetaCore(null, Symbol('motout'));
      const motv = new TSMetaValue(null, Symbol('motv'));
      const baseout = new TSMetaCore(null, Symbol('baseout'));
      return goOn(
        [[tgt_rst, () => synth(Γ, r, tgt)]],
        () => {
          const result = valInCtx(Γ, tgt_rst.value![1])!;
          if (result instanceof EQUAL) {
            const [Av, fromv, tov] = [result.type, result.from, result.to];
            const to = new MetaVar(null, Av, Symbol('to'));
            const p = new MetaVar(null, new EQUAL(Av, fromv, to.value!), Symbol('p'));
            return goOn([
              [motout, () => check(Γ, r, mot, PIType([[to.name, to.varType],
              [p.name, p.varType]], 'UNIVERSE'))],
              [motv, () => new go(valInCtx(Γ, motout.value!)!)],
              [baseout, () => check(Γ, r, base,
                doAp(doAp(motv.value!, fromv)!, new SAME(fromv))!)],
            ],
              () =>
                new go(
                  ['the', motv.value!,
                    ['ind-=', tgt_rst.value![2], motout.value!, baseout.value!]
                  ]
                )
            );
          } else {
            return new stop(srcLoc(e), [`Expected evidence of equality, got 
              ${readBackType(Γ, result)}.`]);
          }
        }
      );
    })
    .with(['Vec', P._, P._], ([_, E, len]) => {
      const Eout = new TSMetaCore(null, Symbol('Eout'));
      const lenout = new TSMetaCore(null, Symbol('lenout'));
      return goOn(
        [[Eout, () => check(Γ, r, E, 'UNIVERSE')],
        [lenout, () => check(Γ, r, len, 'NAT')]],
        () => new go(['the', 'U', ['Vec', Eout.value!, lenout.value!]])
      );
    })
    .with(['head', P._], ([_, es]) => {
      const es_rst = new TSMetaCore(null, Symbol('es_rst'));
      return goOn(
        [[es_rst, () => synth(Γ, r, es)]],
        () => {
          const result = now(valInCtx(Γ, es_rst.value![1])!);
          if (result instanceof VEC) {
            const [Ev, len] = [result.entryType, result.length];
            //TODO: !!
            if (len instanceof ADD1) {
              return new go(['the', readBackType(Γ, Ev), ['head', es_rst.value![2]]]);
            } else {
              return new stop(srcLoc(e), [`Expected a Vec with add1 at the top of the length, got: 
                                                ${readBack(Γ, "NAT", len)}.`]);
            }
          } else {
            return new stop(srcLoc(e), [`Expected a Vec type, got: ${readBackType(Γ, result)}.`]);
          }
        }
      )
    })
    .with(['tail', P._], ([_, es]) => {
      const es_rst = new TSMetaCore(null, Symbol('es_rst'));
      return goOn(
        [[es_rst, () => synth(Γ, r, es)]],
        () => {
          const result = now(valInCtx(Γ, es_rst.value![1])!);
          if (result instanceof VEC) {
            const [Ev, len] = [result.entryType, result.length];
            if (len instanceof ADD1) {
              const len_minus_1 = len.smaller;
              return new go(['the', ['Vec', readBackType(Γ, Ev)!,
                readBack(Γ, "NAT", len_minus_1)],
                ['tail', es_rst.value![2]]]);

            } else {
              return new stop(srcLoc(e), [`Expected a Vec with add1 at the top of the length, got: 
                                                ${readBack(Γ, "NAT", len)}.`]);
            }
          } else {
            return new stop(srcLoc(e), [`Expected a Vec type, got: ${readBackType(Γ, result)}.`]);
          }
        }
      )
    })
    .with(['ind-Vec', P._, P._, P._, P._, P._], ([_, len, vec, mot, b, s]) => {
      const lenout = new TSMetaCore(null, Symbol('lenout'));
      const lenv = new TSMetaValue(null, Symbol('lenv'));
      const themeta = new TSMetaCore(null, Symbol('themeta'));
      return goOn(
        [
          [lenout, () => check(Γ, r, len, 'NAT')],
          [lenv, () => new go(valInCtx(Γ, lenout.value!)!)],
          [themeta, () => synth(Γ, r, vec)],
        ],
        () => {
          const k = new MetaVar(null, 'NAT', Symbol('k'));
          const es = new MetaVar(null, new VEC(valInCtx(Γ, themeta.value![1])!, k), Symbol('es'));
          const mtc = valInCtx(Γ, themeta.value![1])!;
          if (mtc instanceof VEC) {
            const Ev = mtc.entryType;
            const len2v = mtc.length;
            const k = new MetaVar(null, 'NAT', Symbol('k'));
            const es = new MetaVar(null, new VEC(Ev, k), Symbol('es'));
            const motout = new TSMetaCore(null, Symbol('motout'));
            const motval = new TSMetaValue(null, Symbol('motval'));
            const bout = new TSMetaCore(null, Symbol('bout'));
            const sout = new TSMetaCore(null, Symbol('sout'));
            return goOn(
              [
                [new TSMetaCore(null, Symbol('_')),
                () => convert(Γ, srcLoc(vec), 'NAT', lenv.value!, len2v)
                ],
                [motout, () => check(Γ, r, mot,
                  PIType([[k.name, k.varType], [es.name, es.varType]], 'UNIVERSE'))
                ],
                [motval, () => new go(valInCtx(Γ, motout.value!)!)],
                [bout, () => check(Γ, r, b, doAp(doAp(motval.value!, 'ZERO')!, 'VECNIL')!)],
                [sout, () => check(Γ, r, s, indVecStepType(Ev, motval.value!))],
              ],
              () => new go(
                ['the',
                  [[motout.value!, lenout.value!], themeta.value![2]],
                  ['ind-Vec',
                    lenout.value!,
                    themeta.value![2],
                    motout.value!,
                    bout.value!,
                    sout.value!
                  ]
                ]
              )
            );
          } else {
            return new stop(srcLoc(e),
              [`Expected a Vec, but got: ${readBackType(Γ, mtc)}.`]
            );
          }
        }
      );
    })
    .with(['Either', P._, P._], ([_, L, R]) => {
      const Lout = new TSMetaCore(null, Symbol('Lout'));
      const Rout = new TSMetaCore(null, Symbol('Rout'));
      return goOn(
        [
          [Lout, () => check(Γ, r, L, 'UNIVERSE')],
          [Rout, () => check(Γ, r, R, 'UNIVERSE')],
        ],
        () => new go(['the', 'U', ['Either', Lout.value!, Rout.value!]])
      );
    })
    .with(['ind-Either', P._, P._, P._, P._], ([_, tgt, mot, L, R]) => {
      const themeta = new TSMetaCore(null, Symbol('themeta'));
      const motout = new TSMetaCore(null, Symbol('motout'));
      const motval = new TSMetaValue(null, Symbol('motval'));
      const lout = new TSMetaCore(null, Symbol('lout'));
      const rout = new TSMetaCore(null, Symbol('rout'));
      return goOn(
        [[themeta, () => synth(Γ, r, tgt)]],
        () => {
          const mtc = valInCtx(Γ, themeta.value![1])!;
          if (mtc instanceof EITHER) {
            const Lv = mtc.leftType;
            const Rv = mtc.rightType;
            const x1 = new MetaVar(null, Lv, Symbol('x1'));
            const x2 = new MetaVar(null, Rv, Symbol('x2'));
            const x3 = new MetaVar(null, new EITHER(Lv, Rv), Symbol('x3'));
            return goOn(
              [
                [motout, () => check(Γ, r, mot, PIType([[x3.name, x3.varType]], 'UNIVERSE'))],
                [motval, () => new go(valInCtx(Γ, motout.value!)!)],
                [lout, () => check(Γ, r, L, PIType([[x1.name, x1.varType]], doAp(motval.value!, new LEFT(x1))!))],
                [rout, () => check(Γ, r, R, PIType([[x2.name, x2.varType]], doAp(motval.value!, new RIGHT(x2))!))],
              ],
              () => new go(
                ['the', [motout.value!, themeta.value![2]],
                  ['ind-Either', themeta.value![2], motout.value!, lout.value!, rout.value!]
                ]
              )
            );
          } else {
            return new stop(srcLoc(e),
              [`Expected an Either, but got a: ${readBackType(Γ, mtc)}.`]
            );
          }
        }
      );
    })
    .with(['the', P._, P._], ([_, t, e]) => {
      const tout = new TSMetaCore(null, Symbol('tout'));
      const eout = new TSMetaCore(null, Symbol('eout'));
      return goOn(
        [
          [tout, () => isType(Γ, r, t)],
          [eout, () => {
            return check(Γ, r, e, valInCtx(Γ, tout.value!)!)
          }],
        ],
        () => new go(['the', tout.value!, eout.value!])
      );
    })
    .with([P._, P._, P.array()], ([rator, rand, last]) => {
      if (rand instanceof Src && Array.isArray(last)) {
        if (last.length === 0) {
          if (rator instanceof Src) {
            const therator = new TSMetaCore(null, Symbol('therator'));
            return goOn(
              [[therator, () => synth(Γ, r, rator)]],
              () => {
                const result = valInCtx(Γ, therator.value![1])!;
                if (result instanceof PI) {
                  const [x, A, c] = [result.argName, result.argType, result.resultType];
                  const randout = new TSMetaCore(null, Symbol('randout'));
                  return goOn(
                    [[randout, () => check(Γ, r, rand, A)]],
                    () => new go(['the', readBackType(Γ, valOfClosure(c, valInCtx(Γ, randout.value!)!)!), [therator.value![2], randout.value!]])
                  );
                } else {
                  return new stop(srcLoc(e), [`Not a function type: ${readBackType(Γ, result)}.`]);
                }
              }
            );
          }
        } else {
          if (last.every(item => item instanceof Src)) {
            const appmeta = new TSMetaCore(null, Symbol('appmeta'));
            return goOn(
              [[appmeta, () => synth(Γ, r, new Src(srcLoc(e), [rator, rand, last]))]],
              () => {
                const result = valInCtx(Γ, appmeta.value![1])!;
                if (result instanceof PI) {
                  const [x, A, c] = [result.argName, result.argType, result.resultType];
                  const randout = new TSMetaCore(null, Symbol('randout'));
                  return goOn(
                    [[randout, () => check(Γ, r, rand, A)]],
                    () => new go(['the', readBackType(Γ, valOfClosure(c, valInCtx(Γ, randout.value!)!)!), [appmeta.value![2], randout.value!]])
                  );
                } else {
                  return new stop(srcLoc(e), [`Not a function type: ${readBackType(Γ, result)}.`]);
                }
              }
            );
          }
        }
      }
    })
    
    .otherwise(x => {
      if (typeof x === 'symbol' && isVarName(x)) {
        const realx = rename(r, x);
        const xtv = new TSMetaValue(null, Symbol('xtv'));
        return goOn(
          [[xtv, () => varType(Γ, srcLoc(e), realx)]],
          () => {
            const result = Γ.find(([key, value]) => key.toString() === realx.toString());
            if (result instanceof Array && result[1] instanceof Def) {
              SendPieInfo(srcLoc(e), 'definition');
            } else {
              return new go(['the', readBackType(Γ, xtv.value!), realx]);
            }
          })
      } else if (typeof (x) === 'number') {
        if (x === 0) {
          return new go(['the', 'Nat', 'zero']);
        } else if (x > 0) {
          const n_minus1_out = new TSMetaCore(null, Symbol('n_minus1_out'));
          
          return goOn(
            [[n_minus1_out, () => check(Γ, r, new Src(srcLoc(e), x - 1), 'NAT')]],
            () => new go(['the', 'Nat', ['add1', n_minus1_out.value!]])
          )
        }
      } else {
        return new stop(srcLoc(e), [`Can't determine a type: ${x.toString()}.`]);
      }
    })!;
  const result = new TSMetaCore(null, Symbol('result'));
  return goOn(
    [[result, () => theExpr]],
    () => {
      SendPieInfo(srcLoc(e), ['has-type', result.value![1]]);
      return theExpr;
    }
  );
}


function check(Γ: Ctx, r: Renaming, input: Src, tv: Value): Perhaps<Core> {
  const out: Perhaps<Core> = match(srcStx(input))
    .with(['λ', P._, P._], ([_, xBinding, b]) => {
      if (xBinding.length === 1) {
        const x = xBinding[0].varName;
        const xloc = xBinding[0].loc;
        const nt = now(tv);
        if (nt instanceof PI) {
          const y = nt.argName;
          const A = nt.argType;
          const c = nt.resultType;
          const xhat = fresh(Γ, x);
          const bout = new TSMetaCore(null, Symbol('bout'));
          return goOn(
            [
              [bout, () => check(
                  bindFree(Γ, xhat, A),
                  extendRenaming(r, x, xhat),
                  b,
                  valOfClosure(c, new NEU(A, new N_Var(xhat)))!
                )
              ],
            ],
            (() => {
              PieInfoHook(xloc, ['binding-site', readBackType(Γ, A)!]);
              return new go(['λ', [xhat], bout.value!])
            }))
        } else {
          return new stop(xloc, [`Not a function type: ${readBackType(Γ, nt)}.`]);
        }
      } else if (xBinding.length > 1) {
        const x = xBinding[0];
        const xs = xBinding.slice(1);
        return check(Γ, r,
          new Src(srcLoc(input),
            [
              'λ', [x],
              new Src(
                notForInfo(srcLoc(input)),
                ['λ', xs, b]
              )
            ]
          ),
          tv
        );
      }
    })
    .with(['cons', P._, P._], ([_, a, d]) => {
      const nt = now(tv);
      if (nt instanceof SIGMA) {
        const A = nt.carType;
        const c = nt.cdrType;
        const aout = new TSMetaCore(null, Symbol('aout'));
        const dout = new TSMetaCore(null, Symbol('dout'));
        return goOn(
          [
            [aout, () => check(Γ, r, a, A)],
            [dout, () => check(Γ, r, d, valOfClosure(c, valInCtx(Γ, aout.value!)!)!)],
          ],
          () => new go(['cons', aout.value!, dout.value!])
        );
      } else {
        return new stop(srcLoc(input), [`cons requires a Pair or Σ type, but was used as a: ${readBackType(Γ, nt)}.`]);
      }
    })
    .with(['nil'], () => {
      const nt = now(tv);
      if (nt instanceof LIST) {
        return new go('nil');
      } else {
        return new stop(srcLoc(input), [`nil requires a List type, but was used as a: ${readBackType(Γ, nt)}.`]);
      }
    })
    .with(['same', P._], ([_, c]) => {
      const result = now(tv);
      if (result instanceof EQUAL) {
        const [Av, from, to] = [result.type, result.from, result.to];
        const cout = new TSMetaCore(null, Symbol('cout'));
        const v = new TSMetaValue(null, Symbol('v'));
        const void1 = new TSMetaVoid(null, Symbol('void1'));
        const void2 = new TSMetaVoid(null, Symbol('void2'));
        return goOn(
          [
            [cout, () => check(Γ, r, c, Av)],
            [v, () => new go(valInCtx(Γ, cout.value!)!)],
            [void1, () => convert(Γ, srcLoc(c), Av, from, v.value!)],
            [void2, () => convert(Γ, srcLoc(c), Av, to, v.value!)],
          ],
          () => (new go(['same', cout.value!]))
        );
      }
    })
    .with(['vecnil'], () => {
      const result = now(tv);
      if (result instanceof VEC) {
        // TODO: Double Check evaluation of !!
        if (result.length === "ZERO") {
          return new go('vecnil');
        } else {
          return new stop(srcLoc(input),
            [`vecnil requires a Vec type with length ZERO, but was used as a: 
            ${readBack(Γ, "NAT", result.length)}.`]);
        }
      } else {
        return new stop(srcLoc(input),
          [`vecnil requires a Vec type, but was used as a: 
            ${readBackType(Γ, result)} context.`]);
      }
    })
    .with(['vec::', P._, P._], ([_, h, t]) => {
      const result = now(tv);
      // TODO: Double Check evaluation of !!
      if (result instanceof VEC) {
        if (result.length instanceof ADD1) {
          const hout = new TSMetaCore(null, Symbol('hout'));
          const tout = new TSMetaCore(null, Symbol('tout'));
          return goOn(
            [
              [hout, () => check(Γ, r, h, result.entryType)],
              [tout, () => check(Γ, r, t,
                new VEC(result.entryType, (result.length as ADD1).smaller))],
            ],
            () => new go(['vec::', hout.value!, tout.value!])
          );
        } else {
          return new stop(srcLoc(input),
            [`vec:: requires a Vec type with length ADD1, but was used as a: 
              ${readBack(Γ, "NAT", result.length)}.`]);
        }
      } else {
        return new stop(srcLoc(input),
          [`vec:: requires a Vec type, but was used as a: 
            ${readBackType(Γ, result)} context.`]);
      }
    })
    .with(['left', P._], ([_, l]) => {
      const result = now(tv);
      if (result instanceof EITHER) {
        const lout = new TSMetaCore(null, Symbol('lout'));
        return goOn(
          [[lout, () => check(Γ, r, l, result.leftType)]],
          () => new go(['left', lout.value!])
        );
      } else {
        return new stop(srcLoc(input),
          [`left requires an Either type, but was used as a: 
            ${readBackType(Γ, result)} context.`]);
      }
    })
    .with(['right', P._], ([_, rght]) => {
      const result = now(tv);
      if (result instanceof EITHER) {
        const rout = new TSMetaCore(null, Symbol('rout'));
        return goOn(
          [[rout, () => check(Γ, r, rght, result.rightType)]],
          () => new go(['right', rout.value!])
        );
      } else {
        return new stop(srcLoc(input),
          [`right requires an Either type, but was used as a: 
            ${readBackType(Γ, result)} context.`]);
      }
    })
    .with(['TODO'], () => {
      const ty = readBackType(Γ, tv)!;
      SendPieInfo(srcLoc(input), ['TODO', readBackContext(Γ)!, ty]);
      // TODO: translate ann?
      return new go(["TODO", locationToSrcLoc(srcLoc(input)), ty]);
    })
    .otherwise(_ => {
      const thet = new TSMetaCore(null, Symbol('thet'));
      const ph = new TSMetaVoid(null, Symbol('ph'));
      return goOn(
        [
          [thet, () => synth(Γ, r, input)],
          [ph, () => {
            return sameType(Γ, srcLoc(input), valInCtx(Γ, thet.value![1])!, tv);
          }]
        ],
        () => {
          return new go(thet.value![2])
        }
      );
    })!;
  const ok = new TSMetaCore(null, Symbol('ok'));
  SendPieInfo(srcLoc(input), ['has-type', readBackType(Γ, tv)!]);
  return goOn(
    [[ok, () => out]],
    () => new go(ok.value!)
  )
}


// ### Check the form of judgment Γ ⊢ c ≡ c type
function sameType(Γ: Ctx, where: Loc, given: Value, expected: Value): Perhaps<void> {
  const givenE = readBackType(Γ, given)!;
  const expectedE = readBackType(Γ, expected)!;
  if (alphaEquiv(givenE, expectedE)) {
    return new go(undefined);
  } else {
    return new stop(where, [`Expected ${expectedE.toString()} but given ${givenE.toString()}.`]);
  }
}

// ### Check the form of judgment Γ ⊢ c ≡ c : c
function convert(Γ: Ctx, where: Loc, tv: Value, av: Value, bv: Value): Perhaps<void> {
  const a = readBack(Γ, tv, av)!;
  const b = readBack(Γ, tv, bv)!;
  const type = readBackType(Γ, tv)!;
  if (alphaEquiv(a, b)) {
    return new go(undefined);
  } else {
    return new stop(where, [`The terms ${a} and ${b} are not the same ${type}.`]);
  }
}

// ### Claims + defs ###

function notUsed(Γ: Ctx, where: Loc, x: Symbol): Perhaps<true> {
  if (Γ.find(([y]) => y === x)) {
    return new stop(where, [`The name ${x} is already in use in the context.`]);
  } else {
    return new go(true);
  }
}

function getClaim(Γ: Ctx, where: Loc, x: Symbol): Perhaps<Value> {
  if (Γ.length === 0) {
    return new stop(where, [`No claim: ${x}`]);
  } else if (Γ[0] instanceof Def) {
    if (Γ[0][0].toString() === x.toString()) {
      return new stop(where, [`The name ${x} is already defined.`]);
    }
  } else if (Γ[0] instanceof Claim) {
    if (Γ[0][0].toString() === x.toString()) {
      return new go(Γ[0][1].type);
    }
  }
  return getClaim(Γ.slice(1), where, x);
}

function addClaim(Γ: Ctx, f: Symbol, floc: Loc, ty: Src): Perhaps<Ctx> {
  const tyout = new TSMetaCore(null, Symbol('tyout'));
  const meta_ = new TSMetaValue(null, Symbol('meta_'));
  return goOn(
    [[meta_, () => notUsed(Γ, floc, f)], [tyout, () => isType(Γ, [], ty)]],
    () => new go([[f, new Claim(valInCtx(Γ, tyout.value!)!)], ...Γ]));
}

function removeClaim(x: Symbol, Γ: Ctx): Ctx {
  if (Γ.length === 0) {
    return [];
  } else if (Γ[0][1] instanceof Claim) {
    if (Γ[0][0].toString() === x.toString()) {
      return removeClaim(x, Γ.slice(1));
    }
  } else {
    return [Γ[0], ...removeClaim(x, Γ.slice(1))];
  }
  return [Γ[0], ...removeClaim(x, Γ.slice(1))];
}

function addDef(Γ: Ctx, f: Symbol, floc: Loc, expr: Src): Perhaps<Ctx> {
  const tv = new TSMetaValue(null, Symbol('tv'));
  const exprout = new TSMetaCore(null, Symbol('exprout'));
  return goOn(
    [[tv, () => getClaim(Γ, floc, f)], [exprout, () => check(Γ, [], expr, tv.value!)]],
    () => new go(
      bindVal(removeClaim(f, Γ),
        f,
        tv.value!,
        valInCtx(Γ, exprout.value!)!)
    )
  );
}

function atomOk(a: Symbol): boolean {
  return allOkAtom(a.toString().split(''));
}

function allOkAtom(cs: string[]): boolean {
  if (cs.length === 0) {
    return true;
  } else if (isAlphabetic(cs[0]) || cs[0] === '-') {
    return allOkAtom(cs.slice(1));
  } else {
    return false;
  }
}

function isAlphabetic(char: string): boolean {
  return /^[a-zA-Z]$/.test(char);
}

// Helper to concoct a function application form in source syntax
function makeApp(a: Src, b: Src, cs: Src[]): Src {
  return new Src(srcLoc(a), [a, b, cs]);
}

export { isType, synth, check, sameType, convert, addClaim, addDef, makeApp, atomOk, allOkAtom, isAlphabetic };