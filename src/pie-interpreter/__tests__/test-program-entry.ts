import 'jest';
import { evaluatePie } from '../main';

// The Conductor adapter calls this whole-input entry point once per chunk.
// These tests exercise the entry point, not Conductor's transport/runtime.
describe('independent whole-program executions', () => {
  it('can run the same complete program repeatedly', () => {
    const source = '(claim n Nat) (define n 3) (add1 n)';
    expect(evaluatePie(source)).toBe('4: Nat\nn : Nat\nn = 3\n');
    expect(evaluatePie(source)).toBe('4: Nat\nn : Nat\nn = 3\n');
  });

  it('does not retain a declaration deleted from the next input', () => {
    evaluatePie('(claim n Nat) (define n 3)');
    expect(() => evaluatePie('(add1 n)')).toThrow();
  });

  it('uses the current definition when a complete program is edited', () => {
    evaluatePie('(claim n Nat) (define n 3)');
    expect(evaluatePie('(claim n Nat) (define n 7) n')).toBe('7: Nat\nn : Nat\nn = 7\n');
  });
});
