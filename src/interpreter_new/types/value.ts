import { ValueVisitor } from "../visitors/basics_visitors";

// Abstract base class for all values
export abstract class Value {
  abstract accept<R>(visitor: ValueVisitor<R>): R;
}

// Singleton values
export class UniverseValue extends Value {
  private static instance: UniverseValue;
  
  private constructor() { super(); }
  
  static getInstance(): UniverseValue {
    if (!UniverseValue.instance) {
      UniverseValue.instance = new UniverseValue();
    }
    return UniverseValue.instance;
  }

  accept<R>(visitor: ValueVisitor<R>): R {
    return visitor.visitUniverse();
  }
}

export class NatValue extends Value {
  private static instance: NatValue;
  
  private constructor() { super(); }
  
  static getInstance(): NatValue {
    if (!NatValue.instance) {
      NatValue.instance = new NatValue();
    }
    return NatValue.instance;
  }

  accept<R>(visitor: ValueVisitor<R>): R {
    return visitor.visitNat();
  }
}

// Complex values
export class Add1Value extends Value {
  constructor(public smaller: Value) {
    super();
  }

  accept<R>(visitor: ValueVisitor<R>): R {
    return visitor.visitAdd1(this);
  }
}

export class QuoteValue extends Value {
  constructor(public name: Symbol) {
    super();
  }

  accept<R>(visitor: ValueVisitor<R>): R {
    return visitor.visitQuote(this);
  }
}

export class PiValue extends Value {
  constructor(
    public argName: Symbol,
    public argType: Value,
    public resultType: Closure
  ) {
    super();
  }

  accept<R>(visitor: ValueVisitor<R>): R {
    return visitor.visitPi(this);
  }
}

export class LamValue extends Value {
  constructor(
    public argName: Symbol,
    public body: Closure
  ) {
    super();
  }

  accept<R>(visitor: ValueVisitor<R>): R {
    return visitor.visitLam(this);
  }
}

export class SigmaValue extends Value {
  constructor(
    public carName: Symbol,
    public carType: Value,
    public cdrType: Closure
  ) {
    super();
  }

  accept<R>(visitor: ValueVisitor<R>): R {
    return visitor.visitSigma(this);
  }
}

export class ConsValue extends Value {
  constructor(
    public car: Value,
    public cdr: Value
  ) {
    super();
  }

  accept<R>(visitor: ValueVisitor<R>): R {
    return visitor.visitCons(this);
  }
}

export class ListValue extends Value {
  constructor(public entryType: Value) {
    super();
  }

  accept<R>(visitor: ValueVisitor<R>): R {
    return visitor.visitList(this);
  }
}

export class ListConsValue extends Value {
  constructor(
    public head: Value,
    public tail: Value
  ) {
    super();
  }

  accept<R>(visitor: ValueVisitor<R>): R {
    return visitor.visitListCons(this);
  }
}

export class EqualValue extends Value {
  constructor(
    public type: Value,
    public from: Value,
    public to: Value
  ) {
    super();
  }

  accept<R>(visitor: ValueVisitor<R>): R {
    return visitor.visitEqual(this);
  }
}

export class SameValue extends Value {
  constructor(public value: Value) {
    super();
  }

  accept<R>(visitor: ValueVisitor<R>): R {
    return visitor.visitSame(this);
  }
}

export class VecValue extends Value {
  constructor(
    public entryType: Value,
    public length: Value
  ) {
    super();
  }

  accept<R>(visitor: ValueVisitor<R>): R {
    return visitor.visitVec(this);
  }
}

export class VecConsValue extends Value {
  constructor(
    public head: Value,
    public tail: Value
  ) {
    super();
  }

  accept<R>(visitor: ValueVisitor<R>): R {
    return visitor.visitVecCons(this);
  }
}

export class EitherValue extends Value {
  constructor(
    public leftType: Value,
    public rightType: Value
  ) {
    super();
  }

  accept<R>(visitor: ValueVisitor<R>): R {
    return visitor.visitEither(this);
  }
}

export class LeftValue extends Value {
  constructor(public value: Value) {
    super();
  }

  accept<R>(visitor: ValueVisitor<R>): R {
    return visitor.visitLeft(this);
  }
}

export class RightValue extends Value {
  constructor(public value: Value) {
    super();
  }

  accept<R>(visitor: ValueVisitor<R>): R {
    return visitor.visitRight(this);
  }
}

export class NeuValue extends Value {
  constructor(
    public type: Value,
    public neutral: Neutral
  ) {
    super();
  }

  accept<R>(visitor: ValueVisitor<R>): R {
    return visitor.visitNeu(this);
  }
}

export class DelayValue extends Value {
  constructor(public val: Box<DELAY_CLOS | Value>) {
    super();
  }

  accept<R>(visitor: ValueVisitor<R>): R {
    return visitor.visitDelay(this);
  }
}

// Helper types
export class Box<Type> {
  constructor(public contents: Type) {}
}

export class DELAY_CLOS {
  constructor(
    public env: Env,
    public expr: Core
  ) {}
}