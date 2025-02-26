import { PieInfoHook, Renaming, SendPieInfo } from '../typechecker/utils';
import { Location, notForInfo } from './../locations';
import { SourceVisitor} from './../visitors/basics_visitors';
import { bindFree, Context } from './contexts';
import * as C from './core';
import * as V from './value';
import * as N from './neutral';
import * as S from './source';
import { go, stop, goOn, occurringBinderNames, Perhaps, PerhapsM, SiteBinder, TypedBinder } from './utils';
import { convert, sameType } from '../typechecker/utils';
import { readBack } from '../normalize/utils';

export abstract class Source {
  constructor(
    public location: Location,
  ) { }

  /*
    Find all the names that occur in an expression. For correctness, we
    need only find the free identifiers, but finding the bound
    identifiers as well means that the bindings introduced by
    desugaring expressions are more different from the program as
    written, which can help readability of internals.
  */
  public abstract findNames(): string[] 

  public abstract accept(visitor: SourceVisitor) : void;

  // public isType(ctx: Context, renames: Renaming): Perhaps<C.Core> {

  // }

  // public synth(ctx: Context, renames: Renaming): Perhaps<C.The> { 

  // }

  public check(ctx: Context, renames: Renaming, type: V.Value): Perhaps<C.Core> {
    const ok = new PerhapsM<C.Core>("ok");
    const out = this.checkOut(ctx, renames, type);
    // SendPieInfo(srcLoc(input), ['has-type', readBackType(Γ, tv)!]);
    return goOn(
      [[ok, () => out]],
      () => new go(ok.value)
    );
  }

  protected checkOut(ctx: Context, renames: Renaming, type: V.Value): Perhaps<C.Core> {
    const theT = new PerhapsM<C.The>("theT");
    return goOn(
      [
        [theT, () => this.synth(ctx, renames)],
        [
          new PerhapsM<undefined>("_"),
          () => sameType(ctx, this.location, ctx.valInContext(theT.value.type), type)
        ],
      ],
      () => new go(theT.value.expr)
    );
  }
}

// abstract class SourceSyntax {

//   public abstract accept(visitor: SourceVisitor) : void; 

//   public abstract findNames(): string[];

//   public abstract theType(ctx: Context, renames: Renaming, input: Source): Perhaps<C.Core>;

//   public abstract theExpr(ctx: Context, renames: Renaming, input: Source): Perhaps<C.The>;

  
// }

export class The extends Source {

  // ['the', Source, Source]
  
  constructor(
    public location: Location,
    public type: Source,
    public value: Source,
  ) { 
    super(location);
  }

  public accept(visitor: SourceVisitor) {
    visitor.visitThe(this);
  }

  public findNames(): string[] {
    return this.type.findNames()
      .concat(this.value.findNames());
  }
}

export class U extends Source {
  // ['U']
  constructor(
    public location: Location,
  ) { super(location); }

  public accept(visitor: SourceVisitor) {
    visitor.visitU(this);
  }

  public findNames(): string[] {
    return [];
  }
}

export class Nat extends Source {
  // ['Nat']
  constructor(
    public location: Location,
  ) { super(location); }

  public accept(visitor: SourceVisitor) {
    visitor.visitNat(this);
  }

  public findNames(): string[] {
    return [];
  }
}

export class Zero extends Source {
  // ['zero']
  constructor(
    public location: Location,
  ) { super(location); }

  public accept(visitor: SourceVisitor) {
    visitor.visitZero(this);
  }

  public findNames(): string[] {
    return [];
  }
}

export class Name extends Source {
  // [string]
  constructor(
    public location: Location,
    public name: string,
  ) { super(location); }

  public accept(visitor: SourceVisitor) {
    visitor.visitName(this);
  }

  public findNames(): string[] {
    return [this.name];
  }
}

export class Atom extends Source {
  constructor(
    public location: Location,
  ) { super(location); }

  public accept(visitor: SourceVisitor) {
    visitor.visitAtom(this);
  }

  public findNames(): string[] {
    return [];
  }
}

export class Quote extends Source {
  constructor(
    public location: Location,
    public name: string,
  ) { super(location); }

  public accept(visitor: SourceVisitor) {
    visitor.visitQuote(this);
  }

  public findNames(): string[] {
    return [];
  }
}

