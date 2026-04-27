import { describe, expect, it } from "vitest";
import { buildGoalOverviewPrompt } from "./describeGoalBrowser";

describe("buildGoalOverviewPrompt", () => {
  it("includes the selected goal type and local context", () => {
    const prompt = buildGoalOverviewPrompt({
      pieCode: "(claim plus-zero (Pi ((n Nat)) (= Nat n n)))",
      claimName: "plus-zero",
      goalType: "(= Nat (plus k 0) k)",
      context: [
        { name: "k", type: "Nat" },
        { name: "ih", type: "(= Nat (plus k 0) k)" },
      ],
    });

    expect(prompt).toContain("Claim being proved:** `plus-zero`");
    expect(prompt).toContain("Selected proof goal type");
    expect(prompt).toContain("(= Nat (plus k 0) k)");
    expect(prompt).toContain("- k : Nat");
    expect(prompt).toContain("- ih : (= Nat (plus k 0) k)");
    expect(prompt).toContain("Focuses on the selected proof goal type");
  });

  it("marks an empty local context explicitly", () => {
    const prompt = buildGoalOverviewPrompt({
      pieCode: "(claim id (Pi ((A U)) (-> A A)))",
      claimName: "id",
      goalType: "(Pi ((A U)) (-> A A))",
      context: [],
    });

    expect(prompt).toContain("No local context bindings.");
  });
});
