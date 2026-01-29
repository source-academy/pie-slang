import { ProofState, Goal, ProofTreeData } from './proofstate';
import { Tactic } from './tactics';
import { Context, Claim} from '../utils/context';

import { Location } from '../utils/locations';
import { Perhaps, go, stop, Message } from '../types/utils';

export class ProofManager {
  public currentState: ProofState | undefined = undefined;

  public startProof(name: string, context: Context, location: Location): Perhaps<string> {

    const claim = context.get(name);
    if (! (claim instanceof Claim)) {
      return new stop(location, new Message([`${name} is not a valid type or has already been proved`]));
    }

    this.currentState = ProofState.initialize(context, claim.type, location);

    return new go(`Started proof of ${name}` + `\nCurrent goal: \n${claim.type.readBackType(context).prettyPrint()}`);
  }


  public applyTactic(tactic: Tactic): Perhaps<string> {

    if (!this.currentState) {
      return new stop(tactic.location, new Message([`No proof has been initialized`]));
    }

    // Store the current goal node before applying tactic
    const previousGoalNode = this.currentState.currentGoal;

    const newStateResult = tactic.apply(this.currentState);
    if (newStateResult instanceof stop) {
      return newStateResult;
    }

    this.currentState = (newStateResult as go<ProofState>).result;

    // Record which tactic was applied to create children
    if (previousGoalNode.children.length > 0) {
      previousGoalNode.appliedTactic = tactic.toString();
    }

    let response = `\nApplied tactic: ${tactic}`;

    const currentGoal = this.currentState.getCurrentGoal();
     if (this.currentState.isComplete()) {
      response += "\nAll goals have been solved!";
    } else {
      const curGoal = (currentGoal as go<Goal>).result
      response += `\nCurrent goal: \n` + curGoal.type.readBackType(curGoal.context).prettyPrint();
    }

    return new go(response);
  }

  public getProofTreeData(): ProofTreeData | null {
    if (!this.currentState) {
      return null;
    }
    return this.currentState.getProofTreeData();
  }
}
