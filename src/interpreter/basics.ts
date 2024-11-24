import { syntaxToLocation, notForInfo, locationToSrcLoc, Location } from './locations';
import { freshen } from './fresh';
// Define Srcloc as a tuple type
type Srcloc = [Symbol, number, number];

// Define Loc as an alias for PreciseLoc
type Loc = Location;

/*
  All built-in Keywords for Pie.
*/
enum PieKeyword {
  'U' = 'U'
  , 'Nat' = 'Nat'
  , 'zero' = 'zero'
  , 'add1' = 'add1'
  , 'which-Nat' = 'which-Nat'
  , 'iter-Nat' = 'iter-Nat'
  , 'rec-Nat' = 'rec-Nat'
  , 'ind-Nat' = 'ind-Nat'
  , '->' = '->'
  , '→' = '→'
  , 'Π' = 'Π'
  , 'λ' = 'λ'
  , 'Pi' = 'Pi'
  , '∏' = '∏'
  , 'lambda' = 'lambda'
  , 'quote' = 'quote'
  , 'Atom' = 'Atom'
  , 'car' = 'car'
  , 'cdr' = 'cdr'
  , 'cons' = 'cons'
  , 'Σ' = 'Σ'
  , 'Sigma' = 'Sigma'
  , 'Pair' = 'Pair'
  , 'Trivial' = 'Trivial'
  , 'sole' = 'sole'
  , 'List' = 'List'
  , '::' = '::'
  , 'nil' = 'nil'
  , 'rec-List' = 'rec-List'
  , 'ind-List' = 'ind-List'
  , 'Absurd' = 'Absurd'
  , 'ind-Absurd' = 'ind-Absurd'
  , '=' = '='
  , 'same' = 'same'
  , 'replace' = 'replace'
  , 'trans' = 'trans'
  , 'cong' = 'cong'
  , 'symm' = 'symm'
  , 'ind-=' = 'ind-='
  , 'Vec' = 'Vec'
  , 'vecnil' = 'vecnil'
  , 'vec::' = 'vec::'
  , 'head' = 'head'
  , 'tail' = 'tail'
  , 'ind-Vec' = 'ind-Vec'
  , 'Either' = 'Either'
  , 'left' = 'left'
  , 'right' = 'right'
  , 'ind-Either' = 'ind-Either'
  , 'TODO' = 'TODO'
  , 'the' = 'the'
}
/*
  Define the Src type, which associates a source location with
  a Pie expression. another name for Src in orginal code is "@".
*/
class Src {
  constructor(public loc: Loc, public stx: SrcStx) { }
}

// A binder is a variable name and its location
class BindingSite {
  constructor(public loc: Loc, public varName: Symbol) { }
}

// Function to get the location from a Src instance
function srcLoc(src: Src): Loc {
  return src.loc;
}

// Function to get the syntax from a Src instance
function srcStx(src: Src): SrcStx {
  return src.stx;
}

// Type guard to check if the input is a Src instance
function isSrc(input: any): input is Src {
  return (input instanceof Src);
}

// TypedBinder definition
type TypedBinder = [BindingSite, Src];

/*
    Pie expressions consist of a source location attached by @ to an
    S-expression that follows the structure defined in The Little
    Typer. Each sub-expression also has a source location, so they are
    Src rather than Src-Stx.
*/
type SrcStx =
  | ['the', Src, Src]
  | 'U'
  | 'Nat'
  | 'zero'
  | Symbol
  | 'Atom'
  | ['quote', Symbol]
  | ['add1', Src]
  | ['which-Nat', Src, Src, Src]
  | ['iter-Nat', Src, Src, Src]
  | ['rec-Nat', Src, Src, Src]
  | ['ind-Nat', Src, Src, Src, Src]
  | ['->', Src, Src, Src[]]
  | ['Π', TypedBinder[], Src]
  | ['λ', BindingSite[], Src]
  | ['Σ', TypedBinder[], Src]
  | ['Pair', Src, Src]
  | ['cons', Src, Src]
  | ['car', Src]
  | ['cdr', Src]
  | 'Trivial'
  | 'sole'
  | 'nil'
  | number // Natural numbers
  | ['::', Src, Src]
  | ['List', Src]
  | ['rec-List', Src, Src, Src]
  | ['ind-List', Src, Src, Src, Src]
  | 'Absurd'
  | ['ind-Absurd', Src, Src]
  | ['=', Src, Src, Src]
  | ['same', Src]
  | ['replace', Src, Src, Src]
  | ['trans', Src, Src]
  | ['cong', Src, Src]
  | ['symm', Src]
  | ['ind-=', Src, Src, Src]
  | ['Vec', Src, Src]
  | 'vecnil'
  | ['vec::', Src, Src]
  | ['head', Src]
  | ['tail', Src]
  | ['ind-Vec', Src, Src, Src, Src, Src]
  | ['Either', Src, Src]
  | ['left', Src]
  | ['right', Src]
  | ['ind-Either', Src, Src, Src, Src]
  | 'TODO'
  | [Src, Src, Src[]];


