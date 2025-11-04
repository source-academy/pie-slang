export declare class Location {
    start: Position;
    end: Position;
    constructor(start: Position, end: Position);
    merge(other: Location): Location;
}
export declare class Position {
    line: number;
    column: number;
    constructor(line: number, column: number);
}
//# sourceMappingURL=location.d.ts.map