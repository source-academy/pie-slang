import { Value } from "../types/value";
import { Source } from "../types/source";
import { Application } from "../types/source";
import { Core } from "../types/core";
import { Location } from "../locations";
import { Context, SerializableContext } from "../types/contexts";
import { go, stop, Perhaps } from "../types/utils";
import { alphaEquiv } from "../alphaeqv";
import { readBack } from "../normalize/utils";


type What = 'definition'
  | ['binding-site', Core]
  | ['is-type', Core]
  | ['has-type', Core]
  | ['TODO', SerializableContext, Core];

export function PieInfoHook(where: Location, what: What): void {

}

export function SendPieInfo(where: Location, what: What): void {
  if (where.forInfo) {
    PieInfoHook(where, what);
  }
}

// ### Renamings

export class Renaming {
  constructor(
    public renames: Map<string, string> = new Map()
  ) { }

  // Function to rename a symbol using the Renaming list
  public rename(x: string): string {
    const rename = this.renames.get(x);
    return rename ? rename : x;
  }

  // Function to extend the Renaming list with a new pair
  public extendRenaming(from: string, to: string): Renaming {
    this.renames.set(from, to);
    return this;
  }
}

// ### Check the form of judgment Γ ⊢ c ≡ c type
function sameType(ctx: Context, where: Location, given: Value, expected: Value): Perhaps<undefined> {
  const givenE = given.readBackType(ctx);
  const expectedE = expected.readBackType(ctx);
  if (alphaEquiv(givenE, expectedE)) {
    return new go(undefined);
  } else {
    return new stop(
      where,
      [`Expected ${expectedE} but got ${givenE}`]
    );
  }
}

// ### Check the form of judgment Γ ⊢ c : A type
function convert(ctx: Context, where: Location, type: Value, from: Value, to: Value): Perhaps<undefined> {
  const fromE = readBack(ctx, type, from);
  const toE = readBack(ctx, type, to);
  if (alphaEquiv(fromE, toE)) {
    return new go(undefined);
  } else {
    return new stop(
      where,
      [`The terms ${from} and ${to} are not the same ${type}.`]
    );
  }
}

// ### Claims + defines ###

function atomOk(a: string): boolean {
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
function makeApp(a: Source, b: Source, cs: Source[]): Source {
  return new Source(a.location, new Application(a, b, cs));
}