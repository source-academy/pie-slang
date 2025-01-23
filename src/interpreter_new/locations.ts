import { TokenType } from './tokenTypes';

class Position {
  constructor(
    public line: number,
    public column: number
  ) { }
}

class Token {
  type: TokenType;
  lexeme: string;
  literal: any;
  pos: Position;
  endPos: Position;

  constructor(
    type: TokenType,
    lexeme: any,
    literal: any,
    line: number,
    col: number
  ) {
    this.type = type;
    this.lexeme = lexeme;
    this.literal = literal;
    this.pos = new Position(line, col);
    this.endPos = new Position(line, col + lexeme.length - 1);
  }

  public toString(): string {
    return `${this.lexeme}`;
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