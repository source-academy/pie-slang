import { useEffect, useCallback, useState } from 'react';
import { Providers } from './providers';
import { ProofCanvas } from '@/features/proof-editor/components/ProofCanvas';
import { DetailPanel } from '@/features/proof-editor/components/panels/DetailPanel';
import { LeftSidebar } from '@/features/proof-editor/components/panels/LeftSidebar';
import { SourceCodePanel } from '@/features/proof-editor/components/panels/SourceCodePanel';
import { useProofSession } from '@/features/proof-editor/hooks/useProofSession';
import { useKeyboardShortcuts } from '@/features/proof-editor/hooks/useKeyboardShortcuts';
import { useProofStore } from '@/features/proof-editor/store';
import { useExampleStore } from '@/features/proof-editor/store/example-store';
import { useMetadataStore } from '@/features/proof-editor/store/metadata-store';
import { setApplyTacticCallback, type ApplyTacticOptions } from '@/features/proof-editor/utils/tactic-callback';
import { EXAMPLES } from '@/features/proof-editor/data/examples';

function AppContent() {
  const { applyTactic, error } = useProofSession();
  const updateNode = useProofStore((s) => s.updateNode);
  const [tacticError, setTacticError] = useState<string | null>(null);

  // Use keyboard shortcuts hook
  useKeyboardShortcuts();

  // Use example store
  const selectedExample = useExampleStore((s) => s.selectedExample);
  const exampleSource = useExampleStore((s) => s.exampleSource);
  const exampleClaim = useExampleStore((s) => s.exampleClaim);
  const selectExample = useExampleStore((s) => s.selectExample);

  // Use metadata store for global context
  const globalContext = useMetadataStore((s) => s.globalContext);

  // Set up the global callback for tactic application
  const handleApplyTactic = useCallback(async (options: ApplyTacticOptions) => {
    const { goalId, tacticType, params, tacticNodeId } = options;
    console.log('[App] Applying tactic:', tacticType, 'to goal:', goalId, 'params:', params, 'tacticNodeId:', tacticNodeId);
    setTacticError(null);

    try {
      const result = await applyTactic(goalId, tacticType, params);

      if (result.success) {
        // Success: syncFromWorker already called in useProofSession
        // The proof tree will be updated with new goals
        console.log('[App] Tactic succeeded');
      } else {
        // Failure: update tactic node with error status
        const errorMsg = result.error || 'Tactic application failed';
        setTacticError(errorMsg);
        console.error('[App] Tactic failed:', errorMsg);

        // If we have a tactic node ID, update its status to error
        if (tacticNodeId) {
          updateNode(tacticNodeId, {
            status: 'error',
            errorMessage: errorMsg,
          });
        }
      }
    } catch (e) {
      const errorMsg = e instanceof Error ? e.message : String(e);
      setTacticError(errorMsg);
      console.error('[App] Tactic error:', e);

      // If we have a tactic node ID, update its status to error
      if (tacticNodeId) {
        updateNode(tacticNodeId, {
          status: 'error',
          errorMessage: errorMsg,
        });
      }
    }
  }, [applyTactic, updateNode]);

  // Register the callback when component mounts
  useEffect(() => {
    setApplyTacticCallback(handleApplyTactic);
    return () => setApplyTacticCallback(null);
  }, [handleApplyTactic]);

  // Clear tactic error after a delay
  useEffect(() => {
    if (tacticError) {
      const timer = setTimeout(() => setTacticError(null), 5000);
      return () => clearTimeout(timer);
    }
  }, [tacticError]);

  return (
    <div className="flex h-screen w-screen flex-col">
      <header className="flex h-12 items-center border-b px-4 gap-4">
        <h1 className="text-lg font-semibold">Pie Proof Editor</h1>

        {/* Example dropdown */}
        <div className="flex items-center gap-2">
          <label htmlFor="example-select" className="text-sm text-muted-foreground">
            Load Example:
          </label>
          <select
            id="example-select"
            value={selectedExample}
            onChange={(e) => selectExample(e.target.value)}
            className="rounded border bg-background px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
          >
            <option value="">-- Select --</option>
            {EXAMPLES.map((ex) => (
              <option key={ex.id} value={ex.id}>
                {ex.name}
              </option>
            ))}
          </select>
        </div>

        {/* Show tactic error in header */}
        {(tacticError || error) && (
          <div className="ml-auto rounded bg-red-100 px-2 py-1 text-sm text-red-700">
            {tacticError || error}
          </div>
        )}
      </header>
      {/* Source code input panel (collapsible) */}
      <SourceCodePanel exampleSource={exampleSource} exampleClaim={exampleClaim} />
      <main className="flex flex-1 overflow-hidden">
        {/* Left sidebar: Tactics + Definitions + Theorems */}
        <LeftSidebar
          definitions={globalContext.definitions}
          theorems={globalContext.theorems}
        />
        {/* Main canvas area */}
        <div className="flex-1">
          <ProofCanvas />
        </div>
        {/* Detail panel (right) */}
        <DetailPanel />
      </main>
    </div>
  );
}

export function App() {
  return (
    <Providers>
      <AppContent />
    </Providers>
  );
}
