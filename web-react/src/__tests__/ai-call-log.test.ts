import { afterEach, describe, expect, it, vi } from 'vitest';
import { loggedAiFetch, readAiCallLog, safeAiLogEntry, type AiCallEntry } from '@pie/solver/ai-call-log';

afterEach(() => { vi.unstubAllGlobals(); vi.restoreAllMocks(); });

const entry: AiCallEntry = {
  provider: 'deepseek', operation: 'translation', requestId: '00000000-0000-4000-8000-000000000000',
  time: '2026-10-01T10:00:00.000Z', phase: 'finished', outcome: 'http_ok', status: 200, durationMs: 40,
};

describe('private local AI log', () => {
  it('drops all unexpected fields, including credentials and proof text', () => {
    const input = { ...entry, apiKey: 'secret', headers: { Authorization: 'secret' }, url: 'private-url',
      prompt: 'private-proof', response: 'private-output', error: 'secret' };
    expect(safeAiLogEntry(input)).toEqual(entry);
    expect(JSON.stringify(safeAiLogEntry(input))).not.toMatch(/secret|private/);
  });
  it('does not allow free-form strings in provider metadata', () => {
    expect(() => safeAiLogEntry({ ...entry, provider: 'secret' } as unknown as AiCallEntry)).toThrow();
  });
  it('never throws inference away when local storage is unavailable', async () => {
    vi.stubGlobal('indexedDB', undefined);
    const reply = new Response('ok');
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(reply));
    expect(await loggedAiFetch({ provider: 'runpod', operation: 'prediction' }, 'https://example.test')).toBe(reply);
    await expect(readAiCallLog()).rejects.toThrow('unavailable');
  });
  it('preserves network errors without serializing their content', async () => {
    vi.stubGlobal('indexedDB', undefined);
    const error = new Error('do not log this secret');
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(error));
    await expect(loggedAiFetch({ provider: 'lora', operation: 'health' }, 'https://example.test')).rejects.toBe(error);
  });
});