// Natural number operations
export class Add1 extends Source {
  constructor(
    public location: Location,
    public base: Source,
  ) { super(location); }

  public accept(visitor: SourceVisitor) {
    visitor.visitAdd1(this);
  }

  public findNames(): string[] {
    return this.base.findNames();
  }
}

export class WhichNat extends Source {
  constructor(
    public location: Location,
    public target: Source,
    public base: Source,
    public step: Source,
  ) { super(location); }
  public accept(visitor: SourceVisitor) {
    visitor.visitWhichNat(this);
  }

  public findNames(): string[] {
    return this.target.findNames()
      .concat(this.base.findNames())
      .concat(this.step.findNames());
  }
}

export class IterNat extends Source {
  constructor(
    public location: Location,
    public target: Source,
    public base: Source,
    public step: Source,
  ) { super(location); }

  public accept(visitor: SourceVisitor) {
    visitor.visitIterNat(this);
  }

  public findNames(): string[] {
    return this.target.findNames()
      .concat(this.base.findNames())
      .concat(this.step.findNames());
  }
}

export class RecNat extends Source {
  constructor(
    public location: Location,
    public target: Source,
    public base: Source,
    public step: Source,
  ) { super(location); }

  public accept(visitor: SourceVisitor) {
    visitor.visitRecNat(this);
  }

  public findNames(): string[] {
    return this.target.findNames()
      .concat(this.base.findNames())
      .concat(this.step.findNames());
  }
}

export class IndNat extends Source {
  constructor(
    public location: Location,
    public target: Source,
    public motive: Source,
    public base: Source,
    public step: Source,
  ) { super(location); }

  public accept(visitor: SourceVisitor) {
    visitor.visitIndNat(this);
  }

  public findNames(): string[] {
    return this.target.findNames()
      .concat(this.motive.findNames())
      .concat(this.base.findNames())
      .concat(this.step.findNames());
  }
}

// Function types and operations
export class Arrow extends Source {

  constructor(
    public location: Location,
    public arg1: Source,
    public arg2: Source,
    public args: Source[],
  ) { super(location); }

  public accept(visitor: SourceVisitor) {
    visitor.visitArrow(this);
  }

  public findNames(): string[] {
    return this.arg1.findNames()
      .concat(this.arg2.findNames())
      .concat(this.args.flatMap(arg => arg.findNames()));
  }
}

export class Pi extends Source {
  constructor(
    public location: Location,
    public binders: TypedBinder[],
    public body: Source,
  ) { super(location); }
  public accept(visitor: SourceVisitor) {
    visitor.visitPi(this);
  }

  public findNames(): string[] {
    // TEST THIS
    return this.binders.flatMap(binder => occurringBinderNames(binder))
      .concat(this.body.findNames());
  }
}

export class Lambda extends Source {
  constructor(
    public location: Location,
    public binders: SiteBinder[],
    public body: Source,
  ) { super(location); }

  public accept(visitor: SourceVisitor) {
    visitor.visitLambda(this);
  }

  public findNames(): string[] { 
    return this.binders.map(binder => binder.varName)
      .concat(this.body.findNames());
  }

  public checkOut(ctx: Context, renames: Renaming, type: V.Value): Perhaps<C.Core> {
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
          [`Not a function type: ${typeNow.readBackType(ctx)}.`]
        );
      }
    } else { // xBinding.length > 1
      return (new S.Lambda(
        this.location,
        [this.binders[0]],
          (new S.Lambda(
            notForInfo(this.location),
            this.binders.slice(1), 
            this.body))
          )).check(ctx, renames, type);
    }
  }
}

// Product types and operations
export class Sigma extends Source {

  constructor(
    public location: Location,
    public binders: TypedBinder[],
    public body: Source,
  ) { super(location); }

  public accept(visitor: SourceVisitor) {
    visitor.visitSigma(this);
  }

  public findNames(): string[] {
    return this.binders.flatMap(binder => occurringBinderNames(binder))
      .concat(this.body.findNames());
  }
}

export class Pair extends Source {
  constructor(
    public location: Location,
    public first: Source,
    public second: Source,
  ) { super(location); }

  public accept(visitor: SourceVisitor) {
    visitor.visitPair(this);
  }

  public findNames(): string[] {
    return this.first.findNames()
      .concat(this.second.findNames());
  }
}

