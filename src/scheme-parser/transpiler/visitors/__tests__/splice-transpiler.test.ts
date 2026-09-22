import type { CallExpression } from "estree";
import { Atomic } from "../../types/nodes/scheme-node-types";
import { Location, Position } from "../../types/location";
import { SchemeLexer } from "../../lexer/scheme-lexer";
import { SchemeParser } from "../../parser/scheme-parser";
import { Transpiler } from "../transpiler";
import { unparse } from "../../../utils/reverse_parser";

const loc = new Location(new Position(1, 1), new Position(1, 5));
const identifier = (name: string) => new Atomic.Identifier(loc, name);

function callsIn(value: unknown): CallExpression[] {
  if (value === null || typeof value !== "object") return [];
  const object = value as Record<string, unknown>;
  const children = Object.values(object).flatMap(callsIn);
  return object.type === "CallExpression"
    ? [value as CallExpression, ...children]
    : children;
}

test("a splice identifier is one argument, inside one returned call", () => {
  const child = identifier("xs");
  const marker = new Atomic.SpliceMarker(loc, child);
  const result = marker.accept(Transpiler.create()) as [CallExpression];
  expect(result).toHaveLength(1);
  const [call] = result;
  expect(call.type).toBe("CallExpression");
  expect(call.callee).toMatchObject({ type: "Identifier", name: "make-splice" });
  expect(Array.isArray(call.arguments)).toBe(true);
  expect(call.arguments).toHaveLength(1);
  expect(call.arguments[0]).toMatchObject({ type: "Identifier", name: "xs" });
  expect(call.loc).toBe(loc);
  expect(marker.value).toBe(child);
  expect(unparse(call)).toBe("(make-splice xs)");
});

test("a compound child stays a single argument, not its two operands", () => {
  const child = new Atomic.Application(loc, identifier("append"), [
    identifier("xs"), identifier("ys"),
  ]);
  const [call] = Transpiler.create().visitSpliceMarker(new Atomic.SpliceMarker(loc, child));
  expect(call.arguments).toHaveLength(1);
  expect(call.arguments[0]).toMatchObject({
    type: "CallExpression",
    callee: { type: "Identifier", name: "append" },
    arguments: [
      { type: "Identifier", name: "xs" },
      { type: "Identifier", name: "ys" },
    ],
  });
  expect(unparse(call)).toBe("(make-splice (append xs ys))");
});

test.each([
  ["`(1 ,@xs 4)", 1],
  ["`(,@(append xs ys))", 1],
  ["`(,@xs ,@ys)", 2],
  ["`((a ,@xs) ,@ys)", 2],
] as const)("parsed quasiquote %s produces valid argument arrays", (source, count) => {
  const parsed = new SchemeParser(source, new SchemeLexer(source).scanTokens(), 2).parse();
  // Test the AST layer directly; encoder integration is covered separately.
  const program = Transpiler.create().transpile(parsed);
  const calls = callsIn(program);
  expect(calls.filter(call => call.callee.type === "Identifier"
    && call.callee.name === "make-splice")).toHaveLength(count);
  for (const call of calls) expect(Array.isArray(call.arguments)).toBe(true);
  expect(() => unparse(program)).not.toThrow();
});

test("an ordinary two-argument call is unchanged", () => {
  const [call] = Transpiler.create().visitApplication(new Atomic.Application(
    loc, identifier("f"), [identifier("x"), identifier("y")]
  ));
  expect(call.arguments).toHaveLength(2);
  expect(unparse(call)).toBe("(f x y)");
});
