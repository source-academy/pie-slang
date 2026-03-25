import { Context, Define, Free, Claim } from '../utils/context';
import { Goal } from './proofstate';
import { sugarType } from '../unparser/sugar';

export interface ContextEntry {
  name: string;
  type: string;
}

export interface TrainingExample {
  theoremName: string;
  theoremType: string;
  stepIndex: number;
  globalContext: ContextEntry[];
  localContext: ContextEntry[];
  goal: string;
  tactic: string;
}

export function serializeContext(ctx: Context, originalContext?: Context): { globalContext: ContextEntry[]; localContext: ContextEntry[] } {
  const globalContext: ContextEntry[] = [];
  const localContext: ContextEntry[] = [];
  for (const [name, binder] of ctx) {
    let typeStr: string;
    try {
      const typeCore = binder.type.readBackType(ctx);
      typeStr = sugarType(typeCore, ctx);
    } catch {
      // Some binder types (e.g. Lambda values) can't be read back as types
      typeStr = String(binder.type);
    }
    if (binder instanceof Free) {
      localContext.push({ name, type: typeStr });
    } else if (binder instanceof Define) {
      // Define binders introduced during the proof (not in original context) are local witnesses
      if (originalContext && !originalContext.has(name)) {
        localContext.push({ name, type: typeStr });
      } else {
        globalContext.push({ name, type: typeStr });
      }
    }
    // Skip Claim entries (unproved claims aren't useful context)
    // InductiveDatatypeBinder etc. are also global
    else if (!(binder instanceof Claim)) {
      globalContext.push({ name, type: typeStr });
    }
  }
  return { globalContext, localContext };
}

export function serializeGoal(goal: Goal): string | null {
  try {
    const typeCore = goal.type.readBackType(goal.context);
    return sugarType(typeCore, goal.context);
  } catch {
    // readBackType failed — return null to skip this example rather than
    // emitting internal representations (CLOS, Neutral, etc.)
    return null;
  }
}
