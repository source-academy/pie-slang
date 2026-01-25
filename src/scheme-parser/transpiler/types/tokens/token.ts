/**
 * A data structure representing a particular token.
 */

import { Position } from "../location";
import { TokenType } from ".";

export class Token {
  type: TokenType;
  lexeme: string;
  literal: any;
  start: number;
  end: number;
  pos: Position;
  endPos: Position;

  constructor(
    type: TokenType,
    lexeme: any,
    literal: any,
    start: number,
    end: number,
    line: number,
    col: number
  ) {
    this.type = type;
    this.lexeme = lexeme;
    this.literal = literal;
    this.start = start;
    this.end = end;
    this.pos = new Position(line, col);
    this.endPos = new Position(line, col + lexeme.length - 1);
  }

  /**
   * Converts a token to another representation of itself.
   * Especially useful for quotation tokens.
   * @returns A converted token.
   */
  public convertToken(): Token {
    switch (this.type) {
      case TokenType.APOSTROPHE:
        return new Token(
          TokenType.QUOTE,
          this.lexeme,
          this.literal,
          this.start,
          this.end,
          this.pos.line,
          this.pos.column
        );
      case TokenType.BACKTICK:
        return new Token(
          TokenType.QUASIQUOTE,
          this.lexeme,
          this.literal,
          this.start,
          this.end,
          this.pos.line,
          this.pos.column
        );
      case TokenType.HASH_VECTOR:
        return new Token(
          TokenType.VECTOR,
          this.lexeme,
          this.literal,
          this.start,
          this.end,
          this.pos.line,
          this.pos.column
        );
      case TokenType.COMMA:
        return new Token(
          TokenType.UNQUOTE,
          this.lexeme,
          this.literal,
          this.start,
          this.end,
          this.pos.line,
          this.pos.column
        );
      case TokenType.COMMA_AT:
        return new Token(
          TokenType.UNQUOTE_SPLICING,
          this.lexeme,
          this.literal,
          this.start,
          this.end,
          this.pos.line,
          this.pos.column
        );
      default:
        return this;
    }
  }

  /**
   * For debugging.
   * @returns A string representation of the token.
   */
  public toString(): string {
    return `${this.lexeme}`;
  }
}
