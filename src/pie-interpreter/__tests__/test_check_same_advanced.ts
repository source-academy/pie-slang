import { evaluatePie } from "../main";

describe("check-same advanced (higher-order with Absurd and =)", () => {
  it("Distinct selector functions can be definitionally equal (empty domain)", () => {
    const T = `
(→ (→ (= Nat 2 3) Absurd)
   (→ (= Nat 2 3) Absurd)
   (→ (= Nat 2 3) Absurd))`;

    const f = `(λ (f g) f)`;
    const g = `(λ (f g) g)`;

    const program = `(check-same ${T} ${f} ${g})`;
    // In this type, (= Nat 2 3) is empty, so functions from it are equal extensionally.
    expect(() => evaluatePie(program)).not.toThrow();
  });

  it("Alpha-equivalent functions are equal", () => {
    // Same body but different binder names should be equal under alpha-equivalence
    const T = `
(→ (→ (= Nat 2 3) Absurd)
   (→ (= Nat 2 3) Absurd)
   (→ (= Nat 2 3) Absurd))`;

    const f1 = `(λ (f g) f)`;
    const f2 = `(λ (x y) x)`;

    const program = `(check-same ${T} ${f1} ${f2})`;
    expect(() => evaluatePie(program)).not.toThrow();
  });
});
