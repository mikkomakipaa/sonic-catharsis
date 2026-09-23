# Sonic Catharsis — formulas

The two deterministic derivations in the pipeline, plus the Matcher's
decision sequence for combining them with model judgment. See
[`data-model.md`](./data-model.md) for the surrounding types/schemas.

## 1. Stage formula (`getActiveStage`, `src/lib/theme.ts`)

```ts
function getActiveStage(emotion, stressValue) {
  const intensity = stressValue ?? 5;
  const intensityStage = 1 + (intensity / 10) * 8;       // 0-10 -> 1-9, continuous
  const idx = clamp(1, 9, round(intensityStage + EMOTION_STAGE_TILT[emotion]));
  return STAGES[idx - 1];
}
```

Intensity is the **dominant** driver — on its own it spans nearly the full
I-IX range. Emotion applies only a small additive tilt on top:

```ts
const EMOTION_STAGE_TILT = {
  trust: -1, joy: -1,
  anticipation: 0, surprise: 0,
  fear: 1, disgust: 1, anger: 1,
  sadness: 2,  // deliberate — see below
};
```

`sadness`'s `+2` is a deliberate design choice (not a bug like the ones
below): Stage IX is meant to read as cold and numb, not just "most
severe" — frozen grief fits an icy "Vitutus maximus" better than hot fury or
revulsion, so sadness skews toward the top more than the other emotions.

### History — why this isn't the original formula

The original version assigned each emotion a **widely-spread base stage**
(1 through 9, one full stage apart) and let intensity only nudge it by
`±round(((stressValue - 5) / 5) * 2)`, i.e. at most ±2:

```ts
// ORIGINAL — replaced, kept here only as a cautionary reference
const EMOTION_BASE_STAGE = {
  trust: 1, joy: 2, anticipation: 3, surprise: 4,
  fear: 5, disgust: 6, anger: 7, sadness: 9,
};
idx = clamp(1, 9, EMOTION_BASE_STAGE[emotion] + offset); // offset ∈ [-2, +2]
```

Because the base values were spread across the *entire* 1-9 range but
intensity could only move the result by 2 in either direction, every emotion
was trapped in a narrow band **regardless of what the user actually
reported**:

| Emotion | Reachable range (original formula) |
|---|---|
| trust | I – III (never above III, even at max intensity) |
| joy | I – IV |
| anticipation | I – V |
| surprise | II – VI |
| fear | III – VII |
| disgust | IV – VIII |
| anger | **V – IX** (never below V, even at min intensity) |
| sadness | **VII – IX** (never below VII, even at min intensity) |

Concretely: an `injustice` trigger (→ `anger`) at displayed intensity
`2/10` (internal `stressLevel = 1`) computed `offset = round(((1-5)/5)*2) =
-2`, giving `idx = max(1, 7 - 2) = 5` → **Stage V, "Kova vitutus"** — a
solidly severe diagnosis for a reading the user explicitly rated near the
bottom of the scale. The bug wasn't anger-specific; it was structural (base
spread ≫ offset range) and affected every emotion.

### Current reachable range (new formula)

| Emotion | Reachable range |
|---|---|
| trust, joy | I – VIII |
| anticipation, surprise | I – IX |
| fear, disgust, anger | II – IX |
| sadness | III – IX |

Known, accepted asymmetry (confirmed with the app owner, not yet revisited):
`fear`/`disgust`/`anger` can only reach Stage II at `intensity = 0` exactly,
never Stage I; `sadness` can never reach Stage I or II at all, floored at
III even at minimum intensity. This preserves each emotion's tonal
"weight" — a `failure` (sadness) complaint reads as inherently graver than
an `exhaustion` (trust) complaint even when both are reported as equally
mild — mirroring the same intentional asymmetry in the genre curve below
(§2). Revisit only if this stops feeling like flavor and starts feeling like
another floor/ceiling bug.

## 2. Anchor genre table (`getDeterministicGenre`, `src/lib/genre-mapping.ts`)

```ts
function getDeterministicGenre(emotion, stressValue) {
  const tier = clamp(0, 10, round(stressValue ?? 5));
  return GENRE_MAP[emotion][tier]; // { genre, fallback }
}
```

