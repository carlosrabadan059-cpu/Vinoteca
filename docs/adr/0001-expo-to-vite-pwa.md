# ADR-0001: Migrate from Expo (React Native) to Vite PWA

**Date:** 2026-06-06  
**Status:** Accepted

## Context

Vinoteca was originally built with **Expo SDK 56 (React Native)** targeting iOS and Android. The app is a personal wine-cellar tool used primarily by one user on a phone browser; a native app distribution via App Store / Play Store adds overhead with no clear benefit at current scale.

The React Native codebase used `EXPO_PUBLIC_` env var prefixes, `expo-router` for navigation, and `AsyncStorage` for offline persistence.

## Decision

Migrate the entire frontend to a **Vite + React 19 + TypeScript PWA**, deployed as a static web app. Keep Supabase as the backend (auth + DB) and OpenAI for the sommelier feature.

Key replacements:

| Before (Expo) | After (Vite PWA) |
|---|---|
| `expo-router` | React Router v7 (`createBrowserRouter`) |
| `AsyncStorage` | `localStorage` (typed wrapper in `src/lib/storage.ts`) |
| `EXPO_PUBLIC_` env prefix | `VITE_` env prefix |
| Native app manifest | `vite-plugin-pwa` web manifest + Workbox |

## Consequences

- **Good:** No app-store submission process. Instant deploys. Full browser API access (e.g. camera via `getUserMedia`).
- **Good:** Simpler dev tooling — standard Vite/npm workflow, no Expo CLI.
- **Bad:** Loses native OS integrations (push notifications, home-screen shortcuts are PWA-only approximations).
- **Bad:** Camera/barcode scanning via web APIs is less reliable than React Native equivalents on some Android devices.
- **Neutral:** Offline support is maintained via Workbox `NetworkFirst` strategy; sync logic is stubbed in `src/hooks/useSync.ts` pending Phase 2.
