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
var __spreadArray = (this && this.__spreadArray) || function (to, from, pack) {
    if (pack || arguments.length === 2) for (var i = 0, l = from.length, ar; i < l; i++) {
        if (ar || !(i in from)) {
            if (!ar) ar = Array.prototype.slice.call(from, 0, i);
            ar[i] = from[i];
        }
    }
    return to.concat(ar || Array.prototype.slice.call(from));
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.Application = exports.TODO = exports.IndEither = exports.Right = exports.Left = exports.Either = exports.IndVec = exports.Tail = exports.Head = exports.VecCons = exports.VecNil = exports.Vec = exports.IndEqual = exports.Symm = exports.Cong = exports.Trans = exports.Replace = exports.Same = exports.Equal = exports.IndAbsurd = exports.Absurd = exports.IndList = exports.RecList = exports.ListCons = exports.List = exports.Number = exports.Nil = exports.Sole = exports.Trivial = exports.Cdr = exports.Car = exports.Cons = exports.Pair = exports.Quote = exports.Atom = exports.Name = exports.Sigma = exports.Lambda = exports.Pi = exports.Arrow = exports.IndNat = exports.RecNat = exports.IterNat = exports.WhichNat = exports.Add1 = exports.Zero = exports.Nat = exports.Universe = exports.The = exports.Source = void 0;
var C = require("./core");
var V = require("./value");
var N = require("./neutral");
var S = require("./source");
var utils_1 = require("../typechecker/utils");
var locations_1 = require("../utils/locations");
var context_1 = require("../utils/context");
var utils_2 = require("./utils");
var utils_3 = require("../typechecker/utils");
var utils_4 = require("../evaluator/utils");
var synthesizer_1 = require("../typechecker/synthesizer");
var utils_5 = require("./utils");
var context_2 = require("../utils/context");
var Source = /** @class */ (function () {
    function Source(location) {
        this.location = location;
    }
    Source.prototype.isType = function (ctx, renames) {
        var _this = this;
        var ok = new utils_2.PerhapsM("ok");
        var theType = this.getType(ctx, renames);
        return (0, utils_2.goOn)([[ok, function () { return theType; }]], function () {
            (0, utils_1.SendPieInfo)(_this.location, ['is-type', ok.value]);
            return new utils_2.go(ok.value);
        });
    };
    Source.prototype.getType = function (ctx, renames) {
        var _this = this;
        var checkType = this.check(ctx, renames, new V.Universe());
        if (checkType instanceof utils_2.go) {
            return checkType;
        }
        else if (checkType instanceof utils_2.stop) {
            if (this instanceof Name && (0, utils_2.isVarName)(this.name)) {
                var otherTv_1 = new utils_2.PerhapsM("other-tv");
                return new utils_2.goOn([
                    [otherTv_1,
                        function () { return (0, context_2.varType)(ctx, _this.location, _this.name); }]
                ], function () {
                    new utils_2.stop(_this.location, new utils_2.Message(["Expected U, but given ".concat(otherTv_1.value.readBackType(ctx))]));
                });
            }
            else {
                return new utils_2.stop(this.location, new utils_2.Message(["not a type"]));
            }
        }
        else {
            throw new Error('Invalid checkType');
        }
    };
    Source.prototype.check = function (ctx, renames, type) {
        var ok = new utils_2.PerhapsM("ok");
        var out = this.checkOut(ctx, renames, type);
        // SendPieInfo(srcLoc(input), ['has-type', readBackType(Γ, tv)!]);
        return (0, utils_2.goOn)([[ok, function () { return out; }]], function () { return new utils_2.go(ok.value); });
    };
    Source.prototype.synth = function (ctx, renames) {
        var _this = this;
        var ok = new utils_2.PerhapsM("ok");
        return (0, utils_2.goOn)([[ok, function () { return _this.synthHelper(ctx, renames); }]], function () {
            (0, utils_1.SendPieInfo)(_this.location, ['is-type', ok.value.type]);
            return new utils_2.go(ok.value);
        });
    };
    Source.prototype.checkOut = function (ctx, renames, type) {
        var _this = this;
        var theT = new utils_2.PerhapsM("theT");
        return (0, utils_2.goOn)([
            [theT, function () { return _this.synth(ctx, renames); }],
            [
                new utils_2.PerhapsM("_"),
                function () { return (0, utils_3.sameType)(ctx, _this.location, (0, context_1.valInContext)(ctx, theT.value.type), type); }
            ],
        ], function () { return new utils_2.go(theT.value.expr); });
    };
    return Source;
}());
exports.Source = Source;
var The = /** @class */ (function (_super) {
    __extends(The, _super);
    function The(location, type, value) {
        var _this = _super.call(this, location) || this;
        _this.location = location;
        _this.type = type;
        _this.value = value;
        return _this;
    }
    The.prototype.synthHelper = function (ctx, renames) {
        return synthesizer_1.synthesizer.synthThe(ctx, renames, this.type, this.value);
    };
    The.prototype.findNames = function () {
        return this.type.findNames()
            .concat(this.value.findNames());
    };
    The.prototype.prettyPrint = function () {
        return "(the ".concat(this.type.prettyPrint(), " ").concat(this.value.prettyPrint(), ")");
    };
    The.prototype.toString = function () {
        return this.prettyPrint();
    };
    return The;
}(Source));
exports.The = The;
var Universe = /** @class */ (function (_super) {
    __extends(Universe, _super);
    function Universe(location) {
        var _this = _super.call(this, location) || this;
        _this.location = location;
        return _this;
    }
    Universe.prototype.synthHelper = function (ctx, renames) {
        return synthesizer_1.synthesizer.synthUniverse(ctx, renames, this.location);
    };
    Universe.prototype.findNames = function () {
        return [];
    };
    Universe.prototype.getType = function (ctx, renames) {
        return new utils_2.go(new C.Universe());
    };
    Universe.prototype.prettyPrint = function () {
        return 'U';
    };
    Universe.prototype.toString = function () {
        return this.prettyPrint();
    };
    return Universe;
}(Source));
exports.Universe = Universe;
var Nat = /** @class */ (function (_super) {
    __extends(Nat, _super);
    function Nat(location) {
        var _this = _super.call(this, location) || this;
        _this.location = location;
        return _this;
    }
    Nat.prototype.synthHelper = function (ctx, renames) {
        return synthesizer_1.synthesizer.synthNat(ctx, renames);
    };
    Nat.prototype.findNames = function () {
        return [];
    };
    Nat.prototype.getType = function (ctx, renames) {
        return new utils_2.go(new C.Nat());
    };
    Nat.prototype.prettyPrint = function () {
        return 'Nat';
    };
    Nat.prototype.toString = function () {
        return this.prettyPrint();
    };
    return Nat;
}(Source));
exports.Nat = Nat;
var Zero = /** @class */ (function (_super) {
    __extends(Zero, _super);
    function Zero(location) {
        var _this = _super.call(this, location) || this;
        _this.location = location;
        return _this;
    }
    Zero.prototype.synthHelper = function (ctx, renames) {
        return synthesizer_1.synthesizer.synthZero(ctx, renames);
    };
    Zero.prototype.findNames = function () {
        return [];
    };
    Zero.prototype.prettyPrint = function () {
        return 'zero';
    };
    Zero.prototype.toString = function () {
        return this.prettyPrint();
    };
    return Zero;
}(Source));
exports.Zero = Zero;
var Add1 = /** @class */ (function (_super) {
    __extends(Add1, _super);
    function Add1(location, base) {
        var _this = _super.call(this, location) || this;
        _this.location = location;
        _this.base = base;
        return _this;
    }
    Add1.prototype.synthHelper = function (ctx, renames) {
        return synthesizer_1.synthesizer.synthAdd1(ctx, renames, this.base);
    };
    Add1.prototype.findNames = function () {
        return this.base.findNames();
    };
    Add1.prototype.prettyPrint = function () {
        return "(add1 ".concat(this.base.prettyPrint(), ")");
    };
    Add1.prototype.toString = function () {
        return this.prettyPrint();
    };
    return Add1;
}(Source));
exports.Add1 = Add1;
var WhichNat = /** @class */ (function (_super) {
    __extends(WhichNat, _super);
    function WhichNat(location, target, base, step) {
        var _this = _super.call(this, location) || this;
        _this.location = location;
        _this.target = target;
        _this.base = base;
        _this.step = step;
        return _this;
    }
    WhichNat.prototype.synthHelper = function (ctx, renames) {
        return synthesizer_1.synthesizer.synthWhichNat(ctx, renames, this.target, this.base, this.step);
    };
    WhichNat.prototype.findNames = function () {
        return this.target.findNames()
            .concat(this.base.findNames())
            .concat(this.step.findNames());
    };
    WhichNat.prototype.prettyPrint = function () {
        return "(which-nat ".concat(this.target.prettyPrint(), " \n              ").concat(this.base.prettyPrint(), " \n              ").concat(this.step.prettyPrint(), ")");
    };
    WhichNat.prototype.toString = function () {
        return this.prettyPrint();
    };
    return WhichNat;
}(Source));
exports.WhichNat = WhichNat;
var IterNat = /** @class */ (function (_super) {
    __extends(IterNat, _super);
    function IterNat(location, target, base, step) {
        var _this = _super.call(this, location) || this;
        _this.location = location;
        _this.target = target;
        _this.base = base;
        _this.step = step;
        return _this;
    }
    IterNat.prototype.synthHelper = function (ctx, renames) {
        return synthesizer_1.synthesizer.synthIterNat(ctx, renames, this.target, this.base, this.step);
    };
    IterNat.prototype.findNames = function () {
        return this.target.findNames()
            .concat(this.base.findNames())
            .concat(this.step.findNames());
    };
    IterNat.prototype.prettyPrint = function () {
        return "(iter-nat ".concat(this.target.prettyPrint(), " \n              ").concat(this.base.prettyPrint(), " \n              ").concat(this.step.prettyPrint(), ")");
    };
    IterNat.prototype.toString = function () {
        return this.prettyPrint();
    };
    return IterNat;
}(Source));
exports.IterNat = IterNat;
var RecNat = /** @class */ (function (_super) {
    __extends(RecNat, _super);
    function RecNat(location, target, base, step) {
        var _this = _super.call(this, location) || this;
        _this.location = location;
        _this.target = target;
        _this.base = base;
        _this.step = step;
        return _this;
    }
    RecNat.prototype.synthHelper = function (ctx, renames) {
        return synthesizer_1.synthesizer.synthRecNat(ctx, renames, this.target, this.base, this.step);
    };
    RecNat.prototype.findNames = function () {
        return this.target.findNames()
            .concat(this.base.findNames())
            .concat(this.step.findNames());
    };
    RecNat.prototype.prettyPrint = function () {
        return "(rec-nat ".concat(this.target.prettyPrint(), " \n              ").concat(this.base.prettyPrint(), " \n              ").concat(this.step.prettyPrint(), ")");
    };
    RecNat.prototype.toString = function () {
        return this.prettyPrint();
    };
    return RecNat;
}(Source));
exports.RecNat = RecNat;
var IndNat = /** @class */ (function (_super) {
    __extends(IndNat, _super);
    function IndNat(location, target, motive, base, step) {
        var _this = _super.call(this, location) || this;
        _this.location = location;
        _this.target = target;
        _this.motive = motive;
        _this.base = base;
        _this.step = step;
        return _this;
    }
    IndNat.prototype.synthHelper = function (ctx, renames) {
        return synthesizer_1.synthesizer.synthIndNat(ctx, renames, this.target, this.motive, this.base, this.step);
    };
    IndNat.prototype.findNames = function () {
        return this.target.findNames()
            .concat(this.motive.findNames())
            .concat(this.base.findNames())
            .concat(this.step.findNames());
    };
    IndNat.prototype.prettyPrint = function () {
        return "(ind-nat ".concat(this.target.prettyPrint(), " \n              ").concat(this.motive.prettyPrint(), " \n              ").concat(this.base.prettyPrint(), " \n              ").concat(this.step.prettyPrint(), ")");
    };
    IndNat.prototype.toString = function () {
        return this.prettyPrint();
    };
    return IndNat;
}(Source));
exports.IndNat = IndNat;
// Function types and operations
var Arrow = /** @class */ (function (_super) {
    __extends(Arrow, _super);
    function Arrow(location, arg1, arg2, args) {
        var _this = _super.call(this, location) || this;
        _this.location = location;
        _this.arg1 = arg1;
        _this.arg2 = arg2;
        _this.args = args;
        return _this;
    }
    Arrow.prototype.synthHelper = function (ctx, renames) {
        return synthesizer_1.synthesizer.synthArrow(ctx, renames, this.location, this.arg1, this.arg2, this.args);
    };
    Arrow.prototype.findNames = function () {
        return this.arg1.findNames()
            .concat(this.arg2.findNames())
            .concat(this.args.flatMap(function (arg) { return arg.findNames(); }));
    };
    Arrow.prototype.getType = function (ctx, renames) {
        var _this = this;
        var _a = [this.arg1, this.arg2, this.args], A = _a[0], B = _a[1], args = _a[2];
        if (args.length === 0) {
            var x_1 = (0, utils_2.freshBinder)(ctx, B, 'x');
            var Aout_1 = new utils_2.PerhapsM("Aout");
            var Bout_1 = new utils_2.PerhapsM('Bout');
            return (0, utils_2.goOn)([
                [Aout_1, function () { return A.isType(ctx, renames); }],
                [Bout_1,
                    function () {
                        return B.isType((0, context_1.bindFree)(ctx, x_1, (0, context_1.valInContext)(ctx, Aout_1.value)), renames);
                    }
                ]
            ], function () {
                return new utils_2.go(new C.Pi(x_1, Aout_1.value, Bout_1.value));
            });
        }
        else {
            var rest0_1 = args[0], rest_1 = args.slice(1);
            var x_2 = (0, utils_2.freshBinder)(ctx, (0, utils_1.makeApp)(B, rest0_1, rest_1), 'x');
            var Aout_2 = new utils_2.PerhapsM("Aout");
            var tout_1 = new utils_2.PerhapsM('tout');
            return (0, utils_2.goOn)([
                [Aout_2, function () { return A.isType(ctx, renames); }],
                [tout_1,
                    function () {
                        return new Arrow((0, locations_1.notForInfo)(_this.location), B, rest0_1, rest_1).isType((0, context_1.bindFree)(ctx, x_2, (0, context_1.valInContext)(ctx, Aout_2.value)), renames);
                    }
                ]
            ], function () { return new utils_2.go(new C.Pi(x_2, Aout_2.value, tout_1.value)); });
        }
    };
    Arrow.prototype.prettyPrint = function () {
        return "(-> ".concat(this.arg1.prettyPrint(), " ").concat(this.arg2.prettyPrint(), " ").concat(this.args.map(function (arg) { return arg.prettyPrint(); }).join(' '), ")");
    };
    Arrow.prototype.toString = function () {
        return this.prettyPrint();
    };
    return Arrow;
}(Source));
exports.Arrow = Arrow;
var Pi = /** @class */ (function (_super) {
    __extends(Pi, _super);
    function Pi(location, binders, body) {
        var _this = _super.call(this, location) || this;
        _this.location = location;
        _this.binders = binders;
        _this.body = body;
        return _this;
    }
    Pi.prototype.synthHelper = function (ctx, renames) {
        return synthesizer_1.synthesizer.synthPi(ctx, renames, this.location, this.binders, this.body);
    };
    Pi.prototype.findNames = function () {
        // TEST THIS
        return this.binders.flatMap(function (binder) { return (0, utils_2.occurringBinderNames)(binder); })
            .concat(this.body.findNames());
    };
    Pi.prototype.getType = function (ctx, renames) {
        var _this = this;
        var _a = [this.binders, this.body], binders = _a[0], B = _a[1];
        if (binders.length === 1) {
            var _b = [binders[0].binder, binders[0].type], bd_1 = _b[0], A_1 = _b[1];
            var y_1 = (0, utils_5.fresh)(ctx, bd_1.varName);
            var xloc_1 = bd_1.location;
            var Aout_3 = new utils_2.PerhapsM('Aout');
            var Aoutv_1 = new utils_2.PerhapsM('Aoutv');
            var Bout_2 = new utils_2.PerhapsM('Bout');
            return (0, utils_2.goOn)([
                [Aout_3, function () { return A_1.isType(ctx, renames); }],
                [Aoutv_1, function () {
                        return new utils_2.go((0, context_1.valInContext)(ctx, Aout_3.value));
                    }
                ],
                [Bout_2, function () {
                        return B.isType((0, context_1.bindFree)(ctx, y_1, Aoutv_1.value), (0, utils_1.extendRenaming)(renames, bd_1.varName, y_1));
                    }
                ],
            ], function () {
                (0, utils_1.PieInfoHook)(xloc_1, ['binding-site', Aout_3.value]);
                return new utils_2.go(new C.Pi(y_1, Aout_3.value, Bout_2.value));
            });
        }
        else if (binders.length > 1) {
            var bd_2 = binders[0], rest_2 = binders.slice(1);
            var _c = [bd_2.binder.varName, bd_2.type], x = _c[0], A_2 = _c[1];
            var z_1 = (0, utils_5.fresh)(ctx, x);
            var xloc_2 = bd_2.binder.location;
            var Aout_4 = new utils_2.PerhapsM('Aout');
            var Aoutv_2 = new utils_2.PerhapsM('Aoutv');
            var Bout_3 = new utils_2.PerhapsM('Bout');
            return (0, utils_2.goOn)([
                [Aout_4, function () { return A_2.isType(ctx, renames); }],
                [Aoutv_2, function () {
                        return new utils_2.go((0, context_1.valInContext)(ctx, Aout_4.value));
                    }
                ],
                [Bout_3, function () {
                        return new Pi((0, locations_1.notForInfo)(_this.location), rest_2, B).isType((0, context_1.bindFree)(ctx, z_1, Aoutv_2.value), (0, utils_1.extendRenaming)(renames, bd_2.binder.varName, z_1));
                    }
                ]
            ], function () {
                (0, utils_1.PieInfoHook)(xloc_2, ['binding-site', Aout_4.value]);
                return new utils_2.go(new C.Pi(z_1, Aout_4.value, Bout_3.value));
            });
        }
        else {
            throw new Error('Invalid number of binders in Pi type');
        }
    };
    Pi.prototype.prettyPrint = function () {
        return "(\u03A0 ".concat(this.binders.map(function (binder) { return "(".concat(binder.binder.varName, " ").concat(binder.type.prettyPrint(), ")"); }).join(' '), " \n            ").concat(this.body.prettyPrint(), ")");
    };
    Pi.prototype.toString = function () {
        return this.prettyPrint();
    };
    return Pi;
}(Source));
exports.Pi = Pi;
var Lambda = /** @class */ (function (_super) {
    __extends(Lambda, _super);
    function Lambda(location, binders, body) {
        var _this = _super.call(this, location) || this;
        _this.location = location;
        _this.binders = binders;
        _this.body = body;
        return _this;
    }
    Lambda.prototype.synthHelper = function (ctx, renames) {
        throw new Error('Method not implemented.');
    };
    Lambda.prototype.findNames = function () {
        return this.binders.map(function (binder) { return binder.varName; })
            .concat(this.body.findNames());
    };
    Lambda.prototype.checkOut = function (ctx, renames, type) {
        if (this.binders.length === 1) {
            var body_1 = this.body;
            var binder = this.binders[0];
            var x_3 = binder.varName;
            var xLoc_1 = binder.location;
            var typeNow = type.now();
            if (typeNow instanceof V.Pi) {
                var A_3 = typeNow.argType;
                var closure_1 = typeNow.resultType;
                var xRenamed_1 = (0, utils_1.rename)(renames, x_3);
                var bout_1 = new utils_2.PerhapsM("bout");
                return (0, utils_2.goOn)([
                    [
                        bout_1,
                        function () { return body_1.check((0, context_1.bindFree)(ctx, xRenamed_1, A_3), (0, utils_1.extendRenaming)(renames, x_3, xRenamed_1), closure_1.valOfClosure(new V.Neutral(A_3, new N.Variable(xRenamed_1)))); }
                    ]
                ], function () {
                    (0, utils_1.PieInfoHook)(xLoc_1, ['binding-site', A_3.readBackType(ctx)]);
                    return new utils_2.go(new C.Lambda(xRenamed_1, bout_1.value));
                });
            }
            else {
                return new utils_2.stop(xLoc_1, new utils_2.Message(["Not a function type: ".concat(typeNow.readBackType(ctx), ".")]));
            }
        }
        else { // xBinding.length > 1
            return (new S.Lambda(this.location, [this.binders[0]], (new S.Lambda((0, locations_1.notForInfo)(this.location), this.binders.slice(1), this.body)))).check(ctx, renames, type);
        }
    };
    Lambda.prototype.prettyPrint = function () {
        return "(lambda ".concat(this.binders.map(function (binder) { return binder.varName; }).join(' '), " ").concat(this.body.prettyPrint(), ")");
    };
    Lambda.prototype.toString = function () {
        return this.prettyPrint();
    };
    return Lambda;
}(Source));
exports.Lambda = Lambda;
// Product types and operations
var Sigma = /** @class */ (function (_super) {
    __extends(Sigma, _super);
    function Sigma(location, binders, body) {
        var _this = _super.call(this, location) || this;
        _this.location = location;
        _this.binders = binders;
        _this.body = body;
        return _this;
    }
    Sigma.prototype.synthHelper = function (ctx, renames) {
        return synthesizer_1.synthesizer.synthSigma(ctx, renames, this.location, this.binders, this.body);
    };
    Sigma.prototype.findNames = function () {
        return this.binders.flatMap(function (binder) { return (0, utils_2.occurringBinderNames)(binder); })
            .concat(this.body.findNames());
    };
    Sigma.prototype.getType = function (ctx, renames) {
        var _this = this;
        var _a = [this.binders, this.body], binders = _a[0], D = _a[1];
        if (binders.length === 1) {
            var _b = [binders[0].binder, binders[0].type], bd = _b[0], A_4 = _b[1];
            var x_4 = bd.varName;
            var y_2 = (0, utils_5.fresh)(ctx, x_4);
            var xloc_3 = bd.location;
            var Aout_5 = new utils_2.PerhapsM('Aout');
            var Aoutv_3 = new utils_2.PerhapsM('Aoutv');
            var Dout_1 = new utils_2.PerhapsM('Dout');
            return (0, utils_2.goOn)([
                [Aout_5, function () { return A_4.isType(ctx, renames); }],
                [Aoutv_3, function () { return new utils_2.go((0, context_1.valInContext)(ctx, Aout_5.value)); }],
                [Dout_1, function () {
                        return D.isType((0, context_1.bindFree)(ctx, y_2, Aoutv_3.value), (0, utils_1.extendRenaming)(renames, x_4, y_2));
                    }
                ]
            ], function () {
                (0, utils_1.PieInfoHook)(xloc_3, ['binding-site', Aout_5.value]);
                return new utils_2.go(new C.Sigma(y_2, Aout_5.value, Dout_1.value));
            });
        }
        else if (binders.length > 1) {
            var _c = __spreadArray([[binders[0].binder, binders[0].type], binders[1]], binders.slice(2), true), _d = _c[0], bd = _d[0], A_5 = _d[1], rest_3 = _c.slice(1);
            var x_5 = bd.varName;
            var z_2 = (0, utils_5.fresh)(ctx, x_5);
            var xloc_4 = bd.location;
            var Aout_6 = new utils_2.PerhapsM('Aout');
            var Aoutv_4 = new utils_2.PerhapsM('Aoutv');
            var Dout_2 = new utils_2.PerhapsM('Dout');
            return (0, utils_2.goOn)([
                [Aout_6, function () { return A_5.isType(ctx, renames); }],
                [Aoutv_4, function () { return new utils_2.go((0, context_1.valInContext)(ctx, Aout_6.value)); }],
                [Dout_2, function () {
                        return new Sigma(_this.location, rest_3, D)
                            .isType((0, context_1.bindFree)(ctx, x_5, Aoutv_4.value), (0, utils_1.extendRenaming)(renames, x_5, z_2));
                    }
                ]
            ], function () {
                (0, utils_1.PieInfoHook)(xloc_4, ['binding-site', Aout_6.value]);
                return new utils_2.go(new C.Sigma(z_2, Aout_6.value, Dout_2.value));
            });
        }
        else {
            throw new Error('Invalid number of binders in Sigma type');
        }
    };
    Sigma.prototype.prettyPrint = function () {
        return "(\u03A3 ".concat(this.binders.map(function (binder) { return "(".concat(binder.binder.varName, " ").concat(binder.type.prettyPrint(), ")"); }).join(' '), " \n            ").concat(this.body.prettyPrint(), ")");
    };
    Sigma.prototype.toString = function () {
        return this.prettyPrint();
    };
    return Sigma;
}(Source));
exports.Sigma = Sigma;
var Name = /** @class */ (function (_super) {
    __extends(Name, _super);
    function Name(location, name) {
        var _this = _super.call(this, location) || this;
        _this.location = location;
        _this.name = name;
        return _this;
    }
    Name.prototype.synthHelper = function (ctx, renames) {
        return synthesizer_1.synthesizer.synthName(ctx, renames, this.location, this.name);
    };
    Name.prototype.findNames = function () {
        return [this.name];
    };
    Name.prototype.prettyPrint = function () {
        return this.name;
    };
    Name.prototype.toString = function () {
        return this.prettyPrint();
    };
    return Name;
}(Source));
exports.Name = Name;
var Atom = /** @class */ (function (_super) {
    __extends(Atom, _super);
    function Atom(location) {
        var _this = _super.call(this, location) || this;
        _this.location = location;
        return _this;
    }
    Atom.prototype.synthHelper = function (ctx, renames) {
        return synthesizer_1.synthesizer.synthAtom(ctx, renames);
    };
    Atom.prototype.findNames = function () {
        return [];
    };
    Atom.prototype.getType = function (ctx, renames) {
        return new utils_2.go(new C.Atom());
    };
    Atom.prototype.prettyPrint = function () {
        return 'Atom';
    };
    Atom.prototype.toString = function () {
        return this.prettyPrint();
    };
    return Atom;
}(Source));
exports.Atom = Atom;
var Quote = /** @class */ (function (_super) {
    __extends(Quote, _super);
    function Quote(location, name) {
        var _this = _super.call(this, location) || this;
        _this.location = location;
        _this.name = name;
        return _this;
    }
    Quote.prototype.synthHelper = function (ctx, renames) {
        return synthesizer_1.synthesizer.synthQuote(ctx, renames, this.location, this.name);
    };
    Quote.prototype.findNames = function () {
        return [];
    };
    Quote.prototype.prettyPrint = function () {
        return "'".concat(this.name);
    };
    Quote.prototype.toString = function () {
        return this.prettyPrint();
    };
    return Quote;
}(Source));
exports.Quote = Quote;
var Pair = /** @class */ (function (_super) {
    __extends(Pair, _super);
    function Pair(location, first, second) {
        var _this = _super.call(this, location) || this;
        _this.location = location;
        _this.first = first;
        _this.second = second;
        return _this;
    }
    Pair.prototype.synthHelper = function (ctx, renames) {
        return synthesizer_1.synthesizer.synthPair(ctx, renames, this.first, this.second);
    };
    Pair.prototype.findNames = function () {
        return this.first.findNames()
            .concat(this.second.findNames());
    };
    Pair.prototype.getType = function (ctx, renames) {
        var _this = this;
        var Aout = new utils_2.PerhapsM('Aout');
        var Dout = new utils_2.PerhapsM('Dout');
        var x = (0, utils_2.freshBinder)(ctx, this.second, 'x');
        return (0, utils_2.goOn)([
            [Aout, function () { return _this.first.isType(ctx, renames); }],
            [Dout, function () { return _this.second.isType((0, context_1.bindFree)(ctx, x, (0, context_1.valInContext)(ctx, Aout.value)), renames); }],
        ], function () { return new utils_2.go(new C.Sigma(x, Aout.value, Dout.value)); });
    };
    Pair.prototype.prettyPrint = function () {
        return "(Pair ".concat(this.first.prettyPrint(), " ").concat(this.second.prettyPrint(), ")");
    };
    Pair.prototype.toString = function () {
        return this.prettyPrint();
    };
    return Pair;
}(Source));
exports.Pair = Pair;
var Cons = /** @class */ (function (_super) {
    __extends(Cons, _super);
    function Cons(location, first, second) {
        var _this = _super.call(this, location) || this;
        _this.location = location;
        _this.first = first;
        _this.second = second;
        return _this;
    }
    Cons.prototype.synthHelper = function (ctx, renames) {
        throw new Error('Method not implemented.');
    };
    Cons.prototype.findNames = function () {
        return this.first.findNames()
            .concat(this.second.findNames());
    };
    Cons.prototype.checkOut = function (ctx, renames, type) {
        var _this = this;
        var typeNow = type.now();
        if (typeNow instanceof V.Sigma) {
            var A_6 = typeNow.carType;
            var closure_2 = typeNow.cdrType;
            var aout_1 = new utils_2.PerhapsM("aout");
            var dout_1 = new utils_2.PerhapsM("dout");
            return (0, utils_2.goOn)([
                [aout_1, function () { return _this.first.check(ctx, renames, A_6); }],
                [
                    dout_1,
                    function () {
                        return _this.second.check(ctx, renames, closure_2.valOfClosure((0, context_1.valInContext)(ctx, aout_1.value)));
                    }
                ]
            ], function () { return new utils_2.go(new C.Cons(aout_1.value, dout_1.value)); });
        }
        else {
            return new utils_2.stop(this.location, new utils_2.Message(["cons requires a Pair or \u03A3 type, but was used as a: ".concat(typeNow.readBackType(ctx), ".")]));
        }
    };
    Cons.prototype.prettyPrint = function () {
        return "(cons ".concat(this.first.prettyPrint(), " ").concat(this.second.prettyPrint(), ")");
    };
    Cons.prototype.toString = function () {
        return this.prettyPrint();
    };
    return Cons;
}(Source));
exports.Cons = Cons;
var Car = /** @class */ (function (_super) {
    __extends(Car, _super);
    function Car(location, pair) {
        var _this = _super.call(this, location) || this;
        _this.location = location;
        _this.pair = pair;
        return _this;
    }
    Car.prototype.synthHelper = function (ctx, renames) {
        return synthesizer_1.synthesizer.synthCar(ctx, renames, this.location, this.pair);
    };
    Car.prototype.findNames = function () {
        return this.pair.findNames();
    };
    Car.prototype.prettyPrint = function () {
        return "(car ".concat(this.pair.prettyPrint(), ")");
    };
    Car.prototype.toString = function () {
        return this.prettyPrint();
    };
    return Car;
}(Source));
exports.Car = Car;
var Cdr = /** @class */ (function (_super) {
    __extends(Cdr, _super);
    function Cdr(location, pair) {
        var _this = _super.call(this, location) || this;
        _this.location = location;
        _this.pair = pair;
        return _this;
    }
    Cdr.prototype.synthHelper = function (ctx, renames) {
        return synthesizer_1.synthesizer.synthCdr(ctx, renames, this.location, this.pair);
    };
    Cdr.prototype.findNames = function () {
        return this.pair.findNames();
    };
    Cdr.prototype.prettyPrint = function () {
        return "(cdr ".concat(this.pair.prettyPrint(), ")");
    };
    Cdr.prototype.toString = function () {
        return this.prettyPrint();
    };
    return Cdr;
}(Source));
exports.Cdr = Cdr;
// Basic constructors
var Trivial = /** @class */ (function (_super) {
    __extends(Trivial, _super);
    function Trivial(location) {
        var _this = _super.call(this, location) || this;
        _this.location = location;
        return _this;
    }
    Trivial.prototype.synthHelper = function (ctx, renames) {
        return synthesizer_1.synthesizer.synthTrivial(ctx, renames);
    };
    Trivial.prototype.findNames = function () {
        return [];
    };
    Trivial.prototype.getType = function (ctx, renames) {
        return new utils_2.go(new C.Trivial());
    };
    Trivial.prototype.prettyPrint = function () {
        return 'Trivial';
    };
    Trivial.prototype.toString = function () {
        return this.prettyPrint();
    };
    return Trivial;
}(Source));
exports.Trivial = Trivial;
var Sole = /** @class */ (function (_super) {
    __extends(Sole, _super);
    function Sole(location) {
        var _this = _super.call(this, location) || this;
        _this.location = location;
        return _this;
    }
    Sole.prototype.synthHelper = function (ctx, renames) {
        return synthesizer_1.synthesizer.synthSole(ctx, renames);
    };
    Sole.prototype.findNames = function () {
        return [];
    };
    Sole.prototype.prettyPrint = function () {
        return 'Sole';
    };
    return Sole;
}(Source));
exports.Sole = Sole;
var Nil = /** @class */ (function (_super) {
    __extends(Nil, _super);
    function Nil(location) {
        var _this = _super.call(this, location) || this;
        _this.location = location;
        return _this;
    }
    Nil.prototype.synthHelper = function (ctx, renames) {
        throw new Error('Method not implemented.');
    };
    Nil.prototype.findNames = function () {
        return [];
    };
    Nil.prototype.checkOut = function (ctx, renames, type) {
        var typeNow = type.now();
        if (typeNow instanceof V.List) {
            return new utils_2.go(new C.Nil());
        }
        else {
            return new utils_2.stop(this.location, new utils_2.Message(["nil requires a List type, but was used as a: ".concat(typeNow.readBackType(ctx), ".")]));
        }
    };
    Nil.prototype.prettyPrint = function () {
        return 'nil';
    };
    Nil.prototype.toString = function () {
        return this.prettyPrint();
    };
    return Nil;
}(Source));
exports.Nil = Nil;
var Number = /** @class */ (function (_super) {
    __extends(Number, _super);
    function Number(location, value) {
        var _this = _super.call(this, location) || this;
        _this.location = location;
        _this.value = value;
        return _this;
    }
    Number.prototype.synthHelper = function (ctx, renames) {
        return synthesizer_1.synthesizer.synthNumber(ctx, renames, this.location, this.value);
    };
    Number.prototype.findNames = function () {
        return [];
    };
    Number.prototype.prettyPrint = function () {
        return "".concat(this.value);
    };
    Number.prototype.toString = function () {
        return this.prettyPrint();
    };
    return Number;
}(Source));
exports.Number = Number;
var List = /** @class */ (function (_super) {
    __extends(List, _super);
    function List(location, entryType) {
        var _this = _super.call(this, location) || this;
        _this.location = location;
        _this.entryType = entryType;
        return _this;
    }
    List.prototype.synthHelper = function (ctx, renames) {
        return synthesizer_1.synthesizer.synthList(ctx, renames, this);
    };
    List.prototype.findNames = function () {
        return this.entryType.findNames();
    };
    List.prototype.getType = function (ctx, renames) {
        var _this = this;
        var Eout = new utils_2.PerhapsM('Eout');
        return (0, utils_2.goOn)([[Eout, function () { return _this.entryType.isType(ctx, renames); }]], function () { return new utils_2.go(new C.List(Eout.value)); });
    };
    List.prototype.prettyPrint = function () {
        return "(List ".concat(this.entryType.prettyPrint(), ")");
    };
    List.prototype.toString = function () {
        return this.prettyPrint();
    };
    return List;
}(Source));
exports.List = List;
var ListCons = /** @class */ (function (_super) {
    __extends(ListCons, _super);
    function ListCons(location, x, xs) {
        var _this = _super.call(this, location) || this;
        _this.location = location;
        _this.x = x;
        _this.xs = xs;
        return _this;
    }
    ListCons.prototype.synthHelper = function (ctx, renames) {
        return synthesizer_1.synthesizer.synthListCons(ctx, renames, this.x, this.xs);
    };
    ListCons.prototype.findNames = function () {
        return this.x.findNames()
            .concat(this.xs.findNames());
    };
    ListCons.prototype.prettyPrint = function () {
        return "(:: ".concat(this.x.prettyPrint(), " ").concat(this.xs.prettyPrint(), ")");
    };
    ListCons.prototype.toString = function () {
        return this.prettyPrint();
    };
    return ListCons;
}(Source));
exports.ListCons = ListCons;
var RecList = /** @class */ (function (_super) {
    __extends(RecList, _super);
    function RecList(location, target, base, step) {
        var _this = _super.call(this, location) || this;
        _this.location = location;
        _this.target = target;
        _this.base = base;
        _this.step = step;
        return _this;
    }
    RecList.prototype.synthHelper = function (ctx, renames) {
        return synthesizer_1.synthesizer.synthRecList(ctx, renames, this.location, this.target, this.base, this.step);
    };
    RecList.prototype.findNames = function () {
        return this.target.findNames()
            .concat(this.base.findNames())
            .concat(this.step.findNames());
    };
    RecList.prototype.prettyPrint = function () {
        return "(rec-list ".concat(this.target.prettyPrint(), " \n              ").concat(this.base.prettyPrint(), " \n              ").concat(this.step.prettyPrint(), ")");
    };
    RecList.prototype.toString = function () {
        return this.prettyPrint();
    };
    return RecList;
}(Source));
exports.RecList = RecList;
var IndList = /** @class */ (function (_super) {
    __extends(IndList, _super);
    function IndList(location, target, motive, base, step) {
        var _this = _super.call(this, location) || this;
        _this.location = location;
        _this.target = target;
        _this.motive = motive;
        _this.base = base;
        _this.step = step;
        return _this;
    }
    IndList.prototype.synthHelper = function (ctx, renames) {
        return synthesizer_1.synthesizer.synthIndList(ctx, renames, this.location, this.target, this.motive, this.base, this.step);
    };
    IndList.prototype.findNames = function () {
        return this.target.findNames()
            .concat(this.motive.findNames())
            .concat(this.base.findNames())
            .concat(this.step.findNames());
    };
    IndList.prototype.prettyPrint = function () {
        return "(ind-list ".concat(this.target.prettyPrint(), " \n              ").concat(this.motive.prettyPrint(), " \n              ").concat(this.base.prettyPrint(), " \n              ").concat(this.step.prettyPrint(), ")");
    };
    IndList.prototype.toString = function () {
        return this.prettyPrint();
    };
    return IndList;
}(Source));
exports.IndList = IndList;
// Absurd and its operations
var Absurd = /** @class */ (function (_super) {
    __extends(Absurd, _super);
    function Absurd(location) {
        var _this = _super.call(this, location) || this;
        _this.location = location;
        return _this;
    }
    Absurd.prototype.synthHelper = function (ctx, renames) {
        return synthesizer_1.synthesizer.synthAbsurd(ctx, renames, this);
    };
    Absurd.prototype.findNames = function () {
        return [];
    };
    Absurd.prototype.getType = function (ctx, renames) {
        return new utils_2.go(new C.Absurd());
    };
    Absurd.prototype.prettyPrint = function () {
        return 'Absurd';
    };
    Absurd.prototype.toString = function () {
        return this.prettyPrint();
    };
    return Absurd;
}(Source));
exports.Absurd = Absurd;
var IndAbsurd = /** @class */ (function (_super) {
    __extends(IndAbsurd, _super);
    function IndAbsurd(location, target, motive) {
        var _this = _super.call(this, location) || this;
        _this.location = location;
        _this.target = target;
        _this.motive = motive;
        return _this;
    }
    IndAbsurd.prototype.synthHelper = function (ctx, renames) {
        return synthesizer_1.synthesizer.synthIndAbsurd(ctx, renames, this);
    };
    IndAbsurd.prototype.findNames = function () {
        return this.target.findNames()
            .concat(this.motive.findNames());
    };
    IndAbsurd.prototype.prettyPrint = function () {
        return "(ind-Absurd \n              ".concat(this.target.prettyPrint(), " \n              ").concat(this.motive.prettyPrint(), ")");
    };
    IndAbsurd.prototype.toString = function () {
        return this.prettyPrint();
    };
    return IndAbsurd;
}(Source));
exports.IndAbsurd = IndAbsurd;
// Equality types and operations
var Equal = /** @class */ (function (_super) {
    __extends(Equal, _super);
    function Equal(location, type, left, right) {
        var _this = _super.call(this, location) || this;
        _this.location = location;
        _this.type = type;
        _this.left = left;
        _this.right = right;
        return _this;
    }
    Equal.prototype.synthHelper = function (ctx, renames) {
        return synthesizer_1.synthesizer.synthEqual(ctx, renames, this.type, this.left, this.right);
    };
    Equal.prototype.findNames = function () {
        return this.type.findNames()
            .concat(this.left.findNames())
            .concat(this.right.findNames());
    };
    Equal.prototype.getType = function (ctx, renames) {
        var _a = [this.type, this.left, this.right], A = _a[0], from = _a[1], to = _a[2];
        var Aout = new utils_2.PerhapsM('Aout');
        var Av = new utils_2.PerhapsM('Av');
        var from_out = new utils_2.PerhapsM('from_out');
        var to_out = new utils_2.PerhapsM('to_out');
        return (0, utils_2.goOn)([
            [Aout, function () { return A.isType(ctx, renames); }],
            [Av, function () { return new utils_2.go((0, context_1.valInContext)(ctx, Aout.value)); }],
            [from_out, function () { return from.check(ctx, renames, Av.value); }],
            [to_out, function () { return to.check(ctx, renames, Av.value); }],
        ], function () { return new utils_2.go(new C.Equal(Aout.value, from_out.value, to_out.value)); });
    };
    Equal.prototype.prettyPrint = function () {
        return "(= ".concat(this.type.prettyPrint(), " \n              ").concat(this.left.prettyPrint(), " \n              ").concat(this.right.prettyPrint(), ")");
    };
    Equal.prototype.toString = function () {
        return this.prettyPrint();
    };
    return Equal;
}(Source));
exports.Equal = Equal;
var Same = /** @class */ (function (_super) {
    __extends(Same, _super);
    function Same(location, type) {
        var _this = _super.call(this, location) || this;
        _this.location = location;
        _this.type = type;
        return _this;
    }
    Same.prototype.findNames = function () {
        return this.type.findNames();
    };
    Same.prototype.synthHelper = function (ctx, renames) {
        throw new Error('Method not implemented.');
    };
    Same.prototype.checkOut = function (ctx, renames, type) {
        var _this = this;
        var typeNow = type.now();
        if (typeNow instanceof V.Equal) {
            var A_7 = typeNow.type;
            var from_1 = typeNow.from;
            var to_1 = typeNow.to;
            var cout_1 = new utils_2.PerhapsM("cout");
            var val_1 = new utils_2.PerhapsM("val");
            return (0, utils_2.goOn)([
                [cout_1, function () { return _this.type.check(ctx, renames, A_7); }],
                [val_1, function () { return new utils_2.go((0, context_1.valInContext)(ctx, cout_1.value)); }],
                [
                    new utils_2.PerhapsM("_"),
                    function () { return (0, utils_3.convert)(ctx, _this.type.location, A_7, from_1, val_1.value); }
                ],
                [
                    new utils_2.PerhapsM("_"),
                    function () { return (0, utils_3.convert)(ctx, _this.type.location, A_7, to_1, val_1.value); }
                ],
            ], function () { return new utils_2.go(new C.Same(cout_1.value)); });
        }
        else {
            return new utils_2.stop(this.location, new utils_2.Message(["same requires an Equal type, but encounter: ".concat(typeNow.readBackType(ctx), ".")]));
        }
    };
    Same.prototype.prettyPrint = function () {
        return "(same ".concat(this.type.prettyPrint(), ")");
    };
    Same.prototype.toString = function () {
        return this.prettyPrint();
    };
    return Same;
}(Source));
exports.Same = Same;
var Replace = /** @class */ (function (_super) {
    __extends(Replace, _super);
    function Replace(location, target, motive, base) {
        var _this = _super.call(this, location) || this;
        _this.location = location;
        _this.target = target;
        _this.motive = motive;
        _this.base = base;
        return _this;
    }
    Replace.prototype.synthHelper = function (ctx, renames) {
        return synthesizer_1.synthesizer.synthReplace(ctx, renames, this.location, this.target, this.motive, this.base);
    };
    Replace.prototype.findNames = function () {
        return this.target.findNames()
            .concat(this.motive.findNames())
            .concat(this.base.findNames());
    };
    Replace.prototype.prettyPrint = function () {
        return "(replace ".concat(this.target.prettyPrint(), " \n              ").concat(this.motive.prettyPrint(), " \n              ").concat(this.base.prettyPrint(), ")");
    };
    Replace.prototype.toString = function () {
        return this.prettyPrint();
    };
    return Replace;
}(Source));
exports.Replace = Replace;
var Trans = /** @class */ (function (_super) {
    __extends(Trans, _super);
    function Trans(location, left, right) {
        var _this = _super.call(this, location) || this;
        _this.location = location;
        _this.left = left;
        _this.right = right;
        return _this;
    }
    Trans.prototype.synthHelper = function (ctx, renames) {
        return synthesizer_1.synthesizer.synthTrans(ctx, renames, this.location, this.left, this.right);
    };
    Trans.prototype.findNames = function () {
        return this.left.findNames()
            .concat(this.right.findNames());
    };
    Trans.prototype.prettyPrint = function () {
        return "(trans ".concat(this.left.prettyPrint(), " ").concat(this.right.prettyPrint(), ")");
    };
    Trans.prototype.toString = function () {
        return this.prettyPrint();
    };
    return Trans;
}(Source));
exports.Trans = Trans;
var Cong = /** @class */ (function (_super) {
    __extends(Cong, _super);
    function Cong(location, target, fun) {
        var _this = _super.call(this, location) || this;
        _this.location = location;
        _this.target = target;
        _this.fun = fun;
        return _this;
    }
    Cong.prototype.synthHelper = function (ctx, renames) {
        return synthesizer_1.synthesizer.synthCong(ctx, renames, this.location, this.target, this.fun);
    };
    Cong.prototype.findNames = function () {
        return this.target.findNames()
            .concat(this.fun.findNames());
    };
    Cong.prototype.prettyPrint = function () {
        return "(cong ".concat(this.target.prettyPrint(), " ").concat(this.fun.prettyPrint(), ")");
    };
    Cong.prototype.toString = function () {
        return this.prettyPrint();
    };
    return Cong;
}(Source));
exports.Cong = Cong;
var Symm = /** @class */ (function (_super) {
    __extends(Symm, _super);
    function Symm(location, equality) {
        var _this = _super.call(this, location) || this;
        _this.location = location;
        _this.equality = equality;
        return _this;
    }
    Symm.prototype.synthHelper = function (ctx, renames) {
        return synthesizer_1.synthesizer.synthSymm(ctx, renames, this.location, this.equality);
    };
    Symm.prototype.findNames = function () {
        return this.equality.findNames();
    };
    Symm.prototype.prettyPrint = function () {
        return "(symm ".concat(this.equality.prettyPrint(), ")");
    };
    Symm.prototype.toString = function () {
        return this.prettyPrint();
    };
    return Symm;
}(Source));
exports.Symm = Symm;
var IndEqual = /** @class */ (function (_super) {
    __extends(IndEqual, _super);
    function IndEqual(location, target, motive, base) {
        var _this = _super.call(this, location) || this;
        _this.location = location;
        _this.target = target;
        _this.motive = motive;
        _this.base = base;
        return _this;
    }
    IndEqual.prototype.synthHelper = function (ctx, renames) {
        return synthesizer_1.synthesizer.synthIndEqual(ctx, renames, this.location, this.target, this.motive, this.base);
    };
    IndEqual.prototype.findNames = function () {
        return this.target.findNames()
            .concat(this.motive.findNames())
            .concat(this.base.findNames());
    };
    IndEqual.prototype.prettyPrint = function () {
        return "(ind-= ".concat(this.target.prettyPrint(), " \n              ").concat(this.motive.prettyPrint(), " \n              ").concat(this.base.prettyPrint(), ")");
    };
    IndEqual.prototype.toString = function () {
        return this.prettyPrint();
    };
    return IndEqual;
}(Source));
exports.IndEqual = IndEqual;
// Vector types and operations
var Vec = /** @class */ (function (_super) {
    __extends(Vec, _super);
    function Vec(location, type, length) {
        var _this = _super.call(this, location) || this;
        _this.location = location;
        _this.type = type;
        _this.length = length;
        return _this;
    }
    Vec.prototype.synthHelper = function (ctx, renames) {
        return synthesizer_1.synthesizer.synthVec(ctx, renames, this.type, this.length);
    };
    Vec.prototype.findNames = function () {
        return this.type.findNames()
            .concat(this.length.findNames());
    };
    Vec.prototype.getType = function (ctx, renames) {
        var _this = this;
        var Eout = new utils_2.PerhapsM("Eout");
        var lenout = new utils_2.PerhapsM('lenout');
        return (0, utils_2.goOn)([[Eout, function () { return _this.type.isType(ctx, renames); }],
            [lenout, function () { return _this.length.check(ctx, renames, new V.Nat()); }]], function () { return new utils_2.go(new C.Vec(Eout.value, lenout.value)); });
    };
    Vec.prototype.prettyPrint = function () {
        return "(Vec ".concat(this.type.prettyPrint(), " ").concat(this.length.prettyPrint(), ")");
    };
    Vec.prototype.toString = function () {
        return this.prettyPrint();
    };
    return Vec;
}(Source));
exports.Vec = Vec;
var VecNil = /** @class */ (function (_super) {
    __extends(VecNil, _super);
    function VecNil(location) {
        var _this = _super.call(this, location) || this;
        _this.location = location;
        return _this;
    }
    VecNil.prototype.synthHelper = function (ctx, renames) {
        throw new Error('Method not implemented.');
    };
    VecNil.prototype.findNames = function () {
        return [];
    };
    VecNil.prototype.checkOut = function (ctx, renames, type) {
        var typeNow = type.now();
        if (typeNow instanceof V.Vec) {
            var lenNow = typeNow.length.now();
            if (lenNow instanceof V.Zero) {
                return new utils_2.go(new C.VecNil());
            }
            else {
                return new utils_2.stop(this.location, new utils_2.Message(["vecnil requires a Vec type with length ZERO, but was used as a: \n          ".concat((0, utils_4.readBack)(ctx, new V.Nat(), typeNow.length), ".")]));
            }
        }
        else {
            return new utils_2.stop(this.location, new utils_2.Message(["vecnil requires a Vec type, but was used as a: ".concat(typeNow.readBackType(ctx), ".")]));
        }
    };
    VecNil.prototype.prettyPrint = function () {
        return 'vecnil';
    };
    VecNil.prototype.toString = function () {
        return this.prettyPrint();
    };
    return VecNil;
}(Source));
exports.VecNil = VecNil;
var VecCons = /** @class */ (function (_super) {
    __extends(VecCons, _super);
    function VecCons(location, x, xs) {
        var _this = _super.call(this, location) || this;
        _this.location = location;
        _this.x = x;
        _this.xs = xs;
        return _this;
    }
    VecCons.prototype.synthHelper = function (ctx, renames) {
        throw new Error('Method not implemented.');
    };
    VecCons.prototype.findNames = function () {
        return this.x.findNames()
            .concat(this.xs.findNames());
    };
    VecCons.prototype.checkOut = function (ctx, renames, type) {
        var _this = this;
        var typeNow = type.now();
        if (typeNow instanceof V.Vec) {
            var lenNow = typeNow.length.now();
            if (lenNow instanceof V.Add1) {
                var hout_1 = new utils_2.PerhapsM("hout");
                var tout_2 = new utils_2.PerhapsM("tout");
                var n_minus_1_1 = lenNow.smaller;
                return (0, utils_2.goOn)([
                    [hout_1, function () { return _this.x.check(ctx, renames, typeNow.entryType); }],
                    [tout_2, function () {
                            return _this.xs.check(ctx, renames, new V.Vec(typeNow.entryType, n_minus_1_1));
                        }
                    ]
                ], function () { return new utils_2.go(new C.VecCons(hout_1.value, tout_2.value)); });
            }
            else {
                return new utils_2.stop(this.location, new utils_2.Message(["vec:: requires a Vec type with length Add1, but was used with a: \n          ".concat((0, utils_4.readBack)(ctx, new V.Nat(), typeNow.length), ".")]));
            }
        }
        else {
            return new utils_2.stop(this.location, new utils_2.Message(["vec:: requires a Vec type, but was used as a: ".concat(typeNow.readBackType(ctx), ".")]));
        }
    };
    VecCons.prototype.prettyPrint = function () {
        return "(vec:: ".concat(this.x.prettyPrint(), " ").concat(this.xs.prettyPrint(), ")");
    };
    VecCons.prototype.toString = function () {
        return this.prettyPrint();
    };
    return VecCons;
}(Source));
exports.VecCons = VecCons;
var Head = /** @class */ (function (_super) {
    __extends(Head, _super);
    function Head(location, vec) {
        var _this = _super.call(this, location) || this;
        _this.location = location;
        _this.vec = vec;
        return _this;
    }
    Head.prototype.synthHelper = function (ctx, renames) {
        return synthesizer_1.synthesizer.synthHead(ctx, renames, this.location, this.vec);
    };
    Head.prototype.findNames = function () {
        return this.vec.findNames();
    };
    Head.prototype.prettyPrint = function () {
        return "(head ".concat(this.vec.prettyPrint(), ")");
    };
    Head.prototype.toString = function () {
        return this.prettyPrint();
    };
    return Head;
}(Source));
exports.Head = Head;
var Tail = /** @class */ (function (_super) {
    __extends(Tail, _super);
    function Tail(location, vec) {
        var _this = _super.call(this, location) || this;
        _this.location = location;
        _this.vec = vec;
        return _this;
    }
    Tail.prototype.synthHelper = function (ctx, renames) {
        return synthesizer_1.synthesizer.synthTail(ctx, renames, this.location, this.vec);
    };
    Tail.prototype.findNames = function () {
        return this.vec.findNames();
    };
    Tail.prototype.prettyPrint = function () {
        return "(tail ".concat(this.vec.prettyPrint(), ")");
    };
    Tail.prototype.toString = function () {
        return this.prettyPrint();
    };
    return Tail;
}(Source));
exports.Tail = Tail;
var IndVec = /** @class */ (function (_super) {
    __extends(IndVec, _super);
    function IndVec(location, length, target, motive, base, step) {
        var _this = _super.call(this, location) || this;
        _this.location = location;
        _this.length = length;
        _this.target = target;
        _this.motive = motive;
        _this.base = base;
        _this.step = step;
        return _this;
    }
    IndVec.prototype.synthHelper = function (ctx, renames) {
        return synthesizer_1.synthesizer.synthIndVec(ctx, renames, this.location, this.length, this.target, this.motive, this.base, this.step);
    };
    IndVec.prototype.findNames = function () {
        return this.length.findNames()
            .concat(this.target.findNames())
            .concat(this.motive.findNames())
            .concat(this.base.findNames())
            .concat(this.step.findNames());
    };
    IndVec.prototype.prettyPrint = function () {
        return "ind-Vec ".concat(this.length.prettyPrint(), "\n              ").concat(this.target.prettyPrint(), "\n              ").concat(this.motive.prettyPrint(), "\n              ").concat(this.base.prettyPrint(), "\n              ").concat(this.step.prettyPrint());
    };
    IndVec.prototype.toString = function () {
        return this.prettyPrint();
    };
    return IndVec;
}(Source));
exports.IndVec = IndVec;
// Either type and operations
var Either = /** @class */ (function (_super) {
    __extends(Either, _super);
    function Either(location, left, right) {
        var _this = _super.call(this, location) || this;
        _this.location = location;
        _this.left = left;
        _this.right = right;
        return _this;
    }
    Either.prototype.synthHelper = function (ctx, renames) {
        return synthesizer_1.synthesizer.synthEither(ctx, renames, this.left, this.right);
    };
    Either.prototype.findNames = function () {
        return this.left.findNames()
            .concat(this.right.findNames());
    };
    Either.prototype.getType = function (ctx, renames) {
        var _this = this;
        var Lout = new utils_2.PerhapsM("Lout");
        var Rout = new utils_2.PerhapsM("Rout");
        return (0, utils_2.goOn)([
            [Lout, function () { return _this.left.isType(ctx, renames); }],
            [Rout, function () { return _this.right.isType(ctx, renames); }]
        ], function () { return new utils_2.go(new C.Either(Lout.value, Rout.value)); });
    };
    Either.prototype.prettyPrint = function () {
        return "(Either ".concat(this.left.prettyPrint(), " ").concat(this.right.prettyPrint(), ")");
    };
    Either.prototype.toString = function () {
        return this.prettyPrint();
    };
    return Either;
}(Source));
exports.Either = Either;
var Left = /** @class */ (function (_super) {
    __extends(Left, _super);
    function Left(location, value) {
        var _this = _super.call(this, location) || this;
        _this.location = location;
        _this.value = value;
        return _this;
    }
    Left.prototype.synthHelper = function (ctx, renames) {
        throw new Error('Method not implemented.');
    };
    Left.prototype.findNames = function () {
        return this.value.findNames();
    };
    Left.prototype.checkOut = function (ctx, renames, type) {
        var _this = this;
        var typeNow = type.now();
        if (typeNow instanceof V.Either) {
            var lout_1 = new utils_2.PerhapsM("lout");
            return (0, utils_2.goOn)([
                [lout_1, function () { return _this.value.check(ctx, renames, typeNow.leftType); }]
            ], function () { return new utils_2.go(new C.Left(lout_1.value)); });
        }
        else {
            return new utils_2.stop(this.location, new utils_2.Message(["left requires an Either type, but was used as a: ".concat(typeNow.readBackType(ctx), ".")]));
        }
    };
    Left.prototype.prettyPrint = function () {
        return "(left ".concat(this.value.prettyPrint(), ")");
    };
    Left.prototype.toString = function () {
        return this.prettyPrint();
    };
    return Left;
}(Source));
exports.Left = Left;
var Right = /** @class */ (function (_super) {
    __extends(Right, _super);
    function Right(location, value) {
        var _this = _super.call(this, location) || this;
        _this.location = location;
        _this.value = value;
        return _this;
    }
    Right.prototype.synthHelper = function (ctx, renames) {
        throw new Error('Method not implemented.');
    };
    Right.prototype.findNames = function () {
        return this.value.findNames();
    };
    Right.prototype.checkOut = function (ctx, renames, type) {
        var _this = this;
        var typeNow = type.now();
        if (typeNow instanceof V.Either) {
            var rout_1 = new utils_2.PerhapsM("rout");
            return (0, utils_2.goOn)([
                [rout_1, function () { return _this.value.check(ctx, renames, typeNow.rightType); }]
            ], function () { return new utils_2.go(new C.Right(rout_1.value)); });
        }
        else {
            return new utils_2.stop(this.location, new utils_2.Message(["right requires an Either type, but was used as a: ".concat(typeNow.readBackType(ctx), ".")]));
        }
    };
    Right.prototype.prettyPrint = function () {
        return "(right ".concat(this.value.prettyPrint(), ")");
    };
    Right.prototype.toString = function () {
        return this.prettyPrint();
    };
    return Right;
}(Source));
exports.Right = Right;
var IndEither = /** @class */ (function (_super) {
    __extends(IndEither, _super);
    function IndEither(location, target, motive, baseLeft, baseRight) {
        var _this = _super.call(this, location) || this;
        _this.location = location;
        _this.target = target;
        _this.motive = motive;
        _this.baseLeft = baseLeft;
        _this.baseRight = baseRight;
        return _this;
    }
    IndEither.prototype.synthHelper = function (ctx, renames) {
        return synthesizer_1.synthesizer.synthIndEither(ctx, renames, this.location, this.target, this.motive, this.baseLeft, this.baseRight);
    };
    IndEither.prototype.findNames = function () {
        return this.target.findNames()
            .concat(this.motive.findNames())
            .concat(this.baseLeft.findNames())
            .concat(this.baseRight.findNames());
    };
    IndEither.prototype.prettyPrint = function () {
        return "(ind-Either ".concat(this.target.prettyPrint(), " \n              ").concat(this.motive.prettyPrint(), " \n              ").concat(this.baseLeft.prettyPrint(), " \n              ").concat(this.baseRight.prettyPrint(), ")");
    };
    IndEither.prototype.toString = function () {
        return this.prettyPrint();
    };
    return IndEither;
}(Source));
exports.IndEither = IndEither;
// Utility
var TODO = /** @class */ (function (_super) {
    __extends(TODO, _super);
    function TODO(location) {
        var _this = _super.call(this, location) || this;
        _this.location = location;
        return _this;
    }
    TODO.prototype.synthHelper = function (ctx, renames) {
        throw new Error('Method not implemented.');
    };
    TODO.prototype.findNames = function () {
        return [];
    };
    TODO.prototype.checkOut = function (ctx, renames, type) {
        var typeVal = type.readBackType(ctx);
        (0, utils_1.SendPieInfo)(this.location, ['TODO', (0, context_1.readBackContext)(ctx), typeVal]);
        return new utils_2.go(new C.TODO(this.location.locationToSrcLoc(), typeVal));
    };
    TODO.prototype.prettyPrint = function () {
        return "TODO";
    };
    TODO.prototype.toString = function () {
        return this.prettyPrint();
    };
    return TODO;
}(Source));
exports.TODO = TODO;
// Application
var Application = /** @class */ (function (_super) {
    __extends(Application, _super);
    function Application(location, func, arg, args) {
        var _this = _super.call(this, location) || this;
        _this.location = location;
        _this.func = func;
        _this.arg = arg;
        _this.args = args;
        return _this;
    }
    Application.prototype.synthHelper = function (ctx, renames) {
        return synthesizer_1.synthesizer.synthApplication(ctx, renames, this.location, this.func, this.arg, this.args);
    };
    Application.prototype.findNames = function () {
        return this.func.findNames()
            .concat(this.arg.findNames())
            .concat(this.args.flatMap(function (arg) { return arg.findNames(); }));
    };
    Application.prototype.prettyPrint = function () {
        return "(".concat(this.func.prettyPrint(), " ").concat(this.arg.prettyPrint(), " ").concat(this.args.map(function (arg) { return arg.prettyPrint(); }).join(' '), ")");
    };
    Application.prototype.toString = function () {
        return this.prettyPrint();
    };
    return Application;
}(Source));
exports.Application = Application;
