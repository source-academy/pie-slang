import { evaluatePie } from "../main";

test.each(["lambda", "λ"])("Pie identity using %s still parses, checks and evaluates", lambda => {
  const source = `
    (claim identity (-> Nat Nat))
    (define identity
      (${lambda} (n) n))
    (check-same Nat (identity zero) zero)
    (check-same Nat (identity (add1 zero)) (add1 zero))
  `;
  const output = evaluatePie(source);
  expect(output).toContain("identity :");
  expect(output).toContain("identity =");
});

test("Pie type errors are still rejected", () => {
  expect(() => evaluatePie("(claim n Nat)\n(define n 'not-a-natural)"))
    .toThrow();
});

test("Pie incomplete syntax is still rejected", () => {
  expect(() => evaluatePie("(claim n Nat")).toThrow();
});