export class Cons extends Source {
  constructor(
    public location: Location,
    public first: Source,
    public second: Source,
  ) { super(location); }

  public accept(visitor: SourceVisitor) {
    visitor.visitCons(this);
  }

  public findNames(): string[] {
    return this.first.findNames()
      .concat(this.second.findNames());
  }

  public checkOut(ctx: Context, renames: Renaming, type: V.Value): Perhaps<C.Core> {
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
        this.location,
        [`cons requires a Pair or Σ type, but was used as a: ${typeNow.readBackType(ctx)}.`]
      );
    }
  }
}

export class Car extends Source {
  constructor(
    public location: Location,
    public pair: Source,
  ) { super(location); }

  public accept(visitor: SourceVisitor) {
    visitor.visitCar(this);
  }

  public findNames(): string[] {
    return this.pair.findNames();
  }
}

export class Cdr extends Source {
  constructor(
    public location: Location,
    public pair: Source,
  ) { super(location); }

  public accept(visitor: SourceVisitor) {
    visitor.visitCdr(this);
  }

  public findNames(): string[] {
    return this.pair.findNames();
  }
}

// Basic constructors
export class Trivial extends Source {

  constructor(
    public location: Location,
  ) { super(location); }

  public accept(visitor: SourceVisitor) {
    visitor.visitTrivial(this);
  }

  public findNames(): string[] {
    return [];
  }
}

export class Sole extends Source {  
  constructor(
    public location: Location,
  ) { super(location); }

  public accept(visitor: SourceVisitor) {
    visitor.visitSole(this);
  }

  public findNames(): string[] {
    return [];
  }
}

export class Nil extends Source {
  constructor(
    public location: Location,
  ) { super(location); }

  public accept(visitor: SourceVisitor) {
    visitor.visitNil(this);
  }

  public findNames(): string[] {
    return [];
  }

  public checkOut(ctx: Context, renames: Renaming, type: V.Value): Perhaps<C.Core> {
    const typeNow = type.now();
    if (typeNow instanceof V.List) {
      return new go('nil');
    } else {
      return new stop(
        this.location, 
        [`nil requires a List type, but was used as a: ${typeNow.readBackType(ctx)}.`]);
    }
  }
}

export class Number extends Source {
  constructor(
    public location: Location,
    public value: number,
  ) { super(
    location
  ); }

  public accept(visitor: SourceVisitor) {
    visitor.visitNumber(this);
  }

  public findNames(): string[] {
    return [];
  }
}

// List operations
export class ConsList extends Source {

  constructor(
    public location: Location,
    public x: Source,
    public xs: Source,
  ) { super(location); }

  public accept(visitor: SourceVisitor) {
    visitor.visitConsList(this);
  }

  public findNames(): string[] {
    return this.x.findNames()
      .concat(this.xs.findNames());
  }
}

export class RecList extends Source {
  constructor(
    public location: Location,
    public target: Source,
    public base: Source,
    public step: Source,
  ) { super(location); }

  public accept(visitor: SourceVisitor) {
    visitor.visitRecList(this);
  }

  public findNames(): string[] {
    return this.target.findNames()
      .concat(this.base.findNames())
      .concat(this.step.findNames());
  }
}

export class IndList extends Source {

  constructor(
    public location: Location,
    public target: Source,
    public motive: Source,
    public base: Source,
    public step: Source,
  ) { super(location); }

  public accept(visitor: SourceVisitor) {
    visitor.visitIndList(this);
  }

  public findNames(): string[] {
    return this.target.findNames()
      .concat(this.motive.findNames())
      .concat(this.base.findNames())
      .concat(this.step.findNames());
  }
}

// Absurd and its operations
export class Absurd extends Source {
  constructor(
    public location: Location,
  ) { super(location); }

  public accept(visitor: SourceVisitor) {
    visitor.visitAbsurd(this);
  }

  public findNames(): string[] {
    return [];
  }
}

export class IndAbsurd extends Source {
  constructor(
    public location: Location,
    public target: Source,
    public motive: Source,
  ) { super(location); }

  public accept(visitor: SourceVisitor) {
    visitor.visitIndAbsurd(this);
  }

  public findNames(): string[] {
    return this.target.findNames()
      .concat(this.motive.findNames());
  }
}

