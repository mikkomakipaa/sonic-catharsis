# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

# Sonic Catharsis - Metal Music Emotion Matching Application

**Project**: AI-powered emotion detection with personalized metal music curation
**Stack**: Next.js 15 + TypeScript + OpenAI GPT-4 + Tailwind CSS
**Status**: Production Ready (Minimal Viable Setup)

## 🎯 What This Application Does

Sonic Catharsis analyzes user emotional states through an interactive UI and curates metal music recommendations that match the mood. The system uses a **two-agent architecture**:

1. **OpenAI Emotion Agent** - Multi-turn conversational emotion detection using GPT-4
2. **Metal Music Selection Agent** - Maps detected emotions to metal subgenres and creates curated playlists

## 📂 Project Structure

```
soniccatharsis/                   # Clean minimal viable setup
├── src/
│   ├── app/                 # Next.js App Router
│   │   ├── page.tsx         # Main UI (Emotion Wheel + Stress Selector)
│   │   ├── layout.tsx       # Root layout
│   │   └── api/            # API Routes
│   │       ├── matcher/route.ts      # Emotion analysis endpoint
│   │       ├── curator/route.ts      # Music curation endpoint
│   │       └── emotion-assistant/route.ts
│   │   ├── components/
│   │   │   ├── EmotionWheel.tsx          # 12-emotion circular selector
│   │   │   └── StressSelector.tsx        # Vertical stress level slider
│   │   ├── lib/
│   │   │   ├── agent-orchestrator.ts     # Two-agent coordinator
│   │   │   ├── openai-emotion-agent.ts   # OpenAI conversation agent
│   │   │   ├── metal-music-agent.ts      # Genre/track selector
│   │   │   ├── emotion-mapping.ts        # Emotion→Genre mappings
│   │   │   ├── utils.ts                  # Utility functions
│   │   │   └── validation.ts             # Input validation schemas
│   │   └── types/
│   │       └── index.ts                  # TypeScript definitions
│   ├── data/                    # Essential data files only
│   │   ├── full_mapping_matrix.json      # 96 emotion/stress mappings
│   │   ├── artists-simple.json           # Artist database
│   │   └── artists-complete-genres.json  # Genre classifications
│   ├── docs/                    # Documentation
│   │   ├── API_AGENTS.md               # Agent architecture
│   │   ├── SECURITY_REVIEW.md          # Security audit
│   │   └── SECURITY_FIXES_IMPLEMENTED.md
│   ├── public/                  # Static assets
│   ├── package.json            # Dependencies (runtime only, no scraping tools)
│   ├── CLAUDE.md               # This file
│   └── README.md               # User documentation
```

**Note**: This is a clean minimal viable setup. The original `stateofmind` repository contains additional data processing scripts and tooling for artist database enrichment, which are not needed for users replicating the application.

## 🛠️ Development Commands

All commands should be run from the root directory:

```bash
cd soniccatharsis

# Development
npm run dev              # Start Next.js dev server (http://localhost:3001)

# Production
npm run build           # Production build
npm run start           # Start production server

# Code Quality
npm run lint            # ESLint
npm run typecheck       # TypeScript type checking (if configured)

# Environment Setup
# Create app/.env.local with:
# OPENAI_API_KEY=your_openai_api_key_here
```

**Note**: The dev server runs on port 3000 by default (not 3001 as mentioned in README.md).

## 🏗️ Key Architecture Concepts

### Two-Agent System (`agent-orchestrator.ts`)

The orchestrator manages communication between two specialized agents:

1. **Agent 1: Emotion Matcher** (`openai-emotion-agent.ts` → `/api/matcher`)
   - **Purpose**: Self-made psychologist & extreme metal aficionado
   - **Input**: Emotion (12 types) + Stress level (0-7) + Optional event context
   - **Process**: Consults `full_mapping_matrix.json` to map emotion/stress → subgenre
   - **Output**: Subgenre + Reasoning (catharsis explanation + non-conformist stress relief advice)
   - **Guardrail**: ⚠️ NEVER infer genres directly - always validate against mapping matrix
   - **Prompt ID**: `pmpt_68d3d94dbcd88197a948cb969863042c062ab4eee2638625`

