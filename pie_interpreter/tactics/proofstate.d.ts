import { Context } from '../utils/context';
import { Core } from '../types/core';
import { Value } from '../types/value';
import { Location } from '../utils/locations';
import { Perhaps } from '../types/utils';
import { Renaming } from '../typechecker/utils';
type GoalId = string;
export declare class Goal {
    id: GoalId;
    type: Value;
    context: Context;
    renaming: Renaming;
    term?: Core | undefined;
    constructor(id: GoalId, type: Value, context: Context, renaming: Renaming, term?: Core | undefined);
    clone(modifications?: Partial<Goal>): Goal;
    addHypothesis(name: string, type: Value): void;
    getVariableType(name: string): Value | undefined;
    prettyPrintWithContext(): string;
}
export declare class GoalNode {
    goal: Goal;
    children: GoalNode[];
    parent: GoalNode | null;
    isComplete: boolean;
    childFocusIndex: number;
    constructor(goal: Goal);
    addChildren(children: GoalNode[]): void;
    findById(goalId: GoalId): GoalNode | null;
}
export declare class ProofState {
    location: Location;
    goalTree: GoalNode;
    currentGoal: GoalNode;
    proofHistory: ProofState[];
    private goalIdCounter;
    constructor(location: Location, goalTree: GoalNode);
    static initialize(globalContext: Context, theorem: Value, location: Location): ProofState;
    generateGoalId(): string;
    isComplete(): boolean;
    getCurrentGoal(): Perhaps<Goal>;
    visualizeTree(): string;
    private visualizeNode;
    addGoal(goals: GoalNode[]): void;
    nextGoal(): boolean;
    private nextGoalAux;
    previousGoal(): void;
    private PreviousGoalAux;
}
export interface ProofSummary {
    totalGoals: number;
    completedGoals: number;
}
export {};
//# sourceMappingURL=proofstate.d.ts.map