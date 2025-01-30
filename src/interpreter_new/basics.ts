import {Location} from './locations';
import { SourceSyntaxVisitor } from './visitors/basics_visitors';

function isPieKeywords(str : string) : boolean {
  return str === 'U' ? true : 
    str === 'Nat' ? true :
    str === 'zero' ? true :
    str === 'add1' ? true :
    str === 'which-Nat' ? true :
    str === 'iter-Nat' ? true :
    str === 'rec-Nat' ? true :
    str === 'ind-Nat' ? true :
    str === '->' ? true :
    str === '→' ? true :
    str === 'Π' ? true :
    str === 'λ' ? true :
    str === 'Pi' ? true :
    str === '∏' ? true :
    str === 'lambda' ? true :
    str === 'quote' ? true :
    str === 'Atom' ? true :
    str === 'car' ? true :
    str === 'cdr' ? true :
    str === 'cons' ? true :
    str === 'Σ' ? true :
    str === 'Sigma' ? true :
    str === 'Pair' ? true :
    str === 'Trivial' ? true :
    str === 'sole' ? true :
    str === 'List' ? true :
    str === '::' ? true :
    str === 'nil' ? true :
    str === 'rec-List' ? true :
    str === 'ind-List' ? true :
    str === 'Absurd' ? true :
    str === 'ind-Absurd' ? true :
    str === '=' ? true :
    str === 'same' ? true :
    str === 'replace' ? true :
    str === 'trans' ? true :
    str === 'cong' ? true :
    str === 'symm' ? true :
    str === 'ind-=' ? true :
    str === 'Vec' ? true :
    str === 'vecnil' ? true :
    str === 'vec::' ? true :
    str === 'head' ? true :
    str === 'tail' ? true :
    str === 'ind-Vec' ? true :
    str === 'Either' ? true :
    str === 'left' ? true :
    str === 'right' ? true :
    str === 'ind-Either' ? true :
    str === 'TODO' ? true :
    str === 'the' ? true :
    false;
}

/*
  Define the Source type, which associates a source location with
  a Pie expression. Another name for Src in orginal code is "@".
*/
class Source {
  constructor(
    public location: Location,
    public syntax: SourceSyntax,
  ) { }
}

// Define a function to check if an object is a Source.
function isSource(obj: any): obj is Source {
  return obj instanceof Source;
}

// A SiteBinder is a variable name and its location, substitute BindingSite in original code.

class SiteBinder {
  constructor(
    public varName: string,
    public location: Location,
  ) { }
}

// Define TypedBinder, which is a SiteBinder associated with a expression in Pie.

class TypedBinder {
  constructor(
    public binder: SiteBinder,
    public type: Source,
  ) {}
}

/*  
    SourceSyntax is the kinds of expressions in Pie.
    Pie expressions consist of a source location attached by @ to an
    S-expression that follows the structure defined in The Little
    Typer. Each sub-expression also has a source location, so they are
    Src rather than Src-Stx.
*/
abstract class SourceSyntax {
  public abstract accept(visitor: SourceSyntaxVisitor) : void; 
}

class SS_The extends SourceSyntax {

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

class SS_U {
  // ['U']
  constructor() { }
  public accept(visitor: SourceSyntaxVisitor) {
    visitor.visitU(this);
  }
}

class SS_Nat {
  // ['Nat']
  constructor() { }
  public accept(visitor: SourceSyntaxVisitor) {
    visitor.visitNat(this);
  }
}

class SS_Zero {
  // ['zero']
  constructor() { }
  public accept(visitor: SourceSyntaxVisitor) {
    visitor.visitZero(this);
  }
}

class SS_Name {
  // [string]
  constructor(
    public name: string,
  ) { }
  public accept(visitor: SourceSyntaxVisitor) {
    visitor.visitName(this);
  }
}

class SS_Atom {
  // ['Atom']
  constructor() { }
  public accept(visitor: SourceSyntaxVisitor) {
    visitor.visitAtom(this);
  }
}

class SS_Quote {
  // ['quote', Source]
  constructor(
    public name: string,
  ) { }
  public accept(visitor: SourceSyntaxVisitor) {
    visitor.visitQuote(this);
  }
}

class SS_Add1 {
  // ['add1', Source]
  constructor(
    public base: Source,
  ) { }
  public accept(visitor: SourceSyntaxVisitor) {
    visitor.visitAdd1(this);
  }
}

class SS_WhichNat {
  // ['which-Nat', Source, Source, Source]
  constructor(
    public target: Source,
    public base: Source,
    public step: Source,
  ) { }
  public accept(visitor: SourceSyntaxVisitor) {
    visitor.visitWhichNat(this);
  }
}

class SS_IterNat {
  // ['iter-Nat', Source, Source, Source]
  constructor(
    public target: Source,
    public base: Source,
    public step: Source,
  ) { }
  public accept(visitor: SourceSyntaxVisitor) {
    visitor.visitIterNat(this);
  }
}

class SS_RecNat {
  // ['rec-Nat', Source, Source, Source]
  constructor(
    public target: Source,
    public base: Source,
    public step: Source,
  ) { }
  public accept(visitor: SourceSyntaxVisitor) {
    visitor.visitRecNat(this);
  }
}

class SS_IndNat {
  // ['ind-Nat', Source, Source, Source]
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

class SS_Arrow {
  // ['->', Source, Source, Source[]]
  // a function type expression has at least 2 Sources as input type and output type
  // and could have more Sources as the input types, which are contained in the final array of Sources
  constructor(
    public arg1: Source,
    public arg2: Source,
    public args: Source[],
  ) { }

