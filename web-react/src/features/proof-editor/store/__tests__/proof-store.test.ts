import { describe, it, expect, beforeEach } from "vitest";
import { useProofStore } from "../proof-store";
import type { ProofTree, AppliedTactic } from "@pie/protocol";

function at(type: string, display: string): AppliedTactic {
  return { tacticType: type as AppliedTactic["tacticType"], params: {}, displayString: display };
}

function goal(id: string, isComplete = false, isCurrent = false) {
  return { id, type: "(-> Nat Nat)", context: [], isComplete, isCurrent };
}

// Helper to build a simple proof tree
function simpleTree(opts?: { complete?: boolean }): ProofTree {
  const complete = opts?.complete ?? false;
  return {
    root: {
      goal: goal("g0", complete),
      children: complete
        ? []
        : [
            { goal: goal("g1", false, true), children: [] },
          ],
      ...(complete
        ? { completedBy: at("exact", "exact zero") }
        : { appliedTactic: at("intro", "intro n") }),
      isSubtreeComplete: complete,
    },
    isComplete: complete,
    currentGoalId: complete ? null : "g1",
  };
}

function branchingTree(): ProofTree {
  return {
    root: {
      goal: goal("g0"),
      children: [
        {
          goal: goal("g1", true),
          children: [],
          completedBy: at("exact", "exact zero"),
          isSubtreeComplete: true,
        },
        {
          goal: goal("g2", false, true),
          children: [],
        },
      ],
      appliedTactic: at("elimNat", "elim-Nat n"),
      isSubtreeComplete: false,
    },
    isComplete: false,
    currentGoalId: "g2",
  };
}

describe("proof-store", () => {
  beforeEach(() => {
    useProofStore.getState().reset();
  });

  describe("syncFromWorker", () => {
    it("produces correct nodes and edges from a simple tree", () => {
      const store = useProofStore.getState();
      store.syncFromWorker(simpleTree(), "session-1", "my-thm");

      const { nodes, edges, sessionId, rootGoalId } = useProofStore.getState();

      expect(sessionId).toBe("session-1");
      expect(rootGoalId).toBe("g0");

      const goalNodes = nodes.filter((n) => n.type === "goal");
      const tacticNodes = nodes.filter((n) => n.type === "tactic");
      expect(goalNodes.length).toBeGreaterThanOrEqual(1);
      // intro creates children, so there should be a tactic node
      expect(tacticNodes.length).toBe(1);
      expect(edges.length).toBeGreaterThan(0);
    });

    it("sets isProofComplete from the proof tree", () => {
      const store = useProofStore.getState();
      store.syncFromWorker(simpleTree({ complete: true }), "s1", "thm");
      expect(useProofStore.getState().isProofComplete).toBe(true);
    });

    it("stores claimName", () => {
      const store = useProofStore.getState();
      store.syncFromWorker(simpleTree(), "s1", "my-claim");
      expect(useProofStore.getState().claimName).toBe("my-claim");
    });
  });

  describe("deleteTacticCascade", () => {
    it("removes tactic and descendant nodes", () => {
      const store = useProofStore.getState();
      store.syncFromWorker(branchingTree(), "s1", "thm");

      const beforeCount = useProofStore.getState().nodes.length;
      const tacticId = "tactic-for-g0";

      store.deleteTacticCascade(tacticId);

      const after = useProofStore.getState();
      // Should have fewer nodes
      expect(after.nodes.length).toBeLessThan(beforeCount);
      // Tactic should be gone
      expect(after.nodes.find((n) => n.id === tacticId)).toBeUndefined();
      // Child goals should be gone
      expect(after.nodes.find((n) => n.id === "g1")).toBeUndefined();
      expect(after.nodes.find((n) => n.id === "g2")).toBeUndefined();
    });

    it("resets parent goal to pending", () => {
      const store = useProofStore.getState();
      store.syncFromWorker(branchingTree(), "s1", "thm");

      store.deleteTacticCascade("tactic-for-g0");

      const parentGoal = useProofStore.getState().nodes.find((n) => n.id === "g0");
      expect(parentGoal).toBeDefined();
      expect(parentGoal!.data.status).toBe("pending");
    });
  });

  describe("undo/redo", () => {
    it("supports undo after deleteTacticCascade", () => {
      const store = useProofStore.getState();
      store.syncFromWorker(branchingTree(), "s1", "thm");
      store.saveSnapshot(); // initial state

      const beforeNodes = useProofStore.getState().nodes.length;
      store.deleteTacticCascade("tactic-for-g0");

      // Undo should restore
      store.undo();
      expect(useProofStore.getState().nodes.length).toBe(beforeNodes);
    });

    it("supports redo after undo", () => {
      const store = useProofStore.getState();
      store.syncFromWorker(branchingTree(), "s1", "thm");
      store.saveSnapshot();

      store.deleteTacticCascade("tactic-for-g0");
      const afterDeleteCount = useProofStore.getState().nodes.length;

      store.undo();
      store.redo();
      // Redo restores the post-deletion state
      expect(useProofStore.getState().nodes.length).toBe(afterDeleteCount);
    });
  });
});
