import { useState } from 'react';
import { readAiCallLog, AI_LOG_LIMIT, type AiCallEntry } from '@pie/solver/ai-call-log';

export function AiCallLogPanel() {
  const [entries, setEntries] = useState<AiCallEntry[]>([]);
  const [message, setMessage] = useState('');
  const [busy, setBusy] = useState(false);
  async function load(download = false) {
    setBusy(true);
    try {
      const records = await readAiCallLog();
      setEntries(records);
      setMessage(`${records.length} local log events`);
      if (download) {
        const blob = new Blob([records.map(record => JSON.stringify(record)).join('\n') + '\n'], { type: 'application/x-ndjson' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `pie-ai-calls-${new Date().toISOString().replace(/[:.]/g, '-')}.jsonl`;
        link.click();
        setTimeout(() => URL.revokeObjectURL(url), 1000);
      }
    } catch {
      setMessage('Local log storage is unavailable. Calls may not have been recorded.');
    } finally { setBusy(false); }
  }
  return <section className="mt-3 rounded border p-3 text-xs" aria-label="Local AI call logs">
    <p className="font-medium">AI Call Logs — stored on this device</p>
    <p className="my-2 text-muted-foreground">Last {AI_LOG_LIMIT} events in this browser. No keys, URLs, proof text, prompts or model responses. HTTP OK does not mean the tactic was valid. Started without finished can indicate an interrupted request.</p>
    <div className="flex gap-2">
      <button className="rounded border px-2 py-1" disabled={busy} onClick={() => load()}>View / refresh AI logs</button>
      <button className="rounded border px-2 py-1" disabled={busy} onClick={() => load(true)}>Export AI logs (JSONL)</button>
    </div>
    <p role="status" className="my-2">{message}</p>
    {entries.length > 0 && <pre className="max-h-48 overflow-auto whitespace-pre-wrap" aria-label="AI call log entries">{entries.slice(-30).reverse().map(e => `${e.time} ${e.provider} ${e.operation} ${e.phase} ${e.outcome}${e.status ? ` HTTP ${e.status}` : ''}${e.durationMs !== undefined ? ` ${e.durationMs}ms` : ''}`).join('\n')}</pre>}
  </section>;
}
