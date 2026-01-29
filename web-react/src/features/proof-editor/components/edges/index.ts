import type { EdgeTypes } from '@xyflow/react';
import type { ProofEdgeData } from '../../store/types';

/**
 * Edge color scheme based on edge type:
 * - goal-to-tactic: Orange (matches goal color)
 * - tactic-to-goal: Blue (matches tactic color)
 * - context-to-tactic: Purple (special context connections)
 * - lemma-to-tactic: Green (matches lemma color)
 */
const EDGE_COLORS: Record<ProofEdgeData['kind'], string> = {
  'goal-to-tactic': '#f97316',    // Orange
  'tactic-to-goal': '#3b82f6',    // Blue
  'context-to-tactic': '#a855f7', // Purple
  'lemma-to-tactic': '#22c55e',   // Green
};

/**
 * Get edge style based on edge kind
 */
export function getEdgeStyle(kind?: ProofEdgeData['kind']): React.CSSProperties {
  const color = kind ? EDGE_COLORS[kind] : '#94a3b8';
  return {
    stroke: color,
    strokeWidth: 2,
  };
}

/**
 * Edge types for React Flow
 * Currently using default smoothstep edges with custom styling
 * Can be extended with custom edge components if needed
 */
export const edgeTypes: EdgeTypes = {
  // Using default smoothstep edge type
  // Custom edge components can be added here if needed:
  // 'proof-edge': ProofEdge,
};