  public accept(visitor: SourceSyntaxVisitor) {
    visitor.visitArrow(this);
  }
}

class SS_Pi {
  // ['PI', TypedBinder[], Source]
  // a dependent function type expression has a list of TypedBinders as input types
  constructor(
    public binders: TypedBinder[],
    public body: Source,
  ) { }

  public accept(visitor: SourceSyntaxVisitor) {
    visitor.visitPi(this);
  }
}

class SS_Lambda {
  // ['lambda', SiteBinder[], Source]
  // a lambda expression has a list of SiteBinders as input types
  constructor(
    public binders: SiteBinder[],
    public body: Source,
  ) { }

  public accept(visitor: SourceSyntaxVisitor) {
    visitor.visitLambda(this);
  }
}

class SS_Sigma {
  // ['Sigma', TypedBinder[], Source]
  // a dependent pair type expression has a list of TypedBinders as input types
  constructor(
    public binders: TypedBinder[],
    public body: Source,
  ) { }

  public accept(visitor: SourceSyntaxVisitor) {
    visitor.visitSigma(this);
  }
}

class SS_Pair {
  // ['Pair', Source, Source]
  constructor(
    public first: Source,
    public second: Source,
  ) { }

  public accept(visitor: SourceSyntaxVisitor) {
    visitor.visitPair(this);
  }
}

class SS_Cons {
  // ['cons', Source, Source]
  constructor(
    public first: Source,
    public second: Source,
  ) { }

  public accept(visitor: SourceSyntaxVisitor) {
    visitor.visitCons(this);
  }
}

/*
  In computer programming, CAR (car) /kɑːr/ ⓘ and CDR (cdr) (/ˈkʌdər/ ⓘ or /ˈkʊdər/ ⓘ) 
  are primitive operations on cons cells (or "non-atomic S-expressions") introduced in the
  Lisp programming language. A cons cell is composed of two pointers; the car operation
  extracts the first pointer, and the cdr operation extracts the second.
  Thus, the expression (car (cons x y)) evaluates to x, and (cdr (cons x y)) evaluates to y.
*/
class SS_Car {
  // ['car', Source]
  constructor(
    public pair: Source,
  ) { }

  public accept(visitor: SourceSyntaxVisitor) {
    visitor.visitCar(this);
  }
}

class SS_Cdr {
  // ['cdr', Source]
  constructor(
    public pair: Source,
  ) { }

  public accept(visitor: SourceSyntaxVisitor) {
    visitor.visitCdr(this);
  }
}

class SS_Trivial {
  // ['Trivial']
  constructor() { }
  public accept(visitor: SourceSyntaxVisitor) {
    visitor.visitTrivial(this);
  }
}

class SS_Sole {
  // ['sole']
  constructor() { }
  public accept(visitor: SourceSyntaxVisitor) {
    visitor.visitSole(this);
  }
}

class SS_Nil {
  // ['nil']
  constructor() { }
  public accept(visitor: SourceSyntaxVisitor) {
    visitor.visitNil(this);
  }
}

class SS_Number {
  // [number]
  constructor(
    public value: number,
  ) { }
  public accept(visitor: SourceSyntaxVisitor) {
    visitor.visitNumber(this);
  }
}

class SS_ConsList {
  // ['::', Source, Source]
  constructor(
    public x: Source,
    public xs: Source,
  ) { }

  public accept(visitor: SourceSyntaxVisitor) {
    visitor.visitConsList(this);
  }
}

class SS_RecList {
  // ['rec-List', Source, Source, Source, Source]
  constructor(
    public target: Source,
    public base: Source,
    public step: Source,
  ) { }

  public accept(visitor: SourceSyntaxVisitor) {
    visitor.visitRecList(this);
  }
}

class SS_IndList {
  // ['ind-List', Source, Source, Source, Source]
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

class SS_Absurd {
  // ['Absurd']
  constructor() { }
  public accept(visitor: SourceSyntaxVisitor) {
    visitor.visitAbsurd(this);
  }
}

class SS_IndAbsurd {
  // ['ind-Absurd', Source]
  // ind-Absurd, has neither bases nor steps because there are no Absurd values.
  constructor(
    public target: Source,
    public motive: Source,
  ) { }

  public accept(visitor: SourceSyntaxVisitor) {
    visitor.visitIndAbsurd(this);
  }
}

class SS_Equal {
  // ['=', Source, Source, Source]
  constructor(
    public type: Source,
    public left: Source,
    public right: Source,
  ) { }

