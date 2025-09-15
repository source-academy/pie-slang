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
const C = __importStar(require("../types/core"));
const value_1 = require("../types/value");
const utils_1 = require("../types/utils");
const utils_2 = require("../evaluator/utils");
const neutral_1 = require("../types/neutral");
function extendContext(ctx, name, binder) {
    return new Map([...ctx, [name, binder]]);
}
/*
  Find the value of an expression in the environment that
  corresponds to a context.
*/
function valInContext(ctx, expr) {
    return expr.valOf(contextToEnvironment(ctx));
}
function readBackContext(ctx) {
    const result = new Map();
    for (const [x, binder] of ctx) {
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
        return new utils_1.stop(where, new utils_1.Message([`The name "${name}" is already in use in the context.`]));
    }
    else
        return new utils_1.go(true);
}
function getClaim(ctx, where, name) {
    for (const [x, binder] of ctx) {
        if (x === name) {
            if (binder instanceof Define) {
                return new utils_1.stop(where, new utils_1.Message([`The name "${name}" is already defined.`]));
            }
            else if (binder instanceof Claim) {
                return new utils_1.go(binder.type);
            }
        }
    }
    return new utils_1.stop(where, new utils_1.Message([`No claim: ${name}`]));
}
function addClaimToContext(ctx, fun, funLoc, type) {
    const typeOut = new utils_1.PerhapsM("typeOut");
    return (0, utils_1.goOn)([
        [new utils_1.PerhapsM("_"), () => nameNotUsed(ctx, funLoc, fun)],
        [typeOut, () => type.isType(ctx, new Map())]
    ], () => new utils_1.go(extendContext(ctx, fun, new Claim(valInContext(ctx, typeOut.value)))));
}
function removeClaimFromContext(ctx, name) {
    ctx.delete(name);
    return ctx;
}
function addDefineToContext(ctx, fun, funLoc, expr) {
    const typeOut = new utils_1.PerhapsM("typeOut");
    const exprOut = new utils_1.PerhapsM("exprOut");
    return (0, utils_1.goOn)([
        [typeOut, () => getClaim(ctx, funLoc, fun)],
        [exprOut,
            () => expr.check(ctx, new Map(), typeOut.value)
        ]
    ], () => new utils_1.go(bindVal(removeClaimFromContext(ctx, fun), fun, typeOut.value, valInContext(ctx, exprOut.value))));
}
function contextToEnvironment(ctx) {
    if (ctx.size === 0) {
        return new Map();
    }
    const bindings = ctx.entries();
    const env = new Map();
    for (const [name, binder] of bindings) {
        if (binder instanceof Define) {
            env.set(name, binder.value);
        }
        else if (binder instanceof Free) {
            env.set(name, new value_1.Neutral(binder.type, new neutral_1.Variable(name)));
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
class Binder {
}
exports.Binder = Binder;
class Claim extends Binder {
    constructor(type) {
        super();
        this.type = type;
    }
}
exports.Claim = Claim;
class Define extends Binder {
    constructor(type, value) {
        super();
        this.type = type;
        this.value = value;
    }
}
exports.Define = Define;
class Free extends Binder {
    constructor(type) {
        super();
        this.type = type;
    }
}
exports.Free = Free;
function varType(ctx, where, x) {
    if (ctx.size === 0) {
        throw new Error(`The context ${JSON.stringify(ctx)} is empty, but we are looking for ${x}`);
    }
    for (const [y, binder] of ctx.entries()) {
        if (binder instanceof Claim) {
            continue;
        }
        else if (x === y) {
            return new utils_1.go(binder.type);
        }
    }
    throw new Error(`Unknown variable ${x}`);
}
// Function to bind a free variable in a context
function bindFree(ctx, varName, tv) {
    if (ctx.has(varName)) {
        // CHANGE: REMOVE ctx LOOP AFTER FIXING THE BUG
        for (const [x, binder] of ctx) {
            if (x === varName) {
                //console.log(`binding ${varName} to ${binder}`);
                return extendContext(ctx, varName, new Free(tv));
            }
        }
        throw new Error(`
      ${varName} is already bound in ${JSON.stringify(ctx)}
    `);
    }
    return extendContext(ctx, varName, new Free(tv));
}
// Function to bind a value in a context
function bindVal(ctx, varName, type, value) {
    return extendContext(ctx, varName, new Define(type, value));
}
// Predicate to check if something is a serializable context
function isSerializableContext(ctx) {
    return ctx instanceof Map && Array.from(ctx.values()).every(value => {
        return Array.isArray(value) &&
            ((value[0] === 'free' && value[1] instanceof C.Core)
                ||
                    (value[0] === 'def' && value[1] instanceof C.Core && value[2] instanceof C.Core)
                ||
                    (value[0] === 'claim' && value[2] instanceof C.Core));
    });
}
//# sourceMappingURL=context.js.map