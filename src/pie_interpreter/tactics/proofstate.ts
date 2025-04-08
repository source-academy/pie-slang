import { Context } from '../utils/context';
import { Source } from '../types/source';
import { Core } from '../types/core';
import { Value } from '../types/value';
import { Location } from '../utils/locations';

/**
 * Represents a single goal in a proof
 */
export class Goal {
  constructor(
    public id: number,
    public type: Value,  // The type we're trying to construct a term of
    public term?: Core   // The partial term constructed so far (if any)
  ) {}
}

/**
 * Represents the complete state of a proof in progress
 */
export class ProofState {
  constructor(
    public location: Location,
    public context: Context,
    public goals: Goal[],
    public focusedGoal: number,  // Index of the currently active goal
    public proofHistory: ProofState[] = []  // For undo/redo functionality
  ) {}

  static initialize(context: Context, theorem: Value, location: Location): ProofState {
    return new ProofState(
      location,
      context,
      [new Goal(0, theorem)],
      0,
      []
    );
  }

  /**
   * Creates a copy of the current proof state
   */
  clone(): ProofState {
    const newGoals = this.goals.map(g => new Goal(g.id, g.type, g.term));
    return new ProofState(
      this.location,
      this.context,
      newGoals,
      this.focusedGoal,
      [...this.proofHistory]
    );
  }

  /**
   * Records the current state in history and returns a new state
   */
  checkpoint(): ProofState {
    const currentState = this.clone();
    const newState = this.clone();
    newState.proofHistory = [...this.proofHistory, currentState];
    return newState;
  }

  /**
   * Check if the proof is complete (all goals are solved)
   */
  isComplete(): boolean {
    return this.goals.length === 0;
  }

  getCurrentGoal(): Goal | undefined {
    if (this.goals.length === 0) return undefined;
    return this.goals[this.focusedGoal];
  }
}