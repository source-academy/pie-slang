import { useState, useCallback } from 'react';
import { proofWorker } from '@/shared/lib/worker-client';
import { useProofStore } from '../store';
import { useMetadataStore } from '../store/metadata-store';
import type {
  TacticParameters,
  StartSessionResponse,
  TacticAppliedResponse,
  SerializableLemma,
  GlobalContext,
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

  // Use metadata store for globalContext so all hook instances see the same state
  const globalContext = useMetadataStore((s) => s.globalContext);
  const setGlobalContext = useMetadataStore((s) => s.setGlobalContext);

  // Also keep proof-store in sync for backwards compatibility
  const setProofStoreGlobalContext = useProofStore((s) => s.setGlobalContext);

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
        setGlobalContext(result.globalContext);
        setProofStoreGlobalContext(result.globalContext); // Keep proof-store in sync

        return result;
      } catch (e) {
        const errorMessage = e instanceof Error ? e.message : String(e);
        setError(errorMessage);
        throw e;
      } finally {
        setIsLoading(false);
      }
    },
    [syncFromWorker, saveSnapshot, setGlobalContext, setProofStoreGlobalContext]
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
      setGlobalContext({ definitions: [], theorems: [] });
      setProofStoreGlobalContext({ definitions: [], theorems: [] });
      setError(null);
    } catch (e) {
      console.error('Failed to close session:', e);
    }
  }, [sessionId, setGlobalContext, setProofStoreGlobalContext]);

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
    globalContext,

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
export type { TacticParameters, StartSessionResponse, TacticAppliedResponse, SerializableLemma, GlobalContext };
