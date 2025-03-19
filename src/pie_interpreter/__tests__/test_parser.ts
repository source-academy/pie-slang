import 'jest';
import * as util from 'util';
import { Parser } from '../parser/parser';

function testParser(input: string) {
  const parser = new Parser();
  return parser.parsePie(input);
}

test("Test parsing result atom", () => {
  const input = `
  'a`;
  //DELETEME console.log(util.inspect(testParser(input), false, null, true));
});

test("Test parsing result number", () => {
  const input = `
  42`;
  //DELETEME console.log(util.inspect(testParser(input), false, null, true));
});

test("Test parsing result 1", () => {
  const input = `
  (function n1 n2 n3)`;
  //DELETEME console.log(util.inspect(testParser(input), false, null, true));
});

test("Test parsing result 2", () => {
  const input = `
  (which-Nat 0 2 (lambda (x) x))`;
  //DELETEME console.log(util.inspect(testParser(input), false, null, true));
});

test("Test parsing result 3", () => {
  const input = `
  (-> Nat Nat)`;
  //DELETEME console.log(util.inspect(testParser(input), false, null, true));
});

test("Test parsing result 4", () => {
  const input = `
  (Pi ((x Nat) (y Nat) (z Nat)) Nat)`;
  //DELETEME console.log(util.inspect(testParser(input), false, null, true));
});

test("Test parsing result 5", () => {
  const input = `
  (the (-> Nat Nat) (λ (myVar) myVar))`;
  //DELETEME console.log(util.inspect(testParser(input), false, null, true));
});

test("Test parsing result 6", () => {
  const input = `
  (the (-> Nat Nat) (λ (myVar) myVar))`;
  //DELETEME console.log(util.inspect(testParser(input), false, null, true));
});

test("Test parsing result 7", () => {
  const input = `
  (the (-> Nat Nat) (λ (myVar) myVar))`;
  //DELETEME console.log(util.inspect(testParser(input), false, null, true));
});

test("Test parsing result 8", () => {
  const input = `
  (the (-> Nat Nat) (λ (z) z))`;
  //DELETEME console.log(util.inspect(testParser(input), false, null, true));
});

test("Test parsing result 9", () => {
  const input = `
  (the (-> Nat Nat Nat) (λ (x x) x))`;
  //DELETEME console.log(util.inspect(testParser(input), false, null, true));
});

test("Test parsing result 10", () => {
  const input = `
  (which-Nat 1 2 (lambda (x) x))`;
  //DELETEME console.log(util.inspect(testParser(input), false, null, true));
});