import { Position } from '../../scheme_parser/transpiler/types/location';
export declare class SourceLocation {
    source: string;
    startLine: number;
    startColumn: number;
    endLine: number;
    endColumn: number;
    constructor(source: string, startLine: number, startColumn: number, endLine: number, endColumn: number);
}
export declare class Syntax {
    start: Position;
    end: Position;
    source: string;
    constructor(start: Position, end: Position, source: string);
}
export declare class Location {
    syntax: Syntax;
    forInfo: boolean;
    constructor(syntax: Syntax, forInfo: boolean);
    locationToSrcLoc(): SourceLocation;
    toString(): string;
}
export declare function notForInfo(loc: Location): Location;
//# sourceMappingURL=locations.d.ts.map