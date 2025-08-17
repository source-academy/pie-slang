import 'jest';
import { schemeParse, Parser, pieDeclarationParser, Claim, Declaration, SamenessCheck} from '../parser/parser';

function testParser(input: string) {
  const parser = new Parser();
  return Parser.parsePie(input);
}

test("Test parsing result atom", () => {
  const input = `
(define-tactically even-or-odd
((intro n)
(exact (same n))))
`;

});