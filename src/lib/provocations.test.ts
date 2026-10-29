import { describe, expect, it } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';
import { STIMULI, MAX_STIMULI_PER_SESSION, pickStimuli, shouldOfferProvocation } from './provocations';
import { PSEUDO_VITUTUS_STAGE, STAGES, SURFACE } from './theme';
import { TriggerTypes, EmotionDataSchema } from './validation';

describe('STIMULI', () => {
  it('has unique ids and figure numbers', () => {
    expect(new Set(STIMULI.map((s) => s.id)).size).toBe(STIMULI.length);
    expect(new Set(STIMULI.map((s) => s.fig)).size).toBe(STIMULI.length);
  });

  it('covers every trigger', () => {
    for (const trigger of TriggerTypes) {
      expect(STIMULI.some((s) => s.trigger === trigger), trigger).toBe(true);
    }
  });

  it('pre-fills an incident the intake will accept', () => {
    for (const s of STIMULI) {
      const parsed = EmotionDataSchema.safeParse({ primary: 'anger', trigger: s.trigger, event: s.incident, provoked: true });
      expect(parsed.success, s.id).toBe(true);
    }
  });

  it('only points at plate images that exist', () => {
    for (const s of STIMULI.filter((x) => x.image)) {
      expect(fs.existsSync(path.join(process.cwd(), 'public', s.image!)), s.id).toBe(true);
    }
  });
});

describe('shouldOfferProvocation', () => {
  it('offers on Level 0 (pseudo-vitutus) and Stage I only', () => {
    expect(shouldOfferProvocation(PSEUDO_VITUTUS_STAGE)).toBe(true);
    expect(shouldOfferProvocation(STAGES[0])).toBe(true);
    expect(shouldOfferProvocation(SURFACE)).toBe(false);
    for (const stage of STAGES.slice(1)) expect(shouldOfferProvocation(stage), stage.name).toBe(false);
  });
});

describe('pickStimuli', () => {
  it('returns a session of unique stimuli, drawn plates first', () => {
    const picked = pickStimuli();
    expect(picked).toHaveLength(MAX_STIMULI_PER_SESSION);
    expect(new Set(picked.map((s) => s.id)).size).toBe(picked.length);
    const drawnCount = STIMULI.filter((s) => s.image).length;
    const firstUndrawn = picked.findIndex((s) => !s.image);
    expect(firstUndrawn === -1 || firstUndrawn >= Math.min(drawnCount, picked.length)).toBe(true);
  });

  it('never returns more than the pool holds', () => {
    expect(pickStimuli(100)).toHaveLength(STIMULI.length);
  });
});
