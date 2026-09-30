import { describe, expect, it } from 'vitest';
import { getDeterministicGenre } from '@/lib/genre-mapping';
import { CoreEmotions } from '@/lib/validation';

describe('getDeterministicGenre', () => {
  it('defaults a missing intensity to tier 5', () => {
    expect(getDeterministicGenre('anger', null)).toEqual(getDeterministicGenre('anger', 5));
  });

  it('clamps and rounds out-of-range intensities', () => {
    expect(getDeterministicGenre('anger', -3)).toEqual(getDeterministicGenre('anger', 0));
    expect(getDeterministicGenre('anger', 42)).toEqual(getDeterministicGenre('anger', 10));
    expect(getDeterministicGenre('anger', 6.6)).toEqual(getDeterministicGenre('anger', 7));
  });

  it('has an entry for every emotion and tier', () => {
    for (const emotion of CoreEmotions) {
      for (let tier = 0; tier <= 10; tier++) {
        expect(getDeterministicGenre(emotion, tier).genre).toBeTruthy();
      }
    }
  });
});