// Equality types and operations
export class Equal extends Source {
  constructor(
    public location: Location,
    public type: Source,
    public left: Source,
    public right: Source,
  ) { super(location); }

  public accept(visitor: SourceVisitor) {
    visitor.visitEqual(this);
  }

  public findNames(): string[] {
    return this.type.findNames()
      .concat(this.left.findNames())
      .concat(this.right.findNames());
  }
}

export class Same extends Source {
  constructor(
    public location: Location,
    public type: Source,
  ) { super(location); }

  public accept(visitor: SourceVisitor) {
    visitor.visitSame(this);
  }

  public findNames(): string[] {
    return this.type.findNames();
  }

  public checkOut(ctx: Context, renames: Renaming, type: V.Value): Perhaps<C.Core> {
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
        this.location,
        [`same requires an Equal type, but was used as a: ${typeNow.readBackType(ctx)}.`]
      );
    }
  }
}

export class Replace extends Source {

  constructor(
    public location: Location,
    public target: Source,
    public motive: Source,
    public base: Source,
  ) { super(location); }

  public accept(visitor: SourceVisitor) {
    visitor.visitReplace(this);
  }

  public findNames(): string[] {
    return this.target.findNames()
      .concat(this.motive.findNames())
      .concat(this.base.findNames());
  }
}

export class Trans extends Source {
  constructor(
    public location: Location,
    public left: Source,
    public right: Source,
  ) { super(location); }

  public accept(visitor: SourceVisitor) {
    visitor.visitTrans(this);
  }

  public findNames(): string[] {
    return this.left.findNames()
      .concat(this.right.findNames());
  }
}

export class Cong extends Source {
  constructor(
    public location: Location,
    public from: Source,
    public to: Source,
  ) { super(location); }

  public accept(visitor: SourceVisitor) {
    visitor.visitCong(this);
  }

  public findNames(): string[] {
    return this.from.findNames()
      .concat(this.to.findNames());
  }
}

export class Symm extends Source {
  constructor(
    public location: Location,
    public equality: Source,
  ) { super(location); }

  public accept(visitor: SourceVisitor) {
    visitor.visitSymm(this);
  }

  public findNames(): string[] {
    return this.equality.findNames();
  }
}

export class IndEqual extends Source {
  constructor(
    public location: Location,
    public from: Source,
    public to: Source,
    public base: Source,
  ) { super(location); }

  public accept(visitor: SourceVisitor) {
    visitor.visitIndEqual(this);
  }

  public findNames(): string[] {
    return this.from.findNames()
      .concat(this.to.findNames())
      .concat(this.base.findNames());
  }
}

// Vector types and operations
export class Vec extends Source {
  constructor(
    public location: Location,
    public type: Source,
    public length: Source,
  ) { super(location); }

  public accept(visitor: SourceVisitor) {
    visitor.visitVec(this);
  }

  public findNames(): string[] {
    return this.type.findNames()
      .concat(this.length.findNames());
  }
}

export class VecNil extends Source {
  constructor(
    public location: Location,
  ) { super(location); }

  public accept(visitor: SourceVisitor) {
    visitor.visitVecNil(this);
  }

  public findNames(): string[] {
    return [];
  }

  public checkOut(ctx: Context, renames: Renaming, type: V.Value): Perhaps<C.Core> {
    const typeNow = type.now();
    if (typeNow instanceof V.Vec) {
      if (typeNow.length instanceof V.Zero) {
        return new go('vecnil');
      } else {
        return new stop(this.location,
          [`vecnil requires a Vec type with length ZERO, but was used as a: 
          ${readBack(ctx, new V.Nat(), typeNow.length)}.`]);
      }
    } else {
      return new stop(
        this.location,
        [`vecnil requires a Vec type, but was used as a: ${typeNow.readBackType(ctx)}.`]
      );
    }
  }
}

export class VecCons extends Source {
  constructor(
    public location: Location,
    public x: Source,
    public xs: Source,
  ) { super(location); }

  public accept(visitor: SourceVisitor) {
    visitor.visitVecCons(this);
  }

  public findNames(): string[] {
    return this.x.findNames()
      .concat(this.xs.findNames());
  }

