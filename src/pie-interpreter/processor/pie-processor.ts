import { readBack } from '../evaluator/utils';
import {
  Claim, Definition, DefineTactically, SamenessCheck,
  pieDeclarationParser, schemeParse, type Declaration,
} from '../parser/parser';
import { checkSame, represent } from '../typechecker/represent';
import { TypeDefinition } from '../typechecker/type-definition';
import type { Renaming } from '../typechecker/utils';
import { The } from '../types/core';
import { go, stop, type Perhaps } from '../types/utils';
import { prettyPrintCore } from '../unparser/pretty';
import {
  addClaimToContext, addDefineToContext, addDefineTacticallyToContext,
  Define, InductiveDatatypeBinder, ConstructorTypeBinder, type Context,
} from '../utils/context';
import { diagnosticFromError, type Diagnostic } from './diagnostic';

export type BindingKind = 'claim' | 'definition' | 'theorem' | 'datatype' | 'constructor';

export interface ProcessorBinding {
  name: string;
  type: string;
  kind: BindingKind;
}

export interface ProcessorResult {
  success: boolean;
  diagnostics: Diagnostic[];
  /** Output of a successful complete program; empty on failure. */
  output: string;
  /** Context of a successful complete program; empty on failure. Never reused by later calls. */
  context: Context;
  bindings: ProcessorBinding[];
}

/** Partial checking results, not a successfully executed program or reusable execution state. */
export interface ProcessorAnalysisResult {
  success: boolean;
  diagnostics: Diagnostic[];
  checkedOutput: string;
  /** May include valid declarations before and after errors when analysis recovers. */
  checkedContext: Context;
  checkedBindings: ProcessorBinding[];
}

export interface ExecutionOptions {
  verbose?: boolean;
}

type ParsedEntry = { declaration: Declaration } | { diagnostic: Diagnostic };

function unwrap<T>(result: Perhaps<T>): T {
  if (result instanceof go) return result.result;
  if (result instanceof stop) throw result;
  throw new Error('Internal error: expected go/stop');
}

/** Shared whole-source entry points. Every call starts with a fresh program context. */
export class PieProcessor {
  execute(source: string, options: ExecutionOptions = {}): ProcessorResult {
    const result = new ProgramRun().run(source, false, options.verbose ?? false);
    return {
      success: result.success,
      diagnostics: result.diagnostics,
      output: result.success ? result.checkedOutput : '',
      context: result.success ? result.checkedContext : new Map(),
      bindings: result.success ? result.checkedBindings : [],
    };
  }

  /** Analyze the current source independently, recovering between declarations. */
  analyze(source: string): ProcessorAnalysisResult {
    return new ProgramRun().run(source, true, false);
  }

  /**
   * Build the context visible at a target claim in the current source.
   * Preserve the proof editor's policy: unrelated, unimplemented claims are omitted,
   * and declarations after the target cannot contribute definitions to its proof.
   * Standalone expressions and check-same do not build this context and are skipped;
   * execute/analyze still check them when processing the complete program.
   */
  prepareProof(source: string, claimName: string): ProcessorAnalysisResult {
    return new ProgramRun().run(source, false, false, claimName);
  }
}

/** Internal state for exactly one source-processing call; never retained by PieProcessor. */
class ProgramRun {
  private context: Context = new Map();
  private renaming: Renaming = new Map();
  private bindingKinds = new Map<string, BindingKind>();

