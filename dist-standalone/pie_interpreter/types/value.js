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
exports.Absurd = exports.Sole = exports.Trivial = exports.Atom = exports.Universe = exports.Neutral = exports.Right = exports.Left = exports.Either = exports.VecCons = exports.VecNil = exports.Vec = exports.Same = exports.Equal = exports.ListCons = exports.Nil = exports.List = exports.Cons = exports.Sigma = exports.Lambda = exports.Pi = exports.Add1 = exports.Zero = exports.Nat = exports.Quote = exports.Delay = exports.Box = exports.DelayClosure = exports.Value = void 0;
const C = __importStar(require("./core"));
const N = __importStar(require("./neutral"));
const context_1 = require("../utils/context");
const utils_1 = require("./utils");
const utils_2 = require("../evaluator/utils");
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
class Value {
    /*
    now demands the _actual_ value represented by a DELAY. If the value
    is a DELAY-CLOS, then it is computed using undelay. If it is
    anything else, then it has already been computed, so it is
    returned.
    
    now should be used any time that a value is inspected to see what
    form it has, because those situations require that the delayed
    evaluation steps be carried out.
    */
    now() {
        return this;
    }
}
exports.Value = Value;
class DelayClosure {
    constructor(env, expr) {
        this.env = env;
        this.expr = expr;
    }
    /*
      undelay is used to find the value that is contained in a
      DELAY-CLOS closure by invoking the evaluator.
    */
    undelay() {
        return this.expr.valOf(this.env).now();
    }
    toString() {
        return `DelayClosure(${this.env}, ${this.expr})`;
    }
}
exports.DelayClosure = DelayClosure;
class Box {
    constructor(value) {
        this.content = value;
    }
    get() {
        return this.content;
    }
    set(value) {
        this.content = value;
    }
}
exports.Box = Box;
class Delay extends Value {
    constructor(val) {
        super();
        this.val = val;
    }
    now() {
        const boxContent = this.val.get();
        if (boxContent instanceof DelayClosure) {
            let theValue = boxContent.undelay();
            this.val.set(theValue);
            return theValue;
        }
        else { // content is a Value (content instanceof Value).
            return boxContent;
        }
    }
    readBackType(context) {
        return this.now().readBackType(context);
    }
    prettyPrint() {
        return this.now().prettyPrint();
    }
    toString() {
        return `Delay(${this.val})`;
    }
}
exports.Delay = Delay;
class Quote extends Value {
    constructor(name) {
        super();
        this.name = name;
    }
    readBackType(context) {
        throw new Error("No readBackType for Quote.");
    }
    prettyPrint() {
        return `'${this.name}`;
    }
    toString() {
        return this.prettyPrint();
    }
}
exports.Quote = Quote;
class Nat extends Value {
    constructor() { super(); }
    readBackType(context) {
        return new C.Nat();
    }
    prettyPrint() {
        return 'Nat';
    }
    toString() {
        return this.prettyPrint();
    }
}
exports.Nat = Nat;
class Zero extends Value {
    constructor() { super(); }
    readBackType(context) {
        throw new Error("No readBackType for Zero.");
    }
    prettyPrint() {
        return 'zero';
    }
    toString() {
        return this.prettyPrint();
    }
}
exports.Zero = Zero;
class Add1 extends Value {
    constructor(smaller) {
        super();
        this.smaller = smaller;
    }
    readBackType(context) {
        throw new Error("No readBackType for Add1.");
    }
    prettyPrint() {
        return `(add1 ${this.smaller.prettyPrint()})`;
    }
    toString() {
        return this.prettyPrint();
    }
}
exports.Add1 = Add1;
class Pi extends Value {
    constructor(argName, argType, resultType) {
        super();
        this.argName = argName;
        this.argType = argType;
        this.resultType = resultType;
    }
    readBackType(context) {
        const Aexpr = this.argType.readBackType(context);
        const freshedName = (0, utils_1.fresh)(context, this.argName);
        const excludeNameCtx = (0, context_1.bindFree)(context, freshedName, this.argType);
        return new C.Pi(freshedName, Aexpr, this.resultType
            .valOfClosure(new Neutral(this.argType, new N.Variable(freshedName)))
            .readBackType(excludeNameCtx));
    }
    prettyPrint() {
        return `(Π ${this.argName} ${this.argType.prettyPrint()} ${this.resultType.prettyPrint()})`;
    }
    toString() {
        return this.prettyPrint();
    }
}
exports.Pi = Pi;
class Lambda extends Value {
    constructor(argName, body) {
        super();
        this.argName = argName;
        this.body = body;
    }
    readBackType(context) {
        throw new Error("No readBackType for Lambda.");
    }
    prettyPrint() {
        return `(lambda ${this.argName} ${this.body.prettyPrint()})`;
    }
    toString() {
        return this.prettyPrint();
    }
}
exports.Lambda = Lambda;
class Sigma extends Value {
    constructor(carName, carType, cdrType) {
        super();
        this.carName = carName;
        this.carType = carType;
        this.cdrType = cdrType;
    }
    readBackType(context) {
        const Aexpr = this.carType.readBackType(context);
        const freshedName = (0, utils_1.fresh)(context, this.carName);
        const excludeNameCtx = (0, context_1.bindFree)(context, freshedName, this.carType);
        return new C.Sigma(freshedName, Aexpr, this.cdrType
            .valOfClosure(new Neutral(this.carType, new N.Variable(freshedName)))
            .readBackType(excludeNameCtx));
    }
    prettyPrint() {
        return `(Σ ${this.carName} ${this.carType.prettyPrint()} ${this.cdrType.prettyPrint()})`;
    }
    toString() {
        return this.prettyPrint();
    }
}
exports.Sigma = Sigma;
class Cons extends Value {
    constructor(car, cdr) {
        super();
        this.car = car;
        this.cdr = cdr;
    }
    readBackType(context) {
        throw new Error("No readBackType for Cons.");
    }
    prettyPrint() {
        return `(cons ${this.car.prettyPrint()} ${this.cdr.prettyPrint()})`;
    }
    toString() {
        return this.prettyPrint();
    }
}
exports.Cons = Cons;
class List extends Value {
    constructor(entryType) {
        super();
        this.entryType = entryType;
    }
    readBackType(context) {
        return new C.List(this.entryType.readBackType(context));
    }
    prettyPrint() {
        return `(List ${this.entryType.prettyPrint()})`;
    }
    toString() {
        return this.prettyPrint();
    }
}
exports.List = List;
class Nil extends Value {
    constructor() { super(); }
    readBackType(context) {
        throw new Error("No readBackType for Nil.");
    }
    prettyPrint() {
        return 'nil';
    }
    toString() {
        return this.prettyPrint();
    }
}
exports.Nil = Nil;
class ListCons extends Value {
    constructor(head, tail) {
        super();
        this.head = head;
        this.tail = tail;
    }
    readBackType(context) {
        throw new Error("No readBackType for ListCons.");
    }
    prettyPrint() {
        return `(:: ${this.head.prettyPrint()} ${this.tail.prettyPrint()})`;
    }
    toString() {
        return this.prettyPrint();
    }
}
exports.ListCons = ListCons;
class Equal extends Value {
    constructor(type, from, to) {
        super();
        this.type = type;
        this.from = from;
        this.to = to;
    }
    readBackType(context) {
        return new C.Equal(this.type.readBackType(context), (0, utils_2.readBack)(context, this.type, this.from), (0, utils_2.readBack)(context, this.type, this.to));
    }
    prettyPrint() {
        return `(= ${this.type.prettyPrint()} ${this.from.prettyPrint()} ${this.to.prettyPrint()})`;
    }
    toString() {
        return this.prettyPrint();
    }
}
exports.Equal = Equal;
class Same extends Value {
    constructor(value) {
        super();
        this.value = value;
    }
    readBackType(context) {
        throw new Error("No readBackType for Same.");
    }
    prettyPrint() {
        return `(same ${this.value.prettyPrint()})`;
    }
    toString() {
        return this.prettyPrint();
    }
}
exports.Same = Same;
class Vec extends Value {
    constructor(entryType, length) {
        super();
        this.entryType = entryType;
        this.length = length;
    }
    readBackType(context) {
        return new C.Vec(this.entryType.readBackType(context), (0, utils_2.readBack)(context, new Nat(), this.length));
    }
    prettyPrint() {
        return `(Vec ${this.entryType.prettyPrint()} ${this.length.prettyPrint()})`;
    }
}
exports.Vec = Vec;
class VecNil extends Value {
    constructor() { super(); }
    readBackType(context) {
        throw new Error("No readBackType for VecNil.");
    }
    prettyPrint() {
        return 'vecnil';
    }
    toString() {
        return this.prettyPrint();
    }
}
exports.VecNil = VecNil;
class VecCons extends Value {
    constructor(head, tail) {
        super();
        this.head = head;
        this.tail = tail;
    }
    readBackType(context) {
        throw new Error("No readBackType for VecCons.");
    }
    prettyPrint() {
        return `(vec:: ${this.head.prettyPrint()} ${this.tail.prettyPrint()})`;
    }
    toString() {
        return this.prettyPrint();
    }
}
exports.VecCons = VecCons;
class Either extends Value {
    constructor(leftType, rightType) {
        super();
        this.leftType = leftType;
        this.rightType = rightType;
    }
    readBackType(context) {
        return new C.Either(this.leftType.readBackType(context), this.rightType.readBackType(context));
    }
    prettyPrint() {
        return `(Either ${this.leftType.prettyPrint()} ${this.rightType.prettyPrint()})`;
    }
    toString() {
        return this.prettyPrint();
    }
}
exports.Either = Either;
class Left extends Value {
    constructor(value) {
        super();
        this.value = value;
    }
    readBackType(context) {
        throw new Error("No readBackType for Left.");
    }
    prettyPrint() {
        return `(left ${this.value.prettyPrint()})`;
    }
    toString() {
        return this.prettyPrint();
    }
}
exports.Left = Left;
class Right extends Value {
    constructor(value) {
        super();
        this.value = value;
    }
    readBackType(context) {
        throw new Error("No readBackType for Right.");
    }
    prettyPrint() {
        return `(right ${this.value.prettyPrint()})`;
    }
    toString() {
        return this.prettyPrint();
    }
}
exports.Right = Right;
class Neutral extends Value {
    constructor(type, neutral) {
        super();
        this.type = type;
        this.neutral = neutral;
    }
    readBackType(context) {
        return this.neutral.readBackNeutral(context);
    }
    prettyPrint() {
        return `(Neutral ${this.type.prettyPrint()} ${this.neutral.prettyPrint()})`;
    }
    toString() {
        return this.prettyPrint();
    }
}
exports.Neutral = Neutral;
class Universe extends Value {
    constructor() { super(); }
    readBackType(context) {
        return new C.Universe();
    }
    prettyPrint() {
        return 'U';
    }
    toString() {
        return this.prettyPrint();
    }
}
exports.Universe = Universe;
class Atom extends Value {
    constructor() { super(); }
    readBackType(context) {
        return new C.Atom();
    }
    prettyPrint() {
        return 'Atom';
    }
    toString() {
        return this.prettyPrint();
    }
}
exports.Atom = Atom;
class Trivial extends Value {
    constructor() { super(); }
    readBackType(context) {
        return new C.Trivial();
    }
    prettyPrint() {
        return 'Trivial';
    }
    toString() {
        return this.prettyPrint();
    }
}
exports.Trivial = Trivial;
class Sole extends Value {
    constructor() { super(); }
    readBackType(context) {
        throw new Error("No readBackType for Sole.");
    }
    prettyPrint() {
        return 'sole';
    }
    toString() {
        return this.prettyPrint();
    }
}
exports.Sole = Sole;
class Absurd extends Value {
    constructor() { super(); }
    readBackType(context) {
        return new C.Absurd();
    }
    prettyPrint() {
        return 'Absurd';
    }
    toString() {
        return this.prettyPrint();
    }
}
exports.Absurd = Absurd;
//# sourceMappingURL=value.js.map