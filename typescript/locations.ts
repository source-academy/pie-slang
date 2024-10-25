
type Datum = number | Symbol | boolean | undefined | Datum[];

class syntax {
  public datum: Datum;
  public source: string;
  public line: number;
  public column: number;
  public position: number;
  public span: number;
}


export class location {
  constructor(
    public syntax: syntax,
    public forInfo: boolean
  ) { };
}

/*
    * Function to create a Location from a syntax object.
    * The forInfo field is set to true.
*/
export function syntaxToLocation(stx: syntax): location {
  return new location(stx, true);
}

/*
    * Function to create a Location from a syntax object.
    * The forInfo field is set to false.
*/
export function notForInfo(loc: location): location {
  return new location(loc.syntax, false);
}

export function isForInfo(loc: location): boolean {
  return loc.forInfo;
}

/*
    * Function to convert a Location to a source location.
    * The source location is a tuple of the form:
    *   [source, line, column, position, span]
*/
export function locationToSrcLoc(loc: location): [string, number, number, number, number] {
  const stx = loc.syntax;
  return [
    stx.source, 
    stx.line,
    stx.column,
    stx.position,
    stx.span,
  ];
}


