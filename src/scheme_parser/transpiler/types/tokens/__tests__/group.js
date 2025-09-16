"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const token_1 = require("../token");
const token_type_1 = require("../token-type");
const group_1 = require("../group");
// This test suite will test the Group class, in particular
// the build method that preserves the invariants of the Group class.
const dummyToken = new token_1.Token(token_type_1.TokenType.IDENTIFIER, "hello", "hello", 1, 1, 1, 1);
const quoteToken = new token_1.Token(token_type_1.TokenType.APOSTROPHE, "'", "'", 1, 1, 1, 1);
const lParen = new token_1.Token(token_type_1.TokenType.LEFT_PAREN, "(", "(", 1, 1, 1, 1);
const rParen = new token_1.Token(token_type_1.TokenType.RIGHT_PAREN, ")", ")", 1, 1, 1, 1);
const rBracket = new token_1.Token(token_type_1.TokenType.RIGHT_BRACKET, "]", "]", 1, 1, 1, 1);
// we cannot test whether this works for internal groups yet, as
// we are testing the group constructor itself.
// we will test those scenarios later in these tests.
const invalidEmptyElements = [];
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
    expect(() => group_1.Group.build(invalidEmptyElements)).toThrow();
});
test("Group.build() should accept an empty list", () => {
    expect(group_1.Group.build(validEmptyElements)).toBeInstanceOf(group_1.Group);
});
test("Group can be of singular unparenthesized element", () => {
    expect(group_1.Group.build(validNonParenElements)).toBeInstanceOf(group_1.Group);
});
test("Group of 1 singular element must be of data type", () => {
    expect(() => group_1.Group.build(invalidSingleElement)).toThrow();
});
test("Group cannot be larger than 1 element if not parenthesized and not affector group", () => {
    expect(() => group_1.Group.build(invalidNonParenElements)).toThrow();
});
test("Group can be of 2 elements if the first is an affector", () => {
    expect(group_1.Group.build(validAffectorElements)).toBeInstanceOf(group_1.Group);
});
test("Group cannot be of more than 2 elements if affector group", () => {
    expect(() => group_1.Group.build(invalidAffectorMoreElements)).toThrow();
});
test("Group cannot be of less than 2 elements if affector group", () => {
    expect(() => group_1.Group.build(invalidAffectorLessElements)).toThrow();
});
test("Group can be of more than 2 elements if parenthesized", () => {
    expect(group_1.Group.build(validParenElements)).toBeInstanceOf(group_1.Group);
});
test("Parenthesized group must have matching parentheses", () => {
    expect(() => group_1.Group.build(invalidParenElements)).toThrow();
});
test("Group.build() should avoid nested singular groups", () => {
    const nestedGroup = group_1.Group.build(validParenElements);
    const singleGroup = group_1.Group.build([nestedGroup]);
    expect(singleGroup).toBe(nestedGroup);
});
//# sourceMappingURL=group.js.map