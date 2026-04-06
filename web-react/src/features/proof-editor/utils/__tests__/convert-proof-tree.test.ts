import { describe, it, expect } from "vitest";
import { convertProofTreeToReactFlow } from "../convert-proof-tree";
import type { ProofTree, GoalNode as ProtoGoalNode, AppliedTactic } from "@pie/protocol";

function makeGoal(id: string, isComplete = false, isCurrent = false): ProtoGoalNode["goal"] {
  return { id, type: `(-> Nat Nat)`, context: [], isComplete, isCurrent };
}

function appliedTactic(type: string, display: string): AppliedTactic {
  return { tacticType: type as AppliedTactic["tacticType"], params: {}, displayString: display };
}

describe("convertProofTreeToReactFlow", () => {
  it("converts a single-goal tree to one GoalNode and no edges", () => {
    const tree: ProofTree = {
      root: { goal: makeGoal("g0"), children: [] },
      isComplete: false,
      currentGoalId: "g0",
    };

    const { nodes, edges } = convertProofTreeToReactFlow(tree);

    expect(nodes).toHaveLength(1);
    expect(nodes[0].type).toBe("goal");
    expect(nodes[0].id).toBe("g0");
    expect(edges).toHaveLength(0);
  });

  it("creates a TacticNode and edges for a goal with completedBy", () => {
    const tree: ProofTree = {
      root: {
        goal: makeGoal("g0", true),
        children: [],
        completedBy: appliedTactic("exact", "exact zero"),
      },
      isComplete: true,
      currentGoalId: null,
    };

    const { nodes, edges } = convertProofTreeToReactFlow(tree);

    // GoalNode + completing TacticNode
    expect(nodes).toHaveLength(2);
    const tacticNode = nodes.find((n) => n.type === "tactic");
    expect(tacticNode).toBeDefined();
    expect(tacticNode!.data.tacticType).toBe("exact");
    expect(tacticNode!.data.displayName).toBe("exact zero");

    // Edge from goal to tactic
    expect(edges).toHaveLength(1);
    expect(edges[0].source).toBe("g0");
    expect(edges[0].target).toBe(tacticNode!.id);
  });

  it("creates correct topology for a goal with children", () => {
    const tree: ProofTree = {
      root: {
        goal: makeGoal("g0"),
        children: [
          { goal: makeGoal("g1"), children: [] },
          { goal: makeGoal("g2"), children: [] },
        ],
        appliedTactic: appliedTactic("elimNat", "elim-Nat n"),
      },
      isComplete: false,
      currentGoalId: "g1",
    };

    const { nodes, edges } = convertProofTreeToReactFlow(tree);

    // g0 (goal) + tactic-for-g0 (tactic) + g1 (goal) + g2 (goal)
    const goalNodes = nodes.filter((n) => n.type === "goal");
    const tacticNodes = nodes.filter((n) => n.type === "tactic");
    expect(goalNodes).toHaveLength(3);
    expect(tacticNodes).toHaveLength(1);

    // Edges: g0->tactic, tactic->g1, tactic->g2
    expect(edges).toHaveLength(3);
    const goalToTactic = edges.find((e) => e.source === "g0");
    expect(goalToTactic).toBeDefined();
    const tacticToGoals = edges.filter((e) => e.source === tacticNodes[0].id);
    expect(tacticToGoals).toHaveLength(2);
  });

  it("infers correct status values", () => {
    const tree: ProofTree = {
      root: {
        goal: makeGoal("g0", false),
        children: [
          {
            goal: makeGoal("g1", true),
            children: [],
            completedBy: appliedTactic("exact", "exact zero"),
          },
          {
            goal: makeGoal("g2", false),
            children: [],
          },
          {
            goal: makeGoal("g3", false),
            children: [],
            completedBy: appliedTactic("todo", "todo"),
          },
        ],
        appliedTactic: appliedTactic("elimNat", "elim-Nat n"),
      },
      isComplete: false,
      currentGoalId: "g2",
    };

    const { nodes } = convertProofTreeToReactFlow(tree);

    const g1 = nodes.find((n) => n.id === "g1");
    const g2 = nodes.find((n) => n.id === "g2");
    const g3 = nodes.find((n) => n.id === "g3");

    expect(g1!.data.status).toBe("completed");
    expect(g2!.data.status).toBe("in-progress");
    expect(g3!.data.status).toBe("todo");
  });

  it("produces non-overlapping layout positions", () => {
    const tree: ProofTree = {
      root: {
        goal: makeGoal("g0"),
        children: [
          { goal: makeGoal("g1"), children: [] },
          { goal: makeGoal("g2"), children: [] },
          { goal: makeGoal("g3"), children: [] },
        ],
        appliedTactic: appliedTactic("elimNat", "elim-Nat n"),
      },
      isComplete: false,
      currentGoalId: "g1",
    };

    const { nodes } = convertProofTreeToReactFlow(tree);
    const goalNodes = nodes.filter((n) => n.type === "goal" && n.id !== "g0");

    // All child goals should have distinct x positions
    const xPositions = goalNodes.map((n) => n.position.x);
    const uniqueX = new Set(xPositions);
    expect(uniqueX.size).toBe(xPositions.length);
  });
});
