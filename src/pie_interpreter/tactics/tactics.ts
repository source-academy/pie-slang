import { ProofState, Goal, GoalNode } from './proofstate';
import { Perhaps, go, stop, Message, FirstOrderClosure, HigherOrderClosure } from '../types/utils';
import { Source } from '../types/source';
import { Core, Universe } from '../types/core';
import { Value, Lambda, Pi, Neutral, Nat } from '../types/value';
import { bindFree, Claim, Context, contextToEnvironment, extendContext, Free, valInContext } from '../utils/context';
import { readBack } from '../evaluator/utils';
import { doApp } from '../evaluator/evaluator';
import { fresh } from '../types/utils';
import { Variable } from '../types/neutral';
import { extendRenaming, Renaming, sameType } from '../typechecker/utils';
import { Location } from '../utils/locations';
import * as V from '../types/value';
import * as C from '../types/core';

export abstract class Tactic {
  constructor(public location: Location) { }

  abstract apply(state: ProofState): Perhaps<ProofState>;

  abstract toString(): string;
}

export class IntroTactic extends Tactic {
  constructor(
    public location: Location,
    private varName?: string
  ) {
    super(location);
  }

  getName(): string {
    return "intro";
  }

  toString(): string {
    return `intro ${this.varName || ""}`;
  }

  apply(state: ProofState): Perhaps<ProofState> {

    const currentGoal = state.currentGoal.goal
    const goalType = currentGoal.type;

    if (!(goalType instanceof Pi)) {
      return new stop(state.location,
        new Message([`Cannot introduce a variable for non-function type: ${goalType.prettyPrint()}`]));
    }

    const name = this.varName || goalType.argName || fresh(currentGoal.context, "x");

    let newRenaming = currentGoal.renaming
    if (name !== goalType.argName) {
      extendRenaming(newRenaming, goalType.argName, name);
    }

    const newContext = extendContext(currentGoal.context, name, new Claim(goalType.argType))

    const newGoalType = goalType.resultType.valOfClosure(
      new Neutral(goalType.argType, new Variable(name))
    );

    
    

    const newGoalNode = new GoalNode(new Goal(state.generateGoalId(), newGoalType, newContext, newRenaming))
    state.addGoal([newGoalNode])

    return new go(state);
  }
}

export class ExactTactic extends Tactic {
  constructor(
    public location: Location,
    private term: Source
  ) {
    super(location);
  }

  toString(): string {
    return `exact ${this.term.prettyPrint()}`;
  }
  apply(state: ProofState): Perhaps<ProofState> {

    const currentGoal = state.currentGoal.goal
    const goalType = currentGoal.type
    const result = this.term.check(currentGoal.context, currentGoal.renaming, goalType)

    if (result instanceof stop) {
      return result;
    }

    state.currentGoal.isComplete = true;

    state.nextGoal()

    return new go(state);
  }
}

export class EliminateTactic extends Tactic {
  constructor(
    public location: Location,
    private target: string,
    private motive: Source
  ) {
    super(location);
  }

  toString(): string {
    return `eliminate ${this.target}
     to prove ${this.motive.prettyPrint()}`;
  }

  apply(state: ProofState): Perhaps<ProofState> {
    const currentGoal_temp = state.getCurrentGoal()
    if (currentGoal_temp instanceof stop) {
      return currentGoal_temp;
    }

    const currentGoal = state.currentGoal.goal
    const goalType = currentGoal.type;

    const targetType_temp = currentGoal.context.get(this.target);

    if (!targetType_temp) {
      return new stop(state.location, new Message([`target not found in current context: ${this.target}`]));
    }

    let targetType
    if (targetType_temp instanceof Free) {
      targetType = targetType_temp.type.now()
    } else {
      throw new Error(`Expected target to be a free variable`);
    }

    if (targetType instanceof Nat) {
      const name = fresh(currentGoal.context, "n");
      const motiveRst = this.motive.check(currentGoal.context, currentGoal.renaming,
        new Pi(
          name,
          new V.Nat(),
          new HigherOrderClosure((_) => new V.Universe())
        )
      )

      if (motiveRst instanceof stop) {
        return motiveRst;
      } else {
        const rst = this.eliminateNat(currentGoal.context, currentGoal.renaming, (motiveRst as go<Value>).result);
        state.addGoal(
          rst.map((type) => {
            const newGoalNode = new GoalNode(
              new Goal(state.generateGoalId(), type, currentGoal.context, currentGoal.renaming)
            );
            return newGoalNode;
          }))
      }

    }
  }

  private eliminateNat(context: Context, r: Renaming, motiveType: Value): Value[] {
    // For Nat elimination, we need:
    // 1. A base case: (motive zero)
    // 2. A step case: (Π (n-1 Nat) (→ (motive n-1) (motive (add1 n-1))))

    const baseType = doApp(motiveType, new V.Zero());

    const stepVar = fresh(context, "n-1");
    const ihVar = fresh(context, "ih");
    
    const stepType = new V.Pi(
      stepVar,
      new V.Nat(),
      new HigherOrderClosure((n_minus_1) => {
        return new V.Pi(
          ihVar,
          doApp(motiveType, n_minus_1),
          new HigherOrderClosure((_) => 
            doApp(motiveType, new V.Add1(n_minus_1))
          )
        );
      })
    ); 
    
    return [baseType, stepType]
  }

  
}