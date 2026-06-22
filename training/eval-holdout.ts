/**
 * Holdout evaluation script for the LoRA tactic prediction model.
 *
 * Defines new theorems NOT in the training set, runs them through the
 * interpreter to extract per-step proof states, then queries the running
 * LoRA server (localhost:8000/predict) and measures accuracy.
 *
 * Usage:
 *   npx tsx training/eval-holdout.ts [--verbose]
 *
 * Requires: LoRA server running on port 8000 (./training/launch.sh)
 */

import { evaluatePieAndGetContext } from '../src/pie-interpreter/main';
import { ProofManager } from '../src/pie-interpreter/tactics/proof-manager';
import { Claim, Context, Define, Free } from '../src/pie-interpreter/utils/context';
import { go, stop } from '../src/pie-interpreter/types/utils';
import { schemeParse } from '../src/pie-interpreter/parser/parser';
import { Parser } from '../src/pie-interpreter/parser/parser';
import { Tactic } from '../src/pie-interpreter/tactics/tactics';
import { sugarType } from '../src/pie-interpreter/unparser/sugar';

// ── Types ────────────────────────────────────────────────────────────────────

interface StepRecord {
  theoremName: string;
  section: string;
  stepIndex: number;
  goal: string;
  globalContext: { name: string; type: string }[];
  localContext: { name: string; type: string }[];
  goldTactic: string;
  predicted?: string;
  exactMatch?: boolean;
  headMatch?: boolean;
  categoryMatch?: boolean;
}

interface HoldoutTheorem {
  section: string;
  name: string;
  tactics: string[];
}

// ── Preamble (same as training set) ──────────────────────────────────────────

const preamble = `
(claim + (→ Nat Nat Nat))
(define + (λ (n j) (iter-Nat n j (λ (x) (add1 x)))))
(claim double (→ Nat Nat))
(define double (λ (n) (iter-Nat n 0 (+ 2))))
(claim Even (→ Nat U))
(define Even (λ (n) (Σ ((half Nat)) (= Nat n (double half)))))
(claim Odd (→ Nat U))
(define Odd (λ (n) (Σ ((half Nat)) (= Nat n (add1 (double half))))))

(claim zero-is-even (Even 0))
(define zero-is-even (cons 0 (same 0)))

(claim add1-even->odd (Π ((n Nat)) (→ (Even n) (Odd (add1 n)))))
(define add1-even->odd (λ (n en) (cons (car en) (cong (cdr en) (+ 1)))))

(claim add1-odd->even (Π ((n Nat)) (→ (Odd n) (Even (add1 n)))))
(define add1-odd->even (λ (n on) (cons (add1 (car on)) (cong (cdr on) (+ 1)))))
`;

// ── Holdout theorems (NOT in training set) ───────────────────────────────────
//
// 5 sections × 2 theorems each = 10 theorems

