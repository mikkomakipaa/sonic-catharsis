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

describe('no raw model output in responses (S3)', () => {
  it('matcher reasoning is built from validated fields, not the raw text', async () => {
    const raw = `Preamble the client must never see.\n${JSON.stringify({ subgenre: 'doom metal', sonic_profile, cause: 'Because.', choice: 'Slow.' })}`;
    create.mockResolvedValue({ output_text: raw });
    const json = await (await matcherPOST(post('/api/matcher', JSON.stringify({ emotionData })))).json();
    expect(json.reasoning).toBe('Because.');
    expect(JSON.stringify(json)).not.toContain('Preamble');
  });

  it('matcher reasoning stays non-empty when the model omits cause and choice', async () => {
    create.mockResolvedValue({ output_text: JSON.stringify({ subgenre: 'doom metal', sonic_profile }) });
    const json = await (await matcherPOST(post('/api/matcher', JSON.stringify({ emotionData })))).json();
    expect(json.reasoning).toBe('doom metal');
    expect(json.cause).toBe('');
  });

  it('curator error responses carry no debug payload', async () => {
    create.mockResolvedValue({ output_text: JSON.stringify({ notSelection: true }) });
    const body = JSON.stringify({ analysis: { subgenre: 'death metal', sonic_profile }, emotionData });
    const res = await curatorPOST(post('/api/curator', body));
    expect(res.status).toBe(500);
    expect(await res.json()).toEqual({ error: 'No structured playlist received' });
  });
});

describe('retry instead of fabricated fallbacks (C5/C6)', () => {
  it('matcher retries a prose reply once, then returns 500 rather than salvaging it', async () => {
    create.mockResolvedValue({ output_text: 'Corporate stress.\n\nMetal provides catharsis.' });
    const res = await matcherPOST(post('/api/matcher', JSON.stringify({ emotionData })));
    expect(res.status).toBe(500);
    expect(create).toHaveBeenCalledTimes(2);
  });

  it('curator never returns placeholder artists', async () => {
    create.mockResolvedValue({ output_text: 'Napalm Death\nUndeath' });
    const body = JSON.stringify({ analysis: { subgenre: 'death metal', sonic_profile }, emotionData });
    const res = await curatorPOST(post('/api/curator', body));
    expect(res.status).toBe(500);
    expect(create).toHaveBeenCalledTimes(2);
  });

  it('curator succeeds when the retry returns a valid Selection', async () => {
    create
      .mockResolvedValueOnce({ output_text: 'oops' })
      .mockResolvedValueOnce({ output_text: JSON.stringify({ Selection: [{ artist: 'Undeath', link: null }] }) });
    const body = JSON.stringify({ analysis: { subgenre: 'death metal', sonic_profile }, emotionData });
    const res = await curatorPOST(post('/api/curator', body));
    expect(res.status).toBe(200);
    expect((await res.json()).artists).toEqual([{ artist: 'Undeath', link: null }]);
  });
});
