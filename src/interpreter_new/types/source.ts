import { PieInfoHook, Renaming, SendPieInfo } from '../typechecker/utils';
import { Location, locationToSrcLoc, notForInfo } from './../locations';
import { SourceSyntaxVisitor} from './../visitors/basics_visitors';
import { bindFree, Context } from './contexts';
import * as C from './core';
import * as V from './value';
import * as N from './neutral';
import * as S from './source';
import { go, stop, goOn, occurringBinderNames, Perhaps, PerhapsM, SiteBinder, TypedBinder } from './utils';
import { convert, sameType } from '../typechecker';
import { readBack } from '../normalize/utils';

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

  public isType(ctx: Context, renames: Renaming): Perhaps<C.Core> {

  }

  public synth(ctx: Context, renames: Renaming): Perhaps<C.The> { 

  }

  public check(ctx: Context, renames: Renaming, type: V.Value): Perhaps<C.Core> {
    const ok = new PerhapsM<C.Core>("ok");
    const out = this.syntax.checkOut(ctx, renames, type, this);
    // SendPieInfo(srcLoc(input), ['has-type', readBackType(Γ, tv)!]);
    return goOn(
      [[ok, () => out]],
      () => new go(ok.value)
    );
  }
}

abstract class SourceSyntax {

  public abstract accept(visitor: SourceSyntaxVisitor) : void; 

  public abstract findNames(): string[];

  public abstract theType(ctx: Context, renames: Renaming, input: Source): Perhaps<C.Core>;

  public abstract theExpr(ctx: Context, renames: Renaming, input: Source): Perhaps<C.The>;

  public checkOut(ctx: Context, renames: Renaming, type: V.Value, input: Source): Perhaps<C.Core> {
    const theT = new PerhapsM<C.The>("theT");
    return goOn(
      [
        [theT, () => input.synth(ctx, renames)],
        [
          new PerhapsM<undefined>("_"),
          () => sameType(ctx, input.location, ctx.valInContext(theT.value.type), type)
        ],
      ],
      () => new go(theT.value.expr)
    );
  }
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

