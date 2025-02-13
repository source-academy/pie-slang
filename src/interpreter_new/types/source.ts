import { Location } from './../locations';
import { SourceSyntaxVisitor} from './../visitors/basics_visitors';
import { SiteBinder, TypedBinder } from './utils';

export class Source {
  constructor(
    public location: Location,
    public syntax: SourceSyntax,
  ) { }
}

abstract class SourceSyntax {
  public abstract accept(visitor: SourceSyntaxVisitor) : void; 
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
}

export class U {
  // ['U']
  constructor() { }
  public accept(visitor: SourceSyntaxVisitor) {
    visitor.visitU(this);
  }
}

export class Nat {
  // ['Nat']
  constructor() { }
  public accept(visitor: SourceSyntaxVisitor) {
    visitor.visitNat(this);
  }
}

export class Zero {
  // ['zero']
  constructor() { }
  public accept(visitor: SourceSyntaxVisitor) {
    visitor.visitZero(this);
  }
}

export class Name {
  // [string]
  constructor(
    public name: string,
  ) { }
  public accept(visitor: SourceSyntaxVisitor) {
    visitor.visitName(this);
  }
}

export class Atom {
  constructor() { }
  public accept(visitor: SourceSyntaxVisitor) {
    visitor.visitAtom(this);
  }
}

export class Quote {
  constructor(
    public name: string,
  ) { }
  public accept(visitor: SourceSyntaxVisitor) {
    visitor.visitQuote(this);
  }
}

// Natural number operations
export class Add1 {
  constructor(
    public base: Source,
  ) { }
  public accept(visitor: SourceSyntaxVisitor) {
    visitor.visitAdd1(this);
  }
}

export class WhichNat {
  constructor(
    public target: Source,
    public base: Source,
    public step: Source,
  ) { }
  public accept(visitor: SourceSyntaxVisitor) {
    visitor.visitWhichNat(this);
  }
}

export class IterNat {
  constructor(
    public target: Source,
    public base: Source,
    public step: Source,
  ) { }
  public accept(visitor: SourceSyntaxVisitor) {
    visitor.visitIterNat(this);
  }
}

export class RecNat {
  constructor(
    public target: Source,
    public base: Source,
    public step: Source,
  ) { }
  public accept(visitor: SourceSyntaxVisitor) {
    visitor.visitRecNat(this);
  }
}

export class IndNat {
  constructor(
    public target: Source,
    public motive: Source,
    public base: Source,
    public step: Source,
  ) { }
  public accept(visitor: SourceSyntaxVisitor) {
    visitor.visitIndNat(this);
  }
}

// Function types and operations
export class Arrow {
  constructor(
    public arg1: Source,
    public arg2: Source,
    public args: Source[],
  ) { }
  public accept(visitor: SourceSyntaxVisitor) {
    visitor.visitArrow(this);
  }
}

export class Pi {
  constructor(
    public binders: TypedBinder[],
    public body: Source,
  ) { }
  public accept(visitor: SourceSyntaxVisitor) {
    visitor.visitPi(this);
  }
}

export class Lambda {
  constructor(
    public binders: SiteBinder[],
    public body: Source,
  ) { }
  public accept(visitor: SourceSyntaxVisitor) {
    visitor.visitLambda(this);
  }
}

// Product types and operations
export class Sigma {
  constructor(
    public binders: TypedBinder[],
    public body: Source,
  ) { }
  public accept(visitor: SourceSyntaxVisitor) {
    visitor.visitSigma(this);
  }
}

export class Pair {
  constructor(
    public first: Source,
    public second: Source,
  ) { }
  public accept(visitor: SourceSyntaxVisitor) {
    visitor.visitPair(this);
  }
}

export class Cons {
  constructor(
    public first: Source,
    public second: Source,
  ) { }
  public accept(visitor: SourceSyntaxVisitor) {
    visitor.visitCons(this);
  }
}

export class Car {
  constructor(
    public pair: Source,
  ) { }
  public accept(visitor: SourceSyntaxVisitor) {
    visitor.visitCar(this);
  }
}

export class Cdr {
  constructor(
    public pair: Source,
  ) { }
  public accept(visitor: SourceSyntaxVisitor) {
    visitor.visitCdr(this);
  }
}

// Basic constructors
export class Trivial {
  constructor() { }
  public accept(visitor: SourceSyntaxVisitor) {
    visitor.visitTrivial(this);
  }
}

export class Sole {
  constructor() { }
  public accept(visitor: SourceSyntaxVisitor) {
    visitor.visitSole(this);
  }
}

export class Nil {
  constructor() { }
  public accept(visitor: SourceSyntaxVisitor) {
    visitor.visitNil(this);
  }
}

export class Number {
  constructor(
    public value: number,
  ) { }
  public accept(visitor: SourceSyntaxVisitor) {
    visitor.visitNumber(this);
  }
}

