import { ProofState, Goal } from './proofstate';
import { Tactic } from './tactics';
import { Context, addClaimToContext, Define } from '../utils/context';
import { Source } from '../types/source';
import { Core } from '../types/core';
import { Location } from '../utils/locations';
import { Perhaps, go, stop, Message } from '../types/utils';
import { readBack } from '../evaluator/utils';
import { Value } from '../types/value';

/**
 * Manages interactive proof sessions
 */
export class ProofManager {
  private activeProofs: Map<string, ProofState> = new Map();

  /**
   * Start a new proof for a given claim
   */
  startProof(name: string, context: Context, location: Location): Perhaps<string> {
    // Check if a proof is already in progress for this name
    if (this.activeProofs.has(name)) {
      return new stop(location, new Message([`A proof for ${name} is already in progress`]));
    }

    // // First, add the claim to the context
    // const ctxResult = addClaimToContext(context, name, location, type);
    // if (ctxResult instanceof stop) {
    //   return ctxResult;
    // }

    // Get the claim's type as a Value
    const claim = context.get(name);
    if (!claim) {
      return new stop(location, new Message([`Failed to add claim ${name} to context`]));
    }

    // Initialize a new proof state
    const initialState = ProofState.initialize(context, claim.type, location);
    this.activeProofs.set(name, initialState);

    return new go(`Started proof of ${name}` + `\nCurrent goal: \n${claim.type.readBackType(context).prettyPrint()}`);
  }

  /**
   * Apply a tactic to the current proof
   */

  applyTactic(name: string, tactic: Tactic): Perhaps<string> {
    // Check if a proof exists for this name
    const proofState = this.activeProofs.get(name);
    if (!proofState) {
      return new stop(tactic.location, new Message([`No proof in progress for ${name}`]));
    }

    // Apply the tactic to the current proof state
    const newStateResult = tactic.apply(proofState);
    if (newStateResult instanceof stop) {
      return newStateResult;
    }

    const newState = (newStateResult as go<ProofState>).result;
    this.activeProofs.set(name, newState);

    // Generate a response message
    let response = `\nApplied tactic: ${tactic}`;

    // Add information about the current goal, if any
    const currentGoal = newState.getCurrentGoal();
    if (currentGoal) {
      response += `\nCurrent goal: \n${this.formatGoal(currentGoal, newState.context)}`;
    } else if (newState.isComplete()) {
      response += "\nAll goals have been solved!";
    }

    return new go(response);
  }

  private formatGoal(goal: Goal, context: Context): string {
    try {
      const typeStr = goal.type.readBackType(context).prettyPrint();
      return typeStr;
    } catch (error) {
      return `<Error formatting goal: ${error.message}>`;
    }
  }
}