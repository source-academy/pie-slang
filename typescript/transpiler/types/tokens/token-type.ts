// Adapted from https://craftinginterpreters.com/scanning.html
// Adapted for Scheme use

export enum TokenType {
  // + - * / % ^ ! = < > & | ~ etc are recognized as IDENTIFIERS

  // S-expression syntax
  LEFT_PAREN,
  RIGHT_PAREN,
  LEFT_BRACKET,
  RIGHT_BRACKET,
  DOT,

  // Datum comments
  HASH_SEMICOLON,

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
  DEFINE,
  LAMBDA,

  // SICP Chapter 2
  APOSTROPHE, // Quote
  BACKTICK, // Quasiquote
  COMMA, // Unquote
  COMMA_AT, // Unquote-splicing
  QUOTE,
  QUASIQUOTE,
  UNQUOTE,
  UNQUOTE_SPLICING,

  // SICP Chapter 3
  SET,
  BEGIN,
  DELAY,

  // Other important keywords
  IMPORT,
  EXPORT,

  // keywords associated with macros
  DEFINE_SYNTAX,
  SYNTAX_RULES,

  // Not in scope at the moment
  HASH_VECTOR, // vector
  VECTOR, // depreciated, as i believe
  // turning vector into a procedure call is better
  EOF,
}
