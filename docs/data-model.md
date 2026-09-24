# Sonic Catharsis — data model

Reference spec for the app's actual data shapes, current as of the
situation-first / sonic-profile redesign. Supersedes `docs/model.md`, which
predates the constellation→classification-grid redesign, the
constellation→Trigger rename, and the Matcher/Curator sonic-profile
architecture, and is now wrong in several places (it still describes
`EmotionWheel.tsx`, which is deleted, and claims subgenre is picked purely
by `(emotion, intensity)` with no model judgment, which is no longer true).

For how the derived values (Stage, subgenre) are actually computed, see
[`formulas.md`](./formulas.md) in this directory.

## 1. User-facing input model

What the landing page actually collects — three inputs, three distinct
questions, never framed as "emotion":

```
incidentText   "What petty injustice did you endure today?" — free text, ≤500 chars
trigger        "What kind of bullshit was it?" — one of 9 categories (3x3 checkbox grid)
intensity      "How bad is it?" — 0-10 (displayed 1-11, see the ELEVEN note below)
```

`trigger` (`TriggerType`, `src/types/index.ts`) — the 9 categories, in the
grid's row-major reading order (`TRIGGER_TYPES`, `src/lib/trigger.ts`):

```
injustice · failure · conflict
helplessness · overload · exhaustion
uncertainty · absurdity · unclassified
```

`unclassified` is the deliberate 9th "doesn't fit cleanly into any category
above" catch-all — not a real trigger, but a legitimate selectable value.

```ts
// src/types/index.ts
export interface TriggerSelection {
  trigger: TriggerType;
  intensity: StressLevel; // 0-10
}
```

**Intensity / the ELEVEN tier.** `StressLevel` is a plain `number`, 0-10.
`MAX_STRESS_INTENSITY = 10` (`src/lib/theme.ts`). The slider
(`IntensitySlider.tsx`) shows 10 normal ticks (displayed as `1/10`…`10/10`,
i.e. `value + 1`) plus a hidden 11th position reached only by dragging past
the last tick — that position *is* `stressLevel = 10` (`MAX_STRESS_INTENSITY`
itself, not an 11th distinct value), displayed as `11/10` to deliberately
break the printed scale. There is no `stressLevel = 11`; ELEVEN is a display
artifact of the same top value, not a new intensity level.

## 2. Translation layer — Trigger → legacy Emotion

The recommendation engine (Stage computation, the anchor genre table, the
Matcher/Curator prompts) is still keyed on 8 basic emotions
(`CoreEmotionType` / `EmotionType`, `src/types/index.ts`), because rewriting
that engine wasn't in scope when the input model changed from
emotion-first to situation-first. `trigger.ts`'s `triggerToEmotion()` is the
**one, explicit, documented** bridge between the two — never claimed as
"trigger X IS emotion Y," just a tonal anchor into the existing engine:

```ts
// src/lib/trigger.ts
injustice: 'anger',      overload: 'surprise',
conflict: 'disgust',     exhaustion: 'trust',
failure: 'sadness',      uncertainty: 'anticipation',
helplessness: 'fear',    absurdity: 'joy',
unclassified: 'trust',   // reuses exhaustion's anchor — a deliberately
                         // neutral default, not a real 9th emotion
```

Both the trigger *and* its legacy-emotion translation are sent to the
Matcher (see §4) — not just the translation — specifically so the model can
weigh the user's actual selection above the lossy compatibility mapping.

## 3. Stage (the "Vitutus" diagnosis)

`Stage` (`src/lib/theme.ts`) is the deterministic severity classification
shown as the diagnosis (e.g. "Stage VII — Raivovitutus"). 9 stages, ascending:

```
I    Lievä ärsytys        VI   Syvävitutus
II   Kytevä vitutus       VII  Raivovitutus
III  Perusvitutus         VIII Täysvitutus
IV   Keskivaikea vitutus  IX   Vitutus maximus
V    Kova vitutus
```

Terminology is loosely inspired by a real (tongue-in-cheek) Finnish
"vitutus" study (cited via QR on the receipt) — only **III, IV, VI, IX**
(Perusvitutus, Keskivaikea vitutus, Syvävitutus, Vitutus maximus) are the
study's own terms; the rest are original, built in the same register. Never
claim otherwise in generated copy.

`SURFACE` (`index: 0`, roman `—`) is a 10th pseudo-stage used before any
trigger is selected — it's not part of the I-IX scale.

Stage is computed from `(intensity, physicalSymptoms, duration)` — see
[`formulas.md`](./formulas.md) for the exact formula, weights, and its
revision history. Trigger/legacy emotion is **deliberately not an input**
(it stays meaningful elsewhere — the anchor genre pick, the Matcher's cause
text — but never shifts the stage number); this has been tried and removed
twice now, see `formulas.md`'s history section before reintroducing it a
third time.

## 4. Sonic profile

Five closed-vocabulary dimensions the Matcher derives per reading, replacing
free-prose "vibe" description with something the Curator can actually use as
calibration input (`src/lib/validation.ts`):

```ts
activation:        restrained | driving | aggressive | overwhelming
agency:             surrender | immersion | assertion | confrontation
friction:              smooth | textured | abrasive | confrontational
cognitive_density:     direct | primitive | complex | disorienting
weight:                  light | propulsive | heavy | oppressive | crushing
```

