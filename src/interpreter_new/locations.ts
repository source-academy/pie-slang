import { TokenType } from './tokenTypes';
import { SourceLocation } from './types/utils';

class Position {
  constructor(
    public line: number,
    public column: number
  ) { }
}

class Token {
  type: TokenType;
  source: string;
  literal: any;
  pos: Position;
  endPos: Position;

  constructor(
    type: TokenType,
    source: any,
    literal: any,
    line: number,
    col: number
  ) {
    this.type = type;
    this.source = source;
    this.literal = literal;
    this.pos = new Position(line, col);
    this.endPos = new Position(line, col + source.length - 1);
  }

  public toString(): string {
    return `${this.source}`;
  }
}

// Define Syntax as a node on AST
type Syntax = Token;

export class Location {
  constructor(
    public source: Syntax,
    public forInfo: boolean
  ) { }

  public locationToSrcLoc(): SourceLocation {
    const stx = this.source;
      
  }
}

/*
    * Function to create a Location from a syntax object.
    * The forInfo field is set to false.
*/
export function notForInfo(loc: Location): Location {
  return new Location(loc.source, false);
}
