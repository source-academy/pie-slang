import { Source } from "./source";
import { Core } from "./core";
import { Location } from "../utils/locations";
import { Value } from "./value";
import { Environment } from "../utils/environment";
import { Context } from "../utils/context";
export declare class SiteBinder {
    location: Location;
    varName: string;
    constructor(location: Location, varName: string);
    prettyPrint(): string;
}
export declare class TypedBinder {
    binder: SiteBinder;
    type: Source;
    constructor(binder: SiteBinder, type: Source);
    prettyPrint(): string;
    findNames(): string;
}
export declare function isPieKeywords(str: string): boolean;
export declare class Message {
    message: Array<String | Core>;
    constructor(message: Array<String | Core>);
    toString(): string;
}
export declare abstract class Perhaps<T> {
}
export declare class go<T> extends Perhaps<T> {
    result: T;
    constructor(result: T);
}
export declare class stop extends Perhaps<undefined> {
    where: Location;
    message: Message;
    constructor(where: Location, message: Message);
}
export declare class PerhapsM<T> {
    name: string;
    value: T;
    constructor(name: string, value?: T);
}
export declare function goOn<T>(bindings: [PerhapsM<any>, () => Perhaps<any>][], finalExpr: () => T): T;
export declare abstract class Closure {
    constructor();
    abstract valOfClosure(v: Value): Value;
    abstract prettyPrint(): string;
}
export declare class FirstOrderClosure extends Closure {
    env: Environment;
    varName: string;
    expr: Core;
    constructor(env: Environment, varName: string, expr: Core);
    valOfClosure(v: Value): Value;
    prettyPrint(): string;
    toString(): string;
}
export declare class HigherOrderClosure extends Closure {
    proc: (value: Value) => Value;
    constructor(proc: (value: Value) => Value);
    valOfClosure(v: Value): Value;
    prettyPrint(): string;
    toString(): string;
}
export declare function isVarName(name: string): boolean;
export declare function fresh(ctx: Context, name: string): string;
export declare function freshBinder(ctx: Context, src: Source, name: string): string;
export declare function occurringBinderNames(binder: TypedBinder): string[];
//# sourceMappingURL=utils.d.ts.map