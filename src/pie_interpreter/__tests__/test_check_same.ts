import { evaluatePie } from "../main";

/**
 * Tests focused solely on the `(check-same ...)` form.
 */

describe("check-same", () => {
  it("succeeds when left and right are the same (Atom 'a 'a)", () => {
    const program = `(check-same Atom 'a 'a)`;
    expect(() => evaluatePie(program)).not.toThrow();
    const out = evaluatePie(program);
    // check-same doesn't modify the context or produce output
    expect(out).toBe("");
  });

  it("throws when left and right differ (Atom 'a 'b)", () => {
    const program = `(check-same Atom 'a 'b)`;
    expect(() => evaluatePie(program)).toThrow();
  });

  it("succeeds for Nat equality (0 0)", () => {
    const program = `(check-same Nat 0 0)`;
    expect(() => evaluatePie(program)).not.toThrow();
  });

  it("fails for Nat inequality (0 1)", () => {
    const program = `(check-same Nat 0 1)`;
    expect(() => evaluatePie(program)).toThrow();
  });

  it("normalizes Nat before comparing ((add1 0) 1)", () => {
    const program = `(check-same Nat (add1 0) 1)`;
    expect(() => evaluatePie(program)).not.toThrow();
  });

  it("fails when terms don't have the claimed type (Atom 'a 0)", () => {
    const program = `(check-same Atom 'a 0)`;
    expect(() => evaluatePie(program)).toThrow();
  });

  
});
