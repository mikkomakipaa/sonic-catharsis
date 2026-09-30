import { describe, expect, it } from 'vitest';
import { getSymptomMeta, isPseudoVitutusProfile } from '@/lib/symptoms';
import type { PhysicalSymptomType } from '@/types';

describe('isPseudoVitutusProfile', () => {
  it('matches exactly {weakness, legs_limp} in either order', () => {
    expect(isPseudoVitutusProfile(['weakness', 'legs_limp'])).toBe(true);
    expect(isPseudoVitutusProfile(['legs_limp', 'weakness'])).toBe(true);
  });

  it('does not match subsets or supersets', () => {
    expect(isPseudoVitutusProfile([])).toBe(false);
    expect(isPseudoVitutusProfile(['weakness'])).toBe(false);
    expect(isPseudoVitutusProfile(['weakness', 'legs_limp', 'heart_pounding'])).toBe(false);
  });
});

describe('getSymptomMeta', () => {
  it('throws on an unknown symptom', () => {
    expect(() => getSymptomMeta('nope' as PhysicalSymptomType)).toThrow();
  });
});