Dimension counts are deliberately not forced to match (4 for most, 5 for
`weight`) — matching real distinctions rather than symmetry for its own
sake. Every value must be exactly one of these tokens — no synonyms, no
combined values — enforced by `SonicProfileSchema` (Zod `z.enum`).

## 5. Matcher — request / response contract

**Request** (`EmotionDataSchema`, POSTed as `{ emotionData }` to
`/api/matcher`):

```ts
{
  primary: EmotionType;    // legacy compatibility signal (triggerToEmotion(trigger))
  trigger: TriggerType;    // the user's actual selection
  stressLevel: number | null; // 0-10
  event: string | null;    // incidentText
  symptoms: PhysicalSymptomType[]; // optional, multi-select, defaults to []
  duration: DurationType;  // optional, single-select, defaults to 'just_now'
}
```

`symptoms` and `duration` are both optional additional context — real
inputs to `getActiveStage()`'s severity blend (§3) and decorative-only
context for the Matcher's cause/choice text (`src/lib/prompts.ts`), never
required to submit.

**Response** (`analysis` field conforms to `AnalysisSchema`):

```ts
{
  subgenre: string;          // the model's own choice — see formulas.md
  sonic_profile: SonicProfile;
  cause: string;             // ~100-word darkly comic "Incident Summary"
  choice: string;             // ~100-word "Recommended Corrective Action"
}
```

Deliberately **absent**: `primary_emotion` / `stress_level` echoed back. The
app already has those values client-side (built directly from `selection`,
never from the LLM's response) — asking the model to echo them back was a
state-transport anti-pattern, removed when the sonic-profile architecture
was introduced.

Also sent to the model but not part of the Zod-validated output: `condition`
(the Stage string, e.g. `"Stage VII — Raivovitutus"`, computed server-side
and handed to the model as context to reference in `cause`/`choice`), and
`anchor_subgenre` (see formulas.md).

## 6. Curator — request / response contract

**Request** (`CuratorRequestSchema`, POSTed as `{ analysis, emotionData }`
to `/api/curator`): `analysis` is the Matcher's own output object above.
`emotionData` is still accepted in the schema and still sent by the client,
but the route no longer reads `primary`/`stressLevel`/`trigger`/`event` from
it for prompt construction — only `analysis.subgenre` and
`analysis.sonic_profile` reach the Curator prompt. Kept in the schema
because trimming it would require a client-side change for no functional
gain right now (see `curator/route.ts` comments).

**Response**:

```ts
{ Selection: [ { artist: string, link: string | null }, ... ] } // exactly 10
```

`link` may be `null` — the Curator is explicitly instructed not to guess
plausible-looking Bandcamp URLs; the client (`page.tsx`) already falls back
to a Bandcamp *search* URL when `link` is falsy, so a `null` link still
resolves to something clickable.

## 7. Rendered types

```ts
// src/types/index.ts
interface Track { id, name, artist, album, genre, bandcampUrl?, ... }
interface Playlist { id, name, description?, tracks: Track[] }
```

Built client-side from the Curator's artist list — not part of any API
contract.

## 8. End-to-end shape

```
incidentText, trigger, intensity, physicalSymptoms, duration
        │                            │            │
        │ triggerToEmotion()         │            │
        ▼                            ▼            ▼
   legacyEmotion    getActiveStage(intensity, physicalSymptoms, duration)
        │                            │
        │                            ▼
        │                     Stage (condition string)
        ▼
   getDeterministicGenre(legacyEmotion, intensity) → anchor_subgenre
        │
        ▼
   MATCHER (incidentText, trigger, legacyEmotion, condition, anchor_subgenre,
            physicalSymptoms, duration)
        │
        ▼
   { subgenre, sonic_profile, cause, choice }
        │
        ▼
   CURATOR (subgenre, sonic_profile)
        │
        ▼
   10x { artist, link | null }
```

## Where each piece lives in code

| Concern | File |
|---|---|
| `TriggerType`, `TriggerSelection`, `EmotionType` | `src/types/index.ts` |
| Trigger metadata, `triggerToEmotion()` | `src/lib/trigger.ts` |
| Classification grid UI | `src/components/ClassificationGrid.tsx` |
| Intensity slider, ELEVEN tier | `src/lib/theme.ts` (`MAX_STRESS_INTENSITY`), `src/components/IntensitySlider.tsx` |
| Physical symptoms vocabulary + checklist UI | `src/lib/symptoms.ts`, `src/components/SymptomChecklist.tsx` |
| Duration/persistence vocabulary + select UI | `src/lib/duration.ts`, `src/components/DurationSelect.tsx` |
| Stage names + `getActiveStage` | `src/lib/theme.ts` |
| Stage header display | `src/components/StageHeader.tsx` |
| Anchor genre table | `src/lib/genre-mapping.ts` |
| Sonic profile enums + all Zod schemas | `src/lib/validation.ts` |
| Matcher/Curator prompt text | `src/lib/prompts.ts` |
| Matcher/Curator routes | `src/app/api/matcher/route.ts`, `src/app/api/curator/route.ts` |
| Orchestration, `EmotionData` payload construction | `src/app/page.tsx` |
| Vitutus study citation QR | `src/components/ReceiptCard.tsx` |
