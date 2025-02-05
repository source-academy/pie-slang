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

export class SS_The extends SourceSyntax {

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

export class SS_U {
  // ['U']
  constructor() { }
  public accept(visitor: SourceSyntaxVisitor) {
    visitor.visitU(this);
  }
}

export class SS_Nat {
  // ['Nat']
  constructor() { }
  public accept(visitor: SourceSyntaxVisitor) {
    visitor.visitNat(this);
  }
}

export class SS_Zero {
  // ['zero']
  constructor() { }
  public accept(visitor: SourceSyntaxVisitor) {
    visitor.visitZero(this);
  }
}

export class SS_Name {
  // [string]
  constructor(
    public name: string,
  ) { }
  public accept(visitor: SourceSyntaxVisitor) {
    visitor.visitName(this);
  }
}

export class SS_Atom {
  constructor() { }
  public accept(visitor: SourceSyntaxVisitor) {
    visitor.visitAtom(this);
  }
}

export class SS_Quote {
  constructor(
    public name: string,
  ) { }
  public accept(visitor: SourceSyntaxVisitor) {
    visitor.visitQuote(this);
  }
}

// Natural number operations
export class SS_Add1 {
  constructor(
    public base: Source,
  ) { }
  public accept(visitor: SourceSyntaxVisitor) {
    visitor.visitAdd1(this);
  }
}

export class SS_WhichNat {
  constructor(
    public target: Source,
    public base: Source,
    public step: Source,
  ) { }
  public accept(visitor: SourceSyntaxVisitor) {
    visitor.visitWhichNat(this);
  }
}

export class SS_IterNat {
  constructor(
    public target: Source,
    public base: Source,
    public step: Source,
  ) { }
  public accept(visitor: SourceSyntaxVisitor) {
    visitor.visitIterNat(this);
  }
}

export class SS_RecNat {
  constructor(
    public target: Source,
    public base: Source,
    public step: Source,
  ) { }
  public accept(visitor: SourceSyntaxVisitor) {
    visitor.visitRecNat(this);
  }
}

export class SS_IndNat {
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
export class SS_Arrow {
  constructor(
    public arg1: Source,
    public arg2: Source,
    public args: Source[],
  ) { }
  public accept(visitor: SourceSyntaxVisitor) {
    visitor.visitArrow(this);
  }
}

export class SS_Pi {
  constructor(
    public binders: TypedBinder[],
    public body: Source,
  ) { }
  public accept(visitor: SourceSyntaxVisitor) {
    visitor.visitPi(this);
  }
}

export class SS_Lambda {
  constructor(
    public binders: SiteBinder[],
    public body: Source,
  ) { }
  public accept(visitor: SourceSyntaxVisitor) {
    visitor.visitLambda(this);
  }
}

// Product types and operations
export class SS_Sigma {
  constructor(
    public binders: TypedBinder[],
    public body: Source,
  ) { }
  public accept(visitor: SourceSyntaxVisitor) {
    visitor.visitSigma(this);
  }
}

export class SS_Pair {
  constructor(
    public first: Source,
    public second: Source,
  ) { }
  public accept(visitor: SourceSyntaxVisitor) {
    visitor.visitPair(this);
  }
}

export class SS_Cons {
  constructor(
    public first: Source,
    public second: Source,
  ) { }
  public accept(visitor: SourceSyntaxVisitor) {
    visitor.visitCons(this);
  }
}

export class SS_Car {
  constructor(
    public pair: Source,
  ) { }
  public accept(visitor: SourceSyntaxVisitor) {
    visitor.visitCar(this);
  }
}

export class SS_Cdr {
  constructor(
    public pair: Source,
  ) { }
  public accept(visitor: SourceSyntaxVisitor) {
    visitor.visitCdr(this);
  }
}

// Basic constructors
export class SS_Trivial {
  constructor() { }
  public accept(visitor: SourceSyntaxVisitor) {
    visitor.visitTrivial(this);
  }
}

export class SS_Sole {
  constructor() { }
  public accept(visitor: SourceSyntaxVisitor) {
    visitor.visitSole(this);
  }
}

export class SS_Nil {
  constructor() { }
  public accept(visitor: SourceSyntaxVisitor) {
    visitor.visitNil(this);
  }
}

export class SS_Number {
  constructor(
    public value: number,
  ) { }
  public accept(visitor: SourceSyntaxVisitor) {
    visitor.visitNumber(this);
  }
}

// List operations
export class SS_ConsList {
  constructor(
    public x: Source,
    public xs: Source,
  ) { }
  public accept(visitor: SourceSyntaxVisitor) {
    visitor.visitConsList(this);
  }
}

export class SS_RecList {
  constructor(
    public target: Source,
    public base: Source,
    public step: Source,
  ) { }
  public accept(visitor: SourceSyntaxVisitor) {
    visitor.visitRecList(this);
  }
}

export class SS_IndList {
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
export class SS_Absurd {
  constructor() { }
  public accept(visitor: SourceSyntaxVisitor) {
    visitor.visitAbsurd(this);
  }
}

export class SS_IndAbsurd {
  constructor(
    public target: Source,
    public motive: Source,
  ) { }
  public accept(visitor: SourceSyntaxVisitor) {
    visitor.visitIndAbsurd(this);
  }
}

// Equality types and operations
export class SS_Equal {
  constructor(
    public type: Source,
    public left: Source,
    public right: Source,
  ) { }
  public accept(visitor: SourceSyntaxVisitor) {
    visitor.visitEqual(this);
  }
}

export class SS_Same {
  constructor(
    public type: Source,
  ) { }
  public accept(visitor: SourceSyntaxVisitor) {
    visitor.visitSame(this);
  }
}

export class SS_Replace {
  constructor(
    public target: Source,
    public motive: Source,
    public base: Source,
  ) { }
  public accept(visitor: SourceSyntaxVisitor) {
    visitor.visitReplace(this);
  }
}

export class SS_Trans {
  constructor(
    public left: Source,
    public right: Source,
  ) { }
  public accept(visitor: SourceSyntaxVisitor) {
    visitor.visitTrans(this);
  }
}

export class SS_Cong {
  constructor(
    public from: Source,
    public to: Source,
  ) { }
  public accept(visitor: SourceSyntaxVisitor) {
    visitor.visitCong(this);
  }
}

export class SS_Symm {
  constructor(
    public equality: Source,
  ) { }
  public accept(visitor: SourceSyntaxVisitor) {
    visitor.visitSymm(this);
  }
}

export class SS_IndEqual {
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
export class SS_Vec {
  constructor(
    public type: Source,
    public length: Source,
  ) { }
  public accept(visitor: SourceSyntaxVisitor) {
    visitor.visitVec(this);
  }
}

export class SS_VecNil {
  constructor() { }
  public accept(visitor: SourceSyntaxVisitor) {
    visitor.visitVecNil(this);
  }
}

export class SS_VecCons {
  constructor(
    public x: Source,
    public xs: Source,
  ) { }
  public accept(visitor: SourceSyntaxVisitor) {
    visitor.visitVecCons(this);
  }
}

export class SS_Head {
  constructor(
    public vec: Source,
  ) { }
  public accept(visitor: SourceSyntaxVisitor) {
    visitor.visitHead(this);
  }
}

export class SS_Tail {
  constructor(
    public vec: Source,
  ) { }
  public accept(visitor: SourceSyntaxVisitor) {
    visitor.visitTail(this);
  }
}

export class SS_IndVec {
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
export class SS_Either {
  constructor(
    public left: Source,
    public right: Source,
  ) { }
  public accept(visitor: SourceSyntaxVisitor) {
    visitor.visitEither(this);
  }
}

export class SS_Left {
  constructor(
    public value: Source,
  ) { }
  public accept(visitor: SourceSyntaxVisitor) {
    visitor.visitLeft(this);
  }
}

export class SS_Right {
  constructor(
    public value: Source,
  ) { }
  public accept(visitor: SourceSyntaxVisitor) {
    visitor.visitRight(this);
  }
}

export class SS_IndEither {
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
export class SS_TODO {
  constructor() { }
  public accept(visitor: SourceSyntaxVisitor) {
    visitor.visitTODO(this);
  }
}

// Application
export class SS_Application {
  constructor(
    public func: Source,
    public arg: Source,
    public args: Source[],
  ) { }
  public accept(visitor: SourceSyntaxVisitor) {
    visitor.visitApplication(this);
  }
}