import * as V from "./value";
import { Environment } from '../utils/environment';
import { SourceLocation } from '../utils/locations';
export declare abstract class Core {
    abstract valOf(env: Environment): V.Value;
    abstract prettyPrint(): string;
    toLazy(env: Environment): V.Value;
}
export declare class The extends Core {
    type: Core;
    expr: Core;
    constructor(type: Core, expr: Core);
    valOf(env: Environment): V.Value;
    prettyPrint(): string;
    toString(): string;
}
export declare class Universe extends Core {
    valOf(env: Environment): V.Value;
    prettyPrint(): string;
    toString(): string;
}
export declare class Nat extends Core {
    valOf(env: Environment): V.Value;
    prettyPrint(): string;
    toString(): string;
}
export declare class Zero extends Core {
    valOf(env: Environment): V.Value;
    prettyPrint(): string;
    toString(): string;
}
export declare class Add1 extends Core {
    n: Core;
    constructor(n: Core);
    valOf(env: Environment): V.Value;
    prettyPrint(): string;
    toString(): string;
}
export declare class WhichNat extends Core {
    target: Core;
    base: The;
    step: Core;
    constructor(target: Core, base: The, step: Core);
    valOf(env: Environment): V.Value;
    prettyPrint(): string;
    toString(): string;
}
export declare class IterNat extends Core {
    target: Core;
    base: The;
    step: Core;
    constructor(target: Core, base: The, step: Core);
    valOf(env: Environment): V.Value;
    prettyPrint(): string;
    toString(): string;
}
export declare class RecNat extends Core {
    target: Core;
    base: The;
    step: Core;
    constructor(target: Core, base: The, step: Core);
    valOf(env: Environment): V.Value;
    prettyPrint(): string;
    toString(): string;
}
export declare class IndNat extends Core {
    target: Core;
    motive: Core;
    base: Core;
    step: Core;
    constructor(target: Core, motive: Core, base: Core, step: Core);
    valOf(env: Environment): V.Value;
    prettyPrint(): string;
    toString(): string;
}
export declare class Pi extends Core {
    name: string;
    type: Core;
    body: Core;
    constructor(name: string, type: Core, body: Core);
    valOf(env: Environment): V.Value;
    prettyPrint(): string;
    toString(): string;
}
export declare class Lambda extends Core {
    param: string;
    body: Core;
    constructor(param: string, body: Core);
    valOf(env: Environment): V.Value;
    prettyPrint(): string;
    toString(): string;
}
export declare class Atom extends Core {
    valOf(env: Environment): V.Value;
    prettyPrint(): string;
    toString(): string;
}
export declare class Quote extends Core {
    sym: string;
    constructor(sym: string);
    valOf(env: Environment): V.Value;
    prettyPrint(): string;
    toString(): string;
}
export declare class Sigma extends Core {
    name: string;
    type: Core;
    body: Core;
    constructor(name: string, type: Core, body: Core);
    valOf(env: Environment): V.Value;
    prettyPrint(): string;
    toString(): string;
}
export declare class Cons extends Core {
    first: Core;
    second: Core;
    constructor(first: Core, second: Core);
    valOf(env: Environment): V.Value;
    prettyPrint(): string;
    toString(): string;
}
export declare class Car extends Core {
    pair: Core;
    constructor(pair: Core);
    valOf(env: Environment): V.Value;
    prettyPrint(): string;
    toString(): string;
}
export declare class Cdr extends Core {
    pair: Core;
    constructor(pair: Core);
    valOf(env: Environment): V.Value;
    prettyPrint(): string;
    toString(): string;
}
export declare class ListCons extends Core {
    head: Core;
    tail: Core;
    constructor(head: Core, tail: Core);
    valOf(env: Environment): V.Value;
    prettyPrint(): string;
    toString(): string;
}
export declare class Nil extends Core {
    valOf(env: Environment): V.Value;
    prettyPrint(): string;
    toString(): string;
}
export declare class List extends Core {
    elemType: Core;
    constructor(elemType: Core);
    valOf(env: Environment): V.Value;
    prettyPrint(): string;
    toString(): string;
}
export declare class RecList extends Core {
    target: Core;
    base: The;
    step: Core;
    constructor(target: Core, base: The, step: Core);
    valOf(env: Environment): V.Value;
    prettyPrint(): string;
    toString(): string;
}
export declare class IndList extends Core {
    target: Core;
    motive: Core;
    base: Core;
    step: Core;
    constructor(target: Core, motive: Core, base: Core, step: Core);
    valOf(env: Environment): V.Value;
    prettyPrint(): string;
    toString(): string;
}
export declare class Trivial extends Core {
    valOf(env: Environment): V.Value;
    prettyPrint(): string;
    toString(): string;
}
export declare class Sole extends Core {
    valOf(env: Environment): V.Value;
    prettyPrint(): string;
    toString(): string;
}
export declare class Absurd extends Core {
    valOf(env: Environment): V.Value;
    prettyPrint(): string;
    toString(): string;
}
export declare class IndAbsurd extends Core {
    target: Core;
    motive: Core;
    constructor(target: Core, motive: Core);
    valOf(env: Environment): V.Value;
    prettyPrint(): string;
    toString(): string;
}
export declare class Equal extends Core {
    type: Core;
    left: Core;
    right: Core;
    constructor(type: Core, left: Core, right: Core);
    valOf(env: Environment): V.Value;
    prettyPrint(): string;
    toString(): string;
}
export declare class Same extends Core {
    type: Core;
    constructor(type: Core);
    valOf(env: Environment): V.Value;
    prettyPrint(): string;
    toString(): string;
}
export declare class Replace extends Core {
    target: Core;
    motive: Core;
    base: Core;
    constructor(target: Core, motive: Core, base: Core);
    valOf(env: Environment): V.Value;
    prettyPrint(): string;
    toString(): string;
}
export declare class Trans extends Core {
    left: Core;
    right: Core;
    constructor(left: Core, right: Core);
    valOf(env: Environment): V.Value;
    prettyPrint(): string;
    toString(): string;
}
export declare class Cong extends Core {
    target: Core;
    base: Core;
    fun: Core;
    constructor(target: Core, base: Core, fun: Core);
    valOf(env: Environment): V.Value;
    prettyPrint(): string;
    toString(): string;
}
export declare class Symm extends Core {
    equality: Core;
    constructor(equality: Core);
    valOf(env: Environment): V.Value;
    prettyPrint(): string;
    toString(): string;
}
export declare class IndEqual extends Core {
    target: Core;
    motive: Core;
    base: Core;
    constructor(target: Core, motive: Core, base: Core);
    valOf(env: Environment): V.Value;
    prettyPrint(): string;
    toString(): string;
}
export declare class Vec extends Core {
    type: Core;
    length: Core;
    constructor(type: Core, length: Core);
    valOf(env: Environment): V.Value;
    prettyPrint(): string;
    toString(): string;
}
export declare class VecCons extends Core {
    head: Core;
    tail: Core;
    constructor(head: Core, tail: Core);
    valOf(env: Environment): V.Value;
    prettyPrint(): string;
    toString(): string;
}
export declare class VecNil extends Core {
    valOf(env: Environment): V.Value;
    prettyPrint(): string;
    toString(): string;
}
export declare class Head extends Core {
    vec: Core;
    constructor(vec: Core);
    valOf(env: Environment): V.Value;
    prettyPrint(): string;
    toString(): string;
}
export declare class Tail extends Core {
    vec: Core;
    constructor(vec: Core);
    valOf(env: Environment): V.Value;
    prettyPrint(): string;
    toString(): string;
}
export declare class IndVec extends Core {
    length: Core;
    target: Core;
    motive: Core;
    base: Core;
    step: Core;
    constructor(length: Core, target: Core, motive: Core, base: Core, step: Core);
    valOf(env: Environment): V.Value;
    prettyPrint(): string;
    toString(): string;
}
export declare class Either extends Core {
    left: Core;
    right: Core;
    constructor(left: Core, right: Core);
    valOf(env: Environment): V.Value;
    prettyPrint(): string;
    toString(): string;
}
export declare class Left extends Core {
    value: Core;
    constructor(value: Core);
    valOf(env: Environment): V.Value;
    prettyPrint(): string;
    toString(): string;
}
export declare class Right extends Core {
    value: Core;
    constructor(value: Core);
    valOf(env: Environment): V.Value;
    prettyPrint(): string;
    toString(): string;
}
export declare class IndEither extends Core {
    target: Core;
    motive: Core;
    baseLeft: Core;
    baseRight: Core;
    constructor(target: Core, motive: Core, baseLeft: Core, baseRight: Core);
    valOf(env: Environment): V.Value;
    prettyPrint(): string;
    toString(): string;
}
export declare class TODO extends Core {
    loc: SourceLocation;
    type: Core;
    constructor(loc: SourceLocation, type: Core);
    valOf(env: Environment): V.Value;
    prettyPrint(): string;
    toString(): string;
}
export declare class Application extends Core {
    fun: Core;
    arg: Core;
    constructor(fun: Core, arg: Core);
    valOf(env: Environment): V.Value;
    prettyPrint(): string;
    toString(): string;
}
export declare class VarName extends Core {
    name: string;
    constructor(name: string);
    valOf(env: Environment): V.Value;
    prettyPrint(): string;
    toString(): string;
}
export declare class InductiveType extends Core {
    typeName: string;
    parameters: Core[];
    indices: Core[];
    valOf(env: Environment): V.Value;
    constructor(typeName: string, parameters: Core[], indices: Core[]);
    prettyPrint(): string;
}
export declare class Constructor extends Core {
    name: string;
    type: Core;
    args: Core[];
    index: number;
    recursive_args: Core[];
    constructor(name: string, type: Core, args: Core[], index: number, recursive_args: Core[]);
    valOf(env: Environment): V.Value;
    prettyPrint(): string;
}
export declare class Eliminator extends Core {
    typeName: string;
    target: Core;
    motive: Core;
    methods: Core[];
    constructor(typeName: string, target: Core, motive: Core, methods: Core[]);
    valOf(env: Environment): V.Value;
    prettyPrint(): string;
}
//# sourceMappingURL=core.d.ts.map