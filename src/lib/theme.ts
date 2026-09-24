// THE RITE — shared design tokens, copy, and pure helpers for the redesigned UI.
// No JSX here; consumed by page.tsx and the panel/selector components.

import type { EmotionType } from '@/types';

export const EASE = 'cubic-bezier(0.25, 1, 0.5, 1)';

// --- Neutral text tokens -----------------------------------------------------
// Three intentional levels, not a gradient of "however faint felt right in
// the moment" — the softer redesign drifted into using one pale decorative
// tone (TEXT_DECORATIVE below) for actual functional text (labels,
// instructions, disabled states), which reads as "faded ink" rather than
// the intended "aged paper / editorial restraint." Rule of thumb: if it's
// meaningful text a user needs to read, it's at least TEXT_SECONDARY —
// TEXT_DECORATIVE is reserved for non-text structure (rules, borders,
// inactive dots).
export const TEXT_PRIMARY = '#2f2e2b'; // headings, entered/selected content
export const TEXT_SECONDARY = '#5c584f'; // labels, interaction text, instructions, disabled-but-readable text
export const TEXT_TERTIARY = '#7d7869'; // brand eyebrow, genuinely de-emphasized metadata
export const TEXT_DECORATIVE = '#a6a297'; // NOT for text — divider lines, inactive dots, borders only

// Shared "section eyebrow" style for the landing page's three question
// headers (incident label, classification prompt, intensity prompt) — one
// token so all three stay visually identical instead of three separately
// hand-tuned inline styles (which is how they drifted apart originally).
// These are questions, not captions: weight 700 and TEXT_SECONDARY (not
// TEXT_TERTIARY) give them more authority than the answer/category labels
// below them, which stay at 500 — a deliberate question > answer contrast,
// not a mistake to reconcile with the category labels' weight.
export const SECTION_LABEL_STYLE = {
  fontSize: '11px',
  fontWeight: 700,
  letterSpacing: '0.12em',
  color: TEXT_SECONDARY,
} as const;

// Shared "carved into obsidian" panel styling — no raised card edges, the
// surface reads as recessed into the black page rather than a floating box.
export const PANEL_BASE_CLASS =
  'rounded-md bg-white/[0.015] backdrop-blur-sm transition-colors duration-300';
export const PANEL_SHADOW = {
  boxShadow:
    'inset 0 1px 3px rgba(0,0,0,0.6), inset 0 0 0 0.5px rgba(255,255,255,0.04), inset 0 -1px 0 rgba(255,255,255,0.02)',
};

// Same recessed treatment for smaller inline elements (center marker,
// indicator pips) that should read as pressed into their surface, not
// popped out of it with a raised bevel.
export const EMBED_SHADOW = 'inset 0 2px 5px rgba(0,0,0,0.65), inset 0 -1px 0 rgba(255,255,255,0.03)';

// Primary call-to-action (Submit / Descend) — a refined matte solid, not a
// glossy/neon treatment or a bordered-outline button: deep brown-black with
// a soft shadow and a warm coral/amber text accent for contrast.
export const CTA_BACKGROUND = '#241a17';
export const CTA_SHADOW = '0 4px 14px -4px rgba(36,26,23,0.45)';
export const CTA_TEXT_SHADOW = 'none';
export const CTA_TEXT_COLOR = '#e8a672';

// --- Intensity tiers (0-10, "these go to eleven") --------------------------
// The wheel's radial drag snaps directly to one of these 11 indices — no
// separate string-label layer, the tier index *is* the stress value sent to
// the matcher API. Single source of truth for label + color per tier.
export const MAX_STRESS_INTENSITY = 10;
// UI-facing intensity is always shown as a plain 1-11 number (never the
// thematic tier label below) to avoid a second, ambiguous "emotional" label
// competing with the wheel's actual emotion readout. The thematic labels
// stay in STRESS_TIERS/STRESS_VALUE_TO_LABEL purely as descriptive context
// fed to the matcher/curator prompts — not for display.
export const TOTAL_INTENSITY_LEVELS = MAX_STRESS_INTENSITY + 1;

// labelFi: an undocumented "Vitutusmittari" easter egg — real, colloquial
// Finnish anger-escalation slang, distinct from the STAGES' own "vitutus"
// compounds (Kytevä vitutus, Raivovitutus, etc.) so the two vocabularies
// don't collide. Only ever shown to a detected fi-* browser locale — see
// IntensitySlider.tsx. Never sent to the matcher/curator prompts.
export const STRESS_TIERS: { label: string; labelFi: string; color: string }[] = [
  { label: 'Intolerable lightness', labelFi: 'Turhauma', color: '#10b981' },
  { label: 'Low', labelFi: 'Kiukku', color: '#22c55e' },
  { label: 'Optimum', labelFi: 'Ärsytys', color: '#84cc16' },
  { label: 'Moderate', labelFi: 'Suutus', color: '#eab308' },
  { label: 'Overload', labelFi: 'Vitutus', color: '#f97316' },
  { label: 'Burnout', labelFi: 'Raivo', color: '#ea580c' },
  { label: 'Breaking Point', labelFi: 'Täysi raivo', color: '#dc2626' },
  { label: 'Multi-climax', labelFi: 'Vimma', color: '#991b1b' },
  { label: 'Total Meltdown', labelFi: 'Vittuuntuminen', color: '#7f1d1d' },
  { label: 'Point of No Return', labelFi: 'Täysvittuuntuminen', color: '#581c87' },
  // ELEVEN breaks the low->high color ramp on purpose — it sits outside the
  // normal radial band entirely, so it gets a shock color instead of the
  // next shade of dark red, matching the special emphasis in the CTA.
  { label: 'ELEVEN', labelFi: 'Multihuipennus', color: '#fbbf24' },
];