/*
    Core Pie expressions are the result of type checking (elaborating)
    an expression written in Pie. They do not have source positions,
    because they by definition are not written by a user of the
    implementation.
*/
type Core =
  | ['the', Core, Core]
  | 'U'
  | 'Nat'
  | 'zero'
  | Symbol
  | ['add1', Core]
  | ['which-Nat', Core, ['the', Core, Core], Core]
  | ['iter-Nat', Core, ['the', Core, Core], Core]
  | ['rec-Nat', Core, ['the', Core, Core], Core]
  | ['ind-Nat', Core, Core, Core, Core]
  | ['Π', Array<[Symbol, Core]>, Core]
  | ['λ', Array<Symbol>, Core]
  | 'Atom'
  | ['quote', Symbol]
  | ['Σ', Array<[Symbol, Core]>, Core]
  | ['cons', Core, Core]
  | ['car', Core]
  | ['cdr', Core]
  | ['::', Core, Core]
  | 'nil'
  | ['List', Core]
  | ['rec-List', Core, ['the', Core, Core], Core]
  | ['ind-List', Core, Core, Core, Core]
  | 'Absurd'
  | 'Trivial'
  | ['ind-Absurd', Core, Core]
  | ['=', Core, Core, Core]
  | ['same', Core]
  | ['replace', Core, Core, Core]
  | ['trans', Core, Core]
  | ['cong', Core, Core, Core]  // Extra expr is type found through synth
  | ['symm', Core]
  | ['ind-=', Core, Core, Core]
  | ['Vec', Core, Core]
  | ['vec::', Core, Core]
  | 'vecnil'
  | ['head', Core]
  | ['tail', Core]
  | ['ind-Vec', Core, Core, Core, Core, Core]
  | ['Either', Core, Core]
  | ['left', Core]
  | ['right', Core]
  | ['ind-Either', Core, Core, Core, Core]
  | ['TODO', Srcloc, Core]
  | [Core, Core];

// Predicate function to check if an object is Core

const isCore = (value: any): value is Core => {
  if (value === 'U' || value === 'Nat' || value === 'zero' || value === 'Atom' || value === 'nil' || value === 'vecnil' || value === 'Absurd') {
    return true;
  }

  if (typeof value === 'symbol') {
    return true;
  }

  if (Array.isArray(value)) {
    const [first, ...rest] = value;

    switch (first) {
      case 'the':
      case 'which-Nat':
      case 'iter-Nat':
      case 'rec-Nat':
      case 'ind-Nat':
      case 'rec-List':
      case 'ind-List':
      case 'ind-Absurd':
      case '=':
      case 'replace':
      case 'trans':
      case 'cong':
      case 'ind-=':
      case 'Vec':
      case 'vec::':
      case 'head':
      case 'tail':
      case 'ind-Vec':
      case 'Either':
      case 'left':
      case 'right':
      case 'ind-Either':
      case 'TODO':
        return rest.every(isCore); // Each remaining part must be a Core
      case 'add1':
      case 'quote':
      case 'car':
      case 'cdr':
      case 'same':
      case 'symm':
        return rest.length === 1 && isCore(rest[0]); // Expect exactly 1 Core argument
      case 'Π':
      case 'Σ':
        return Array.isArray(rest[0]) && rest[0].every(([sym, core]) => (typeof sym === 'symbol') && isCore(core)) && isCore(rest[1]);
      case 'λ':
        return Array.isArray(rest[0]) && rest[0].every((obj) => (typeof obj === 'symbol')) && isCore(rest[1]);
      case 'cons':
      case '::':
      default:
        // function app 
        return value.length === 2 && isCore(value[0]) && isCore(value[1]);
    }
  }

  return false;
};


