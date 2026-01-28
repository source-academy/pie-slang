import * as C from "./core";
import * as N from "./neutral";

import { bindFree, Context, InductiveDatatypeBinder } from "../utils/context";
import { Environment } from "../utils/environment";
import { Closure } from "./utils";
import { fresh } from "./utils";
import { readBack } from "../evaluator/utils";

/*
    ## Values ##
    
    In order to type check Pie, it is necessary to find the normal
    forms of expressions and compare them with each other. The normal
    form of an expression is determined by its type - types that have
    η-rules (such as Π, Σ, Trivial, and Absurd) impose requirements on
    the normal form. For instance, every normal function has λ at the
    top, and every normal pair has cons at the top.

    Finding normal forms has two steps: first, programs are evaluated,
    much as they are with the Scheme interpreter at the end of The
    Little Schemer. Then, these values are "read back" into the syntax
    of their normal forms. This happens in normalize.rkt. This file
    defines the values that expressions can have. Structures or symbols
    that represent values are written with prefix V_.

    Laziness is implemented by allowing values to be a closure that
    does not bind a variable. It is described in normalize.rkt (search
    for "Call-by-need").
*/

export abstract class Value {

  /*
  now demands the _actual_ value represented by a DELAY. If the value
  is a DELAY-CLOS, then it is computed using undelay. If it is
  anything else, then it has already been computed, so it is
  returned.
  
  now should be used any time that a value is inspected to see what
  form it has, because those situations require that the delayed
  evaluation steps be carried out.
  */
  public now(): Value {
    return this;
  }

  public abstract readBackType(context: Context): C.Core;

  public abstract prettyPrint(): string;

}

export class DelayClosure {
  env: Environment;
  expr: C.Core;

  constructor(env: Environment, expr: C.Core) {
    this.env = env;
    this.expr = expr;
  }
  /*
    undelay is used to find the value that is contained in a
    DELAY-CLOS closure by invoking the evaluator.
  */
  public undelay(): Value {
    return this.expr.valOf(this.env).now();
  }

  public toString(): string {
    return `DelayClosure(${this.env}, ${this.expr})`;
  }

}

export class Box<Type> {
  content: Type;

  constructor(value: Type) {
    this.content = value;
  }

  public get() {
    return this.content;
  }
  public set(value: Type) {
    this.content = value;
  }
}


export class Delay extends Value {

  constructor(public val: Box<DelayClosure | Value>) { super() }

  public now(): Value {
    const boxContent = this.val.get();
    if (boxContent instanceof DelayClosure) {
      const theValue = boxContent.undelay();
      this.val.set(theValue);
      return theValue;
    } else { // content is a Value (content instanceof Value).
      return boxContent as Value;
    }
  }

  public readBackType(context: Context): C.Core {
    return this.now().readBackType(context);
  }

  public prettyPrint(): string {
    return this.now().prettyPrint();
  }

  public toString(): string {
    return `Delay(${this.val})`;
  }

}

export class Quote extends Value {
  constructor(public name: string) { super() }

  public readBackType(_: Context): C.Core {
    throw new Error("No readBackType for Quote.");
  }

  public prettyPrint(): string {
    return `'${this.name}`;
  }

  public toString(): string {
    return this.prettyPrint();
  }

}

export class Nat extends Value {
  constructor() { super() }

  public readBackType(_: Context): C.Core {
    return new C.Nat();
  }

  public prettyPrint(): string {
    return 'Nat';
  }

  public toString(): string {
    return this.prettyPrint();
  }

}

export class Zero extends Value {
  constructor() { super() }

  public readBackType(_: Context): C.Core {
    throw new Error("No readBackType for Zero.");
  }

  public prettyPrint(): string {
    return 'zero';
  }

  public toString(): string {
    return this.prettyPrint();
  }

}

export class Add1 extends Value {

  constructor(public smaller: Value) { super() }

  public readBackType(_: Context): C.Core {
    throw new Error("No readBackType for Add1.");
  }

  public prettyPrint(): string {
    return `(add1 ${this.smaller.prettyPrint()})`;
  }

  public toString(): string {
    return this.prettyPrint();
  }

}

export class Pi extends Value {

  constructor(
    public argName: string,
    public argType: Value,
    public resultType: Closure
  ) { super() }

