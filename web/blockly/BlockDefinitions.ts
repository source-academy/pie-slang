/**
 * Blockly block definitions for the Pie language.
 *
 * Block categories:
 * - Types: Nat, Atom, U, Pair, Sigma, Either, List, Vec, Pi/Arrow, Equal, Trivial, Absurd
 * - Terms: zero, add1, cons, same, sole, nil, left, right, lambda, the, variables
 * - Top-level: claim, define, define-tactically, check-same
 * - Tactics: intro, exact, exists, left, right, split, elimNat, elimList, elimVec, elimEqual, elimEither, elimAbsurd
 * - Eliminators: which-Nat, iter-Nat, rec-Nat, ind-Nat, rec-List, ind-List, ind-Vec, ind-Either, ind-=, ind-Absurd
 */

// Use global Blockly from CDN
declare const Blockly: any;

// Color constants for block categories
export const BLOCK_COLORS = {
  TYPES: '#4ade80',      // green
  VALUES: '#60a5fa',     // blue
  FUNCTIONS: '#a3e635',  // lime
  DEFINITIONS: '#fb923c', // orange
  TACTICS: '#f59e0b',    // amber
  ELIMINATORS: '#22d3ee', // cyan
};

export function defineAllBlocks(): void {
  // ==================== TYPE BLOCKS ====================

  // Simple type: Nat
  Blockly.Blocks['pie_nat'] = {
    init: function() {
      this.appendDummyInput()
          .appendField('Nat');
      this.setOutput(true, 'Type');
      this.setColour(BLOCK_COLORS.TYPES);
      this.setTooltip('Natural number type');
    }
  };

  // Simple type: Atom
  Blockly.Blocks['pie_atom'] = {
    init: function() {
      this.appendDummyInput()
          .appendField('Atom');
      this.setOutput(true, 'Type');
      this.setColour(BLOCK_COLORS.TYPES);
      this.setTooltip('Atom (symbol) type');
    }
  };

  // Simple type: Trivial
  Blockly.Blocks['pie_trivial'] = {
    init: function() {
      this.appendDummyInput()
          .appendField('Trivial');
      this.setOutput(true, 'Type');
      this.setColour(BLOCK_COLORS.TYPES);
      this.setTooltip('Trivial type (unit type)');
    }
  };

  // Simple type: Absurd
  Blockly.Blocks['pie_absurd'] = {
    init: function() {
      this.appendDummyInput()
          .appendField('Absurd');
      this.setOutput(true, 'Type');
      this.setColour(BLOCK_COLORS.TYPES);
      this.setTooltip('Absurd type (empty type)');
    }
  };

  // Universe: U
  Blockly.Blocks['pie_u'] = {
    init: function() {
      this.appendDummyInput()
          .appendField('U');
      this.setOutput(true, 'Type');
      this.setColour(BLOCK_COLORS.TYPES);
      this.setTooltip('Universe type (type of types)');
    }
  };

  // Parameterized type: List
  Blockly.Blocks['pie_list_type'] = {
    init: function() {
      this.appendValueInput('ELEM_TYPE')
          .setCheck('Type')
          .appendField('List');
      this.setOutput(true, 'Type');
      this.setColour(BLOCK_COLORS.TYPES);
      this.setTooltip('List type');
    }
  };

  // Parameterized type: Vec
  Blockly.Blocks['pie_vec_type'] = {
    init: function() {
      this.appendValueInput('ELEM_TYPE')
          .setCheck('Type')
          .appendField('Vec');
      this.appendValueInput('LENGTH')
          .setCheck(['Expression', 'Type'])
          .appendField('length');
      this.setInputsInline(true);
      this.setOutput(true, 'Type');
      this.setColour(BLOCK_COLORS.TYPES);
      this.setTooltip('Vector type with fixed length');
    }
  };

  // Pair type
  Blockly.Blocks['pie_pair_type'] = {
    init: function() {
      this.appendValueInput('LEFT_TYPE')
          .setCheck('Type')
          .appendField('Pair');
      this.appendValueInput('RIGHT_TYPE')
          .setCheck('Type');
      this.setInputsInline(true);
      this.setOutput(true, 'Type');
      this.setColour(BLOCK_COLORS.TYPES);
      this.setTooltip('Pair type (non-dependent product)');
    }
  };

  // Sigma type (dependent pair)
  Blockly.Blocks['pie_sigma_type'] = {
    init: function() {
      this.appendDummyInput()
          .appendField('Sigma (')
          .appendField(new Blockly.FieldTextInput('x'), 'BINDING')
          .appendField(':');
      this.appendValueInput('BINDING_TYPE')
          .setCheck('Type');
      this.appendDummyInput()
          .appendField(')');
      this.appendValueInput('BODY_TYPE')
          .setCheck('Type');
      this.setInputsInline(true);
      this.setOutput(true, 'Type');
      this.setColour(BLOCK_COLORS.TYPES);
      this.setTooltip('Sigma type (dependent pair)');
    }
  };

  // Either type
  Blockly.Blocks['pie_either_type'] = {
    init: function() {
      this.appendValueInput('LEFT_TYPE')
          .setCheck('Type')
          .appendField('Either');
      this.appendValueInput('RIGHT_TYPE')
          .setCheck('Type');
      this.setInputsInline(true);
      this.setOutput(true, 'Type');
      this.setColour(BLOCK_COLORS.TYPES);
      this.setTooltip('Either type (sum type)');
    }
  };

  // Arrow type (simple function type)
  Blockly.Blocks['pie_arrow_type'] = {
    init: function() {
      this.appendValueInput('FROM_TYPE')
          .setCheck('Type')
          .appendField('->');
      this.appendValueInput('TO_TYPE')
          .setCheck('Type');
      this.setInputsInline(true);
      this.setOutput(true, 'Type');
      this.setColour(BLOCK_COLORS.TYPES);
      this.setTooltip('Arrow type (function type)');
    }
  };

  // Pi type (dependent function type)
  Blockly.Blocks['pie_pi_type'] = {
    init: function() {
      this.appendDummyInput()
          .appendField('Pi (')
          .appendField(new Blockly.FieldTextInput('x'), 'BINDING')
          .appendField(':');
      this.appendValueInput('BINDING_TYPE')
          .setCheck('Type');
      this.appendDummyInput()
          .appendField(')');
      this.appendValueInput('BODY_TYPE')
          .setCheck('Type');
      this.setInputsInline(true);
      this.setOutput(true, 'Type');
      this.setColour(BLOCK_COLORS.TYPES);
      this.setTooltip('Pi type (dependent function type)');
    }
  };

  // Equal type
  Blockly.Blocks['pie_equal_type'] = {
    init: function() {
      this.appendValueInput('BASE_TYPE')
          .setCheck('Type')
          .appendField('=');
      this.appendValueInput('FROM')
          .setCheck(['Expression', 'Type']);
      this.appendValueInput('TO')
          .setCheck(['Expression', 'Type']);
      this.setInputsInline(true);
      this.setOutput(true, 'Type');
      this.setColour(BLOCK_COLORS.TYPES);
      this.setTooltip('Equality type');
    }
  };

  // ==================== VALUE BLOCKS ====================

  // Zero
  Blockly.Blocks['pie_zero'] = {
    init: function() {
      this.appendDummyInput()
          .appendField('zero');
      this.setOutput(true, 'Expression');
      this.setColour(BLOCK_COLORS.VALUES);
      this.setTooltip('Natural number zero');
    }
  };

  // Add1
  Blockly.Blocks['pie_add1'] = {
    init: function() {
      this.appendValueInput('N')
          .setCheck(['Expression', 'Type'])
          .appendField('add1');
      this.setOutput(true, 'Expression');
      this.setColour(BLOCK_COLORS.VALUES);
      this.setTooltip('Successor of a natural number');
    }
  };

  // Natural number literal
  Blockly.Blocks['pie_nat_literal'] = {
    init: function() {
      this.appendDummyInput()
          .appendField(new Blockly.FieldNumber(0, 0, Infinity, 1), 'VALUE');
      this.setOutput(true, 'Expression');
      this.setColour(BLOCK_COLORS.VALUES);
      this.setTooltip('Natural number literal');
    }
  };

  // Cons (pair constructor)
  Blockly.Blocks['pie_cons'] = {
    init: function() {
      this.appendValueInput('LEFT')
          .setCheck(['Expression', 'Type'])
          .appendField('cons');
      this.appendValueInput('RIGHT')
          .setCheck(['Expression', 'Type']);
      this.setInputsInline(true);
      this.setOutput(true, 'Expression');
      this.setColour(BLOCK_COLORS.VALUES);
      this.setTooltip('Pair constructor');
    }
  };

  // Car (first element of pair)
  Blockly.Blocks['pie_car'] = {
    init: function() {
      this.appendValueInput('PAIR')
          .setCheck(['Expression', 'Type'])
          .appendField('car');
      this.setOutput(true, 'Expression');
      this.setColour(BLOCK_COLORS.VALUES);
      this.setTooltip('First element of a pair');
    }
  };

  // Cdr (second element of pair)
  Blockly.Blocks['pie_cdr'] = {
    init: function() {
      this.appendValueInput('PAIR')
          .setCheck(['Expression', 'Type'])
          .appendField('cdr');
      this.setOutput(true, 'Expression');
      this.setColour(BLOCK_COLORS.VALUES);
      this.setTooltip('Second element of a pair');
    }
  };

  // Same (equality proof)
  Blockly.Blocks['pie_same'] = {
    init: function() {
      this.appendValueInput('VALUE')
          .setCheck(['Expression', 'Type'])
          .appendField('same');
      this.setOutput(true, 'Expression');
      this.setColour(BLOCK_COLORS.VALUES);
      this.setTooltip('Reflexivity proof');
    }
  };

  // Sole (trivial value)
  Blockly.Blocks['pie_sole'] = {
    init: function() {
      this.appendDummyInput()
          .appendField('sole');
      this.setOutput(true, 'Expression');
      this.setColour(BLOCK_COLORS.VALUES);
      this.setTooltip('The sole element of Trivial');
    }
  };

  // Nil (empty list)
  Blockly.Blocks['pie_nil'] = {
    init: function() {
      this.appendDummyInput()
          .appendField('nil');
      this.setOutput(true, 'Expression');
      this.setColour(BLOCK_COLORS.VALUES);
      this.setTooltip('Empty list');
    }
  };

  // List cons (::)
  Blockly.Blocks['pie_list_cons'] = {
    init: function() {
      this.appendValueInput('HEAD')
          .setCheck(['Expression', 'Type'])
          .appendField('::');
      this.appendValueInput('TAIL')
          .setCheck(['Expression', 'Type']);
      this.setInputsInline(true);
      this.setOutput(true, 'Expression');
      this.setColour(BLOCK_COLORS.VALUES);
      this.setTooltip('List constructor');
    }
  };

  // Vecnil (empty vector)
  Blockly.Blocks['pie_vecnil'] = {
    init: function() {
      this.appendDummyInput()
          .appendField('vecnil');
      this.setOutput(true, 'Expression');
      this.setColour(BLOCK_COLORS.VALUES);
      this.setTooltip('Empty vector');
    }
  };

  // Vec cons (vec::)
  Blockly.Blocks['pie_vec_cons'] = {
    init: function() {
      this.appendValueInput('HEAD')
          .setCheck(['Expression', 'Type'])
          .appendField('vec::');
      this.appendValueInput('TAIL')
          .setCheck(['Expression', 'Type']);
      this.setInputsInline(true);
      this.setOutput(true, 'Expression');
      this.setColour(BLOCK_COLORS.VALUES);
      this.setTooltip('Vector constructor');
    }
  };

  // Left (either left injection)
  Blockly.Blocks['pie_left'] = {
    init: function() {
      this.appendValueInput('VALUE')
          .setCheck(['Expression', 'Type'])
          .appendField('left');
      this.setOutput(true, 'Expression');
      this.setColour(BLOCK_COLORS.VALUES);
      this.setTooltip('Left injection into Either');
    }
  };

  // Right (either right injection)
  Blockly.Blocks['pie_right'] = {
    init: function() {
      this.appendValueInput('VALUE')
          .setCheck(['Expression', 'Type'])
          .appendField('right');
      this.setOutput(true, 'Expression');
      this.setColour(BLOCK_COLORS.VALUES);
      this.setTooltip('Right injection into Either');
    }
  };

  // Quote (atom literal)
  Blockly.Blocks['pie_quote'] = {
    init: function() {
      this.appendDummyInput()
          .appendField("'")
          .appendField(new Blockly.FieldTextInput('symbol'), 'SYMBOL');
      this.setOutput(true, 'Expression');
      this.setColour(BLOCK_COLORS.VALUES);
      this.setTooltip('Atom literal (quoted symbol)');
    }
  };

  // Variable reference
  Blockly.Blocks['pie_variable'] = {
    init: function() {
      this.appendDummyInput()
          .appendField(new Blockly.FieldTextInput('x'), 'NAME');
      this.setOutput(true, ['Expression', 'Type']);
      this.setColour(BLOCK_COLORS.VALUES);
      this.setTooltip('Variable reference');
    }
  };

  // ==================== FUNCTION BLOCKS ====================

  // Lambda (single argument)
  Blockly.Blocks['pie_lambda'] = {
    init: function() {
      this.appendDummyInput()
          .appendField('lambda (')
          .appendField(new Blockly.FieldTextInput('x'), 'PARAM')
          .appendField(')');
      this.appendValueInput('BODY')
          .setCheck(['Expression', 'Type']);
      this.setInputsInline(true);
      this.setOutput(true, 'Expression');
      this.setColour(BLOCK_COLORS.FUNCTIONS);
      this.setTooltip('Lambda expression');
    }
  };

  // Lambda (multiple arguments)
  Blockly.Blocks['pie_lambda_multi'] = {
    init: function() {
      this.appendDummyInput()
          .appendField('lambda (')
          .appendField(new Blockly.FieldTextInput('x y'), 'PARAMS')
          .appendField(')');
      this.appendValueInput('BODY')
          .setCheck(['Expression', 'Type']);
      this.setInputsInline(true);
      this.setOutput(true, 'Expression');
      this.setColour(BLOCK_COLORS.FUNCTIONS);
      this.setTooltip('Lambda expression with multiple parameters (space-separated)');
    }
  };

  // Application (function call)
  Blockly.Blocks['pie_application'] = {
    init: function() {
      this.appendValueInput('FUNC')
          .setCheck(['Expression', 'Type'])
          .appendField('(');
      this.appendValueInput('ARG')
          .setCheck(['Expression', 'Type']);
      this.appendDummyInput()
          .appendField(')');
      this.setInputsInline(true);
      this.setOutput(true, 'Expression');
      this.setColour(BLOCK_COLORS.FUNCTIONS);
      this.setTooltip('Function application');
    }
  };

  // Application (multiple arguments)
  Blockly.Blocks['pie_application_multi'] = {
    init: function() {
      this.appendValueInput('FUNC')
          .setCheck(['Expression', 'Type'])
          .appendField('(');
      this.appendValueInput('ARG1')
          .setCheck(['Expression', 'Type']);
      this.appendValueInput('ARG2')
          .setCheck(['Expression', 'Type']);
      this.appendDummyInput()
          .appendField(')');
      this.setInputsInline(true);
      this.setOutput(true, 'Expression');
      this.setColour(BLOCK_COLORS.FUNCTIONS);
      this.setTooltip('Function application with two arguments');
    }
  };

  // The (type annotation)
  Blockly.Blocks['pie_the'] = {
    init: function() {
      this.appendValueInput('TYPE')
          .setCheck('Type')
          .appendField('the');
      this.appendValueInput('VALUE')
          .setCheck(['Expression', 'Type']);
      this.setInputsInline(true);
      this.setOutput(true, 'Expression');
      this.setColour(BLOCK_COLORS.FUNCTIONS);
      this.setTooltip('Type annotation');
    }
  };

  // Cong (congruence)
  Blockly.Blocks['pie_cong'] = {
    init: function() {
      this.appendValueInput('PROOF')
          .setCheck(['Expression', 'Type'])
          .appendField('cong');
      this.appendValueInput('FUNC')
          .setCheck(['Expression', 'Type']);
      this.setInputsInline(true);
      this.setOutput(true, 'Expression');
      this.setColour(BLOCK_COLORS.FUNCTIONS);
      this.setTooltip('Congruence (apply function to both sides of equality)');
    }
  };

  // ==================== DEFINITION BLOCKS ====================

  // Claim
  Blockly.Blocks['pie_claim'] = {
    init: function() {
      this.appendDummyInput()
          .appendField('claim')
          .appendField(new Blockly.FieldTextInput('name'), 'NAME');
      this.appendValueInput('TYPE')
          .setCheck('Type')
          .appendField(':');
      this.setPreviousStatement(true, 'Statement');
      this.setNextStatement(true, 'Statement');
      this.setColour(BLOCK_COLORS.DEFINITIONS);
      this.setTooltip('Declare a type for a name');
    }
  };

  // Define
  Blockly.Blocks['pie_define'] = {
    init: function() {
      this.appendDummyInput()
          .appendField('define')
          .appendField(new Blockly.FieldTextInput('name'), 'NAME');
      this.appendValueInput('VALUE')
          .setCheck(['Expression', 'Type'])
          .appendField('=');
      this.setPreviousStatement(true, 'Statement');
      this.setNextStatement(true, 'Statement');
      this.setColour(BLOCK_COLORS.DEFINITIONS);
      this.setTooltip('Define a value for a claimed name');
    }
  };

  // Define-tactically
  Blockly.Blocks['pie_define_tactically'] = {
    init: function() {
      this.appendDummyInput()
          .appendField('define-tactically')
          .appendField(new Blockly.FieldTextInput('name'), 'NAME');
      this.appendStatementInput('TACTICS')
          .setCheck('Tactic');
      this.setPreviousStatement(true, 'Statement');
      this.setNextStatement(true, 'Statement');
      this.setColour(BLOCK_COLORS.DEFINITIONS);
      this.setTooltip('Define using tactics');
    }
  };

  // Check-same
  Blockly.Blocks['pie_check_same'] = {
    init: function() {
      this.appendValueInput('TYPE')
          .setCheck('Type')
          .appendField('check-same');
      this.appendValueInput('LEFT')
          .setCheck(['Expression', 'Type']);
      this.appendValueInput('RIGHT')
          .setCheck(['Expression', 'Type']);
      this.setPreviousStatement(true, 'Statement');
      this.setNextStatement(true, 'Statement');
      this.setColour(BLOCK_COLORS.DEFINITIONS);
      this.setTooltip('Check that two expressions are the same');
    }
  };

  // ==================== TACTIC BLOCKS ====================

  // Intro tactic
  Blockly.Blocks['pie_tactic_intro'] = {
    init: function() {
      this.appendDummyInput()
          .appendField('intro')
          .appendField(new Blockly.FieldTextInput('x'), 'NAME');
      this.setPreviousStatement(true, 'Tactic');
      this.setNextStatement(true, 'Tactic');
      this.setColour(BLOCK_COLORS.TACTICS);
      this.setTooltip('Introduce a variable');
    }
  };

  // Exact tactic
  Blockly.Blocks['pie_tactic_exact'] = {
    init: function() {
      this.appendValueInput('EXPR')
          .setCheck(['Expression', 'Type'])
          .appendField('exact');
      this.setPreviousStatement(true, 'Tactic');
      this.setNextStatement(true, 'Tactic');
      this.setColour(BLOCK_COLORS.TACTICS);
      this.setTooltip('Provide exact proof term');
    }
  };

  // Exists tactic
  Blockly.Blocks['pie_tactic_exists'] = {
    init: function() {
      this.appendValueInput('WITNESS')
          .setCheck(['Expression', 'Type'])
          .appendField('exists');
      this.setPreviousStatement(true, 'Tactic');
      this.setNextStatement(true, 'Tactic');
      this.setColour(BLOCK_COLORS.TACTICS);
      this.setTooltip('Provide witness for existential');
    }
  };

  // Left tactic
  Blockly.Blocks['pie_tactic_left'] = {
    init: function() {
      this.appendDummyInput()
          .appendField('left');
      this.setPreviousStatement(true, 'Tactic');
      this.setNextStatement(true, 'Tactic');
      this.setColour(BLOCK_COLORS.TACTICS);
      this.setTooltip('Choose left branch of Either');
    }
  };

  // Right tactic
  Blockly.Blocks['pie_tactic_right'] = {
    init: function() {
      this.appendDummyInput()
          .appendField('right');
      this.setPreviousStatement(true, 'Tactic');
      this.setNextStatement(true, 'Tactic');
      this.setColour(BLOCK_COLORS.TACTICS);
      this.setTooltip('Choose right branch of Either');
    }
  };

  // Split tactic
  Blockly.Blocks['pie_tactic_split'] = {
    init: function() {
      this.appendDummyInput()
          .appendField('split');
      this.setPreviousStatement(true, 'Tactic');
      this.setNextStatement(true, 'Tactic');
      this.setColour(BLOCK_COLORS.TACTICS);
      this.setTooltip('Split a goal into subgoals');
    }
  };

  // ElimNat tactic
  Blockly.Blocks['pie_tactic_elimNat'] = {
    init: function() {
      this.appendDummyInput()
          .appendField('elimNat')
          .appendField(new Blockly.FieldTextInput('n'), 'TARGET');
      this.setPreviousStatement(true, 'Tactic');
      this.setNextStatement(true, 'Tactic');
      this.setColour(BLOCK_COLORS.TACTICS);
      this.setTooltip('Eliminate (induct on) a natural number');
    }
  };

  // ElimList tactic
  Blockly.Blocks['pie_tactic_elimList'] = {
    init: function() {
      this.appendDummyInput()
          .appendField('elimList')
          .appendField(new Blockly.FieldTextInput('xs'), 'TARGET');
      this.setPreviousStatement(true, 'Tactic');
      this.setNextStatement(true, 'Tactic');
      this.setColour(BLOCK_COLORS.TACTICS);
      this.setTooltip('Eliminate (induct on) a list');
    }
  };

  // ElimVec tactic
  Blockly.Blocks['pie_tactic_elimVec'] = {
    init: function() {
      this.appendDummyInput()
          .appendField('elimVec')
          .appendField(new Blockly.FieldTextInput('vs'), 'TARGET');
      this.setPreviousStatement(true, 'Tactic');
      this.setNextStatement(true, 'Tactic');
      this.setColour(BLOCK_COLORS.TACTICS);
      this.setTooltip('Eliminate (induct on) a vector');
    }
  };

  // ElimEqual tactic
  Blockly.Blocks['pie_tactic_elimEqual'] = {
    init: function() {
      this.appendDummyInput()
          .appendField('elimEqual')
          .appendField(new Blockly.FieldTextInput('eq'), 'TARGET');
      this.setPreviousStatement(true, 'Tactic');
      this.setNextStatement(true, 'Tactic');
      this.setColour(BLOCK_COLORS.TACTICS);
      this.setTooltip('Eliminate an equality proof');
    }
  };

  // ElimEither tactic
  Blockly.Blocks['pie_tactic_elimEither'] = {
    init: function() {
      this.appendDummyInput()
          .appendField('elimEither')
          .appendField(new Blockly.FieldTextInput('e'), 'TARGET');
      this.setPreviousStatement(true, 'Tactic');
      this.setNextStatement(true, 'Tactic');
      this.setColour(BLOCK_COLORS.TACTICS);
      this.setTooltip('Eliminate an Either value');
    }
  };

  // ElimAbsurd tactic
  Blockly.Blocks['pie_tactic_elimAbsurd'] = {
    init: function() {
      this.appendDummyInput()
          .appendField('elimAbsurd')
          .appendField(new Blockly.FieldTextInput('x'), 'TARGET');
      this.setPreviousStatement(true, 'Tactic');
      this.setNextStatement(true, 'Tactic');
      this.setColour(BLOCK_COLORS.TACTICS);
      this.setTooltip('Eliminate an Absurd value (ex falso)');
    }
  };

  // ==================== ELIMINATOR BLOCKS ====================

  // which-Nat
  Blockly.Blocks['pie_which_nat'] = {
    init: function() {
      this.appendValueInput('TARGET')
          .setCheck(['Expression', 'Type'])
          .appendField('which-Nat');
      this.appendValueInput('BASE')
          .setCheck(['Expression', 'Type'])
          .appendField('base');
      this.appendValueInput('STEP')
          .setCheck(['Expression', 'Type'])
          .appendField('step');
      this.setInputsInline(false);
      this.setOutput(true, 'Expression');
      this.setColour(BLOCK_COLORS.ELIMINATORS);
      this.setTooltip('Case analysis on Nat (zero or add1)');
    }
  };

  // iter-Nat
  Blockly.Blocks['pie_iter_nat'] = {
    init: function() {
      this.appendValueInput('TARGET')
          .setCheck(['Expression', 'Type'])
          .appendField('iter-Nat');
      this.appendValueInput('BASE')
          .setCheck(['Expression', 'Type'])
          .appendField('base');
      this.appendValueInput('STEP')
          .setCheck(['Expression', 'Type'])
          .appendField('step');
      this.setInputsInline(false);
      this.setOutput(true, 'Expression');
      this.setColour(BLOCK_COLORS.ELIMINATORS);
      this.setTooltip('Iterate over Nat');
    }
  };

  // rec-Nat
  Blockly.Blocks['pie_rec_nat'] = {
    init: function() {
      this.appendValueInput('TARGET')
          .setCheck(['Expression', 'Type'])
          .appendField('rec-Nat');
      this.appendValueInput('BASE')
          .setCheck(['Expression', 'Type'])
          .appendField('base');
      this.appendValueInput('STEP')
          .setCheck(['Expression', 'Type'])
          .appendField('step');
      this.setInputsInline(false);
      this.setOutput(true, 'Expression');
      this.setColour(BLOCK_COLORS.ELIMINATORS);
      this.setTooltip('Recursion over Nat with predecessor');
    }
  };

  // ind-Nat
  Blockly.Blocks['pie_ind_nat'] = {
    init: function() {
      this.appendValueInput('TARGET')
          .setCheck(['Expression', 'Type'])
          .appendField('ind-Nat');
      this.appendValueInput('MOTIVE')
          .setCheck(['Expression', 'Type'])
          .appendField('motive');
      this.appendValueInput('BASE')
          .setCheck(['Expression', 'Type'])
          .appendField('base');
      this.appendValueInput('STEP')
          .setCheck(['Expression', 'Type'])
          .appendField('step');
      this.setInputsInline(false);
      this.setOutput(true, 'Expression');
      this.setColour(BLOCK_COLORS.ELIMINATORS);
      this.setTooltip('Induction over Nat');
    }
  };

  // rec-List
  Blockly.Blocks['pie_rec_list'] = {
    init: function() {
      this.appendValueInput('TARGET')
          .setCheck(['Expression', 'Type'])
          .appendField('rec-List');
      this.appendValueInput('BASE')
          .setCheck(['Expression', 'Type'])
          .appendField('base');
      this.appendValueInput('STEP')
          .setCheck(['Expression', 'Type'])
          .appendField('step');
      this.setInputsInline(false);
      this.setOutput(true, 'Expression');
      this.setColour(BLOCK_COLORS.ELIMINATORS);
      this.setTooltip('Recursion over List');
    }
  };

  // ind-List
  Blockly.Blocks['pie_ind_list'] = {
    init: function() {
      this.appendValueInput('TARGET')
          .setCheck(['Expression', 'Type'])
          .appendField('ind-List');
      this.appendValueInput('MOTIVE')
          .setCheck(['Expression', 'Type'])
          .appendField('motive');
      this.appendValueInput('BASE')
          .setCheck(['Expression', 'Type'])
          .appendField('base');
      this.appendValueInput('STEP')
          .setCheck(['Expression', 'Type'])
          .appendField('step');
      this.setInputsInline(false);
      this.setOutput(true, 'Expression');
      this.setColour(BLOCK_COLORS.ELIMINATORS);
      this.setTooltip('Induction over List');
    }
  };

  // ind-Vec
  Blockly.Blocks['pie_ind_vec'] = {
    init: function() {
      this.appendValueInput('LENGTH')
          .setCheck(['Expression', 'Type'])
          .appendField('ind-Vec');
      this.appendValueInput('TARGET')
          .setCheck(['Expression', 'Type'])
          .appendField('vec');
      this.appendValueInput('MOTIVE')
          .setCheck(['Expression', 'Type'])
          .appendField('motive');
      this.appendValueInput('BASE')
          .setCheck(['Expression', 'Type'])
          .appendField('base');
      this.appendValueInput('STEP')
          .setCheck(['Expression', 'Type'])
          .appendField('step');
      this.setInputsInline(false);
      this.setOutput(true, 'Expression');
      this.setColour(BLOCK_COLORS.ELIMINATORS);
      this.setTooltip('Induction over Vec');
    }
  };

  // ind-Either
  Blockly.Blocks['pie_ind_either'] = {
    init: function() {
      this.appendValueInput('TARGET')
          .setCheck(['Expression', 'Type'])
          .appendField('ind-Either');
      this.appendValueInput('MOTIVE')
          .setCheck(['Expression', 'Type'])
          .appendField('motive');
      this.appendValueInput('LEFT_CASE')
          .setCheck(['Expression', 'Type'])
          .appendField('left');
      this.appendValueInput('RIGHT_CASE')
          .setCheck(['Expression', 'Type'])
          .appendField('right');
      this.setInputsInline(false);
      this.setOutput(true, 'Expression');
      this.setColour(BLOCK_COLORS.ELIMINATORS);
      this.setTooltip('Induction over Either');
    }
  };

  // ind-= (equality)
  Blockly.Blocks['pie_ind_equal'] = {
    init: function() {
      this.appendValueInput('TARGET')
          .setCheck(['Expression', 'Type'])
          .appendField('ind-=');
      this.appendValueInput('MOTIVE')
          .setCheck(['Expression', 'Type'])
          .appendField('motive');
      this.appendValueInput('BASE')
          .setCheck(['Expression', 'Type'])
          .appendField('base');
      this.setInputsInline(false);
      this.setOutput(true, 'Expression');
      this.setColour(BLOCK_COLORS.ELIMINATORS);
      this.setTooltip('Induction over equality');
    }
  };

  // ind-Absurd
  Blockly.Blocks['pie_ind_absurd'] = {
    init: function() {
      this.appendValueInput('TARGET')
          .setCheck(['Expression', 'Type'])
          .appendField('ind-Absurd');
      this.appendValueInput('MOTIVE')
          .setCheck('Type')
          .appendField('motive');
      this.setInputsInline(true);
      this.setOutput(true, 'Expression');
      this.setColour(BLOCK_COLORS.ELIMINATORS);
      this.setTooltip('Eliminate Absurd (ex falso quodlibet)');
    }
  };

  // ==================== UTILITY BLOCKS ====================

  // Head (first element of list)
  Blockly.Blocks['pie_head'] = {
    init: function() {
      this.appendValueInput('LIST')
          .setCheck(['Expression', 'Type'])
          .appendField('head');
      this.setOutput(true, 'Expression');
      this.setColour(BLOCK_COLORS.ELIMINATORS);
      this.setTooltip('First element of a vector');
    }
  };

  // Tail (rest of list)
  Blockly.Blocks['pie_tail'] = {
    init: function() {
      this.appendValueInput('LIST')
          .setCheck(['Expression', 'Type'])
          .appendField('tail');
      this.setOutput(true, 'Expression');
      this.setColour(BLOCK_COLORS.ELIMINATORS);
      this.setTooltip('Tail of a vector');
    }
  };
}
