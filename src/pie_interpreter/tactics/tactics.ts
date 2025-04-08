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

/**
 * Base class for all tactics
 */
export abstract class Tactic {
  constructor(public location: Location) {}

  /**
   * Apply this tactic to a proof state
   */
  abstract apply(state: ProofState): Perhaps<ProofState>;

  /**
   * Display name for the tactic
   */
  abstract getName(): string;

  abstract toString(): string;
}

/**
 * The 'intro' tactic - introduces a variable in a Pi type
 * Similar to Coq's 'intro' tactic
 */
export class IntroTactic extends Tactic {
  constructor(
    public location: Location,  
    private varName?: string  // Optional parameter for naming
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
    
    // Only applicable to Pi types (function types)
    if (!(goalType instanceof Pi)) {
      return new stop(state.location, 
        new Message([`Cannot introduce a variable for non-function type: ${goalType}`]));
    }

    // Create a new state with this change
    const newState = state.checkpoint();
    
    // Get the actual variable name to use
    const name = this.varName || goalType.argName || fresh(state.context, "x");
    
    // Update the context with the new variable
    const newContext = bindFree(state.context, name, goalType.argType);
    
    // Create a new goal for the body of the function
    const newGoalType = goalType.resultType.valOfClosure(
      new Neutral(goalType.argType, new Variable(name))
    );
    
    // Replace the current goal with this new goal
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

  getName(): string {
    return "exact";
  }

  toString(): string {
    return `exact ${this.term.prettyPrint()}`;
  }
  apply(state: ProofState): Perhaps<ProofState> {
    const currentGoal = state.getCurrentGoal();
    if (!currentGoal) {
      return new stop(state.location, new Message(["No current goal"]));
    }

    // First synthesize the type of the term
    const termResult = this.term.synth(state.context, new Map());
    if (termResult instanceof stop) {
      return termResult;
    }

    const { expr, type } = (termResult as go<any>).result;
    const termType = type.valOf(contextToEnvironment(state.context));
    const goalType = currentGoal.type;

    // Check if the term type matches the goal type
    sameType(state.context, state.location, termType, goalType);

    // Create a new state with this change
    const newState = state.checkpoint();
    
    // Set the term for this goal
    currentGoal.term = expr;
    
    // Remove this goal as it's now solved
    newState.goals.splice(newState.focusedGoal, 1);
    
    // Update the focused goal if needed
    if (newState.goals.length > 0) {
      newState.focusedGoal = Math.min(newState.focusedGoal, newState.goals.length - 1);
    }
    
    return new go(newState);
  }
}