A static `Record<EmotionType, Record<0-10, GenreEntry>>` — 8 emotions × 11
tiers, no formula, just a lookup. Originally the *forced* final subgenre
(the Matcher was told "never deviate"); now serves only as `anchor_subgenre`
— a stabilizing **prior** fed to the Matcher, not a mandate (see §3).

### Tuning shape, low → high tier

- **Tiers 0-2**: intentionally gentle/melodic across all 8 emotions (folk
  metal, power metal, symphonic metal, gothic doom, etc.) — untouched since
  the table was first written.
- **Tiers 3-6**: the "moderate middle" — **retuned** for `fear`, `surprise`,
  `sadness`, `disgust`, `anger` (see History below). `joy`, `trust`,
  `anticipation` were left untouched — their tier-5 anchors were already
  moderate.
- **Tiers 7-10**: intentionally extreme, including theatrical
  invented-compound genre names at tier 10 (e.g. `"total war: maximal
  bestial black metal"`, `"the abyss: maximal funeral drone"`) — this is
  deliberate house style for the most extreme readings, and the Matcher is
  explicitly told it may keep an anchor's invented name as-is when it fits
  (`MATCHER_INSTRUCTIONS`, `src/lib/prompts.ts`).

### History — why tiers 3-6 were retuned

Tier 5 is both the mathematical midpoint of the 0-10 scale *and*
`ClassificationGrid`'s `DEFAULT_TIER` — i.e. what a fresh selection starts
at before the user touches the slider. Before retuning, 5 of 8 emotion rows
already reached genuinely extreme-metal territory by tier 5:

| Emotion | Tier 5 before | Tier 5 after |
|---|---|---|
| fear | raw black metal | gothic black metal |
| surprise | avant-garde death/black | technical death metal |
| sadness | depressive black metal | melancholic doom metal |
| disgust | deathgrind | brutal death metal |
| anger | brutal death metal | death metal |

Only tiers 3-6 were changed for these five rows; tiers 0-2 and 7-10 are
byte-identical to before. Verified live after the change: `anger`@5
(`injustice` trigger) now yields `sonic_profile: { activation: 'aggressive',
weight: 'heavy' }` instead of `{ activation: 'overwhelming', weight:
'crushing' }`, while `anger`@10 is unchanged (`overwhelming`/`crushing`,
`"total war: maximal bestial black metal"`) — confirming only the middle of
the curve moved, not the ceiling.

## 3. Matcher's subgenre decision sequence

Not a formula, but a deliberate **ordering constraint** enforced entirely
through the prompt (`MATCHER_INSTRUCTIONS`, `src/lib/prompts.ts`) rather
than code — worth documenting here since it governs how §2's anchor and the
model's own judgment combine:

```
1. Derive the sonic_profile FIRST, from incidentText + trigger
   (legacyEmotion/condition/anchor_subgenre are secondary, tie-breaking
   context only — never the primary basis).
2. THEN evaluate anchor_subgenre against that profile.
   - If the anchor's usual sound reasonably delivers the derived profile,
     use it (verbatim or lightly adapted).
   - If a real, established subgenre would materially better express the
     profile, deviate to that instead.
   - Never deviate merely for novelty; never keep the anchor out of inertia
     when it plainly doesn't fit.
```

This ordering matters: deriving the profile *before* looking at the anchor
prevents the anchor from silently dictating the profile (which would make
the sonic-profile step decorative and just reproduce the old fixed
`emotion → genre` mapping through the back door). The anchor is a prior
probability, not veto power.

## 4. Curator's within-subgenre calibration

Also prompt-only (`CURATOR_INSTRUCTIONS`), not a formula: given a fixed
`subgenre` and the 5-dimension `sonic_profile`, low `activation`/`weight`/
`friction` values skew artist selection toward the subgenre's more
restrained/accessible/melodic corners; high values (aggressive/overwhelming
activation, crushing/oppressive weight, confrontational friction,
disorienting cognitive_density) skew toward the subgenre's most extreme,
unrelenting, or technically dense corners — while always staying strictly
within the given `subgenre`.
