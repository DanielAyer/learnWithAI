<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know
This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

# learn { } with AI — Agent Guide

This document provides context for AI coding assistants working on this project. Read it fully before writing any code or suggesting changes.

---

## Project Overview

A local-first, LLM-agnostic web app that analyzes AI conversation history and generates personalized learning curricula as structured topic cards.

**Key constraint:** Privacy first. Conversation content never leaves the user's machine. Only conversation titles are sent to the LLM API.

---

## Architecture Patterns

### LLM Adapter Pattern

ALL LLM calls go through `lib/llm/index.ts`. Never call any LLM SDK directly from a page or API route. The active implementation is resolved at runtime from `data/llm-configs.json`.

```
lib/llm/
  index.ts              ← ONLY import from here
  configs.ts            ← reads/writes llm-configs.json
  claude.ts             ← Anthropic implementation
  openai-compatible.ts  ← OpenAI/Ollama/Groq/Mistral implementation
```

### Database Adapter Pattern

ALL database calls go through `lib/db/index.ts`. Never import SQLite or Postgres directly from pages or API routes.

```
lib/db/
  index.ts    ← ONLY import from here
  sqlite.ts   ← local dev
  postgres.ts ← hosted deployment (stub, not yet implemented)
```

### Adding new DB methods

1. Add the method signature to the `DBAdapter` interface in `lib/db/index.ts`
2. Implement in `lib/db/sqlite.ts`
3. Add a stub that throws in `lib/db/postgres.ts`
4. Never skip step 3 — missing methods cause silent production failures

---

## File Structure

```
app/                    ← Next.js App Router pages
app/api/                ← API routes (server-side only)
components/             ← Reusable React components
lib/db/                 ← Database adapter
lib/llm/                ← LLM adapter
types/index.ts          ← ALL shared TypeScript types live here
data/                   ← Local data (excluded from git)
```

---

## TypeScript

- ALL shared types live in `types/index.ts` — never define types inline in components
- Use `import { X } from '@/types'` — never use relative paths for types
- Prefer explicit types over `any` — use `any` only with a comment explaining why

---

## Styling — CRITICAL

Never use Tailwind gray text classes directly. Use our semantic scale instead:

| Use this | Not this | Contrast ratio |
|----------|----------|----------------|
| `text-primary` | `text-gray-900` | 18.1:1 AAA |
| `text-secondary` | `text-gray-600`, `text-gray-700` | 10.7:1 AAA |
| `text-muted` | `text-gray-400`, `text-gray-500` | 7.4:1 AA |

These are defined in `app/globals.css` via `@theme inline` CSS variables.

WCAG AA is the minimum standard — 4.5:1 contrast ratio for all text. Never use text lighter than `text-muted` for readable content.

Structural gray classes are fine:

- `border-gray-200` — borders
- `bg-gray-50`, `bg-gray-100` — backgrounds
- `hover:bg-gray-50` — hover states

Brand color: orange-500 (`#ea580c`) for primary actions, badges, and accents.

---

## Red Border Convention

Any UI element that directly affects an API call must have a red border to signal token cost to the user:

```typescript
className="border-2 border-red-200 rounded-xl"
```

Pair with a small badge:

```typescript
<span className="text-xs bg-red-50 text-red-500 px-2 py-0.5 rounded-full">
  affects API call
</span>
```

This applies to: analysis mode toggle, card count input, category selector.

---

## TODO Markers

These markers are intentional and must not be removed:

| Marker | Meaning |
|--------|---------|
| `TODO: CONVERSATIONS_API` | Replace file-based import with `GET /v1/conversations` once Anthropic exposes it |
| `TODO: TUTORIAL_SEARCH` | Replace Google search stub with real tutorial search API |
| `TODO: TUTORIAL_POLLING` | Aggregate saved tutorial URLs to identify popular resources |
| `TODO: CARD_COUNT_LIMIT` | 10-card cap exists due to title-only analysis quality limits |
| `TODO: LOCAL_LLM_UI` | Verify Ollama add flow works through standard Add LLM modal |
| `TODO: STATUS_ACCURACY` | Progress bar advances per API call not per token — needs streaming |

---

## API Routes

- API routes live in `app/api/*/route.ts`
- Always wrap in try/catch and return proper error responses
- Never import from `lib/db` or `lib/llm` outside of API routes and server components
- Use `NextResponse.json()` for all responses

---

## Components

- All interactive components need `'use client'` at the top
- Pure display components with no state or events can be server components
- Badge components: use `TierBadge` and `CategoryBadge` — never inline tier/category styling
- Never hardcode tier labels or colors outside of `TierBadge.tsx`

---

## Anchor Tags — Known Issue

The claude.ai chat interface strips `<a` from code blocks, rendering them as blank lines. When reviewing AI-generated code containing anchor tags:

- Check for blank lines before `href=` attributes
- These should be `<a` tags that were stripped by the renderer
- Use `<Link>` from Next.js for internal navigation (no issue)
- Raw `<a>` tags are only needed for external links (`target="_blank"`)

---

## Data Directory

`data/` is excluded from git. It contains:

- `learn.db` — SQLite database
- `llm-configs.json` — LLM provider configurations including API keys
- `claude-export.json` — user's conversation export

Never commit anything from `data/`. Never log its contents.

---

## Complexity Estimator

The analyze page shows a real-time token complexity estimate relative to a baseline call. This is LLM-agnostic — it measures token count not cost.

Baseline: 3 cards, 1 category, guided mode, 0 learned topics (~495 tokens).

Formula:

```
input  = 190 + (categories × 5) + (learnedTopics × 5) + (strict mode ? 30 : 0)
output = maxCards × 100
total  = input + output
multiplier = total / baseline total
```

Complexity labels: ≤2x lightweight (green), 2-5x moderate (yellow), >5x heavy (orange).

---

## Install Paths

Three install paths exist via `install.sh`:

1. No LLM — user configures via UI at `/settings/llm`
2. Local LLM — Mistral 7B via Ollama (free, ~5GB)
3. API LLM — any cloud provider via prompted configuration

Start command after install: `npm run learn` — opens at `http://localhost:3000`

---

## Roadmap Context

- **v1 (current):** Core analysis loop, LLM agnostic, local-first
- **v2:** Prerequisite chains, tutorial search integration
- **v3:** Diagnostic quiz, adaptive learning paths, tutorial URL aggregation
- **Future:** Live demo site with Postgres adapter and multi-user support