  public readBackType(context: Context): C.Core {
    const Aexpr = this.argType.readBackType(context);
    const freshedName =  fresh(context, this.argName);
    const excludeNameCtx = bindFree(context, freshedName, this.argType);
    return new C.Pi(
      freshedName,
      Aexpr,
      this.resultType
        .valOfClosure(
          new Neutral(this.argType, new N.Variable(freshedName))
        )
        .readBackType(excludeNameCtx)
    );
  }

  public prettyPrint(): string {
    return `(Π ${this.argName} ${this.argType.prettyPrint()} ${this.resultType.prettyPrint()})`;
  }

  public toString(): string {
    return this.prettyPrint();
  }

}

export class Lambda extends Value {

  constructor(
    public argName: string,
    public body: Closure
  ) { super() }

  public readBackType(_: Context): C.Core {
    throw new Error("No readBackType for Lambda.");
  }

  public prettyPrint(): string {
    return `(lambda ${this.argName} ${this.body.prettyPrint()})`;
  }

  public toString(): string {
    return this.prettyPrint();
  }

}

export class Sigma extends Value {
  constructor(
    public carName: string,
    public carType: Value,
    public cdrType: Closure
  ) { super() }
  
  public readBackType(context: Context): C.Core {
    const Aexpr = this.carType.readBackType(context);
    const freshedName = fresh(context, this.carName);
    const excludeNameCtx = bindFree(context, freshedName, this.carType);
    return new C.Sigma(
      freshedName,
      Aexpr,
      this.cdrType
        .valOfClosure(
          new Neutral(this.carType, new N.Variable(freshedName))
        )
        .readBackType(excludeNameCtx)
    );
  }

  public prettyPrint(): string {
    return `(Σ ${this.carName} ${this.carType.prettyPrint()} ${this.cdrType.prettyPrint()})`;
  }

  public toString(): string {
    return this.prettyPrint();
  }

}

export class Cons extends Value {

  constructor(
    public car: Value,
    public cdr: Value
  ) { super() }

  public readBackType(_: Context): C.Core {
    throw new Error("No readBackType for Cons.");
  }

  public prettyPrint(): string {
    return `(cons ${this.car.prettyPrint()} ${this.cdr.prettyPrint()})`;
  }

  public toString(): string {
    return this.prettyPrint();
  }

}

export class List extends Value {

  constructor(public entryType: Value) { super() }

  public readBackType(context: Context): C.Core {
    return new C.List(this.entryType.readBackType(context));
  }

  public prettyPrint(): string {
    return `(List ${this.entryType.prettyPrint()})`;
  }

  public toString(): string {
    return this.prettyPrint();
  }

}

export class Nil extends Value {
  constructor() { super() }

  public readBackType(_: Context): C.Core {
    throw new Error("No readBackType for Nil.");
  }

  public prettyPrint(): string {
    return 'nil';
  }

  public toString(): string {
    return this.prettyPrint();
  }

}

export class ListCons extends Value {

  constructor(
    public head: Value,
    public tail: Value
  ) { super() }

  public readBackType(_: Context): C.Core {
    throw new Error("No readBackType for ListCons.");
  }

  public prettyPrint(): string {
    return `(:: ${this.head.prettyPrint()} ${this.tail.prettyPrint()})`;
  }

  public toString(): string {
    return this.prettyPrint();
  }

}


export class Equal extends Value {

  constructor(
    public type: Value,
    public from: Value,
    public to: Value
  ) { super() }

  public readBackType(context: Context): C.Core {
    return new C.Equal(
      this.type.readBackType(context),
      readBack(context, this.type, this.from),
      readBack(context, this.type, this.to)
    );
  }

  public prettyPrint(): string {
    return `(= ${this.type.prettyPrint()} ${this.from.prettyPrint()} ${this.to.prettyPrint()})`;
  }

  public toString(): string {
    return this.prettyPrint();
  }

}

export class Same extends Value {

  constructor(public value: Value) { super() }

  public readBackType(_: Context): C.Core {
    throw new Error("No readBackType for Same.");
  }

  public prettyPrint(): string {
    return `(same ${this.value.prettyPrint()})`;
  }

  public toString(): string {
    return this.prettyPrint();
  }

}

export class Vec extends Value {

  constructor(
    public entryType: Value,
    public length: Value
  ) { super() }

  public readBackType(context: Context): C.Core {
    return new C.Vec(
      this.entryType.readBackType(context),
      readBack(context, new Nat(), this.length)
    );
  }

