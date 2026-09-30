import { afterEach, describe, expect, it, vi } from 'vitest';

vi.mock('openai', () => ({ default: class {} }));

afterEach(() => {
  vi.unstubAllEnvs();
  vi.resetModules();
});

describe('getOpenAI', () => {
  it('throws a named error when OPENAI_API_KEY is missing', async () => {
    vi.stubEnv('OPENAI_API_KEY', '');
    const { getOpenAI } = await import('@/lib/openai-client');
    expect(() => getOpenAI()).toThrow('OPENAI_API_KEY is not set');
  });

  it('returns the same client instance on repeat calls', async () => {
    vi.stubEnv('OPENAI_API_KEY', 'test-key');
    const { getOpenAI } = await import('@/lib/openai-client');
    expect(getOpenAI()).toBe(getOpenAI());
  });
});
