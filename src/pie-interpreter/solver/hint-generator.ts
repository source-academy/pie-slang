// Educational hint generator - refactored from todo-solver.ts
// Provides educational hints instead of direct solutions
// Supports progressive hint levels: category → tactic → full

import { GoogleGenAI } from "@google/genai";
import { SerializableContext } from "../utils/context";
import type { TacticCategory } from "./hint-types";

const MISSING_API_KEY_ERROR = new Error(
  'GOOGLE_API_KEY is not set. ' +
  'Please provide an API key to use the hint system.'
);

/**
 * Progressive hint levels for educational scaffolding
 */
export type HintLevel = 'category' | 'tactic' | 'full';

/**
 * Structured hint response for progressive hints
 */
export interface ProgressiveHint {
  level: HintLevel;
  category?: TacticCategory;
  tacticType?: string;
  parameters?: Record<string, string>;
  explanation: string;
  confidence: number; // 0-1, how confident the hint generator is
}

/**
 * Request for generating a hint
 */
export interface HintRequest {
  type: 'todo' | 'tactic';
  expectedType?: string;
  goalInfo?: string;
  context: SerializableContext | string[];
  availableDefinitions: string[];
  hypotheses?: string[];
}

/**
 * Request for progressive hints (used by the visual prover)
 */
export interface ProgressiveHintRequest {
  goalType: string;
  context: Array<{ name: string; type: string }>;
  availableTactics: string[];
  currentLevel: HintLevel;
  previousHint?: ProgressiveHint;
}

/**
 * Generate an educational hint for a TODO expression
 */
export async function generateTodoHint(
  apiKey: string,
  expectedType: string,
  context: string[],
  availableDefinitions: string[]
): Promise<string> {
  if (!apiKey) {
    throw MISSING_API_KEY_ERROR;
  }

  const genAI = new GoogleGenAI({ apiKey });

  const contextSummary = context.length > 0
    ? context.join('\n')
    : 'No context available';

  const definitionsList = availableDefinitions.length > 0
    ? availableDefinitions.join('\n')
    : 'No definitions available yet';

  const prompt = `You are a Socratic tutor for Pie, a dependently-typed programming language from "The Little Typer" book.

A student has a TODO expression that needs to have type: ${expectedType}

Available definitions in scope:
${definitionsList}

Context (hypotheses):
${contextSummary}

Provide a HINT (not a solution) to help the student think about what to use.

Guidelines:
- Do NOT write the solution directly
- Suggest what KIND of value they need (constructor, function application, eliminator, etc.)
- Mention relevant definitions they could use, but don't say exactly how
- Ask guiding questions when appropriate
- Keep it to 1-2 sentences

Example hints:
- "Think about what constructor makes a value of type Nat. What are the two constructors?"
- "You have a function 'double' in scope that might be relevant here. How could it help?"
- "Consider what eliminator you could use for a List to build this value."
- "Since this is a Pi type, you'll need a lambda. What should the body be?"

Your hint (1-2 sentences):`;

  try {
    const result = await genAI.models.generateContent({
      model: "gemini-2.5-flash",
      contents: prompt
    });

    if (!result.text) {
      throw new Error('No response from Gemini API');
    }

    return result.text.trim();
  } catch (error: any) {
    throw new Error(`Failed to generate hint: ${error.message}`);
  }
}

/**
 * Generate an educational hint for a tactical proof goal
 */
