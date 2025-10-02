# Sonic Catharsis

Metal Music Emotion Matching Application - AI-powered emotion detection with personalized metal music curation.

<img width="1287" height="797" alt="image" src="https://github.com/user-attachments/assets/ca3659ee-5793-461c-a853-9f2a5354a7a4" />


## Overview

Sonic Catharsis analyzes your emotional state through an interactive UI and curates metal music recommendations that match your mood. The application uses a two-agent architecture combining OpenAI's GPT-4 for emotion analysis with intelligent metal subgenre matching.

## Features

- **12-Emotion Wheel**: Interactive circular selector covering the full emotional spectrum
- **Stress Level Selector**: 7-level philosophical stress intensity scale (none → overload)
- **Two-Agent AI System**:
  - **Agent 1 (Emotion Matcher)**: Psychologist + metal aficionado mapping emotions to subgenres via matrix
  - **Agent 2 (Music Curator)**: 20 Curated artists using enriched artist database
- **Mapping Matrix**: 96 emotion/stress combinations → specific metal subgenres
- **Metal Subgenre Matching**: Intelligent mapping to 30+ nuanced subgenres (thrash, doom, black, power, etc.)
- **Artist Database**: Curated metal artist collection with genre classifications
- **Cathartic Reasoning**: Each recommendation includes psychological explanation + stress relief advice

## Tech Stack

- **Frontend**: Next.js 15 + React + TypeScript
- **Styling**: Tailwind CSS with glassmorphism design
- **AI**: OpenAI GPT-4 for emotion detection
- **Data**: Curated metal artist database with genre mappings
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
│   ├── app/                 # Next.js App Router
│   │   ├── page.tsx         # Main UI
│   │   ├── layout.tsx       # Root layout
│   │   └── api/            # API Routes
│   │       ├── matcher/route.ts      # Emotion analysis
│   │       ├── curator/route.ts      # Music curation
│   │       └── emotion-assistant/route.ts
│   ├── components/
│   │   ├── EmotionWheel.tsx          # 12-emotion selector
│   │   └── StressSelector.tsx        # Stress level slider
│   ├── lib/
│   │   ├── agent-orchestrator.ts     # Two-agent coordinator
│   │   ├── openai-emotion-agent.ts   # OpenAI integration
│   │   ├── metal-music-agent.ts      # Genre selector
│   │   ├── emotion-mapping.ts        # Emotion→Genre mappings
│   │   └── validation.ts             # Input validation schemas
│   └── types/
│       └── index.ts                  # TypeScript definitions
├── data/                    # Essential data files
│   ├── full_mapping_matrix.json      # 96 emotion/stress mappings
│   ├── artists-simple.json           # Artist database
│   └── artists-complete-genres.json  # Genre classifications
├── docs/                    # Documentation
│   ├── API_AGENTS.md               # Agent architecture
│   ├── SECURITY_REVIEW.md          # Security audit
│   └── SECURITY_FIXES_IMPLEMENTED.md
├── public/                  # Static assets
└── package.json            # Dependencies (runtime only)
```

## Emotion Model

### 12 Core Emotions (4 Quadrants)

- **Happy Quadrant**: happy, excited, content
- **Sad Quadrant**: sad, tired, inconsolable
- **Angry Quadrant**: angry, enraged, hysterical
- **Calm Quadrant**: calm, worried, energetic

### Stress Levels (8 Levels)

- `none`, `mild`, `light-moderate`, `normal`, `somewhat heavy`, `heavy`, `intense`, `overload`

### Metal Subgenres (30+ Mapped Genres)

**Core 10**: death, black, power, doom, thrash, progressive, symphonic, folk, industrial, nu-metal

**Extended Subgenres** (via mapping matrix):
- **Doom Family**: gothic doom, melodic doom, funeral doom, drone doom, death/doom
- **Black Family**: depressive black, suicidal black, epic black, blackened power/death
- **Power Family**: epic power, speed metal, progressive power
- **Death Family**: melodic death, progressive death, technical death
- **Experimental**: avant-garde, mathcore, noise, drone, dark ambient

### Mapping Matrix

**File**: `app/data/full_mapping_matrix.json` (96 combinations)

Each emotion/stress pair maps to a specific subgenre:
```json
{
  "emotion": "angry",
  "stress_level": "heavy",
  "genre": "thrash metal",
  "fallback_genre": "death metal"
}
```

## API Endpoints

### POST /api/matcher (Agent 1: Emotion Matcher)

Maps emotion/stress to metal subgenre using `full_mapping_matrix.json`.

**Agent 1 Persona**: Self-made psychologist, extreme metal aficionado offering cathartic relief

**Input**:
```json
{
  "emotionData": {
    "primary": "angry",          // 12 core emotions
    "stressLevel": 6,             // 0-7 scale
    "event": "Work deadline"      // Optional context
  }
}
```

**Output**:
```json
{
  "analysis": {
    "subgenre": "thrash metal",
    "primary_emotion": "angry",
    "stress_level": 6,
    "cause": "High-pressure work environment causing aggressive tension",
    "choice": "Thrash metal's rapid-fire precision provides cathartic energy outlet"
  },
  "reasoning": "Your anger under heavy stress demands aggressive musical catharsis. Thrash metal's relentless speed and precision mirror your need to channel frustration into controlled aggression...",
  "subgenre": "thrash metal"
}
```

### POST /api/curator (Agent 2: Music Curator)

Curates 20-track playlist from enriched artist database.

**Agent 2 Guardrails**:
- Exactly 20 unique tracks
- Each track from different artist
- Leverages `artists-musicbrainz-enriched.json` + `artists-openai-enriched.json`

**Input**:
```json
{
  "analysis": {
    "subgenre": "thrash metal",
    "primary_emotion": "angry",
    "stress_level": 6
  },
  "emotionData": { /* original user input */ }
}
```

**Output**:
```json
{
  "artists": [
    {"artist": "Slayer", "link": "https://music.apple.com/search?term=Slayer"},
    {"artist": "Metallica", "link": "https://music.apple.com/search?term=Metallica"},
    {"artist": "Testament", "link": "https://music.apple.com/search?term=Testament"}
    // ... 17 more unique artists
  ],
  "type": "artists"
}
```

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

MIT

## Author

Mikko Mäkipää
