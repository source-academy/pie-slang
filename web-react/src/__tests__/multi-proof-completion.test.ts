/**
 * Tests for proof completion propagation in multi-proof scenarios.
 *
 * Covers:
 * - checkProofComplete propagates status bottom-up
 * - Removing a tactic resets the parent goal to pending
 * - deleteTacticCascade removes subtree and resets parent
 * - isProofComplete reflects global pending state
 * - Multi-level trees propagate correctly
 */
import { describe, it, expect, beforeEach } from "vitest";
import { useProofStore } from "../features/proof-editor/store/proof-store";
import type { GoalNodeData, TacticNodeData } from "../features/proof-editor/store/types";

function reset() {
  useProofStore.getState().reset();
}

// --------------------------------------------------------------------------
// Helpers — manually build small proof trees in the store
// --------------------------------------------------------------------------

function addGoal(id: string, type: string, status: GoalNodeData["status"] = "pending") {
  const store = useProofStore.getState();
  // addGoalNode generates a random id; we need deterministic IDs so we set directly
  useProofStore.setState((state) => {
    state.nodes.push({
      id,
      type: "goal",
      position: { x: 0, y: 0 },
      data: {
        kind: "goal",
        goalType: type,
        context: [],
        status,
      },
    });
    if (!state.rootGoalId) state.rootGoalId = id;
  });
}

function addTactic(id: string, tacticType: string, goalId: string, status: TacticNodeData["status"] = "applied") {
  useProofStore.setState((state) => {
    state.nodes.push({
      id,
      type: "tactic",
      position: { x: 0, y: 0 },
      data: {
        kind: "tactic",
        tacticType: tacticType as any,
        displayName: tacticType,
        parameters: {},
        status,
        connectedGoalId: goalId,
      },
    });
  });
}

function addEdge(source: string, target: string, kind: string) {
  useProofStore.setState((state) => {
    state.edges.push({
      id: `edge-${source}-${target}`,
      source,
      target,
      data: { kind: kind as any },
    });
  });
}

// --------------------------------------------------------------------------
// Tests
// --------------------------------------------------------------------------

describe("Proof completion propagation", () => {
  beforeEach(reset);

  it("checkProofComplete marks root as completed when single leaf goal is completed", () => {
    addGoal("root", "(= Nat Nat)", "completed");

    useProofStore.getState().checkProofComplete();

    expect(useProofStore.getState().isProofComplete).toBe(true);
  });

  it("checkProofComplete detects pending goals", () => {
    addGoal("root", "(= Nat Nat)", "pending");

    useProofStore.getState().checkProofComplete();

    expect(useProofStore.getState().isProofComplete).toBe(false);
  });

  it("propagates completion upward: root with split and two completed children", () => {
    // root --(split)--> [child1(completed), child2(completed)]
    addGoal("root", "(Pair A B)", "pending");
    addTactic("tactic-for-root", "split", "root");
    addGoal("child1", "A", "completed");
    addGoal("child2", "B", "completed");

    addEdge("root", "tactic-for-root", "goal-to-tactic");
    addEdge("tactic-for-root", "child1", "tactic-to-goal");
    addEdge("tactic-for-root", "child2", "tactic-to-goal");

    useProofStore.getState().checkProofComplete();

    const root = useProofStore.getState().nodes.find((n) => n.id === "root");
    expect((root?.data as GoalNodeData).status).toBe("completed");
    expect(useProofStore.getState().isProofComplete).toBe(true);
  });

  it("does NOT propagate when one child is still pending", () => {
    addGoal("root", "(Pair A B)", "pending");
    addTactic("tactic-for-root", "split", "root");
    addGoal("child1", "A", "completed");
    addGoal("child2", "B", "pending"); // not yet done

    addEdge("root", "tactic-for-root", "goal-to-tactic");
    addEdge("tactic-for-root", "child1", "tactic-to-goal");
    addEdge("tactic-for-root", "child2", "tactic-to-goal");

    useProofStore.getState().checkProofComplete();

    const root = useProofStore.getState().nodes.find((n) => n.id === "root");
    expect((root?.data as GoalNodeData).status).toBe("pending");
    expect(useProofStore.getState().isProofComplete).toBe(false);
  });

  it("todo goals count as done for completion", () => {
    addGoal("root", "(Pair A B)", "pending");
    addTactic("tactic-for-root", "split", "root");
    addGoal("child1", "A", "completed");
    addGoal("child2", "B", "todo"); // marked as todo

    addEdge("root", "tactic-for-root", "goal-to-tactic");
    addEdge("tactic-for-root", "child1", "tactic-to-goal");
    addEdge("tactic-for-root", "child2", "tactic-to-goal");

    useProofStore.getState().checkProofComplete();

    const root = useProofStore.getState().nodes.find((n) => n.id === "root");
    expect((root?.data as GoalNodeData).status).toBe("completed");
    expect(useProofStore.getState().isProofComplete).toBe(true);
  });

  it("multi-level propagation: 3-deep tree all completed", () => {
    // root -> split -> child1 -> intro -> grandchild1(completed)
    //                  child2(completed)
    addGoal("root", "Top", "pending");
    addTactic("tactic-for-root", "split", "root");
    addGoal("child1", "Left", "pending");
    addGoal("child2", "Right", "completed");
    addTactic("tactic-for-child1", "intro", "child1");
    addGoal("grandchild1", "Inner", "completed");

    addEdge("root", "tactic-for-root", "goal-to-tactic");
    addEdge("tactic-for-root", "child1", "tactic-to-goal");
    addEdge("tactic-for-root", "child2", "tactic-to-goal");
    addEdge("child1", "tactic-for-child1", "goal-to-tactic");
    addEdge("tactic-for-child1", "grandchild1", "tactic-to-goal");

    useProofStore.getState().checkProofComplete();

    // child1 should be completed (its only child is completed)
    const child1 = useProofStore.getState().nodes.find((n) => n.id === "child1");
    expect((child1?.data as GoalNodeData).status).toBe("completed");

    // root should be completed
    const root = useProofStore.getState().nodes.find((n) => n.id === "root");
    expect((root?.data as GoalNodeData).status).toBe("completed");

    expect(useProofStore.getState().isProofComplete).toBe(true);
  });
});

