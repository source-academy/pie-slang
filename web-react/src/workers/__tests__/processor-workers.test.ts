import { describe, it, expect, vi } from 'vitest';
import { PieProcessor } from '@pie/processor';
import { diagnosticsWorkerAPI } from '../diagnostics-worker';
import { proofWorkerAPI } from '../proof-worker';
import { EXAMPLES } from '../../features/proof-editor/data/examples';

vi.mock('comlink', () => ({ expose: vi.fn() }));

describe('workers using PieProcessor', () => {
  it('reports the same type error as the execution entry point', async () => {
    const source = '\n(claim n Nat)\n(define n sole)';
    const expected = new PieProcessor().execute(source);
    const actual = await diagnosticsWorkerAPI.checkSource(source);
    expect(actual.diagnostics).toEqual(expected.diagnostics);
    expect(actual.parseSuccessful).toBe(true);
    expect(actual.typeCheckSuccessful).toBe(false);
  });

  it('reports parse failures and does not retain declarations between document checks', async () => {
    const malformed = await diagnosticsWorkerAPI.checkSource('(claim n Nat');
    expect(malformed.parseSuccessful).toBe(false);
    expect(malformed.typeCheckSuccessful).toBe(false);
    expect((await diagnosticsWorkerAPI.checkSource('(claim n Nat)')).typeCheckSuccessful).toBe(true);
    expect((await diagnosticsWorkerAPI.checkSource('(define n 0)')).typeCheckSuccessful).toBe(false);
  });

  it('scans checked binding types and does not report defined names as unproved claims', async () => {
    const result = await proofWorkerAPI.scanFile('(claim n Nat) (define n 2) (claim todo Nat)');
    expect(result.definitions).toEqual([{ name: 'n', type: 'Nat', kind: 'definition' }]);
    expect(result.claims).toEqual([{ name: 'todo', type: 'Nat', kind: 'claim' }]);
    expect(result.diagnostics).toEqual([]);
  });

  it('returns scan diagnostics instead of disguising an invalid file as an empty file', async () => {
    const source = '(claim n Nat) (define n sole)';
    const result = await proofWorkerAPI.scanFile(source);
    expect(result.diagnostics).toEqual((await diagnosticsWorkerAPI.checkSource(source)).diagnostics);
    expect(result.claims).toContainEqual({ name: 'n', type: 'Nat', kind: 'claim' });
  });

  it.each(EXAMPLES)('starts the existing $name example', async example => {
    const result = await proofWorkerAPI.startSession(example.sourceCode, example.defaultClaim);
    expect(result.proofTree.root.goal.type).not.toBe('');
    expect(result.globalContext.theorems.some(entry => entry.name === example.defaultClaim)).toBe(false);
    proofWorkerAPI.closeSession(result.sessionId);
  });

  it('still completes an interactive proof through the worker', async () => {
    const result = await proofWorkerAPI.startSession('(claim refl (Pi ((n Nat)) (= Nat n n)))', 'refl');
    const introduced = await proofWorkerAPI.applyTactic(result.sessionId, result.proofTree.currentGoalId!, 'intro', {});
    expect(introduced.success).toBe(true);
    const completed = await proofWorkerAPI.applyTactic(result.sessionId, introduced.proofTree.currentGoalId!, 'exact', { expression: '(same n)' });
    expect(completed.success).toBe(true);
    expect(completed.proofTree.isComplete).toBe(true);
    proofWorkerAPI.closeSession(result.sessionId);
  });

  it('supports a datatype in both diagnostics and the interactive proof context', async () => {
    const source = `(data Bool () () (true () (Bool () ())) (false () (Bool () ())) ind-Bool)
      (claim goal (Bool () ()))`;
    expect((await diagnosticsWorkerAPI.checkSource(source)).diagnostics).toEqual([]);
    const result = await proofWorkerAPI.startSession(source, 'goal');
    expect(result.globalContext.definitions.some(entry => entry.name === 'Bool')).toBe(true);
    const completed = await proofWorkerAPI.applyTactic(result.sessionId, result.proofTree.currentGoalId!, 'exact', { expression: '(true)' });
    expect(completed.success).toBe(true);
    expect(completed.proofTree.isComplete).toBe(true);
    proofWorkerAPI.closeSession(result.sessionId);
  });

  it.each(['(check-same Nat 0 1)', '(add1 sole)'])(
    'ignores independent %s for proof setup but reports it during document checking', async expression => {
      const source = `${expression}\n(claim goal Nat)`;
      const result = await proofWorkerAPI.startSession(source, 'goal');
      try {
        expect((await diagnosticsWorkerAPI.checkSource(source)).typeCheckSuccessful).toBe(false);
        expect((await proofWorkerAPI.scanFile(source)).diagnostics?.length).toBeGreaterThan(0);
        const completed = await proofWorkerAPI.applyTactic(
          result.sessionId, result.proofTree.currentGoalId!, 'exact', { expression: '0' },
        );
        expect(completed.success).toBe(true);
        expect(completed.proofTree.isComplete).toBe(true);
      } finally {
        proofWorkerAPI.closeSession(result.sessionId);
      }
    },
  );

  it('rejects invalid preceding definitions and includes their position in the error text', async () => {
    await expect(proofWorkerAPI.startSession(
      '(claim n Nat)\n(define n sole)\n(claim goal Nat)', 'goal',
    )).rejects.toThrow(/line 2, column \d+/);
  });

  it('does not execute later definitions', async () => {
    const result = await proofWorkerAPI.startSession('(claim goal Nat) (define goal sole)', 'goal');
    expect(result.proofTree.isComplete).toBe(false);
    proofWorkerAPI.closeSession(result.sessionId);
  });
});