  public checkOut(ctx: Context, renames: Renaming, type: V.Value, input: Source): Perhaps<C.Core> {
    if (this.binders.length === 1) {
      const body = this.body;
      const binder = this.binders[0];
      const x = binder.varName;
      const xLoc = binder.location;
      const typeNow = type.now();
      if (typeNow instanceof V.Pi) {
        const A = typeNow.argType;
        const closure = typeNow.resultType;
        const xRenamed = renames.rename(x);
        const bout = new PerhapsM<C.Core>("bout");
        return goOn(
          [
            [
              bout, 
              () => body.check(
                bindFree(ctx, xRenamed, A),
                renames.extendRenaming(x, xRenamed),
                closure.valOfClosure(
                  new V.Neutral(
                    A, 
                    new N.Variable(xRenamed)
                  )
                )
              )
            ]
          ],
          () => {
            PieInfoHook(xLoc, ['binding-site', A.readBackType(ctx)]);
            return new go(new C.Lambda(xRenamed, bout.value));
          }
        );
      } else {
        return new stop(
          xLoc, 
          [`Not a function type: ${xType.readBackType(ctx)}.`]
        );
      }
    } else { // xBinding.length > 1
      return new Source(
        input.location,
        new S.Lambda(
          [this.binders[0]],
          new Source(
            notForInfo(input.location),
            new S.Lambda(this.binders.slice(1), this.body)
          )
        )
      ).check(ctx, renames, type);
    }
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

  public checkOut(ctx: Context, renames: Renaming, type: V.Value, input: Source): Perhaps<C.Core> {
    const typeNow = type.now();
    if (typeNow instanceof V.Sigma) {
      const A = typeNow.carType;
      const closure = typeNow.cdrType;
      const aout = new PerhapsM<C.Core>("aout");
      const dout = new PerhapsM<C.Core>("dout");
      return goOn(
        [
          [aout, () => this.first.check(ctx, renames, A)],
          [
            dout, 
            () => 
              this.second.check(
                ctx, 
                renames, 
                closure.valOfClosure(ctx.valInContext(aout.value))
              )
          ]
        ],
        () => new go(
          new C.Cons(aout.value, dout.value)
        )
      );
    } else {
      return new stop(
        input.location,
        [`cons requires a Pair or Σ type, but was used as a: ${typeNow.readBackType(ctx)}.`]
      );
    }
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

  public checkOut(ctx: Context, renames: Renaming, type: V.Value, input: Source): Perhaps<C.Core> {
    const typeNow = type.now();
    if (typeNow instanceof V.List) {
      return new go('nil');
    } else {
      return new stop(
        input.location, 
        [`nil requires a List type, but was used as a: ${typeNow.readBackType(ctx)}.`]);
    }
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

  public checkOut(ctx: Context, renames: Renaming, type: V.Value, input: Source): Perhaps<C.Core> {
    const typeNow = type.now();
    if (typeNow instanceof V.Equal) {
      const A = typeNow.type;
      const from = typeNow.from;
      const to = typeNow.to;
      const cout = new PerhapsM<C.Core>("cout");
      const val = new PerhapsM<V.Value>("val");
      return goOn(
        [
          [cout, () => this.type.check(ctx, renames, A)],
          [val, () => new go(ctx.valInContext(cout.value))],
          [
            new PerhapsM<undefined>("_"), 
            () => convert(ctx, this.type.location, A, from, val.value)
          ],
          [
            new PerhapsM<undefined>("_"),
            () => convert(ctx, this.type.location, A, to, val.value)
          ],
        ],
        () => new go(new C.Same(cout.value))
      );
    } else {
      return new stop(
        input.location,
        [`same requires an Equal type, but was used as a: ${typeNow.readBackType(ctx)}.`]
      );
    }
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

  public checkOut(ctx: Context, renames: Renaming, type: V.Value, input: Source): Perhaps<C.Core> {
    const typeNow = type.now();
    if (typeNow instanceof V.Vec) {
      if (typeNow.length instanceof V.Zero) {
        return new go('vecnil');
      } else {
        return new stop(input.location,
          [`vecnil requires a Vec type with length ZERO, but was used as a: 
          ${readBack(ctx, new V.Nat(), typeNow.length)}.`]);
      }
    } else {
      return new stop(
        input.location,
        [`vecnil requires a Vec type, but was used as a: ${typeNow.readBackType(ctx)}.`]
      );
    }
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

  public checkOut(ctx: Context, renames: Renaming, type: V.Value, input: Source): Perhaps<C.Core> {
    const typeNow = type.now();
    if (typeNow instanceof V.Vec) {
      if (typeNow.length instanceof V.Add1) {
        const hout = new PerhapsM<C.Core>("hout");
        const tout = new PerhapsM<C.Core>("tout");
        const n_minus_1 = typeNow.length.smaller;
        return goOn(
          [
            [hout, () => this.x.check(ctx, renames, typeNow.entryType)],
            [tout, () => 
              this.xs.check(ctx, renames, new V.Vec(typeNow.entryType, n_minus_1))
            ]
          ],
          () => new go(new C.VecCons(hout.value, tout.value))
        );
      } else {
        return new stop(
          input.location,
          [`vec:: requires a Vec type with length Add1, but was used with a: 
          ${readBack(ctx, new V.Nat(), typeNow.length)}.`]
        );
      }
    } else {
      return new stop(
        input.location,
        [`vec:: requires a Vec type, but was used as a: ${typeNow.readBackType(ctx)}.`]
      );
    }
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

  public checkOut(ctx: Context, renames: Renaming, type: V.Value, input: Source): Perhaps<C.Core> {
    const typeNow = type.now();
    if (typeNow instanceof V.Either) {
      const lout = new PerhapsM<C.Core>("lout");
      return goOn(
        [
          [lout, () => this.value.check(ctx, renames, typeNow.leftType)]
        ],
        () => new go(new C.Left(lout.value))
      );
    } else {
      return new stop(
        input.location,
        [
          `left requires an Either type, but was used as a: 
          ${typeNow.readBackType(ctx)}.`
        ]
      );
    }
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

  public checkOut(ctx: Context, renames: Renaming, type: V.Value, input: Source): Perhaps<C.Core> {
    const typeNow = type.now();
    if (typeNow instanceof V.Either) {
      const rout = new PerhapsM<C.Core>("rout");
      return goOn(
        [
          [rout, () => this.value.check(ctx, renames, typeNow.rightType)]
        ],
        () => new go(new C.Right(rout.value))
      );
    } else {
      return new stop(
        input.location,
        [
          `right requires an Either type, but was used as a: 
          ${typeNow.readBackType(ctx)}.`
        ]
      );
    }
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

  public checkOut(ctx: Context, renames: Renaming, type: V.Value, input: Source): Perhaps<C.Core> {
    const typeVal = type.readBackType(ctx);
    SendPieInfo(input.location, ['TODO', ctx.readBackContext(), typeVal]);
    return new go(new C.TODO(input.location.locationToSrcLoc(), typeVal));
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