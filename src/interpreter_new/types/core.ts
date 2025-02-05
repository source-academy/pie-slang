import { CoreVisitor } from "../visitors/basics_visitors";

export abstract class Core {
  public abstract accept(visitor: CoreVisitor): void;
}

export class C_The extends Core {
  constructor(
    public type: Core,
    public expr: Core
  ) {
    super();
  }

  accept(visitor: CoreVisitor) {
    visitor.visitThe(this);
  }
}

export class C_U extends Core {
  accept(visitor: CoreVisitor) {
    visitor.visitU(this);
  }
}

export class C_Nat extends Core {
  accept(visitor: CoreVisitor) {
    visitor.visitNat(this);
  }
}

export class C_Zero extends Core {
  accept(visitor: CoreVisitor) {
    visitor.visitZero(this);
  }
}

export class C_Symbol extends Core {
  constructor(
    public name: Symbol
  ) {
    super();
  }

  accept(visitor: CoreVisitor) {
    visitor.visitSymbol(this);
  }
}

export class C_Add1 extends Core {
  constructor(
    public n: Core
  ) {
    super();
  }

  accept(visitor: CoreVisitor) {
    visitor.visitAdd1(this);
  }
}

export class C_WhichNat extends Core {
  constructor(
    public target: Core,
    public base: C_The,
    public step: Core
  ) {
    super();
  }

  accept(visitor: CoreVisitor) {
    visitor.visitWhichNat(this);
  }
}

export class C_IterNat extends Core {
  constructor(
    public target: Core,
    public base: C_The,
    public step: Core
  ) {
    super();
  }

  accept(visitor: CoreVisitor) {
    visitor.visitIterNat(this);
  }
}

export class C_RecNat extends Core {
  constructor(
    public target: Core,
    public base: C_The,
    public step: Core
  ) {
    super();
  }

  accept(visitor: CoreVisitor) {
    visitor.visitRecNat(this);
  }
}

export class C_IndNat extends Core {
  constructor(
    public target: Core,
    public motive: Core,
    public base: Core,
    public step: Core
  ) {
    super();
  }

  accept(visitor: CoreVisitor) {
    visitor.visitIndNat(this);
  }
}

export class C_Pi extends Core {
  constructor(
    public bindings: Array<[Symbol, Core]>,
    public body: Core
  ) {
    super();
  }

  accept(visitor: CoreVisitor) {
    visitor.visitPi(this);
  }
}

export class C_Lambda extends Core {
  constructor(
    public params: Array<Symbol>,
    public body: Core
  ) {
    super();
  }

  accept(visitor: CoreVisitor) {
    visitor.visitLambda(this);
  }
}

export class C_Atom extends Core {
  accept(visitor: CoreVisitor) {
    visitor.visitAtom(this);
  }
}

export class C_Quote extends Core {
  constructor(
    public sym: Symbol
  ) {
    super();
  }

  accept(visitor: CoreVisitor) {
    visitor.visitQuote(this);
  }
}

export class C_Sigma extends Core {
  constructor(
    public bindings: Array<[Symbol, Core]>,
    public body: Core
  ) {
    super();
  }

  accept(visitor: CoreVisitor) {
    visitor.visitSigma(this);
  }
}

export class C_Cons extends Core {
  constructor(
    public first: Core,
    public second: Core
  ) {
    super();
  }

  accept(visitor: CoreVisitor) {
    visitor.visitCons(this);
  }
}

export class C_Car extends Core {
  constructor(
    public pair: Core
  ) {
    super();
  }

  accept(visitor: CoreVisitor) {
    visitor.visitCar(this);
  }
}

export class C_Cdr extends Core {
  constructor(
    public pair: Core
  ) {
    super();
  }

  accept(visitor: CoreVisitor) {
    visitor.visitCdr(this);
  }
}

export class C_ConsList extends Core {
  constructor(
    public head: Core,
    public tail: Core
  ) {
    super();
  }

  accept(visitor: CoreVisitor) {
    visitor.visitConsList(this);
  }
}

export class C_Nil extends Core {
  accept(visitor: CoreVisitor) {
    visitor.visitNil(this);
  }
}

export class C_List extends Core {
  constructor(
    public elemType: Core
  ) {
    super();
  }

  accept(visitor: CoreVisitor) {
    visitor.visitList(this);
  }
}

export class C_RecList extends Core {
  constructor(
    public target: Core,
    public base: C_The,
    public step: Core
  ) {
    super();
  }

  accept(visitor: CoreVisitor) {
    visitor.visitRecList(this);
  }
}

export class C_IndList extends Core {
  constructor(
    public target: Core,
    public motive: Core,
    public base: Core,
    public step: Core
  ) {
    super();
  }