const holdoutTheorems: HoldoutTheorem[] = [
  // ── Section 1: Simple intro + exact ──
  // Tests: intro to peel off Π binders, exact to close with a term
  {
    section: 'intro+exact',
    name: 'even-succ-succ-zero',
    // Prove: Even 2 (= Even (add1 (add1 0)))
    // Strategy: add1-odd->even applied to (add1 0) and (add1-even->odd 0 zero-is-even)
    tactics: [
      'exact (add1-odd->even (add1 0) (add1-even->odd 0 zero-is-even))',
    ],
  },
  {
    section: 'intro+exact',
    name: 'odd-one',
    // Prove: (Π ((p (Even 0))) (Odd (add1 0)))
    // Strategy: intro p, then exact (add1-even->odd 0 p)
    tactics: [
      'intro p',
      'exact (add1-even->odd 0 p)',
    ],
  },

  // ── Section 2: Constructor choice (go-Left / go-Right) ──
  // Tests: choosing the correct side of Either
  {
    section: 'constructor-choice',
    name: 'zero-either-even-odd',
    // Prove: Either (Even 0) (Odd 0)
    // 0 is even, so go-Left
    tactics: [
      'go-Left',
      'exact zero-is-even',
    ],
  },
  {
    section: 'constructor-choice',
    name: 'one-either-even-odd',
    // Prove: (Π ((e (Even 0))) (Either (Even (add1 0)) (Odd (add1 0))))
    // add1 of even is odd, so go-Right
    tactics: [
      'intro e',
      'go-Right',
      'exact (add1-even->odd 0 e)',
    ],
  },

  // ── Section 3: Nat induction (elim-Nat) ──
  // Tests: recognizing when to do induction on a Nat variable
  {
    section: 'nat-induction',
    name: 'every-nat-has-even-succ-succ',
    // Prove: (Π ((n Nat)) (→ (Even n) (Even (add1 (add1 n)))))
    // Strategy: intro n, intro en, exact composition of helpers
    tactics: [
      'intro n',
      'intro en',
      'exact (add1-odd->even (add1 n) (add1-even->odd n en))',
    ],
  },
  {
    section: 'nat-induction',
    name: 'succ-parity-flip',
    // Prove: (Π ((k Nat)) (→ (Either (Even k) (Odd k)) (Either (Even (add1 k)) (Odd (add1 k)))))
    // Strategy: intro k, intro h, elim-Either h, then two branches
    tactics: [
      'intro k',
      'intro h',
      'elim-Either h',
      'intro ek',
      'go-Right',
      'exact (add1-even->odd k ek)',
      'intro ok',
      'go-Left',
      'exact (add1-odd->even k ok)',
    ],
  },

  // ── Section 4: Either elimination (elim-Either) ──
  // Tests: case-splitting on Either values
  {
    section: 'either-elimination',
    name: 'either-even-odd-to-nat',
    // Prove: (Π ((n Nat)) (→ (Either (Even n) (Odd n)) Nat))
    // Either case → we can always return n
    // Strategy: intro, elim-Either, then exact n in both branches
    tactics: [
      'intro n',
      'intro h',
      'elim-Either h',
      'intro ek',
      'exact n',
      'intro ok',
      'exact n',
    ],
  },
  {
    section: 'either-elimination',
    name: 'either-swap',
    // Prove: (Π ((n Nat)) (→ (Either (Even n) (Odd n)) (Either (Odd n) (Even n))))
    // Swap the sides of Either
    tactics: [
      'intro n',
      'intro h',
      'elim-Either h',
      'intro ek',
      'go-Right',
      'exact ek',
      'intro ok',
      'go-Left',
      'exact ok',
    ],
  },

  // ── Section 5: Full induction + Either (compound) ──
  // Tests: elim-Nat → elim-Either → go-Left/go-Right with helpers
  {
    section: 'compound-induction',
    name: 'every-nat-odd-or-even',
    // Prove: (Π ((n Nat)) (Either (Odd n) (Even n)))
    // Same structure as even-or-odd but with swapped Either order
    tactics: [
      'intro n',
      'elim-Nat n',
      'go-Right',
      'exact zero-is-even',
      'intro n-1',
      'intro ih',
      'elim-Either ih',
      'intro on',
      'go-Right',
      'exact (add1-odd->even n-1 on)',
      'intro en',
      'go-Left',
      'exact (add1-even->odd n-1 en)',
    ],
  },
  {
    section: 'compound-induction',
    name: 'every-nat-succ-has-parity',
    // Prove: (Π ((n Nat)) (Either (Even (add1 n)) (Odd (add1 n))))
    // For each n, add1 n is either even or odd
    // Base: add1 0 is odd → go-Right, exact (add1-even->odd 0 zero-is-even)
    // Step: given Either(Even(add1 n-1), Odd(add1 n-1)), show Either(Even(add1(add1 n-1)), Odd(add1(add1 n-1)))
    tactics: [
      'intro n',
      'elim-Nat n',
      'go-Right',
      'exact (add1-even->odd 0 zero-is-even)',
      'intro n-1',
      'intro ih',
      'elim-Either ih',
      'intro en',
      'go-Right',
      'exact (add1-even->odd (add1 n-1) en)',
      'intro on',
      'go-Left',
      'exact (add1-odd->even (add1 n-1) on)',
    ],
  },
];

