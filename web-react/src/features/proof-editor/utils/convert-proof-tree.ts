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

// Layout constants
// NODE_WIDTH/HEIGHT are estimates used for spacing calculations.
// Goals can be 200–320px wide (wider when displaying longer types or context vars),
// and 120–220px tall depending on how many context entries they show.
// Using conservative over-estimates prevents sibling overlap at the cost of
// slightly more whitespace.
const NODE_WIDTH = 280;          // goal node width estimate
const NODE_HEIGHT = 175;         // goal node height estimate (includes ~2 context vars)
const TACTIC_NODE_WIDTH = 200;   // tactic node width estimate
const TACTIC_NODE_HEIGHT = 80;   // tactic node height estimate
const HORIZONTAL_SPACING = 80;   // gap between sibling subtrees
const GOAL_TO_TACTIC_GAP = 30;   // gap from goal bottom to tactic top
const TACTIC_TO_GOAL_GAP = 40;   // gap from tactic bottom to child goal tops

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

  // Calculate positions using tree layout
  const positions = calculateTreeLayout(proofTree.root);

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
 * Calculate positions for all nodes in the tree using a simple layout algorithm.
 * Returns a map from goal ID to position.
 */
function calculateTreeLayout(
  root: ProtoGoalNode,
): Map<string, { x: number; y: number }> {
  const positions = new Map<string, { x: number; y: number }>();

  // First pass: calculate subtree widths
  const widths = new Map<string, number>();
  calculateSubtreeWidths(root, widths);

  // Second pass: assign positions
  assignPositions(root, 0, 0, widths, positions);

  return positions;
}

/**
 * Calculate the width of each subtree (for horizontal spacing)
 */
function calculateSubtreeWidths(
  node: ProtoGoalNode,
  widths: Map<string, number>,
): number {
  if (node.children.length === 0) {
    const width = NODE_WIDTH;
    widths.set(node.goal.id, width);
    return width;
  }

  let totalWidth = 0;
  for (const child of node.children) {
    totalWidth += calculateSubtreeWidths(child, widths);
  }
  // Add spacing between children
  totalWidth += (node.children.length - 1) * HORIZONTAL_SPACING;

  // Width is at least the node width
  const width = Math.max(NODE_WIDTH, totalWidth);
  widths.set(node.goal.id, width);
  return width;
}

/**
 * Assign positions to nodes based on their subtree widths
 */
function assignPositions(
  node: ProtoGoalNode,
  x: number,
  y: number,
  widths: Map<string, number>,
  positions: Map<string, { x: number; y: number }>,
): void {
  const nodeWidth = widths.get(node.goal.id) || NODE_WIDTH;

  // Center this node within its allocated space
  const nodeX = x + nodeWidth / 2 - NODE_WIDTH / 2;
  positions.set(node.goal.id, { x: nodeX, y });

  if (node.children.length === 0) return;

  // Tactic sits below the goal with GOAL_TO_TACTIC_GAP clearance.
  // Children sit below the tactic with TACTIC_TO_GOAL_GAP clearance.
  const tacticY = y + NODE_HEIGHT + GOAL_TO_TACTIC_GAP;
  const childrenY = tacticY + TACTIC_NODE_HEIGHT + TACTIC_TO_GOAL_GAP;

  const totalChildrenWidth =
    node.children.reduce(
      (sum, child) => sum + (widths.get(child.goal.id) || NODE_WIDTH),
      0,
    ) +
    (node.children.length - 1) * HORIZONTAL_SPACING;

  // Center children span under the allocated space
  let childX = x + (nodeWidth - totalChildrenWidth) / 2;

  // Center tactic over the children span (independent of goal width)
  if (node.appliedTactic) {
    const tacticId = `tactic-for-${node.goal.id}`;
    const tacticX = x + nodeWidth / 2 - TACTIC_NODE_WIDTH / 2;
    positions.set(tacticId, { x: tacticX, y: tacticY });
  }

  // Position each child
  for (const child of node.children) {
    const childWidth = widths.get(child.goal.id) || NODE_WIDTH;
    assignPositions(child, childX, childrenY, widths, positions);
    childX += childWidth + HORIZONTAL_SPACING;
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