  accept(visitor: CoreVisitor) {
    visitor.visitIndList(this);
  }
}

export class C_Absurd extends Core {
  accept(visitor: CoreVisitor) {
    visitor.visitAbsurd(this);
  }
}

export class C_Trivial extends Core {
  accept(visitor: CoreVisitor) {
    visitor.visitTrivial(this);
  }
}

export class C_IndAbsurd extends Core {
  constructor(
    public target: Core,
    public motive: Core
  ) {
    super();
  }

  accept(visitor: CoreVisitor) {
    visitor.visitIndAbsurd(this);
  }
}

export class C_Equal extends Core {
  constructor(
    public type: Core,
    public left: Core,
    public right: Core
  ) {
    super();
  }

  accept(visitor: CoreVisitor) {
    visitor.visitEqual(this);
  }
}

export class C_Same extends Core {
  constructor(
    public expr: Core
  ) {
    super();
  }

  accept(visitor: CoreVisitor) {
    visitor.visitSame(this);
  }
}

export class C_Replace extends Core {
  constructor(
    public target: Core,
    public motive: Core,
    public base: Core
  ) {
    super();
  }

  accept(visitor: CoreVisitor) {
    visitor.visitReplace(this);
  }
}

export class C_Trans extends Core {
  constructor(
    public left: Core,
    public right: Core
  ) {
    super();
  }

  accept(visitor: CoreVisitor) {
    visitor.visitTrans(this);
  }
}

export class C_Cong extends Core {
  constructor(
    public fn: Core,
    public left: Core,
    public right: Core
  ) {
    super();
  }

  accept(visitor: CoreVisitor) {
    visitor.visitCong(this);
  }
}

export class C_Symm extends Core {
  constructor(
    public equality: Core
  ) {
    super();
  }

  accept(visitor: CoreVisitor) {
    visitor.visitSymm(this);
  }
}

export class C_IndEqual extends Core {
  constructor(
    public target: Core,
    public motive: Core,
    public base: Core
  ) {
    super();
  }

  accept(visitor: CoreVisitor) {
    visitor.visitIndEqual(this);
  }
}

export class C_Vec extends Core {
  constructor(
    public elemType: Core,
    public length: Core
  ) {
    super();
  }

  accept(visitor: CoreVisitor) {
    visitor.visitVec(this);
  }
}

export class C_VecCons extends Core {
  constructor(
    public head: Core,
    public tail: Core
  ) {
    super();
  }

  accept(visitor: CoreVisitor) {
    visitor.visitVecCons(this);
  }
}

export class C_VecNil extends Core {
  accept(visitor: CoreVisitor) {
    visitor.visitVecNil(this);
  }
}

export class C_Head extends Core {
  constructor(
    public vec: Core
  ) {
    super();
  }

  accept(visitor: CoreVisitor) {
    visitor.visitHead(this);
  }
}

export class C_Tail extends Core {
  constructor(
    public vec: Core
  ) {
    super();
  }

  accept(visitor: CoreVisitor) {
    visitor.visitTail(this);
  }
}

export class C_IndVec extends Core {
  constructor(
    public length: Core,
    public target: Core,
    public motive: Core,
    public base: Core,
    public step: Core
  ) {
    super();
  }

  accept(visitor: CoreVisitor) {
    visitor.visitIndVec(this);
  }
}

export class C_Either extends Core {
  constructor(
    public left: Core,
    public right: Core
  ) {
    super();
  }

  accept(visitor: CoreVisitor) {
    visitor.visitEither(this);
  }
}

export class C_Left extends Core {
  constructor(
    public value: Core
  ) {
    super();
  }

  accept(visitor: CoreVisitor) {
    visitor.visitLeft(this);
  }
}

export class C_Right extends Core {
  constructor(
    public value: Core
  ) {
    super();
  }

  accept(visitor: CoreVisitor) {
    visitor.visitRight(this);
  }
}

export class C_IndEither extends Core {
  constructor(
    public target: Core,
    public motive: Core,
    public baseLeft: Core,
    public baseRight: Core
  ) {
    super();
  }

  accept(visitor: CoreVisitor) {
    visitor.visitIndEither(this);
  }
}

export class C_TODO extends Core {
  constructor(
    public loc: Location,
    public type: Core
  ) {
    super();
  }

  accept(visitor: CoreVisitor) {
    visitor.visitTODO(this);
  }
}

export class C_Application extends Core {
  constructor(
    public fn: Core,
    public arg: Core
  ) {
    super();
  }

  accept(visitor: CoreVisitor) {
    visitor.visitApplication(this);
  }
}