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
import { generateProofScript } from '@/features/proof-editor/utils/generate-proof-script';
import { EXAMPLES } from '@/features/proof-editor/data/examples';
import { ProofPicker } from '@/features/proof-editor/components/ProofPicker';
import { type GlobalContextEntry } from '@/workers/proof-worker';

function AppContent() {
  const { applyTactic, startSession, scan, error, sessionId } = useProofSession();
  const updateNode = useProofStore((s) => s.updateNode);
  const nodes = useProofStore((s) => s.nodes);
  const isComplete = useProofStore((s) => s.isComplete);
  const getProofTreeForWorker = useProofStore((s) => s.getProofTreeForWorker);
  const setManualPosition = useProofStore((s) => s.setManualPosition);
  const [tacticError, setTacticError] = useState<string | null>(null);
  const [definitionsPanelCollapsed, setDefinitionsPanelCollapsed] = useState(false);
  const [foundClaims, setFoundClaims] = useState<GlobalContextEntry[]>([]);
  const [foundTheorems, setFoundTheorems] = useState<GlobalContextEntry[]>([]);
  const [selectedProof, setSelectedProof] = useState<string | null>(null);
  // Track previous claims list (used by scan effect)
  const prevFoundClaimsRef = useRef<GlobalContextEntry[]>([]);

  // Use keyboard shortcuts hook
  useKeyboardShortcuts();

  // Use example store
  const selectedExample = useExampleStore((s) => s.selectedExample);
  const selectExample = useExampleStore((s) => s.selectExample);
  const exampleSource = useExampleStore((s) => s.exampleSource);

  const setExampleSource = useExampleStore((s) => s.setExampleSource);

  // Use metadata store for global context
  const globalContext = useMetadataStore((s) => s.globalContext);

  const handleSelectProof = useCallback(async (proofName: string) => {
    if (!exampleSource) return;

    setSelectedProof(proofName);
    try {
      await startSession(exampleSource, proofName);
    } catch (e) {
      console.error("Failed to start session:", e);
    }
  }, [exampleSource, startSession]);

  // No auto-switch: when a proof completes, stay on the completed proof.
  // User manually selects the next proof from the ProofPicker dropdown,
  // or drags proven theorems from the Theorem Library onto the canvas.

  // Scan whenever example source changes, debounced to avoid scanning on every keystroke
  useEffect(() => {
    if (!exampleSource) return;

    const timeoutId = setTimeout(() => {
      scan(exampleSource).then((result) => {
        setFoundClaims(result.claims);
        setFoundTheorems(result.theorems);
        prevFoundClaimsRef.current = result.claims;

        // Check if the currently selected proof is still in the file
        const isCurrentStillValid =
          selectedProof &&
          (result.claims.some(c => c.name === selectedProof) ||
            result.theorems.some(t => t.name === selectedProof));

        // If not valid, or not set, try to select something
        if (!isCurrentStillValid) {
          if (result.claims.length > 0) {
            handleSelectProof(result.claims[0].name);
          } else if (result.theorems.length > 0) {
            handleSelectProof(result.theorems[0].name);
          } else {
            setSelectedProof(null);
          }
        }
      });
    }, 500); // 500ms debounce

    return () => clearTimeout(timeoutId);
  }, [exampleSource, scan, selectedProof, handleSelectProof]);
  // Set up the global callback for tactic application
  const handleApplyTactic = useCallback(async (options: ApplyTacticOptions) => {
    const { goalId, tacticType, params, tacticNodeId } = options;
    setTacticError(null);

    // Transfer tactic node position to the new tactic ID before sync
    // The new tactic will be created with ID "tactic-for-{goalId}"
    if (tacticNodeId) {
      const tacticNode = nodes.find(n => n.id === tacticNodeId);
      if (tacticNode) {
        const newTacticId = `tactic-for-${goalId}`;
        setManualPosition(newTacticId, { ...tacticNode.position });
      }
    }

    try {
      const result = await applyTactic(goalId, tacticType, params);

      if (result.success) {
        // Success: clear any previous error on the goal node
        updateNode(goalId, { lastTacticError: undefined, lastFailedTactic: undefined });
      } else {
        // Failure: update tactic node with error status
        const errorMsg = result.error || 'Tactic application failed';
        setTacticError(errorMsg);

        // Propagate error to the goal node for canvas visualization
        const tacticLabel = params.expression || params.variableName
          ? `${tacticType} ${params.expression || params.variableName}`
          : tacticType;
        updateNode(goalId, {
          lastTacticError: result.errorDetail || { kind: 'generic', message: errorMsg },
          lastFailedTactic: tacticLabel,
        });

        // If we have a tactic node ID, update its status to error
        if (tacticNodeId) {
          updateNode(tacticNodeId, {
            status: 'error',
            errorMessage: errorMsg,
            errorDetail: result.errorDetail,
          });
        }
      }
    } catch (e) {
      const errorMsg = e instanceof Error ? e.message : String(e);
      setTacticError(errorMsg);

      // Propagate error to goal node
      updateNode(goalId, {
        lastTacticError: { kind: 'generic', message: errorMsg },
        lastFailedTactic: tacticType,
      });

      // If we have a tactic node ID, update its status to error
      if (tacticNodeId) {
        updateNode(tacticNodeId, {
          status: 'error',
          errorMessage: errorMsg,
          errorDetail: { kind: 'generic', message: errorMsg },
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

  const handleExportScript = useCallback(() => {
    if (!selectedProof || !sessionId || !exampleSource) return;

    // Get current proof tree state
    const currentTree = getProofTreeForWorker();

    if (!currentTree) {
      console.warn('Cannot export script: No proof tree available');
      return;
    }

    // Generate script from current tree
    const scriptStr = generateProofScript(currentTree, selectedProof);

    // Remove existing define-tactically block for this proof
    let currentSource = exampleSource;
    const defineRegex = new RegExp(`\\(\\s*define-tactically\\s+${selectedProof}\\b`);
    let dMatch = currentSource.match(defineRegex);
    while (dMatch) {
      let parens = 0;
      let started = false;
      let inString = false;
      let inComment = false;
      let i = dMatch.index!;
      for (; i < currentSource.length; i++) {
        const char = currentSource[i];
        if (inComment) { if (char === '\n') inComment = false; continue; }
        if (inString) { if (char === '"' && currentSource[i - 1] !== '\\') inString = false; continue; }
        if (char === ';') { inComment = true; continue; }
        if (char === '"') { inString = true; continue; }
        if (char === '(') { parens++; started = true; }
        else if (char === ')') { parens--; }
        if (started && parens === 0) break;
      }
      currentSource = currentSource.slice(0, dMatch.index!) + currentSource.slice(i + 1);
      dMatch = currentSource.match(defineRegex);
    }

    // Insert new define-tactically block
    let newSource = '';
    const claimRegex = new RegExp(`\\(\\s*claim\\s+${selectedProof}\\b`);
    const cMatch = currentSource.match(claimRegex);
    if (!cMatch) {
      newSource = currentSource + '\n\n' + scriptStr + '\n';
    } else {
      let parens = 0;
      let started = false;
      let inString = false;
      let inComment = false;
      let i = cMatch.index!;
      for (; i < currentSource.length; i++) {
        const char = currentSource[i];
        if (inComment) { if (char === '\n') inComment = false; continue; }
        if (inString) { if (char === '"' && currentSource[i - 1] !== '\\') inString = false; continue; }
        if (char === ';') { inComment = true; continue; }
        if (char === '"') { inString = true; continue; }
        if (char === '(') { parens++; started = true; }
        else if (char === ')') { parens--; }
        if (started && parens === 0) break;
      }
      const insertPos = i + 1;
      newSource = currentSource.slice(0, insertPos) + '\n\n' + scriptStr + '\n' + currentSource.slice(insertPos);
    }

    setExampleSource(newSource);
  }, [exampleSource, selectedProof, sessionId, getProofTreeForWorker, setExampleSource]);

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

        {/* Proof Picker */}
        <ProofPicker
          claims={foundClaims}
          theorems={foundTheorems}
          selectedClaim={selectedProof}
          onSelect={handleSelectProof}
        />

        {/* Export Script Button */}
        {selectedProof && isComplete && (
          <button
            onClick={handleExportScript}
            className="rounded bg-green-600 px-3 py-1.5 text-sm font-medium text-white shadow-sm hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 ml-2"
          >
            Export Proof
          </button>
        )}

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
