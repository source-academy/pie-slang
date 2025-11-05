// Log the worker's location for debugging
console.log('[Worker] Worker location:', self.location.href);
console.log('[Worker] Starting diagnostics worker initialization...');

let analyzePieSource = null;
let initializationError = null;
const messageQueue = [];

// Process a single message
function processMessage(event) {
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

  // Check if still loading - should not happen after queue processing
  if (!analyzePieSource) {
    console.warn('[Worker] Unexpected state: analyzePieSource not loaded during queue processing');
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
}

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

    // Process queued messages
    if (messageQueue.length > 0) {
      console.log(`[Worker] Processing ${messageQueue.length} queued message(s)`);
      while (messageQueue.length > 0) {
        const event = messageQueue.shift();
        processMessage(event);
      }
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    const stack = error instanceof Error ? error.stack : '';
    initializationError = { message, stack };
    console.error('[Worker] Failed to load bundle:', message, stack);

    // Send error to all queued messages
    while (messageQueue.length > 0) {
      messageQueue.shift(); // Clear queue
    }
  }
})();

console.log('[Worker] Diagnostics worker loaded successfully');

self.onmessage = event => {
  console.log('[Worker] Received message:', event.data);

  // If bundle is not loaded yet and no error, queue the message
  if (!analyzePieSource && !initializationError) {
    console.log('[Worker] Bundle still loading, queueing message...');
    messageQueue.push(event);
    return;
  }

  // Otherwise process immediately
  processMessage(event);
};
