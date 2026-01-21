/**
 * Blockly code generator for the Pie language.
 * Converts Blockly blocks to valid Pie source code.
 */

// Use global Blockly from CDN
declare const Blockly: any;

// Order constants (not used for Pie, but required by Blockly)
const ORDER_ATOMIC = 0;

// Lazy initialization - generator created on first use
let _pieGenerator: any = null;

function getGenerator(): any {
  if (_pieGenerator) {
    return _pieGenerator;
  }

  // Create the generator
  _pieGenerator = new Blockly.Generator('Pie');

  // Configure the generator
  _pieGenerator.scrub_ = function(block: any, code: string, opt_thisOnly?: boolean): string {
    const nextBlock = block.nextConnection && block.nextConnection.targetBlock();
    if (nextBlock && !opt_thisOnly) {
      return code + '\n' + _pieGenerator.blockToCode(nextBlock);
    }
    return code;
  };

  _pieGenerator.scrubNakedValue = function(line: string): string {
    return line + '\n';
  };

  // Register all block generators
  registerBlockGenerators(_pieGenerator);

  return _pieGenerator;
}

// Export getter for the generator
export const pieGenerator = {
  get instance() {
    return getGenerator();
  },
  workspaceToCode(workspace: any): string {
    return getGenerator().workspaceToCode(workspace);
  }
};

// Helper function to get code from a value input
function valueToCode(generator: any, block: any, name: string): string {
  const result = generator.valueToCode(block, name, ORDER_ATOMIC);
  return result || '';
}

// Helper function to get code from a statement input
function statementToCode(generator: any, block: any, name: string): string {
  return generator.statementToCode(block, name);
}

// Helper for scrubbing statement blocks
function scrubCode(generator: any, block: any, code: string): string {
  const nextBlock = block.nextConnection && block.nextConnection.targetBlock();
  if (nextBlock) {
    return code + '\n' + generator.blockToCode(nextBlock);
  }
  return code;
}

