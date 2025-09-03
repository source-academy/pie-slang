"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ProofManager = void 0;
var proofstate_1 = require("./proofstate");
var context_1 = require("../utils/context");
var utils_1 = require("../types/utils");
var ProofManager = /** @class */ (function () {
    function ProofManager() {
        this.currentState = null;
    }
    ProofManager.prototype.startProof = function (name, context, location) {
        var claim = context.get(name);
        if (!(claim instanceof context_1.Claim)) {
            return new utils_1.stop(location, new utils_1.Message(["".concat(name, " is not a valid type or has already been proved")]));
        }
        this.currentState = proofstate_1.ProofState.initialize(context, claim.type, location);
        return new utils_1.go("Started proof of ".concat(name) + "\nCurrent goal: \n".concat(claim.type.readBackType(context).prettyPrint()));
    };
    ProofManager.prototype.applyTactic = function (tactic) {
        if (!this.currentState) {
            return new utils_1.stop(tactic.location, new utils_1.Message(["No proof has been initialized"]));
        }
        var newStateResult = tactic.apply(this.currentState);
        if (newStateResult instanceof utils_1.stop) {
            return newStateResult;
        }
        this.currentState = newStateResult.result;
        var response = "\nApplied tactic: ".concat(tactic);
        var currentGoal = this.currentState.getCurrentGoal();
        if (this.currentState.isComplete()) {
            response += "\nAll goals have been solved!";
        }
        else {
            var curGoal = currentGoal.result;
            response += "\nCurrent goal: \n" + curGoal.type.readBackType(curGoal.context).prettyPrint();
        }
        return new utils_1.go(response);
    };
    return ProofManager;
}());
exports.ProofManager = ProofManager;
