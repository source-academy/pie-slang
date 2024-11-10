import { Position } from "../types/location";

export abstract class LexerError extends SyntaxError {
  // This base error shouldn't be used directly.
  loc: Position;
  constructor(message: string, line: number, col: number) {
    super(message);
    this.loc = {
      line: line,
      column: col,
    };
  }
  toString(): string {
    return this.message;
  }
}

export class UnexpectedCharacterError extends LexerError {
  char: string;
  constructor(line: number, col: number, char: string) {
    super(`Unexpected character \'${char}\' (${line}:${col})`, line, col);
    this.char = char;
    this.name = "UnexpectedCharacterError";
  }
}

export class UnexpectedEOFError extends LexerError {
  constructor(line: number, col: number) {
    super(`Unexpected EOF (${line}:${col})`, line, col);
    this.name = "UnexpectedEOFError";
  }
}
