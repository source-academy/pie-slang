/**
 * Type parser for client-side validation.
 * Parses goal type strings into structured representations.
 */

import { ParsedType } from '../types';

/**
 * Parse a type string into a structured representation.
 * This is a simplified parser for client-side validation hints.
 */
export function parseType(typeStr: string): ParsedType {
  const trimmed = typeStr.trim();

  // Handle empty/invalid input
  if (!trimmed) {
    return { kind: 'Unknown', sourceText: typeStr };
  }

  // Try to parse as S-expression
  try {
    const tokens = tokenize(trimmed);
    return parseTokens(tokens, typeStr);
  } catch {
    return { kind: 'Unknown', sourceText: typeStr };
  }
}

/**
 * Tokenize an S-expression string.
 */
function tokenize(input: string): string[] {
  const tokens: string[] = [];
  let current = 0;

  while (current < input.length) {
    const char = input[current];

    // Skip whitespace
    if (/\s/.test(char)) {
      current++;
      continue;
    }

    // Parentheses
    if (char === '(' || char === ')') {
      tokens.push(char);
      current++;
      continue;
    }

    // Symbols/atoms
    let value = '';
    while (current < input.length && !/[\s()]/.test(input[current])) {
      value += input[current];
      current++;
    }
    if (value) {
      tokens.push(value);
    }
  }

  return tokens;
}

/**
 * Parse tokens into a ParsedType.
 */
function parseTokens(tokens: string[], sourceText: string): ParsedType {
  let pos = 0;

  function peek(): string | undefined {
    return tokens[pos];
  }

  function consume(): string {
    return tokens[pos++];
  }

  function parseExpr(): ParsedType {
    const token = peek();

    if (!token) {
      return { kind: 'Unknown', sourceText };
    }

    // List expression
    if (token === '(') {
      consume(); // (
      const head = peek();

      if (!head || head === ')') {
        consume(); // )
        return { kind: 'Unknown', sourceText };
      }

      // Check for special forms
      switch (head) {
        case 'Pi':
        case 'Π': {
          consume(); // Pi
          // Parse binding: ((name Type))
          if (peek() === '(') {
            consume(); // (
            if (peek() === '(') {
              consume(); // (
              const bindingName = consume();
              const bindingType = parseExpr();
              if (peek() === ')') consume(); // )
              if (peek() === ')') consume(); // )
              const codomain = parseExpr();
              if (peek() === ')') consume(); // )
              return {
                kind: 'Pi',
                bindingName,
                bindingType,
                codomain,
                sourceText
              };
            }
          }
          // Fallback: try to parse remaining as body
          const body = parseExpr();
          if (peek() === ')') consume();
          return { kind: 'Pi', codomain: body, sourceText };
        }

        case '->':
        case '→': {
          consume(); // ->
          const args: ParsedType[] = [];
          while (peek() && peek() !== ')') {
            args.push(parseExpr());
          }
          if (peek() === ')') consume();

          if (args.length >= 2) {
            // Build Arrow type from right to left
            let result = args[args.length - 1];
            for (let i = args.length - 2; i >= 0; i--) {
              result = {
                kind: 'Arrow',
                domain: args[i],
                codomain: result,
                sourceText
              };
            }
            return result;
          }
          return { kind: 'Arrow', sourceText };
        }

        case 'Sigma':
        case 'Σ': {
          consume(); // Sigma
          if (peek() === '(') {
            consume(); // (
            if (peek() === '(') {
              consume(); // (
              const bindingName = consume();
              const bindingType = parseExpr();
              if (peek() === ')') consume(); // )
              if (peek() === ')') consume(); // )
              const body = parseExpr();
              if (peek() === ')') consume(); // )
              return {
                kind: 'Sigma',
                bindingName,
                bindingType,
                codomain: body,
                sourceText
              };
            }
          }
          const body = parseExpr();
          if (peek() === ')') consume();
          return { kind: 'Sigma', codomain: body, sourceText };
        }

        case 'Pair': {
          consume(); // Pair
          const left = parseExpr();
          const right = parseExpr();
          if (peek() === ')') consume();
          return { kind: 'Pair', left, right, sourceText };
        }

        case 'Either': {
          consume(); // Either
          const left = parseExpr();
          const right = parseExpr();
          if (peek() === ')') consume();
          return { kind: 'Either', left, right, sourceText };
        }

        case 'List': {
          consume(); // List
          const elementType = parseExpr();
          if (peek() === ')') consume();
          return { kind: 'List', elementType, sourceText };
        }

        case 'Vec': {
          consume(); // Vec
          const elementType = parseExpr();
          const length = parseExpr();
          if (peek() === ')') consume();
          return { kind: 'Vec', elementType, length, sourceText };
        }

        case '=': {
          consume(); // =
          const baseType = parseExpr();
          const from = parseExpr();
          const to = parseExpr();
          if (peek() === ')') consume();
          return { kind: 'Equal', baseType, from, to, sourceText };
        }

        default: {
          // Generic application
          const func = consume();
          const args: ParsedType[] = [];
          while (peek() && peek() !== ')') {
            args.push(parseExpr());
          }
          if (peek() === ')') consume();

          // Check if func is a known type constructor
          const known = getKnownKind(func);
          if (known !== 'Unknown') {
            return { kind: known, sourceText };
          }

          return { kind: 'Application', sourceText };
        }
      }
    }

    // Atom
    const atom = consume();
    const kind = getKnownKind(atom);
    return { kind, sourceText };
  }

  return parseExpr();
}

