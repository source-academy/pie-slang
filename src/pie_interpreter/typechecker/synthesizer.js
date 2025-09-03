"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.synthesizer = void 0;
var C = require("../types/core");
var S = require("../types/source");
var V = require("../types/value");
var utils_1 = require("../types/utils");
var context_1 = require("../utils/context");
var utils_2 = require("./utils");
var locations_1 = require("../utils/locations");
var evaluator_1 = require("../evaluator/evaluator");
var utils_3 = require("../evaluator/utils");
var synthesizer = /** @class */ (function () {
    function synthesizer() {
    }
    synthesizer.synthNat = function (ctx, r) {
        return new utils_1.go(new C.The(new C.Universe(), new C.Nat()));
    };
    synthesizer.synthUniverse = function (ctx, r, location) {
        return new utils_1.stop(location, new utils_1.Message(["U is a type, but it does not have a type."]));
    };
    synthesizer.synthArrow = function (context, r, location, arg1, arg2, args) {
        if (args.length === 0) {
            var z_1 = (0, utils_1.freshBinder)(context, arg2, 'x');
            var Aout_1 = new utils_1.PerhapsM("Aout");
            var Bout_1 = new utils_1.PerhapsM('Bout');
            return (0, utils_1.goOn)([
                [Aout_1, function () {
                        return arg1.check(context, r, new V.Universe());
                    }],
                [Bout_1, function () {
                        return arg2.check((0, context_1.bindFree)(context, z_1, (0, context_1.valInContext)(context, Aout_1.value)), r, new V.Universe());
                    }
                ],
            ], (function () {
                return new utils_1.go(new C.The(new C.Universe(), new C.Pi(z_1, Aout_1.value, Bout_1.value)));
            }));
        }
        else {
            var first_1 = args[0], rest_1 = args.slice(1);
            var z_2 = (0, utils_1.freshBinder)(context, (0, utils_2.makeApp)(arg2, first_1, rest_1), 'x');
            var Aout_2 = new utils_1.PerhapsM("Aout");
            var tout_1 = new utils_1.PerhapsM('tout');
            return (0, utils_1.goOn)([
                [Aout_2, function () { return arg1.check(context, r, new V.Universe()); }],
                [tout_1, function () {
                        return new S.Arrow((0, locations_1.notForInfo)(location), arg2, first_1, rest_1)
                            .check((0, context_1.bindFree)(context, z_2, (0, context_1.valInContext)(context, Aout_2.value)), r, new V.Universe());
                    }
                ]
            ], function () {
                return new utils_1.go(new C.The(new C.Universe(), new C.Pi(z_2, Aout_2.value, tout_1.value)));
            });
        }
    };
    synthesizer.synthPi = function (context, r, location, binders, body) {
        if (binders.length === 1) {
            var _a = [binders[0].binder, binders[0].type], binder_1 = _a[0], type_1 = _a[1];
            var xhat_1 = (0, utils_1.fresh)(context, binder_1.varName);
            var xloc_1 = binder_1.location;
            var Aout_3 = new utils_1.PerhapsM('Aout');
            var Bout_2 = new utils_1.PerhapsM('Bout');
            return (0, utils_1.goOn)([
                [Aout_3, function () { return type_1.check(context, r, new V.Universe()); }],
                [Bout_2, function () { return body.check((0, context_1.bindFree)(context, xhat_1, (0, context_1.valInContext)(context, Aout_3.value)), (0, utils_2.extendRenaming)(r, binder_1.varName, xhat_1), new V.Universe()); }],
            ], function () {
                (0, utils_2.PieInfoHook)(xloc_1, ['binding-site', Aout_3.value]);
                return new utils_1.go(new C.The(new C.Universe(), new C.Pi(xhat_1, Aout_3.value, Bout_2.value)));
            });
        }
        else if (binders.length > 1) {
            var fst = binders[0], rest_2 = binders.slice(1);
            var _b = [fst.binder, fst.type], binder = _b[0], type_2 = _b[1];
            var xloc_2 = binder.location;
            var x_1 = binder.varName;
            var xhat_2 = (0, utils_1.fresh)(context, x_1);
            var Aout_4 = new utils_1.PerhapsM('Aout');
            var Bout_3 = new utils_1.PerhapsM('Bout');
            return (0, utils_1.goOn)([
                [Aout_4, function () { return type_2.check(context, r, new V.Universe()); }],
                [Bout_3, function () {
                        return new S.Pi((0, locations_1.notForInfo)(location), rest_2, body)
                            .check((0, context_1.bindFree)(context, xhat_2, (0, context_1.valInContext)(context, Aout_4.value)), (0, utils_2.extendRenaming)(r, x_1, xhat_2), new V.Universe());
                    }
                ],
            ], function () {
                (0, utils_2.PieInfoHook)(xloc_2, ['binding-site', Aout_4.value]);
                return new utils_1.go(new C.The(new C.Universe(), new C.Pi(xhat_2, Aout_4.value, Bout_3.value)));
            });
        }
        else {
            throw new Error('Invalid number of binders in Pi type');
        }
    };
    synthesizer.synthZero = function (context, r) {
        return new utils_1.go(new C.The(new C.Nat(), new C.Zero()));
    };
    synthesizer.synthAdd1 = function (context, r, base) {
        var nout = new utils_1.PerhapsM('nout');
        return (0, utils_1.goOn)([[nout, function () { return base.check(context, r, new V.Nat()); }]], function () { return new utils_1.go(new C.The(new C.Nat(), new C.Add1(nout.value))); });
    };
    synthesizer.synthWhichNat = function (context, r, target, base, step) {
        var tgtout = new utils_1.PerhapsM('tgtout');
        var bout = new utils_1.PerhapsM('bout');
        var sout = new utils_1.PerhapsM('sout');
        var n_minus_1 = (0, utils_1.fresh)(context, 'n_minus_1');
        return (0, utils_1.goOn)([
            [tgtout, function () { return target.check(context, r, new V.Nat()); }],
            [bout, function () { return base.synth(context, r); }],
            [sout, function () { return step.check(context, r, new V.Pi(n_minus_1, new V.Nat(), new utils_1.FirstOrderClosure((0, context_1.contextToEnvironment)(context), n_minus_1, bout.value.type))); }
            ],
        ], function () { return new utils_1.go(new C.The(bout.value.type, new C.WhichNat(tgtout.value, new C.The(bout.value.type, bout.value.expr), sout.value))); });
    };
    synthesizer.synthIterNat = function (context, r, target, base, step) {
        var tgtout = new utils_1.PerhapsM('tgtout');
        var bout = new utils_1.PerhapsM('bout');
        var sout = new utils_1.PerhapsM('sout');
        return (0, utils_1.goOn)([
            [tgtout, function () { return target.check(context, r, new V.Nat()); }],
            [bout, function () { return base.synth(context, r); }],
            [sout, function () { return step.check(context, r, (function () {
                    var old = (0, utils_1.fresh)(context, 'old');
                    return (0, context_1.valInContext)(context, new C.Pi(old, bout.value.type, bout.value.type));
                })()); }],
        ], function () { return new utils_1.go(new C.The(bout.value.type, new C.IterNat(tgtout.value, new C.The(bout.value.type, bout.value.expr), sout.value))); });
    };
    synthesizer.synthRecNat = function (context, r, target, base, step) {
        var tgtout = new utils_1.PerhapsM('tgtout');
        var bout = new utils_1.PerhapsM('bout');
        var sout = new utils_1.PerhapsM('sout');
        return (0, utils_1.goOn)([
            [tgtout, function () { return target.check(context, r, new V.Nat()); }],
            [bout, function () { return base.synth(context, r); }],
            [sout, function () { return step.check(context, r, (function () {
                    var n_minus_1 = (0, utils_1.fresh)(context, 'n_minus_1');
                    var old = (0, utils_1.fresh)(context, 'old');
                    return (0, context_1.valInContext)(context, new C.Pi(n_minus_1, new C.Nat(), new C.Pi(old, bout.value.type, bout.value.type)));
                })()); }],
        ], function () { return new utils_1.go(new C.The(bout.value.type, new C.RecNat(tgtout.value, new C.The(bout.value.type, bout.value.expr), sout.value))); });
    };
    synthesizer.synthIndNat = function (context, r, target, motive, base, step) {
        var tgtout = new utils_1.PerhapsM('tgtout');
        var motout = new utils_1.PerhapsM('motout');
        var motval = new utils_1.PerhapsM('motval');
        var bout = new utils_1.PerhapsM('bout');
        var sout = new utils_1.PerhapsM('sout');
        return (0, utils_1.goOn)([
            [tgtout, function () { return target.check(context, r, new V.Nat()); }],
            [motout, function () { return motive.check(context, r, new V.Pi('n', new V.Nat(), new utils_1.HigherOrderClosure(function (_) { return new V.Universe(); }))); }],
            [motval, function () { return new utils_1.go((0, context_1.valInContext)(context, motout.value)); }],
            [bout, function () { return base.check(context, r, (0, evaluator_1.doApp)(motval.value, new V.Zero())); }],
            [sout, function () { return step.check(context, r, new V.Pi('n-1', new V.Nat(), new utils_1.HigherOrderClosure(function (n_minus_1) {
                    return new V.Pi('x', (0, evaluator_1.doApp)(motval.value, n_minus_1), new utils_1.HigherOrderClosure(function (_) { return (0, evaluator_1.doApp)(motval.value, new V.Add1(n_minus_1)); }));
                }))); }],
        ], function () { return new utils_1.go(new C.The(new C.Application(motout.value, tgtout.value), new C.IndNat(tgtout.value, motout.value, bout.value, sout.value))); });
    };
    synthesizer.synthAtom = function (context, r) {
        return new utils_1.go(new C.The(new C.Universe(), new C.Atom()));
    };
    synthesizer.synthPair = function (context, r, first, second) {
        var a = (0, utils_1.fresh)(context, 'a');
        var Aout = new utils_1.PerhapsM('Aout');
        var Dout = new utils_1.PerhapsM('Dout');
        return (0, utils_1.goOn)([
            [Aout, function () { return first.check(context, r, new V.Universe()); }],
            [Dout, function () {
                    return second.check((0, context_1.bindFree)(context, a, (0, context_1.valInContext)(context, Aout.value)), r, new V.Universe());
                }],
        ], function () { return new utils_1.go(new C.The(new C.Universe(), new C.Sigma(a, Aout.value, Dout.value))); });
    };
    synthesizer.synthSigma = function (context, r, location, binders, body) {
        if (binders.length === 1) {
            var _a = [binders[0].binder, binders[0].type], bd_1 = _a[0], type_3 = _a[1];
            var xhat_3 = (0, utils_1.fresh)(context, bd_1.varName);
            var xloc_3 = bd_1.location;
            var Aout_5 = new utils_1.PerhapsM('Aout');
            var Dout_1 = new utils_1.PerhapsM('Dout');
            return (0, utils_1.goOn)([
                [Aout_5, function () { return type_3.check(context, r, new V.Universe()); }],
                [Dout_1, function () { return body.check((0, context_1.bindFree)(context, xhat_3, (0, context_1.valInContext)(context, Aout_5.value)), (0, utils_2.extendRenaming)(r, bd_1.varName, xhat_3), new V.Universe()); }],
            ], function () {
                (0, utils_2.PieInfoHook)(xloc_3, ['binding-site', Aout_5.value]);
                return new utils_1.go(new C.The(new C.Universe(), new C.Sigma(xhat_3, Aout_5.value, Dout_1.value)));
            });
        }
        else if (binders.length > 1) {
            var fst = binders[0], rest_3 = binders.slice(1);
            var _b = [fst.binder, fst.type], binder = _b[0], type_4 = _b[1];
            var xloc_4 = binder.location;
            var x_2 = binder.varName;
            var xhat_4 = (0, utils_1.fresh)(context, x_2);
            var Aout_6 = new utils_1.PerhapsM('Aout');
            var Dout_2 = new utils_1.PerhapsM('Dout');
            return (0, utils_1.goOn)([
                [Aout_6, function () { return type_4.check(context, r, new V.Universe()); }],
                [Dout_2, function () {
                        return new S.Sigma((0, locations_1.notForInfo)(location), rest_3, body).check((0, context_1.bindFree)(context, xhat_4, (0, context_1.valInContext)(context, Aout_6.value)), (0, utils_2.extendRenaming)(r, x_2, xhat_4), new V.Universe());
                    }
                ],
            ], function () {
                (0, utils_2.PieInfoHook)(xloc_4, ['binding-site', Aout_6.value]);
                return new utils_1.go(new C.The(new C.Universe(), new C.Sigma(xhat_4, Aout_6.value, Dout_2.value)));
            });
        }
        else {
            throw new Error('Invalid number of binders in Sigma type');
        }
    };
    synthesizer.synthCar = function (context, r, location, pair) {
        var pout = new utils_1.PerhapsM('p_rst');
        return (0, utils_1.goOn)([[pout, function () { return pair.synth(context, r); }]], function () {
            var val = (0, context_1.valInContext)(context, pout.value.type);
            if (val instanceof V.Sigma) {
                return new utils_1.go(new C.The(val.carType.readBackType(context), new C.Car(pout.value.expr)));
            }
            else {
                return new utils_1.stop(location, new utils_1.Message(["car requires a Pair type, but was used as a: ".concat(val, ".")]));
            }
        });
    };
    synthesizer.synthCdr = function (context, r, location, pair) {
        var pout = new utils_1.PerhapsM('pout');
        return (0, utils_1.goOn)([[pout, function () { return pair.synth(context, r); }]], function () {
            var val = (0, context_1.valInContext)(context, pout.value.type);
            if (val instanceof V.Sigma) {
                var _a = [val.carName, val.carType, val.cdrType], x = _a[0], A = _a[1], clos = _a[2];
                return new utils_1.go(new C.The(clos.valOfClosure((0, evaluator_1.doCar)((0, context_1.valInContext)(context, pout.value.expr))).readBackType(context), new C.Cdr(pout.value.expr)));
            }
            else {
                return new utils_1.stop(location, new utils_1.Message(["cdr requires a Pair type, but was used as a: ".concat(val, ".")]));
            }
        });
    };
    synthesizer.synthQuote = function (context, r, location, atom) {
        if ((0, utils_2.atomOk)(atom)) {
            return new utils_1.go(new C.The(new C.Atom(), new C.Quote(atom)));
        }
        else {
            return new utils_1.stop(location, new utils_1.Message(["Invalid atom: ".concat(atom, ". Atoms consist of letters and hyphens.")]));
        }
    };
    synthesizer.synthTrivial = function (context, r) {
        return new utils_1.go(new C.The(new C.Universe(), new C.Trivial()));
    };
    synthesizer.synthSole = function (context, r) {
        return new utils_1.go(new C.The(new C.Trivial(), new C.Sole()));
    };
    synthesizer.synthIndList = function (context, r, location, target, motive, base, step) {
        var tgtout = new utils_1.PerhapsM('tgtout');
        var motout = new utils_1.PerhapsM('motout');
        var motval = new utils_1.PerhapsM('motval');
        var bout = new utils_1.PerhapsM('bout');
        var sout = new utils_1.PerhapsM('sout');
        return (0, utils_1.goOn)([
            [tgtout, function () { return target.synth(context, r); }],
        ], (function () {
            var _a = [tgtout.value.type, tgtout.value.expr], tgt_t = _a[0], tgt_e = _a[1];
            var type = (0, context_1.valInContext)(context, tgt_t);
            if (type instanceof V.List) {
                var E_1 = type.entryType;
                return (0, utils_1.goOn)([
                    [
                        motout,
                        function () { return motive.check(context, r, new V.Pi('xs', new V.List(E_1), new utils_1.FirstOrderClosure((0, context_1.contextToEnvironment)(context), 'xs', new C.Universe()))); }
                    ],
                    [motval, function () { return new utils_1.go((0, context_1.valInContext)(context, motout.value)); }],
                    [bout, function () { return base.check(context, r, (0, evaluator_1.doApp)(motval.value, new V.Nil())); }],
                    [sout, function () { return step.check(context, r, new V.Pi('e', E_1, new utils_1.HigherOrderClosure(function (e) { return new V.Pi('es', new V.List(E_1), new utils_1.HigherOrderClosure(function (es) { return new V.Pi('ih', (0, evaluator_1.doApp)(motval.value, es), new utils_1.HigherOrderClosure(function (_) { return (0, evaluator_1.doApp)(motval.value, new V.ListCons(e, es)); })); })); }))); }],
                ], function () { return new utils_1.go(new C.The(new C.Application(motout.value, tgt_e), new C.IndList(tgt_e, motout.value, bout.value, sout.value))); });
            }
            else {
                return new utils_1.stop(location, new utils_1.Message(["Not a List: ".concat(type.readBackType(context), ".")]));
            }
        }));
    };
    synthesizer.synthRecList = function (context, r, location, target, base, step) {
        var tgtout = new utils_1.PerhapsM('tgtout');
        return (0, utils_1.goOn)([[tgtout, function () { return target.synth(context, r); }]], function () {
            var _a = [tgtout.value.type, tgtout.value.expr], tgt_t = _a[0], tgt_e = _a[1];
            var type = (0, context_1.valInContext)(context, tgt_t);
            if (type instanceof V.List) {
                var E_2 = type.entryType;
                var bout_1 = new utils_1.PerhapsM('bout');
                var btval_1 = new utils_1.PerhapsM('btval');
                var sout_1 = new utils_1.PerhapsM('sout');
                return (0, utils_1.goOn)([
                    [bout_1, function () { return base.synth(context, r); }],
                    [btval_1, function () { return new utils_1.go((0, context_1.valInContext)(context, bout_1.value.type)); }],
                    [sout_1, function () {
                            return step.check(context, r, new V.Pi('e', E_2, new utils_1.HigherOrderClosure(function (_) { return new V.Pi('es', new V.List(E_2), new utils_1.HigherOrderClosure(function (_) { return new V.Pi('ih', btval_1.value, new utils_1.HigherOrderClosure(function (_) { return btval_1.value; })); })); })));
                        }
                    ],
                ], function () { return new utils_1.go(new C.The(bout_1.value.type, new C.RecList(tgt_e, new C.The(bout_1.value.type, bout_1.value.expr), sout_1.value))); });
            }
            else {
                return new utils_1.stop(location, new utils_1.Message(["Not a List: ".concat(type.readBackType(context), ".")]));
            }
        });
    };
    synthesizer.synthList = function (context, r, e) {
        var Eout = new utils_1.PerhapsM('Eout');
        return (0, utils_1.goOn)([[Eout, function () { return e.entryType.check(context, r, new V.Universe()); }]], function () { return new utils_1.go(new C.The(new C.Universe(), new C.List(Eout.value))); });
    };
    synthesizer.synthListCons = function (context, r, x, xs) {
        var fstout = new utils_1.PerhapsM('eout');
        var restout = new utils_1.PerhapsM('esout');
        return (0, utils_1.goOn)([
            [fstout, function () { return x.synth(context, r); }],
            [restout, function () {
                    return xs.check(context, r, (0, context_1.valInContext)(context, new C.List(fstout.value.type)));
                }
            ],
        ], function () { return new utils_1.go(new C.The(new C.List(fstout.value.type), new C.ListCons(fstout.value.expr, restout.value))); });
    };
    synthesizer.synthAbsurd = function (context, r, e) {
        return new utils_1.go(new C.The(new C.Universe(), new C.Absurd()));
    };
    synthesizer.synthIndAbsurd = function (context, r, e) {
        var tgtout = new utils_1.PerhapsM('tgtout');
        var motout = new utils_1.PerhapsM('motout');
        return (0, utils_1.goOn)([
            [tgtout, function () { return e.target.check(context, r, new V.Absurd()); }],
            [motout, function () { return e.motive.check(context, r, new V.Universe()); }],
        ], function () { return new utils_1.go(new C.The(motout.value, new C.IndAbsurd(tgtout.value, motout.value))); });
    };
    synthesizer.synthEqual = function (context, r, type, left, right) {
        var Aout = new utils_1.PerhapsM('Aout');
        var Av = new utils_1.PerhapsM('Av');
        var from_out = new utils_1.PerhapsM('from_out');
        var to_out = new utils_1.PerhapsM('to_out');
        return (0, utils_1.goOn)([
            [Aout, function () { return type.check(context, r, new V.Universe()); }],
            [Av, function () { return new utils_1.go((0, context_1.valInContext)(context, Aout.value)); }],
            [from_out, function () { return left.check(context, r, Av.value); }],
            [to_out, function () { return right.check(context, r, Av.value); }],
        ], function () { return new utils_1.go(new C.The(new C.Universe(), new C.Equal(Aout.value, from_out.value, to_out.value))); });
    };
    synthesizer.synthReplace = function (context, r, location, target, motive, base) {
        var tgtout = new utils_1.PerhapsM('tgt_rst');
        var motout = new utils_1.PerhapsM('motout');
        var bout = new utils_1.PerhapsM('bout');
        return (0, utils_1.goOn)([[tgtout, function () { return target.synth(context, r); }]], function () {
            var result = (0, context_1.valInContext)(context, tgtout.value.type);
            if (result instanceof V.Equal) {
                var _a = [result.type, result.from, result.to], Av_1 = _a[0], fromv_1 = _a[1], tov_1 = _a[2];
                return (0, utils_1.goOn)([
                    [motout, function () {
                            return motive.check(context, r, new V.Pi('x', Av_1, new utils_1.HigherOrderClosure(function (_) { return new V.Universe(); })));
                        }
                    ],
                    [bout, function () { return base.check(context, r, (0, evaluator_1.doApp)((0, context_1.valInContext)(context, motout.value), fromv_1)); }],
                ], function () { return new utils_1.go(new C.The(((0, evaluator_1.doApp)((0, context_1.valInContext)(context, motout.value), tov_1)).readBackType(context), new C.Replace(tgtout.value.expr, motout.value, bout.value))); });
            }
            else {
                return new utils_1.stop(location, new utils_1.Message(["Expected an expression with = type, but the type was: ".concat(tgtout.value.type, ".")]));
            }
        });
    };
    synthesizer.synthTrans = function (context, r, location, left, right) {
        var lout = new utils_1.PerhapsM('p1_rst');
        var rout = new utils_1.PerhapsM('p2_rst');
        return (0, utils_1.goOn)([
            [lout, function () { return left.synth(context, r); }],
            [rout, function () { return right.synth(context, r); }],
        ], function () {
            var result1 = (0, context_1.valInContext)(context, lout.value.type);
            var result2 = (0, context_1.valInContext)(context, rout.value.type);
            if (result1 instanceof V.Equal && result2 instanceof V.Equal) {
                var _a = [result1.type, result1.from, result1.to], Av_2 = _a[0], fromv_2 = _a[1], midv_1 = _a[2];
                var _b = [result2.type, result2.from, result2.to], Bv_1 = _b[0], midv2_1 = _b[1], tov_2 = _b[2];
                return (0, utils_1.goOn)([
                    [new utils_1.PerhapsM("_"), function () { return (0, utils_2.sameType)(context, location, Av_2, Bv_1); }],
                    [new utils_1.PerhapsM("_"), function () { return (0, utils_2.convert)(context, location, Av_2, midv_1, midv2_1); }],
                ], function () { return new utils_1.go(new C.The(new V.Equal(Av_2, fromv_2, tov_2).readBackType(context), new C.Trans(lout.value.expr, rout.value.expr))); });
            }
            else {
                return new utils_1.stop(location, new utils_1.Message(["Expected =, got ".concat(result1, " and ").concat(result2, ".")]));
            }
        });
    };
    synthesizer.synthCong = function (context, r, location, base, fun) {
        var bout = new utils_1.PerhapsM('bout');
        var fout = new utils_1.PerhapsM('f_rst');
        return (0, utils_1.goOn)([
            [bout, function () { return base.synth(context, r); }],
            [fout, function () { return fun.synth(context, r); }],
        ], function () {
            var result1 = (0, context_1.valInContext)(context, bout.value.type);
            var result2 = (0, context_1.valInContext)(context, fout.value.type);
            if (result1 instanceof V.Equal) {
                var _a = [result1.type, result1.from, result1.to], Av_3 = _a[0], fromv_3 = _a[1], tov_3 = _a[2];
                if (result2 instanceof V.Pi) {
                    var _b = [result2.argName, result2.argType, result2.resultType], x = _b[0], Bv_2 = _b[1], c_1 = _b[2];
                    var ph = new utils_1.PerhapsM('ph');
                    var Cv_1 = new utils_1.PerhapsM('Cv');
                    var fv_1 = new utils_1.PerhapsM('fv');
                    return (0, utils_1.goOn)([
                        [ph, function () { return (0, utils_2.sameType)(context, location, Av_3, Bv_2); }],
                        [Cv_1, function () { return new utils_1.go(c_1.valOfClosure(fromv_3)); }],
                        [fv_1, function () { return new utils_1.go((0, context_1.valInContext)(context, fout.value.expr)); }],
                    ], function () { return new utils_1.go(new C.The(new C.Equal(Cv_1.value.readBackType(context), (0, utils_3.readBack)(context, Cv_1.value, (0, evaluator_1.doApp)(fv_1.value, fromv_3)), (0, utils_3.readBack)(context, Cv_1.value, (0, evaluator_1.doApp)(fv_1.value, tov_3))), new C.Cong(bout.value.expr, Cv_1.value.readBackType(context), fout.value.expr))); });
                }
                else {
                    return new utils_1.stop(location, new utils_1.Message(["Expected a function type, got ".concat(result2.readBackType(context), ".")]));
                }
            }
            else {
                return new utils_1.stop(location, new utils_1.Message(["Expected an = type, got ".concat(result1.readBackType(context), ".")]));
            }
        });
    };
    synthesizer.synthSymm = function (context, r, location, eq) {
        var eout = new utils_1.PerhapsM('eout');
        return (0, utils_1.goOn)([[eout, function () { return eq.synth(context, r); }]], function () {
            var result = (0, context_1.valInContext)(context, eout.value.type);
            if (result instanceof V.Equal) {
                var _a = [result.type, result.from, result.to], Av = _a[0], fromv = _a[1], tov = _a[2];
                return new utils_1.go(new C.The((new V.Equal(Av, tov, fromv)).readBackType(context), new C.Symm(eout.value.expr)));
            }
            else {
                return new utils_1.stop(location, new utils_1.Message(["Expected an = type, got ".concat(result.readBackType(context), ".")]));
            }
        });
    };
    synthesizer.synthIndEqual = function (context, r, location, target, motive, base) {
        var tgtout = new utils_1.PerhapsM('tgtout');
        var motout = new utils_1.PerhapsM('motout');
        var motv = new utils_1.PerhapsM('motv');
        var baseout = new utils_1.PerhapsM('baseout');
        return (0, utils_1.goOn)([[tgtout, function () { return target.synth(context, r); }]], function () {
            var result = (0, context_1.valInContext)(context, tgtout.value.type);
            if (result instanceof V.Equal) {
                var _a = [result.type, result.from, result.to], Av_4 = _a[0], fromv_4 = _a[1], tov_4 = _a[2];
                return (0, utils_1.goOn)([
                    [motout, function () {
                            return motive.check(context, r, new V.Pi('to', Av_4, new utils_1.HigherOrderClosure(function (to) { return new V.Pi('p', new V.Equal(Av_4, fromv_4, to), new utils_1.HigherOrderClosure(function (_) { return new V.Universe(); })); })));
                        }
                    ],
                    [motv, function () { return new utils_1.go((0, context_1.valInContext)(context, motout.value)); }],
                    [baseout, function () {
                            return base.check(context, r, (0, evaluator_1.doApp)((0, evaluator_1.doApp)(motv.value, fromv_4), new V.Same(fromv_4)));
                        }
                    ],
                ], function () { return new utils_1.go(new C.The((0, evaluator_1.doApp)((0, evaluator_1.doApp)(motv.value, tov_4), (0, context_1.valInContext)(context, tgtout.value.expr)).readBackType(context), new C.IndEqual(tgtout.value.expr, motout.value, baseout.value))); });
            }
            else {
                return new utils_1.stop(location, new utils_1.Message(["Expected evidence of equality, got ".concat(result.readBackType(context), ".")]));
            }
        });
    };
    synthesizer.synthVec = function (context, r, type, len) {
        var tout = new utils_1.PerhapsM('tout');
        var lenout = new utils_1.PerhapsM('lenout');
        return (0, utils_1.goOn)([
            [tout, function () { return type.check(context, r, new V.Universe()); }],
            [lenout, function () { return len.check(context, r, new V.Nat()); }],
        ], function () { return new utils_1.go(new C.The(new C.Universe(), new C.Vec(tout.value, lenout.value))); });
    };
    synthesizer.synthHead = function (context, r, location, vec) {
        var vout = new utils_1.PerhapsM('vout');
        return (0, utils_1.goOn)([[vout, function () { return vec.synth(context, r); }]], function () {
            var result = (0, context_1.valInContext)(context, vout.value.type).now();
            if (result instanceof V.Vec) {
                var _a = [result.entryType, result.length], T = _a[0], len = _a[1];
                var lenNow = len.now();
                if (lenNow instanceof V.Add1) {
                    return new utils_1.go(new C.The(T.readBackType(context), new C.Head(vout.value.expr)));
                }
                else {
                    return new utils_1.stop(location, new utils_1.Message(["Expected a Vec with add1 at the top of the length, got ".concat((0, utils_3.readBack)(context, new V.Nat(), len), ".")]));
                }
            }
            else {
                return new utils_1.stop(location, new utils_1.Message(["Expected a Vec, got ".concat(result.readBackType(context), ".")]));
            }
        });
    };
    synthesizer.synthTail = function (context, r, location, vec) {
        var vout = new utils_1.PerhapsM('vout');
        return (0, utils_1.goOn)([[vout, function () { return vec.synth(context, r); }]], function () {
            var result = (0, context_1.valInContext)(context, vout.value.type).now();
            if (result instanceof V.Vec) {
                var _a = [result.entryType, result.length], T = _a[0], len = _a[1];
                var lenNow = len.now();
                if (lenNow instanceof V.Add1) {
                    var len_minus_1 = lenNow.smaller;
                    return new utils_1.go(new C.The(new C.Vec(T.readBackType(context), (0, utils_3.readBack)(context, new V.Nat(), len_minus_1)), new C.Tail(vout.value.expr)));
                }
                else {
                    return new utils_1.stop(location, new utils_1.Message(["Expected a Vec with add1 at the top of the length, got ".concat((0, utils_3.readBack)(context, new V.Nat(), len), ".")]));
                }
            }
            else {
                return new utils_1.stop(location, new utils_1.Message(["Expected a Vec, got ".concat(result.readBackType(context), ".")]));
            }
        });
    };
    synthesizer.synthIndVec = function (context, r, location, length, target, motive, base, step) {
        var lenout = new utils_1.PerhapsM('lenout');
        var lenv = new utils_1.PerhapsM('lenv');
        var vecout = new utils_1.PerhapsM('vecout');
        var motout = new utils_1.PerhapsM('motout');
        var motval = new utils_1.PerhapsM('motval');
        var bout = new utils_1.PerhapsM('bout');
        var sout = new utils_1.PerhapsM('sout');
        return (0, utils_1.goOn)([
            [lenout, function () { return length.check(context, r, new V.Nat()); }],
            [lenv, function () { return new utils_1.go((0, context_1.valInContext)(context, lenout.value)); }],
            [vecout, function () { return target.synth(context, r); }],
        ], function () {
            var result = (0, context_1.valInContext)(context, vecout.value.type);
            if (result instanceof V.Vec) {
                var _a = [result.entryType, result.length], E_3 = _a[0], len2v_1 = _a[1];
                return (0, utils_1.goOn)([
                    [new utils_1.PerhapsM('_'), function () { return (0, utils_2.convert)(context, location, new V.Nat(), lenv.value, len2v_1); }],
                    [motout, function () { return motive.check(context, r, new V.Pi('k', new V.Nat(), new utils_1.HigherOrderClosure(function (k) { return new V.Pi('es', new V.Vec(E_3, k), new utils_1.HigherOrderClosure(function (_) { return new V.Universe(); })); }))); }],
                    [motval, function () { return new utils_1.go((0, context_1.valInContext)(context, motout.value)); }],
                    [bout, function () { return base.check(context, r, (0, evaluator_1.doApp)((0, evaluator_1.doApp)(motval.value, new V.Zero()), new V.VecNil())); }],
                    [sout, function () { return step.check(context, r, (0, evaluator_1.indVecStepType)(E_3, motval.value)); }],
                ], function () { return new utils_1.go(new C.The(new C.Application(new C.Application(motout.value, lenout.value), vecout.value.expr), new C.IndVec(lenout.value, vecout.value.expr, motout.value, bout.value, sout.value))); });
            }
            else {
                return new utils_1.stop(location, new utils_1.Message(["Expected a Vec, got ".concat(result.readBackType(context), ".")]));
            }
        });
    };
    synthesizer.synthEither = function (context, r, left, right) {
        var Lout = new utils_1.PerhapsM('Lout');
        var Rout = new utils_1.PerhapsM('Rout');
        return (0, utils_1.goOn)([
            [Lout, function () { return left.check(context, r, new V.Universe()); }],
            [Rout, function () { return right.check(context, r, new V.Universe()); }],
        ], function () { return new utils_1.go(new C.The(new C.Universe(), new C.Either(Lout.value, Rout.value))); });
    };
    synthesizer.synthIndEither = function (context, r, location, target, motive, baseLeft, baseRight) {
        var tgtout = new utils_1.PerhapsM('tgtout');
        var motout = new utils_1.PerhapsM('motout');
        var motval = new utils_1.PerhapsM('motval');
        var lout = new utils_1.PerhapsM('lout');
        var rout = new utils_1.PerhapsM('rout');
        return (0, utils_1.goOn)([[tgtout, function () { return target.synth(context, r); }]], function () {
            var result = (0, context_1.valInContext)(context, tgtout.value.type);
            if (result instanceof V.Either) {
                var _a = [result.leftType, result.rightType], Lv_1 = _a[0], Rv_1 = _a[1];
                return (0, utils_1.goOn)([
                    [motout, function () {
                            return motive.check(context, r, new V.Pi('x', new V.Either(Lv_1, Rv_1), new utils_1.HigherOrderClosure(function (_) { return new V.Universe(); })));
                        }
                    ],
                    [motval, function () { return new utils_1.go((0, context_1.valInContext)(context, motout.value)); }],
                    [lout, function () { return baseLeft.check(context, r, new V.Pi('x', Lv_1, new utils_1.HigherOrderClosure(function (x) { return (0, evaluator_1.doApp)(motval.value, new V.Left(x)); }))); }],
                    [rout, function () { return baseRight.check(context, r, new V.Pi('x', Rv_1, new utils_1.HigherOrderClosure(function (x) { return (0, evaluator_1.doApp)(motval.value, new V.Right(x)); }))); }],
                ], function () { return new utils_1.go(new C.The(new C.Application(motout.value, tgtout.value.expr), new C.IndEither(tgtout.value.expr, motout.value, lout.value, rout.value))); });
            }
            else {
                return new utils_1.stop(location, new utils_1.Message(["Expected an Either, but got a ".concat(result.readBackType(context), ".")]));
            }
        });
    };
    synthesizer.synthThe = function (context, r, type, value) {
        var tout = new utils_1.PerhapsM('t_out');
        var eout = new utils_1.PerhapsM('e_out');
        return (0, utils_1.goOn)([
            [tout, function () { return type.isType(context, r); }],
            [eout, function () { return value.check(context, r, (0, context_1.valInContext)(context, tout.value)); }],
        ], function () { return new utils_1.go(new C.The(tout.value, eout.value)); });
    };
    synthesizer.synthApplication = function (context, r, location, fun, arg, args) {
        if (args.length === 0) {
            var fout_1 = new utils_1.PerhapsM('fout');
            return (0, utils_1.goOn)([[fout_1, function () { return fun.synth(context, r); }]], function () {
                var result = (0, context_1.valInContext)(context, fout_1.value.type);
                if (result instanceof V.Pi) {
                    var _a = [result.argName, result.argType, result.resultType], _ = _a[0], A_1 = _a[1], c_2 = _a[2];
                    var argout_1 = new utils_1.PerhapsM('argout');
                    return (0, utils_1.goOn)([[argout_1, function () { return arg.check(context, r, A_1); }]], function () {
                        return new utils_1.go(new C.The(c_2.valOfClosure((0, context_1.valInContext)(context, argout_1.value)).readBackType(context), new C.Application(fout_1.value.expr, argout_1.value)));
                    });
                }
                else {
                    return new utils_1.stop(location, new utils_1.Message(["Not a function type: ".concat(result.readBackType(context), ".")]));
                }
            });
        }
        else {
            var appout_1 = new utils_1.PerhapsM('appout');
            return (0, utils_1.goOn)([[appout_1, function () { return (new S.Application((0, locations_1.notForInfo)(location), fun, arg, args.slice(0, args.length - 1))).synth(context, r); }]], function () {
                var result = (0, context_1.valInContext)(context, appout_1.value.type);
                if (result instanceof V.Pi) {
                    var _a = [result.argName, result.argType, result.resultType], x = _a[0], A_2 = _a[1], c_3 = _a[2];
                    var argout_2 = new utils_1.PerhapsM('fout');
                    return (0, utils_1.goOn)([[argout_2, function () { return args[args.length - 1].check(context, r, A_2); }]], function () { return new utils_1.go(new C.The(c_3.valOfClosure((0, context_1.valInContext)(context, argout_2.value)).readBackType(context), new C.Application(appout_1.value.expr, argout_2.value))); });
                }
                else {
                    return new utils_1.stop(location, new utils_1.Message(["Not a function type: ".concat(result.readBackType(context), ".")]));
                }
            });
        }
    };
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
    synthesizer.synthName = function (context, r, location, name) {
        var real_x = (0, utils_2.rename)(r, name);
        var x_tv = new utils_1.PerhapsM('x_tv');
        return (0, utils_1.goOn)([[x_tv, function () { return (0, context_1.varType)(context, location, real_x); }]], function () {
            var result = context.get(real_x);
            if (result instanceof context_1.Define) {
                (0, utils_2.PieInfoHook)(location, 'definition');
            }
            return new utils_1.go(new C.The(x_tv.value.readBackType(context), new C.VarName(real_x)));
        });
    };
    synthesizer.synthNumber = function (context, r, location, value) {
        if (value === 0) {
            return new utils_1.go(new C.The(new C.Nat(), new C.Zero()));
        }
        else if (value > 0) {
            var n_minus_1_out_1 = new utils_1.PerhapsM('n_1_out');
            return (0, utils_1.goOn)([[n_minus_1_out_1, function () { return (new S.Number(location, value - 1)).check(context, r, new V.Nat()); }]], function () { return new utils_1.go(new C.The(new C.Nat(), new C.Add1(n_minus_1_out_1.value))); });
        }
        else {
            return new utils_1.stop(location, new utils_1.Message(["Expected a positive number, got ".concat(value, ".")]));
        }
    };
    return synthesizer;
}());
exports.synthesizer = synthesizer;
