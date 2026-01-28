import { useState, useCallback } from 'react';
import { proofWorker } from '@/shared/lib/worker-client';
import { useProofStore } from '../store';
import type {
  TacticParameters,
  StartSessionResponse,
  TacticAppliedResponse,
  SerializableLemma,
} from '@/workers/proof-worker';

/**
 * Hook for managing proof sessions with the proof worker.
 *
 * Provides methods to:
 * - Start a new proof session with source code and a claim name
 * - Apply tactics to the current goal
 * - Track loading and error states
 * - Sync proof tree updates to the Zustand store
 */
export function useProofSession() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [availableLemmas, setAvailableLemmas] = useState<SerializableLemma[]>([]);
  const [claimType, setClaimType] = useState<string | null>(null);

  const syncFromWorker = useProofStore((s) => s.syncFromWorker);
  const saveSnapshot = useProofStore((s) => s.saveSnapshot);
  const sessionId = useProofStore((s) => s.sessionId);

  /**
   * Start a new proof session.
   *
   * @param sourceCode - Pie source code containing claims and definitions
   * @param claimName - Name of the claim to prove
   * @returns Session info including proof tree and available lemmas
   */
  const startSession = useCallback(
    async (sourceCode: string, claimName: string): Promise<StartSessionResponse> => {
      setIsLoading(true);
      setError(null);

      try {
        const result = await proofWorker.startSession(sourceCode, claimName);

        // Sync the proof tree to the store
        syncFromWorker(result.proofTree, result.sessionId);
        saveSnapshot();

        // Store metadata
        setAvailableLemmas(result.availableLemmas);
        setClaimType(result.claimType);

        return result;
      } catch (e) {
        const errorMessage = e instanceof Error ? e.message : String(e);
        setError(errorMessage);
        throw e;
      } finally {
        setIsLoading(false);
      }
    },
    [syncFromWorker, saveSnapshot]
  );

  /**
   * Apply a tactic to the current goal.
   *
   * @param goalId - ID of the goal to apply the tactic to
   * @param tacticType - Type of tactic (e.g., 'intro', 'exact', 'elimNat')
   * @param params - Tactic parameters (varies by tactic type)
   * @returns Result including success status and updated proof tree
   */
  const applyTactic = useCallback(
    async (
      goalId: string,
      tacticType: string,
      params: TacticParameters
    ): Promise<TacticAppliedResponse> => {
      if (!sessionId) {
        const errorMessage = 'No active proof session. Call startSession first.';
        setError(errorMessage);
        throw new Error(errorMessage);
      }

      setIsLoading(true);
      setError(null);

      try {
        const result = await proofWorker.applyTactic(sessionId, goalId, tacticType, params);

        if (result.success) {
          // Sync the updated proof tree to the store
          syncFromWorker(result.proofTree, sessionId);
          saveSnapshot();
        } else if (result.error) {
          setError(result.error);
        }

        return result;
      } catch (e) {
        const errorMessage = e instanceof Error ? e.message : String(e);
        setError(errorMessage);
        throw e;
      } finally {
        setIsLoading(false);
      }
    },
    [sessionId, syncFromWorker, saveSnapshot]
  );

  /**
   * Close the current session and clean up.
   */
  const closeSession = useCallback(async () => {
    if (!sessionId) return;

    try {
      await proofWorker.closeSession(sessionId);
      setAvailableLemmas([]);
      setClaimType(null);
      setError(null);
    } catch (e) {
      console.error('Failed to close session:', e);
    }
  }, [sessionId]);

  /**
   * Clear any error state.
   */
  const clearError = useCallback(() => {
    setError(null);
  }, []);

  return {
    // State
    isLoading,
    error,
    sessionId,
    availableLemmas,
    claimType,

    // Actions
    startSession,
    applyTactic,
    closeSession,
    clearError,

    // Computed
    hasActiveSession: sessionId !== null,
  };
}

// Re-export types for convenience
export type { TacticParameters, StartSessionResponse, TacticAppliedResponse, SerializableLemma };
