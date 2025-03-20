import { Position } from '../../scheme_parser/transpiler/types/location';

export class SourceLocation {
  constructor(
    public source: string,
    public startLine: number,
    public startColumn: number,
    public endLine: number,
    public endColumn: number,
  ) { }
}


export class Syntax {
  constructor(
    public start: Position,
    public end: Position,
    public source: string
  ) { }
}

export class Location {
  constructor(
    public syntax: Syntax,
    public forInfo: boolean
  ) { }

  public locationToSrcLoc(): SourceLocation {
    return new SourceLocation(
      this.syntax.source,
      this.syntax.start.line,
      this.syntax.start.column,
      this.syntax.end.line,
      this.syntax.end.column
    )
  }

  public toString(): string {
    return `${this.syntax.source}:${this.syntax.start.line}:${this.syntax.start.column}`;
  }
}

export function notForInfo(loc: Location): Location {
  return new Location(loc.syntax, false);
}
