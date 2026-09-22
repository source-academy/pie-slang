import { PassThrough } from "node:stream";
import { Atomic, Extended, Expression } from "../../types/nodes/scheme-node-types";
import { Location, Position } from "../../types/location";
import { SchemeLexer } from "../../lexer/scheme-lexer";
import { SchemeParser } from "../../parser/scheme-parser";
import { Printer } from "../printer";

const loc = new Location(new Position(1, 1), new Position(1, 8));
const identifier = (name: string) => new Atomic.Identifier(loc, name);
const splice = (child: Expression) => new Atomic.SpliceMarker(loc, child);

function capturePrint(nodes: Expression[], printer = Printer.create()): string {
  const sink = new PassThrough();
  const chunks: string[] = [];
  sink.on("data", chunk => chunks.push(chunk.toString()));
  // A real writable stream rejects objects, unlike a permissive jest.fn().
  const write = jest.spyOn(process.stdout, "write")
    .mockImplementation(chunk => sink.write(chunk));
  try {
    for (const node of nodes) node.accept(printer);
    return chunks.join("");
  } finally {
    write.mockRestore();
    sink.destroy();
  }
}

test.each(["xs", "λ-items", "items?"])("prints splice identifier %s as text", name => {
  expect(capturePrint([splice(identifier(name))])).toBe(`,@${name} `);
});

test("recursively prints a compound child rather than its object representation", () => {
  const child = new Atomic.Application(loc, identifier("append"), [
    identifier("xs"),
    new Atomic.Application(loc, identifier("reverse"), [identifier("ys")]),
  ]);
  expect(capturePrint([splice(child)])).toBe(
    ",@( append xs ( reverse ys) )  "
  );
});

test("prints an empty-list child", () => {
  expect(capturePrint([splice(new Atomic.Nil(loc))])).toBe(",@() ");
});

test("dispatches through the child visitor without mutating the AST", () => {
  const child = identifier("xs");
  const marker = splice(child);
  const before = JSON.stringify(marker);
  const printer = Printer.create();
  const accept = jest.spyOn(child, "accept");
  try {
    expect(capturePrint([marker, marker], printer)).toBe(",@xs ,@xs ");
    expect(accept).toHaveBeenCalledTimes(2);
    expect(accept).toHaveBeenNthCalledWith(1, printer);
    expect(accept).toHaveBeenNthCalledWith(2, printer);
    expect(JSON.stringify(marker)).toBe(before);
  } finally {
    accept.mockRestore();
  }
});

test.each([
  ["`(1 ,@xs 4)", ["xs"]],
  ["`(,@(append xs ys))", ["append", "xs", "ys"]],
  ["`(,@xs ,@ys)", ["xs", "ys"]],
  ["`((a ,@xs) ,@ys)", ["xs", "ys"]],
] as const)("prints splices in parsed quasiquote %s", (source, names) => {
  const nodes = new SchemeParser(source, new SchemeLexer(source).scanTokens(), 2).parse();
  const before = JSON.stringify(nodes);
  const output = capturePrint(nodes);
  expect(output.match(/,@/g)).toHaveLength((source.match(/,@/g) || []).length);
  for (const name of names) expect(output).toContain(name);
  expect(output).not.toContain("[object Object]");
  expect(JSON.stringify(nodes)).toBe(before);
});

test("ordinary expression printing is unchanged", () => {
  const call = new Atomic.Application(loc, identifier("f"), [identifier("x")]);
  expect(capturePrint([call])).toBe("( f x) ");
});

test("unsupported child printing errors still propagate", () => {
  const child = new Extended.Let(loc, [], [], identifier("xs"));
  expect(() => capturePrint([splice(child)])).toThrow("Method not implemented.");
});
