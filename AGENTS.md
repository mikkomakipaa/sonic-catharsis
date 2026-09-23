# AGENTS.md

This file provides guidance to Codex (Codex.ai/code) when working with code in this repository.

# Sonic Catharsis - Metal Music Emotion Matching Application

**Stack**: Next.js 15 + TypeScript + OpenAI GPT-4 (Responses API) + Tailwind CSS v4
**Status**: Production Ready
**Port**: 3001

## Quick Start Commands

```bash
# Development
npm run dev              # Start dev server at http://localhost:3001

# Production
npm run build           # Production build
npm run start           # Start production server (port 3001)

# Code Quality
npm run lint            # ESLint
npm run typecheck       # TypeScript strict type checking
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

### Two-Agent System (Emotion → Music)

The application uses a **sequential two-agent pipeline** orchestrated from `src/app/page.tsx`:

1. **Agent 1: Emotion Matcher** (`/api/matcher`)
   - Maps user input (emotion + stress + event) → metal subgenre
   - Uses OpenAI Responses API with `model: 'gpt-4.1'` and in-repo `instructions: MATCHER_INSTRUCTIONS` (see `src/lib/prompts.ts`) — no hosted OpenAI Prompt Object anymore
   - **Data Source**: `data/full_mapping_matrix.json` (96 emotion/stress combinations); final subgenre is actually decided deterministically by `getDeterministicGenre()` in `src/lib/genre-mapping.ts`, overriding whatever the model returns
   - **Output**: Subgenre + reasoning (cause analysis + cathartic choice explanation)

2. **Agent 2: Music Curator** (`/api/curator`)
   - Takes Agent 1's subgenre → curates exactly 10 unique artists
   - Uses OpenAI Responses API with `model: 'gpt-4.1'` and in-repo `instructions: CURATOR_INSTRUCTIONS` (see `src/lib/prompts.ts`) — no hosted OpenAI Prompt Object or vector store anymore
   - **Data Sources**: `src/lib/artist-library.ts` pre-filters `data/artists-complete-genres.json` by genre-token overlap with the subgenre and hands the model a fixed candidate pool; the model must pick only from that pool
   - **Output**: Array of exactly 10 artist objects with Bandcamp links

**Critical Flow**: User Input → Matcher (subgenre) → Curator (artists) → UI Display

### Data Layer

**Mapping Matrix** (`data/full_mapping_matrix.json`):
- 96 entries: 12 emotions × 8 stress levels
- Each entry: `{ emotion, stress_level: 0-7, genre, fallback_genre }`
- **IMPORTANT**: `stress_level` is numeric (0-7), NOT string
  - Frontend converts: `'none'→0, 'mild'→1, ..., 'multi-climax'→7`
  - Validation enforces: `z.number().min(0).max(7)`

**12 Core Emotions** (4 quadrants):
- Happy: `happy`, `excited`, `content`
- Sad: `sad`, `tired`, `inconsolable`
- Angry: `angry`, `enraged`, `hysterical`
- Calm: `calm`, `worried`, `energetic`

**Stress Levels** (V-curve model):
- 8 levels: `none`(0) → `multi-climax`(7)
- UI: Vertical gradient selector (grayscale in dark mode, rainbow in party mode)

### UI Architecture

**Layout**: 5-4-3 grid (left-middle-right)
- **Left (5/12)**: Emotion wheel + stress selector + event input
- **Middle (4/12)**: AI analysis (cause + choice)
- **Right (3/12)**: Curated artist list

**Themes**:
- **Dark Mode** (default): Zinc gradients, grayscale stress selector
- **Party Mode**: Pink/purple gradients, rainbow selector, unified white/pink backgrounds

**Key Components**:
- `EmotionWheel.tsx`: 12-emotion circular selector with intensity mapping
- `StressSelector.tsx`: 7-level vertical slider with V-curve stress model
- `page.tsx`: Main orchestrator with state management

### State Management (page.tsx)

**Critical State Flow**:
1. User selects emotion/stress/event
2. `startAssistantWithWheelData()` converts stress string → number
3. POST to `/api/matcher` with numeric stress level
4. Display Agent 1 analysis (cause, choice, subgenre)
5. POST to `/api/curator` with Agent 1's output
6. Display Agent 2 artist list

**State Shape**:
```typescript
primarySelection: EmotionWheelSelection | null  // Selected emotion
stressLevel: StressLevel | null                 // String from selector
emotionData: {
  primary: string,
  stressLevel: number,  // CONVERTED before API call
  event: string | null
}
```

### Validation Layer (`src/lib/validation.ts`)

Uses Zod schemas with nullable support:
```typescript
EmotionDataSchema = z.object({
  primary: z.enum(CoreEmotions),
  stressLevel: z.number().min(0).max(7).nullable().optional(),  // 0-7 numeric
  event: z.string().max(500).nullable().optional()
})
```

**CRITICAL**: Frontend sends `null` (not `undefined`) for empty fields. Validation must use `.nullable().optional()`.

## API Integration Notes

### OpenAI Responses API

Both agents use the **Responses API** (not Assistants API), with prompt text owned in-repo rather than a hosted Prompt Object:
```typescript
import { MATCHER_INSTRUCTIONS } from '@/lib/prompts';

