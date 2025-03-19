export enum TokenType {
    // S-expression syntax
  LEFT_PAREN,
  RIGHT_PAREN,
  LEFT_BRACKET,
  RIGHT_BRACKET,
  DOT,
  // Atoms: Literals or Identifiers
  IDENTIFIER,
  NUMBER,
  BOOLEAN,
  STRING,
    // SICP Chapter 1
    IF,
    LET,
    COND,
    ELSE,
    CLAIM,
    DEFINE,
    LAMBDA,
}