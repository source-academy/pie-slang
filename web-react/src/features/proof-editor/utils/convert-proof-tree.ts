import type {
  ProofNode,
  ProofEdge,
  GoalNode,
  TacticNode,
  GoalNodeData,
  TacticParameters,
  ContextEntry,
} from "../store/types";
import type {
  ProofTree,
  GoalNode as ProtoGoalNode,
  ContextEntry as ProtoContextEntry,
} from "@pie/protocol";
import { nanoid } from "nanoid";

// Layout constants — used as fallbacks when measured node sizes are not yet
// available (first render pass).  Kept as conservative over-estimates so the
// initial placement is "at worst slightly too spread out" rather than overlapping.
const NODE_WIDTH = 280;          // goal node width fallback
const NODE_HEIGHT = 175;         // goal node height fallback (includes ~2 context vars)
const TACTIC_NODE_WIDTH = 200;   // tactic node width fallback
const TACTIC_NODE_HEIGHT = 80;   // tactic node height fallback
const HORIZONTAL_SPACING = 80;   // gap between sibling subtrees
const GOAL_TO_TACTIC_GAP = 30;   // gap from goal bottom to tactic top
const TACTIC_TO_GOAL_GAP = 40;   // gap from tactic bottom to child goal tops

// Convenience alias used throughout
type SizeMap = Map<string, { width: number; height: number }>;

interface ConversionResult {
  nodes: ProofNode[];
  edges: ProofEdge[];
}

/**
 * Convert a ProofTree from the protocol to React Flow nodes and edges.
 *
 * This function traverses the proof tree and creates:
 * - GoalNode for each goal
 * - TacticNode for each applied tactic
 * - Edges connecting goals to tactics and tactics to subgoals
 */
export function convertProofTreeToReactFlow(
  proofTree: ProofTree,
): ConversionResult {
  const nodes: ProofNode[] = [];
  const edges: ProofEdge[] = [];

  // First-pass layout — uses fallback constants (no measured sizes yet)
  const positions = computeTreeLayout(proofTree.root);

  // Traverse the tree and create nodes/edges
  traverseTree(
    proofTree.root,
    nodes,
    edges,
    positions,
    proofTree.currentGoalId,
  );

  return { nodes, edges };
}

/**
 * Compute positions for all nodes in the proof tree.
 *
 * Exported so that a post-render hook can call it a second time with the
 * actual measured node sizes from React Flow, replacing the fallback estimates
 * used in the first pass.
 *
 * @param root         Root of the proof tree (from protocol)
 * @param measuredSizes Optional map of nodeId → actual rendered { width, height }.
 *                      When absent the constant fallbacks above are used.
 */
export function computeTreeLayout(
  root: ProtoGoalNode,
  measuredSizes?: SizeMap,
): Map<string, { x: number; y: number }> {
  const widths = new Map<string, number>();
  calculateSubtreeWidths(root, widths, measuredSizes);

  const positions = new Map<string, { x: number; y: number }>();
  assignPositions(root, 0, 0, widths, positions, measuredSizes);

  return positions;
}

/**
 * First pass: calculate the allocated width of each subtree.
 * Uses actual measured widths when available, constants otherwise.
 */
function calculateSubtreeWidths(
  node: ProtoGoalNode,
  widths: Map<string, number>,
  measuredSizes?: SizeMap,
): number {
  const goalW = measuredSizes?.get(node.goal.id)?.width ?? NODE_WIDTH;

  if (node.children.length === 0) {
    widths.set(node.goal.id, goalW);
    return goalW;
  }

  const tacticId = node.appliedTactic ? `tactic-for-${node.goal.id}` : null;
  const tacticW = tacticId
    ? (measuredSizes?.get(tacticId)?.width ?? TACTIC_NODE_WIDTH)
    : TACTIC_NODE_WIDTH;

  let totalChildrenWidth = 0;
  for (const child of node.children) {
    totalChildrenWidth += calculateSubtreeWidths(child, widths, measuredSizes);
  }
  totalChildrenWidth += (node.children.length - 1) * HORIZONTAL_SPACING;

  const width = Math.max(goalW, tacticW, totalChildrenWidth);
  widths.set(node.goal.id, width);
  return width;
}

/**
 * Second pass: assign x/y positions using allocated widths and measured heights.
 */
function assignPositions(
  node: ProtoGoalNode,
  x: number,
  y: number,
  widths: Map<string, number>,
  positions: Map<string, { x: number; y: number }>,
  measuredSizes?: SizeMap,
): void {
  const allocatedWidth = widths.get(node.goal.id) ?? NODE_WIDTH;
  const goalW = measuredSizes?.get(node.goal.id)?.width ?? NODE_WIDTH;
  const goalH = measuredSizes?.get(node.goal.id)?.height ?? NODE_HEIGHT;

  // Center goal within its allocated column
  const nodeX = x + allocatedWidth / 2 - goalW / 2;
  positions.set(node.goal.id, { x: nodeX, y });

  if (node.children.length === 0) return;

  const tacticId = `tactic-for-${node.goal.id}`;
  const tacticW = measuredSizes?.get(tacticId)?.width ?? TACTIC_NODE_WIDTH;
  const tacticH = measuredSizes?.get(tacticId)?.height ?? TACTIC_NODE_HEIGHT;

  // Stack: goal → gap → tactic → gap → children
  const tacticY = y + goalH + GOAL_TO_TACTIC_GAP;
  const childrenY = tacticY + tacticH + TACTIC_TO_GOAL_GAP;

  const totalChildrenWidth =
    node.children.reduce(
      (sum, child) => sum + (widths.get(child.goal.id) ?? NODE_WIDTH),
      0,
    ) +
    (node.children.length - 1) * HORIZONTAL_SPACING;

  let childX = x + (allocatedWidth - totalChildrenWidth) / 2;

  if (node.appliedTactic) {
    const tacticX = x + allocatedWidth / 2 - tacticW / 2;
    positions.set(tacticId, { x: tacticX, y: tacticY });
  }

  for (const child of node.children) {
    const childAllocated = widths.get(child.goal.id) ?? NODE_WIDTH;
    assignPositions(child, childX, childrenY, widths, positions, measuredSizes);
    childX += childAllocated + HORIZONTAL_SPACING;
  }
}

