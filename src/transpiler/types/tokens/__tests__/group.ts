import { Token } from "../token";
import { TokenType } from "../token-type";
import { Group } from "../group";

// This test suite will test the Group class, in particular
// the build method that preserves the invariants of the Group class.
const dummyToken = new Token(
  TokenType.IDENTIFIER,
  "hello",
  "hello",
  1,
  1,
  1,
  1
);
const quoteToken = new Token(TokenType.APOSTROPHE, "'", "'", 1, 1, 1, 1);
const lParen = new Token(TokenType.LEFT_PAREN, "(", "(", 1, 1, 1, 1);
const rParen = new Token(TokenType.RIGHT_PAREN, ")", ")", 1, 1, 1, 1);
const rBracket = new Token(TokenType.RIGHT_BRACKET, "]", "]", 1, 1, 1, 1);

// we cannot test whether this works for internal groups yet, as
// we are testing the group constructor itself.
// we will test those scenarios later in these tests.

const invalidEmptyElements: any[] = [];
const validEmptyElements = [lParen, rParen];

const validNonParenElements = [dummyToken];
const invalidSingleElement = [lParen];
const invalidNonParenElements = [dummyToken, dummyToken];
const validAffectorElements = [quoteToken, dummyToken];
const invalidAffectorMoreElements = [quoteToken, dummyToken, dummyToken];
const invalidAffectorLessElements = [quoteToken];

const validParenElements = [lParen, dummyToken, dummyToken, rParen];
const invalidParenElements = [lParen, dummyToken, dummyToken, rBracket];

test("Group.build() should reject empty elements", () => {
  expect(() => Group.build(invalidEmptyElements)).toThrow();
});

test("Group.build() should accept an empty list", () => {
  expect(Group.build(validEmptyElements)).toBeInstanceOf(Group);
});

test("Group can be of singular unparenthesized element", () => {
  expect(Group.build(validNonParenElements)).toBeInstanceOf(Group);
});

test("Group of 1 singular element must be of data type", () => {
  expect(() => Group.build(invalidSingleElement)).toThrow();
});

test("Group cannot be larger than 1 element if not parenthesized and not affector group", () => {
  expect(() => Group.build(invalidNonParenElements)).toThrow();
});

test("Group can be of 2 elements if the first is an affector", () => {
  expect(Group.build(validAffectorElements)).toBeInstanceOf(Group);
});

test("Group cannot be of more than 2 elements if affector group", () => {
  expect(() => Group.build(invalidAffectorMoreElements)).toThrow();
});

test("Group cannot be of less than 2 elements if affector group", () => {
  expect(() => Group.build(invalidAffectorLessElements)).toThrow();
});

test("Group can be of more than 2 elements if parenthesized", () => {
  expect(Group.build(validParenElements)).toBeInstanceOf(Group);
});

test("Parenthesized group must have matching parentheses", () => {
  expect(() => Group.build(invalidParenElements)).toThrow();
});

test("Group.build() should avoid nested singular groups", () => {
  const nestedGroup = Group.build(validParenElements);
  const singleGroup = Group.build([nestedGroup]);
  expect(singleGroup).toBe(nestedGroup);
});
