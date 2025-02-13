import { Value } from "./value";
import { SourceLocation } from "./utils";

/*
    Normal forms consist of syntax that is produced by read-back,
    following the type. This structure contains a type value and a
    value described by the type, so that read-back can later be applied
    to it.
*/
export class Norm {
  constructor(public type: Value, public value: Value) { }
}

// Predicate function to check if an object is Norm
export function isNorm(obj: any): obj is Norm {
  return obj instanceof Norm;
}


/*
    ## Neutral Expressions ##
    Neutral expressions are represented by structs that ensure that no
    non-neutral expressions can be represented.
*/

// Base class for all Neutral types
export abstract class Neutral {
  constructor() { } 
}

export class Variable extends Neutral {
  constructor(public name: string) {
    super();
  }
}

export class TODO extends Neutral {
  constructor(public where: SourceLocation, public type: Value) {
    super();
  }
}

export class WhichNat extends Neutral {
  constructor(public target: Neutral, public base: Norm, public step: Norm) {
    super();
  }
}

export class IterNat extends Neutral {
  constructor(public target: Neutral, public base: Norm, public step: Norm) {
    super();
  }
}

export class RecNat extends Neutral {
  constructor(public target: Neutral, public base: Norm, public step: Norm) {
    super();
  }
}

export class IndNat extends Neutral {
  constructor(
    public target: Neutral,
    public motive: Norm,
    public base: Norm,
    public step: Norm
  ) {
    super();
  }
}

export class Car extends Neutral {
  constructor(public target: Neutral) {
    super();
  }
}

export class Cdr extends Neutral {
  constructor(public target: Neutral) {
    super();
  }
}

export class RecList extends Neutral {
  constructor(public target: Neutral, public base: Norm, public step: Norm) {
    super();
  }
}

export class IndList extends Neutral {
  constructor(public target: Neutral, public motive: Norm, public base: Norm, public step: Norm) {
    super();
  }
}

export class IndAbsurd extends Neutral {
  constructor(public target: Neutral, public motive: Norm) {
    super();
  }
}

export class Replace extends Neutral {
  constructor(public target: Neutral, public motive: Norm, public base: Norm) {
    super();
  }
}

export class Trans1 extends Neutral {
  constructor(public target1: Neutral, public target2: Norm) {
    super();
  }
}

export class Trans2 extends Neutral {
  constructor(public target1: Norm, public target2: Neutral) {
    super();
  }
}

export class Trans12 extends Neutral {
  constructor(public target1: Neutral, public target2: Neutral) {
    super();
  }
}

export class Cong extends Neutral {
  constructor(public target: Neutral, public func: Norm) {
    super();
  }
}

export class Symm extends Neutral {
  constructor(public target: Neutral) {
    super();
  }
}

export class IndEq extends Neutral {
  constructor(public target: Neutral, public motive: Norm, public base: Norm) {
    super();
  }
}

export class Head extends Neutral {
  constructor(public target: Neutral) {
    super();
  }
}

export class Tail extends Neutral {
  constructor(public target: Neutral) {
    super();
  }
}

export class IndVec1 extends Neutral {
  constructor(
    public target1: Neutral,
    public target2: Norm,
    public motive: Norm,
    public base: Norm,
    public step: Norm
  ) {
    super();
  }
}

export class IndVec2 extends Neutral {
  constructor(
    public target1: Norm,
    public target2: Neutral,
    public motive: Norm,
    public base: Norm,
    public step: Norm
  ) {
    super();
  }
}

export class IndVec12 extends Neutral {
  constructor(
    public target1: Neutral,
    public target2: Neutral,
    public motive: Norm,
    public base: Norm,
    public step: Norm
  ) {
    super();
  }
}

export class IndEither extends Neutral {
  constructor(
    public target: Neutral,
    public motive: Norm,
    public baseLeft: Norm,
    public baseRight: Norm
  ) {
    super();
  }
}

export class Application extends Neutral {
  constructor(public operator: Neutral, public operand: Norm) {
    super();
  }
}

// Predicate function to check if an object is Neutral
export function isNeutral(obj: any): obj is Neutral {
  return obj instanceof Neutral;
}
