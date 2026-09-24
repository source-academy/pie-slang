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
  Define, InductiveDatatypeBinder, ConstructorTypeBinder, type Context, type Binder,
} from '../utils/context';
import { diagnosticFromError, type Diagnostic } from './diagnostic';

export type BindingKind = 'claim' | 'definition' | 'theorem' | 'datatype' | 'constructor';

/** In-process checkpoint. Kernel values are opaque; maps are defensively copied. */
export interface SessionSnapshot {
  readonly context: ReadonlyMap<string, Binder>;
  readonly renaming: ReadonlyMap<string, string>;
  readonly bindingKinds: ReadonlyMap<string, BindingKind>;
}

export interface SessionBinding {
  name: string;
  type: string;
  kind: BindingKind;
}

export interface SessionResult {
  success: boolean;
  diagnostics: Diagnostic[];
  /** Output for committed work only; rolled-back expression results are discarded. */
  output: string;
  /** The session's committed state after the operation, including on failure. */
  context: Context;
  bindings: SessionBinding[];
}

/** Speculative analysis only. These fields do not describe committed session state. */
export interface SessionAnalysisResult {
  success: boolean;
  diagnostics: Diagnostic[];
  checkedOutput: string;
  /** May include valid declarations before and after errors when analysis recovers. */
  checkedContext: Context;
  checkedBindings: SessionBinding[];
}

export interface ExecutionOptions {
  verbose?: boolean;
  /** By default an unsuccessful input leaves the session unchanged. */
  atomic?: boolean;
}

type ParsedEntry = { declaration: Declaration } | { diagnostic: Diagnostic };

function unwrap<T>(result: Perhaps<T>): T {
  if (result instanceof go) return result.result;
  if (result instanceof stop) throw result;
  throw new Error('Internal error: expected go/stop');
}

/** Owns top-level elaboration; all entry points use the same declaration dispatch. */
export class ProgramSession {
  private context: Context;
  private renaming: Renaming;
  private bindingKinds: Map<string, BindingKind>;

  constructor(snapshot?: SessionSnapshot) {
    this.context = new Map(snapshot?.context);
    this.renaming = new Map(snapshot?.renaming);
    this.bindingKinds = new Map(snapshot?.bindingKinds);
  }

  snapshot(): SessionSnapshot {
    return {
      context: new Map(this.context),
      renaming: new Map(this.renaming),
      bindingKinds: new Map(this.bindingKinds),
    };
  }

  reset(): void {
    this.context = new Map();
    this.renaming = new Map();
    this.bindingKinds = new Map();
  }

  execute(source: string, options: ExecutionOptions = {}): SessionResult {
    const working = new ProgramSession(this.snapshot());
    const result = working.run(source, false, options.verbose ?? false);
    if (result.success || options.atomic === false) {
      this.adopt(working);
      return this.executionResult(result);
    }
    // Keep the failed attempt's diagnostics, but never expose its discarded state
    // or expression output as the execution result.
    return this.executionResult(this.result('', result.diagnostics));
  }

  /** Check against this session without changing it; recover between declarations. */
  analyze(source: string): SessionAnalysisResult {
    return new ProgramSession(this.snapshot()).run(source, true, false);
  }

  /**
   * Build the context visible at a target claim, without changing this session.
   * Preserve the proof editor's policy: unrelated, unimplemented claims are omitted,
   * and declarations after the target cannot contribute definitions to its proof.
   */
  prepareProof(source: string, claimName: string): SessionAnalysisResult {
    return new ProgramSession(this.snapshot()).run(source, false, false, claimName);
  }

  applyDeclaration(declaration: Declaration, options: ExecutionOptions = {}): SessionResult {
    const diagnostics: Diagnostic[] = [];
    let output = '';
    try {
      output = this.apply(declaration, options.verbose ?? false);
    } catch (error) {
      diagnostics.push(diagnosticFromError(error, 'typechecker', declaration.location));
    }
    return this.executionResult(this.result(output, diagnostics));
  }

  /** Only call with a result describing this session's committed state. */
  private executionResult(result: SessionAnalysisResult): SessionResult {
    return {
      success: result.success,
      diagnostics: result.diagnostics,
      output: result.checkedOutput,
      context: result.checkedContext,
      bindings: result.checkedBindings,
    };
  }

  private adopt(session: ProgramSession): void {
    this.context = new Map(session.context);
    this.renaming = new Map(session.renaming);
    this.bindingKinds = new Map(session.bindingKinds);
  }

  private run(source: string, recover: boolean, verbose: boolean, proofTarget?: string): SessionAnalysisResult {
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
        return !(declaration instanceof Claim) || declaration.name === proofTarget || definedNames.has(declaration.name);
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
    // addDefineToContext deletes a claim in-place. Never pass the session's live map.
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

  private result(output: string, diagnostics: Diagnostic[]): SessionAnalysisResult {
    const bindings: SessionBinding[] = [];
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
