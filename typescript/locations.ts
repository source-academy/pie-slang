
// type Datum = number | Symbol | boolean | undefined | Datum[];
type Datum = Symbol;
export class Syntax {
  public constructor(
    public datum: Datum,
    public source: Symbol,
    public line: number,
    public column: number,
    public position: number,
    public span: number
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
export function locationToSrcLoc(loc: Location): [Symbol, number, number, number, number] {
  const stx = loc.syntax;
  return [
    stx.source, 
    stx.line,
    stx.column,
    stx.position,
    stx.span,
  ];
}