// The matcher/curator prompts expect a human-readable stress *description*
// ("Overload", "Moderate", ...), not our raw numeric tier — kept as a
// separate lookup since the prompt text refers to labels, not indices.
export const STRESS_VALUE_TO_LABEL: Record<number, string> = Object.fromEntries(
  STRESS_TIERS.map((tier, index) => [index, tier.label])
);

export const LOADING_MESSAGES = {
  analyzing: [
    'Summoning the void...',
    'Consulting the metal gods...',
    'Calibrating your rage...',
    'Measuring existential dread...',
    'Analyzing your suffering...',
    'Communing with darkness...',
    'Brewing catharsis...',
  ],
  curating: [
    'Finding the perfect brutality...',
    'Curating sonic violence...',
    'Selecting auditory chaos...',
    'Matching your vibe to riffs...',
    'Downloading despair...',
    'Compiling emotional damage...',
    'Generating cathartic noise...',
  ],
} as const;

export function pickRandom<T>(items: readonly T[]): T {
  return items[Math.floor(Math.random() * items.length)];
}

// --- The Nine Stages of Vitutus ----------------------------------------------
// Replaces the old Dante circle names. "Vitutus" is Finnish slang for a
// simmering, absurd, distinctly Finnish flavor of irritation/pissed-off-ness
// — grounded in a real (tongue-in-cheek) academic instrument, the
// "Vitutusviisari" ("vitutus gauge"), see the study QR on ReceiptCard.
// Tiers III, IV, VI, and IX borrow the study's own terms (perusvitutus,
// keskivaikea vitutus, syvävitutus, vitutus maximus); the rest are original
// but built in the same register — not claimed as verbatim study language.
export interface Stage {
  index: number; // 0 = surface (nothing selected yet), 1-9 = the stages
  roman: string;
  name: string;
  color: string; // hex
}

export const SURFACE: Stage = {
  index: 0,
  roman: '—',
  name: 'The Surface',
  color: '#52525b',
};

export const STAGES: Stage[] = [
  { index: 1, roman: 'I', name: 'Lievä ärsytys', color: '#71717a' },
  { index: 2, roman: 'II', name: 'Kytevä vitutus', color: '#a855f7' },
  { index: 3, roman: 'III', name: 'Perusvitutus', color: '#4d7c0f' },
  { index: 4, roman: 'IV', name: 'Keskivaikea vitutus', color: '#ca8a04' },
  { index: 5, roman: 'V', name: 'Kova vitutus', color: '#7f1d1d' },
  { index: 6, roman: 'VI', name: 'Syvävitutus', color: '#ea580c' },
  { index: 7, roman: 'VII', name: 'Raivovitutus', color: '#dc2626' },
  { index: 8, roman: 'VIII', name: 'Täysvitutus', color: '#a16207' },
  { index: 9, roman: 'IX', name: 'Vitutus maximus', color: '#7dd3fc' },
];

// --- Deterministic stage selection: stressValue -> Stage --------------------
// Intensity (the user's own "how bad is it" 0-10 slider) is the *only*
// driver — no per-emotion tilt. An earlier version gave each emotion a
// widely-spread "base" stage and let stress only nudge it by +/-2 (or, in a
// later revision, a small +/-1/+2 tilt on top of intensity): both versions
// let two people who report the same intensity land on different stage
// numbers depending on which emotion they picked, which drifted out of sync
// with getDeterministicGenre()'s own per-emotion severity curve in
// genre-mapping.ts once that curve was independently smoothed (tier 5 tuned
// to read as "genuinely moderate" for every emotion). Emotion's character
// now comes through entirely via the genre table's own per-emotion,
// per-tier entries — this stage number is a plain, emotion-agnostic reading
// of "how deep" so it can never disagree with the rail/header that display
// it, or read more/less extreme than the genre curve implies at the same
// intensity.
export function getActiveStage(emotion: EmotionType | null, stressValue: number | null): Stage {
  if (!emotion) return SURFACE;
  const intensity = stressValue ?? 5;
  const intensityStage = 1 + (intensity / MAX_STRESS_INTENSITY) * 8; // 0-10 -> 1-9, continuous
  const idx = Math.min(9, Math.max(1, Math.round(intensityStage)));
  return STAGES[idx - 1];
}

// --- Stage-driven accent color -----------------------------------------------
type RGB = readonly [number, number, number];

function hexToRgb(hex: string): RGB {
  const clean = hex.replace('#', '');
  const value = parseInt(clean, 16);
  return [(value >> 16) & 255, (value >> 8) & 255, value & 255];
}

function rgbToString([r, g, b]: RGB, alpha = 1): string {
  return alpha < 1 ? `rgba(${r}, ${g}, ${b}, ${alpha})` : `rgb(${r}, ${g}, ${b})`;
}

export interface RiteAccent {
  accent: string;
  border: string;
  glow: string;
}

// combinedIntensity: 0..1, blend of selected emotion intensity + stress level.
// The color itself comes from the active stage; intensity only controls how
// strongly it glows, so descending further makes the *existing* mood more
// intense rather than sliding along one continuous red ramp.
export function computeStageAccent(stage: Stage, combinedIntensity: number): RiteAccent {
  const clamped = Math.min(Math.max(combinedIntensity, 0), 1);
  const rgb = hexToRgb(stage.color);
  const glowAlpha = 0.25 + clamped * 0.5;
  const glowSize = Math.round(16 + clamped * 32);
  return {
    accent: rgbToString(rgb),
    border: rgbToString(rgb, 0.35 + clamped * 0.35),
    glow: `0 0 ${glowSize}px ${rgbToString(rgb, glowAlpha)}`,
  };
}
