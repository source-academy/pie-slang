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
    normalize_constructor(ctx: Context, rename: Renaming): [Context, Renaming];
    /**
     * Generate the motive type for the eliminator of this inductive type.
     *
     * The motive type has the form:
     * (Π [i₁ : τ₁] ... [iₙ : τₙ] [target : T params... i₁...iₙ] U)
     *
     * Where:
     * - i₁...iₙ are the indices of the inductive type
     * - T is the inductive type name
     * - params are the type parameters
     * - target is the value being eliminated
     *
     * Examples:
     * - Nat (no indices): (Π [n : Nat] U)
     * - Vec E (one index k : Nat): (Π [k : Nat] [es : Vec E k] U)
     * - Fin (one index n : Nat): (Π [n : Nat] [f : Fin n] U)
     *
     * IMPORTANT: Index variables must be captured inside closures and used to
     * construct the target type, following the pattern from synthIndVec.
     */
    /**
     * Generate the eliminator method type for a specific constructor.
     *
     * Method type: (Π [i+x : τ₁]... (→ (P ix... xrec)... (P τ₂i... (C A... i+x...))))
     *
     * Following the Turnstile+ pattern:
     * - Bind all constructor arguments
     * - Add inductive hypotheses for recursive arguments
     * - Result: motive applied to constructor application
     */
    generateMethodType(ctx: Context, rename: Renaming, ctorType: C.ConstructorType, motiveValue: V.Value, params: V.Value[]): V.Value;
}
export declare class GeneralConstructor {
    location: Location;
    name: string;
    args: TypedBinder[];
    returnType: S.GeneralTypeConstructor;
    constructor(location: Location, name: string, args: TypedBinder[], returnType: S.GeneralTypeConstructor);
    checkValid(ctx: Context, rename: Renaming, target: V.Value, index: number): C.ConstructorType;
}
export declare class GeneralTypeSource {
    location: Location;
    name: string;
    parameters: TypedBinder[];
    indices: TypedBinder[];
    constructor(location: Location, name: string, parameters: TypedBinder[], indices: TypedBinder[]);
}
export declare function makeConstructorSpec(name: string, args: TypedBinder[]): GeneralConstructor;
export declare function handleDefineDatatype(ctx: Context, rename: Renaming, target: DefineDatatypeSource): Perhaps<Context>;
//# sourceMappingURL=definedatatype.d.ts.map