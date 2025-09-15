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
exports.synthesizer = void 0;
const C = __importStar(require("../types/core"));
const S = __importStar(require("../types/source"));
const V = __importStar(require("../types/value"));
const utils_1 = require("../types/utils");
const context_1 = require("../utils/context");
const utils_2 = require("./utils");
const locations_1 = require("../utils/locations");
const evaluator_1 = require("../evaluator/evaluator");
const utils_3 = require("../evaluator/utils");
class synthesizer {
    static synthNat(ctx, r) {
        return new utils_1.go(new C.The(new C.Universe(), new C.Nat()));
    }
    static synthUniverse(ctx, r, location) {
        return new utils_1.stop(location, new utils_1.Message(["U is a type, but it does not have a type."]));
    }
    static synthArrow(context, r, location, arg1, arg2, args) {
        if (args.length === 0) {
            const z = (0, utils_1.freshBinder)(context, arg2, 'x');
            const Aout = new utils_1.PerhapsM("Aout");
            const Bout = new utils_1.PerhapsM('Bout');
            return (0, utils_1.goOn)([
                [Aout, () => arg1.check(context, r, new V.Universe())],
                [Bout, () => arg2.check((0, context_1.bindFree)(context, z, (0, context_1.valInContext)(context, Aout.value)), r, new V.Universe())
                ],
            ], (() => {
                return new utils_1.go(new C.The(new C.Universe(), new C.Pi(z, Aout.value, Bout.value)));
            }));
        }
        else {
            const [first, ...rest] = args;
            const z = (0, utils_1.freshBinder)(context, (0, utils_2.makeApp)(arg2, first, rest), 'x');
            const Aout = new utils_1.PerhapsM("Aout");
            const tout = new utils_1.PerhapsM('tout');
            return (0, utils_1.goOn)([
                [Aout, () => arg1.check(context, r, new V.Universe())],
                [tout, () => new S.Arrow((0, locations_1.notForInfo)(location), arg2, first, rest)
                        .check((0, context_1.bindFree)(context, z, (0, context_1.valInContext)(context, Aout.value)), r, new V.Universe())
                ]
            ], () => {
                return new utils_1.go(new C.The(new C.Universe(), new C.Pi(z, Aout.value, tout.value)));
            });
        }
    }
    static synthPi(context, r, location, binders, body) {
        if (binders.length === 1) {
            const [binder, type] = [binders[0].binder, binders[0].type];
            const xhat = (0, utils_1.fresh)(context, binder.varName);
            const xloc = binder.location;
            const Aout = new utils_1.PerhapsM('Aout');
            const Bout = new utils_1.PerhapsM('Bout');
            return (0, utils_1.goOn)([
                [Aout, () => type.check(context, r, new V.Universe())],
                [Bout, () => body.check((0, context_1.bindFree)(context, xhat, (0, context_1.valInContext)(context, Aout.value)), (0, utils_2.extendRenaming)(r, binder.varName, xhat), new V.Universe())],
            ], () => {
                (0, utils_2.PieInfoHook)(xloc, ['binding-site', Aout.value]);
                return new utils_1.go(new C.The(new C.Universe(), new C.Pi(xhat, Aout.value, Bout.value)));
            });
        }
        else if (binders.length > 1) {
            const [fst, ...rest] = binders;
            const [binder, type] = [fst.binder, fst.type];
            const xloc = binder.location;
            const x = binder.varName;
            const xhat = (0, utils_1.fresh)(context, x);
            const Aout = new utils_1.PerhapsM('Aout');
            const Bout = new utils_1.PerhapsM('Bout');
            return (0, utils_1.goOn)([
                [Aout, () => type.check(context, r, new V.Universe())],
                [Bout, () => new S.Pi((0, locations_1.notForInfo)(location), rest, body)
                        .check((0, context_1.bindFree)(context, xhat, (0, context_1.valInContext)(context, Aout.value)), (0, utils_2.extendRenaming)(r, x, xhat), new V.Universe())
                ],
            ], () => {
                (0, utils_2.PieInfoHook)(xloc, ['binding-site', Aout.value]);
                return new utils_1.go(new C.The(new C.Universe(), new C.Pi(xhat, Aout.value, Bout.value)));
            });
        }
        else {
            throw new Error('Invalid number of binders in Pi type');
        }
    }
    static synthZero(context, r) {
        return new utils_1.go(new C.The(new C.Nat(), new C.Zero()));
    }
    static synthAdd1(context, r, base) {
        const nout = new utils_1.PerhapsM('nout');
        return (0, utils_1.goOn)([[nout, () => base.check(context, r, new V.Nat())]], () => new utils_1.go(new C.The(new C.Nat(), new C.Add1(nout.value))));
    }
    static synthWhichNat(context, r, target, base, step) {
        const tgtout = new utils_1.PerhapsM('tgtout');
        const bout = new utils_1.PerhapsM('bout');
        const sout = new utils_1.PerhapsM('sout');
        let n_minus_1 = (0, utils_1.fresh)(context, 'n_minus_1');
        return (0, utils_1.goOn)([
            [tgtout, () => target.check(context, r, new V.Nat())],
            [bout, () => base.synth(context, r)],
            [sout, () => step.check(context, r, new V.Pi(n_minus_1, new V.Nat(), new utils_1.FirstOrderClosure((0, context_1.contextToEnvironment)(context), n_minus_1, bout.value.type)))
            ],
        ], () => new utils_1.go(new C.The(bout.value.type, new C.WhichNat(tgtout.value, new C.The(bout.value.type, bout.value.expr), sout.value))));
    }
    static synthIterNat(context, r, target, base, step) {
        const tgtout = new utils_1.PerhapsM('tgtout');
        const bout = new utils_1.PerhapsM('bout');
        const sout = new utils_1.PerhapsM('sout');
        return (0, utils_1.goOn)([
            [tgtout, () => target.check(context, r, new V.Nat())],
            [bout, () => base.synth(context, r)],
            [sout, () => step.check(context, r, (() => {
                    const old = (0, utils_1.fresh)(context, 'old');
                    return (0, context_1.valInContext)(context, new C.Pi(old, bout.value.type, bout.value.type));
                })())],
        ], () => new utils_1.go(new C.The(bout.value.type, new C.IterNat(tgtout.value, new C.The(bout.value.type, bout.value.expr), sout.value))));
    }
    static synthRecNat(context, r, target, base, step) {
        const tgtout = new utils_1.PerhapsM('tgtout');
        const bout = new utils_1.PerhapsM('bout');
        const sout = new utils_1.PerhapsM('sout');
        return (0, utils_1.goOn)([
            [tgtout, () => target.check(context, r, new V.Nat())],
            [bout, () => base.synth(context, r)],
            [sout, () => step.check(context, r, (() => {
                    const n_minus_1 = (0, utils_1.fresh)(context, 'n_minus_1');
                    const old = (0, utils_1.fresh)(context, 'old');
                    return (0, context_1.valInContext)(context, new C.Pi(n_minus_1, new C.Nat(), new C.Pi(old, bout.value.type, bout.value.type)));
                })())],
        ], () => new utils_1.go(new C.The(bout.value.type, new C.RecNat(tgtout.value, new C.The(bout.value.type, bout.value.expr), sout.value))));
    }
    static synthIndNat(context, r, target, motive, base, step) {
        const tgtout = new utils_1.PerhapsM('tgtout');
        const motout = new utils_1.PerhapsM('motout');
        const motval = new utils_1.PerhapsM('motval');
        const bout = new utils_1.PerhapsM('bout');
        const sout = new utils_1.PerhapsM('sout');
        return (0, utils_1.goOn)([
            [tgtout, () => target.check(context, r, new V.Nat())],
            [motout, () => motive.check(context, r, new V.Pi('n', new V.Nat(), new utils_1.HigherOrderClosure((_) => new V.Universe())))],
            [motval, () => new utils_1.go((0, context_1.valInContext)(context, motout.value))],
            [bout, () => base.check(context, r, (0, evaluator_1.doApp)(motval.value, new V.Zero()))],
            [sout, () => step.check(context, r, new V.Pi('n-1', new V.Nat(), new utils_1.HigherOrderClosure((n_minus_1) => new V.Pi('x', (0, evaluator_1.doApp)(motval.value, n_minus_1), new utils_1.HigherOrderClosure((_) => (0, evaluator_1.doApp)(motval.value, new V.Add1(n_minus_1)))))))],
        ], () => new utils_1.go(new C.The(new C.Application(motout.value, tgtout.value), new C.IndNat(tgtout.value, motout.value, bout.value, sout.value))));
    }
    static synthAtom(context, r) {
        return new utils_1.go(new C.The(new C.Universe(), new C.Atom()));
    }
    static synthPair(context, r, first, second) {
        const a = (0, utils_1.fresh)(context, 'a');
        const Aout = new utils_1.PerhapsM('Aout');
        const Dout = new utils_1.PerhapsM('Dout');
        return (0, utils_1.goOn)([
            [Aout, () => first.check(context, r, new V.Universe())],
            [Dout, () => second.check((0, context_1.bindFree)(context, a, (0, context_1.valInContext)(context, Aout.value)), r, new V.Universe())],
        ], () => new utils_1.go(new C.The(new C.Universe(), new C.Sigma(a, Aout.value, Dout.value))));
    }
    static synthSigma(context, r, location, binders, body) {
        if (binders.length === 1) {
            const [bd, type] = [binders[0].binder, binders[0].type];
            const xhat = (0, utils_1.fresh)(context, bd.varName);
            const xloc = bd.location;
            const Aout = new utils_1.PerhapsM('Aout');
            const Dout = new utils_1.PerhapsM('Dout');
            return (0, utils_1.goOn)([
                [Aout, () => type.check(context, r, new V.Universe())],
                [Dout, () => body.check((0, context_1.bindFree)(context, xhat, (0, context_1.valInContext)(context, Aout.value)), (0, utils_2.extendRenaming)(r, bd.varName, xhat), new V.Universe())],
            ], () => {
                (0, utils_2.PieInfoHook)(xloc, ['binding-site', Aout.value]);
                return new utils_1.go(new C.The(new C.Universe(), new C.Sigma(xhat, Aout.value, Dout.value)));
            });
        }
        else if (binders.length > 1) {
            const [fst, ...rest] = binders;
            const [binder, type] = [fst.binder, fst.type];
            const xloc = binder.location;
            const x = binder.varName;
            const xhat = (0, utils_1.fresh)(context, x);
            const Aout = new utils_1.PerhapsM('Aout');
            const Dout = new utils_1.PerhapsM('Dout');
            return (0, utils_1.goOn)([
                [Aout, () => type.check(context, r, new V.Universe())],
                [Dout, () => new S.Sigma((0, locations_1.notForInfo)(location), rest, body).check((0, context_1.bindFree)(context, xhat, (0, context_1.valInContext)(context, Aout.value)), (0, utils_2.extendRenaming)(r, x, xhat), new V.Universe())
                ],
            ], () => {
                (0, utils_2.PieInfoHook)(xloc, ['binding-site', Aout.value]);
                return new utils_1.go(new C.The(new C.Universe(), new C.Sigma(xhat, Aout.value, Dout.value)));
            });
        }
        else {
            throw new Error('Invalid number of binders in Sigma type');
        }
    }
    static synthCar(context, r, location, pair) {
        const pout = new utils_1.PerhapsM('p_rst');
        return (0, utils_1.goOn)([[pout, () => pair.synth(context, r)]], () => {
            const val = (0, context_1.valInContext)(context, pout.value.type);
            if (val instanceof V.Sigma) {
                return new utils_1.go(new C.The(val.carType.readBackType(context), new C.Car(pout.value.expr)));
            }
            else {
                return new utils_1.stop(location, new utils_1.Message([`car requires a Pair type, but was used as a: ${val}.`]));
            }
        });
    }
    static synthCdr(context, r, location, pair) {
        const pout = new utils_1.PerhapsM('pout');
        return (0, utils_1.goOn)([[pout, () => pair.synth(context, r)]], () => {
            const val = (0, context_1.valInContext)(context, pout.value.type);
            if (val instanceof V.Sigma) {
                const [x, A, clos] = [val.carName, val.carType, val.cdrType];
                return new utils_1.go(new C.The(clos.valOfClosure((0, evaluator_1.doCar)((0, context_1.valInContext)(context, pout.value.expr))).readBackType(context), new C.Cdr(pout.value.expr)));
            }
            else {
                return new utils_1.stop(location, new utils_1.Message([`cdr requires a Pair type, but was used as a: ${val}.`]));
            }
        });
    }
    static synthQuote(context, r, location, atom) {
        if ((0, utils_2.atomOk)(atom)) {
            return new utils_1.go(new C.The(new C.Atom(), new C.Quote(atom)));
        }
        else {
            return new utils_1.stop(location, new utils_1.Message([`Invalid atom: ${atom}. Atoms consist of letters and hyphens.`]));
        }
    }
    static synthTrivial(context, r) {
        return new utils_1.go(new C.The(new C.Universe(), new C.Trivial()));
    }
    static synthSole(context, r) {
        return new utils_1.go(new C.The(new C.Trivial(), new C.Sole()));
    }
    static synthIndList(context, r, location, target, motive, base, step) {
        const tgtout = new utils_1.PerhapsM('tgtout');
        const motout = new utils_1.PerhapsM('motout');
        const motval = new utils_1.PerhapsM('motval');
        const bout = new utils_1.PerhapsM('bout');
        const sout = new utils_1.PerhapsM('sout');
        return (0, utils_1.goOn)([
            [tgtout, () => target.synth(context, r)],
        ], (() => {
            const [tgt_t, tgt_e] = [tgtout.value.type, tgtout.value.expr];
            const type = (0, context_1.valInContext)(context, tgt_t);
            if (type instanceof V.List) {
                const E = type.entryType;
                return (0, utils_1.goOn)([
                    [
                        motout,
                        () => motive.check(context, r, new V.Pi('xs', new V.List(E), new utils_1.FirstOrderClosure((0, context_1.contextToEnvironment)(context), 'xs', new C.Universe())))
                    ],
                    [motval, () => new utils_1.go((0, context_1.valInContext)(context, motout.value))],
                    [bout, () => base.check(context, r, (0, evaluator_1.doApp)(motval.value, new V.Nil()))],
                    [sout, () => step.check(context, r, new V.Pi('e', E, new utils_1.HigherOrderClosure((e) => new V.Pi('es', new V.List(E), new utils_1.HigherOrderClosure((es) => new V.Pi('ih', (0, evaluator_1.doApp)(motval.value, es), new utils_1.HigherOrderClosure((_) => (0, evaluator_1.doApp)(motval.value, new V.ListCons(e, es)))))))))],
                ], () => new utils_1.go(new C.The(new C.Application(motout.value, tgt_e), new C.IndList(tgt_e, motout.value, bout.value, sout.value))));
            }
            else {
                return new utils_1.stop(location, new utils_1.Message([`Not a List: ${type.readBackType(context)}.`]));
            }
        }));
    }
    static synthRecList(context, r, location, target, base, step) {
        const tgtout = new utils_1.PerhapsM('tgtout');
        return (0, utils_1.goOn)([[tgtout, () => target.synth(context, r)]], () => {
            const [tgt_t, tgt_e] = [tgtout.value.type, tgtout.value.expr];
            const type = (0, context_1.valInContext)(context, tgt_t);
            if (type instanceof V.List) {
                const E = type.entryType;
                const bout = new utils_1.PerhapsM('bout');
                const btval = new utils_1.PerhapsM('btval');
                const sout = new utils_1.PerhapsM('sout');
                return (0, utils_1.goOn)([
                    [bout, () => base.synth(context, r)],
                    [btval, () => new utils_1.go((0, context_1.valInContext)(context, bout.value.type))],
                    [sout, () => step.check(context, r, new V.Pi('e', E, new utils_1.HigherOrderClosure((_) => new V.Pi('es', new V.List(E), new utils_1.HigherOrderClosure((_) => new V.Pi('ih', btval.value, new utils_1.HigherOrderClosure((_) => btval.value)))))))
                    ],
                ], () => new utils_1.go(new C.The(bout.value.type, new C.RecList(tgt_e, new C.The(bout.value.type, bout.value.expr), sout.value))));
            }
            else {
                return new utils_1.stop(location, new utils_1.Message([`Not a List: ${type.readBackType(context)}.`]));
            }
        });
    }
    static synthList(context, r, e) {
        const Eout = new utils_1.PerhapsM('Eout');
        return (0, utils_1.goOn)([[Eout, () => e.entryType.check(context, r, new V.Universe())]], () => new utils_1.go(new C.The(new C.Universe(), new C.List(Eout.value))));
    }
    static synthListCons(context, r, x, xs) {
        const fstout = new utils_1.PerhapsM('eout');
        const restout = new utils_1.PerhapsM('esout');
        return (0, utils_1.goOn)([
            [fstout, () => x.synth(context, r)],
            [restout, () => xs.check(context, r, (0, context_1.valInContext)(context, new C.List(fstout.value.type)))
            ],
        ], () => new utils_1.go(new C.The(new C.List(fstout.value.type), new C.ListCons(fstout.value.expr, restout.value))));
    }
    static synthAbsurd(context, r, e) {
        return new utils_1.go(new C.The(new C.Universe(), new C.Absurd()));
    }
    static synthIndAbsurd(context, r, e) {
        const tgtout = new utils_1.PerhapsM('tgtout');
        const motout = new utils_1.PerhapsM('motout');
        return (0, utils_1.goOn)([
            [tgtout, () => e.target.check(context, r, new V.Absurd())],
            [motout, () => e.motive.check(context, r, new V.Universe())],
        ], () => new utils_1.go(new C.The(motout.value, new C.IndAbsurd(tgtout.value, motout.value))));
    }
    static synthEqual(context, r, type, left, right) {
        const Aout = new utils_1.PerhapsM('Aout');
        const Av = new utils_1.PerhapsM('Av');
        const from_out = new utils_1.PerhapsM('from_out');
        const to_out = new utils_1.PerhapsM('to_out');
        return (0, utils_1.goOn)([
            [Aout, () => type.check(context, r, new V.Universe())],
            [Av, () => new utils_1.go((0, context_1.valInContext)(context, Aout.value))],
            [from_out, () => left.check(context, r, Av.value)],
            [to_out, () => right.check(context, r, Av.value)],
        ], () => new utils_1.go(new C.The(new C.Universe(), new C.Equal(Aout.value, from_out.value, to_out.value))));
    }
    static synthReplace(context, r, location, target, motive, base) {
        const tgtout = new utils_1.PerhapsM('tgt_rst');
        const motout = new utils_1.PerhapsM('motout');
        const bout = new utils_1.PerhapsM('bout');
        return (0, utils_1.goOn)([[tgtout, () => target.synth(context, r)]], () => {
            const result = (0, context_1.valInContext)(context, tgtout.value.type);
            if (result instanceof V.Equal) {
                const [Av, fromv, tov] = [result.type, result.from, result.to];
                return (0, utils_1.goOn)([
                    [motout, () => motive.check(context, r, new V.Pi('x', Av, new utils_1.HigherOrderClosure((_) => new V.Universe())))
                    ],
                    [bout, () => base.check(context, r, (0, evaluator_1.doApp)((0, context_1.valInContext)(context, motout.value), fromv))],
                ], () => new utils_1.go(new C.The(((0, evaluator_1.doApp)((0, context_1.valInContext)(context, motout.value), tov)).readBackType(context), new C.Replace(tgtout.value.expr, motout.value, bout.value))));
            }
            else {
                return new utils_1.stop(location, new utils_1.Message([`Expected an expression with = type, but the type was: ${tgtout.value.type}.`]));
            }
        });
    }
    static synthTrans(context, r, location, left, right) {
        const lout = new utils_1.PerhapsM('p1_rst');
        const rout = new utils_1.PerhapsM('p2_rst');
        return (0, utils_1.goOn)([
            [lout, () => left.synth(context, r)],
            [rout, () => right.synth(context, r)],
        ], () => {
            const result1 = (0, context_1.valInContext)(context, lout.value.type);
            const result2 = (0, context_1.valInContext)(context, rout.value.type);
            if (result1 instanceof V.Equal && result2 instanceof V.Equal) {
                const [Av, fromv, midv] = [result1.type, result1.from, result1.to];
                const [Bv, midv2, tov] = [result2.type, result2.from, result2.to];
                return (0, utils_1.goOn)([
                    [new utils_1.PerhapsM("_"), () => (0, utils_2.sameType)(context, location, Av, Bv)],
                    [new utils_1.PerhapsM("_"), () => (0, utils_2.convert)(context, location, Av, midv, midv2)],
                ], () => new utils_1.go(new C.The(new V.Equal(Av, fromv, tov).readBackType(context), new C.Trans(lout.value.expr, rout.value.expr))));
            }
            else {
                return new utils_1.stop(location, new utils_1.Message([`Expected =, got ${result1} and ${result2}.`]));
            }
        });
    }
    static synthCong(context, r, location, base, fun) {
        const bout = new utils_1.PerhapsM('bout');
        const fout = new utils_1.PerhapsM('f_rst');
        return (0, utils_1.goOn)([
            [bout, () => base.synth(context, r)],
            [fout, () => fun.synth(context, r)],
        ], () => {
            const result1 = (0, context_1.valInContext)(context, bout.value.type);
            const result2 = (0, context_1.valInContext)(context, fout.value.type);
            if (result1 instanceof V.Equal) {
                const [Av, fromv, tov] = [result1.type, result1.from, result1.to];
                if (result2 instanceof V.Pi) {
                    const [x, Bv, c] = [result2.argName, result2.argType, result2.resultType];
                    const ph = new utils_1.PerhapsM('ph');
                    const Cv = new utils_1.PerhapsM('Cv');
                    const fv = new utils_1.PerhapsM('fv');
                    return (0, utils_1.goOn)([
                        [ph, () => (0, utils_2.sameType)(context, location, Av, Bv)],
                        [Cv, () => new utils_1.go(c.valOfClosure(fromv))],
                        [fv, () => new utils_1.go((0, context_1.valInContext)(context, fout.value.expr))],
                    ], () => new utils_1.go(new C.The(new C.Equal(Cv.value.readBackType(context), (0, utils_3.readBack)(context, Cv.value, (0, evaluator_1.doApp)(fv.value, fromv)), (0, utils_3.readBack)(context, Cv.value, (0, evaluator_1.doApp)(fv.value, tov))), new C.Cong(bout.value.expr, Cv.value.readBackType(context), fout.value.expr))));
                }
                else {
                    return new utils_1.stop(location, new utils_1.Message([`Expected a function type, got ${result2.readBackType(context)}.`]));
                }
            }
            else {
                return new utils_1.stop(location, new utils_1.Message([`Expected an = type, got ${result1.readBackType(context)}.`]));
            }
        });
    }
    static synthSymm(context, r, location, eq) {
        const eout = new utils_1.PerhapsM('eout');
        return (0, utils_1.goOn)([[eout, () => eq.synth(context, r)]], () => {
            const result = (0, context_1.valInContext)(context, eout.value.type);
            if (result instanceof V.Equal) {
                const [Av, fromv, tov] = [result.type, result.from, result.to];
                return new utils_1.go(new C.The((new V.Equal(Av, tov, fromv)).readBackType(context), new C.Symm(eout.value.expr)));
            }
            else {
                return new utils_1.stop(location, new utils_1.Message([`Expected an = type, got ${result.readBackType(context)}.`]));
            }
        });
    }
    static synthIndEqual(context, r, location, target, motive, base) {
        const tgtout = new utils_1.PerhapsM('tgtout');
        const motout = new utils_1.PerhapsM('motout');
        const motv = new utils_1.PerhapsM('motv');
        const baseout = new utils_1.PerhapsM('baseout');
        return (0, utils_1.goOn)([[tgtout, () => target.synth(context, r)]], () => {
            const result = (0, context_1.valInContext)(context, tgtout.value.type);
            if (result instanceof V.Equal) {
                const [Av, fromv, tov] = [result.type, result.from, result.to];
                return (0, utils_1.goOn)([
                    [motout, () => motive.check(context, r, new V.Pi('to', Av, new utils_1.HigherOrderClosure((to) => new V.Pi('p', new V.Equal(Av, fromv, to), new utils_1.HigherOrderClosure((_) => new V.Universe())))))
                    ],
                    [motv, () => new utils_1.go((0, context_1.valInContext)(context, motout.value))],
                    [baseout, () => base.check(context, r, (0, evaluator_1.doApp)((0, evaluator_1.doApp)(motv.value, fromv), new V.Same(fromv)))
                    ],
                ], () => new utils_1.go(new C.The((0, evaluator_1.doApp)((0, evaluator_1.doApp)(motv.value, tov), (0, context_1.valInContext)(context, tgtout.value.expr)).readBackType(context), new C.IndEqual(tgtout.value.expr, motout.value, baseout.value))));
            }
            else {
                return new utils_1.stop(location, new utils_1.Message([`Expected evidence of equality, got ${result.readBackType(context)}.`]));
            }
        });
    }
    static synthVec(context, r, type, len) {
        const tout = new utils_1.PerhapsM('tout');
        const lenout = new utils_1.PerhapsM('lenout');
        return (0, utils_1.goOn)([
            [tout, () => type.check(context, r, new V.Universe())],
            [lenout, () => len.check(context, r, new V.Nat())],
        ], () => new utils_1.go(new C.The(new C.Universe(), new C.Vec(tout.value, lenout.value))));
    }
    static synthHead(context, r, location, vec) {
        const vout = new utils_1.PerhapsM('vout');
        return (0, utils_1.goOn)([[vout, () => vec.synth(context, r)]], () => {
            const result = (0, context_1.valInContext)(context, vout.value.type).now();
            if (result instanceof V.Vec) {
                const [T, len] = [result.entryType, result.length];
                const lenNow = len.now();
                if (lenNow instanceof V.Add1) {
                    return new utils_1.go(new C.The(T.readBackType(context), new C.Head(vout.value.expr)));
                }
                else {
                    return new utils_1.stop(location, new utils_1.Message([`Expected a Vec with add1 at the top of the length, got ${(0, utils_3.readBack)(context, new V.Nat(), len)}.`]));
                }
            }
            else {
                return new utils_1.stop(location, new utils_1.Message([`Expected a Vec, got ${result.readBackType(context)}.`]));
            }
        });
    }
    static synthTail(context, r, location, vec) {
        const vout = new utils_1.PerhapsM('vout');
        return (0, utils_1.goOn)([[vout, () => vec.synth(context, r)]], () => {
            const result = (0, context_1.valInContext)(context, vout.value.type).now();
            if (result instanceof V.Vec) {
                const [T, len] = [result.entryType, result.length];
                const lenNow = len.now();
                if (lenNow instanceof V.Add1) {
                    const len_minus_1 = lenNow.smaller;
                    return new utils_1.go(new C.The(new C.Vec(T.readBackType(context), (0, utils_3.readBack)(context, new V.Nat(), len_minus_1)), new C.Tail(vout.value.expr)));
                }
                else {
                    return new utils_1.stop(location, new utils_1.Message([`Expected a Vec with add1 at the top of the length, got ${(0, utils_3.readBack)(context, new V.Nat(), len)}.`]));
                }
            }
            else {
                return new utils_1.stop(location, new utils_1.Message([`Expected a Vec, got ${result.readBackType(context)}.`]));
            }
        });
    }
    static synthIndVec(context, r, location, length, target, motive, base, step) {
        const lenout = new utils_1.PerhapsM('lenout');
        const lenv = new utils_1.PerhapsM('lenv');
        const vecout = new utils_1.PerhapsM('vecout');
        const motout = new utils_1.PerhapsM('motout');
        const motval = new utils_1.PerhapsM('motval');
        const bout = new utils_1.PerhapsM('bout');
        const sout = new utils_1.PerhapsM('sout');
        return (0, utils_1.goOn)([
            [lenout, () => length.check(context, r, new V.Nat())],
            [lenv, () => new utils_1.go((0, context_1.valInContext)(context, lenout.value))],
            [vecout, () => target.synth(context, r)],
        ], () => {
            const result = (0, context_1.valInContext)(context, vecout.value.type);
            if (result instanceof V.Vec) {
                const [E, len2v] = [result.entryType, result.length];
                return (0, utils_1.goOn)([
                    [new utils_1.PerhapsM('_'), () => (0, utils_2.convert)(context, location, new V.Nat(), lenv.value, len2v)],
                    [motout, () => motive.check(context, r, new V.Pi('k', new V.Nat(), new utils_1.HigherOrderClosure((k) => new V.Pi('es', new V.Vec(E, k), new utils_1.HigherOrderClosure((_) => new V.Universe())))))],
                    [motval, () => new utils_1.go((0, context_1.valInContext)(context, motout.value))],
                    [bout, () => base.check(context, r, (0, evaluator_1.doApp)((0, evaluator_1.doApp)(motval.value, new V.Zero()), new V.VecNil()))],
                    [sout, () => step.check(context, r, (0, evaluator_1.indVecStepType)(E, motval.value))],
                ], () => new utils_1.go(new C.The(new C.Application(new C.Application(motout.value, lenout.value), vecout.value.expr), new C.IndVec(lenout.value, vecout.value.expr, motout.value, bout.value, sout.value))));
            }
            else {
                return new utils_1.stop(location, new utils_1.Message([`Expected a Vec, got ${result.readBackType(context)}.`]));
            }
        });
    }
    static synthEither(context, r, left, right) {
        const Lout = new utils_1.PerhapsM('Lout');
        const Rout = new utils_1.PerhapsM('Rout');
        return (0, utils_1.goOn)([
            [Lout, () => left.check(context, r, new V.Universe())],
            [Rout, () => right.check(context, r, new V.Universe())],
        ], () => new utils_1.go(new C.The(new C.Universe(), new C.Either(Lout.value, Rout.value))));
    }
    static synthIndEither(context, r, location, target, motive, baseLeft, baseRight) {
        const tgtout = new utils_1.PerhapsM('tgtout');
        const motout = new utils_1.PerhapsM('motout');
        const motval = new utils_1.PerhapsM('motval');
        const lout = new utils_1.PerhapsM('lout');
        const rout = new utils_1.PerhapsM('rout');
        return (0, utils_1.goOn)([[tgtout, () => target.synth(context, r)]], () => {
            const result = (0, context_1.valInContext)(context, tgtout.value.type);
            if (result instanceof V.Either) {
                const [Lv, Rv] = [result.leftType, result.rightType];
                return (0, utils_1.goOn)([
                    [motout, () => motive.check(context, r, new V.Pi('x', new V.Either(Lv, Rv), new utils_1.HigherOrderClosure((_) => new V.Universe())))
                    ],
                    [motval, () => new utils_1.go((0, context_1.valInContext)(context, motout.value))],
                    [lout, () => baseLeft.check(context, r, new V.Pi('x', Lv, new utils_1.HigherOrderClosure((x) => (0, evaluator_1.doApp)(motval.value, new V.Left(x)))))],
                    [rout, () => baseRight.check(context, r, new V.Pi('x', Rv, new utils_1.HigherOrderClosure((x) => (0, evaluator_1.doApp)(motval.value, new V.Right(x)))))],
                ], () => new utils_1.go(new C.The(new C.Application(motout.value, tgtout.value.expr), new C.IndEither(tgtout.value.expr, motout.value, lout.value, rout.value))));
            }
            else {
                return new utils_1.stop(location, new utils_1.Message([`Expected an Either, but got a ${result.readBackType(context)}.`]));
            }
        });
    }
    static synthThe(context, r, type, value) {
        const tout = new utils_1.PerhapsM('t_out');
        const eout = new utils_1.PerhapsM('e_out');
        return (0, utils_1.goOn)([
            [tout, () => type.isType(context, r)],
            [eout, () => value.check(context, r, (0, context_1.valInContext)(context, tout.value))],
        ], () => new utils_1.go(new C.The(tout.value, eout.value)));
    }
    static synthApplication(context, r, location, fun, arg, args) {
        if (args.length === 0) {
            const fout = new utils_1.PerhapsM('fout');
            return (0, utils_1.goOn)([[fout, () => fun.synth(context, r)]], () => {
                const result = (0, context_1.valInContext)(context, fout.value.type);
                if (result instanceof V.Pi) {
                    const [_, A, c] = [result.argName, result.argType, result.resultType];
                    const argout = new utils_1.PerhapsM('argout');
                    return (0, utils_1.goOn)([[argout, () => arg.check(context, r, A)]], () => new utils_1.go(new C.The(c.valOfClosure((0, context_1.valInContext)(context, argout.value)).readBackType(context), new C.Application(fout.value.expr, argout.value))));
                }
                else {
                    return new utils_1.stop(location, new utils_1.Message([`Not a function type: ${result.readBackType(context)}.`]));
                }
            });
        }
        else {
            const appout = new utils_1.PerhapsM('appout');
            return (0, utils_1.goOn)([[appout, () => (new S.Application((0, locations_1.notForInfo)(location), fun, arg, args.slice(0, args.length - 1))).synth(context, r)]], () => {
                const result = (0, context_1.valInContext)(context, appout.value.type);
                if (result instanceof V.Pi) {
                    const [x, A, c] = [result.argName, result.argType, result.resultType];
                    const argout = new utils_1.PerhapsM('fout');
                    return (0, utils_1.goOn)([[argout, () => args[args.length - 1].check(context, r, A)]], () => new utils_1.go(new C.The(c.valOfClosure((0, context_1.valInContext)(context, argout.value)).readBackType(context), new C.Application(appout.value.expr, argout.value))));
                }
                else {
                    return new utils_1.stop(location, new utils_1.Message([`Not a function type: ${result.readBackType(context)}.`]));
                }
            });
        }
    }
    /*
    [x
          (cond [(and (symbol? x) (var-name? x))
                 (let ((real-x (rename r x)))
                  (go-on ((x-tv (var-type Γ (src-loc e) real-x)))
                    (begin (match (assv real-x Γ)
                             [(cons _ (def _ _))
                              (send-pie-info (src-loc e) 'definition)]
                             [_ (void)])
                           (go `(the ,(read-back-type Γ x-tv) ,real-x)))))]
                [(number? x)
                 (cond [(zero? x)
                        (go `(the Nat zero))]
                       [(positive? x)
                        (go-on ((n-1-out (check Γ
                                                r
                                                (@ (src-loc e) (sub1 x))
                                                'NAT)))
                          (go `(the Nat (add1 ,n-1-out))))])]
                [else
                 (stop (src-loc e)
                       `("Can't determine a type"))])]
    */
    static synthName(context, r, location, name) {
        const real_x = (0, utils_2.rename)(r, name);
        const x_tv = new utils_1.PerhapsM('x_tv');
        return (0, utils_1.goOn)([[x_tv, () => (0, context_1.varType)(context, location, real_x)]], () => {
            const result = context.get(real_x);
            if (result instanceof context_1.Define) {
                (0, utils_2.PieInfoHook)(location, 'definition');
            }
            return new utils_1.go(new C.The(x_tv.value.readBackType(context), new C.VarName(real_x)));
        });
    }
    static synthNumber(context, r, location, value) {
        if (value === 0) {
            return new utils_1.go(new C.The(new C.Nat(), new C.Zero()));
        }
        else if (value > 0) {
            const n_minus_1_out = new utils_1.PerhapsM('n_1_out');
            return (0, utils_1.goOn)([[n_minus_1_out, () => (new S.Number(location, value - 1)).check(context, r, new V.Nat())]], () => new utils_1.go(new C.The(new C.Nat(), new C.Add1(n_minus_1_out.value))));
        }
        else {
            return new utils_1.stop(location, new utils_1.Message([`Expected a positive number, got ${value}.`]));
        }
    }
    static synthDefineDatatype(ctx, renames, datatype) {
        let checkAndBuildTypes = (initialType, binder) => {
            let normalizedType = [];
            for (const param of binder) {
                const paramCheck = param.type.check(ctx, renames, new V.Universe());
                if (paramCheck instanceof utils_1.stop)
                    return paramCheck;
                normalizedType.push(paramCheck.result);
            }
            let cur_Type = initialType;
            for (let i = normalizedType.length - 1; i >= 0; i--) {
                const paramType = normalizedType[i];
                const paramName = binder[i].findNames();
                const currentTType = cur_Type;
                cur_Type = new V.Pi(paramName, (0, context_1.valInContext)(ctx, paramType), new utils_1.HigherOrderClosure((v) => currentTType));
            }
            return new utils_1.go(cur_Type);
        };
        const normalizedResultTypeTemp = datatype.resultType.check(ctx, renames, new V.Universe());
        if (normalizedResultTypeTemp instanceof utils_1.stop)
            return normalizedResultTypeTemp;
        const normalizedIndicesTemp = checkAndBuildTypes(normalizedResultTypeTemp.result, datatype.indices);
        if (normalizedIndicesTemp instanceof utils_1.stop)
            return normalizedIndicesTemp;
        const normalizedParametersTemp = checkAndBuildTypes(normalizedIndicesTemp.result, datatype.parameters);
        let normalizedConstructor = [];
        for (const constructor of datatype.constructors) {
            const normalizedResultType = constructor.resultType.check(ctx, renames, new V.Universe());
            if (normalizedResultType instanceof utils_1.stop)
                return normalizedResultType;
            const normalizedConstructorTypeTemp = checkAndBuildTypes(normalizedResultType.result, constructor.args);
            if (normalizedConstructorTypeTemp instanceof utils_1.stop)
                return normalizedConstructorTypeTemp;
            normalizedConstructor.push(normalizedConstructorTypeTemp.result);
        }
    }
}
exports.synthesizer = synthesizer;
//# sourceMappingURL=synthesizer.js.map