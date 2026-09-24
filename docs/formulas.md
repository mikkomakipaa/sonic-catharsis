# Sonic Catharsis — formulas

The two deterministic derivations in the pipeline, plus the Matcher's
decision sequence for combining them with model judgment. See
[`data-model.md`](./data-model.md) for the surrounding types/schemas.

## 1. Stage formula (`getActiveStage`, `src/lib/theme.ts`)

```ts
function getActiveStage(stressValue, symptoms = [], duration = 'just_now') {
  if (stressValue === null) return SURFACE;
  const intensityFraction = stressValue / 10;
  const somaticFraction = symptoms.length / 6;       // uniform per-item weight
  const durationFraction = getDurationMeta(duration).value; // 0/0.25/0.5/0.75/1.0
  const severity = intensityFraction * 0.85 + somaticFraction * 0.10 + durationFraction * 0.05;
  const idx = clamp(1, 9, round(1 + severity * 8));
  return STAGES[idx - 1];
}
```

Three inputs, blended into one severity score, weighted **85% intensity /
10% somatic (physical symptoms) / 5% duration (persistence)**. Intensity —
the user's own "how bad is it" self-report — stays clearly dominant;
symptoms and duration differentiate the top end and refine the middle, but
never override or badly demote what the user explicitly said.

**Trigger/emotion is deliberately NOT an input.** See History below — this
is the second time a trigger/emotion-based severity term has been tried and
removed. The real "Vitutusviisari" study this app cites elsewhere (QR on
the receipt, footnote on the Epicrisis card) has no situational axis either
— it's a pure current-state measure. Trigger stays meaningful elsewhere
(the anchor genre pick in §2, the Matcher's cause text) but never shifts
the stage number.

### Somatic fraction — inspired by, not a replication of, the study

`symptoms.length / 6` is uniformly weighted because the study provides no
validated per-symptom severity weights to use instead — uniform weighting
avoids inventing such differences. This is **not** the same thing as the
study's own methodology: the Vitutusviisari's 10 items are multiple
statements averaged to measure one latent construct; this app's 6-item
checklist (`src/lib/symptoms.ts`) counts distinct physical manifestations,
a different kind of aggregate. Call it a "somatic activation index inspired
by" the study, not a replica of its scoring.

### Duration fraction — categorical, not linear

`src/lib/duration.ts` maps 5 tiers to evenly-spaced 0-1 values (ten hours
isn't ten times worse than one hour, so this isn't `hours / max_hours`):

| Tier | Label | Value |
|---|---|---:|
| `just_now` | Fresh | 0.00 |
| `about_hour` | Simmering | 0.25 |
| `several_hours` | Stewing | 0.50 |
| `since_yesterday` | Overnight | 0.75 |
| `several_days` | Lifestyle | 1.00 |

Labels are stylized (deadpan-clinical/absurd-diagnosis voice, matching
"WHAT KIND OF BULLSHIT WAS IT?"), not literal time descriptions — `Fresh` →
`Simmering` → `Stewing` keep one consistent cooking-decay metaphor as it
escalates; `Overnight` and `Lifestyle` are deliberate register-breaks
at the two tiers that have earned it. The underlying `value`/tier
*ordering* is what matters for severity, not the wording.

A product-model assumption, not something the study specifies numerically
either — the study treats intensity/duration/frequency as separate
characteristics of vitutus, but doesn't publish a duration-to-severity
curve to borrow. Frequency (how often this kind of thing happens, across
episodes) is deliberately not modeled — it's a longitudinal pattern, not
this episode's severity.

### Weight-revision history

Landed on 85/10/5 after two corrections during design review:

1. **75% intensity / 25% symptoms** (first draft, 2-axis) — rejected:
   `(intensity=10, 0 symptoms)` computed to **Stage VII**, a 2-stage
   demotion of an explicit "10/10" self-report. The study establishes
   intensity + bodily manifestation as *relevant* to current-state
   severity, not a specific weighting, and certainly not that most
   symptoms are *required* for max severity — the demotion wasn't a claim
   the research supports.
2. **85% intensity / 15% symptoms** (2-axis) — fixed it:
   `(10, 0 symptoms)` → **Stage VIII**, capped just below the ceiling
   rather than badly demoted; `(10, 4-6 symptoms)` → Stage IX.
3. **Adding duration as a third axis at a naive 80/10/10** would have
   *reintroduced* the same problem (intensity's own weight dropping back
   from 85% to 80%) — caught before implementing. Final split keeps
   intensity at 85% and takes duration's weight from symptoms' prior share:
   **85% intensity / 10% somatic / 5% duration.**

### Prior history (still cautionary — do not revisit)

Two even older formulas, kept here as a reminder of what NOT to do:

- **A per-emotion additive tilt** (`EMOTION_STAGE_TILT`, small +/-1/+2 on
  top of pure intensity) drifted out of sync with `getDeterministicGenre()`'s
  own independently-tuned, asymmetric per-emotion severity curve in §2 once
  that curve was retuned — two curves independently encoding overlapping
  severity information will eventually disagree. Removed; intensity became
  the sole driver for a while (no tilt, no symptoms, no duration).
- **The original version**, before that: each emotion got a **widely-spread
  base stage** (1 through 9, one full stage apart), with intensity only
  nudging it by `±round(((stressValue - 5) / 5) * 2)` — at most ±2. Because
  the base spread (up to 8 stages) vastly exceeded the offset range (±2),
  every emotion was trapped in a narrow band regardless of what the user
  actually reported (e.g. `trust` could never exceed Stage III even at max
  intensity; `anger` could never drop below Stage V even at min intensity).
  A `2/10` `injustice` (→ `anger`) reading landed on **Stage V** purely
  because anger's base was high — not because the user reported anything
  severe.

Both are why trigger/emotion is now excluded from this formula entirely
rather than reintroduced a third time with "better" weights — the pattern
(an independently-maintained severity term drifting from either the genre
curve or the user's own report) kept recurring regardless of how the term
itself was tuned.

### Verified properties (11 intensity × 7 symptom-count × 5 duration-tier = 385 combinations)

Computed via a one-off scratch script (no test runner configured in this
repo — see `package.json`):

- **All 9 stages (I-IX) are reachable.**
- **Monotonic in all three inputs** — increasing intensity, symptom count,
  or duration tier (with the others held fixed) never decreases the stage.
  Guaranteed by construction (all three coefficients are positive), and
  confirmed exhaustively across the full grid.
- **Key boundary checks:**
  - `(intensity=0, 0 symptoms, just_now)` → **Stage I** ("assessed, minimal
    vitutus" — a reading was submitted; distinct from `SURFACE`, which is
    reserved for `stressValue === null`, no selection made at all).
  - `(intensity=10, 0 symptoms, just_now)` → **Stage VIII**.
  - `(intensity=10, 6 symptoms, just_now)` → **Stage IX** (somatic
    corroboration alone can close the gap; duration not required).
  - `(intensity=10, 0 symptoms, several_days)` → **Stage VIII**, not IX —
    duration alone (5% weight) can't reach the ceiling either.
  - `(intensity=2, 6 symptoms, several_days)` → **Stage IV** — the
    "shouldn't runaway" sanity check: maxing both secondary axes on a 2/10
    self-report doesn't jump to a wildly higher stage.

Full transition table, `duration = just_now` (D=0):

| intensity \ symptoms | 0 | 1 | 2 | 3 | 4 | 5 | 6 |
|---:|---|---|---|---|---|---|---|
| 0 | I | I | I | I | II | II | II |
| 1 | II | II | II | II | II | II | II |
| 2 | II | II | III | III | III | III | III |
| 3 | III | III | III | III | IV | IV | IV |
| 4 | IV | IV | IV | IV | IV | IV | V |
| 5 | IV | V | V | V | V | V | V |
| 6 | V | V | V | V | VI | VI | VI |
| 7 | VI | VI | VI | VI | VI | VI | VII |
| 8 | VI | VII | VII | VII | VII | VII | VII |
| 9 | VII | VII | VII | VIII | VIII | VIII | VIII |
| 10 | VIII | VIII | VIII | VIII | VIII | VIII | IX |

Full transition table, `duration = several_days` (D=1.0):

| intensity \ symptoms | 0 | 1 | 2 | 3 | 4 | 5 | 6 |
|---:|---|---|---|---|---|---|---|
| 0 | I | II | II | II | II | II | II |
| 1 | II | II | II | II | III | III | III |
| 2 | III | III | III | III | III | III | IV |
| 3 | III | IV | IV | IV | IV | IV | IV |
| 4 | IV | IV | IV | V | V | V | V |
| 5 | V | V | V | V | V | V | VI |
| 6 | V | VI | VI | VI | VI | VI | VI |
| 7 | VI | VI | VI | VII | VII | VII | VII |
| 8 | VII | VII | VII | VII | VII | VIII | VIII |
| 9 | VIII | VIII | VIII | VIII | VIII | VIII | VIII |
| 10 | VIII | VIII | VIII | IX | IX | IX | IX |

(`about_hour`, `several_hours`, and `since_yesterday` interpolate between
these two tables — omitted here for brevity, regenerable from the formula
above.)

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
