/** Local-only metadata. Never pass prompts, responses, URLs, errors or headers here. */
export interface AiCallMeta {
  provider: 'deepseek' | 'runpod' | 'lora';
  operation: 'translation' | 'hint' | 'explanation' | 'prediction' | 'poll' | 'health';
}
export interface AiCallEntry extends AiCallMeta {
  id?: number;
  requestId: string;
  time: string;
  phase: 'started' | 'finished';
  outcome: 'pending' | 'http_ok' | 'http_error' | 'network_error' | 'aborted';
  durationMs?: number;
  status?: number;
}
const DATABASE = 'pie-ai-call-log';
const STORE = 'calls';
export const AI_LOG_LIMIT = 2000;

function openLog(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (typeof indexedDB === 'undefined') return reject(new Error('Local AI log storage is unavailable.'));
    const request = indexedDB.open(DATABASE, 1);
    let expired = false;
    const timer = setTimeout(() => {
      expired = true;
      reject(new Error('Local AI log storage timed out.'));
    }, 1500);
    request.onupgradeneeded = () => {
      if (!request.result.objectStoreNames.contains(STORE)) {
        request.result.createObjectStore(STORE, { keyPath: 'id', autoIncrement: true });
      }
    };
    request.onerror = () => { clearTimeout(timer); reject(new Error('Local AI log storage is unavailable.')); };
    request.onsuccess = () => {
      clearTimeout(timer);
      if (expired) request.result.close();
      else resolve(request.result);
    };
  });
}

/** Runtime whitelist as well as TS types: extra fields never reach storage. */
export function safeAiLogEntry(entry: AiCallEntry): AiCallEntry {
  if (!['deepseek', 'runpod', 'lora'].includes(entry.provider) ||
      !['translation', 'hint', 'explanation', 'prediction', 'poll', 'health'].includes(entry.operation) ||
      !['started', 'finished'].includes(entry.phase) ||
      !['pending', 'http_ok', 'http_error', 'network_error', 'aborted'].includes(entry.outcome) ||
      !/^[0-9a-f-]{36}$/.test(entry.requestId) ||
      !/^\d{4}-\d{2}-\d{2}T[\d:.]+Z$/.test(entry.time)) {
    throw new Error('Invalid AI log metadata.');
  }
  return {
    requestId: entry.requestId, time: entry.time, provider: entry.provider,
    operation: entry.operation, phase: entry.phase, outcome: entry.outcome,
    ...(Number.isFinite(entry.durationMs) && entry.durationMs! >= 0 ? { durationMs: Math.round(entry.durationMs!) } : {}),
    ...(Number.isInteger(entry.status) && entry.status! >= 100 && entry.status! <= 599 ? { status: entry.status } : {}),
  };
}

async function append(entry: AiCallEntry): Promise<void> {
  const clean = safeAiLogEntry(entry);
  const db = await openLog();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE, 'readwrite');
    const timer = setTimeout(() => tx.abort(), 1500);
    const store = tx.objectStore(STORE);
    store.add(clean);
    const count = store.count();
    count.onsuccess = () => {
      let remaining = count.result - AI_LOG_LIMIT;
      if (remaining <= 0) return;
      const cursor = store.openCursor();
      cursor.onsuccess = () => {
        if (cursor.result && remaining-- > 0) {
          cursor.result.delete();
          cursor.result.continue();
        }
      };
    };
    tx.oncomplete = () => { clearTimeout(timer); db.close(); resolve(); };
    tx.onabort = tx.onerror = () => { clearTimeout(timer); db.close(); reject(new Error('Local AI log could not be saved.')); };
  });
}

export async function readAiCallLog(): Promise<AiCallEntry[]> {
  const db = await openLog();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE, 'readonly');
    const timer = setTimeout(() => tx.abort(), 1500);
    const request = tx.objectStore(STORE).getAll();
    tx.oncomplete = () => {
      clearTimeout(timer); db.close();
      try { resolve((request.result as AiCallEntry[]).map(safeAiLogEntry)); }
      catch { reject(new Error('Invalid local AI log.')); }
    };
    tx.onabort = tx.onerror = () => { clearTimeout(timer); db.close(); reject(new Error('Local AI log could not be read.')); };
  });
}

/** Log every HTTP attempt, including polls/retries, in both main thread and worker. */
export async function loggedAiFetch(meta: AiCallMeta, input: string, init?: RequestInit): Promise<Response> {
  const requestId = crypto.randomUUID();
  const entry = { provider: meta.provider, operation: meta.operation, requestId };
  // A storage failure must not break inference; the log viewer reports unavailable storage.
  await append({ ...entry, time: new Date().toISOString(), phase: 'started', outcome: 'pending' }).catch(() => {});
  const start = Date.now();
  let status: number | undefined;
  let outcome: AiCallEntry['outcome'] = 'network_error';
  try {
    const response = await fetch(input, init);
    status = response.status;
    outcome = response.ok ? 'http_ok' : 'http_error';
    return response;
  } catch (error) {
    outcome = init?.signal?.aborted ? 'aborted' : 'network_error';
    throw error;
  } finally {
    await append({ ...entry, time: new Date().toISOString(), phase: 'finished', outcome,
      status, durationMs: Date.now() - start }).catch(() => {});
  }
}