2. **Agent 2: Music Curator** (`metal-music-agent.ts` → `/api/curator`)
   - **Purpose**: Curate 20-track metal playlist matching subgenre + emotion + stress
   - **Input**: Analysis from Agent 1 (subgenre, emotion, stress_level)
   - **Data Sources**:
     - `artists-musicbrainz-enriched.json` (342KB)
     - `artists-openai-enriched.json` (149KB)
     - `artists-complete-genres.json` (112KB)
   - **Output**: 20 unique tracks, each from different artist
   - **Guardrails**:
     - Exactly 20 songs required
     - No artist repetition
     - Fallback to genre classics if insufficient matches
   - **Prompt ID**: `pmpt_68d3d91a1af08194997b0de975ffee350667df88badd5a8e`

### Emotion Detection Flow

```
User Input → Agent 1 (Emotion Matcher) → Emotion/Stress Analysis
  |                                              ↓
  |                                    Mapping Matrix Lookup
  |                                    (full_mapping_matrix.json)
  |                                              ↓
  |                                      Subgenre Selection
  |                                              ↓
  |                           Agent 2 (Music Curator) → Artist Database Query
  |                                              ↓
  |                                      20-Track Playlist
  |                                              ↓
  └────────────────────────────→  User Receives Analysis + Artists + Links
```

### Mapping Matrix Structure

**File**: `app/data/full_mapping_matrix.json`

The mapping matrix defines emotion/stress combinations mapped to specific metal subgenres:

```json
[
  {
    "emotion": "angry",
    "stress_level": "heavy",
    "genre": "thrash metal",
    "fallback_genre": "death metal"
  },
  {
    "emotion": "sad",
    "stress_level": "mild",
    "genre": "melodic doom",
    "fallback_genre": "atmospheric doom"
  }
]
```

**Stress Levels**: `none`, `mild`, `light-moderate`, `normal`, `somewhat heavy`, `heavy`, `intense`, `overload`

### Core Types (`types/index.ts`)

**12 Core Emotions** (organized in 4 quadrants):
- **Happy**: `happy`, `excited`, `content`
- **Sad**: `sad`, `tired`, `inconsolable`
- **Angry**: `angry`, `enraged`, `hysterical`
- **Calm**: `calm`, `worried`, `energetic`

**10 Metal Subgenres**:
`death`, `black`, `power`, `doom`, `thrash`, `progressive`, `symphonic`, `folk`, `industrial`, `nu-metal`

**Key Interfaces**:
- `EmotionDetectionSession` - Multi-turn conversation state
- `EmotionAnalysis` - Detected emotion with intensity levels
- `Playlist` - Curated track list with metadata
- `Track` - Individual song with Apple Music integration

### Emotion-to-Genre Mapping (`emotion-mapping.ts`)

Each emotion maps to:
- **Primary genres** (best matches)
- **Secondary genres** (alternative options)
- **Keywords** (descriptive tags)

Example:
```typescript
angry: {
  primary: ['thrash', 'death', 'black'],
  secondary: ['industrial', 'nu-metal'],
  keywords: ['aggressive', 'furious', 'rage', 'violent', 'intense']
}
```

## 🔌 API Endpoints

### POST `/api/matcher`
Analyzes emotional state from emotion wheel + stress level + event context

**Input**:
```json
{
  "emotionData": {
    "primary": "angry",
    "stressLevel": 5,
    "event": "Work deadline stress"
  }
}
```

**Output**:
```json
{
  "analysis": {
    "subgenre": "thrash",
    "primary_emotion": "angry",
    "stress_level": 5,
    "cause": "Work-related pressure",
    "choice": "Aggressive energy outlet"
  }
}
```

### POST `/api/curator`
Generates artist recommendations based on matcher analysis

**Input**: `{ analysis, emotionData }`
**Output**: `{ artists: [{artist, link}], type: "artists" }`

### POST `/api/emotion-assistant`
OpenAI conversational emotion detection (not currently used in main UI)

**Input**: `{ messages }`
**Output**: Conversation response or emotion analysis JSON

## 📊 Data Files (`app/data/`)

- `Library.xml` - Apple Music library export (15MB XML)
- `artists-aggregated.json` - Processed artist metadata with play counts
- `artists-complete-genres.json` - Artist genre classifications
- `artists-embeddings.json` - Text embeddings for semantic search (43MB)

## 🧪 Testing Workflow

```bash
cd app
npm run dev
# Open http://localhost:3000
# Test flow: Select emotion → Set stress → Add event → Analyze → View artists
```

