/**
 * Shared callback for tactic application
 *
 * This module provides a global callback that can be set by App.tsx
 * and called from anywhere (GoalNode, TacticNode, ProofCanvas) to trigger
 * tactic application.
 */

import type { TacticType, TacticParameters } from '../store/types';

export interface ApplyTacticOptions {
  goalId: string;
  tacticType: TacticType;
  params: TacticParameters;
  tacticNodeId?: string; // Optional: ID of tactic node to update on error
}

export type ApplyTacticCallback = (options: ApplyTacticOptions) => Promise<void>;

let applyTacticCallback: ApplyTacticCallback | null = null;

/**
 * Set the global apply tactic callback.
 * Called by App.tsx to register the callback.
 */
export function setApplyTacticCallback(callback: ApplyTacticCallback | null): void {
  applyTacticCallback = callback;
}

/**
 * Get the current apply tactic callback.
 */
export function getApplyTacticCallback(): ApplyTacticCallback | null {
  return applyTacticCallback;
}

/**
 * Apply a tactic to a goal.
 * Returns true if the callback was available and called, false otherwise.
 *
 * IMPORTANT: setTimeout(0) defers callback to next event loop tick.
 * This is required because React 18 concurrent mode requires state
 * updates to be properly batched. Without this, we get "Should have
 * a queue" errors when the callback triggers state updates from
 * components that stored the callback outside React's component tree.
 *
 * @param goalId - ID of the goal to apply the tactic to
 * @param tacticType - Type of tactic to apply
 * @param params - Parameters for the tactic
 * @param tacticNodeId - Optional ID of the tactic node (for error handling)
 */
export function applyTactic(
  goalId: string,
  tacticType: TacticType,
  params: TacticParameters,
  tacticNodeId?: string
): Promise<boolean> {
  if (applyTacticCallback) {
    // Use setTimeout(0) to ensure React can properly track the state update
    // This schedules the callback in a new event loop tick
    return new Promise((resolve) => {
      setTimeout(async () => {
        try {
          await applyTacticCallback!({ goalId, tacticType, params, tacticNodeId });
          resolve(true);
        } catch (e) {
          console.error('[tactic-callback] Error in callback:', e);
          resolve(false);
        }
      }, 0);
    });
  }
  console.warn('[tactic-callback] No callback registered');
  return Promise.resolve(false);
}
