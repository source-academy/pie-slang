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
} from './basics'

import {
  valInCtx,
  now,
  readBack,
  readBackType,
} from './normalize'
import { alphaEquiv } from './alpha'
import { isForInfo, location } from './locations'

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

const isType = (Γ: Ctx, r: Renaming, input: Src): Perhaps<Core> => {
  const theType: Perhaps<Core> = match(srcStx(input))
    .with('U', () => new go('U'))
    .with('Nat', () => new go('Nat'))
    .with(['->', P._, P._], ([_, A, B]) => {
      const x = freshBinder(Γ, B, Symbol('x'));
      const Aout = new TSMeta(null, Symbol('Aout'));
      const Bout = new TSMeta(null, Symbol('Bout'));
      return goOn(
        [[Aout, isType(Γ, r, A)],
        [Bout, isType(bindFree(Γ, x, valInCtx(Γ, Aout.value!)!), r, B)],],
        new go(['Π', [[x, Aout.value!]], Bout.value!])
      );
    })
    .with(['->', P._, P._, P.array()], ([_, A, B, [C, ...arg]]) => {
      const x = freshBinder(Γ, B, Symbol('x'));
      const Aout = (isType(Γ, r, A) as go<Core>).result;
      const tout = isType(bindFree(Γ, x, valInCtx(Γ, Aout)!), 
                      r, 
                      new Src(srcLoc(input), ['->', B, C, arg]));  
      return goOn(
        [[Aout, tout]],
        new go(['Π', [[x, Aout]], tout])
      );
    })
    .with(['Π' , [[{type: 'Def', }, P._]], P._], 
                         ([_, [[bdr, A]], B]) => {
      bdr = bdr as Def;
      const y = freshBinder(Γ, pr, Symbol('x'));
        })
}

function check(context: Ctx, r: Renaming, input: Src, t: Value): Perhaps<Core> {
  const out: Perhaps<Core> = match(srcStx(input))
    .with(['λ', { type: 'Def', }, P._], ([_, xBinder, b]) => {
        const nt = now(t);
        if (nt instanceof PI) {
          const y = nt.argName;
          const A = nt.argType;
          const c = nt.resultType;
          const x_hat = fresh(context, );
        }
    })
}
/*
const isType = (Γ: Ctx, r: Renaming, input: Src): Perhaps<Core> => {
  const theType: Perhaps<Core> = match(srcStx(input))
    .with('U', () => go('U'))
    .with('Nat', () => go('Nat'))
    .with(['->', match.any, match.any], ([_, A, B]) => {
      const x = freshBinder(Γ, B, 'x');
      return goOn(
        [
          [isType(Γ, r, A), isType(bindFree(Γ, x, valInCtx(Γ, A)), r, B)]
        ],
        () => go(['Π', [[x, A]], B])
      );
    })
    .with(['->', match.any, match.any, match.any], ([_, A, B, C]) => {
      const x = freshBinder(Γ, B, 'x');
      return goOn(
        [
          [isType(Γ, r, A), isType(bindFree(Γ, x, valInCtx(Γ, A)), r, ['->', B, C])]
        ],
        () => go(['Π', [[x, A]], ['->', B, C]])
      );
    })
    .with(['Π', [['', match.any, match.any]], match.any], ([_, x, A, B]) => {
      const y = freshBinder(Γ, x, 'x');
      return goOn(
        [
          [isType(Γ, r, A), isType(bindFree(Γ, y, valInCtx(Γ, A)), extendRenaming(r, x, y), B)]
        ],
        () => go(['Π', [[y, A]], B])
      );
    })
    .with('Atom', () => go('Atom'))
    .with(['Pair', match.any, match.any], ([_, A, D]) => {
      const x = freshBinder(Γ, D, 'x');
      return goOn(
        [
          [isType(Γ, r, A), isType(bindFree(Γ, x, valInCtx(Γ, A)), r, D)]
        ],
        () => go(['Σ', [[x, A]], D])
      );
    })
    .with(['Σ', [[match.any, match.any]], match.any], ([_, x, A, D]) => {
      const y = freshBinder(Γ, x, 'x');
      return goOn(
        [
          [isType(Γ, r, A), isType(bindFree(Γ, y, valInCtx(Γ, A)), extendRenaming(r, x, y), D)]
        ],
        () => go(['Σ', [[y, A]], D])
      );
    })
    .with('Trivial', () => go('Trivial'))
    .with(['List', match.any], ([_, E]) => {
      return goOn(
        [[isType(Γ, r, E)]],
        () => go(['List', E])
      );
    })
    .with('Absurd', () => go('Absurd'))
    .with(['=', match.any, match.any, match.any], ([_, A, from, to]) => {
      return goOn(
        [
          [isType(Γ, r, A), check(Γ, r, from, A), check(Γ, r, to, A)]
        ],
        () => go(['=', A, from, to])
      );
    })
    .with(['Vec', match.any, match.any], ([_, E, len]) => {
      return goOn(
        [
          [isType(Γ, r, E), check(Γ, r, len, 'NAT')]
        ],
        () => go(['Vec', E, len])
      );
    })
    .with(['Either', match.any, match.any], ([_, L, R]) => {
      return goOn(
        [
          [isType(Γ, r, L), isType(Γ, r, R)]
        ],
        () => go(['Either', L, R])
      );
    })
    .otherwise(other => {
      return go(check(Γ, r, other, 'UNIVERSE'));
    });

  goOn([[theType, theType]], () => {
    sendPieInfo(srcLoc(input), ['is-type', theType]);
    return go(theType);
  });

  return theType;
};
*/

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
  if(Γ.length === 0) {
    return new stop(where, [`No claim: ${x}`]);
  } else if(Γ[0] instanceof Def) {
    if(Γ[0][0].toString() === x.toString()) {
      return new stop(where, [`The name ${x} is already defined.`]);
    }
  } else if(Γ[0] instanceof Claim) {
    if(Γ[0][0].toString() === x.toString()) {
      return new go(Γ[0][1].type);
    }
  } 
  return getClaim(Γ.slice(1), where, x);  
}

function addClaim(Γ: Ctx, f: Symbol, floc: Loc, ty: Src): Perhaps<Ctx> {
  const tyout = isType(Γ, [], ty) as go<Core>;
  return goOn(
    [[(notUsed(Γ, floc, f) as go<true>).result, tyout]],
    new go([[f, new Claim(valInCtx(Γ, tyout.result)!)], ...Γ]));
}

function removeClaim(x: Symbol, Γ: Ctx): Ctx {
  if(Γ.length === 0) {
    return [];
  } else if(Γ[0][1] instanceof Claim) {
    if(Γ[0][0].toString() === x.toString()) {
      return removeClaim(x, Γ.slice(1));
    } 
  } else {
    return [Γ[0], ...removeClaim(x, Γ.slice(1))];
  }
  return [Γ[0], ...removeClaim(x, Γ.slice(1))];
}

function addDef(Γ: Ctx, f: Symbol, floc: Loc, expr: Src): Perhaps<Ctx> {
  const tv = (getClaim(Γ, floc, f) as go<Value>).result;
  const exprout = check(Γ, [], expr, tv);
  return goOn(
    [[tv, exprout]],
      new go(
        bindVal(removeClaim(f, Γ),
        f,
        tv,
        valInCtx(Γ, (exprout as go<Core>).result)!)
      )
  );
}

function atomOk(a: Symbol) : boolean {
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