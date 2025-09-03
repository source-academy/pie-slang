"use strict";
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
exports.extendEnvironment = extendEnvironment;
exports.getValueFromEnvironment = getValueFromEnvironment;
exports.ValueOfVar = ValueOfVar;
function extendEnvironment(env, name, value) {
    return new Map(__spreadArray(__spreadArray([], env, true), [[name, value]], false));
}
// Lookup the value of a variable in an environment (var-val)
function getValueFromEnvironment(env, name) {
    if (env.has(name)) {
        // As we are sure that the variable is in the environment,
        // we can use the non-nullable assertion operator (!)
        return env.get(name);
    }
    else {
        throw new Error("Variable ".concat(name, " not found in environment"));
    }
}
// To find the value of a variable in an environment
function ValueOfVar(env, name) {
    if (env.has(name)) {
        return env.get(name);
    }
    else {
        throw new Error("Variable ".concat(name, " not in env: ").concat(JSON.stringify(this)));
    }
}
