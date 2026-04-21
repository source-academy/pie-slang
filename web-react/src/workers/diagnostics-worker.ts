import * as Comlink from 'comlink';

/**
 * Diagnostics Worker API
 *
 * This worker handles code analysis and provides diagnostics for the code editor.
 * It runs syntax checking, type checking, and provides hover information.
 */

export interface DiagnosticsWorkerAPI {
  /**
   * Check source code for errors and warnings
   */
  checkSource(sourceCode: string): Promise<DiagnosticsResult>;

  /**
   * Get hover information at a specific position
   */
  getHoverInfo(
    sourceCode: string,
    line: number,
    column: number
  ): Promise<HoverInfo | null>;

  /**
   * Get completions at a specific position
   */
  getCompletions(
    sourceCode: string,
    line: number,
    column: number
  ): Promise<CompletionItem[]>;
}

export interface DiagnosticsResult {
  diagnostics: Diagnostic[];
  parseSuccessful: boolean;
  typeCheckSuccessful: boolean;
}

export interface Diagnostic {
  severity: 'error' | 'warning' | 'info' | 'hint';
  message: string;
  range: Range;
  source: 'parser' | 'typechecker';
}

export interface Range {
  startLine: number;
  startColumn: number;
  endLine: number;
  endColumn: number;
}

export interface HoverInfo {
  type: string;
  documentation?: string;
}

export interface CompletionItem {
  label: string;
  kind: 'keyword' | 'function' | 'variable' | 'type';
  detail?: string;
  insertText?: string;
}

// ============================================
// Built-in Pie keywords and types
// ============================================

