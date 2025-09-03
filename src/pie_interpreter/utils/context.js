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
exports.Free = exports.Define = exports.Claim = exports.Binder = exports.initCtx = void 0;
exports.extendContext = extendContext;
exports.valInContext = valInContext;
exports.readBackContext = readBackContext;
exports.nameNotUsed = nameNotUsed;
exports.getClaim = getClaim;
exports.addClaimToContext = addClaimToContext;
exports.removeClaimFromContext = removeClaimFromContext;
exports.addDefineToContext = addDefineToContext;
exports.contextToEnvironment = contextToEnvironment;
exports.varType = varType;
exports.bindFree = bindFree;
exports.bindVal = bindVal;
exports.isSerializableContext = isSerializableContext;
var C = require("../types/core");
var value_1 = require("../types/value");
var utils_1 = require("../types/utils");
var utils_2 = require("../evaluator/utils");
var neutral_1 = require("../types/neutral");
function extendContext(ctx, name, binder) {
    return new Map(__spreadArray(__spreadArray([], ctx, true), [[name, binder]], false));
}
/*
  Find the value of an expression in the environment that
  corresponds to a context.
*/
function valInContext(ctx, expr) {
    return expr.valOf(contextToEnvironment(ctx));
}
function readBackContext(ctx) {
    var result = new Map();
    for (var _i = 0, ctx_1 = ctx; _i < ctx_1.length; _i++) {
        var _a = ctx_1[_i], x = _a[0], binder = _a[1];
        if (binder instanceof Free) {
            result.set(x, ['free', binder.type.readBackType(ctx)]);
        }
        else if (binder instanceof Define) {
            result.set(x, ['def',
                binder.type.readBackType(ctx),
                (0, utils_2.readBack)(ctx, binder.type, binder.value)
            ]);
        }
        else if (binder instanceof Claim) {
            result.set(x, ['claim', binder.type.readBackType(ctx)]);
        }
    }
    return result;
}
function nameNotUsed(ctx, where, name) {
    if (ctx.has(name)) {
        return new utils_1.stop(where, new utils_1.Message(["The name \"".concat(name, "\" is already in use in the context.")]));
    }
    else
        return new utils_1.go(true);
}
function getClaim(ctx, where, name) {
    for (var _i = 0, ctx_2 = ctx; _i < ctx_2.length; _i++) {
        var _a = ctx_2[_i], x = _a[0], binder = _a[1];
        if (x === name) {
            if (binder instanceof Define) {
                return new utils_1.stop(where, new utils_1.Message(["The name \"".concat(name, "\" is already defined.")]));
            }
            else if (binder instanceof Claim) {
                return new utils_1.go(binder.type);
            }
        }
    }
    return new utils_1.stop(where, new utils_1.Message(["No claim: ".concat(name)]));
}
function addClaimToContext(ctx, fun, funLoc, type) {
    var typeOut = new utils_1.PerhapsM("typeOut");
    return (0, utils_1.goOn)([
        [new utils_1.PerhapsM("_"), function () { return nameNotUsed(ctx, funLoc, fun); }],
        [typeOut, function () { return type.isType(ctx, new Map()); }]
    ], function () { return new utils_1.go(extendContext(ctx, fun, new Claim(valInContext(ctx, typeOut.value)))); });
}
function removeClaimFromContext(ctx, name) {
    ctx.delete(name);
    return ctx;
}
function addDefineToContext(ctx, fun, funLoc, expr) {
    var typeOut = new utils_1.PerhapsM("typeOut");
    var exprOut = new utils_1.PerhapsM("exprOut");
    return (0, utils_1.goOn)([
        [typeOut, function () { return getClaim(ctx, funLoc, fun); }],
        [exprOut,
            function () { return expr.check(ctx, new Map(), typeOut.value); }
        ]
    ], function () { return new utils_1.go(bindVal(removeClaimFromContext(ctx, fun), fun, typeOut.value, valInContext(ctx, exprOut.value))); });
}
function contextToEnvironment(ctx) {
    if (ctx.size === 0) {
        return new Map();
    }
    var bindings = ctx.entries();
    var env = new Map();
    for (var _i = 0, bindings_1 = bindings; _i < bindings_1.length; _i++) {
        var _a = bindings_1[_i], name_1 = _a[0], binder = _a[1];
        if (binder instanceof Define) {
            env.set(name_1, binder.value);
        }
        else if (binder instanceof Free) {
            env.set(name_1, new value_1.Neutral(binder.type, new neutral_1.Variable(name_1)));
        } // else continue;
    }
    return env;
}
exports.initCtx = new Map();
// There are three kinds of binders: a free binder represents a free
// variable, that was bound in some larger context by λ, Π, or Σ. A
// def binder represents a name bound by define. A claim binder
// doesn't actually bind a name; however, it reserves the name for
// later definition with define and records the type that will be
// used.
var Binder = /** @class */ (function () {
    function Binder() {
    }
    return Binder;
}());
exports.Binder = Binder;
var Claim = /** @class */ (function (_super) {
    __extends(Claim, _super);
    function Claim(type) {
        var _this = _super.call(this) || this;
        _this.type = type;
        return _this;
    }
    return Claim;
}(Binder));
exports.Claim = Claim;
var Define = /** @class */ (function (_super) {
    __extends(Define, _super);
    function Define(type, value) {
        var _this = _super.call(this) || this;
        _this.type = type;
        _this.value = value;
        return _this;
    }
    return Define;
}(Binder));
exports.Define = Define;
var Free = /** @class */ (function (_super) {
    __extends(Free, _super);
    function Free(type) {
        var _this = _super.call(this) || this;
        _this.type = type;
        return _this;
    }
    return Free;
}(Binder));
exports.Free = Free;
function varType(ctx, where, x) {
    if (ctx.size === 0) {
        throw new Error("The context ".concat(JSON.stringify(ctx), " is empty, but we are looking for ").concat(x));
    }
    for (var _i = 0, _a = ctx.entries(); _i < _a.length; _i++) {
        var _b = _a[_i], y = _b[0], binder = _b[1];
        if (binder instanceof Claim) {
            continue;
        }
        else if (x === y) {
            return new utils_1.go(binder.type);
        }
    }
    throw new Error("Unknown variable ".concat(x));
}
// Function to bind a free variable in a context
function bindFree(ctx, varName, tv) {
    if (ctx.has(varName)) {
        // CHANGE: REMOVE ctx LOOP AFTER FIXING THE BUG
        for (var _i = 0, ctx_3 = ctx; _i < ctx_3.length; _i++) {
            var _a = ctx_3[_i], x = _a[0], binder = _a[1];
            if (x === varName) {
                //console.log(`binding ${varName} to ${binder}`);
                return extendContext(ctx, varName, new Free(tv));
            }
        }
        throw new Error("\n      ".concat(varName, " is already bound in ").concat(JSON.stringify(ctx), "\n    "));
    }
    return extendContext(ctx, varName, new Free(tv));
}
// Function to bind a value in a context
function bindVal(ctx, varName, type, value) {
    return extendContext(ctx, varName, new Define(type, value));
}
// Predicate to check if something is a serializable context
function isSerializableContext(ctx) {
    return ctx instanceof Map && Array.from(ctx.values()).every(function (value) {
        return Array.isArray(value) &&
            ((value[0] === 'free' && value[1] instanceof C.Core)
                ||
                    (value[0] === 'def' && value[1] instanceof C.Core && value[2] instanceof C.Core)
                ||
                    (value[0] === 'claim' && value[2] instanceof C.Core));
    });
}
