import { describe, expect, it } from 'vitest';
import { SETBACK_PERCENT, etaText, progressAt, statusText } from './irritation-loader';

describe('progressAt', () => {
  it('starts at 0, never decreases, and stalls at 99 without reaching 100', () => {
    expect(progressAt(0)).toBe(0);
    let prev = 0;
    for (let s = 0; s <= 120; s += 0.5) {
      const p = progressAt(s);
      expect(p).toBeGreaterThanOrEqual(prev);
      expect(p).toBeLessThan(100);
      prev = p;
    }
    expect(progressAt(60)).toBe(99);
    expect(progressAt(600)).toBe(99);
  });

  it('is fast at first and slow at the end', () => {
    expect(progressAt(3)).toBeGreaterThanOrEqual(60);
    expect(progressAt(20) - progressAt(12)).toBeLessThan(10);
  });

  it('restarts from the setback percent after being sent back', () => {
    expect(progressAt(0, 1)).toBe(SETBACK_PERCENT);
    expect(progressAt(1000, 1)).toBe(99);
  });
});

describe('etaText', () => {
  it('says calculating at first, then a minute, then more minutes after each setback', () => {
    expect(etaText(0)).toMatch(/Calculating/);
    expect(etaText(30)).toBe('About 1 minute remaining');
    expect(etaText(30, 1)).toBe('About 2 minutes remaining');
    expect(etaText(30, 2)).toBe('About 3 minutes remaining');
  });
});

describe('statusText', () => {
  it('thanks the patient for their patience after a setback', () => {
    expect(statusText(70, 0)).toBe('Buffering…');
    expect(statusText(99, 0)).toBe('Almost there…');
    expect(statusText(70, 1)).toBe('Thank you for your patience.');
  });
});