const response = await openai.responses.create({
  model: 'gpt-4.1',
  instructions: MATCHER_INSTRUCTIONS,
  input: `emotion: ${emotion}\nstress_level: ${stress}\nevent: ${event}`,
});
```
Variables are interpolated directly into `input` text (the old `prompt.variables` mechanism only exists for hosted Prompt Objects).

**Response parsing**:
- Primary: `response.output_text`
- Fallback: `response.output[0].content[0].text`
- Extract JSON with regex: `/\{[\s\S]*\}/`

### Error Handling

All API routes follow pattern:
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

Frontend displays errors in `cause` state for visibility.

## Common Development Tasks

### Modifying Emotion-to-Genre Mappings

1. Edit `data/full_mapping_matrix.json` (keep numeric stress levels)
2. **Do NOT** convert numbers back to strings
3. Ensure all 96 combinations present (12 emotions × 8 stress levels)
4. Test with various emotion/stress combinations

### Adding New Emotions

1. Update `CoreEmotions` array in `src/lib/validation.ts`
2. Add to `CoreEmotionType` in `src/types/index.ts`
3. Add 8 entries to `full_mapping_matrix.json` (one per stress level)
4. Update `EmotionWheel.tsx` UI positioning

### Changing Stress Level Range

Currently: 0-7 (8 levels)
1. Update `z.number().min(0).max(N)` in `validation.ts`
2. Update `stressIntensityMap` in `page.tsx`
3. Update `STRESS_LEVELS` array in `StressSelector.tsx`
4. Add/remove entries in `full_mapping_matrix.json`

### Theme Customization

Colors, typography, spacing, and animation are centralized in `src/lib/theme.ts` (tokens like `TEXT_PRIMARY`/`SECONDARY`/`TERTIARY`, `SECTION_LABEL_STYLE`, `STAGES`, `STRESS_TIERS`, `EASE`) — see `docs/design_guidelines.md` for the full system and how each token/component is meant to be used.

## UI & Design Guidelines

Before adding or changing **any graphical element** — a new component, screen, card, button variant, color, spacing value, radius, font weight, or animation — read **`docs/design_guidelines.md`** first. It is the source of truth for this app's design system and documents which existing tokens/components to reuse. Don't introduce a new one-off style when an existing one already covers the job; if nothing fits, that's a real design decision to flag, not something to improvise silently.

Also check the rest of `docs/` (`data-model.md`, `formulas.md`, `readme.md`) for how the underlying data/logic a UI element represents actually works before styling around it — e.g. don't build a UI assuming the old 12-emotion/0-7-stress model described in this file's own "Core Architecture" section above; that section is stale (see Known Stale Sections at the bottom of this file) and `docs/data-model.md` reflects the current Trigger-based, 0-10 model.

## Development Guardrails

**Never Modify**:
- Mapping matrix structure (96 entries, numeric stress levels)
- Validation schema nullability (frontend sends `null`)

**Prompt changes**: instructions live in `src/lib/prompts.ts` (`MATCHER_INSTRUCTIONS`, `CURATOR_INSTRUCTIONS`) — edit there, not in the OpenAI dashboard; there's no hosted Prompt Object to keep in sync anymore.

**Always Validate**:
- Stress level is numeric (0-7) in API payload
- Artist count = exactly 10 in curator response
- Emotion is one of the core emotions in `CoreEmotions` (`src/lib/validation.ts`)

**Text Contrast**:
- AI analysis text: `text-zinc-50` (not `text-zinc-100`)
- Minimum contrast: 4.5:1 for WCAG AA

## File Organization

```
src/
├── app/
│   ├── page.tsx              # Main UI + orchestration
│   ├── layout.tsx            # Meta tags (title: "Sonic Catharsis")
│   └── api/
│       ├── matcher/route.ts  # Agent 1: Emotion→Subgenre
│       └── curator/route.ts  # Agent 2: Subgenre→Artists
├── components/
│   ├── EmotionWheel.tsx      # 12-emotion selector
│   └── StressSelector.tsx    # 7-level vertical slider
├── lib/
│   ├── validation.ts         # Zod schemas (CRITICAL)
│   ├── prompts.ts            # In-repo agent instructions (MATCHER_INSTRUCTIONS, CURATOR_INSTRUCTIONS)
│   ├── genre-mapping.ts      # Deterministic (emotion, stress) → subgenre lookup
│   ├── artist-library.ts     # Genre-token filter over artists-complete-genres.json for the curator's candidate pool
│   └── utils.ts              # cn() for className merging
└── types/
    └── index.ts              # TypeScript definitions

