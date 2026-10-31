# Sonic Catharsis

A situation-first web app that turns a petty, everyday grievance into a
clinically-deadpan "diagnosis" and a matching metal prescription. A two-agent
AI pipeline derives a sonic profile from what you actually typed, picks a
metal subgenre, and names seven real bands to treat it. If you turn out to be
too calm to treat, the clinic provokes you.

<img width="1287" height="797" alt="image" src="https://github.com/user-attachments/assets/ca3659ee-5793-461c-a853-9f2a5354a7a4" />

## How it works

The app is a short ritual, presented as pages of one case file:

1. **Intake / Case 001** — describe the incident in your own words
   (optional, ≤500 characters), pick the closest of 8 trigger categories,
   dial in how bad it is (intensity) and how long it has been festering
   (duration), and optionally tick physical symptoms. Intensity and duration
   are required; the submit button says which one is missing.
2. **Clinical Note / Epicrisis 001** — a deterministic severity **Stage**
   (I–IX, Finnish "vitutus" names) and the Matcher's darkly comic
   observation and treatment (the chosen subgenre).
3. **Prescription / Case 001** — seven real bands, each linking to a Bandcamp
   search for the name, plus a header with the case details and a QR code to the real
   study the app borrows from.

Two agents sit behind steps 2 and 3:

- **Matcher** reads the incident, trigger, intensity, symptoms and duration,
  derives a 5-axis sonic profile (activation, agency, friction, cognitive
  density, weight), picks a subgenre, and writes the observation and
  treatment text. The subgenre is chosen by the model from the prompt alone; a
  deterministic `(emotion, intensity)` table is only a fallback if its pick is invalid.
- **Curator** receives only the subgenre and sonic profile — never the
  incident, trigger or diagnosis — and returns 7 real, distinct artists.

### Provoke Me and Seppo

If the reading is too calm to treat (Level 0 pseudo-vitutus or Stage I), the
Epicrisis offers a **referral**. The clinic then shows up to **three**
illustrated stimuli ("Joko vituttaa?"). Saying yes re-runs the diagnosis from
that stimulus; the chart then records the vitutus as *iatrogenic*.

Decline all three and you are escalated to **Seppo**, a furious "human"
live-chat agent who insults you for up to three messages, then files an
assessment of you; you press the assess button to see the diagnosis, then Get Prescription for the artists, where Seppo leaves a one-line remark next to every artist. Seppo's hard limits
(no protected-trait insults, no slurs, no realistic threats, self-harm drops
the act) live in his prompt.

### The Nine Stages of Vitutus

Stage is computed deterministically, not by the model: **85% intensity,
10% physical symptoms, 5% duration**. The trigger category is deliberately not
an input. Reporting only weakness and limp legs yields a dedicated
"Level 0: Pseudo-vitutus" instead of a real stage. The scale is loosely
inspired by a real, tongue-in-cheek Finnish study, cited by the QR code on every prescription.
Details are in [`docs/formulas.md`](docs/formulas.md).

Intensity is 0–10 on the slider, with a hidden 11th position past the end
of the track that breaks the printed scale on purpose.

## Tech stack

- **Frontend**: Next.js 16 (App Router), React 19, TypeScript, Tailwind CSS 4
- **AI**: OpenAI Responses API (`gpt-4.1`) for the Matcher, Curator, Assessor
  and Seppo; instructions live in-repo in `src/lib/prompts.ts`
- **Validation**: Zod schemas for every API request and response
- **Tests**: Vitest (the OpenAI client is mocked; no key or network needed)
- **Deployment**: Vercel

## Getting started

Requires Node.js 20.9+ and an OpenAI API key.

```bash
git clone https://github.com/mikkomakipaa/sonic-catharsis.git
cd sonic-catharsis
npm install
echo "OPENAI_API_KEY=sk-..." > .env.local
npm run dev
```

Open [http://localhost:3001](http://localhost:3001). `OPENAI_API_KEY` is the
only environment variable the app reads.

```bash
npm run build       # production build
npm run start       # serve the build on port 3001
npm run lint
npm run typecheck
npm run test
```

## Project structure

```
src/
├── app/
│   ├── page.tsx                 # Orchestration: selection → analysis → (provoke → vittuilu) → descent
│   └── api/
│       ├── matcher/route.ts     # Incident → sonic profile + subgenre + observation
│       ├── curator/route.ts     # Sonic profile + subgenre → 7 artists
│       ├── assess/route.ts      # Stimulus → intensity (Joko vituttaa? → yes)
│       └── vittuilu/route.ts    # Seppo: stateless multi-turn rant chat + assessment
├── components/
│   ├── screens/                 # ScreenSelection, ScreenAnalysis, ScreenProvoke, ScreenVittuilu, ScreenDescent
│   ├── panels/                  # StateOfMindPanel (intake form), ResultsPanel (prescription)
│   └── …                        # ClassificationGrid, IntensitySlider, DurationSelect, SymptomChecklist,
│                                # StageHeader, DescentRail, StimulusPlate, StudyQr, …
├── lib/
│   ├── theme.ts                 # Stage formula (getActiveStage), design tokens
│   ├── genre-mapping.ts         # Fallback genre table (model picks the subgenre)
│   ├── provocations.ts          # Provoke Me stimuli, session size, Seppo's stand-in stimulus
│   ├── prompts.ts               # In-repo Matcher / Curator / Assessor / Seppo instructions
│   ├── validation.ts            # Zod schemas and API contracts
│   ├── trigger.ts, symptoms.ts, duration.ts
│   └── openai-client.ts, openai-response.ts
public/provocations/             # Drawn SVG plates for the stimuli
data/                            # App icons only; no runtime data
docs/                            # data-model, formulas, design guidelines, security reviews
```

`AGENTS.md` is the guide for AI coding agents, with the detailed architecture.
`docs/data-model.md` is the authoritative reference for data shapes, and
`docs/design_guidelines.md` for the visual system.

## API

All routes are unauthenticated `POST` endpoints that call a paid model, so
production should sit behind a rate limit (Vercel WAF). Model output is
untrusted: every route returns only schema-validated fields, and none logs
request payloads.

| Route | Request | Response |
|---|---|---|
| `/api/matcher` | `{ emotionData: { primary, trigger, stressLevel, event, symptoms, duration, provoked } }` | `{ analysis, reasoning, cause, choice, subgenre }` |
| `/api/curator` | `{ analysis: { subgenre, sonic_profile }, emotionData }` | `{ artists: [{ artist, link }] (10), type }` |
| `/api/assess` | `{ trigger, incident }` | `{ intensity }` |
| `/api/vittuilu` | `{ messages, intake? }` (full transcript each turn) | `{ reply, end_chat, assessment? }` |

Notes:

- `reasoning` is always non-empty (`cause || choice || subgenre`) and never
  contains the raw model reply.
- The Curator returns `link: null` rather than a guessed URL, and the client
  ignores `link` anyway: it builds a Bandcamp *search* link from the artist
  name. Because names are ambiguous, a search can surface the wrong band.
- If the Matcher or Curator reply is invalid after one retry, the route
  returns 500 rather than placeholder content.
- `emotionData.primary` is an internal vocabulary derived from the trigger
  (`triggerToEmotion()`), used only to look up the fallback subgenre.

Full shapes and schemas: [`docs/data-model.md`](docs/data-model.md).

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
