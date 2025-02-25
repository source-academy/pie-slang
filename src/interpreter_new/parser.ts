import { SchemeLexer } from "../scheme_parser/transpiler/lexer/scheme-lexer";
import { SchemeParser } from "../scheme_parser/transpiler/parser/scheme-parser";
import { Extended } from "../scheme_parser/transpiler/types/nodes/scheme-node-types";


export function syntaxParse(stx: string): Extended.List[] {
  const lexer = new SchemeLexer(stx);
  const parser = new SchemeParser('', lexer.scanTokens());
  const ast : Extended.List[] = parser.parse() as Extended.List[];
  return ast;
}