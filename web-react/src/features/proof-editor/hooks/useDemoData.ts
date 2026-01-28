import { useEffect, useRef } from 'react';
import { useProofStore } from '../store';

/**
 * Hook to initialize the store with demo data for testing.
 * This creates a sample proof tree to visualize.
 *
 * Uses a ref to prevent double initialization in React Strict Mode.
 */
export function useDemoData() {
  const initialized = useRef(false);
  const addGoalNode = useProofStore((s) => s.addGoalNode);
  const addTacticNode = useProofStore((s) => s.addTacticNode);
  const connectNodes = useProofStore((s) => s.connectNodes);

  useEffect(() => {
    // Prevent double initialization in React Strict Mode
    if (initialized.current) return;
    initialized.current = true;

    // Create root goal
    const rootGoalId = addGoalNode(
      {
        kind: 'goal',
        goalType: '(Π ((n Nat)) (= Nat (+ n zero) n))',
        context: [],
        status: 'completed',
      },
      { x: 400, y: 50 }
    );

    // Create intro tactic
    const introTacticId = addTacticNode(
      {
        kind: 'tactic',
        tacticType: 'intro',
        displayName: 'intro n',
        parameters: { variableName: 'n' },
        isConfigured: true,
        isValid: true,
      },
      { x: 400, y: 180 }
    );

    // Connect root goal to intro tactic
    connectNodes(rootGoalId, introTacticId, { kind: 'goal-to-tactic' });

    // Create subgoal after intro - this goal has context variable 'n'
    const subGoalId = addGoalNode(
      {
        kind: 'goal',
        goalType: '(= Nat (+ n zero) n)',
        context: [
          { id: 'ctx-n', name: 'n', type: 'Nat', origin: 'introduced', introducedBy: introTacticId },
        ],
        status: 'in-progress',
        parentGoalId: rootGoalId,
      },
      { x: 400, y: 310 }
    );

    // Connect intro tactic to subgoal
    connectNodes(introTacticId, subGoalId, { kind: 'tactic-to-goal', outputIndex: 0 });

    // Add elimNat tactic - this needs both goal AND context variable 'n'
    const elimTacticId = addTacticNode(
      {
        kind: 'tactic',
        tacticType: 'elimNat',
        displayName: 'elimNat',
        parameters: { targetContextId: 'ctx-n', variableName: 'n' },
        isConfigured: true,
        isValid: true,
      },
      { x: 400, y: 480 }
    );

    // Connect goal to elimNat (goal input - top)
    connectNodes(subGoalId, elimTacticId, { kind: 'goal-to-tactic' });

    // Connect context variable 'n' to elimNat (context input - left)
    // This edge goes from the goal's context handle to the tactic's context input
    connectNodes(subGoalId, elimTacticId, {
      kind: 'context-to-tactic',
      contextVarId: 'ctx-n'
    });

    // Base case
    const baseGoalId = addGoalNode(
      {
        kind: 'goal',
        goalType: '(= Nat (+ zero zero) zero)',
        context: [],
        status: 'pending',
        parentGoalId: subGoalId,
      },
      { x: 200, y: 620 }
    );

    connectNodes(elimTacticId, baseGoalId, { kind: 'tactic-to-goal', outputIndex: 0 });

    // Inductive case - k and ih are in the goal type (Pi binding), not yet in context
    // They will be introduced by a future intro tactic
    const indGoalId = addGoalNode(
      {
        kind: 'goal',
        goalType: '(Π ((k Nat) (ih (= Nat (+ k zero) k))) (= Nat (+ (add1 k) zero) (add1 k)))',
        context: [],  // Empty - no intro tactic has introduced k and ih yet
        status: 'pending',
        parentGoalId: subGoalId,
      },
      { x: 550, y: 620 }
    );

    connectNodes(elimTacticId, indGoalId, { kind: 'tactic-to-goal', outputIndex: 1 });

  }, [addGoalNode, addTacticNode, connectNodes]);
}
