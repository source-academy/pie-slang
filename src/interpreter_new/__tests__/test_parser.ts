import 'jest';
import * as util from 'util';
import { SchemeLexer } from "../../scheme_parser/transpiler/lexer/scheme-lexer";
import { SchemeParser } from "../../scheme_parser/transpiler/parser/scheme-parser";
import { Extended } from '../../scheme_parser/transpiler/types/nodes/scheme-node-types';
import { Parser } from '../parser';

function testParser(input: string) {
  /* const lexer = new SchemeLexer(input);
  const parser = new SchemeParser('', lexer.scanTokens());
  const result : Extended.List[] = parser.parse() as Extended.List[];
  console.log(util.inspect(result, false, null, true)); */
  const parser = new Parser();
  return parser.parsePie(input);
}

test("Test parsing result 1", () => {
  const input = `
  (function n1 n2 n3)`;
  console.log(util.inspect(testParser(input), false, null, true));
});

test("Test parsing result 2", () => {
  const input = `
  (which-Nat 0 2 (lambda (x) x))`;
  console.log(util.inspect(testParser(input), false, null, true));
});

test("Test parsing result 3", () => {
  const input = `
  (-> Nat Nat)`;
  console.log(util.inspect(testParser(input), false, null, true));
});

test("Test parsing result 4", () => {
  const input = `
  (Pi ((x Nat) (y Nat) (z Nat)) Nat)`;
  console.log(util.inspect(testParser(input), false, null, true));
});

test("Test parsing result 5", () => {
  const input = `
  (the (-> Nat Nat) (λ (myVar) myVar))`;
  console.log(util.inspect(testParser(input), false, null, true));
});

test("Test parsing result 6", () => {
  const input = `
  (the (-> Nat Nat) (λ (myVar) myVar))`;
  console.log(util.inspect(testParser(input), false, null, true));
});

test("Test parsing result 7", () => {
  const input = `
  (the (-> Nat Nat) (λ (myVar) myVar))`;
  console.log(util.inspect(testParser(input), false, null, true));
});

test("Test parsing result 8", () => {
  const input = `
  (the (-> Nat Nat) (λ (z) z))`;
  console.log(util.inspect(testParser(input), false, null, true));
});

test("Test parsing result 9", () => {
  const input = `
  (the (-> Nat Nat Nat) (λ (x x) x))`;
  console.log(util.inspect(testParser(input), false, null, true));
});

test("Test parsing result 10", () => {
  const input = `
  (which-Nat 1 2 (lambda (x) x))`;
  console.log(util.inspect(testParser(input), false, null, true));
});