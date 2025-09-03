"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.evaluatePie = evaluatePie;
var parser_1 = require("./parser/parser");
var represent_1 = require("./typechecker/represent");
var utils_1 = require("./types/utils");
var pretty_1 = require("./unparser/pretty");
var context_1 = require("./utils/context");
var utils_2 = require("./evaluator/utils");
var proofmanager_1 = require("./tactics/proofmanager");
function evaluatePie(str) {
    var astList = (0, parser_1.schemeParse)(str);
    var ctx = context_1.initCtx;
    var output = "";
    for (var _i = 0, astList_1 = astList; _i < astList_1.length; _i++) {
        var ast = astList_1[_i];
        var src = parser_1.pieDeclarationParser.parseDeclaration(ast);
        if (src instanceof parser_1.Claim) {
            var result = (0, context_1.addClaimToContext)(ctx, src.name, src.location, src.type);
            if (result instanceof utils_1.go) {
                ctx = result.result;
            }
            else if (result instanceof utils_1.stop) {
                throw new Error("" + result.where + result.message);
            }
        }
        else if (src instanceof parser_1.Definition) {
            var result = (0, context_1.addDefineToContext)(ctx, src.name, src.location, src.expr);
            if (result instanceof utils_1.go) {
                ctx = result.result;
            }
            else if (result instanceof utils_1.stop) {
                throw new Error("" + result.where + result.message);
            }
        }
        else if (src instanceof parser_1.SamenessCheck) {
            var result = (0, represent_1.checkSame)(ctx, src.location, src.type, src.left, src.right);
            if (result instanceof utils_1.go) {
                ctx = result.result;
            }
            else if (result instanceof utils_1.stop) {
                throw new Error("" + result.where + result.message);
            }
        }
        else if (src instanceof parser_1.DefineTactically) {
            var proofManager = new proofmanager_1.ProofManager();
            var message = '';
            var a = proofManager.startProof(src.name, ctx, src.location);
            if (a instanceof utils_1.go) {
                message += a.result + '\n';
            }
            else if (a instanceof utils_1.stop) {
                throw new Error("" + a.where + a.message);
            }
            for (var _a = 0, _b = src.tactics; _a < _b.length; _a++) {
                var tactic = _b[_a];
                var result = proofManager.applyTactic(tactic);
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
            var result = (0, represent_1.represent)(ctx, src);
            if (result instanceof utils_1.go) {
                var core = result.result;
                output += "".concat((0, pretty_1.prettyPrintCore)(core.expr), ": ").concat((0, pretty_1.prettyPrintCore)(core.type), "\n");
            }
            else if (result instanceof utils_1.stop) {
                throw new Error("".concat(result.message, " at ").concat(result.where));
            }
        }
    }
    for (var _c = 0, ctx_1 = ctx; _c < ctx_1.length; _c++) {
        var _d = ctx_1[_c], name_1 = _d[0], binder = _d[1];
        if (binder instanceof context_1.Define) {
            output += name_1 + " : " + (0, pretty_1.prettyPrintCore)(binder.type.readBackType(ctx)) + "\n";
            output += name_1 + " = " + (0, pretty_1.prettyPrintCore)((0, utils_2.readBack)(ctx, binder.type, binder.value)) + "\n";
        }
        else {
            output += name_1 + " : " + (0, pretty_1.prettyPrintCore)(binder.type.readBackType(ctx)) + "\n";
        }
    }
    return output;
}
