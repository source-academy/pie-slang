import * as C from './core';
import * as V from './value';
import * as N from './neutral';
import * as S from './source';

import { PieInfoHook, Renaming, SendPieInfo, extendRenaming, makeApp, rename} from '../typechecker/utils';
import { Location, notForInfo } from '../utils/locations';
import { bindFree, Context, readBackContext, valInContext } from '../utils/context';

import { go, stop, goOn, occurringBinderNames, Perhaps, 
  PerhapsM, SiteBinder, TypedBinder, Message, freshBinder, 
  isVarName} from './utils';
import { convert, sameType } from '../typechecker/utils';
import { readBack } from '../evaluator/utils';
import { synthesizer as Synth } from '../typechecker/synthesizer';
import { fresh } from './utils';
import { varType } from '../utils/context';
import { inspect } from 'util';

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
  public abstract findNames(): string[];

  public abstract prettyPrint(): string;

  public isType(ctx: Context, renames: Renaming): Perhaps<C.Core> {
    const ok = new PerhapsM<C.Core>("ok");
    const theType = this.getType(ctx, renames);
    return goOn(
      [[ok, () => theType]],
      () => {
        SendPieInfo(this.location, ['is-type', ok.value]);
        return new go(ok.value);
      }
    );
  }

  public getType(ctx: Context, renames: Renaming): Perhaps<C.Core> {
    const checkType = this.check(ctx, renames, new V.Universe());
    if (checkType instanceof go) {
      return checkType;
    } else if (checkType instanceof stop) {
      if (this instanceof Name && isVarName(this.name)) {
        const otherTv = new PerhapsM<V.Value>("other-tv");
        return new goOn(
          [
            [otherTv, 
              () => varType(ctx, this.location, this.name)]
          ],
          () => {
            new stop(this.location, new Message([`Expected U, but given ${otherTv.value.readBackType(ctx)}`]));
          }
        );
      } else {
        return new stop(this.location, new Message([`not a type`]));
      }
    } else {
      throw new Error('Invalid checkType');
    }
  }

  public check(ctx: Context, renames: Renaming, type: V.Value): Perhaps<C.Core> {
    const ok = new PerhapsM<C.Core>("ok");
    const out = this.checkOut(ctx, renames, type);
    // SendPieInfo(srcLoc(input), ['has-type', readBackType(Γ, tv)!]);
    return goOn(
      [[ok, () => out]],
      () => new go(ok.value)
    );
  }

  public synth(ctx: Context, renames: Renaming): Perhaps<C.The> {
    const ok = new PerhapsM<C.The>("ok");
    
    return goOn(
      [[ok, () => this.synthHelper(ctx, renames)]],
      () => {
        SendPieInfo(this.location, ['is-type', ok.value.type]);
        return new go(ok.value)
      }
    );
  }

  protected abstract synthHelper(ctx: Context, renames: Renaming): Perhaps<C.The>;

  protected checkOut(ctx: Context, renames: Renaming, type: V.Value): Perhaps<C.Core> {
    const theT = new PerhapsM<C.The>("theT");
    return goOn(
      [
        [theT, () => this.synth(ctx, renames)],
        [
          new PerhapsM<undefined>("_"),
          () => sameType(ctx, this.location, valInContext(ctx, theT.value.type), type)
        ],
      ],
      () => new go(theT.value.expr)
    );
  }
}


export class The extends Source {
  
  constructor(
    public location: Location,
    public type: Source,
    public value: Source,
  ) { 
    super(location);
  }
  
  protected synthHelper(ctx: Context, renames: Renaming): Perhaps<C.The> {
    return Synth.synthThe(ctx, renames, this.type, this.value);
  }

  public findNames(): string[] {
    return this.type.findNames()
      .concat(this.value.findNames());
  }

  public prettyPrint(): string {
    return `(the ${this.type.prettyPrint()} ${this.value.prettyPrint()})`;
  }

  public toString(): string {
    return this.prettyPrint();
  }

}

export class Universe extends Source {

  constructor(
    public location: Location,
  ) { super(location); }

  protected synthHelper(ctx: Context, renames: Renaming): Perhaps<C.The> {
    return Synth.synthUniverse(ctx, renames, this.location);
  }

  public findNames(): string[] {
    return [];
  }

  public getType(ctx: Context, renames: Renaming): Perhaps<C.Core> {
    return new go(new C.Universe());
  }

  public prettyPrint(): string {
    return 'U';
  }

  public toString(): string {
    return this.prettyPrint();
  }

}

export class Nat extends Source {

  constructor(
    public location: Location,
  ) { super(location); }

  protected synthHelper(ctx: Context, renames: Renaming): Perhaps<C.The> {
    return Synth.synthNat(ctx, renames);
  }

  public findNames(): string[] {
    return [];
  }

  public getType(ctx: Context, renames: Renaming): Perhaps<C.Core> {
    return new go(new C.Nat());
  }

  public prettyPrint(): string {
    return 'Nat';
  }

  public toString(): string {
    return this.prettyPrint();
  }

}

export class Zero extends Source {
  
  constructor(
    public location: Location,
  ) { super(location); }
  
  protected synthHelper(ctx: Context, renames: Renaming): Perhaps<C.The> {
    return Synth.synthZero(ctx, renames);
  }

  public findNames(): string[] {
    return [];
  }

  public prettyPrint(): string {
    return 'zero';
  }

  public toString(): string {
    return this.prettyPrint();
  }

}


