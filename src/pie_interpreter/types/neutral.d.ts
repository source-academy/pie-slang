import * as C from "./core";
import { Value } from "./value";
import { SourceLocation } from "../utils/locations";
import { Context } from "../utils/context";
export declare class Norm {
    type: Value;
    value: Value;
    constructor(type: Value, value: Value);
}
export declare function isNorm(obj: any): obj is Norm;
export declare abstract class Neutral {
    constructor();
    abstract readBackNeutral(context: Context): C.Core;
    abstract prettyPrint(): any;
    toString(): any;
}
export declare class Variable extends Neutral {
    name: string;
    constructor(name: string);
    readBackNeutral(context: Context): C.Core;
    prettyPrint(): string;
}
export declare class TODO extends Neutral {
    where: SourceLocation;
    type: Value;
    constructor(where: SourceLocation, type: Value);
    readBackNeutral(context: Context): C.Core;
    prettyPrint(): string;
}
export declare class WhichNat extends Neutral {
    target: Neutral;
    base: Norm;
    step: Norm;
    constructor(target: Neutral, base: Norm, step: Norm);
    readBackNeutral(context: Context): C.Core;
    prettyPrint(): string;
}
export declare class IterNat extends Neutral {
    target: Neutral;
    base: Norm;
    step: Norm;
    constructor(target: Neutral, base: Norm, step: Norm);
    readBackNeutral(context: Context): C.Core;
    prettyPrint(): string;
}
export declare class RecNat extends Neutral {
    target: Neutral;
    base: Norm;
    step: Norm;
    constructor(target: Neutral, base: Norm, step: Norm);
    readBackNeutral(context: Context): C.Core;
    prettyPrint(): string;
}
export declare class IndNat extends Neutral {
    target: Neutral;
    motive: Norm;
    base: Norm;
    step: Norm;
    constructor(target: Neutral, motive: Norm, base: Norm, step: Norm);
    readBackNeutral(context: Context): C.Core;
    prettyPrint(): string;
}
export declare class Car extends Neutral {
    target: Neutral;
    constructor(target: Neutral);
    readBackNeutral(context: Context): C.Core;
    prettyPrint(): string;
}
export declare class Cdr extends Neutral {
    target: Neutral;
    constructor(target: Neutral);
    readBackNeutral(context: Context): C.Core;
    prettyPrint(): string;
}
export declare class RecList extends Neutral {
    target: Neutral;
    base: Norm;
    step: Norm;
    constructor(target: Neutral, base: Norm, step: Norm);
    readBackNeutral(context: Context): C.Core;
    prettyPrint(): string;
}
export declare class IndList extends Neutral {
    target: Neutral;
    motive: Norm;
    base: Norm;
    step: Norm;
    constructor(target: Neutral, motive: Norm, base: Norm, step: Norm);
    readBackNeutral(context: Context): C.Core;
    prettyPrint(): string;
}
export declare class IndAbsurd extends Neutral {
    target: Neutral;
    motive: Norm;
    constructor(target: Neutral, motive: Norm);
    readBackNeutral(context: Context): C.Core;
    prettyPrint(): string;
}
export declare class Replace extends Neutral {
    target: Neutral;
    motive: Norm;
    base: Norm;
    constructor(target: Neutral, motive: Norm, base: Norm);
    readBackNeutral(context: Context): C.Core;
    prettyPrint(): string;
}
export declare class Trans1 extends Neutral {
    target1: Neutral;
    target2: Norm;
    constructor(target1: Neutral, target2: Norm);
    readBackNeutral(context: Context): C.Core;
    prettyPrint(): string;
}
export declare class Trans2 extends Neutral {
    target1: Norm;
    target2: Neutral;
    constructor(target1: Norm, target2: Neutral);
    readBackNeutral(context: Context): C.Core;
    prettyPrint(): string;
}
export declare class Trans12 extends Neutral {
    target1: Neutral;
    target2: Neutral;
    constructor(target1: Neutral, target2: Neutral);
    readBackNeutral(context: Context): C.Core;
    prettyPrint(): string;
}
export declare class Cong extends Neutral {
    target: Neutral;
    func: Norm;
    constructor(target: Neutral, func: Norm);
    readBackNeutral(context: Context): C.Core;
    prettyPrint(): string;
}
export declare class Symm extends Neutral {
    target: Neutral;
    constructor(target: Neutral);
    readBackNeutral(context: Context): C.Core;
    prettyPrint(): string;
}
export declare class IndEqual extends Neutral {
    target: Neutral;
    motive: Norm;
    base: Norm;
    constructor(target: Neutral, motive: Norm, base: Norm);
    readBackNeutral(context: Context): C.Core;
    prettyPrint(): string;
}
export declare class Head extends Neutral {
    target: Neutral;
    constructor(target: Neutral);
    readBackNeutral(context: Context): C.Core;
    prettyPrint(): string;
}
export declare class Tail extends Neutral {
    target: Neutral;
    constructor(target: Neutral);
    readBackNeutral(context: Context): C.Core;
    prettyPrint(): string;
}
export declare class IndVec1 extends Neutral {
    length: Neutral;
    target: Norm;
    motive: Norm;
    base: Norm;
    step: Norm;
    constructor(length: Neutral, target: Norm, motive: Norm, base: Norm, step: Norm);
    readBackNeutral(context: Context): C.Core;
    prettyPrint(): string;
}
export declare class IndVec2 extends Neutral {
    length: Norm;
    target: Neutral;
    motive: Norm;
    base: Norm;
    step: Norm;
    constructor(length: Norm, target: Neutral, motive: Norm, base: Norm, step: Norm);
    readBackNeutral(context: Context): C.Core;
    prettyPrint(): string;
}
export declare class IndVec12 extends Neutral {
    length: Neutral;
    target: Neutral;
    motive: Norm;
    base: Norm;
    step: Norm;
    constructor(length: Neutral, target: Neutral, motive: Norm, base: Norm, step: Norm);
    readBackNeutral(context: Context): C.Core;
    prettyPrint(): string;
}
export declare class IndEither extends Neutral {
    target: Neutral;
    motive: Norm;
    baseLeft: Norm;
    baseRight: Norm;
    constructor(target: Neutral, motive: Norm, baseLeft: Norm, baseRight: Norm);
    readBackNeutral(context: Context): C.Core;
    prettyPrint(): string;
}
export declare class GenericEliminator extends Neutral {
    typeName: string;
    target: Neutral;
    motive: Norm;
    methods: Norm[];
    constructor(typeName: string, target: Neutral, motive: Norm, methods: Norm[]);
    readBackNeutral(context: Context): C.Core;
    prettyPrint(): string;
}
export declare class Application extends Neutral {
    operator: Neutral;
    operand: Norm;
    constructor(operator: Neutral, operand: Norm);
    readBackNeutral(context: Context): C.Core;
    prettyPrint(): string;
}
export declare function isNeutral(obj: any): obj is Neutral;
//# sourceMappingURL=neutral.d.ts.map