export async function generateTacticHint(
  apiKey: string,
  goalType: string,
  hypotheses: string[],
  availableDefinitions: string[]
): Promise<string> {
  if (!apiKey) {
    throw MISSING_API_KEY_ERROR;
  }

  const genAI = new GoogleGenAI({ apiKey });

  const hypothesesList = hypotheses.length > 0
    ? hypotheses.join('\n')
    : 'No hypotheses available';

  const definitionsList = availableDefinitions.length > 0
    ? availableDefinitions.join('\n')
    : 'No definitions available';

  const prompt = `You are a proof assistant tutor for Pie tactical proofs.

Current Goal:
${goalType}

Available Hypotheses:
${hypothesesList}

Definitions in Scope:
${definitionsList}

The student is stuck on this proof goal. Provide a HINT about what tactic might help.

Guidelines:
- Suggest tactic categories (intro, elim, exact, exists) not exact syntax
- If elimination is relevant, mention WHAT to eliminate, not the full tactic
- Reference the goal structure to guide thinking
- Use blurred language: "Consider your hypothesis about..." not "Use elim-Nat n"
- Keep it to 1-2 sentences

Example hints:
- "Since your goal is a Pi type, you probably need to introduce a variable first."
- "Look at your hypothesis 'n : Nat'. What eliminator works with natural numbers?"
- "Your goal is a Sigma type - think about what two values you need to provide."
- "You have a hypothesis that looks like what you're trying to prove. Maybe you can use it directly?"
- "Consider eliminating one of your hypotheses to reveal more structure."

Your hint (1-2 sentences):`;

  try {
    const result = await genAI.models.generateContent({
      model: "gemini-2.5-flash",
      contents: prompt
    });

    if (!result.text) {
      throw new Error('No response from Gemini API');
    }

    return result.text.trim();
  } catch (error: any) {
    throw new Error(`Failed to generate hint: ${error.message}`);
  }
}

/**
 * General hint generation function that routes based on request type
 */
export async function generateHint(apiKey: string, request: HintRequest): Promise<string> {
  if (request.type === 'todo') {
    if (!request.expectedType) {
      throw new Error('TODO hint requires expectedType');
    }
    const context = Array.isArray(request.context)
      ? request.context
      : formatSerializableContext(request.context);

    return generateTodoHint(
      apiKey,
      request.expectedType,
      context,
      request.availableDefinitions
    );
  } else if (request.type === 'tactic') {
    if (!request.goalInfo) {
      throw new Error('Tactic hint requires goalInfo');
    }
    return generateTacticHint(
      apiKey,
      request.goalInfo,
      request.hypotheses || [],
      request.availableDefinitions
    );
  } else {
    throw new Error(`Unknown hint type: ${request.type}`);
  }
}

/**
 * Format SerializableContext for display in prompts
 */
function formatSerializableContext(ctx: SerializableContext): string[] {
  const formatted: string[] = [];

  for (const [name, entry] of ctx.entries()) {
    if (name.startsWith('_')) continue; // Skip internal variables

    if (Array.isArray(entry)) {
      const [tag, ...rest] = entry;
      if (tag === 'free' && rest.length > 0) {
        // Free variable with type
        formatted.push(`${name} : ${rest[0]}`);
      } else if (tag === 'def' && rest.length >= 2) {
        // Defined variable with type and value
        formatted.push(`${name} : ${rest[0]} = ${rest[1]}`);
      } else if (tag === 'claim' && rest.length > 0) {
        // Claimed variable with type
        formatted.push(`${name} : ${rest[0]}`);
      }
    }
  }

  return formatted;
}

// ============================================
// Progressive Hint Generation (for Visual Prover)
// ============================================

import {
  CATEGORY_DESCRIPTIONS,
} from "./hint-types";

/**
 * Generate a progressive hint based on the current level.
 * Level 1 (category): Suggests which category of tactic to use
 * Level 2 (tactic): Suggests a specific tactic
 * Level 3 (full): Suggests tactic with parameters
 */
