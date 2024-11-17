import * as math from "../core-math";

function batchNumberTypeTest(
  numberType: string,
  fn: (a: string) => math.Match,
  expected_output_tests: { test: string; expected: boolean }[]
) {
  for (const numTest of expected_output_tests) {
    test(`"${numTest.test}" ${numTest.expected ? "correctly parses" : "does not parse"} as ${numberType}`, () => {
      const match = fn(numTest.test);
      expect(match.result).toBe(numTest.expected);
    });
  }
}

batchNumberTypeTest("integer", math.isInteger, [
  { test: "123", expected: true },
  { test: "-123", expected: true },
  { test: "+123", expected: true },
  { test: "+", expected: false },
  { test: "-", expected: false },
  { test: "", expected: false },
  { test: "0", expected: true },
  { test: "123.0", expected: false },
  { test: "123.1", expected: false },
  { test: "123.123", expected: false },
  { test: "123.123.123", expected: false },
  { test: "123.", expected: false },
  { test: ".", expected: false },
]);

batchNumberTypeTest("rational", math.isRational, [
  { test: "123/234", expected: true },
  { test: "-123/234", expected: true },
  { test: "+123/234", expected: true },
  { test: "2/+123", expected: true },
  { test: "2/-123", expected: true },
  { test: "2/0", expected: true },
  { test: "+2/+0", expected: true },
  { test: "-2/+0", expected: true },
  { test: "-2/-0", expected: true },
  { test: "+2/-0", expected: true },
  { test: "-", expected: false },
  { test: "+", expected: false },
  { test: "", expected: false },
  { test: "0", expected: false },
  { test: "123/", expected: false },
  { test: "/123", expected: false },
]);

batchNumberTypeTest("real", math.isReal, [
  { test: "123", expected: true },
  { test: "-123", expected: true },
  { test: "+123", expected: true },
  { test: "+", expected: false },
  { test: "-", expected: false },
  { test: "", expected: false },
  { test: "0.", expected: true },
  { test: "123.1", expected: true },
  { test: "123.123", expected: true },
  { test: "inf.0", expected: false },
  { test: "-inf.0", expected: true },
  { test: "+inf.0", expected: true },
  { test: "inf", expected: false },
  { test: ".inf", expected: false },
  { test: "-inf", expected: false },
  { test: "+inf", expected: false },
  { test: "nan", expected: false },
  { test: "-nan", expected: false },
  { test: "+nan", expected: false },
  { test: "nan.0", expected: false },
  { test: "-nan.0", expected: true },
  { test: "+nan.0", expected: true },
  { test: "notanumber.0", expected: false },
  { test: "0.notanumber", expected: false },
  { test: "nan.123", expected: false },
  { test: "inf.456", expected: false },
  { test: "123.123.123", expected: false },
  { test: ".", expected: false },
  { test: ".45", expected: true },
  { test: "+.45", expected: true },
  { test: "-.45", expected: true },
  { test: "-123.45", expected: true },
  { test: "+123.45", expected: true },
  { test: "123.+4567", expected: false },
  { test: "1e1", expected: true },
  { test: "1e-1", expected: true },
  { test: "1e+1", expected: true },
  { test: "1e", expected: false },
  { test: "e1", expected: false },
  { test: "e", expected: false },
  { test: "1e1.1", expected: true },
  { test: "1e1/2", expected: true },
  { test: "1e1e1", expected: true },
  { test: "1e1e1e1", expected: true },
  { test: "1e1e1e1e1", expected: true },
]);

batchNumberTypeTest("complex", math.isComplex, [
  { test: "i", expected: false },
  { test: "123i", expected: true },
  { test: "-123i", expected: true },
  { test: "+123i", expected: true },
  { test: "+", expected: false },
  { test: "-", expected: false },
  { test: "", expected: false },
  { test: "0i", expected: true },
  { test: "123.1i", expected: true },
  { test: "1/2i", expected: true },
  { test: "1e1i", expected: true },
  { test: "1.1i", expected: true },
  { test: "123+123i", expected: true },
  { test: "123-123i", expected: true },
  { test: "+123+123i", expected: true },
  { test: "+123-123i", expected: true },
  { test: "-1/2+1/2i", expected: true },
  { test: "1.1+1.1i", expected: true },
  { test: "1e1+1e1i", expected: true },
  { test: "1/2+1.2i", expected: true },
  { test: "1/2+1e2i", expected: true },
  { test: "1/2+12i", expected: true },
  { test: "1e2+1/2i", expected: true },
  { test: "1e2+1.2i", expected: true },
  { test: "1e2+12i", expected: true },
  { test: "12+1/2i", expected: true },
  { test: "12+1.2i", expected: true },
  { test: "12+1e2i", expected: true },
  { test: "+inf.0i", expected: true },
  { test: "inf.0i", expected: false },
  { test: "1+inf.0i", expected: true },
  { test: "1-inf.0i", expected: true },
  { test: "12", expected: false },
]);

// make_number tests
test("make_number should parse integers", () => {
  const match = math.make_number("123");
  expect(math.atomic_equals(match, math.SchemeInteger.build(123n))).toBe(true);
});

test("make_number should parse rationals", () => {
  const match = math.make_number("123/234");
  expect(math.atomic_equals(match, math.SchemeRational.build(123n, 234n))).toBe(
    true
  );
});

test("make_number should parse reals", () => {
  const match = math.make_number("123.123");
  expect(math.atomic_equals(match, math.SchemeReal.build(123.123))).toBe(true);
});

//stress test the exponent part of make_number
test("make_number should parse reals with exponents", () => {
  const match = math.make_number("123.123e123");
  expect(math.atomic_equals(match, math.SchemeReal.build(123.123e123))).toBe(
    true
  );
});

test("make_number should parse reals with nested exponents", () => {
  const match = math.make_number("1e1e1");
  expect(math.atomic_equals(match, math.SchemeReal.build(1e10))).toBe(true);
});

test("make_number should parse complex numbers", () => {
  const match = math.make_number("123+123i");
  expect(
    math.atomic_equals(
      match,
      math.SchemeComplex.build(
        math.SchemeInteger.build(123n),
        math.SchemeInteger.build(123n)
      )
    )
  ).toBe(true);
});
