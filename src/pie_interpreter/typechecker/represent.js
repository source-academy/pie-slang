"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.represent = represent;
exports.normType = normType;
exports.checkSame = checkSame;
var C = require("../types/core");
var context_1 = require("../utils/context");
var utils_1 = require("../types/utils");
var utils_2 = require("../evaluator/utils");
var utils_3 = require("./utils");
/**
 * Represent the expression in the context.
 */
function represent(ctx, expr) {
    var outmeta = new utils_1.PerhapsM('outmeta');
    return (0, utils_1.goOn)([[outmeta, function () { return expr.synth(ctx, new Map()); }]], function () {
        var tv = (0, context_1.valInContext)(ctx, outmeta.value.type);
        var v = (0, context_1.valInContext)(ctx, outmeta.value.expr);
        return new utils_1.go(new C.The(tv.readBackType(ctx), (0, utils_2.readBack)(ctx, tv, v)));
    });
}
function normType(ctx, src) {
    var eout = new utils_1.PerhapsM('eout');
    return (0, utils_1.goOn)([[eout, function () { return src.isType(ctx, new Map()); }]], function () {
        return new utils_1.go((0, context_1.valInContext)(ctx, eout.value).readBackType(ctx));
    });
}
// (: check-same (-> Ctx Loc Src Src Src (Perhaps Void)))
// (define (check-same Γ loc t a b)
//   (go-on ((t-out (is-type Γ '() t))
//           (tv (go (val-in-ctx Γ t-out)))
//           (a-out (check Γ '() a tv))
//           (b-out (check Γ '() b tv))
//           (av (go (val-in-ctx Γ a-out)))
//           (bv (go (val-in-ctx Γ b-out))))
//     (convert Γ loc tv av bv)))
function checkSame(ctx, where, t, a, b) {
    var typeOut = new utils_1.PerhapsM('tOut');
    var typeValue = new utils_1.PerhapsM('tv');
    var leftOut = new utils_1.PerhapsM('aOut');
    var rightOut = new utils_1.PerhapsM('bOut');
    var leftValue = new utils_1.PerhapsM('av');
    var rightValue = new utils_1.PerhapsM('bv');
    return (0, utils_1.goOn)([
        [typeOut, function () { return t.isType(ctx, new Map()); }],
        [typeValue, function () { return (0, context_1.valInContext)(ctx, typeOut.value).readBackType(ctx); }],
        [leftOut, function () { return a.check(ctx, new Map(), typeValue.value); }],
        [rightOut, function () { return b.check(ctx, new Map(), typeValue.value); }],
        [leftValue, function () { return (0, context_1.valInContext)(ctx, leftOut.value); }],
        [rightValue, function () { return (0, context_1.valInContext)(ctx, rightOut.value); }]
    ], function () {
        return (0, utils_3.convert)(ctx, where, typeValue.value, leftValue.value, rightValue.value);
    });
}
