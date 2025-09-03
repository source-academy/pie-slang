"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ProofState = exports.GoalNode = exports.Goal = void 0;
var context_1 = require("../utils/context");
var utils_1 = require("../types/utils");
//TODO: Add location
var Goal = /** @class */ (function () {
    function Goal(id, type, context, renaming, term) {
        this.id = id;
        this.type = type;
        this.context = context;
        this.renaming = renaming;
        this.term = term;
    }
    Goal.prototype.clone = function (modifications) {
        var _a, _b, _c, _d, _e;
        if (modifications === void 0) { modifications = {}; }
        return new Goal((_a = modifications.id) !== null && _a !== void 0 ? _a : this.id, (_b = modifications.type) !== null && _b !== void 0 ? _b : this.type, (_c = modifications.context) !== null && _c !== void 0 ? _c : new Map(this.context), (_d = modifications.renaming) !== null && _d !== void 0 ? _d : new Map(this.renaming), (_e = modifications.term) !== null && _e !== void 0 ? _e : this.term);
    };
    Goal.prototype.addHypothesis = function (name, type) {
        var freename = (0, utils_1.fresh)(this.context, name);
        (0, context_1.extendContext)(this.context, freename, new context_1.Claim(type));
    };
    Goal.prototype.getVariableType = function (name) {
        var binder = this.context.get(name);
        return binder === null || binder === void 0 ? void 0 : binder.type;
    };
    Goal.prototype.prettyPrintWithContext = function () {
        var _this = this;
        var contextStr = Array.from(this.context.entries())
            .map(function (_a) {
            var name = _a[0], binder = _a[1];
            return "".concat(name, " : ").concat(binder.type.readBackType(_this.context).prettyPrint());
        })
            .join('\n  ');
        var goalStr = this.type.readBackType(this.context).prettyPrint();
        return contextStr ?
            "Context:\n  ".concat(contextStr, "\n\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\nGoal: ").concat(goalStr) :
            "Goal: ".concat(goalStr);
    };
    return Goal;
}());
exports.Goal = Goal;
var GoalNode = /** @class */ (function () {
    function GoalNode(goal) {
        this.goal = goal;
        this.children = [];
        this.parent = null;
        this.isComplete = false;
        this.childFocusIndex = -1;
    }
    GoalNode.prototype.addChildren = function (children) {
        var _this = this;
        children.forEach(function (child) {
            child.parent = _this;
        });
        this.children = children;
    };
    GoalNode.prototype.findById = function (goalId) {
        if (this.goal.id === goalId) {
            return this;
        }
        for (var _i = 0, _a = this.children; _i < _a.length; _i++) {
            var child = _a[_i];
            var found = child.findById(goalId);
            if (found)
                return found;
        }
        return null;
    };
    return GoalNode;
}());
exports.GoalNode = GoalNode;
var ProofState = /** @class */ (function () {
    function ProofState(location, goalTree) {
        this.location = location;
        this.goalTree = goalTree;
        this.proofHistory = [];
        this.goalIdCounter = 0;
        this.currentGoal = this.goalTree;
    }
    ProofState.initialize = function (globalContext, theorem, location) {
        var rootGoal = new Goal("goal_0", theorem, new Map(globalContext), new Map());
        var proofstate = new ProofState(location, new GoalNode(rootGoal));
        proofstate.currentGoal = proofstate.goalTree;
        return proofstate;
    };
    ProofState.prototype.generateGoalId = function () {
        return "goal_".concat(++this.goalIdCounter);
    };
    ProofState.prototype.isComplete = function () {
        return this.goalTree.isComplete;
    };
    ProofState.prototype.getCurrentGoal = function () {
        if (this.currentGoal === null) {
            throw new Error("No current goal available.");
        }
        return new utils_1.go(this.currentGoal.goal);
    };
    ProofState.prototype.visualizeTree = function () {
        return this.visualizeNode(this.goalTree, "", true);
    };
    ProofState.prototype.visualizeNode = function (node, prefix, isLast) {
        var connector = isLast ? "└── " : "├── ";
        var status = node.isComplete ? "✓" : (node === this.currentGoal ? "→" : "○");
        var goalInfo = "".concat(status, " ").concat(node.goal.id);
        var result = prefix + connector + goalInfo + "\n";
        var childPrefix = prefix + (isLast ? "    " : "│   ");
        for (var i = 0; i < node.children.length; i++) {
            var isLastChild = i === node.children.length - 1;
            result += this.visualizeNode(node.children[i], childPrefix, isLastChild);
        }
        return result;
    };
    ProofState.prototype.addGoal = function (goals) {
        this.currentGoal.addChildren(goals);
        this.currentGoal.childFocusIndex = 0;
        this.currentGoal = goals[0];
    };
    ProofState.prototype.nextGoal = function () {
        if (this.currentGoal.parent === null) {
            return true;
        }
        var cur_parent = this.currentGoal.parent;
        var nextGoal = this.nextGoalAux(cur_parent);
        if (nextGoal === null) {
            return true;
        }
        else {
            this.currentGoal = nextGoal;
            return false;
        }
    };
    ProofState.prototype.nextGoalAux = function (curParent) {
        if (curParent.childFocusIndex === -1 || curParent.childFocusIndex >= curParent.children.length - 1) {
            curParent.isComplete = true;
            if (curParent.parent === null) {
                return null;
            }
            else {
                return this.nextGoalAux(curParent.parent);
            }
        }
        else {
            curParent.childFocusIndex += 1;
            return curParent.children[curParent.childFocusIndex];
        }
    };
    ProofState.prototype.previousGoal = function () {
        if (this.currentGoal.parent === null) {
            throw new Error("No previous goal available at the root level.");
        }
        var prevGoal = this.PreviousGoalAux(this.currentGoal);
        if (prevGoal === null) {
            throw new Error("No previous goal found.");
        }
        else {
            this.currentGoal = prevGoal;
        }
    };
    ProofState.prototype.PreviousGoalAux = function (curParent) {
        if (curParent.childFocusIndex === 0) {
            return curParent;
        }
        else {
            var isBottom = false;
            var curNode = curParent.children[curParent.childFocusIndex - 1];
            while (!isBottom) {
                if (curNode.childFocusINdex === -1) {
                    isBottom = true;
                    return curNode;
                }
                else {
                    curNode = curNode.children[curNode.childFocusIndex];
                }
            }
        }
    };
    return ProofState;
}());
exports.ProofState = ProofState;
