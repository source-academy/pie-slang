import { analyzePieSource } from './pie-worker-bundle.js';

console.log('[Worker] Diagnostics worker loaded successfully');
console.log('[Worker] analyzePieSource:', typeof analyzePieSource);

self.onmessage = event => {
  console.log('[Worker] Received message:', event.data);
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
    const stack = error instanceof Error ? error.stack : '';
    console.error('Worker error:', message, stack);
    self.postMessage({
      type: 'diagnostics',
      payload: {
        diagnostics: [{
          message: `Worker error: ${message}`,
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
