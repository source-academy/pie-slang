import * as C from './core';
import * as V from './value';
import { Renaming } from '../typechecker/utils';
import { Location } from '../utils/locations';
import { Context } from '../utils/context';
import { Perhaps, SiteBinder, TypedBinder } from './utils';
export declare abstract class Source {
    location: Location;
    constructor(location: Location);
    abstract findNames(): string[];
    abstract prettyPrint(): string;
    isType(ctx: Context, renames: Renaming): Perhaps<C.Core>;
    getType(ctx: Context, renames: Renaming): Perhaps<C.Core>;
    check(ctx: Context, renames: Renaming, type: V.Value): Perhaps<C.Core>;
    synth(ctx: Context, renames: Renaming): Perhaps<C.The>;
    protected abstract synthHelper(ctx: Context, renames: Renaming): Perhaps<C.The>;
    protected checkOut(ctx: Context, renames: Renaming, type: V.Value): Perhaps<C.Core>;
}
export declare class The extends Source {
    location: Location;
    type: Source;
    value: Source;
    constructor(location: Location, type: Source, value: Source);
    protected synthHelper(ctx: Context, renames: Renaming): Perhaps<C.The>;
    findNames(): string[];
    prettyPrint(): string;
    toString(): string;
}
export declare class Universe extends Source {
    location: Location;
    constructor(location: Location);
    protected synthHelper(ctx: Context, renames: Renaming): Perhaps<C.The>;
    findNames(): string[];
    getType(ctx: Context, renames: Renaming): Perhaps<C.Core>;
    prettyPrint(): string;
    toString(): string;
}
export declare class Nat extends Source {
    location: Location;
    constructor(location: Location);
    protected synthHelper(ctx: Context, renames: Renaming): Perhaps<C.The>;
    findNames(): string[];
    getType(ctx: Context, renames: Renaming): Perhaps<C.Core>;
    prettyPrint(): string;
    toString(): string;
}
export declare class Zero extends Source {
    location: Location;
    constructor(location: Location);
    protected synthHelper(ctx: Context, renames: Renaming): Perhaps<C.The>;
    findNames(): string[];
    prettyPrint(): string;
    toString(): string;
}
export declare class Add1 extends Source {
    location: Location;
    base: Source;
    constructor(location: Location, base: Source);
    protected synthHelper(ctx: Context, renames: Renaming): Perhaps<C.The>;
    findNames(): string[];
    prettyPrint(): string;
    toString(): string;
}
export declare class WhichNat extends Source {
    location: Location;
    target: Source;
    base: Source;
    step: Source;
    constructor(location: Location, target: Source, base: Source, step: Source);
    protected synthHelper(ctx: Context, renames: Renaming): Perhaps<C.The>;
    findNames(): string[];
    prettyPrint(): string;
    toString(): string;
}
export declare class IterNat extends Source {
    location: Location;
    target: Source;
    base: Source;
    step: Source;
    constructor(location: Location, target: Source, base: Source, step: Source);
    protected synthHelper(ctx: Context, renames: Renaming): Perhaps<C.The>;
    findNames(): string[];
    prettyPrint(): string;
    toString(): string;
}
export declare class RecNat extends Source {
    location: Location;
    target: Source;
    base: Source;
    step: Source;
    constructor(location: Location, target: Source, base: Source, step: Source);
    protected synthHelper(ctx: Context, renames: Renaming): Perhaps<C.The>;
    findNames(): string[];
    prettyPrint(): string;
    toString(): string;
}
export declare class IndNat extends Source {
    location: Location;
    target: Source;
    motive: Source;
    base: Source;
    step: Source;
    constructor(location: Location, target: Source, motive: Source, base: Source, step: Source);
    protected synthHelper(ctx: Context, renames: Renaming): Perhaps<C.The>;
    findNames(): string[];
    prettyPrint(): string;
    toString(): string;
}
export declare class Arrow extends Source {
    location: Location;
    arg1: Source;
    arg2: Source;
    args: Source[];
    constructor(location: Location, arg1: Source, arg2: Source, args: Source[]);
    protected synthHelper(ctx: Context, renames: Renaming): Perhaps<C.The>;
    findNames(): string[];
    getType(ctx: Context, renames: Renaming): Perhaps<C.Core>;
    prettyPrint(): string;
    toString(): string;
}
export declare class Pi extends Source {
    location: Location;
    binders: TypedBinder[];
    body: Source;
    constructor(location: Location, binders: TypedBinder[], body: Source);
    protected synthHelper(ctx: Context, renames: Renaming): Perhaps<C.The>;
    findNames(): string[];
    getType(ctx: Context, renames: Renaming): Perhaps<C.Core>;
    prettyPrint(): string;
    toString(): string;
}
export declare class Lambda extends Source {
    location: Location;
    binders: SiteBinder[];
    body: Source;
    constructor(location: Location, binders: SiteBinder[], body: Source);
    protected synthHelper(ctx: Context, renames: Renaming): Perhaps<C.The>;
    findNames(): string[];
    checkOut(ctx: Context, renames: Renaming, type: V.Value): Perhaps<C.Core>;
    prettyPrint(): string;
    toString(): string;
}
export declare class Sigma extends Source {
    location: Location;
    binders: TypedBinder[];
    body: Source;
    constructor(location: Location, binders: TypedBinder[], body: Source);
    protected synthHelper(ctx: Context, renames: Renaming): Perhaps<C.The>;
    findNames(): string[];
    getType(ctx: Context, renames: Renaming): Perhaps<C.Core>;
    prettyPrint(): string;
    toString(): string;
}
export declare class Name extends Source {
    location: Location;
    name: string;
    constructor(location: Location, name: string);
    protected synthHelper(ctx: Context, renames: Renaming): Perhaps<C.The>;
    findNames(): string[];
    prettyPrint(): string;
    toString(): string;
}
export declare class Atom extends Source {
    location: Location;
    constructor(location: Location);
    protected synthHelper(ctx: Context, renames: Renaming): Perhaps<C.The>;
    findNames(): string[];
    getType(ctx: Context, renames: Renaming): Perhaps<C.Core>;
    prettyPrint(): string;
    toString(): string;
}
export declare class Quote extends Source {
    location: Location;
    name: string;
    constructor(location: Location, name: string);
    protected synthHelper(ctx: Context, renames: Renaming): Perhaps<C.The>;
    findNames(): string[];
    prettyPrint(): string;
    toString(): string;
}
export declare class Pair extends Source {
    location: Location;
    first: Source;
    second: Source;
    constructor(location: Location, first: Source, second: Source);
    protected synthHelper(ctx: Context, renames: Renaming): Perhaps<C.The>;
    findNames(): string[];
    getType(ctx: Context, renames: Renaming): Perhaps<C.Core>;
    prettyPrint(): string;
    toString(): string;
}
export declare class Cons extends Source {
    location: Location;
    first: Source;
    second: Source;
    constructor(location: Location, first: Source, second: Source);
    protected synthHelper(ctx: Context, renames: Renaming): Perhaps<C.The>;
    findNames(): string[];
    checkOut(ctx: Context, renames: Renaming, type: V.Value): Perhaps<C.Core>;
    prettyPrint(): string;
    toString(): string;
}
export declare class Car extends Source {
    location: Location;
    pair: Source;
    constructor(location: Location, pair: Source);
    protected synthHelper(ctx: Context, renames: Renaming): Perhaps<C.The>;
    findNames(): string[];
    prettyPrint(): string;
    toString(): string;
}
export declare class Cdr extends Source {
    location: Location;
    pair: Source;
    constructor(location: Location, pair: Source);
    protected synthHelper(ctx: Context, renames: Renaming): Perhaps<C.The>;
    findNames(): string[];
    prettyPrint(): string;
    toString(): string;
}
export declare class Trivial extends Source {
    location: Location;
    constructor(location: Location);
    protected synthHelper(ctx: Context, renames: Renaming): Perhaps<C.The>;
    findNames(): string[];
    getType(ctx: Context, renames: Renaming): Perhaps<C.Core>;
    prettyPrint(): string;
    toString(): string;
}
export declare class Sole extends Source {
    location: Location;
    constructor(location: Location);
    protected synthHelper(ctx: Context, renames: Renaming): Perhaps<C.The>;
    findNames(): string[];
    prettyPrint(): string;
}
export declare class Nil extends Source {
    location: Location;
    constructor(location: Location);
    protected synthHelper(ctx: Context, renames: Renaming): Perhaps<C.The>;
    findNames(): string[];
    checkOut(ctx: Context, renames: Renaming, type: V.Value): Perhaps<C.Core>;
    prettyPrint(): string;
    toString(): string;
}
export declare class Number extends Source {
    location: Location;
    value: number;
    constructor(location: Location, value: number);
    protected synthHelper(ctx: Context, renames: Renaming): Perhaps<C.The>;
    findNames(): string[];
    prettyPrint(): string;
    toString(): string;
}
export declare class List extends Source {
    location: Location;
    entryType: Source;
    constructor(location: Location, entryType: Source);
    protected synthHelper(ctx: Context, renames: Renaming): Perhaps<C.The>;
    findNames(): string[];
    getType(ctx: Context, renames: Renaming): Perhaps<C.Core>;
    prettyPrint(): string;
    toString(): string;
}
export declare class ListCons extends Source {
    location: Location;
    x: Source;
    xs: Source;
    constructor(location: Location, x: Source, xs: Source);
    protected synthHelper(ctx: Context, renames: Renaming): Perhaps<C.The>;
    findNames(): string[];
    prettyPrint(): string;
    toString(): string;
}
export declare class RecList extends Source {
    location: Location;
    target: Source;
    base: Source;
    step: Source;
    constructor(location: Location, target: Source, base: Source, step: Source);
    protected synthHelper(ctx: Context, renames: Renaming): Perhaps<C.The>;
    findNames(): string[];
    prettyPrint(): string;
    toString(): string;
}
export declare class IndList extends Source {
    location: Location;
    target: Source;
    motive: Source;
    base: Source;
    step: Source;
    constructor(location: Location, target: Source, motive: Source, base: Source, step: Source);
    protected synthHelper(ctx: Context, renames: Renaming): Perhaps<C.The>;
    findNames(): string[];
    prettyPrint(): string;
    toString(): string;
}
export declare class Absurd extends Source {
    location: Location;
    constructor(location: Location);
    protected synthHelper(ctx: Context, renames: Renaming): Perhaps<C.The>;
    findNames(): string[];
    getType(ctx: Context, renames: Renaming): Perhaps<C.Core>;
    prettyPrint(): string;
    toString(): string;
}
export declare class IndAbsurd extends Source {
    location: Location;
    target: Source;
    motive: Source;
    constructor(location: Location, target: Source, motive: Source);
    protected synthHelper(ctx: Context, renames: Renaming): Perhaps<C.The>;
    findNames(): string[];
    prettyPrint(): string;
    toString(): string;
}
export declare class Equal extends Source {
    location: Location;
    type: Source;
    left: Source;
    right: Source;
    constructor(location: Location, type: Source, left: Source, right: Source);
    protected synthHelper(ctx: Context, renames: Renaming): Perhaps<C.The>;
    findNames(): string[];
    getType(ctx: Context, renames: Renaming): Perhaps<C.Core>;
    prettyPrint(): string;
    toString(): string;
}
export declare class Same extends Source {
    location: Location;
    type: Source;
    constructor(location: Location, type: Source);
    findNames(): string[];
    protected synthHelper(ctx: Context, renames: Renaming): Perhaps<C.The>;
    checkOut(ctx: Context, renames: Renaming, type: V.Value): Perhaps<C.Core>;
    prettyPrint(): string;
    toString(): string;
}
export declare class Replace extends Source {
    location: Location;
    target: Source;
    motive: Source;
    base: Source;
    constructor(location: Location, target: Source, motive: Source, base: Source);
    protected synthHelper(ctx: Context, renames: Renaming): Perhaps<C.The>;
    findNames(): string[];
    prettyPrint(): string;
    toString(): string;
}
export declare class Trans extends Source {
    location: Location;
    left: Source;
    right: Source;
    protected synthHelper(ctx: Context, renames: Renaming): Perhaps<C.The>;
    constructor(location: Location, left: Source, right: Source);
    findNames(): string[];
    prettyPrint(): string;
    toString(): string;
}
export declare class Cong extends Source {
    location: Location;
    target: Source;
    fun: Source;
    constructor(location: Location, target: Source, fun: Source);
    protected synthHelper(ctx: Context, renames: Renaming): Perhaps<C.The>;
    findNames(): string[];
    prettyPrint(): string;
    toString(): string;
}
export declare class Symm extends Source {
    location: Location;
    equality: Source;
    constructor(location: Location, equality: Source);
    protected synthHelper(ctx: Context, renames: Renaming): Perhaps<C.The>;
    findNames(): string[];
    prettyPrint(): string;
    toString(): string;
}
export declare class IndEqual extends Source {
    location: Location;
    target: Source;
    motive: Source;
    base: Source;
    constructor(location: Location, target: Source, motive: Source, base: Source);
    protected synthHelper(ctx: Context, renames: Renaming): Perhaps<C.The>;
    findNames(): string[];
    prettyPrint(): string;
    toString(): string;
}
export declare class Vec extends Source {
    location: Location;
    type: Source;
    length: Source;
    constructor(location: Location, type: Source, length: Source);
    protected synthHelper(ctx: Context, renames: Renaming): Perhaps<C.The>;
    findNames(): string[];
    getType(ctx: Context, renames: Renaming): Perhaps<C.Core>;
    prettyPrint(): string;
    toString(): string;
}
export declare class VecNil extends Source {
    location: Location;
    constructor(location: Location);
    protected synthHelper(ctx: Context, renames: Renaming): Perhaps<C.The>;
    findNames(): string[];
    checkOut(ctx: Context, renames: Renaming, type: V.Value): Perhaps<C.Core>;
    prettyPrint(): string;
    toString(): string;
}
export declare class VecCons extends Source {
    location: Location;
    x: Source;
    xs: Source;
    constructor(location: Location, x: Source, xs: Source);
    protected synthHelper(ctx: Context, renames: Renaming): Perhaps<C.The>;
    findNames(): string[];
    checkOut(ctx: Context, renames: Renaming, type: V.Value): Perhaps<C.Core>;
    prettyPrint(): string;
    toString(): string;
}
export declare class Head extends Source {
    location: Location;
    vec: Source;
    constructor(location: Location, vec: Source);
    protected synthHelper(ctx: Context, renames: Renaming): Perhaps<C.The>;
    findNames(): string[];
    prettyPrint(): string;
    toString(): string;
}
export declare class Tail extends Source {
    location: Location;
    vec: Source;
    constructor(location: Location, vec: Source);
    protected synthHelper(ctx: Context, renames: Renaming): Perhaps<C.The>;
    findNames(): string[];
    prettyPrint(): string;
    toString(): string;
}
export declare class IndVec extends Source {
    location: Location;
    length: Source;
    target: Source;
    motive: Source;
    base: Source;
    step: Source;
    constructor(location: Location, length: Source, target: Source, motive: Source, base: Source, step: Source);
    protected synthHelper(ctx: Context, renames: Renaming): Perhaps<C.The>;
    findNames(): string[];
    prettyPrint(): string;
    toString(): string;
}
export declare class Either extends Source {
    location: Location;
    left: Source;
    right: Source;
    constructor(location: Location, left: Source, right: Source);
    protected synthHelper(ctx: Context, renames: Renaming): Perhaps<C.The>;
    findNames(): string[];
    getType(ctx: Context, renames: Renaming): Perhaps<C.Core>;
    prettyPrint(): string;
    toString(): string;
}
export declare class Left extends Source {
    location: Location;
    value: Source;
    constructor(location: Location, value: Source);
    protected synthHelper(ctx: Context, renames: Renaming): Perhaps<C.The>;
    findNames(): string[];
    checkOut(ctx: Context, renames: Renaming, type: V.Value): Perhaps<C.Core>;
    prettyPrint(): string;
    toString(): string;
}
export declare class Right extends Source {
    location: Location;
    value: Source;
    constructor(location: Location, value: Source);
    protected synthHelper(ctx: Context, renames: Renaming): Perhaps<C.The>;
    findNames(): string[];
    checkOut(ctx: Context, renames: Renaming, type: V.Value): Perhaps<C.Core>;
    prettyPrint(): string;
    toString(): string;
}
export declare class IndEither extends Source {
    location: Location;
    target: Source;
    motive: Source;
    baseLeft: Source;
    baseRight: Source;
    constructor(location: Location, target: Source, motive: Source, baseLeft: Source, baseRight: Source);
    protected synthHelper(ctx: Context, renames: Renaming): Perhaps<C.The>;
    findNames(): string[];
    prettyPrint(): string;
    toString(): string;
}
export declare class TODO extends Source {
    location: Location;
    constructor(location: Location);
    protected synthHelper(ctx: Context, renames: Renaming): Perhaps<C.The>;
    findNames(): string[];
    checkOut(ctx: Context, renames: Renaming, type: V.Value): Perhaps<C.Core>;
    prettyPrint(): string;
    toString(): string;
}
export declare class Application extends Source {
    location: Location;
    func: Source;
    arg: Source;
    args: Source[];
    constructor(location: Location, func: Source, arg: Source, args: Source[]);
    protected synthHelper(ctx: Context, renames: Renaming): Perhaps<C.The>;
    findNames(): string[];
    prettyPrint(): string;
    toString(): string;
}
export declare class DefineDatatype extends Source {
    location: Location;
    typeName: string;
    parameters: TypedBinder[];
    indices: TypedBinder[];
    resultType: Source;
    constructors: Constructor[];
    constructor(location: Location, typeName: string, parameters: TypedBinder[], // Type parameters [A : Type]
    indices: TypedBinder[], // Index parameters [i : Nat] 
    resultType: Source, // The result universe (Type)
    constructors: Constructor[]);
    protected synthHelper(ctx: Context, renames: Renaming): Perhaps<C.The>;
    findNames(): string[];
    prettyPrint(): string;
}
export declare class Constructor extends Source {
    location: Location;
    name: string;
    args: TypedBinder[];
    resultType: Source;
    protected synthHelper(ctx: Context, renames: Renaming): Perhaps<C.The>;
    constructor(location: Location, name: string, args: TypedBinder[], // Constructor args
    resultType: Source);
    findNames(): string[];
    prettyPrint(): string;
}
export declare class GenericEliminator extends Source {
    location: Location;
    typeName: string;
    target: Source;
    motive: Source;
    methods: Source[];
    constructor(location: Location, typeName: string, target: Source, motive: Source, methods: Source[]);
    protected synthHelper(ctx: Context, renames: Renaming): Perhaps<C.The>;
    findNames(): string[];
    prettyPrint(): string;
}
//# sourceMappingURL=source.d.ts.map