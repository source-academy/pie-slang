import { useEffect, useCallback, useState } from 'react';
import { Providers } from './providers';
import { ProofCanvas } from '@/features/proof-editor/components/ProofCanvas';
import { DetailPanel } from '@/features/proof-editor/components/panels/DetailPanel';
import { TacticPalette } from '@/features/proof-editor/components/panels/TacticPalette';
import { SourceCodePanel } from '@/features/proof-editor/components/panels/SourceCodePanel';
import { DefinitionsPanel } from '@/features/proof-editor/components/panels/DefinitionsPanel';
import { AISettingsPanel } from '@/features/proof-editor/components/panels/AISettingsPanel';
import { useProofSession } from '@/features/proof-editor/hooks/useProofSession';
import { useProofStore } from '@/features/proof-editor/store';
import { setApplyTacticCallback, type ApplyTacticOptions } from '@/features/proof-editor/utils/tactic-callback';

function AppContent() {
  const { applyTactic, error, globalContext } = useProofSession();
  const updateNode = useProofStore((s) => s.updateNode);
  const [tacticError, setTacticError] = useState<string | null>(null);
  const [definitionsPanelCollapsed, setDefinitionsPanelCollapsed] = useState(false);

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
      <header className="flex h-12 items-center border-b px-4">
        <h1 className="text-lg font-semibold">Pie Proof Editor</h1>
        {/* Show tactic error in header */}
        {(tacticError || error) && (
          <div className="ml-4 rounded bg-red-100 px-2 py-1 text-sm text-red-700">
            {tacticError || error}
          </div>
        )}
      </header>
      {/* Source code input panel (collapsible) */}
      <SourceCodePanel />
      {/* AI Settings panel (collapsible) */}
      <AISettingsPanel />
      <main className="flex flex-1 overflow-hidden">
        {/* Tactic palette (left) */}
        <TacticPalette />
        {/* Main canvas area */}
        <div className="flex-1">
          <ProofCanvas />
        </div>
        {/* Definitions panel (right sidebar) */}
        <DefinitionsPanel
          definitions={globalContext.definitions}
          theorems={globalContext.theorems}
          collapsed={definitionsPanelCollapsed}
          onToggleCollapse={() => setDefinitionsPanelCollapsed(!definitionsPanelCollapsed)}
        />
        {/* Detail panel (rightmost) */}
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
