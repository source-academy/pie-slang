/**
 * Tests for ProofPicker component in multi-proof scenarios.
 *
 * Covers:
 * - Renders "No proofs found" when both lists are empty
 * - Renders pending claims in their own optgroup
 * - Renders completed theorems in their own optgroup
 * - Mixed claims and theorems displayed in separate groups
 * - Selecting a proof fires onSelect callback
 * - Selected value is reflected in the dropdown
 */
import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { ProofPicker } from "../features/proof-editor/components/ProofPicker";
import type { GlobalContextEntry } from "../workers/proof-worker";

// --------------------------------------------------------------------------
// Fixtures
// --------------------------------------------------------------------------

const CLAIMS: GlobalContextEntry[] = [
  { name: "self-eq", type: "(= Nat Nat)", kind: "claim" },
  { name: "add-comm", type: "(-> Nat (-> Nat (= Nat Nat)))", kind: "claim" },
];

const THEOREMS: GlobalContextEntry[] = [
  { name: "add-zero", type: "(-> Nat (= Nat Nat))", kind: "theorem" },
];

// --------------------------------------------------------------------------
// Tests
// --------------------------------------------------------------------------

describe("ProofPicker", () => {
  it("shows empty message when no claims or theorems", () => {
    render(
      <ProofPicker claims={[]} theorems={[]} selectedClaim={null} onSelect={() => {}} />,
    );
    expect(screen.getByText("No proofs found")).toBeDefined();
  });

  it("renders pending claims optgroup", () => {
    render(
      <ProofPicker claims={CLAIMS} theorems={[]} selectedClaim={null} onSelect={() => {}} />,
    );

    const select = screen.getByRole("combobox");
    expect(select).toBeDefined();

    // Check optgroup label
    const optgroups = select.querySelectorAll("optgroup");
    expect(optgroups).toHaveLength(1);
    expect(optgroups[0].label).toBe("Pending Proofs (2)");

    // Check options
    const options = select.querySelectorAll("option:not([disabled])");
    expect(options).toHaveLength(2);
  });

  it("renders completed theorems optgroup", () => {
    render(
      <ProofPicker claims={[]} theorems={THEOREMS} selectedClaim={null} onSelect={() => {}} />,
    );

    const select = screen.getByRole("combobox");
    const optgroups = select.querySelectorAll("optgroup");
    expect(optgroups).toHaveLength(1);
    expect(optgroups[0].label).toBe("Completed Theorems (1)");
  });

  it("renders both optgroups when both claims and theorems exist", () => {
    render(
      <ProofPicker
        claims={CLAIMS}
        theorems={THEOREMS}
        selectedClaim={null}
        onSelect={() => {}}
      />,
    );

    const select = screen.getByRole("combobox");
    const optgroups = select.querySelectorAll("optgroup");
    expect(optgroups).toHaveLength(2);
    expect(optgroups[0].label).toContain("Pending Proofs");
    expect(optgroups[1].label).toContain("Completed Theorems");
  });

  it("fires onSelect when user changes selection", () => {
    const onSelect = vi.fn();
    render(
      <ProofPicker claims={CLAIMS} theorems={[]} selectedClaim={null} onSelect={onSelect} />,
    );

    const select = screen.getByRole("combobox");
    fireEvent.change(select, { target: { value: "add-comm" } });

    expect(onSelect).toHaveBeenCalledWith("add-comm");
  });

  it("reflects selectedClaim in dropdown value", () => {
    render(
      <ProofPicker
        claims={CLAIMS}
        theorems={THEOREMS}
        selectedClaim="self-eq"
        onSelect={() => {}}
      />,
    );

    const select = screen.getByRole("combobox") as HTMLSelectElement;
    expect(select.value).toBe("self-eq");
  });

  it("allows selecting a completed theorem", () => {
    const onSelect = vi.fn();
    render(
      <ProofPicker
        claims={CLAIMS}
        theorems={THEOREMS}
        selectedClaim={null}
        onSelect={onSelect}
      />,
    );

    const select = screen.getByRole("combobox");
    fireEvent.change(select, { target: { value: "add-zero" } });

    expect(onSelect).toHaveBeenCalledWith("add-zero");
  });

  it("shows correct prefixes: circle for claims, check for theorems", () => {
    render(
      <ProofPicker
        claims={[CLAIMS[0]]}
        theorems={[THEOREMS[0]]}
        selectedClaim={null}
        onSelect={() => {}}
      />,
    );

    const options = screen.getByRole("combobox").querySelectorAll("option:not([disabled])");
    const texts = Array.from(options).map((o) => o.textContent);

    // Claims get ○ prefix, theorems get ✓ prefix
    expect(texts.some((t) => t?.includes("○"))).toBe(true);
    expect(texts.some((t) => t?.includes("✓"))).toBe(true);
  });

  it("handles rapid switching between proofs", () => {
    const onSelect = vi.fn();
    const { rerender } = render(
      <ProofPicker
        claims={CLAIMS}
        theorems={THEOREMS}
        selectedClaim="self-eq"
        onSelect={onSelect}
      />,
    );

    // Switch to add-comm
    const select = screen.getByRole("combobox");
    fireEvent.change(select, { target: { value: "add-comm" } });
    expect(onSelect).toHaveBeenCalledWith("add-comm");

    // Rerender with updated selection
    rerender(
      <ProofPicker
        claims={CLAIMS}
        theorems={THEOREMS}
        selectedClaim="add-comm"
        onSelect={onSelect}
      />,
    );
    expect((select as HTMLSelectElement).value).toBe("add-comm");

    // Switch to theorem
    fireEvent.change(select, { target: { value: "add-zero" } });
    expect(onSelect).toHaveBeenCalledWith("add-zero");
  });

  it("updates optgroup counts when claims list changes", () => {
    const { rerender } = render(
      <ProofPicker claims={CLAIMS} theorems={[]} selectedClaim={null} onSelect={() => {}} />,
    );

    let optgroup = screen.getByRole("combobox").querySelector("optgroup");
    expect(optgroup?.label).toBe("Pending Proofs (2)");

    // One claim was proved -> now 1 claim, 1 theorem
    const updatedClaims = [CLAIMS[1]]; // only add-comm remains
    const newTheorems = [{ name: "self-eq", type: "(= Nat Nat)", kind: "theorem" as const }];

    rerender(
      <ProofPicker claims={updatedClaims} theorems={newTheorems} selectedClaim={null} onSelect={() => {}} />,
    );

    const optgroups = screen.getByRole("combobox").querySelectorAll("optgroup");
    expect(optgroups).toHaveLength(2);
    expect(optgroups[0].label).toBe("Pending Proofs (1)");
    expect(optgroups[1].label).toBe("Completed Theorems (1)");
  });
});
