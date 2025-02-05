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

export class N_Variable extends Neutral {
  constructor(public name: string) {
    super();
  }
}

export class N_TODO extends Neutral {
  constructor(public where: SourceLocation, public type: Value) {
    super();
  }
}

export class N_WhichNat extends Neutral {
  constructor(public target: Neutral, public base: Norm, public step: Norm) {
    super();
  }
}

export class N_IterNat extends Neutral {
  constructor(public target: Neutral, public base: Norm, public step: Norm) {
    super();
  }
}

export class N_RecNat extends Neutral {
  constructor(public target: Neutral, public base: Norm, public step: Norm) {
    super();
  }
}

export class N_IndNat extends Neutral {
  constructor(
    public target: Neutral,
    public motive: Norm,
    public base: Norm,
    public step: Norm
  ) {
    super();
  }
}

export class N_Car extends Neutral {
  constructor(public target: Neutral) {
    super();
  }
}

export class N_Cdr extends Neutral {
  constructor(public target: Neutral) {
    super();
  }
}

export class N_RecList extends Neutral {
  constructor(public target: Neutral, public base: Norm, public step: Norm) {
    super();
  }
}

export class N_IndList extends Neutral {
  constructor(public target: Neutral, public motive: Norm, public base: Norm, public step: Norm) {
    super();
  }
}

export class N_IndAbsurd extends Neutral {
  constructor(public target: Neutral, public motive: Norm) {
    super();
  }
}

export class N_Replace extends Neutral {
  constructor(public target: Neutral, public motive: Norm, public base: Norm) {
    super();
  }
}

export class N_Trans1 extends Neutral {
  constructor(public target1: Neutral, public target2: Norm) {
    super();
  }
}

export class N_Trans2 extends Neutral {
  constructor(public target1: Norm, public target2: Neutral) {
    super();
  }
}

export class N_Trans12 extends Neutral {
  constructor(public target1: Neutral, public target2: Neutral) {
    super();
  }
}

export class N_Cong extends Neutral {
  constructor(public target: Neutral, public func: Norm) {
    super();
  }
}

export class N_Symm extends Neutral {
  constructor(public target: Neutral) {
    super();
  }
}

export class N_IndEq extends Neutral {
  constructor(public target: Neutral, public motive: Norm, public base: Norm) {
    super();
  }
}

export class N_Head extends Neutral {
  constructor(public target: Neutral) {
    super();
  }
}

export class N_Tail extends Neutral {
  constructor(public target: Neutral) {
    super();
  }
}

export class N_IndVec1 extends Neutral {
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

export class N_IndVec2 extends Neutral {
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

export class N_IndVec12 extends Neutral {
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

export class N_IndEither extends Neutral {
  constructor(
    public target: Neutral,
    public motive: Norm,
    public baseLeft: Norm,
    public baseRight: Norm
  ) {
    super();
  }
}

export class N_Ap extends Neutral {
  constructor(public operator: Neutral, public operand: Norm) {
    super();
  }
}

// Predicate function to check if an object is Neutral
export function isNeutral(obj: any): obj is Neutral {
  return obj instanceof Neutral;
}
