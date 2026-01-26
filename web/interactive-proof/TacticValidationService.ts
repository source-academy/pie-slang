/**
 * Client-side tactic validation service.
 * Provides instant feedback on whether tactics can be applied to goals.
 */

import {
  TacticType,
  TacticBlockData,
  TacticValidationResult,
  ParsedType,
  SerializableGoal,
  TACTIC_METADATA
} from './types';
import { parseType, typeMatches, describeKind } from './utils/typeParser';

export class TacticValidationService {
  /**
   * Validate whether a tactic can be applied to a goal.
   * This is a client-side heuristic check; full validation happens in the worker.
   */
  validateTactic(tactic: TacticBlockData, goal: SerializableGoal): TacticValidationResult {
    // Don't allow tactics on completed goals
    if (goal.isComplete) {
      return {
        valid: false,
        reason: 'Goal is already complete'
      };
    }

    const parsed = parseType(goal.type);
    const metadata = TACTIC_METADATA[tactic.type];

    switch (tactic.type) {
      case 'intro':
        return this.validateIntro(tactic, goal, parsed);
      case 'exact':
        return this.validateExact(tactic, goal, parsed);
      case 'exists':
        return this.validateExists(tactic, goal, parsed);
      case 'left':
      case 'right':
        return this.validateLeftRight(tactic, goal, parsed);
      case 'split':
        return this.validateSplit(tactic, goal, parsed);
      case 'elimNat':
        return this.validateElimNat(tactic, goal);
      case 'elimList':
        return this.validateElimList(tactic, goal);
      case 'elimVec':
        return this.validateElimVec(tactic, goal);
      case 'elimEqual':
        return this.validateElimEqual(tactic, goal);
      case 'elimEither':
        return this.validateElimEither(tactic, goal);
      case 'elimAbsurd':
        return this.validateElimAbsurd(tactic, goal);
      default:
        return { valid: true };
    }
  }

  /**
   * Get suggested tactics for a goal based on its type.
   */
  getSuggestedTactics(goal: SerializableGoal): TacticType[] {
    if (goal.isComplete) return [];

    const parsed = parseType(goal.type);
    const suggestions: TacticType[] = [];

    // Always suggest exact as a fallback
    suggestions.push('exact');

    // Type-specific suggestions
    switch (parsed.kind) {
      case 'Pi':
      case 'Arrow':
        suggestions.unshift('intro');
        break;
      case 'Sigma':
      case 'Pair':
        suggestions.unshift('split', 'exists');
        break;
      case 'Either':
        suggestions.unshift('left', 'right');
        break;
    }

    // Check context for elimination targets
    for (const entry of goal.contextEntries) {
      const entryType = parseType(entry.type);
      switch (entryType.kind) {
        case 'Nat':
          if (!suggestions.includes('elimNat')) {
            suggestions.push('elimNat');
          }
          break;
        case 'List':
          if (!suggestions.includes('elimList')) {
            suggestions.push('elimList');
          }
          break;
        case 'Vec':
          if (!suggestions.includes('elimVec')) {
            suggestions.push('elimVec');
          }
          break;
        case 'Equal':
          if (!suggestions.includes('elimEqual')) {
            suggestions.push('elimEqual');
          }
          break;
        case 'Either':
          if (!suggestions.includes('elimEither')) {
            suggestions.push('elimEither');
          }
          break;
        case 'Absurd':
          if (!suggestions.includes('elimAbsurd')) {
            suggestions.push('elimAbsurd');
          }
          break;
      }
    }

    return suggestions;
  }

  /**
   * Check if any tactic can potentially be applied to a goal.
   */
  canApplyAnyTactic(goal: SerializableGoal): boolean {
    return !goal.isComplete;
  }

  // === Private validation methods ===

  private validateIntro(
    tactic: TacticBlockData,
    goal: SerializableGoal,
    parsed: ParsedType
  ): TacticValidationResult {
    // intro works on Pi and Arrow types
    if (parsed.kind !== 'Pi' && parsed.kind !== 'Arrow') {
      return {
        valid: false,
        reason: `intro requires a function type (Π or →), but goal is ${describeKind(parsed.kind)}`,
        suggestions: this.getSuggestedTactics(goal)
      };
    }

    // Check that name is provided
    if (!tactic.name || tactic.name.trim() === '') {
      return {
        valid: false,
        reason: 'intro requires a variable name'
      };
    }

    // Check for name conflicts
    const nameExists = goal.contextEntries.some(e => e.name === tactic.name);
    if (nameExists) {
      return {
        valid: false,
        reason: `Variable name '${tactic.name}' already exists in context`
      };
    }

    return { valid: true };
  }

  private validateExact(
    tactic: TacticBlockData,
    goal: SerializableGoal,
    parsed: ParsedType
  ): TacticValidationResult {
    // exact always requires an expression
    if (!tactic.expression || tactic.expression.trim() === '') {
      return {
        valid: false,
        reason: 'exact requires a proof term'
      };
    }

    // Can't validate the expression type client-side, so accept
    return { valid: true };
  }

