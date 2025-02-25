import { TokenType } from './tokenTypes';
import { SourceLocation } from './types/utils';
import { Location as Syntax } from '../scheme_parser/transpiler/types/location';

// class Position {
//   constructor(
//     public line: number,
//     public column: number
//   ) { }
// }

// class Token {
//   type: TokenType;
//   source: string;
//   literal: any;
//   pos: Position;
//   endPos: Position;

//   constructor(
//     type: TokenType,
//     source: any,
//     literal: any,
//     line: number,
//     col: number
//   ) {
//     this.type = type;
//     this.source = source;
//     this.literal = literal;
//     this.pos = new Position(line, col);
//     this.endPos = new Position(line, col + source.length - 1);
//   }

//   public toString(): string {
//     return `${this.source}`;
//   }
// }

// Define Syntax as a node on AST

export class Location {
  constructor(
    public source: Syntax,
    public forInfo: boolean
  ) { }

  public locationToSrcLoc(): SourceLocation {
    const stx = this.source;
    return new SourceLocation(
      this.source.start.line,
      this.source.start.column,
      this.source.end.line,
      this.source.end.column
    )
  }
}