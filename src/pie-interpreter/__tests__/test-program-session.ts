import 'jest';
import { ProgramSession, ProgramSessionError } from '../session';
import { evaluatePie, evaluatePieAndGetContext } from '../main';
import { Claim, Define, initCtx } from '../utils/context';
import { pieDeclarationParser, schemeParse } from '../parser/parser';
import { analyzePieDocument } from '../../language-server/server/src/pie-analysis';

const boolSource = `(data Bool () ()
  (true () (Bool () ()))
  (false () (Bool () ()))
  ind-Bool)`;

describe('ProgramSession', () => {
  it('keeps claims and definitions across inputs without sharing sessions or initCtx', () => {
    const session = new ProgramSession();
    expect(session.execute('(claim n Nat)').success).toBe(true);
    const result = session.execute('(define n 3) (add1 n)');
    expect(result.success).toBe(true);
    expect(result.output).toBe('4: Nat\nn : Nat\nn = 3\n');
    expect(new ProgramSession().snapshot().context.has('n')).toBe(false);
    expect(initCtx.has('n')).toBe(false);
  });

  it('rolls back an entire failed input, including an earlier successful define', () => {
    const session = new ProgramSession();
    session.execute('(claim n Nat)');
    const result = session.execute('(define n 3) (claim bad missing-type)');
    expect(result.success).toBe(false);
    expect(session.snapshot().context.get('n')).toBeInstanceOf(Claim);
    expect(session.execute('(define n 4)').success).toBe(true);
  });

  it('can explicitly retain successful declarations in a failed input', () => {
    const session = new ProgramSession();
    const result = session.execute('(claim n Nat) (define n sole)', { atomic: false });
    expect(result.success).toBe(false);
    expect(session.snapshot().context.get('n')).toBeInstanceOf(Claim);
  });

  it('analyzes on a copy and recovers after a failed declaration', () => {
    const session = new ProgramSession();
    session.execute('(claim n Nat)');
    const result = session.analyze('(define n sole) (claim m Nat) (define m 2)');
    expect(result.diagnostics).toHaveLength(1);
    expect(result.context.get('n')).toBeInstanceOf(Claim);
    expect(result.context.get('m')).toBeInstanceOf(Define);
    expect(session.snapshot().context.has('m')).toBe(false);
    expect(session.analyze('(define n 1)').success).toBe(true);
    expect(session.snapshot().context.get('n')).toBeInstanceOf(Claim);
  });

  it('retains datatype constructors and renaming across inputs and resets them', () => {
    const session = new ProgramSession();
    expect(session.execute(boolSource).success).toBe(true);
    expect(session.snapshot().renaming.get('true')).toBe('true');
    expect(session.execute('(claim b (Bool () ())) (define b (true))').success).toBe(true);
    session.reset();
    expect(session.snapshot().context.size).toBe(0);
    expect(session.snapshot().renaming.size).toBe(0);
    expect(session.execute('(claim b (Bool () ()))').success).toBe(false);
  });

  it('can fork a checkpoint without a later definition changing the checkpoint', () => {
    const session = new ProgramSession();
    session.execute('(claim n Nat)');
    const snapshot = session.snapshot();
    const fork = new ProgramSession(snapshot);
    fork.execute('(define n 7)');
    expect(snapshot.context.get('n')).toBeInstanceOf(Claim);
    expect(session.snapshot().context.get('n')).toBeInstanceOf(Claim);
    expect(fork.snapshot().context.get('n')).toBeInstanceOf(Define);
    const returned = fork.execute('n').context;
    returned.clear();
    expect(fork.snapshot().context.has('n')).toBe(true);
  });

  it('dispatches a parsed declaration through the same checker', () => {
    const session = new ProgramSession();
    const declaration = pieDeclarationParser.parseDeclaration(schemeParse('(claim n Nat)')[0]);
    expect(session.applyDeclaration(declaration).success).toBe(true);
    expect(session.execute('(define n 2)').success).toBe(true);
  });

  it('checks check-same and ordinary expressions as well as declarations', () => {
    const session = new ProgramSession();
    expect(session.analyze('(check-same Nat 2 (add1 1)) (add1 2)').success).toBe(true);
    expect(session.analyze('(check-same Nat 0 1)').success).toBe(false);
    expect(session.analyze('(add1 sole)').success).toBe(false);
  });

  it('makes completed tactical definitions available to later checks', () => {
    const source = `(claim identity (Pi ((A U) (x A)) A))
      (define-tactically identity ((intro A) (intro x) (exact x)))
      (check-same Nat (identity Nat 5) 5)`;
    const result = new ProgramSession().analyze(source);
    expect(result.diagnostics).toEqual([]);
    expect(result.bindings).toContainEqual(expect.objectContaining({ name: 'identity', kind: 'theorem' }));
    expect(analyzePieDocument(source).diagnostics).toEqual([]);
  });

  it('reports an incomplete proof consistently in execution and LSP analysis', () => {
    const source = '(claim f (-> Nat Nat)) (define-tactically f ((intro x)))';
    const result = new ProgramSession().analyze(source);
    expect(result.diagnostics[0].message).toContain('Proof incomplete');
    expect(analyzePieDocument(source).diagnostics[0].message).toBe(result.diagnostics[0].message);
    expect(() => evaluatePie(source)).toThrow(ProgramSessionError);
  });

  it('uses zero-based diagnostic positions and passes them unchanged to LSP', () => {
    const source = '\n(claim bad unknown-type)';
    const diagnostic = new ProgramSession().analyze(source).diagnostics[0];
    expect(diagnostic.source).toBe('typechecker');
    expect(diagnostic.range.startLine).toBe(1);
    const lsp = analyzePieDocument(source).diagnostics[0];
    expect(lsp.message).toBe(diagnostic.message);
    expect(lsp.range.start).toEqual({ line: 1, character: diagnostic.range.startColumn });
    expect(() => structuredClone(diagnostic)).not.toThrow();
  });

  it('reports syntax errors without throwing or modifying the session', () => {
    const session = new ProgramSession();
    const result = session.execute('(claim n Nat');
    expect(result.success).toBe(false);
    expect(result.diagnostics[0].source).toBe('parser');
    expect(session.snapshot().context.size).toBe(0);
  });

  it('reports mixed type and declaration-parse errors in source order', () => {
    const source = '(claim n unknown-type)\n(claim Nat Nat)\n(claim m Nat)';
    const session = new ProgramSession();
    const executed = session.execute(source);
    expect(executed.diagnostics).toHaveLength(1);
    expect(executed.diagnostics[0].source).toBe('typechecker');
    const analysis = session.analyze(source);
    expect(analysis.diagnostics.map(diagnostic => diagnostic.source)).toEqual(['typechecker', 'parser']);
    expect(analysis.context.has('m')).toBe(true);
  });

  it('retains a checked prefix on a later declaration parse error only when requested', () => {
    const session = new ProgramSession();
    expect(session.execute('(claim n Nat) (claim Nat Nat)', { atomic: false }).success).toBe(false);
    expect(session.snapshot().context.get('n')).toBeInstanceOf(Claim);
  });

  it('limits proof context to the target and skips unrelated unimplemented claims', () => {
    const source = `(claim unused missing-type)
      (claim before Nat) (define before 1)
      (claim goal Nat)
      (claim after Nat) (define after sole)`;
    const session = new ProgramSession();
    const result = session.prepareProof(source, 'goal');
    expect(result.diagnostics).toEqual([]);
    expect([...result.context.keys()]).toEqual(['before', 'goal']);
    expect(session.snapshot().context.size).toBe(0);
    expect(new ProgramSession().analyze(source).success).toBe(false);
  });

  it('checks datatypes and check-same in the visible proof context', () => {
    const result = new ProgramSession().prepareProof(`${boolSource}\n(claim goal (Bool () ()))`, 'goal');
    expect(result.success).toBe(true);
    expect(result.context.has('true')).toBe(true);
    const invalid = new ProgramSession().prepareProof('(check-same Nat 0 1) (claim goal Nat)', 'goal');
    expect(invalid.success).toBe(false);
  });

  it('keeps the existing whole-program output and returned-context API', () => {
    const source = '(claim n Nat) (define n 3) (add1 n)';
    expect(evaluatePie(source)).toBe('4: Nat\nn : Nat\nn = 3\n');
    expect(evaluatePieAndGetContext(source).output).toBe(evaluatePie(source));
    expect(evaluatePieAndGetContext(source).context.get('n')).toBeInstanceOf(Define);
    expect(() => evaluatePie('n')).toThrow();
  });
});
