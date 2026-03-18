import 'jest';
import * as fs from 'fs';
import * as path from 'path';
import { extractFromSource, TrainingExample } from '../tactics/training-data-extractor';

const TEST_DIR = path.resolve(__dirname, 'tactics-math-tactic');
const OUTPUT_PATH = path.resolve(__dirname, '../../../training-data.jsonl');

/**
 * Extract Pie source strings from a TypeScript test file.
 * Finds template literal strings and resolves preamble references.
 */
function extractPieSourcesFromTestFile(filePath: string): string[] {
  const content = fs.readFileSync(filePath, 'utf-8');
  const sources: string[] = [];

  // Extract preamble constants (const xxxPreamble = `...`)
  const preambles = new Map<string, string>();
  const preambleRegex = /const\s+(\w+)\s*=\s*`([^`]*)`\s*;/g;
  let match: RegExpExecArray | null;
  while ((match = preambleRegex.exec(content)) !== null) {
    preambles.set(match[1], match[2]);
  }

  // Handle preambles that reference other preambles: const x = `${y}\n...`
  const compoundPreambleRegex = /const\s+(\w+)\s*=\s*`\$\{(\w+)\}\s*((?:[^`])*)`\s*;/g;
  while ((match = compoundPreambleRegex.exec(content)) !== null) {
    const name = match[1];
    const refName = match[2];
    const rest = match[3];
    const refValue = preambles.get(refName) ?? '';
    preambles.set(name, refValue + rest);
  }

  // Extract test body strings: const str = `${preambleName}\n...`
  const testStrRegex = /const\s+str\s*=\s*`\$\{(\w+)\}\s*((?:[^`])*)`\s*;/g;
  while ((match = testStrRegex.exec(content)) !== null) {
    const preambleName = match[1];
    const rest = match[2];
    const preambleValue = preambles.get(preambleName) ?? '';
    const fullSource = preambleValue + rest;
    if (fullSource.includes('define-tactically')) {
      sources.push(fullSource);
    }
  }

  // Pattern 2: const str = `\n...` (no preamble reference)
  const plainStrRegex = /const\s+str\s*=\s*`\n((?:[^`$]|(?:\$(?!\{)))*)`\s*;/g;
  while ((match = plainStrRegex.exec(content)) !== null) {
    const source = match[1];
    if (source.includes('define-tactically')) {
      sources.push(source);
    }
  }

  return sources;
}

describe('Training Data Extraction', () => {
  it('extracts training data from a simple proof', () => {
    const source = `
(claim + (→ Nat Nat Nat))
(define + (λ (n j) (iter-Nat n j (λ (x) (add1 x)))))

(claim n+0=n (Π ((n Nat)) (= Nat (+ n 0) n)))
(define-tactically n+0=n
  ((intro n)
   (elim-Nat n)
   (then
     (exact (same 0)))
   (then
     (intro n-1)
     (intro ih)
     (exact (cong ih (+ 1))))))
`;
    const examples = extractFromSource(source);

    // Should have examples for: intro n, elim-Nat n, exact (same 0), intro n-1, intro ih, exact (cong ih (+ 1))
    expect(examples.length).toBeGreaterThanOrEqual(6);

    // First step: intro n
    expect(examples[0].theoremName).toBe('n+0=n');
    expect(examples[0].tactic).toBe('intro n');
    expect(examples[0].isInsideThen).toBe(false);

    // Check context entries distinguish free vs define
    const introStep = examples[0];
    const defineEntries = introStep.context.filter(e => e.kind === 'define');
    expect(defineEntries.some(e => e.name === '+')).toBe(true);

    // After intro n, the next step should have n in context as 'free'
    const elimStep = examples[1];
    expect(elimStep.tactic).toContain('ind-nat'); // elim-Nat serializes as ind-nat
    const nEntry = elimStep.context.find(e => e.name === 'n');
    expect(nEntry).toBeDefined();
    expect(nEntry!.kind).toBe('free');

    // Steps inside then blocks should be marked
    const thenSteps = examples.filter(e => e.isInsideThen);
    expect(thenSteps.length).toBeGreaterThan(0);

    // Print sample for inspection
    console.log('\nSample training examples:');
    for (const ex of examples) {
      console.log(`  [${ex.stepIndex}] goal: ${ex.goal} → tactic: ${ex.tactic} (then: ${ex.isInsideThen}, branch: ${ex.branchIndex})`);
    }
  });

  it('extracts from all tactics-math-tactic test files', () => {
    const testFiles = fs.readdirSync(TEST_DIR).filter(f => f.endsWith('.ts')).sort();
    expect(testFiles.length).toBe(20);

    let totalExamples = 0;
    let totalSources = 0;
    let failedSources = 0;
    const allExamples: TrainingExample[] = [];

    for (const file of testFiles) {
      const filePath = path.join(TEST_DIR, file);
      const pieSources = extractPieSourcesFromTestFile(filePath);
      totalSources += pieSources.length;

      for (const source of pieSources) {
        try {
          const examples = extractFromSource(source);
          allExamples.push(...examples);
          totalExamples += examples.length;
        } catch (e) {
          failedSources++;
        }
      }
    }

    console.log(`\nExtraction summary:`);
    console.log(`  Test files: ${testFiles.length}`);
    console.log(`  Pie sources: ${totalSources} (${failedSources} failed)`);
    console.log(`  Training examples: ${totalExamples}`);

    // Write JSONL output
    const outputLines = allExamples.map(ex => JSON.stringify(ex));
    fs.writeFileSync(OUTPUT_PATH, outputLines.join('\n') + '\n');
    console.log(`  Output: ${OUTPUT_PATH}`);

    // Basic sanity checks
    expect(totalExamples).toBeGreaterThan(0);
    expect(failedSources).toBeLessThan(totalSources * 0.25); // <25% failure rate (some sources have error tests that intentionally fail)
  });
});
