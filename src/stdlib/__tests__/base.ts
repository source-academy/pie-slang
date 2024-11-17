import * as base from "../base";
import { SchemeInteger } from "../core-math";

function makeInteger(n: number): SchemeInteger {
  return SchemeInteger.build(n);
}

test("modulo works with positive numbers", () => {
  expect(base.modulo(makeInteger(5), makeInteger(3))).toEqual(makeInteger(2));
  expect(base.modulo(makeInteger(5), makeInteger(5))).toEqual(makeInteger(0));
  expect(base.modulo(makeInteger(5), makeInteger(6))).toEqual(makeInteger(5));
  expect(base.modulo(makeInteger(5), makeInteger(7))).toEqual(makeInteger(5));
  expect(base.modulo(makeInteger(5), makeInteger(8))).toEqual(makeInteger(5));
  expect(base.modulo(makeInteger(5), makeInteger(9))).toEqual(makeInteger(5));
  expect(base.modulo(makeInteger(5), makeInteger(-4))).toEqual(makeInteger(-3));
});

test("modulo works with negative numbers", () => {
  expect(base.modulo(makeInteger(-5), makeInteger(3))).toEqual(makeInteger(1));
  expect(base.modulo(makeInteger(-5), makeInteger(5))).toEqual(makeInteger(0));
  expect(base.modulo(makeInteger(-5), makeInteger(6))).toEqual(makeInteger(1));
  expect(base.modulo(makeInteger(-5), makeInteger(7))).toEqual(makeInteger(2));
  expect(base.modulo(makeInteger(-5), makeInteger(8))).toEqual(makeInteger(3));
  expect(base.modulo(makeInteger(-5), makeInteger(9))).toEqual(makeInteger(4));
  expect(base.modulo(makeInteger(-5), makeInteger(-4))).toEqual(
    makeInteger(-1)
  );
});

test("quotient works with positive numbers", () => {
  expect(base.quotient(makeInteger(5), makeInteger(3))).toEqual(makeInteger(1));
  expect(base.quotient(makeInteger(5), makeInteger(5))).toEqual(makeInteger(1));
  expect(base.quotient(makeInteger(5), makeInteger(6))).toEqual(makeInteger(0));
  expect(base.quotient(makeInteger(5), makeInteger(7))).toEqual(makeInteger(0));
  expect(base.quotient(makeInteger(5), makeInteger(8))).toEqual(makeInteger(0));
  expect(base.quotient(makeInteger(5), makeInteger(-4))).toEqual(
    makeInteger(-1)
  );
});

test("quotient works with negative numbers", () => {
  expect(base.quotient(makeInteger(-5), makeInteger(3))).toEqual(
    makeInteger(-1)
  );
  expect(base.quotient(makeInteger(-5), makeInteger(5))).toEqual(
    makeInteger(-1)
  );
  expect(base.quotient(makeInteger(-5), makeInteger(6))).toEqual(
    makeInteger(0)
  );
  expect(base.quotient(makeInteger(-5), makeInteger(7))).toEqual(
    makeInteger(0)
  );
  expect(base.quotient(makeInteger(-5), makeInteger(8))).toEqual(
    makeInteger(0)
  );
  expect(base.quotient(makeInteger(-5), makeInteger(-4))).toEqual(
    makeInteger(1)
  );
});

test("remainder works with positive numbers", () => {
  expect(base.remainder(makeInteger(5), makeInteger(3))).toEqual(
    makeInteger(2)
  );
  expect(base.remainder(makeInteger(5), makeInteger(5))).toEqual(
    makeInteger(0)
  );
  expect(base.remainder(makeInteger(5), makeInteger(6))).toEqual(
    makeInteger(5)
  );
  expect(base.remainder(makeInteger(5), makeInteger(7))).toEqual(
    makeInteger(5)
  );
});

test("remainder works with negative numbers", () => {
  expect(base.remainder(makeInteger(-5), makeInteger(3))).toEqual(
    makeInteger(-2)
  );
  expect(base.remainder(makeInteger(-5), makeInteger(5))).toEqual(
    makeInteger(0)
  );
  expect(base.remainder(makeInteger(-5), makeInteger(6))).toEqual(
    makeInteger(-5)
  );
  expect(base.remainder(makeInteger(-5), makeInteger(7))).toEqual(
    makeInteger(-5)
  );
});

test("gcd", () => {
  expect(base.gcd(makeInteger(8), makeInteger(12))).toEqual(makeInteger(4));
  expect(base.gcd(makeInteger(8), makeInteger(13))).toEqual(makeInteger(1));
  expect(base.gcd(makeInteger(0), makeInteger(13))).toEqual(makeInteger(13));
  expect(base.gcd(makeInteger(0), makeInteger(0))).toEqual(makeInteger(0));
  expect(base.gcd(makeInteger(4), makeInteger(-2))).toEqual(makeInteger(2));
});

test("lcm", () => {
  expect(base.lcm(makeInteger(8), makeInteger(12))).toEqual(makeInteger(24));
  expect(base.lcm(makeInteger(8), makeInteger(13))).toEqual(makeInteger(104));
  expect(base.lcm(makeInteger(0), makeInteger(13))).toEqual(makeInteger(0));
  expect(base.lcm(makeInteger(4), makeInteger(-2))).toEqual(makeInteger(4));
});

test("fold works as expected", () => {
  expect(
    base.fold(
      (acc: any, x: any) => x,
      makeInteger(0),
      base.list(makeInteger(1), makeInteger(2), makeInteger(3))
    )
  ).toEqual(makeInteger(3));
});
