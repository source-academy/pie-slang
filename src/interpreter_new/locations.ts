import { TokenType } from './tokenTypes';

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
}

export function locationToSrcLoc(loc: Location): [string | number, number, number] {
  const stx = loc.source;
  return [
    stx.source, 
    stx.pos.line,
    stx.pos.column,
  ];
}