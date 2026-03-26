import 'jest';
import { parseTacticString, TacticPredictor, runTacticAgent } from '../solver/tactic-agent';
import { evaluatePieAndGetContext } from '../main';
import { Context } from '../utils/context';

// Helper to get context from evaluating Pie code
function getContext(code: string): Context {
  const result = evaluatePieAndGetContext(code);
  return result.context;
}

describe('parseTacticString', () => {
  it('parses intro', () => {
    const tactic = parseTacticString('intro n');
    expect(tactic.toString()).toContain('intro');
  });

  it('parses exact with simple term', () => {
    const tactic = parseTacticString('exact (same 0)');
    expect(tactic.toString()).toContain('exact');
  });

  it('parses symm (no args)', () => {
    const tactic = parseTacticString('symm');
    expect(tactic.toString()).toBe('symm');
  });

  it('parses go-Left', () => {
    const tactic = parseTacticString('go-Left');
    expect(tactic.toString()).toBe('go-Left');
  });

  it('parses go-Right', () => {
    const tactic = parseTacticString('go-Right');
    expect(tactic.toString()).toBe('go-Right');
  });

  it('parses split-Pair', () => {
    const tactic = parseTacticString('split-Pair');
    expect(tactic.toString()).toBe('split-Pair');
  });

  it('parses elim-Nat', () => {
    const tactic = parseTacticString('elim-Nat n');
    expect(tactic.toString()).toContain('elim-Nat');
  });

  it('parses elim-Either', () => {
    const tactic = parseTacticString('elim-Either e');
    expect(tactic.toString()).toContain('elim-Either');
  });

  it('parses apply', () => {
    const tactic = parseTacticString('apply f');
    expect(tactic.toString()).toContain('apply');
  });

  it('parses cong with two args', () => {
    const tactic = parseTacticString('cong ih (+ 1)');
    expect(tactic.toString()).toContain('cong');
  });

  it('parses trans with one arg (branching)', () => {
    const tactic = parseTacticString('trans middle');
    expect(tactic.toString()).toContain('trans');
  });

  it('parses trans with two args (forward)', () => {
    const tactic = parseTacticString('trans proof1 proof2');
    expect(tactic.toString()).toContain('trans');
  });

  it('parses rewrite', () => {
    const tactic = parseTacticString('rewrite eq P');
    expect(tactic.toString()).toContain('rewrite');
  });

  it('parses exists with value and name', () => {
    const tactic = parseTacticString('exists 0 k');
    expect(tactic.toString()).toContain('exists');
  });
});

describe('runTacticAgent', () => {
  it('proves a simple equality with a mock predictor', async () => {
    // Set up context with a simple claim
    const code = `
(claim +
  (→ Nat Nat Nat))
(define +
  (λ (n j)
    (iter-Nat n j (λ (n-1) (add1 n-1)))))

(claim test-eq (= Nat 0 0))
`;
    const ctx = getContext(code);

    // Mock predictor that returns the right tactic
    const mockPredictor: TacticPredictor = {
      predict: async () => 'exact (same 0)',
    };

    const result = await runTacticAgent(ctx, 'test-eq', mockPredictor, { verbose: false });
    expect(result.success).toBe(true);
    expect(result.tactics).toEqual(['exact (same 0)']);
    expect(result.llmCalls).toBe(1);
  });

  it('proves a multi-step proof with a mock predictor', async () => {
    const code = `
(claim +
  (→ Nat Nat Nat))
(define +
  (λ (n j)
    (iter-Nat n j (λ (n-1) (add1 n-1)))))

(claim double
  (→ Nat Nat))
(define double
  (λ (n) (+ n n)))

(claim Even
  (→ Nat U))
(define Even
  (λ (n) (Σ ((half Nat)) (= Nat n (double half)))))

(claim zero-is-even (Even 0))
`;
    const ctx = getContext(code);

    // Simulate an LLM that gives correct tactics in sequence
    const tactics = ['exists 0 half', 'exact (same 0)'];
    let callIdx = 0;
    const mockPredictor: TacticPredictor = {
      predict: async () => tactics[callIdx++],
    };

    const result = await runTacticAgent(ctx, 'zero-is-even', mockPredictor, { verbose: false });
    expect(result.success).toBe(true);
    expect(result.tactics.length).toBe(2);
    expect(result.llmCalls).toBe(2);
  });

  it('retries on type error and eventually succeeds', async () => {
    const code = `(claim test-eq (= Nat 0 0))`;
    const ctx = getContext(code);

    let callCount = 0;
    const mockPredictor: TacticPredictor = {
      predict: async () => {
        callCount++;
        // First attempt: wrong tactic
        if (callCount === 1) return 'intro n';
        // Second attempt: correct
        return 'exact (same 0)';
      },
    };

    const result = await runTacticAgent(ctx, 'test-eq', mockPredictor, { verbose: false });
    expect(result.success).toBe(true);
    expect(result.retries).toBe(1);
    expect(result.llmCalls).toBe(2);
  });

  it('fails when claim does not exist', async () => {
    const code = `(claim x Nat) (define x 0)`;
    const ctx = getContext(code);

    const mockPredictor: TacticPredictor = {
      predict: async () => 'exact 0',
    };

    const result = await runTacticAgent(ctx, 'nonexistent', mockPredictor, { verbose: false });
    expect(result.success).toBe(false);
    expect(result.error).toBeDefined();
  });

  it('fails when max retries exceeded', async () => {
    const code = `(claim test-eq (= Nat 0 0))`;
    const ctx = getContext(code);

    // Always return wrong tactic
    const mockPredictor: TacticPredictor = {
      predict: async () => 'intro n',
    };

    const result = await runTacticAgent(ctx, 'test-eq', mockPredictor, {
      verbose: false,
      maxRetriesPerGoal: 3,
    });
    expect(result.success).toBe(false);
    expect(result.retries).toBeGreaterThan(0);
  });
});
