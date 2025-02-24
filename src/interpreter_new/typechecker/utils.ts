import { alphaEquiv } from "../alphaeqv";
import { Source } from "../types/source";
import { SourceLocation } from "../types/utils";
import { Application } from "../types/source";

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