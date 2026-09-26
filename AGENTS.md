# AGENTS.md

This is the single, tracked source of guidance for AI coding agents (Codex,
Claude Code, etc.) working in this repository. It replaces the old
`CLAUDE.md`/`AGENTS.md` split — there is no separate local `CLAUDE.md` to
keep in sync anymore; agents that read `AGENTS.md` natively should treat this
file as authoritative.

# Sonic Catharsis - Metal Music Emotion Matching Application

**Stack**: Next.js 16 + TypeScript + OpenAI GPT-4.1 (Responses API) + Tailwind CSS v4
**Status**: Production Ready
**Port**: 3001

## Quick Start Commands

```bash
# Development
npm run dev              # Start dev server at http://localhost:3001

# Production
npm run build            # Production build
npm run start            # Start production server (port 3001)

# Code Quality
npm run lint              # ESLint
npm run typecheck         # TypeScript strict type checking
```

## Environment Setup

Create `.env.local` in project root:
```bash
OPENAI_API_KEY=sk-proj-...
```

Or symlink to centralized config:
```bash
ln -s ~/.config/sonic-catharsis/.env .env.local
```

## Core Architecture

The current model is **situation-first**: the app asks about the incident,
not an emotion. `docs/data-model.md` is the authoritative reference for
every data shape below — read it before changing any of this. `docs/formulas.md`
documents exactly how Stage and subgenre are derived. This section is a
summary, not a replacement for those docs.

### User-facing input (the "Descent" intake)

Three questions, never framed as "how do you feel":
- **incidentText** — free text, ≤500 chars ("What petty injustice did you endure today?")
- **trigger** — one of 8 categories, no catch-all (`src/lib/trigger.ts` → `TRIGGER_TYPES`): `injustice, failure, conflict, helplessness, overload, exhaustion, uncertainty, absurdity`
- **intensity** — 0-10 scale, displayed as 1-11 ("these go to eleven"; see `MAX_STRESS_INTENSITY`/`STRESS_TIERS` in `src/lib/theme.ts`)

Two optional, decorative-only inputs, both real items from the same
(tongue-in-cheek) "Vitutus" academic instrument the app cites on its receipt:
- **physical_symptoms** — multi-select, `src/lib/symptoms.ts` (`PHYSICAL_SYMPTOMS`), defaults to none
- **duration_persistence** — single-select, `src/lib/duration.ts` (`DURATION_TIERS`), defaults to `just_now`/"Fresh"

Both feed a small, non-dominant contribution into `getActiveStage()`
(`src/lib/theme.ts`) — the deterministic (intensity, symptoms, duration) →
Stage formula that drives the on-screen diagnosis. Never fabricate or infer
either field; the UI's own selection is the only valid source.

### The Nine Stages of Vitutus (the "condition")

`getActiveStage()` (`src/lib/theme.ts`) maps `(intensity, symptoms, duration)`
to one of 9 stages (`STAGES`, Roman numerals I–IX, Finnish "vitutus" names,
e.g. `Stage VII — Raivovitutus`). Four of the nine names (III, IV, VI, IX)
are genuine terms from the real study; the rest are original extensions in
the same register — this distinction must never be stated or implied in any
user-facing output. The stage is displayed prominently in the UI (Epicrisis
header / receipt) — the Matcher prompt is told never to name or paraphrase it
in prose, since the visual diagnosis already carries that information.

### Two-Agent System (Trigger+incident → Music)

The application uses a **sequential two-agent pipeline** orchestrated from
`src/app/page.tsx`:

