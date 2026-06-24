import { evaluatePie } from "../main";

// Named holes: `TODO-<name>` carries a distinct name, type-checks like a bare
// `TODO`, and a program may carry several open named holes at once.
describe("Named holes (TODO-<name>)", () => {
  test("a named hole type-checks like a bare TODO", () => {
    const program = `
      (claim step (-> Nat Nat))
      (define step (lambda (n) TODO-goal))
    `;
    expect(() => evaluatePie(program)).not.toThrow();
  });

  test("several distinct named holes in one program all type-check", () => {
    const program = `
      (claim f (-> Nat Nat))
      (define f (lambda (n) TODO-first))
      (claim g (-> Nat Nat))
      (define g (lambda (n) TODO-second))
    `;
    expect(() => evaluatePie(program)).not.toThrow();
  });

  test("bare TODO still works", () => {
    const program = `
      (claim h (-> Nat Nat))
      (define h (lambda (n) TODO))
    `;
    expect(() => evaluatePie(program)).not.toThrow();
  });
});
