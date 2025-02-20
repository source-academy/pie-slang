import { Location } from './../locations';
import { SourceSyntaxVisitor} from './../visitors/basics_visitors';
import { occurringBinderNames, SiteBinder, TypedBinder } from './utils';

export class Source {
  constructor(
    public location: Location,
    public syntax: SourceSyntax,
  ) { }

  /*
    Find all the names that occur in an expression. For correctness, we
    need only find the free identifiers, but finding the bound
    identifiers as well means that the bindings introduced by
    desugaring expressions are more different from the program as
    written, which can help readability of internals.
  */
  public occuringNames(): string[] {
    return this.syntax.findNames();
  }
}

abstract class SourceSyntax {

  public abstract accept(visitor: SourceSyntaxVisitor) : void; 

  public abstract findNames(): string[];

}

export class The extends SourceSyntax {

  // ['the', Source, Source]
  constructor(
    public type: Source,
    public value: Source,
  ) {
    super();
  }

  public accept(visitor: SourceSyntaxVisitor) {
    visitor.visitThe(this);
  }

  public findNames(): string[] {
    return this.type.occuringNames()
      .concat(this.value.occuringNames());
  }
}

export class U extends SourceSyntax {
  // ['U']
  constructor() { super(); }

  public accept(visitor: SourceSyntaxVisitor) {
    visitor.visitU(this);
  }

  public findNames(): string[] {
    return [];
  }
}

export class Nat extends SourceSyntax {
  // ['Nat']
  constructor() { super(); }

  public accept(visitor: SourceSyntaxVisitor) {
    visitor.visitNat(this);
  }

  public findNames(): string[] {
    return [];
  }
}

export class Zero extends SourceSyntax {
  // ['zero']
  constructor() { super(); }

  public accept(visitor: SourceSyntaxVisitor) {
    visitor.visitZero(this);
  }

  public findNames(): string[] {
    return [];
  }
}

export class Name extends SourceSyntax {
  // [string]
  constructor(
    public name: string,
  ) { super(); }

  public accept(visitor: SourceSyntaxVisitor) {
    visitor.visitName(this);
  }

  public findNames(): string[] {
    return [this.name];
  }
}

export class Atom extends SourceSyntax {
  constructor() { super(); }

  public accept(visitor: SourceSyntaxVisitor) {
    visitor.visitAtom(this);
  }

  public findNames(): string[] {
    return [];
  }
}

export class Quote extends SourceSyntax {
  constructor(
    public name: string,
  ) { super(); }

  public accept(visitor: SourceSyntaxVisitor) {
    visitor.visitQuote(this);
  }

  public findNames(): string[] {
    return [];
  }
}

// Natural number operations
export class Add1 extends SourceSyntax {
  constructor(
    public base: Source,
  ) { super(); }

  public accept(visitor: SourceSyntaxVisitor) {
    visitor.visitAdd1(this);
  }

  public findNames(): string[] {
    return this.base.occuringNames();
  }
}

export class WhichNat extends SourceSyntax {
  constructor(
    public target: Source,
    public base: Source,
    public step: Source,
  ) { super(); }
  public accept(visitor: SourceSyntaxVisitor) {
    visitor.visitWhichNat(this);
  }

  public findNames(): string[] {
    return this.target.occuringNames()
      .concat(this.base.occuringNames())
      .concat(this.step.occuringNames());
  }
}

export class IterNat extends SourceSyntax {
  constructor(
    public target: Source,
    public base: Source,
    public step: Source,
  ) { super(); }

  public accept(visitor: SourceSyntaxVisitor) {
    visitor.visitIterNat(this);
  }

  public findNames(): string[] {
    return this.target.occuringNames()
      .concat(this.base.occuringNames())
      .concat(this.step.occuringNames());
  }
}

export class RecNat extends SourceSyntax {
  constructor(
    public target: Source,
    public base: Source,
    public step: Source,
  ) { super(); }

  public accept(visitor: SourceSyntaxVisitor) {
    visitor.visitRecNat(this);
  }

  public findNames(): string[] {
    return this.target.occuringNames()
      .concat(this.base.occuringNames())
      .concat(this.step.occuringNames());
  }
}

