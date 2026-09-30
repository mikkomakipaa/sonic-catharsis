import { describe, expect, it } from 'vitest';
import { getActiveStage, PSEUDO_VITUTUS_STAGE, STAGES, SURFACE } from '@/lib/theme';
import type { PhysicalSymptomType } from '@/types';

const ALL_SYMPTOMS: PhysicalSymptomType[] = [
  'head_exploding', 'muscle_tension', 'heart_pounding',
  'accelerated_breathing', 'weakness', 'legs_limp',
];

describe('getActiveStage', () => {
  it('returns SURFACE when no intensity has been chosen', () => {
    expect(getActiveStage(null)).toBe(SURFACE);
  });

  it('returns Stage I, not SURFACE, for a submitted minimal reading', () => {
    expect(getActiveStage(0, [], 'just_now')).toBe(STAGES[0]);
  });

  it('caps an explicit 10/10 with no symptoms at Stage VIII', () => {
    expect(getActiveStage(10).roman).toBe('VIII');
  });

  it('reaches Stage IX only with intensity plus bodily/duration signal', () => {
    expect(getActiveStage(10, ALL_SYMPTOMS.slice(0, 4), 'several_days').roman).toBe('IX');
  });

  it('returns Level 0 for exactly {weakness, legs_limp} at any intensity', () => {
    for (const intensity of [0, 5, 10]) {
      expect(getActiveStage(intensity, ['weakness', 'legs_limp'], 'several_days')).toBe(PSEUDO_VITUTUS_STAGE);
    }
  });

  it('keeps Level 0 distinct from SURFACE by reference despite equal index', () => {
    expect(PSEUDO_VITUTUS_STAGE).not.toBe(SURFACE);
    expect(PSEUDO_VITUTUS_STAGE.index).toBe(SURFACE.index);
  });

  it('is monotonic in intensity with other inputs fixed', () => {
    let previous = 0;
    for (let intensity = 0; intensity <= 10; intensity++) {
      const { index } = getActiveStage(intensity, ['muscle_tension'], 'about_hour');
      expect(index).toBeGreaterThanOrEqual(previous);
      previous = index;
    }
  });
});
