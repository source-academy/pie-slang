/**
 * S-expression tokenizer and parser for type visualization.
 * Parses Pie type strings into a tree structure for rendering.
 */

import { TypeNode, TypeConstructorCategory } from './types';

// Token types
type Token =
  | { type: 'LPAREN' }
  | { type: 'RPAREN' }
  | { type: 'ATOM'; value: string }
  | { type: 'EOF' };

/**
 * Tokenize an S-expression string.
 */
export function tokenize(input: string): Token[] {
  const tokens: Token[] = [];
  let i = 0;

  while (i < input.length) {
    const char = input[i];

    // Skip whitespace
    if (/\s/.test(char)) {
      i++;
      continue;
    }

    // Left parenthesis
    if (char === '(') {
      tokens.push({ type: 'LPAREN' });
      i++;
      continue;
    }

    // Right parenthesis
    if (char === ')') {
      tokens.push({ type: 'RPAREN' });
      i++;
      continue;
    }

    // Atom: read until whitespace or parenthesis
    let atom = '';
    while (i < input.length && !/[\s()]/.test(input[i])) {
      atom += input[i];
      i++;
    }
    if (atom) {
      tokens.push({ type: 'ATOM', value: atom });
    }
  }

  tokens.push({ type: 'EOF' });
  return tokens;
}

/**
 * Parser class for recursive descent parsing.
 */
class Parser {
  private tokens: Token[];
  private pos: number = 0;

  constructor(tokens: Token[]) {
    this.tokens = tokens;
  }

  private current(): Token {
    return this.tokens[this.pos] || { type: 'EOF' };
  }

  private advance(): Token {
    const token = this.current();
    this.pos++;
    return token;
  }

  private expect(type: Token['type']): Token {
    const token = this.current();
    if (token.type !== type) {
      throw new Error(`Expected ${type} but got ${token.type}`);
    }
    return this.advance();
  }

  /**
   * Parse a single expression (atom or list).
   */
  parse(): TypeNode {
    const token = this.current();

    if (token.type === 'LPAREN') {
      return this.parseList();
    } else if (token.type === 'ATOM') {
      return this.parseAtom();
    } else if (token.type === 'EOF') {
      // Empty input
      return {
        kind: '',
        value: '',
        children: [],
        isAtom: true,
        sourceText: '',
        abbreviation: ''
      };
    } else {
      throw new Error(`Unexpected token: ${token.type}`);
    }
  }

  private parseAtom(): TypeNode {
    const token = this.expect('ATOM') as { type: 'ATOM'; value: string };
    return {
      kind: token.value,
      value: token.value,
      children: [],
      isAtom: true,
      sourceText: token.value,
      abbreviation: token.value
    };
  }

  private parseList(): TypeNode {
    this.expect('LPAREN');

    const children: TypeNode[] = [];
    const sourceTokens: string[] = ['('];

    // Parse all elements until closing paren
    while (this.current().type !== 'RPAREN' && this.current().type !== 'EOF') {
      const child = this.parse();
      children.push(child);
      sourceTokens.push(child.sourceText);
    }

    this.expect('RPAREN');
    sourceTokens.push(')');

    // Determine the kind from the first child (if it's an atom)
    const kind = children.length > 0 && children[0].isAtom
      ? children[0].kind
      : 'list';

    const sourceText = sourceTokens.join(' ').replace(/\( /g, '(').replace(/ \)/g, ')');
    const abbreviation = generateAbbreviation({ kind, children, isAtom: false, sourceText, abbreviation: '' });

    return {
      kind,
      children,
      isAtom: false,
      sourceText,
      abbreviation
    };
  }
}

/**
 * Parse an S-expression string into a TypeNode tree.
 */
export function parseSExpression(input: string): TypeNode {
  const trimmed = input.trim();
  if (!trimmed) {
    return {
      kind: '',
      value: '',
      children: [],
      isAtom: true,
      sourceText: '',
      abbreviation: ''
    };
  }

  try {
    const tokens = tokenize(trimmed);
    const parser = new Parser(tokens);
    return parser.parse();
  } catch (e) {
    // Fallback: return the input as a single atom on parse error
    return {
      kind: 'error',
      value: trimmed,
      children: [],
      isAtom: true,
      sourceText: trimmed,
      abbreviation: trimmed.length > 20 ? trimmed.slice(0, 20) + '...' : trimmed
    };
  }
}

/**
 * Generate an abbreviated representation for collapsed display.
 */
