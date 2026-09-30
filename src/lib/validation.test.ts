import { describe, expect, it } from 'vitest';
import { MatcherRequestSchema, validateRequest } from '@/lib/validation';

const validEmotionData = {
  primary: 'anger',
  trigger: 'injustice',
  stressLevel: 7,
  event: 'Meeting that could have been an email',
  duration: 'about_hour',
};

describe('MatcherRequestSchema', () => {
  it('accepts a valid request and defaults symptoms to []', () => {
    const result = validateRequest(MatcherRequestSchema, { emotionData: validEmotionData });
    expect(result.success).toBe(true);
    expect(result.data?.emotionData.symptoms).toEqual([]);
  });

  it('rejects an unknown trigger with a path-prefixed message', () => {
    const result = validateRequest(MatcherRequestSchema, { emotionData: { ...validEmotionData, trigger: 'boredom' } });
    expect(result.success).toBe(false);
    expect(result.error).toBe('emotionData.trigger: Invalid trigger type');
  });

  it('rejects an event longer than 500 characters', () => {
    const result = validateRequest(MatcherRequestSchema, { emotionData: { ...validEmotionData, event: 'x'.repeat(501) } });
    expect(result.success).toBe(false);
  });

  it('rejects a stress level outside 0-10', () => {
    const result = validateRequest(MatcherRequestSchema, { emotionData: { ...validEmotionData, stressLevel: 11 } });
    expect(result.success).toBe(false);
  });
});
