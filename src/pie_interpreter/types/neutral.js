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
exports.Application = exports.GenericEliminator = exports.IndEither = exports.IndVec12 = exports.IndVec2 = exports.IndVec1 = exports.Tail = exports.Head = exports.IndEqual = exports.Symm = exports.Cong = exports.Trans12 = exports.Trans2 = exports.Trans1 = exports.Replace = exports.IndAbsurd = exports.IndList = exports.RecList = exports.Cdr = exports.Car = exports.IndNat = exports.RecNat = exports.IterNat = exports.WhichNat = exports.TODO = exports.Variable = exports.Neutral = exports.Norm = void 0;
exports.isNorm = isNorm;
exports.isNeutral = isNeutral;
const C = __importStar(require("./core"));
const value_1 = require("./value");
const utils_1 = require("../evaluator/utils");
/*
    Normal forms consist of syntax that is produced by read-back,
    following the type. This structure contains a type value and a
    value described by the type, so that read-back can later be applied
    to it.
*/
class Norm {
    constructor(type, value) {
        this.type = type;
        this.value = value;
    }
}
exports.Norm = Norm;
// Predicate function to check if an object is Norm
function isNorm(obj) {
    return obj instanceof Norm;
}
/*
    ## Neutral Expressions ##
    Neutral expressions are represented by structs that ensure that no
    non-neutral expressions can be represented.
*/
// Base class for all Neutral types
class Neutral {
    constructor() { }
    toString() {
        return this.prettyPrint();
    }
}
exports.Neutral = Neutral;
class Variable extends Neutral {
    constructor(name) {
        super();
        this.name = name;
    }
    readBackNeutral(context) {
        return new C.VarName(this.name);
    }
    prettyPrint() {
        return `N-${this.name}`;
    }
}
exports.Variable = Variable;
class TODO extends Neutral {
    constructor(where, type) {
        super();
        this.where = where;
        this.type = type;
    }
    readBackNeutral(context) {
        return new C.TODO(this.where, this.type.readBackType(context));
    }
    prettyPrint() {
        return `N-TODO`;
    }
}
exports.TODO = TODO;
class WhichNat extends Neutral {
    constructor(target, base, step) {
        super();
        this.target = target;
        this.base = base;
        this.step = step;
    }
    readBackNeutral(context) {
        return new C.WhichNat(this.target.readBackNeutral(context), new C.The(this.base.type.readBackType(context), (0, utils_1.readBack)(context, this.base.type, this.base.value)), (0, utils_1.readBack)(context, this.step.type, this.step.value));
    }
    prettyPrint() {
        return `N-WhichNat`;
    }
}
exports.WhichNat = WhichNat;
class IterNat extends Neutral {
    constructor(target, base, step) {
        super();
        this.target = target;
        this.base = base;
        this.step = step;
    }
    readBackNeutral(context) {
        return new C.IterNat(this.target.readBackNeutral(context), new C.The(this.base.type.readBackType(context), (0, utils_1.readBack)(context, this.base.type, this.base.value)), (0, utils_1.readBack)(context, this.step.type, this.step.value));
    }
    prettyPrint() {
        return `N-IterNat`;
    }
}
exports.IterNat = IterNat;
class RecNat extends Neutral {
    constructor(target, base, step) {
        super();
        this.target = target;
        this.base = base;
        this.step = step;
    }
    readBackNeutral(context) {
        return new C.RecNat(this.target.readBackNeutral(context), new C.The(this.base.type.readBackType(context), (0, utils_1.readBack)(context, this.base.type, this.base.value)), (0, utils_1.readBack)(context, this.step.type, this.step.value));
    }
    prettyPrint() {
        return `N-RecNat`;
    }
}
exports.RecNat = RecNat;
class IndNat extends Neutral {
    constructor(target, motive, base, step) {
        super();
        this.target = target;
        this.motive = motive;
        this.base = base;
        this.step = step;
    }
    readBackNeutral(context) {
        return new C.IndNat(this.target.readBackNeutral(context), (0, utils_1.readBack)(context, this.motive.type, this.motive.value), (0, utils_1.readBack)(context, this.base.type, this.base.value), (0, utils_1.readBack)(context, this.step.type, this.step.value));
    }
    prettyPrint() {
        return `N-IndNat`;
    }
}
exports.IndNat = IndNat;
class Car extends Neutral {
    constructor(target) {
        super();
        this.target = target;
    }
    readBackNeutral(context) {
        return new C.Car(this.target.readBackNeutral(context));
    }
    prettyPrint() {
        return `N-Car`;
    }
}
exports.Car = Car;
class Cdr extends Neutral {
    constructor(target) {
        super();
        this.target = target;
    }
    readBackNeutral(context) {
        return new C.Cdr(this.target.readBackNeutral(context));
    }
    prettyPrint() {
        return `N-Cdr`;
    }
}
exports.Cdr = Cdr;
class RecList extends Neutral {
    constructor(target, base, step) {
        super();
        this.target = target;
        this.base = base;
        this.step = step;
    }
    readBackNeutral(context) {
        return new C.RecList(this.target.readBackNeutral(context), new C.The(this.base.type.readBackType(context), (0, utils_1.readBack)(context, this.base.type, this.base.value)), (0, utils_1.readBack)(context, this.step.type, this.step.value));
    }
    prettyPrint() {
        return `N-RecList`;
    }
}
exports.RecList = RecList;
class IndList extends Neutral {
    constructor(target, motive, base, step) {
        super();
        this.target = target;
        this.motive = motive;
        this.base = base;
        this.step = step;
    }
    readBackNeutral(context) {
        return new C.IndList(this.target.readBackNeutral(context), (0, utils_1.readBack)(context, this.motive.type, this.motive.value), (0, utils_1.readBack)(context, this.base.type, this.base.value), (0, utils_1.readBack)(context, this.step.type, this.step.value));
    }
    prettyPrint() {
        return `N-IndList`;
    }
}
exports.IndList = IndList;
class IndAbsurd extends Neutral {
    constructor(target, motive) {
        super();
        this.target = target;
        this.motive = motive;
    }
    readBackNeutral(context) {
        // Here's some Absurd η. The rest is in α-equiv?.
        return new C.IndAbsurd(new C.The(new C.Absurd(), this.target.readBackNeutral(context)), (0, utils_1.readBack)(context, this.motive.type, this.motive.value));
    }
    prettyPrint() {
        return `N-IndAbsurd`;
    }
}
exports.IndAbsurd = IndAbsurd;
class Replace extends Neutral {
    constructor(target, motive, base) {
        super();
        this.target = target;
        this.motive = motive;
        this.base = base;
    }
    readBackNeutral(context) {
        return new C.Replace(this.target.readBackNeutral(context), (0, utils_1.readBack)(context, this.motive.type, this.motive.value), (0, utils_1.readBack)(context, this.base.type, this.base.value));
    }
    prettyPrint() {
        return `N-Replace`;
    }
}
exports.Replace = Replace;
class Trans1 extends Neutral {
    constructor(target1, target2) {
        super();
        this.target1 = target1;
        this.target2 = target2;
    }
    readBackNeutral(context) {
        return new C.Trans(this.target1.readBackNeutral(context), (0, utils_1.readBack)(context, this.target2.type, this.target2.value));
    }
    prettyPrint() {
        return `N-Trans1`;
    }
}
exports.Trans1 = Trans1;
class Trans2 extends Neutral {
    constructor(target1, target2) {
        super();
        this.target1 = target1;
        this.target2 = target2;
    }
    readBackNeutral(context) {
        return new C.Trans((0, utils_1.readBack)(context, this.target1.type, this.target1.value), this.target2.readBackNeutral(context));
    }
    prettyPrint() {
        return `N-Trans2`;
    }
}
exports.Trans2 = Trans2;
class Trans12 extends Neutral {
    constructor(target1, target2) {
        super();
        this.target1 = target1;
        this.target2 = target2;
    }
    readBackNeutral(context) {
        return new C.Trans(this.target1.readBackNeutral(context), this.target2.readBackNeutral(context));
    }
    prettyPrint() {
        return `N-Trans12`;
    }
}
exports.Trans12 = Trans12;
class Cong extends Neutral {
    constructor(target, func) {
        super();
        this.target = target;
        this.func = func;
    }
    readBackNeutral(context) {
        const funcType = this.func.type;
        if (funcType instanceof value_1.Pi) {
            const closure = funcType.resultType;
            return new C.Cong(this.target.readBackNeutral(context), closure
                .valOfClosure(new value_1.Absurd())
                .readBackType(context), (0, utils_1.readBack)(context, this.func.type, this.func.value));
        }
        else {
            throw new Error("Cong applied to non-Pi type.");
        }
    }
    prettyPrint() {
        return `N-Cong`;
    }
}
exports.Cong = Cong;
class Symm extends Neutral {
    constructor(target) {
        super();
        this.target = target;
    }
    readBackNeutral(context) {
        return new C.Symm(this.target.readBackNeutral(context));
    }
    prettyPrint() {
        return `N-Symm`;
    }
}
exports.Symm = Symm;
class IndEqual extends Neutral {
    constructor(target, motive, base) {
        super();
        this.target = target;
        this.motive = motive;
        this.base = base;
    }
    readBackNeutral(context) {
        return new C.IndEqual(this.target.readBackNeutral(context), (0, utils_1.readBack)(context, this.motive.type, this.motive.value), (0, utils_1.readBack)(context, this.base.type, this.base.value));
    }
    prettyPrint() {
        return `N-IndEqual`;
    }
}
exports.IndEqual = IndEqual;
class Head extends Neutral {
    constructor(target) {
        super();
        this.target = target;
    }
    readBackNeutral(context) {
        return new C.Head(this.target.readBackNeutral(context));
    }
    prettyPrint() {
        return `N-Head`;
    }
}
exports.Head = Head;
class Tail extends Neutral {
    constructor(target) {
        super();
        this.target = target;
    }
    readBackNeutral(context) {
        return new C.Tail(this.target.readBackNeutral(context));
    }
    prettyPrint() {
        return `N-Tail`;
    }
}
exports.Tail = Tail;
class IndVec1 extends Neutral {
    constructor(length, target, motive, base, step) {
        super();
        this.length = length;
        this.target = target;
        this.motive = motive;
        this.base = base;
        this.step = step;
    }
    readBackNeutral(context) {
        return new C.IndVec(this.length.readBackNeutral(context), (0, utils_1.readBack)(context, this.target.type, this.target.value), (0, utils_1.readBack)(context, this.motive.type, this.motive.value), (0, utils_1.readBack)(context, this.base.type, this.base.value), (0, utils_1.readBack)(context, this.step.type, this.step.value));
    }
    prettyPrint() {
        return `N-IndVec1`;
    }
}
exports.IndVec1 = IndVec1;
class IndVec2 extends Neutral {
    constructor(length, target, motive, base, step) {
        super();
        this.length = length;
        this.target = target;
        this.motive = motive;
        this.base = base;
        this.step = step;
    }
    readBackNeutral(context) {
        return new C.IndVec((0, utils_1.readBack)(context, this.length.type, this.length.value), this.target.readBackNeutral(context), (0, utils_1.readBack)(context, this.motive.type, this.motive.value), (0, utils_1.readBack)(context, this.base.type, this.base.value), (0, utils_1.readBack)(context, this.step.type, this.step.value));
    }
    prettyPrint() {
        return `N-IndVec2`;
    }
}
exports.IndVec2 = IndVec2;
class IndVec12 extends Neutral {
    constructor(length, target, motive, base, step) {
        super();
        this.length = length;
        this.target = target;
        this.motive = motive;
        this.base = base;
        this.step = step;
    }
    readBackNeutral(context) {
        return new C.IndVec(this.length.readBackNeutral(context), this.target.readBackNeutral(context), (0, utils_1.readBack)(context, this.motive.type, this.motive.value), (0, utils_1.readBack)(context, this.base.type, this.base.value), (0, utils_1.readBack)(context, this.step.type, this.step.value));
    }
    prettyPrint() {
        return `N-IndVec12`;
    }
}
exports.IndVec12 = IndVec12;
class IndEither extends Neutral {
    constructor(target, motive, baseLeft, baseRight) {
        super();
        this.target = target;
        this.motive = motive;
        this.baseLeft = baseLeft;
        this.baseRight = baseRight;
    }
    readBackNeutral(context) {
        return new C.IndEither(this.target.readBackNeutral(context), (0, utils_1.readBack)(context, this.motive.type, this.motive.value), (0, utils_1.readBack)(context, this.baseLeft.type, this.baseLeft.value), (0, utils_1.readBack)(context, this.baseRight.type, this.baseRight.value));
    }
    prettyPrint() {
        return `N-IndEither`;
    }
}
exports.IndEither = IndEither;
class GenericEliminator extends Neutral {
    constructor(typeName, target, motive, methods) {
        super();
        this.typeName = typeName;
        this.target = target;
        this.motive = motive;
        this.methods = methods;
    }
    readBackNeutral(context) {
        return new C.Eliminator(this.typeName, this.target.readBackNeutral(context), (0, utils_1.readBack)(context, this.motive.type, this.motive.value), this.methods.map(method => (0, utils_1.readBack)(context, method.type, method.value)));
    }
    prettyPrint() {
        return `N-GenericEliminator-${this.typeName}`;
    }
}
exports.GenericEliminator = GenericEliminator;
class Application extends Neutral {
    constructor(operator, operand) {
        super();
        this.operator = operator;
        this.operand = operand;
    }
    readBackNeutral(context) {
        return new C.Application(this.operator.readBackNeutral(context), (0, utils_1.readBack)(context, this.operand.type, this.operand.value));
    }
    prettyPrint() {
        return `N-Application`;
    }
}
exports.Application = Application;
// Predicate function to check if an object is Neutral
function isNeutral(obj) {
    return obj instanceof Neutral;
}
//# sourceMappingURL=neutral.js.map