export function generateAbbreviation(node: TypeNode): string {
  if (node.isAtom) {
    return node.value || '';
  }

  const kind = node.kind;
  const children = node.children;

  // Handle different type constructors
  switch (kind) {
    case 'Π':
    case 'Pi': {
      // (Π (x A) B) -> "Π (x : A) ..."
      if (children.length >= 3) {
        const binding = children[1];
        if (!binding.isAtom && binding.children.length >= 2) {
          const varName = binding.children[0].abbreviation;
          const varType = binding.children[1].abbreviation;
          return `Π (${varName} : ${varType}) ...`;
        }
      }
      return 'Π ...';
    }

    case 'Σ':
    case 'Sigma': {
      // (Σ (x A) B) -> "Σ (x : A) ..."
      if (children.length >= 3) {
        const binding = children[1];
        if (!binding.isAtom && binding.children.length >= 2) {
          const varName = binding.children[0].abbreviation;
          const varType = binding.children[1].abbreviation;
          return `Σ (${varName} : ${varType}) ...`;
        }
      }
      return 'Σ ...';
    }

    case 'Either': {
      // (Either A B) -> "Either A B"
      if (children.length >= 3) {
        return `Either ${children[1].abbreviation} ${children[2].abbreviation}`;
      }
      return 'Either ...';
    }

    case 'left':
    case 'Left': {
      if (children.length >= 2) {
        return `left ${children[1].abbreviation}`;
      }
      return 'left ...';
    }

    case 'right':
    case 'Right': {
      if (children.length >= 2) {
        return `right ${children[1].abbreviation}`;
      }
      return 'right ...';
    }

    case '=': {
      // (= A from to) -> "= A from to"
      if (children.length >= 4) {
        return `= ${children[1].abbreviation} ...`;
      }
      return '= ...';
    }

    case 'λ':
    case 'lambda': {
      // (λ (x) body) -> "λ (x) ..."
      if (children.length >= 3) {
        const param = children[1];
        if (!param.isAtom && param.children.length >= 1) {
          return `λ (${param.children[0].abbreviation}) ...`;
        }
      }
      return 'λ ...';
    }

    case 'List': {
      if (children.length >= 2) {
        return `List ${children[1].abbreviation}`;
      }
      return 'List ...';
    }

    case 'Vec': {
      if (children.length >= 3) {
        return `Vec ${children[1].abbreviation} ${children[2].abbreviation}`;
      }
      return 'Vec ...';
    }

    case 'Pair': {
      if (children.length >= 3) {
        return `Pair ${children[1].abbreviation} ${children[2].abbreviation}`;
      }
      return 'Pair ...';
    }

    case 'cons':
    case '::': {
      return `:: ...`;
    }

    case 'add1': {
      if (children.length >= 2) {
        return `add1 ${children[1].abbreviation}`;
      }
      return 'add1 ...';
    }

    default: {
      // Generic abbreviation
      if (children.length > 0) {
        const kindPart = children[0].isAtom ? children[0].abbreviation : '?';
        if (children.length === 1) {
          return `(${kindPart})`;
        }
        return `(${kindPart} ...)`;
      }
      return '(...)';
    }
  }
}

/**
 * Get the category for a type constructor (for color coding).
 */
export function getTypeCategory(kind: string): TypeConstructorCategory {
  const lowerKind = kind.toLowerCase();

  // Pi types
  if (kind === 'Π' || kind === 'Pi' || kind === '→' || kind === '->') {
    return 'pi';
  }

  // Sigma types
  if (kind === 'Σ' || kind === 'Sigma') {
    return 'sigma';
  }

  // Either and variants
  if (lowerKind === 'either' || lowerKind === 'left' || lowerKind === 'right') {
    return 'either';
  }

  // Equality types
  if (kind === '=' || lowerKind === 'same' || lowerKind === 'cong' ||
      lowerKind === 'symm' || lowerKind === 'trans' || lowerKind === 'replace') {
    return 'equality';
  }

  // List types
  if (lowerKind === 'list' || kind === '::' || lowerKind === 'nil' || lowerKind === 'cons') {
    return 'list';
  }

  // Vector types
  if (lowerKind === 'vec' || lowerKind === 'vec::' || lowerKind === 'vecnil' || lowerKind === 'head' || lowerKind === 'tail') {
    return 'vec';
  }

  // Natural numbers
  if (lowerKind === 'nat' || lowerKind === 'zero' || lowerKind === 'add1') {
    return 'nat';
  }

  // Universe types
  if (kind === 'U' || lowerKind === 'atom' || lowerKind === 'trivial' || lowerKind === 'absurd' || lowerKind === 'sole') {
    return 'universe';
  }

  // Lambda
  if (kind === 'λ' || lowerKind === 'lambda') {
    return 'lambda';
  }

  // Check if it looks like a variable (starts with lowercase, short)
  if (/^[a-z][a-z0-9_-]*$/i.test(kind) && kind.length <= 10 && kind === kind.toLowerCase()) {
    return 'variable';
  }

  return 'default';
}
