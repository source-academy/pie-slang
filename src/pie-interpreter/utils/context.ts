import * as C from '../types/core';
import { InductiveType, Neutral, Universe, Value, InductiveTypeConstructor } from '../types/value';

import { Location } from './locations';
import { go, stop, Perhaps, goOn, PerhapsM, Message } from '../types/utils';
import { Environment } from './environment';
import { readBack } from '../evaluator/utils';
import { Source} from '../types/source';
import { Variable } from '../types/neutral';
import { ProofManager } from '../tactics/proof-manager';
import { Tactic } from '../tactics/tactics';
import { ProofTreeData } from '../tactics/proofstate';
import { schemeParse, Parser } from '../parser/parser';

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

export interface TacticalResult {
  context: Context;
  message: string;
}

export function addDefineTacticallyToContext(
  ctx: Context,
  name: string,
  location: Location,
  tactics: Tactic[],
  verbose: boolean = false
): Perhaps<TacticalResult> {
  const proofManager = new ProofManager();
  let message = '';

  // Start the proof
  const startResult = proofManager.startProof(name, ctx, location);
  if (startResult instanceof stop) {
    return startResult;
  }
  if (verbose) {
    message += (startResult as go<string>).result + '\n';
  }

  // Apply each tactic
  for (const tactic of tactics) {
    const tacticResult = proofManager.applyTactic(tactic);
    if (tacticResult instanceof stop) {
      return tacticResult;
    }
    if (verbose) {
      message += (tacticResult as go<string>).result;
    }
  }

  // Check if proof is complete
  if (!proofManager.currentState || !proofManager.currentState.isComplete()) {
    const currentGoal = proofManager.currentState?.getCurrentGoal();
    let goalInfo = '';
    if (currentGoal instanceof go) {
      const goal = currentGoal.result;
      goalInfo = `\n\n${goal.prettyPrintWithContext()}`;
    }
    return new stop(
      location,
      new Message([`Proof incomplete. Not all goals have been solved.${goalInfo}`])
    );
  }

  // Proof complete - add definition to context
  const claim = ctx.get(name);
  if (!(claim instanceof Claim)) {
    return new stop(location, new Message([`${name} is not a valid claim`]));
  }

  const type = claim.type;

  // Extract proof term from the goal tree
  const goalTree = proofManager.currentState?.goalTree;
  const proofTerm = goalTree?.extractTerm();

  if (proofTerm) {
    // We have the actual proof term - evaluate it and add to context
    const proofValue = valInContext(ctx, proofTerm);
    const newCtx = bindVal(removeClaimFromContext(ctx, name), name, type, proofValue);
    return new go({ context: newCtx, message });
  } else if (proofManager.currentState.isComplete()) {
    // Proof term extraction failed - this shouldn't happen if all tactics are implemented correctly
    return new stop(
      location,
      new Message([`Failed to extract proof term for '${name}'.`])
    );
  } else {
    return new stop(
      location,
      new Message([`Proof incomplete. Cannot extract proof term for '${name}'.`])
    );
  }
}

/**
 * Interactive version of addDefineTacticallyToContext.
 * Instead of applying hardcoded tactics, calls a provider callback
 * for each proof step to get the next tactic from an external source (e.g. an LLM).
 *
 * The provider receives the serialized proof state and returns a tactic string,
 * or null to abort the proof. On failure (parse error or tactic rejection),
 * the provider is called again with the error message so it can retry.
 */
