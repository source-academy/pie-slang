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
const NODE_WIDTH = 200;
const NODE_HEIGHT = 120;
const HORIZONTAL_SPACING = 50;
const VERTICAL_SPACING = 150;

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

  // Position children below, with tactic node in between
  const tacticY = y + NODE_HEIGHT + VERTICAL_SPACING / 2;
  const childrenY = y + NODE_HEIGHT + VERTICAL_SPACING;

  // Calculate starting x for children
  let childX = x;
  const totalChildrenWidth =
    node.children.reduce(
      (sum, child) => sum + (widths.get(child.goal.id) || NODE_WIDTH),
      0,
    ) +
    (node.children.length - 1) * HORIZONTAL_SPACING;

  // Center children under parent
  childX = x + (nodeWidth - totalChildrenWidth) / 2;

  // Store tactic position (centered between this node and children)
  if (node.appliedTactic) {
    const tacticId = `tactic-for-${node.goal.id}`;
    positions.set(tacticId, { x: nodeX, y: tacticY });
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
  depth: number = 0,
  parentContextNames: Set<string> = new Set(),
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

  // Convert context entries with scope depth, marking new entries
  const rawContext = node.goal.context || [];
  const context: ContextEntry[] = rawContext.map((entry) => ({
    ...convertContextEntry(entry),
    scopeDepth: depth,
    isNew: !parentContextNames.has(entry.name),
  }));

  // Build current context names set for children
  const currentContextNames = new Set(rawContext.map((e) => e.name));

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
      depth,
    },
  };
  nodes.push(goalNode);

  // If there's an applied tactic, create tactic node and edges
  if (node.appliedTactic && node.children.length > 0) {
    const tacticId = `tactic-for-${node.goal.id}`;
    const tacticPosition = positions.get(tacticId) || {
      x: position.x,
      y: position.y + NODE_HEIGHT + VERTICAL_SPACING / 2,
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
      y: position.y + NODE_HEIGHT + 50,
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

  // Recursively process children, passing current context for isNew detection
  for (const child of node.children) {
    traverseTree(child, nodes, edges, positions, currentGoalId, depth + 1, currentContextNames);
  }
}

/**
 * Convert a serializable context entry to internal format
 */
function classifyContextOrigin(entry: ProtoContextEntry): ContextEntry["origin"] {
  if (!entry.introducedBy) {
    return "definition";
  }

  const elimTactics = ["elimNat", "elimList", "elimVec", "elimEither", "elimEqual", "elimAbsurd",
                       "elim-Nat", "elim-List", "elim-Vec", "elim-Either", "elim-Equal", "elim-Absurd",
                       "induction"];
  const introducedByLower = entry.introducedBy.toLowerCase();
  for (const et of elimTactics) {
    if (introducedByLower.includes(et.toLowerCase())) {
      return "inductive-hypothesis";
    }
  }

  const nameLC = entry.name.toLowerCase();
  const isIHName = nameLC === "ih" || nameLC.startsWith("ih-") || nameLC.startsWith("ih_");
  const isEqualityType = entry.type.startsWith("(=") || entry.type.startsWith("(= ");
  if (isIHName || (isEqualityType && entry.introducedBy === "intro")) {
    return "inductive-hypothesis";
  }

  return "free";
}

function convertContextEntry(entry: ProtoContextEntry): ContextEntry {
  return {
    id: `ctx-${entry.name}`,
    name: entry.name,
    type: entry.type,
    origin: classifyContextOrigin(entry),
    introducedBy: entry.introducedBy,
  };
}

