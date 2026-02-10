// Identifier encoding/decoding for ESTree outputs.
// Encodes any non-alphanumeric/underscore characters into $<codepoint>$ sequences
// and prefixes with "$$" to avoid reserved word collisions.

export function encode(name: string): string {
  let encoded = '';
  for (const ch of name) {
    if (/[A-Za-z0-9_]/.test(ch)) {
      encoded += ch;
    } else {
      const code = ch.codePointAt(0);
      encoded += `$${code}$`;
    }
  }
  return `$$${encoded}`;
}

export function decode(encoded: string): string {
  const body = encoded.startsWith('$$') ? encoded.slice(2) : encoded;
  return body.replace(/\$(\d+)\$/g, (_match, code) => {
    const num = Number(code);
    return Number.isFinite(num) ? String.fromCodePoint(num) : _match;
  });
}
