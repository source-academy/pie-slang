import * as C from '../types/core';
import { Neutral, Value } from '../types/value';

import { Location } from './locations';
import { go, stop, Perhaps, goOn, PerhapsM, Message } from '../types/utils';
import { Environment } from './environment';
import { readBack } from '../evaluator/utils';
import { Source } from '../types/source';
import { Variable } from '../types/neutral';
import { inspect } from 'util';
/*
    ## Contexts ##
    A context maps free variable names to binders.
*/

export type Context = Map<string, Binder>



export function extendContext(ctx: Context, name: string, binder: Binder): Context {
  return new Map([...ctx, [name, binder]]);
}

/*
  Find the value of an expression in the environment that
  corresponds to a context.
*/
export function valInContext(ctx: Context, expr: C.Core): Value {
  return expr.valOf(contextToEnvironment(ctx));
}

export function readBackContext(ctx: Context): SerializableContext {
  const result = new Map();
  for (const [x, binder] of ctx) {
    if (binder instanceof Free) {
      result.set(x, ['free', binder.type.readBackType(ctx)]);
    } else if (binder instanceof Define) {
      result.set(x,
        ['def',
          binder.type.readBackType(ctx),
          readBack(ctx, binder.type, binder.value)
        ]
      );
    } else if (binder instanceof Claim) {
      result.set(x,
        ['claim', binder.type.readBackType(ctx)]);
    }
  }
  return result;
}

export function nameNotUsed(ctx: Context, where: Location, name: string) {
  if (ctx.has(name)) {
    return new stop(
      where,
      new Message([`The name "${name}" is already in use in the context.`])
    );
  } else return new go<boolean>(true);
}

export function getClaim(ctx: Context, where: Location, name: string): Perhaps<Value> {
  for (const [x, binder] of ctx) {
    if (x === name) {
      if (binder instanceof Define) {
        return new stop(where, new Message([`The name "${name}" is already defined.`]))
      } else if (binder instanceof Claim) {
        return new go<Value>(binder.type);
      }
    }
  }
  return new stop(where, new Message([`No claim: ${name}`]));
}

export function addClaimToContext(ctx: Context, fun: string, funLoc: Location, type: Source): Perhaps<Context> {
  const typeOut = new PerhapsM<C.Core>("typeOut")
  return goOn(
    [
      [new PerhapsM("_"), () => nameNotUsed(ctx, funLoc, fun)],
      [typeOut, () => type.isType(ctx, new Map())]
    ],
    () => new go(
      extendContext(
        ctx,
        fun, 
        new Claim(valInContext(ctx, typeOut.value))
      )
    )
  )
}

export function removeClaimFromContext(ctx: Context, name: string): Context {
  ctx.delete(name);
  return ctx;
}

export function addDefineToContext(ctx: Context, fun: string, funLoc: Location, expr: Source): Perhaps<Context> {
  const typeOut = new PerhapsM<Value>("typeOut");
  const exprOut = new PerhapsM<C.Core>("exprOut");
  return goOn(
    [
      [typeOut, () => getClaim(ctx, funLoc, fun)],
      [exprOut,
        () => expr.check(
          ctx,
          new Map(),
          typeOut.value)
      ]
    ],
    () => new go(
      bindVal(
        removeClaimFromContext(ctx, fun),
        fun,
        typeOut.value,
        valInContext(ctx, exprOut.value)
      )
    )
  )
}

export function contextToEnvironment(ctx: Context): Environment {
  if (ctx.size === 0) {
    return new Map();
  }
  const bindings = ctx.entries();
  const env = new Map();
  for (const [name, binder] of bindings) {
    if (binder instanceof Define) {
      env.set(name, binder.value);
    } else if (binder instanceof Free) {
      env.set(name, new Neutral(binder.type, new Variable(name)));
    } // else continue;
  }
  return env;
}


export const initCtx: Context = new Map();

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
  if (ctx.size === 0) {
    throw new Error(`The context ${JSON.stringify(ctx)} is empty, but we are looking for ${x}`);
  }
  for (const [y, binder] of ctx.entries()) {
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
  if (ctx.has(varName)) {
    // CHANGE: REMOVE ctx LOOP AFTER FIXING THE BUG
    for (const [x, binder] of ctx) {
      if (x === varName) {
        //console.log(`binding ${varName} to ${binder}`);
        return extendContext(ctx, varName, new Free(tv));
      }
    }
    throw new Error(`
      ${varName} is already bound in ${JSON.stringify(ctx)}
    `);
  }
  return extendContext(ctx, varName, new Free(tv));
}

// Function to bind a value in a context
export function bindVal(ctx: Context, varName: string, type: Value, value: Value): Context {
  return extendContext(ctx, varName, new Define(type, value));
}


// For informationa bout serializable contexts, see the comments in
// normalize.rkt.
export type SerializableContext = 
  Map<string, ['free', C.Core] | ['def', C.Core, C.Core] | ['claim', C.Core]>;

// Predicate to check if something is a serializable context
export function isSerializableContext(ctx: any): ctx is SerializableContext {
  return ctx instanceof Map && Array.from(ctx.values()).every(value => {
    return Array.isArray(value) && 
           (
            (value[0] === 'free' && value[1] instanceof C.Core) 
            || 
            (value[0] === 'def' && value[1] instanceof C.Core && value[2] instanceof C.Core) 
            || 
            (value[0] === 'claim' && value[2] instanceof C.Core)
          );
  });
}

