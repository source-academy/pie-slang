/**
 * Types for the progressive hint system
 */

export type TacticCategory = 'introduction' | 'elimination' | 'constructor' | 'application';

/**
 * Maps tactic types to their categories
 */
export const TACTIC_CATEGORIES: Record<string, TacticCategory> = {
  // Introduction tactics
  intro: 'introduction',
  exact: 'introduction',

  // Constructor tactics
  split: 'constructor',
  left: 'constructor',
  right: 'constructor',

  // Elimination tactics
  elimNat: 'elimination',
  elimList: 'elimination',
  elimVec: 'elimination',
  elimEither: 'elimination',
  elimEqual: 'elimination',
  elimAbsurd: 'elimination',

  // Application tactics
  apply: 'application',
};

/**
 * Human-readable category names
 */
export const CATEGORY_DISPLAY_NAMES: Record<TacticCategory, string> = {
  introduction: 'Introduction',
  elimination: 'Elimination',
  constructor: 'Constructor',
  application: 'Application',
};

/**
 * Category descriptions for hints
 */
export const CATEGORY_DESCRIPTIONS: Record<TacticCategory, string> = {
  introduction: 'You need to introduce something into the context or provide a direct value.',
  elimination: 'Consider eliminating (using) a value from your context to make progress.',
  constructor: 'You need to construct a compound value like a pair or choose a side of a sum type.',
  application: 'Try applying a function or lemma from your context.',
};
