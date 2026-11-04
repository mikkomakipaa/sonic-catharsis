import { describe, expect, it } from 'vitest';
import {
  DODGE_LIMIT,
  DODGE_START,
  SETBACK_PERCENT,
  canBeCaught,
  etaText,
  nextDodge,
  progressAt,
  statusText,
} from './irritation-loader';

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
    expect(statusText(70, 0)).toBe('Analysing…');
    expect(statusText(99, 0)).toBe('Almost there…');
    expect(statusText(70, 1)).toBe('Thank you for your patience.');
  });
});

describe('dodging', () => {
  it('can only be caught after the dodge limit', () => {
    expect(canBeCaught(DODGE_LIMIT - 1)).toBe(false);
    expect(canBeCaught(DODGE_LIMIT)).toBe(true);
  });

  it('always hops a decent distance and stays in range', () => {
    let pos = DODGE_START;
    let seed = 1;
    const random = () => ((seed = (seed * 16807) % 2147483647) / 2147483647);
    for (let i = 0; i < 200; i++) {
      const next = nextDodge(pos, random);
      expect(Math.hypot(next.x - pos.x, next.y - pos.y)).toBeGreaterThanOrEqual(0.4);
      for (const v of [next.x, next.y]) {
        expect(v).toBeGreaterThanOrEqual(0);
        expect(v).toBeLessThanOrEqual(1);
      }
      pos = next;
    }
  });

  it('falls back to the opposite corner when the random hops are all too short', () => {
    expect(nextDodge({ x: 0.1, y: 0.1 }, () => 0.1)).toEqual({ x: 1, y: 1 });
  });
});