  public accept(visitor: SourceSyntaxVisitor) {
    visitor.visitEqual(this);
  }
}

class SS_Same {
  // ['same', Source]
  constructor(
    public type: Source,
  ) { }

  public accept(visitor: SourceSyntaxVisitor) {
    visitor.visitSame(this);
  }
}

class SS_Replace {
  // ['replace', Source, Source, Source]
  constructor(
    public target: Source,
    public motive: Source,
    public base: Source,
  ) { }

  public accept(visitor: SourceSyntaxVisitor) {
    visitor.visitReplace(this);
  }
}

class SS_Trans {
  // ['trans', Source, Source]
  // transitivity of equality
  constructor(
    public left: Source,
    public right: Source,
  ) { }

  public accept(visitor: SourceSyntaxVisitor) {
    visitor.visitTrans(this);
  }
}

class SS_Cong {
  // ['cong', Source, Source]
  constructor(
    public from: Source,
    public to: Source,
  ) { }

  public accept(visitor: SourceSyntaxVisitor) {
    visitor.visitCong(this);
  }
}

class SS_Symm {
  // ['symm', Source]
  // symmetry of equality
  constructor(
    public equality: Source,
  ) { }

  public accept(visitor: SourceSyntaxVisitor) {
    visitor.visitSymm(this);
  }
}

class SS_IndEqual {
  // ['ind-=', Source, Source, Source]
  constructor(
    public from: Source,
    public to: Source,
    public base: Source,
  ) { }

  public accept(visitor: SourceSyntaxVisitor) {
    visitor.visitIndEqual(this);
  }
}

class SS_Vec {
  // ['Vec', Source, Source]
  constructor(
    public type: Source,
    public length: Source,
  ) { }

  public accept(visitor: SourceSyntaxVisitor) {
    visitor.visitVec(this);
  }
}

class SS_VecNil {
  // ['vecnil']
  constructor() { }

  public accept(visitor: SourceSyntaxVisitor) {
    visitor.visitVecNil(this);
  }
}

class SS_VecCons {
  // ['vec::', Source, Source]
  constructor(
    public x: Source,
    public xs: Source,
  ) { }

  public accept(visitor: SourceSyntaxVisitor) {
    visitor.visitVecCons(this);
  }
}

class SS_Head {
  // ['head', Source]
  constructor(
    public vec: Source,
  ) { }

  public accept(visitor: SourceSyntaxVisitor) {
    visitor.visitHead(this);
  }
}

class SS_Tail {
  // ['tail', Source]
  constructor(
    public vec: Source,
  ) { }

  public accept(visitor: SourceSyntaxVisitor) {
    visitor.visitTail(this);
  }
}

class SS_IndVec {
  // ['ind-Vec', Source, Source, Source, Source, Source]
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

class SS_Either {
  // ['Either', Source, Source]
  constructor(
    public left: Source,
    public right: Source,
  ) { }

  public accept(visitor: SourceSyntaxVisitor) {
    visitor.visitEither(this);
  }
}

class SS_Left {
  // ['left', Source]
  constructor(
    public value: Source,
  ) { }

  public accept(visitor: SourceSyntaxVisitor) {
    visitor.visitLeft(this);
  }
}

class SS_Right {
  // ['right', Source]
  constructor(
    public value: Source,
  ) { }

  public accept(visitor: SourceSyntaxVisitor) {
    visitor.visitRight(this);
  }
}

class SS_IndEither {
  // ['ind-Either', Source, Source, Source, Source]
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

class SS_TODO {
  // ['TODO']
  constructor() { }

  public accept(visitor: SourceSyntaxVisitor) {
    visitor.visitTODO(this);
  }
}

class SS_Application {
  // [Source, Source, Source[]]
  constructor(
    public func: Source,
    public arg: Source,
    public args: Source[],
  ) { }

  public accept(visitor: SourceSyntaxVisitor) {
    visitor.visitApplication(this);
  }
}

export {
  Source,
  isSource,
  SiteBinder,
  TypedBinder,
  SourceSyntax,
  SS_The,
  SS_U,
  SS_Nat,
  SS_Zero,
  SS_Name,
  SS_Atom,
  SS_Quote,
  SS_Add1,
  SS_WhichNat,
  SS_IterNat,
  SS_RecNat,
  SS_IndNat,
  SS_Arrow,
  SS_Pi,
  SS_Lambda,
  SS_Sigma,
  SS_Pair,
  SS_Cons,
  SS_Car,
  SS_Cdr,
  SS_Trivial,
  SS_Sole,
  SS_Nil,
  SS_Number,
  SS_ConsList,
  SS_RecList,
  SS_IndList,
  SS_Absurd,
  SS_IndAbsurd,
  SS_Equal,
  SS_Same,
  SS_Replace,
  SS_Trans,
  SS_Cong,
  SS_Symm,
  SS_IndEqual,
  SS_Vec,
  SS_VecNil,
  SS_VecCons,
  SS_Head,
  SS_Tail,
  SS_IndVec,
  SS_Either,
  SS_Left,
  SS_Right,
  SS_IndEither,
  SS_TODO,
  SS_Application,
  isPieKeywords
}