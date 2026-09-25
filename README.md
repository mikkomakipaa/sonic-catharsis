# Sonic Catharsis

A situation-first web app that turns a petty, everyday grievance into a
clinically-deadpan "diagnosis" and a matching metal prescription — powered by
a two-agent AI pipeline that derives a sonic profile from what you actually
typed, not just two dropdowns.

<img width="1287" height="797" alt="image" src="https://github.com/user-attachments/assets/ca3659ee-5793-461c-a853-9f2a5354a7a4" />

## Overview

You describe an incident in your own words, pick the closest of 8 frustration
categories (a checkbox grid — not an emotion wheel), and rate how bad it
is on a 0–10 scale. From there:

1. **Matcher** reads your incident text and category, derives a 5-dimension
   sonic profile (activation, agency, friction, cognitive density, weight),
   picks a metal subgenre, and writes a darkly comic "Epicrisis" — a
   diagnosis (`Stage I–IX`, Finnish "Vitutus" terminology) plus a
   prescription rationale.
2. **Curator** takes that sonic profile and subgenre and finds 10 real,
   existing artists that deliver it — nothing else.

Full architecture and derivation details live in [`docs/data-model.md`](docs/data-model.md)
and [`docs/formulas.md`](docs/formulas.md).

## Features

- **Situation-first intake**: a free-text incident field is the dominant
  first interaction — not a category picker pretending to know how you feel.
- **Trigger classification grid**: 8 categories (injustice, failure,
  conflict, helplessness, overload, exhaustion, uncertainty, absurdity) as a
  plain, pseudo-clinical checkbox matrix.
- **Two-agent AI pipeline**: Matcher (incident → sonic profile + subgenre +
  diagnosis) and Curator (sonic profile + subgenre → 10 real artists),
  entirely separate concerns — Curator never sees the incident, emotion, or
  diagnosis.
- **Anchor-guided, not hardcoded, genre selection**: a deterministic
  `(emotion, intensity)` lookup table provides a stabilizing prior, but the
  model can deviate from it when the incident text warrants it — genre isn't
  a rigid 1:1 mapping.
- **The Nine Stages of Vitutus**: a deterministic I–IX severity scale
  (loosely inspired by a real, tongue-in-cheek Finnish "vitutus" study,
  cited via QR on every receipt) computed from intensity and category.
- **No fabricated links**: the Curator returns `null` rather than guessing a
  plausible-looking Bandcamp URL when it isn't sure one exists.

## Tech Stack

- **Frontend**: Next.js 15 (App Router) + React + TypeScript + Tailwind CSS
- **AI**: OpenAI Responses API (GPT-4.1), instructions owned in-repo
  (`src/lib/prompts.ts`) — not hosted OpenAI Prompt Objects
- **Validation**: Zod schemas for every API request/response shape
- **Deployment**: Vercel-ready

## Getting Started

### Prerequisites

- Node.js 18+
- OpenAI API key

### Installation

```bash
# Clone the repository
git clone https://github.com/mikkomakipaa/soniccatharsis.git
cd soniccatharsis

# Install dependencies
npm install

# Set up environment variables
# Create .env.local with:
# OPENAI_API_KEY=your_openai_api_key_here

# Start development server
npm run dev
```

