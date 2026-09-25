import 'jest';
import { PieProcessor, PieProcessorError } from '../processor';
import { evaluatePie, evaluatePieAndGetContext } from '../main';
import { Claim, Define, initCtx } from '../utils/context';
import { Zero } from '../types/value';
import { analyzePieDocument } from '../../language-server/server/src/pie-analysis';

const boolSource = `(data Bool () ()
  (true () (Bool () ()))
  (false () (Bool () ()))
  ind-Bool)`;

describe('PieProcessor', () => {
  it('shares declarations only within the current input, without modifying initCtx', () => {
    const processor = new PieProcessor();
    const source = '(claim n Nat) (define n 3) (add1 n)';
    const first = processor.execute(source);
    expect(first.success).toBe(true);
    expect(first.output).toBe('4: Nat\nn : Nat\nn = 3\n');
    expect(first.bindings).toEqual([{ name: 'n', type: 'Nat', kind: 'definition' }]);
    expect(processor.execute(source).output).toBe(first.output);
    expect(processor.execute('(add1 n)').success).toBe(false);
    expect(initCtx.has('n')).toBe(false);
  });

  it('uses edited or deleted declarations from the current source only', () => {
    const processor = new PieProcessor();
    processor.execute('(claim n Nat) (define n 3)');
    expect(processor.execute('(claim n Nat) (define n 7) n').output).toBe('7: Nat\nn : Nat\nn = 7\n');
    expect(processor.analyze('(add1 n)').success).toBe(false);
    expect(processor.execute('(define n 1)').success).toBe(false);
  });

  it('does not expose a successful execution context for a failed input', () => {
    const processor = new PieProcessor();
    const result = processor.execute('(claim n Nat) (define n 3) (add1 n) (claim bad missing-type)');
    expect(result.success).toBe(false);
    expect(result.diagnostics).toHaveLength(1);
    expect(result.context.size).toBe(0);
    expect(result.bindings).toEqual([]);
    expect(result.output).toBe('');
    expect(processor.execute('(add1 n)').success).toBe(false);
    expect(processor.execute('(claim n Nat) (define n 4)').success).toBe(true);
  });

  it('does not reuse an earlier result after declaration or syntax errors', () => {
    const processor = new PieProcessor();
    const before = processor.execute('(claim saved Nat) (define saved 2)');
    for (const source of ['(claim extra Nat) (claim Nat Nat)', '(claim extra Nat']) {
      const result = processor.execute(source);
      expect(result.success).toBe(false);
      expect(result.diagnostics[0].source).toBe('parser');
      expect(result.context.size).toBe(0);
      expect(result.bindings).toEqual([]);
      expect(result.output).toBe('');
    }
    expect(before.context.get('saved')).toBeInstanceOf(Define);
    expect(before.output).toBe('saved : Nat\nsaved = 2\n');
    expect(processor.execute('saved').success).toBe(false);
  });

  it('reports partial analysis in checked fields and recovers between declarations', () => {
    const processor = new PieProcessor();
    const result = processor.analyze('(claim n Nat) (define n sole) (claim m Nat) (define m 2)');
    expect(result.diagnostics).toHaveLength(1);
    expect(result.checkedContext.get('n')).toBeInstanceOf(Claim);
    expect(result.checkedContext.get('m')).toBeInstanceOf(Define);
    expect(result.checkedBindings).toContainEqual({ name: 'm', type: 'Nat', kind: 'definition' });
    expect(result.checkedOutput).toContain('m = 2');
    expect(result).not.toHaveProperty('context');
    expect(result).not.toHaveProperty('bindings');
    expect(result).not.toHaveProperty('output');
    expect(processor.analyze('(define m 1)').success).toBe(false);
    expect(processor.execute('m').success).toBe(false);
  });

  it('retains multiple diagnostics, including cascades, without retaining declarations', () => {
    const processor = new PieProcessor();
    const result = processor.analyze('(claim n missing-type) (define n 3) (claim m Nat)');
    expect(result.success).toBe(false);
    expect(result.diagnostics).toHaveLength(2);
    expect([...result.checkedContext.keys()]).toEqual(['m']);
    expect(result.checkedBindings).toEqual([{ name: 'm', type: 'Nat', kind: 'claim' }]);
    expect(processor.analyze('m').success).toBe(false);
  });

  it('makes datatypes available within the input but not in a later call', () => {
    const processor = new PieProcessor();
    const source = boolSource + '\n(claim b (Bool () ())) (define b (true))';
    const result = processor.execute(source);
    expect(result.success).toBe(true);
    expect(result.bindings).toContainEqual(expect.objectContaining({ name: 'Bool', kind: 'datatype' }));
    expect(result.bindings).toContainEqual(expect.objectContaining({ name: 'true', kind: 'constructor' }));
    expect(processor.execute(source).success).toBe(true);
    expect(processor.execute('(claim b (Bool () ()))').success).toBe(false);
  });

  it('does not share returned binder objects across independent runs', () => {
    const processor = new PieProcessor();
    const source = '(claim n Nat) (define n 3) n';
    const first = processor.execute(source);
    const second = processor.execute(source);
    const binder = first.context.get('n');
    expect(binder).toBeInstanceOf(Define);
    expect(binder).not.toBe(second.context.get('n'));
    if (!(binder instanceof Define)) throw new Error('Expected a definition');
    binder.value = new Zero();
    expect(second.output).toBe('3: Nat\nn : Nat\nn = 3\n');
    const secondBinder = second.context.get('n');
    if (!(secondBinder instanceof Define)) throw new Error('Expected a definition');
    expect(secondBinder.value).not.toBe(binder.value);
    expect(processor.execute(source).output).toBe(second.output);
  });

  it('provides no snapshot, reset or incremental declaration API', () => {
    const processor = new PieProcessor();
    expect(processor).not.toHaveProperty('snapshot');
    expect(processor).not.toHaveProperty('reset');
    expect(processor).not.toHaveProperty('applyDeclaration');
  });

  it('checks check-same and ordinary expressions as well as declarations', () => {
    const processor = new PieProcessor();
    expect(processor.analyze('(check-same Nat 2 (add1 1)) (add1 2)').success).toBe(true);
    expect(processor.analyze('(check-same Nat 0 1)').success).toBe(false);
    expect(processor.analyze('(add1 sole)').success).toBe(false);
  });

  it('makes completed tactical definitions available to later checks', () => {
    const source = `(claim identity (Pi ((A U) (x A)) A))
      (define-tactically identity ((intro A) (intro x) (exact x)))
      (check-same Nat (identity Nat 5) 5)`;
    const result = new PieProcessor().analyze(source);
    expect(result.diagnostics).toEqual([]);
    expect(result.checkedBindings).toContainEqual(expect.objectContaining({ name: 'identity', kind: 'theorem' }));
    expect(analyzePieDocument(source).diagnostics).toEqual([]);
  });

  it('reports an incomplete proof consistently in execution and LSP analysis', () => {
    const source = '(claim f (-> Nat Nat)) (define-tactically f ((intro x)))';
    const result = new PieProcessor().analyze(source);
    expect(result.diagnostics[0].message).toContain('Proof incomplete');
    expect(analyzePieDocument(source).diagnostics[0].message).toBe(result.diagnostics[0].message);
    expect(() => evaluatePie(source)).toThrow(PieProcessorError);
  });

  it('uses zero-based diagnostic positions and passes them unchanged to LSP', () => {
    const source = '\n(claim bad unknown-type)';
    const diagnostic = new PieProcessor().analyze(source).diagnostics[0];
    expect(diagnostic.source).toBe('typechecker');
    expect(diagnostic.range.startLine).toBe(1);
    const lsp = analyzePieDocument(source).diagnostics[0];
    expect(lsp.message).toBe(diagnostic.message);
    expect(lsp.range.start).toEqual({ line: 1, character: diagnostic.range.startColumn });
    expect(() => structuredClone(diagnostic)).not.toThrow();
  });

  it('reports syntax errors without throwing or retaining partial state', () => {
    const processor = new PieProcessor();
    const result = processor.execute('(claim n Nat');
    expect(result.success).toBe(false);
    expect(result.diagnostics[0].source).toBe('parser');
    expect(processor.execute('').context.size).toBe(0);
  });

  it('reports mixed type and declaration-parse errors in source order', () => {
    const source = '(claim n unknown-type)\n(claim Nat Nat)\n(claim m Nat)';
    const processor = new PieProcessor();
    const executed = processor.execute(source);
    expect(executed.diagnostics).toHaveLength(1);
    expect(executed.diagnostics[0].source).toBe('typechecker');
    const analysis = processor.analyze(source);
    expect(analysis.diagnostics.map(diagnostic => diagnostic.source)).toEqual(['typechecker', 'parser']);
    expect(analysis.checkedContext.has('m')).toBe(true);
  });

  it('exposes a checked prefix after a declaration parse error only in analysis', () => {
    const processor = new PieProcessor();
    const source = '(claim n Nat) (claim Nat Nat)';
    expect(processor.execute(source).context.size).toBe(0);
    expect(processor.analyze(source).checkedContext.get('n')).toBeInstanceOf(Claim);
    expect(processor.execute('n').success).toBe(false);
  });

  it('limits proof context to the target and skips unrelated unimplemented claims', () => {
    const source = `(claim unused missing-type)
      (claim before Nat) (define before 1)
      (claim goal Nat)
      (claim after Nat) (define after sole)`;
    const processor = new PieProcessor();
    const result = processor.prepareProof(source, 'goal');
    expect(result.diagnostics).toEqual([]);
    expect([...result.checkedContext.keys()]).toEqual(['before', 'goal']);
    expect(processor.execute('').context.size).toBe(0);
    expect(new PieProcessor().analyze(source).success).toBe(false);
  });

  it('checks datatypes in the visible proof context', () => {
    const result = new PieProcessor().prepareProof(`${boolSource}\n(claim goal (Bool () ()))`, 'goal');
    expect(result.success).toBe(true);
    expect(result.checkedContext.has('true')).toBe(true);
  });

  it.each(['(check-same Nat 0 1)', '(add1 sole)', 'unknown-value'])(
    'skips independent %s only when preparing a proof', expression => {
      const source = `${expression}\n(claim goal Nat)`;
      const processor = new PieProcessor();
      const proof = processor.prepareProof(source, 'goal');
      expect(proof.success).toBe(true);
      expect([...proof.checkedContext.keys()]).toEqual(['goal']);
      expect(processor.execute(source).success).toBe(false);
      expect(processor.analyze(source).success).toBe(false);
      expect(analyzePieDocument(source).diagnostics.length).toBeGreaterThan(0);
    },
  );

  it.each([
    '(claim n Nat) (define n sole) (claim goal Nat)',
    '(claim goal missing-type)',
    '(claim before (-> Nat Nat)) (define-tactically before ((intro x))) (claim goal Nat)',
    '(claim goal Nat) (claim malformed',
  ])('still rejects invalid declarations or malformed syntax during proof preparation: %s', source => {
    expect(new PieProcessor().prepareProof(source, 'goal').success).toBe(false);
  });

  it('keeps the existing whole-program output and returned-context API', () => {
    const source = '(claim n Nat) (define n 3) (add1 n)';
    expect(evaluatePie(source)).toBe('4: Nat\nn : Nat\nn = 3\n');
    expect(evaluatePieAndGetContext(source).output).toBe(evaluatePie(source));
    expect(evaluatePieAndGetContext(source).context.get('n')).toBeInstanceOf(Define);
    expect(() => evaluatePie('n')).toThrow();
  });
});
