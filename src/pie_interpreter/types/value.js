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
exports.Absurd = exports.Sole = exports.Trivial = exports.Atom = exports.Universe = exports.Neutral = exports.Right = exports.Left = exports.Either = exports.VecCons = exports.VecNil = exports.Vec = exports.Same = exports.Equal = exports.ListCons = exports.Nil = exports.List = exports.Cons = exports.Sigma = exports.Lambda = exports.Pi = exports.Add1 = exports.Zero = exports.Nat = exports.Quote = exports.Delay = exports.Box = exports.DelayClosure = exports.Value = void 0;
var C = require("./core");
var N = require("./neutral");
var context_1 = require("../utils/context");
var utils_1 = require("./utils");
var utils_2 = require("../evaluator/utils");
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
    that represent values are written with prefix V_.

    Laziness is implemented by allowing values to be a closure that
    does not bind a variable. It is described in normalize.rkt (search
    for "Call-by-need").
*/
var Value = /** @class */ (function () {
    function Value() {
    }
    /*
    now demands the _actual_ value represented by a DELAY. If the value
    is a DELAY-CLOS, then it is computed using undelay. If it is
    anything else, then it has already been computed, so it is
    returned.
    
    now should be used any time that a value is inspected to see what
    form it has, because those situations require that the delayed
    evaluation steps be carried out.
    */
    Value.prototype.now = function () {
        return this;
    };
    return Value;
}());
exports.Value = Value;
var DelayClosure = /** @class */ (function () {
    function DelayClosure(env, expr) {
        this.env = env;
        this.expr = expr;
    }
    /*
      undelay is used to find the value that is contained in a
      DELAY-CLOS closure by invoking the evaluator.
    */
    DelayClosure.prototype.undelay = function () {
        return this.expr.valOf(this.env).now();
    };
    DelayClosure.prototype.toString = function () {
        return "DelayClosure(".concat(this.env, ", ").concat(this.expr, ")");
    };
    return DelayClosure;
}());
exports.DelayClosure = DelayClosure;
var Box = /** @class */ (function () {
    function Box(value) {
        this.content = value;
    }
    Box.prototype.get = function () {
        return this.content;
    };
    Box.prototype.set = function (value) {
        this.content = value;
    };
    return Box;
}());
exports.Box = Box;
var Delay = /** @class */ (function (_super) {
    __extends(Delay, _super);
    function Delay(val) {
        var _this = _super.call(this) || this;
        _this.val = val;
        return _this;
    }
    Delay.prototype.now = function () {
        var boxContent = this.val.get();
        if (boxContent instanceof DelayClosure) {
            var theValue = boxContent.undelay();
            this.val.set(theValue);
            return theValue;
        }
        else { // content is a Value (content instanceof Value).
            return boxContent;
        }
    };
    Delay.prototype.readBackType = function (context) {
        return this.now().readBackType(context);
    };
    Delay.prototype.prettyPrint = function () {
        return this.now().prettyPrint();
    };
    Delay.prototype.toString = function () {
        return "Delay(".concat(this.val, ")");
    };
    return Delay;
}(Value));
exports.Delay = Delay;
var Quote = /** @class */ (function (_super) {
    __extends(Quote, _super);
    function Quote(name) {
        var _this = _super.call(this) || this;
        _this.name = name;
        return _this;
    }
    Quote.prototype.readBackType = function (context) {
        throw new Error("No readBackType for Quote.");
    };
    Quote.prototype.prettyPrint = function () {
        return "'".concat(this.name);
    };
    Quote.prototype.toString = function () {
        return this.prettyPrint();
    };
    return Quote;
}(Value));
exports.Quote = Quote;
var Nat = /** @class */ (function (_super) {
    __extends(Nat, _super);
    function Nat() {
        return _super.call(this) || this;
    }
    Nat.prototype.readBackType = function (context) {
        return new C.Nat();
    };
    Nat.prototype.prettyPrint = function () {
        return 'Nat';
    };
    Nat.prototype.toString = function () {
        return this.prettyPrint();
    };
    return Nat;
}(Value));
exports.Nat = Nat;
var Zero = /** @class */ (function (_super) {
    __extends(Zero, _super);
    function Zero() {
        return _super.call(this) || this;
    }
    Zero.prototype.readBackType = function (context) {
        throw new Error("No readBackType for Zero.");
    };
    Zero.prototype.prettyPrint = function () {
        return 'zero';
    };
    Zero.prototype.toString = function () {
        return this.prettyPrint();
    };
    return Zero;
}(Value));
exports.Zero = Zero;
var Add1 = /** @class */ (function (_super) {
    __extends(Add1, _super);
    function Add1(smaller) {
        var _this = _super.call(this) || this;
        _this.smaller = smaller;
        return _this;
    }
    Add1.prototype.readBackType = function (context) {
        throw new Error("No readBackType for Add1.");
    };
    Add1.prototype.prettyPrint = function () {
        return "(add1 ".concat(this.smaller.prettyPrint(), ")");
    };
    Add1.prototype.toString = function () {
        return this.prettyPrint();
    };
    return Add1;
}(Value));
exports.Add1 = Add1;
var Pi = /** @class */ (function (_super) {
    __extends(Pi, _super);
    function Pi(argName, argType, resultType) {
        var _this = _super.call(this) || this;
        _this.argName = argName;
        _this.argType = argType;
        _this.resultType = resultType;
        return _this;
    }
    Pi.prototype.readBackType = function (context) {
        var Aexpr = this.argType.readBackType(context);
        var freshedName = (0, utils_1.fresh)(context, this.argName);
        var excludeNameCtx = (0, context_1.bindFree)(context, freshedName, this.argType);
        return new C.Pi(freshedName, Aexpr, this.resultType
            .valOfClosure(new Neutral(this.argType, new N.Variable(freshedName)))
            .readBackType(excludeNameCtx));
    };
    Pi.prototype.prettyPrint = function () {
        return "(\u03A0 ".concat(this.argName, " ").concat(this.argType.prettyPrint(), " ").concat(this.resultType.prettyPrint(), ")");
    };
    Pi.prototype.toString = function () {
        return this.prettyPrint();
    };
    return Pi;
}(Value));
exports.Pi = Pi;
var Lambda = /** @class */ (function (_super) {
    __extends(Lambda, _super);
    function Lambda(argName, body) {
        var _this = _super.call(this) || this;
        _this.argName = argName;
        _this.body = body;
        return _this;
    }
    Lambda.prototype.readBackType = function (context) {
        throw new Error("No readBackType for Lambda.");
    };
    Lambda.prototype.prettyPrint = function () {
        return "(lambda ".concat(this.argName, " ").concat(this.body.prettyPrint(), ")");
    };
    Lambda.prototype.toString = function () {
        return this.prettyPrint();
    };
    return Lambda;
}(Value));
exports.Lambda = Lambda;
var Sigma = /** @class */ (function (_super) {
    __extends(Sigma, _super);
    function Sigma(carName, carType, cdrType) {
        var _this = _super.call(this) || this;
        _this.carName = carName;
        _this.carType = carType;
        _this.cdrType = cdrType;
        return _this;
    }
    Sigma.prototype.readBackType = function (context) {
        var Aexpr = this.carType.readBackType(context);
        var freshedName = (0, utils_1.fresh)(context, this.carName);
        var excludeNameCtx = (0, context_1.bindFree)(context, freshedName, this.carType);
        return new C.Sigma(freshedName, Aexpr, this.cdrType
            .valOfClosure(new Neutral(this.carType, new N.Variable(freshedName)))
            .readBackType(excludeNameCtx));
    };
    Sigma.prototype.prettyPrint = function () {
        return "(\u03A3 ".concat(this.carName, " ").concat(this.carType.prettyPrint(), " ").concat(this.cdrType.prettyPrint(), ")");
    };
    Sigma.prototype.toString = function () {
        return this.prettyPrint();
    };
    return Sigma;
}(Value));
exports.Sigma = Sigma;
var Cons = /** @class */ (function (_super) {
    __extends(Cons, _super);
    function Cons(car, cdr) {
        var _this = _super.call(this) || this;
        _this.car = car;
        _this.cdr = cdr;
        return _this;
    }
    Cons.prototype.readBackType = function (context) {
        throw new Error("No readBackType for Cons.");
    };
    Cons.prototype.prettyPrint = function () {
        return "(cons ".concat(this.car.prettyPrint(), " ").concat(this.cdr.prettyPrint(), ")");
    };
    Cons.prototype.toString = function () {
        return this.prettyPrint();
    };
    return Cons;
}(Value));
exports.Cons = Cons;
var List = /** @class */ (function (_super) {
    __extends(List, _super);
    function List(entryType) {
        var _this = _super.call(this) || this;
        _this.entryType = entryType;
        return _this;
    }
    List.prototype.readBackType = function (context) {
        return new C.List(this.entryType.readBackType(context));
    };
    List.prototype.prettyPrint = function () {
        return "(List ".concat(this.entryType.prettyPrint(), ")");
    };
    List.prototype.toString = function () {
        return this.prettyPrint();
    };
    return List;
}(Value));
exports.List = List;
var Nil = /** @class */ (function (_super) {
    __extends(Nil, _super);
    function Nil() {
        return _super.call(this) || this;
    }
    Nil.prototype.readBackType = function (context) {
        throw new Error("No readBackType for Nil.");
    };
    Nil.prototype.prettyPrint = function () {
        return 'nil';
    };
    Nil.prototype.toString = function () {
        return this.prettyPrint();
    };
    return Nil;
}(Value));
exports.Nil = Nil;
var ListCons = /** @class */ (function (_super) {
    __extends(ListCons, _super);
    function ListCons(head, tail) {
        var _this = _super.call(this) || this;
        _this.head = head;
        _this.tail = tail;
        return _this;
    }
    ListCons.prototype.readBackType = function (context) {
        throw new Error("No readBackType for ListCons.");
    };
    ListCons.prototype.prettyPrint = function () {
        return "(:: ".concat(this.head.prettyPrint(), " ").concat(this.tail.prettyPrint(), ")");
    };
    ListCons.prototype.toString = function () {
        return this.prettyPrint();
    };
    return ListCons;
}(Value));
exports.ListCons = ListCons;
var Equal = /** @class */ (function (_super) {
    __extends(Equal, _super);
    function Equal(type, from, to) {
        var _this = _super.call(this) || this;
        _this.type = type;
        _this.from = from;
        _this.to = to;
        return _this;
    }
    Equal.prototype.readBackType = function (context) {
        return new C.Equal(this.type.readBackType(context), (0, utils_2.readBack)(context, this.type, this.from), (0, utils_2.readBack)(context, this.type, this.to));
    };
    Equal.prototype.prettyPrint = function () {
        return "(= ".concat(this.type.prettyPrint(), " ").concat(this.from.prettyPrint(), " ").concat(this.to.prettyPrint(), ")");
    };
    Equal.prototype.toString = function () {
        return this.prettyPrint();
    };
    return Equal;
}(Value));
exports.Equal = Equal;
var Same = /** @class */ (function (_super) {
    __extends(Same, _super);
    function Same(value) {
        var _this = _super.call(this) || this;
        _this.value = value;
        return _this;
    }
    Same.prototype.readBackType = function (context) {
        throw new Error("No readBackType for Same.");
    };
    Same.prototype.prettyPrint = function () {
        return "(same ".concat(this.value.prettyPrint(), ")");
    };
    Same.prototype.toString = function () {
        return this.prettyPrint();
    };
    return Same;
}(Value));
exports.Same = Same;
var Vec = /** @class */ (function (_super) {
    __extends(Vec, _super);
    function Vec(entryType, length) {
        var _this = _super.call(this) || this;
        _this.entryType = entryType;
        _this.length = length;
        return _this;
    }
    Vec.prototype.readBackType = function (context) {
        return new C.Vec(this.entryType.readBackType(context), (0, utils_2.readBack)(context, new Nat(), this.length));
    };
    Vec.prototype.prettyPrint = function () {
        return "(Vec ".concat(this.entryType.prettyPrint(), " ").concat(this.length.prettyPrint(), ")");
    };
    return Vec;
}(Value));
exports.Vec = Vec;
var VecNil = /** @class */ (function (_super) {
    __extends(VecNil, _super);
    function VecNil() {
        return _super.call(this) || this;
    }
    VecNil.prototype.readBackType = function (context) {
        throw new Error("No readBackType for VecNil.");
    };
    VecNil.prototype.prettyPrint = function () {
        return 'vecnil';
    };
    VecNil.prototype.toString = function () {
        return this.prettyPrint();
    };
    return VecNil;
}(Value));
exports.VecNil = VecNil;
var VecCons = /** @class */ (function (_super) {
    __extends(VecCons, _super);
    function VecCons(head, tail) {
        var _this = _super.call(this) || this;
        _this.head = head;
        _this.tail = tail;
        return _this;
    }
    VecCons.prototype.readBackType = function (context) {
        throw new Error("No readBackType for VecCons.");
    };
    VecCons.prototype.prettyPrint = function () {
        return "(vec:: ".concat(this.head.prettyPrint(), " ").concat(this.tail.prettyPrint(), ")");
    };
    VecCons.prototype.toString = function () {
        return this.prettyPrint();
    };
    return VecCons;
}(Value));
exports.VecCons = VecCons;
var Either = /** @class */ (function (_super) {
    __extends(Either, _super);
    function Either(leftType, rightType) {
        var _this = _super.call(this) || this;
        _this.leftType = leftType;
        _this.rightType = rightType;
        return _this;
    }
    Either.prototype.readBackType = function (context) {
        return new C.Either(this.leftType.readBackType(context), this.rightType.readBackType(context));
    };
    Either.prototype.prettyPrint = function () {
        return "(Either ".concat(this.leftType.prettyPrint(), " ").concat(this.rightType.prettyPrint(), ")");
    };
    Either.prototype.toString = function () {
        return this.prettyPrint();
    };
    return Either;
}(Value));
exports.Either = Either;
var Left = /** @class */ (function (_super) {
    __extends(Left, _super);
    function Left(value) {
        var _this = _super.call(this) || this;
        _this.value = value;
        return _this;
    }
    Left.prototype.readBackType = function (context) {
        throw new Error("No readBackType for Left.");
    };
    Left.prototype.prettyPrint = function () {
        return "(left ".concat(this.value.prettyPrint(), ")");
    };
    Left.prototype.toString = function () {
        return this.prettyPrint();
    };
    return Left;
}(Value));
exports.Left = Left;
var Right = /** @class */ (function (_super) {
    __extends(Right, _super);
    function Right(value) {
        var _this = _super.call(this) || this;
        _this.value = value;
        return _this;
    }
    Right.prototype.readBackType = function (context) {
        throw new Error("No readBackType for Right.");
    };
    Right.prototype.prettyPrint = function () {
        return "(right ".concat(this.value.prettyPrint(), ")");
    };
    Right.prototype.toString = function () {
        return this.prettyPrint();
    };
    return Right;
}(Value));
exports.Right = Right;
var Neutral = /** @class */ (function (_super) {
    __extends(Neutral, _super);
    function Neutral(type, neutral) {
        var _this = _super.call(this) || this;
        _this.type = type;
        _this.neutral = neutral;
        return _this;
    }
    Neutral.prototype.readBackType = function (context) {
        return this.neutral.readBackNeutral(context);
    };
    Neutral.prototype.prettyPrint = function () {
        return "(Neutral ".concat(this.type.prettyPrint(), " ").concat(this.neutral.prettyPrint(), ")");
    };
    Neutral.prototype.toString = function () {
        return this.prettyPrint();
    };
    return Neutral;
}(Value));
exports.Neutral = Neutral;
var Universe = /** @class */ (function (_super) {
    __extends(Universe, _super);
    function Universe() {
        return _super.call(this) || this;
    }
    Universe.prototype.readBackType = function (context) {
        return new C.Universe();
    };
    Universe.prototype.prettyPrint = function () {
        return 'U';
    };
    Universe.prototype.toString = function () {
        return this.prettyPrint();
    };
    return Universe;
}(Value));
exports.Universe = Universe;
var Atom = /** @class */ (function (_super) {
    __extends(Atom, _super);
    function Atom() {
        return _super.call(this) || this;
    }
    Atom.prototype.readBackType = function (context) {
        return new C.Atom();
    };
    Atom.prototype.prettyPrint = function () {
        return 'Atom';
    };
    Atom.prototype.toString = function () {
        return this.prettyPrint();
    };
    return Atom;
}(Value));
exports.Atom = Atom;
var Trivial = /** @class */ (function (_super) {
    __extends(Trivial, _super);
    function Trivial() {
        return _super.call(this) || this;
    }
    Trivial.prototype.readBackType = function (context) {
        return new C.Trivial();
    };
    Trivial.prototype.prettyPrint = function () {
        return 'Trivial';
    };
    Trivial.prototype.toString = function () {
        return this.prettyPrint();
    };
    return Trivial;
}(Value));
exports.Trivial = Trivial;
var Sole = /** @class */ (function (_super) {
    __extends(Sole, _super);
    function Sole() {
        return _super.call(this) || this;
    }
    Sole.prototype.readBackType = function (context) {
        throw new Error("No readBackType for Sole.");
    };
    Sole.prototype.prettyPrint = function () {
        return 'sole';
    };
    Sole.prototype.toString = function () {
        return this.prettyPrint();
    };
    return Sole;
}(Value));
exports.Sole = Sole;
var Absurd = /** @class */ (function (_super) {
    __extends(Absurd, _super);
    function Absurd() {
        return _super.call(this) || this;
    }
    Absurd.prototype.readBackType = function (context) {
        return new C.Absurd();
    };
    Absurd.prototype.prettyPrint = function () {
        return 'Absurd';
    };
    Absurd.prototype.toString = function () {
        return this.prettyPrint();
    };
    return Absurd;
}(Value));
exports.Absurd = Absurd;
