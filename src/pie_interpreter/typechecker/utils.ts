import { Value } from "../types/value";
import { Source } from "../types/source";
import { Application } from "../types/source";
import { Core } from "../types/core";
import { Location } from "../utils/locations";
import { Context, SerializableContext } from "../utils/context";
import { go, stop, Perhaps, Message } from "../types/utils";
import { alphaEquiv } from "../utils/alphaeqv";
import { readBack } from "../evaluator/utils";
import { inspect } from "util";
import { todoQueue } from "../try_llm/todo_solver";


type What = 'definition'
  | ['binding-site', Core]
  | ['is-type', Core]
  | ['has-type', Core]
  | ['TODO', SerializableContext, Core, Renaming];


// TODO: Implement PieInfoHook

export function PieInfoHook(where: Location, what: What): void {
  if (Array.isArray(what) && what[0] === 'TODO') {
    const [_, serializedCtx, expectedTypeCore, renaming] = what;

    // Reconstruct the actual Context from SerializableContext
    // For now, we'll use a simpler approach - just pass empty context
    // TODO: Properly deserialize SerializableContext to Context
    const ctx = new Map();

    // Convert Core type to Value for storage
    const expectedTypeValue = expectedTypeCore.valOf(new Map());

    // Queue for processing with real objects
    todoQueue.push({
      location: where,
      context: ctx,
      expectedType: expectedTypeValue,
      renaming: renaming
    });
  }
}

export function SendPieInfo(where: Location, what: What): void {
  if (where.forInfo) {
    PieInfoHook(where, what);
  }
}

// ### Renamings

export type Renaming = Map<string, string>;

// Function to rename a symbol using the Renaming list
export function rename(renames: Renaming, x: string): string {
  const rename = renames.get(x);
  return rename ? rename : x;
}

// Function to extend the Renaming list with a new pair
export function extendRenaming(renames: Renaming, from: string, to: string): Renaming {
  const newRenames = new Map([[from, to], ...renames]);
  return newRenames;
}

// ### Check the form of judgment Γ ⊢ c ≡ c type
export function sameType(ctx: Context, where: Location, given: Value, expected: Value): Perhaps<undefined> {
  console.log('cur_ctx', inspect(ctx, true, null, true));
  console.log('given type', inspect(given.readBackType(ctx), true, null, true));
  console.log('expected type', inspect(expected.readBackType(ctx), true, null, true));
  const givenE = given.readBackType(ctx);
  const expectedE = expected.readBackType(ctx);
  if (alphaEquiv(givenE, expectedE)) {
    return new go(undefined);
  } else {
    return new stop(
      where,
      new Message([`Expected ${expectedE} but got ${givenE}`])
    );
  }
}

// ### Check the form of judgment Γ ⊢ c : A type
export function convert(ctx: Context, where: Location, type: Value, from: Value, to: Value): Perhaps<undefined> {
  const fromE = readBack(ctx, type, from);
  const toE = readBack(ctx, type, to);
  if (alphaEquiv(fromE, toE)) {
    return new go(undefined);
  } else {
    return new stop(
      where,
      new Message([`The terms ${from.prettyPrint()} and ${to.prettyPrint()} are not the same ${type.prettyPrint()}.`])
    );
  }
}

// ### Claims + defines ###

export function atomOk(a: string): boolean {
  return allOkAtom(a.split(''));
}

function allOkAtom(cs: string[]): boolean {
  if (cs.length === 0) {
    return true;
  } else if (isAlphabetic(cs[0]) || cs[0] === '-') {
    return allOkAtom(cs.slice(1));
  } else {
    return false;
  }
}

function isAlphabetic(char: string): boolean {
  return /^[a-zA-Z]$/.test(char);
}

// Helper to concoct a function application form in source syntax
export function makeApp(a: Source, b: Source, cs: Source[]): Source {
  return new Application(a.location, a, b, cs);
}

