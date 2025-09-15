import * as C from "./core";
import * as N from "./neutral";
import { Context } from "../utils/context";
import { Environment } from "../utils/environment";
import { Closure } from "./utils";
export declare abstract class Value {
    now(): Value;
    abstract readBackType(context: Context): C.Core;
    abstract prettyPrint(): string;
}
export declare class DelayClosure {
    env: Environment;
    expr: C.Core;
    constructor(env: Environment, expr: C.Core);
    undelay(): Value;
    toString(): string;
}
export declare class Box<Type> {
    content: Type;
    constructor(value: Type);
    get(): Type;
    set(value: Type): void;
}
export declare class Delay extends Value {
    val: Box<DelayClosure | Value>;
    constructor(val: Box<DelayClosure | Value>);
    now(): Value;
    readBackType(context: Context): C.Core;
    prettyPrint(): string;
    toString(): string;
}
export declare class Quote extends Value {
    name: string;
    constructor(name: string);
    readBackType(context: Context): C.Core;
    prettyPrint(): string;
    toString(): string;
}
export declare class Nat extends Value {
    constructor();
    readBackType(context: Context): C.Core;
    prettyPrint(): string;
    toString(): string;
}
export declare class Zero extends Value {
    constructor();
    readBackType(context: Context): C.Core;
    prettyPrint(): string;
    toString(): string;
}
export declare class Add1 extends Value {
    smaller: Value;
    constructor(smaller: Value);
    readBackType(context: Context): C.Core;
    prettyPrint(): string;
    toString(): string;
}
export declare class Pi extends Value {
    argName: string;
    argType: Value;
    resultType: Closure;
    constructor(argName: string, argType: Value, resultType: Closure);
    readBackType(context: Context): C.Core;
    prettyPrint(): string;
    toString(): string;
}
export declare class Lambda extends Value {
    argName: string;
    body: Closure;
    constructor(argName: string, body: Closure);
    readBackType(context: Context): C.Core;
    prettyPrint(): string;
    toString(): string;
}
export declare class Sigma extends Value {
    carName: string;
    carType: Value;
    cdrType: Closure;
    constructor(carName: string, carType: Value, cdrType: Closure);
    readBackType(context: Context): C.Core;
    prettyPrint(): string;
    toString(): string;
}
export declare class Cons extends Value {
    car: Value;
    cdr: Value;
    constructor(car: Value, cdr: Value);
    readBackType(context: Context): C.Core;
    prettyPrint(): string;
    toString(): string;
}
export declare class List extends Value {
    entryType: Value;
    constructor(entryType: Value);
    readBackType(context: Context): C.Core;
    prettyPrint(): string;
    toString(): string;
}
export declare class Nil extends Value {
    constructor();
    readBackType(context: Context): C.Core;
    prettyPrint(): string;
    toString(): string;
}
export declare class ListCons extends Value {
    head: Value;
    tail: Value;
    constructor(head: Value, tail: Value);
    readBackType(context: Context): C.Core;
    prettyPrint(): string;
    toString(): string;
}
export declare class Equal extends Value {
    type: Value;
    from: Value;
    to: Value;
    constructor(type: Value, from: Value, to: Value);
    readBackType(context: Context): C.Core;
    prettyPrint(): string;
    toString(): string;
}
export declare class Same extends Value {
    value: Value;
    constructor(value: Value);
    readBackType(context: Context): C.Core;
    prettyPrint(): string;
    toString(): string;
}
export declare class Vec extends Value {
    entryType: Value;
    length: Value;
    constructor(entryType: Value, length: Value);
    readBackType(context: Context): C.Core;
    prettyPrint(): string;
}
export declare class VecNil extends Value {
    constructor();
    readBackType(context: Context): C.Core;
    prettyPrint(): string;
    toString(): string;
}
export declare class VecCons extends Value {
    head: Value;
    tail: Value;
    constructor(head: Value, tail: Value);
    readBackType(context: Context): C.Core;
    prettyPrint(): string;
    toString(): string;
}
export declare class Either extends Value {
    leftType: Value;
    rightType: Value;
    constructor(leftType: Value, rightType: Value);
    readBackType(context: Context): C.Core;
    prettyPrint(): string;
    toString(): string;
}
export declare class Left extends Value {
    value: Value;
    constructor(value: Value);
    readBackType(context: Context): C.Core;
    prettyPrint(): string;
    toString(): string;
}
export declare class Right extends Value {
    value: Value;
    constructor(value: Value);
    readBackType(context: Context): C.Core;
    prettyPrint(): string;
    toString(): string;
}
export declare class Neutral extends Value {
    type: Value;
    neutral: N.Neutral;
    constructor(type: Value, neutral: N.Neutral);
    readBackType(context: Context): C.Core;
    prettyPrint(): string;
    toString(): string;
}
export declare class Universe extends Value {
    constructor();
    readBackType(context: Context): C.Core;
    prettyPrint(): string;
    toString(): string;
}
export declare class Atom extends Value {
    constructor();
    readBackType(context: Context): C.Core;
    prettyPrint(): string;
    toString(): string;
}
export declare class Trivial extends Value {
    constructor();
    readBackType(context: Context): C.Core;
    prettyPrint(): string;
    toString(): string;
}
export declare class Sole extends Value {
    constructor();
    readBackType(context: Context): C.Core;
    prettyPrint(): string;
    toString(): string;
}
export declare class Absurd extends Value {
    constructor();
    readBackType(context: Context): C.Core;
    prettyPrint(): string;
    toString(): string;
}
export declare class InductiveType extends Value {
    name: string;
    parameters: Value[];
    indices: Value[];
    constructor(name: string, parameters: Value[], indices: Value[]);
    readBackType(context: Context): C.Core;
    prettyPrint(): string;
    toString(): string;
}
export declare class Constructor extends Value {
    name: string;
    type: Value;
    args: Value[];
    index: number;
    recursive_args: Value[];
    constructor(name: string, type: Value, args: Value[], index: number, recursive_args: Value[]);
    readBackType(context: Context): C.Core;
    prettyPrint(): string;
    toString(): string;
}
//# sourceMappingURL=value.d.ts.map