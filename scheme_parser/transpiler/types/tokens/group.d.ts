/**
 * A group of elements, possibly bounded by parentheses.
 * Represents a group of related elements.
 */
import { Token } from "./token";
import { Location, Position } from "../location";
import { Datum } from "./datum";
export declare class Group {
    readonly elements: Datum[];
    readonly location: Location;
    private constructor();
    /**
     * A constructor function for a group that enforces group invariants.
     */
    static build(elements: Datum[]): Group;
    first(): Datum;
    firstToken(): Token;
    firstPos(): Position;
    last(): Datum;
    lastToken(): Token;
    lastPos(): Position;
    /**
     * Check if the current group is parenthesized.
     */
    isParenthesized(): boolean;
    /**
     * Using the invariants, we can determine if a group actually
     * represents a singular identifier.
     */
    isSingleIdentifier(): boolean;
    /**
     * Get the internal elements of the group.
     * If the group is bounded by parentheses, the parentheses are excluded.
     * @returns All elements of the group excluding parentheses.
     */
    unwrap(): Datum[];
    /**
     * Get the number of elements in the group.
     * Ignores parentheses.
     * @returns The number of elements in the group.
     */
    length(): number;
    /**
     * @returns A string representation of the group
     */
    toString(): string;
}
//# sourceMappingURL=group.d.ts.map