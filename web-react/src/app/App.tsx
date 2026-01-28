import { useEffect, useCallback, useState } from 'react';
import { Providers } from './providers';
import { ProofCanvas } from '@/features/proof-editor/components/ProofCanvas';
import { DetailPanel } from '@/features/proof-editor/components/panels/DetailPanel';
import { TacticPalette } from '@/features/proof-editor/components/panels/TacticPalette';
import { SourceCodePanel } from '@/features/proof-editor/components/panels/SourceCodePanel';
import { useProofSession } from '@/features/proof-editor/hooks/useProofSession';
import { setApplyTacticCallback } from '@/features/proof-editor/components/nodes/GoalNode';
import type { TacticType } from '@/features/proof-editor/store/types';

function AppContent() {
  const { applyTactic, error } = useProofSession();
  const [tacticError, setTacticError] = useState<string | null>(null);

  // Set up the global callback for tactic application
  const handleApplyTactic = useCallback(async (
    goalId: string,
    tacticType: TacticType,
    params?: { variableName?: string; expression?: string }
  ) => {
    console.log('[App] Applying tactic:', tacticType, 'to goal:', goalId, 'params:', params);
    setTacticError(null);
    try {
      const result = await applyTactic(goalId, tacticType, params || {});
      if (!result.success && result.error) {
        setTacticError(result.error);
        console.error('[App] Tactic failed:', result.error);
      }
    } catch (e) {
      const errorMsg = e instanceof Error ? e.message : String(e);
      setTacticError(errorMsg);
      console.error('[App] Tactic error:', e);
    }
  }, [applyTactic]);

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
      <main className="flex flex-1 overflow-hidden">
        {/* Tactic palette (left) */}
        <TacticPalette />
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
