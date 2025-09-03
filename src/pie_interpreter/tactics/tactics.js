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
Object.defineProperty(exports, "__esModule", { value: true });
exports.EliminateAbsurdTactic = exports.SpiltTactic = exports.EliminateEitherTactic = exports.RightTactic = exports.LeftTactic = exports.EliminateEqualTactic = exports.EliminateVecTactic = exports.EliminateListTactic = exports.EliminateNatTactic = exports.ExistsTactic = exports.ExactTactic = exports.IntroTactic = exports.Tactic = void 0;
var proofstate_1 = require("./proofstate");
var utils_1 = require("../types/utils");
var value_1 = require("../types/value");
var context_1 = require("../utils/context");
var evaluator_1 = require("../evaluator/evaluator");
var utils_2 = require("../types/utils");
var neutral_1 = require("../types/neutral");
var utils_3 = require("../typechecker/utils");
var V = require("../types/value");
var C = require("../types/core");
var util_1 = require("util");
var Tactic = /** @class */ (function () {
    function Tactic(location) {
        this.location = location;
    }
    return Tactic;
}());
exports.Tactic = Tactic;
var IntroTactic = /** @class */ (function (_super) {
    __extends(IntroTactic, _super);
    function IntroTactic(location, varName) {
        var _this = _super.call(this, location) || this;
        _this.location = location;
        _this.varName = varName;
        return _this;
    }
    IntroTactic.prototype.getName = function () {
        return "intro";
    };
    IntroTactic.prototype.toString = function () {
        return "intro ".concat(this.varName || "");
    };
    IntroTactic.prototype.apply = function (state) {
        var currentGoal = state.currentGoal.goal;
        var goalType = currentGoal.type;
        if (!(goalType instanceof value_1.Pi)) {
            return new utils_1.stop(state.location, new utils_1.Message(["Cannot introduce a variable for non-function type: ".concat(goalType.prettyPrint())]));
        }
        var name = this.varName || goalType.argName || (0, utils_2.fresh)(currentGoal.context, "x");
        var newRenaming = currentGoal.renaming;
        if (name !== goalType.argName) {
            (0, utils_3.extendRenaming)(newRenaming, goalType.argName, name);
        }
        var newContext = (0, context_1.extendContext)(currentGoal.context, name, new context_1.Free(goalType.argType));
        var newGoalType = goalType.resultType.valOfClosure(new value_1.Neutral(goalType.argType, new neutral_1.Variable(name)));
        var newGoalNode = new proofstate_1.GoalNode(new proofstate_1.Goal(state.generateGoalId(), newGoalType, newContext, newRenaming));
        state.addGoal([newGoalNode]);
        return new utils_1.go(state);
    };
    return IntroTactic;
}(Tactic));
exports.IntroTactic = IntroTactic;
var ExactTactic = /** @class */ (function (_super) {
    __extends(ExactTactic, _super);
    function ExactTactic(location, term) {
        var _this = _super.call(this, location) || this;
        _this.location = location;
        _this.term = term;
        return _this;
    }
    ExactTactic.prototype.toString = function () {
        return "exact ".concat(this.term.prettyPrint());
    };
    ExactTactic.prototype.apply = function (state) {
        var currentGoal = state.getCurrentGoal().result;
        var goalType = currentGoal.type;
        console.log("goalType:", goalType.prettyPrint());
        console.log("term:", this.term.prettyPrint());
        var result = this.term.check(currentGoal.context, currentGoal.renaming, goalType);
        if (result instanceof utils_1.stop) {
            return result;
        }
        state.currentGoal.isComplete = true;
        state.nextGoal();
        return new utils_1.go(state);
    };
    return ExactTactic;
}(Tactic));
exports.ExactTactic = ExactTactic;
var ExistsTactic = /** @class */ (function (_super) {
    __extends(ExistsTactic, _super);
    function ExistsTactic(location, value, varName) {
        var _this = _super.call(this, location) || this;
        _this.location = location;
        _this.value = value;
        _this.varName = varName;
        return _this;
    }
    ExistsTactic.prototype.toString = function () {
        return "exists ".concat(this.varName || "");
    };
    ExistsTactic.prototype.apply = function (state) {
        var currentGoal = state.getCurrentGoal().result;
        var goalType = currentGoal.type;
        if (!(goalType instanceof V.Sigma)) {
            return new utils_1.stop(state.location, new utils_1.Message(["Cannot use exists on non-product type: ".concat(goalType.prettyPrint())]));
        }
        var name = this.varName || goalType.carName || (0, utils_2.fresh)(currentGoal.context, "x");
        var newRenaming = currentGoal.renaming;
        if (name !== goalType.carName) {
            (0, utils_3.extendRenaming)(newRenaming, goalType.carName, name);
        }
        var result_temp = this.value.check(currentGoal.context, currentGoal.renaming, goalType.carType);
        if (result_temp instanceof utils_1.stop) {
            return result_temp;
        }
        var result = result_temp.result.valOf((0, context_1.contextToEnvironment)(currentGoal.context));
        var newContext = (0, context_1.extendContext)(currentGoal.context, name, new context_1.Define(goalType.carType, result));
        var newGoalType = goalType.cdrType.valOfClosure(result);
        var newGoalNode = new proofstate_1.GoalNode(new proofstate_1.Goal(state.generateGoalId(), newGoalType, newContext, newRenaming));
        state.addGoal([newGoalNode]);
        return new utils_1.go(state);
    };
    return ExistsTactic;
}(Tactic));
exports.ExistsTactic = ExistsTactic;
var EliminateNatTactic = /** @class */ (function (_super) {
    __extends(EliminateNatTactic, _super);
    function EliminateNatTactic(location, target, motive) {
        var _this = _super.call(this, location) || this;
        _this.location = location;
        _this.target = target;
        _this.motive = motive;
        return _this;
    }
    EliminateNatTactic.prototype.toString = function () {
        return "elim-nat ".concat(this.target, " to prove ").concat(this.motive.prettyPrint());
    };
    EliminateNatTactic.prototype.apply = function (state) {
        var currentGoal = state.getCurrentGoal().result;
        var targetType_temp = currentGoal.context.get(this.target);
        if (!targetType_temp) {
            return new utils_1.stop(state.location, new utils_1.Message(["target not found in current context: ".concat(this.target)]));
        }
        var targetType;
        if (targetType_temp instanceof context_1.Free) {
            targetType = targetType_temp.type.now();
        }
        else {
            throw new Error("Expected target to be a free variable");
        }
        if (!(targetType instanceof value_1.Nat)) {
            return new utils_1.stop(state.location, new utils_1.Message(["Cannot eliminate non-Nat type: ".concat(targetType.prettyPrint())]));
        }
        var name = (0, utils_2.fresh)(currentGoal.context, "n");
        var motiveRst = this.motive.check(currentGoal.context, currentGoal.renaming, new value_1.Pi(name, new V.Nat(), new utils_1.HigherOrderClosure(function (_) { return new V.Universe(); })));
        if (motiveRst instanceof utils_1.stop) {
            return motiveRst;
        }
        else {
            var rst = this.eliminateNat(currentGoal.context, currentGoal.renaming, motiveRst.result.valOf((0, context_1.contextToEnvironment)(currentGoal.context)));
            state.addGoal(rst.map(function (type) {
                var newGoalNode = new proofstate_1.GoalNode(new proofstate_1.Goal(state.generateGoalId(), type, currentGoal.context, currentGoal.renaming));
                return newGoalNode;
            }));
            return new utils_1.go(state);
        }
    };
    EliminateNatTactic.prototype.eliminateNat = function (context, r, motiveType) {
        // 1. A base case: (motive zero)
        var baseType = (0, evaluator_1.doApp)(motiveType, new V.Zero());
        // 2. A step case: (Π (n-1 Nat) (→ (motive n-1) (motive (add1 n-1))))
        var stepType = new V.Pi((0, utils_2.fresh)(context, "n-1"), new V.Nat(), new utils_1.HigherOrderClosure(function (n_minus_1) {
            return new V.Pi((0, utils_2.fresh)(context, "ih"), (0, evaluator_1.doApp)(motiveType, n_minus_1), new utils_1.HigherOrderClosure(function (_) {
                return (0, evaluator_1.doApp)(motiveType, new V.Add1(n_minus_1));
            }));
        }));
        return [baseType, stepType];
    };
    return EliminateNatTactic;
}(Tactic));
exports.EliminateNatTactic = EliminateNatTactic;
var EliminateListTactic = /** @class */ (function (_super) {
    __extends(EliminateListTactic, _super);
    function EliminateListTactic(location, target, motive) {
        var _this = _super.call(this, location) || this;
        _this.location = location;
        _this.target = target;
        _this.motive = motive;
        return _this;
    }
    EliminateListTactic.prototype.toString = function () {
        return "elim-list ".concat(this.target, " to prove ").concat(this.motive.prettyPrint());
    };
    EliminateListTactic.prototype.apply = function (state) {
        var currentGoal = state.getCurrentGoal().result;
        var targetType_temp = currentGoal.context.get(this.target);
        if (!targetType_temp) {
            return new utils_1.stop(state.location, new utils_1.Message(["target not found in current context: ".concat(this.target)]));
        }
        var targetType;
        if (targetType_temp instanceof context_1.Free) {
            targetType = targetType_temp.type.now();
        }
        else {
            throw new Error("Expected target to be a free variable");
        }
        // Check that target is actually a List
        if (!(targetType instanceof V.List)) {
            return new utils_1.stop(state.location, new utils_1.Message(["Cannot eliminate non-List type: ".concat(targetType.prettyPrint())]));
        }
        var listMotive = (0, utils_2.fresh)(currentGoal.context, "motive");
        var E = targetType.entryType;
        var motiveRst = this.motive.check(currentGoal.context, currentGoal.renaming, new V.Pi('xs', new V.List(E), new utils_1.FirstOrderClosure((0, context_1.contextToEnvironment)(currentGoal.context), 'xs', new C.Universe())));
        if (motiveRst instanceof utils_1.stop) {
            return motiveRst;
        }
        else {
            var motiveType = motiveRst.result.valOf((0, context_1.contextToEnvironment)(currentGoal.context));
            var rst = this.eliminateList(currentGoal.context, currentGoal.renaming, motiveType, E);
            console.log("Eliminating List with motive:", (0, util_1.inspect)(rst, true, null, true));
            state.addGoal(rst.map(function (type) {
                var newGoalNode = new proofstate_1.GoalNode(new proofstate_1.Goal(state.generateGoalId(), type, currentGoal.context, currentGoal.renaming));
                return newGoalNode;
            }));
            return new utils_1.go(state);
        }
    };
    EliminateListTactic.prototype.eliminateList = function (context, r, motiveType, entryType) {
        //1. A base case: (motive nil)
        var baseType = (0, evaluator_1.doApp)(motiveType, new V.Nil());
        //2. A step case: (Π (x E) (Π (xs (V.List E)) (→ (motive xs) (motive (cons x xs)))))
        var stepType = new V.Pi((0, utils_2.fresh)(context, "x"), entryType, new utils_1.HigherOrderClosure(function (x) { return new V.Pi((0, utils_2.fresh)(context, "xs"), new V.List(entryType), new utils_1.HigherOrderClosure(function (xs) { return new V.Pi((0, utils_2.fresh)(context, "ih"), (0, evaluator_1.doApp)(motiveType, xs), new utils_1.HigherOrderClosure(function (_) { return (0, evaluator_1.doApp)(motiveType, new V.ListCons(x, xs)); })); })); }));
        return [baseType, stepType];
    };
    return EliminateListTactic;
}(Tactic));
exports.EliminateListTactic = EliminateListTactic;
var EliminateVecTactic = /** @class */ (function (_super) {
    __extends(EliminateVecTactic, _super);
    function EliminateVecTactic(location, target, motive, length) {
        var _this = _super.call(this, location) || this;
        _this.location = location;
        _this.target = target;
        _this.motive = motive;
        _this.length = length;
        return _this;
    }
    EliminateVecTactic.prototype.toString = function () {
        return "elim-list ".concat(this.target, " to prove ").concat(this.motive.prettyPrint());
    };
    EliminateVecTactic.prototype.apply = function (state) {
        var currentGoal = state.getCurrentGoal().result;
        var targetType_temp = currentGoal.context.get(this.target);
        if (!targetType_temp) {
            return new utils_1.stop(state.location, new utils_1.Message(["target not found in current context: ".concat(this.target)]));
        }
        var targetType;
        if (targetType_temp instanceof context_1.Free) {
            targetType = targetType_temp.type.now();
        }
        else {
            throw new Error("Expected target to be a free variable");
        }
        // Check that target is actually a List
        if (!(targetType instanceof V.Vec)) {
            return new utils_1.stop(state.location, new utils_1.Message(["Cannot eliminate non-Vec type: ".concat(targetType.prettyPrint())]));
        }
        var lenout = this.length.check(currentGoal.context, currentGoal.renaming, new V.Nat());
        if (lenout instanceof utils_1.stop) {
            return lenout;
        }
        var _a = [targetType.entryType, targetType.length], E = _a[0], len2v = _a[1];
        (0, utils_3.convert)(currentGoal.context, this.location, new V.Nat(), (0, context_1.valInContext)(currentGoal.context, lenout.result), len2v);
        var vecMotive = (0, utils_2.fresh)(currentGoal.context, "motive");
        var motiveRst = this.motive.check(currentGoal.context, currentGoal.renaming, new V.Pi('k', new V.Nat(), new utils_1.HigherOrderClosure(function (k) { return new V.Pi('es', new V.Vec(E, k), new utils_1.HigherOrderClosure(function (_) { return new V.Universe(); })); })));
        if (motiveRst instanceof utils_1.stop) {
            return motiveRst;
        }
        else {
            var motiveType = motiveRst.result.valOf((0, context_1.contextToEnvironment)(currentGoal.context));
            var rst = this.eliminateVec(currentGoal.context, currentGoal.renaming, motiveType, E);
            state.addGoal(rst.map(function (type) {
                var newGoalNode = new proofstate_1.GoalNode(new proofstate_1.Goal(state.generateGoalId(), type, currentGoal.context, currentGoal.renaming));
                return newGoalNode;
            }));
            return new utils_1.go(state);
        }
    };
    EliminateVecTactic.prototype.eliminateVec = function (context, r, motiveType, entryType) {
        var baseType = (0, evaluator_1.doApp)((0, evaluator_1.doApp)(motiveType, new V.Zero()), new V.VecNil());
        var stepType = (0, evaluator_1.indVecStepType)(entryType, motiveType);
        return [baseType, stepType];
    };
    return EliminateVecTactic;
}(Tactic));
exports.EliminateVecTactic = EliminateVecTactic;
var EliminateEqualTactic = /** @class */ (function (_super) {
    __extends(EliminateEqualTactic, _super);
    function EliminateEqualTactic(location, target, motive) {
        var _this = _super.call(this, location) || this;
        _this.location = location;
        _this.target = target;
        _this.motive = motive;
        return _this;
    }
    EliminateEqualTactic.prototype.toString = function () {
        return "elim-equal ".concat(this.target, " with motive ").concat(this.motive.prettyPrint());
    };
    EliminateEqualTactic.prototype.apply = function (state) {
        var currentGoal = state.getCurrentGoal().result;
        var targetType_temp = currentGoal.context.get(this.target);
        if (!targetType_temp) {
            return new utils_1.stop(state.location, new utils_1.Message(["target not found in current context: ".concat(this.target)]));
        }
        var targetType;
        if (targetType_temp instanceof context_1.Free) {
            targetType = targetType_temp.type.now();
        }
        else {
            throw new Error("Expected target to be a free variable");
        }
        if (!(targetType instanceof V.Equal)) {
            return new utils_1.stop(state.location, new utils_1.Message(["Cannot eliminate non-Equal type: ".concat(targetType.prettyPrint())]));
        }
        var _a = [targetType.type, targetType.from, targetType.to], Av = _a[0], fromv = _a[1], tov = _a[2];
        var motiveRst = this.motive.check(currentGoal.context, currentGoal.renaming, new V.Pi('to', Av, new utils_1.HigherOrderClosure(function (to) { return new V.Pi('p', new V.Equal(Av, fromv, to), new utils_1.HigherOrderClosure(function (_) { return new V.Universe(); })); })));
        if (motiveRst instanceof utils_1.stop) {
            return motiveRst;
        }
        else {
            var motiveType = motiveRst.result.valOf((0, context_1.contextToEnvironment)(currentGoal.context));
            var rst = [(0, evaluator_1.doApp)((0, evaluator_1.doApp)(motiveType, fromv), new V.Same(fromv))];
            state.addGoal(rst.map(function (type) {
                var newGoalNode = new proofstate_1.GoalNode(new proofstate_1.Goal(state.generateGoalId(), type, currentGoal.context, currentGoal.renaming));
                return newGoalNode;
            }));
            return new utils_1.go(state);
        }
    };
    return EliminateEqualTactic;
}(Tactic));
exports.EliminateEqualTactic = EliminateEqualTactic;
var LeftTactic = /** @class */ (function (_super) {
    __extends(LeftTactic, _super);
    function LeftTactic(location) {
        var _this = _super.call(this, location) || this;
        _this.location = location;
        return _this;
    }
    LeftTactic.prototype.toString = function () {
        return "left";
    };
    LeftTactic.prototype.apply = function (state) {
        var currentGoal = state.getCurrentGoal().result;
        if (!(currentGoal.type.now() instanceof V.Either)) {
            return new utils_1.stop(state.location, new utils_1.Message(["\"left\" expected goal type to be Either, but got: ".concat(currentGoal.type.prettyPrint())]));
        }
        var leftType = currentGoal.type.leftType.now();
        state.addGoal([new proofstate_1.GoalNode(new proofstate_1.Goal(state.generateGoalId(), leftType, currentGoal.context, currentGoal.renaming))]);
        return new utils_1.go(state);
    };
    return LeftTactic;
}(Tactic));
exports.LeftTactic = LeftTactic;
var RightTactic = /** @class */ (function (_super) {
    __extends(RightTactic, _super);
    function RightTactic(location) {
        var _this = _super.call(this, location) || this;
        _this.location = location;
        return _this;
    }
    RightTactic.prototype.toString = function () {
        return "right";
    };
    RightTactic.prototype.apply = function (state) {
        var currentGoal = state.getCurrentGoal().result;
        if (!(currentGoal.type.now() instanceof V.Either)) {
            return new utils_1.stop(state.location, new utils_1.Message(["\"right\" expected goal type to be Either, but got: ".concat(currentGoal.type.prettyPrint())]));
        }
        var rightType = currentGoal.type.rightType.now();
        state.addGoal([new proofstate_1.GoalNode(new proofstate_1.Goal(state.generateGoalId(), rightType, currentGoal.context, currentGoal.renaming))]);
        return new utils_1.go(state);
    };
    return RightTactic;
}(Tactic));
exports.RightTactic = RightTactic;
var EliminateEitherTactic = /** @class */ (function (_super) {
    __extends(EliminateEitherTactic, _super);
    function EliminateEitherTactic(location, target, motive) {
        var _this = _super.call(this, location) || this;
        _this.location = location;
        _this.target = target;
        _this.motive = motive;
        return _this;
    }
    EliminateEitherTactic.prototype.toString = function () {
        return "elim-either ".concat(this.target, " with motive ").concat(this.motive.prettyPrint());
    };
    EliminateEitherTactic.prototype.apply = function (state) {
        var currentGoal = state.getCurrentGoal().result;
        var targetType_temp = currentGoal.context.get(this.target);
        if (!targetType_temp) {
            return new utils_1.stop(state.location, new utils_1.Message(["target not found in current context: ".concat(this.target)]));
        }
        var targetType;
        if (targetType_temp instanceof context_1.Free) {
            targetType = targetType_temp.type.now();
        }
        else {
            throw new Error("Expected target to be a free variable");
        }
        if (!(targetType instanceof V.Either)) {
            return new utils_1.stop(state.location, new utils_1.Message(["Cannot eliminate non-Either type: ".concat(targetType.prettyPrint())]));
        }
        var _a = [targetType.leftType, targetType.rightType], Lv = _a[0], Rv = _a[1];
        var motiveRst = this.motive.check(currentGoal.context, currentGoal.renaming, new V.Pi('x', new V.Either(Lv, Rv), new utils_1.HigherOrderClosure(function (_) { return new V.Universe(); })));
        if (motiveRst instanceof utils_1.stop) {
            return motiveRst;
        }
        else {
            var motiveType_1 = motiveRst.result.valOf((0, context_1.contextToEnvironment)(currentGoal.context));
            var leftType = new V.Pi('x', Lv, new utils_1.HigherOrderClosure(function (x) { return (0, evaluator_1.doApp)(motiveType_1, new V.Left(x)); }));
            var rightType = new V.Pi('x', Rv, new utils_1.HigherOrderClosure(function (x) { return (0, evaluator_1.doApp)(motiveType_1, new V.Right(x)); }));
            state.addGoal([
                new proofstate_1.GoalNode(new proofstate_1.Goal(state.generateGoalId(), leftType, currentGoal.context, currentGoal.renaming)),
                new proofstate_1.GoalNode(new proofstate_1.Goal(state.generateGoalId(), rightType, currentGoal.context, currentGoal.renaming))
            ]);
            return new utils_1.go(state);
        }
    };
    return EliminateEitherTactic;
}(Tactic));
exports.EliminateEitherTactic = EliminateEitherTactic;
var SpiltTactic = /** @class */ (function (_super) {
    __extends(SpiltTactic, _super);
    function SpiltTactic(location) {
        return _super.call(this, location) || this;
    }
    SpiltTactic.prototype.toString = function () {
        return "split";
    };
    SpiltTactic.prototype.apply = function (state) {
        var currentGoal = state.getCurrentGoal().result;
        if (!(currentGoal.type.now() instanceof V.Sigma)) {
            return new utils_1.stop(state.location, new utils_1.Message(["\"split\" expected goal type to be Sigma, but got: ".concat(currentGoal.type.prettyPrint())]));
        }
        var pairType = currentGoal.type.now();
        var carType = pairType.carType.now();
        var cdrType = pairType.cdrType.valOfClosure(pairType);
        state.addGoal([
            new proofstate_1.GoalNode(new proofstate_1.Goal(state.generateGoalId(), carType, currentGoal.context, currentGoal.renaming)),
            new proofstate_1.GoalNode(new proofstate_1.Goal(state.generateGoalId(), cdrType, currentGoal.context, currentGoal.renaming))
        ]);
        return new utils_1.go(state);
    };
    return SpiltTactic;
}(Tactic));
exports.SpiltTactic = SpiltTactic;
var EliminateAbsurdTactic = /** @class */ (function (_super) {
    __extends(EliminateAbsurdTactic, _super);
    function EliminateAbsurdTactic(location, target, motive) {
        var _this = _super.call(this, location) || this;
        _this.location = location;
        _this.target = target;
        _this.motive = motive;
        return _this;
    }
    EliminateAbsurdTactic.prototype.toString = function () {
        return "elim-absurd ".concat(this.target, " with motive ").concat(this.motive.prettyPrint());
    };
    EliminateAbsurdTactic.prototype.apply = function (state) {
        var currentGoal = state.getCurrentGoal().result;
        var targetType_temp = currentGoal.context.get(this.target);
        if (!targetType_temp) {
            return new utils_1.stop(state.location, new utils_1.Message(["target not found in current context: ".concat(this.target)]));
        }
        var targetType;
        if (targetType_temp instanceof context_1.Free) {
            targetType = targetType_temp.type.now();
        }
        else {
            throw new Error("Expected target to be a free variable");
        }
        if (!(targetType instanceof V.Absurd)) {
            return new utils_1.stop(state.location, new utils_1.Message(["Cannot eliminate non-Absurd type: ".concat(targetType.prettyPrint())]));
        }
        var motiveRst = this.motive.check(currentGoal.context, currentGoal.renaming, new V.Universe());
        if (motiveRst instanceof utils_1.stop) {
            return motiveRst;
        }
        else {
            state.currentGoal.isComplete = true;
            state.nextGoal();
            return new utils_1.go(state);
        }
    };
    return EliminateAbsurdTactic;
}(Tactic));
exports.EliminateAbsurdTactic = EliminateAbsurdTactic;
