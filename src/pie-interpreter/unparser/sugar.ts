import * as C from '../types/core';
import { Context, Define, bindFree } from '../utils/context';
import { Value, Universe, Delay, Lambda, Pi, Neutral } from '../types/value';
import { FirstOrderClosure, fresh } from '../types/utils';
import { Variable } from '../types/neutral';

/**
 * TypeDefinition represents a user-defined type alias.
 * For example, (claim Even (Pi ((n Nat)) U)) with (define Even (lambda (n) ...))
 */
interface TypeDefinition {
  name: string;
  type: Value;           // The type of the definition
  paramName: string;     // The lambda parameter name
  bodyTemplate: C.Core;  // The lambda body as Core
}

/**
 * TypeSugarer attempts to display types using user-defined names
 * instead of their expanded forms.
 *
 * For example:
 * - Expanded: (Σ (half Nat) (= Nat n (double half)))
 * - Sugared: (Even n)
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
          // Get the lambda body if the value is a Lambda
          const value = this.forceValue(binder.value);
          if (value instanceof Lambda) {
            const body = value.body;
            if (body instanceof FirstOrderClosure) {
              // Get the argument type from the Pi type
              const typeVal = this.forceValue(binder.type);
              if (typeVal instanceof Pi) {
                const argType = typeVal.argType;
                const paramName = body.varName;

                // Create a neutral variable for the parameter
                const neutralVar = new Neutral(argType, new Variable(paramName));

                // Apply the closure to the neutral to get the result Value
                const resultValue = body.valOfClosure(neutralVar);

                // Normalize the result to Core using readBackType
                // This expands definitions like 'double' to 'iter-Nat'
                const normalizedCtx = bindFree(ctx, paramName, argType);
                const normalizedTemplate = resultValue.readBackType(normalizedCtx);

                this.typeDefinitions.push({
                  name,
                  type: binder.type,
                  paramName,
                  bodyTemplate: normalizedTemplate,
                });
              }
            }
          }
        }
      }
    }
  }

  /**
   * Check if a type is a type-level definition (returns U or Pi(..., U)).
   */
  private isTypeLevelDefinition(type: Value): boolean {
    const forcedType = this.forceValue(type);

    // Direct Universe type (constant type alias)
    if (forcedType instanceof Universe) {
      return true;
    }

    // Pi type that returns U (parameterized type family)
    if (forcedType instanceof Pi) {
      // Check if the result type eventually yields U
      // The prettyPrint looks like "(Π x Nat (CLOS x U))" for type families
      const typeStr = forcedType.prettyPrint();
      // Check for "U)" anywhere in the string (handles nested parens)
      // or "(CLOS ... U)" pattern
      return /\bU\)/.test(typeStr);
    }

    return false;
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
   */
  getTypeDefinitionNames(): string[] {
    return this.typeDefinitions.map(d => d.name);
  }

  /**
   * Attempt to sugar a Core expression using known type definitions.
   * Returns the sugared string, or falls back to prettyPrint if no match.
   */
  sugar(core: C.Core, _ctx: Context): string {
    // Try to match against each type definition
    for (const def of this.typeDefinitions) {
      const extractedArg = this.matchTemplate(def.bodyTemplate, core, def.paramName);
      if (extractedArg !== null) {
        // Found a match! Return the sugared form
        return `(${def.name} ${extractedArg.prettyPrint()})`;
      }
    }

    // No match found, return the original
    return core.prettyPrint();
  }

  /**
   * Try to match a target Core against a template Core, extracting the
   * value for a pattern variable.
   *
   * @param template The template Core with a pattern variable
   * @param target The target Core to match against
   * @param patternVar The name of the pattern variable to extract
   * @returns The Core that patternVar should be bound to, or null if no match
   */
  private matchTemplate(template: C.Core, target: C.Core, patternVar: string): C.Core | null {
    return this.matchTemplateInternal(template, target, patternVar, new Map());
  }

  /**
   * Internal matching with variable renaming support.
   * @param template Template Core expression
   * @param target Target Core expression
   * @param patternVar The pattern variable to extract
   * @param boundVars Map from template bound vars to target bound vars
   */
  private matchTemplateInternal(
    template: C.Core,
    target: C.Core,
    patternVar: string,
    boundVars: Map<string, string>
  ): C.Core | null {
    // Pattern variable match
    if (template instanceof C.VarName) {
      if (template.name === patternVar) {
        // Found the pattern variable - return the target as the extracted value
        return target;
      }
      // Check if this is a bound variable that should match
      const expectedTarget = boundVars.get(template.name);
      if (expectedTarget !== undefined) {
        // This is a bound variable - target should also be a VarName with the corresponding name
        if (target instanceof C.VarName && target.name === expectedTarget) {
          return null; // Match succeeds but doesn't capture anything
        }
        return null; // No match - bound variable mismatch
      }
      // Free variable - should match exactly
      if (target instanceof C.VarName && target.name === template.name) {
        return null; // Match succeeds
      }
      return null; // No match
    }

    // Sigma type matching
    if (template instanceof C.Sigma && target instanceof C.Sigma) {
      // Check if the car types match
      const carTypeMatch = this.matchTemplateInternal(
        template.type,
        target.type,
        patternVar,
        boundVars
      );

      // Create new bound var mapping for the body
      const newBoundVars = new Map(boundVars);
      newBoundVars.set(template.name, target.name);

      // Check if the bodies match (with the bound variable mapping)
      const bodyMatch = this.matchTemplateInternal(
        template.body,
        target.body,
        patternVar,
        newBoundVars
      );

      // Combine results - at most one should capture the pattern var
      return this.combineMatches(carTypeMatch, bodyMatch);
    }

    // Pi type matching
    if (template instanceof C.Pi && target instanceof C.Pi) {
      const argTypeMatch = this.matchTemplateInternal(
        template.type,
        target.type,
        patternVar,
        boundVars
      );

      const newBoundVars = new Map(boundVars);
      newBoundVars.set(template.name, target.name);

      const bodyMatch = this.matchTemplateInternal(
        template.body,
        target.body,
        patternVar,
        newBoundVars
      );

      return this.combineMatches(argTypeMatch, bodyMatch);
    }

    // Lambda matching
    if (template instanceof C.Lambda && target instanceof C.Lambda) {
      const newBoundVars = new Map(boundVars);
      newBoundVars.set(template.param, target.param);

      return this.matchTemplateInternal(
        template.body,
        target.body,
        patternVar,
        newBoundVars
      );
    }

    // Equal type matching
    if (template instanceof C.Equal && target instanceof C.Equal) {
      const typeMatch = this.matchTemplateInternal(
        template.type,
        target.type,
        patternVar,
        boundVars
      );
      const leftMatch = this.matchTemplateInternal(
        template.left,
        target.left,
        patternVar,
        boundVars
      );
      const rightMatch = this.matchTemplateInternal(
        template.right,
        target.right,
        patternVar,
        boundVars
      );

      return this.combineMatches(typeMatch, this.combineMatches(leftMatch, rightMatch));
    }

    // Application matching
    if (template instanceof C.Application && target instanceof C.Application) {
      const funMatch = this.matchTemplateInternal(
        template.fun,
        target.fun,
        patternVar,
        boundVars
      );
      const argMatch = this.matchTemplateInternal(
        template.arg,
        target.arg,
        patternVar,
        boundVars
      );

      return this.combineMatches(funMatch, argMatch);
    }

    // The type annotation (for iter-Nat, etc.)
    if (template instanceof C.The && target instanceof C.The) {
      const typeMatch = this.matchTemplateInternal(
        template.type,
        target.type,
        patternVar,
        boundVars
      );
      const exprMatch = this.matchTemplateInternal(
        template.expr,
        target.expr,
        patternVar,
        boundVars
      );

      return this.combineMatches(typeMatch, exprMatch);
    }

    // IterNat matching
    if (template instanceof C.IterNat && target instanceof C.IterNat) {
      const targetMatch = this.matchTemplateInternal(
        template.target,
        target.target,
        patternVar,
        boundVars
      );
      const baseMatch = this.matchTemplateInternal(
        template.base,
        target.base,
        patternVar,
        boundVars
      );
      const stepMatch = this.matchTemplateInternal(
        template.step,
        target.step,
        patternVar,
        boundVars
      );

      return this.combineMatches(targetMatch, this.combineMatches(baseMatch, stepMatch));
    }

    // Add1 matching
    if (template instanceof C.Add1 && target instanceof C.Add1) {
      return this.matchTemplateInternal(template.n, target.n, patternVar, boundVars);
    }

    // Cons matching
    if (template instanceof C.Cons && target instanceof C.Cons) {
      const firstMatch = this.matchTemplateInternal(
        template.first,
        target.first,
        patternVar,
        boundVars
      );
      const secondMatch = this.matchTemplateInternal(
        template.second,
        target.second,
        patternVar,
        boundVars
      );

      return this.combineMatches(firstMatch, secondMatch);
    }

    // Same matching
    if (template instanceof C.Same && target instanceof C.Same) {
      return this.matchTemplateInternal(template.type, target.type, patternVar, boundVars);
    }

    // Base type matching (no children to recurse into)
    if (template instanceof C.Nat && target instanceof C.Nat) {
      return null; // Match succeeds
    }
    if (template instanceof C.Zero && target instanceof C.Zero) {
      return null;
    }
    if (template instanceof C.Universe && target instanceof C.Universe) {
      return null;
    }
    if (template instanceof C.Atom && target instanceof C.Atom) {
      return null;
    }
    if (template instanceof C.Trivial && target instanceof C.Trivial) {
      return null;
    }
    if (template instanceof C.Sole && target instanceof C.Sole) {
      return null;
    }
    if (template instanceof C.Absurd && target instanceof C.Absurd) {
      return null;
    }
    if (template instanceof C.Nil && target instanceof C.Nil) {
      return null;
    }
    if (template instanceof C.VecNil && target instanceof C.VecNil) {
      return null;
    }

    // Quote matching
    if (template instanceof C.Quote && target instanceof C.Quote) {
      if (template.sym === target.sym) {
        return null; // Match succeeds
      }
    }

    // List type matching
    if (template instanceof C.List && target instanceof C.List) {
      return this.matchTemplateInternal(template.elemType, target.elemType, patternVar, boundVars);
    }

    // Vec type matching
    if (template instanceof C.Vec && target instanceof C.Vec) {
      const typeMatch = this.matchTemplateInternal(
        template.type,
        target.type,
        patternVar,
        boundVars
      );
      const lengthMatch = this.matchTemplateInternal(
        template.length,
        target.length,
        patternVar,
        boundVars
      );
      return this.combineMatches(typeMatch, lengthMatch);
    }

    // Either type matching
    if (template instanceof C.Either && target instanceof C.Either) {
      const leftMatch = this.matchTemplateInternal(
        template.left,
        target.left,
        patternVar,
        boundVars
      );
      const rightMatch = this.matchTemplateInternal(
        template.right,
        target.right,
        patternVar,
        boundVars
      );
      return this.combineMatches(leftMatch, rightMatch);
    }

    // No match - types are different
    return null;
  }

  /**
   * Combine two match results. If both have a capture, they must be equal.
   * Returns the captured value, or null if no capture.
   */
  private combineMatches(a: C.Core | null, b: C.Core | null): C.Core | null {
    if (a !== null && b !== null) {
      // Both captured something - check if they're consistent
      // For simplicity, we require exact match (same prettyPrint)
      if (a.prettyPrint() === b.prettyPrint()) {
        return a;
      }
      // Inconsistent captures - no match
      return null;
    }
    return a ?? b;
  }
}

/**
 * Create a TypeSugarer from a context.
 */
export function createTypeSugarer(ctx: Context): TypeSugarer {
  return new TypeSugarer(ctx);
}

/**
 * Sugar a type for display.
 * If a sugarer is provided, uses it. Otherwise creates one from the context.
 * Falls back to prettyPrint if no matches are found.
 */
export function sugarType(core: C.Core, ctx: Context, sugarer?: TypeSugarer): string {
  // Create a sugarer if not provided
  const s = sugarer ?? new TypeSugarer(ctx);
  return s.sugar(core, ctx);
}
