# learn { } with AI

> An LLM agnostic, local-first web app that analyzes your AI conversation history and generates a personalized learning curriculum — surfacing knowledge gaps as structured study cards.

Built natively on the Anthropic API as a portfolio project. Designed with privacy-first architecture, modular LLM integration, and WCAG AA accessibility standards throughout.

---

## Concept

The things you ask an AI to explain, debug, or do for you are exactly the things worth learning properly. Rather than manually tracking knowledge gaps, this app retrospectively analyzes your Claude conversations and generates structured study cards from them — surfacing what you should learn, at what depth, and in what order.

---

## Features

- **Conversation analysis** — import your Claude conversation history and generate topic cards per conversation
- **LLM agnostic** — configure any LLM (Anthropic, OpenAI, Ollama, Groq, Mistral, or custom endpoint) with priority-based failover
- **Three-tier learning model** — Surface (what you use), Mechanism (how it works), Substrate (what it runs on)
- **Analysis modes** — Guided (categories as context) or Strict (categories as hard constraints)
- **Complexity estimator** — real-time token estimation relative to a baseline call before committing to an analysis
- **Analysis queue** — queue multiple conversations for batch analysis with drag-and-drop reordering
- **Learning queue** — add topics to a personal queue with tutorial URL bookmarking
- **Global topic view** — filter and sort all cards across conversations by tier, category, and status
- **Per-analysis overrides** — override global preferences per conversation before analyzing
- **Privacy first** — conversation content never leaves your machine; only titles are sent to the LLM API

---

## Screenshots

_Coming soon_

---

## Tech Stack

- **Frontend:** Next.js 16 (App Router), TypeScript, Tailwind CSS
- **Storage:** SQLite via `better-sqlite3` (local), Vercel Postgres (hosted — stub, future)
- **Drag and drop:** `@dnd-kit/core`, `@dnd-kit/sortable`
- **LLM:** Anthropic Claude via `@anthropic-ai/sdk` (default), OpenAI-compatible adapter for all other providers
- **Deployment:** Local via `npm run learn`, Vercel (future)

---

## Dependencies & Licenses

All dependencies are MIT licensed unless otherwise noted.

| Package | License | Purpose |
|---------|---------|---------|
| `next` | MIT | React framework, routing, API routes |
| `react` | MIT | UI component library |
| `react-dom` | MIT | React DOM renderer |
| `typescript` | Apache-2.0 | Type safety |
| `tailwindcss` | MIT | Utility-first CSS |
| `@anthropic-ai/sdk` | MIT | Anthropic Claude API client |
| `better-sqlite3` | MIT | Local SQLite database |
| `uuid` | MIT | UUID generation for card IDs |
| `@dnd-kit/core` | MIT | Drag and drop core |
| `@dnd-kit/sortable` | MIT | Sortable drag and drop |
| `@dnd-kit/utilities` | MIT | Drag and drop utilities |
| `eslint` | MIT | Code linting |
| `@types/node` | MIT | Node.js type definitions |
| `@types/react` | MIT | React type definitions |
| `@types/better-sqlite3` | MIT | SQLite type definitions |
| `@types/uuid` | MIT | UUID type definitions |

> Note: `typescript` uses the Apache-2.0 license, which is permissive and compatible with MIT projects.

---

## Installation

### Prerequisites

- Node.js v18 or higher
- Git

### Quick Install

```bash
git clone https://github.com/DanielAyer/learnWithAI.git
cd learnWithAI
bash install.sh
```

The installer will prompt you to choose one of three setup paths:

```
Select your install type:

  1) No LLM       — I'll configure one later in the app
  2) Local LLM    — Install Mistral 7B via Ollama (free, ~5GB, no API key needed)
  3) API LLM      — Connect to Claude, OpenAI, Groq, Mistral, or custom endpoint
```

### Start the App

```bash
npm run learn
```

Open `http://localhost:3000` in your browser.

---

## Setup: Importing Conversations

The app analyzes your Claude conversation history. To import it:

1. Go to `claude.ai → Settings → Privacy → Export Data`
2. Download and extract the ZIP file
3. In the app, go to **Conversations** and click **+ Add**
4. Upload the `conversations.json` file

> **TODO: CONVERSATIONS_API** — This manual export step will be replaced by a direct API call once Anthropic exposes `GET /v1/conversations`. See the Feature Request section below.

---

## Architecture

### LLM Adapter Pattern

All LLM calls go through a single interface defined in `lib/llm/index.ts`. The active implementation is resolved at runtime from `data/llm-configs.json`. Swapping LLMs requires no code changes — only a config update.

```
lib/llm/
  index.ts              ← interface + factory with failover
  configs.ts            ← reads/writes llm-configs.json, resolves timeouts
  claude.ts             ← Anthropic SDK implementation
  openai-compatible.ts  ← OpenAI-compatible (Ollama, Groq, Mistral, etc.)
```

### Database Adapter Pattern

All database calls go through a single interface defined in `lib/db/index.ts`. Local development uses SQLite. Hosted deployment will use Vercel Postgres — the adapter interface is identical, only the implementation changes.

```
lib/db/
  index.ts      ← interface + environment-based factory
  sqlite.ts     ← local dev implementation
  postgres.ts   ← hosted deployment (stub, ready to implement)
```

### LLM Configuration

Stored in `data/llm-configs.json` (excluded from git). Supports multiple configurations with priority ordering and per-config timeout overrides.

```json
{
  "globalTimeoutMs": 30000,
  "activeIndex": 0,
  "configs": [
    {
      "index": 0,
      "label": "Mistral 7B (local)",
      "provider": "Ollama",
      "baseUrl": "http://localhost:11434/v1",
      "model": "mistral",
      "timeoutMs": 60000,
      "status": "untested"
    },
    {
      "index": 1,
      "label": "Claude Sonnet 4.6",
      "provider": "Anthropic",
      "baseUrl": "https://api.anthropic.com",
      "model": "claude-sonnet-4-6",
      "timeoutMs": null,
      "status": "untested"
    }
  ]
}
```

Failover is index-ordered. If index 0 times out or fails, index 1 is tried, then index 2, and so on.

---

## Complexity Estimator

Every analysis page shows a real-time complexity estimate relative to a defined baseline call. This is LLM-agnostic — it measures token count not cost, so it remains accurate regardless of provider or pricing changes.

### Baseline Call

| Parameter | Baseline value |
|-----------|---------------|
| Cards | 3 |
| Categories | 1 |
| Mode | Guided |
| Learned topics to exclude | 0 |
| **Estimated total tokens** | **~495** |

### Token Estimation Formula

```
input tokens  = 190
              + (categories.length × 5)
              + (learnedTopics × 5)
              + (mode === 'strict' ? 30 : 0)

output tokens = maxCards × 100

total tokens  = input + output
multiplier    = total / baseline total
```

### Complexity Labels

| Multiplier | Label | Color |
|------------|-------|-------|
| ≤ 2x | Lightweight | Green |
| 2x – 5x | Moderate | Yellow |
| > 5x | Heavy | Orange |

> Token counts are estimates. Actual tokenization varies by model and content. This is intentionally a relative comparator, not a billing estimate, to remain LLM-agnostic.

---

## Project Structure