/*
    ## Values ##
    
    In order to type check Pie, it is necessary to find the normal
    forms of expressions and compare them with each other. The normal
    form of an expression is determined by its type - types that have
    η-rules (such as Π, Σ, Trivial, and Absurd) impose requirements on
    the normal form. For instance, every normal function has λ at the
    top, and every normal pair has cons at the top.

    Finding normal forms has two steps: first, programs are evaluated,
    much as they are with the Scheme interpreter at the end of The
    Little Schemer. Then, these values are "read back" into the syntax
    of their normal forms. This happens in normalize.rkt. This file
    defines the values that expressions can have. Structures or symbols
    that represent values are written in ALL-CAPS.

    Laziness is implemented by allowing values to be a closure that
    does not bind a variable. It is described in normalize.rkt (search
    for "Call-by-need").
*/
class DELAY_CLOS {
  env: Env;
  expr: Core;

  constructor(env: Env, expr: Core) {
    this.env = env;
    this.expr = expr;
  }
}

class Box<Type> {
  contents: Type;

  constructor(value: Type) {
    this.contents = value;
  }
}


class DELAY {
  constructor(public val: Box<DELAY_CLOS | Value>) { }
}

class QUOTE {
  constructor(public name: Symbol) { }
}

class ADD1 {
  constructor(public smaller: Value) { }
}

class PI {
  constructor(
    public argName: Symbol,
    public argType: Value,
    public resultType: Closure
  ) { }
}

class LAM {
  constructor(
    public argName: Symbol,
    public body: Closure
  ) { }
}

class SIGMA {
  constructor(
    public carName: Symbol,
    public carType: Value,
    public cdrType: Closure
  ) { }
}

class CONS {
  constructor(
    public car: Value,
    public cdr: Value
  ) { }
}

class LIST_CONS {
  constructor(
    public head: Value,
    public tail: Value
  ) { }
}

class LIST {
  constructor(public entryType: Value) { }
}

class EQUAL {
  constructor(
    public type: Value,
    public from: Value,
    public to: Value
  ) { }
}

class SAME {
  constructor(public value: Value) { }
}

class VEC {
  constructor(
    public entryType: Value,
    public length: Value
  ) { }
}

class VEC_CONS {
  constructor(
    public head: Value,
    public tail: Value
  ) { }
}

class EITHER {
  constructor(
    public leftType: Value,
    public rightType: Value
  ) { }
}

class LEFT {
  constructor(public value: Value) { }
}

class RIGHT {
  constructor(public value: Value) { }
}

class NEU {
  constructor(
    public type: Value,
    public neutral: Neutral
  ) { }
}


// Value type using a union of all possible types
type Value =
  | "UNIVERSE"
  | "NAT"
  | "ZERO"
  | ADD1
  | QUOTE
  | "ATOM"
  | PI
  | LAM
  | SIGMA
  | CONS
  | "TRIVIAL"
  | "SOLE"
  | LIST
  | LIST_CONS
  | "NIL"
  | "ABSURD"
  | EQUAL
  | SAME
  | VEC
  | "VECNIL"
  | VEC_CONS
  | EITHER
  | LEFT
  | RIGHT
  | NEU
  | DELAY
  | MetaVar

/*  
    ## Run-time Environments ##

    Run-time environments
    A run-time environment associates a value with each variable.
*/

type Env = Array<[Symbol, Value]>;

// ctx->env
function ctxToEnv(ctx: Ctx): Env {
  // deal with empty context
  if (ctx.length === 0) {
    return [];
  }
  // Otherwise, destruct the context
  const [[x, binding], ...ctxNext] = ctx;
  if (binding instanceof Def) {
    return [[x, binding.value], ...ctxToEnv(ctxNext)];
  } else if (binding instanceof Free) {
    return [[x, new NEU(binding.type, new N_Var(x))], ...ctxToEnv(ctxNext)];
  } else { // for claiml
    return ctxToEnv(ctxNext);
  }
}