const PIE_KEYWORDS: CompletionItem[] = [
  // Declarations
  { label: 'claim', kind: 'keyword', detail: 'Declare a claim', insertText: '(claim ${1:name} ${2:type})' },
  { label: 'define', kind: 'keyword', detail: 'Define a function or value', insertText: '(define ${1:name} ${2:expr})' },
  { label: 'define-tactically', kind: 'keyword', detail: 'Prove a claim using tactics', insertText: '(define-tactically ${1:name}\n  ${2:tactics})' },

  // Types
  { label: 'Nat', kind: 'type', detail: 'Natural numbers' },
  { label: 'Atom', kind: 'type', detail: 'Atomic values (quoted symbols)' },
  { label: 'Trivial', kind: 'type', detail: 'The trivial type with one element' },
  { label: 'Absurd', kind: 'type', detail: 'The empty type (no inhabitants)' },
  { label: 'U', kind: 'type', detail: 'The universe of types' },
  { label: 'Pair', kind: 'type', detail: 'Dependent pair type', insertText: '(Pair ${1:A} ${2:B})' },
  { label: 'Either', kind: 'type', detail: 'Sum type', insertText: '(Either ${1:L} ${2:R})' },
  { label: 'List', kind: 'type', detail: 'List type', insertText: '(List ${1:E})' },
  { label: 'Vec', kind: 'type', detail: 'Vector type (list with length)', insertText: '(Vec ${1:E} ${2:len})' },
  { label: '=', kind: 'type', detail: 'Equality type', insertText: '(= ${1:A} ${2:from} ${3:to})' },
  { label: '->', kind: 'type', detail: 'Function type', insertText: '(-> ${1:A} ${2:B})' },
  { label: 'Pi', kind: 'type', detail: 'Dependent function type', insertText: '(Pi ((${1:x} ${2:A}))\n  ${3:B})' },
  { label: 'Sigma', kind: 'type', detail: 'Dependent pair type', insertText: '(Sigma ((${1:x} ${2:A}))\n  ${3:B})' },

  // Constructors
  { label: 'zero', kind: 'variable', detail: 'The natural number zero' },
  { label: 'add1', kind: 'function', detail: 'Successor of a natural number', insertText: '(add1 ${1:n})' },
  { label: 'same', kind: 'function', detail: 'Proof of reflexivity', insertText: '(same ${1:expr})' },
  { label: 'sole', kind: 'variable', detail: 'The sole element of Trivial' },
  { label: 'nil', kind: 'variable', detail: 'Empty list' },
  { label: '::', kind: 'function', detail: 'List cons', insertText: '(:: ${1:head} ${2:tail})' },
  { label: 'vecnil', kind: 'variable', detail: 'Empty vector' },
  { label: 'vec::', kind: 'function', detail: 'Vector cons', insertText: '(vec:: ${1:head} ${2:tail})' },
  { label: 'left', kind: 'function', detail: 'Left injection into Either', insertText: '(left ${1:expr})' },
  { label: 'right', kind: 'function', detail: 'Right injection into Either', insertText: '(right ${1:expr})' },
  { label: 'cons', kind: 'function', detail: 'Construct a dependent pair', insertText: '(cons ${1:fst} ${2:snd})' },

  // Eliminators
  { label: 'rec-Nat', kind: 'function', detail: 'Recursion on Nat', insertText: '(rec-Nat ${1:target}\n  ${2:base}\n  (lambda (${3:n-1} ${4:acc}) ${5:step}))' },
  { label: 'ind-Nat', kind: 'function', detail: 'Induction on Nat', insertText: '(ind-Nat ${1:target}\n  (lambda (${2:k}) ${3:motive})\n  ${4:base}\n  (lambda (${5:n-1} ${6:ih}) ${7:step}))' },
  { label: 'ind-List', kind: 'function', detail: 'Induction on List', insertText: '(ind-List ${1:target}\n  (lambda (${2:e}) ${3:motive})\n  ${4:base}\n  (lambda (${5:h} ${6:t} ${7:ih}) ${8:step}))' },
  { label: 'ind-Vec', kind: 'function', detail: 'Induction on Vec', insertText: '(ind-Vec ${1:len} ${2:target}\n  (lambda (${3:k} ${4:es}) ${5:motive})\n  ${6:base}\n  (lambda (${7:h} ${8:t} ${9:ih}) ${10:step}))' },
  { label: 'ind-Either', kind: 'function', detail: 'Induction on Either', insertText: '(ind-Either ${1:target}\n  (lambda (${2:e}) ${3:motive})\n  (lambda (${4:l}) ${5:left-case})\n  (lambda (${6:r}) ${7:right-case}))' },
  { label: 'ind-Absurd', kind: 'function', detail: 'Absurdity elimination', insertText: '(ind-Absurd ${1:target}\n  ${2:motive})' },
  { label: 'replace', kind: 'function', detail: 'Replace along an equality', insertText: '(replace ${1:proof}\n  (lambda (${2:k}) ${3:motive})\n  ${4:base})' },
  { label: 'symm', kind: 'function', detail: 'Symmetry of equality', insertText: '(symm ${1:proof})' },
  { label: 'cong', kind: 'function', detail: 'Congruence', insertText: '(cong ${1:proof} ${2:fun})' },
  { label: 'trans', kind: 'function', detail: 'Transitivity of equality', insertText: '(trans ${1:p1} ${2:p2})' },
  { label: 'car', kind: 'function', detail: 'First projection of a pair', insertText: '(car ${1:pair})' },
  { label: 'cdr', kind: 'function', detail: 'Second projection of a pair', insertText: '(cdr ${1:pair})' },

  // Lambda / application
  { label: 'lambda', kind: 'keyword', detail: 'Anonymous function', insertText: '(lambda (${1:x}) ${2:body})' },
  { label: 'the', kind: 'keyword', detail: 'Type annotation', insertText: '(the ${1:type} ${2:expr})' },
];

