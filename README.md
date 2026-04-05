# Manager APIs — Frontend

React/TypeScript SPA for managing Anime RSS feeds and Mangas.

## Stack

- Vite + React 18 + TypeScript 5
- TanStack Query v5 (data fetching)
- React Router v6
- Tailwind CSS v3
- Axios
- Vitest + Testing Library

## Setup

```bash
npm install
```

Create a `.env.local` file:

```
VITE_RSS_API_URL=http://localhost:3000
VITE_MANGAS_API_URL=http://localhost:3001
```

## Commands

| Command | Description |
|---------|-------------|
| `npm run dev` | Start dev server |
| `npm run build` | Production build |
| `npm run test` | Run tests (watch) |
| `npm run test -- --run` | Run tests once |
| `npx tsc --noEmit` | Type check |

## Features

- **Anime RSS** — status overview, RSS query, torrent admin
- **Mangas** — list/add/delete mangas, plugin admin, status overview
