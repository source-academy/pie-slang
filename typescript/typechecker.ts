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
} from './basics'

import {
  valInCtx,
  now,
  readBack,
  readBackType,
  valOfClosure,
  readBackContext,
} from './normalize'
import { alphaEquiv } from './alpha'
import { isForInfo, location, locationToSrcLoc, notForInfo } from './locations'

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
  const pair = r.find(([symbol]) => symbol === x);
  return pair ? pair[1] : x;
}

// Function to extend the Renaming list with a new pair
function extendRenaming(r: Renaming, from: Symbol, to: Symbol): Renaming {
  return [[from, to], ...r];
}

function isType(Γ: Ctx, r: Renaming, input: Src): Perhaps<Core> {
  const theType: Perhaps<Core> = match(srcStx(input))
    .with('U', () => new go('U'))
    .with('Nat', () => new go('Nat'))
    .with(['->', P._, P._], ([_, A, B]) => {

    })
    .with(['->', P._, P._, P.array()], ([_, A, B, arr]) => {
      if (arr.length === 0) {
        const x = freshBinder(Γ, B, Symbol('x'));
        const Aout = new TSMetaCore(null, Symbol('Aout'));
        const Bout = new TSMetaCore(null, Symbol('Bout'));
        return goOn(
          [[Aout, isType(Γ, r, A)],
          [Bout, isType(bindFree(Γ, x, valInCtx(Γ, Aout.value!)!), r, B)],],
          new go(['Π', [[x, Aout.value!]], Bout.value!])
        );
      } else {
        const [C, ...rest] = arr;
        const x = freshBinder(Γ, makeApp(B, C, rest), Symbol('x'));
        const Aout = new TSMetaCore(null, Symbol('Aout'));
        const tout = new TSMetaCore(null, Symbol('tout'));
        return goOn(
          [[Aout, isType(Γ, r, A)],
          [tout, isType(bindFree(Γ, x, valInCtx(Γ, Aout.value!)!), r,
            new Src(srcLoc(input), ['->', B, C, rest]))]],
          new go(['Π', [[x, Aout.value!]], tout.value!])
        )
      }
    })
    .with(['Π', P._, P._], ([_, arr, B]) => {
      if (arr.length === 1) {
        const y = fresh(Γ, Symbol('x'));
        const [bd, A] = arr[0];
        const xloc = bd.loc;
        const Aout = new TSMetaCore(null, Symbol('Aout'));
        const Aoutv = new TSMetaValue(null, Symbol('Aoutv'));
        const Bout = new TSMetaCore(null, Symbol('Bout'));
        return goOn(
          [
            [Aout, isType(Γ, r, A)],
            [Aoutv, new go(valInCtx(Γ, Aout.value!)!)],
            [Bout, isType(bindFree(Γ, y, Aoutv.value!),
              extendRenaming(r, bd.varName, y), B)]
          ],
          (() => {
            PieInfoHook(xloc, ['binding-site', Aout.value!]);
            return new go(['Π', [[y, Aout.value!]], Bout.value!])
          })()
        
        )

      } else if (arr.length > 1) {
        const [[bd, A], [y, A1], ...rest] = arr;
        const xloc = bd.loc;
        const x = bd.varName;
        const z = fresh(Γ, Symbol('x'));
        const Aout = new TSMetaCore(null, Symbol('Aout'));
        const Aoutv = new TSMetaValue(null, Symbol('Aoutv'));
        const Bout = new TSMetaCore(null, Symbol('Bout'));
        return goOn(
          [
            [Aout, isType(Γ, r, A)],
            [Aoutv, new go(valInCtx(Γ, Aout.value!)!)],
            [Bout, isType(bindFree(Γ, z, Aoutv.value!),
              extendRenaming(r, x, z), 
              new Src(srcLoc(input), ['Π', [[y, A1], ...rest], B]))]
          ],
          (() => {
            PieInfoHook(xloc, ['binding-site', Aout.value!]);
            return new go(['Π', [[z, Aout.value!]], Bout.value!])
          })()
        )
      } else {
        return new stop(srcLoc(input), ['Not a type']);
      }
    })
    .with('Atom', () => new go('Atom'))
    .with(['Pair', P._, P._], ([_, A, D]) => {
      const x = freshBinder(Γ, D, Symbol('x'));
      const Aout = new TSMetaCore(null, Symbol('Aout'));
      const Dout = new TSMetaCore(null, Symbol('Dout'));
      return goOn(
        [[Aout, isType(Γ, r, A)],
        [Dout, isType(bindFree(Γ, x, valInCtx(Γ, Aout.value!)!), r, D)],],
        new go(['Σ', [[x, Aout.value!]], Dout.value!])
      );
    })
    .with(['Σ', P._, P._], ([_, arr, D]) => {
      if (arr.length === 1) {
        const y = fresh(Γ, Symbol('x'));
        const [bd, A] = arr[0];
        const xloc = bd.loc;
        const Aout = new TSMetaCore(null, Symbol('Aout'));
        const Aoutv = new TSMetaValue(null, Symbol('Aoutv'));
        const Dout = new TSMetaCore(null, Symbol('Dout'));
        return goOn(
          [
            [Aout, isType(Γ, r, A)],
            [Aoutv, new go(valInCtx(Γ, Aout.value!)!)],
            [Dout, isType(bindFree(Γ, y, Aoutv.value!),
              extendRenaming(r, bd.varName, y), D)]
          ],
          (() => {
            PieInfoHook(xloc, ['binding-site', Aout.value!]);
            return new go(['Σ', [[y, Aout.value!]], Dout.value!])
          })()
        )
      } else if (arr.length > 1) {
        const [[bd, A], [y, A1], ...rest] = arr;
        const xloc = bd.loc;
        const x = bd.varName;
        const z = fresh(Γ, Symbol('x'));
        const Aout = new TSMetaCore(null, Symbol('Aout'));
        const Aoutv = new TSMetaValue(null, Symbol('Aoutv'));
        const Dout = new TSMetaCore(null, Symbol('Dout'));
        return goOn(
          [
            [Aout, isType(Γ, r, A)],
            [Aoutv, new go(valInCtx(Γ, Aout.value!)!)],
            [Dout, isType(bindFree(Γ, z, Aoutv.value!),
              extendRenaming(r, x, z),
              new Src(srcLoc(input), ['Σ', [[y, A1], ...rest], D]))]
          ],
          (() => {
            PieInfoHook(xloc, ['binding-site', Aout.value!]);
            return new go(['Σ', [[z, Aout.value!]], Dout.value!])
          })()
        )
      } else {
        return new stop(srcLoc(input), ['Not a type']);
      }
    })
    .with(['List', P._], ([_, E]) => {
      const Eout = new TSMetaCore(null, Symbol('Eout'));
      return goOn(
        [[Eout, isType(Γ, r, E)]],
        new go(['List', Eout.value!])
      );
    })
    .with('Absurd', () => new go('Absurd'))
    .with(['=', P._, P._, P._], ([_, A, from, to]) => {
      const Aout = new TSMetaCore(null, Symbol('Aout'));
      const Av = new TSMetaValue(null, Symbol('Av'));
      const fromv = new TSMetaValue(null, Symbol('fromv'));
      const tov = new TSMetaValue(null, Symbol('tov'));
      return goOn(
        [
          [Aout, isType(Γ, r, A)],
          [Av, new go(valInCtx(Γ, Aout.value!)!)],
          [fromv, check(Γ, r, from, Av.value!)],
          [tov, check(Γ, r, to, Av.value!)],
        ],
        new go(['=', Av.value!, fromv.value!, tov.value!])
      );
    })
    .with(['Vec', P._, P._], ([_, E, len]) => {
      const Eout = new TSMetaCore(null, Symbol('Eout'));
      const lenout = new TSMetaCore(null, Symbol('lenout'));
      return goOn(
        [
          [Eout, isType(Γ, r, E)],
          [lenout, check(Γ, r, len, 'NAT')],
        ],
        new go(['Vec', Eout.value!, lenout.value!])
      );
    })
    .with(['Either', P._, P._], ([_, L, R]) => {
      const Lout = new TSMetaCore(null, Symbol('Lout'));
      const Rout = new TSMetaCore(null, Symbol('Rout'));
      return goOn(
        [
          [Lout, isType(Γ, r, L)],
          [Rout, isType(Γ, r, R)],
        ],
        new go(['Either', Lout.value!, Rout.value!])
      );
    })
    .otherwise(other => {
      const result = check(Γ, r, new Src(srcLoc(input), other), 'UNIVERSE');
      if (result instanceof go) {
        return result;
      } else if ((other instanceof Symbol) && (isVarName(other))) {
        const othertv = new TSMetaValue(null, Symbol('othertv'));
        return goOn(
          [[othertv, varType(Γ, srcLoc(input), other)!]],
          new stop(srcLoc(input), [`Expected U but got ${othertv.value!}.`])
        )
      } else {
        return new stop(srcLoc(input), [`Not a type`]);
      } 
    }
    )!;
    const t = new TSMetaCore(null, Symbol('t'));
    return goOn([[t, theType]], 
      (() => {
        SendPieInfo(srcLoc(input), ['is-type', t.value!]);
        return new go(t.value!);
      })()
    );
}


