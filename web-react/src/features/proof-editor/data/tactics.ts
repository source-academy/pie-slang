import type { TacticParameters, TacticType } from '../store/types';

/**
 * Tactic metadata for the palette
 */
export type TacticParamKind = 'variableName' | 'expression' | 'motiveExpression' | 'lengthExpression' | 'lemma';

export interface TacticParamSpec {
  key: keyof TacticParameters;
  label: string;
  kind: TacticParamKind;
  required: boolean;
  placeholder?: string;
  rows?: number;
}

export interface TacticInfo {
  type: TacticType;
  displayName: string;
  description: string;
  category: TacticCategory;
  requiresContextVar: boolean;  // Does this tactic need a context variable input?
  requiresLemma?: boolean;      // Does this tactic need a lemma input?
  parameterless?: boolean;      // Does this tactic require any parameters?
  params?: TacticParamSpec[];
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
    params: [
      {
        key: 'variableName',
        label: 'Variable name',
        kind: 'variableName',
        required: true,
        placeholder: 'e.g., n',
      },
    ],
  },
  {
    type: 'exact',
    displayName: 'exact',
    description: 'Provide an exact term that matches the goal type',
    category: 'introduction',
    requiresContextVar: false,
    params: [
      {
        key: 'expression',
        label: 'Expression',
        kind: 'expression',
        required: true,
        placeholder: 'Enter a Pie expression...',
        rows: 3,
      },
    ],
  },
  {
    type: 'exists',
    displayName: 'exists',
    description: 'Provide a witness for a Sigma (existential) type',
    category: 'introduction',
    requiresContextVar: false,
    params: [
      {
        key: 'expression',
        label: 'Witness expression',
        kind: 'expression',
        required: true,
        placeholder: 'Enter a witness expression...',
        rows: 3,
      },
    ],
  },

  // Constructor tactics (for sum types)
  {
    type: 'split',
    displayName: 'split',
    description: 'Split a Pair goal into two subgoals',
    category: 'constructor',
    requiresContextVar: false,
    parameterless: true,
  },
  {
    type: 'left',
    displayName: 'left',
    description: 'Construct a left injection for Either type',
    category: 'constructor',
    requiresContextVar: false,
    parameterless: true,
  },
  {
    type: 'right',
    displayName: 'right',
    description: 'Construct a right injection for Either type',
    category: 'constructor',
    requiresContextVar: false,
    parameterless: true,
  },

  // Elimination tactics
  {
    type: 'elimNat',
    displayName: 'elimNat',
    description: 'Eliminate a Nat by induction (base case + step case)',
    category: 'elimination',
    requiresContextVar: true,
    params: [
      {
        key: 'variableName',
        label: 'Target variable',
        kind: 'variableName',
        required: true,
      },
    ],
  },
  {
    type: 'elimList',
    displayName: 'elimList',
    description: 'Eliminate a List by induction (nil case + cons case)',
    category: 'elimination',
    requiresContextVar: true,
    params: [
      {
        key: 'variableName',
        label: 'Target variable',
        kind: 'variableName',
        required: true,
      },
    ],
  },
  {
    type: 'elimVec',
    displayName: 'elimVec',
    description: 'Eliminate a Vec by induction',
    category: 'elimination',
    requiresContextVar: true,
    params: [
      {
        key: 'variableName',
        label: 'Target variable',
        kind: 'variableName',
        required: true,
      },
      {
        key: 'motiveExpression',
        label: 'Motive',
        kind: 'motiveExpression',
        required: true,
        placeholder: 'Enter motive expression...',
        rows: 3,
      },
      {
        key: 'lengthExpression',
        label: 'Length expression',
        kind: 'lengthExpression',
        required: true,
        placeholder: 'Enter length expression...',
      },
    ],
  },
  {
    type: 'elimEither',
    displayName: 'elimEither',
    description: 'Eliminate an Either by case analysis',
    category: 'elimination',
    requiresContextVar: true,
    params: [
      {
        key: 'variableName',
        label: 'Target variable',
        kind: 'variableName',
        required: true,
      },
    ],
  },
  {
    type: 'elimEqual',
    displayName: 'elimEqual',
    description: 'Eliminate an equality proof by substitution',
    category: 'elimination',
    requiresContextVar: true,
    params: [
      {
        key: 'variableName',
        label: 'Target variable',
        kind: 'variableName',
        required: true,
      },
      {
        key: 'motiveExpression',
        label: 'Motive',
        kind: 'motiveExpression',
        required: true,
        placeholder: 'Enter motive expression...',
        rows: 3,
      },
    ],
  },
  {
    type: 'elimAbsurd',
    displayName: 'elimAbsurd',
    description: 'Eliminate Absurd (false) to prove anything',
    category: 'elimination',
    requiresContextVar: true,
    params: [
      {
        key: 'variableName',
        label: 'Target variable',
        kind: 'variableName',
        required: true,
      },
    ],
  },

  // Application tactics
  {
    type: 'apply',
    displayName: 'apply',
    description: 'Apply a function or lemma to the goal',
    category: 'application',
    requiresContextVar: false,
    requiresLemma: true,
    params: [
      {
        key: 'expression',
        label: 'Function or lemma',
        kind: 'expression',
        required: false,
        placeholder: 'Enter a function or lemma name...',
      },
      {
        key: 'lemmaId',
        label: 'Lemma',
        kind: 'lemma',
        required: false,
      },
    ],
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

export function getTacticInfo(type: TacticType): TacticInfo | undefined {
  return TACTICS.find((t) => t.type === type);
}

export function isTacticConfigComplete(type: TacticType, params: TacticParameters): boolean {
  const info = getTacticInfo(type);
  if (!info) return false;

  if (type === 'apply') {
    const expr = typeof params.expression === 'string' ? params.expression.trim() : '';
    return Boolean(expr || params.lemmaId);
  }

  const specs = info.params ?? [];
  for (const spec of specs) {
    if (!spec.required) continue;
    const value = params[spec.key];
    if (typeof value === 'string') {
      if (!value.trim()) return false;
    } else if (value === undefined || value === null) {
      return false;
    }
  }

  return true;
}
