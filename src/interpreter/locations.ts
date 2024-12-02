import { Element } from "./parser";

// type Datum = number | Symbol | boolean | undefined | Datum[];
export type Datum = Symbol;
export class Syntax {
  constructor(
    public source: Symbol | number,
    public line: number,
    public column: number,
  ) { }
}


export class Location {
  constructor(
    public syntax: Syntax,
    public forInfo: boolean
  ) { };
}

/*
    * Function to create a Location from a syntax object.
    * The forInfo field is set to true.
*/
export function syntaxToLocation(stx: Syntax): Location {
  return new Location(stx, true);
}

/*
    * Function to create a Location from a syntax object.
    * The forInfo field is set to false.
*/
export function notForInfo(loc: Location): Location {
  return new Location(loc.syntax, false);
}

export function isForInfo(loc: Location): boolean {
  return loc.forInfo;
}

/*
    * Function to convert a Location to a source location.
    * The source location is a tuple of the form:
    *   [source, line, column, position, span]
*/
export function locationToSrcLoc(loc: Location): [Symbol | number, number, number] {
  const stx = loc.syntax;
  return [
    stx.source, 
    stx.line,
    stx.column,
  ];
}


