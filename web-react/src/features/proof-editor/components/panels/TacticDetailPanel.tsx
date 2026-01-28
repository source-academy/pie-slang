import { useState, useEffect } from 'react';
import { useProofStore, useUIStore } from '../../store';
import type { TacticNode } from '../../store/types';
import { cn } from '@/shared/lib/utils';
import { TACTICS } from '../../data/tactics';

/**
 * TacticDetailPanel Component
 *
 * Shows detailed information and configuration for the selected tactic node.
 * Displayed in the side panel when a tactic is selected.
 */
export function TacticDetailPanel() {
  const selectedNodeId = useUIStore((s) => s.selectedNodeId);
  const nodes = useProofStore((s) => s.nodes);
  const edges = useProofStore((s) => s.edges);
  const updateNode = useProofStore((s) => s.updateNode);
  const selectNode = useUIStore((s) => s.selectNode);

  // Find the selected tactic node
  const selectedNode = nodes.find(
    (n): n is TacticNode => n.id === selectedNodeId && n.type === 'tactic'
  );

  if (!selectedNode) {
    return null;
  }

  const { data } = selectedNode;
  const tacticInfo = TACTICS.find((t) => t.type === data.tacticType);

  // Find connected context variable (for elimination tactics)
  const connectedContextEdge = edges.find(
    (e) => e.target === selectedNode.id && e.data?.kind === 'context-to-tactic'
  );

  return (
    <div className="w-80 border-l bg-white overflow-y-auto">
      {/* Header */}
      <div className="flex items-center justify-between border-b p-4">
        <h2 className="font-semibold">Tactic Details</h2>
        <button
          onClick={() => selectNode(null)}
          className="rounded p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-600"
        >
          <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      {/* Tactic Type */}
      <div className="border-b p-4">
        <div className="mb-2 text-xs font-medium text-gray-500">Tactic</div>
        <div className="flex items-center gap-2">
          <span className={cn(
            'rounded px-2 py-1 font-mono text-sm font-semibold',
            data.isValid ? 'bg-tactic text-white' : 'bg-red-400 text-white'
          )}>
            {data.displayName}
          </span>
          {!data.isConfigured && (
            <span className="rounded bg-yellow-100 px-2 py-0.5 text-xs text-yellow-700">
              unconfigured
            </span>
          )}
        </div>
        {tacticInfo && (
          <p className="mt-2 text-sm text-gray-600">{tacticInfo.description}</p>
        )}
      </div>

      {/* Configuration Form */}
      <TacticConfigForm
        node={selectedNode}
        updateNode={updateNode}
        connectedContextVarId={connectedContextEdge?.data?.contextVarId}
      />

      {/* Validation Status */}
      {!data.isValid && data.errorMessage && (
        <div className="border-t p-4">
          <div className="mb-1 text-xs font-medium text-red-500">Error</div>
          <div className="rounded bg-red-50 p-2 text-sm text-red-600">
            {data.errorMessage}
          </div>
        </div>
      )}

      {/* Node ID (for debugging) */}
      <div className="border-t p-4">
        <div className="mb-1 text-xs font-medium text-gray-500">Node ID</div>
        <code className="text-xs text-gray-400">{selectedNode.id}</code>
      </div>
    </div>
  );
}

/**
 * Configuration form based on tactic type
 */
function TacticConfigForm({
  node,
  updateNode,
  connectedContextVarId,
}: {
  node: TacticNode;
  updateNode: <T extends { data: unknown }>(id: string, data: Partial<T['data']>) => void;
  connectedContextVarId?: string;
}) {
  const { data } = node;

  switch (data.tacticType) {
    case 'intro':
      return (
        <IntroConfig
          node={node}
          updateNode={updateNode}
        />
      );

    case 'exact':
      return (
        <ExactConfig
          node={node}
          updateNode={updateNode}
        />
      );

    case 'elimNat':
    case 'elimList':
    case 'elimVec':
    case 'elimEither':
    case 'elimEqual':
    case 'elimAbsurd':
      return (
        <ElimConfig
          node={node}
          connectedContextVarId={connectedContextVarId}
        />
      );

    case 'apply':
      return (
        <ApplyConfig
          node={node}
          updateNode={updateNode}
        />
      );

    case 'split':
    case 'left':
    case 'right':
      return (
        <div className="p-4">
          <p className="text-sm text-gray-500 italic">No configuration needed</p>
        </div>
      );

    default:
      return null;
  }
}

/**
 * Intro tactic configuration - variable name input
 */
