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
exports.Application = exports.TODO = exports.IndEither = exports.Right = exports.Left = exports.Either = exports.IndVec = exports.Tail = exports.Head = exports.VecCons = exports.VecNil = exports.Vec = exports.IndEqual = exports.Symm = exports.Cong = exports.Trans = exports.Replace = exports.Same = exports.Equal = exports.IndAbsurd = exports.Absurd = exports.IndList = exports.RecList = exports.ListCons = exports.List = exports.Number = exports.Nil = exports.Sole = exports.Trivial = exports.Cdr = exports.Car = exports.Cons = exports.Pair = exports.Quote = exports.Atom = exports.Name = exports.Sigma = exports.Lambda = exports.Pi = exports.Arrow = exports.IndNat = exports.RecNat = exports.IterNat = exports.WhichNat = exports.Add1 = exports.Zero = exports.Nat = exports.Universe = exports.The = exports.Source = void 0;
exports.GenericEliminator = exports.Constructor = exports.DefineDatatype = void 0;
const C = __importStar(require("./core"));
const V = __importStar(require("./value"));
const N = __importStar(require("./neutral"));
const S = __importStar(require("./source"));
const utils_1 = require("../typechecker/utils");
const locations_1 = require("../utils/locations");
const context_1 = require("../utils/context");
const utils_2 = require("./utils");
const utils_3 = require("../typechecker/utils");
const utils_4 = require("../evaluator/utils");
const synthesizer_1 = require("../typechecker/synthesizer");
const utils_5 = require("./utils");
const context_2 = require("../utils/context");
class Source {
    constructor(location) {
        this.location = location;
    }
    isType(ctx, renames) {
        const ok = new utils_2.PerhapsM("ok");
        const theType = this.getType(ctx, renames);
        return (0, utils_2.goOn)([[ok, () => theType]], () => {
            (0, utils_1.SendPieInfo)(this.location, ['is-type', ok.value]);
            return new utils_2.go(ok.value);
        });
    }
    getType(ctx, renames) {
        const checkType = this.check(ctx, renames, new V.Universe());
        if (checkType instanceof utils_2.go) {
            return checkType;
        }
        else if (checkType instanceof utils_2.stop) {
            if (this instanceof Name && (0, utils_2.isVarName)(this.name)) {
                const otherTv = new utils_2.PerhapsM("other-tv");
                return new utils_2.goOn([
                    [otherTv,
                        () => (0, context_2.varType)(ctx, this.location, this.name)]
                ], () => {
                    new utils_2.stop(this.location, new utils_2.Message([`Expected U, but given ${otherTv.value.readBackType(ctx)}`]));
                });
            }
            else {
                return new utils_2.stop(this.location, new utils_2.Message([`not a type`]));
            }
        }
        else {
            throw new Error('Invalid checkType');
        }
    }
    check(ctx, renames, type) {
        const ok = new utils_2.PerhapsM("ok");
        const out = this.checkOut(ctx, renames, type);
        // SendPieInfo(srcLoc(input), ['has-type', readBackType(Γ, tv)!]);
        return (0, utils_2.goOn)([[ok, () => out]], () => new utils_2.go(ok.value));
    }
    synth(ctx, renames) {
        const ok = new utils_2.PerhapsM("ok");
        return (0, utils_2.goOn)([[ok, () => this.synthHelper(ctx, renames)]], () => {
            (0, utils_1.SendPieInfo)(this.location, ['is-type', ok.value.type]);
            return new utils_2.go(ok.value);
        });
    }
    checkOut(ctx, renames, type) {
        const theT = new utils_2.PerhapsM("theT");
        return (0, utils_2.goOn)([
            [theT, () => this.synth(ctx, renames)],
            [
                new utils_2.PerhapsM("_"),
                () => (0, utils_3.sameType)(ctx, this.location, (0, context_1.valInContext)(ctx, theT.value.type), type)
            ],
        ], () => new utils_2.go(theT.value.expr));
    }
}
exports.Source = Source;
class The extends Source {
    constructor(location, type, value) {
        super(location);
        this.location = location;
        this.type = type;
        this.value = value;
    }
    synthHelper(ctx, renames) {
        return synthesizer_1.synthesizer.synthThe(ctx, renames, this.type, this.value);
    }
    findNames() {
        return this.type.findNames()
            .concat(this.value.findNames());
    }
    prettyPrint() {
        return `(the ${this.type.prettyPrint()} ${this.value.prettyPrint()})`;
    }
    toString() {
        return this.prettyPrint();
    }
}
exports.The = The;
class Universe extends Source {
    constructor(location) {
        super(location);
        this.location = location;
    }
    synthHelper(ctx, renames) {
        return synthesizer_1.synthesizer.synthUniverse(ctx, renames, this.location);
    }
    findNames() {
        return [];
    }
    getType(ctx, renames) {
        return new utils_2.go(new C.Universe());
    }
    prettyPrint() {
        return 'U';
    }
    toString() {
        return this.prettyPrint();
    }
}
exports.Universe = Universe;
class Nat extends Source {
    constructor(location) {
        super(location);
        this.location = location;
    }
    synthHelper(ctx, renames) {
        return synthesizer_1.synthesizer.synthNat(ctx, renames);
    }
    findNames() {
        return [];
    }
    getType(ctx, renames) {
        return new utils_2.go(new C.Nat());
    }
    prettyPrint() {
        return 'Nat';
    }
    toString() {
        return this.prettyPrint();
    }
}
exports.Nat = Nat;
class Zero extends Source {
    constructor(location) {
        super(location);
        this.location = location;
    }
    synthHelper(ctx, renames) {
        return synthesizer_1.synthesizer.synthZero(ctx, renames);
    }
    findNames() {
        return [];
    }
    prettyPrint() {
        return 'zero';
    }
    toString() {
        return this.prettyPrint();
    }
}
exports.Zero = Zero;
class Add1 extends Source {
    constructor(location, base) {
        super(location);
        this.location = location;
        this.base = base;
    }
    synthHelper(ctx, renames) {
        return synthesizer_1.synthesizer.synthAdd1(ctx, renames, this.base);
    }
    findNames() {
        return this.base.findNames();
    }
    prettyPrint() {
        return `(add1 ${this.base.prettyPrint()})`;
    }
    toString() {
        return this.prettyPrint();
    }
}
exports.Add1 = Add1;
class WhichNat extends Source {
    constructor(location, target, base, step) {
        super(location);
        this.location = location;
        this.target = target;
        this.base = base;
        this.step = step;
    }
    synthHelper(ctx, renames) {
        return synthesizer_1.synthesizer.synthWhichNat(ctx, renames, this.target, this.base, this.step);
    }
    findNames() {
        return this.target.findNames()
            .concat(this.base.findNames())
            .concat(this.step.findNames());
    }
    prettyPrint() {
        return `(which-nat ${this.target.prettyPrint()} 
              ${this.base.prettyPrint()} 
              ${this.step.prettyPrint()})`;
    }
    toString() {
        return this.prettyPrint();
    }
}
exports.WhichNat = WhichNat;
class IterNat extends Source {
    constructor(location, target, base, step) {
        super(location);
        this.location = location;
        this.target = target;
        this.base = base;
        this.step = step;
    }
    synthHelper(ctx, renames) {
        return synthesizer_1.synthesizer.synthIterNat(ctx, renames, this.target, this.base, this.step);
    }
    findNames() {
        return this.target.findNames()
            .concat(this.base.findNames())
            .concat(this.step.findNames());
    }
    prettyPrint() {
        return `(iter-nat ${this.target.prettyPrint()} 
              ${this.base.prettyPrint()} 
              ${this.step.prettyPrint()})`;
    }
    toString() {
        return this.prettyPrint();
    }
}
exports.IterNat = IterNat;
class RecNat extends Source {
    constructor(location, target, base, step) {
        super(location);
        this.location = location;
        this.target = target;
        this.base = base;
        this.step = step;
    }
    synthHelper(ctx, renames) {
        return synthesizer_1.synthesizer.synthRecNat(ctx, renames, this.target, this.base, this.step);
    }
    findNames() {
        return this.target.findNames()
            .concat(this.base.findNames())
            .concat(this.step.findNames());
    }
    prettyPrint() {
        return `(rec-nat ${this.target.prettyPrint()} 
              ${this.base.prettyPrint()} 
              ${this.step.prettyPrint()})`;
    }
    toString() {
        return this.prettyPrint();
    }
}
exports.RecNat = RecNat;
class IndNat extends Source {
    constructor(location, target, motive, base, step) {
        super(location);
        this.location = location;
        this.target = target;
        this.motive = motive;
        this.base = base;
        this.step = step;
    }
    synthHelper(ctx, renames) {
        return synthesizer_1.synthesizer.synthIndNat(ctx, renames, this.target, this.motive, this.base, this.step);
    }
    findNames() {
        return this.target.findNames()
            .concat(this.motive.findNames())
            .concat(this.base.findNames())
            .concat(this.step.findNames());
    }
    prettyPrint() {
        return `(ind-nat ${this.target.prettyPrint()} 
              ${this.motive.prettyPrint()} 
              ${this.base.prettyPrint()} 
              ${this.step.prettyPrint()})`;
    }
    toString() {
        return this.prettyPrint();
    }
}
exports.IndNat = IndNat;
// Function types and operations
class Arrow extends Source {
    constructor(location, arg1, arg2, args) {
        super(location);
        this.location = location;
        this.arg1 = arg1;
        this.arg2 = arg2;
        this.args = args;
    }
    synthHelper(ctx, renames) {
        return synthesizer_1.synthesizer.synthArrow(ctx, renames, this.location, this.arg1, this.arg2, this.args);
    }
    findNames() {
        return this.arg1.findNames()
            .concat(this.arg2.findNames())
            .concat(this.args.flatMap(arg => arg.findNames()));
    }
    getType(ctx, renames) {
        const [A, B, args] = [this.arg1, this.arg2, this.args];
        if (args.length === 0) {
            const x = (0, utils_2.freshBinder)(ctx, B, 'x');
            const Aout = new utils_2.PerhapsM("Aout");
            const Bout = new utils_2.PerhapsM('Bout');
            return (0, utils_2.goOn)([
                [Aout, () => A.isType(ctx, renames)],
                [Bout,
                    () => B.isType((0, context_1.bindFree)(ctx, x, (0, context_1.valInContext)(ctx, Aout.value)), renames)
                ]
            ], () => {
                return new utils_2.go(new C.Pi(x, Aout.value, Bout.value));
            });
        }
        else {
            const [rest0, ...rest] = args;
            const x = (0, utils_2.freshBinder)(ctx, (0, utils_1.makeApp)(B, rest0, rest), 'x');
            const Aout = new utils_2.PerhapsM("Aout");
            const tout = new utils_2.PerhapsM('tout');
            return (0, utils_2.goOn)([
                [Aout, () => A.isType(ctx, renames)],
                [tout,
                    () => new Arrow((0, locations_1.notForInfo)(this.location), B, rest0, rest).isType((0, context_1.bindFree)(ctx, x, (0, context_1.valInContext)(ctx, Aout.value)), renames)
                ]
            ], () => new utils_2.go(new C.Pi(x, Aout.value, tout.value)));
        }
    }
    prettyPrint() {
        return `(-> ${this.arg1.prettyPrint()} ${this.arg2.prettyPrint()} ${this.args.map(arg => arg.prettyPrint()).join(' ')})`;
    }
    toString() {
        return this.prettyPrint();
    }
}
exports.Arrow = Arrow;
class Pi extends Source {
    constructor(location, binders, body) {
        super(location);
        this.location = location;
        this.binders = binders;
        this.body = body;
    }
    synthHelper(ctx, renames) {
        return synthesizer_1.synthesizer.synthPi(ctx, renames, this.location, this.binders, this.body);
    }
    findNames() {
        // TEST THIS
        return this.binders.flatMap(binder => (0, utils_2.occurringBinderNames)(binder))
            .concat(this.body.findNames());
    }
    getType(ctx, renames) {
        const [binders, B] = [this.binders, this.body];
        if (binders.length === 1) {
            const [bd, A] = [binders[0].binder, binders[0].type];
            const y = (0, utils_5.fresh)(ctx, bd.varName);
            const xloc = bd.location;
            const Aout = new utils_2.PerhapsM('Aout');
            const Aoutv = new utils_2.PerhapsM('Aoutv');
            const Bout = new utils_2.PerhapsM('Bout');
            return (0, utils_2.goOn)([
                [Aout, () => A.isType(ctx, renames)],
                [Aoutv, () => new utils_2.go((0, context_1.valInContext)(ctx, Aout.value))
                ],
                [Bout, () => B.isType((0, context_1.bindFree)(ctx, y, Aoutv.value), (0, utils_1.extendRenaming)(renames, bd.varName, y))
                ],
            ], () => {
                (0, utils_1.PieInfoHook)(xloc, ['binding-site', Aout.value]);
                return new utils_2.go(new C.Pi(y, Aout.value, Bout.value));
            });
        }
        else if (binders.length > 1) {
            const [bd, ...rest] = binders;
            const [x, A] = [bd.binder.varName, bd.type];
            const z = (0, utils_5.fresh)(ctx, x);
            const xloc = bd.binder.location;
            const Aout = new utils_2.PerhapsM('Aout');
            const Aoutv = new utils_2.PerhapsM('Aoutv');
            const Bout = new utils_2.PerhapsM('Bout');
            return (0, utils_2.goOn)([
                [Aout, () => A.isType(ctx, renames)],
                [Aoutv, () => new utils_2.go((0, context_1.valInContext)(ctx, Aout.value))
                ],
                [Bout, () => new Pi((0, locations_1.notForInfo)(this.location), rest, B).isType((0, context_1.bindFree)(ctx, z, Aoutv.value), (0, utils_1.extendRenaming)(renames, bd.binder.varName, z))
                ]
            ], () => {
                (0, utils_1.PieInfoHook)(xloc, ['binding-site', Aout.value]);
                return new utils_2.go(new C.Pi(z, Aout.value, Bout.value));
            });
        }
        else {
            throw new Error('Invalid number of binders in Pi type');
        }
    }
    prettyPrint() {
        return `(Π ${this.binders.map(binder => `(${binder.binder.varName} ${binder.type.prettyPrint()})`).join(' ')} 
            ${this.body.prettyPrint()})`;
    }
    toString() {
        return this.prettyPrint();
    }
}
exports.Pi = Pi;
class Lambda extends Source {
    constructor(location, binders, body) {
        super(location);
        this.location = location;
        this.binders = binders;
        this.body = body;
    }
    synthHelper(ctx, renames) {
        throw new Error('Method not implemented.');
    }
    findNames() {
        return this.binders.map(binder => binder.varName)
            .concat(this.body.findNames());
    }
    checkOut(ctx, renames, type) {
        if (this.binders.length === 1) {
            const body = this.body;
            const binder = this.binders[0];
            const x = binder.varName;
            const xLoc = binder.location;
            const typeNow = type.now();
            if (typeNow instanceof V.Pi) {
                const A = typeNow.argType;
                const closure = typeNow.resultType;
                const xRenamed = (0, utils_1.rename)(renames, x);
                const bout = new utils_2.PerhapsM("bout");
                return (0, utils_2.goOn)([
                    [
                        bout,
                        () => body.check((0, context_1.bindFree)(ctx, xRenamed, A), (0, utils_1.extendRenaming)(renames, x, xRenamed), closure.valOfClosure(new V.Neutral(A, new N.Variable(xRenamed))))
                    ]
                ], () => {
                    (0, utils_1.PieInfoHook)(xLoc, ['binding-site', A.readBackType(ctx)]);
                    return new utils_2.go(new C.Lambda(xRenamed, bout.value));
                });
            }
            else {
                return new utils_2.stop(xLoc, new utils_2.Message([`Not a function type: ${typeNow.readBackType(ctx)}.`]));
            }
        }
        else { // xBinding.length > 1
            return (new S.Lambda(this.location, [this.binders[0]], (new S.Lambda((0, locations_1.notForInfo)(this.location), this.binders.slice(1), this.body)))).check(ctx, renames, type);
        }
    }
    prettyPrint() {
        return `(lambda ${this.binders.map(binder => binder.varName).join(' ')} ${this.body.prettyPrint()})`;
    }
    toString() {
        return this.prettyPrint();
    }
}
exports.Lambda = Lambda;
// Product types and operations
class Sigma extends Source {
    constructor(location, binders, body) {
        super(location);
        this.location = location;
        this.binders = binders;
        this.body = body;
    }
    synthHelper(ctx, renames) {
        return synthesizer_1.synthesizer.synthSigma(ctx, renames, this.location, this.binders, this.body);
    }
    findNames() {
        return this.binders.flatMap(binder => (0, utils_2.occurringBinderNames)(binder))
            .concat(this.body.findNames());
    }
    getType(ctx, renames) {
        const [binders, D] = [this.binders, this.body];
        if (binders.length === 1) {
            const [bd, A] = [binders[0].binder, binders[0].type];
            const x = bd.varName;
            const y = (0, utils_5.fresh)(ctx, x);
            const xloc = bd.location;
            const Aout = new utils_2.PerhapsM('Aout');
            const Aoutv = new utils_2.PerhapsM('Aoutv');
            const Dout = new utils_2.PerhapsM('Dout');
            return (0, utils_2.goOn)([
                [Aout, () => A.isType(ctx, renames)],
                [Aoutv, () => new utils_2.go((0, context_1.valInContext)(ctx, Aout.value))],
                [Dout, () => D.isType((0, context_1.bindFree)(ctx, y, Aoutv.value), (0, utils_1.extendRenaming)(renames, x, y))
                ]
            ], () => {
                (0, utils_1.PieInfoHook)(xloc, ['binding-site', Aout.value]);
                return new utils_2.go(new C.Sigma(y, Aout.value, Dout.value));
            });
        }
        else if (binders.length > 1) {
            const [[bd, A], ...rest] = [[binders[0].binder, binders[0].type], binders[1], ...binders.slice(2)];
            const x = bd.varName;
            const z = (0, utils_5.fresh)(ctx, x);
            const xloc = bd.location;
            const Aout = new utils_2.PerhapsM('Aout');
            const Aoutv = new utils_2.PerhapsM('Aoutv');
            const Dout = new utils_2.PerhapsM('Dout');
            return (0, utils_2.goOn)([
                [Aout, () => A.isType(ctx, renames)],
                [Aoutv, () => new utils_2.go((0, context_1.valInContext)(ctx, Aout.value))],
                [Dout, () => new Sigma(this.location, rest, D)
                        .isType((0, context_1.bindFree)(ctx, x, Aoutv.value), (0, utils_1.extendRenaming)(renames, x, z))
                ]
            ], () => {
                (0, utils_1.PieInfoHook)(xloc, ['binding-site', Aout.value]);
                return new utils_2.go(new C.Sigma(z, Aout.value, Dout.value));
            });
        }
        else {
            throw new Error('Invalid number of binders in Sigma type');
        }
    }
    prettyPrint() {
        return `(Σ ${this.binders.map(binder => `(${binder.binder.varName} ${binder.type.prettyPrint()})`).join(' ')} 
            ${this.body.prettyPrint()})`;
    }
    toString() {
        return this.prettyPrint();
    }
}
exports.Sigma = Sigma;
class Name extends Source {
    constructor(location, name) {
        super(location);
        this.location = location;
        this.name = name;
    }
    synthHelper(ctx, renames) {
        return synthesizer_1.synthesizer.synthName(ctx, renames, this.location, this.name);
    }
    findNames() {
        return [this.name];
    }
    prettyPrint() {
        return this.name;
    }
    toString() {
        return this.prettyPrint();
    }
}
exports.Name = Name;
class Atom extends Source {
    constructor(location) {
        super(location);
        this.location = location;
    }
    synthHelper(ctx, renames) {
        return synthesizer_1.synthesizer.synthAtom(ctx, renames);
    }
    findNames() {
        return [];
    }
    getType(ctx, renames) {
        return new utils_2.go(new C.Atom());
    }
    prettyPrint() {
        return 'Atom';
    }
    toString() {
        return this.prettyPrint();
    }
}
exports.Atom = Atom;
class Quote extends Source {
    constructor(location, name) {
        super(location);
        this.location = location;
        this.name = name;
    }
    synthHelper(ctx, renames) {
        return synthesizer_1.synthesizer.synthQuote(ctx, renames, this.location, this.name);
    }
    findNames() {
        return [];
    }
    prettyPrint() {
        return `'${this.name}`;
    }
    toString() {
        return this.prettyPrint();
    }
}
exports.Quote = Quote;
class Pair extends Source {
    constructor(location, first, second) {
        super(location);
        this.location = location;
        this.first = first;
        this.second = second;
    }
    synthHelper(ctx, renames) {
        return synthesizer_1.synthesizer.synthPair(ctx, renames, this.first, this.second);
    }
    findNames() {
        return this.first.findNames()
            .concat(this.second.findNames());
    }
    getType(ctx, renames) {
        const Aout = new utils_2.PerhapsM('Aout');
        const Dout = new utils_2.PerhapsM('Dout');
        const x = (0, utils_2.freshBinder)(ctx, this.second, 'x');
        return (0, utils_2.goOn)([
            [Aout, () => this.first.isType(ctx, renames)],
            [Dout, () => this.second.isType((0, context_1.bindFree)(ctx, x, (0, context_1.valInContext)(ctx, Aout.value)), renames)],
        ], () => new utils_2.go(new C.Sigma(x, Aout.value, Dout.value)));
    }
    prettyPrint() {
        return `(Pair ${this.first.prettyPrint()} ${this.second.prettyPrint()})`;
    }
    toString() {
        return this.prettyPrint();
    }
}
exports.Pair = Pair;
class Cons extends Source {
    constructor(location, first, second) {
        super(location);
        this.location = location;
        this.first = first;
        this.second = second;
    }
    synthHelper(ctx, renames) {
        throw new Error('Method not implemented.');
    }
    findNames() {
        return this.first.findNames()
            .concat(this.second.findNames());
    }
    checkOut(ctx, renames, type) {
        const typeNow = type.now();
        if (typeNow instanceof V.Sigma) {
            const A = typeNow.carType;
            const closure = typeNow.cdrType;
            const aout = new utils_2.PerhapsM("aout");
            const dout = new utils_2.PerhapsM("dout");
            return (0, utils_2.goOn)([
                [aout, () => this.first.check(ctx, renames, A)],
                [
                    dout,
                    () => this.second.check(ctx, renames, closure.valOfClosure((0, context_1.valInContext)(ctx, aout.value)))
                ]
            ], () => new utils_2.go(new C.Cons(aout.value, dout.value)));
        }
        else {
            return new utils_2.stop(this.location, new utils_2.Message([`cons requires a Pair or Σ type, but was used as a: ${typeNow.readBackType(ctx)}.`]));
        }
    }
    prettyPrint() {
        return `(cons ${this.first.prettyPrint()} ${this.second.prettyPrint()})`;
    }
    toString() {
        return this.prettyPrint();
    }
}
exports.Cons = Cons;
class Car extends Source {
    constructor(location, pair) {
        super(location);
        this.location = location;
        this.pair = pair;
    }
    synthHelper(ctx, renames) {
        return synthesizer_1.synthesizer.synthCar(ctx, renames, this.location, this.pair);
    }
    findNames() {
        return this.pair.findNames();
    }
    prettyPrint() {
        return `(car ${this.pair.prettyPrint()})`;
    }
    toString() {
        return this.prettyPrint();
    }
}
exports.Car = Car;
class Cdr extends Source {
    constructor(location, pair) {
        super(location);
        this.location = location;
        this.pair = pair;
    }
    synthHelper(ctx, renames) {
        return synthesizer_1.synthesizer.synthCdr(ctx, renames, this.location, this.pair);
    }
    findNames() {
        return this.pair.findNames();
    }
    prettyPrint() {
        return `(cdr ${this.pair.prettyPrint()})`;
    }
    toString() {
        return this.prettyPrint();
    }
}
exports.Cdr = Cdr;
// Basic constructors
class Trivial extends Source {
    constructor(location) {
        super(location);
        this.location = location;
    }
    synthHelper(ctx, renames) {
        return synthesizer_1.synthesizer.synthTrivial(ctx, renames);
    }
    findNames() {
        return [];
    }
    getType(ctx, renames) {
        return new utils_2.go(new C.Trivial());
    }
    prettyPrint() {
        return 'Trivial';
    }
    toString() {
        return this.prettyPrint();
    }
}
exports.Trivial = Trivial;
class Sole extends Source {
    constructor(location) {
        super(location);
        this.location = location;
    }
    synthHelper(ctx, renames) {
        return synthesizer_1.synthesizer.synthSole(ctx, renames);
    }
    findNames() {
        return [];
    }
    prettyPrint() {
        return 'Sole';
    }
}
exports.Sole = Sole;
class Nil extends Source {
    constructor(location) {
        super(location);
        this.location = location;
    }
    synthHelper(ctx, renames) {
        throw new Error('Method not implemented.');
    }
    findNames() {
        return [];
    }
    checkOut(ctx, renames, type) {
        const typeNow = type.now();
        if (typeNow instanceof V.List) {
            return new utils_2.go(new C.Nil());
        }
        else {
            return new utils_2.stop(this.location, new utils_2.Message([`nil requires a List type, but was used as a: ${typeNow.readBackType(ctx)}.`]));
        }
    }
    prettyPrint() {
        return 'nil';
    }
    toString() {
        return this.prettyPrint();
    }
}
exports.Nil = Nil;
class Number extends Source {
    constructor(location, value) {
        super(location);
        this.location = location;
        this.value = value;
    }
    synthHelper(ctx, renames) {
        return synthesizer_1.synthesizer.synthNumber(ctx, renames, this.location, this.value);
    }
    findNames() {
        return [];
    }
    prettyPrint() {
        return `${this.value}`;
    }
    toString() {
        return this.prettyPrint();
    }
}
exports.Number = Number;
class List extends Source {
    constructor(location, entryType) {
        super(location);
        this.location = location;
        this.entryType = entryType;
    }
    synthHelper(ctx, renames) {
        return synthesizer_1.synthesizer.synthList(ctx, renames, this);
    }
    findNames() {
        return this.entryType.findNames();
    }
    getType(ctx, renames) {
        const Eout = new utils_2.PerhapsM('Eout');
        return (0, utils_2.goOn)([[Eout, () => this.entryType.isType(ctx, renames)]], () => new utils_2.go(new C.List(Eout.value)));
    }
    prettyPrint() {
        return `(List ${this.entryType.prettyPrint()})`;
    }
    toString() {
        return this.prettyPrint();
    }
}
exports.List = List;
class ListCons extends Source {
    constructor(location, x, xs) {
        super(location);
        this.location = location;
        this.x = x;
        this.xs = xs;
    }
    synthHelper(ctx, renames) {
        return synthesizer_1.synthesizer.synthListCons(ctx, renames, this.x, this.xs);
    }
    findNames() {
        return this.x.findNames()
            .concat(this.xs.findNames());
    }
    prettyPrint() {
        return `(:: ${this.x.prettyPrint()} ${this.xs.prettyPrint()})`;
    }
    toString() {
        return this.prettyPrint();
    }
}
exports.ListCons = ListCons;
class RecList extends Source {
    constructor(location, target, base, step) {
        super(location);
        this.location = location;
        this.target = target;
        this.base = base;
        this.step = step;
    }
    synthHelper(ctx, renames) {
        return synthesizer_1.synthesizer.synthRecList(ctx, renames, this.location, this.target, this.base, this.step);
    }
    findNames() {
        return this.target.findNames()
            .concat(this.base.findNames())
            .concat(this.step.findNames());
    }
    prettyPrint() {
        return `(rec-list ${this.target.prettyPrint()} 
              ${this.base.prettyPrint()} 
              ${this.step.prettyPrint()})`;
    }
    toString() {
        return this.prettyPrint();
    }
}
exports.RecList = RecList;
class IndList extends Source {
    constructor(location, target, motive, base, step) {
        super(location);
        this.location = location;
        this.target = target;
        this.motive = motive;
        this.base = base;
        this.step = step;
    }
    synthHelper(ctx, renames) {
        return synthesizer_1.synthesizer.synthIndList(ctx, renames, this.location, this.target, this.motive, this.base, this.step);
    }
    findNames() {
        return this.target.findNames()
            .concat(this.motive.findNames())
            .concat(this.base.findNames())
            .concat(this.step.findNames());
    }
    prettyPrint() {
        return `(ind-list ${this.target.prettyPrint()} 
              ${this.motive.prettyPrint()} 
              ${this.base.prettyPrint()} 
              ${this.step.prettyPrint()})`;
    }
    toString() {
        return this.prettyPrint();
    }
}
exports.IndList = IndList;
// Absurd and its operations
class Absurd extends Source {
    constructor(location) {
        super(location);
        this.location = location;
    }
    synthHelper(ctx, renames) {
        return synthesizer_1.synthesizer.synthAbsurd(ctx, renames, this);
    }
    findNames() {
        return [];
    }
    getType(ctx, renames) {
        return new utils_2.go(new C.Absurd());
    }
    prettyPrint() {
        return 'Absurd';
    }
    toString() {
        return this.prettyPrint();
    }
}
exports.Absurd = Absurd;
class IndAbsurd extends Source {
    constructor(location, target, motive) {
        super(location);
        this.location = location;
        this.target = target;
        this.motive = motive;
    }
    synthHelper(ctx, renames) {
        return synthesizer_1.synthesizer.synthIndAbsurd(ctx, renames, this);
    }
    findNames() {
        return this.target.findNames()
            .concat(this.motive.findNames());
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
// Equality types and operations
class Equal extends Source {
    constructor(location, type, left, right) {
        super(location);
        this.location = location;
        this.type = type;
        this.left = left;
        this.right = right;
    }
    synthHelper(ctx, renames) {
        return synthesizer_1.synthesizer.synthEqual(ctx, renames, this.type, this.left, this.right);
    }
    findNames() {
        return this.type.findNames()
            .concat(this.left.findNames())
            .concat(this.right.findNames());
    }
    getType(ctx, renames) {
        const [A, from, to] = [this.type, this.left, this.right];
        const Aout = new utils_2.PerhapsM('Aout');
        const Av = new utils_2.PerhapsM('Av');
        const from_out = new utils_2.PerhapsM('from_out');
        const to_out = new utils_2.PerhapsM('to_out');
        return (0, utils_2.goOn)([
            [Aout, () => A.isType(ctx, renames)],
            [Av, () => new utils_2.go((0, context_1.valInContext)(ctx, Aout.value))],
            [from_out, () => from.check(ctx, renames, Av.value)],
            [to_out, () => to.check(ctx, renames, Av.value)],
        ], () => new utils_2.go(new C.Equal(Aout.value, from_out.value, to_out.value)));
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
class Same extends Source {
    constructor(location, type) {
        super(location);
        this.location = location;
        this.type = type;
    }
    findNames() {
        return this.type.findNames();
    }
    synthHelper(ctx, renames) {
        throw new Error('Method not implemented.');
    }
    checkOut(ctx, renames, type) {
        const typeNow = type.now();
        if (typeNow instanceof V.Equal) {
            const A = typeNow.type;
            const from = typeNow.from;
            const to = typeNow.to;
            const cout = new utils_2.PerhapsM("cout");
            const val = new utils_2.PerhapsM("val");
            return (0, utils_2.goOn)([
                [cout, () => this.type.check(ctx, renames, A)],
                [val, () => new utils_2.go((0, context_1.valInContext)(ctx, cout.value))],
                [
                    new utils_2.PerhapsM("_"),
                    () => (0, utils_3.convert)(ctx, this.type.location, A, from, val.value)
                ],
                [
                    new utils_2.PerhapsM("_"),
                    () => (0, utils_3.convert)(ctx, this.type.location, A, to, val.value)
                ],
            ], () => new utils_2.go(new C.Same(cout.value)));
        }
        else {
            return new utils_2.stop(this.location, new utils_2.Message([`same requires an Equal type, but encounter: ${typeNow.readBackType(ctx)}.`]));
        }
    }
    prettyPrint() {
        return `(same ${this.type.prettyPrint()})`;
    }
    toString() {
        return this.prettyPrint();
    }
}
exports.Same = Same;
class Replace extends Source {
    constructor(location, target, motive, base) {
        super(location);
        this.location = location;
        this.target = target;
        this.motive = motive;
        this.base = base;
    }
    synthHelper(ctx, renames) {
        return synthesizer_1.synthesizer.synthReplace(ctx, renames, this.location, this.target, this.motive, this.base);
    }
    findNames() {
        return this.target.findNames()
            .concat(this.motive.findNames())
            .concat(this.base.findNames());
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
class Trans extends Source {
    synthHelper(ctx, renames) {
        return synthesizer_1.synthesizer.synthTrans(ctx, renames, this.location, this.left, this.right);
    }
    constructor(location, left, right) {
        super(location);
        this.location = location;
        this.left = left;
        this.right = right;
    }
    findNames() {
        return this.left.findNames()
            .concat(this.right.findNames());
    }
    prettyPrint() {
        return `(trans ${this.left.prettyPrint()} ${this.right.prettyPrint()})`;
    }
    toString() {
        return this.prettyPrint();
    }
}
exports.Trans = Trans;
class Cong extends Source {
    constructor(location, target, fun) {
        super(location);
        this.location = location;
        this.target = target;
        this.fun = fun;
    }
    synthHelper(ctx, renames) {
        return synthesizer_1.synthesizer.synthCong(ctx, renames, this.location, this.target, this.fun);
    }
    findNames() {
        return this.target.findNames()
            .concat(this.fun.findNames());
    }
    prettyPrint() {
        return `(cong ${this.target.prettyPrint()} ${this.fun.prettyPrint()})`;
    }
    toString() {
        return this.prettyPrint();
    }
}
exports.Cong = Cong;
class Symm extends Source {
    constructor(location, equality) {
        super(location);
        this.location = location;
        this.equality = equality;
    }
    synthHelper(ctx, renames) {
        return synthesizer_1.synthesizer.synthSymm(ctx, renames, this.location, this.equality);
    }
    findNames() {
        return this.equality.findNames();
    }
    prettyPrint() {
        return `(symm ${this.equality.prettyPrint()})`;
    }
    toString() {
        return this.prettyPrint();
    }
}
exports.Symm = Symm;
class IndEqual extends Source {
    constructor(location, target, motive, base) {
        super(location);
        this.location = location;
        this.target = target;
        this.motive = motive;
        this.base = base;
    }
    synthHelper(ctx, renames) {
        return synthesizer_1.synthesizer.synthIndEqual(ctx, renames, this.location, this.target, this.motive, this.base);
    }
    findNames() {
        return this.target.findNames()
            .concat(this.motive.findNames())
            .concat(this.base.findNames());
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
// Vector types and operations
class Vec extends Source {
    constructor(location, type, length) {
        super(location);
        this.location = location;
        this.type = type;
        this.length = length;
    }
    synthHelper(ctx, renames) {
        return synthesizer_1.synthesizer.synthVec(ctx, renames, this.type, this.length);
    }
    findNames() {
        return this.type.findNames()
            .concat(this.length.findNames());
    }
    getType(ctx, renames) {
        const Eout = new utils_2.PerhapsM("Eout");
        const lenout = new utils_2.PerhapsM('lenout');
        return (0, utils_2.goOn)([[Eout, () => this.type.isType(ctx, renames)],
            [lenout, () => this.length.check(ctx, renames, new V.Nat())]], () => new utils_2.go(new C.Vec(Eout.value, lenout.value)));
    }
    prettyPrint() {
        return `(Vec ${this.type.prettyPrint()} ${this.length.prettyPrint()})`;
    }
    toString() {
        return this.prettyPrint();
    }
}
exports.Vec = Vec;
class VecNil extends Source {
    constructor(location) {
        super(location);
        this.location = location;
    }
    synthHelper(ctx, renames) {
        throw new Error('Method not implemented.');
    }
    findNames() {
        return [];
    }
    checkOut(ctx, renames, type) {
        const typeNow = type.now();
        if (typeNow instanceof V.Vec) {
            const lenNow = typeNow.length.now();
            if (lenNow instanceof V.Zero) {
                return new utils_2.go(new C.VecNil());
            }
            else {
                return new utils_2.stop(this.location, new utils_2.Message([`vecnil requires a Vec type with length ZERO, but was used as a: 
          ${(0, utils_4.readBack)(ctx, new V.Nat(), typeNow.length)}.`]));
            }
        }
        else {
            return new utils_2.stop(this.location, new utils_2.Message([`vecnil requires a Vec type, but was used as a: ${typeNow.readBackType(ctx)}.`]));
        }
    }
    prettyPrint() {
        return 'vecnil';
    }
    toString() {
        return this.prettyPrint();
    }
}
exports.VecNil = VecNil;
class VecCons extends Source {
    constructor(location, x, xs) {
        super(location);
        this.location = location;
        this.x = x;
        this.xs = xs;
    }
    synthHelper(ctx, renames) {
        throw new Error('Method not implemented.');
    }
    findNames() {
        return this.x.findNames()
            .concat(this.xs.findNames());
    }
    checkOut(ctx, renames, type) {
        const typeNow = type.now();
        if (typeNow instanceof V.Vec) {
            const lenNow = typeNow.length.now();
            if (lenNow instanceof V.Add1) {
                const hout = new utils_2.PerhapsM("hout");
                const tout = new utils_2.PerhapsM("tout");
                const n_minus_1 = lenNow.smaller;
                return (0, utils_2.goOn)([
                    [hout, () => this.x.check(ctx, renames, typeNow.entryType)],
                    [tout, () => this.xs.check(ctx, renames, new V.Vec(typeNow.entryType, n_minus_1))
                    ]
                ], () => new utils_2.go(new C.VecCons(hout.value, tout.value)));
            }
            else {
                return new utils_2.stop(this.location, new utils_2.Message([`vec:: requires a Vec type with length Add1, but was used with a: 
          ${(0, utils_4.readBack)(ctx, new V.Nat(), typeNow.length)}.`]));
            }
        }
        else {
            return new utils_2.stop(this.location, new utils_2.Message([`vec:: requires a Vec type, but was used as a: ${typeNow.readBackType(ctx)}.`]));
        }
    }
    prettyPrint() {
        return `(vec:: ${this.x.prettyPrint()} ${this.xs.prettyPrint()})`;
    }
    toString() {
        return this.prettyPrint();
    }
}
exports.VecCons = VecCons;
class Head extends Source {
    constructor(location, vec) {
        super(location);
        this.location = location;
        this.vec = vec;
    }
    synthHelper(ctx, renames) {
        return synthesizer_1.synthesizer.synthHead(ctx, renames, this.location, this.vec);
    }
    findNames() {
        return this.vec.findNames();
    }
    prettyPrint() {
        return `(head ${this.vec.prettyPrint()})`;
    }
    toString() {
        return this.prettyPrint();
    }
}
exports.Head = Head;
class Tail extends Source {
    constructor(location, vec) {
        super(location);
        this.location = location;
        this.vec = vec;
    }
    synthHelper(ctx, renames) {
        return synthesizer_1.synthesizer.synthTail(ctx, renames, this.location, this.vec);
    }
    findNames() {
        return this.vec.findNames();
    }
    prettyPrint() {
        return `(tail ${this.vec.prettyPrint()})`;
    }
    toString() {
        return this.prettyPrint();
    }
}
exports.Tail = Tail;
class IndVec extends Source {
    constructor(location, length, target, motive, base, step) {
        super(location);
        this.location = location;
        this.length = length;
        this.target = target;
        this.motive = motive;
        this.base = base;
        this.step = step;
    }
    synthHelper(ctx, renames) {
        return synthesizer_1.synthesizer.synthIndVec(ctx, renames, this.location, this.length, this.target, this.motive, this.base, this.step);
    }
    findNames() {
        return this.length.findNames()
            .concat(this.target.findNames())
            .concat(this.motive.findNames())
            .concat(this.base.findNames())
            .concat(this.step.findNames());
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
// Either type and operations
class Either extends Source {
    constructor(location, left, right) {
        super(location);
        this.location = location;
        this.left = left;
        this.right = right;
    }
    synthHelper(ctx, renames) {
        return synthesizer_1.synthesizer.synthEither(ctx, renames, this.left, this.right);
    }
    findNames() {
        return this.left.findNames()
            .concat(this.right.findNames());
    }
    getType(ctx, renames) {
        const Lout = new utils_2.PerhapsM("Lout");
        const Rout = new utils_2.PerhapsM("Rout");
        return (0, utils_2.goOn)([
            [Lout, () => this.left.isType(ctx, renames)],
            [Rout, () => this.right.isType(ctx, renames)]
        ], () => new utils_2.go(new C.Either(Lout.value, Rout.value)));
    }
    prettyPrint() {
        return `(Either ${this.left.prettyPrint()} ${this.right.prettyPrint()})`;
    }
    toString() {
        return this.prettyPrint();
    }
}
exports.Either = Either;
class Left extends Source {
    constructor(location, value) {
        super(location);
        this.location = location;
        this.value = value;
    }
    synthHelper(ctx, renames) {
        throw new Error('Method not implemented.');
    }
    findNames() {
        return this.value.findNames();
    }
    checkOut(ctx, renames, type) {
        const typeNow = type.now();
        if (typeNow instanceof V.Either) {
            const lout = new utils_2.PerhapsM("lout");
            return (0, utils_2.goOn)([
                [lout, () => this.value.check(ctx, renames, typeNow.leftType)]
            ], () => new utils_2.go(new C.Left(lout.value)));
        }
        else {
            return new utils_2.stop(this.location, new utils_2.Message([`left requires an Either type, but was used as a: ${typeNow.readBackType(ctx)}.`]));
        }
    }
    prettyPrint() {
        return `(left ${this.value.prettyPrint()})`;
    }
    toString() {
        return this.prettyPrint();
    }
}
exports.Left = Left;
class Right extends Source {
    constructor(location, value) {
        super(location);
        this.location = location;
        this.value = value;
    }
    synthHelper(ctx, renames) {
        throw new Error('Method not implemented.');
    }
    findNames() {
        return this.value.findNames();
    }
    checkOut(ctx, renames, type) {
        const typeNow = type.now();
        if (typeNow instanceof V.Either) {
            const rout = new utils_2.PerhapsM("rout");
            return (0, utils_2.goOn)([
                [rout, () => this.value.check(ctx, renames, typeNow.rightType)]
            ], () => new utils_2.go(new C.Right(rout.value)));
        }
        else {
            return new utils_2.stop(this.location, new utils_2.Message([`right requires an Either type, but was used as a: ${typeNow.readBackType(ctx)}.`]));
        }
    }
    prettyPrint() {
        return `(right ${this.value.prettyPrint()})`;
    }
    toString() {
        return this.prettyPrint();
    }
}
exports.Right = Right;
class IndEither extends Source {
    constructor(location, target, motive, baseLeft, baseRight) {
        super(location);
        this.location = location;
        this.target = target;
        this.motive = motive;
        this.baseLeft = baseLeft;
        this.baseRight = baseRight;
    }
    synthHelper(ctx, renames) {
        return synthesizer_1.synthesizer.synthIndEither(ctx, renames, this.location, this.target, this.motive, this.baseLeft, this.baseRight);
    }
    findNames() {
        return this.target.findNames()
            .concat(this.motive.findNames())
            .concat(this.baseLeft.findNames())
            .concat(this.baseRight.findNames());
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
// Utility
class TODO extends Source {
    constructor(location) {
        super(location);
        this.location = location;
    }
    synthHelper(ctx, renames) {
        throw new Error('Method not implemented.');
    }
    findNames() {
        return [];
    }
    checkOut(ctx, renames, type) {
        const typeVal = type.readBackType(ctx);
        (0, utils_1.SendPieInfo)(this.location, ['TODO', (0, context_1.readBackContext)(ctx), typeVal]);
        return new utils_2.go(new C.TODO(this.location.locationToSrcLoc(), typeVal));
    }
    prettyPrint() {
        return `TODO`;
    }
    toString() {
        return this.prettyPrint();
    }
}
exports.TODO = TODO;
// Application
class Application extends Source {
    constructor(location, func, arg, args) {
        super(location);
        this.location = location;
        this.func = func;
        this.arg = arg;
        this.args = args;
    }
    synthHelper(ctx, renames) {
        return synthesizer_1.synthesizer.synthApplication(ctx, renames, this.location, this.func, this.arg, this.args);
    }
    findNames() {
        return this.func.findNames()
            .concat(this.arg.findNames())
            .concat(this.args.flatMap(arg => arg.findNames()));
    }
    prettyPrint() {
        return `(${this.func.prettyPrint()} ${this.arg.prettyPrint()} ${this.args.map(arg => arg.prettyPrint()).join(' ')})`;
    }
    toString() {
        return this.prettyPrint();
    }
}
exports.Application = Application;
class DefineDatatype extends Source {
    constructor(location, typeName, parameters, // Type parameters [A : Type]
    indices, // Index parameters [i : Nat] 
    resultType, // The result universe (Type)
    constructors // Data constructors
    ) {
        super(location);
        this.location = location;
        this.typeName = typeName;
        this.parameters = parameters;
        this.indices = indices;
        this.resultType = resultType;
        this.constructors = constructors;
    }
    synthHelper(ctx, renames) {
        return synthesizer_1.synthesizer.synthDefineDatatype(ctx, renames, this);
    }
    findNames() {
        const names = [this.typeName];
        names.push(...this.parameters.flatMap(p => p.findNames()));
        names.push(...this.indices.flatMap(i => i.findNames()));
        names.push(...this.resultType.findNames());
        names.push(...this.constructors.flatMap(c => c.findNames()));
        return names;
    }
    prettyPrint() {
        const params = this.parameters.map(p => `[${p.prettyPrint()}]`).join(' ');
        const indices = this.indices.map(i => `[${i.prettyPrint()}]`).join(' ');
        const ctors = this.constructors.map(c => c.prettyPrint()).join('\n  ');
        return `(define-datatype ${this.typeName} ${params} : ${indices} ${this.resultType.prettyPrint()}
  ${ctors})`;
    }
}
exports.DefineDatatype = DefineDatatype;
class Constructor extends Source {
    synthHelper(ctx, renames) {
        throw new Error('Method not implemented.');
    }
    constructor(location, name, args, // Constructor args
    resultType // Type the constructor produces
    ) {
        super(location);
        this.location = location;
        this.name = name;
        this.args = args;
        this.resultType = resultType;
    }
    findNames() {
        const names = [this.name];
        names.push(...this.args.flatMap(a => a.findNames()));
        names.push(...this.resultType.findNames());
        return names;
    }
    prettyPrint() {
        const args = this.args.map(a => `[${a.prettyPrint()}]`).join(' ');
        return `[${this.name} ${args} : ${this.resultType.prettyPrint()}]`;
    }
}
exports.Constructor = Constructor;
// Generic eliminator for user-defined inductive types
class GenericEliminator extends Source {
    constructor(location, typeName, target, motive, methods) {
        super(location);
        this.location = location;
        this.typeName = typeName;
        this.target = target;
        this.motive = motive;
        this.methods = methods;
    }
    synthHelper(ctx, renames) {
        throw new Error('Method not implemented.');
    }
    findNames() {
        const names = [this.typeName];
        names.push(...this.target.findNames());
        names.push(...this.motive.findNames());
        names.push(...this.methods.flatMap(m => m.findNames()));
        return names;
    }
    prettyPrint() {
        const methods = this.methods.map(m => m.prettyPrint()).join(' ');
        return `(elim-${this.typeName} ${this.target.prettyPrint()} ${this.motive.prettyPrint()} ${methods})`;
    }
}
exports.GenericEliminator = GenericEliminator;
//# sourceMappingURL=source.js.map