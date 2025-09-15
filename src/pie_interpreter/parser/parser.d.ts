import * as S from "../types/source";
import { Extended, Atomic } from '../../scheme_parser/transpiler/types/nodes/scheme-node-types';
import { Location, Syntax } from "../utils/locations";
import { Tactic } from "../tactics/tactics";
type Element = Extended.List | Atomic.Symbol | Atomic.NumericLiteral;
export declare function syntaxToLocation(syntax: Syntax): Location;
export declare function schemeParse(stx: string): Extended.List[];
export declare class Parser {
    static parsePie(stx: string): S.Source;
    static parseElements(element: Element): S.Source;
    static parseToTactics(element: Element): Tactic;
}
export declare class Claim {
    location: Location;
    name: string;
    type: S.Source;
    constructor(location: Location, name: string, type: S.Source);
}
export declare class Definition {
    location: Location;
    name: string;
    expr: S.Source;
    constructor(location: Location, name: string, expr: S.Source);
}
export declare class SamenessCheck {
    location: Location;
    type: S.Source;
    left: S.Source;
    right: S.Source;
    constructor(location: Location, type: S.Source, left: S.Source, right: S.Source);
}
export declare class DefineTactically {
    location: Location;
    name: string;
    tactics: Tactic[];
    constructor(location: Location, name: string, tactics: Tactic[]);
}
export type Declaration = Claim | Definition | SamenessCheck | DefineTactically | S.Source;
export declare class pieDeclarationParser {
    static parseDeclaration(ast: Extended.List): Declaration;
}
export {};
//# sourceMappingURL=parser.d.ts.map