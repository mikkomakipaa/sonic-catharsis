import { describe, expect, it } from 'vitest';
import { encodeWav, renderRecorderClip } from './recorder-clip';

const RATE = 8000; // low rate keeps the tests fast

describe('renderRecorderClip', () => {
  it('is deterministic for a given seed and differs between seeds', () => {
    const a = renderRecorderClip({ sampleRate: RATE, seed: 7 });
    const b = renderRecorderClip({ sampleRate: RATE, seed: 7 });
    const c = renderRecorderClip({ sampleRate: RATE, seed: 8 });
    expect(Array.from(a)).toEqual(Array.from(b));
    expect(Array.from(a)).not.toEqual(Array.from(c));
  });

  it('is audible and never clips', () => {
    const clip = renderRecorderClip({ sampleRate: RATE });
    const peak = clip.reduce((max, s) => Math.max(max, Math.abs(s)), 0);
    expect(peak).toBeGreaterThan(0.3);
    expect(peak).toBeLessThanOrEqual(0.6 + 1e-6);
  });

  it('gets faster every loop, so more loops are not proportionally longer', () => {
    const one = renderRecorderClip({ sampleRate: RATE, loops: 1 }).length;
    const four = renderRecorderClip({ sampleRate: RATE, loops: 4 }).length;
    expect(four).toBeGreaterThan(one);
    expect(four).toBeLessThan(one * 4);
  });

  it('cuts the final loop short of the closing note', () => {
    // Same tempo schedule up to the last loop, so dropping the last note
    // makes 2 loops shorter than the sum of two full loops would be.
    const full = renderRecorderClip({ sampleRate: RATE, loops: 1 }).length;
    const two = renderRecorderClip({ sampleRate: RATE, loops: 2 }).length;
    const secondLoopLowerBound = full / 1.1; // loop 2 runs 10% faster
    expect(two).toBeLessThan(full + secondLoopLowerBound);
  });
});

describe('encodeWav', () => {
  it('writes a valid mono 16-bit PCM header and clamps samples', () => {
    const wav = encodeWav(new Float32Array([0, 1, -1, 2]), RATE);
    const view = new DataView(wav);
    const tag = (o: number) => String.fromCharCode(...[0, 1, 2, 3].map((i) => view.getUint8(o + i)));
    expect([tag(0), tag(8), tag(12), tag(36)]).toEqual(['RIFF', 'WAVE', 'fmt ', 'data']);
    expect(wav.byteLength).toBe(44 + 8);
    expect(view.getUint32(24, true)).toBe(RATE);
    expect(view.getUint32(40, true)).toBe(8);
    expect(view.getInt16(46, true)).toBe(32767);
    expect(view.getInt16(48, true)).toBe(-32768);
    expect(view.getInt16(50, true)).toBe(32767);
  });
});
