import { useCallback, useRef } from 'react';
import { nanoid } from 'nanoid';
import { proofWorker } from '@/shared/lib/worker-client';
import { useHintStore, useProofStore } from '../store';
import type { HintLevel } from '@/workers/proof-worker';
import type { GhostNode } from '../store/hint-store';
import type { TacticType } from '../store/types';

/**
 * Hook for managing the hint system
 *
 * Handles:
 * - Requesting hints from the worker
 * - Managing ghost nodes
 * - Converting accepted hints to real tactic nodes
 */
export function useHintSystem() {
  // Subscribe to goalHints for rendering ghost nodes
  const goalHints = useHintStore((s) => s.goalHints);

  // Store getState functions in refs (these never change)
  const getProofState = useRef(useProofStore.getState).current;
  const getHintState = useRef(useHintStore.getState).current;

  /**
   * Request a hint for a specific goal
   * Uses store.getState() to avoid dependency on changing state
   */
  const requestHint = useCallback(async (goalId: string) => {
    const proofStore = getProofState();
    const hintStore = getHintState();

    const sessionId = proofStore.sessionId;
    const nodes = proofStore.nodes;
    const apiKey = hintStore.apiKey;

    console.log('[useHintSystem] requestHint called for goalId:', goalId, 'sessionId:', sessionId);

    // Mark as loading first
    hintStore.requestHint(goalId);

    if (!sessionId) {
      console.warn('[useHintSystem] No active session - showing guidance hint');
      // Provide a helpful hint without needing a session
      const guidanceHint = {
        level: 'category' as HintLevel,
        category: 'introduction' as const,
        explanation: 'Please start a proof session first by clicking "Start Proof" in the Source Code panel above. Once a session is active, hints will analyze your goal and suggest appropriate tactics.',
        confidence: 1.0,
      };
      hintStore.updateHint(goalId, guidanceHint);

      // Create ghost node with the guidance
      const goalNode = nodes.find((n) => n.id === goalId);
      if (goalNode) {
        const ghostNode: GhostNode = {
          id: `ghost-${nanoid(8)}`,
          goalId,
          position: {
            x: goalNode.position.x,
            y: goalNode.position.y + 150,
          },
          hint: guidanceHint,
          isLoading: false,
        };
        hintStore.setGhostNode(goalId, ghostNode);
      }
      return;
    }

    // Get existing hint state for this goal
    const existingState = hintStore.goalHints.get(goalId);
    const currentLevel: HintLevel = existingState?.currentLevel || 'category';
    const previousHint = existingState?.hints[existingState.hints.length - 1];

    try {
      const hint = await proofWorker.getHint({
        sessionId,
        goalId,
        currentLevel,
        previousHint,
        apiKey: apiKey || undefined,
      });

      // Update hint state
      hintStore.updateHint(goalId, hint);

      // Create ghost node for the hint
      const goalNode = nodes.find((n) => n.id === goalId);
      if (goalNode) {
        const ghostNode: GhostNode = {
          id: `ghost-${nanoid(8)}`,
          goalId,
          position: {
            x: goalNode.position.x,
            y: goalNode.position.y + 150, // Position below the goal
          },
          hint,
          isLoading: false,
        };
        hintStore.setGhostNode(goalId, ghostNode);
      }
    } catch (error) {
      console.error('[useHintSystem] Error requesting hint:', error);
      hintStore.setError(goalId, String(error));
    }
  }, [getProofState, getHintState]);

  /**
   * Request more detail for an existing hint
   */
  const getMoreDetail = useCallback(async (goalId: string) => {
    const proofStore = getProofState();
    const hintStore = getHintState();

    const sessionId = proofStore.sessionId;
    const apiKey = hintStore.apiKey;

    if (!sessionId) return;

    const existingState = hintStore.goalHints.get(goalId);
    if (!existingState || existingState.currentLevel === 'full') return;

    // Advance to next level
    const nextLevel: HintLevel =
      existingState.currentLevel === 'category' ? 'tactic' : 'full';

    // Mark as loading
    hintStore.setLoading(goalId, true);

    try {
      const previousHint = existingState.hints[existingState.hints.length - 1];

      const hint = await proofWorker.getHint({
        sessionId,
        goalId,
        currentLevel: nextLevel,
        previousHint,
        apiKey: apiKey || undefined,
      });

      // Update hint state
      hintStore.updateHint(goalId, hint);

      // Update ghost node with new hint
      if (existingState.ghostNode) {
        hintStore.setGhostNode(goalId, {
          ...existingState.ghostNode,
          hint,
          isLoading: false,
        });
      }
    } catch (error) {
      console.error('[useHintSystem] Error getting more detail:', error);
      hintStore.setError(goalId, String(error));
    }
  }, [getProofState, getHintState]);

  /**
   * Accept a ghost node and convert it to a real tactic node
   */
  const acceptGhostNode = useCallback((goalId: string) => {
    const proofStore = getProofState();
    const hintStore = getHintState();

    const nodes = proofStore.nodes;
    const hintState = hintStore.goalHints.get(goalId);

    if (!hintState?.ghostNode?.hint.tacticType) {
      console.warn('[useHintSystem] Cannot accept hint without tactic type');
      return;
    }

    const { hint } = hintState.ghostNode;
    const goalNode = nodes.find((n) => n.id === goalId);

    if (!goalNode) return;

    // Determine initial status based on whether we have all parameters
    const tacticType = hint.tacticType!;
    const needsVariable = ['elimNat', 'elimList', 'elimEither', 'elimAbsurd', 'elimVec', 'elimEqual'].includes(tacticType);
    const needsExpression = ['exact', 'exists'].includes(tacticType);
    const isParameterless = ['split', 'left', 'right'].includes(tacticType);

    let initialStatus: 'incomplete' | 'ready' = 'incomplete';
    if (isParameterless) {
      initialStatus = 'ready';
    } else if (hint.parameters) {
      if (needsVariable && hint.parameters.variableName) {
        initialStatus = 'ready';
      } else if (needsExpression && hint.parameters.expression) {
        initialStatus = 'ready';
      } else if (tacticType === 'intro' && hint.parameters.variableName) {
        initialStatus = 'ready';
      }
    }

    // Create the real tactic node
    const tacticNodeId = proofStore.addTacticNode(
      {
        kind: 'tactic',
        tacticType: tacticType as TacticType,
        displayName: tacticType,
        parameters: hint.parameters || {},
        status: initialStatus,
        connectedGoalId: goalId,
      },
      {
        x: goalNode.position.x,
        y: goalNode.position.y + 150,
      }
    );

    console.log('[useHintSystem] Created tactic node from hint:', tacticNodeId);

    // Dismiss the ghost node
    hintStore.dismissGhostNode(goalId);
  }, [getProofState, getHintState]);

  /**
   * Dismiss a ghost node
   */
  const dismissGhostNode = useCallback((goalId: string) => {
    const hintStore = getHintState();
    hintStore.dismissGhostNode(goalId);
  }, [getHintState]);

  return {
    requestHint,
    getMoreDetail,
    acceptGhostNode,
    dismissGhostNode,
    goalHints,
  };
}

export default useHintSystem;
