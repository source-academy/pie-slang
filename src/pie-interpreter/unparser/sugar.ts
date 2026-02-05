import { Core } from '../types/core';
import { Context, Define } from '../utils/context';
import { Value, Universe, Delay } from '../types/value';

/**
 * TypeDefinition represents a user-defined type alias.
 * For example, (claim Even (Pi ((n Nat)) U)) with (define Even (lambda (n) ...))
 */
interface TypeDefinition {
  name: string;
  type: Value;      // The type of the definition
}

/**
 * TypeSugarer attempts to display types using user-defined names
 * instead of their expanded forms.
 *
 * For example:
 * - Expanded: (Σ (half Nat) (= Nat n (add half half)))
 * - Sugared: (Even n)
 *
 * Currently provides infrastructure for sugaring. Full pattern matching
 * for type recognition is a future enhancement.
 */
export class TypeSugarer {
  private typeDefinitions: TypeDefinition[] = [];

  /**
   * Build the sugarer from a context containing definitions.
   * Collects type-level definitions (those returning U).
   */
  constructor(ctx: Context) {
    for (const [name, binder] of ctx) {
      if (binder instanceof Define) {
        // Check if this is a type-level definition
        if (this.isTypeLevelDefinition(binder.type)) {
          this.typeDefinitions.push({
            name,
            type: binder.type,
          });
        }
      }
    }
  }

  /**
   * Check if a type is a type-level definition (returns U or Pi(..., U)).
   */
  private isTypeLevelDefinition(type: Value): boolean {
    // Force any delayed values
    const forcedType = this.forceValue(type);

    // Direct Universe type
    if (forcedType instanceof Universe) {
      return true;
    }

    // For Pi types, we'd need to check the result type
    // This is complex due to Closure handling, so for now we just
    // check if the pretty-printed form ends with "U"
    const typeStr = forcedType.prettyPrint();
    return typeStr.endsWith('U)') || typeStr === 'U';
  }

  /**
   * Force a delayed value to get its actual value.
   */
  private forceValue(val: Value): Value {
    if (val instanceof Delay) {
      return val.now();
    }
    return val;
  }

  /**
   * Get all known type definition names.
   * Useful for UI to show available type abbreviations.
   */
  getTypeDefinitionNames(): string[] {
    return this.typeDefinitions.map(d => d.name);
  }

  /**
   * Attempt to sugar a Core expression using known type definitions.
   * Returns the sugared string, or falls back to prettyPrint if no match.
   *
   * @param core The core expression to sugar
   * @param _ctx The context for readback (unused in current implementation)
   */
  sugar(core: Core, _ctx: Context): string {
    // For now, return the original pretty-printed form.
    // Future enhancement: implement pattern matching against known definitions.
    //
    // The full implementation would:
    // 1. Check if core is a Sigma/dependent type
    // 2. Try to match it against each typeDefinition's expanded form
    // 3. If match found, extract parameters and return sugared name
    //
    // This is complex because it requires:
    // - Alpha equivalence checking
    // - Pattern matching with variable extraction
    // - Handling of nested applications
    return core.prettyPrint();
  }
}

/**
 * Create a TypeSugarer from a context.
 * Convenience function for common usage.
 */
export function createTypeSugarer(ctx: Context): TypeSugarer {
  return new TypeSugarer(ctx);
}

/**
 * Sugar a type for display, using a pre-built sugarer.
 * Falls back to prettyPrint if no sugaring is available.
 */
export function sugarType(core: Core, ctx: Context, sugarer?: TypeSugarer): string {
  if (sugarer) {
    return sugarer.sugar(core, ctx);
  }
  return core.prettyPrint();
}