  run(source: string, recover: boolean, verbose: boolean, proofTarget?: string): ProcessorAnalysisResult {
    const diagnostics: Diagnostic[] = [];
    const entries: ParsedEntry[] = [];
    try {
      for (const ast of schemeParse(source)) {
        try {
          entries.push({ declaration: pieDeclarationParser.parseDeclaration(ast) });
        } catch (error) {
          entries.push({ diagnostic: diagnosticFromError(error, 'parser', ast.location) });
        }
      }
    } catch (error) {
      diagnostics.push(diagnosticFromError(error, 'parser'));
      return this.result('', diagnostics);
    }

    let selected = entries;
    if (proofTarget !== undefined) {
      // The proof editor pre-scans the whole file to identify implemented claims.
      const invalid = entries.find(entry => 'diagnostic' in entry);
      if (invalid && 'diagnostic' in invalid) return this.result('', [invalid.diagnostic]);
      const targetIndex = entries.findIndex(entry =>
        'declaration' in entry && entry.declaration instanceof Claim && entry.declaration.name === proofTarget);
      if (targetIndex < 0) {
        diagnostics.push(diagnosticFromError(
          new Error(`Failed to start proof: ${proofTarget} is not a valid type or has already been proved`),
          'typechecker',
        ));
        return this.result('', diagnostics);
      }
      const definedNames = new Set<string>();
      for (const entry of entries) {
        if ('declaration' in entry &&
          (entry.declaration instanceof Definition || entry.declaration instanceof DefineTactically)) {
          definedNames.add(entry.declaration.name);
        }
      }
      selected = entries.slice(0, targetIndex + 1).filter(entry => {
        if (!('declaration' in entry)) return true;
        const declaration = entry.declaration;
        if (declaration instanceof Claim) {
          return declaration.name === proofTarget || definedNames.has(declaration.name);
        }
        // Proof setup checks bindings, not independent computations/assertions.
        return declaration instanceof Definition || declaration instanceof DefineTactically ||
          declaration instanceof TypeDefinition;
      });
    }

    let output = '';
    for (const entry of selected) {
      if ('diagnostic' in entry) {
        diagnostics.push(entry.diagnostic);
        if (!recover) break;
        continue;
      }
      const { declaration } = entry;
      try {
        output += this.apply(declaration, verbose);
      } catch (error) {
        diagnostics.push(diagnosticFromError(error, 'typechecker', declaration.location));
        if (!recover) break;
      }
    }
    return this.result(output, diagnostics);
  }

  private apply(declaration: Declaration, verbose: boolean): string {
    // Keep the checked prefix intact if a declaration fails during error recovery.
    // addDefineToContext may delete a claim in-place; this is not a program snapshot.
    let context = new Map(this.context);
    let renaming = new Map(this.renaming);
    const kinds = new Map(this.bindingKinds);
    let output = '';
    if (declaration instanceof Claim) {
      context = unwrap(addClaimToContext(context, declaration.name, declaration.location, declaration.type));
      kinds.set(declaration.name, 'claim');
    } else if (declaration instanceof Definition) {
      context = unwrap(addDefineToContext(context, declaration.name, declaration.location, declaration.expr));
      kinds.set(declaration.name, 'definition');
    } else if (declaration instanceof DefineTactically) {
      const result = unwrap(addDefineTacticallyToContext(
        context, declaration.name, declaration.location, declaration.tactics, verbose,
      ));
      context = result.context;
      output = result.message;
      kinds.set(declaration.name, 'theorem');
    } else if (declaration instanceof SamenessCheck) {
      unwrap(checkSame(context, declaration.location, declaration.type, declaration.left, declaration.right));
    } else if (declaration instanceof TypeDefinition) {
      [context, renaming] = declaration.normalizeConstructor(context, renaming);
      for (const [name, binder] of context) {
        if (binder instanceof InductiveDatatypeBinder) kinds.set(name, 'datatype');
        if (binder instanceof ConstructorTypeBinder) kinds.set(name, 'constructor');
      }
    } else {
      const core = unwrap(represent(context, declaration)) as The;
      output = `${prettyPrintCore(core.expr)}: ${prettyPrintCore(core.type)}\n`;
    }
    this.context = context;
    this.renaming = renaming;
    this.bindingKinds = kinds;
    return output;
  }

  private result(output: string, diagnostics: Diagnostic[]): ProcessorAnalysisResult {
    const bindings: ProcessorBinding[] = [];
    for (const [name, binder] of this.context) {
      const type = prettyPrintCore(binder.type.readBackType(this.context));
      bindings.push({ name, type, kind: this.bindingKinds.get(name) ?? 'claim' });
      output += `${name} : ${type}\n`;
      if (binder instanceof Define) {
        output += `${name} = ${prettyPrintCore(readBack(this.context, binder.type, binder.value))}\n`;
      }
    }
    return {
      success: diagnostics.length === 0,
      diagnostics,
      checkedOutput: output,
      checkedContext: new Map(this.context),
      checkedBindings: bindings,
    };
  }
}
