"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ProofState = exports.GoalNode = exports.Goal = void 0;
const context_1 = require("../utils/context");
const utils_1 = require("../types/utils");
//TODO: Add location
class Goal {
    constructor(id, type, context, renaming, term) {
        this.id = id;
        this.type = type;
        this.context = context;
        this.renaming = renaming;
        this.term = term;
    }
    clone(modifications = {}) {
        return new Goal(modifications.id ?? this.id, modifications.type ?? this.type, modifications.context ?? new Map(this.context), modifications.renaming ?? new Map(this.renaming), modifications.term ?? this.term);
    }
    addHypothesis(name, type) {
        const freename = (0, utils_1.fresh)(this.context, name);
        (0, context_1.extendContext)(this.context, freename, new context_1.Claim(type));
    }
    getVariableType(name) {
        const binder = this.context.get(name);
        return binder?.type;
    }
    prettyPrintWithContext() {
        const contextStr = Array.from(this.context.entries())
            .map(([name, binder]) => `${name} : ${binder.type.readBackType(this.context).prettyPrint()}`)
            .join('\n  ');
        const goalStr = this.type.readBackType(this.context).prettyPrint();
        return contextStr ?
            `Context:\n  ${contextStr}\n────────────────\nGoal: ${goalStr}` :
            `Goal: ${goalStr}`;
    }
}
exports.Goal = Goal;
class GoalNode {
    constructor(goal) {
        this.goal = goal;
        this.children = [];
        this.parent = null;
        this.isComplete = false;
        this.childFocusIndex = -1;
    }
    addChildren(children) {
        children.forEach(child => {
            child.parent = this;
        });
        this.children = children;
    }
    findById(goalId) {
        if (this.goal.id === goalId) {
            return this;
        }
        for (const child of this.children) {
            const found = child.findById(goalId);
            if (found)
                return found;
        }
        return null;
    }
}
exports.GoalNode = GoalNode;
class ProofState {
    constructor(location, goalTree) {
        this.location = location;
        this.goalTree = goalTree;
        this.proofHistory = [];
        this.goalIdCounter = 0;
        this.currentGoal = this.goalTree;
    }
    static initialize(globalContext, theorem, location) {
        const rootGoal = new Goal("goal_0", theorem, new Map(globalContext), new Map());
        const proofstate = new ProofState(location, new GoalNode(rootGoal));
        proofstate.currentGoal = proofstate.goalTree;
        return proofstate;
    }
    generateGoalId() {
        return `goal_${++this.goalIdCounter}`;
    }
    isComplete() {
        return this.goalTree.isComplete;
    }
    getCurrentGoal() {
        if (this.currentGoal === null) {
            throw new Error("No current goal available.");
        }
        return new utils_1.go(this.currentGoal.goal);
    }
    visualizeTree() {
        return this.visualizeNode(this.goalTree, "", true);
    }
    visualizeNode(node, prefix, isLast) {
        const connector = isLast ? "└── " : "├── ";
        const status = node.isComplete ? "✓" : (node === this.currentGoal ? "→" : "○");
        const goalInfo = `${status} ${node.goal.id}`;
        let result = prefix + connector + goalInfo + "\n";
        const childPrefix = prefix + (isLast ? "    " : "│   ");
        for (let i = 0; i < node.children.length; i++) {
            const isLastChild = i === node.children.length - 1;
            result += this.visualizeNode(node.children[i], childPrefix, isLastChild);
        }
        return result;
    }
    addGoal(goals) {
        this.currentGoal.addChildren(goals);
        this.currentGoal.childFocusIndex = 0;
        this.currentGoal = goals[0];
    }
    nextGoal() {
        if (this.currentGoal.parent === null) {
            return true;
        }
        let cur_parent = this.currentGoal.parent;
        const nextGoal = this.nextGoalAux(cur_parent);
        if (nextGoal === null) {
            return true;
        }
        else {
            this.currentGoal = nextGoal;
            return false;
        }
    }
    nextGoalAux(curParent) {
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
    }
    previousGoal() {
        if (this.currentGoal.parent === null) {
            throw new Error("No previous goal available at the root level.");
        }
        const prevGoal = this.PreviousGoalAux(this.currentGoal);
        if (prevGoal === null) {
            throw new Error("No previous goal found.");
        }
        else {
            this.currentGoal = prevGoal;
        }
    }
    PreviousGoalAux(curParent) {
        if (curParent.childFocusIndex === 0) {
            return curParent;
        }
        else {
            let isBottom = false;
            let curNode = curParent.children[curParent.childFocusIndex - 1];
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
    }
}
exports.ProofState = ProofState;
//# sourceMappingURL=proofstate.js.map