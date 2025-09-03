"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.HigherOrderClosure = exports.FirstOrderClosure = exports.Closure = exports.PerhapsM = exports.stop = exports.go = exports.Perhaps = exports.Message = exports.TypedBinder = exports.SiteBinder = void 0;
exports.isPieKeywords = isPieKeywords;
exports.goOn = goOn;
exports.isVarName = isVarName;
exports.fresh = fresh;
exports.freshBinder = freshBinder;
exports.occurringBinderNames = occurringBinderNames;
const environment_1 = require("../utils/environment");
const fresh_1 = require("../utils/fresh");
// A SiteBinder is a variable name and its location, substitute BindingSite in original code.
class SiteBinder {
    constructor(location, varName) {
        this.location = location;
        this.varName = varName;
    }
}
exports.SiteBinder = SiteBinder;
// Define TypedBinder, which is a SiteBinder associated with a expression in Pie.
class TypedBinder {
    constructor(binder, type) {
        this.binder = binder;
        this.type = type;
    }
}
exports.TypedBinder = TypedBinder;
function isPieKeywords(str) {
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
class Message {
    constructor(message) {
        this.message = message;
    }
    toString() {
        return this.message.map(m => typeof m === 'string' ? m : m.prettyPrint()).join(' ');
    }
}
exports.Message = Message;
class Perhaps {
}
exports.Perhaps = Perhaps;
class go extends Perhaps {
    constructor(result) {
        super();
        this.result = result;
    }
}
exports.go = go;
// A failure result named "stop"
class stop extends Perhaps {
    constructor(where, message) {
        super();
        this.where = where;
        this.message = message;
    }
}
exports.stop = stop;
class PerhapsM {
    // name is majorly for debugging use.
    constructor(name, value = null) {
        this.name = name;
        this.value = value;
    }
}
exports.PerhapsM = PerhapsM;
/*
  go-on is very much like let*. The difference is that if any of the
  values bound to variables in it are stop, then the entire
  expression becomes that first stop. Otherwise, the variables are
  bound to the contents of each go.
*/
function goOn(bindings, finalExpr) {
    for (const [meta, lazy] of bindings) {
        const val = lazy();
        if (val instanceof go) {
            meta.value = val.result;
        }
        else {
            throw new Error(`Encountered stop when evaluating the sequence ${bindings}. Error message: ${val.message.message} at ${val.where}`);
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
class Closure {
    constructor() { }
}
exports.Closure = Closure;
/*
  First-order closures, which are a pair of an environment an an
  expression whose free variables are given values by the
  environment, are used for most closures in Pie. They are easier to
  debug, because their contents are visible rather than being part of
  a compiled Racket function. On the other hand, they are more
  difficult to construct out of values, because it would be necessary
  to first read the values back into Core Pie syntax.
*/
class FirstOrderClosure extends Closure {
    constructor(env, varName, expr) {
        super();
        this.env = env;
        this.varName = varName;
        this.expr = expr;
    }
    valOfClosure(v) {
        return this.expr.valOf((0, environment_1.extendEnvironment)(this.env, this.varName, v));
    }
    prettyPrint() {
        return `(CLOS ${this.varName} ${this.expr.prettyPrint()})`;
    }
    toString() {
        return this.prettyPrint();
    }
}
exports.FirstOrderClosure = FirstOrderClosure;
/*
  Higher-order closures re-used Racket's built-in notion of
  closure. They are more convenient when constructing closures from
  existing values, which happens both during type checking, where
  these values are used for things like the type of a step, and
  during evaluation, where they are used as type annotations on THE
  and NEU.
*/
class HigherOrderClosure extends Closure {
    constructor(proc) {
        super();
        this.proc = proc;
    }
    ;
    valOfClosure(v) {
        return this.proc(v);
    }
    prettyPrint() {
        return `(HOCLOS)`;
    }
    toString() {
        return this.prettyPrint();
    }
}
exports.HigherOrderClosure = HigherOrderClosure;
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
function isVarName(name) {
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
function namesInContext(ctx) {
    return Array.from(ctx.keys());
}
function fresh(ctx, name) {
    return (0, fresh_1.freshen)(namesInContext(ctx), name);
}
/*
  Find a fresh name, using none of those described in a context nor
  occurring in an expression. This is used when constructing a fresh
  binding to avoid capturing a free variable that would otherwise be
  an error because it points at the context.
*/
function freshBinder(ctx, src, name) {
    return (0, fresh_1.freshen)(namesInContext(ctx).concat(src.findNames()), name);
}
function occurringBinderNames(binder) {
    return [binder.binder.varName].concat(binder.type.findNames());
}
//# sourceMappingURL=utils.js.map