function IntroConfig({
  node,
  updateNode,
}: {
  node: TacticNode;
  updateNode: <T extends { data: unknown }>(id: string, data: Partial<T['data']>) => void;
}) {
  const [variableName, setVariableName] = useState(node.data.parameters.variableName || '');

  useEffect(() => {
    setVariableName(node.data.parameters.variableName || '');
  }, [node.id, node.data.parameters.variableName]);

  const handleSave = () => {
    if (variableName.trim()) {
      updateNode(node.id, {
        parameters: { ...node.data.parameters, variableName: variableName.trim() },
        displayName: `intro ${variableName.trim()}`,
        isConfigured: true,
      });
    }
  };

  return (
    <div className="p-4">
      <div className="mb-2 text-xs font-medium text-gray-500">Variable Name</div>
      <div className="flex gap-2">
        <input
          type="text"
          value={variableName}
          onChange={(e) => setVariableName(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleSave()}
          placeholder="e.g., n, x, xs"
          className="flex-1 rounded border px-2 py-1 font-mono text-sm focus:border-blue-400 focus:outline-none"
        />
        <button
          onClick={handleSave}
          disabled={!variableName.trim()}
          className="rounded bg-blue-500 px-3 py-1 text-sm text-white hover:bg-blue-600 disabled:bg-gray-300"
        >
          Set
        </button>
      </div>
    </div>
  );
}

/**
 * Exact tactic configuration - expression input
 */
function ExactConfig({
  node,
  updateNode,
}: {
  node: TacticNode;
  updateNode: <T extends { data: unknown }>(id: string, data: Partial<T['data']>) => void;
}) {
  const [expression, setExpression] = useState(node.data.parameters.expression || '');

  useEffect(() => {
    setExpression(node.data.parameters.expression || '');
  }, [node.id, node.data.parameters.expression]);

  const handleSave = () => {
    if (expression.trim()) {
      updateNode(node.id, {
        parameters: { ...node.data.parameters, expression: expression.trim() },
        displayName: `exact`,
        isConfigured: true,
      });
    }
  };

  return (
    <div className="p-4">
      <div className="mb-2 text-xs font-medium text-gray-500">Expression</div>
      <textarea
        value={expression}
        onChange={(e) => setExpression(e.target.value)}
        placeholder="Enter a Pie expression..."
        className="w-full rounded border px-2 py-1 font-mono text-sm focus:border-blue-400 focus:outline-none"
        rows={3}
      />
      <button
        onClick={handleSave}
        disabled={!expression.trim()}
        className="mt-2 rounded bg-blue-500 px-3 py-1 text-sm text-white hover:bg-blue-600 disabled:bg-gray-300"
      >
        Set Expression
      </button>
    </div>
  );
}

/**
 * Elimination tactic configuration - shows connected context variable (read-only)
 */
function ElimConfig({
  node,
  connectedContextVarId,
}: {
  node: TacticNode;
  connectedContextVarId?: string;
}) {
  const tacticName = node.data.tacticType.replace('elim', '');

  return (
    <div className="p-4">
      <div className="mb-2 text-xs font-medium text-gray-500">Target Variable</div>
      {connectedContextVarId ? (
        <div className="flex items-center gap-2">
          <span className="rounded bg-purple-100 px-2 py-1 font-mono text-sm text-purple-700">
            {node.data.parameters.variableName || connectedContextVarId}
          </span>
          <span className="text-xs text-gray-500">connected via edge</span>
        </div>
      ) : (
        <div className="rounded bg-yellow-50 p-2 text-sm text-yellow-700">
          Connect a {tacticName} variable from a goal's context to this tactic's left handle.
        </div>
      )}
    </div>
  );
}

/**
 * Apply tactic configuration - lemma selection
 */
function ApplyConfig({
  node,
  updateNode,
}: {
  node: TacticNode;
  updateNode: <T extends { data: unknown }>(id: string, data: Partial<T['data']>) => void;
}) {
  const nodes = useProofStore((s) => s.nodes);

  // Find available lemmas
  const lemmas = nodes.filter((n) => n.type === 'lemma');

  const handleSelect = (lemmaId: string) => {
    const lemma = lemmas.find((l) => l.id === lemmaId);
    if (lemma) {
      updateNode(node.id, {
        parameters: { ...node.data.parameters, lemmaId },
        displayName: `apply ${lemma.data.name}`,
        isConfigured: true,
      });
    }
  };

  return (
    <div className="p-4">
      <div className="mb-2 text-xs font-medium text-gray-500">Apply Lemma</div>
      {lemmas.length > 0 ? (
        <select
          value={node.data.parameters.lemmaId || ''}
          onChange={(e) => handleSelect(e.target.value)}
          className="w-full rounded border px-2 py-1 text-sm focus:border-blue-400 focus:outline-none"
        >
          <option value="">Select a lemma...</option>
          {lemmas.map((lemma) => (
            <option key={lemma.id} value={lemma.id}>
              {lemma.data.name}: {lemma.data.type}
            </option>
          ))}
        </select>
      ) : (
        <p className="text-sm text-gray-500 italic">No lemmas available</p>
      )}
    </div>
  );
}
