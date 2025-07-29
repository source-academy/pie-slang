import { Claim, Context, extendContext } from '../utils/context';
import { Source } from '../types/source';
import { Core } from '../types/core';
import { Value } from '../types/value';
import { Location } from '../utils/locations';
import { Free } from '../utils/context';  // Add this import
import { fresh, go, Perhaps, stop } from '../types/utils';
import { Renaming } from '../typechecker/utils';

type GoalId = string;

//TODO: Add location

export class Goal {
  constructor(
    public id: GoalId,
    public type: Value,
    public context: Context,
    public renaming: Renaming,
    public term?: Core,
  ) { }

  clone(modifications: Partial<Goal> = {}): Goal {
    return new Goal(
      modifications.id ?? this.id,
      modifications.type ?? this.type,
      modifications.context ?? new Map(this.context),
      modifications.renaming ?? new Map(this.renaming),
      modifications.term ?? this.term,
    );
  }

  addHypothesis(name: string, type: Value): void {
    const freename = fresh(this.context, name);
    extendContext(this.context, freename, new Claim(type))
  }

  getVariableType(name: string): Value | undefined {
    const binder = this.context.get(name);
    return binder?.type;
  }
  
  prettyPrintWithContext(): string {
    const contextStr = Array.from(this.context.entries())
      .map(([name, binder]) => `${name} : ${binder.type.readBackType(this.context).prettyPrint()}`)
      .join('\n  ');

    const goalStr = this.type.readBackType(this.context).prettyPrint();

    return contextStr ?
      `Context:\n  ${contextStr}\n────────────────\nGoal: ${goalStr}` :
      `Goal: ${goalStr}`;
  }
}

export class GoalNode {
  public children: GoalNode[] = [];
  public parent: GoalNode | null = null;
  public isComplete: boolean = false;
  public childFocusIndex: number = -1;

  constructor(
    public goal: Goal,
  ) { }

  addChildren(children: GoalNode[]): void {
    children.forEach(child => {
      child.parent = this;
    });
    this.children = children;
  }

  findById(goalId: GoalId): GoalNode | null {
    if (this.goal.id === goalId) {
      return this;
    }

    for (const child of this.children) {
      const found = child.findById(goalId);
      if (found) return found;
    }

    return null;
  }
}

export class ProofState {
  public currentGoal: GoalNode;
  public proofHistory: ProofState[] = [];
  private goalIdCounter: number = 0;

  constructor(
    public location: Location,
    public goalTree: GoalNode
  ) {
    this.currentGoal = this.goalTree;
  }

  static initialize(globalContext: Context, theorem: Value, location: Location): ProofState {
    const rootGoal = new Goal(
      "goal_0",
      theorem,
      new Map(globalContext),
      new Map(),
    );

    const proofstate = new ProofState(location, new GoalNode(rootGoal))
    proofstate.currentGoal = proofstate.goalTree
    return proofstate
  }

  generateGoalId(): string {
    return `goal_${++this.goalIdCounter}`;
  }

  isComplete(): boolean {
    return this.goalTree.isComplete;
  }

  getCurrentGoal(): Perhaps<Goal> {
    if (this.currentGoal === null) {
      throw new Error("No current goal available.")
    }
    return new go(this.currentGoal.goal);
  }

  visualizeTree(): string {
    return this.visualizeNode(this.goalTree, "", true);
  }

  private visualizeNode(node: GoalNode, prefix: string, isLast: boolean): string {
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

  addGoal(goals: GoalNode[]): void {
    this.currentGoal.addChildren(goals)
    this.currentGoal.childFocusIndex = 0
    this.currentGoal = goals[0]
  }

  nextGoal(): boolean {

    if (this.currentGoal.parent === null) {
      return true
    }

    let cur_parent = this.currentGoal.parent;
    const nextGoal = this.nextGoalAux(cur_parent);
    if (nextGoal === null) {
      return true
    } else {
      this.currentGoal = nextGoal;
      return false;
    }
  }

  private nextGoalAux(curParent): GoalNode {
    if (curParent.childFocusIndex === -1 || curParent.childFocusIndex >= curParent.children.length - 1) {
      curParent.isComplete = true;
      if (curParent.parent === null) {
        return null;
      } else {
        return this.nextGoalAux(curParent.parent);
      }
    } else {
      curParent.childFocusIndex += 1;
      return curParent.children[curParent.childFocusIndex];
    }
  }

  previousGoal(): void {
    if (this.currentGoal.parent === null) {
      throw new Error("No previous goal available at the root level.");
    }

    const prevGoal = this.PreviousGoalAux(this.currentGoal);
    if (prevGoal === null) {
      throw new Error("No previous goal found.");
    } else {
      this.currentGoal = prevGoal;
    }
  }

  private PreviousGoalAux(curParent): GoalNode | null {
    if (curParent.childFocusIndex === 0) {
      return curParent
    } else {
      let isBottom = false
      let curNode = curParent.children[curParent.childFocusIndex - 1]
      while (!isBottom) {
        if (curNode.childFocusINdex === -1) {
          isBottom = true
          return curNode
        } else {
          curNode = curNode.children[curNode.childFocusIndex]
        }
      }

    }

  }
}

export interface ProofSummary {
  totalGoals: number;
  completedGoals: number;
}