describe("removeNode (tactic removal in multi-proof)", () => {
  beforeEach(reset);

  it("removing an applied tactic resets parent goal to pending", () => {
    addGoal("root", "(= Nat Nat)", "completed");
    addTactic("tactic-completing-root", "exact", "root");
    addEdge("root", "tactic-completing-root", "goal-to-tactic");

    useProofStore.getState().removeNode("tactic-completing-root");

    const root = useProofStore.getState().nodes.find((n) => n.id === "root");
    expect((root?.data as GoalNodeData).status).toBe("pending");
    expect(useProofStore.getState().isProofComplete).toBe(false);
  });

  it("removing tactic propagates pending status up the tree", () => {
    // root(completed) -> split -> child1(completed) -> exact -> (leaf, completed)
    //                             child2(completed) -> exact
    addGoal("root", "Top", "completed");
    addTactic("tactic-for-root", "split", "root");
    addGoal("child1", "A", "completed");
    addGoal("child2", "B", "completed");
    addTactic("tactic-completing-child1", "exact", "child1");
    addTactic("tactic-completing-child2", "exact", "child2");

    addEdge("root", "tactic-for-root", "goal-to-tactic");
    addEdge("tactic-for-root", "child1", "tactic-to-goal");
    addEdge("tactic-for-root", "child2", "tactic-to-goal");
    addEdge("child1", "tactic-completing-child1", "goal-to-tactic");
    addEdge("child2", "tactic-completing-child2", "goal-to-tactic");

    // Remove child1's tactic
    useProofStore.getState().removeNode("tactic-completing-child1");

    const child1 = useProofStore.getState().nodes.find((n) => n.id === "child1");
    expect((child1?.data as GoalNodeData).status).toBe("pending");

    // Root should also become pending (propagation)
    const root = useProofStore.getState().nodes.find((n) => n.id === "root");
    expect((root?.data as GoalNodeData).status).toBe("pending");
  });
});

describe("deleteTacticCascade", () => {
  beforeEach(reset);

  it("deletes tactic and all descendant nodes", () => {
    addGoal("root", "Top", "pending");
    addTactic("tactic-for-root", "split", "root");
    addGoal("child1", "A", "pending");
    addGoal("child2", "B", "pending");

    addEdge("root", "tactic-for-root", "goal-to-tactic");
    addEdge("tactic-for-root", "child1", "tactic-to-goal");
    addEdge("tactic-for-root", "child2", "tactic-to-goal");

    useProofStore.getState().deleteTacticCascade("tactic-for-root");

    const nodes = useProofStore.getState().nodes;
    expect(nodes.find((n) => n.id === "tactic-for-root")).toBeUndefined();
    expect(nodes.find((n) => n.id === "child1")).toBeUndefined();
    expect(nodes.find((n) => n.id === "child2")).toBeUndefined();
    // Root should still exist
    expect(nodes.find((n) => n.id === "root")).toBeDefined();

    // Root should be pending
    const root = nodes.find((n) => n.id === "root");
    expect((root?.data as GoalNodeData).status).toBe("pending");
  });

  it("saves a snapshot before deletion for undo", () => {
    addGoal("root", "Top", "pending");
    addTactic("tactic-for-root", "split", "root");
    addGoal("child1", "A", "pending");
    addEdge("root", "tactic-for-root", "goal-to-tactic");
    addEdge("tactic-for-root", "child1", "tactic-to-goal");

    // Initial snapshot
    useProofStore.getState().saveSnapshot();
    const initialHistoryLength = useProofStore.getState().history.length;

    useProofStore.getState().deleteTacticCascade("tactic-for-root");

    // Should have one more snapshot
    expect(useProofStore.getState().history.length).toBe(initialHistoryLength + 1);
  });

  it("invalidates proof state after cascade delete", () => {
    addGoal("root", "Top", "completed");
    addTactic("tactic-completing-root", "exact", "root");
    addEdge("root", "tactic-completing-root", "goal-to-tactic");

    // Mark as complete
    useProofStore.setState((state) => {
      state.isProofComplete = true;
      state.isComplete = true;
    });

    useProofStore.getState().deleteTacticCascade("tactic-completing-root");

    expect(useProofStore.getState().isProofComplete).toBe(false);
    expect(useProofStore.getState().isComplete).toBe(false);
  });
});
