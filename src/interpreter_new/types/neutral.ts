import { Value, Pi, Absurd } from "./value";
import { SourceLocation } from "../locations";
import * as C from "./core";
import { Context } from "./contexts";
import { readBack } from "../normalize/utils";

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

  public abstract readBackNeutral(context: Context): C.Core;
}

export class Variable extends Neutral {
  constructor(public name: string) {
    super();
  }

  public readBackNeutral(context: Context): C.Core {
    return new C.VarName(this.name);
  }
}

export class TODO extends Neutral {
  constructor(public where: SourceLocation, public type: Value) {
    super();
  }

  public readBackNeutral(context: Context): C.Core {
    return new C.TODO(
      this.where, this.type.readBackType(context)
    );
  }
}

export class WhichNat extends Neutral {
  constructor(public target: Neutral, public base: Norm, public step: Norm) {
    super();
  }

  public readBackNeutral(context: Context): C.Core {
    return new C.WhichNat(
      this.target.readBackNeutral(context),
      new C.The(
        this.base.type.readBackType(context),
        readBack(context, this.base.type, this.base.value),
      ),
      readBack(context, this.step.type, this.step.value)
    );
  }
}

export class IterNat extends Neutral {
  constructor(public target: Neutral, public base: Norm, public step: Norm) {
    super();
  }
  public readBackNeutral(context: Context): C.Core {
    return new C.IterNat(
      this.target.readBackNeutral(context),
      new C.The(
        this.base.type.readBackType(context),
        readBack(context, this.base.type, this.base.value),
      ),
      readBack(context, this.step.type, this.step.value)
    );
  }
}

export class RecNat extends Neutral {
  constructor(public target: Neutral, public base: Norm, public step: Norm) {
    super();
  }

  public readBackNeutral(context: Context): C.Core {
    return new C.RecNat(
      this.target.readBackNeutral(context),
      new C.The(
        this.base.type.readBackType(context),
        readBack(context, this.base.type, this.base.value),
      ),
      readBack(context, this.step.type, this.step.value)
    );
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

  public readBackNeutral(context: Context): C.Core {
    return new C.IndNat(
      this.target.readBackNeutral(context),
      readBack(context, this.motive.type, this.motive.value),
      readBack(context, this.base.type, this.base.value),
      readBack(context, this.step.type, this.step.value)
    );
  }
}

export class Car extends Neutral {
  constructor(public target: Neutral) {
    super();
  }

  public readBackNeutral(context: Context): C.Core {
    return new C.Car(this.target.readBackNeutral(context));
  }
}

export class Cdr extends Neutral {
  constructor(public target: Neutral) {
    super();
  }

  public readBackNeutral(context: Context): C.Core {
    return new C.Cdr(this.target.readBackNeutral(context));
  }
}

export class RecList extends Neutral {
  constructor(public target: Neutral, public base: Norm, public step: Norm) {
    super();
  }

  public readBackNeutral(context: Context): C.Core {
    return new C.RecList(
      this.target.readBackNeutral(context),
      new C.The(
        this.base.type.readBackType(context),
        readBack(context, this.base.type, this.base.value),
      ),
      readBack(context, this.step.type, this.step.value)
    );
  }
}

export class IndList extends Neutral {
  constructor(public target: Neutral, public motive: Norm, public base: Norm, public step: Norm) {
    super();
  }

  public readBackNeutral(context: Context): C.Core {
    return new C.IndList(
      this.target.readBackNeutral(context),
      readBack(context, this.motive.type, this.motive.value),
      readBack(context, this.base.type, this.base.value),
      readBack(context, this.step.type, this.step.value)
    );
  }
}

export class IndAbsurd extends Neutral {
  constructor(public target: Neutral, public motive: Norm) {
    super();
  }

  public readBackNeutral(context: Context): C.Core {
    // Here's some Absurd η. The rest is in α-equiv?.
    return new C.IndAbsurd(
      new C.The(
        new C.Absurd(),
        this.target.readBackNeutral(context)
      ),
      readBack(context, this.motive.type, this.motive.value)
    );
  }
}

export class Replace extends Neutral {
  constructor(public target: Neutral, public motive: Norm, public base: Norm) {
    super();
  }

  public readBackNeutral(context: Context): C.Core {
    return new C.Replace(
      this.target.readBackNeutral(context),
      readBack(context, this.motive.type, this.motive.value),
      readBack(context, this.base.type, this.base.value)
    );
  }
}

export class Trans1 extends Neutral {
  constructor(public target1: Neutral, public target2: Norm) {
    super();
  }

