// Duration/persistence — how long this particular vitutus episode has been
// going on. Inspired by the real Vitutus study treating intensity, duration,
// and frequency as separate characteristics (frequency deliberately isn't
// modeled here — it's about longitudinal pattern across episodes, not this
// episode's severity) — not a literal replication of the study's own
// measurement, which doesn't publish a validated duration-to-severity curve
// either. `value` is a hand-tuned, evenly-spaced 0-1 product-model
// assumption, not linear "hours / max_hours" (ten hours isn't ten times
// worse than one). Optional, single-select; purely additional flavor context
// plus a small (5%) contribution to getActiveStage()'s severity blend — see
// lib/theme.ts.
import type { DurationType } from '@/types';

export interface DurationMeta {
  type: DurationType;
  label: string;
  value: number; // 0-1, ascending
}

// Labels lean into the deadpan-clinical/absurd-diagnosis voice used
// elsewhere (matching "WHAT KIND OF BULLSHIT WAS IT?", "BEGIN DIAGNOSIS")
// rather than plain time ranges. FRESH -> SIMMERING -> STEWING keep one
// consistent cooking-decay metaphor as it escalates; OVERNIGHT and NOW A
// LIFESTYLE are the deliberate register-breaks (literal time-of-day, then
// the punchline) — placed at the two tiers that have earned an escalation
// beyond the cooking metaphor, not before (an earlier ENTRENCHED draft for
// "several hours" read as MORE severe than "since yesterday", undercutting
// the escalation — STEWING fixes that ordering).
export const DURATION_TIERS: DurationMeta[] = [
  { type: 'just_now', label: 'Fresh', value: 0.0 },
  { type: 'about_hour', label: 'Simmering', value: 0.25 },
  { type: 'several_hours', label: 'Stewing', value: 0.5 },
  { type: 'since_yesterday', label: 'Overnight', value: 0.75 },
  { type: 'several_days', label: 'Now a lifestyle', value: 1.0 },
];

export function getDurationMeta(type: DurationType): DurationMeta {
  const meta = DURATION_TIERS.find((d) => d.type === type);
  if (!meta) throw new Error(`Unknown duration type: ${type}`);
  return meta;
}
