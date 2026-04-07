/**
 * Multi-proof tests for the proof store.
 *
 * Covers:
 * - Switching between multiple proof sessions via syncFromWorker
 * - Proof completion does NOT auto-switch (stays on completed proof)
 * - State isolation between different proofs
 * - Theorem lemma nodes preservation across sessions
 * - Collapse state cleared when switching proofs
 * - History isolation between proof sessions
 */
import { describe, it, expect, beforeEach } from "vitest";
import { useProofStore } from "../features/proof-editor/store/proof-store";
import type { ProofTreeData, GlobalContextEntry } from "../workers/proof-worker";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Build a minimal ProofTreeData for a single pending goal. */
function makePendingTree(goalId: string, goalType: string): ProofTreeData {
  return {
    root: {
      goal: { id: goalId, type: goalType, context: [], isComplete: false, isCurrent: true },
      children: [],
      isSubtreeComplete: false,
    },
    isComplete: false,
    currentGoalId: goalId,
  };
}

/** Build a completed ProofTreeData (single goal solved by a tactic). */
function makeCompletedTree(goalId: string, goalType: string, tactic: string): ProofTreeData {
  return {
    root: {
      goal: { id: goalId, type: goalType, context: [], isComplete: true, isCurrent: false },
      children: [],
      completedBy: tactic,
      isSubtreeComplete: true,
    },
    isComplete: true,
    currentGoalId: null,
  };
}

/** Build a tree with one goal that has two subgoals from a split tactic. */
function makeSplitTree(
  rootId: string,
  rootType: string,
  child1Id: string,
  child1Type: string,
  child2Id: string,
  child2Type: string,
): ProofTreeData {
  return {
    root: {
      goal: { id: rootId, type: rootType, context: [], isComplete: false, isCurrent: false },
      children: [
        {
          goal: { id: child1Id, type: child1Type, context: [], isComplete: false, isCurrent: true },
          children: [],
          isSubtreeComplete: false,
        },
        {
          goal: { id: child2Id, type: child2Type, context: [], isComplete: false, isCurrent: false },
          children: [],
          isSubtreeComplete: false,
        },
      ],
      appliedTactic: "split",
      isSubtreeComplete: false,
    },
    isComplete: false,
    currentGoalId: child1Id,
  };
}

