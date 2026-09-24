import 'jest';
import { evaluatePie } from '../main';
import { ProgramSession, ProgramSessionError } from '../session';
import { analyzePieDocument } from '../../language-server/server/src/pie-analysis';

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

  it.each(['\n(claim bad missing-type)', '\n(claim n Nat'])('keeps positions visible to message-only consumers for %s', source => {
    const diagnostic = new ProgramSession().analyze(source).diagnostics[0];
    const location = `line ${diagnostic.range.startLine + 1}, column ${diagnostic.range.startColumn + 1}`;
    expect(diagnostic.range.startLine).toBe(1);
    try {
      evaluatePie(source);
      throw new Error('Expected evaluation to fail');
    } catch (error) {
      expect(error).toBeInstanceOf(ProgramSessionError);
      if (!(error instanceof ProgramSessionError)) throw error;
      expect(error.message).toContain(diagnostic.message);
      expect(error.message).toContain(location);
      expect(error.diagnostics).toEqual([diagnostic]);
    }
    // Editors retain their plain message and zero-based structured coordinates.
    const lsp = analyzePieDocument(source).diagnostics[0];
    expect(lsp.message).toBe(diagnostic.message);
    expect(lsp.range.start.line).toBe(1);
  });

  it('formats each diagnostic independently without changing structured messages', () => {
    const diagnostics = [
      { severity: 'error' as const, source: 'typechecker' as const, message: 'first',
        range: { startLine: 0, startColumn: 0, endLine: 0, endColumn: 1 } },
      { severity: 'error' as const, source: 'parser' as const, message: 'second',
        range: { startLine: 2, startColumn: 4, endLine: 2, endColumn: 5 } },
    ];
    expect(new ProgramSessionError(diagnostics).message).toBe(
      'first (line 1, column 1)\nsecond (line 3, column 5)',
    );
    expect(diagnostics.map(diagnostic => diagnostic.message)).toEqual(['first', 'second']);
  });
});