  public prettyPrint(): string {
    return `(Vec ${this.entryType.prettyPrint()} ${this.length.prettyPrint()})`;
  }

}

export class VecNil extends Value {

  constructor() { super() }

  public readBackType(_: Context): C.Core {
    throw new Error("No readBackType for VecNil.");
  }

  public prettyPrint(): string {
    return 'vecnil';
  }

  public toString(): string {
    return this.prettyPrint();
  }

}

export class VecCons extends Value {

  constructor(
    public head: Value,
    public tail: Value
  ) { super() }

  public readBackType(_: Context): C.Core {
    throw new Error("No readBackType for VecCons.");
  }

  public prettyPrint(): string {
    return `(vec:: ${this.head.prettyPrint()} ${this.tail.prettyPrint()})`;
  }

  public toString(): string {
    return this.prettyPrint();
  }

}

export class Either extends Value {

  constructor(
    public leftType: Value,
    public rightType: Value
  ) { super() }

  public readBackType(context: Context): C.Core {
    return new C.Either(
      this.leftType.readBackType(context),
      this.rightType.readBackType(context)
    );
  }

  public prettyPrint(): string {
    return `(Either ${this.leftType.prettyPrint()} ${this.rightType.prettyPrint()})`;
  }

  public toString(): string {
    return this.prettyPrint();
  }

}

export class Left extends Value {

  constructor(public value: Value) { super() }

  public readBackType(_: Context): C.Core {
    throw new Error("No readBackType for Left.");
  }

  public prettyPrint(): string {
    return `(left ${this.value.prettyPrint()})`;
  }

  public toString(): string {
    return this.prettyPrint();
  }

}

export class Right extends Value {
  constructor(public value: Value) { super() }

  public readBackType(_: Context): C.Core {
    throw new Error("No readBackType for Right.");
  }

  public prettyPrint(): string {
    return `(right ${this.value.prettyPrint()})`;
  }

  public toString(): string {
    return this.prettyPrint();
  }

}

export class Neutral extends Value {
  constructor(
    public type: Value,
    public neutral: N.Neutral
  ) { super() }

  public readBackType(context: Context): C.Core {
    return this.neutral.readBackNeutral(context);
  }

  public prettyPrint(): string {
    return `(Neutral ${this.type.prettyPrint()} ${this.neutral.prettyPrint()})`;
  }

  public toString(): string {
    return this.prettyPrint();
  }

}

export class Universe extends Value {

  constructor() { super() }

  public readBackType(_: Context): C.Core {
    return new C.Universe();
  }

  public prettyPrint(): string {
    return 'U';
  }

  public toString(): string {
    return this.prettyPrint();
  }

}



export class Atom extends Value {

  constructor() { super() }

  public readBackType(_: Context): C.Core {
    return new C.Atom();
  }

  public prettyPrint(): string {
    return 'Atom';
  }

  public toString(): string {
    return this.prettyPrint();
  }

}

export class Trivial extends Value {
  constructor() { super() }

  public readBackType(_: Context): C.Core {
    return new C.Trivial();
  }

  public prettyPrint(): string {
    return 'Trivial';
  }

  public toString(): string {
    return this.prettyPrint();
  }
}

export class Sole extends Value {
  constructor() { super() }

  public readBackType(_: Context): C.Core {
    throw new Error("No readBackType for Sole.");
  }

  public prettyPrint(): string {
    return 'sole';
  }

  public toString(): string {
    return this.prettyPrint();
  }

}


export class Absurd extends Value {

  constructor() { super() }

  public readBackType(_: Context): C.Core {
    return new C.Absurd();
  }

  public prettyPrint(): string {
    return 'Absurd';
  }

  public toString(): string {
    return this.prettyPrint();
  }
  
}

export class InductiveTypeConstructor extends Value {
  constructor(
    public name: string,
    public parameters: Value[],
    public indices: Value[],
  ) { super() }

