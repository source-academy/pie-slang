// Browser-compatible hint service with caching and rate limiting

import { GoogleGenAI } from '@google/genai';
import { getApiKey } from '../config/api-config.js';

/**
 * Cache entry for hints
 */
interface CacheEntry {
  hint: string;
  timestamp: number;
}

/**
 * Service for requesting AI hints in the browser
 */
export class HintService {
  private cache: Map<string, CacheEntry> = new Map();
  private lastRequestTime: number = 0;
  private readonly CACHE_TTL_MS: number = 5 * 60 * 1000; // 5 minutes
  private readonly RATE_LIMIT_MS: number = 5000; // 5 seconds between requests

  /**
   * Request a hint for a TODO expression
   */
  async requestTodoHint(
    expectedType: string,
    context: string[],
    availableDefinitions: string[]
  ): Promise<string> {
    console.log('[HintService] TODO hint requested:', { expectedType, context, availableDefinitions });

    // Check rate limiting
    const now = Date.now();
    const timeSinceLastRequest = now - this.lastRequestTime;
    if (timeSinceLastRequest < this.RATE_LIMIT_MS) {
      const waitTime = Math.ceil((this.RATE_LIMIT_MS - timeSinceLastRequest) / 1000);
      console.log('[HintService] Rate limited, must wait:', waitTime, 'seconds');
      throw new Error(`⏳ Please wait ${waitTime} seconds before requesting another hint.`);
    }

    // Check cache
    const cacheKey = this.makeCacheKey('todo', expectedType, context, availableDefinitions);
    const cached = this.getFromCache(cacheKey);
    if (cached) {
      console.log('[HintService] Returning cached hint');
      return cached;
    }

    // Get API key
    const apiKey = getApiKey();
    console.log('[HintService] API key present:', !!apiKey);
    if (!apiKey) {
      throw new Error('⚠️ No API key configured. Please set your Google Gemini API key in settings.');
    }

    // Generate hint
    try {
      this.lastRequestTime = now;
      console.log('[HintService] Calling Gemini API...');
      const hint = await this.generateTodoHint(apiKey, expectedType, context, availableDefinitions);
      console.log('[HintService] Gemini API returned hint:', hint);
      this.saveToCache(cacheKey, hint);
      return hint;
    } catch (error: any) {
      console.error('[HintService] Error generating hint:', error);
      throw new Error(`❌ Failed to generate hint: ${error.message}`);
    }
  }

  /**
   * Request a hint for a tactical proof goal
   */
  async requestTacticHint(
    goalType: string,
    hypotheses: string[],
    availableDefinitions: string[]
  ): Promise<string> {
    console.log('[HintService] Tactic hint requested:', { goalType, hypotheses, availableDefinitions });

    // Check rate limiting
    const now = Date.now();
    const timeSinceLastRequest = now - this.lastRequestTime;
    if (timeSinceLastRequest < this.RATE_LIMIT_MS) {
      const waitTime = Math.ceil((this.RATE_LIMIT_MS - timeSinceLastRequest) / 1000);
      console.log('[HintService] Rate limited, must wait:', waitTime, 'seconds');
      throw new Error(`⏳ Please wait ${waitTime} seconds before requesting another hint.`);
    }

    // Check cache
    const cacheKey = this.makeCacheKey('tactic', goalType, hypotheses, availableDefinitions);
    const cached = this.getFromCache(cacheKey);
    if (cached) {
      console.log('[HintService] Returning cached hint');
      return cached;
    }

    // Get API key
    const apiKey = getApiKey();
    console.log('[HintService] API key present:', !!apiKey);
    if (!apiKey) {
      throw new Error('⚠️ No API key configured. Please set your Google Gemini API key in settings.');
    }

    // Generate hint
    try {
      this.lastRequestTime = now;
      console.log('[HintService] Calling Gemini API...');
      const hint = await this.generateTacticHint(apiKey, goalType, hypotheses, availableDefinitions);
      console.log('[HintService] Gemini API returned hint:', hint);
      this.saveToCache(cacheKey, hint);
      return hint;
    } catch (error: any) {
      console.error('[HintService] Error generating hint:', error);
      throw new Error(`❌ Failed to generate hint: ${error.message}`);
    }
  }

  /**
   * Generate a hint for a TODO using Gemini API
   */
  private async generateTodoHint(
    apiKey: string,
    expectedType: string,
    context: string[],
    availableDefinitions: string[]
  ): Promise<string> {
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

    const result = await genAI.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt
    });

    if (!result.text) {
      throw new Error('No response from Gemini API');
    }

    return result.text.trim();
  }

  /**
   * Generate a hint for a tactical proof using Gemini API
   */
  private async generateTacticHint(
    apiKey: string,
    goalType: string,
    hypotheses: string[],
    availableDefinitions: string[]
  ): Promise<string> {
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

    const result = await genAI.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt
    });

    if (!result.text) {
      throw new Error('No response from Gemini API');
    }

    return result.text.trim();
  }

  /**
   * Create a cache key from request parameters
   */
  private makeCacheKey(
    type: string,
    primary: string,
    secondary: string[],
    definitions: string[]
  ): string {
    const parts = [type, primary, ...secondary, ...definitions];
    return parts.join('|');
  }

  /**
   * Get hint from cache if available and not expired
   */
  private getFromCache(key: string): string | null {
    const entry = this.cache.get(key);
    if (!entry) {
      return null;
    }

    const now = Date.now();
    if (now - entry.timestamp > this.CACHE_TTL_MS) {
      // Cache expired
      this.cache.delete(key);
      return null;
    }

    return entry.hint;
  }

  /**
   * Save hint to cache
   */
  private saveToCache(key: string, hint: string): void {
    this.cache.set(key, {
      hint,
      timestamp: Date.now()
    });
  }

  /**
   * Clear all cached hints
   */
  clearCache(): void {
    this.cache.clear();
  }
}
