"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ProofManager = void 0;
const proofstate_1 = require("./proofstate");
const context_1 = require("../utils/context");
const utils_1 = require("../types/utils");
class ProofManager {
    constructor() {
        this.currentState = null;
    }
    startProof(name, context, location) {
        const claim = context.get(name);
        if (!(claim instanceof context_1.Claim)) {
            return new utils_1.stop(location, new utils_1.Message([`${name} is not a valid type or has already been proved`]));
        }
        this.currentState = proofstate_1.ProofState.initialize(context, claim.type, location);
        return new utils_1.go(`Started proof of ${name}` + `\nCurrent goal: \n${claim.type.readBackType(context).prettyPrint()}`);
    }
    applyTactic(tactic) {
        if (!this.currentState) {
            return new utils_1.stop(tactic.location, new utils_1.Message([`No proof has been initialized`]));
        }
        const newStateResult = tactic.apply(this.currentState);
        if (newStateResult instanceof utils_1.stop) {
            return newStateResult;
        }
        this.currentState = newStateResult.result;
        let response = `\nApplied tactic: ${tactic}`;
        const currentGoal = this.currentState.getCurrentGoal();
        if (this.currentState.isComplete()) {
            response += "\nAll goals have been solved!";
        }
        else {
            const curGoal = currentGoal.result;
            response += `\nCurrent goal: \n` + curGoal.type.readBackType(curGoal.context).prettyPrint();
        }
        return new utils_1.go(response);
    }
}
exports.ProofManager = ProofManager;
//# sourceMappingURL=proofmanager.js.map