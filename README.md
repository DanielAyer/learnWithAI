# learn { } with AI

> An LLM agnostic, local-first web app that analyzes your Claude conversation history and generates a personalized learning curriculum — surfacing knowledge gaps as structured study cards.

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
- **Learning queue** — add topics to a personal queue with tutorial URL bookmarking
- **Complexity estimator** — real-time token estimation relative to a baseline call before committing to an analysis
- **Global topic view** — filter and sort all cards across conversations by tier, category, and status
- **Per-analysis overrides** — override global preferences per conversation before analyzing
- **Privacy first** — conversation content never leaves your machine; only titles are sent to the LLM API

---

## Tech Stack

- **Frontend:** Next.js 16 (App Router), TypeScript, Tailwind CSS
- **Storage:** SQLite (local dev via `better-sqlite3`), Vercel Postgres (hosted demo)
- **LLM:** Anthropic Claude via `@anthropic-ai/sdk` (default), OpenAI-compatible adapter for all other providers
- **Deployment:** Vercel

---

## Architecture

### LLM Adapter Pattern

All LLM calls go through a single interface defined in `lib/llm/index.ts`. The active implementation is resolved at runtime from `data/llm-configs.json`. Swapping LLMs requires no code changes — only a config update.

```
lib/llm/
  index.ts              ← interface + factory with failover
  configs.ts            ← reads/writes llm-configs.json, resolves timeouts
  claude.ts             ← Anthropic SDK implementation
  openai-compatible.ts  ← OpenAI-compatible implementation (Ollama, Groq, Mistral, etc.)
```

### Database Adapter Pattern

All database calls go through a single interface defined in `lib/db/index.ts`. Local development uses SQLite; hosted deployment uses Vercel Postgres. Swapping requires changing one environment variable.

```
lib/db/
  index.ts      ← interface + environment-based factory
  sqlite.ts     ← local dev implementation
  postgres.ts   ← hosted deployment implementation (stub, ready to implement)
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
      "id": "claude-sonnet-4-6",
      "label": "Claude Sonnet 4.6",
      "provider": "Anthropic",
      "family": "Sonnet",
      "version": "4.6",
      "baseUrl": "https://api.anthropic.com",
      "apiKey": "sk-ant-...",
      "model": "claude-sonnet-4-6",
      "timeoutMs": null,
      "status": "untested"
    }
  ]
}
```

Failover is index-ordered. If index 0 times out or fails, index 1 is tried, then index 2, and so on. Each config can override the global timeout or inherit it by setting `timeoutMs: null`.

---

## Complexity Estimator

Every analysis page shows a real-time complexity estimate relative to a defined baseline call. This is LLM-agnostic — it measures token count, not cost, so it remains accurate regardless of provider or pricing changes.

### Baseline Call

The baseline is defined as the minimum useful analysis:

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

### Parameters

| Parameter | Effect on tokens | Notes |
|-----------|-----------------|-------|
| `maxCards` | +100 output tokens per card | Capped at 10 for quality reasons |
| `categories.length` | +5 input tokens per category | Custom categories count equally |
| `mode: strict` | +30 input tokens | Additional constraint instruction |
| Learned topics | +5 input tokens per topic | Excluded from results |

### Complexity Labels

| Multiplier | Label | Bar color |
|------------|-------|-----------|
| ≤ 2x | Lightweight | Green |
| 2x – 5x | Moderate | Yellow |
| > 5x | Heavy | Orange |

### Caveats

Token counts are estimates. Actual tokenization varies by model and content — different words tokenize differently. This is intentionally presented as a relative comparator, not a billing estimate, to remain LLM-agnostic.

---

## Project Structure