// List operations
export class ConsList {
  constructor(
    public x: Source,
    public xs: Source,
  ) { }
  public accept(visitor: SourceSyntaxVisitor) {
    visitor.visitConsList(this);
  }
}

export class RecList {
  constructor(
    public target: Source,
    public base: Source,
    public step: Source,
  ) { }
  public accept(visitor: SourceSyntaxVisitor) {
    visitor.visitRecList(this);
  }
}

export class IndList {
  constructor(
    public target: Source,
    public motive: Source,
    public base: Source,
    public step: Source,
  ) { }
  public accept(visitor: SourceSyntaxVisitor) {
    visitor.visitIndList(this);
  }
}

// Absurd and its operations
export class Absurd {
  constructor() { }
  public accept(visitor: SourceSyntaxVisitor) {
    visitor.visitAbsurd(this);
  }
}

export class IndAbsurd {
  constructor(
    public target: Source,
    public motive: Source,
  ) { }
  public accept(visitor: SourceSyntaxVisitor) {
    visitor.visitIndAbsurd(this);
  }
}

// Equality types and operations
export class Equal {
  constructor(
    public type: Source,
    public left: Source,
    public right: Source,
  ) { }
  public accept(visitor: SourceSyntaxVisitor) {
    visitor.visitEqual(this);
  }
}

export class Same {
  constructor(
    public type: Source,
  ) { }
  public accept(visitor: SourceSyntaxVisitor) {
    visitor.visitSame(this);
  }
}

export class Replace {
  constructor(
    public target: Source,
    public motive: Source,
    public base: Source,
  ) { }
  public accept(visitor: SourceSyntaxVisitor) {
    visitor.visitReplace(this);
  }
}

export class Trans {
  constructor(
    public left: Source,
    public right: Source,
  ) { }
  public accept(visitor: SourceSyntaxVisitor) {
    visitor.visitTrans(this);
  }
}

export class Cong {
  constructor(
    public from: Source,
    public to: Source,
  ) { }
  public accept(visitor: SourceSyntaxVisitor) {
    visitor.visitCong(this);
  }
}

export class Symm {
  constructor(
    public equality: Source,
  ) { }
  public accept(visitor: SourceSyntaxVisitor) {
    visitor.visitSymm(this);
  }
}

export class IndEqual {
  constructor(
    public from: Source,
    public to: Source,
    public base: Source,
  ) { }
  public accept(visitor: SourceSyntaxVisitor) {
    visitor.visitIndEqual(this);
  }
}

// Vector types and operations
export class Vec {
  constructor(
    public type: Source,
    public length: Source,
  ) { }
  public accept(visitor: SourceSyntaxVisitor) {
    visitor.visitVec(this);
  }
}

export class VecNil {
  constructor() { }
  public accept(visitor: SourceSyntaxVisitor) {
    visitor.visitVecNil(this);
  }
}

export class VecCons {
  constructor(
    public x: Source,
    public xs: Source,
  ) { }
  public accept(visitor: SourceSyntaxVisitor) {
    visitor.visitVecCons(this);
  }
}

export class Head {
  constructor(
    public vec: Source,
  ) { }
  public accept(visitor: SourceSyntaxVisitor) {
    visitor.visitHead(this);
  }
}

export class Tail {
  constructor(
    public vec: Source,
  ) { }
  public accept(visitor: SourceSyntaxVisitor) {
    visitor.visitTail(this);
  }
}

export class IndVec {
  constructor(
    public length: Source,
    public target: Source,
    public motive: Source,
    public base: Source,
    public step: Source,
  ) { }
  public accept(visitor: SourceSyntaxVisitor) {
    visitor.visitIndVec(this);
  }
}

// Either type and operations
export class Either {
  constructor(
    public left: Source,
    public right: Source,
  ) { }
  public accept(visitor: SourceSyntaxVisitor) {
    visitor.visitEither(this);
  }
}

export class Left {
  constructor(
    public value: Source,
  ) { }
  public accept(visitor: SourceSyntaxVisitor) {
    visitor.visitLeft(this);
  }
}

export class Right {
  constructor(
    public value: Source,
  ) { }
  public accept(visitor: SourceSyntaxVisitor) {
    visitor.visitRight(this);
  }
}

export class IndEither {
  constructor(
    public target: Source,
    public motive: Source,
    public baseLeft: Source,
    public baseRight: Source,
  ) { }
  public accept(visitor: SourceSyntaxVisitor) {
    visitor.visitIndEither(this);
  }
}

// Utility
export class TODO {
  constructor() { }
  public accept(visitor: SourceSyntaxVisitor) {
    visitor.visitTODO(this);
  }
}

// Application
export class Application {
  constructor(
    public func: Source,
    public arg: Source,
    public args: Source[],
  ) { }
  public accept(visitor: SourceSyntaxVisitor) {
    visitor.visitApplication(this);
  }
}