import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import vm from 'node:vm';
import { MessageChannel as PlatformMessageChannel } from 'node:worker_threads';

// Deliberately omit Node's process, require and Buffer: these bundles run in
// browsers. This checks worker startup and basic requests, not the full UI.
const browserConsole = { log() {}, warn() {}, error() {} };
const analyzerContext = vm.createContext({ console: browserConsole });
const analyzer = new vm.SourceTextModule(
  await readFile(new URL('../web/pie-worker-bundle.js', import.meta.url), 'utf8'),
  { context: analyzerContext },
);
await analyzer.link(specifier => {
  throw new Error(`Unexpected unbundled import: ${specifier}`);
});
await analyzer.evaluate({ timeout: 5000 });
const analyze = analyzer.namespace.analyzePieSource;
assert.equal(typeof analyze, 'function');

const valid = '(claim n Nat)\n(define n (add1 zero))';
const invalid = "(claim n Nat)\n(define n 'not-a-natural)";
assert.equal(analyze('').diagnostics.length, 0);
const success = analyze(valid);
assert.equal(success.diagnostics.length, 0);
assert.match(success.pretty, /n : Nat/);
assert.ok(analyze(invalid).diagnostics.some(item => item.severity === 'error'));
assert.ok(analyze('(').diagnostics.length > 0);
console.log('PASS: analysis bundle handles valid code, type errors and syntax errors');

const messages = [];
const worker = { postMessage: message => messages.push(message) };
vm.runInNewContext(
  await readFile(new URL('../web/lsp/pie-lsp-worker-bundle.js', import.meta.url), 'utf8'),
  { self: worker, console: browserConsole },
  { timeout: 5000 },
);
assert.equal(typeof worker.onmessage, 'function');
worker.onmessage({ data: { type: 'validate', source: valid } });
assert.equal(messages.at(-1).type, 'validation-result');
assert.equal(messages.at(-1).diagnostics.length, 0);
worker.onmessage({ data: { type: 'validate', source: invalid } });
assert.equal(messages.at(-1).type, 'validation-result');
assert.ok(messages.at(-1).diagnostics.length > 0);
console.log('PASS: language worker returns diagnostics');

const listeners = new Map();
const ports = [];
class BrowserMessageChannel extends PlatformMessageChannel {
  constructor() {
    super();
    ports.push(this.port1, this.port2);
  }
}
const conductorWorker = {
  addEventListener: (name, listener) => listeners.set(name, listener),
  removeEventListener: name => listeners.delete(name),
  postMessage() {},
};
try {
  vm.runInNewContext(
    await readFile(new URL('../dist/index.js', import.meta.url), 'utf8'),
    { self: conductorWorker, console: browserConsole, MessageChannel: BrowserMessageChannel },
    { timeout: 5000, displayErrors: false },
  );
  assert.equal(typeof listeners.get('message'), 'function');
} finally {
  for (const port of ports) port.close();
}
console.log('PASS: Conductor bundle starts without Node globals');
