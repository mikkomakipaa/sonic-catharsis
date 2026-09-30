import { describe, expect, it, vi } from 'vitest';
import { createWithRetry, extractJsonObject, getResponseText } from '@/lib/openai-response';

type Reply = Parameters<typeof getResponseText>[0];
const reply = (text: string) => ({ output_text: text, output: [] }) as Reply;

describe('getResponseText', () => {
  it('prefers output_text', () => {
    expect(getResponseText(reply('hi'))).toBe('hi');
  });

  it('falls back to message output_text content', () => {
    const response = {
      output_text: '',
      output: [{ type: 'message', content: [{ type: 'output_text', text: 'from output' }] }],
    } as unknown as Reply;
    expect(getResponseText(response)).toBe('from output');
  });

  it('returns empty string when there is no text', () => {
    expect(getResponseText(reply(''))).toBe('');
  });
});

describe('extractJsonObject', () => {
  it('extracts an object wrapped in prose or a code fence', () => {
    expect(extractJsonObject('Sure!\n```json\n{"a":1}\n```')).toEqual({ a: 1 });
  });

  it('returns null for prose, arrays, and malformed JSON', () => {
    expect(extractJsonObject('no json here')).toBeNull();
    expect(extractJsonObject('[1,2]')).toBeNull();
    expect(extractJsonObject('{"a":')).toBeNull();
  });
});

describe('createWithRetry', () => {
  it('retries once, then succeeds', async () => {
    const create = vi.fn().mockResolvedValueOnce(reply('prose')).mockResolvedValueOnce(reply('{"ok":true}'));
    expect(await createWithRetry(create, (json) => json)).toEqual({ ok: true });
    expect(create).toHaveBeenCalledTimes(2);
  });

  it('returns null after two rejected replies', async () => {
    const create = vi.fn().mockResolvedValue(reply('{"ok":false}'));
    expect(await createWithRetry(create, (json) => (json.ok ? json : null))).toBeNull();
    expect(create).toHaveBeenCalledTimes(2);
  });
});
