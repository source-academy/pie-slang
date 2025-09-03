"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.VarName = exports.Application = exports.TODO = exports.IndEither = exports.Right = exports.Left = exports.Either = exports.IndVec = exports.Tail = exports.Head = exports.VecNil = exports.VecCons = exports.Vec = exports.IndEqual = exports.Symm = exports.Cong = exports.Trans = exports.Replace = exports.Same = exports.Equal = exports.IndAbsurd = exports.Absurd = exports.Sole = exports.Trivial = exports.IndList = exports.RecList = exports.List = exports.Nil = exports.ListCons = exports.Cdr = exports.Car = exports.Cons = exports.Sigma = exports.Quote = exports.Atom = exports.Lambda = exports.Pi = exports.IndNat = exports.RecNat = exports.IterNat = exports.WhichNat = exports.Add1 = exports.Zero = exports.Nat = exports.Universe = exports.The = exports.Core = void 0;
const V = __importStar(require("./value"));
const N = __importStar(require("./neutral"));
const Evaluator = __importStar(require("../evaluator/evaluator"));
const environment_1 = require("../utils/environment");
const utils_1 = require("./utils");
/*
  ### Core Types ###

    Core Pie expressions are the result of type checking (elaborating)
    an expression written in Pie. They do not have source positions,
    because they by definition are not written by a user of the
    implementation.

*/
class Core {
    /*
      Original "later" function. It is used to delay the evaluation.
    */
    toLazy(env) {
        return new V.Delay(new V.Box(new V.DelayClosure(env, this)));
    }
}
exports.Core = Core;
class The extends Core {
    constructor(type, expr) {
        super();
        this.type = type;
        this.expr = expr;
    }
    valOf(env) {
        return this.expr.valOf(env);
    }
    prettyPrint() {
        return `(the ${this.type.prettyPrint()} ${this.expr.prettyPrint()})`;
    }
    toString() {
        return this.prettyPrint();
    }
}
exports.The = The;
class Universe extends Core {
    valOf(env) {
        return new V.Universe();
    }
    prettyPrint() {
        return 'U';
    }
    toString() {
        return this.prettyPrint();
    }
}
exports.Universe = Universe;
class Nat extends Core {
    valOf(env) {
        return new V.Nat();
    }
    prettyPrint() {
        return 'Nat';
    }
    toString() {
        return this.prettyPrint();
    }
}
exports.Nat = Nat;
class Zero extends Core {
    valOf(env) {
        return new V.Zero();
    }
    prettyPrint() {
        return '0';
    }
    toString() {
        return this.prettyPrint();
    }
}
exports.Zero = Zero;
class Add1 extends Core {
    constructor(n) {
        super();
        this.n = n;
    }
    valOf(env) {
        return new V.Add1(this.n.toLazy(env));
    }
    prettyPrint() {
        if (!isNaN(Number(this.n.prettyPrint()))) {
            return `${Number(this.n.prettyPrint()) + 1}`;
        }
        return `(add1 ${this.n.prettyPrint()})`;
    }
    toString() {
        return this.prettyPrint();
    }
}
exports.Add1 = Add1;
class WhichNat extends Core {
    constructor(target, base, step) {
        super();
        this.target = target;
        this.base = base;
        this.step = step;
    }
    valOf(env) {
        return Evaluator.doWhichNat(this.target.toLazy(env), this.base.type.toLazy(env), this.base.expr.toLazy(env), this.step.toLazy(env));
    }
    prettyPrint() {
        return `(which-Nat ${this.target.prettyPrint()} 
              ${this.base.prettyPrint()} 
              ${this.step.prettyPrint()})`;
    }
    toString() {
        return this.prettyPrint();
    }
}
exports.WhichNat = WhichNat;
class IterNat extends Core {
    constructor(target, base, step) {
        super();
        this.target = target;
        this.base = base;
        this.step = step;
    }
    valOf(env) {
        return Evaluator.doIterNat(this.target.toLazy(env), this.base.type.toLazy(env), this.base.expr.toLazy(env), this.step.toLazy(env));
    }
    prettyPrint() {
        return `(iter-Nat ${this.target.prettyPrint()} 
              ${this.base.prettyPrint()} 
              ${this.step.prettyPrint()})`;
    }
    toString() {
        return this.prettyPrint();
    }
}
exports.IterNat = IterNat;
class RecNat extends Core {
    constructor(target, base, step) {
        super();
        this.target = target;
        this.base = base;
        this.step = step;
    }
    valOf(env) {
        return Evaluator.doRecNat(this.target.toLazy(env), this.base.type.toLazy(env), this.base.expr.toLazy(env), this.step.toLazy(env));
    }
    prettyPrint() {
        return `(rec-Nat ${this.target.prettyPrint()} 
              ${this.base.prettyPrint()} 
              ${this.step.prettyPrint()})`;
    }
    toString() {
        return this.prettyPrint();
    }
}
exports.RecNat = RecNat;
class IndNat extends Core {
    constructor(target, motive, base, step) {
        super();
        this.target = target;
        this.motive = motive;
        this.base = base;
        this.step = step;
    }
    valOf(env) {
        return Evaluator.doIndNat(this.target.toLazy(env), this.motive.toLazy(env), this.base.toLazy(env), this.step.toLazy(env));
    }
    prettyPrint() {
        return `(ind-Nat ${this.target.prettyPrint()} 
              ${this.motive.prettyPrint()} 
              ${this.base.prettyPrint()} 
              ${this.step.prettyPrint()})`;
    }
    toString() {
        return this.prettyPrint();
    }
}
exports.IndNat = IndNat;
class Pi extends Core {
    constructor(name, type, body) {
        super();
        this.name = name;
        this.type = type;
        this.body = body;
    }
    valOf(env) {
        const typeVal = this.type.toLazy(env);
        return new V.Pi(this.name, typeVal, new utils_1.FirstOrderClosure(env, this.name, this.body));
    }
    prettyPrint() {
        return `(Π (${this.name} ${this.type.prettyPrint()}) 
          ${this.body.prettyPrint()})`;
    }
    toString() {
        return this.prettyPrint();
    }
}
exports.Pi = Pi;
class Lambda extends Core {
    constructor(param, body) {
        super();
        this.param = param;
        this.body = body;
    }
    valOf(env) {
        return new V.Lambda(this.param, new utils_1.FirstOrderClosure(env, this.param, this.body));
    }
    prettyPrint() {
        return `(λ (${this.param}) ${this.body.prettyPrint()})`;
    }
    toString() {
        return this.prettyPrint();
    }
}
exports.Lambda = Lambda;
class Atom extends Core {
    valOf(env) {
        return new V.Atom();
    }
    prettyPrint() {
        return 'Atom';
    }
    toString() {
        return this.prettyPrint();
    }
}
exports.Atom = Atom;
class Quote extends Core {
    constructor(sym) {
        super();
        this.sym = sym;
    }
    valOf(env) {
        return new V.Quote(this.sym);
    }
    prettyPrint() {
        return `'${this.sym}`;
    }
    toString() {
        return this.prettyPrint();
    }
}
exports.Quote = Quote;
class Sigma extends Core {
    constructor(name, type, body) {
        super();
        this.name = name;
        this.type = type;
        this.body = body;
    }
    valOf(env) {
        const typeVal = this.type.toLazy(env);
        return new V.Sigma(this.name, typeVal, new utils_1.FirstOrderClosure(env, this.name, this.body));
    }
    prettyPrint() {
        return `(Σ (${this.name} ${this.type.prettyPrint()}) 
              ${this.body.prettyPrint()})`;
    }
    toString() {
        return this.prettyPrint();
    }
}
exports.Sigma = Sigma;
class Cons extends Core {
    constructor(first, second) {
        super();
        this.first = first;
        this.second = second;
    }
    valOf(env) {
        const first = this.first.toLazy(env);
        const second = this.second.toLazy(env);
        return new V.Cons(first, second);
    }
    prettyPrint() {
        return `(cons ${this.first.prettyPrint()} ${this.second.prettyPrint()})`;
    }
    toString() {
        return this.prettyPrint();
    }
}
exports.Cons = Cons;
class Car extends Core {
    constructor(pair) {
        super();
        this.pair = pair;
    }
    valOf(env) {
        return Evaluator.doCar(this.pair.toLazy(env));
    }
    prettyPrint() {
        return `(car ${this.pair.prettyPrint()})`;
    }
    toString() {
        return this.prettyPrint();
    }
}
exports.Car = Car;
class Cdr extends Core {
    constructor(pair) {
        super();
        this.pair = pair;
    }
    valOf(env) {
        return Evaluator.doCdr(this.pair.toLazy(env));
    }
    prettyPrint() {
        return `(cdr ${this.pair.prettyPrint()})`;
    }
    toString() {
        return this.prettyPrint();
    }
}
exports.Cdr = Cdr;
class ListCons extends Core {
    constructor(head, tail) {
        super();
        this.head = head;
        this.tail = tail;
    }
    valOf(env) {
        const head = this.head.toLazy(env);
        const tail = this.tail.toLazy(env);
        return new V.ListCons(head, tail);
    }
    prettyPrint() {
        return `(:: ${this.head.prettyPrint()} ${this.tail.prettyPrint()})`;
    }
    toString() {
        return this.prettyPrint();
    }
}
exports.ListCons = ListCons;
class Nil extends Core {
    valOf(env) {
        return new V.Nil();
    }
    prettyPrint() {
        return 'nil';
    }
    toString() {
        return this.prettyPrint();
    }
}
exports.Nil = Nil;
class List extends Core {
    constructor(elemType) {
        super();
        this.elemType = elemType;
    }
    valOf(env) {
        return new V.List(this.elemType.toLazy(env));
    }
    prettyPrint() {
        return `(List ${this.elemType.prettyPrint()})`;
    }
    toString() {
        return this.prettyPrint();
    }
}
exports.List = List;
class RecList extends Core {
    constructor(target, base, step) {
        super();
        this.target = target;
        this.base = base;
        this.step = step;
    }
    valOf(env) {
        return Evaluator.doRecList(this.target.toLazy(env), this.base.type.toLazy(env), this.base.expr.toLazy(env), this.step.toLazy(env));
    }
    prettyPrint() {
        return `(rec-List ${this.target.prettyPrint()} 
              ${this.base.prettyPrint()} 
              ${this.step.prettyPrint()})`;
    }
    toString() {
        return this.prettyPrint();
    }
}
exports.RecList = RecList;
class IndList extends Core {
    constructor(target, motive, base, step) {
        super();
        this.target = target;
        this.motive = motive;
        this.base = base;
        this.step = step;
    }
    valOf(env) {
        return Evaluator.doIndList(this.target.toLazy(env), this.motive.toLazy(env), this.base.toLazy(env), this.step.toLazy(env));
    }
    prettyPrint() {
        return `(ind-List ${this.target.prettyPrint()} 
              ${this.motive.prettyPrint()} 
              ${this.base.prettyPrint()} 
              ${this.step.prettyPrint()})`;
    }
    toString() {
        return this.prettyPrint();
    }
}
exports.IndList = IndList;
class Trivial extends Core {
    valOf(env) {
        return new V.Trivial();
    }
    prettyPrint() {
        return 'Trivial';
    }
    toString() {
        return this.prettyPrint();
    }
}
exports.Trivial = Trivial;
class Sole extends Core {
    valOf(env) {
        return new V.Sole();
    }
    prettyPrint() {
        return 'sole';
    }
    toString() {
        return this.prettyPrint();
    }
}
exports.Sole = Sole;
class Absurd extends Core {
    valOf(env) {
        return new V.Absurd();
    }
    prettyPrint() {
        return 'Absurd';
    }
    toString() {
        return this.prettyPrint();
    }
}
exports.Absurd = Absurd;
class IndAbsurd extends Core {
    constructor(target, motive) {
        super();
        this.target = target;
        this.motive = motive;
    }
    valOf(env) {
        return Evaluator.doIndAbsurd(this.target.toLazy(env), this.motive.toLazy(env));
    }
    prettyPrint() {
        return `(ind-Absurd 
              ${this.target.prettyPrint()} 
              ${this.motive.prettyPrint()})`;
    }
    toString() {
        return this.prettyPrint();
    }
}
exports.IndAbsurd = IndAbsurd;
class Equal extends Core {
    constructor(type, left, right) {
        super();
        this.type = type;
        this.left = left;
        this.right = right;
    }
    valOf(env) {
        return new V.Equal(this.type.toLazy(env), this.left.toLazy(env), this.right.toLazy(env));
    }
    prettyPrint() {
        return `(= ${this.type.prettyPrint()} 
              ${this.left.prettyPrint()} 
              ${this.right.prettyPrint()})`;
    }
    toString() {
        return this.prettyPrint();
    }
}
exports.Equal = Equal;
class Same extends Core {
    constructor(type) {
        super();
        this.type = type;
    }
    valOf(env) {
        return new V.Same(this.type.toLazy(env));
    }
    prettyPrint() {
        return `(same ${this.type.prettyPrint()})`;
    }
    toString() {
        return this.prettyPrint();
    }
}
exports.Same = Same;
class Replace extends Core {
    constructor(target, motive, base) {
        super();
        this.target = target;
        this.motive = motive;
        this.base = base;
    }
    valOf(env) {
        return Evaluator.doReplace(this.target.toLazy(env), this.motive.toLazy(env), this.base.toLazy(env));
    }
    prettyPrint() {
        return `(replace ${this.target.prettyPrint()} 
              ${this.motive.prettyPrint()} 
              ${this.base.prettyPrint()})`;
    }
    toString() {
        return this.prettyPrint();
    }
}
exports.Replace = Replace;
class Trans extends Core {
    constructor(left, right) {
        super();
        this.left = left;
        this.right = right;
    }
    valOf(env) {
        return Evaluator.doTrans(this.left.toLazy(env), this.right.toLazy(env));
    }
    prettyPrint() {
        return `(trans ${this.left.prettyPrint()} ${this.right.prettyPrint()})`;
    }
    toString() {
        return this.prettyPrint();
    }
}
exports.Trans = Trans;
class Cong extends Core {
    constructor(target, base, fun) {
        super();
        this.target = target;
        this.base = base;
        this.fun = fun;
    }
    valOf(env) {
        return Evaluator.doCong(this.target.toLazy(env), this.base.toLazy(env), this.fun.toLazy(env));
    }
    prettyPrint() {
        return `(cong ${this.target.prettyPrint()} ${this.fun.prettyPrint()})`;
    }
    toString() {
        return this.prettyPrint();
    }
}
exports.Cong = Cong;
class Symm extends Core {
    constructor(equality) {
        super();
        this.equality = equality;
    }
    valOf(env) {
        return Evaluator.doSymm(this.equality.toLazy(env));
    }
    prettyPrint() {
        return `(symm ${this.equality.prettyPrint()})`;
    }
    toString() {
        return this.prettyPrint();
    }
}
exports.Symm = Symm;
class IndEqual extends Core {
    constructor(target, motive, base) {
        super();
        this.target = target;
        this.motive = motive;
        this.base = base;
    }
    valOf(env) {
        return Evaluator.doIndEqual(this.target.toLazy(env), this.motive.toLazy(env), this.base.toLazy(env));
    }
    prettyPrint() {
        return `(ind-= ${this.target.prettyPrint()} 
              ${this.motive.prettyPrint()} 
              ${this.base.prettyPrint()})`;
    }
    toString() {
        return this.prettyPrint();
    }
}
exports.IndEqual = IndEqual;
class Vec extends Core {
    constructor(type, length) {
        super();
        this.type = type;
        this.length = length;
    }
    valOf(env) {
        return new V.Vec(this.type.toLazy(env), this.length.toLazy(env));
    }
    prettyPrint() {
        return `(Vec ${this.type.prettyPrint()} ${this.length.prettyPrint()})`;
    }
    toString() {
        return this.prettyPrint();
    }
}
exports.Vec = Vec;
class VecCons extends Core {
    constructor(head, tail) {
        super();
        this.head = head;
        this.tail = tail;
    }
    valOf(env) {
        return new V.VecCons(this.head.toLazy(env), this.tail.toLazy(env));
    }
    prettyPrint() {
        return `(vec:: ${this.head.prettyPrint()} ${this.tail.prettyPrint()})`;
    }
    toString() {
        return this.prettyPrint();
    }
}
exports.VecCons = VecCons;
class VecNil extends Core {
    valOf(env) {
        return new V.VecNil();
    }
    prettyPrint() {
        return 'vecnil';
    }
    toString() {
        return this.prettyPrint();
    }
}
exports.VecNil = VecNil;
class Head extends Core {
    constructor(vec) {
        super();
        this.vec = vec;
    }
    valOf(env) {
        return Evaluator.doHead(this.vec.toLazy(env));
    }
    prettyPrint() {
        return `(head ${this.vec.prettyPrint()})`;
    }
    toString() {
        return this.prettyPrint();
    }
}
exports.Head = Head;
class Tail extends Core {
    constructor(vec) {
        super();
        this.vec = vec;
    }
    valOf(env) {
        return Evaluator.doTail(this.vec.toLazy(env));
    }
    prettyPrint() {
        return `(tail ${this.vec.prettyPrint()})`;
    }
    toString() {
        return this.prettyPrint();
    }
}
exports.Tail = Tail;
class IndVec extends Core {
    constructor(length, target, motive, base, step) {
        super();
        this.length = length;
        this.target = target;
        this.motive = motive;
        this.base = base;
        this.step = step;
    }
    valOf(env) {
        return Evaluator.doIndVec(this.length.toLazy(env), this.target.toLazy(env), this.motive.toLazy(env), this.base.toLazy(env), this.step.toLazy(env));
    }
    prettyPrint() {
        return `ind-Vec ${this.length.prettyPrint()}
              ${this.target.prettyPrint()}
              ${this.motive.prettyPrint()}
              ${this.base.prettyPrint()}
              ${this.step.prettyPrint()}`;
    }
    toString() {
        return this.prettyPrint();
    }
}
exports.IndVec = IndVec;
class Either extends Core {
    constructor(left, right) {
        super();
        this.left = left;
        this.right = right;
    }
    valOf(env) {
        return new V.Either(this.left.toLazy(env), this.right.toLazy(env));
    }
    prettyPrint() {
        return `(Either ${this.left.prettyPrint()} ${this.right.prettyPrint()})`;
    }
    toString() {
        return this.prettyPrint();
    }
}
exports.Either = Either;
class Left extends Core {
    constructor(value) {
        super();
        this.value = value;
    }
    valOf(env) {
        return new V.Left(this.value.toLazy(env));
    }
    prettyPrint() {
        return `(left ${this.value.prettyPrint()})`;
    }
    toString() {
        return this.prettyPrint();
    }
}
exports.Left = Left;
class Right extends Core {
    constructor(value) {
        super();
        this.value = value;
    }
    valOf(env) {
        return new V.Right(this.value.toLazy(env));
    }
    prettyPrint() {
        return `(right ${this.value.prettyPrint()})`;
    }
    toString() {
        return this.prettyPrint();
    }
}
exports.Right = Right;
class IndEither extends Core {
    constructor(target, motive, baseLeft, baseRight) {
        super();
        this.target = target;
        this.motive = motive;
        this.baseLeft = baseLeft;
        this.baseRight = baseRight;
    }
    valOf(env) {
        return Evaluator.doIndEither(this.target.toLazy(env), this.motive.toLazy(env), this.baseLeft.toLazy(env), this.baseRight.toLazy(env));
    }
    prettyPrint() {
        return `(ind-Either ${this.target.prettyPrint()} 
              ${this.motive.prettyPrint()} 
              ${this.baseLeft.prettyPrint()} 
              ${this.baseRight.prettyPrint()})`;
    }
    toString() {
        return this.prettyPrint();
    }
}
exports.IndEither = IndEither;
class TODO extends Core {
    constructor(loc, type) {
        super();
        this.loc = loc;
        this.type = type;
    }
    valOf(env) {
        return new V.Neutral(this.type.toLazy(env), new N.TODO(this.loc, this.type.toLazy(env)));
    }
    prettyPrint() {
        return `TODO ${this.type.prettyPrint()}`;
    }
    toString() {
        return this.prettyPrint();
    }
}
exports.TODO = TODO;
class Application extends Core {
    constructor(fun, arg) {
        super();
        this.fun = fun;
        this.arg = arg;
    }
    valOf(env) {
        return Evaluator.doApp(this.fun.toLazy(env), this.arg.toLazy(env));
    }
    prettyPrint() {
        return `(${this.fun.prettyPrint()} ${this.arg.prettyPrint()})`;
    }
    toString() {
        return this.prettyPrint();
    }
}
exports.Application = Application;
class VarName extends Core {
    constructor(name) {
        super();
        this.name = name;
    }
    valOf(env) {
        if ((0, utils_1.isVarName)(this.name)) {
            return (0, environment_1.getValueFromEnvironment)(env, this.name);
        }
        else {
            throw new Error(`{this.name} is not a valid variable name`);
        }
    }
    prettyPrint() {
        return this.name;
    }
    toString() {
        return this.prettyPrint();
    }
}
exports.VarName = VarName;
//# sourceMappingURL=core.js.map