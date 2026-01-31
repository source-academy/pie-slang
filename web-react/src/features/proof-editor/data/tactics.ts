import type { TacticType } from '../store/types';

/**
 * Tactic metadata for the palette
 */
export interface TacticInfo {
  type: TacticType;
  displayName: string;
  description: string;
  category: TacticCategory;
  requiresContextVar: boolean;  // Does this tactic need a context variable input?
}

export type TacticCategory = 'introduction' | 'elimination' | 'constructor' | 'application';

/**
 * Catalog of all available tactics
 */
export const TACTICS: TacticInfo[] = [
  // Introduction tactics
  {
    type: 'intro',
    displayName: 'intro',
    description: 'Introduce a variable from a Pi type into the context',
    category: 'introduction',
    requiresContextVar: false,
  },
  {
    type: 'exact',
    displayName: 'exact',
    description: 'Provide an exact term that matches the goal type',
    category: 'introduction',
    requiresContextVar: false,
  },
  {
    type: 'exists',
    displayName: 'exists',
    description: 'Provide a witness for a Sigma (existential) type',
    category: 'introduction',
    requiresContextVar: false,
  },

  // Constructor tactics (for sum types)
  {
    type: 'split',
    displayName: 'split',
    description: 'Split a Pair goal into two subgoals',
    category: 'constructor',
    requiresContextVar: false,
  },
  {
    type: 'left',
    displayName: 'left',
    description: 'Construct a left injection for Either type',
    category: 'constructor',
    requiresContextVar: false,
  },
  {
    type: 'right',
    displayName: 'right',
    description: 'Construct a right injection for Either type',
    category: 'constructor',
    requiresContextVar: false,
  },

  // Elimination tactics
  {
    type: 'elimNat',
    displayName: 'elimNat',
    description: 'Eliminate a Nat by induction (base case + step case)',
    category: 'elimination',
    requiresContextVar: true,
  },
  {
    type: 'elimList',
    displayName: 'elimList',
    description: 'Eliminate a List by induction (nil case + cons case)',
    category: 'elimination',
    requiresContextVar: true,
  },
  {
    type: 'elimVec',
    displayName: 'elimVec',
    description: 'Eliminate a Vec by induction',
    category: 'elimination',
    requiresContextVar: true,
  },
  {
    type: 'elimEither',
    displayName: 'elimEither',
    description: 'Eliminate an Either by case analysis',
    category: 'elimination',
    requiresContextVar: true,
  },
  {
    type: 'elimEqual',
    displayName: 'elimEqual',
    description: 'Eliminate an equality proof by substitution',
    category: 'elimination',
    requiresContextVar: true,
  },
  {
    type: 'elimAbsurd',
    displayName: 'elimAbsurd',
    description: 'Eliminate Absurd (false) to prove anything',
    category: 'elimination',
    requiresContextVar: true,
  },

  // Application tactics
  {
    type: 'apply',
    displayName: 'apply',
    description: 'Apply a function or lemma to the goal',
    category: 'application',
    requiresContextVar: true,
  },
];

/**
 * Get tactics grouped by category
 */
export function getTacticsByCategory(): Record<TacticCategory, TacticInfo[]> {
  return {
    introduction: TACTICS.filter((t) => t.category === 'introduction'),
    constructor: TACTICS.filter((t) => t.category === 'constructor'),
    elimination: TACTICS.filter((t) => t.category === 'elimination'),
    application: TACTICS.filter((t) => t.category === 'application'),
  };
}

/**
 * Category display names
 */
export const CATEGORY_NAMES: Record<TacticCategory, string> = {
  introduction: 'Introduction',
  constructor: 'Constructors',
  elimination: 'Elimination',
  application: 'Application',
};
