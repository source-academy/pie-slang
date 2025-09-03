"use strict";
var __extends = (this && this.__extends) || (function () {
    var extendStatics = function (d, b) {
        extendStatics = Object.setPrototypeOf ||
            ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
            function (d, b) { for (var p in b) if (Object.prototype.hasOwnProperty.call(b, p)) d[p] = b[p]; };
        return extendStatics(d, b);
    };
    return function (d, b) {
        if (typeof b !== "function" && b !== null)
            throw new TypeError("Class extends value " + String(b) + " is not a constructor or null");
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.HigherOrderClosure = exports.FirstOrderClosure = exports.Closure = exports.PerhapsM = exports.stop = exports.go = exports.Perhaps = exports.Message = exports.TypedBinder = exports.SiteBinder = void 0;
exports.isPieKeywords = isPieKeywords;
exports.goOn = goOn;
exports.isVarName = isVarName;
exports.fresh = fresh;
exports.freshBinder = freshBinder;
exports.occurringBinderNames = occurringBinderNames;
var environment_1 = require("../utils/environment");
var fresh_1 = require("../utils/fresh");
// A SiteBinder is a variable name and its location, substitute BindingSite in original code.
var SiteBinder = /** @class */ (function () {
    function SiteBinder(location, varName) {
        this.location = location;
        this.varName = varName;
    }
    return SiteBinder;
}());
exports.SiteBinder = SiteBinder;
// Define TypedBinder, which is a SiteBinder associated with a expression in Pie.
var TypedBinder = /** @class */ (function () {
    function TypedBinder(binder, type) {
        this.binder = binder;
        this.type = type;
    }
    return TypedBinder;
}());
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
var Message = /** @class */ (function () {
    function Message(message) {
        this.message = message;
    }
    Message.prototype.toString = function () {
        return this.message.map(function (m) { return typeof m === 'string' ? m : m.prettyPrint(); }).join(' ');
    };
    return Message;
}());
exports.Message = Message;
var Perhaps = /** @class */ (function () {
    function Perhaps() {
    }
    return Perhaps;
}());
exports.Perhaps = Perhaps;
var go = /** @class */ (function (_super) {
    __extends(go, _super);
    function go(result) {
        var _this = _super.call(this) || this;
        _this.result = result;
        return _this;
    }
    return go;
}(Perhaps));
exports.go = go;
// A failure result named "stop"
var stop = /** @class */ (function (_super) {
    __extends(stop, _super);
    function stop(where, message) {
        var _this = _super.call(this) || this;
        _this.where = where;
        _this.message = message;
        return _this;
    }
    return stop;
}(Perhaps));
exports.stop = stop;
var PerhapsM = /** @class */ (function () {
    // name is majorly for debugging use.
    function PerhapsM(name, value) {
        if (value === void 0) { value = null; }
        this.name = name;
        this.value = value;
    }
    return PerhapsM;
}());
exports.PerhapsM = PerhapsM;
/*
  go-on is very much like let*. The difference is that if any of the
  values bound to variables in it are stop, then the entire
  expression becomes that first stop. Otherwise, the variables are
  bound to the contents of each go.
*/
function goOn(bindings, finalExpr) {
    for (var _i = 0, bindings_1 = bindings; _i < bindings_1.length; _i++) {
        var _a = bindings_1[_i], meta = _a[0], lazy = _a[1];
        var val = lazy();
        if (val instanceof go) {
            meta.value = val.result;
        }
        else {
            throw new Error("Encountered stop when evaluating the sequence ".concat(bindings, ". Error message: ").concat(val.message.message, " at ").concat(val.where));
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
var Closure = /** @class */ (function () {
    function Closure() {
    }
    return Closure;
}());
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
var FirstOrderClosure = /** @class */ (function (_super) {
    __extends(FirstOrderClosure, _super);
    function FirstOrderClosure(env, varName, expr) {
        var _this = _super.call(this) || this;
        _this.env = env;
        _this.varName = varName;
        _this.expr = expr;
        return _this;
    }
    FirstOrderClosure.prototype.valOfClosure = function (v) {
        return this.expr.valOf((0, environment_1.extendEnvironment)(this.env, this.varName, v));
    };
    FirstOrderClosure.prototype.prettyPrint = function () {
        return "(CLOS ".concat(this.varName, " ").concat(this.expr.prettyPrint(), ")");
    };
    FirstOrderClosure.prototype.toString = function () {
        return this.prettyPrint();
    };
    return FirstOrderClosure;
}(Closure));
exports.FirstOrderClosure = FirstOrderClosure;
/*
  Higher-order closures re-used Racket's built-in notion of
  closure. They are more convenient when constructing closures from
  existing values, which happens both during type checking, where
  these values are used for things like the type of a step, and
  during evaluation, where they are used as type annotations on THE
  and NEU.
*/
var HigherOrderClosure = /** @class */ (function (_super) {
    __extends(HigherOrderClosure, _super);
    function HigherOrderClosure(proc) {
        var _this = _super.call(this) || this;
        _this.proc = proc;
        return _this;
    }
    ;
    HigherOrderClosure.prototype.valOfClosure = function (v) {
        return this.proc(v);
    };
    HigherOrderClosure.prototype.prettyPrint = function () {
        return "(HOCLOS)";
    };
    HigherOrderClosure.prototype.toString = function () {
        return this.prettyPrint();
    };
    return HigherOrderClosure;
}(Closure));
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
