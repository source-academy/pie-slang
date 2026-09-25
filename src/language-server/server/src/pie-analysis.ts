import { PieProcessor } from '../../../pie-interpreter/processor';

/** LSP only translates the shared diagnostic coordinates and severity. */
export function analyzePieDocument(source: string) {
  const result = new PieProcessor().analyze(source);
  const severity = { error: 1, warning: 2, info: 3, hint: 4 } as const;
  return {
    context: result.checkedContext,
    diagnostics: result.diagnostics.map(diagnostic => ({
      severity: severity[diagnostic.severity],
      message: diagnostic.message,
      source: 'Pie Language Server',
      range: {
        start: { line: diagnostic.range.startLine, character: diagnostic.range.startColumn },
        end: { line: diagnostic.range.endLine, character: diagnostic.range.endColumn },
      },
    })),
  };
}
