"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.extendEnvironment = extendEnvironment;
exports.getValueFromEnvironment = getValueFromEnvironment;
exports.ValueOfVar = ValueOfVar;
function extendEnvironment(env, name, value) {
    return new Map([...env, [name, value]]);
}
// Lookup the value of a variable in an environment (var-val)
function getValueFromEnvironment(env, name) {
    if (env.has(name)) {
        // As we are sure that the variable is in the environment,
        // we can use the non-nullable assertion operator (!)
        return env.get(name);
    }
    else {
        throw new Error(`Variable ${name} not found in environment`);
    }
}
// To find the value of a variable in an environment
function ValueOfVar(env, name) {
    if (env.has(name)) {
        return env.get(name);
    }
    else {
        throw new Error(`Variable ${name} not in env: ${JSON.stringify(this)}`);
    }
}
//# sourceMappingURL=environment.js.map