import { describe, it, expect } from "vitest";
import { generateProofScript, generateFlatTacticList } from "../generate-proof-script";
import type { ProofTree, AppliedTactic } from "@pie/protocol";

function at(type: string, display: string): AppliedTactic {
  return { tacticType: type as AppliedTactic["tacticType"], params: {}, displayString: display };
}

function goal(id: string, isComplete = false) {
  return { id, type: "(-> Nat Nat)", context: [], isComplete, isCurrent: false };
}

describe("generateProofScript", () => {
  it("generates script for a single leaf proof", () => {
    const tree: ProofTree = {
      root: {
        goal: goal("g0", true),
        children: [],
        completedBy: at("exact", "exact zero"),
      },
      isComplete: true,
      currentGoalId: null,
    };

    const script = generateProofScript(tree, "my-thm");
    expect(script).toContain("(define-tactically my-thm");
    expect(script).toContain("(exact zero)");
  });

  it("generates linear proof (sequential tactics)", () => {
    const tree: ProofTree = {
      root: {
        goal: goal("g0"),
        children: [
          {
            goal: goal("g1", true),
            children: [],
            completedBy: at("exact", "exact n"),
          },
        ],
        appliedTactic: at("intro", "intro n"),
      },
      isComplete: true,
      currentGoalId: null,
    };

    const script = generateProofScript(tree, "my-thm");
    expect(script).toContain("(intro n)");
    expect(script).toContain("(exact n)");
  });

  it("generates branching proof with then blocks", () => {
    const tree: ProofTree = {
      root: {
        goal: goal("g0"),
        children: [
          {
            goal: goal("g1", true),
            children: [],
            completedBy: at("exact", "exact zero"),
          },
          {
            goal: goal("g2", true),
            children: [],
            completedBy: at("exact", "exact (add1 n-1)"),
          },
        ],
        appliedTactic: at("elimNat", "elim-Nat n"),
      },
      isComplete: true,
      currentGoalId: null,
    };

    const script = generateProofScript(tree, "ind-thm");
    expect(script).toContain("(elim-Nat n)");
    expect(script).toContain("(then");
    expect(script).toContain("(exact zero)");
    expect(script).toContain("(exact (add1 n-1))");
  });

  it("adds placeholder comment for incomplete branches", () => {
    const tree: ProofTree = {
      root: {
        goal: goal("g0"),
        children: [
          { goal: goal("g1"), children: [] },
          { goal: goal("g2"), children: [] },
        ],
        appliedTactic: at("elimNat", "elim-Nat n"),
      },
      isComplete: false,
      currentGoalId: "g1",
    };

    const script = generateProofScript(tree, "wip-thm");
    expect(script).toContain("; TODO: complete this branch");
  });
});

describe("generateFlatTacticList", () => {
  it("collects tactics in depth-first order", () => {
    const tree: ProofTree = {
      root: {
        goal: goal("g0"),
        children: [
          {
            goal: goal("g1"),
            children: [
              {
                goal: goal("g3", true),
                children: [],
                completedBy: at("exact", "exact zero"),
              },
            ],
            appliedTactic: at("intro", "intro n"),
          },
          {
            goal: goal("g2", true),
            children: [],
            completedBy: at("exact", "exact (add1 k)"),
          },
        ],
        appliedTactic: at("elimNat", "elim-Nat n"),
      },
      isComplete: true,
      currentGoalId: null,
    };

    const tactics = generateFlatTacticList(tree);
    expect(tactics).toEqual([
      "elim-Nat n",
      "intro n",
      "exact zero",
      "exact (add1 k)",
    ]);
  });
});