// ── Extract proof steps by running through the interpreter ───────────────────

function extractSteps(theorem: HoldoutTheorem, baseCtx: Context): StepRecord[] {
  const steps: StepRecord[] = [];
  const proofManager = new ProofManager();

  const startResult = proofManager.startProof(theorem.name, baseCtx, 'holdout-eval');
  if (startResult instanceof stop) {
    console.error(`  Failed to start proof for ${theorem.name}: ${startResult.message}`);
    return [];
  }

  for (let i = 0; i < theorem.tactics.length; i++) {
    const tacticStr = theorem.tactics[i];

    if (!proofManager.currentState || proofManager.currentState.isComplete()) {
      break;
    }

    const goalResult = proofManager.currentState.getCurrentGoal();
    if (!(goalResult instanceof go)) {
      console.error(`  No current goal at step ${i} for ${theorem.name}`);
      break;
    }

    const goal = goalResult.result;

    // Serialize context using sugarType (matches training data format)
    const globalContext: { name: string; type: string }[] = [];
    const localContext: { name: string; type: string }[] = [];

    for (const [name, binder] of goal.context.entries()) {
      if (name.startsWith('_')) continue;
      const typeCore = binder.type.readBackType(goal.context);
      const typeStr = sugarType(typeCore, goal.context);
      const entry = { name, type: typeStr };
      if (binder instanceof Define) {
        globalContext.push(entry);
      } else if (binder instanceof Free) {
        localContext.push(entry);
      }
    }

    const goalCore = goal.type.readBackType(goal.context);
    const goalStr = sugarType(goalCore, goal.context);

    steps.push({
      theoremName: theorem.name,
      section: theorem.section,
      stepIndex: i,
      goal: goalStr,
      globalContext,
      localContext,
      goldTactic: tacticStr,
    });

    // Apply the gold tactic to advance the proof
    const wrapped = tacticStr.trim().startsWith('(') ? tacticStr : `(${tacticStr})`;
    const parsed = schemeParse(wrapped);
    const tactic: Tactic = Parser.parseToTactics(parsed[0]);
    const result = proofManager.applyTactic(tactic);
    if (result instanceof stop) {
      console.error(`  Tactic "${tacticStr}" failed at step ${i} for ${theorem.name}: ${result.message}`);
      break;
    }
  }

  return steps;
}

// ── Query the LoRA server ────────────────────────────────────────────────────

async function predict(step: StepRecord): Promise<string> {
  const resp = await fetch('http://localhost:8000/predict', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      goal: step.goal,
      globalContext: step.globalContext,
      localContext: step.localContext,
    }),
  });

  if (!resp.ok) {
    throw new Error(`Server error ${resp.status}: ${await resp.text()}`);
  }

  const data = await resp.json() as { tactic: string };
  return data.tactic;
}

// ── Scoring helpers ──────────────────────────────────────────────────────────

const TACTIC_CATEGORIES: Record<string, string> = {
  'intro': 'introduction', 'exact': 'introduction',
  'exists': 'constructor', 'split': 'constructor',
  'go-Left': 'constructor', 'go-Right': 'constructor',
  'elim-Nat': 'elimination', 'elim-Either': 'elimination',
  'elim-List': 'elimination', 'elim-Vec': 'elimination',
  'elim-Equal': 'elimination', 'elim-Absurd': 'elimination',
  'ind-Absurd': 'elimination',
  'apply': 'application',
};

function tacticHead(t: string): string {
  return t.trim().split(/\s+/)[0] || '';
}

function tacticCategory(t: string): string {
  return TACTIC_CATEGORIES[tacticHead(t)] ?? 'unknown';
}

// ── Main ─────────────────────────────────────────────────────────────────────