## 🔐 Security & Environment Variables

**CRITICAL**: All secrets must be in environment variables, never committed to git.

**Required Environment Variables** (in `app/.env.local`):
```bash
OPENAI_API_KEY=sk-...
```

**Security Checklist**:
- ✅ `app/.env.local` is gitignored
- ✅ No API keys in code
- ✅ Input sanitization in API routes
- ✅ HTTPS enforcement for production
- ❌ Never log user emotion data or PII

## 🎨 UI/UX Architecture

### Three-Column Layout (5-5-2 Grid)
1. **Left (5/12)**: Emotion wheel + vertical stress selector + event context input
2. **Middle (5/12)**: AI analysis (cause analysis + choice reasoning)
3. **Right (2/12)**: Curated artist list with Bandcamp links

### Key Components
- **EmotionWheel.tsx**: Interactive 12-emotion circular selector with intensity mapping
- **StressSelector.tsx**: Vertical slider with 7 philosophical stress levels
- **page.tsx**: Main orchestration, state management, API calls

### Design System
- **Framework**: Tailwind CSS v4
- **Style**: Glassmorphism with dark theme (zinc/slate gradients)
- **Icons**: Lucide React
- **Accessibility**: Keyboard navigation, ARIA labels, 4.5:1 contrast minimum

## 🚨 Critical Development Rules

### What AI Must NEVER Do
1. **Never modify test files** - Tests encode human intent
2. **Never change API contracts** - Breaks real applications
3. **Never commit secrets** - Use environment variables only
4. **Never assume business logic** - Always ask for clarification
5. **Never hardcode OpenAI API keys** - Use `OPENAI_API_KEY` env var
6. **Never save working files to root folder** - Use appropriate subdirectories

### Code Quality Standards
- **TypeScript Strict Mode**: All code fully typed
- **File Size Limit**: Files under 500 lines
- **Formatting**: Prettier with 100-char lines
- **Imports**: Sorted with simple-import-sort
- **Components**: PascalCase, co-located with tests
- **Mobile-First**: Responsive design required

## 🔧 Common Development Workflows

### Adding a New Emotion-to-Genre Mapping
1. Edit `app/src/lib/emotion-mapping.ts`
2. Add to `emotionToMetalMapping` object
3. Update `app/src/types/index.ts` if new emotion type
4. Test in UI: Emotion Wheel → Select emotion → Verify genre matches

### Adding a New API Endpoint
1. Create `app/src/app/api/[endpoint]/route.ts`
2. Define POST handler with proper TypeScript types
3. Add error handling (try/catch)
4. Test with curl or browser
5. Update this CLAUDE.md with endpoint documentation

### Modifying OpenAI Prompts
1. Edit `EMOTION_DETECTION_SYSTEM_PROMPT` in `openai-emotion-agent.ts`
2. Test conversation flow in UI
3. Monitor token usage (system prompt affects every API call)
4. Document prompt changes in commit message

### Working with Music Library Data
- **Location**: `app/data/`
- **Scripts**: `app/scripts/` (data processing)
- **Formats**: CSV, JSON, XML (Apple Music Library.xml)
- **DO NOT** commit large data files (>50MB) without compression

## 📋 Definition of Done

Before marking any task complete, ensure:

- [ ] TypeScript strict mode clean (`npm run typecheck` in app/)
- [ ] ESLint clean (`npm run lint` in app/)
- [ ] Component tests for new UI components
- [ ] API route tests for new endpoints
- [ ] Accessibility check (keyboard nav, screen reader)
- [ ] Mobile responsiveness verified (375px, 768px, 1024px+)
- [ ] No secrets committed (check `.env.local` is ignored)
- [ ] CLAUDE.md updated if architecture changed

## 🔄 Legacy Code (Deprecated)

The `frontend/` and `backend/` directories contain legacy Vite + Express implementations that are **no longer active**. All development should focus on the `app/` directory (Next.js application).

**Do not use**:
- `frontend/package.json` commands
- `backend/package.json` commands
- Express API routes
- Vite build system

## 📝 Additional Resources

- `Solution.md` - Detailed requirements, use cases, and architecture decisions
- `README.md` - Project overview and getting started guide
- `/memory` - Claude Flow memory and session data (for AI orchestration)
- `claude-flow.config.json` - Claude Flow orchestration configuration