// Tactic names for use inside define-tactically blocks
const TACTIC_NAMES: CompletionItem[] = [
  { label: 'intro', kind: 'function', detail: 'Introduce a variable', insertText: '(intro ${1:name})' },
  { label: 'exact', kind: 'function', detail: 'Provide an exact proof term', insertText: '(exact ${1:expr})' },
  { label: 'split', kind: 'function', detail: 'Split a conjunction goal' },
  { label: 'left', kind: 'function', detail: 'Prove the left side of a disjunction' },
  { label: 'right', kind: 'function', detail: 'Prove the right side of a disjunction' },
  { label: 'exists', kind: 'function', detail: 'Provide a witness for an existential', insertText: '(exists ${1:witness})' },
  { label: 'elim-Nat', kind: 'function', detail: 'Eliminate a Nat by induction', insertText: '(elim-Nat ${1:var})' },
  { label: 'elim-List', kind: 'function', detail: 'Eliminate a List by induction', insertText: '(elim-List ${1:var})' },
  { label: 'elim-Vec', kind: 'function', detail: 'Eliminate a Vec by induction', insertText: '(elim-Vec ${1:var})' },
  { label: 'elim-Either', kind: 'function', detail: 'Eliminate an Either', insertText: '(elim-Either ${1:var})' },
  { label: 'elim-Equal', kind: 'function', detail: 'Eliminate an equality', insertText: '(elim-Equal ${1:var})' },
  { label: 'elim-Absurd', kind: 'function', detail: 'Eliminate an absurdity', insertText: '(elim-Absurd ${1:var})' },
  { label: 'apply', kind: 'function', detail: 'Apply a lemma or function', insertText: '(apply ${1:expr})' },
  { label: 'then', kind: 'keyword', detail: 'Sequential tactic composition', insertText: '(then\n  ${1:tactic1}\n  ${2:tactic2})' },
];

/**
 * Extract user-defined symbol names from source code.
 * Looks for top-level (claim name ...) and (define name ...) forms.
 */
function extractUserSymbols(sourceCode: string): CompletionItem[] {
  const items: CompletionItem[] = [];
  const claimPattern = /\(\s*claim\s+(\S+)/g;
  const definePattern = /\(\s*define\s+(\S+)/g;

  let match: RegExpExecArray | null;

  match = claimPattern.exec(sourceCode);
  while (match !== null) {
    const name = match[1];
    if (name && !items.find((item) => item.label === name)) {
      items.push({ label: name, kind: 'function', detail: 'User claim' });
    }
    match = claimPattern.exec(sourceCode);
  }

  match = definePattern.exec(sourceCode);
  while (match !== null) {
    const name = match[1];
    if (name && !items.find((item) => item.label === name)) {
      items.push({ label: name, kind: 'function', detail: 'User definition' });
    }
    match = definePattern.exec(sourceCode);
  }

  return items;
}

/**
 * Filter completions by the prefix at the cursor.
 * Returns items that start with the given prefix (case-insensitive).
 */
function filterByPrefix(items: CompletionItem[], prefix: string): CompletionItem[] {
  if (!prefix) return items;
  const lower = prefix.toLowerCase();
  return items.filter((item) => item.label.toLowerCase().startsWith(lower));
}

/**
 * Get the current token at (line, column) in sourceCode.
 */
function getTokenAtCursor(sourceCode: string, line: number, column: number): string {
  const lines = sourceCode.split('\n');
  const lineText = lines[line - 1] ?? '';
  const upToCursor = lineText.slice(0, column - 1);
  const tokenMatch = /[^\s()"]+$/.exec(upToCursor);
  return tokenMatch ? tokenMatch[0] : '';
}

const diagnosticsWorkerAPI: DiagnosticsWorkerAPI = {
  async checkSource(_sourceCode) {
    // TODO: Integrate with Pie interpreter for real diagnostics
    return {
      diagnostics: [],
      parseSuccessful: true,
      typeCheckSuccessful: true,
    };
  },

  async getHoverInfo(_sourceCode, _line, _column) {
    // TODO: Integrate with Pie interpreter
    return null;
  },

  async getCompletions(sourceCode, line, column) {
    const prefix = getTokenAtCursor(sourceCode, line, column);
    const userSymbols = extractUserSymbols(sourceCode);
    const allItems = [...PIE_KEYWORDS, ...TACTIC_NAMES, ...userSymbols];

    const seen = new Set<string>();
    const dedupedItems: CompletionItem[] = [];
    for (const item of allItems) {
      if (!seen.has(item.label)) {
        seen.add(item.label);
        dedupedItems.push(item);
      }
    }

    return filterByPrefix(dedupedItems, prefix);
  },
};

Comlink.expose(diagnosticsWorkerAPI);
