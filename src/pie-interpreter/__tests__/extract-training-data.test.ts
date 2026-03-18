import 'jest';
import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';
import { evaluatePie } from '../main';
import { TrainingExample } from '../tactics/training-data-extractor';

describe('Training Data Extraction', () => {
  it('extracts training data via COLLECT_TRAINING_DATA env var', () => {
    const tmpFile = path.join(os.tmpdir(), `training-data-test-${Date.now()}.jsonl`);

    try {
      process.env.COLLECT_TRAINING_DATA = tmpFile;

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
      evaluatePie(source);

      delete process.env.COLLECT_TRAINING_DATA;

      // Read and parse the output
      const content = fs.readFileSync(tmpFile, 'utf-8').trim();
      const examples: TrainingExample[] = content.split('\n').map(line => JSON.parse(line));

      // Should have examples for: intro n, ind-nat n, exact (same 0), intro n-1, intro ih, exact (cong ih (+ 1))
      expect(examples.length).toBe(6);

      // First step: intro n
      expect(examples[0].theoremName).toBe('n+0=n');
      expect(examples[0].tactic).toBe('intro n');
      expect(examples[0].stepIndex).toBe(0);

      // + should be in globalContext
      expect(examples[0].globalContext.some(e => e.name === '+')).toBe(true);

      // After intro n, the next step should have n in localContext
      const elimStep = examples[1];
      expect(elimStep.tactic).toContain('ind-nat');
      expect(elimStep.localContext.some(e => e.name === 'n')).toBe(true);

      // No `then` wrapper steps — no tactic should start with "then"
      for (const ex of examples) {
        expect(ex.tactic).not.toMatch(/^then /);
      }

      // No isInsideThen or branchIndex fields
      for (const ex of examples) {
        expect('isInsideThen' in ex).toBe(false);
        expect('branchIndex' in ex).toBe(false);
      }

      // Print sample for inspection
      console.log('\nSample training examples:');
      for (const ex of examples) {
        const localNames = ex.localContext.map(e => e.name).join(', ');
        console.log(`  [${ex.stepIndex}] goal: ${ex.goal} → tactic: ${ex.tactic} (local: [${localNames}])`);
      }
    } finally {
      delete process.env.COLLECT_TRAINING_DATA;
      if (fs.existsSync(tmpFile)) fs.unlinkSync(tmpFile);
    }
  });

  it('does not produce output when env var is not set', () => {
    const tmpFile = path.join(os.tmpdir(), `training-data-noop-${Date.now()}.jsonl`);

    delete process.env.COLLECT_TRAINING_DATA;

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
    evaluatePie(source);

    expect(fs.existsSync(tmpFile)).toBe(false);
  });

  it('discards data for failed proofs', () => {
    const tmpFile = path.join(os.tmpdir(), `training-data-fail-${Date.now()}.jsonl`);

    try {
      // Write empty file first so we can check it stays empty
      fs.writeFileSync(tmpFile, '');
      process.env.COLLECT_TRAINING_DATA = tmpFile;

      const source = `
(claim id (Π ((n Nat)) (= Nat n n)))
(define-tactically id
  ((intro n)
   (exact (same 42))))
`;
      // This proof should fail (exact (same 42) won't match)
      try { evaluatePie(source); } catch { /* expected */ }

      delete process.env.COLLECT_TRAINING_DATA;

      const content = fs.readFileSync(tmpFile, 'utf-8');
      expect(content).toBe('');
    } finally {
      delete process.env.COLLECT_TRAINING_DATA;
      if (fs.existsSync(tmpFile)) fs.unlinkSync(tmpFile);
    }
  });
});
