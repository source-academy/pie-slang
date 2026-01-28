import { Claim, Context, extendContext } from '../utils/context';
import { Core } from '../types/core';
import { Value } from '../types/value';
import { Location } from '../utils/locations';
import { fresh, go, Perhaps } from '../types/utils';
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

  toSerializable(isComplete: boolean, isCurrent: boolean): SerializableGoal {
    const contextEntries: SerializableContextEntry[] = Array.from(this.context.entries())
      .map(([name, binder]) => ({
        name,
        type: binder.type.readBackType(this.context).prettyPrint()
      }));

    return {
      id: this.id,
      type: this.type.readBackType(this.context).prettyPrint(),
      contextEntries,
      isComplete,
      isCurrent
    };
  }

  /**
   * Serialize the goal with introducedBy tracking.
   * Context entries not in parentContextNames are marked as introduced by the given tactic.
   */
  toSerializableWithIntroducedBy(
    isComplete: boolean,
    isCurrent: boolean,
    parentContextNames: Set<string>,
    introducingTactic?: string
  ): SerializableGoal {
    const contextEntries: SerializableContextEntry[] = Array.from(this.context.entries())
      .map(([name, binder]) => ({
        name,
        type: binder.type.readBackType(this.context).prettyPrint(),
        // Mark as introduced if not in parent's context
        introducedBy: parentContextNames.has(name) ? undefined : introducingTactic
      }));

    return {
      id: this.id,
      type: this.type.readBackType(this.context).prettyPrint(),
      contextEntries,
      isComplete,
      isCurrent
    };
  }
}

export class GoalNode {
  public children: GoalNode[] = [];
  public parent: GoalNode | null = null;
  public isComplete: boolean = false;
  public childFocusIndex: number = -1;
  public appliedTactic?: string;  // Tactic that was applied to create children
  public completedBy?: string;    // Tactic that directly solved this goal (for leaf nodes)

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

  toSerializable(currentGoalId: string | null): SerializableGoalNode {
    const isCurrent = this.goal.id === currentGoalId;

    // Get parent's context entry names to determine which entries are introduced
    const parentContextNames = this.parent
      ? new Set(Array.from(this.parent.goal.context.entries()).map(([name]) => name))
      : new Set<string>();

    // Get the tactic that created this goal (from parent's appliedTactic)
    const introducingTactic = this.parent?.appliedTactic;

    return {
      goal: this.goal.toSerializableWithIntroducedBy(this.isComplete, isCurrent, parentContextNames, introducingTactic),
      children: this.children.map(child => child.toSerializable(currentGoalId)),
      appliedTactic: this.appliedTactic,
      completedBy: this.completedBy
    };
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

    const cur_parent = this.currentGoal.parent;
    const nextGoal = this.nextGoalAux(cur_parent);
    if (nextGoal === null) {
      return true
    } else {
      this.currentGoal = nextGoal;
      return false;
    }
  }

  private nextGoalAux(curParent): GoalNode | null {
    if (curParent.childFocusIndex === -1 || curParent.childFocusIndex >= curParent.children.length - 1) {
      // Only mark parent complete if ALL children are actually complete
      const allChildrenComplete = curParent.children.length === 0 ||
        curParent.children.every(child => child.isComplete);

      if (allChildrenComplete) {
        curParent.isComplete = true;
      }

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
    return null; // Add explicit return for the else branch

  }

  getProofTreeData(): ProofTreeData {
    const currentGoalId = this.currentGoal ? this.currentGoal.goal.id : null;
    return {
      root: this.goalTree.toSerializable(currentGoalId),
      isComplete: this.isComplete(),
      currentGoalId
    };
  }

  /**
   * Set the current goal by its ID.
   * Used when the user wants to apply a tactic to a specific goal.
   * Returns true if the goal was found and set, false otherwise.
   */
  setCurrentGoalById(goalId: string): boolean {
    const found = this.findGoalById(this.goalTree, goalId);
    if (found) {
      this.currentGoal = found;
      return true;
    }
    return false;
  }

  private findGoalById(node: GoalNode, goalId: string): GoalNode | null {
    if (node.goal.id === goalId) {
      return node;
    }
    for (const child of node.children) {
      const found = this.findGoalById(child, goalId);
      if (found) {
        return found;
      }
    }
    return null;
  }
}

export interface ProofSummary {
  totalGoals: number;
  completedGoals: number;
}

// Serializable types for proof tree visualization
export interface SerializableContextEntry {
  name: string;
  type: string;
  introducedBy?: string;  // Tactic that introduced this variable (if any)
}

export interface SerializableGoal {
  id: string;
  type: string;
  contextEntries: SerializableContextEntry[];
  isComplete: boolean;
  isCurrent: boolean;
}

export interface SerializableGoalNode {
  goal: SerializableGoal;
  children: SerializableGoalNode[];
  appliedTactic?: string;
  completedBy?: string;  // Tactic that directly solved this leaf goal
}

export interface ProofTreeData {
  root: SerializableGoalNode;
  isComplete: boolean;
  currentGoalId: string | null;
}
