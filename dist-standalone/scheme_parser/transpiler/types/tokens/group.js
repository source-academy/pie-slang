"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Group = void 0;
const token_type_1 = require("./token-type");
const location_1 = require("../location");
const _1 = require(".");
const parser_error_1 = require("../../parser/parser-error");
class Group {
    constructor(elements) {
        this.elements = elements;
        this.location = new location_1.Location(this.firstPos(), this.lastPos());
    }
    /**
     * A constructor function for a group that enforces group invariants.
     */
    static build(elements) {
        // helper function to check if the parentheses match.
        function matchingParentheses(lParen, rParen) {
            return ((lParen.type === token_type_1.TokenType.LEFT_PAREN &&
                rParen.type === token_type_1.TokenType.RIGHT_PAREN) ||
                (lParen.type === token_type_1.TokenType.LEFT_BRACKET &&
                    rParen.type === token_type_1.TokenType.RIGHT_BRACKET));
        }
        // helper function to check if the token is a data type.
        function isDataType(token) {
            return (token.type === token_type_1.TokenType.IDENTIFIER ||
                token.type === token_type_1.TokenType.NUMBER ||
                token.type === token_type_1.TokenType.STRING ||
                token.type === token_type_1.TokenType.BOOLEAN);
        }
        // helper function to determine if the token is an affector type.
        // (and the affector type should be the short version).
        function isShortAffector(token) {
            return (token.type === token_type_1.TokenType.APOSTROPHE ||
                token.type === token_type_1.TokenType.BACKTICK ||
                token.type === token_type_1.TokenType.HASH_VECTOR ||
                token.type === token_type_1.TokenType.COMMA ||
                token.type === token_type_1.TokenType.COMMA_AT);
        }
        // Illegal empty group.
        if (elements.length === 0) {
            // This should never happen.
            // If it does its the implementor's fault.
            throw new Error("Illegal empty group. This should never happen.");
        }
        // If the group is not parenthesized, the first case contains only one element.
        if (elements.length === 1) {
            const onlyElement = elements[0];
            if ((0, _1.isGroup)(onlyElement)) {
                // Return the inner group.
                // Avoid nested groups that are a product of the grouping generation in the parser.
                // Ensures the single internal element is not a group.
                return onlyElement;
            }
            // Ensure the single element is a data type by validating its token type.
            if (!isDataType(onlyElement)) {
                // This should never happen.
                // If it does its the implementor's fault.
                throw new parser_error_1.ExpectedFormError("", onlyElement.pos, onlyElement, "<data>");
            }
            return new Group(elements);
        }
        // If the group is not parenthesized, the remaining case contains two elements.
        if (elements.length === 2) {
            const firstElement = elements[0];
            // Ensure the first element is an affector type and
            if ((0, _1.isToken)(firstElement) && isShortAffector(firstElement)) {
                return new Group(elements);
            }
            // If all else fails, use the most generic case below.
        }
        // If the group is parenthesized, the parentheses must match.
        const firstElement = elements[0];
        const lastElement = elements[elements.length - 1];
        if ((0, _1.isToken)(firstElement) &&
            (0, _1.isToken)(lastElement) &&
            matchingParentheses(firstElement, lastElement)) {
            return new Group(elements);
        }
        // This should never happen.
        const wrongGroup = new Group(elements);
        throw new parser_error_1.ExpectedFormError("", wrongGroup.location.start, wrongGroup, "matching parentheses");
    }
    // Get the first element of the group.
    first() {
        return this.elements[0];
    }
    // Get the first token of the group.
    firstToken() {
        const firstElement = this.first();
        if ((0, _1.isToken)(firstElement)) {
            return firstElement;
        }
        else {
            return firstElement.firstToken();
        }
    }
    // Get the starting position of the first element of the group.
    firstPos() {
        return this.firstToken().pos;
    }
    // Get the last element of the group.
    last() {
        return this.elements[this.elements.length - 1];
    }
    lastToken() {
        const lastElement = this.last();
        if ((0, _1.isToken)(lastElement)) {
            return lastElement;
        }
        else {
            return lastElement.lastToken();
        }
    }
    // Get the ending position of the last element of the group.
    lastPos() {
        return this.lastToken().pos;
    }
    /**
     * Check if the current group is parenthesized.
     */
    isParenthesized() {
        const firstElement = this.first();
        // Because of the validation performed by the factory function,
        // we can assume that as long as the first element is a paranthesis,
        // the last element is also the corresponding paranthesis.
        return ((0, _1.isToken)(firstElement) &&
            (firstElement.type === token_type_1.TokenType.LEFT_PAREN ||
                firstElement.type === token_type_1.TokenType.LEFT_BRACKET));
    }
    /**
     * Using the invariants, we can determine if a group actually
     * represents a singular identifier.
     */
    isSingleIdentifier() {
        return !this.isParenthesized() && this.length() === 1;
    }
    /**
     * Get the internal elements of the group.
     * If the group is bounded by parentheses, the parentheses are excluded.
     * @returns All elements of the group excluding parentheses.
     */
    unwrap() {
        if (this.isParenthesized()) {
            return this.elements.slice(1, this.elements.length - 1);
        }
        return this.elements;
    }
    /**
     * Get the number of elements in the group.
     * Ignores parentheses.
     * @returns The number of elements in the group.
     */
    length() {
        return this.unwrap().length;
    }
    /**
     * @returns A string representation of the group
     */
    toString() {
        return this.elements.map(e => e.toString()).join(" ");
    }
}
exports.Group = Group;
//# sourceMappingURL=group.js.map