// Core type definitions for Sonic Catharsis

// --- User-facing input model -------------------------------------------------
// incidentText + trigger + intensity. This is what the UI collects and what
// the product actually asks the user — NOT emotion. See trigger.ts for the
// full rationale and the translation layer to the (internal-only) EmotionType
// below. "Trigger" is a domain term — the UI presents this as a 3x3
// classification matrix, not a wheel/field, but the underlying concept
// (which kind of frustration this is) is unchanged.
export type TriggerType =
  | 'injustice'
  | 'failure'
  | 'conflict'
  | 'helplessness'
  | 'overload'
  | 'exhaustion'
  | 'uncertainty'
  | 'absurdity'
  | 'unclassified';

// 11-tier intensity scale (0-10), Spinal Tap "these go to eleven" — see
// STRESS_TIERS in lib/theme.ts for the label/color for each index.
export type StressLevel = number;

export interface TriggerSelection {
  trigger: TriggerType;
  intensity: StressLevel; // 0-10, same scale the old stressLevel used
}

// Physical symptoms — optional, multi-select, sourced from the real
// bodily-sensation items the (tongue-in-cheek) Vitutus study actually
// measured (see lib/symptoms.ts for the citation + full label/Finnish-term
// pairs). Never required to submit; purely additional flavor context for
// the Matcher's "cause" text.
export type PhysicalSymptomType =
  | 'head_exploding'
  | 'muscle_tension'
  | 'heart_pounding'
  | 'accelerated_breathing'
  | 'weakness'
  | 'legs_limp';

// Duration/persistence — optional, single-select, 5 evenly-spaced tiers.
// Distinct from Track.duration below (playback length) despite the name
// overlap — this is how long the vitutus episode has been going on. See
// lib/duration.ts for the citation/rationale and per-tier severity value.
export type DurationType =
  | 'just_now'
  | 'about_hour'
  | 'several_hours'
  | 'since_yesterday'
  | 'several_days';

// --- Internal recommendation-engine model ------------------------------------
// 8 basic emotions, as 4 opposing pairs. This is NOT the user-facing input model above
// — nothing in the UI asks "which emotion". It's the vocabulary the
// deterministic genre-mapping engine, matcher/curator prompts, and API
// contracts are still keyed on. TriggerType is translated into this via
// triggerToEmotion() (lib/trigger.ts) at the API boundary only, so the
// existing recommendation engine keeps working without a rewrite.
export type CoreEmotionType =
  | 'joy'
  | 'trust'
  | 'fear'
  | 'surprise'
  | 'sadness'
  | 'disgust'
  | 'anger'
  | 'anticipation';

export type EmotionType = CoreEmotionType;

export type MetalSubgenre =
  | 'death'
  | 'black'
  | 'power'
  | 'doom'
  | 'thrash'
  | 'progressive'
  | 'symphonic'
  | 'folk'
  | 'industrial'
  | 'nu-metal';

export interface Track {
  id: string;
  name: string;
  artist: string;
  album: string;
  genre: string;
  previewUrl?: string;
  bandcampUrl?: string;
  artworkUrl?: string;
  duration?: number;
  explicitContent?: boolean;
}

export interface Playlist {
  id: string;
  name: string;
  description?: string;
  tracks: Track[];
}