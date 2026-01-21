/**
 * Toolbox configuration for Pie Blockly editor.
 *
 * Categories:
 * - Types (green): Nat, Atom, Pair, Sigma, Either, List, Vec, Arrow, Pi, Equal, Trivial, Absurd, U
 * - Values (blue): zero, add1, cons, same, sole, nil, vecnil, left, right, quote, variable
 * - Functions (lime): lambda, application, the, cong
 * - Definitions (orange): claim, define, define-tactically, check-same
 * - Tactics (amber): intro, exact, exists, left, right, split, elimNat, elimList, elimVec, elimEqual, elimEither, elimAbsurd
 * - Eliminators (cyan): which-Nat, iter-Nat, rec-Nat, ind-Nat, rec-List, ind-List, ind-Vec, ind-Either, ind-=, ind-Absurd
 */

import { BLOCK_COLORS } from './BlockDefinitions';

export interface ToolboxCategory {
  kind: 'category';
  name: string;
  colour: string;
  contents: ToolboxItem[];
}

export interface ToolboxBlock {
  kind: 'block';
  type: string;
}

export interface ToolboxLabel {
  kind: 'label';
  text: string;
}

export interface ToolboxSeparator {
  kind: 'sep';
  gap?: string;
}

export type ToolboxItem = ToolboxBlock | ToolboxLabel | ToolboxSeparator;

export interface ToolboxDefinition {
  kind: 'categoryToolbox';
  contents: ToolboxCategory[];
}

