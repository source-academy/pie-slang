import { Environment } from './environment';
import * as V from "./value";

export abstract class Core {
  public abstract valOf(env: Environment, expression: Core): V.Value;
}

export class The extends Core {
  constructor(
    public type: Core,
    public expr: Core
  ) {
    super();
  }

  public valOf(env: Environment, expression: Core): V.Value {
    return this.valOf(env, this.expr);
  }
}

export class U extends Core {

  public valOf(env: Environment, expression: Core): V.Value {
    return new V.Universe();
  }
}

export class Nat extends Core {

  public valOf(env: Environment, expression: Core): V.Value {
    return new V.Nat();
  }
}

export class Zero extends Core {

  public valOf(env: Environment, expression: Core): V.Value {
    return new V.Zero();
  }
}

export class VarName extends Core {
  constructor(
    public name: string
  ) {
    super();
  }

  public valOf(env: Environment, expression: Core): V.Value {
    if(isV)
  }
}

export class Add1 extends Core {
  constructor(
    public n: Core
  ) {
    super();
  }

  accept(visitor: CoreVisitor) {
    visitor.visitAdd1(this);
  }
  public valOf(env: Environment, expression: Core): V.Value {
    
  }
}

export class WhichNat extends Core {
  constructor(
    public target: Core,
    public base: The,
    public step: Core
  ) {
    super();
  }

  accept(visitor: CoreVisitor) {
    visitor.visitWhichNat(this);
  }
  public valOf(env: Environment, expression: Core): V.Value {
    
  }
}

export class IterNat extends Core {
  constructor(
    public target: Core,
    public base: The,
    public step: Core
  ) {
    super();
  }

  accept(visitor: CoreVisitor) {
    visitor.visitIterNat(this);
  }
  public valOf(env: Environment, expression: Core): V.Value {
    
  }
}

export class RecNat extends Core {
  constructor(
    public target: Core,
    public base: The,
    public step: Core
  ) {
    super();
  }

  accept(visitor: CoreVisitor) {
    visitor.visitRecNat(this);
  }
  public valOf(env: Environment, expression: Core): V.Value {
    
  }
}

export class IndNat extends Core {
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
  public valOf(env: Environment, expression: Core): V.Value {
    
  }
}

export class Pi extends Core {
  constructor(
    public bindings: Array<[Symbol, Core]>,
    public body: Core
  ) {
    super();
  }

  accept(visitor: CoreVisitor) {
    visitor.visitPi(this);
  }
  public valOf(env: Environment, expression: Core): V.Value {
    
  }
}

export class Lambda extends Core {
  constructor(
    public params: Array<Symbol>,
    public body: Core
  ) {
    super();
  }

  accept(visitor: CoreVisitor) {
    visitor.visitLambda(this);
  }
  public valOf(env: Environment, expression: Core): V.Value {
    
  }
}

export class Atom extends Core {
  accept(visitor: CoreVisitor) {
    visitor.visitAtom(this);
  }
  public valOf(env: Environment, expression: Core): V.Value {
    
  }
}

export class Quote extends Core {
  constructor(
    public sym: Symbol
  ) {
    super();
  }

  accept(visitor: CoreVisitor) {
    visitor.visitQuote(this);
  }
  public valOf(env: Environment, expression: Core): V.Value {
    
  }
}

export class Sigma extends Core {
  constructor(
    public bindings: Array<[Symbol, Core]>,
    public body: Core
  ) {
    super();
  }

  accept(visitor: CoreVisitor) {
    visitor.visitSigma(this);
  }
  public valOf(env: Environment, expression: Core): V.Value {
    
  }
}

export class Cons extends Core {
  constructor(
    public first: Core,
    public second: Core
  ) {
    super();
  }

  accept(visitor: CoreVisitor) {
    visitor.visitCons(this);
  }
  public valOf(env: Environment, expression: Core): V.Value {
    
  }
}

export class Car extends Core {
  constructor(
    public pair: Core
  ) {
    super();
  }

  accept(visitor: CoreVisitor) {
    visitor.visitCar(this);
  }
  public valOf(env: Environment, expression: Core): V.Value {
    
  }
}

export class Cdr extends Core {
  constructor(
    public pair: Core
  ) {
    super();
  }

  accept(visitor: CoreVisitor) {
    visitor.visitCdr(this);
  }
  public valOf(env: Environment, expression: Core): V.Value {
    
  }
}

export class ConsList extends Core {
  constructor(
    public head: Core,
    public tail: Core
  ) {
    super();
  }

  accept(visitor: CoreVisitor) {
    visitor.visitConsList(this);
  }
  public valOf(env: Environment, expression: Core): V.Value {
    
  }
}

export class Nil extends Core {
  accept(visitor: CoreVisitor) {
    visitor.visitNil(this);
  }
  public valOf(env: Environment, expression: Core): V.Value {
    
  }
}

export class List extends Core {
  constructor(
    public elemType: Core
  ) {
    super();
  }

  accept(visitor: CoreVisitor) {
    visitor.visitList(this);
  }
  public valOf(env: Environment, expression: Core): V.Value {
    
  }
}