export async function generateProgressiveHint(
  apiKey: string,
  request: ProgressiveHintRequest
): Promise<ProgressiveHint> {
  if (!apiKey) {
    throw MISSING_API_KEY_ERROR;
  }

  const genAI = new GoogleGenAI({ apiKey });

  const contextSummary = request.context.length > 0
    ? request.context.map(c => `${c.name} : ${c.type}`).join('\n')
    : 'No context variables';

  const tacticsAvailable = request.availableTactics.join(', ');

  // Build prompt based on current level
  let prompt: string;
  let responseFormat: string;

  switch (request.currentLevel) {
    case 'category':
      prompt = buildCategoryPrompt(request.goalType, contextSummary, tacticsAvailable);
      responseFormat = 'category';
      break;
    case 'tactic':
      prompt = buildTacticPrompt(
        request.goalType,
        contextSummary,
        tacticsAvailable,
        request.previousHint?.category
      );
      responseFormat = 'tactic';
      break;
    case 'full':
      prompt = buildFullPrompt(
        request.goalType,
        contextSummary,
        request.context,
        request.previousHint?.tacticType
      );
      responseFormat = 'full';
      break;
  }

  try {
    const result = await genAI.models.generateContent({
      model: "gemini-2.5-flash",
      contents: prompt
    });

    if (!result.text) {
      throw new Error('No response from Gemini API');
    }

    return parseProgressiveHintResponse(result.text, request.currentLevel, responseFormat);
  } catch (error: any) {
    // Fallback to rule-based hints if API fails
    return generateRuleBasedHint(request);
  }
}

/**
 * Build prompt for category-level hint
 */
function buildCategoryPrompt(goalType: string, context: string, tactics: string): string {
  return `You are a proof assistant for Pie, a dependently-typed language.

Goal type: ${goalType}
Context: ${context}
Available tactics: ${tactics}

Choose ONE category that would help prove this goal:
- introduction: For Pi types or when you have a direct value
- elimination: For using values from context (Nat, List, Either, etc.)
- constructor: For Pair/Sigma types or Either (left/right)
- application: For applying functions/lemmas

Respond with JSON only:
{"category": "<category>", "explanation": "<1 sentence why>", "confidence": <0.0-1.0>}`;
}

/**
 * Build prompt for tactic-level hint
 */
function buildTacticPrompt(
  goalType: string,
  context: string,
  tactics: string,
  category?: TacticCategory
): string {
  const categoryFilter = category
    ? `Focus on ${category} tactics.`
    : '';

  return `You are a proof assistant for Pie.

Goal type: ${goalType}
Context: ${context}
Available tactics: ${tactics}
${categoryFilter}

Choose ONE specific tactic that would help.
Respond with JSON only:
{"tacticType": "<tactic>", "explanation": "<1 sentence why>", "confidence": <0.0-1.0>}`;
}

/**
 * Build prompt for full hint with parameters
 */
function buildFullPrompt(
  goalType: string,
  context: string,
  _contextVars: Array<{ name: string; type: string }>,
  tacticType?: string
): string {
  const tacticFocus = tacticType
    ? `The suggested tactic is: ${tacticType}`
    : '';

  return `You are a proof assistant for Pie.

Goal type: ${goalType}
Context: ${context}
${tacticFocus}

Provide the complete tactic application with parameters.
For intro: specify the variable name to introduce
For elimNat/elimList/etc: specify which context variable to eliminate
For exact: specify the expression

Respond with JSON only:
{"tacticType": "<tactic>", "parameters": {"variableName": "<name>"} or {"expression": "<expr>"}, "explanation": "<how to apply>", "confidence": <0.0-1.0>}`;
}

/**
 * Parse the AI response into a ProgressiveHint
 */
function parseProgressiveHintResponse(
  response: string,
  level: HintLevel,
  _format: string
): ProgressiveHint {
  try {
    // Extract JSON from response (might have markdown code blocks)
    const jsonMatch = response.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error('No JSON found in response');
    }

    const parsed = JSON.parse(jsonMatch[0]);

    return {
      level,
      category: parsed.category as TacticCategory,
      tacticType: parsed.tacticType,
      parameters: parsed.parameters,
      explanation: parsed.explanation || 'Consider this approach.',
      confidence: typeof parsed.confidence === 'number' ? parsed.confidence : 0.7,
    };
  } catch {
    // Return a generic hint if parsing fails
    return {
      level,
      explanation: response.slice(0, 200),
      confidence: 0.5,
    };
  }
}