```
/
├── app/
│   ├── page.tsx                      ← landing page
│   ├── analyze/[id]/page.tsx         ← per-conversation analyze page
│   ├── conversations/
│   │   ├── page.tsx                  ← conversation list
│   │   └── [id]/page.tsx             ← conversation topic cards
│   ├── topics/page.tsx               ← global topic view with filters
│   ├── queue/page.tsx                ← learning queue
│   └── settings/
│       ├── llm/page.tsx              ← LLM management
│       └── preferences/page.tsx      ← user preferences
├── app/api/
│   ├── conversations/route.ts        ← fetch + sync conversation list
│   ├── analyze/route.ts              ← trigger analysis for one conversation
│   ├── topics/route.ts               ← CRUD for topic cards
│   ├── preferences/route.ts          ← user preferences CRUD
│   ├── llm-configs/route.ts          ← LLM config CRUD
│   ├── llm-configs/test/route.ts     ← test LLM connection
│   └── upload/route.ts               ← conversation export file upload
├── components/
│   ├── ConversationTile.tsx
│   ├── TopicCard.tsx
│   ├── FilterBar.tsx
│   ├── CategoryCombobox.tsx
│   ├── LLMSelector.tsx               ← nav LLM switcher
│   ├── LLMTile.tsx                   ← LLM management tile
│   └── LLMModal.tsx                  ← add/edit LLM modal
├── lib/
│   ├── db/                           ← database adapter
│   └── llm/                          ← LLM adapter
├── types/index.ts                    ← all shared TypeScript types
└── data/                             ← local data (excluded from git)
    ├── learn.db                      ← SQLite database
    ├── llm-configs.json              ← LLM configurations
    └── claude-export.json            ← imported conversation export
```

---

## Setup

### Prerequisites

- Node.js v18+
- An Anthropic API key (or any OpenAI-compatible LLM)

### Installation

```bash
git clone https://github.com/DanielAyer/learnWithAI.git
cd learnWithAI
npm install
npm approve-scripts better-sqlite3
```

### Configuration

Create `.env.local`:

```
ANTHROPIC_API_KEY=sk-ant-your-key-here
```

### Running locally

```bash
npm run dev
```

Open `http://localhost:3000`.

### Importing conversations

1. Go to `claude.ai → Settings → Privacy → Export Data`
2. Download and extract the ZIP
3. In the app, go to Conversations and upload `conversations.json`

---

## TODO Markers

The codebase contains the following marked placeholders for future development:

| Marker | Location | Description |
|--------|----------|-------------|
| `TODO: CONVERSATIONS_API` | `app/api/conversations/route.ts`, `app/api/analyze/route.ts` | Replace file-based import with `GET /v1/conversations` once Anthropic exposes the endpoint |
| `TODO: TUTORIAL_SEARCH` | `app/queue/page.tsx` | Replace Google search stub with real tutorial search integration (Google Custom Search API) |
| `TODO: TUTORIAL_POLLING` | `app/queue/page.tsx` | Aggregate saved tutorial URLs to identify popular resources |
| `TODO: CARD_COUNT_LIMIT` | `lib/llm/claude.ts` | Current 10-card cap exists due to quality degradation with title-only analysis. Revisit when full conversation content is available. |

---

## Feature Request: Anthropic Conversations API

This app currently relies on a manual data export from claude.ai because no public API endpoint exists for listing or retrieving conversations. We propose:

```
GET /v1/conversations
```

Returning: `id`, `title`, `updated_at`, `message_count` — no message content.

With an optional privacy model where users explicitly flag conversations as accessible to third-party API calls in their claude.ai settings.

This would eliminate the export/import flow entirely, enable real-time sync, and make the app significantly more useful. The entire import layer (`app/api/conversations/route.ts`, `app/api/upload/route.ts`) is marked with `TODO: CONVERSATIONS_API` and architected to be replaced by a single API call.

---

## Roadmap

### v1 — Current
- Conversation import and analysis
- Topic cards with tier, category, prerequisites, LLM attribution
- Learning queue with tutorial URL bookmarking
- LLM agnostic configuration with failover
- Complexity estimator
- Global topic view with filters
- Per-analysis overrides

### v2 — Learning Chains
- Prerequisite relationships between cards
- Dependency-ordered card display
- Suggested learning paths based on expressed interests
- Tutorial search integration (Google Custom Search API)
- Free vs paid tutorial classification

### v3 — Diagnostic Layer
- "Teach me X" entry point
- Adaptive quiz to locate user in dependency graph
- Personalized path generation
- Tutorial URL polling and community aggregation

---

## Design Principles

- **Privacy first** — conversation content never leaves the user's machine
- **LLM agnostic** — adapter pattern makes provider switching a config change
- **Modular by default** — DB and LLM layers are independently swappable
- **WCAG AA minimum** — all text meets 4.5:1 contrast ratio minimum
- **Honest architecture** — complexity is shown before committing to API calls; costs are relative not absolute

---

*Built with Claude. Designed to surface what you should learn next.*