export class IndNat extends SourceSyntax {
  constructor(
    public target: Source,
    public motive: Source,
    public base: Source,
    public step: Source,
  ) { super(); }

  public accept(visitor: SourceSyntaxVisitor) {
    visitor.visitIndNat(this);
  }

  public findNames(): string[] {
    return this.target.occuringNames()
      .concat(this.motive.occuringNames())
      .concat(this.base.occuringNames())
      .concat(this.step.occuringNames());
  }
}

// Function types and operations
export class Arrow extends SourceSyntax {

  constructor(
    public arg1: Source,
    public arg2: Source,
    public args: Source[],
  ) { super(); }

  public accept(visitor: SourceSyntaxVisitor) {
    visitor.visitArrow(this);
  }

  public findNames(): string[] {
    return this.arg1.occuringNames()
      .concat(this.arg2.occuringNames())
      .concat(this.args.flatMap(arg => arg.occuringNames()));
  }
}

export class Pi extends SourceSyntax {
  constructor(
    public binders: TypedBinder[],
    public body: Source,
  ) { super(); }
  public accept(visitor: SourceSyntaxVisitor) {
    visitor.visitPi(this);
  }

  public findNames(): string[] {
    // TEST THIS
    return this.binders.flatMap(binder => occurringBinderNames(binder))
      .concat(this.body.occuringNames());
  }
}

export class Lambda extends SourceSyntax {
  constructor(
    public binders: SiteBinder[],
    public body: Source,
  ) { super(); }

  public accept(visitor: SourceSyntaxVisitor) {
    visitor.visitLambda(this);
  }

  public findNames(): string[] { 
    return this.binders.map(binder => binder.varName)
      .concat(this.body.occuringNames());
  }
}

// Product types and operations
export class Sigma extends SourceSyntax {

  constructor(
    public binders: TypedBinder[],
    public body: Source,
  ) { super(); }

  public accept(visitor: SourceSyntaxVisitor) {
    visitor.visitSigma(this);
  }

  public findNames(): string[] {
    return this.binders.flatMap(binder => occurringBinderNames(binder))
      .concat(this.body.occuringNames());
  }
}

export class Pair extends SourceSyntax {
  constructor(
    public first: Source,
    public second: Source,
  ) { super(); }

  public accept(visitor: SourceSyntaxVisitor) {
    visitor.visitPair(this);
  }

  public findNames(): string[] {
    return this.first.occuringNames()
      .concat(this.second.occuringNames());
  }
}

export class Cons extends SourceSyntax {
  constructor(
    public first: Source,
    public second: Source,
  ) { super(); }

  public accept(visitor: SourceSyntaxVisitor) {
    visitor.visitCons(this);
  }

  public findNames(): string[] {
    return this.first.occuringNames()
      .concat(this.second.occuringNames());
  }
}

export class Car extends SourceSyntax {
  constructor(
    public pair: Source,
  ) { super(); }

  public accept(visitor: SourceSyntaxVisitor) {
    visitor.visitCar(this);
  }

  public findNames(): string[] {
    return this.pair.occuringNames();
  }
}

export class Cdr extends SourceSyntax {
  constructor(
    public pair: Source,
  ) { super(); }

  public accept(visitor: SourceSyntaxVisitor) {
    visitor.visitCdr(this);
  }

  public findNames(): string[] {
    return this.pair.occuringNames();
  }
}

// Basic constructors
export class Trivial extends SourceSyntax {

  constructor() { super(); }

  public accept(visitor: SourceSyntaxVisitor) {
    visitor.visitTrivial(this);
  }

  public findNames(): string[] {
    return [];
  }
}

export class Sole extends SourceSyntax {  
  constructor() { super(); }

  public accept(visitor: SourceSyntaxVisitor) {
    visitor.visitSole(this);
  }

  public findNames(): string[] {
    return [];
  }
}

export class Nil extends SourceSyntax {
  constructor() { super(); }

  public accept(visitor: SourceSyntaxVisitor) {
    visitor.visitNil(this);
  }

  public findNames(): string[] {
    return [];
  }
}

export class Number extends SourceSyntax {
  constructor(
    public value: number,
  ) { super(); }

  public accept(visitor: SourceSyntaxVisitor) {
    visitor.visitNumber(this);
  }

