// Minimal test worker - no imports except comlink
import * as Comlink from 'comlink';

console.log('[TestWorker] Script loaded!');

const api = {
  test: () => {
    console.log('[TestWorker] test() called');
    return 'Worker is working!';
  },
  echo: (msg: string) => {
    console.log('[TestWorker] echo() called with:', msg);
    return `Echo: ${msg}`;
  },
};

Comlink.expose(api);

console.log('[TestWorker] API exposed');