export const toolbox: ToolboxDefinition = {
  kind: 'categoryToolbox',
  contents: [
    // ==================== DEFINITIONS ====================
    {
      kind: 'category',
      name: 'Definitions',
      colour: BLOCK_COLORS.DEFINITIONS,
      contents: [
        { kind: 'label', text: 'Top-level declarations' },
        { kind: 'block', type: 'pie_claim' },
        { kind: 'block', type: 'pie_define' },
        { kind: 'sep', gap: '16' },
        { kind: 'label', text: 'Tactical proofs' },
        { kind: 'block', type: 'pie_define_tactically' },
        { kind: 'sep', gap: '16' },
        { kind: 'label', text: 'Assertions' },
        { kind: 'block', type: 'pie_check_same' },
      ]
    },

    // ==================== TYPES ====================
    {
      kind: 'category',
      name: 'Types',
      colour: BLOCK_COLORS.TYPES,
      contents: [
        { kind: 'label', text: 'Basic Types' },
        { kind: 'block', type: 'pie_nat' },
        { kind: 'block', type: 'pie_atom' },
        { kind: 'block', type: 'pie_trivial' },
        { kind: 'block', type: 'pie_absurd' },
        { kind: 'block', type: 'pie_u' },
        { kind: 'sep', gap: '16' },
        { kind: 'label', text: 'Collection Types' },
        { kind: 'block', type: 'pie_list_type' },
        { kind: 'block', type: 'pie_vec_type' },
        { kind: 'sep', gap: '16' },
        { kind: 'label', text: 'Product Types' },
        { kind: 'block', type: 'pie_pair_type' },
        { kind: 'block', type: 'pie_sigma_type' },
        { kind: 'sep', gap: '16' },
        { kind: 'label', text: 'Sum Types' },
        { kind: 'block', type: 'pie_either_type' },
        { kind: 'sep', gap: '16' },
        { kind: 'label', text: 'Function Types' },
        { kind: 'block', type: 'pie_arrow_type' },
        { kind: 'block', type: 'pie_pi_type' },
        { kind: 'sep', gap: '16' },
        { kind: 'label', text: 'Equality Type' },
        { kind: 'block', type: 'pie_equal_type' },
      ]
    },

    // ==================== VALUES ====================
    {
      kind: 'category',
      name: 'Values',
      colour: BLOCK_COLORS.VALUES,
      contents: [
        { kind: 'label', text: 'Natural Numbers' },
        { kind: 'block', type: 'pie_zero' },
        { kind: 'block', type: 'pie_add1' },
        { kind: 'block', type: 'pie_nat_literal' },
        { kind: 'sep', gap: '16' },
        { kind: 'label', text: 'Pairs' },
        { kind: 'block', type: 'pie_cons' },
        { kind: 'block', type: 'pie_car' },
        { kind: 'block', type: 'pie_cdr' },
        { kind: 'sep', gap: '16' },
        { kind: 'label', text: 'Lists' },
        { kind: 'block', type: 'pie_nil' },
        { kind: 'block', type: 'pie_list_cons' },
        { kind: 'sep', gap: '16' },
        { kind: 'label', text: 'Vectors' },
        { kind: 'block', type: 'pie_vecnil' },
        { kind: 'block', type: 'pie_vec_cons' },
        { kind: 'sep', gap: '16' },
        { kind: 'label', text: 'Either' },
        { kind: 'block', type: 'pie_left' },
        { kind: 'block', type: 'pie_right' },
        { kind: 'sep', gap: '16' },
        { kind: 'label', text: 'Other Values' },
        { kind: 'block', type: 'pie_sole' },
        { kind: 'block', type: 'pie_same' },
        { kind: 'block', type: 'pie_quote' },
        { kind: 'block', type: 'pie_variable' },
      ]
    },

    // ==================== FUNCTIONS ====================
    {
      kind: 'category',
      name: 'Functions',
      colour: BLOCK_COLORS.FUNCTIONS,
      contents: [
        { kind: 'label', text: 'Lambda Expressions' },
        { kind: 'block', type: 'pie_lambda' },
        { kind: 'block', type: 'pie_lambda_multi' },
        { kind: 'sep', gap: '16' },
        { kind: 'label', text: 'Application' },
        { kind: 'block', type: 'pie_application' },
        { kind: 'block', type: 'pie_application_multi' },
        { kind: 'sep', gap: '16' },
        { kind: 'label', text: 'Type Annotation' },
        { kind: 'block', type: 'pie_the' },
        { kind: 'sep', gap: '16' },
        { kind: 'label', text: 'Equality' },
        { kind: 'block', type: 'pie_cong' },
      ]
    },

    // ==================== ELIMINATORS ====================
    {
      kind: 'category',
      name: 'Eliminators',
      colour: BLOCK_COLORS.ELIMINATORS,
      contents: [
        { kind: 'label', text: 'Natural Number Eliminators' },
        { kind: 'block', type: 'pie_which_nat' },
        { kind: 'block', type: 'pie_iter_nat' },
        { kind: 'block', type: 'pie_rec_nat' },
        { kind: 'block', type: 'pie_ind_nat' },
        { kind: 'sep', gap: '16' },
        { kind: 'label', text: 'List Eliminators' },
        { kind: 'block', type: 'pie_rec_list' },
        { kind: 'block', type: 'pie_ind_list' },
        { kind: 'sep', gap: '16' },
        { kind: 'label', text: 'Vector Eliminators' },
        { kind: 'block', type: 'pie_ind_vec' },
        { kind: 'block', type: 'pie_head' },
        { kind: 'block', type: 'pie_tail' },
        { kind: 'sep', gap: '16' },
        { kind: 'label', text: 'Either Eliminator' },
        { kind: 'block', type: 'pie_ind_either' },
        { kind: 'sep', gap: '16' },
        { kind: 'label', text: 'Equality Eliminator' },
        { kind: 'block', type: 'pie_ind_equal' },
        { kind: 'sep', gap: '16' },
        { kind: 'label', text: 'Absurd Eliminator' },
        { kind: 'block', type: 'pie_ind_absurd' },
      ]
    },

    // ==================== TACTICS ====================
    {
      kind: 'category',
      name: 'Tactics',
      colour: BLOCK_COLORS.TACTICS,
      contents: [
        { kind: 'label', text: 'Basic Tactics' },
        { kind: 'block', type: 'pie_tactic_intro' },
        { kind: 'block', type: 'pie_tactic_exact' },
        { kind: 'block', type: 'pie_tactic_exists' },
        { kind: 'sep', gap: '16' },
        { kind: 'label', text: 'Either Tactics' },
        { kind: 'block', type: 'pie_tactic_left' },
        { kind: 'block', type: 'pie_tactic_right' },
        { kind: 'sep', gap: '16' },
        { kind: 'label', text: 'Split' },
        { kind: 'block', type: 'pie_tactic_split' },
        { kind: 'sep', gap: '16' },
        { kind: 'label', text: 'Elimination Tactics' },
        { kind: 'block', type: 'pie_tactic_elimNat' },
        { kind: 'block', type: 'pie_tactic_elimList' },
        { kind: 'block', type: 'pie_tactic_elimVec' },
        { kind: 'block', type: 'pie_tactic_elimEqual' },
        { kind: 'block', type: 'pie_tactic_elimEither' },
        { kind: 'block', type: 'pie_tactic_elimAbsurd' },
      ]
    },
  ]
};
