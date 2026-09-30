import { describe, expect, it } from 'vitest';
import { removeDisplayedCondition } from '@/lib/condition-text';

describe('removeDisplayedCondition', () => {
  it('strips a full "Stage N — Name" reference', () => {
    expect(removeDisplayedCondition('A textbook case of Stage VII — Raivovitutus, caused by email.'))
      .toBe('A textbook case of, caused by email.');
  });

  it('strips a bare stage name case-insensitively', () => {
    expect(removeDisplayedCondition('Pure vitutus maximus energy.')).toBe('Pure energy.');
  });

  it('leaves unrelated prose untouched', () => {
    expect(removeDisplayedCondition('The printer jammed again.')).toBe('The printer jammed again.');
  });

  it('passes empty input through', () => {
    expect(removeDisplayedCondition('')).toBe('');
  });
});
