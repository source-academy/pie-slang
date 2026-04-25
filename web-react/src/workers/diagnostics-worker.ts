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

function cleanDiagnosticMessage(message: string): string {
  return message
    .replace(/^Error:\s*/i, '')
    .replace(/\s+/g, ' ')
    .trim();
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function rangeFromLocation(location: any): Range {
  const start = location?.syntax?.start ?? location?.start;
  const end = location?.syntax?.end ?? location?.end;

  if (start && end) {
    const startColumn = start.column;
    const endColumn = end.column;

    return {
      startLine: start.line,
      startColumn,
      endLine: end.line,
      endColumn: Math.max(endColumn + 1, startColumn + 1),
    };
  }

  return {
    startLine: 1,
    startColumn: 1,
    endLine: 1,
    endColumn: 2,
  };
}

function messageToText(message: { toString(): string } | string): string {
  return cleanDiagnosticMessage(
    typeof message === 'string' ? message : message.toString(),
  );
}

function tokenAt(sourceCode: string, line: number, column: number): string {
  const text = sourceCode.split('\n')[line - 1] ?? '';
  const index = Math.max(0, column - 1);
  const left = text.slice(0, index);
  const right = text.slice(index);
  const prefix = /[^\s()"]+$/.exec(left)?.[0] ?? '';
  const suffix = /^[^\s()"]+/.exec(right)?.[0] ?? '';
  return `${prefix}${suffix}`;
}

function completionPrefix(sourceCode: string, line: number, column: number): string {
  const text = sourceCode.split('\n')[line - 1] ?? '';
  return /[^\s()"]+$/.exec(text.slice(0, Math.max(0, column - 1)))?.[0] ?? '';
}

const PIE_COMPLETIONS: CompletionItem[] = [
  { label: 'claim', kind: 'keyword', detail: 'Declare a claim', insertText: '(claim ${1:name} ${2:type})' },
  { label: 'define', kind: 'keyword', detail: 'Define a value', insertText: '(define ${1:name} ${2:expr})' },
  { label: 'define-tactically', kind: 'keyword', detail: 'Prove a claim with tactics', insertText: '(define-tactically ${1:name}\n  (${2:tactics}))' },
  { label: 'Nat', kind: 'type', detail: 'Natural numbers' },
  { label: 'Atom', kind: 'type', detail: 'Atoms' },
  { label: 'Trivial', kind: 'type', detail: 'The trivial type' },
  { label: 'Absurd', kind: 'type', detail: 'The empty type' },
  { label: 'U', kind: 'type', detail: 'Universe of types' },
  { label: 'Pi', kind: 'type', detail: 'Dependent function type', insertText: '(Pi ((${1:x} ${2:A}))\n  ${3:B})' },
  { label: 'Sigma', kind: 'type', detail: 'Dependent pair type', insertText: '(Sigma ((${1:x} ${2:A}))\n  ${3:B})' },
  { label: 'Pair', kind: 'type', detail: 'Pair type', insertText: '(Pair ${1:A} ${2:B})' },
  { label: 'Either', kind: 'type', detail: 'Either type', insertText: '(Either ${1:L} ${2:R})' },
  { label: 'List', kind: 'type', detail: 'List type', insertText: '(List ${1:E})' },
  { label: 'Vec', kind: 'type', detail: 'Vector type', insertText: '(Vec ${1:E} ${2:n})' },
  { label: '=', kind: 'type', detail: 'Equality type', insertText: '(= ${1:A} ${2:from} ${3:to})' },
  { label: '->', kind: 'type', detail: 'Function type', insertText: '(-> ${1:A} ${2:B})' },
  { label: 'lambda', kind: 'keyword', detail: 'Lambda expression', insertText: '(lambda (${1:x}) ${2:body})' },
  { label: 'the', kind: 'keyword', detail: 'Type annotation', insertText: '(the ${1:type} ${2:expr})' },
  { label: 'zero', kind: 'variable', detail: 'Zero' },
  { label: 'add1', kind: 'function', detail: 'Successor', insertText: '(add1 ${1:n})' },
  { label: 'same', kind: 'function', detail: 'Reflexivity proof', insertText: '(same ${1:expr})' },
  { label: 'sole', kind: 'variable', detail: 'Trivial inhabitant' },
  { label: 'nil', kind: 'variable', detail: 'Empty list' },
  { label: '::', kind: 'function', detail: 'List cons', insertText: '(:: ${1:head} ${2:tail})' },
  { label: 'cons', kind: 'function', detail: 'Pair constructor', insertText: '(cons ${1:car} ${2:cdr})' },
  { label: 'car', kind: 'function', detail: 'Pair first projection', insertText: '(car ${1:pair})' },
  { label: 'cdr', kind: 'function', detail: 'Pair second projection', insertText: '(cdr ${1:pair})' },
  { label: 'left', kind: 'function', detail: 'Either left injection', insertText: '(left ${1:value})' },
  { label: 'right', kind: 'function', detail: 'Either right injection', insertText: '(right ${1:value})' },
  { label: 'intro', kind: 'function', detail: 'Introduce a variable', insertText: '(intro ${1:name})' },
  { label: 'exact', kind: 'function', detail: 'Provide exact proof term', insertText: '(exact ${1:expr})' },
  { label: 'exists', kind: 'function', detail: 'Provide Sigma witness', insertText: '(exists ${1:witness})' },
  { label: 'split-Pair', kind: 'function', detail: 'Split a Sigma/Pair goal' },
  { label: 'elim-Nat', kind: 'function', detail: 'Eliminate Nat', insertText: '(elim-Nat ${1:n})' },
  { label: 'elim-List', kind: 'function', detail: 'Eliminate List', insertText: '(elim-List ${1:xs})' },
  { label: 'elim-Vec', kind: 'function', detail: 'Eliminate Vec', insertText: '(elim-Vec ${1:xs})' },
  { label: 'elim-Either', kind: 'function', detail: 'Eliminate Either', insertText: '(elim-Either ${1:e})' },
  { label: 'elim-Equal', kind: 'function', detail: 'Eliminate equality', insertText: '(elim-Equal ${1:eq})' },
  { label: 'elim-Absurd', kind: 'function', detail: 'Eliminate Absurd', insertText: '(elim-Absurd ${1:x})' },
  { label: 'apply', kind: 'function', detail: 'Apply a theorem or function', insertText: '(apply ${1:expr})' },
  { label: 'then', kind: 'keyword', detail: 'Branch tactic block', insertText: '(then\n  ${1:tactic})' },
];

function extractUserSymbols(sourceCode: string): CompletionItem[] {
  const items: CompletionItem[] = [];
  const add = (label: string, detail: string) => {
    if (label && !items.some((item) => item.label === label)) {
      items.push({ label, kind: 'function', detail });
    }
  };

  for (const match of sourceCode.matchAll(/\(\s*claim\s+([^\s()]+)/g)) {
    add(match[1], 'User claim');
  }
  for (const match of sourceCode.matchAll(/\(\s*define\s+([^\s()]+)/g)) {
    add(match[1], 'User definition');
  }

  return items;
}

let pieModulesPromise: ReturnType<typeof loadPieModules> | null = null;

function loadPieModules() {
  if (!pieModulesPromise) {
    pieModulesPromise = Promise.all([
      import('@pie/parser/parser'),
      import('@pie/utils/context'),
      import('@pie/types/utils'),
      import('@pie/typechecker/represent'),
      import('@pie/typechecker/type-definition'),
    ]).then(([
      parserModule,
      contextModule,
      utilsModule,
      representModule,
      typeDefinitionModule,
    ]) => ({
      parserModule,
      contextModule,
      utilsModule,
      representModule,
      typeDefinitionModule,
    }));
  }

  return pieModulesPromise;
}

let cachedSourceCode: string | null = null;
let cachedBuildContext: ReturnType<typeof buildContextUncached> | null = null;

function buildContext(sourceCode: string) {
  if (cachedSourceCode === sourceCode && cachedBuildContext) {
    return cachedBuildContext;
  }

  cachedSourceCode = sourceCode;
  cachedBuildContext = buildContextUncached(sourceCode);
  return cachedBuildContext;
}

async function buildContextUncached(sourceCode: string) {
  const {
    parserModule,
    contextModule,
    utilsModule,
    representModule,
    typeDefinitionModule,
  } = await loadPieModules();

  const {
    schemeParse,
    pieDeclarationParser,
    Claim,
    Definition,
    SamenessCheck,
    DefineTactically,
  } = parserModule;
  const {
    initCtx,
    addClaimToContext,
    addDefineToContext,
    addDefineTacticallyToContext,
  } = contextModule;
  const { go, stop } = utilsModule;
  const { checkSame, represent } = representModule;
  const { TypeDefinition } = typeDefinitionModule;

  let ctx = new Map(initCtx);
  let renaming = new Map<string, string>();
  const diagnostics: Diagnostic[] = [];
  let parseSuccessful = true;
  let typeCheckSuccessful = true;

  let astList: unknown[];
  try {
    astList = schemeParse(sourceCode) as unknown[];
  } catch (error) {
    return {
      ctx,
      diagnostics: [{
        severity: 'error' as const,
        message: cleanDiagnosticMessage(error instanceof Error ? error.message : 'Failed to parse source'),
        range: rangeFromLocation(
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          (error as any)?.location,
        ),
        source: 'parser' as const,
      }],
      parseSuccessful: false,
      typeCheckSuccessful: false,
    };
  }

  for (const ast of astList) {
    let declaration: unknown;

    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      declaration = pieDeclarationParser.parseDeclaration(ast as any);
    } catch (error) {
      parseSuccessful = false;
      typeCheckSuccessful = false;
      diagnostics.push({
        severity: 'error',
        message: cleanDiagnosticMessage(error instanceof Error ? error.message : 'Failed to parse declaration'),
        range: rangeFromLocation(
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          (ast as any)?.location,
        ),
        source: 'parser',
      });
      continue;
    }

    try {
      let result: unknown = null;

      if (declaration instanceof Claim) {
        result = addClaimToContext(ctx, declaration.name, declaration.location, declaration.type);
        if (result instanceof go) ctx = result.result;
      } else if (declaration instanceof Definition) {
        result = addDefineToContext(ctx, declaration.name, declaration.location, declaration.expr);
        if (result instanceof go) ctx = result.result;
      } else if (declaration instanceof DefineTactically) {
        result = addDefineTacticallyToContext(ctx, declaration.name, declaration.location, declaration.tactics);
        if (result instanceof go) ctx = result.result.context;
      } else if (declaration instanceof SamenessCheck) {
        result = checkSame(ctx, declaration.location, declaration.type, declaration.left, declaration.right);
      } else if (declaration instanceof TypeDefinition) {
        const normalized = declaration.normalizeConstructor(ctx, renaming);
        ctx = normalized[0];
        renaming = normalized[1];
      } else {
        result = represent(ctx, declaration as Parameters<typeof represent>[1]);
      }

      if (result instanceof stop) {
        typeCheckSuccessful = false;
        diagnostics.push({
          severity: 'error',
          message: messageToText(result.message),
          range: rangeFromLocation(result.where),
          source: 'typechecker',
        });
      }
    } catch (error) {
      typeCheckSuccessful = false;
      diagnostics.push({
        severity: 'error',
        message: cleanDiagnosticMessage(error instanceof Error ? error.message : 'Failed to check declaration'),
        range: rangeFromLocation(
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          (declaration as any)?.location,
        ),
        source: 'typechecker',
      });
    }
  }

  diagnostics.sort((a, b) => (
    a.range.startLine === b.range.startLine
      ? a.range.startColumn - b.range.startColumn
      : a.range.startLine - b.range.startLine
  ));

  return { ctx, diagnostics, parseSuccessful, typeCheckSuccessful };
}

const diagnosticsWorkerAPI: DiagnosticsWorkerAPI = {
  async checkSource(sourceCode) {
    const { diagnostics, parseSuccessful, typeCheckSuccessful } =
      await buildContext(sourceCode);
    return { diagnostics, parseSuccessful, typeCheckSuccessful };
  },

  async getHoverInfo(sourceCode, line, column) {
    const token = tokenAt(sourceCode, line, column);
    if (!token) return null;

    try {
      const { ctx } = await buildContext(sourceCode);
      const binder = ctx.get(token);
      if (!binder) return null;
      return {
        type: binder.type.readBackType(ctx).prettyPrint(),
        documentation: token,
      };
    } catch {
      return null;
    }
  },

  async getCompletions(sourceCode, line, column) {
    const prefix = completionPrefix(sourceCode, line, column).toLowerCase();
    const allItems = [...PIE_COMPLETIONS, ...extractUserSymbols(sourceCode)];
    const seen = new Set<string>();

    return allItems.filter((item) => {
      if (seen.has(item.label)) return false;
      seen.add(item.label);
      return !prefix || item.label.toLowerCase().startsWith(prefix);
    });
  },
};

Comlink.expose(diagnosticsWorkerAPI);
