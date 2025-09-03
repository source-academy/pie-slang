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
exports.VarName = exports.Application = exports.TODO = exports.IndEither = exports.Right = exports.Left = exports.Either = exports.IndVec = exports.Tail = exports.Head = exports.VecNil = exports.VecCons = exports.Vec = exports.IndEqual = exports.Symm = exports.Cong = exports.Trans = exports.Replace = exports.Same = exports.Equal = exports.IndAbsurd = exports.Absurd = exports.Sole = exports.Trivial = exports.IndList = exports.RecList = exports.List = exports.Nil = exports.ListCons = exports.Cdr = exports.Car = exports.Cons = exports.Sigma = exports.Quote = exports.Atom = exports.Lambda = exports.Pi = exports.IndNat = exports.RecNat = exports.IterNat = exports.WhichNat = exports.Add1 = exports.Zero = exports.Nat = exports.Universe = exports.The = exports.Core = void 0;
var V = require("./value");
var N = require("./neutral");
var Evaluator = require("../evaluator/evaluator");
var environment_1 = require("../utils/environment");
var utils_1 = require("./utils");
/*
  ### Core Types ###

    Core Pie expressions are the result of type checking (elaborating)
    an expression written in Pie. They do not have source positions,
    because they by definition are not written by a user of the
    implementation.

*/
var Core = /** @class */ (function () {
    function Core() {
    }
    /*
      Original "later" function. It is used to delay the evaluation.
    */
    Core.prototype.toLazy = function (env) {
        return new V.Delay(new V.Box(new V.DelayClosure(env, this)));
    };
    return Core;
}());
exports.Core = Core;
var The = /** @class */ (function (_super) {
    __extends(The, _super);
    function The(type, expr) {
        var _this = _super.call(this) || this;
        _this.type = type;
        _this.expr = expr;
        return _this;
    }
    The.prototype.valOf = function (env) {
        return this.expr.valOf(env);
    };
    The.prototype.prettyPrint = function () {
        return "(the ".concat(this.type.prettyPrint(), " ").concat(this.expr.prettyPrint(), ")");
    };
    The.prototype.toString = function () {
        return this.prettyPrint();
    };
    return The;
}(Core));
exports.The = The;
var Universe = /** @class */ (function (_super) {
    __extends(Universe, _super);
    function Universe() {
        return _super !== null && _super.apply(this, arguments) || this;
    }
    Universe.prototype.valOf = function (env) {
        return new V.Universe();
    };
    Universe.prototype.prettyPrint = function () {
        return 'U';
    };
    Universe.prototype.toString = function () {
        return this.prettyPrint();
    };
    return Universe;
}(Core));
exports.Universe = Universe;
var Nat = /** @class */ (function (_super) {
    __extends(Nat, _super);
    function Nat() {
        return _super !== null && _super.apply(this, arguments) || this;
    }
    Nat.prototype.valOf = function (env) {
        return new V.Nat();
    };
    Nat.prototype.prettyPrint = function () {
        return 'Nat';
    };
    Nat.prototype.toString = function () {
        return this.prettyPrint();
    };
    return Nat;
}(Core));
exports.Nat = Nat;
var Zero = /** @class */ (function (_super) {
    __extends(Zero, _super);
    function Zero() {
        return _super !== null && _super.apply(this, arguments) || this;
    }
    Zero.prototype.valOf = function (env) {
        return new V.Zero();
    };
    Zero.prototype.prettyPrint = function () {
        return '0';
    };
    Zero.prototype.toString = function () {
        return this.prettyPrint();
    };
    return Zero;
}(Core));
exports.Zero = Zero;
var Add1 = /** @class */ (function (_super) {
    __extends(Add1, _super);
    function Add1(n) {
        var _this = _super.call(this) || this;
        _this.n = n;
        return _this;
    }
    Add1.prototype.valOf = function (env) {
        return new V.Add1(this.n.toLazy(env));
    };
    Add1.prototype.prettyPrint = function () {
        if (!isNaN(Number(this.n.prettyPrint()))) {
            return "".concat(Number(this.n.prettyPrint()) + 1);
        }
        return "(add1 ".concat(this.n.prettyPrint(), ")");
    };
    Add1.prototype.toString = function () {
        return this.prettyPrint();
    };
    return Add1;
}(Core));
exports.Add1 = Add1;
var WhichNat = /** @class */ (function (_super) {
    __extends(WhichNat, _super);
    function WhichNat(target, base, step) {
        var _this = _super.call(this) || this;
        _this.target = target;
        _this.base = base;
        _this.step = step;
        return _this;
    }
    WhichNat.prototype.valOf = function (env) {
        return Evaluator.doWhichNat(this.target.toLazy(env), this.base.type.toLazy(env), this.base.expr.toLazy(env), this.step.toLazy(env));
    };
    WhichNat.prototype.prettyPrint = function () {
        return "(which-Nat ".concat(this.target.prettyPrint(), " \n              ").concat(this.base.prettyPrint(), " \n              ").concat(this.step.prettyPrint(), ")");
    };
    WhichNat.prototype.toString = function () {
        return this.prettyPrint();
    };
    return WhichNat;
}(Core));
exports.WhichNat = WhichNat;
var IterNat = /** @class */ (function (_super) {
    __extends(IterNat, _super);
    function IterNat(target, base, step) {
        var _this = _super.call(this) || this;
        _this.target = target;
        _this.base = base;
        _this.step = step;
        return _this;
    }
    IterNat.prototype.valOf = function (env) {
        return Evaluator.doIterNat(this.target.toLazy(env), this.base.type.toLazy(env), this.base.expr.toLazy(env), this.step.toLazy(env));
    };
    IterNat.prototype.prettyPrint = function () {
        return "(iter-Nat ".concat(this.target.prettyPrint(), " \n              ").concat(this.base.prettyPrint(), " \n              ").concat(this.step.prettyPrint(), ")");
    };
    IterNat.prototype.toString = function () {
        return this.prettyPrint();
    };
    return IterNat;
}(Core));
exports.IterNat = IterNat;
var RecNat = /** @class */ (function (_super) {
    __extends(RecNat, _super);
    function RecNat(target, base, step) {
        var _this = _super.call(this) || this;
        _this.target = target;
        _this.base = base;
        _this.step = step;
        return _this;
    }
    RecNat.prototype.valOf = function (env) {
        return Evaluator.doRecNat(this.target.toLazy(env), this.base.type.toLazy(env), this.base.expr.toLazy(env), this.step.toLazy(env));
    };
    RecNat.prototype.prettyPrint = function () {
        return "(rec-Nat ".concat(this.target.prettyPrint(), " \n              ").concat(this.base.prettyPrint(), " \n              ").concat(this.step.prettyPrint(), ")");
    };
    RecNat.prototype.toString = function () {
        return this.prettyPrint();
    };
    return RecNat;
}(Core));
exports.RecNat = RecNat;
var IndNat = /** @class */ (function (_super) {
    __extends(IndNat, _super);
    function IndNat(target, motive, base, step) {
        var _this = _super.call(this) || this;
        _this.target = target;
        _this.motive = motive;
        _this.base = base;
        _this.step = step;
        return _this;
    }
    IndNat.prototype.valOf = function (env) {
        return Evaluator.doIndNat(this.target.toLazy(env), this.motive.toLazy(env), this.base.toLazy(env), this.step.toLazy(env));
    };
    IndNat.prototype.prettyPrint = function () {
        return "(ind-Nat ".concat(this.target.prettyPrint(), " \n              ").concat(this.motive.prettyPrint(), " \n              ").concat(this.base.prettyPrint(), " \n              ").concat(this.step.prettyPrint(), ")");
    };
    IndNat.prototype.toString = function () {
        return this.prettyPrint();
    };
    return IndNat;
}(Core));
exports.IndNat = IndNat;
var Pi = /** @class */ (function (_super) {
    __extends(Pi, _super);
    function Pi(name, type, body) {
        var _this = _super.call(this) || this;
        _this.name = name;
        _this.type = type;
        _this.body = body;
        return _this;
    }
    Pi.prototype.valOf = function (env) {
        var typeVal = this.type.toLazy(env);
        return new V.Pi(this.name, typeVal, new utils_1.FirstOrderClosure(env, this.name, this.body));
    };
    Pi.prototype.prettyPrint = function () {
        return "(\u03A0 (".concat(this.name, " ").concat(this.type.prettyPrint(), ") \n          ").concat(this.body.prettyPrint(), ")");
    };
    Pi.prototype.toString = function () {
        return this.prettyPrint();
    };
    return Pi;
}(Core));
exports.Pi = Pi;
var Lambda = /** @class */ (function (_super) {
    __extends(Lambda, _super);
    function Lambda(param, body) {
        var _this = _super.call(this) || this;
        _this.param = param;
        _this.body = body;
        return _this;
    }
    Lambda.prototype.valOf = function (env) {
        return new V.Lambda(this.param, new utils_1.FirstOrderClosure(env, this.param, this.body));
    };
    Lambda.prototype.prettyPrint = function () {
        return "(\u03BB (".concat(this.param, ") ").concat(this.body.prettyPrint(), ")");
    };
    Lambda.prototype.toString = function () {
        return this.prettyPrint();
    };
    return Lambda;
}(Core));
exports.Lambda = Lambda;
var Atom = /** @class */ (function (_super) {
    __extends(Atom, _super);
    function Atom() {
        return _super !== null && _super.apply(this, arguments) || this;
    }
    Atom.prototype.valOf = function (env) {
        return new V.Atom();
    };
    Atom.prototype.prettyPrint = function () {
        return 'Atom';
    };
    Atom.prototype.toString = function () {
        return this.prettyPrint();
    };
    return Atom;
}(Core));
exports.Atom = Atom;
var Quote = /** @class */ (function (_super) {
    __extends(Quote, _super);
    function Quote(sym) {
        var _this = _super.call(this) || this;
        _this.sym = sym;
        return _this;
    }
    Quote.prototype.valOf = function (env) {
        return new V.Quote(this.sym);
    };
    Quote.prototype.prettyPrint = function () {
        return "'".concat(this.sym);
    };
    Quote.prototype.toString = function () {
        return this.prettyPrint();
    };
    return Quote;
}(Core));
exports.Quote = Quote;
var Sigma = /** @class */ (function (_super) {
    __extends(Sigma, _super);
    function Sigma(name, type, body) {
        var _this = _super.call(this) || this;
        _this.name = name;
        _this.type = type;
        _this.body = body;
        return _this;
    }
    Sigma.prototype.valOf = function (env) {
        var typeVal = this.type.toLazy(env);
        return new V.Sigma(this.name, typeVal, new utils_1.FirstOrderClosure(env, this.name, this.body));
    };
    Sigma.prototype.prettyPrint = function () {
        return "(\u03A3 (".concat(this.name, " ").concat(this.type.prettyPrint(), ") \n              ").concat(this.body.prettyPrint(), ")");
    };
    Sigma.prototype.toString = function () {
        return this.prettyPrint();
    };
    return Sigma;
}(Core));
exports.Sigma = Sigma;
var Cons = /** @class */ (function (_super) {
    __extends(Cons, _super);
    function Cons(first, second) {
        var _this = _super.call(this) || this;
        _this.first = first;
        _this.second = second;
        return _this;
    }
    Cons.prototype.valOf = function (env) {
        var first = this.first.toLazy(env);
        var second = this.second.toLazy(env);
        return new V.Cons(first, second);
    };
    Cons.prototype.prettyPrint = function () {
        return "(cons ".concat(this.first.prettyPrint(), " ").concat(this.second.prettyPrint(), ")");
    };
    Cons.prototype.toString = function () {
        return this.prettyPrint();
    };
    return Cons;
}(Core));
exports.Cons = Cons;
var Car = /** @class */ (function (_super) {
    __extends(Car, _super);
    function Car(pair) {
        var _this = _super.call(this) || this;
        _this.pair = pair;
        return _this;
    }
    Car.prototype.valOf = function (env) {
        return Evaluator.doCar(this.pair.toLazy(env));
    };
    Car.prototype.prettyPrint = function () {
        return "(car ".concat(this.pair.prettyPrint(), ")");
    };
    Car.prototype.toString = function () {
        return this.prettyPrint();
    };
    return Car;
}(Core));
exports.Car = Car;
var Cdr = /** @class */ (function (_super) {
    __extends(Cdr, _super);
    function Cdr(pair) {
        var _this = _super.call(this) || this;
        _this.pair = pair;
        return _this;
    }
    Cdr.prototype.valOf = function (env) {
        return Evaluator.doCdr(this.pair.toLazy(env));
    };
    Cdr.prototype.prettyPrint = function () {
        return "(cdr ".concat(this.pair.prettyPrint(), ")");
    };
    Cdr.prototype.toString = function () {
        return this.prettyPrint();
    };
    return Cdr;
}(Core));
exports.Cdr = Cdr;
var ListCons = /** @class */ (function (_super) {
    __extends(ListCons, _super);
    function ListCons(head, tail) {
        var _this = _super.call(this) || this;
        _this.head = head;
        _this.tail = tail;
        return _this;
    }
    ListCons.prototype.valOf = function (env) {
        var head = this.head.toLazy(env);
        var tail = this.tail.toLazy(env);
        return new V.ListCons(head, tail);
    };
    ListCons.prototype.prettyPrint = function () {
        return "(:: ".concat(this.head.prettyPrint(), " ").concat(this.tail.prettyPrint(), ")");
    };
    ListCons.prototype.toString = function () {
        return this.prettyPrint();
    };
    return ListCons;
}(Core));
exports.ListCons = ListCons;
var Nil = /** @class */ (function (_super) {
    __extends(Nil, _super);
    function Nil() {
        return _super !== null && _super.apply(this, arguments) || this;
    }
    Nil.prototype.valOf = function (env) {
        return new V.Nil();
    };
    Nil.prototype.prettyPrint = function () {
        return 'nil';
    };
    Nil.prototype.toString = function () {
        return this.prettyPrint();
    };
    return Nil;
}(Core));
exports.Nil = Nil;
var List = /** @class */ (function (_super) {
    __extends(List, _super);
    function List(elemType) {
        var _this = _super.call(this) || this;
        _this.elemType = elemType;
        return _this;
    }
    List.prototype.valOf = function (env) {
        return new V.List(this.elemType.toLazy(env));
    };
    List.prototype.prettyPrint = function () {
        return "(List ".concat(this.elemType.prettyPrint(), ")");
    };
    List.prototype.toString = function () {
        return this.prettyPrint();
    };
    return List;
}(Core));
exports.List = List;
var RecList = /** @class */ (function (_super) {
    __extends(RecList, _super);
    function RecList(target, base, step) {
        var _this = _super.call(this) || this;
        _this.target = target;
        _this.base = base;
        _this.step = step;
        return _this;
    }
    RecList.prototype.valOf = function (env) {
        return Evaluator.doRecList(this.target.toLazy(env), this.base.type.toLazy(env), this.base.expr.toLazy(env), this.step.toLazy(env));
    };
    RecList.prototype.prettyPrint = function () {
        return "(rec-List ".concat(this.target.prettyPrint(), " \n              ").concat(this.base.prettyPrint(), " \n              ").concat(this.step.prettyPrint(), ")");
    };
    RecList.prototype.toString = function () {
        return this.prettyPrint();
    };
    return RecList;
}(Core));
exports.RecList = RecList;
var IndList = /** @class */ (function (_super) {
    __extends(IndList, _super);
    function IndList(target, motive, base, step) {
        var _this = _super.call(this) || this;
        _this.target = target;
        _this.motive = motive;
        _this.base = base;
        _this.step = step;
        return _this;
    }
    IndList.prototype.valOf = function (env) {
        return Evaluator.doIndList(this.target.toLazy(env), this.motive.toLazy(env), this.base.toLazy(env), this.step.toLazy(env));
    };
    IndList.prototype.prettyPrint = function () {
        return "(ind-List ".concat(this.target.prettyPrint(), " \n              ").concat(this.motive.prettyPrint(), " \n              ").concat(this.base.prettyPrint(), " \n              ").concat(this.step.prettyPrint(), ")");
    };
    IndList.prototype.toString = function () {
        return this.prettyPrint();
    };
    return IndList;
}(Core));
exports.IndList = IndList;
var Trivial = /** @class */ (function (_super) {
    __extends(Trivial, _super);
    function Trivial() {
        return _super !== null && _super.apply(this, arguments) || this;
    }
    Trivial.prototype.valOf = function (env) {
        return new V.Trivial();
    };
    Trivial.prototype.prettyPrint = function () {
        return 'Trivial';
    };
    Trivial.prototype.toString = function () {
        return this.prettyPrint();
    };
    return Trivial;
}(Core));
exports.Trivial = Trivial;
var Sole = /** @class */ (function (_super) {
    __extends(Sole, _super);
    function Sole() {
        return _super !== null && _super.apply(this, arguments) || this;
    }
    Sole.prototype.valOf = function (env) {
        return new V.Sole();
    };
    Sole.prototype.prettyPrint = function () {
        return 'sole';
    };
    Sole.prototype.toString = function () {
        return this.prettyPrint();
    };
    return Sole;
}(Core));
exports.Sole = Sole;
var Absurd = /** @class */ (function (_super) {
    __extends(Absurd, _super);
    function Absurd() {
        return _super !== null && _super.apply(this, arguments) || this;
    }
    Absurd.prototype.valOf = function (env) {
        return new V.Absurd();
    };
    Absurd.prototype.prettyPrint = function () {
        return 'Absurd';
    };
    Absurd.prototype.toString = function () {
        return this.prettyPrint();
    };
    return Absurd;
}(Core));
exports.Absurd = Absurd;
var IndAbsurd = /** @class */ (function (_super) {
    __extends(IndAbsurd, _super);
    function IndAbsurd(target, motive) {
        var _this = _super.call(this) || this;
        _this.target = target;
        _this.motive = motive;
        return _this;
    }
    IndAbsurd.prototype.valOf = function (env) {
        return Evaluator.doIndAbsurd(this.target.toLazy(env), this.motive.toLazy(env));
    };
    IndAbsurd.prototype.prettyPrint = function () {
        return "(ind-Absurd \n              ".concat(this.target.prettyPrint(), " \n              ").concat(this.motive.prettyPrint(), ")");
    };
    IndAbsurd.prototype.toString = function () {
        return this.prettyPrint();
    };
    return IndAbsurd;
}(Core));
exports.IndAbsurd = IndAbsurd;
var Equal = /** @class */ (function (_super) {
    __extends(Equal, _super);
    function Equal(type, left, right) {
        var _this = _super.call(this) || this;
        _this.type = type;
        _this.left = left;
        _this.right = right;
        return _this;
    }
    Equal.prototype.valOf = function (env) {
        return new V.Equal(this.type.toLazy(env), this.left.toLazy(env), this.right.toLazy(env));
    };
    Equal.prototype.prettyPrint = function () {
        return "(= ".concat(this.type.prettyPrint(), " \n              ").concat(this.left.prettyPrint(), " \n              ").concat(this.right.prettyPrint(), ")");
    };
    Equal.prototype.toString = function () {
        return this.prettyPrint();
    };
    return Equal;
}(Core));
exports.Equal = Equal;
var Same = /** @class */ (function (_super) {
    __extends(Same, _super);
    function Same(type) {
        var _this = _super.call(this) || this;
        _this.type = type;
        return _this;
    }
    Same.prototype.valOf = function (env) {
        return new V.Same(this.type.toLazy(env));
    };
    Same.prototype.prettyPrint = function () {
        return "(same ".concat(this.type.prettyPrint(), ")");
    };
    Same.prototype.toString = function () {
        return this.prettyPrint();
    };
    return Same;
}(Core));
exports.Same = Same;
var Replace = /** @class */ (function (_super) {
    __extends(Replace, _super);
    function Replace(target, motive, base) {
        var _this = _super.call(this) || this;
        _this.target = target;
        _this.motive = motive;
        _this.base = base;
        return _this;
    }
    Replace.prototype.valOf = function (env) {
        return Evaluator.doReplace(this.target.toLazy(env), this.motive.toLazy(env), this.base.toLazy(env));
    };
    Replace.prototype.prettyPrint = function () {
        return "(replace ".concat(this.target.prettyPrint(), " \n              ").concat(this.motive.prettyPrint(), " \n              ").concat(this.base.prettyPrint(), ")");
    };
    Replace.prototype.toString = function () {
        return this.prettyPrint();
    };
    return Replace;
}(Core));
exports.Replace = Replace;
var Trans = /** @class */ (function (_super) {
    __extends(Trans, _super);
    function Trans(left, right) {
        var _this = _super.call(this) || this;
        _this.left = left;
        _this.right = right;
        return _this;
    }
    Trans.prototype.valOf = function (env) {
        return Evaluator.doTrans(this.left.toLazy(env), this.right.toLazy(env));
    };
    Trans.prototype.prettyPrint = function () {
        return "(trans ".concat(this.left.prettyPrint(), " ").concat(this.right.prettyPrint(), ")");
    };
    Trans.prototype.toString = function () {
        return this.prettyPrint();
    };
    return Trans;
}(Core));
exports.Trans = Trans;
var Cong = /** @class */ (function (_super) {
    __extends(Cong, _super);
    function Cong(target, base, fun) {
        var _this = _super.call(this) || this;
        _this.target = target;
        _this.base = base;
        _this.fun = fun;
        return _this;
    }
    Cong.prototype.valOf = function (env) {
        return Evaluator.doCong(this.target.toLazy(env), this.base.toLazy(env), this.fun.toLazy(env));
    };
    Cong.prototype.prettyPrint = function () {
        return "(cong ".concat(this.target.prettyPrint(), " ").concat(this.fun.prettyPrint(), ")");
    };
    Cong.prototype.toString = function () {
        return this.prettyPrint();
    };
    return Cong;
}(Core));
exports.Cong = Cong;
var Symm = /** @class */ (function (_super) {
    __extends(Symm, _super);
    function Symm(equality) {
        var _this = _super.call(this) || this;
        _this.equality = equality;
        return _this;
    }
    Symm.prototype.valOf = function (env) {
        return Evaluator.doSymm(this.equality.toLazy(env));
    };
    Symm.prototype.prettyPrint = function () {
        return "(symm ".concat(this.equality.prettyPrint(), ")");
    };
    Symm.prototype.toString = function () {
        return this.prettyPrint();
    };
    return Symm;
}(Core));
exports.Symm = Symm;
var IndEqual = /** @class */ (function (_super) {
    __extends(IndEqual, _super);
    function IndEqual(target, motive, base) {
        var _this = _super.call(this) || this;
        _this.target = target;
        _this.motive = motive;
        _this.base = base;
        return _this;
    }
    IndEqual.prototype.valOf = function (env) {
        return Evaluator.doIndEqual(this.target.toLazy(env), this.motive.toLazy(env), this.base.toLazy(env));
    };
    IndEqual.prototype.prettyPrint = function () {
        return "(ind-= ".concat(this.target.prettyPrint(), " \n              ").concat(this.motive.prettyPrint(), " \n              ").concat(this.base.prettyPrint(), ")");
    };
    IndEqual.prototype.toString = function () {
        return this.prettyPrint();
    };
    return IndEqual;
}(Core));
exports.IndEqual = IndEqual;
var Vec = /** @class */ (function (_super) {
    __extends(Vec, _super);
    function Vec(type, length) {
        var _this = _super.call(this) || this;
        _this.type = type;
        _this.length = length;
        return _this;
    }
    Vec.prototype.valOf = function (env) {
        return new V.Vec(this.type.toLazy(env), this.length.toLazy(env));
    };
    Vec.prototype.prettyPrint = function () {
        return "(Vec ".concat(this.type.prettyPrint(), " ").concat(this.length.prettyPrint(), ")");
    };
    Vec.prototype.toString = function () {
        return this.prettyPrint();
    };
    return Vec;
}(Core));
exports.Vec = Vec;
var VecCons = /** @class */ (function (_super) {
    __extends(VecCons, _super);
    function VecCons(head, tail) {
        var _this = _super.call(this) || this;
        _this.head = head;
        _this.tail = tail;
        return _this;
    }
    VecCons.prototype.valOf = function (env) {
        return new V.VecCons(this.head.toLazy(env), this.tail.toLazy(env));
    };
    VecCons.prototype.prettyPrint = function () {
        return "(vec:: ".concat(this.head.prettyPrint(), " ").concat(this.tail.prettyPrint(), ")");
    };
    VecCons.prototype.toString = function () {
        return this.prettyPrint();
    };
    return VecCons;
}(Core));
exports.VecCons = VecCons;
var VecNil = /** @class */ (function (_super) {
    __extends(VecNil, _super);
    function VecNil() {
        return _super !== null && _super.apply(this, arguments) || this;
    }
    VecNil.prototype.valOf = function (env) {
        return new V.VecNil();
    };
    VecNil.prototype.prettyPrint = function () {
        return 'vecnil';
    };
    VecNil.prototype.toString = function () {
        return this.prettyPrint();
    };
    return VecNil;
}(Core));
exports.VecNil = VecNil;
var Head = /** @class */ (function (_super) {
    __extends(Head, _super);
    function Head(vec) {
        var _this = _super.call(this) || this;
        _this.vec = vec;
        return _this;
    }
    Head.prototype.valOf = function (env) {
        return Evaluator.doHead(this.vec.toLazy(env));
    };
    Head.prototype.prettyPrint = function () {
        return "(head ".concat(this.vec.prettyPrint(), ")");
    };
    Head.prototype.toString = function () {
        return this.prettyPrint();
    };
    return Head;
}(Core));
exports.Head = Head;
var Tail = /** @class */ (function (_super) {
    __extends(Tail, _super);
    function Tail(vec) {
        var _this = _super.call(this) || this;
        _this.vec = vec;
        return _this;
    }
    Tail.prototype.valOf = function (env) {
        return Evaluator.doTail(this.vec.toLazy(env));
    };
    Tail.prototype.prettyPrint = function () {
        return "(tail ".concat(this.vec.prettyPrint(), ")");
    };
    Tail.prototype.toString = function () {
        return this.prettyPrint();
    };
    return Tail;
}(Core));
exports.Tail = Tail;
var IndVec = /** @class */ (function (_super) {
    __extends(IndVec, _super);
    function IndVec(length, target, motive, base, step) {
        var _this = _super.call(this) || this;
        _this.length = length;
        _this.target = target;
        _this.motive = motive;
        _this.base = base;
        _this.step = step;
        return _this;
    }
    IndVec.prototype.valOf = function (env) {
        return Evaluator.doIndVec(this.length.toLazy(env), this.target.toLazy(env), this.motive.toLazy(env), this.base.toLazy(env), this.step.toLazy(env));
    };
    IndVec.prototype.prettyPrint = function () {
        return "ind-Vec ".concat(this.length.prettyPrint(), "\n              ").concat(this.target.prettyPrint(), "\n              ").concat(this.motive.prettyPrint(), "\n              ").concat(this.base.prettyPrint(), "\n              ").concat(this.step.prettyPrint());
    };
    IndVec.prototype.toString = function () {
        return this.prettyPrint();
    };
    return IndVec;
}(Core));
exports.IndVec = IndVec;
var Either = /** @class */ (function (_super) {
    __extends(Either, _super);
    function Either(left, right) {
        var _this = _super.call(this) || this;
        _this.left = left;
        _this.right = right;
        return _this;
    }
    Either.prototype.valOf = function (env) {
        return new V.Either(this.left.toLazy(env), this.right.toLazy(env));
    };
    Either.prototype.prettyPrint = function () {
        return "(Either ".concat(this.left.prettyPrint(), " ").concat(this.right.prettyPrint(), ")");
    };
    Either.prototype.toString = function () {
        return this.prettyPrint();
    };
    return Either;
}(Core));
exports.Either = Either;
var Left = /** @class */ (function (_super) {
    __extends(Left, _super);
    function Left(value) {
        var _this = _super.call(this) || this;
        _this.value = value;
        return _this;
    }
    Left.prototype.valOf = function (env) {
        return new V.Left(this.value.toLazy(env));
    };
    Left.prototype.prettyPrint = function () {
        return "(left ".concat(this.value.prettyPrint(), ")");
    };
    Left.prototype.toString = function () {
        return this.prettyPrint();
    };
    return Left;
}(Core));
exports.Left = Left;
var Right = /** @class */ (function (_super) {
    __extends(Right, _super);
    function Right(value) {
        var _this = _super.call(this) || this;
        _this.value = value;
        return _this;
    }
    Right.prototype.valOf = function (env) {
        return new V.Right(this.value.toLazy(env));
    };
    Right.prototype.prettyPrint = function () {
        return "(right ".concat(this.value.prettyPrint(), ")");
    };
    Right.prototype.toString = function () {
        return this.prettyPrint();
    };
    return Right;
}(Core));
exports.Right = Right;
var IndEither = /** @class */ (function (_super) {
    __extends(IndEither, _super);
    function IndEither(target, motive, baseLeft, baseRight) {
        var _this = _super.call(this) || this;
        _this.target = target;
        _this.motive = motive;
        _this.baseLeft = baseLeft;
        _this.baseRight = baseRight;
        return _this;
    }
    IndEither.prototype.valOf = function (env) {
        return Evaluator.doIndEither(this.target.toLazy(env), this.motive.toLazy(env), this.baseLeft.toLazy(env), this.baseRight.toLazy(env));
    };
    IndEither.prototype.prettyPrint = function () {
        return "(ind-Either ".concat(this.target.prettyPrint(), " \n              ").concat(this.motive.prettyPrint(), " \n              ").concat(this.baseLeft.prettyPrint(), " \n              ").concat(this.baseRight.prettyPrint(), ")");
    };
    IndEither.prototype.toString = function () {
        return this.prettyPrint();
    };
    return IndEither;
}(Core));
exports.IndEither = IndEither;
var TODO = /** @class */ (function (_super) {
    __extends(TODO, _super);
    function TODO(loc, type) {
        var _this = _super.call(this) || this;
        _this.loc = loc;
        _this.type = type;
        return _this;
    }
    TODO.prototype.valOf = function (env) {
        return new V.Neutral(this.type.toLazy(env), new N.TODO(this.loc, this.type.toLazy(env)));
    };
    TODO.prototype.prettyPrint = function () {
        return "TODO ".concat(this.type.prettyPrint());
    };
    TODO.prototype.toString = function () {
        return this.prettyPrint();
    };
    return TODO;
}(Core));
exports.TODO = TODO;
var Application = /** @class */ (function (_super) {
    __extends(Application, _super);
    function Application(fun, arg) {
        var _this = _super.call(this) || this;
        _this.fun = fun;
        _this.arg = arg;
        return _this;
    }
    Application.prototype.valOf = function (env) {
        return Evaluator.doApp(this.fun.toLazy(env), this.arg.toLazy(env));
    };
    Application.prototype.prettyPrint = function () {
        return "(".concat(this.fun.prettyPrint(), " ").concat(this.arg.prettyPrint(), ")");
    };
    Application.prototype.toString = function () {
        return this.prettyPrint();
    };
    return Application;
}(Core));
exports.Application = Application;
var VarName = /** @class */ (function (_super) {
    __extends(VarName, _super);
    function VarName(name) {
        var _this = _super.call(this) || this;
        _this.name = name;
        return _this;
    }
    VarName.prototype.valOf = function (env) {
        if ((0, utils_1.isVarName)(this.name)) {
            return (0, environment_1.getValueFromEnvironment)(env, this.name);
        }
        else {
            throw new Error("{this.name} is not a valid variable name");
        }
    };
    VarName.prototype.prettyPrint = function () {
        return this.name;
    };
    VarName.prototype.toString = function () {
        return this.prettyPrint();
    };
    return VarName;
}(Core));
exports.VarName = VarName;