function registerBlockGenerators(generator: any): void {
  // ==================== TYPE GENERATORS ====================

  generator.forBlock['pie_nat'] = function(): [string, number] {
    return ['Nat', ORDER_ATOMIC];
  };

  generator.forBlock['pie_atom'] = function(): [string, number] {
    return ['Atom', ORDER_ATOMIC];
  };

  generator.forBlock['pie_trivial'] = function(): [string, number] {
    return ['Trivial', ORDER_ATOMIC];
  };

  generator.forBlock['pie_absurd'] = function(): [string, number] {
    return ['Absurd', ORDER_ATOMIC];
  };

  generator.forBlock['pie_u'] = function(): [string, number] {
    return ['U', ORDER_ATOMIC];
  };

  generator.forBlock['pie_list_type'] = function(block: any): [string, number] {
    const elemType = valueToCode(generator, block, 'ELEM_TYPE') || 'Nat';
    return [`(List ${elemType})`, ORDER_ATOMIC];
  };

  generator.forBlock['pie_vec_type'] = function(block: any): [string, number] {
    const elemType = valueToCode(generator, block, 'ELEM_TYPE') || 'Nat';
    const length = valueToCode(generator, block, 'LENGTH') || '0';
    return [`(Vec ${elemType} ${length})`, ORDER_ATOMIC];
  };

  generator.forBlock['pie_pair_type'] = function(block: any): [string, number] {
    const leftType = valueToCode(generator, block, 'LEFT_TYPE') || 'Nat';
    const rightType = valueToCode(generator, block, 'RIGHT_TYPE') || 'Nat';
    return [`(Pair ${leftType} ${rightType})`, ORDER_ATOMIC];
  };

  generator.forBlock['pie_sigma_type'] = function(block: any): [string, number] {
    const binding = block.getFieldValue('BINDING') || 'x';
    const bindingType = valueToCode(generator, block, 'BINDING_TYPE') || 'Nat';
    const bodyType = valueToCode(generator, block, 'BODY_TYPE') || 'Nat';
    return [`(Sigma ((${binding} ${bindingType})) ${bodyType})`, ORDER_ATOMIC];
  };

  generator.forBlock['pie_either_type'] = function(block: any): [string, number] {
    const leftType = valueToCode(generator, block, 'LEFT_TYPE') || 'Nat';
    const rightType = valueToCode(generator, block, 'RIGHT_TYPE') || 'Nat';
    return [`(Either ${leftType} ${rightType})`, ORDER_ATOMIC];
  };

  generator.forBlock['pie_arrow_type'] = function(block: any): [string, number] {
    const fromType = valueToCode(generator, block, 'FROM_TYPE') || 'Nat';
    const toType = valueToCode(generator, block, 'TO_TYPE') || 'Nat';
    return [`(-> ${fromType} ${toType})`, ORDER_ATOMIC];
  };

  generator.forBlock['pie_pi_type'] = function(block: any): [string, number] {
    const binding = block.getFieldValue('BINDING') || 'x';
    const bindingType = valueToCode(generator, block, 'BINDING_TYPE') || 'Nat';
    const bodyType = valueToCode(generator, block, 'BODY_TYPE') || 'Nat';
    return [`(Pi ((${binding} ${bindingType})) ${bodyType})`, ORDER_ATOMIC];
  };

  generator.forBlock['pie_equal_type'] = function(block: any): [string, number] {
    const baseType = valueToCode(generator, block, 'BASE_TYPE') || 'Nat';
    const from = valueToCode(generator, block, 'FROM') || '0';
    const to = valueToCode(generator, block, 'TO') || '0';
    return [`(= ${baseType} ${from} ${to})`, ORDER_ATOMIC];
  };

  // ==================== VALUE GENERATORS ====================

  generator.forBlock['pie_zero'] = function(): [string, number] {
    return ['zero', ORDER_ATOMIC];
  };

  generator.forBlock['pie_add1'] = function(block: any): [string, number] {
    const n = valueToCode(generator, block, 'N') || 'zero';
    return [`(add1 ${n})`, ORDER_ATOMIC];
  };

  generator.forBlock['pie_nat_literal'] = function(block: any): [string, number] {
    const value = block.getFieldValue('VALUE') || 0;
    return [String(value), ORDER_ATOMIC];
  };

  generator.forBlock['pie_cons'] = function(block: any): [string, number] {
    const left = valueToCode(generator, block, 'LEFT') || 'zero';
    const right = valueToCode(generator, block, 'RIGHT') || 'zero';
    return [`(cons ${left} ${right})`, ORDER_ATOMIC];
  };

  generator.forBlock['pie_car'] = function(block: any): [string, number] {
    const pair = valueToCode(generator, block, 'PAIR') || 'p';
    return [`(car ${pair})`, ORDER_ATOMIC];
  };

  generator.forBlock['pie_cdr'] = function(block: any): [string, number] {
    const pair = valueToCode(generator, block, 'PAIR') || 'p';
    return [`(cdr ${pair})`, ORDER_ATOMIC];
  };

  generator.forBlock['pie_same'] = function(block: any): [string, number] {
    const value = valueToCode(generator, block, 'VALUE') || 'zero';
    return [`(same ${value})`, ORDER_ATOMIC];
  };

  generator.forBlock['pie_sole'] = function(): [string, number] {
    return ['sole', ORDER_ATOMIC];
  };

  generator.forBlock['pie_nil'] = function(): [string, number] {
    return ['nil', ORDER_ATOMIC];
  };

  generator.forBlock['pie_list_cons'] = function(block: any): [string, number] {
    const head = valueToCode(generator, block, 'HEAD') || 'zero';
    const tail = valueToCode(generator, block, 'TAIL') || 'nil';
    return [`(:: ${head} ${tail})`, ORDER_ATOMIC];
  };

  generator.forBlock['pie_vecnil'] = function(): [string, number] {
    return ['vecnil', ORDER_ATOMIC];
  };

  generator.forBlock['pie_vec_cons'] = function(block: any): [string, number] {
    const head = valueToCode(generator, block, 'HEAD') || 'zero';
    const tail = valueToCode(generator, block, 'TAIL') || 'vecnil';
    return [`(vec:: ${head} ${tail})`, ORDER_ATOMIC];
  };

  generator.forBlock['pie_left'] = function(block: any): [string, number] {
    const value = valueToCode(generator, block, 'VALUE') || 'zero';
    return [`(left ${value})`, ORDER_ATOMIC];
  };

  generator.forBlock['pie_right'] = function(block: any): [string, number] {
    const value = valueToCode(generator, block, 'VALUE') || 'zero';
    return [`(right ${value})`, ORDER_ATOMIC];
  };

  generator.forBlock['pie_quote'] = function(block: any): [string, number] {
    const symbol = block.getFieldValue('SYMBOL') || 'symbol';
    return [`'${symbol}`, ORDER_ATOMIC];
  };

  generator.forBlock['pie_variable'] = function(block: any): [string, number] {
    const name = block.getFieldValue('NAME') || 'x';
    return [name, ORDER_ATOMIC];
  };

  // ==================== FUNCTION GENERATORS ====================

  generator.forBlock['pie_lambda'] = function(block: any): [string, number] {
    const param = block.getFieldValue('PARAM') || 'x';
    const body = valueToCode(generator, block, 'BODY') || 'x';
    return [`(lambda (${param}) ${body})`, ORDER_ATOMIC];
  };

  generator.forBlock['pie_lambda_multi'] = function(block: any): [string, number] {
    const params = block.getFieldValue('PARAMS') || 'x';
    const body = valueToCode(generator, block, 'BODY') || 'x';
    return [`(lambda (${params}) ${body})`, ORDER_ATOMIC];
  };

  generator.forBlock['pie_application'] = function(block: any): [string, number] {
    const func = valueToCode(generator, block, 'FUNC') || 'f';
    const arg = valueToCode(generator, block, 'ARG') || 'x';
    return [`(${func} ${arg})`, ORDER_ATOMIC];
  };

  generator.forBlock['pie_application_multi'] = function(block: any): [string, number] {
    const func = valueToCode(generator, block, 'FUNC') || 'f';
    const arg1 = valueToCode(generator, block, 'ARG1') || 'x';
    const arg2 = valueToCode(generator, block, 'ARG2') || 'y';
    return [`(${func} ${arg1} ${arg2})`, ORDER_ATOMIC];
  };

  generator.forBlock['pie_the'] = function(block: any): [string, number] {
    const type = valueToCode(generator, block, 'TYPE') || 'Nat';
    const value = valueToCode(generator, block, 'VALUE') || 'zero';
    return [`(the ${type} ${value})`, ORDER_ATOMIC];
  };

  generator.forBlock['pie_cong'] = function(block: any): [string, number] {
    const proof = valueToCode(generator, block, 'PROOF') || 'eq';
    const func = valueToCode(generator, block, 'FUNC') || 'f';
    return [`(cong ${proof} ${func})`, ORDER_ATOMIC];
  };

  // ==================== DEFINITION GENERATORS ====================
  // Note: Don't call scrubCode here - Blockly's scrub_ handles connected blocks

  generator.forBlock['pie_claim'] = function(block: any): string {
    const name = block.getFieldValue('NAME') || 'name';
    const type = valueToCode(generator, block, 'TYPE') || 'Nat';
    return `(claim ${name} ${type})`;
  };

  generator.forBlock['pie_define'] = function(block: any): string {
    const name = block.getFieldValue('NAME') || 'name';
    const value = valueToCode(generator, block, 'VALUE') || 'zero';
    return `(define ${name} ${value})`;
  };

  generator.forBlock['pie_define_tactically'] = function(block: any): string {
    const name = block.getFieldValue('NAME') || 'name';
    const tactics = statementToCode(generator, block, 'TACTICS') || '';
    const formattedTactics = tactics
      .split('\n')
      .filter((line: string) => line.trim())
      .map((line: string) => '  ' + line.trim())
      .join('\n');
    return `(define-tactically ${name}\n  (\n${formattedTactics}\n  ))`;
  };

  generator.forBlock['pie_check_same'] = function(block: any): string {
    const type = valueToCode(generator, block, 'TYPE') || 'Nat';
    const left = valueToCode(generator, block, 'LEFT') || 'zero';
    const right = valueToCode(generator, block, 'RIGHT') || 'zero';
    return `(check-same ${type} ${left} ${right})`;
  };

  // ==================== TACTIC GENERATORS ====================
  // Note: Don't call scrubCode here - Blockly's scrub_ handles connected blocks

  generator.forBlock['pie_tactic_intro'] = function(block: any): string {
    const name = block.getFieldValue('NAME') || 'x';
    return `(intro ${name})`;
  };

  generator.forBlock['pie_tactic_exact'] = function(block: any): string {
    const expr = valueToCode(generator, block, 'EXPR') || 'x';
    return `(exact ${expr})`;
  };

  generator.forBlock['pie_tactic_exists'] = function(block: any): string {
    const witness = valueToCode(generator, block, 'WITNESS') || 'x';
    return `(exists ${witness})`;
  };

  generator.forBlock['pie_tactic_left'] = function(block: any): string {
    return '(left)';
  };

  generator.forBlock['pie_tactic_right'] = function(block: any): string {
    return '(right)';
  };

  generator.forBlock['pie_tactic_split'] = function(block: any): string {
    return '(split)';
  };

  generator.forBlock['pie_tactic_elimNat'] = function(block: any): string {
    const target = block.getFieldValue('TARGET') || 'n';
    return `(elimNat ${target})`;
  };

  generator.forBlock['pie_tactic_elimList'] = function(block: any): string {
    const target = block.getFieldValue('TARGET') || 'xs';
    return `(elimList ${target})`;
  };

  generator.forBlock['pie_tactic_elimVec'] = function(block: any): string {
    const target = block.getFieldValue('TARGET') || 'vs';
    return `(elimVec ${target})`;
  };

  generator.forBlock['pie_tactic_elimEqual'] = function(block: any): string {
    const target = block.getFieldValue('TARGET') || 'eq';
    return `(elimEqual ${target})`;
  };

  generator.forBlock['pie_tactic_elimEither'] = function(block: any): string {
    const target = block.getFieldValue('TARGET') || 'e';
    return `(elimEither ${target})`;
  };

  generator.forBlock['pie_tactic_elimAbsurd'] = function(block: any): string {
    const target = block.getFieldValue('TARGET') || 'x';
    return `(elimAbsurd ${target})`;
  };

  // ==================== ELIMINATOR GENERATORS ====================

  generator.forBlock['pie_which_nat'] = function(block: any): [string, number] {
    const target = valueToCode(generator, block, 'TARGET') || 'n';
    const base = valueToCode(generator, block, 'BASE') || 'zero';
    const step = valueToCode(generator, block, 'STEP') || 'f';
    return [`(which-Nat ${target} ${base} ${step})`, ORDER_ATOMIC];
  };

  generator.forBlock['pie_iter_nat'] = function(block: any): [string, number] {
    const target = valueToCode(generator, block, 'TARGET') || 'n';
    const base = valueToCode(generator, block, 'BASE') || 'zero';
    const step = valueToCode(generator, block, 'STEP') || 'f';
    return [`(iter-Nat ${target} ${base} ${step})`, ORDER_ATOMIC];
  };

  generator.forBlock['pie_rec_nat'] = function(block: any): [string, number] {
    const target = valueToCode(generator, block, 'TARGET') || 'n';
    const base = valueToCode(generator, block, 'BASE') || 'zero';
    const step = valueToCode(generator, block, 'STEP') || 'f';
    return [`(rec-Nat ${target} ${base} ${step})`, ORDER_ATOMIC];
  };

  generator.forBlock['pie_ind_nat'] = function(block: any): [string, number] {
    const target = valueToCode(generator, block, 'TARGET') || 'n';
    const motive = valueToCode(generator, block, 'MOTIVE') || 'mot';
    const base = valueToCode(generator, block, 'BASE') || 'zero';
    const step = valueToCode(generator, block, 'STEP') || 'f';
    return [`(ind-Nat ${target} ${motive} ${base} ${step})`, ORDER_ATOMIC];
  };

  generator.forBlock['pie_rec_list'] = function(block: any): [string, number] {
    const target = valueToCode(generator, block, 'TARGET') || 'xs';
    const base = valueToCode(generator, block, 'BASE') || 'nil';
    const step = valueToCode(generator, block, 'STEP') || 'f';
    return [`(rec-List ${target} ${base} ${step})`, ORDER_ATOMIC];
  };

  generator.forBlock['pie_ind_list'] = function(block: any): [string, number] {
    const target = valueToCode(generator, block, 'TARGET') || 'xs';
    const motive = valueToCode(generator, block, 'MOTIVE') || 'mot';
    const base = valueToCode(generator, block, 'BASE') || 'nil';
    const step = valueToCode(generator, block, 'STEP') || 'f';
    return [`(ind-List ${target} ${motive} ${base} ${step})`, ORDER_ATOMIC];
  };

  generator.forBlock['pie_ind_vec'] = function(block: any): [string, number] {
    const length = valueToCode(generator, block, 'LENGTH') || 'n';
    const target = valueToCode(generator, block, 'TARGET') || 'vs';
    const motive = valueToCode(generator, block, 'MOTIVE') || 'mot';
    const base = valueToCode(generator, block, 'BASE') || 'vecnil';
    const step = valueToCode(generator, block, 'STEP') || 'f';
    return [`(ind-Vec ${length} ${target} ${motive} ${base} ${step})`, ORDER_ATOMIC];
  };

  generator.forBlock['pie_ind_either'] = function(block: any): [string, number] {
    const target = valueToCode(generator, block, 'TARGET') || 'e';
    const motive = valueToCode(generator, block, 'MOTIVE') || 'mot';
    const leftCase = valueToCode(generator, block, 'LEFT_CASE') || 'fl';
    const rightCase = valueToCode(generator, block, 'RIGHT_CASE') || 'fr';
    return [`(ind-Either ${target} ${motive} ${leftCase} ${rightCase})`, ORDER_ATOMIC];
  };

  generator.forBlock['pie_ind_equal'] = function(block: any): [string, number] {
    const target = valueToCode(generator, block, 'TARGET') || 'eq';
    const motive = valueToCode(generator, block, 'MOTIVE') || 'mot';
    const base = valueToCode(generator, block, 'BASE') || 'b';
    return [`(ind-= ${target} ${motive} ${base})`, ORDER_ATOMIC];
  };

  generator.forBlock['pie_ind_absurd'] = function(block: any): [string, number] {
    const target = valueToCode(generator, block, 'TARGET') || 'x';
    const motive = valueToCode(generator, block, 'MOTIVE') || 'Nat';
    return [`(ind-Absurd ${target} ${motive})`, ORDER_ATOMIC];
  };

  generator.forBlock['pie_head'] = function(block: any): [string, number] {
    const list = valueToCode(generator, block, 'LIST') || 'vs';
    return [`(head ${list})`, ORDER_ATOMIC];
  };

  generator.forBlock['pie_tail'] = function(block: any): [string, number] {
    const list = valueToCode(generator, block, 'LIST') || 'vs';
    return [`(tail ${list})`, ORDER_ATOMIC];
  };
}
