// THE RITE — shared design tokens, copy, and pure helpers for the redesigned UI.
// No JSX here; consumed by page.tsx and the panel/selector components.

import type { EmotionType, StressLevel } from '@/types';

export const EASE = 'cubic-bezier(0.25, 1, 0.5, 1)';

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

export const STRESS_TIERS: { label: string; color: string }[] = [
  { label: 'Intolerable lightness', color: '#10b981' },
  { label: 'Low', color: '#22c55e' },
  { label: 'Optimum', color: '#84cc16' },
  { label: 'Moderate', color: '#eab308' },
  { label: 'Overload', color: '#f97316' },
  { label: 'Burnout', color: '#ea580c' },
  { label: 'Breaking Point', color: '#dc2626' },
  { label: 'Multi-climax', color: '#991b1b' },
  { label: 'Total Meltdown', color: '#7f1d1d' },
  { label: 'Point of No Return', color: '#581c87' },
  // ELEVEN breaks the low->high color ramp on purpose — it sits outside the
  // normal radial band entirely, so it gets a shock color instead of the
  // next shade of dark red, matching the special emphasis in EmotionWheel.
  { label: 'ELEVEN', color: '#fbbf24' },
];

// The matcher/curator prompts expect a human-readable stress *description*
// ("Overload", "Moderate", ...), not our raw numeric tier — kept as a
// separate lookup since the prompt text refers to labels, not indices.
export const STRESS_VALUE_TO_LABEL: Record<number, string> = Object.fromEntries(
  STRESS_TIERS.map((tier, index) => [index, tier.label])
);

// --- Emotional Damage Score -------------------------------------------------
const EMOTION_BASE_SCORE: Record<EmotionType, number> = {
  trust: 100,
  joy: 200,
  anticipation: 300,
  surprise: 400,
  fear: 550,
  sadness: 600,
  disgust: 700,
  anger: 850,
};

export function calculateDamageScore(emotion: EmotionType, stressLevel: StressLevel | null): number {
  const baseScore = EMOTION_BASE_SCORE[emotion] ?? 500;
  const stressValue = stressLevel ?? 0;
  const stressMultiplier = (stressValue / MAX_STRESS_INTENSITY) * 400;
  return Math.min(Math.round(baseScore + stressMultiplier), 1000);
}

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

// --- The Nine Circles -------------------------------------------------------
// Dante's actual arc, not a made-up one: it gets *hotter* through the middle
// circles (fire, brimstone) then genuinely *colder* at the very bottom —
// Circle IX is Cocytus, the frozen lake at the center of the earth. That
// inversion is the whole point: the deepest, most intense state should not
// just be "more red," it should be a different temperature altogether.
export interface Circle {
  index: number; // 0 = surface (nothing selected yet), 1-9 = the circles
  roman: string;
  name: string;
  color: string; // hex
}

export const SURFACE: Circle = {
  index: 0,
  roman: '—',
  name: 'The Surface',
  color: '#52525b',
};

export const CIRCLES: Circle[] = [
  { index: 1, roman: 'I', name: 'Limbo', color: '#71717a' },
  { index: 2, roman: 'II', name: 'Lust', color: '#a855f7' },
  { index: 3, roman: 'III', name: 'Gluttony', color: '#4d7c0f' },
  { index: 4, roman: 'IV', name: 'Greed', color: '#ca8a04' },
  { index: 5, roman: 'V', name: 'Wrath', color: '#7f1d1d' },
  { index: 6, roman: 'VI', name: 'Heresy', color: '#ea580c' },
  { index: 7, roman: 'VII', name: 'Violence', color: '#dc2626' },
  { index: 8, roman: 'VIII', name: 'Fraud', color: '#a16207' },
  { index: 9, roman: 'IX', name: 'Treachery', color: '#7dd3fc' },
];

// --- Deterministic circle selection: (emotion, stressValue) -> Circle -------
// Each emotion has a fixed "base" circle (ascending severity, reusing
// EMOTION_BASE_SCORE, with one deliberate swap: sadness sits at IX instead
// of the next emotion in severity order, because Circle IX is meant to be
// cold and numb, not just "most severe" — frozen grief fits Cocytus better
// than hot fury or revulsion).
const EMOTION_BASE_CIRCLE: Record<EmotionType, number> = {
  trust: 1, // Limbo
  joy: 2, // Lust
  anticipation: 3, // Gluttony
  surprise: 4, // Greed
  fear: 5, // Wrath
  disgust: 6, // Heresy
  anger: 7, // Violence
  sadness: 9, // Treachery
};

// Stress tier (0-10) shifts the base circle up/down by up to 2, continuous
// rather than a lookup table since every tier index is now a valid value;
// midpoint (5, "Burnout") leaves the emotion's own base circle unchanged.
function stressOffset(stressValue: number): number {
  return Math.round(((stressValue - 5) / 5) * 2);
}

export function getActiveCircle(emotion: EmotionType | null, stressValue: number | null): Circle {
  if (!emotion) return SURFACE;
  const offset = stressOffset(stressValue ?? 5);
  const idx = Math.min(9, Math.max(1, EMOTION_BASE_CIRCLE[emotion] + offset));
  return CIRCLES[idx - 1];
}

// --- Circle-driven accent color ---------------------------------------------
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
// The color itself comes from the active circle; intensity only controls how
// strongly it glows, so descending further makes the *existing* mood more
// intense rather than sliding along one continuous red ramp.
export function computeCircleAccent(circle: Circle, combinedIntensity: number): RiteAccent {
  const clamped = Math.min(Math.max(combinedIntensity, 0), 1);
  const rgb = hexToRgb(circle.color);
  const glowAlpha = 0.25 + clamped * 0.5;
  const glowSize = Math.round(16 + clamped * 32);
  return {
    accent: rgbToString(rgb),
    border: rgbToString(rgb, 0.35 + clamped * 0.35),
    glow: `0 0 ${glowSize}px ${rgbToString(rgb, glowAlpha)}`,
  };
}