function check(Γ: Ctx, r: Renaming, input: Src, tv: Value): Perhaps<Core> {
  const out: Perhaps<Core> = match(srcStx(input))
    .with(['λ', P._, P._], ([_, xBinding, b]) => {
      if(xBinding.length === 1) {
        const x = xBinding[0][0];
        const xloc = xBinding[0][1];
        const nt = now(tv);
        if (nt instanceof PI) {
          const y = nt.argName;
          const A = nt.argType;
          const c = nt.resultType;
          const xhat = fresh(Γ, x);
          const bout = new TSMetaCore(null, Symbol('bout'));
          return goOn(
            [
              [bout, check(bindFree(Γ, xhat, A), extendRenaming(r, xhat, x), b, valOfClosure(c, new NEU(A, new N_Var(xhat)))!)],
            ],
            (() => {
              PieInfoHook(xloc, ['binding-site', readBackType(Γ, A)!]);
              return new go(['λ', [xhat], bout.value!])
            })())
        } else {
          return new stop(xloc, [`Not a function type: ${readBackType(Γ, nt)}.`]);
        }
      } else if (xBinding.length > 1) {
        const [x, y, dot, xs] = xBinding;
       return check(Γ, r, new Src(srcLoc(input), ['λ', [x], 
          new Src(notForInfo(srcLoc(input)), ['λ', [y, dot, xs], b])]), tv); 
      }
    })
    .with(['cons', P._, P._], ([_, a, d]) => {
      const nt = now(tv);
      if (nt instanceof SIGMA) {
        const x = nt.carName;
        const A = nt.carType;
        const c = nt.cdrType;
        const aout = new TSMetaCore(null, Symbol('aout'));
        const dout = new TSMetaCore(null, Symbol('dout'));
        return goOn(
          [
            [aout, check(Γ, r, a, A)],
            [dout, check(Γ, r, d, valOfClosure(c, valInCtx(Γ, aout.value!)!)!)],
          ],
          new go(['cons', aout.value!, dout.value!])
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
            [cout, check(Γ, r, c, Av)],
            [v, new go(valInCtx(Γ, cout.value!)!)],
            [void1, convert(Γ, srcLoc(c), Av, from, v.value!)],
            [void2, convert(Γ, srcLoc(c), Av, to, v.value!)],
          ],
          new go(['same', cout.value!])
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
              [hout, check(Γ, r, h, result.entryType)],
              [tout, check(Γ, r, t, 
                new VEC(result.entryType, result.length.smaller))],
            ],
            new go(['vec::', hout.value!, tout.value!])
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
          [[lout, check(Γ, r, l, result.leftType)]],
          new go(['left', lout.value!])
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
          [[rout, check(Γ, r, rght, result.rightType)]],
          new go(['right', rout.value!])
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
    .otherwise(other => {
      // TODO:
    })!;
  const ok = new TSMetaCore(null, Symbol('ok'));
  SendPieInfo(srcLoc(input), ['has-type', readBackType(Γ, tv)!]);
  return goOn(
    [[ok, out]],
    ok.value!
  )
}


// ### Check the form of judgment Γ ⊢ c ≡ c type
function sameType(Γ: Ctx, where: Loc, given: Value, expected: Value): Perhaps<void> {
  const givenE = readBackType(Γ, given)!;
  const expectedE = readBackType(Γ, expected)!;
  if (alphaEquiv(givenE, expectedE)) {
    return new go(undefined);
  } else {
    return new stop(where, [`Expected ${readBackType(Γ, expected)} but given ${readBackType(Γ, given)}.`]);
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
    [[meta_, notUsed(Γ, floc, f)], [tyout, isType(Γ, [], ty)]],
    new go([[f, new Claim(valInCtx(Γ, tyout.value!)!)], ...Γ]));
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
    [[tv, getClaim(Γ, floc, f)], [exprout, check(Γ, [], expr, tv.value!)]],
    new go(
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