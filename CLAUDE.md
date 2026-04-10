# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm run dev          # Start dev server
npm run build        # Type-check + production build
npm run lint         # ESLint
npm run test         # Vitest (watch mode)
npm run test:run     # Vitest (single run)
npm run coverage     # Coverage report
npx tsc --noEmit     # Type-check only
```

Run a single test file:

```bash
npx vitest run src/features/anime-rss/hooks/useRss.test.tsx
```

## Environment

Copy `.env.example` to `.env` and set:

```
VITE_RSS_API_URL=http://localhost:3000
VITE_MANGAS_API_URL=http://localhost:3001
```

Tests use hardcoded production URLs from `vite.config.ts` — no local `.env` needed for tests.

## Architecture

React 19 SPA with two backend APIs: **anime-rss** and **mangas**.

**Entry point:** `src/main.tsx` → `App.tsx` wraps everything in `QueryClientProvider` + `RouterProvider`.

**Routing (`src/router.tsx`):** All routes nested under `<Layout />`. Default `/` redirects to `/status`.

**Feature structure** (`src/features/<feature>/`):

- `services/api.ts` — raw async functions using axios instances from `src/lib/http.ts`
- `services/types.ts` — TypeScript types for API responses
- `hooks/use*.ts` — TanStack Query wrappers around service functions
- `pages/*.tsx` — page components, each with a co-located `.test.tsx`

**HTTP clients (`src/lib/http.ts`):** Two axios instances — `rssHttp` (points to `VITE_RSS_API_URL`) and `mangasHttp` (points to `VITE_MANGAS_API_URL`). All API calls go through one of these.

**Shared UI components:** `src/components/ui/` — `StatusBadge`, `LoadingSpinner`, `ErrorMessage`, `ConfirmDialog`.

**Styling:** Tailwind CSS v3 with PostCSS.

**Testing:** Vitest + jsdom + Testing Library. `src/test/setup.ts` imports `@testing-library/jest-dom`. Tests mock axios instances or query hooks directly.

## Rules

- ALWAYS ensure that the tests are passing
- ALWAYS ensure that the lint is clean
- ALWAYS ensure that the build is working
- Add tests that cover the new changes
- Never make changes to the main branch; always create a new branch
- Be concise in your answers, be succinct in your responses