/**
 * Traverse the tree and create React Flow nodes and edges
 */
function traverseTree(
  node: ProtoGoalNode,
  nodes: ProofNode[],
  edges: ProofEdge[],
  positions: Map<string, { x: number; y: number }>,
  currentGoalId: string | null,
): void {
  const position = positions.get(node.goal.id) || { x: 0, y: 0 };

  // Determine goal status
  let status: GoalNodeData["status"] = "pending";
  if (node.completedBy?.tacticType === "todo") {
    status = "todo";
  } else if (node.appliedTactic?.tacticType === "todo") {
    status = "todo";
  } else if (node.goal.isComplete) {
    status = "completed";
  } else if (node.goal.id === currentGoalId) {
    status = "in-progress";
  }

  // Convert context entries
  const context: ContextEntry[] = node.goal.context.map(convertContextEntry);

  // Create goal node
  const goalNode: GoalNode = {
    id: node.goal.id,
    type: "goal",
    position,
    data: {
      kind: "goal",
      goalType: node.goal.type,
      expandedGoalType: node.goal.expandedType, // Full expanded type (if different)
      context,
      status,
      parentGoalId: undefined,
      completedBy: node.completedBy?.displayString,
      isSubtreeComplete: node.isSubtreeComplete,
    },
  };
  nodes.push(goalNode);

  // If there's an applied tactic, create tactic node and edges
  if (node.appliedTactic && node.children.length > 0) {
    const tacticId = `tactic-for-${node.goal.id}`;
    const tacticPosition = positions.get(tacticId) || {
      x: position.x + (NODE_WIDTH - TACTIC_NODE_WIDTH) / 2,
      y: position.y + NODE_HEIGHT + GOAL_TO_TACTIC_GAP,
    };

    const tacticNode: TacticNode = {
      id: tacticId,
      type: "tactic",
      position: tacticPosition,
      data: {
        kind: "tactic",
        tacticType: node.appliedTactic.tacticType,
        displayName: node.appliedTactic.displayString,
        parameters: node.appliedTactic.params as TacticParameters,
        status: "applied",
        connectedGoalId: node.goal.id,
      },
    };
    nodes.push(tacticNode);

    // Edge from goal to tactic
    edges.push({
      id: `edge-${nanoid(8)}`,
      source: node.goal.id,
      target: tacticId,
      sourceHandle: "goal-output",
      targetHandle: "goal-input",
      data: { kind: "goal-to-tactic" },
    });

    // Edges from tactic to children
    node.children.forEach((child, index) => {
      edges.push({
        id: `edge-${nanoid(8)}`,
        source: tacticId,
        target: child.goal.id,
        sourceHandle: "tactic-output",
        targetHandle: "goal-input",
        data: { kind: "tactic-to-goal", outputIndex: index },
      });
    });
  }

  // Handle completed leaf nodes (completedBy tactic but no children)
  if (node.completedBy && node.children.length === 0) {
    const tacticId = `tactic-completing-${node.goal.id}`;
    const tacticPosition = {
      x: position.x + (NODE_WIDTH - TACTIC_NODE_WIDTH) / 2,
      y: position.y + NODE_HEIGHT + GOAL_TO_TACTIC_GAP,
    };

    const tacticNode: TacticNode = {
      id: tacticId,
      type: "tactic",
      position: tacticPosition,
      data: {
        kind: "tactic",
        tacticType: node.completedBy.tacticType,
        displayName: node.completedBy.displayString,
        parameters: node.completedBy.params as TacticParameters,
        status: "applied",
        connectedGoalId: node.goal.id,
      },
    };
    nodes.push(tacticNode);

    edges.push({
      id: `edge-${nanoid(8)}`,
      source: node.goal.id,
      target: tacticId,
      sourceHandle: "goal-output",
      targetHandle: "goal-input",
      data: { kind: "goal-to-tactic" },
    });
  }

  // Recursively process children
  for (const child of node.children) {
    traverseTree(child, nodes, edges, positions, currentGoalId);
  }
}

/**
 * Convert a serializable context entry to internal format
 */
function convertContextEntry(entry: ProtoContextEntry): ContextEntry {
  return {
    id: `ctx-${entry.name}`,
    name: entry.name,
    type: entry.type,
    origin: entry.introducedBy ? "introduced" : "inherited",
    introducedBy: entry.introducedBy,
  };
}