/**
 * Generate a rule-based hint when AI is unavailable
 * Uses simple pattern matching on goal types
 */
export function generateRuleBasedHint(request: ProgressiveHintRequest): ProgressiveHint {
  const { goalType, context, currentLevel, previousHint } = request;

  // Analyze goal type structure
  const isPiType = goalType.startsWith('(Π') || goalType.startsWith('(Pi') || goalType.includes('→');
  const isSigmaType = goalType.startsWith('(Σ') || goalType.startsWith('(Sigma');
  const isPairType = goalType.startsWith('(Pair');
  const isEitherType = goalType.startsWith('(Either');
  // Note: isNatType and isEqualType are available for future use
  const _isNatType = goalType === 'Nat' || goalType.includes('Nat');
  const _isEqualType = goalType.startsWith('(=') || goalType.startsWith('(Equal');

  // Check context for useful variables
  const hasNatInContext = context.some(c => c.type === 'Nat' || c.type.includes('Nat'));
  const hasListInContext = context.some(c => c.type.startsWith('(List'));
  const hasEitherInContext = context.some(c => c.type.startsWith('(Either'));
  const hasAbsurdInContext = context.some(c => c.type === 'Absurd');

  // Find matching context variable for exact
  const matchingContextVar = context.find(c => c.type === goalType);

  switch (currentLevel) {
    case 'category': {
      let category: TacticCategory;
      let explanation: string;
      let confidence = 0.8;

      if (isPiType) {
        category = 'introduction';
        explanation = CATEGORY_DESCRIPTIONS.introduction;
      } else if (isPairType || isSigmaType) {
        category = 'constructor';
        explanation = 'Your goal is a pair/sigma type. You need to provide both components.';
      } else if (isEitherType) {
        category = 'constructor';
        explanation = 'Your goal is an Either type. Choose left or right.';
      } else if (hasAbsurdInContext) {
        category = 'elimination';
        explanation = 'You have Absurd in context - you can prove anything!';
        confidence = 0.95;
      } else if (matchingContextVar) {
        category = 'introduction';
        explanation = `You have "${matchingContextVar.name}" in context with the exact type you need.`;
        confidence = 0.9;
      } else if (hasNatInContext || hasListInContext || hasEitherInContext) {
        category = 'elimination';
        explanation = CATEGORY_DESCRIPTIONS.elimination;
      } else {
        category = 'introduction';
        explanation = 'Try introducing a value or using exact.';
        confidence = 0.6;
      }

      return { level: 'category', category, explanation, confidence };
    }

    case 'tactic': {
      const category = previousHint?.category;
      let tacticType: string;
      let explanation: string;
      let confidence = 0.75;

      if (category === 'introduction' || !category) {
        if (isPiType) {
          tacticType = 'intro';
          explanation = 'Use intro to introduce the function parameter into context.';
        } else if (matchingContextVar) {
          tacticType = 'exact';
          explanation = `Use exact with "${matchingContextVar.name}" from your context.`;
          confidence = 0.9;
        } else {
          tacticType = 'exact';
          explanation = 'Provide the exact term that has this type.';
          confidence = 0.6;
        }
      } else if (category === 'elimination') {
        if (hasAbsurdInContext) {
          tacticType = 'elimAbsurd';
          explanation = 'Eliminate Absurd to prove your goal.';
          confidence = 0.95;
        } else if (hasNatInContext) {
          tacticType = 'elimNat';
          explanation = 'Use induction on a Nat variable.';
        } else if (hasListInContext) {
          tacticType = 'elimList';
          explanation = 'Use induction on a List variable.';
        } else if (hasEitherInContext) {
          tacticType = 'elimEither';
          explanation = 'Case split on an Either variable.';
        } else {
          tacticType = 'elimNat';
          explanation = 'Consider elimination on a context variable.';
          confidence = 0.5;
        }
      } else if (category === 'constructor') {
        if (isPairType || isSigmaType) {
          tacticType = 'split';
          explanation = 'Split the pair goal into two subgoals.';
        } else if (isEitherType) {
          tacticType = 'left';
          explanation = 'Choose left or right for the Either type.';
          confidence = 0.5; // Could be either
        } else {
          tacticType = 'split';
          explanation = 'Use a constructor tactic.';
          confidence = 0.5;
        }
      } else {
        tacticType = 'apply';
        explanation = 'Apply a function from context.';
        confidence = 0.5;
      }

      return {
        level: 'tactic',
        category,
        tacticType,
        explanation,
        confidence,
      };
    }

    case 'full': {
      const tacticType = previousHint?.tacticType || 'intro';
      let parameters: Record<string, string> = {};
      let explanation: string;
      let confidence = 0.7;

      switch (tacticType) {
        case 'intro': {
          // Try to extract variable name from Pi type
          const piMatch = goalType.match(/\(Π\s*\(\[([^\]]+)\s+/);
          const varName = piMatch ? piMatch[1] : 'x';
          parameters = { variableName: varName };
          explanation = `Introduce "${varName}" into the context.`;
          break;
        }
        case 'exact': {
          if (matchingContextVar) {
            parameters = { expression: matchingContextVar.name };
            explanation = `Use ${matchingContextVar.name} directly.`;
            confidence = 0.9;
          } else {
            parameters = { expression: '' };
            explanation = 'Provide the expression that has this type.';
            confidence = 0.4;
          }
          break;
        }
        case 'elimNat': {
          const natVar = context.find(c => c.type === 'Nat');
          if (natVar) {
            parameters = { variableName: natVar.name };
            explanation = `Perform induction on ${natVar.name}.`;
            confidence = 0.85;
          } else {
            parameters = { variableName: 'n' };
            explanation = 'Choose which Nat to eliminate.';
            confidence = 0.4;
          }
          break;
        }
        case 'elimList': {
          const listVar = context.find(c => c.type.startsWith('(List'));
          if (listVar) {
            parameters = { variableName: listVar.name };
            explanation = `Perform induction on ${listVar.name}.`;
            confidence = 0.85;
          } else {
            parameters = { variableName: 'xs' };
            explanation = 'Choose which List to eliminate.';
            confidence = 0.4;
          }
          break;
        }
        case 'elimEither': {
          const eitherVar = context.find(c => c.type.startsWith('(Either'));
          if (eitherVar) {
            parameters = { variableName: eitherVar.name };
            explanation = `Case split on ${eitherVar.name}.`;
            confidence = 0.85;
          } else {
            parameters = { variableName: 'e' };
            explanation = 'Choose which Either to eliminate.';
            confidence = 0.4;
          }
          break;
        }
        case 'elimAbsurd': {
          const absurdVar = context.find(c => c.type === 'Absurd');
          if (absurdVar) {
            parameters = { variableName: absurdVar.name };
            explanation = `Eliminate ${absurdVar.name} to prove anything.`;
            confidence = 0.95;
          } else {
            parameters = { variableName: 'abs' };
            explanation = 'Eliminate Absurd.';
            confidence = 0.4;
          }
          break;
        }
        case 'split':
          parameters = {};
          explanation = 'Split into two subgoals.';
          break;
        case 'left':
          parameters = {};
          explanation = 'Choose the left case.';
          confidence = 0.5;
          break;
        case 'right':
          parameters = {};
          explanation = 'Choose the right case.';
          confidence = 0.5;
          break;
        default:
          parameters = {};
          explanation = `Apply ${tacticType}.`;
          confidence = 0.5;
      }

      return {
        level: 'full',
        category: previousHint?.category,
        tacticType,
        parameters,
        explanation,
        confidence,
      };
    }
  }
}

/**
 * Get the next hint level
 */
export function getNextHintLevel(current: HintLevel): HintLevel {
  switch (current) {
    case 'category': return 'tactic';
    case 'tactic': return 'full';
    case 'full': return 'full'; // Already at max level
  }
}
