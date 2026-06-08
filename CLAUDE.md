# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm run dev       # dev server at http://localhost:5173
npm run build     # production build (outputs to dist/)
npm run preview   # preview the production build locally
npx tsc --noEmit  # type-check only (no test runner configured yet)
```

## Architecture

**Stack:** Vite + React 19 + TypeScript, Supabase (auth + DB), OpenAI, React Router v7, vite-plugin-pwa.

**Routing:** `src/router/index.tsx` defines a `createBrowserRouter` with two layout routes:
- `AuthLayout` (`/login`, `/register`) — redirects to `/bodega` if already authenticated
- `TabsLayout` (`/bodega`, `/anadir`, `/catas`, `/sommelier`) — redirects to `/login` if unauthenticated; renders a bottom-tab nav

Both layouts read session state from `useAuth` and handle their own loading/redirect logic.

**Auth flow:** `src/hooks/useAuth.ts` calls `supabase.auth.getSession()` on mount and subscribes to `onAuthStateChange`. The `session` state drives layout guards. The Supabase client (`src/lib/supabase.ts`) uses `localStorage` for session persistence (browser default).

**OpenAI** (`src/lib/openai.ts`): `askOpenAI(messages, systemPrompt)` wraps `chat.completions.create` with `gpt-4o-mini`. Uses `dangerouslyAllowBrowser: true` — API key is client-side only.

**Offline storage** (`src/lib/storage.ts`): typed `localStorage` wrapper (`get<T>`, `set`, `remove`). Sync logic lives in `src/hooks/useSync.ts` (stub for Phase 1).

**PWA:** `vite.config.ts` configures `vite-plugin-pwa` with a Workbox `NetworkFirst` strategy for Supabase API calls, `autoUpdate` service worker, and a web app manifest (`theme_color: #722F37`).

**Theme** (`src/constants/theme.ts`): all colours, spacing (4 px scale as CSS strings), font sizes, and border-radius values are exported as named constants. Never use raw hex values or magic numbers in components.

**Types** (`src/types/index.ts`): `Wine`, `Tasting`, `ChatMessage`, `User` — mirror the Supabase table schema.

## Environment variables

Stored in `.env`. Prefixed `VITE_` so Vite injects them at build time via `import.meta.env`:

```
VITE_SUPABASE_URL=
VITE_SUPABASE_ANON_KEY=
VITE_OPENAI_API_KEY=
```

## Agent skills

This repo uses the mattpocock/skills agent skill protocol. Agent behaviour is configured in `docs/agents/`:

- **Issue tracker:** GitHub `gh` CLI — see [`docs/agents/issue-tracker.md`](docs/agents/issue-tracker.md)
- **Triage labels:** default five-label set — see [`docs/agents/triage-labels.md`](docs/agents/triage-labels.md)
- **Domain docs:** single-context layout (`CONTEXT.md` + `docs/adr/`) — see [`docs/agents/domain.md`](docs/agents/domain.md)

## graphify

This project has a knowledge graph at graphify-out/ with god nodes, community structure, and cross-file relationships.

Rules:
- For codebase questions, first run `graphify query "<question>"` when graphify-out/graph.json exists. Use `graphify path "<A>" "<B>"` for relationships and `graphify explain "<concept>"` for focused concepts. These return a scoped subgraph, usually much smaller than GRAPH_REPORT.md or raw grep output.
- If graphify-out/wiki/index.md exists, use it for broad navigation instead of raw source browsing.
- Read graphify-out/GRAPH_REPORT.md only for broad architecture review or when query/path/explain do not surface enough context.
- After modifying code, run `graphify update .` to keep the graph current (AST-only, no API cost).