1. **Agent 1: Matcher** (`/api/matcher`, `src/app/api/matcher/route.ts`)
   - Input: incident text, trigger, intensity, physical symptoms, duration, plus `anchor_subgenre` (via `getDeterministicGenre()`, `src/lib/genre-mapping.ts`). `getDeterministicGenre()` is keyed on the internal `EmotionType` vocabulary, computed server-side from `trigger` via `triggerToEmotion()` (`src/lib/trigger.ts`) — that translation is used only to pick the anchor and is **not** sent to the model as its own field (the model already gets the more informative `trigger` value directly)
   - Uses OpenAI Responses API, `model: 'gpt-4.1'`, in-repo `instructions: MATCHER_INSTRUCTIONS` (`src/lib/prompts.ts`) — no hosted OpenAI Prompt Object
   - The model derives its own 5-axis **sonic profile** (activation, agency, friction, cognitive_density, weight — see `SonicProfileSchema` in `src/lib/validation.ts`) from the incident + trigger, and picks the subgenre itself — the anchor is a stabilizing prior, not a forced answer. This is a deliberate change from the old fully-deterministic scheme: **`getDeterministicGenre()` no longer has final say over the subgenre**, only over the anchor handed to the model.
   - Output: `{ subgenre, sonic_profile, cause, choice }` — see `AnalysisSchema`
   - **Special-case directives**: `route.ts` detects a couple of precise input patterns server-side and appends an extra one-line directive to the prompt `input`, scoped to `cause` only (never `subgenre`/`sonic_profile`/`choice`) — `isGapMoment` (trivial event text at the most severe Stage) and `isPseudoVitutusMoment` (the *only* reported `physical_symptoms` are `weakness` + `legs_limp`, at `stage.index >= 6` — the exact inverse of the real Vitutusviisari study's severe-episode symptom profile, which is sympathetic-dominant). Both are additive and independent — see the comments directly above them in `route.ts` before changing either.

2. **Agent 2: Curator** (`/api/curator`, `src/app/api/curator/route.ts`)
   - Input: only the Matcher's `subgenre` + `sonic_profile` — no emotion, event, or diagnosis. That interpretation work is entirely the Matcher's job.
   - Uses OpenAI Responses API, `model: 'gpt-4.1'`, in-repo `instructions: CURATOR_INSTRUCTIONS` (`src/lib/prompts.ts`)
   - **No code-side candidate pool or dataset anymore.** There used to be a local artist database (`data/artists-complete-genres.json`) pre-filtered by genre-token overlap (`src/lib/artist-library.ts`) to guarantee real, genre-matched artists, but that dataset's genre tagging was too thin (~326 metal artists, mostly generic "metal"/"heavy" tags) to give good matches across the full intensity range. Both the JSON files and `artist-library.ts` have been **deleted**; the Curator now relies entirely on the model's own knowledge, instructed to only name real, existing artists and to return `link: null` rather than a guessed Bandcamp URL.
   - Output: exactly 10 `{ artist, link }` objects (`link` may be `null`)

**Critical Flow**: User Input (incident + trigger + intensity [+ symptoms/duration]) → Matcher (subgenre + sonic_profile + cause/choice) → Curator (10 artists) → UI Display (`ScreenDescent` → `ResultsPanel`)

**There is no `data/` directory anymore.** All emotion→genre calibration
lives in code (`src/lib/genre-mapping.ts`); there is no static JSON dataset
backing either agent. If you're tempted to add one back, prefer extending
the deterministic map or the prompt instructions instead — that keeps the
one no-JSON-drift invariant this section exists to document.

### UI Architecture

Three screens, orchestrated by `src/app/page.tsx` via a `Step` union
(`'selection' | 'analysis' | 'descent'`):

- **`ScreenSelection.tsx`** → `panels/StateOfMindPanel.tsx` — incident text, `ClassificationGrid.tsx` (trigger picker), `IntensitySlider.tsx`, `SymptomChecklist.tsx`, `DurationSelect.tsx`
- **`ScreenAnalysis.tsx`** — loading/diagnosis view while the Matcher call is in flight (`DiagnosticReceipt.tsx`, `StageHeader.tsx`, `DescentRail.tsx`)
- **`ScreenDescent.tsx`** → `panels/ResultsPanel.tsx` — final cause/choice/subgenre + curated artist list; `PrescriptionCalibration.tsx` for the (theatrical, not data-driven) curator-loading calibration display; `ReceiptCard.tsx` for the shareable QR receipt

Shared chrome: `RiteHeader.tsx`. Design tokens (colors, typography, spacing,
animation — `TEXT_PRIMARY`/`SECONDARY`/`TERTIARY`, `EASE`, `STAGES`,
`STRESS_TIERS`, etc.) are centralized in `src/lib/theme.ts` — see
`docs/design_guidelines.md` for the full system and how each token/component
is meant to be used. **Read that doc before adding or changing any graphical
element** — don't introduce a new one-off style when an existing token/
component already covers the job.

### State Management (`page.tsx`)

**Flow**:
1. User fills incident text, picks trigger + intensity (+ optional symptoms, always-present duration) on `ScreenSelection`
2. `triggerToEmotion()` derives the internal `primary` (`EmotionType`) value used only server-side, to compute `anchor_subgenre` — never sent to the model as its own field
3. POST `/api/matcher` with `EmotionData` (see below) → display Matcher's cause/choice/subgenre
4. POST `/api/curator` with the Matcher's `analysis` → display curated artists
5. `ScreenDescent` renders the combined result

**`EmotionData` shape sent to both APIs** (`page.tsx`):
```typescript
interface EmotionData {
  primary: EmotionType;       // derived via triggerToEmotion(), never asked for directly
  trigger: TriggerType;       // the user's actual selection
  stressLevel: number | null; // 0-10
  event: string | null;       // incident text
  symptoms: PhysicalSymptomType[]; // optional, defaults to []
  duration: DurationType;     // optional, defaults to 'just_now'
}
```

### Validation Layer (`src/lib/validation.ts`)

```typescript
EmotionDataSchema = z.object({
  primary: z.enum(CoreEmotions),               // 8 basic emotions — internal only
  trigger: z.enum(TriggerTypes),                // 8 user-facing categories
  stressLevel: z.number().min(0).max(10).nullable().optional(), // 0-10
  event: z.string().max(500).nullable().optional(),
  symptoms: z.array(z.enum(PhysicalSymptomTypes)).optional().default([]),
  duration: z.enum(DurationTypes).optional().default('just_now'),
})
```

**CRITICAL**: Frontend sends `null` (not `undefined`) for empty `stressLevel`/`event`. Validation must keep `.nullable().optional()` on those two fields.

`SonicProfileSchema` (also in `validation.ts`) is the Matcher's structured
output contract for its 5-axis sonic profile — keep the enum token lists
(`ActivationLevels`, `AgencyLevels`, `FrictionLevels`,
`CognitiveDensityLevels`, `WeightLevels`) in sync with `MATCHER_INSTRUCTIONS`
in `src/lib/prompts.ts` if either changes.

## API Integration Notes

### OpenAI Responses API

Both agents use the **Responses API** (not Assistants API, not a hosted
Prompt Object):
```typescript
import { MATCHER_INSTRUCTIONS } from '@/lib/prompts';

const response = await openai.responses.create({
  model: 'gpt-4.1',
  instructions: MATCHER_INSTRUCTIONS,
  input: `trigger: ...\nstress_level: ...\ncondition: ...\nevent: ...\nanchor_subgenre: ...\nphysical_symptoms: ...\nduration_persistence: ...`,
});
```
Variables are interpolated directly into `input` text — there is no
`prompt.variables` mechanism to keep in sync anymore.

**Response parsing**: primary `response.output_text`, with fallbacks that
walk `response.output[]` for a `message`/`output_text` item, then a regex
JSON extraction (`/\{[\s\S]*\}/`), then a best-effort text-salvage fallback if
JSON parsing fails entirely. See both route handlers for the exact fallback
chain — it's intentionally defensive since a malformed model response should
degrade gracefully, not 500 the whole request.

### Error Handling

All API routes follow this pattern:
```typescript
try {
  const validation = validateRequest(Schema, body);
  if (!validation.success) {
    return NextResponse.json({ error: validation.error }, { status: 400 });
  }
  // ... OpenAI call
} catch (error) {
  return NextResponse.json({ error: 'Failed to...' }, { status: 500 });
}
```

## Common Development Tasks

### Modifying Emotion-to-Genre Mappings

Edit `src/lib/genre-mapping.ts` (`GENRE_MAP`) directly — it's hand-authored
TypeScript, not generated from any data file. 8 emotions × 11 intensity tiers
(0-10). Keep every emotion's tier list complete (0 through 10).

### Adding/Changing Trigger Categories

1. Update `TriggerType` in `src/types/index.ts`
2. Update `TriggerTypes` (Zod) in `src/lib/validation.ts`
3. Update `TRIGGER_TYPES` in `src/lib/trigger.ts`, including its `description`
4. Add a mapping in `TRIGGER_TO_EMOTION` (`src/lib/trigger.ts`) — pick for tonal fit, not severity
5. `ClassificationGrid.tsx` renders `TRIGGER_TYPES` directly — no separate UI positioning step needed

### Changing the Intensity Scale

Currently: 0-10 (11 tiers, "ELEVEN" easter egg at the top).
1. Update `z.number().min(0).max(N)` in `validation.ts`
2. Update `MAX_STRESS_INTENSITY`/`STRESS_TIERS` in `src/lib/theme.ts` — keep `STRESS_TIERS` in sync with the descending stress-label list in `MATCHER_INSTRUCTIONS` (`src/lib/prompts.ts`); there's a code comment there marking this
3. Update `GENRE_MAP` tier ranges in `src/lib/genre-mapping.ts`
4. Update `getActiveStage()`'s severity blend in `src/lib/theme.ts` if the somatic/duration weighting assumptions change

### Editing Prompts

Instructions live entirely in `src/lib/prompts.ts` (`MATCHER_INSTRUCTIONS`,
`CURATOR_INSTRUCTIONS`) — edit there, not in the OpenAI dashboard; there is
no hosted Prompt Object to keep in sync. When editing `MATCHER_INSTRUCTIONS`,
check it still matches the real values in `src/lib/theme.ts` (`STRESS_TIERS`,
`STAGES`), `src/lib/duration.ts` (`DURATION_TIERS`), and `src/lib/symptoms.ts`
(`PHYSICAL_SYMPTOMS`) — these lists are hardcoded into the prompt text and
will silently drift if the source files change without a corresponding edit.

## Development Guardrails

**Never Modify**:
- `SonicProfileSchema` enum tokens without updating `MATCHER_INSTRUCTIONS` (and vice versa) — they must match exactly
- Validation schema nullability on `stressLevel`/`event` (frontend sends `null`, not `undefined`)

**Always Validate**:
- Intensity is numeric (0-10) in API payload
- Artist count = exactly 10 in curator response, all real and distinct
- Emotion is one of `CoreEmotions`, trigger is one of `TriggerTypes` (`src/lib/validation.ts`)
- Matcher/curator prose never names or paraphrases the displayed Stage/condition

**Text Contrast**:
- AI analysis text: `text-zinc-50` (not `text-zinc-100`)
- Minimum contrast: 4.5:1 for WCAG AA

## File Organization

```
src/
├── app/
│   ├── page.tsx                     # Main UI + orchestration (3-step flow)
│   ├── layout.tsx                   # Meta tags (title: "Sonic Catharsis")
│   └── api/
│       ├── matcher/route.ts         # Agent 1: incident+trigger+intensity → subgenre + sonic_profile
│       └── curator/route.ts         # Agent 2: subgenre + sonic_profile → 10 artists
├── components/
│   ├── ClassificationGrid.tsx       # 8-category trigger picker (3x3-ish grid)
│   ├── IntensitySlider.tsx          # 0-10 (displayed 1-11) intensity slider
│   ├── SymptomChecklist.tsx         # optional physical-symptoms multi-select
│   ├── DurationSelect.tsx           # optional duration/persistence single-select
│   ├── DiagnosticReceipt.tsx        # matcher-stage loading document
│   ├── PrescriptionCalibration.tsx  # curator-stage loading calibration display (theatrical)
│   ├── StageHeader.tsx              # Stage Roman numeral + vitutus name header
│   ├── DescentRail.tsx              # depth rail visualizing stage progression
│   ├── ReceiptCard.tsx              # shareable QR receipt
│   ├── RiteHeader.tsx               # shared top chrome
│   ├── panels/
│   │   ├── StateOfMindPanel.tsx     # ScreenSelection's intake panel
│   │   └── ResultsPanel.tsx         # ScreenDescent's cause/choice/artist display
│   └── screens/
│       ├── ScreenSelection.tsx      # Step 1: intake
│       ├── ScreenAnalysis.tsx       # Step 2: matcher loading/diagnosis
│       └── ScreenDescent.tsx        # Step 3: final results
├── lib/
│   ├── validation.ts                # Zod schemas (CRITICAL — read before changing any data shape)
│   ├── prompts.ts                   # In-repo agent instructions (MATCHER_INSTRUCTIONS, CURATOR_INSTRUCTIONS)
│   ├── genre-mapping.ts             # Hand-authored (emotion, intensity) → anchor subgenre lookup
│   ├── trigger.ts                   # TRIGGER_TYPES + triggerToEmotion() compatibility shim
│   ├── theme.ts                     # Design tokens + STAGES + getActiveStage() severity formula
│   ├── symptoms.ts                  # PHYSICAL_SYMPTOMS (optional intake field)
│   ├── duration.ts                  # DURATION_TIERS (optional intake field)
│   └── utils.ts                     # cn() for className merging
└── types/
    └── index.ts                     # TypeScript definitions
```

There is no `data/` directory — see "Two-Agent System" above.

## Debugging Tips

**Issue: Validation fails with "Expected number, received string"**
- Check the intensity conversion path in `page.tsx` before the API call
- Ensure the payload sends a numeric `stressLevel`, not a string label

**Issue: Matcher returns an odd or off-tone subgenre**
- Check `getDeterministicGenre()` in `genre-mapping.ts` for the anchor it handed the model — it's a prior, not a mandate, so the model may reasonably deviate
- Check `MATCHER_INSTRUCTIONS` in `prompts.ts` for the sonic-profile derivation steps

**Issue: Curator returns fewer than 10 artists, or a fabricated-looking one**
- There's no code-side candidate pool anymore — the model is relying entirely on its own knowledge (see "Two-Agent System" above)
- Review `CURATOR_INSTRUCTIONS` in `prompts.ts`'s guardrails section; tighten the "never fabricate" language if this recurs

**Issue: Matcher/Curator prose leaks the Stage name ("Raivovitutus", "Stage VII", etc.)**
- `removeDisplayedCondition()` in `src/app/api/matcher/route.ts` is a regex safety net over the model's raw `cause`/`choice` text — check it's still matching against the current `STAGES` names if this slips through
- Reinforce the "never repeat the condition" instruction in `MATCHER_INSTRUCTIONS` if it recurs frequently

## Security

- `.env.local` gitignored (contains `OPENAI_API_KEY`)
- No user data logged
- Input validation with Zod on all API routes
- HTTPS enforcement in production (Vercel)

## Further Reading

- `docs/data-model.md` — authoritative data-shape reference (supersedes this file's "Core Architecture" section where they'd ever disagree)
- `docs/formulas.md` — exact Stage/subgenre derivation formulas
- `docs/design_guidelines.md` — design system, tokens, component usage
- `docs/readme.md` — older, partially superseded project overview; cross-check against `data-model.md`/`formulas.md` before trusting anything data-shape-related in it
