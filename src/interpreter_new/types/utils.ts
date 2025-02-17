import { Source } from "./source"
import { Core } from "./core"
import { Location } from "../locations";
import { Value } from "./value";
import { Environment, extendEnvironment } from "./environment";

// 
export class SourceLocation {
  constructor(
    public location: string,
    public a: number,
    public b: number,
    public c: number,
    public d: number,
  ) { }
}

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

/*
  ### Closures ### 

  There are two kinds of closures: first-order closures and
  higher-order closures. They are used for different purposes in
  Pie. It would be possible to have only one representation, but they
  are good for different things, so both are included. See
  val-of-closure in normalize.rkt for how to find the value of a
  closure, given the value for its free variable.
*/


export abstract class Closure { 

  constructor() { }
  /*
    General-purpose helpers
   
    Given a value for a closure's free variable, find the value. This
    cannot be used for DELAY-CLOS, because DELAY-CLOS's laziness
    closures do not have free variables, but are instead just delayed
    computations.
  */
  public abstract valOfClosure(v: Value): Value;

}

/*
  First-order closures, which are a pair of an environment an an
  expression whose free variables are given values by the
  environment, are used for most closures in Pie. They are easier to
  debug, because their contents are visible rather than being part of
  a compiled Racket function. On the other hand, they are more
  difficult to construct out of values, because it would be necessary
  to first read the values back into Core Pie syntax.
*/

export class FirstOrderClosure extends Closure {
  constructor(
    public env: Environment,
    public varName: string,
    public expr: Core
  ) { super() }

  public valOfClosure(v: Value): Value {
    return this.expr.valOf(extendEnvironment(this.env, this.varName, v));
  }
}

/*
  Higher-order closures re-used Racket's built-in notion of
  closure. They are more convenient when constructing closures from
  existing values, which happens both during type checking, where
  these values are used for things like the type of a step, and
  during evaluation, where they are used as type annotations on THE
  and NEU.
*/

export class HigherOrderClosure extends Closure {
  constructor(
    public proc: (value: Value) => Value
  ) { super() };

  public valOfClosure(v: Value): Value {
    return this.proc(v);
  }
}


/*
  ## Recognizing variable names ##

  This macro causes a name to be defined both for Racket macros and
  for use in ordinary Racket programs. In Racket, these are
  separated.

  Variable name recognition is needed in Racket macros in order to
  parse Pie into the Src type, and it is needed in ordinary programs
  in order to implement the type checker.

  Here the codes are largely removed since the macro is not needed in TS.
*/

/*
  The type of var-name? guarantees that the implementation will
  always accept symbols that are not Pie keywords, and never accept
  those that are.
*/

export function isVarName(name: string): boolean {
  return isPieKeywords(name);
}