// Extend an environment with a new variable
function extendEnv(env: Env, x: Symbol, v: Value): Env {
  return [[x, v], ...env];
}

// Lookup the value of a variable in an environment (var-val)
function varVal(env: Env, x: Symbol): Value {
  const found = env.find(([y]) => y.description === x.description );
  if (found) {
    const [, v] = found;
    return v;
  } else {
    throw new Error(`Variable ${x.description} not in env: ${JSON.stringify(env)}`);
  }
}

/*
    ##Closures##

    There are two kinds of closures: first-order closures and
    higher-order closures. They are used for different purposes in
    Pie. It would be possible to have only one representation, but they
    are good for different things, so both are included. See
    val-of-closure in normalize.rkt for how to find the value of a
    closure, given the value for its free variable.
*/


type Closure = FO_CLOS | HO_CLOS;


/*
    First-order closures, which are a pair of an environment an an
    expression whose free variables are given values by the
    environment, are used for most closures in Pie. They are easier to
    debug, because their contents are visible rather than being part of
    a compiled Racket function. On the other hand, they are more
    difficult to construct out of values, because it would be necessary
    to first read the values back into Core Pie syntax.
*/

class FO_CLOS {
  constructor(public env: Env, public varName: Symbol, public expr: Core) { }
}

/*
    Higher-order closures re-used Racket's built-in notion of
    closure. They are more convenient when constructing closures from
    existing values, which happens both during type checking, where
    these values are used for things like the type of a step, and
    during evaluation, where they are used as type annotations on THE
    and NEU.
*/

class HO_CLOS {
  constructor(public proc: (value: Value) => Value) { };
}


/*
    ## Neutral Expressions ##
    Neutral expressions are represented by structs that ensure that no
    non-neutral expressions can be represented.
*/

// Base class for all Neutral types
class Neutral {
  constructor(public whichKind: string) { }; // could be used to store the type of the Neutral expression
}

// Neutral expression classes
class N_Var extends Neutral {
  constructor(public name: Symbol) {
    super("N_Var");
  }
}

class N_TODO extends Neutral {
  constructor(public where: Srcloc, public type: Value) {
    super("N_TODO");
  }
}

class N_WhichNat extends Neutral {
  constructor(public target: Neutral, public base: Norm, public step: Norm) {
    super("N_WhichNat");
  }
}

class N_IterNat extends Neutral {
  constructor(public target: Neutral, public base: Norm, public step: Norm) {
    super("N_IterNat");
  }
}

class N_RecNat extends Neutral {
  constructor(public target: Neutral, public base: Norm, public step: Norm) {
    super("N_RecNat");
  }
}

class N_IndNat extends Neutral {
  constructor(public target: Neutral, public motive: Norm, public base: Norm, public step: Norm) {
    super("N_IndNat");
  }
}

class N_Car extends Neutral {
  constructor(public target: Neutral) {
    super("N_Car");
  }
}

class N_Cdr extends Neutral {
  constructor(public target: Neutral) {
    super("N_Cdr");
  }
}

class N_RecList extends Neutral {
  constructor(public target: Neutral, public base: Norm, public step: Norm) {
    super("N_RecList");
  }
}

class N_IndList extends Neutral {
  constructor(public target: Neutral, public motive: Norm, public base: Norm, public step: Norm) {
    super("N_IndList");
  }
}

class N_IndAbsurd extends Neutral {
  constructor(public target: Neutral, public motive: Norm) {
    super("N_IndAbsurd");
  }
}

class N_Replace extends Neutral {
  constructor(public target: Neutral, public motive: Norm, public base: Norm) {
    super("N_Replace");
  }
}

class N_Trans1 extends Neutral {
  constructor(public target1: Neutral, public target2: Norm) {
    super("N_Trans1");
  }
}

class N_Trans2 extends Neutral {
  constructor(public target1: Norm, public target2: Neutral) {
    super("N_Trans2");
  }
}

