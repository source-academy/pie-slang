// Log the worker's location for debugging
console.log('[Worker] Worker location:', self.location.href);
console.log('[Worker] Starting diagnostics worker initialization...');

let analyzePieSource = null;
let initializationError = null;

// Dynamically import the bundle
(async () => {
  try {
    // Get the worker's base URL to resolve the bundle path correctly
    const workerUrl = new URL(self.location.href);
    const bundlePath = new URL('./pie-worker-bundle.js', workerUrl).href;

    console.log('[Worker] Attempting to load bundle from:', bundlePath);

    const module = await import(bundlePath);
    analyzePieSource = module.analyzePieSource;

    console.log('[Worker] Bundle loaded successfully');
    console.log('[Worker] analyzePieSource:', typeof analyzePieSource);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    const stack = error instanceof Error ? error.stack : '';
    initializationError = { message, stack };
    console.error('[Worker] Failed to load bundle:', message, stack);
  }
})();

console.log('[Worker] Diagnostics worker loaded successfully');
console.log('[Worker] analyzePieSource:', typeof analyzePieSource);

self.onmessage = event => {
  console.log('[Worker] Received message:', event.data);
  const { type, payload } = event.data ?? {};
  if (type !== 'analyze') {
    return;
  }

  // Check if initialization failed
  if (initializationError) {
    console.error('[Worker] Cannot analyze - initialization failed:', initializationError);
    self.postMessage({
      type: 'diagnostics',
      payload: {
        diagnostics: [{
          message: `Failed to load analyzer: ${initializationError.message}`,
          startLineNumber: 1,
          startColumn: 1,
          endLineNumber: 1,
          endColumn: 2,
          severity: 'error'
        }],
        summary: 'Diagnostics initialization failed.'
      }
    });
    return;
  }

  // Check if still loading
  if (!analyzePieSource) {
    console.log('[Worker] Still loading bundle, please wait...');
    self.postMessage({
      type: 'diagnostics',
      payload: {
        diagnostics: [],
        summary: 'Loading analyzer...'
      }
    });
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
    console.error('[Worker] Analysis error:', message, stack);
    self.postMessage({
      type: 'diagnostics',
      payload: {
        diagnostics: [{
          message: `Analysis error: ${message}`,
          startLineNumber: 1,
          startColumn: 1,
          endLineNumber: 1,
          endColumn: 2,
          severity: 'error'
        }],
        summary: 'Analysis failed.'
      }
    });
  }
};
