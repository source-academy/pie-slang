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
exports.EliminateAbsurdTactic = exports.SpiltTactic = exports.EliminateEitherTactic = exports.RightTactic = exports.LeftTactic = exports.EliminateEqualTactic = exports.EliminateVecTactic = exports.EliminateListTactic = exports.EliminateNatTactic = exports.ExistsTactic = exports.ExactTactic = exports.IntroTactic = exports.Tactic = void 0;
const proofstate_1 = require("./proofstate");
const utils_1 = require("../types/utils");
const value_1 = require("../types/value");
const context_1 = require("../utils/context");
const evaluator_1 = require("../evaluator/evaluator");
const utils_2 = require("../types/utils");
const neutral_1 = require("../types/neutral");
const utils_3 = require("../typechecker/utils");
const V = __importStar(require("../types/value"));
const C = __importStar(require("../types/core"));
const util_1 = require("util");
class Tactic {
    constructor(location) {
        this.location = location;
    }
}
exports.Tactic = Tactic;
class IntroTactic extends Tactic {
    constructor(location, varName) {
        super(location);
        this.location = location;
        this.varName = varName;
    }
    getName() {
        return "intro";
    }
    toString() {
        return `intro ${this.varName || ""}`;
    }
    apply(state) {
        const currentGoal = state.currentGoal.goal;
        const goalType = currentGoal.type;
        if (!(goalType instanceof value_1.Pi)) {
            return new utils_1.stop(state.location, new utils_1.Message([`Cannot introduce a variable for non-function type: ${goalType.prettyPrint()}`]));
        }
        const name = this.varName || goalType.argName || (0, utils_2.fresh)(currentGoal.context, "x");
        let newRenaming = currentGoal.renaming;
        if (name !== goalType.argName) {
            (0, utils_3.extendRenaming)(newRenaming, goalType.argName, name);
        }
        const newContext = (0, context_1.extendContext)(currentGoal.context, name, new context_1.Free(goalType.argType));
        const newGoalType = goalType.resultType.valOfClosure(new value_1.Neutral(goalType.argType, new neutral_1.Variable(name)));
        const newGoalNode = new proofstate_1.GoalNode(new proofstate_1.Goal(state.generateGoalId(), newGoalType, newContext, newRenaming));
        state.addGoal([newGoalNode]);
        return new utils_1.go(state);
    }
}
exports.IntroTactic = IntroTactic;
class ExactTactic extends Tactic {
    constructor(location, term) {
        super(location);
        this.location = location;
        this.term = term;
    }
    toString() {
        return `exact ${this.term.prettyPrint()}`;
    }
    apply(state) {
        const currentGoal = state.getCurrentGoal().result;
        const goalType = currentGoal.type;
        console.log("goalType:", goalType.prettyPrint());
        console.log("term:", this.term.prettyPrint());
        const result = this.term.check(currentGoal.context, currentGoal.renaming, goalType);
        if (result instanceof utils_1.stop) {
            return result;
        }
        state.currentGoal.isComplete = true;
        state.nextGoal();
        return new utils_1.go(state);
    }
}
exports.ExactTactic = ExactTactic;
class ExistsTactic extends Tactic {
    constructor(location, value, varName) {
        super(location);
        this.location = location;
        this.value = value;
        this.varName = varName;
    }
    toString() {
        return `exists ${this.varName || ""}`;
    }
    apply(state) {
        const currentGoal = state.getCurrentGoal().result;
        const goalType = currentGoal.type;
        if (!(goalType instanceof V.Sigma)) {
            return new utils_1.stop(state.location, new utils_1.Message([`Cannot use exists on non-product type: ${goalType.prettyPrint()}`]));
        }
        const name = this.varName || goalType.carName || (0, utils_2.fresh)(currentGoal.context, "x");
        let newRenaming = currentGoal.renaming;
        if (name !== goalType.carName) {
            (0, utils_3.extendRenaming)(newRenaming, goalType.carName, name);
        }
        const result_temp = this.value.check(currentGoal.context, currentGoal.renaming, goalType.carType);
        if (result_temp instanceof utils_1.stop) {
            return result_temp;
        }
        const result = result_temp.result.valOf((0, context_1.contextToEnvironment)(currentGoal.context));
        const newContext = (0, context_1.extendContext)(currentGoal.context, name, new context_1.Define(goalType.carType, result));
        const newGoalType = goalType.cdrType.valOfClosure(result);
        const newGoalNode = new proofstate_1.GoalNode(new proofstate_1.Goal(state.generateGoalId(), newGoalType, newContext, newRenaming));
        state.addGoal([newGoalNode]);
        return new utils_1.go(state);
    }
}
exports.ExistsTactic = ExistsTactic;
class EliminateNatTactic extends Tactic {
    constructor(location, target, motive) {
        super(location);
        this.location = location;
        this.target = target;
        this.motive = motive;
    }
    toString() {
        return `elim-nat ${this.target} to prove ${this.motive.prettyPrint()}`;
    }
    apply(state) {
        const currentGoal = state.getCurrentGoal().result;
        const targetType_temp = currentGoal.context.get(this.target);
        if (!targetType_temp) {
            return new utils_1.stop(state.location, new utils_1.Message([`target not found in current context: ${this.target}`]));
        }
        let targetType;
        if (targetType_temp instanceof context_1.Free) {
            targetType = targetType_temp.type.now();
        }
        else {
            throw new Error(`Expected target to be a free variable`);
        }
        if (!(targetType instanceof value_1.Nat)) {
            return new utils_1.stop(state.location, new utils_1.Message([`Cannot eliminate non-Nat type: ${targetType.prettyPrint()}`]));
        }
        const name = (0, utils_2.fresh)(currentGoal.context, "n");
        const motiveRst = this.motive.check(currentGoal.context, currentGoal.renaming, new value_1.Pi(name, new V.Nat(), new utils_1.HigherOrderClosure((_) => new V.Universe())));
        if (motiveRst instanceof utils_1.stop) {
            return motiveRst;
        }
        else {
            const rst = this.eliminateNat(currentGoal.context, currentGoal.renaming, motiveRst.result.valOf((0, context_1.contextToEnvironment)(currentGoal.context)));
            state.addGoal(rst.map((type) => {
                const newGoalNode = new proofstate_1.GoalNode(new proofstate_1.Goal(state.generateGoalId(), type, currentGoal.context, currentGoal.renaming));
                return newGoalNode;
            }));
            return new utils_1.go(state);
        }
    }
    eliminateNat(context, r, motiveType) {
        // 1. A base case: (motive zero)
        const baseType = (0, evaluator_1.doApp)(motiveType, new V.Zero());
        // 2. A step case: (Π (n-1 Nat) (→ (motive n-1) (motive (add1 n-1))))
        const stepType = new V.Pi((0, utils_2.fresh)(context, "n-1"), new V.Nat(), new utils_1.HigherOrderClosure((n_minus_1) => {
            return new V.Pi((0, utils_2.fresh)(context, "ih"), (0, evaluator_1.doApp)(motiveType, n_minus_1), new utils_1.HigherOrderClosure((_) => (0, evaluator_1.doApp)(motiveType, new V.Add1(n_minus_1))));
        }));
        return [baseType, stepType];
    }
}
exports.EliminateNatTactic = EliminateNatTactic;
class EliminateListTactic extends Tactic {
    constructor(location, target, motive) {
        super(location);
        this.location = location;
        this.target = target;
        this.motive = motive;
    }
    toString() {
        return `elim-list ${this.target} to prove ${this.motive.prettyPrint()}`;
    }
    apply(state) {
        const currentGoal = state.getCurrentGoal().result;
        const targetType_temp = currentGoal.context.get(this.target);
        if (!targetType_temp) {
            return new utils_1.stop(state.location, new utils_1.Message([`target not found in current context: ${this.target}`]));
        }
        let targetType;
        if (targetType_temp instanceof context_1.Free) {
            targetType = targetType_temp.type.now();
        }
        else {
            throw new Error(`Expected target to be a free variable`);
        }
        // Check that target is actually a List
        if (!(targetType instanceof V.List)) {
            return new utils_1.stop(state.location, new utils_1.Message([`Cannot eliminate non-List type: ${targetType.prettyPrint()}`]));
        }
        const listMotive = (0, utils_2.fresh)(currentGoal.context, "motive");
        const E = targetType.entryType;
        const motiveRst = this.motive.check(currentGoal.context, currentGoal.renaming, new V.Pi('xs', new V.List(E), new utils_1.FirstOrderClosure((0, context_1.contextToEnvironment)(currentGoal.context), 'xs', new C.Universe())));
        if (motiveRst instanceof utils_1.stop) {
            return motiveRst;
        }
        else {
            const motiveType = motiveRst.result.valOf((0, context_1.contextToEnvironment)(currentGoal.context));
            const rst = this.eliminateList(currentGoal.context, currentGoal.renaming, motiveType, E);
            console.log("Eliminating List with motive:", (0, util_1.inspect)(rst, true, null, true));
            state.addGoal(rst.map((type) => {
                const newGoalNode = new proofstate_1.GoalNode(new proofstate_1.Goal(state.generateGoalId(), type, currentGoal.context, currentGoal.renaming));
                return newGoalNode;
            }));
            return new utils_1.go(state);
        }
    }
    eliminateList(context, r, motiveType, entryType) {
        //1. A base case: (motive nil)
        const baseType = (0, evaluator_1.doApp)(motiveType, new V.Nil());
        //2. A step case: (Π (x E) (Π (xs (V.List E)) (→ (motive xs) (motive (cons x xs)))))
        const stepType = new V.Pi((0, utils_2.fresh)(context, "x"), entryType, new utils_1.HigherOrderClosure((x) => new V.Pi((0, utils_2.fresh)(context, "xs"), new V.List(entryType), new utils_1.HigherOrderClosure((xs) => new V.Pi((0, utils_2.fresh)(context, "ih"), (0, evaluator_1.doApp)(motiveType, xs), new utils_1.HigherOrderClosure((_) => (0, evaluator_1.doApp)(motiveType, new V.ListCons(x, xs))))))));
        return [baseType, stepType];
    }
}
exports.EliminateListTactic = EliminateListTactic;
class EliminateVecTactic extends Tactic {
    constructor(location, target, motive, length) {
        super(location);
        this.location = location;
        this.target = target;
        this.motive = motive;
        this.length = length;
    }
    toString() {
        return `elim-list ${this.target} to prove ${this.motive.prettyPrint()}`;
    }
    apply(state) {
        const currentGoal = state.getCurrentGoal().result;
        const targetType_temp = currentGoal.context.get(this.target);
        if (!targetType_temp) {
            return new utils_1.stop(state.location, new utils_1.Message([`target not found in current context: ${this.target}`]));
        }
        let targetType;
        if (targetType_temp instanceof context_1.Free) {
            targetType = targetType_temp.type.now();
        }
        else {
            throw new Error(`Expected target to be a free variable`);
        }
        // Check that target is actually a List
        if (!(targetType instanceof V.Vec)) {
            return new utils_1.stop(state.location, new utils_1.Message([`Cannot eliminate non-Vec type: ${targetType.prettyPrint()}`]));
        }
        const lenout = this.length.check(currentGoal.context, currentGoal.renaming, new V.Nat());
        if (lenout instanceof utils_1.stop) {
            return lenout;
        }
        const [E, len2v] = [targetType.entryType, targetType.length];
        (0, utils_3.convert)(currentGoal.context, this.location, new V.Nat(), (0, context_1.valInContext)(currentGoal.context, lenout.result), len2v);
        const vecMotive = (0, utils_2.fresh)(currentGoal.context, "motive");
        const motiveRst = this.motive.check(currentGoal.context, currentGoal.renaming, new V.Pi('k', new V.Nat(), new utils_1.HigherOrderClosure((k) => new V.Pi('es', new V.Vec(E, k), new utils_1.HigherOrderClosure((_) => new V.Universe())))));
        if (motiveRst instanceof utils_1.stop) {
            return motiveRst;
        }
        else {
            const motiveType = motiveRst.result.valOf((0, context_1.contextToEnvironment)(currentGoal.context));
            const rst = this.eliminateVec(currentGoal.context, currentGoal.renaming, motiveType, E);
            state.addGoal(rst.map((type) => {
                const newGoalNode = new proofstate_1.GoalNode(new proofstate_1.Goal(state.generateGoalId(), type, currentGoal.context, currentGoal.renaming));
                return newGoalNode;
            }));
            return new utils_1.go(state);
        }
    }
    eliminateVec(context, r, motiveType, entryType) {
        const baseType = (0, evaluator_1.doApp)((0, evaluator_1.doApp)(motiveType, new V.Zero()), new V.VecNil());
        const stepType = (0, evaluator_1.indVecStepType)(entryType, motiveType);
        return [baseType, stepType];
    }
}
exports.EliminateVecTactic = EliminateVecTactic;
class EliminateEqualTactic extends Tactic {
    constructor(location, target, motive) {
        super(location);
        this.location = location;
        this.target = target;
        this.motive = motive;
    }
    toString() {
        return `elim-equal ${this.target} with motive ${this.motive.prettyPrint()}`;
    }
    apply(state) {
        const currentGoal = state.getCurrentGoal().result;
        const targetType_temp = currentGoal.context.get(this.target);
        if (!targetType_temp) {
            return new utils_1.stop(state.location, new utils_1.Message([`target not found in current context: ${this.target}`]));
        }
        let targetType;
        if (targetType_temp instanceof context_1.Free) {
            targetType = targetType_temp.type.now();
        }
        else {
            throw new Error(`Expected target to be a free variable`);
        }
        if (!(targetType instanceof V.Equal)) {
            return new utils_1.stop(state.location, new utils_1.Message([`Cannot eliminate non-Equal type: ${targetType.prettyPrint()}`]));
        }
        const [Av, fromv, tov] = [targetType.type, targetType.from, targetType.to];
        const motiveRst = this.motive.check(currentGoal.context, currentGoal.renaming, new V.Pi('to', Av, new utils_1.HigherOrderClosure((to) => new V.Pi('p', new V.Equal(Av, fromv, to), new utils_1.HigherOrderClosure((_) => new V.Universe())))));
        if (motiveRst instanceof utils_1.stop) {
            return motiveRst;
        }
        else {
            const motiveType = motiveRst.result.valOf((0, context_1.contextToEnvironment)(currentGoal.context));
            const rst = [(0, evaluator_1.doApp)((0, evaluator_1.doApp)(motiveType, fromv), new V.Same(fromv))];
            state.addGoal(rst.map((type) => {
                const newGoalNode = new proofstate_1.GoalNode(new proofstate_1.Goal(state.generateGoalId(), type, currentGoal.context, currentGoal.renaming));
                return newGoalNode;
            }));
            return new utils_1.go(state);
        }
    }
}
exports.EliminateEqualTactic = EliminateEqualTactic;
class LeftTactic extends Tactic {
    constructor(location) {
        super(location);
        this.location = location;
    }
    toString() {
        return `left`;
    }
    apply(state) {
        const currentGoal = state.getCurrentGoal().result;
        if (!(currentGoal.type.now() instanceof V.Either)) {
            return new utils_1.stop(state.location, new utils_1.Message([`"left" expected goal type to be Either, but got: ${currentGoal.type.prettyPrint()}`]));
        }
        const leftType = currentGoal.type.leftType.now();
        state.addGoal([new proofstate_1.GoalNode(new proofstate_1.Goal(state.generateGoalId(), leftType, currentGoal.context, currentGoal.renaming))]);
        return new utils_1.go(state);
    }
}
exports.LeftTactic = LeftTactic;
class RightTactic extends Tactic {
    constructor(location) {
        super(location);
        this.location = location;
    }
    toString() {
        return `right`;
    }
    apply(state) {
        const currentGoal = state.getCurrentGoal().result;
        if (!(currentGoal.type.now() instanceof V.Either)) {
            return new utils_1.stop(state.location, new utils_1.Message([`"right" expected goal type to be Either, but got: ${currentGoal.type.prettyPrint()}`]));
        }
        const rightType = currentGoal.type.rightType.now();
        state.addGoal([new proofstate_1.GoalNode(new proofstate_1.Goal(state.generateGoalId(), rightType, currentGoal.context, currentGoal.renaming))]);
        return new utils_1.go(state);
    }
}
exports.RightTactic = RightTactic;
class EliminateEitherTactic extends Tactic {
    constructor(location, target, motive) {
        super(location);
        this.location = location;
        this.target = target;
        this.motive = motive;
    }
    toString() {
        return `elim-either ${this.target} with motive ${this.motive.prettyPrint()}`;
    }
    apply(state) {
        const currentGoal = state.getCurrentGoal().result;
        const targetType_temp = currentGoal.context.get(this.target);
        if (!targetType_temp) {
            return new utils_1.stop(state.location, new utils_1.Message([`target not found in current context: ${this.target}`]));
        }
        let targetType;
        if (targetType_temp instanceof context_1.Free) {
            targetType = targetType_temp.type.now();
        }
        else {
            throw new Error(`Expected target to be a free variable`);
        }
        if (!(targetType instanceof V.Either)) {
            return new utils_1.stop(state.location, new utils_1.Message([`Cannot eliminate non-Either type: ${targetType.prettyPrint()}`]));
        }
        const [Lv, Rv] = [targetType.leftType, targetType.rightType];
        const motiveRst = this.motive.check(currentGoal.context, currentGoal.renaming, new V.Pi('x', new V.Either(Lv, Rv), new utils_1.HigherOrderClosure((_) => new V.Universe())));
        if (motiveRst instanceof utils_1.stop) {
            return motiveRst;
        }
        else {
            const motiveType = motiveRst.result.valOf((0, context_1.contextToEnvironment)(currentGoal.context));
            const leftType = new V.Pi('x', Lv, new utils_1.HigherOrderClosure((x) => (0, evaluator_1.doApp)(motiveType, new V.Left(x))));
            const rightType = new V.Pi('x', Rv, new utils_1.HigherOrderClosure((x) => (0, evaluator_1.doApp)(motiveType, new V.Right(x))));
            state.addGoal([
                new proofstate_1.GoalNode(new proofstate_1.Goal(state.generateGoalId(), leftType, currentGoal.context, currentGoal.renaming)),
                new proofstate_1.GoalNode(new proofstate_1.Goal(state.generateGoalId(), rightType, currentGoal.context, currentGoal.renaming))
            ]);
            return new utils_1.go(state);
        }
    }
}
exports.EliminateEitherTactic = EliminateEitherTactic;
class SpiltTactic extends Tactic {
    constructor(location) {
        super(location);
    }
    toString() {
        return `split`;
    }
    apply(state) {
        const currentGoal = state.getCurrentGoal().result;
        if (!(currentGoal.type.now() instanceof V.Sigma)) {
            return new utils_1.stop(state.location, new utils_1.Message([`"split" expected goal type to be Sigma, but got: ${currentGoal.type.prettyPrint()}`]));
        }
        const pairType = currentGoal.type.now();
        const carType = pairType.carType.now();
        const cdrType = pairType.cdrType.valOfClosure(pairType);
        state.addGoal([
            new proofstate_1.GoalNode(new proofstate_1.Goal(state.generateGoalId(), carType, currentGoal.context, currentGoal.renaming)),
            new proofstate_1.GoalNode(new proofstate_1.Goal(state.generateGoalId(), cdrType, currentGoal.context, currentGoal.renaming))
        ]);
        return new utils_1.go(state);
    }
}
exports.SpiltTactic = SpiltTactic;
class EliminateAbsurdTactic extends Tactic {
    constructor(location, target, motive) {
        super(location);
        this.location = location;
        this.target = target;
        this.motive = motive;
    }
    toString() {
        return `elim-absurd ${this.target} with motive ${this.motive.prettyPrint()}`;
    }
    apply(state) {
        const currentGoal = state.getCurrentGoal().result;
        const targetType_temp = currentGoal.context.get(this.target);
        if (!targetType_temp) {
            return new utils_1.stop(state.location, new utils_1.Message([`target not found in current context: ${this.target}`]));
        }
        let targetType;
        if (targetType_temp instanceof context_1.Free) {
            targetType = targetType_temp.type.now();
        }
        else {
            throw new Error(`Expected target to be a free variable`);
        }
        if (!(targetType instanceof V.Absurd)) {
            return new utils_1.stop(state.location, new utils_1.Message([`Cannot eliminate non-Absurd type: ${targetType.prettyPrint()}`]));
        }
        const motiveRst = this.motive.check(currentGoal.context, currentGoal.renaming, new V.Universe());
        if (motiveRst instanceof utils_1.stop) {
            return motiveRst;
        }
        else {
            state.currentGoal.isComplete = true;
            state.nextGoal();
            return new utils_1.go(state);
        }
    }
}
exports.EliminateAbsurdTactic = EliminateAbsurdTactic;
//# sourceMappingURL=tactics.js.map