  public findNames(): string[] {
    return [];
  }
}

// List operations
export class ConsList extends SourceSyntax {

  constructor(
    public x: Source,
    public xs: Source,
  ) { super(); }

  public accept(visitor: SourceSyntaxVisitor) {
    visitor.visitConsList(this);
  }

  public findNames(): string[] {
    return this.x.occuringNames()
      .concat(this.xs.occuringNames());
  }
}

export class RecList extends SourceSyntax {
  constructor(
    public target: Source,
    public base: Source,
    public step: Source,
  ) { super(); }

  public accept(visitor: SourceSyntaxVisitor) {
    visitor.visitRecList(this);
  }

  public findNames(): string[] {
    return this.target.occuringNames()
      .concat(this.base.occuringNames())
      .concat(this.step.occuringNames());
  }
}

export class IndList extends SourceSyntax {

  constructor(
    public target: Source,
    public motive: Source,
    public base: Source,
    public step: Source,
  ) { super(); }

  public accept(visitor: SourceSyntaxVisitor) {
    visitor.visitIndList(this);
  }

  public findNames(): string[] {
    return this.target.occuringNames()
      .concat(this.motive.occuringNames())
      .concat(this.base.occuringNames())
      .concat(this.step.occuringNames());
  }
}

// Absurd and its operations
export class Absurd extends SourceSyntax {
  constructor() { super(); }

  public accept(visitor: SourceSyntaxVisitor) {
    visitor.visitAbsurd(this);
  }

  public findNames(): string[] {
    return [];
  }
}

export class IndAbsurd extends SourceSyntax {
  constructor(
    public target: Source,
    public motive: Source,
  ) { super(); }

  public accept(visitor: SourceSyntaxVisitor) {
    visitor.visitIndAbsurd(this);
  }

  public findNames(): string[] {
    return this.target.occuringNames()
      .concat(this.motive.occuringNames());
  }
}

// Equality types and operations
export class Equal extends SourceSyntax {
  constructor(
    public type: Source,
    public left: Source,
    public right: Source,
  ) { super(); }

  public accept(visitor: SourceSyntaxVisitor) {
    visitor.visitEqual(this);
  }

  public findNames(): string[] {
    return this.type.occuringNames()
      .concat(this.left.occuringNames())
      .concat(this.right.occuringNames());
  }
}

export class Same extends SourceSyntax {
  constructor(
    public type: Source,
  ) { super(); }

  public accept(visitor: SourceSyntaxVisitor) {
    visitor.visitSame(this);
  }

  public findNames(): string[] {
    return this.type.occuringNames();
  }
}

export class Replace extends SourceSyntax {

  constructor(
    public target: Source,
    public motive: Source,
    public base: Source,
  ) { super(); }

  public accept(visitor: SourceSyntaxVisitor) {
    visitor.visitReplace(this);
  }

  public findNames(): string[] {
    return this.target.occuringNames()
      .concat(this.motive.occuringNames())
      .concat(this.base.occuringNames());
  }
}

export class Trans extends SourceSyntax {
  constructor(
    public left: Source,
    public right: Source,
  ) { super(); }

  public accept(visitor: SourceSyntaxVisitor) {
    visitor.visitTrans(this);
  }

  public findNames(): string[] {
    return this.left.occuringNames()
      .concat(this.right.occuringNames());
  }
}

export class Cong extends SourceSyntax {
  constructor(
    public from: Source,
    public to: Source,
  ) { super(); }

  public accept(visitor: SourceSyntaxVisitor) {
    visitor.visitCong(this);
  }

  public findNames(): string[] {
    return this.from.occuringNames()
      .concat(this.to.occuringNames());
  }
}

export class Symm extends SourceSyntax {
  constructor(
    public equality: Source,
  ) { super(); }

  public accept(visitor: SourceSyntaxVisitor) {
    visitor.visitSymm(this);
  }

  public findNames(): string[] {
    return this.equality.occuringNames();
  }
}

export class IndEqual extends SourceSyntax {
  constructor(
    public from: Source,
    public to: Source,
    public base: Source,
  ) { super(); }

  public accept(visitor: SourceSyntaxVisitor) {
    visitor.visitIndEqual(this);
  }