```
/
├── app/
│   ├── page.tsx                        ← landing page
│   ├── analyze/[id]/page.tsx           ← per-conversation analyze page
│   ├── analyze-queue/page.tsx          ← analysis queue management
│   ├── conversations/
│   │   ├── page.tsx                    ← conversation list
│   │   └── [id]/page.tsx              ← conversation topic cards
│   ├── queue/page.tsx                  ← learn page (queue + recommended)
│   └── settings/
│       ├── page.tsx                    ← settings landing
│       ├── llm/page.tsx               ← LLM management
│       └── preferences/page.tsx        ← user preferences
├── app/api/
│   ├── conversations/route.ts          ← fetch + sync conversation list
│   ├── analyze/route.ts               ← trigger analysis for one conversation
│   ├── analysis-queue/route.ts        ← analysis queue CRUD
│   ├── topics/route.ts                ← CRUD for topic cards
│   ├── preferences/route.ts           ← user preferences CRUD
│   ├── llm-configs/route.ts           ← LLM config CRUD
│   ├── llm-configs/test/route.ts      ← test LLM connection
│   └── upload/route.ts                ← conversation export file upload
├── components/
│   ├── AnalysisQueueTile.tsx
│   ├── CategoryBadge.tsx
│   ├── CategoryCombobox.tsx
│   ├── ConversationTile.tsx
│   ├── FilterBar.tsx
│   ├── LLMModal.tsx
│   ├── LLMSelector.tsx
│   ├── LLMTile.tsx
│   ├── TierBadge.tsx
│   └── TopicCard.tsx
├── lib/
│   ├── db/                             ← database adapter
│   └── llm/                            ← LLM adapter
├── types/index.ts                      ← all shared TypeScript types
├── install.sh                          ← interactive installer
└── data/                               ← local data (excluded from git)
    ├── learn.db                        ← SQLite database
    ├── llm-configs.json               ← LLM configurations
    └── claude-export.json             ← imported conversation export
```

---

## TODO Markers

The codebase contains the following marked placeholders for future development:

| Marker | Location | Description |
|--------|----------|-------------|
| `TODO: CONVERSATIONS_API` | `app/api/conversations/route.ts` | Replace file-based import with `GET /v1/conversations` once Anthropic exposes the endpoint |
| `TODO: TUTORIAL_SEARCH` | `app/queue/page.tsx` | Replace Google search stub with real tutorial search integration |
| `TODO: TUTORIAL_POLLING` | `app/queue/page.tsx` | Aggregate saved tutorial URLs to identify popular resources |
| `TODO: CARD_COUNT_LIMIT` | `lib/llm/claude.ts` | 10-card cap due to quality degradation with title-only analysis |
| `TODO: LOCAL_LLM_UI` | `install.sh` | Verify Ollama add flow works through standard Add LLM modal |
| `TODO: STATUS_ACCURACY` | `app/analyze-queue/page.tsx` | Progress bar needs streaming API for accurate per-token progress |

---

## Feature Request: Anthropic Conversations API

This app currently relies on a manual data export from claude.ai because no public API endpoint exists for listing or retrieving conversations. We propose:

```
GET /v1/conversations
```

Returning: `id`, `title`, `updated_at`, `message_count` — no message content.

With an optional privacy model where users explicitly flag conversations as accessible to third-party API calls in their claude.ai settings.

This would eliminate the export/import flow entirely. The entire import layer is marked with `TODO: CONVERSATIONS_API` and architected to be replaced by a single API call.

---

## Roadmap

### v1 — Current (Beta)
- Conversation import and analysis
- Topic cards with tier, category, prerequisites, LLM attribution
- Analysis queue with drag-and-drop reordering
- Learning queue with tutorial URL bookmarking
- LLM agnostic configuration with failover
- Complexity estimator
- Global topic view with filters
- Per-analysis overrides
- Three install paths via `install.sh`

### v2 — Learning Chains
- Prerequisite relationships between cards
- Dependency-ordered card display
- Suggested learning paths
- Tutorial search integration (Google Custom Search API)
- Free vs paid tutorial classification

### v3 — Diagnostic Layer
- "Teach me X" entry point
- Adaptive quiz to locate user in dependency graph
- Personalized path generation
- Tutorial URL polling and community aggregation

### Future — Live Demo
- Postgres adapter implementation
- Multi-user onboarding flow
- Hosted demo site

---

## Design Principles

- **Privacy first** — conversation content never leaves the user's machine
- **LLM agnostic** — adapter pattern makes provider switching a config change
- **Modular by default** — DB and LLM layers are independently swappable
- **WCAG AA minimum** — all text meets 4.5:1 contrast ratio minimum
- **Honest architecture** — complexity shown before committing to API calls; costs are relative not absolute
- **Low activation energy** — the app should make it easier to start learning, not feel like more homework

---

*Built with Claude. Designed to surface what you should learn next.*
