import { ProofState, Goal } from './proofstate';
import { Perhaps, go, stop, Message } from '../types/utils';
import { Source } from '../types/source';
import { Core } from '../types/core';
import { Value, Lambda, Pi, Neutral} from '../types/value';
import { bindFree, Context, contextToEnvironment } from '../utils/context';
import { readBack } from '../evaluator/utils';
import { doApp } from '../evaluator/evaluator';
import { fresh } from '../types/utils';
import { Variable } from '../types/neutral';
import { sameType } from '../typechecker/utils';
import { Location } from '../utils/locations';

export abstract class Tactic {
  constructor(public location: Location) {}

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
    const currentGoal = state.getCurrentGoal();
    if (!currentGoal) {
      return new stop(state.location, new Message(["No current goal"]));
    }

    const goalType = currentGoal.type;
    
    if (!(goalType instanceof Pi)) {
      return new stop(state.location, 
        new Message([`Cannot introduce a variable for non-function type: ${goalType}`]));
    }

    const newState = state.checkpoint();
    
    const name = this.varName || goalType.argName || fresh(state.context, "x");
    
    const newContext = bindFree(state.context, name, goalType.argType);
    
    const newGoalType = goalType.resultType.valOfClosure(
      new Neutral(goalType.argType, new Variable(name))
    );
    
    const newGoal = new Goal(currentGoal.id, newGoalType);
    newState.goals[newState.focusedGoal] = newGoal;
    newState.context = newContext;
    
    return new go(newState);
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
    const currentGoal = state.getCurrentGoal();
    if (!currentGoal) {
      return new stop(state.location, new Message(["No current goal"]));
    }

    const termResult = this.term.synth(state.context, new Map());
    if (termResult instanceof stop) {
      return termResult;
    }

    const { expr, type } = (termResult as go<any>).result;
    const termType = type.valOf(contextToEnvironment(state.context));
    const goalType = currentGoal.type;

    sameType(state.context, state.location, termType, goalType);

    const newState = state.checkpoint();
    
    currentGoal.term = expr;
    
    newState.goals.splice(newState.focusedGoal, 1);
    
    if (newState.goals.length > 0) {
      newState.focusedGoal = Math.min(newState.focusedGoal, newState.goals.length - 1);
    }
    
    return new go(newState);
  }
}