  public findNames(): string[] {
    return this.from.occuringNames()
      .concat(this.to.occuringNames())
      .concat(this.base.occuringNames());
  }
}

// Vector types and operations
export class Vec extends SourceSyntax {
  constructor(
    public type: Source,
    public length: Source,
  ) { super(); }

  public accept(visitor: SourceSyntaxVisitor) {
    visitor.visitVec(this);
  }

  public findNames(): string[] {
    return this.type.occuringNames()
      .concat(this.length.occuringNames());
  }
}

export class VecNil extends SourceSyntax {
  constructor() { super(); }

  public accept(visitor: SourceSyntaxVisitor) {
    visitor.visitVecNil(this);
  }

  public findNames(): string[] {
    return [];
  }
}

export class VecCons extends SourceSyntax {
  constructor(
    public x: Source,
    public xs: Source,
  ) { super(); }

  public accept(visitor: SourceSyntaxVisitor) {
    visitor.visitVecCons(this);
  }

  public findNames(): string[] {
    return this.x.occuringNames()
      .concat(this.xs.occuringNames());
  }
}

export class Head extends SourceSyntax {
  constructor(
    public vec: Source,
  ) { super(); }

  public accept(visitor: SourceSyntaxVisitor) {
    visitor.visitHead(this);
  }

  public findNames(): string[] {
    return this.vec.occuringNames();
  }
}

export class Tail extends SourceSyntax {
  constructor(
    public vec: Source,
  ) { super(); }

  public accept(visitor: SourceSyntaxVisitor) {
    visitor.visitTail(this);
  }

  public findNames(): string[] {
    return this.vec.occuringNames();
  }
}

export class IndVec extends SourceSyntax {
  constructor(
    public length: Source,
    public target: Source,
    public motive: Source,
    public base: Source,
    public step: Source,
  ) { super(); }

  public accept(visitor: SourceSyntaxVisitor) {
    visitor.visitIndVec(this);
  }

  public findNames(): string[] {
    return this.length.occuringNames()
      .concat(this.target.occuringNames())
      .concat(this.motive.occuringNames())
      .concat(this.base.occuringNames())
      .concat(this.step.occuringNames());
  }
}

// Either type and operations
export class Either extends SourceSyntax {
  constructor(
    public left: Source,
    public right: Source,
  ) { super(); }

  public accept(visitor: SourceSyntaxVisitor) {
    visitor.visitEither(this);
  }

  public findNames(): string[] {
    return this.left.occuringNames()
      .concat(this.right.occuringNames());
  }
}

export class Left extends SourceSyntax {
  constructor(
    public value: Source,
  ) { super(); }

  public accept(visitor: SourceSyntaxVisitor) {
    visitor.visitLeft(this);
  }

  public findNames(): string[] {
    return this.value.occuringNames();
  }
}

export class Right extends SourceSyntax {
  constructor(
    public value: Source,
  ) { super(); }

  public accept(visitor: SourceSyntaxVisitor) {
    visitor.visitRight(this);
  }

  public findNames(): string[] {
    return this.value.occuringNames();
  }
}

export class IndEither extends SourceSyntax {
  constructor(
    public target: Source,
    public motive: Source,
    public baseLeft: Source,
    public baseRight: Source,
  ) { super(); }

  public accept(visitor: SourceSyntaxVisitor) {
    visitor.visitIndEither(this);
  }

  public findNames(): string[] {
    return this.target.occuringNames()
      .concat(this.motive.occuringNames())
      .concat(this.baseLeft.occuringNames())
      .concat(this.baseRight.occuringNames());
  }
}

// Utility
export class TODO extends SourceSyntax {
  constructor() { super(); }

  public accept(visitor: SourceSyntaxVisitor) {
    visitor.visitTODO(this);
  }

  public findNames(): string[] {
    return [];
  }
}

// Application
export class Application extends SourceSyntax {
  constructor(
    public func: Source,
    public arg: Source,
    public args: Source[],
  ) { super(); }

  public accept(visitor: SourceSyntaxVisitor) {
    visitor.visitApplication(this);
  }

  public findNames(): string[] {
    return this.func.occuringNames()
      .concat(this.arg.occuringNames())
      .concat(this.args.flatMap(arg => arg.occuringNames()));
  }
}