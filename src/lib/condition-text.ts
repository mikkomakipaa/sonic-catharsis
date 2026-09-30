import { STAGES } from '@/lib/theme';

// The Epicrisis header is the single source of the diagnosis label. The
// Matcher model receives it as severity context, but prose must not restate
// it — this strips any echo of it from the model's cause/choice text.
const STAGE_NAMES_PATTERN = STAGES.map((stage) => stage.name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).join('|');
const STAGE_REFERENCE_PATTERN = new RegExp(
  `\\bStage\\s+(?:I|II|III|IV|V|VI|VII|VIII|IX)\\b(?:\\s*[—-]\\s*(?:${STAGE_NAMES_PATTERN}))?`,
  'gi'
);
const STAGE_NAME_PATTERN = new RegExp(`\\b(?:${STAGE_NAMES_PATTERN})\\b`, 'gi');

export function removeDisplayedCondition(text: string): string {
  if (!text) return text;
  return text
    .replace(STAGE_REFERENCE_PATTERN, '')
    .replace(STAGE_NAME_PATTERN, '')
    .replace(/\b(?:classic|textbook)\s*[:—-]\s*/gi, '')
    .replace(/\b(?:for|with|of)\s*:\s*/gi, '')
    .replace(/\s+([,.;:!?])/g, '$1')
    .replace(/\s{2,}/g, ' ')
    .trim();
}