class N_Trans12 extends Neutral {
  constructor(public target1: Neutral, public target2: Neutral) {
    super("N_Trans12");
  }
}

class N_Cong extends Neutral {
  constructor(public target: Neutral, public func: Norm) {
    super("N_Cong");
  }
}

class N_Symm extends Neutral {
  constructor(public target: Neutral) {
    super("N_Symm");
  }
}

class N_IndEq extends Neutral {
  constructor(public target: Neutral, public motive: Norm, public base: Norm) {
    super("N_IndEq");
  }
}

class N_Head extends Neutral {
  constructor(public target: Neutral) {
    super("N_Head");
  }
}

class N_Tail extends Neutral {
  constructor(public target: Neutral) {
    super("N_Tail");
  }
}

class N_IndVec1 extends Neutral {
  constructor(public target1: Neutral, public target2: Norm, public motive: Norm,
    public base: Norm, public step: Norm) {
    super("N_IndVec1");
  }
}

class N_IndVec2 extends Neutral {
  constructor(public target1: Norm, public target2: Neutral, public motive: Norm,
    public base: Norm, public step: Norm) {
    super("N_IndVec2");
  }
}

class N_IndVec12 extends Neutral {
  constructor(public target1: Neutral, public target2: Neutral, public motive: Norm,
    public base: Norm, public step: Norm) {
    super("N_IndVec12");
  }
}

class N_IndEither extends Neutral {
  constructor(public target: Neutral, public motive: Norm,
    public baseLeft: Norm, public baseRight: Norm) {
    super("N_IndEither");
  }
}

class N_Ap extends Neutral {
  constructor(public rator: Neutral, public rand: Norm) {
    super("N_Ap");
  }
}

// Predicate function to check if an object is Neutral
function isNeutral(obj: any): obj is Neutral {
  return obj instanceof Neutral;
}

/*
    Normal forms consist of syntax that is produced by read-back,
    following the type. This structure contains a type value and a
    value described by the type, so that read-back can later be applied
    to it.
*/
class Norm {
  constructor(public type: Value, public value: Value) { }
}

// Predicate function to check if an object is Norm
function isNorm(obj: any): obj is Norm {
  return obj instanceof Norm;
}


/*
    ## Contexts ##
    A context maps free variable names to binders.
*/

type Ctx = Array<[Symbol, Binder]>;

/*
    There are three kinds of binders: a free binder represents a free
    variable, that was bound in some larger context by λ, Π, or Σ. A
    def binder represents a name bound by define. A claim binder
    doesn't actually bind a name; however, it reserves the name for
    later definition with define and records the type that will be
    used.
*/
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


// Function to find the type of a variable in a context
function varType(ctx: Ctx, where: Loc, x: Symbol): Perhaps<Value> {
  if (ctx.length === 0) {
    throw new Error(`Unknown variable ${x}`);
  }

  const [[y, binder], ...ctxNext] = ctx;
  if (binder instanceof Claim) {
    return varType(ctxNext, where, x);
  } else if (y.toString() === x.toString()) {
    return new go(binderType(binder));
  } else {
    return varType(ctxNext, where, x);
  }
}

// Function to extract the type from a binder
function binderType(binder: Binder): Value {
  if (binder instanceof Claim || binder instanceof Def
    || binder instanceof Free) {
    return binder.type;
  }
  throw new Error('Invalid binder type');
}

// The starting context is empty
const initCtx: Ctx = [];

// Function to bind a free variable in a context
function bindFree(ctx: Ctx, x: Symbol, tv: Value): Ctx {
  if (ctx.some(([name, _]) => name.toString() === x.toString())) {
    throw new Error(`${x.toString()} is already bound in ${JSON.stringify(ctx)}`);
  }
  return [[x, new Free(tv)], ...ctx];
}

// Function to bind a value in a context
function bindVal(ctx: Ctx, x: Symbol, tv: Value, v: Value): Ctx {
  return [[x, new Def(tv, v)], ...ctx];
}

// Serializable context type
type SerializableCtx = Array<[Symbol, ['free', Core] | ['def', Core, Core] | ['claim', Core]]>;