  public checkOut(ctx: Context, renames: Renaming, type: V.Value): Perhaps<C.Core> {
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
          this.location,
          [`vec:: requires a Vec type with length Add1, but was used with a: 
          ${readBack(ctx, new V.Nat(), typeNow.length)}.`]
        );
      }
    } else {
      return new stop(
        this.location,
        [`vec:: requires a Vec type, but was used as a: ${typeNow.readBackType(ctx)}.`]
      );
    }
  }
}

export class Head extends Source {
  constructor(
    public location: Location,
    public vec: Source,
  ) { super(location); }

  public accept(visitor: SourceVisitor) {
    visitor.visitHead(this);
  }

  public findNames(): string[] {
    return this.vec.findNames();
  }
}

export class Tail extends Source {
  constructor(
    public location: Location,
    public vec: Source,
  ) { super(location); }

  public accept(visitor: SourceVisitor) {
    visitor.visitTail(this);
  }

  public findNames(): string[] {
    return this.vec.findNames();
  }
}

export class IndVec extends Source {
  constructor(
    public location: Location,
    public length: Source,
    public target: Source,
    public motive: Source,
    public base: Source,
    public step: Source,
  ) { super(location); }

  public accept(visitor: SourceVisitor) {
    visitor.visitIndVec(this);
  }

  public findNames(): string[] {
    return this.length.findNames()
      .concat(this.target.findNames())
      .concat(this.motive.findNames())
      .concat(this.base.findNames())
      .concat(this.step.findNames());
  }
}

// Either type and operations
export class Either extends Source {
  constructor(
    public location: Location,
    public left: Source,
    public right: Source,
  ) { super(location); }

  public accept(visitor: SourceVisitor) {
    visitor.visitEither(this);
  }

  public findNames(): string[] {
    return this.left.findNames()
      .concat(this.right.findNames());
  }
}

export class Left extends Source {
  constructor(
    public location: Location,
    public value: Source,
  ) { super(location); }

  public accept(visitor: SourceVisitor) {
    visitor.visitLeft(this);
  }

  public findNames(): string[] {
    return this.value.findNames();
  }

  public checkOut(ctx: Context, renames: Renaming, type: V.Value): Perhaps<C.Core> {
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
        this.location,
        [
          `left requires an Either type, but was used as a: 
          ${typeNow.readBackType(ctx)}.`
        ]
      );
    }
  }
}

export class Right extends Source {
  constructor(
    public location: Location,
    public value: Source,
  ) { super(location); }

  public accept(visitor: SourceVisitor) {
    visitor.visitRight(this);
  }

  public findNames(): string[] {
    return this.value.findNames();
  }

  public checkOut(ctx: Context, renames: Renaming, type: V.Value): Perhaps<C.Core> {
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
        this.location,
        [
          `right requires an Either type, but was used as a: 
          ${typeNow.readBackType(ctx)}.`
        ]
      );
    }
  }
}

export class IndEither extends Source {
  constructor(
    public location: Location,
    public target: Source,
    public motive: Source,
    public baseLeft: Source,
    public baseRight: Source,
  ) { super(location); }

  public accept(visitor: SourceVisitor) {
    visitor.visitIndEither(this);
  }

  public findNames(): string[] {
    return this.target.findNames()
      .concat(this.motive.findNames())
      .concat(this.baseLeft.findNames())
      .concat(this.baseRight.findNames());
  }
}

// Utility
export class TODO extends Source {
  constructor(
    public location: Location,
  ) { super(location); }

  public accept(visitor: SourceVisitor) {
    visitor.visitTODO(this);
  }

  public findNames(): string[] {
    return [];
  }

  public checkOut(ctx: Context, renames: Renaming, type: V.Value): Perhaps<C.Core> {
    const typeVal = type.readBackType(ctx);
    SendPieInfo(this.location, ['TODO', ctx.readBackContext(), typeVal]);
    return new go(new C.TODO(this.location.locationToSrcLoc(), typeVal));
  }
}

// Application
export class Application extends Source {
  constructor(
    public location: Location,
    public func: Source,
    public arg: Source,
    public args: Source[],
  ) { super(location); }

  public accept(visitor: SourceVisitor) {
    visitor.visitApplication(this);
  }

  public findNames(): string[] {
    return this.func.findNames()
      .concat(this.arg.findNames())
      .concat(this.args.flatMap(arg => arg.findNames()));
  }
}