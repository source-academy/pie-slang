import { useState, useCallback } from "react";
import { proofWorker } from "@/shared/lib/worker-client";
import { useProofStore } from "../store";
import { useMetadataStore } from "../store/metadata-store";
import { useExampleStore } from "../store/example-store";
import { generateProofScript } from "../utils/generate-proof-script";
import type {
  TacticParams,
  StartSessionResponse,
  ApplyTacticResponse,
} from "@pie/protocol";
import type { SerializableLemma, GlobalContext } from "@/workers/proof-worker";

/** Walk forward from startIndex balancing parens, returns index of closing ')'. */
function findClosingParen(source: string, startIndex: number): number {
  let depth = 0;
  for (let i = startIndex; i < source.length; i++) {
    if (source[i] === "(") depth++;
    else if (source[i] === ")") {
      depth--;
      if (depth === 0) return i;
    }
  }
  return source.length - 1;
}

/**
 * Inject (or replace) a proof script in source code.
 * - Removes any existing (define-tactically claimName ...) block
 * - Inserts the new proof script right after (claim claimName ...)
 */
function injectProofIntoSource(
  sourceCode: string,
  claimName: string,
  proofScript: string,
): string {
  let src = sourceCode;

  // Step 1: Remove existing (define-tactically claimName ...) if present
  const definePattern = `(define-tactically ${claimName}`;
  const defineIdx = src.indexOf(definePattern);
  if (defineIdx !== -1) {
    const end = findClosingParen(src, defineIdx);
    // Also trim leading whitespace/newlines before the block
    const before = src.slice(0, defineIdx).trimEnd();
    const after = src.slice(end + 1);
    src = before + after;
  }

  // Step 2: Find (claim claimName ...) and insert proof script after it
  const claimPattern = `(claim ${claimName}`;
  const claimIdx = src.indexOf(claimPattern);
  if (claimIdx === -1) {
    return src.trimEnd() + "\n\n" + proofScript;
  }
  const claimEnd = findClosingParen(src, claimIdx);
  const before = src.slice(0, claimEnd + 1);
  const after = src.slice(claimEnd + 1);
  return before + "\n\n" + proofScript + after;
}

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
  const [availableLemmas, setAvailableLemmas] = useState<SerializableLemma[]>(
    [],
  );
  const [claimType, setClaimType] = useState<string | null>(null);

  // Use metadata store for globalContext and claimName so all hook instances see the same state
  const globalContext = useMetadataStore((s) => s.globalContext);
  const setGlobalContext = useMetadataStore((s) => s.setGlobalContext);
  const setMetadataClaimName = useMetadataStore((s) => s.setClaimName);
  const setSourceCode = useMetadataStore((s) => s.setSourceCode);

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
    async (
      sourceCode: string,
      claimName: string,
    ): Promise<StartSessionResponse> => {
      setIsLoading(true);
      setError(null);

      try {
        const result = await proofWorker.startSession(sourceCode, claimName);

        // Sync the proof tree to the store (include claimName for script generation)
        syncFromWorker(result.proofTree, result.sessionId, claimName, result.globalContext.theorems);
        saveSnapshot();

        // Store metadata
        setAvailableLemmas(result.availableLemmas);
        setClaimType(result.claimType);
        setGlobalContext(result.globalContext);
        setMetadataClaimName(claimName);
        setSourceCode(sourceCode);

        return result;
      } catch (e) {
        const errorMessage = e instanceof Error ? e.message : String(e);
        setError(errorMessage);
        throw e;
      } finally {
        setIsLoading(false);
      }
    },
    [
      syncFromWorker,
      saveSnapshot,
      setGlobalContext,
      setMetadataClaimName,
      setSourceCode,
    ],
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
      params: TacticParams,
    ): Promise<ApplyTacticResponse> => {
      if (!sessionId) {
        const errorMessage =
          "No active proof session. Call startSession first.";
        setError(errorMessage);
        throw new Error(errorMessage);
      }

      setIsLoading(true);
      setError(null);

      try {
        const result = await proofWorker.applyTactic(
          sessionId,
          goalId,
          tacticType,
          params,
        );

        if (result.success) {
          // When proof is complete, inject the proof script FIRST (synchronous Zustand update)
          // so exampleSource is guaranteed up-to-date before syncFromWorker triggers React re-renders.
          if (result.proofTree.isComplete) {
            const currentClaimName = useMetadataStore.getState().claimName;
            if (currentClaimName) {
              const script = generateProofScript(result.proofTree, currentClaimName);
              const currentSource = useExampleStore.getState().exampleSource ?? "";
              const updatedSource = injectProofIntoSource(currentSource, currentClaimName, script);
              if (updatedSource !== currentSource) {
                useExampleStore.getState().setExampleSource(updatedSource);
              }
            }
          }

          // Then sync the proof tree — this triggers React re-renders.
          // By this point, exampleSource already contains the injected define-tactically.
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
    [sessionId, syncFromWorker, saveSnapshot],
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
      setMetadataClaimName(null);
      setError(null);
    } catch (e) {
      console.error("Failed to close session:", e);
    }
  }, [sessionId, setGlobalContext, setMetadataClaimName]);

  /**
   * Clear any error state.
   */
  const clearError = useCallback(() => {
    setError(null);
  }, []);

  /**
   * Scan the source code for claims, theorems, and definitions.
   */
  const scan = useCallback(
    async (sourceCode: string) => {
      setIsLoading(true);
      setError(null);

      try {
        // Scan the file for definitions and claims (Multi-proof support)
        const result = await proofWorker.scanFile(sourceCode);

        // Update global context with definitions and theorems found during scan
        setGlobalContext({
          definitions: result.definitions,
          theorems: result.theorems,
        });

        // Return the claims (unproved) and theorems (proved) to the caller
        // The caller (ProofPicker) can then display them
        return {
          claims: result.claims,
          theorems: result.theorems,
        };
      } catch (e) {
        const errorMessage = e instanceof Error ? e.message : String(e);
        setError(errorMessage);
        throw e;
      } finally {
        setIsLoading(false);
      }
    },
    [setGlobalContext],
  );

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
    scan,

    // Computed
    hasActiveSession: sessionId !== null,
  };
}

// Re-export types for convenience
export type {
  TacticParams,
  StartSessionResponse,
  ApplyTacticResponse,
  SerializableLemma,
  GlobalContext,
};
