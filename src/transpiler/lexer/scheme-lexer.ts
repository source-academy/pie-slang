// Thanks to Ken Jin (py-slang) for the great resource
// https://craftinginterpreters.com/scanning.html
// This tokenizer/lexer is a modified version, inspired by both the
// tokenizer/lexer above as well as Ken Jin's py-slang tokenizer/lexer.
// It has been adapted to be written in typescript for scheme.
// Crafting Interpreters: https://craftinginterpreters.com/
// py-slang: https://github.com/source-academy/py-slang

import { stringIsSchemeNumber } from "../../stdlib/core-math";
import { Token } from "../types/tokens/token";
import { TokenType } from "../types/tokens/token-type";
import { Lexer } from "./lexer";
import * as LexerError from "./lexer-error";

// syntactic keywords in the scheme language
let keywords = new Map<string, TokenType>([
  [".", TokenType.DOT],
  ["if", TokenType.IF],
  ["let", TokenType.LET],
  ["cond", TokenType.COND],
  ["else", TokenType.ELSE],
  ["set!", TokenType.SET],
  ["begin", TokenType.BEGIN],
  ["delay", TokenType.DELAY],
  ["quote", TokenType.QUOTE],
  ["export", TokenType.EXPORT],
  ["import", TokenType.IMPORT],
  ["define", TokenType.DEFINE],
  ["lambda", TokenType.LAMBDA],
  ["define-syntax", TokenType.DEFINE_SYNTAX],
  ["syntax-rules", TokenType.SYNTAX_RULES],
]);

export class SchemeLexer implements Lexer {
  private readonly source: string;
  private readonly tokens: Token[];
  private start: number = 0;
  private current: number = 0;
  private line: number = 1;
  private col: number = 0;

  constructor(source: string) {
    this.source = source;
    this.tokens = [];
  }

  private isAtEnd(): boolean {
    return this.current >= this.source.length;
  }

  private advance(): string {
    // get the next character
    this.col++;
    return this.source.charAt(this.current++);
  }

  private jump(): void {
    // when you want to ignore a character
    this.start = this.current;
    this.col++;
    this.current++;
  }

  private addToken(type: TokenType): void;
  private addToken(type: TokenType, literal: any): void;
  private addToken(type: TokenType, literal: any = null): void {
    const text = this.source.substring(this.start, this.current);
    this.tokens.push(
      new Token(
        type,
        text,
        literal,
        this.start,
        this.current,
        this.line,
        this.col
      )
    );
  }

  public scanTokens(): Token[] {
    while (!this.isAtEnd()) {
      this.start = this.current;
      this.scanToken();
    }

    this.tokens.push(
      new Token(
        TokenType.EOF,
        "",
        null,
        this.start,
        this.current,
        this.line,
        this.col
      )
    );
    return this.tokens;
  }

  private scanToken(): void {
    const c = this.advance();
    switch (c) {
      case "(":
        this.addToken(TokenType.LEFT_PAREN);
        break;
      case ")":
        this.addToken(TokenType.RIGHT_PAREN);
        break;
      case "[":
        this.addToken(TokenType.LEFT_BRACKET);
        break;
      case "]":
        this.addToken(TokenType.RIGHT_BRACKET);
        break;
      case "'":
        this.addToken(TokenType.APOSTROPHE);
        break;
      case "`":
        this.addToken(TokenType.BACKTICK);
        break;
      case ",":
        if (this.match("@")) {
          this.addToken(TokenType.COMMA_AT);
          break;
        }
        this.addToken(TokenType.COMMA);
        break;
      case "#":
        // by itself, it is an error
        if (this.match("t") || this.match("f")) {
          this.booleanToken();
        } else if (this.match("|")) {
          // a multiline comment
          this.comment();
        } else if (this.match(";")) {
          // a datum comment
          this.addToken(TokenType.HASH_SEMICOLON);
        } else if (this.peek() === "(" || this.peek() === "[") {
          // We keep the hash character and the parenthesis/bracket
          // separate as our parentheses matching systems
          // will suffer with 4 possible left grouping tokens!

          // ensure that the next character is a vector
          this.addToken(TokenType.HASH_VECTOR);
        } else {
          // chars are not currently supported
          throw new LexerError.UnexpectedCharacterError(this.line, this.col, c);
        }
        break;
      case ";":
        // a comment
        while (this.peek() != "\n" && !this.isAtEnd()) this.advance();
        break;
      // double character tokens not currently needed
      case " ":
      case "\r":
      case "\t":
        // ignore whitespace
        break;
      case "\n":
        this.line++;
        this.col = 0;
        break;
      case '"':
        this.stringToken();
        break;
      case "|":
        this.identifierTokenLoose();
        break;
      default:
        // Deviates slightly from the original lexer.
        // Scheme allows for identifiers to start with a digit
        // or include a specific set of symbols.
        if (
          this.isDigit(c) ||
          c === "-" ||
          c === "+" ||
          c === "." ||
          c === "i" || // inf
          c === "n" // nan
        ) {
          // may or may not be a number
          this.identifierNumberToken();
        } else if (this.isValidIdentifier(c)) {
          // filtered out the potential numbers
          // these are definitely identifiers
          this.identifierToken();
        } else {
          throw new LexerError.UnexpectedCharacterError(this.line, this.col, c);
        }
        break;
    }
  }

