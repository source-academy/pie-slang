import { useState, useCallback } from 'react';
import { useProofSession } from '../../hooks/useProofSession';

/**
 * Sample Pie source code for demonstration.
 */
const SAMPLE_SOURCE = `; Define addition function
(claim + (-> Nat Nat Nat))
(define +
  (lambda (n m)
    (rec-Nat n
      m
      (lambda (n-1 +n-1)
        (add1 +n-1)))))

; Prove that n = n for all Nat
(claim reflexivity
  (Pi ((n Nat))
    (= Nat n n)))
`;

/**
 * SourceCodePanel - Collapsible panel for entering Pie source code and starting proofs.
 *
 * Features:
 * - Text area for Pie source code (claims, definitions)
 * - Input field for claim name to prove
 * - "Start Proof" button
 * - Auto-collapses after starting proof
 * - Shows loading and error states
 */
export function SourceCodePanel() {
  const [isExpanded, setIsExpanded] = useState(true);
  const [sourceCode, setSourceCode] = useState(SAMPLE_SOURCE);
  const [claimName, setClaimName] = useState('reflexivity');

  const {
    startSession,
    isLoading,
    error,
    clearError,
    hasActiveSession,
    claimType,
  } = useProofSession();

  const handleStartProof = useCallback(async () => {
    if (!sourceCode.trim() || !claimName.trim()) {
      return;
    }

    try {
      await startSession(sourceCode, claimName);
      // Auto-collapse on success
      setIsExpanded(false);
    } catch (e) {
      // Error is already set in the hook
      console.error('Failed to start proof:', e);
    }
  }, [sourceCode, claimName, startSession]);

  const handleToggle = useCallback(() => {
    setIsExpanded((prev) => !prev);
  }, []);

  return (
    <div className="border-b bg-card">
      {/* Header - always visible */}
      <div
        className="flex cursor-pointer items-center justify-between px-4 py-2 hover:bg-muted/50"
        onClick={handleToggle}
      >
        <div className="flex items-center gap-2">
          <span className="text-lg">{isExpanded ? '▼' : '▶'}</span>
          <span className="font-medium">Source Code</span>
          {hasActiveSession && claimType && (
            <span className="ml-2 rounded bg-green-100 px-2 py-0.5 text-xs text-green-800">
              Proving: {claimName}
            </span>
          )}
        </div>
        {hasActiveSession && (
          <span className="text-sm text-muted-foreground">
            Click to {isExpanded ? 'collapse' : 'expand'}
          </span>
        )}
      </div>

      {/* Collapsible content */}
      {isExpanded && (
        <div className="border-t px-4 pb-4 pt-2">
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
            {/* Source code text area */}
            <div className="lg:col-span-2">
              <label className="mb-1 block text-sm font-medium text-muted-foreground">
                Pie Source Code
              </label>
              <textarea
                className="h-32 w-full rounded-md border bg-background px-3 py-2 font-mono text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                placeholder="Enter Pie source code (claims, definitions)..."
                value={sourceCode}
                onChange={(e) => setSourceCode(e.target.value)}
                disabled={isLoading}
              />
            </div>

            {/* Claim name and button */}
            <div className="flex flex-col gap-3">
              <div>
                <label className="mb-1 block text-sm font-medium text-muted-foreground">
                  Claim to Prove
                </label>
                <input
                  type="text"
                  className="w-full rounded-md border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                  placeholder="e.g., +zero-identity"
                  value={claimName}
                  onChange={(e) => setClaimName(e.target.value)}
                  disabled={isLoading}
                />
              </div>

              <button
                className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-50"
                onClick={handleStartProof}
                disabled={isLoading || !sourceCode.trim() || !claimName.trim()}
              >
                {isLoading ? (
                  <span className="flex items-center justify-center gap-2">
                    <span className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                    Starting...
                  </span>
                ) : hasActiveSession ? (
                  'Restart Proof'
                ) : (
                  'Start Proof'
                )}
              </button>

              {/* Error display */}
              {error && (
                <div className="rounded-md border border-destructive/50 bg-destructive/10 p-2">
                  <div className="flex items-start justify-between gap-2">
                    <p className="text-xs text-destructive">{error}</p>
                    <button
                      className="text-xs text-destructive hover:underline"
                      onClick={(e) => {
                        e.stopPropagation();
                        clearError();
                      }}
                    >
                      Dismiss
                    </button>
                  </div>
                </div>
              )}

              {/* Success indicator */}
              {hasActiveSession && !error && (
                <div className="rounded-md border border-green-200 bg-green-50 p-2">
                  <p className="text-xs text-green-800">
                    ✓ Proof session active
                  </p>
                  {claimType && (
                    <p className="mt-1 truncate font-mono text-xs text-green-700">
                      Type: {claimType}
                    </p>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
