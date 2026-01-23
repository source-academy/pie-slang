import { evaluatePie } from "../main";

describe("check-same collections (List, Vec)", () => {
  // List tests
  it("List: nil equals nil", () => {
    const program = `(check-same (List Nat) nil nil)`;
    expect(() => evaluatePie(program)).not.toThrow();
  });

  it("List: simple cons equals same structure", () => {
    const program = `(check-same (List Nat) (:: 0 nil) (:: 0 nil))`;
    expect(() => evaluatePie(program)).not.toThrow();
  });

  it("List: cons with two items equals same structure", () => {
    const program = `(check-same (List Nat) (:: 0 (:: 1 nil)) (:: 0 (:: 1 nil)))`;
    expect(() => evaluatePie(program)).not.toThrow();
  });

  it("List: inequality by element value", () => {
      const program = `(check-same (List Nat) (:: 0 nil) (:: 1 nil))`;
    expect(() => evaluatePie(program)).toThrow();
  });

  it("List: inequality by length", () => {
    const program = `(check-same (List Nat) (:: 0 nil) nil)`;
    expect(() => evaluatePie(program)).toThrow();
  });

  // Vec tests
  it("Vec: empty vectors equal", () => {
    const program = `(check-same (Vec Nat 0) vecnil vecnil)`;
    expect(() => evaluatePie(program)).not.toThrow();
  });

  it("Vec: length-1 vectors with same element equal", () => {
    const program = `(check-same (Vec Nat 1) (vec:: 0 vecnil) (vec:: 0 vecnil))`;
    expect(() => evaluatePie(program)).not.toThrow();
  });

  it("Vec: length-2 vectors with same elements equal", () => {
    const program = `(check-same (Vec Nat 2) (vec:: 0 (vec:: 1 vecnil)) (vec:: 0 (vec:: 1 vecnil)))`;
    expect(() => evaluatePie(program)).not.toThrow();
  });

  it("Vec: inequality by element value", () => {
    const program = `(check-same (Vec Nat 2) (vec:: 0 (vec:: 1 vecnil)) (vec:: 1 (vec:: 1 vecnil)))`;
    expect(() => evaluatePie(program)).toThrow();
  });

  it("Vec: inequality by length", () => {
    const program = `(check-same (Vec Nat 1) (vec:: 0 vecnil) vecnil)`;
    expect(() => evaluatePie(program)).toThrow();
  });
});
