import { schemeParse } from "../..";

test("schemeParse (standard)", () => {
  const source = `
  (import "std" (list map))
  (define (square x) (* x x))
  (square 5/8)
  (begin (define x 5) (set! x 10) x)
  (define (square x) (begin (define x 5) (* x x)))
  `;
  const program = schemeParse(source, 4);
  expect(program).toMatchSnapshot();
});

test("schemeParse (s-expression)", () => {
  const source = `
  (import "std" (list map))
  (define (square x) (* x x))
  (square 5/8)
  (begin (define x 5) (set! x 10) x)
  (define (square x) (begin (define x 5) (* x x)))
  `;
  const program = schemeParse(source, 5);
  expect(program).toMatchSnapshot();
});
