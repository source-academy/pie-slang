import * as S from '../types/source';
import * as C from '../types/core';
import * as V from '../types/value';
import { Perhaps, TypedBinder } from '../types/utils';
import { Context } from '../utils/context';
import { Location } from '../utils/locations';
import { Renaming } from './utils';
export declare class DefineDatatypeSource {
    location: Location;
    name: string;
    parameters: TypedBinder[];
    indices: TypedBinder[];
    constructors: GeneralConstructor[];
    eliminatorName?: string | undefined;
    constructor(location: Location, name: string, parameters: TypedBinder[], indices: TypedBinder[], constructors: GeneralConstructor[], eliminatorName?: string | undefined);
    normalizeConstructor(ctx: Context, rename: Renaming): [Context, Renaming];
}
export declare class GeneralConstructor {
    location: Location;
    name: string;
    args: TypedBinder[];
    returnType: S.GeneralTypeConstructor;
    constructor(location: Location, name: string, args: TypedBinder[], returnType: S.GeneralTypeConstructor);
    checkValid(ctx: Context, rename: Renaming, target: V.Value, index: number): C.ConstructorType;
}
export declare function makeConstructorSpec(name: string, args: TypedBinder[]): GeneralConstructor;
export declare function handleDefineDatatype(ctx: Context, rename: Renaming, target: DefineDatatypeSource): Perhaps<Context>;
//# sourceMappingURL=definedatatype.d.ts.map