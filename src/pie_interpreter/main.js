"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.evaluatePie = evaluatePie;
const parser_1 = require("./parser/parser");
const represent_1 = require("./typechecker/represent");
const utils_1 = require("./types/utils");
const pretty_1 = require("./unparser/pretty");
const context_1 = require("./utils/context");
const utils_2 = require("./evaluator/utils");
const proofmanager_1 = require("./tactics/proofmanager");
function evaluatePie(str) {
    const astList = (0, parser_1.schemeParse)(str);
    let ctx = context_1.initCtx;
    let output = "";
    for (const ast of astList) {
        const src = parser_1.pieDeclarationParser.parseDeclaration(ast);
        if (src instanceof parser_1.Claim) {
            const result = (0, context_1.addClaimToContext)(ctx, src.name, src.location, src.type);
            if (result instanceof utils_1.go) {
                ctx = result.result;
            }
            else if (result instanceof utils_1.stop) {
                throw new Error("" + result.where + result.message);
            }
        }
        else if (src instanceof parser_1.Definition) {
            const result = (0, context_1.addDefineToContext)(ctx, src.name, src.location, src.expr);
            if (result instanceof utils_1.go) {
                ctx = result.result;
            }
            else if (result instanceof utils_1.stop) {
                throw new Error("" + result.where + result.message);
            }
        }
        else if (src instanceof parser_1.SamenessCheck) {
            const result = (0, represent_1.checkSame)(ctx, src.location, src.type, src.left, src.right);
            if (result instanceof utils_1.go) {
                ctx = result.result;
            }
            else if (result instanceof utils_1.stop) {
                throw new Error("" + result.where + result.message);
            }
        }
        else if (src instanceof parser_1.DefineTactically) {
            const proofManager = new proofmanager_1.ProofManager();
            let message = '';
            const a = proofManager.startProof(src.name, ctx, src.location);
            if (a instanceof utils_1.go) {
                message += a.result + '\n';
            }
            else if (a instanceof utils_1.stop) {
                throw new Error("" + a.where + a.message);
            }
            for (const tactic of src.tactics) {
                const result = proofManager.applyTactic(tactic);
                if (result instanceof utils_1.go) {
                    message += result.result;
                }
                else if (result instanceof utils_1.stop) {
                    throw new Error("" + result.where + result.message);
                }
            }
            return message;
        }
        else {
            const result = (0, represent_1.represent)(ctx, src);
            if (result instanceof utils_1.go) {
                const core = result.result;
                output += `${(0, pretty_1.prettyPrintCore)(core.expr)}: ${(0, pretty_1.prettyPrintCore)(core.type)}\n`;
            }
            else if (result instanceof utils_1.stop) {
                throw new Error(`${result.message} at ${result.where}`);
            }
        }
    }
    for (const [name, binder] of ctx) {
        if (binder instanceof context_1.Define) {
            output += name + " : " + (0, pretty_1.prettyPrintCore)(binder.type.readBackType(ctx)) + "\n";
            output += name + " = " + (0, pretty_1.prettyPrintCore)((0, utils_2.readBack)(ctx, binder.type, binder.value)) + "\n";
        }
        else {
            output += name + " : " + (0, pretty_1.prettyPrintCore)(binder.type.readBackType(ctx)) + "\n";
        }
    }
    return output;
}
//# sourceMappingURL=main.js.map