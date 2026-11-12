import { describe, expect, it } from 'vitest';
import { sceneNotesContext } from './scene-notes-context';

describe('scene notes context', () => {
  it('includes the patient reply even when the model summary omits it', () => {
    const result = sceneNotesContext('The clerk stalled.', [
      { role: 'seppo', text: 'No forms.' },
      { role: 'user', text: 'I wanted a playlist!' },
    ]);
    expect(result).toContain('The clerk stalled.');
    expect(result).toContain('I wanted a playlist!');
  });

  it('keeps the context within the notes API limit, including escaped text', () => {
    const result = sceneNotesContext('A'.repeat(300), [{ role: 'user', text: '\\'.repeat(300) }]);
    expect(result!.length).toBeLessThanOrEqual(300);
    expect(result).toContain('Patient replied:');
  });

  it('uses only the summary when the patient leaves before replying', () => {
    expect(sceneNotesContext('The clerk stalled.', [{ role: 'seppo', text: 'No forms.' }])).toBe('The clerk stalled.');
    expect(sceneNotesContext(undefined, [])).toBeUndefined();
  });
});
