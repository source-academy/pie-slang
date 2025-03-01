import { Neutral, Value } from './value';
import { Location } from '../locations';
import * as C from './core';
import { go, stop, Perhaps, goOn, PerhapsM, Message } from './utils';
import { Environment } from './environment';
import { readBack } from '../normalize/utils';
import { Source } from './source';
import { Renaming } from '../typechecker/utils';
import { Variable } from './neutral';
/*
    ## Contexts ##
    A context maps free variable names to binders.
*/

export class Context {
  constructor(
    public context: Map<string, Binder>
  ) { }

  public extendContext(name: string, binder: Binder): Context {
    this.context.set(name, binder);
    return this;
  }
  /*
    Find the value of an expression in the environment that
    corresponds to a context.
  */
  public valInContext(expr: C.Core): Value {
    return expr.valOf(this.contextToEnvironment());
  }

  public readBackContext(): SerializableContext {
    const result = new SerializableContext(new Map());
    for (const [x, binder] of this.context) {
      if (binder instanceof Free) {
        result.context.set(x, ['free', binder.type.readBackType(this)]);
      } else if (binder instanceof Define) {
        result.context.set(x, 
          ['def', 
            binder.type.readBackType(this),
            readBack(this, binder.type, binder.value)
          ]
        );
      } else if (binder instanceof Claim) {
        result.context.set(x, 
          ['claim', binder.type.readBackType(this)]);
      }
    }
    return result;
  }

  public nameNotUsed(where: Location, name: string) {
    if (this.context.has(name)) {
      return new stop(
        where, 
        new Message([`The name "${name}" is already in use in the context.`])
      );
    } else return new go<boolean>(true);
  }

  public getClaim(where: Location, name: string): Perhaps<Value> {
    for(const [x, binder] of this.context) {
      if(x === name) {
        if (binder instanceof Define) {
          return new stop(where, new Message([`The name "${name}" is already defined.`]))
        } else if (binder instanceof Claim) {
          return new go<Value>(binder.type);
        }
      }
    }
    return new stop(where, new Message([`No claim: ${name}`]));
  }

  public addClaimToContext(fun: string, funLoc: Location, type: Source): Perhaps<Context> {
    const typeOut = new PerhapsM<C.Core>("typeOut")
    return goOn(
      [
        [new PerhapsM("_"), () => this.nameNotUsed(funLoc, fun)],
        [typeOut, () => type.isType(this, new Renaming())]
      ],
      () => new go(
        this.extendContext(
          fun, new Claim(this.valInContext(typeOut.value))
        )
      )
    )
  }

  public removeClaimFromContext(name: string): Context {
    this.context.delete(name);
    return this;
  }

  public addDefineToContext(fun: string, funLoc: Location, expr: Source): Perhaps<Context> {
    const typeOut = new PerhapsM<Value>("typeOut");
    const exprOut = new PerhapsM<C.Core>("exprOut");
    return goOn(
      [
        [typeOut, () => this.getClaim(funLoc, fun)],
        [exprOut, 
          () => expr.check(
            this, 
            new Renaming(),
            typeOut.value)
        ]
      ],
      () => new go(
        bindVal(
          this.removeClaimFromContext(fun),
          fun,
          typeOut.value,
          this.valInContext(exprOut.value)
        )
      )
    )
  }

  public contextToEnvironment(): Environment {
    if (this.context.size === 0) {
      return new Environment(new Map());
    }
    const bindings = this.context.entries();
    const environment = new Map();
    for (const [name, binder] of bindings) {
      if (binder instanceof Define) {
        environment.set(name, binder.value);
      } else if (binder instanceof Free) {
        environment.set(name, new Neutral(binder.type, new Variable(name)));
      } // else continue;
    }
    return new Environment(environment);
  }
}




const initCtx: Context = new Context(new Map());

// There are three kinds of binders: a free binder represents a free
// variable, that was bound in some larger context by λ, Π, or Σ. A
// def binder represents a name bound by define. A claim binder
// doesn't actually bind a name; however, it reserves the name for
// later definition with define and records the type that will be
// used.

export abstract class Binder {
  abstract type: Value;
}

export class Claim extends Binder {
  constructor(public type: Value) { super() }
}

export class Define extends Binder {
  constructor(public type: Value, public value: Value) { super() }
}

export class Free extends Binder {
  constructor(public type: Value) { super() }
}

export function varType(ctx: Context, where: Location, x: string): Perhaps<Value> {
  if (ctx.context.size === 0) {
    throw new Error(`Unknown variable ${x}`);
  }
  for (const [y, binder] of ctx.context.entries()) {
    if (binder instanceof Claim) {
      continue;
    } else if (x === y) {
      return new go(binder.type);
    }
  }
  throw new Error(`Unknown variable ${x}`);
}

// Function to bind a free variable in a context
export function bindFree(ctx: Context, varName: string, tv: Value): Context {
  if (ctx.context.has(varName)) {
    throw new Error(`
      ${varName} is already bound in ${JSON.stringify(ctx)}
    `);
  }
  return ctx.extendContext(varName, new Free(tv));
}

// Function to bind a value in a context
export function bindVal(ctx: Context, varName: string, type: Value, value: Value): Context {
  return ctx.extendContext(varName, new Define(type, value));
}


// For informationa bout serializable contexts, see the comments in
// normalize.rkt.
export class SerializableContext {
  constructor(
    public context: Map<string, ['free', C.Core] | ['def', C.Core, C.Core] | ['claim', C.Core]>
  ) { }
}

// Predicate to check if something is a serializable context
function isSerializableContext(ctx: any): ctx is SerializableContext {
  return ctx instanceof SerializableContext;
}