export async function addDefineTacticallyInteractive(
  ctx: Context,
  name: string,
  location: Location,
  tacticProvider: (state: InteractiveProofState) => Promise<string | null>,
  maxSteps: number = 100,
  maxRetries: number = 3,
): Promise<Perhaps<TacticalResult>> {
  const proofManager = new ProofManager();
  let message = '';

  // Start the proof
  const startResult = proofManager.startProof(name, ctx, location);
  if (startResult instanceof stop) {
    return startResult;
  }

  // Get theorem type from claim
  const claim = ctx.get(name);
  if (!(claim instanceof Claim)) {
    return new stop(location, new Message([`${name} is not a valid claim`]));
  }
  const theoremType = claim.type.readBackType(ctx).prettyPrint();

  // Interactive tactic loop
  let step = 0;
  while (step < maxSteps) {
    if (!proofManager.currentState || proofManager.currentState.isComplete()) {
      break;
    }

    const goalResult = proofManager.currentState.getCurrentGoal();
    if (!(goalResult instanceof go)) {
      break;
    }

    const goal = goalResult.result;
    // Inline serialization (avoids dependency on training-data-extractor)
    const contextEntries = Array.from(goal.context.entries())
      .filter(([n]) => !n.startsWith('_'))
      .map(([n, binder]) => ({
        name: n,
        type: binder.type.readBackType(goal.context).prettyPrint(),
      }));
    // Split into global (Define) and local (Free) entries
    const globalContext = contextEntries.filter((_e, i) => {
      const [, binder] = Array.from(goal.context.entries())[i];
      return binder instanceof Define;
    });
    const localContext = contextEntries.filter((_e, i) => {
      const [, binder] = Array.from(goal.context.entries())[i];
      return binder instanceof Free;
    });
    const goalStr = goal.type.readBackType(goal.context).prettyPrint();

    let lastError: string | undefined;
    let applied = false;

    for (let retry = 0; retry <= maxRetries; retry++) {
      // Ask the provider for the next tactic
      const tacticStr = await tacticProvider({
        theoremName: name,
        theoremType,
        step,
        globalContext,
        localContext,
        goal: goalStr,
        complete: false,
        pendingBranches: proofManager.currentState.pendingBranches,
        error: lastError,
      });

      if (tacticStr === null) {
        return new stop(location, new Message([`Proof aborted by tactic provider at step ${step}`]));
      }

      // Parse the tactic
      const wrapped = tacticStr.trim().startsWith('(') ? tacticStr : `(${tacticStr})`;
      let tactic: Tactic;
      try {
        const parsed = schemeParse(wrapped);
        tactic = Parser.parseToTactics(parsed[0]);
      } catch (e: any) {
        lastError = `Parse error for "${tacticStr}": ${e.message}`;
        continue;
      }

      // Apply the tactic
      const tacticResult = proofManager.applyTactic(tactic);
      if (tacticResult instanceof stop) {
        lastError = `Tactic "${tacticStr}" failed: ${tacticResult.message}`;
        continue;
      }

      message += (tacticResult as go<string>).result;
      applied = true;
      break;
    }

    if (!applied) {
      return new stop(location, new Message([
        `Failed after ${maxRetries} retries at step ${step}. Last error: ${lastError}`
      ]));
    }

    step++;
  }

  // Check if proof is complete
  if (!proofManager.currentState || !proofManager.currentState.isComplete()) {
    const currentGoal = proofManager.currentState?.getCurrentGoal();
    let goalInfo = '';
    if (currentGoal instanceof go) {
      const goal = currentGoal.result;
      goalInfo = `\n\n${goal.prettyPrintWithContext()}`;
    }
    return new stop(
      location,
      new Message([`Proof incomplete after ${step} steps (max ${maxSteps}).${goalInfo}`])
    );
  }

  // Proof complete — extract proof term and add definition
  const type = claim.type;
  const goalTree = proofManager.currentState?.goalTree;
  const proofTerm = goalTree?.extractTerm();

  if (proofTerm) {
    const proofValue = valInContext(ctx, proofTerm);
    const newCtx = bindVal(removeClaimFromContext(ctx, name), name, type, proofValue);
    return new go({ context: newCtx, message });
  } else {
    return new stop(
      location,
      new Message([`Failed to extract proof term for '${name}'.`])
    );
  }
}

/** State passed to the interactive tactic provider. */
export interface InteractiveProofState {
  theoremName: string;
  theoremType: string;
  step: number;
  globalContext: Array<{ name: string; type: string }>;
  localContext: Array<{ name: string; type: string }>;
  goal: string;
  complete: boolean;
  pendingBranches: number;
  /** If the previous tactic attempt failed, this contains the error message. */
  error?: string;
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
    } else if (binder instanceof InductiveDatatypeBinder) {
      env.set(name, binder.type);
    } // else continue;
  }
  return env;
}

export function getInductiveType(ctx: Context, where: Location, name:string): Perhaps<InductiveDatatypeBinder> {
  for (const [n, binder] of ctx) {
    if (binder instanceof InductiveDatatypeBinder && n === name) {
      return new go(binder);
    }
  }
  return new stop(where, new Message([`No inductive type found for ${name} at ${where}`]));
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

export class InductiveDatatypeBinder extends Binder {
  constructor(
    public name: string, 
    public type: InductiveType) {
      super()
    }
}

export class ConstructorTypeBinder extends Binder {
  constructor(
    public name: string,
    public constructorType: C.ConstructorType,
    public type: InductiveTypeConstructor
  ) {
      super()
    }
}

export class EliminatorBinder extends Binder {
  constructor(
    public name: string, 
    public type: Value) {
      super()
    }
}

export function varType(ctx: Context, where: Location, x: string): Perhaps<Value> {
  if (ctx.size === 0) {
    throw new Error(`The context ${JSON.stringify(ctx)} is empty, but we are looking for ${x}`);
  }
  for (const [y, binder] of ctx.entries()) {
    if (binder instanceof Claim) {
      continue;
    } else if (x === y) {
      // Inductive datatypes have type Universe
      if (binder instanceof InductiveDatatypeBinder) {
        return new go(new Universe());
      }
      return new go(binder.type);
    }
  }
  throw new Error(`Unknown variable ${x}`);
}

// Function to bind a free variable in a context
export function bindFree(ctx: Context, varName: string, tv: Value): Context {
  if (ctx.has(varName)) {
    // CHANGE: REMOVE ctx LOOP AFTER FIXING THE BUG
    for (const [x,] of ctx) {
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
export function isSerializableContext(ctx: unknown): ctx is SerializableContext {
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
