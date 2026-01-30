import type { SerializableGoalNode, ProofTreeData } from '@/workers/proof-worker';

/**
 * Generate a Pie proof script from a proof tree.
 *
 * This traverses the proof tree and generates the textual representation
 * of the proof tactics that have been applied.
 */
export function generateProofScript(
  proofTree: ProofTreeData,
  claimName: string
): string {
  const lines: string[] = [];

  // Start the define-tactically block
  lines.push(`(define-tactically ${claimName}`);

  // Generate tactics from the tree
  const tacticsBlock = generateTacticsFromNode(proofTree.root, 1);

  if (tacticsBlock.trim()) {
    lines.push(tacticsBlock);
  } else {
    lines.push('  ; No tactics applied yet');
  }

  lines.push(')');

  return lines.join('\n');
}

/**
 * Wrap a tactic string in parentheses if not already wrapped.
 * Tactic strings from backend like "intro n" become "(intro n)"
 */
function wrapTactic(tactic: string): string {
  const trimmed = tactic.trim();
  // Already wrapped in parentheses
  if (trimmed.startsWith('(') && trimmed.endsWith(')')) {
    return trimmed;
  }
  return `(${trimmed})`;
}

/**
 * Generate tactics for a single node and its children.
 * Returns the tactic script for this subtree.
 */
function generateTacticsFromNode(
  node: SerializableGoalNode,
  indentLevel: number
): string {
  const indent = '  '.repeat(indentLevel);
  const lines: string[] = [];

  // If this goal was completed directly (leaf node with completedBy)
  if (node.completedBy && node.children.length === 0) {
    lines.push(`${indent}${wrapTactic(node.completedBy)}`);
    return lines.join('\n');
  }

  // If a tactic was applied (has children)
  if (node.appliedTactic && node.children.length > 0) {
    // Single child - just the tactic followed by child tactics
    if (node.children.length === 1) {
      lines.push(`${indent}${wrapTactic(node.appliedTactic)}`);
      const childTactics = generateTacticsFromNode(node.children[0], indentLevel);
      if (childTactics.trim()) {
        lines.push(childTactics);
      }
    } else {
      // Multiple children - need a 'then' block
      lines.push(`${indent}${wrapTactic(node.appliedTactic)}`);
      lines.push(`${indent}(then`);

      for (const child of node.children) {
        const childTactics = generateTacticsFromNode(child, indentLevel + 1);
        if (childTactics.trim()) {
          lines.push(childTactics);
        } else {
          // If no tactics yet for this branch, add a placeholder comment
          lines.push(`${'  '.repeat(indentLevel + 1)}; TODO: complete this branch`);
        }
      }

      lines.push(`${indent})`);
    }
  }

  return lines.join('\n');
}

/**
 * Generate a minimal proof script showing just the tactics in order.
 * This is a flattened view without the full define-tactically structure.
 */
export function generateFlatTacticList(proofTree: ProofTreeData): string[] {
  const tactics: string[] = [];
  collectTactics(proofTree.root, tactics);
  return tactics;
}

/**
 * Recursively collect all tactics from the tree in depth-first order.
 */
function collectTactics(node: SerializableGoalNode, tactics: string[]): void {
  // Add completing tactic for leaf nodes
  if (node.completedBy && node.children.length === 0) {
    tactics.push(node.completedBy);
    return;
  }

  // Add applied tactic
  if (node.appliedTactic) {
    tactics.push(node.appliedTactic);
  }

  // Process children
  for (const child of node.children) {
    collectTactics(child, tactics);
  }
}
