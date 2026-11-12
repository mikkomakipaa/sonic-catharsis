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
trigger        "What kind of bullshit was it?" — one of 8 categories (checkbox grid)
intensity      "How bad is it?" — 0-10 (displayed 1-11, see the ELEVEN note below)
```

`trigger` (`TriggerType`, `src/types/index.ts`) — the 8 categories, in the
grid's row-major reading order (`TRIGGER_TYPES`, `src/lib/trigger.ts`):

```
injustice · failure · conflict
helplessness · overload · exhaustion
uncertainty · absurdity
```

There is no catch-all/"unclassified" category — every situation is expected
to fit one of the eight above.

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
IV   Keskivaikea vitutus  IX   Vitutus Multi-Climax
V    Kova vitutus
```

Terminology is loosely inspired by a real (tongue-in-cheek) Finnish
"vitutus" study (cited via QR in the Prescription header) — only **III, IV, VI**
(Perusvitutus, Keskivaikea vitutus, Syvävitutus) are the
study's own terms; the rest are original, built in the same register. Never
claim otherwise in generated copy.

`SURFACE` (`index: 0`, roman `—`) is a 10th pseudo-stage used before any
trigger is selected — it's not part of the I-IX scale.

### Direct Seppo consultation

The intake page's “Not angry? Let the clinic fix that” opens a short incident form with an example placeholder. The required text (up to 300 characters) becomes the first user message in a direct Seppo consultation, and the client requests his opening immediately. No stimulus is shown. The incident counts as the first of the two user messages; Seppo infers trigger, intensity, duration and supported symptoms from the injustice and conversation, preserves its specific details in the final assessment, and if his assessment is unavailable, the patient returns to the intake with their incident preserved and the other fields unset; the existing final assessment and prescription flow follows. The direct request supplies `direct: true` to `/api/vittuilu`, selecting instructions that do not assume prior stimuli. The diagnosis referral below remains available separately.

### 3.1 Provoke Me (stimulus plates)

When a reading is too calm to treat — `PSEUDO_VITUTUS_STAGE` ("Level 0") or
Stage I — the Epicrisis shows a "Referral / 03" offering to administer a
controlled stimulus. The rule lives in one predicate,
`shouldOfferProvocation()` (`src/lib/provocations.ts`); it compares stages
by reference, never by `index`.

- `STIMULI` (same file) holds 30 `Stimulus` entries: `fig`, `trigger`,
  `stimulus` (caption), `legend` (A/B/C key), `incident` (pre-fill text),
  `imageBrief` (drawing brief, never shown), optional `image`. Review copy:
  [`design/provoke-me/STIMULI.md`](./design/provoke-me/STIMULI.md).
- `pickStimuli()` draws `MAX_STIMULI_PER_SESSION` (3), drawn plates first.
  Three "no"s → Seppo.
