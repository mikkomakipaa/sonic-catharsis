// The Trigger — situation-first input model. Replaces "which emotion are you
// feeling" with "what kind of frustration was this". See docs/model.md for
// the full rationale. "Trigger" is a domain term: the UI presents these as a
// 3x3 classification matrix (a deadpan intake-form checklist), not a spatial
// field or wheel, so this file carries no layout/visual metadata — just the
// vocabulary and the translation layer below.
//
// This file is the ONE place that bridges the user-facing trigger concept to
// the old (internal-only) EmotionType the deterministic genre-mapping engine
// and matcher/curator prompts are still keyed on. That engine isn't being
// rewritten in this pass — triggerToEmotion() is a deliberate, documented
// compatibility shim, not a claim that e.g. "injustice IS anger". Severity
// lives entirely on the separate intensity axis; this mapping only anchors
// which corner of the existing genre matrix a trigger borrows its sound
// from. Longer term this whole shim goes away once the recommendation
// engine derives a sonic profile directly from (incidentText, trigger,
// intensity) instead of via EmotionType.
import type { TriggerType, EmotionType } from '@/types';

export interface TriggerMeta {
  type: TriggerType;
  label: string;
  description: string;
}

// Order matches the classification grid's reading order (row-major) — see
// ClassificationGrid.tsx, which renders this array directly rather than
// re-specifying the layout. 8 items: an even 2x4 on the mobile breakpoint,
// 3+3+2 on desktop's 3-column grid. The former 9th catch-all ("Other
// Bullshit"/unclassified) was removed — every situation is expected to fit
// one of these eight.
export const TRIGGER_TYPES: TriggerMeta[] = [
  { type: 'injustice', label: 'Injustice', description: 'Something is unfair, unreasonable, or unacceptable.' },
  { type: 'failure', label: 'Failure', description: 'Something was attempted and did not work.' },
  { type: 'conflict', label: 'Conflict', description: 'Another person is actively creating friction.' },
  { type: 'helplessness', label: 'Helplessness', description: 'The situation cannot meaningfully be influenced.' },
  { type: 'overload', label: 'Overload', description: 'Too many demands or problems are happening simultaneously.' },
  { type: 'exhaustion', label: 'Exhaustion', description: 'Capacity is depleted; even small problems now matter.' },
  { type: 'uncertainty', label: 'Uncertainty', description: 'The outcome or situation is unclear or unpredictable.' },
  { type: 'absurdity', label: 'Absurdity', description: 'The situation is irrational, pointless, or comically stupid.' },
];

export function getTriggerMeta(type: TriggerType): TriggerMeta {
  const meta = TRIGGER_TYPES.find((t) => t.type === type);
  if (!meta) throw new Error(`Unknown trigger type: ${type}`);
  return meta;
}

// Deliberate 1:1 anchor into the existing emotion-keyed engine — chosen for
// tonal fit, not severity. E.g. absurdity -> joy lets a darkly funny, low-
// stakes situation land in the wry/upbeat corner of the genre matrix instead
// of being forced into "anger" just because it's still annoying.
const TRIGGER_TO_EMOTION: Record<TriggerType, EmotionType> = {
  injustice: 'anger',
  conflict: 'disgust',
  failure: 'sadness',
  helplessness: 'fear',
  overload: 'surprise',
  exhaustion: 'trust',
  uncertainty: 'anticipation',
  absurdity: 'joy',
};

export function triggerToEmotion(type: TriggerType): EmotionType {
  return TRIGGER_TO_EMOTION[type];
}