  public readBackNeutral(context: Context): C.Core {
    return new C.Trans(
      this.target1.readBackNeutral(context),
      readBack(context, this.target2.type, this.target2.value)
    );
  }
}

export class Trans2 extends Neutral {
  constructor(public target1: Norm, public target2: Neutral) {
    super();
  }

  public readBackNeutral(context: Context): C.Core {
    return new C.Trans(
      readBack(context, this.target1.type, this.target1.value),
      this.target2.readBackNeutral(context)
    )
  }
}

export class Trans12 extends Neutral {
  constructor(public target1: Neutral, public target2: Neutral) {
    super();
  }

  public readBackNeutral(context: Context): C.Core {
    return new C.Trans(
      this.target1.readBackNeutral(context),
      this.target2.readBackNeutral(context)
    )
  }
}

export class Cong extends Neutral {
  constructor(public target: Neutral, public func: Norm) {
    super();
  }

  public readBackNeutral(context: Context): C.Core {
    const funcType = this.func.type;
    if (funcType instanceof Pi) {
      const closure = funcType.resultType;
      return new C.Cong(
        this.target.readBackNeutral(context),
        closure
          .valOfClosure(new Absurd())
          .readBackType(context),
        readBack(context, this.func.type, this.func.value)
      );
    } else {
      throw new Error("Cong applied to non-Pi type.");
    }
  }
}

export class Symm extends Neutral {
  constructor(public target: Neutral) {
    super();
  }

  public readBackNeutral(context: Context): C.Core {
    return new C.Symm(this.target.readBackNeutral(context));
  }
}

export class IndEqual extends Neutral {
  constructor(public target: Neutral, public motive: Norm, public base: Norm) {
    super();
  }

  public readBackNeutral(context: Context): C.Core {
    return new C.IndEqual(
      this.target.readBackNeutral(context),
      readBack(context, this.motive.type, this.motive.value),
      readBack(context, this.base.type, this.base.value)
    );
  }
}

export class Head extends Neutral {
  constructor(public target: Neutral) {
    super();
  }

  public readBackNeutral(context: Context): C.Core {
    return new C.Head(this.target.readBackNeutral(context));
  }
}

export class Tail extends Neutral {
  constructor(public target: Neutral) {
    super();
  }

  public readBackNeutral(context: Context): C.Core {
    return new C.Tail(this.target.readBackNeutral(context));
  }
}

export class IndVec1 extends Neutral {
  constructor(
    public length: Neutral,
    public target: Norm,
    public motive: Norm,
    public base: Norm,
    public step: Norm
  ) {
    super();
  }

  public readBackNeutral(context: Context): C.Core {
      return new C.IndVec(
        this.length.readBackNeutral(context),
        readBack(context, this.target.type, this.target.value),
        readBack(context, this.motive.type, this.motive.value),
        readBack(context, this.base.type, this.base.value),
        readBack(context, this.step.type, this.step.value
      ));
  }
}

export class IndVec2 extends Neutral {
  constructor(
    public length: Norm,
    public target: Neutral,
    public motive: Norm,
    public base: Norm,
    public step: Norm
  ) {
    super();
  }

  public readBackNeutral(context: Context): C.Core {
    return new C.IndVec(
      readBack(context, this.length.type, this.length.value),
      this.target.readBackNeutral(context),
      readBack(context, this.motive.type, this.motive.value),
      readBack(context, this.base.type, this.base.value),
      readBack(context, this.step.type, this.step.value)
    );
  }
}

export class IndVec12 extends Neutral {
  constructor(
    public length: Neutral,
    public target: Neutral,
    public motive: Norm,
    public base: Norm,
    public step: Norm
  ) {
    super();
  }

  public readBackNeutral(context: Context): C.Core {
    return new C.IndVec(
      this.length.readBackNeutral(context),
      this.target.readBackNeutral(context),
      readBack(context, this.motive.type, this.motive.value),
      readBack(context, this.base.type, this.base.value),
      readBack(context, this.step.type, this.step.value)
    );
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

  public readBackNeutral(context: Context): C.Core {
    return new C.IndEither(
      this.target.readBackNeutral(context),
      readBack(context, this.motive.type, this.motive.value),
      readBack(context, this.baseLeft.type, this.baseLeft.value),
      readBack(context, this.baseRight.type, this.baseRight.value)
    );
  }
}

export class Application extends Neutral {
  constructor(public operator: Neutral, public operand: Norm) {
    super();
  }

  public readBackNeutral(context: Context): C.Core {
    return new C.Application(
      this.operator.readBackNeutral(context),
      readBack(context, this.operand.type, this.operand.value)
    );
  }
}

// Predicate function to check if an object is Neutral
export function isNeutral(obj: any): obj is Neutral {
  return obj instanceof Neutral;
}