  private validateExists(
    tactic: TacticBlockData,
    goal: SerializableGoal,
    parsed: ParsedType
  ): TacticValidationResult {
    // exists works on Sigma and Pair types
    if (parsed.kind !== 'Sigma' && parsed.kind !== 'Pair') {
      return {
        valid: false,
        reason: `exists requires a pair/sigma type, but goal is ${describeKind(parsed.kind)}`,
        suggestions: this.getSuggestedTactics(goal)
      };
    }

    if (!tactic.expression || tactic.expression.trim() === '') {
      return {
        valid: false,
        reason: 'exists requires a witness expression'
      };
    }

    return { valid: true };
  }

  private validateLeftRight(
    tactic: TacticBlockData,
    goal: SerializableGoal,
    parsed: ParsedType
  ): TacticValidationResult {
    // left/right work on Either types
    if (parsed.kind !== 'Either') {
      return {
        valid: false,
        reason: `${tactic.type} requires an Either type, but goal is ${describeKind(parsed.kind)}`,
        suggestions: this.getSuggestedTactics(goal)
      };
    }

    return { valid: true };
  }

  private validateSplit(
    tactic: TacticBlockData,
    goal: SerializableGoal,
    parsed: ParsedType
  ): TacticValidationResult {
    // split works on Pair and Sigma types
    if (parsed.kind !== 'Pair' && parsed.kind !== 'Sigma') {
      return {
        valid: false,
        reason: `split requires a pair/sigma type, but goal is ${describeKind(parsed.kind)}`,
        suggestions: this.getSuggestedTactics(goal)
      };
    }

    return { valid: true };
  }

  private validateElimNat(
    tactic: TacticBlockData,
    goal: SerializableGoal
  ): TacticValidationResult {
    if (!tactic.name) {
      return {
        valid: false,
        reason: 'elimNat requires a target variable name'
      };
    }

    // Check if target exists in context with Nat type
    const target = goal.contextEntries.find(e => e.name === tactic.name);
    if (!target) {
      return {
        valid: false,
        reason: `Variable '${tactic.name}' not found in context`
      };
    }

    const targetType = parseType(target.type);
    if (targetType.kind !== 'Nat') {
      return {
        valid: false,
        reason: `'${tactic.name}' has type ${target.type}, not Nat`
      };
    }

    return { valid: true };
  }

  private validateElimList(
    tactic: TacticBlockData,
    goal: SerializableGoal
  ): TacticValidationResult {
    if (!tactic.name) {
      return {
        valid: false,
        reason: 'elimList requires a target variable name'
      };
    }

    const target = goal.contextEntries.find(e => e.name === tactic.name);
    if (!target) {
      return {
        valid: false,
        reason: `Variable '${tactic.name}' not found in context`
      };
    }

    const targetType = parseType(target.type);
    if (targetType.kind !== 'List') {
      return {
        valid: false,
        reason: `'${tactic.name}' has type ${target.type}, not List`
      };
    }

    return { valid: true };
  }

  private validateElimVec(
    tactic: TacticBlockData,
    goal: SerializableGoal
  ): TacticValidationResult {
    if (!tactic.name) {
      return {
        valid: false,
        reason: 'elimVec requires a target variable name'
      };
    }

    const target = goal.contextEntries.find(e => e.name === tactic.name);
    if (!target) {
      return {
        valid: false,
        reason: `Variable '${tactic.name}' not found in context`
      };
    }

    const targetType = parseType(target.type);
    if (targetType.kind !== 'Vec') {
      return {
        valid: false,
        reason: `'${tactic.name}' has type ${target.type}, not Vec`
      };
    }

    return { valid: true };
  }

  private validateElimEqual(
    tactic: TacticBlockData,
    goal: SerializableGoal
  ): TacticValidationResult {
    if (!tactic.name) {
      return {
        valid: false,
        reason: 'elimEqual requires a target variable name'
      };
    }

    const target = goal.contextEntries.find(e => e.name === tactic.name);
    if (!target) {
      return {
        valid: false,
        reason: `Variable '${tactic.name}' not found in context`
      };
    }

    const targetType = parseType(target.type);
    if (targetType.kind !== 'Equal') {
      return {
        valid: false,
        reason: `'${tactic.name}' has type ${target.type}, not an equality type`
      };
    }

    return { valid: true };
  }

  private validateElimEither(
    tactic: TacticBlockData,
    goal: SerializableGoal
  ): TacticValidationResult {
    if (!tactic.name) {
      return {
        valid: false,
        reason: 'elimEither requires a target variable name'
      };
    }

    const target = goal.contextEntries.find(e => e.name === tactic.name);
    if (!target) {
      return {
        valid: false,
        reason: `Variable '${tactic.name}' not found in context`
      };
    }

    const targetType = parseType(target.type);
    if (targetType.kind !== 'Either') {
      return {
        valid: false,
        reason: `'${tactic.name}' has type ${target.type}, not Either`
      };
    }

    return { valid: true };
  }

  private validateElimAbsurd(
    tactic: TacticBlockData,
    goal: SerializableGoal
  ): TacticValidationResult {
    if (!tactic.name) {
      return {
        valid: false,
        reason: 'elimAbsurd requires a target variable name'
      };
    }

    const target = goal.contextEntries.find(e => e.name === tactic.name);
    if (!target) {
      return {
        valid: false,
        reason: `Variable '${tactic.name}' not found in context`
      };
    }

    const targetType = parseType(target.type);
    if (targetType.kind !== 'Absurd') {
      return {
        valid: false,
        reason: `'${tactic.name}' has type ${target.type}, not Absurd`
      };
    }

    return { valid: true };
  }
}
