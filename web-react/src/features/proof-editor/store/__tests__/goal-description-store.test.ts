import { beforeEach, describe, expect, it } from "vitest";
import { useGoalDescriptionStore } from "../goal-description-store";

describe("goal-description-store", () => {
  beforeEach(() => {
    useGoalDescriptionStore.getState().clearAll();
  });

  it("stores the description signature with generated text", () => {
    const store = useGoalDescriptionStore.getState();

    store.setDescription("g0", "claim-a:goal-a", "First description");

    expect(useGoalDescriptionStore.getState().getEntry("g0")).toEqual({
      signature: "claim-a:goal-a",
      text: "First description",
      isLoading: false,
      error: null,
    });
  });

  it("replaces stale entries for the same node id with the latest signature", () => {
    const store = useGoalDescriptionStore.getState();

    store.setDescription("g0", "claim-a:goal-a", "First description");
    store.setLoading("g0", "claim-b:goal-b");

    expect(useGoalDescriptionStore.getState().getEntry("g0")).toEqual({
      signature: "claim-b:goal-b",
      text: null,
      isLoading: true,
      error: null,
    });
  });
});
