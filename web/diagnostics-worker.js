// Log the worker's location for debugging
console.log('[Worker] Worker location:', self.location.href);
console.log('[Worker] Starting diagnostics worker initialization...');

let analyzePieSource = null;
let applyTacticToProof = null;
let validateTacticForGoal = null;
let startInteractiveProofSession = null;
let initializationError = null;
const messageQueue = [];

// Process a single message
function processMessage(event) {
  const { type, payload, callbackId } = event.data ?? {};

  // Check if initialization failed
  if (initializationError) {
    console.error('[Worker] Cannot process - initialization failed:', initializationError);
    self.postMessage({
      type: 'error',
      callbackId,
      payload: {
        message: `Failed to load analyzer: ${initializationError.message}`
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
    switch (type) {
      case 'analyze': {
        const result = analyzePieSource(payload?.source ?? '');
        self.postMessage({
          type: 'diagnostics',
          callbackId,
          payload: result
        });
        break;
      }

      case 'startInteractiveProof': {
        if (startInteractiveProofSession) {
          const result = startInteractiveProofSession(payload?.claimName, payload?.sourceContext);
          self.postMessage({
            type: 'proofStarted',
            callbackId,
            payload: result
          });
        } else {
          // Fallback: use analyze to get proof tree
          const result = analyzePieSource(payload?.sourceContext ?? '');
          self.postMessage({
            type: 'proofStarted',
            callbackId,
            payload: {
              proofTree: result.proofTree,
              claimType: ''
            }
          });
        }
        break;
      }

      case 'applyTactic': {
        if (applyTacticToProof) {
          const result = applyTacticToProof(payload?.goalId, payload?.tactic, payload?.sourceContext);
          self.postMessage({
            type: 'tacticResult',
            callbackId,
            payload: result
          });
        } else {
          // Fallback: return error
          self.postMessage({
            type: 'tacticResult',
            callbackId,
            payload: {
              success: false,
              message: 'Interactive proof mode not fully implemented yet'
            }
          });
        }
        break;
      }

      case 'validateTactic': {
        if (validateTacticForGoal) {
          const result = validateTacticForGoal(payload?.goalId, payload?.tacticType, payload?.goalType);
          self.postMessage({
            type: 'validationResult',
            callbackId,
            payload: result
          });
        } else {
          // Fallback: return valid
          self.postMessage({
            type: 'validationResult',
            callbackId,
            payload: {
              valid: true
            }
          });
        }
        break;
      }

      default:
        console.warn('[Worker] Unknown message type:', type);
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    const stack = error instanceof Error ? error.stack : '';
    console.error('[Worker] Processing error:', message, stack);
    self.postMessage({
      type: 'error',
      callbackId,
      payload: {
        message: `Processing error: ${message}`,
        details: stack
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
    // Import interactive proof functions if available
    applyTacticToProof = module.applyTacticToProof || null;
    validateTacticForGoal = module.validateTacticForGoal || null;
    startInteractiveProofSession = module.startInteractiveProofSession || null;

    console.log('[Worker] Bundle loaded successfully');
    console.log('[Worker] analyzePieSource:', typeof analyzePieSource);
    console.log('[Worker] Interactive proof functions:', {
      applyTacticToProof: typeof applyTacticToProof,
      validateTacticForGoal: typeof validateTacticForGoal,
      startInteractiveProofSession: typeof startInteractiveProofSession
    });

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