  public readBackType(context: Context): C.Core {
    // Look up the inductive type definition to get index types
    const inductiveBinder = context.get(this.name);
    let indexTypes: Value[] = [];

    if (inductiveBinder && inductiveBinder instanceof InductiveDatatypeBinder) {
      const inductiveType = inductiveBinder.type;
      if (inductiveType instanceof InductiveType) {
        indexTypes = inductiveType.indexTypes;
      }
    }

    return new C.InductiveTypeConstructor(
      this.name,
      this.parameters.map(p => p.readBackType(context)),
      this.indices.map((i, idx) => {
        // Indices are VALUES (like Zero, Add1), not types
        // We need to use readBack with the appropriate type
        const indexType = indexTypes[idx]?.now(); // Get the type for this index (e.g., Nat)

        // Check if this is a Delay that hasn't been forced yet
        if (i instanceof Delay) {
          const boxContent = i.val.get();
          if (boxContent instanceof DelayClosure) {
            // It's a closure - try to force it
            try {
              const iNow = i.now();
              if (indexType) {
                // Use readBack with the index type
                return readBack(context, indexType, iNow);
              } else if (iNow instanceof Neutral) {
                return iNow.neutral.readBackNeutral(context);
              } else {
                // Fallback: return the Core expression if we can't read back
                return boxContent.expr;
              }
            } catch {
              // If evaluation fails due to free variables, return the Core expression as-is
              return boxContent.expr;
            }
          } else {
            // Already evaluated
            const val = boxContent as Value;
            if (indexType) {
              return readBack(context, indexType, val);
            } else if (val instanceof Neutral) {
              return val.neutral.readBackNeutral(context);
            } else {
              // Can't read back without type - this shouldn't happen
              throw new Error(`Cannot read back index without type: ${val.prettyPrint()}`);
            }
          }
        } else {
          // Not a Delay - force it and read back
          const iNow = i.now();
          if (indexType) {
            return readBack(context, indexType, iNow);
          } else if (iNow instanceof Neutral) {
            return iNow.neutral.readBackNeutral(context);
          } else {
            // Can't read back without type - this shouldn't happen
            throw new Error(`Cannot read back index without type: ${iNow.prettyPrint()}`);
          }
        }
      }),
    )
  }

  public prettyPrint(): string {
    return `InductiveType ${this.name}`;
  }

  public toString(): string {
    return this.prettyPrint();
  }
}

export class InductiveType extends Value {
  constructor(
    public name: string,
    public parameterTypes: Value[],
    public indexTypes: Value[],
  ) { super() }

  public readBackType(context: Context): C.Core {
    return new C.InductiveType(
      this.name,
      this.parameterTypes.map(p => p.readBackType(context)),
      this.indexTypes.map(i => i.readBackType(context)),
    )
  }

  public prettyPrint(): string {
    return `InductiveType ${this.name}`;
  }

  public toString(): string {
    return this.prettyPrint();
  }
}

export class Constructor extends Value {

  constructor(
    public name: string,
    public type: string,
    public args: Value[],
    public index: number,
    public recursive_args: Value[],
  ) { super() }

  public readBackType(_context: Context): C.Core {
    throw new Error("No readBackType for Constructor.");
  }

  public prettyPrint(): string {
    const args = this.args.map(a => a.prettyPrint()).join(' ');
    return `(${this.name}${args.length > 0 ? ' ' + args : ''})`;
  }

  public toString(): string {
    return this.prettyPrint();
  }
}

export class ConstructorType extends Value {
  constructor(
    public name: string,
    public index: number,
    public type: string,
    public argTypes: Value[],
    public rec_argTypes: Value[],
    public resultType: Value,
    public argNames: string[],
    public rec_argNames: string[]

  ) {super()}
  public readBackType(_context: Context): C.Core {
    throw Error('Method not implemented')
  }
  public prettyPrint(): string {
    return `ConstructorType (${this.argTypes.map(a => a.prettyPrint()).join(' ')})`;
  }

}

export class EliminatorType extends Value {
  constructor(
    public typeName: string,
    public targetType: Value,
    public motiveType: Value,
    public methodTypes: Value[]
  ) { super(); }

  public readBackType(context: Context): C.Core {
    return new C.EliminatorType(
      this.typeName,
      this.targetType.readBackType(context),
      this.motiveType.readBackType(context),
      this.methodTypes.map(m => m.readBackType(context))
    );
  }

  public prettyPrint(): string {
    return `EliminatorType ${this.typeName} ${this.targetType.prettyPrint()} ${this.motiveType.prettyPrint()} ${this.methodTypes.map(m => m.prettyPrint()).join(' ')}`;
  }

  public toString(): string {
    return this.prettyPrint();
  }
}