data/
├── full_mapping_matrix.json  # 96 emotion/stress→genre mappings
└── artists-*.json            # Artist database for curator
```

## Debugging Tips

**Issue: Validation fails with "Expected number, received string"**
- Check `stressIntensityMap` conversion in `page.tsx`
- Ensure frontend sends numeric `stressLevel` to API

**Issue: Matcher returns wrong genre**
- Verify `full_mapping_matrix.json` has correct entry
- Check stress level is 0-7 numeric (not string)

**Issue: Curator returns < 10 artists**
- Check `getArtistCandidates()` in `src/lib/artist-library.ts` returns enough candidates for the subgenre (it falls back to the wider metal pool if too few genre-token matches exist)
- Review `CURATOR_INSTRUCTIONS` in `src/lib/prompts.ts` for fallback logic

**Issue: Theme colors not applying**
- Verify `playfulMode` state propagation to child components
- Check inline `style` objects override Tailwind classes

## Security

- `.env.local` gitignored (contains `OPENAI_API_KEY`)
- No user data logged
- Input validation with Zod on all API routes
- HTTPS enforcement in production (Vercel)

## Known Stale Sections

This file predates the Trigger-based redesign and was not fully rewritten with it — several sections above still describe the old UI and don't match the current app. Do not follow them; they're kept for history until a full rewrite. Known stale:
- **Core Architecture → Data Layer / UI Architecture**: describes 12 emotions, an 0-7 stress scale, `EmotionWheel.tsx`/`StressSelector.tsx`, a 5-4-3 grid layout, and dark/party mode theming. None of this exists anymore — the current intake is Trigger-based (`ClassificationGrid.tsx` + `IntensitySlider.tsx` + `StateOfMindPanel.tsx`) on a 0-10 intensity scale. See `docs/data-model.md` and `docs/design_guidelines.md` for the current model.
- **Common Development Tasks → Adding New Emotions / Changing Stress Level Range**: references files/ranges from the old model; not applicable as written.
- **File Organization**: missing most current files (`StateOfMindPanel.tsx`, `ClassificationGrid.tsx`, `IntensitySlider.tsx`, `StageHeader.tsx`, `DescentRail.tsx`, `ReceiptCard.tsx`, `CassetteLoader.tsx`, `genre-mapping.ts`, `trigger.ts`, `theme.ts`, and more).
- **Debugging Tips → Theme colors not applying**: references `playfulMode`, which no longer exists.