- "Joko vituttaa?" → yes: the intake is submitted straight to the analysis
  (no form). Each stimulus carries a fixed `reading` (intensity, symptoms,
  duration), so the stage is deterministic and escalates with the stimulus:
  plates read mild (intensity 2-5, each plate its own, no symptoms, fresh),
  the audio stimulus reads Stage V (6, head exploding + muscle tension), the
  never-loading video Stage VII (8, heart pounding + accelerated breathing,
  about an hour). A stimulus without a `reading` (Seppo's) has `/api/assess`
  read the intensity off its incident, duration `just_now`, no symptoms; if
  that fails, the pre-filled intake form is the fallback.
- That intake is sent with `provoked: true` (§5). The Epicrisis prints
  "Aetiology: iatrogenic (induced by this clinic, Fig. n)" deterministically,
  and the Matcher's cause text gets an iatrogenic note.
- Plate art: `public/provocations/*.svg` (light-only, no captions — the
  caption is HTML in `StimulusPlate.tsx`). All 30 are drawn; a future
  stimulus without `image` renders an "Illustration withheld" plate. New
  plates in the same style: `docs/design/provoke-me/generate_plates.py`.

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

The browser keeps up to three recent prescribed subgenre names in local storage (no incident text). It sends them with subsequent Matcher requests; the route asks for a fitting alternative and retries once if the model repeats an exact recent name. If both attempts repeat, the last valid result is used. The Level 0 special prescription is exempt. History begins when this feature is in use.


**Request** (`EmotionDataSchema`, POSTed as `{ emotionData }` to
`/api/matcher`):

```ts
{
  primary: EmotionType;    // legacy compatibility signal (triggerToEmotion(trigger))
  trigger: TriggerType;    // the user's actual selection
  stressLevel: number | null; // 0-10
  event: string | null;    // incidentText
  symptoms: PhysicalSymptomType[]; // optional, multi-select, defaults to []
  duration: DurationType | null;  // optional, single-select, no default — null until chosen
  provoked?: boolean;      // optional, additive — true when pre-filled from a Provoke Me stimulus (§3.1)
  chatNote?: string | null; // optional, additive, ≤300 chars — Seppo's `observation_note` on the chat; the Matcher builds the cause text on it
}
```

`symptoms` and `duration` are both optional additional context — real
inputs to `getActiveStage()`'s severity blend (§3) and decorative-only
context for the Matcher's cause/choice text (`src/lib/prompts.ts`), never
required to submit. Neither is silently stood in for by a default value:
an untouched `duration` reaches the Matcher as "not reported" (same
convention as an empty `symptoms` array), and contributes 0 to
`getActiveStage()`'s severity blend — numerically identical to `'just_now'`
("Fresh," which already carries a 0.0 weight), but as an explicit "nothing
claimed" case rather than a stand-in for a real answer.

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
and handed to the model as context to reference in `cause`/`choice`). No genre
hint is sent; the model chooses the subgenre itself (see formulas.md).

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
{ Selection: [ { artist: string, link: string | null }, ... ] } // exactly 7
```

`link` may be `null` — the Curator is explicitly instructed not to guess
plausible-looking Bandcamp URLs; the client (`page.tsx`) already falls back
to a Bandcamp *search* URL when `link` is falsy, so a `null` link still
resolves to something clickable.

### 6.1 Artist notes — `/api/seppo-notes`, `/api/physician-notes`

Two routes, one contract (`handleArtistNotes`, `src/lib/artist-notes.ts`), two voices: Seppo (`SEPPO_ARTIST_NOTES_INSTRUCTIONS`, `Track.seppoNote`, header "Contraindications") when `provokedBy === SEPPO_STIMULUS`, the clinic physician (`PHYSICIAN_ARTIST_NOTES_INSTRUCTIONS`, `Track.physicianNote`, header "Indication") for everyone else. After the Curator
returns, `page.tsx` (while the prescription loading screen is still up) POSTs `{ artists: string[], subgenre, incident? }`
(`SeppoNotesRequestSchema`; the incident is the Matcher's `event`). The Curator
itself still never sees the incident. Response: `{ notes: [{ artist, note }] }`
(`SeppoNotesSchema`, note ≤160 chars), filtered server-side to the requested
artists, one each. The client merges them into the track by
case-insensitive artist name and shows the list once, in its final layout.
Failure or a 20 s timeout is silent: the prescription renders without notes.

### 6.2 Genre-first path — "Prepare me for the music"

There is no real or numbered clinical diagnosis on this path, so none of §3–§5 applies. Seppo invents a comic complaint based on the answer. The patient answers
"What is your favorite music genre?" in free text (`FavoriteGenreSchema`).
Seppo reacts to it and invents a performance plus a real prescribed genre and sonic profile (§4 tokens). A metal favorite triggers a non-metal prescription; a non-metal favorite receives metal. The five existing performance briefs are optional inspiration, not categories. The opening must supply a valid performance and sound; invalid output is retried once rather than replaced by a preset.

- **Scene** — `POST /api/scene` with `{ favorite, messages, performance?, subgenre?, scene_summary? }` (`SceneRequestSchema`). The opening has an empty transcript and no scene context. It returns `performance`, `subgenre`, and `sonic_profile` with the reply and optional summary. Later calls send the full transcript, the saved performance and subgenre, and the summary if available. Context is bounded, JSON-quoted data. The server derives turn and final-turn status. The chosen performance and sound remain fixed in the client.
- **Prescription** — `POST /api/curator` with `{ analysis: { subgenre,
  sonic_profile } }` (the AI-chosen sound) (`emotionData` omitted; it is optional in
  `CuratorRequestSchema`).
- **Notes** — `POST /api/seppo-notes` with `{ artists, subgenre, scene? }`;
  `scene` carries the model's optional summary plus a bounded excerpt of the patient's reply when present, so the artist notes can use it.
- The prescription omits Stage, severity, intensity and the Vitutus study QR.

## 7. Rendered types

```ts
// src/types/index.ts
interface Track { id, name, artist, album, genre, bandcampUrl?, seppoNote?, ... }
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
   (getDeterministicGenre(...) is held back as a fallback only)
        │
        ▼
   MATCHER (incidentText, trigger, condition,
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
| Provoke Me stimuli, offer rule, session pick | `src/lib/provocations.ts` |
| Stimulus plate + Provoke Me screen | `src/components/StimulusPlate.tsx`, `src/components/screens/ScreenProvoke.tsx` |
| Vitutus study citation QR | `src/components/StudyQr.tsx`, shown in the Prescription header |