// Predicate to check if something is a serializable context
function isSerializableCtx(ctx: any): ctx is SerializableCtx {
  return Array.isArray(ctx) && ctx.every(item =>
    Array.isArray(item) &&
    typeof item[0] === 'string' &&
    Array.isArray(item[1]) &&
    ['free', 'def', 'claim'].includes(item[1][0])
  );
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
function isVarName(symbol: Symbol): boolean {
  const symbolStr = symbol.toString().slice(7, -1); // Remove 'Symbol(' and ')'
  return PieKeyword[symbolStr] === undefined;
}

/*
  ## Error Handling ##
  
  Messages to be shown to the user contain a mix of text (represented
  as strings) and expressions (represented as Core Pie expressions).
*/
type Message = Array<string | Core>;

/*
  The result of an operation that can fail, such as type checking, is
  represented using either the stop or the go structures.
*/
abstract class Perhaps<T> {
  abstract isGo(): boolean;
}

class go<T> extends Perhaps<T> {
  constructor(public result: T) { super() }
  isGo(): boolean {
    return true;
  }
}

// A failure result named "stop"
class stop extends Perhaps<undefined> {
  constructor(public where: Loc, public message: Message) { super() }
  isGo(): boolean {
    return false;
  }
}


/*
  go-on is very much like let*. The difference is that if any of the
  values bound to variables in it are stop, then the entire
  expression becomes that first stop. Otherwise, the variables are
  bound to the contents of each go.
*/
// review this function when needed: BUG MAY OCCUR
function goOn(
  bindings: Array<[TSMeta, (() => Perhaps<any>)]>,
  finalExpr: () => any
): stop | any {
  if (bindings.length === 0) {
    return finalExpr();
  }
  const [[meta, perhapsf], ...rest] = bindings;
  const perhaps = perhapsf();
  if (perhaps.isGo()) {
    meta.value = (perhaps as go<any>).result;
    return goOn(rest, finalExpr);
  } else {
    return perhaps;
  }
}


/*

  ## Fresh Names ##

  Find a fresh name, using none of those described in a context.
  This is the implementation of the Γ ⊢ fresh ↝ x form of
  judgment. Unlike the rules in the appendix to The Little Typer,
  this implementation also accepts a name suggestion so that the code
  produced by elaboration has names that are as similar as possible
  to those written by the user.

*/

function fresh(ctx: Ctx, name: Symbol): Symbol {
  return freshen(namesOnly(ctx), name);
}

// Find the names that are described in a context,
// so they can be avoided.
function namesOnly(ctx: Ctx): Symbol[] {
  if (ctx.length === 0) {
    return [];
  } else {
    return [ctx[0][0], ...namesOnly(ctx.slice(1))];
  }
}

/*
  Find a fresh name, using none of those described in a context nor
  occurring in an expression. This is used when constructing a fresh
  binding to avoid capturing a free variable that would otherwise be
  an error because it points at the context.
*/
function freshBinder(ctx: Ctx, expr: Src, name: Symbol): Symbol {
  return freshen([...namesOnly(ctx), ...occurringNames(expr)], name);
}


/*
  Find all the names that occur in an expression. For correctness, we
  need only find the free identifiers, but finding the bound
  identifiers as well means that the bindings introduced by
  desugaring expressions are more different from the program as
  written, which can help readability of internals.
*/

function occurringNames(expr: Src): Symbol[] {
  if (Array.isArray(expr.stx)) {
    // case of variable
    if (typeof expr.stx === 'symbol') {
      if (isVarName(expr.stx)) {
        return [expr.stx];
      }
      return [];
    }
    //case of [Src, Src, Src[]];
    if (expr.stx[0] instanceof Src) {
      const f = expr.stx[0] as Src;
      const arg0 = expr.stx[1] as Src;
      const args = expr.stx[2] as Src[];
      return [
        ...occurringNames(f),
        ...occurringNames(arg0),
        ...args.flatMap(occurringNames)
      ];
    }
    // other cases
    switch (expr.stx[0]) {
      case 'quote': return [];
      case 'add1':
      case 'car':
      case 'cdr':
      case 'same':
      case 'symm':
      case 'head':
      case 'tail':
      case 'List':
      case 'left':
      case 'right':
        return occurringNames(expr.stx[1]);
      case 'Pair':
      case 'cons':
      case 'Vec':
      case 'vec::':
      case 'cong':
      case 'trans':
      case 'the':
      case 'Either':
      case 'ind-Absurd':
        return [
          ...occurringNames(expr.stx[1]),
          ...occurringNames(expr.stx[2])
        ];
      case 'which-Nat':
      case 'iter-Nat':
      case 'rec-Nat':
      case 'replace':
      case '=':
      case 'ind-=':
      case 'rec-List':
        return [
          ...occurringNames(expr.stx[1]),
          ...occurringNames(expr.stx[2]),
          ...occurringNames(expr.stx[3])
        ];
      /*
        (List 'Π (List* Typed-Binder (Listof Typed-Binder)) Src)
        (List 'λ (List* Binding-Site (Listof Binding-Site)) Src)
        (List 'Σ (List* Typed-Binder (Listof Typed-Binder)) Src)
      */
      case 'λ':
        return [...expr.stx[1].map(x => x.varName), ...occurringNames(expr.stx[2])];
      case 'Π':
      case 'Σ':
        return [
          ...expr.stx[1].flatMap(x => occurringBinderNames(x)),
          ...occurringNames(expr.stx[2])
        ];
      case 'ind-List':
      case 'ind-Nat':
      case 'ind-Either':
        return [
          ...occurringNames(expr.stx[1]),
          ...occurringNames(expr.stx[2]),
          ...occurringNames(expr.stx[3]),
          ...occurringNames(expr.stx[4]),
        ];
      case 'ind-Vec':
        return [
          ...occurringNames(expr.stx[1]),
          ...occurringNames(expr.stx[2]),
          ...occurringNames(expr.stx[3]),
          ...occurringNames(expr.stx[4]),
          ...occurringNames(expr.stx[5]),
        ];
    }
  }
  return [];
}

function occurringBinderNames(b: TypedBinder): Symbol[] {
  const [binder, site] = b;
  return [binder.varName, ...occurringNames(site)];
}

class MetaVar {
  constructor(public value: Value | null, public varType: Value, public name: Symbol) { }
};

abstract class TSMeta {
  public value;
  public name: Symbol;
}

class TSMetaCore extends TSMeta {
  constructor(public value: Core | null, public name: Symbol) {
    super();
  }
}


class TSMetaValue extends TSMeta {
  constructor(public value: Value | null, public name: Symbol) {
    super();
  }
}

class TSMetaVoid extends TSMeta {
  constructor(public value: any | null, public name: Symbol) {
    super();
  }
}


export {
  Src,
  SrcStx,
  Core,
  Value,
  Env,
  Closure,
  Neutral,
  N_Car,
  N_IterNat,
  Norm,
  Ctx,
  Binder,
  Claim,
  Def,
  Free,
  bindFree,
  bindVal,
  varType,
  varVal,
  extendEnv,
  ctxToEnv,
  initCtx,
  fresh,
  freshBinder,
  N_Var,
  DELAY,
  DELAY_CLOS,
  Box,
  LAM,
  N_Ap,
  NEU,
  N_IndAbsurd,
  N_TODO,
  N_IndEither,
  N_IndVec1,
  N_IndVec2,
  N_IndVec12,
  FO_CLOS,
  HO_CLOS,
  ADD1,
  PI,
  SIGMA,
  CONS,
  QUOTE,
  LIST_CONS,
  LIST,
  EQUAL,
  SAME,
  N_Replace,
  VEC,
  N_Head,
  N_Tail,
  VEC_CONS,
  EITHER,
  LEFT,
  RIGHT,
  isVarName,
  SerializableCtx,
  N_WhichNat,
  N_Cdr,
  N_IndList,
  N_RecNat,
  N_IndNat,
  N_RecList,
  N_Trans1,
  N_Trans2,
  N_Trans12,
  N_Cong,
  stop,
  N_Symm,
  N_IndEq,
  MetaVar,
  Loc,
  isCore,
  Perhaps,
  srcStx,
  srcLoc,
  go,
  goOn,
  TSMeta,
  TSMetaValue,
  TSMetaCore,
  TSMetaVoid,
  Srcloc,
  BindingSite,
  TypedBinder,
};

