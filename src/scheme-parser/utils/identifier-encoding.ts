import { encode as b64Encode, decode as b64Decode } from "js-base64";

// Preserve the format from the historical src/scheme_parser/index.ts.
// Keep this leaf module independent of the parser/visitor public entry point.
const JS_KEYWORDS: string[] = [
  "break",
  "case",
  "catch",
  "class",
  "const",
  "continue",
  "debugger",
  "default",
  "delete",
  "do",
  "else",
  "eval",
  "export",
  "extends",
  "false",
  "finally",
  "for",
  "function",
  "if",
  "import",
  "in",
  "instanceof",
  "new",
  "return",
  "super",
  "switch",
  "this",
  "throw",
  "true",
  "try",
  "typeof",
  "var",
  "void",
  "while",
  "with",
  "yield",
  "enum",
  "await",
  "implements",
  "package",
  "protected",
  "static",
  "interface",
  "private",
  "public",
];

/** Encode Scheme names using the historical keyword/punctuation escape format. */
export function encode(identifier: string): string {
  if (JS_KEYWORDS.includes(identifier) || identifier.startsWith("$scheme_")) {
    return (
      "$scheme_" +
      b64Encode(identifier).replace(
        /([^a-zA-Z0-9_])/g,
        (match: string) => `$${match.charCodeAt(0)}$`
      )
    );
  } else {
    return identifier.replace(
      /([^a-zA-Z0-9_])/g,
      (match: string) => `$${match.charCodeAt(0)}$`
    );
  }
}

/** Reverse the historical encoding of an identifier. */
export function decode(identifier: string): string {
  if (identifier.startsWith("$scheme_")) {
    return b64Decode(
      identifier
        .slice(8)
        .replace(/\$([0-9]+)\$/g, (_, code: string) =>
          String.fromCharCode(parseInt(code))
        )
    );
  } else {
    return identifier.replace(/\$([0-9]+)\$/g, (_, code: string) =>
      String.fromCharCode(parseInt(code))
    );
  }
}
