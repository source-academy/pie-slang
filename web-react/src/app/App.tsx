import { useEffect, useCallback, useState, useRef } from 'react';
import { Providers } from './providers';
import { ProofCanvas } from '@/features/proof-editor/components/ProofCanvas';
import { DetailPanel } from '@/features/proof-editor/components/panels/DetailPanel';
import { TacticPalette } from '@/features/proof-editor/components/panels/TacticPalette';
import { SourceCodePanel } from '@/features/proof-editor/components/panels/SourceCodePanel';
import { DefinitionsPanel } from '@/features/proof-editor/components/panels/DefinitionsPanel';
import { AISettingsPanel } from '@/features/proof-editor/components/panels/AISettingsPanel';
import { useProofSession } from '@/features/proof-editor/hooks/useProofSession';
import { useKeyboardShortcuts } from '@/features/proof-editor/hooks/useKeyboardShortcuts';
import { useProofStore } from '@/features/proof-editor/store';
import { useExampleStore } from '@/features/proof-editor/store/example-store';
import { useMetadataStore } from '@/features/proof-editor/store/metadata-store';
import { setApplyTacticCallback, type ApplyTacticOptions } from '@/features/proof-editor/utils/tactic-callback';
import { EXAMPLES } from '@/features/proof-editor/data/examples';
import { ProofPicker } from '@/features/proof-editor/components/ProofPicker';
import { type GlobalContextEntry } from '@/workers/proof-worker';

function AppContent() {
  const { applyTactic, startSession, scan, error, isLoading } = useProofSession();
  const updateNode = useProofStore((s) => s.updateNode);
  const nodes = useProofStore((s) => s.nodes);
  const setManualPosition = useProofStore((s) => s.setManualPosition);
  const [tacticError, setTacticError] = useState<string | null>(null);
  const [definitionsPanelCollapsed, setDefinitionsPanelCollapsed] = useState(false);

  // Scan state
  const [foundClaims, setFoundClaims] = useState<GlobalContextEntry[]>([]);
  const [foundTheorems, setFoundTheorems] = useState<GlobalContextEntry[]>([]);
  const [selectedProof, setSelectedProof] = useState<string | null>(null);

  // Use keyboard shortcuts hook
  useKeyboardShortcuts();

  // Use example store
  const selectedExample = useExampleStore((s) => s.selectedExample);
  const selectExample = useExampleStore((s) => s.selectExample);
  const exampleSource = useExampleStore((s) => s.exampleSource);

  // Use metadata store for global context
  const globalContext = useMetadataStore((s) => s.globalContext);

  // Scan whenever example source changes
  useEffect(() => {
    if (exampleSource) {
      scan(exampleSource).then((result) => {
        setFoundClaims(result.claims);
        setFoundTheorems(result.theorems);

        // Auto-select first claim if available
        if (result.claims.length > 0) {
          handleSelectProof(result.claims[0].name);
        } else if (result.theorems.length > 0) {
          handleSelectProof(result.theorems[0].name); // Or maybe don't auto-select completed?
        } else {
          setSelectedProof(null);
        }
      });
    }
  }, [exampleSource, scan]);

  const handleSelectProof = useCallback(async (proofName: string) => {
    if (!exampleSource) return;

    setSelectedProof(proofName);
    try {
      await startSession(exampleSource, proofName);
    } catch (e) {
      console.error("Failed to start session:", e);
    }
  }, [exampleSource, startSession]);

  // Set up the global callback for tactic application
  const handleApplyTactic = useCallback(async (options: ApplyTacticOptions) => {
    const { goalId, tacticType, params, tacticNodeId } = options;
    console.log('[App] Applying tactic:', tacticType, 'to goal:', goalId, 'params:', params, 'tacticNodeId:', tacticNodeId);
    setTacticError(null);

    // Transfer tactic node position to the new tactic ID before sync
    // The new tactic will be created with ID "tactic-for-{goalId}"
    if (tacticNodeId) {
      const tacticNode = nodes.find(n => n.id === tacticNodeId);
      if (tacticNode) {
        const newTacticId = `tactic-for-${goalId}`;
        console.log(`[App] Transferring position from ${tacticNodeId} to ${newTacticId}:`, tacticNode.position);
        setManualPosition(newTacticId, { ...tacticNode.position });
      }
    }

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
  }, [applyTactic, updateNode, nodes, setManualPosition]);

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
            className="rounded border bg-background px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-primary h-8"
          >
            <option value="">-- Select --</option>
            {EXAMPLES.map((ex) => (
              <option key={ex.id} value={ex.id}>
                {ex.name}
              </option>
            ))}
          </select>
        </div>

        <div className="h-6 w-px bg-border" />

        {/* Proof Picker */}
        <ProofPicker
          claims={foundClaims}
          theorems={foundTheorems}
          selectedClaim={selectedProof}
          onSelect={handleSelectProof}
        />

        {/* Show tactic error in header */}
        {(tacticError || error) && (
          <div className="ml-auto rounded bg-red-100 px-2 py-1 text-sm text-red-700">
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
