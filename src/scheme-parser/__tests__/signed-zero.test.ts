import { SchemeReal } from "../core-math";

describe("SchemeReal signed zero", () => {
  test.each([
    [0, SchemeReal.INEXACT_ZERO],
    [-0, SchemeReal.INEXACT_NEG_ZERO],
  ])("build(%s) preserves its singleton and numeric sign", (value, expected) => {
    const result = SchemeReal.build(value);
    expect(result).toBe(expected);
    expect(Object.is(result.coerce(), value)).toBe(true);
  });

  test("negation swaps the zero signs", () => {
    expect(SchemeReal.build(0).negate()).toBe(SchemeReal.INEXACT_NEG_ZERO);
    expect(SchemeReal.build(-0).negate()).toBe(SchemeReal.INEXACT_ZERO);
  });

  test("arithmetic preserves negative zero results", () => {
    expect(SchemeReal.build(-0).add(SchemeReal.build(-0)))
      .toBe(SchemeReal.INEXACT_NEG_ZERO);
    expect(SchemeReal.build(0).multiply(SchemeReal.build(-2)))
      .toBe(SchemeReal.INEXACT_NEG_ZERO);
    expect(SchemeReal.build(-0).multiply(SchemeReal.build(-2)))
      .toBe(SchemeReal.INEXACT_ZERO);
  });

  test.each([0, -0])("reciprocal of %s still rejects division by zero", value => {
    expect(() => SchemeReal.build(value).multiplicativeInverse())
      .toThrow("Division by zero");
  });

  test("equality and string output keep their existing zero semantics", () => {
    expect(SchemeReal.build(0).equals(SchemeReal.build(-0))).toBe(true);
    expect(SchemeReal.build(-0).toString()).toBe("0");
  });

  test.each([
    [Infinity, SchemeReal.INFINITY],
    [-Infinity, SchemeReal.NEG_INFINITY],
    [NaN, SchemeReal.NAN],
  ])("special value %s keeps its singleton", (value, expected) => {
    expect(SchemeReal.build(value)).toBe(expected);
  });

  test.each([1.5, -2.5])("ordinary real %s is unchanged", value => {
    expect(SchemeReal.build(value).coerce()).toBe(value);
  });
});
