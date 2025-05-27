import { ProofState, Goal } from './proofstate';
import { Tactic } from './tactics';
import { Context, addClaimToContext, Define, Claim } from '../utils/context';
import { Source } from '../types/source';
import { Core } from '../types/core';
import { Location } from '../utils/locations';
import { Perhaps, go, stop, Message } from '../types/utils';
import { readBack } from '../evaluator/utils';
import { Value } from '../types/value';

export class ProofManager {
  public currentState: ProofState | null = null;

  startProof(name: string, context: Context, location: Location): Perhaps<string> {

    const claim = context.get(name);
    if (! (claim instanceof Claim)) {
      return new stop(location, new Message([`${name} is not a valid type or has already been proved`]));
    }

    this.currentState = ProofState.initialize(context, claim.type, location);

    return new go(`Started proof of ${name}` + `\nCurrent goal: \n${claim.type.readBackType(context).prettyPrint()}`);
  }


  applyTactic(tactic: Tactic): Perhaps<string> {
    if (!this.currentState) {
      return new stop(tactic.location, new Message([`No proof has been initialized`]));
    }

    const newStateResult = tactic.apply(this.currentState);
    if (newStateResult instanceof stop) {
      return newStateResult;
    }

    this.currentState = (newStateResult as go<ProofState>).result;

    let response = `\nApplied tactic: ${tactic}`;

    const currentGoal = this.currentState.getCurrentGoal();
    if (currentGoal) {
      response += `\nCurrent goal: \n` + currentGoal.type.readBackType(this.currentState.context).prettyPrint();
    } else if (this.currentState.isComplete()) {
      response += "\nAll goals have been solved!";
    }

    return new go(response);
  }
}