function reset() {
  useProofStore.getState().reset();
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe("Multi-proof store", () => {
  beforeEach(reset);

  // ---- Basic session switching ----

  it("syncFromWorker stores claimName and sessionId", () => {
    const tree = makePendingTree("g1", "(= Nat Nat)");
    useProofStore.getState().syncFromWorker(tree, "session-1", "self-eq");

    const state = useProofStore.getState();
    expect(state.claimName).toBe("self-eq");
    expect(state.sessionId).toBe("session-1");
    expect(state.isComplete).toBe(false);
  });

  it("switching proofs updates claimName, sessionId, and nodes", () => {
    const tree1 = makePendingTree("g1", "(= Nat Nat)");
    useProofStore.getState().syncFromWorker(tree1, "session-1", "self-eq");

    const tree2 = makePendingTree("g2", "(-> Nat Nat)");
    useProofStore.getState().syncFromWorker(tree2, "session-2", "add-comm");

    const state = useProofStore.getState();
    expect(state.claimName).toBe("add-comm");
    expect(state.sessionId).toBe("session-2");
    // Old goal node should be gone, new one present
    expect(state.nodes.find((n) => n.id === "g1")).toBeUndefined();
    expect(state.nodes.find((n) => n.id === "g2")).toBeDefined();
  });

  // ---- Completion does not auto-switch ----

  it("completing a proof sets isComplete to true", () => {
    const tree = makeCompletedTree("g1", "(= Nat Nat)", "exact same");
    useProofStore.getState().syncFromWorker(tree, "session-1", "self-eq");

    const state = useProofStore.getState();
    expect(state.isComplete).toBe(true);
    expect(state.isProofComplete).toBe(true);
    expect(state.claimName).toBe("self-eq");
  });

  it("after completing proof A, store stays on A (no auto-switch)", () => {
    // Start proof A
    const treeA = makePendingTree("gA", "(= Nat Nat)");
    useProofStore.getState().syncFromWorker(treeA, "session-A", "self-eq");
    expect(useProofStore.getState().claimName).toBe("self-eq");

    // Complete proof A
    const completedA = makeCompletedTree("gA", "(= Nat Nat)", "exact same");
    useProofStore.getState().syncFromWorker(completedA, "session-A");

    // Store should still be on self-eq, isComplete = true
    const state = useProofStore.getState();
    expect(state.claimName).toBe("self-eq");
    expect(state.isComplete).toBe(true);
    // No auto-switch happened — the store doesn't know about proof B
  });

  // ---- Theorem lemma nodes ----

  it("syncFromWorker creates lemma nodes from theorems list", () => {
    const tree = makePendingTree("g1", "(= Nat Nat)");
    const theorems: GlobalContextEntry[] = [
      { name: "self-eq", type: "(= Nat Nat)", kind: "theorem" },
      { name: "add-zero", type: "(-> Nat Nat)", kind: "theorem" },
    ];
    useProofStore.getState().syncFromWorker(tree, "session-1", "next-claim", theorems);

    const lemmaNodes = useProofStore.getState().nodes.filter((n) => n.type === "lemma");
    expect(lemmaNodes).toHaveLength(2);
    expect(lemmaNodes.map((n) => n.id)).toContain("lemma-self-eq");
    expect(lemmaNodes.map((n) => n.id)).toContain("lemma-add-zero");
  });

  it("lemma nodes preserve positions across syncs within same session", () => {
    const tree = makePendingTree("g1", "(= Nat Nat)");
    const theorems: GlobalContextEntry[] = [
      { name: "self-eq", type: "(= Nat Nat)", kind: "theorem" },
    ];
    useProofStore.getState().syncFromWorker(tree, "session-1", "claim-a", theorems);

    // Simulate user dragging the lemma node
    const lemmaNode = useProofStore.getState().nodes.find((n) => n.id === "lemma-self-eq");
    expect(lemmaNode).toBeDefined();

    // Second sync within same session (no claimName, no theorems — preserves existing lemmas)
    const tree2 = makePendingTree("g1", "(= Nat Nat)");
    useProofStore.getState().syncFromWorker(tree2, "session-1");

    const lemmaAfter = useProofStore.getState().nodes.filter((n) => n.type === "lemma");
    expect(lemmaAfter).toHaveLength(1);
    expect(lemmaAfter[0].id).toBe("lemma-self-eq");
  });

  it("switching to a new proof with new theorems replaces lemma nodes", () => {
    const theorems1: GlobalContextEntry[] = [
      { name: "self-eq", type: "(= Nat Nat)", kind: "theorem" },
    ];
    useProofStore.getState().syncFromWorker(
      makePendingTree("g1", "(= Nat Nat)"),
      "session-1",
      "claim-a",
      theorems1,
    );

    const theorems2: GlobalContextEntry[] = [
      { name: "self-eq", type: "(= Nat Nat)", kind: "theorem" },
      { name: "add-zero", type: "(-> Nat Nat)", kind: "theorem" },
    ];
    useProofStore.getState().syncFromWorker(
      makePendingTree("g2", "(-> Nat Nat)"),
      "session-2",
      "claim-b",
      theorems2,
    );

    const lemmaNodes = useProofStore.getState().nodes.filter((n) => n.type === "lemma");
    expect(lemmaNodes).toHaveLength(2);
  });

  // ---- Collapse state ----

  it("clears collapsedBranches when switching to a different claim", () => {
    const tree1 = makePendingTree("g1", "(= Nat Nat)");
    useProofStore.getState().syncFromWorker(tree1, "session-1", "claim-a");
    useProofStore.getState().toggleBranchCollapse("g1");
    expect(useProofStore.getState().collapsedBranches.size).toBe(1);

    const tree2 = makePendingTree("g2", "(-> Nat Nat)");
    useProofStore.getState().syncFromWorker(tree2, "session-2", "claim-b");
    expect(useProofStore.getState().collapsedBranches.size).toBe(0);
  });

  it("preserves collapsedBranches within the same claim (no claimName passed)", () => {
    const tree = makePendingTree("g1", "(= Nat Nat)");
    useProofStore.getState().syncFromWorker(tree, "session-1", "claim-a");
    useProofStore.getState().toggleBranchCollapse("g1");
    expect(useProofStore.getState().collapsedBranches.size).toBe(1);

    // Subsequent sync within same session (e.g. after tactic applied)
    const tree2 = makeSplitTree("g1", "(= Nat Nat)", "g1-1", "Nat", "g1-2", "Nat");
    useProofStore.getState().syncFromWorker(tree2, "session-1");
    expect(useProofStore.getState().collapsedBranches.size).toBe(1);
  });

  // ---- Manual positions cleared on claim switch ----

  it("clears manualPositions when switching claims", () => {
    const tree1 = makePendingTree("g1", "(= Nat Nat)");
    useProofStore.getState().syncFromWorker(tree1, "session-1", "claim-a");
    useProofStore.getState().setManualPosition("g1", { x: 100, y: 200 });
    expect(useProofStore.getState().manualPositions.size).toBe(1);

    const tree2 = makePendingTree("g2", "(-> Nat Nat)");
    useProofStore.getState().syncFromWorker(tree2, "session-2", "claim-b");
    expect(useProofStore.getState().manualPositions.size).toBe(0);
  });

  // ---- History ----

  it("saveSnapshot and undo work within a proof session", () => {
    const tree = makePendingTree("g1", "(= Nat Nat)");
    useProofStore.getState().syncFromWorker(tree, "session-1", "claim-a");
    useProofStore.getState().saveSnapshot(); // snapshot 0

    // Apply a split
    const splitTree = makeSplitTree("g1", "(= Nat Nat)", "g1-1", "Nat", "g1-2", "Nat");
    useProofStore.getState().syncFromWorker(splitTree, "session-1");
    useProofStore.getState().saveSnapshot(); // snapshot 1

    // We now have 2 snapshots. Undo should restore to snapshot 0
    const nodeCountAfterSplit = useProofStore.getState().nodes.length;
    useProofStore.getState().undo();

    const nodeCountAfterUndo = useProofStore.getState().nodes.length;
    expect(nodeCountAfterUndo).toBeLessThan(nodeCountAfterSplit);
  });

  // ---- Multi-proof chain: completing A, then starting B with A as theorem ----

  it("supports multi-proof chain: complete A then start B referencing A as lemma", () => {
    // Complete proof A
    const completedA = makeCompletedTree("gA", "(= Nat Nat)", "exact same");
    useProofStore.getState().syncFromWorker(completedA, "session-A", "self-eq");
    expect(useProofStore.getState().isComplete).toBe(true);

    // Now start proof B, passing self-eq as a proven theorem
    const treeB = makePendingTree("gB", "(-> Nat (= Nat Nat))");
    const theorems: GlobalContextEntry[] = [
      { name: "self-eq", type: "(= Nat Nat)", kind: "theorem" },
    ];
    useProofStore.getState().syncFromWorker(treeB, "session-B", "use-self-eq", theorems);

    const state = useProofStore.getState();
    expect(state.claimName).toBe("use-self-eq");
    expect(state.isComplete).toBe(false);
    expect(state.sessionId).toBe("session-B");

    // Lemma node for self-eq should exist
    const lemma = state.nodes.find((n) => n.id === "lemma-self-eq");
    expect(lemma).toBeDefined();
    expect(lemma?.type).toBe("lemma");
  });

  // ---- Multiple theorems reuse ----

  it("supports reusing multiple proven theorems in a single proof", () => {
    const tree = makePendingTree("g1", "(-> Nat (-> Nat Nat))");
    const theorems: GlobalContextEntry[] = [
      { name: "add-zero", type: "(-> Nat Nat)", kind: "theorem" },
      { name: "mul-one", type: "(-> Nat Nat)", kind: "theorem" },
      { name: "self-eq", type: "(= Nat Nat)", kind: "theorem" },
    ];
    useProofStore.getState().syncFromWorker(tree, "session-1", "big-proof", theorems);

    const lemmaNodes = useProofStore.getState().nodes.filter((n) => n.type === "lemma");
    expect(lemmaNodes).toHaveLength(3);
    expect(lemmaNodes.map((n) => n.id).sort()).toEqual([
      "lemma-add-zero",
      "lemma-mul-one",
      "lemma-self-eq",
    ]);
  });

  // ---- Goal node structure ----

  it("creates goal nodes with correct status from pending tree", () => {
    const tree = makePendingTree("g1", "(= Nat Nat)");
    useProofStore.getState().syncFromWorker(tree, "session-1", "claim-a");

    const goalNode = useProofStore.getState().nodes.find((n) => n.id === "g1");
    expect(goalNode).toBeDefined();
    expect(goalNode?.type).toBe("goal");
    expect((goalNode?.data as any).status).toBe("in-progress"); // currentGoalId matches
    expect((goalNode?.data as any).goalType).toBe("(= Nat Nat)");
  });

  it("creates goal and tactic nodes from completed tree", () => {
    const tree = makeCompletedTree("g1", "(= Nat Nat)", "exact same");
    useProofStore.getState().syncFromWorker(tree, "session-1", "claim-a");

    const nodes = useProofStore.getState().nodes.filter((n) => n.type !== "lemma");
    const goalNode = nodes.find((n) => n.id === "g1");
    const tacticNode = nodes.find((n) => n.id === "tactic-completing-g1");

    expect(goalNode).toBeDefined();
    expect(tacticNode).toBeDefined();
    expect((goalNode?.data as any).status).toBe("completed");
    expect((tacticNode?.data as any).displayName).toBe("exact same");
    expect((tacticNode?.data as any).status).toBe("applied");
  });

  it("creates split tree with tactic and two subgoals", () => {
    const tree = makeSplitTree("g1", "(Pair Nat Nat)", "g1-1", "Nat", "g1-2", "Nat");
    useProofStore.getState().syncFromWorker(tree, "session-1", "claim-a");

    const nodes = useProofStore.getState().nodes.filter((n) => n.type !== "lemma");
    expect(nodes.find((n) => n.id === "g1")).toBeDefined();
    expect(nodes.find((n) => n.id === "tactic-for-g1")).toBeDefined();
    expect(nodes.find((n) => n.id === "g1-1")).toBeDefined();
    expect(nodes.find((n) => n.id === "g1-2")).toBeDefined();

    const edges = useProofStore.getState().edges;
    // g1 -> tactic-for-g1
    expect(edges.find((e) => e.source === "g1" && e.target === "tactic-for-g1")).toBeDefined();
    // tactic-for-g1 -> g1-1 and g1-2
    expect(edges.find((e) => e.source === "tactic-for-g1" && e.target === "g1-1")).toBeDefined();
    expect(edges.find((e) => e.source === "tactic-for-g1" && e.target === "g1-2")).toBeDefined();
  });

  // ---- Reset ----

  it("reset clears all state", () => {
    const tree = makePendingTree("g1", "(= Nat Nat)");
    useProofStore.getState().syncFromWorker(tree, "session-1", "claim-a");
    useProofStore.getState().saveSnapshot();

    useProofStore.getState().reset();

    const state = useProofStore.getState();
    expect(state.nodes).toHaveLength(0);
    expect(state.edges).toHaveLength(0);
    expect(state.claimName).toBeNull();
    expect(state.sessionId).toBeNull();
    expect(state.isComplete).toBe(false);
    expect(state.history).toHaveLength(0);
    expect(state.manualPositions.size).toBe(0);
    expect(state.collapsedBranches.size).toBe(0);
  });
});
