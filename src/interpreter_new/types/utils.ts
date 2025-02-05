import {Source} from "./source"
import { Core } from "./core"
import { Location } from "../locations";
import { Value } from "./value";

// A SiteBinder is a variable name and its location, substitute BindingSite in original code.

export class SiteBinder {
  constructor(
    public varName: string,
    public location: Location,
  ) { }
}

// Define TypedBinder, which is a SiteBinder associated with a expression in Pie.

export class TypedBinder {
  constructor(
    public binder: SiteBinder,
    public type: Source,
  ) {}
}

export function isPieKeywords(str : string) : boolean {
  return str === 'U' ? true : 
    str === 'Nat' ? true :
    str === 'zero' ? true :
    str === 'add1' ? true :
    str === 'which-Nat' ? true :
    str === 'iter-Nat' ? true :
    str === 'rec-Nat' ? true :
    str === 'ind-Nat' ? true :
    str === '->' ? true :
    str === '→' ? true :
    str === 'Π' ? true :
    str === 'λ' ? true :
    str === 'Pi' ? true :
    str === '∏' ? true :
    str === 'lambda' ? true :
    str === 'quote' ? true :
    str === 'Atom' ? true :
    str === 'car' ? true :
    str === 'cdr' ? true :
    str === 'cons' ? true :
    str === 'Σ' ? true :
    str === 'Sigma' ? true :
    str === 'Pair' ? true :
    str === 'Trivial' ? true :
    str === 'sole' ? true :
    str === 'List' ? true :
    str === '::' ? true :
    str === 'nil' ? true :
    str === 'rec-List' ? true :
    str === 'ind-List' ? true :
    str === 'Absurd' ? true :
    str === 'ind-Absurd' ? true :
    str === '=' ? true :
    str === 'same' ? true :
    str === 'replace' ? true :
    str === 'trans' ? true :
    str === 'cong' ? true :
    str === 'symm' ? true :
    str === 'ind-=' ? true :
    str === 'Vec' ? true :
    str === 'vecnil' ? true :
    str === 'vec::' ? true :
    str === 'head' ? true :
    str === 'tail' ? true :
    str === 'ind-Vec' ? true :
    str === 'Either' ? true :
    str === 'left' ? true :
    str === 'right' ? true :
    str === 'ind-Either' ? true :
    str === 'TODO' ? true :
    str === 'the' ? true :
    false;
}

// export type Ctx = Map<string, Core>;
type Ctx = Array<[String, Binder]>;

type Message = Array<String | Core>;

export abstract class Perhaps<T> {
  abstract isGo(): boolean;
}

export class go<T> extends Perhaps<T> {
  constructor(public result: T) { super() }
  isGo(): boolean {
    return true;
  }
}

// A failure result named "stop"
export class stop extends Perhaps<undefined> {
  constructor(public where: Location, public message: Message) { super() }
  isGo(): boolean {
    return false;
  }
}

export type Renaming = [symbol: String, renamed: String][];

export function rename(r: Renaming, x: String): String {
  const pair = r.find(([symbol]) => symbol.valueOf() === x.valueOf());
  return pair ? pair[1] : x;
}

export function extendRenaming(r: Renaming, from: String, to: String): Renaming {
  return [[from, to], ...r];
}

const initCtx: Ctx = [];


function bindFree(ctx: Ctx, x: String, tv: Value): Ctx {
  if (ctx.some(([name, _]) => name.valueOf() === x.valueOf())) {
    throw new Error(`${x.toString()} is already bound in ${JSON.stringify(ctx)}`);
  }
  return [[x, new Free(tv)], ...ctx];
}

abstract class Binder {
  abstract type: Value;
}

class Claim extends Binder {
  constructor(public type: Value) { super() }
}

class Def extends Binder {
  constructor(public type: Value, public value: Value) { super() }
}

class Free extends Binder {
  constructor(public type: Value) { super() }
}

type Env = Array<[String, Value]>;

type Closure = FO_CLOS | HO_CLOS;

class FO_CLOS {
  constructor(public env: Env, public varName: Symbol, public expr: Core) { }
}

class HO_CLOS {
  constructor(public proc: (value: Value) => Value) { };
}