export class Add1 extends Source {
  
  constructor(
    public location: Location,
    public base: Source,
  ) { super(location); }

  protected synthHelper(ctx: Context, renames: Renaming): Perhaps<C.The> {
    return Synth.synthAdd1(ctx, renames, this.base);
  }

  public findNames(): string[] {
    return this.base.findNames();
  }

  public prettyPrint(): string {
    return `(add1 ${this.base.prettyPrint()})`;
  }

  public toString(): string {
    return this.prettyPrint();
  }

}

export class WhichNat extends Source {
  
  constructor(
    public location: Location,
    public target: Source,
    public base: Source,
    public step: Source,
  ) { super(location); }

  protected synthHelper(ctx: Context, renames: Renaming): Perhaps<C.The> {
    return Synth.synthWhichNat(ctx, renames, this.target, this.base, this.step);
  }

  public findNames(): string[] {
    return this.target.findNames()
      .concat(this.base.findNames())
      .concat(this.step.findNames());
  }

  public prettyPrint(): string {
    return `(which-nat ${this.target.prettyPrint()} 
              ${this.base.prettyPrint()} 
              ${this.step.prettyPrint()})`;
  }

  public toString(): string {
    return this.prettyPrint();
  }

}

export class IterNat extends Source {

  constructor(
    public location: Location,
    public target: Source,
    public base: Source,
    public step: Source,
  ) { super(location); }


  protected synthHelper(ctx: Context, renames: Renaming): Perhaps<C.The> {
    return Synth.synthIterNat(ctx, renames, this.target, this.base, this.step);
  }

  public findNames(): string[] {
    return this.target.findNames()
      .concat(this.base.findNames())
      .concat(this.step.findNames());
  }

  public prettyPrint(): string {
    return `(iter-nat ${this.target.prettyPrint()} 
              ${this.base.prettyPrint()} 
              ${this.step.prettyPrint()})`;
  }

  public toString(): string {
    return this.prettyPrint();
  }

}

export class RecNat extends Source {

  constructor(
    public location: Location,
    public target: Source,
    public base: Source,
    public step: Source,
  ) { super(location); }


  protected synthHelper(ctx: Context, renames: Renaming): Perhaps<C.The> {
    return Synth.synthRecNat(ctx, renames, this.target, this.base, this.step);
  }

  public findNames(): string[] {
    return this.target.findNames()
      .concat(this.base.findNames())
      .concat(this.step.findNames());
  }

  public prettyPrint(): string {
    return `(rec-nat ${this.target.prettyPrint()} 
              ${this.base.prettyPrint()} 
              ${this.step.prettyPrint()})`;
  }

