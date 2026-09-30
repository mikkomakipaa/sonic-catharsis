import { beforeEach, describe, expect, it, vi } from 'vitest';
import { NextRequest } from 'next/server';

const create = vi.fn();
vi.mock('openai', () => ({
  default: class {
    responses = { create };
  },
}));

const { POST: matcherPOST } = await import('@/app/api/matcher/route');
const { POST: curatorPOST } = await import('@/app/api/curator/route');

const post = (url: string, body: string) =>
  new NextRequest(`http://localhost${url}`, { method: 'POST', body, headers: { 'Content-Type': 'application/json' } });

const emotionData = { primary: 'anger', trigger: 'injustice', stressLevel: 7, event: 'Printer jammed', duration: 'about_hour' };
const sonic_profile = { activation: 'driving', agency: 'assertion', friction: 'abrasive', cognitive_density: 'direct', weight: 'heavy' };

beforeEach(() => create.mockReset());

describe('/api/matcher', () => {
  it('returns 400 for a malformed JSON body without calling OpenAI', async () => {
    const res = await matcherPOST(post('/api/matcher', '{not json'));
    expect(res.status).toBe(400);
    expect(create).not.toHaveBeenCalled();
  });

  it('strips unknown keys and falls back to the anchor for an invalid model subgenre', async () => {
    create.mockResolvedValue({
      output_text: JSON.stringify({ subgenre: 'x'.repeat(500), sonic_profile, cause: 'Because.', choice: 'Loud.', injected: 'nope' }),
    });
    const res = await matcherPOST(post('/api/matcher', JSON.stringify({ emotionData })));
    const json = await res.json();
    expect(res.status).toBe(200);
    expect(json.analysis.injected).toBeUndefined();
    expect(json.analysis.subgenre).toBe('war metal'); // anger @ tier 7 anchor
  });
});

describe('/api/curator', () => {
  it('returns 400 for a malformed JSON body without calling OpenAI', async () => {
    const res = await curatorPOST(post('/api/curator', '{not json'));
    expect(res.status).toBe(400);
    expect(create).not.toHaveBeenCalled();
  });

  it('rejects an oversized subgenre without calling OpenAI', async () => {
    const body = JSON.stringify({ analysis: { subgenre: 'a'.repeat(5000), sonic_profile }, emotionData });
    const res = await curatorPOST(post('/api/curator', body));
    expect(res.status).toBe(400);
    expect(create).not.toHaveBeenCalled();
  });

  it('returns only schema-validated artist fields', async () => {
    create.mockResolvedValue({
      output_text: JSON.stringify({ Selection: [{ artist: 'Undeath', link: null, secret: 'x' }] }),
    });
    const body = JSON.stringify({ analysis: { subgenre: 'death metal', sonic_profile }, emotionData });
    const res = await curatorPOST(post('/api/curator', body));
    expect(res.status).toBe(200);
    expect((await res.json()).artists).toEqual([{ artist: 'Undeath', link: null }]);
  });
});
