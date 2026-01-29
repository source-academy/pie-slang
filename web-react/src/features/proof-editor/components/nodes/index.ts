import { GoalNode } from './GoalNode';
import { TacticNode } from './TacticNode';
import { LemmaNode } from './LemmaNode';
import { GhostTacticNode } from './GhostTacticNode';

export { GoalNode } from './GoalNode';
export { TacticNode } from './TacticNode';
export { LemmaNode } from './LemmaNode';
export { GhostTacticNode } from './GhostTacticNode';
export type { GhostTacticNodeData, GhostTacticNode as GhostTacticNodeType } from './GhostTacticNode';

/**
 * Node type registry for React Flow
 *
 * Maps node type strings to their component implementations.
 * Used by React Flow to render custom nodes.
 */
export const nodeTypes = {
  goal: GoalNode,
  tactic: TacticNode,
  lemma: LemmaNode,
  ghost: GhostTacticNode,
} as const;