  public toString(): string {
    return this.prettyPrint();
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

  
  protected synthHelper(ctx: Context, renames: Renaming): Perhaps<C.The> {
    return Synth.synthIndNat(ctx, renames, this.target, this.motive, this.base, this.step);
  }

  public findNames(): string[] {
    return this.target.findNames()
      .concat(this.motive.findNames())
      .concat(this.base.findNames())
      .concat(this.step.findNames());
  }

  public prettyPrint(): string {
    return `(ind-nat ${this.target.prettyPrint()} 
              ${this.motive.prettyPrint()} 
              ${this.base.prettyPrint()} 
              ${this.step.prettyPrint()})`;
  }

  public toString(): string {
    return this.prettyPrint();
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


  protected synthHelper(ctx: Context, renames: Renaming): Perhaps<C.The> {
    return Synth.synthArrow(ctx, renames, this.location, this.arg1, this.arg2, this.args);
  }

  public findNames(): string[] {
    return this.arg1.findNames()
      .concat(this.arg2.findNames())
      .concat(this.args.flatMap(arg => arg.findNames()));
  }

  public getType(ctx: Context, renames: Renaming): Perhaps<C.Core> {
    const [A, B, args] = [this.arg1, this.arg2, this.args];
    if (args.length === 0) {
      const x = freshBinder(ctx, B, 'x');
      const Aout = new PerhapsM<C.Core>("Aout");
      const Bout = new PerhapsM<C.Core>('Bout');
      return goOn(
        [
          [Aout, () => A.isType(ctx, renames)],
          [Bout, 
            () => 
              B.isType(
                bindFree(ctx, x, valInContext(ctx, Aout.value)), 
                renames)
          ]
        ],
        () => {
          return new go(
            new C.Pi(x, Aout.value, Bout.value)
          );
        }
      );
    } else {
      const [rest0, ...rest] = args;
      const x = freshBinder(ctx, makeApp(B, rest0, rest), 'x');
      const Aout = new PerhapsM<C.Core>("Aout");
      const tout = new PerhapsM<C.Core>('tout');
      return goOn(
        [
          [Aout, () => A.isType(ctx, renames)],
          [tout, 
            () => 
              new Arrow(
                notForInfo(this.location),
                B, 
                rest0,
                rest
              ).isType(
                bindFree(ctx, x, valInContext(ctx, Aout.value)),
                renames
              )
          ]
        ],
        () => new go(new C.Pi(x, Aout.value, tout.value))
      );
    }
  }

  public prettyPrint(): string {
    return `(-> ${this.arg1.prettyPrint()} ${this.arg2.prettyPrint()} ${this.args.map(arg => arg.prettyPrint()).join(' ')})`;
  }

  public toString(): string {
    return this.prettyPrint();
  }

}

export class Pi extends Source {

  constructor(
    public location: Location,
    public binders: TypedBinder[],
    public body: Source,
  ) { super(location); }
  

  protected synthHelper(ctx: Context, renames: Renaming): Perhaps<C.The> {
    return Synth.synthPi(ctx, renames, this.location, this.binders, this.body);
  }

  public findNames(): string[] {
    // TEST THIS
    return this.binders.flatMap(binder => occurringBinderNames(binder))
      .concat(this.body.findNames());
  }

  public getType(ctx: Context, renames: Renaming): Perhaps<C.Core> {
    const [binders, B] = [this.binders, this.body];
    if (binders.length === 1) {
      const [bd, A] = [binders[0].binder, binders[0].type];
      const y = fresh(ctx, bd.varName);
      const xloc = bd.location;
      const Aout = new PerhapsM<C.Core>('Aout');
      const Aoutv = new PerhapsM<V.Value>('Aoutv');
      const Bout = new PerhapsM<C.Core>('Bout');
      return goOn(
        [
          [Aout, () => A.isType(ctx, renames)],
          [Aoutv, () => 
            new go(valInContext(ctx, Aout.value))
          ],
          [Bout, () => 
            B.isType(
              bindFree(ctx, y, Aoutv.value),
              extendRenaming(renames, bd.varName, y)
            )
          ],
        ],
        () => {
          PieInfoHook(xloc, ['binding-site', Aout.value]);
          return new go(
            new C.Pi(
              y,
              Aout.value,
              Bout.value
            )
          )
        }
      );
    } else if (binders.length > 1) {
      const [bd, ...rest] = binders;
      const [x, A] = [bd.binder.varName, bd.type];
      const z = fresh(ctx, x);
      const xloc = bd.binder.location;
      const Aout = new PerhapsM<C.Core>('Aout');
      const Aoutv = new PerhapsM<V.Value>('Aoutv');
      const Bout = new PerhapsM<C.Core>('Bout');
      return goOn(
        [
          [Aout, () => A.isType(ctx, renames)],
          [Aoutv, () => 
            new go(valInContext(ctx, Aout.value))
          ],
          [Bout, () => 
            new Pi(
              notForInfo(this.location), 
              rest,
              B
            ).isType(
              bindFree(ctx, z, Aoutv.value),
              extendRenaming(renames, bd.binder.varName, z)
            )
          ]
        ],
        () => {
          PieInfoHook(xloc, ['binding-site', Aout.value]);
          return new go(
            new C.Pi(
              z,
              Aout.value,
              Bout.value
            )
          );
        }
      );
    } else {
      throw new Error('Invalid number of binders in Pi type');
    }
  }

  public prettyPrint(): string {
    return `(Π ${this.binders.map(binder => `(${binder.binder.varName} ${binder.type.prettyPrint()})`).join(' ')} 
            ${this.body.prettyPrint()})`;
  }

  public toString(): string {
    return this.prettyPrint();
  }

}


export class Lambda extends Source {

  constructor(
    public location: Location,
    public binders: SiteBinder[],
    public body: Source,
  ) { super(location); }
  

  protected synthHelper(ctx: Context, renames: Renaming): Perhaps<C.The> {
    throw new Error('Method not implemented.');
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
        const xRenamed = rename(renames, x);
        const bout = new PerhapsM<C.Core>("bout");
        return goOn(
          [
            [
              bout, 
              () => body.check(
                bindFree(ctx, xRenamed, A),
                extendRenaming(renames, x, xRenamed),
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
          new Message([`Not a function type: ${typeNow.readBackType(ctx)}.`])
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

  public prettyPrint(): string {
    return `(lambda ${this.binders.map(binder => binder.varName).join(' ')} ${this.body.prettyPrint()})`;
  }

  public toString(): string {
    return this.prettyPrint();
  }

}

// Product types and operations
export class Sigma extends Source {

  constructor(
    public location: Location,
    public binders: TypedBinder[],
    public body: Source,
  ) { super(location); }

  protected synthHelper(ctx: Context, renames: Renaming): Perhaps<C.The> {
    return Synth.synthSigma(ctx, renames, this.location, this.binders, this.body);
  }

  public findNames(): string[] {
    return this.binders.flatMap(binder => occurringBinderNames(binder))
      .concat(this.body.findNames());
  }

  public getType(ctx: Context, renames: Renaming): Perhaps<C.Core> {
    const [binders, D] = [this.binders, this.body];
    if (binders.length === 1) {
      const [bd, A] = [binders[0].binder, binders[0].type];
      const x = bd.varName;
      const y = fresh(ctx, x);
      const xloc = bd.location;
      const Aout = new PerhapsM<C.Core>('Aout');
      const Aoutv = new PerhapsM<V.Value>('Aoutv');
      const Dout = new PerhapsM<C.Core>('Dout');
      return goOn(
        [
          [Aout, () => A.isType(ctx, renames)],
          [Aoutv, () => new go(valInContext(ctx, Aout.value))],
          [Dout, () => 
            D.isType(
              bindFree(ctx, y, Aoutv.value),
              extendRenaming(renames, x, y)
            )
          ]
        ],
        () => {
          PieInfoHook(xloc, ['binding-site', Aout.value]);
          return new go(
            new C.Sigma(y, Aout.value, Dout.value)
          );
        }
      );
    } else if (binders.length > 1) {
      const [[bd, A], ...rest] 
        = [[binders[0].binder, binders[0].type], binders[1], ...binders.slice(2)];
      const x = bd.varName;
      const z = fresh(ctx, x);
      const xloc = bd.location;
      const Aout = new PerhapsM<C.Core>('Aout');
      const Aoutv = new PerhapsM<V.Value>('Aoutv');
      const Dout = new PerhapsM<C.Core>('Dout');
      return goOn(
        [
          [Aout, () => A.isType(ctx, renames)],
          [Aoutv, () => new go(valInContext(ctx, Aout.value))],
          [Dout, () => 
            new Sigma(this.location, rest, D)
            .isType(
              bindFree(ctx, x, Aoutv.value),
              extendRenaming(renames, x, z)
            )
          ]
        ],
        () => {
          PieInfoHook(xloc, ['binding-site', Aout.value]);
          return new go(
            new C.Sigma(z, Aout.value, Dout.value)
          );
        }
      );
    } else {
      throw new Error('Invalid number of binders in Sigma type');
    }
  }

  public prettyPrint(): string {
    return `(Σ ${this.binders.map(binder => `(${binder.binder.varName} ${binder.type.prettyPrint()})`).join(' ')} 
            ${this.body.prettyPrint()})`;
  }

  public toString(): string {
    return this.prettyPrint();
  }

}

export class Name extends Source {

  constructor(
    public location: Location,
    public name: string,
  ) { super(location); }
  
  protected synthHelper(ctx: Context, renames: Renaming): Perhaps<C.The> {
    return Synth.synthName(ctx, renames, this.location, this.name);
  }

  public findNames(): string[] {
    return [this.name];
  }

  public prettyPrint(): string {
    return this.name;
  }

  public toString(): string {
    return this.prettyPrint();
  }

}

export class Atom extends Source {

  constructor(
    public location: Location,
  ) { super(location); }

  protected synthHelper(ctx: Context, renames: Renaming): Perhaps<C.The> {
    return Synth.synthAtom(ctx, renames);
  }

  public findNames(): string[] {
    return [];
  }

  public getType(ctx: Context, renames: Renaming): Perhaps<C.Core> {
    return new go(new C.Atom());
  }

  public prettyPrint(): string {
    return 'Atom';
  }

  public toString(): string {
    return this.prettyPrint();
  }

}

export class Quote extends Source {

  constructor(
    public location: Location,
    public name: string,
  ) { super(location); }

  protected synthHelper(ctx: Context, renames: Renaming): Perhaps<C.The> {
    return Synth.synthQuote(ctx, renames, this.location, this.name);
  }

  public findNames(): string[] {
    return [];
  }

  public prettyPrint(): string {
    return `'${this.name}`;
  }

  public toString(): string {
    return this.prettyPrint();
  }

}

export class Pair extends Source {

  constructor(
    public location: Location,
    public first: Source,
    public second: Source,
  ) { super(location); }


  protected synthHelper(ctx: Context, renames: Renaming): Perhaps<C.The> {
    return Synth.synthPair(ctx, renames, this.first, this.second);
  }

  public findNames(): string[] {
    return this.first.findNames()
      .concat(this.second.findNames());
  }

  public getType(ctx: Context, renames: Renaming): Perhaps<C.Core> {
    const Aout = new PerhapsM<C.Core>('Aout');
    const Dout = new PerhapsM<C.Core>('Dout');
    const x = freshBinder(ctx, this.second, 'x');
    return goOn(
      [
        [Aout, () => this.first.isType(ctx, renames)],
        [Dout, () => this.second.isType(
          bindFree(ctx, x, valInContext(ctx, Aout.value)), 
          renames)],
      ],
      () => new go(new C.Sigma(x, Aout.value, Dout.value))
    );
  }

  public prettyPrint(): string {
    return `(Pair ${this.first.prettyPrint()} ${this.second.prettyPrint()})`;
  }

  public toString(): string {
    return this.prettyPrint();
  }

}

export class Cons extends Source {

  constructor(
    public location: Location,
    public first: Source,
    public second: Source,
  ) { super(location); }

  protected synthHelper(ctx: Context, renames: Renaming): Perhaps<C.The> {
    throw new Error('Method not implemented.');
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
                closure.valOfClosure(valInContext(ctx, aout.value))
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
        new Message([`cons requires a Pair or Σ type, but was used as a: ${typeNow.readBackType(ctx)}.`])
      );
    }
  }

  public prettyPrint(): string {
    return `(cons ${this.first.prettyPrint()} ${this.second.prettyPrint()})`;
  }

  public toString(): string {
    return this.prettyPrint();
  }

}

export class Car extends Source {

  constructor(
    public location: Location,
    public pair: Source,
  ) { super(location); }

  protected synthHelper(ctx: Context, renames: Renaming): Perhaps<C.The> {
    return Synth.synthCar(ctx, renames, this.location, this.pair);
  }

  public findNames(): string[] {
    return this.pair.findNames();
  }

  public prettyPrint(): string {
    return `(car ${this.pair.prettyPrint()})`;
  }

  public toString(): string {
    return this.prettyPrint();
  }

}

export class Cdr extends Source {

  constructor(
    public location: Location,
    public pair: Source,
  ) { super(location); }

  protected synthHelper(ctx: Context, renames: Renaming): Perhaps<C.The> {
    return Synth.synthCdr(ctx, renames, this.location, this.pair);
  }

  public findNames(): string[] {
    return this.pair.findNames();
  }

  public prettyPrint(): string {
    return `(cdr ${this.pair.prettyPrint()})`;
  }

  public toString(): string {
    return this.prettyPrint();
  }

}

// Basic constructors
export class Trivial extends Source {

  constructor(
    public location: Location,
  ) { super(location); }


  protected synthHelper(ctx: Context, renames: Renaming): Perhaps<C.The> {
    return Synth.synthTrivial(ctx, renames);
  }

  public findNames(): string[] {
    return [];
  }

  public getType(ctx: Context, renames: Renaming): Perhaps<C.Core> {
    return new go(new C.Trivial());
  }

  public prettyPrint(): string {
    return 'Trivial';
  }

  public toString(): string {
    return this.prettyPrint();
  }

}

export class Sole extends Source {

  constructor(
    public location: Location,
  ) { super(location); }


  protected synthHelper(ctx: Context, renames: Renaming): Perhaps<C.The> {
    return Synth.synthSole(ctx, renames);
  }  

  public findNames(): string[] {
    return [];
  }

  public prettyPrint(): string {
    return 'Sole';
  }

}

export class Nil extends Source {
  
  constructor(
    public location: Location 
  ) { super(location); }
  
  protected synthHelper(ctx: Context, renames: Renaming): Perhaps<C.The> {
    throw new Error('Method not implemented.');
  }

  public findNames(): string[] {
    return [];
  }

  public checkOut(ctx: Context, renames: Renaming, type: V.Value): Perhaps<C.Core> {
    const typeNow = type.now();
    if (typeNow instanceof V.List) {
      return new go(new C.Nil());
    } else {
      return new stop(
        this.location, 
        new Message([`nil requires a List type, but was used as a: ${typeNow.readBackType(ctx)}.`])
      );
    }
  }

  public prettyPrint(): string {
    return 'nil';
  }

  public toString(): string {
    return this.prettyPrint();
  }

}

export class Number extends Source {

  constructor(
    public location: Location,
    public value: number,
  ) { super(location); }
  
  protected synthHelper(ctx: Context, renames: Renaming): Perhaps<C.The> {
    return Synth.synthNumber(ctx, renames, this.location, this.value);
  }

  public findNames(): string[] {
    return [];
  }

  public prettyPrint(): string {
    return `${this.value}`;
  }

  public toString(): string {
    return this.prettyPrint();
  }

}

export class List extends Source {

  constructor(
    public location: Location,
    public entryType: Source,
  ) { super(location); }
  
  protected synthHelper(ctx: Context, renames: Renaming): Perhaps<C.The> {
    return Synth.synthList(ctx, renames, this);
  }

  public findNames(): string[] {
    return this.entryType.findNames();
  }

  public getType(ctx: Context, renames: Renaming): Perhaps<C.Core> {
    const Eout = new PerhapsM<C.Core>('Eout');
    return goOn(
      [[Eout, () => this.entryType.isType(ctx, renames)]],
      () => new go(new C.List(Eout.value))
    );
  }

  public prettyPrint(): string {
    return `(List ${this.entryType.prettyPrint()})`;
  }

  public toString(): string {
    return this.prettyPrint();
  }

}



export class ListCons extends Source {
  
  constructor(
    public location: Location,
    public x: Source,
    public xs: Source,
  ) { super(location); }
  
  protected synthHelper(ctx: Context, renames: Renaming): Perhaps<C.The> {
    return Synth.synthListCons(ctx, renames, this.x, this.xs);
  }

  public findNames(): string[] {
    return this.x.findNames()
      .concat(this.xs.findNames());
  }

  public prettyPrint(): string {
    return `(:: ${this.x.prettyPrint()} ${this.xs.prettyPrint()})`;
  }

  public toString(): string {
    return this.prettyPrint();
  }

}

export class RecList extends Source {
  
  constructor(
    public location: Location,
    public target: Source,
    public base: Source,
    public step: Source,
  ) { super(location); }
  
  protected synthHelper(ctx: Context, renames: Renaming): Perhaps<C.The> {
    return Synth.synthRecList(ctx, renames, this.location, this.target, this.base, this.step);
  }

  public findNames(): string[] {
    return this.target.findNames()
      .concat(this.base.findNames())
      .concat(this.step.findNames());
  }

  public prettyPrint(): string {
    return `(rec-list ${this.target.prettyPrint()} 
              ${this.base.prettyPrint()} 
              ${this.step.prettyPrint()})`;
  }

  public toString(): string {
    return this.prettyPrint();
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
  
  protected synthHelper(ctx: Context, renames: Renaming): Perhaps<C.The> {
    return Synth.synthIndList(ctx, renames, this.location, this.target, this.motive, this.base, this.step);
  }
  
  public findNames(): string[] {
    return this.target.findNames()
      .concat(this.motive.findNames())
      .concat(this.base.findNames())
      .concat(this.step.findNames());
  }

  public prettyPrint(): string {
    return `(ind-list ${this.target.prettyPrint()} 
              ${this.motive.prettyPrint()} 
              ${this.base.prettyPrint()} 
              ${this.step.prettyPrint()})`;
  }

  public toString(): string {
    return this.prettyPrint();
  }

}

// Absurd and its operations
export class Absurd extends Source {
  
  constructor(
    public location: Location,
  ) { super(location); }
  
  protected synthHelper(ctx: Context, renames: Renaming): Perhaps<C.The> {
    return Synth.synthAbsurd(ctx, renames, this);
  }

  public findNames(): string[] {
    return [];
  }
  public getType(ctx: Context, renames: Renaming): Perhaps<C.Core> {
    return new go(new C.Absurd());
  }

  public prettyPrint(): string {
    return 'Absurd';
  }

  public toString(): string {
    return this.prettyPrint();
  }

}

export class IndAbsurd extends Source {

  constructor(
    public location: Location,
    public target: Source,
    public motive: Source,
  ) { super(location); }

  protected synthHelper(ctx: Context, renames: Renaming): Perhaps<C.The> {
    return Synth.synthIndAbsurd(ctx, renames, this);
  }

  public findNames(): string[] {
    return this.target.findNames()
      .concat(this.motive.findNames());
  }

  public prettyPrint(): string {
    return `(ind-Absurd 
              ${this.target.prettyPrint()} 
              ${this.motive.prettyPrint()})`;
  }

  public toString(): string {
    return this.prettyPrint();
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


  protected synthHelper(ctx: Context, renames: Renaming): Perhaps<C.The> {
    return Synth.synthEqual(ctx, renames, this.type, this.left, this.right);
  }
  

  public findNames(): string[] {
    return this.type.findNames()
      .concat(this.left.findNames())
      .concat(this.right.findNames());
  }

  public getType(ctx: Context, renames: Renaming): Perhaps<C.Core> {
    const [A, from, to] = [this.type, this.left, this.right];
    const Aout = new PerhapsM<C.Core>('Aout');
    const Av = new PerhapsM<V.Value>('Av');
    const from_out = new PerhapsM<C.Core>('from_out');
    const to_out = new PerhapsM<C.Core>('to_out');
    return goOn(
      [
        [Aout, () => A.isType(ctx, renames)],
        [Av, () => new go(valInContext(ctx, Aout.value))],
        [from_out, () => from.check(ctx, renames, Av.value)],
        [to_out, () => to.check(ctx, renames, Av.value)],
      ],
      () => new go(
        new C.Equal(Aout.value, from_out.value, to_out.value)
      )
    );
  }

  public prettyPrint(): string {
    return `(= ${this.type.prettyPrint()} 
              ${this.left.prettyPrint()} 
              ${this.right.prettyPrint()})`;  
  }

  public toString(): string {
    return this.prettyPrint();
  }

}

export class Same extends Source {

  constructor(
    public location: Location,
    public type: Source,
  ) { super(location); }

  
  public findNames(): string[] {
    return this.type.findNames();
  }

  protected synthHelper(ctx: Context, renames: Renaming): Perhaps<C.The> {
    throw new Error('Method not implemented.');
  }

  public checkOut(ctx: Context, renames: Renaming, type: V.Value): Perhaps<C.Core> {
    const typeNow = type.now()
    if (typeNow instanceof V.Equal) {
      const A = typeNow.type;
      const from = typeNow.from;
      const to = typeNow.to;
      const cout = new PerhapsM<C.Core>("cout");
      const val = new PerhapsM<V.Value>("val");
      return goOn(
        [
          [cout, () => this.type.check(ctx, renames, A)],
          [val, () => new go(valInContext(ctx, cout.value))],
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
        new Message([`same requires an Equal type, but encounter: ${typeNow.readBackType(ctx)}.`])
      );
    }
  }

  public prettyPrint(): string {
    return `(same ${this.type.prettyPrint()})`;
  }

  public toString(): string {
    return this.prettyPrint();
  }

}

export class Replace extends Source {
  
  constructor(
    public location: Location,
    public target: Source,
    public motive: Source,
    public base: Source,
  ) { super(location); }
  
  protected synthHelper(ctx: Context, renames: Renaming): Perhaps<C.The> {
    return Synth.synthReplace(ctx, renames, this.location, this.target, this.motive, this.base);
  }
  
  public findNames(): string[] {
    return this.target.findNames()
      .concat(this.motive.findNames())
      .concat(this.base.findNames());
  }

  public prettyPrint(): string {
    return `(replace ${this.target.prettyPrint()} 
              ${this.motive.prettyPrint()} 
              ${this.base.prettyPrint()})`;
  }

  public toString(): string {
    return this.prettyPrint();
  }

}

export class Trans extends Source {
  protected synthHelper(ctx: Context, renames: Renaming): Perhaps<C.The> {
    return Synth.synthTrans(ctx, renames, this.location, this.left, this.right);
  }
  constructor(
    public location: Location,
    public left: Source,
    public right: Source,
  ) { super(location); }

  public findNames(): string[] {
    return this.left.findNames()
      .concat(this.right.findNames());
  }

  public prettyPrint(): string {
    return `(trans ${this.left.prettyPrint()} ${this.right.prettyPrint()})`;
  }

  public toString(): string {
    return this.prettyPrint();
  }

}

export class Cong extends Source {

  constructor(
    public location: Location,
    public target: Source,
    public fun: Source,
  ) { super(location); }


  protected synthHelper(ctx: Context, renames: Renaming): Perhaps<C.The> {
    return Synth.synthCong(ctx, renames, this.location, this.target, this.fun);
  }

  public findNames(): string[] {
    return this.target.findNames()
      .concat(this.fun.findNames());
  }

  public prettyPrint(): string {
    return `(cong ${this.target.prettyPrint()} ${this.fun.prettyPrint()})`;
  }

  public toString(): string {
    return this.prettyPrint();
  }

}

export class Symm extends Source {

  constructor(
    public location: Location,
    public equality: Source,
  ) { super(location); }

  protected synthHelper(ctx: Context, renames: Renaming): Perhaps<C.The> {
    return Synth.synthSymm(ctx, renames, this.location, this.equality);
  }


  public findNames(): string[] {
    return this.equality.findNames();
  }

  public prettyPrint(): string {
    return `(symm ${this.equality.prettyPrint()})`;
  }

  public toString(): string {
    return this.prettyPrint();
  }

}

export class IndEqual extends Source {

  constructor(
    public location: Location,
    public target: Source,
    public motive: Source,
    public base: Source,
  ) { super(location); }

  protected synthHelper(ctx: Context, renames: Renaming): Perhaps<C.The> {
    return Synth.synthIndEqual(ctx, renames, this.location, this.target, this.motive, this.base);
  }

  public findNames(): string[] {
    return this.target.findNames()
      .concat(this.motive.findNames())
      .concat(this.base.findNames());
  }

  public prettyPrint(): string {
    return `(ind-= ${this.target.prettyPrint()} 
              ${this.motive.prettyPrint()} 
              ${this.base.prettyPrint()})`;
  }

  public toString(): string {
    return this.prettyPrint();
  }

}

// Vector types and operations
export class Vec extends Source {

  constructor(
    public location: Location,
    public type: Source,
    public length: Source,
  ) { super(location); }

  protected synthHelper(ctx: Context, renames: Renaming): Perhaps<C.The> {
    return Synth.synthVec(ctx, renames, this.type, this.length);
  }

  public findNames(): string[] {
    return this.type.findNames()
      .concat(this.length.findNames());
  }

  public getType(ctx: Context, renames: Renaming): Perhaps<C.Core> {
    const Eout = new PerhapsM<C.Core>("Eout");
    const lenout = new PerhapsM<C.Core>('lenout');
    return goOn(
      [[Eout, () => this.type.isType(ctx, renames)],
      [lenout, () => this.length.check(ctx, renames, new V.Nat())]],
      () => new go(new C.Vec(Eout.value, lenout.value))
    );
  }

  public prettyPrint(): string {
    return `(Vec ${this.type.prettyPrint()} ${this.length.prettyPrint()})`;
  }

  public toString(): string {
    return this.prettyPrint();
  }

}

export class VecNil extends Source {
  
  constructor(
    public location: Location,
  ) { super(location); }
  
  protected synthHelper(ctx: Context, renames: Renaming): Perhaps<C.The> {
    throw new Error('Method not implemented.');
  }

  public findNames(): string[] {
    return [];
  }

  public checkOut(ctx: Context, renames: Renaming, type: V.Value): Perhaps<C.Core> {
    const typeNow = type.now();
    if (typeNow instanceof V.Vec) {
      const lenNow = typeNow.length.now();
      if (lenNow instanceof V.Zero) {
        return new go(new C.VecNil());
      } else {
        return new stop(this.location,
          new Message([`vecnil requires a Vec type with length ZERO, but was used as a: 
          ${readBack(ctx, new V.Nat(), typeNow.length)}.`]));
      }
    } else {
      return new stop(
        this.location,
        new Message([`vecnil requires a Vec type, but was used as a: ${typeNow.readBackType(ctx)}.`])
      );
    }
  }

  public prettyPrint(): string {
    return 'vecnil';
  }

  public toString(): string {
    return this.prettyPrint();
  }

}

export class VecCons extends Source {
  constructor(
    public location: Location,
    public x: Source,
    public xs: Source,
  ) { super(location); }
  
  protected synthHelper(ctx: Context, renames: Renaming): Perhaps<C.The> {
    throw new Error('Method not implemented.');
  }
    
  public findNames(): string[] {
    return this.x.findNames()
      .concat(this.xs.findNames());
  }

  public checkOut(ctx: Context, renames: Renaming, type: V.Value): Perhaps<C.Core> {
    const typeNow = type.now();
    if (typeNow instanceof V.Vec) {
      const lenNow = typeNow.length.now();
      if (lenNow instanceof V.Add1) {
        const hout = new PerhapsM<C.Core>("hout");
        const tout = new PerhapsM<C.Core>("tout");
        const n_minus_1 = lenNow.smaller;
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
          new Message([`vec:: requires a Vec type with length Add1, but was used with a: 
          ${readBack(ctx, new V.Nat(), typeNow.length)}.`])
        );
      }
    } else {
      return new stop(
        this.location,
        new Message([`vec:: requires a Vec type, but was used as a: ${typeNow.readBackType(ctx)}.`])
      );
    }
  }

  public prettyPrint(): string {
    return `(vec:: ${this.x.prettyPrint()} ${this.xs.prettyPrint()})`;
  }

  public toString(): string {
    return this.prettyPrint();
  }

}

export class Head extends Source {

  constructor(
    public location: Location,
    public vec: Source,
  ) { super(location); }


  protected synthHelper(ctx: Context, renames: Renaming): Perhaps<C.The> {
    return Synth.synthHead(ctx, renames, this.location, this.vec);
  }

  public findNames(): string[] {
    return this.vec.findNames();
  }

  public prettyPrint(): string {
    return `(head ${this.vec.prettyPrint()})`;
  }

  public toString(): string {
    return this.prettyPrint();
  }

}

export class Tail extends Source {

  constructor(
    public location: Location,
    public vec: Source,
  ) { super(location); }

  protected synthHelper(ctx: Context, renames: Renaming): Perhaps<C.The> {
    return Synth.synthTail(ctx, renames, this.location, this.vec);
  }

  public findNames(): string[] {
    return this.vec.findNames();
  }

  public prettyPrint(): string {
    return `(tail ${this.vec.prettyPrint()})`;
  }

  public toString(): string {
    return this.prettyPrint();
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

  protected synthHelper(ctx: Context, renames: Renaming): Perhaps<C.The> {
    return Synth.synthIndVec(ctx, renames, this.location, 
      this.length, this.target, this.motive, this.base, this.step);
  }
  
  public findNames(): string[] {
    return this.length.findNames()
      .concat(this.target.findNames())
      .concat(this.motive.findNames())
      .concat(this.base.findNames())
      .concat(this.step.findNames());
  }

  public prettyPrint(): string {
    return `ind-Vec ${this.length.prettyPrint()}
              ${this.target.prettyPrint()}
              ${this.motive.prettyPrint()}
              ${this.base.prettyPrint()}
              ${this.step.prettyPrint()}`;
  }

  public toString(): string {
    return this.prettyPrint();
  }

}

// Either type and operations
export class Either extends Source {

  constructor(
    public location: Location,
    public left: Source,
    public right: Source,
  ) { super(location); }
  
  protected synthHelper(ctx: Context, renames: Renaming): Perhaps<C.The> {
    return Synth.synthEither(ctx, renames, this.left, this.right);
  }

  public findNames(): string[] {
    return this.left.findNames()
      .concat(this.right.findNames());
  }

  public getType(ctx: Context, renames: Renaming): Perhaps<C.Core> {
    const Lout = new PerhapsM<C.Core>("Lout");
    const Rout = new PerhapsM<C.Core>("Rout");
    return goOn(
      [
        [Lout, () => this.left.isType(ctx, renames)],
        [Rout, () => this.right.isType(ctx, renames)]
      ],
      () => new go(new C.Either(Lout.value, Rout.value))
    );
  }

  public prettyPrint(): string {
    return `(Either ${this.left.prettyPrint()} ${this.right.prettyPrint()})`;
  }

  public toString(): string {
    return this.prettyPrint();
  }

}

export class Left extends Source {
  constructor(
    public location: Location,
    public value: Source,
  ) { super(location); }
  
  protected synthHelper(ctx: Context, renames: Renaming): Perhaps<C.The> {
    throw new Error('Method not implemented.');
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
        new Message([`left requires an Either type, but was used as a: ${typeNow.readBackType(ctx)}.`])
      );
    }
  }

  public prettyPrint(): string {
    return `(left ${this.value.prettyPrint()})`;
  }

  public toString(): string {
    return this.prettyPrint();
  }

}

export class Right extends Source {
  constructor(
    public location: Location,
    public value: Source,
  ) { super(location); }
  
  protected synthHelper(ctx: Context, renames: Renaming): Perhaps<C.The> {
    throw new Error('Method not implemented.');
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
        new Message([`right requires an Either type, but was used as a: ${typeNow.readBackType(ctx)}.`])
      );
    }
  }

  public prettyPrint(): string {
    return `(right ${this.value.prettyPrint()})`;
  }

  public toString(): string {
    return this.prettyPrint();
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
  
  protected synthHelper(ctx: Context, renames: Renaming): Perhaps<C.The> {
    return Synth.synthIndEither(ctx, renames, this.location, this.target, this.motive, this.baseLeft, this.baseRight);
  }  

  public findNames(): string[] {
    return this.target.findNames()
      .concat(this.motive.findNames())
      .concat(this.baseLeft.findNames())
      .concat(this.baseRight.findNames());
  }

  public prettyPrint(): string {
    return `(ind-Either ${this.target.prettyPrint()} 
              ${this.motive.prettyPrint()} 
              ${this.baseLeft.prettyPrint()} 
              ${this.baseRight.prettyPrint()})`;
  }

  public toString(): string {
    return this.prettyPrint();
  }

}

// Utility
export class TODO extends Source {
  constructor(
    public location: Location,
  ) { super(location); }
  
  protected synthHelper(ctx: Context, renames: Renaming): Perhaps<C.The> {
    throw new Error('Method not implemented.');
  }
  
  public findNames(): string[] {
    return [];
  }

  public checkOut(ctx: Context, renames: Renaming, type: V.Value): Perhaps<C.Core> {
    const typeVal = type.readBackType(ctx);
    SendPieInfo(this.location, ['TODO', readBackContext(ctx), typeVal]);
    return new go(new C.TODO(this.location.locationToSrcLoc(), typeVal));
  }

  public prettyPrint(): string {
    return `TODO`;
  }

  public toString(): string {
    return this.prettyPrint();
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
  
  protected synthHelper(ctx: Context, renames: Renaming): Perhaps<C.The> {
    return Synth.synthApplication(ctx, renames, this.location, this.func, this.arg, this.args);
  }

  public findNames(): string[] {
    return this.func.findNames()
      .concat(this.arg.findNames())
      .concat(this.args.flatMap(arg => arg.findNames()));
  }

  public prettyPrint(): string {
    return `(${this.func.prettyPrint()} ${this.arg.prettyPrint()} ${this.args.map(arg => arg.prettyPrint()).join(' ')})`;
  }

  public toString(): string {
    return this.prettyPrint();
  }
}