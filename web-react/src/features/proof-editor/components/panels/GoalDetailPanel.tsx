import { useProofStore, useUIStore } from '../../store';
import type { GoalNode } from '../../store/types';
import { cn } from '@/shared/lib/utils';

/**
 * GoalDetailPanel Component
 *
 * Shows detailed information about the selected goal node.
 * Displayed as a side panel when a goal is selected.
 */
export function GoalDetailPanel() {
  const selectedNodeId = useUIStore((s) => s.selectedNodeId);
  const nodes = useProofStore((s) => s.nodes);
  const selectNode = useUIStore((s) => s.selectNode);

  // Find the selected node
  const selectedNode = nodes.find(
    (n): n is GoalNode => n.id === selectedNodeId && n.type === 'goal'
  );

  if (!selectedNode) {
    return (
      <div className="w-80 border-l bg-gray-50 p-4">
        <p className="text-sm text-gray-500">
          Click on a goal to see details
        </p>
      </div>
    );
  }

  const { data } = selectedNode;

  const statusColors = {
    pending: 'bg-goal-pending',
    'in-progress': 'bg-goal-current',
    completed: 'bg-goal-complete',
  };

  return (
    <div className="w-80 border-l bg-white overflow-y-auto">
      {/* Header */}
      <div className="flex items-center justify-between border-b p-4">
        <h2 className="font-semibold">Goal Details</h2>
        <button
          onClick={() => selectNode(null)}
          className="rounded p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-600"
        >
          <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      {/* Status */}
      <div className="border-b p-4">
        <div className="mb-1 text-xs font-medium text-gray-500">Status</div>
        <div className="flex items-center gap-2">
          <span className={cn('h-3 w-3 rounded-full', statusColors[data.status])} />
          <span className="text-sm font-medium capitalize">
            {data.status === 'in-progress' ? 'Current' : data.status}
          </span>
        </div>
      </div>

      {/* Goal Type */}
      <div className="border-b p-4">
        <div className="mb-2 text-xs font-medium text-gray-500">Goal Type</div>
        <div className="rounded bg-gray-50 p-3 font-mono text-sm break-all">
          {data.goalType}
        </div>
      </div>

      {/* Context */}
      <div className="p-4">
        <div className="mb-2 text-xs font-medium text-gray-500">
          Context ({data.context.length} binding{data.context.length !== 1 ? 's' : ''})
        </div>
        {data.context.length === 0 ? (
          <p className="text-sm text-gray-400 italic">No context bindings</p>
        ) : (
          <div className="space-y-2">
            {data.context.map((entry) => (
              <div
                key={entry.id}
                className={cn(
                  'rounded border p-2',
                  entry.origin === 'introduced'
                    ? 'border-blue-200 bg-blue-50'
                    : 'border-gray-200 bg-gray-50'
                )}
              >
                <div className="flex items-center justify-between">
                  <span className="font-mono text-sm font-semibold text-blue-700">
                    {entry.name}
                  </span>
                  {entry.origin === 'introduced' && (
                    <span className="rounded bg-blue-200 px-1.5 py-0.5 text-[10px] text-blue-700">
                      introduced
                    </span>
                  )}
                </div>
                <div className="mt-1 font-mono text-xs text-gray-600">
                  : {entry.type}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Parent Goal */}
      {data.parentGoalId && (
        <div className="border-t p-4">
          <div className="mb-1 text-xs font-medium text-gray-500">Parent Goal</div>
          <button
            onClick={() => selectNode(data.parentGoalId!)}
            className="text-sm text-blue-600 hover:underline"
          >
            Go to parent →
          </button>
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