  private comment(): void {
    while (!(this.peek() == "|" && this.peekNext() == "#") && !this.isAtEnd()) {
      if (this.peek() === "\n") {
        this.line++;
        this.col = 0;
      }
      this.advance();
    }

    if (this.isAtEnd()) {
      throw new LexerError.UnexpectedEOFError(this.line, this.col);
    }

    this.jump();
    this.jump();
  }

  private identifierToken(): void {
    while (this.isValidIdentifier(this.peek())) this.advance();
    this.addToken(this.checkKeyword());
  }

  private identifierTokenLoose(): void {
    // this is a special case for identifiers
    // add the first |
    this.advance();
    while (this.peek() != "|" && !this.isAtEnd()) {
      if (this.peek() === "\n") {
        this.line++;
        this.col = 0;
      }
      this.advance();
    }

    if (this.isAtEnd()) {
      throw new LexerError.UnexpectedEOFError(this.line, this.col);
    }

    // add the last |
    this.advance();

    this.addToken(this.checkKeyword());
  }

  private identifierNumberToken(): void {
    // we first obtain the entire identifier
    while (this.isValidIdentifier(this.peek())) {
      this.advance();
    }
    const lexeme = this.source.substring(this.start, this.current);
    if (stringIsSchemeNumber(lexeme)) {
      this.addToken(TokenType.NUMBER, lexeme);
      return;
    }
    this.addToken(this.checkKeyword());
  }

  private checkKeyword(): TokenType {
    var text = this.source.substring(this.start, this.current);
    if (keywords.has(text)) {
      return keywords.get(text) as TokenType;
    }
    return TokenType.IDENTIFIER;
  }

  private stringToken(): void {
    while (this.peek() != '"' && !this.isAtEnd()) {
      if (this.peek() === "\n") {
        this.line++;
        this.col = 0;
      }
      this.advance();
    }

    if (this.isAtEnd()) {
      throw new LexerError.UnexpectedEOFError(this.line, this.col);
    }

    // closing "
    this.advance();

    // trim the surrounding quotes
    const value = this.source.substring(this.start + 1, this.current - 1);
    this.addToken(TokenType.STRING, value);
  }

  private booleanToken(): void {
    this.addToken(TokenType.BOOLEAN, this.peekPrev() === "t" ? true : false);
  }

  private match(expected: string): boolean {
    if (this.isAtEnd()) return false;
    if (this.source.charAt(this.current) != expected) return false;
    this.current++;
    return true;
  }

  private peek(): string {
    if (this.isAtEnd()) return "\0";
    return this.source.charAt(this.current);
  }

  private peekNext(): string {
    if (this.current + 1 >= this.source.length) return "\0";
    return this.source.charAt(this.current + 1);
  }

  private peekPrev(): string {
    if (this.current - 1 < 0) return "\0";
    return this.source.charAt(this.current - 1);
  }

  private isDigit(c: string): boolean {
    return c >= "0" && c <= "9";
  }

  private isSpecialSyntax(c: string): boolean {
    return (
      c === "(" || c === ")" || c === "[" || c === "]" || c === ";" || c === "|"
    );
  }

  private isValidIdentifier(c: string): boolean {
    return !this.isWhitespace(c) && !this.isSpecialSyntax(c);
  }

  private isWhitespace(c: string): boolean {
    return c === " " || c === "\0" || c === "\n" || c === "\r" || c === "\t";
  }
}