async function main() {
  const verbose = process.argv.includes('--verbose') || process.argv.includes('-v');

  // Step 1: Build base context by evaluating the preamble
  console.log('Building base context from preamble...');
  const { context: baseCtx } = evaluatePieAndGetContext(preamble);

  // Add claims for all holdout theorems
  // We need to evaluate claim declarations to add them to context
  let claimSource = preamble;
  for (const thm of holdoutTheorems) {
    // We need the claim type — derive it from what the proof needs
    // Instead, let's build the full source with claims + define-tactically and extract steps
  }

  // Build full source with claims for each theorem
  const claimDecls = [
    '(claim even-succ-succ-zero (Even (add1 (add1 0))))',
    '(claim odd-one (Π ((p (Even 0))) (Odd (add1 0))))',
    '(claim zero-either-even-odd (Either (Even 0) (Odd 0)))',
    '(claim one-either-even-odd (Π ((e (Even 0))) (Either (Even (add1 0)) (Odd (add1 0)))))',
    '(claim every-nat-has-even-succ-succ (Π ((n Nat)) (→ (Even n) (Even (add1 (add1 n))))))',
    '(claim succ-parity-flip (Π ((k Nat)) (→ (Either (Even k) (Odd k)) (Either (Even (add1 k)) (Odd (add1 k))))))',
    '(claim either-even-odd-to-nat (Π ((n Nat)) (→ (Either (Even n) (Odd n)) Nat)))',
    '(claim either-swap (Π ((n Nat)) (→ (Either (Even n) (Odd n)) (Either (Odd n) (Even n)))))',
    '(claim every-nat-odd-or-even (Π ((n Nat)) (Either (Odd n) (Even n))))',
    '(claim every-nat-succ-has-parity (Π ((n Nat)) (Either (Even (add1 n)) (Odd (add1 n)))))',
  ];

  const fullPreamble = preamble + '\n' + claimDecls.join('\n');
  const { context: fullCtx } = evaluatePieAndGetContext(fullPreamble);

  // Step 2: Extract proof steps for each theorem
  console.log('Extracting proof steps...\n');
  const allSteps: StepRecord[] = [];

  for (const thm of holdoutTheorems) {
    const steps = extractSteps(thm, fullCtx);
    if (steps.length === 0) {
      console.error(`  SKIP ${thm.name}: no steps extracted`);
      continue;
    }
    allSteps.push(...steps);
    console.log(`  ${thm.name} (${thm.section}): ${steps.length} steps`);
  }

  console.log(`\nTotal steps to evaluate: ${allSteps.length}`);

  // Step 3: Check server health
  try {
    const health = await fetch('http://localhost:8000/health');
    if (!health.ok) throw new Error(`status ${health.status}`);
    const hdata = await health.json() as { status: string; model: string };
    console.log(`Server: ${hdata.model} (${hdata.status})\n`);
  } catch (e: any) {
    console.error(`\nERROR: Cannot reach LoRA server at localhost:8000`);
    console.error(`  Start it with: ./training/launch.sh`);
    console.error(`  ${e.message}`);
    process.exit(1);
  }

  // Step 4: Run predictions
  console.log('Running predictions...\n');
  const t0 = Date.now();

  for (let i = 0; i < allSteps.length; i++) {
    const step = allSteps[i];
    try {
      step.predicted = await predict(step);
    } catch (e: any) {
      step.predicted = `ERROR: ${e.message}`;
    }
    step.exactMatch = step.predicted === step.goldTactic;
    step.headMatch = tacticHead(step.predicted ?? '') === tacticHead(step.goldTactic);
    step.categoryMatch = tacticCategory(step.predicted ?? '') === tacticCategory(step.goldTactic);

    const status = step.exactMatch ? 'OK' : (step.headMatch ? ' ~' : ' X');
    if (verbose) {
      console.log(`  [${i + 1}/${allSteps.length}] [${status}] ${step.theoremName} step ${step.stepIndex}`);
      console.log(`    goal: ${step.goal}`);
      console.log(`    gold: ${step.goldTactic}`);
      console.log(`    pred: ${step.predicted}`);
    } else {
      console.log(`  [${i + 1}/${allSteps.length}] [${status}] gold=${step.goldTactic}  pred=${step.predicted}`);
    }
  }

  const elapsed = (Date.now() - t0) / 1000;

  // Step 5: Aggregate results
  const total = allSteps.length;
  const exact = allSteps.filter(s => s.exactMatch).length;
  const head = allSteps.filter(s => s.headMatch).length;
  const cat = allSteps.filter(s => s.categoryMatch).length;

  console.log(`\n${'='.repeat(60)}`);
  console.log(`  Holdout Evaluation Results`);
  console.log(`${'='.repeat(60)}`);

  console.log(`\n-- Step-level accuracy --`);
  console.log(`  Total steps:  ${total}`);
  console.log(`  Exact-match:  ${exact}/${total} (${(exact / total * 100).toFixed(1)}%)`);
  console.log(`  Tactic-head:  ${head}/${total} (${(head / total * 100).toFixed(1)}%)`);
  console.log(`  Category:     ${cat}/${total} (${(cat / total * 100).toFixed(1)}%)`);

  // Per-section breakdown
  console.log(`\n-- Per-section breakdown --`);
  const sections = [...new Set(allSteps.map(s => s.section))];
  for (const sec of sections) {
    const secSteps = allSteps.filter(s => s.section === sec);
    const secExact = secSteps.filter(s => s.exactMatch).length;
    const secHead = secSteps.filter(s => s.headMatch).length;
    console.log(`  ${sec.padEnd(24)} n=${secSteps.length}  exact=${(secExact / secSteps.length * 100).toFixed(1)}%  head=${(secHead / secSteps.length * 100).toFixed(1)}%`);
  }

  // Per-theorem (proof completion)
  console.log(`\n-- Per-theorem completion (all steps exact) --`);
  const theoremNames = [...new Set(allSteps.map(s => s.theoremName))];
  let proofsCompleted = 0;
  for (const name of theoremNames) {
    const thmSteps = allSteps.filter(s => s.theoremName === name);
    const allCorrect = thmSteps.every(s => s.exactMatch);
    if (allCorrect) proofsCompleted++;
    const correctCount = thmSteps.filter(s => s.exactMatch).length;
    const status = allCorrect ? 'OK  ' : 'FAIL';
    console.log(`  [${status}] ${name.padEnd(32)} ${correctCount}/${thmSteps.length} steps`);
  }
  console.log(`\n  Proofs completed: ${proofsCompleted}/${theoremNames.length} (${(proofsCompleted / theoremNames.length * 100).toFixed(1)}%)`);

  // Per-tactic breakdown
  console.log(`\n-- Per-tactic breakdown --`);
  const perTactic = new Map<string, { total: number; exact: number; head: number }>();
  for (const step of allSteps) {
    const h = tacticHead(step.goldTactic);
    if (!perTactic.has(h)) perTactic.set(h, { total: 0, exact: 0, head: 0 });
    const t = perTactic.get(h)!;
    t.total++;
    if (step.exactMatch) t.exact++;
    if (step.headMatch) t.head++;
  }
  for (const [tac, s] of [...perTactic.entries()].sort((a, b) => b[1].total - a[1].total)) {
    console.log(`  ${tac.padEnd(16)} n=${String(s.total).padStart(3)}  exact=${(s.exact / s.total * 100).toFixed(1).padStart(5)}%  head=${(s.head / s.total * 100).toFixed(1).padStart(5)}%`);
  }

  // Failures detail
  const failures = allSteps.filter(s => !s.exactMatch);
  if (failures.length > 0) {
    console.log(`\n-- Failures (${failures.length}) --`);
    for (const f of failures) {
      console.log(`  ${f.theoremName} step ${f.stepIndex}: gold="${f.goldTactic}" pred="${f.predicted}"`);
    }
  }

  console.log(`\n  Time: ${elapsed.toFixed(1)}s (${(elapsed / total).toFixed(2)}s/step)`);
}

main().catch(e => {
  console.error(e);
  process.exit(1);
});
