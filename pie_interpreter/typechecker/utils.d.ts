import { Value } from "../types/value";
import { Source } from "../types/source";
import { Core } from "../types/core";
import { Location } from "../utils/locations";
import { Context, SerializableContext } from "../utils/context";
import { Perhaps } from "../types/utils";
type What = 'definition' | ['binding-site', Core] | ['is-type', Core] | ['has-type', Core] | ['TODO', SerializableContext, Core];
export declare function PieInfoHook(where: Location, what: What): void;
export declare function SendPieInfo(where: Location, what: What): void;
export type Renaming = Map<string, string>;
export declare function rename(renames: Renaming, x: string): string;
export declare function extendRenaming(renames: Renaming, from: string, to: string): Renaming;
export declare function sameType(ctx: Context, where: Location, given: Value, expected: Value): Perhaps<undefined>;
export declare function convert(ctx: Context, where: Location, type: Value, from: Value, to: Value): Perhaps<undefined>;
export declare function atomOk(a: string): boolean;
export declare function makeApp(a: Source, b: Source, cs: Source[]): Source;
export {};
//# sourceMappingURL=utils.d.ts.map