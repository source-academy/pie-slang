import { Source } from "./source"
import { Core } from "./core"
import { Location } from "../utils/locations";
import { Value } from "./value";
import { Environment, extendEnvironment} from "../utils/environment";
import { Context } from "../utils/context";
import { freshen } from "../utils/fresh";


// A SiteBinder is a variable name and its location, substitute BindingSite in original code.

export class SiteBinder {
  constructor(
    public location: Location,
    public varName: string,
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


export class Message {
  constructor(public message: Array<String|Core>) { }
  public toString(): string {
    return this.message.map(m => typeof m === 'string' ? m : (m as Core).prettyPrint()).join(' ');
  }
}

export abstract class Perhaps<T> { 

}

export class go<T> extends Perhaps<T> {
  constructor(public result: T) { super() }
}

// A failure result named "stop"
export class stop extends Perhaps<undefined> {
  constructor(
    public where: Location,
    public message: Message
  ) { super() }
}

export class PerhapsM<T> {
  // name is majorly for debugging use.
  constructor(public name: string, public value: T = null as any) { }
}

/*
  go-on is very much like let*. The difference is that if any of the
  values bound to variables in it are stop, then the entire
  expression becomes that first stop. Otherwise, the variables are
  bound to the contents of each go.
*/

export function goOn<T>(
  bindings: [PerhapsM<any>, () => Perhaps<any>][],
  finalExpr: () => T): T {
  for(const [meta, lazy] of bindings) {
    const val = lazy();
    if (val instanceof go) {
      meta.value = (val as go<any>).result;
    } else {
      throw new Error(`Encountered stop when evaluating the sequence ${bindings}. Error message: ${(val as stop).message.message} at ${(val as stop).where}`);
    }
  }
  return finalExpr();
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

  public abstract prettyPrint(): string;

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

  public prettyPrint(): string {
    return `(CLOS ${this.varName} ${this.expr.prettyPrint()})`;
  }

  public toString(): string {
    return this.prettyPrint();
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

  public prettyPrint(): string {
    return `(HOCLOS)`;
  }

  public toString(): string {
    return this.prettyPrint();
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
  return !isPieKeywords(name) && isNaN(Number(name));
}

/*
  ### Finding fresh names ###

  Find a fresh name, using none of those described in a context.

  This is the implementation of the Γ ⊢ fresh ↝ x form of
  judgment. Unlike the rules in the appendix to The Little Typer,
  this implementation also accepts a name suggestion so that the code
  produced by elaboration has names that are as similar as possible
  to those written by the user.
*/

/*
  Find the names that are described in a context, so they can be
  avoided.
*/
function namesInContext(ctx: Context): string[] {
  return Array.from(ctx.keys());
}

export function fresh(ctx: Context, name: string): string {
  return freshen(namesInContext(ctx), name);
}

/*
  Find a fresh name, using none of those described in a context nor
  occurring in an expression. This is used when constructing a fresh
  binding to avoid capturing a free variable that would otherwise be
  an error because it points at the context.
*/

export function freshBinder(ctx: Context, src: Source, name: string): string {
  return freshen(namesInContext(ctx).concat(src.findNames()), name);
}

export function occurringBinderNames(binder: TypedBinder): string[] {
  return [binder.binder.varName].concat(binder.type.findNames());
}