export class RecList extends Core {
  constructor(
    public target: Core,
    public base: The,
    public step: Core
  ) {
    super();
  }

  accept(visitor: CoreVisitor) {
    visitor.visitRecList(this);
  }
  public valOf(env: Environment, expression: Core): V.Value {
    
  }
}

export class IndList extends Core {
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
  public valOf(env: Environment, expression: Core): V.Value {
    
  }
}

export class Absurd extends Core {
  accept(visitor: CoreVisitor) {
    visitor.visitAbsurd(this);
  }
  public valOf(env: Environment, expression: Core): V.Value {
    
  }
}

export class Trivial extends Core {
  accept(visitor: CoreVisitor) {
    visitor.visitTrivial(this);
  }
  public valOf(env: Environment, expression: Core): V.Value {
    
  }
}

export class IndAbsurd extends Core {
  constructor(
    public target: Core,
    public motive: Core
  ) {
    super();
  }

  accept(visitor: CoreVisitor) {
    visitor.visitIndAbsurd(this);
  }
  public valOf(env: Environment, expression: Core): V.Value {
    
  }
}

export class Equal extends Core {
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
  public valOf(env: Environment, expression: Core): V.Value {
    
  }
}

export class Same extends Core {
  constructor(
    public expr: Core
  ) {
    super();
  }

  accept(visitor: CoreVisitor) {
    visitor.visitSame(this);
  }
  public valOf(env: Environment, expression: Core): V.Value {
    
  }
}

export class Replace extends Core {
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
  public valOf(env: Environment, expression: Core): V.Value {
    
  }
}

export class Trans extends Core {
  constructor(
    public left: Core,
    public right: Core
  ) {
    super();
  }

  accept(visitor: CoreVisitor) {
    visitor.visitTrans(this);
  }
  public valOf(env: Environment, expression: Core): V.Value {
    
  }
}

export class Cong extends Core {
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
  public valOf(env: Environment, expression: Core): V.Value {
    
  }
}

export class Symm extends Core {
  constructor(
    public equality: Core
  ) {
    super();
  }

  accept(visitor: CoreVisitor) {
    visitor.visitSymm(this);
  }
  public valOf(env: Environment, expression: Core): V.Value {
    
  }
}

export class IndEqual extends Core {
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
  public valOf(env: Environment, expression: Core): V.Value {
    
  }
}

export class Vec extends Core {
  constructor(
    public elemType: Core,
    public length: Core
  ) {
    super();
  }

  accept(visitor: CoreVisitor) {
    visitor.visitVec(this);
  }
  public valOf(env: Environment, expression: Core): V.Value {
    
  }
}

export class VecCons extends Core {
  constructor(
    public head: Core,
    public tail: Core
  ) {
    super();
  }

  accept(visitor: CoreVisitor) {
    visitor.visitVecCons(this);
  }
  public valOf(env: Environment, expression: Core): V.Value {
    
  }
}

export class VecNil extends Core {
  accept(visitor: CoreVisitor) {
    visitor.visitVecNil(this);
  }
  public valOf(env: Environment, expression: Core): V.Value {
    
  }
}

export class Head extends Core {
  constructor(
    public vec: Core
  ) {
    super();
  }

  accept(visitor: CoreVisitor) {
    visitor.visitHead(this);
  }
  public valOf(env: Environment, expression: Core): V.Value {
    
  }
}

export class Tail extends Core {
  constructor(
    public vec: Core
  ) {
    super();
  }

  accept(visitor: CoreVisitor) {
    visitor.visitTail(this);
  }
  public valOf(env: Environment, expression: Core): V.Value {
    
  }
}

export class IndVec extends Core {
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
  public valOf(env: Environment, expression: Core): V.Value {
    
  }
}

export class Either extends Core {
  constructor(
    public left: Core,
    public right: Core
  ) {
    super();
  }

  accept(visitor: CoreVisitor) {
    visitor.visitEither(this);
  }
  public valOf(env: Environment, expression: Core): V.Value {
    
  }
}

export class Left extends Core {
  constructor(
    public value: Core
  ) {
    super();
  }

  accept(visitor: CoreVisitor) {
    visitor.visitLeft(this);
  }
  public valOf(env: Environment, expression: Core): V.Value {
    
  }
}

export class Right extends Core {
  constructor(
    public value: Core
  ) {
    super();
  }

  accept(visitor: CoreVisitor) {
    visitor.visitRight(this);
  }

  public valOf(env: Environment, expression: Core): V.Value {
    
  }
}

export class IndEither extends Core {
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

  public valOf(env: Environment, expression: Core): V.Value {
    
  }
}

export class TODO extends Core {
  constructor(
    public loc: Location,
    public type: Core
  ) {
    super();
  }

  accept(visitor: CoreVisitor) {
    visitor.visitTODO(this);
  }

  public valOf(env: Environment, expression: Core): V.Value {
    
  }
}

export class Application extends Core {
  constructor(
    public fn: Core,
    public arg: Core
  ) {
    super();
  }

  accept(visitor: CoreVisitor) {
    visitor.visitApplication(this);
  }

  public valOf(env: Environment, expression: Core): V.Value {
    
  }
}