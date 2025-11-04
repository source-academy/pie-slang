import { analyzePieSource } from './pie-worker-bundle.js';

self.onmessage = event => {
  const { type, payload } = event.data ?? {};
  if (type !== 'analyze') {
    return;
  }

  try {
    const result = analyzePieSource(payload?.source ?? '');
    self.postMessage({
      type: 'diagnostics',
      payload: result
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    self.postMessage({
      type: 'diagnostics',
      payload: {
        diagnostics: [{
          message,
          startLineNumber: 1,
          startColumn: 1,
          endLineNumber: 1,
          endColumn: 2,
          severity: 'error'
        }],
        summary: 'Diagnostics crashed.'
      }
    });
  }
};