Visit [http://localhost:3001](http://localhost:3001) to use the application.

## Project Structure

```
soniccatharsis/
├── src/
│   ├── app/
│   │   ├── page.tsx                  # Orchestration: selection → analysis → descent
│   │   ├── layout.tsx
│   │   └── api/
│   │       ├── matcher/route.ts      # Agent 1: incident → sonic profile + subgenre + diagnosis
│   │       └── curator/route.ts      # Agent 2: sonic profile + subgenre → 10 artists
│   ├── components/
│   │   ├── ClassificationGrid.tsx    # 3x3 trigger-category checkbox matrix
│   │   ├── IntensitySlider.tsx       # 0-10 intensity control (hidden 11th "ELEVEN" tier)
│   │   ├── StageHeader.tsx           # "Stage VII — Raivovitutus" display
│   │   ├── DescentRail.tsx           # I-IX progress rail
│   │   ├── ReceiptCard.tsx           # Printable receipt (Vitutus study QR)
│   │   ├── panels/                   # StateOfMindPanel, ResultsPanel
│   │   └── screens/                  # ScreenSelection, ScreenAnalysis, ScreenDescent
│   ├── lib/
│   │   ├── trigger.ts                # Trigger category metadata + legacy-emotion translation
│   │   ├── theme.ts                  # Stage (Vitutus) formula, design tokens
│   │   ├── genre-mapping.ts          # Deterministic anchor genre table
│   │   ├── prompts.ts                # In-repo Matcher/Curator instructions
│   │   ├── validation.ts             # Zod schemas (Trigger, sonic profile, API contracts)
│   │   └── artist-library.ts         # Unused — see docs/data-model.md
│   └── types/
│       └── index.ts                  # TriggerType, TriggerSelection, EmotionType, Playlist
├── data/                             # Legacy — superseded, see note below
├── docs/
│   ├── data-model.md                 # Data shapes: Trigger, Stage, sonic profile, API contracts
│   ├── formulas.md                   # Stage formula + anchor genre table + tuning history
│   ├── model.md                      # Superseded — points to the two docs above
│   ├── SECURITY_REVIEW.md
│   └── SECURITY_FIXES_IMPLEMENTED.md
└── package.json
```

> **`data/*.json` are legacy.** `full_mapping_matrix.json` was the original
> source for part of the anchor genre table (now a static TS lookup in
> `genre-mapping.ts`, not read from JSON at runtime). The artist JSON files
> and `src/lib/artist-library.ts` are unreferenced — the Curator uses the
> model's own artist knowledge, unconstrained by a code-side candidate pool.
> Neither is read by the running app.

## The Trigger Model

Not an emotion wheel — a situation-first classification. Users describe an
**incident** in free text, then pick the closest of 8 **trigger** categories:

```
injustice · failure · conflict
helplessness · overload · exhaustion
uncertainty · absurdity
```

Internally, each trigger has a compatibility translation into one of
8 basic emotions (`triggerToEmotion()`, `src/lib/trigger.ts`) —
the recommendation engine's Stage formula and anchor genre table are still
keyed on that internal vocabulary, but the Matcher is told explicitly to
weigh the user's actual trigger and incident text over this lossy
translation. See [`docs/data-model.md`](docs/data-model.md) for the full
translation table.

**Intensity** is 0–10 (displayed `1/10`–`10/10`, plus a hidden 11th
position at the same top value, displayed as `11/10` to deliberately break
the printed scale).

**Stage** (the "Vitutus" diagnosis, I–IX) is computed deterministically from
intensity and the translated emotion — intensity is the dominant driver,
spanning nearly the full range on its own; emotion only applies a small
flavor tilt. See [`docs/formulas.md`](docs/formulas.md) for the exact
formula and the floor/ceiling bug it replaced.

## API Endpoints

### POST /api/matcher (Agent 1: interpretation + sonic matching)

**Request**:

```json
{
  "emotionData": {
    "primary": "anger",
    "trigger": "injustice",
    "stressLevel": 7,
    "event": "Manager took credit for my project in the all-hands meeting."
  }
}
```

**Response**:

```json
{
  "analysis": {
    "subgenre": "death metal",
    "sonic_profile": {
      "activation": "aggressive",
      "agency": "confrontation",
      "friction": "abrasive",
      "cognitive_density": "direct",
      "weight": "heavy"
    },
    "cause": "This is textbook Raivovitutus, Stage VII...",
    "choice": "Death metal is the indicated treatment..."
  },
  "reasoning": "...",
  "cause": "...",
  "choice": "...",
  "subgenre": "death metal"
}
```

`subgenre` is the model's own reasoned pick, guided by a deterministic
`(emotion, intensity)` anchor table (a stabilizing prior, not a forced
answer) — never a hardcoded `trigger → genre` rule.

### POST /api/curator (Agent 2: sound → artists)

**Request**:

```json
{
  "analysis": {
    "subgenre": "death metal",
    "sonic_profile": { "activation": "aggressive", "agency": "confrontation", "friction": "abrasive", "cognitive_density": "direct", "weight": "heavy" }
  },
  "emotionData": { "primary": "anger", "trigger": "injustice", "stressLevel": 7, "event": "..." }
}
```

**Response**:

```json
{
  "artists": [
    { "artist": "Napalm Death", "link": "https://napalmdeath.bandcamp.com" },
    { "artist": "Undeath", "link": null },
    { "artist": "Deathspell Omega", "link": "https://deathspellomega.bandcamp.com" }
  ],
  "type": "artists"
}
```

Exactly 10 artists, all real and distinct. `link` is `null` rather than a
guessed URL when the Curator isn't confident one exists — the client falls
back to a Bandcamp search link in that case.

## Development

```bash
# Development
npm run dev

# Production build
npm run build
npm run start

# Linting
npm run lint

# Type checking
npm run typecheck
```

## License

MIT License

Copyright (c) 2025 Mikko Mäkipää

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.

## Author

Mikko Mäkipää
