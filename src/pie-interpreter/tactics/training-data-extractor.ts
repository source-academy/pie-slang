import { schemeParse, pieDeclarationParser, Claim as ClaimDecl, Definition, SamenessCheck, DefineTactically } from '../parser/parser';
import { go, stop } from '../types/utils';
import { addClaimToContext, addDefineToContext, addDefineTacticallyToContext, Define, Free, Claim, Context, initCtx } from '../utils/context';
import { Goal, TacticListener } from './proofstate';
import { TypeDefinition } from '../typechecker/type-definition';
import { sugarType } from '../unparser/sugar';

export interface ContextEntry {
  name: string;
  type: string;
  kind: 'free' | 'define' | 'claim';
}

export interface TrainingExample {
  theoremName: string;
  theoremType: string;
  stepIndex: number;
  context: ContextEntry[];
  goal: string;
  tactic: string;
  isInsideThen: boolean;
  branchIndex: number | null;
}

function serializeContext(ctx: Context): ContextEntry[] {
  const entries: ContextEntry[] = [];
  for (const [name, binder] of ctx) {
    let kind: 'free' | 'define' | 'claim';
    if (binder instanceof Free) {
      kind = 'free';
    } else if (binder instanceof Define) {
      kind = 'define';
    } else if (binder instanceof Claim) {
      kind = 'claim';
    } else {
      kind = 'define'; // InductiveDatatypeBinder etc.
    }

    const typeStr = binder.type.readBackType(ctx).prettyPrint();
    entries.push({ name, type: typeStr, kind });
  }
  return entries;
}

function serializeGoal(goal: Goal): string {
  const typeCore = goal.type.readBackType(goal.context);
  return sugarType(typeCore, goal.context);
}

/**
 * Extract training data from a single Pie source string.
 * Hooks into addDefineTacticallyToContext via the tacticListener parameter.
 */
export function extractFromSource(pieSource: string): TrainingExample[] {
  const examples: TrainingExample[] = [];
  const astList = schemeParse(pieSource);
  let ctx = initCtx;
  let renaming = new Map<string, string>();

  for (const ast of astList) {
    const src = pieDeclarationParser.parseDeclaration(ast);

    if (src instanceof ClaimDecl) {
      const result = addClaimToContext(ctx, src.name, src.location, src.type);
      if (result instanceof go) {
        ctx = result.result;
      } else {
        break;
      }
    } else if (src instanceof Definition) {
      const result = addDefineToContext(ctx, src.name, src.location, src.expr);
      if (result instanceof go) {
        ctx = result.result;
      } else {
        break;
      }
    } else if (src instanceof TypeDefinition) {
      const [newCtx, newRenaming] = src.normalizeConstructor(ctx, renaming);
      ctx = newCtx;
      renaming = newRenaming;
    } else if (src instanceof DefineTactically) {
      const theoremName = src.name;

      // Get the theorem type from the claim
      const claim = ctx.get(theoremName);
      if (!(claim instanceof Claim)) continue;
      const theoremType = claim.type.readBackType(ctx).prettyPrint();

      let stepIndex = 0;

      // Set up a listener to capture each tactic step
      const listener: TacticListener = (goal, tacticStr, isInsideThen, branchIndex) => {
        examples.push({
          theoremName,
          theoremType,
          stepIndex: stepIndex++,
          context: serializeContext(goal.context),
          goal: serializeGoal(goal),
          tactic: tacticStr,
          isInsideThen,
          branchIndex,
        });
      };

      // Run the proof with the listener attached via addDefineTacticallyToContext
      const result = addDefineTacticallyToContext(ctx, theoremName, src.location, src.tactics, false, listener);
      if (result instanceof go) {
        ctx = result.result.context;
      }
    } else if (src instanceof SamenessCheck) {
      // skip
    } else {
      // Expression evaluation — ignore for training data
    }
  }

  return examples;
}

/**
 * Extract training data from multiple Pie source strings.
 */
export function extractFromSources(pieSources: string[]): TrainingExample[] {
  const allExamples: TrainingExample[] = [];
  for (const source of pieSources) {
    try {
      const examples = extractFromSource(source);
      allExamples.push(...examples);
    } catch (e) {
      continue;
    }
  }
  return allExamples;
}
