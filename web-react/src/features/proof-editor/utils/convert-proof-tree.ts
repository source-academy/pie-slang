import dagre from "@dagrejs/dagre";
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

// Node size estimates (dagre needs dimensions upfront)
const GOAL_WIDTH = 220;
const GOAL_HEIGHT = 130;
const TACTIC_WIDTH = 160;
const TACTIC_HEIGHT = 52;

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
 * Calculate positions for all nodes in the tree using dagre.
 * Returns a map from node ID to top-left position (React Flow convention).
 */
function calculateTreeLayout(
  root: ProtoGoalNode,
): Map<string, { x: number; y: number }> {
  const g = new dagre.graphlib.Graph();
  g.setDefaultEdgeLabel(() => ({}));
  g.setGraph({ rankdir: "TB", ranksep: 60, nodesep: 40, edgesep: 10 });

  // Collect all nodes and edges from the tree
  function collectNodes(node: ProtoGoalNode) {
    g.setNode(node.goal.id, { width: GOAL_WIDTH, height: GOAL_HEIGHT });

    if (node.appliedTactic && node.children.length > 0) {
      const tacticId = `tactic-for-${node.goal.id}`;
      g.setNode(tacticId, { width: TACTIC_WIDTH, height: TACTIC_HEIGHT });
      g.setEdge(node.goal.id, tacticId);
      for (const child of node.children) {
        g.setEdge(tacticId, child.goal.id);
        collectNodes(child);
      }
    } else if (node.completedBy && node.children.length === 0) {
      const tacticId = `tactic-completing-${node.goal.id}`;
      g.setNode(tacticId, { width: TACTIC_WIDTH, height: TACTIC_HEIGHT });
      g.setEdge(node.goal.id, tacticId);
    } else {
      for (const child of node.children) {
        g.setEdge(node.goal.id, child.goal.id);
        collectNodes(child);
      }
    }
  }

  collectNodes(root);
  dagre.layout(g);

  // Dagre positions are node centers — convert to top-left for React Flow
  const positions = new Map<string, { x: number; y: number }>();
  g.nodes().forEach((id) => {
    const n = g.node(id);
    if (n) {
      positions.set(id, { x: n.x - n.width / 2, y: n.y - n.height / 2 });
    }
  });

  return positions;
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
      x: position.x,
      y: position.y + GOAL_HEIGHT + 40,
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
      data: { kind: "goal-to-tactic" },
    });

    // Edges from tactic to children
    node.children.forEach((child, index) => {
      edges.push({
        id: `edge-${nanoid(8)}`,
        source: tacticId,
        target: child.goal.id,
        data: { kind: "tactic-to-goal", outputIndex: index },
      });
    });
  }

  // Handle completed leaf nodes (completedBy tactic but no children)
  if (node.completedBy && node.children.length === 0) {
    const tacticId = `tactic-completing-${node.goal.id}`;
    const tacticPosition = {
      x: position.x,
      y: position.y + GOAL_HEIGHT + 40,
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

