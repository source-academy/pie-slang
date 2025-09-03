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
exports.Application = exports.IndEither = exports.IndVec12 = exports.IndVec2 = exports.IndVec1 = exports.Tail = exports.Head = exports.IndEqual = exports.Symm = exports.Cong = exports.Trans12 = exports.Trans2 = exports.Trans1 = exports.Replace = exports.IndAbsurd = exports.IndList = exports.RecList = exports.Cdr = exports.Car = exports.IndNat = exports.RecNat = exports.IterNat = exports.WhichNat = exports.TODO = exports.Variable = exports.Neutral = exports.Norm = void 0;
exports.isNorm = isNorm;
exports.isNeutral = isNeutral;
var C = require("./core");
var value_1 = require("./value");
var utils_1 = require("../evaluator/utils");
/*
    Normal forms consist of syntax that is produced by read-back,
    following the type. This structure contains a type value and a
    value described by the type, so that read-back can later be applied
    to it.
*/
var Norm = /** @class */ (function () {
    function Norm(type, value) {
        this.type = type;
        this.value = value;
    }
    return Norm;
}());
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
var Neutral = /** @class */ (function () {
    function Neutral() {
    }
    Neutral.prototype.toString = function () {
        return this.prettyPrint();
    };
    return Neutral;
}());
exports.Neutral = Neutral;
var Variable = /** @class */ (function (_super) {
    __extends(Variable, _super);
    function Variable(name) {
        var _this = _super.call(this) || this;
        _this.name = name;
        return _this;
    }
    Variable.prototype.readBackNeutral = function (context) {
        return new C.VarName(this.name);
    };
    Variable.prototype.prettyPrint = function () {
        return "N-".concat(this.name);
    };
    return Variable;
}(Neutral));
exports.Variable = Variable;
var TODO = /** @class */ (function (_super) {
    __extends(TODO, _super);
    function TODO(where, type) {
        var _this = _super.call(this) || this;
        _this.where = where;
        _this.type = type;
        return _this;
    }
    TODO.prototype.readBackNeutral = function (context) {
        return new C.TODO(this.where, this.type.readBackType(context));
    };
    TODO.prototype.prettyPrint = function () {
        return "N-TODO";
    };
    return TODO;
}(Neutral));
exports.TODO = TODO;
var WhichNat = /** @class */ (function (_super) {
    __extends(WhichNat, _super);
    function WhichNat(target, base, step) {
        var _this = _super.call(this) || this;
        _this.target = target;
        _this.base = base;
        _this.step = step;
        return _this;
    }
    WhichNat.prototype.readBackNeutral = function (context) {
        return new C.WhichNat(this.target.readBackNeutral(context), new C.The(this.base.type.readBackType(context), (0, utils_1.readBack)(context, this.base.type, this.base.value)), (0, utils_1.readBack)(context, this.step.type, this.step.value));
    };
    WhichNat.prototype.prettyPrint = function () {
        return "N-WhichNat";
    };
    return WhichNat;
}(Neutral));
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
    IterNat.prototype.readBackNeutral = function (context) {
        return new C.IterNat(this.target.readBackNeutral(context), new C.The(this.base.type.readBackType(context), (0, utils_1.readBack)(context, this.base.type, this.base.value)), (0, utils_1.readBack)(context, this.step.type, this.step.value));
    };
    IterNat.prototype.prettyPrint = function () {
        return "N-IterNat";
    };
    return IterNat;
}(Neutral));
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
    RecNat.prototype.readBackNeutral = function (context) {
        return new C.RecNat(this.target.readBackNeutral(context), new C.The(this.base.type.readBackType(context), (0, utils_1.readBack)(context, this.base.type, this.base.value)), (0, utils_1.readBack)(context, this.step.type, this.step.value));
    };
    RecNat.prototype.prettyPrint = function () {
        return "N-RecNat";
    };
    return RecNat;
}(Neutral));
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
    IndNat.prototype.readBackNeutral = function (context) {
        return new C.IndNat(this.target.readBackNeutral(context), (0, utils_1.readBack)(context, this.motive.type, this.motive.value), (0, utils_1.readBack)(context, this.base.type, this.base.value), (0, utils_1.readBack)(context, this.step.type, this.step.value));
    };
    IndNat.prototype.prettyPrint = function () {
        return "N-IndNat";
    };
    return IndNat;
}(Neutral));
exports.IndNat = IndNat;
var Car = /** @class */ (function (_super) {
    __extends(Car, _super);
    function Car(target) {
        var _this = _super.call(this) || this;
        _this.target = target;
        return _this;
    }
    Car.prototype.readBackNeutral = function (context) {
        return new C.Car(this.target.readBackNeutral(context));
    };
    Car.prototype.prettyPrint = function () {
        return "N-Car";
    };
    return Car;
}(Neutral));
exports.Car = Car;
var Cdr = /** @class */ (function (_super) {
    __extends(Cdr, _super);
    function Cdr(target) {
        var _this = _super.call(this) || this;
        _this.target = target;
        return _this;
    }
    Cdr.prototype.readBackNeutral = function (context) {
        return new C.Cdr(this.target.readBackNeutral(context));
    };
    Cdr.prototype.prettyPrint = function () {
        return "N-Cdr";
    };
    return Cdr;
}(Neutral));
exports.Cdr = Cdr;
var RecList = /** @class */ (function (_super) {
    __extends(RecList, _super);
    function RecList(target, base, step) {
        var _this = _super.call(this) || this;
        _this.target = target;
        _this.base = base;
        _this.step = step;
        return _this;
    }
    RecList.prototype.readBackNeutral = function (context) {
        return new C.RecList(this.target.readBackNeutral(context), new C.The(this.base.type.readBackType(context), (0, utils_1.readBack)(context, this.base.type, this.base.value)), (0, utils_1.readBack)(context, this.step.type, this.step.value));
    };
    RecList.prototype.prettyPrint = function () {
        return "N-RecList";
    };
    return RecList;
}(Neutral));
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
    IndList.prototype.readBackNeutral = function (context) {
        return new C.IndList(this.target.readBackNeutral(context), (0, utils_1.readBack)(context, this.motive.type, this.motive.value), (0, utils_1.readBack)(context, this.base.type, this.base.value), (0, utils_1.readBack)(context, this.step.type, this.step.value));
    };
    IndList.prototype.prettyPrint = function () {
        return "N-IndList";
    };
    return IndList;
}(Neutral));
exports.IndList = IndList;
var IndAbsurd = /** @class */ (function (_super) {
    __extends(IndAbsurd, _super);
    function IndAbsurd(target, motive) {
        var _this = _super.call(this) || this;
        _this.target = target;
        _this.motive = motive;
        return _this;
    }
    IndAbsurd.prototype.readBackNeutral = function (context) {
        // Here's some Absurd η. The rest is in α-equiv?.
        return new C.IndAbsurd(new C.The(new C.Absurd(), this.target.readBackNeutral(context)), (0, utils_1.readBack)(context, this.motive.type, this.motive.value));
    };
    IndAbsurd.prototype.prettyPrint = function () {
        return "N-IndAbsurd";
    };
    return IndAbsurd;
}(Neutral));
exports.IndAbsurd = IndAbsurd;
var Replace = /** @class */ (function (_super) {
    __extends(Replace, _super);
    function Replace(target, motive, base) {
        var _this = _super.call(this) || this;
        _this.target = target;
        _this.motive = motive;
        _this.base = base;
        return _this;
    }
    Replace.prototype.readBackNeutral = function (context) {
        return new C.Replace(this.target.readBackNeutral(context), (0, utils_1.readBack)(context, this.motive.type, this.motive.value), (0, utils_1.readBack)(context, this.base.type, this.base.value));
    };
    Replace.prototype.prettyPrint = function () {
        return "N-Replace";
    };
    return Replace;
}(Neutral));
exports.Replace = Replace;
var Trans1 = /** @class */ (function (_super) {
    __extends(Trans1, _super);
    function Trans1(target1, target2) {
        var _this = _super.call(this) || this;
        _this.target1 = target1;
        _this.target2 = target2;
        return _this;
    }
    Trans1.prototype.readBackNeutral = function (context) {
        return new C.Trans(this.target1.readBackNeutral(context), (0, utils_1.readBack)(context, this.target2.type, this.target2.value));
    };
    Trans1.prototype.prettyPrint = function () {
        return "N-Trans1";
    };
    return Trans1;
}(Neutral));
exports.Trans1 = Trans1;
var Trans2 = /** @class */ (function (_super) {
    __extends(Trans2, _super);
    function Trans2(target1, target2) {
        var _this = _super.call(this) || this;
        _this.target1 = target1;
        _this.target2 = target2;
        return _this;
    }
    Trans2.prototype.readBackNeutral = function (context) {
        return new C.Trans((0, utils_1.readBack)(context, this.target1.type, this.target1.value), this.target2.readBackNeutral(context));
    };
    Trans2.prototype.prettyPrint = function () {
        return "N-Trans2";
    };
    return Trans2;
}(Neutral));
exports.Trans2 = Trans2;
var Trans12 = /** @class */ (function (_super) {
    __extends(Trans12, _super);
    function Trans12(target1, target2) {
        var _this = _super.call(this) || this;
        _this.target1 = target1;
        _this.target2 = target2;
        return _this;
    }
    Trans12.prototype.readBackNeutral = function (context) {
        return new C.Trans(this.target1.readBackNeutral(context), this.target2.readBackNeutral(context));
    };
    Trans12.prototype.prettyPrint = function () {
        return "N-Trans12";
    };
    return Trans12;
}(Neutral));
exports.Trans12 = Trans12;
var Cong = /** @class */ (function (_super) {
    __extends(Cong, _super);
    function Cong(target, func) {
        var _this = _super.call(this) || this;
        _this.target = target;
        _this.func = func;
        return _this;
    }
    Cong.prototype.readBackNeutral = function (context) {
        var funcType = this.func.type;
        if (funcType instanceof value_1.Pi) {
            var closure = funcType.resultType;
            return new C.Cong(this.target.readBackNeutral(context), closure
                .valOfClosure(new value_1.Absurd())
                .readBackType(context), (0, utils_1.readBack)(context, this.func.type, this.func.value));
        }
        else {
            throw new Error("Cong applied to non-Pi type.");
        }
    };
    Cong.prototype.prettyPrint = function () {
        return "N-Cong";
    };
    return Cong;
}(Neutral));
exports.Cong = Cong;
var Symm = /** @class */ (function (_super) {
    __extends(Symm, _super);
    function Symm(target) {
        var _this = _super.call(this) || this;
        _this.target = target;
        return _this;
    }
    Symm.prototype.readBackNeutral = function (context) {
        return new C.Symm(this.target.readBackNeutral(context));
    };
    Symm.prototype.prettyPrint = function () {
        return "N-Symm";
    };
    return Symm;
}(Neutral));
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
    IndEqual.prototype.readBackNeutral = function (context) {
        return new C.IndEqual(this.target.readBackNeutral(context), (0, utils_1.readBack)(context, this.motive.type, this.motive.value), (0, utils_1.readBack)(context, this.base.type, this.base.value));
    };
    IndEqual.prototype.prettyPrint = function () {
        return "N-IndEqual";
    };
    return IndEqual;
}(Neutral));
exports.IndEqual = IndEqual;
var Head = /** @class */ (function (_super) {
    __extends(Head, _super);
    function Head(target) {
        var _this = _super.call(this) || this;
        _this.target = target;
        return _this;
    }
    Head.prototype.readBackNeutral = function (context) {
        return new C.Head(this.target.readBackNeutral(context));
    };
    Head.prototype.prettyPrint = function () {
        return "N-Head";
    };
    return Head;
}(Neutral));
exports.Head = Head;
var Tail = /** @class */ (function (_super) {
    __extends(Tail, _super);
    function Tail(target) {
        var _this = _super.call(this) || this;
        _this.target = target;
        return _this;
    }
    Tail.prototype.readBackNeutral = function (context) {
        return new C.Tail(this.target.readBackNeutral(context));
    };
    Tail.prototype.prettyPrint = function () {
        return "N-Tail";
    };
    return Tail;
}(Neutral));
exports.Tail = Tail;
var IndVec1 = /** @class */ (function (_super) {
    __extends(IndVec1, _super);
    function IndVec1(length, target, motive, base, step) {
        var _this = _super.call(this) || this;
        _this.length = length;
        _this.target = target;
        _this.motive = motive;
        _this.base = base;
        _this.step = step;
        return _this;
    }
    IndVec1.prototype.readBackNeutral = function (context) {
        return new C.IndVec(this.length.readBackNeutral(context), (0, utils_1.readBack)(context, this.target.type, this.target.value), (0, utils_1.readBack)(context, this.motive.type, this.motive.value), (0, utils_1.readBack)(context, this.base.type, this.base.value), (0, utils_1.readBack)(context, this.step.type, this.step.value));
    };
    IndVec1.prototype.prettyPrint = function () {
        return "N-IndVec1";
    };
    return IndVec1;
}(Neutral));
exports.IndVec1 = IndVec1;
var IndVec2 = /** @class */ (function (_super) {
    __extends(IndVec2, _super);
    function IndVec2(length, target, motive, base, step) {
        var _this = _super.call(this) || this;
        _this.length = length;
        _this.target = target;
        _this.motive = motive;
        _this.base = base;
        _this.step = step;
        return _this;
    }
    IndVec2.prototype.readBackNeutral = function (context) {
        return new C.IndVec((0, utils_1.readBack)(context, this.length.type, this.length.value), this.target.readBackNeutral(context), (0, utils_1.readBack)(context, this.motive.type, this.motive.value), (0, utils_1.readBack)(context, this.base.type, this.base.value), (0, utils_1.readBack)(context, this.step.type, this.step.value));
    };
    IndVec2.prototype.prettyPrint = function () {
        return "N-IndVec2";
    };
    return IndVec2;
}(Neutral));
exports.IndVec2 = IndVec2;
var IndVec12 = /** @class */ (function (_super) {
    __extends(IndVec12, _super);
    function IndVec12(length, target, motive, base, step) {
        var _this = _super.call(this) || this;
        _this.length = length;
        _this.target = target;
        _this.motive = motive;
        _this.base = base;
        _this.step = step;
        return _this;
    }
    IndVec12.prototype.readBackNeutral = function (context) {
        return new C.IndVec(this.length.readBackNeutral(context), this.target.readBackNeutral(context), (0, utils_1.readBack)(context, this.motive.type, this.motive.value), (0, utils_1.readBack)(context, this.base.type, this.base.value), (0, utils_1.readBack)(context, this.step.type, this.step.value));
    };
    IndVec12.prototype.prettyPrint = function () {
        return "N-IndVec12";
    };
    return IndVec12;
}(Neutral));
exports.IndVec12 = IndVec12;
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
    IndEither.prototype.readBackNeutral = function (context) {
        return new C.IndEither(this.target.readBackNeutral(context), (0, utils_1.readBack)(context, this.motive.type, this.motive.value), (0, utils_1.readBack)(context, this.baseLeft.type, this.baseLeft.value), (0, utils_1.readBack)(context, this.baseRight.type, this.baseRight.value));
    };
    IndEither.prototype.prettyPrint = function () {
        return "N-IndEither";
    };
    return IndEither;
}(Neutral));
exports.IndEither = IndEither;
var Application = /** @class */ (function (_super) {
    __extends(Application, _super);
    function Application(operator, operand) {
        var _this = _super.call(this) || this;
        _this.operator = operator;
        _this.operand = operand;
        return _this;
    }
    Application.prototype.readBackNeutral = function (context) {
        return new C.Application(this.operator.readBackNeutral(context), (0, utils_1.readBack)(context, this.operand.type, this.operand.value));
    };
    Application.prototype.prettyPrint = function () {
        return "N-Application";
    };
    return Application;
}(Neutral));
exports.Application = Application;
// Predicate function to check if an object is Neutral
function isNeutral(obj) {
    return obj instanceof Neutral;
}
