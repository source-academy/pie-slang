import { useProofStore, useUIStore } from '../../store';
import { GoalDetailPanel } from './GoalDetailPanel';
import { TacticDetailPanel } from './TacticDetailPanel';

/**
 * DetailPanel Component
 *
 * Unified side panel that shows details for the selected node.
 * Switches between GoalDetailPanel and TacticDetailPanel based on node type.
 */
export function DetailPanel() {
  const selectedNodeId = useUIStore((s) => s.selectedNodeId);
  const nodes = useProofStore((s) => s.nodes);

  // Find the selected node to determine which panel to show
  const selectedNode = nodes.find((n) => n.id === selectedNodeId);

  // No selection - show placeholder
  if (!selectedNode) {
    return (
      <div className="w-80 border-l bg-gray-50 p-4">
        <p className="text-sm text-gray-500">
          Click on a node to see details
        </p>
      </div>
    );
  }

  // Show appropriate panel based on node type
  switch (selectedNode.type) {
    case 'goal':
      return <GoalDetailPanel />;
    case 'tactic':
      return <TacticDetailPanel />;
    case 'lemma':
      // TODO: LemmaDetailPanel
      return (
        <div className="w-80 border-l bg-gray-50 p-4">
          <p className="text-sm text-gray-500">
            Lemma details coming soon
          </p>
        </div>
      );
    default:
      return null;
  }
}
