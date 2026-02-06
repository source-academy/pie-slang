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
 * Match result type that distinguishes between:
 * - 'capture': Success, captured the pattern variable
 * - 'match': Success, no capture needed (structural match)
 * - 'fail': Match failed (structural mismatch)
 */
type MatchResult =
  | { status: 'capture'; value: C.Core }
  | { status: 'match' }
  | { status: 'fail' };

// Helper constants and function
const MATCH: MatchResult = { status: 'match' };
const FAIL: MatchResult = { status: 'fail' };
const capture = (value: C.Core): MatchResult => ({ status: 'capture', value });

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
   *
   * This method is recursive: it first tries to match the whole expression
   * against type definitions, and if no match is found, it recursively
   * sugars sub-expressions within compound types.
   */
  sugar(core: C.Core, ctx: Context): string {
    // First, try to match against each type definition
    for (const def of this.typeDefinitions) {
      const extractedArg = this.matchTemplate(def.bodyTemplate, core, def.paramName);

      if (extractedArg !== null) {
        // Found a match! Recursively sugar the extracted argument
        return `(${def.name} ${this.sugar(extractedArg, ctx)})`;
      }
    }

    // No direct match - recursively sugar sub-expressions for compound types

    // Pi type (dependent function type)
    if (core instanceof C.Pi) {
      const argType = this.sugar(core.type, ctx);
      const bodyType = this.sugar(core.body, ctx);
      return `(Π ((${core.name} ${argType})) ${bodyType})`;
    }

    // Arrow type (non-dependent function type) - represented as Pi in Core
    // Already handled above

    // Sigma type (dependent pair type)
    if (core instanceof C.Sigma) {
      const carType = this.sugar(core.type, ctx);
      const bodyType = this.sugar(core.body, ctx);
      return `(Σ ((${core.name} ${carType})) ${bodyType})`;
    }

    // Either type
    if (core instanceof C.Either) {
      const left = this.sugar(core.left, ctx);
      const right = this.sugar(core.right, ctx);
      return `(Either ${left} ${right})`;
    }

    // Equal type
    if (core instanceof C.Equal) {
      const type = this.sugar(core.type, ctx);
      const left = this.sugar(core.left, ctx);
      const right = this.sugar(core.right, ctx);
      return `(= ${type} ${left} ${right})`;
    }

    // List type
    if (core instanceof C.List) {
      const elemType = this.sugar(core.elemType, ctx);
      return `(List ${elemType})`;
    }

    // Vec type
    if (core instanceof C.Vec) {
      const type = this.sugar(core.type, ctx);
      const length = this.sugar(core.length, ctx);
      return `(Vec ${type} ${length})`;
    }

    // Lambda
    if (core instanceof C.Lambda) {
      const body = this.sugar(core.body, ctx);
      return `(λ (${core.param}) ${body})`;
    }

    // Application
    if (core instanceof C.Application) {
      const fun = this.sugar(core.fun, ctx);
      const arg = this.sugar(core.arg, ctx);
      return `(${fun} ${arg})`;
    }

    // The (type annotation)
    if (core instanceof C.The) {
      const type = this.sugar(core.type, ctx);
      const expr = this.sugar(core.expr, ctx);
      return `(the ${type} ${expr})`;
    }

    // Cons
    if (core instanceof C.Cons) {
      const first = this.sugar(core.first, ctx);
      const second = this.sugar(core.second, ctx);
      return `(cons ${first} ${second})`;
    }

    // Add1
    if (core instanceof C.Add1) {
      const n = this.sugar(core.n, ctx);
      return `(add1 ${n})`;
    }

    // IterNat
    if (core instanceof C.IterNat) {
      const target = this.sugar(core.target, ctx);
      const base = this.sugar(core.base, ctx);
      const step = this.sugar(core.step, ctx);
      return `(iter-Nat ${target} ${base} ${step})`;
    }

    // Left/Right for Either
    if (core instanceof C.Left) {
      const value = this.sugar(core.value, ctx);
      return `(left ${value})`;
    }

    if (core instanceof C.Right) {
      const value = this.sugar(core.value, ctx);
      return `(right ${value})`;
    }

    // Same (reflexivity proof)
    if (core instanceof C.Same) {
      const type = this.sugar(core.type, ctx);
      return `(same ${type})`;
    }

    // For simple types with no sub-expressions, use prettyPrint
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
    const result = this.matchTemplateInternal(template, target, patternVar, new Map());
    if (result.status === 'capture') {
      return result.value;
    } else if (result.status === 'match') {
      // Matched but didn't find patternVar - this shouldn't happen for valid templates
      // Return null to indicate no match found
      return null;
    } else {
      // Failed to match
      return null;
    }
  }

  /**
   * Internal matching with variable renaming support.
   * @param template Template Core expression
   * @param target Target Core expression
   * @param patternVar The pattern variable to extract
   * @param boundVars Map from template bound vars to target bound vars
   * @returns MatchResult indicating success with capture, success without capture, or failure
   */
  private matchTemplateInternal(
    template: C.Core,
    target: C.Core,
    patternVar: string,
    boundVars: Map<string, string>
  ): MatchResult {
    // Pattern variable match
    if (template instanceof C.VarName) {
      if (template.name === patternVar) {
        // Found the pattern variable - capture the target
        return capture(target);
      }
      // Check if this is a bound variable that should match
      const expectedTarget = boundVars.get(template.name);
      if (expectedTarget !== undefined) {
        // This is a bound variable - target should also be a VarName with the corresponding name
        if (target instanceof C.VarName && target.name === expectedTarget) {
          return MATCH; // Match succeeds but doesn't capture anything
        }
        return FAIL; // No match - bound variable mismatch
      }
      // Free variable - should match exactly
      if (target instanceof C.VarName && target.name === template.name) {
        return MATCH; // Match succeeds
      }
      return FAIL; // No match - free variable mismatch
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
      if (carTypeMatch.status === 'fail') return FAIL;

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
      if (bodyMatch.status === 'fail') return FAIL;

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
      if (argTypeMatch.status === 'fail') return FAIL;

      const newBoundVars = new Map(boundVars);
      newBoundVars.set(template.name, target.name);

      const bodyMatch = this.matchTemplateInternal(
        template.body,
        target.body,
        patternVar,
        newBoundVars
      );
      if (bodyMatch.status === 'fail') return FAIL;

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
      if (typeMatch.status === 'fail') return FAIL;

      const leftMatch = this.matchTemplateInternal(
        template.left,
        target.left,
        patternVar,
        boundVars
      );
      if (leftMatch.status === 'fail') return FAIL;

      const rightMatch = this.matchTemplateInternal(
        template.right,
        target.right,
        patternVar,
        boundVars
      );
      if (rightMatch.status === 'fail') return FAIL;

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
      if (funMatch.status === 'fail') return FAIL;

      const argMatch = this.matchTemplateInternal(
        template.arg,
        target.arg,
        patternVar,
        boundVars
      );
      if (argMatch.status === 'fail') return FAIL;

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
      if (typeMatch.status === 'fail') return FAIL;

      const exprMatch = this.matchTemplateInternal(
        template.expr,
        target.expr,
        patternVar,
        boundVars
      );
      if (exprMatch.status === 'fail') return FAIL;

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
      if (targetMatch.status === 'fail') return FAIL;

      const baseMatch = this.matchTemplateInternal(
        template.base,
        target.base,
        patternVar,
        boundVars
      );
      if (baseMatch.status === 'fail') return FAIL;

      const stepMatch = this.matchTemplateInternal(
        template.step,
        target.step,
        patternVar,
        boundVars
      );
      if (stepMatch.status === 'fail') return FAIL;

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
      if (firstMatch.status === 'fail') return FAIL;

      const secondMatch = this.matchTemplateInternal(
        template.second,
        target.second,
        patternVar,
        boundVars
      );
      if (secondMatch.status === 'fail') return FAIL;

      return this.combineMatches(firstMatch, secondMatch);
    }

    // Same matching
    if (template instanceof C.Same && target instanceof C.Same) {
      return this.matchTemplateInternal(template.type, target.type, patternVar, boundVars);
    }

    // Base type matching (no children to recurse into)
    if (template instanceof C.Nat && target instanceof C.Nat) {
      return MATCH; // Match succeeds
    }
    if (template instanceof C.Zero && target instanceof C.Zero) {
      return MATCH;
    }
    if (template instanceof C.Universe && target instanceof C.Universe) {
      return MATCH;
    }
    if (template instanceof C.Atom && target instanceof C.Atom) {
      return MATCH;
    }
    if (template instanceof C.Trivial && target instanceof C.Trivial) {
      return MATCH;
    }
    if (template instanceof C.Sole && target instanceof C.Sole) {
      return MATCH;
    }
    if (template instanceof C.Absurd && target instanceof C.Absurd) {
      return MATCH;
    }
    if (template instanceof C.Nil && target instanceof C.Nil) {
      return MATCH;
    }
    if (template instanceof C.VecNil && target instanceof C.VecNil) {
      return MATCH;
    }

    // Quote matching
    if (template instanceof C.Quote && target instanceof C.Quote) {
      if (template.sym === target.sym) {
        return MATCH; // Match succeeds
      }
      return FAIL; // Different symbols
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
      if (typeMatch.status === 'fail') return FAIL;

      const lengthMatch = this.matchTemplateInternal(
        template.length,
        target.length,
        patternVar,
        boundVars
      );
      if (lengthMatch.status === 'fail') return FAIL;

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
      if (leftMatch.status === 'fail') return FAIL;

      const rightMatch = this.matchTemplateInternal(
        template.right,
        target.right,
        patternVar,
        boundVars
      );
      if (rightMatch.status === 'fail') return FAIL;

      return this.combineMatches(leftMatch, rightMatch);
    }

    // No match - types are different
    return FAIL;
  }

  /**
   * Combine two match results.
   * If either failed, return fail.
   * If both captured, they must match (same prettyPrint).
   * Otherwise return the capture or match.
   */
  private combineMatches(a: MatchResult, b: MatchResult): MatchResult {
    // If either failed, the whole match fails
    if (a.status === 'fail' || b.status === 'fail') {
      return FAIL;
    }

    // If both captured, they must be consistent
    if (a.status === 'capture' && b.status === 'capture') {
      if (a.value.prettyPrint() === b.value.prettyPrint()) {
        return a;
      }
      // Inconsistent captures - fail
      return FAIL;
    }

    // Return whichever has a capture, or match if neither
    if (a.status === 'capture') return a;
    if (b.status === 'capture') return b;
    return MATCH;
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
