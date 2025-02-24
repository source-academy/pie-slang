import { Value } from './value';
import { Location } from '../locations';
import * as C from './core';
import { go, Perhaps } from './utils';
import { contextToEnvironment } from './environment';
import { readBack } from '../normalize/utils';
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
    return expr.valOf(contextToEnvironment(this));
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

