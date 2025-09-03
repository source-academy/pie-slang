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
exports.represent = represent;
exports.normType = normType;
exports.checkSame = checkSame;
const C = __importStar(require("../types/core"));
const context_1 = require("../utils/context");
const utils_1 = require("../types/utils");
const utils_2 = require("../evaluator/utils");
const utils_3 = require("./utils");
/**
 * Represent the expression in the context.
 */
function represent(ctx, expr) {
    const outmeta = new utils_1.PerhapsM('outmeta');
    return (0, utils_1.goOn)([[outmeta, () => expr.synth(ctx, new Map())]], () => {
        const tv = (0, context_1.valInContext)(ctx, outmeta.value.type);
        const v = (0, context_1.valInContext)(ctx, outmeta.value.expr);
        return new utils_1.go(new C.The(tv.readBackType(ctx), (0, utils_2.readBack)(ctx, tv, v)));
    });
}
function normType(ctx, src) {
    const eout = new utils_1.PerhapsM('eout');
    return (0, utils_1.goOn)([[eout, () => src.isType(ctx, new Map())]], () => {
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
    const typeOut = new utils_1.PerhapsM('tOut');
    const typeValue = new utils_1.PerhapsM('tv');
    const leftOut = new utils_1.PerhapsM('aOut');
    const rightOut = new utils_1.PerhapsM('bOut');
    const leftValue = new utils_1.PerhapsM('av');
    const rightValue = new utils_1.PerhapsM('bv');
    return (0, utils_1.goOn)([
        [typeOut, () => t.isType(ctx, new Map())],
        [typeValue, () => (0, context_1.valInContext)(ctx, typeOut.value).readBackType(ctx)],
        [leftOut, () => a.check(ctx, new Map(), typeValue.value)],
        [rightOut, () => b.check(ctx, new Map(), typeValue.value)],
        [leftValue, () => (0, context_1.valInContext)(ctx, leftOut.value)],
        [rightValue, () => (0, context_1.valInContext)(ctx, rightOut.value)]
    ], () => {
        return (0, utils_3.convert)(ctx, where, typeValue.value, leftValue.value, rightValue.value);
    });
}
//# sourceMappingURL=represent.js.map