/**
 * Get the kind for a known type name.
 */
function getKnownKind(name: string): ParsedType['kind'] {
  switch (name) {
    case 'Nat':
      return 'Nat';
    case 'Atom':
      return 'Atom';
    case 'Trivial':
      return 'Trivial';
    case 'Absurd':
      return 'Absurd';
    case 'U':
      return 'U';
    case 'Pi':
    case 'Π':
      return 'Pi';
    case '->':
    case '→':
      return 'Arrow';
    case 'Sigma':
    case 'Σ':
      return 'Sigma';
    case 'Pair':
      return 'Pair';
    case 'Either':
      return 'Either';
    case 'List':
      return 'List';
    case 'Vec':
      return 'Vec';
    case '=':
      return 'Equal';
    default:
      return 'Variable';
  }
}

/**
 * Check if a parsed type matches a pattern.
 */
export function typeMatches(parsed: ParsedType, pattern: string): boolean {
  if (pattern === '*') return true;

  switch (pattern) {
    case 'Pi':
    case 'Arrow':
    case '->':
      return parsed.kind === 'Pi' || parsed.kind === 'Arrow';
    case 'Sigma':
    case 'Pair':
      return parsed.kind === 'Sigma' || parsed.kind === 'Pair';
    case 'Either':
      return parsed.kind === 'Either';
    case 'List':
      return parsed.kind === 'List';
    case 'Vec':
      return parsed.kind === 'Vec';
    case 'Equal':
    case '=':
      return parsed.kind === 'Equal';
    case 'Nat':
      return parsed.kind === 'Nat';
    default:
      return parsed.kind === pattern;
  }
}

/**
 * Get a human-readable description of a type kind.
 */
export function describeKind(kind: ParsedType['kind']): string {
  switch (kind) {
    case 'Pi':
      return 'dependent function type (Π)';
    case 'Arrow':
      return 'function type (→)';
    case 'Sigma':
      return 'dependent pair type (Σ)';
    case 'Pair':
      return 'pair type';
    case 'Either':
      return 'sum type (Either)';
    case 'Nat':
      return 'natural number';
    case 'List':
      return 'list type';
    case 'Vec':
      return 'vector type';
    case 'Equal':
      return 'equality type (=)';
    case 'Atom':
      return 'atom type';
    case 'Trivial':
      return 'trivial type';
    case 'Absurd':
      return 'absurd type';
    case 'U':
      return 'universe type';
    case 'Application':
      return 'type application';
    case 'Variable':
      return 'type variable';
    default:
      return 'unknown type';
  }
}
