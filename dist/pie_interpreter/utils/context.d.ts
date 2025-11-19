import * as C from '../types/core';
import { InductiveType, Value, InductiveTypeConstructor } from '../types/value';
import { Location } from './locations';
import { go, stop, Perhaps } from '../types/utils';
import { Environment } from './environment';
import { Source } from '../types/source';
import { Tactic } from '../tactics/tactics';
export type Context = Map<string, Binder>;
export declare function extendContext(ctx: Context, name: string, binder: Binder): Context;
export declare function valInContext(ctx: Context, expr: C.Core): Value;
export declare function readBackContext(ctx: Context): SerializableContext;
export declare function nameNotUsed(ctx: Context, where: Location, name: string): stop | go<boolean>;
export declare function getClaim(ctx: Context, where: Location, name: string): Perhaps<Value>;
export declare function addClaimToContext(ctx: Context, fun: string, funLoc: Location, type: Source): Perhaps<Context>;
export declare function removeClaimFromContext(ctx: Context, name: string): Context;
export declare function addDefineToContext(ctx: Context, fun: string, funLoc: Location, expr: Source): Perhaps<Context>;
export interface TacticalResult {
    context: Context;
    message: string;
}
export declare function addDefineTacticallyToContext(ctx: Context, name: string, location: Location, tactics: Tactic[]): Perhaps<TacticalResult>;
export declare function contextToEnvironment(ctx: Context): Environment;
export declare function getInductiveType(ctx: Context, where: Location, name: string): Perhaps<InductiveDatatypeBinder>;
export declare const initCtx: Context;
export declare abstract class Binder {
    abstract type: Value;
}
export declare class Claim extends Binder {
    type: Value;
    constructor(type: Value);
}
export declare class Define extends Binder {
    type: Value;
    value: Value;
    constructor(type: Value, value: Value);
}
export declare class Free extends Binder {
    type: Value;
    constructor(type: Value);
}
export declare class InductiveDatatypeBinder extends Binder {
    name: string;
    type: InductiveType;
    constructor(name: string, type: InductiveType);
}
export declare class ConstructorTypeBinder extends Binder {
    name: string;
    constructorType: C.ConstructorType;
    type: InductiveTypeConstructor;
    constructor(name: string, constructorType: C.ConstructorType, type: InductiveTypeConstructor);
}
export declare class EliminatorBinder extends Binder {
    name: string;
    type: Value;
    constructor(name: string, type: Value);
}
export declare function varType(ctx: Context, where: Location, x: string): Perhaps<Value>;
export declare function bindFree(ctx: Context, varName: string, tv: Value): Context;
export declare function bindVal(ctx: Context, varName: string, type: Value, value: Value): Context;
export type SerializableContext = Map<string, ['free', C.Core] | ['def', C.Core, C.Core] | ['claim', C.Core]>;
export declare function isSerializableContext(ctx: unknown): ctx is SerializableContext;
//# sourceMappingURL=context.d.ts.map