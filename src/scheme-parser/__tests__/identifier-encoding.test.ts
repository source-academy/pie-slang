import { Script } from "node:vm";
import { decode, encode } from "../utils/identifier-encoding";

// Golden outputs from the historical src/scheme_parser/index.ts implementation.
test.each([
  ["name_123", "name_123"],
  ["make-splice", "make$45$splice"],
  ["null?", "null$63$"],
  ["set!", "set$33$"],
  ["vector->list", "vector$45$$62$list"],
  ["+", "$43$"],
  ["$45$", "$36$45$36$"],
  ["if", "$scheme_aWY$61$"],
  ["λ", "$955$"],
  ["变量", "$21464$$37327$"],
  ["😀", "$55357$$56832$"],
  ["$scheme_x", "$scheme_JHNjaGVtZV94"],
  ["$scheme_", "$scheme_JHNjaGVtZV8$61$"],
])("preserves the historical encoding of %s", (original, encoded) => {
  expect(encode(original)).toBe(encoded);
  expect(decode(encoded)).toBe(original);
  expect(() => new Script(`"use strict"; let ${encoded};`)).not.toThrow();
});

const keywords = [
  "break", "case", "catch", "class", "const", "continue", "debugger",
  "default", "delete", "do", "else", "eval", "export", "extends", "false",
  "finally", "for", "function", "if", "import", "in", "instanceof", "new",
  "return", "super", "switch", "this", "throw", "true", "try", "typeof",
  "var", "void", "while", "with", "yield", "enum", "await", "implements",
  "package", "protected", "static", "interface", "private", "public",
];

test.each(keywords)("escapes historical reserved name %s", keyword => {
  // Buffer provides an independent reference for the legacy Base64 wire format.
  const base64 = Buffer.from(keyword, "utf8").toString("base64");
  const expected = "$scheme_" + base64.replace(/=/g, "$61$");
  expect(encode(keyword)).toBe(expected);
  expect(decode(expected)).toBe(keyword);
  expect(() => new Script(`"use strict"; let ${expected};`)).not.toThrow();
});

test("round trips a deterministic corpus without name collisions", () => {
  const parts = ["x", "_", "-", "?", "!", "$", "$45$", "λ", "变量", "😀"];
  const names = [...new Set([
    ...keywords,
    ...parts.flatMap(left => parts.map(right => left + right)),
    ...parts.map(part => "$scheme_" + part),
    "$scheme_࠾࠿", "name/with:punctuation", "line\nbreak", "a b",
  ])];
  const encodedNames = names.map(encode);
  expect(new Set(encodedNames).size).toBe(names.length);
  encodedNames.forEach((encoded, index) => {
    expect(decode(encoded)).toBe(names[index]);
    expect(() => new Script(`"use strict"; let ${encoded};`)).not.toThrow();
  });
});

test("distinguishes punctuation, literal escape text and the reserved prefix", () => {
  const names = ["-", "$45$", "if", "$scheme_aWY$61$", "$scheme_x"];
  expect(new Set(names.map(encode)).size).toBe(names.length);
  for (const name of names) expect(decode(encode(name))).toBe(name);
});

test("does not broaden the historical policy for empty or digit-leading input", () => {
  // This restores the old format; it is not a new general JS identifier validator.
  expect(encode("")).toBe("");
  expect(decode("")).toBe("");
  expect(encode("1abc")).toBe("1abc");
  expect(decode("1abc")).toBe("1abc");
});
