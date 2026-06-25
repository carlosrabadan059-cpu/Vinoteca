# Graph Report - Vinoteca  (2026-06-25)

## Corpus Check
- 136 files · ~91,245 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 970 nodes · 1408 edges · 85 communities (71 shown, 14 thin omitted)
- Extraction: 97% EXTRACTED · 3% INFERRED · 0% AMBIGUOUS · INFERRED: 42 edges (avg confidence: 0.81)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `3ef9b585`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- [[_COMMUNITY_UI Components & Design System|UI Components & Design System]]
- [[_COMMUNITY_Offline-First Sync Engine|Offline-First Sync Engine]]
- [[_COMMUNITY_Wine & Tasting Data Hooks|Wine & Tasting Data Hooks]]
- [[_COMMUNITY_n8n AI Integration Layer|n8n AI Integration Layer]]
- [[_COMMUNITY_Package Dependencies|Package Dependencies]]
- [[_COMMUNITY_ADRs & Agent Docs|ADRs & Agent Docs]]
- [[_COMMUNITY_Developer Skills (Diagnose)|Developer Skills (Diagnose)]]
- [[_COMMUNITY_Wine Statistics Engine|Wine Statistics Engine]]
- [[_COMMUNITY_Scan & Camera Pipeline|Scan & Camera Pipeline]]
- [[_COMMUNITY_TypeScript App Config|TypeScript App Config]]
- [[_COMMUNITY_TypeScript Node Config|TypeScript Node Config]]
- [[_COMMUNITY_Session Handoffs & Features|Session Handoffs & Features]]
- [[_COMMUNITY_Skills Lock Registry|Skills Lock Registry]]
- [[_COMMUNITY_Frontend Design & Prototyping|Frontend Design & Prototyping]]
- [[_COMMUNITY_TastingCard Component|TastingCard Component]]
- [[_COMMUNITY_Claude Permissions|Claude Permissions]]
- [[_COMMUNITY_PWA Icons|PWA Icons]]
- [[_COMMUNITY_HITL Loop Script|HITL Loop Script]]
- [[_COMMUNITY_Claude Hooks Config|Claude Hooks Config]]
- [[_COMMUNITY_Root TSConfig|Root TSConfig]]
- [[_COMMUNITY_Vite PWA Migration ADR|Vite PWA Migration ADR]]
- [[_COMMUNITY_PWA Entry Point|PWA Entry Point]]
- [[_COMMUNITY_Vite PWA Config|Vite PWA Config]]
- [[_COMMUNITY_App Entry Point|App Entry Point]]
- [[_COMMUNITY_Package JSON|Package JSON]]
- [[_COMMUNITY_Bodega Background Image|Bodega Background Image]]
- [[_COMMUNITY_README|README]]
- [[_COMMUNITY_Caveman Skill|Caveman Skill]]
- [[_COMMUNITY_Hero Image|Hero Image]]
- [[_COMMUNITY_React Asset|React Asset]]
- [[_COMMUNITY_Vite Asset|Vite Asset]]
- [[_COMMUNITY_Community 34|Community 34]]
- [[_COMMUNITY_Community 35|Community 35]]
- [[_COMMUNITY_Community 36|Community 36]]
- [[_COMMUNITY_Community 37|Community 37]]
- [[_COMMUNITY_Community 38|Community 38]]
- [[_COMMUNITY_Community 39|Community 39]]
- [[_COMMUNITY_Community 40|Community 40]]
- [[_COMMUNITY_Community 41|Community 41]]
- [[_COMMUNITY_Community 42|Community 42]]
- [[_COMMUNITY_Community 43|Community 43]]
- [[_COMMUNITY_Community 44|Community 44]]
- [[_COMMUNITY_Community 45|Community 45]]
- [[_COMMUNITY_Community 46|Community 46]]
- [[_COMMUNITY_Community 47|Community 47]]
- [[_COMMUNITY_Community 48|Community 48]]
- [[_COMMUNITY_Community 49|Community 49]]
- [[_COMMUNITY_Community 50|Community 50]]
- [[_COMMUNITY_Community 51|Community 51]]
- [[_COMMUNITY_Community 52|Community 52]]
- [[_COMMUNITY_Community 53|Community 53]]
- [[_COMMUNITY_Community 54|Community 54]]
- [[_COMMUNITY_Community 55|Community 55]]
- [[_COMMUNITY_Community 56|Community 56]]
- [[_COMMUNITY_Community 57|Community 57]]
- [[_COMMUNITY_Community 58|Community 58]]
- [[_COMMUNITY_Community 59|Community 59]]
- [[_COMMUNITY_Community 60|Community 60]]
- [[_COMMUNITY_Community 61|Community 61]]
- [[_COMMUNITY_Community 62|Community 62]]
- [[_COMMUNITY_Community 63|Community 63]]
- [[_COMMUNITY_Community 64|Community 64]]
- [[_COMMUNITY_Community 65|Community 65]]
- [[_COMMUNITY_Community 66|Community 66]]
- [[_COMMUNITY_Community 67|Community 67]]
- [[_COMMUNITY_Community 68|Community 68]]
- [[_COMMUNITY_Community 69|Community 69]]
- [[_COMMUNITY_Community 70|Community 70]]
- [[_COMMUNITY_Community 71|Community 71]]
- [[_COMMUNITY_Community 72|Community 72]]
- [[_COMMUNITY_Community 73|Community 73]]
- [[_COMMUNITY_Community 74|Community 74]]
- [[_COMMUNITY_Community 75|Community 75]]
- [[_COMMUNITY_Community 76|Community 76]]
- [[_COMMUNITY_Community 77|Community 77]]
- [[_COMMUNITY_Community 78|Community 78]]
- [[_COMMUNITY_Community 79|Community 79]]
- [[_COMMUNITY_Community 80|Community 80]]
- [[_COMMUNITY_Community 83|Community 83]]
- [[_COMMUNITY_Community 84|Community 84]]

## God Nodes (most connected - your core abstractions)
1. `Theme` - 41 edges
2. `Wine` - 30 edges
3. `useWines()` - 26 edges
4. `supabase` - 22 edges
5. `getDB()` - 19 edges
6. `useAuthStore` - 18 edges
7. `Tasting` - 18 edges
8. `compilerOptions` - 17 edges
9. `compilerOptions` - 16 edges
10. `useTastings()` - 14 edges

## Surprising Connections (you probably didn't know these)
- `index.html — Punto de entrada HTML` --references--> `favicon.svg — Icono copa de vino`  [EXTRACTED]
  index.html → public/favicon.svg
- `useSync()` --semantically_similar_to--> `syncQueue Function (main)`  [INFERRED] [semantically similar]
  src/hooks/useSync.ts → src/main.tsx
- `TDD Skill` --references--> `Domain Glossary (Vinoteca)`  [EXTRACTED]
  .agents/skills/tdd/SKILL.md → CONTEXT.md
- `CLAUDE.md - Project Instructions` --references--> `CONTEXT.md - Domain Glossary`  [INFERRED]
  CLAUDE.md → CONTEXT.md
- `DuplicateWineDialogProps` --references--> `Wine`  [EXTRACTED]
  src/components/wine/DuplicateWineDialog.tsx → src/types/index.ts

## Import Cycles
- None detected.

## Hyperedges (group relationships)
- **Offline-First Sync System** — ui_syncindicator, ui_syncmodal, store_syncstore, hooks_usesync, lib_idb [INFERRED 0.90]
- **Theme-Driven UI Design System** — constants_theme, ui_button, ui_badge, ui_card, ui_input, ui_modal [INFERRED 0.85]
- **App Shell Layout Pattern** — app_app, router_index, ui_layout, ui_toast, ui_syncindicator [INFERRED 0.85]
- **Offline-First Sync Pattern: IDB Queue + Supabase Flush** — lib_idb_sync_queue, lib_idb_addtoqueue, hooks_usesync_usesync, main_maintf_syncqueue, lib_supabase_supabase [EXTRACTED 0.95]
- **Wine CRUD with Offline-First IDB + Supabase** — hooks_usewines_usewines, lib_idb_wines_local, lib_supabase_supabase, lib_uuid_randomuuid [EXTRACTED 0.95]
- **AI-Guided Tasting Chat Flow** — wine_tastingchat_component, wine_tastingchat_tasting_context, lib_n8n_callsommelierchat, wine_tastingchat_tastingresult [EXTRACTED 0.95]
- **Zustand Global State Stores (auth, wine, tasting, toast, sync)** — store_authstore_useauthstore, store_winestore_usewinestore, store_tastingstore_usetastingstore, store_toaststore_usetoaststore, store_syncstore_usesyncstore [EXTRACTED 1.00]
- **Scan Analysis Pipeline (identify -> analyze -> duplicate check -> save)** — pages_scan_scan, concept_scan_twophase, concept_duplicate_detection [EXTRACTED 0.95]
- **Sommelier Intent Dispatch (detect -> route to maridaje/enriquecimiento/chat)** — pages_sommelier_detectintent, pages_sommelier_extractplato, concept_intent_routing [EXTRACTED 0.95]
- **Domain Docs: Grill With Docs, Improve Arch, and Domain Config form a consistent domain-documentation workflow** — grill_with_docs_skill, improve_arch_skill, setup_skills_domain [INFERRED 0.75]
- **Diagnose skill phases form a disciplined debugging loop: feedback loop, reproduce, hypothesise, instrument, fix** — diagnose_skill_feedback_loop, diagnose_skill_reproduce, diagnose_skill_hypothesise [EXTRACTED 1.00]
- **Issue tracker options (GitHub, GitLab, Local) are alternative implementations of the same issue tracker concept** — setup_skills_github, setup_skills_gitlab, setup_skills_local [EXTRACTED 1.00]
- **Triage Workflow System** — triage_skill, triage_agent_brief, triage_out_of_scope [EXTRACTED 0.95]
- **n8n AI Backend Pattern** — concept_sommelier, concept_asistente_cata, concept_n8n_webhook [EXTRACTED 0.95]
- **Issue Lifecycle Skills** — to_prd_skill, to_issues_skill, triage_skill [INFERRED 0.85]
- **Pipeline de Análisis de Etiqueta: Scan → n8n → GPT-4o → gpt-image-1** — concept_scan_flow, concept_n8n_workflow_scan, concept_gpt_image_1_studio [EXTRACTED 0.95]
- **Conjunto de Iconos PWA de la Aplicación** — public_favicon_svg, public_pwa_192, public_pwa_512, public_apple_touch_icon [INFERRED 0.90]
- **Cadena de Handoffs de Sesiones de Desarrollo** — docs_handoff_2026_06_10, docs_handoff_2026_06_11, docs_handoff_2026_06_12, docs_handoff_2026_06_13, docs_handoff_2026_06_18 [EXTRACTED 0.95]

## Communities (85 total, 14 thin omitted)

### Community 0 - "UI Components & Design System"
Cohesion: 0.09
Nodes (14): UI Design System (theme-driven components), Theme, BadgeProps, ButtonProps, CardProps, InputProps, ModalProps, SuggestionChipsProps (+6 more)

### Community 1 - "Offline-First Sync Engine"
Cohesion: 0.09
Nodes (41): Offline-First Sync Pattern, Offline-First Sync Pattern, useTastings Hook, useSync(), addToQueue(), clearLocalWines(), clearQueue(), getDB() (+33 more)

### Community 2 - "Wine & Tasting Data Hooks"
Cohesion: 0.09
Nodes (12): BLANCOS, classifyWine(), DULCES, ESPUMOSOS, MES_SHORT, ROSADOS, StatsData, TINTOS (+4 more)

### Community 3 - "n8n AI Integration Layer"
Cohesion: 0.22
Nodes (10): App (Root Component), Login(), Register(), ProtectedRoute(), router, AuthState, useAuthStore, Layout() (+2 more)

### Community 4 - "Package Dependencies"
Cohesion: 0.05
Nodes (38): dependencies, idb, react, react-dom, react-router-dom, recharts, @supabase/supabase-js, zustand (+30 more)

### Community 5 - "ADRs & Agent Docs"
Cohesion: 0.05
Nodes (46): ADR: AI Assistants via n8n, ADR: Scan Workflow via n8n, Agent Domain Docs Config, Conventions, Issue tracker: GitHub, When a skill says "fetch the relevant ticket", When a skill says "publish to the issue tracker", Triage Labels (+38 more)

### Community 6 - "Developer Skills (Diagnose)"
Cohesion: 0.06
Nodes (37): ADR Format, Numbering, Optional sections, Template, What qualifies, When to offer an ADR, CONTEXT.md Format, Rules (+29 more)

### Community 7 - "Wine Statistics Engine"
Cohesion: 0.16
Nodes (18): Sommelier Intent Routing (maridaje/enriquecimiento/chat), useWines(), WineFilters, fetchImageAsDataUrl(), randomUUID(), Bodega(), TIPOS, WineSkeleton() (+10 more)

### Community 8 - "Scan & Camera Pipeline"
Cohesion: 0.07
Nodes (34): Animated Overlay Pattern, compressImage(), pickFile(), useCamera(), CaptureSource, getUserMediaSource(), callEnriquecimiento(), callMaridaje() (+26 more)

### Community 9 - "TypeScript App Config"
Cohesion: 0.11
Nodes (18): compilerOptions, allowImportingTsExtensions, erasableSyntaxOnly, jsx, lib, module, moduleDetection, moduleResolution (+10 more)

### Community 10 - "TypeScript Node Config"
Cohesion: 0.11
Nodes (17): compilerOptions, allowImportingTsExtensions, erasableSyntaxOnly, lib, module, moduleDetection, moduleResolution, noEmit (+9 more)

### Community 11 - "Session Handoffs & Features"
Cohesion: 0.31
Nodes (7): Generación de imagen studio con gpt-image-1, Workflow n8n: Vinoteca Scan Analizar (EtTezN27e9tqvOjS), Fixes para Safari iOS (polyfill randomUUID, webkit scroll), Flujo de Escaneo de Etiqueta (4 pasos), SerpAPI Fallback para imagen de vino, Migración Supabase — 7 columnas nuevas en wines, Supabase Storage Bucket wine-labels con RLS

### Community 12 - "Skills Lock Registry"
Cohesion: 0.25
Nodes (7): computedHash, skillPath, source, sourceType, skills, frontend-design, version

### Community 13 - "Frontend Design & Prototyping"
Cohesion: 0.06
Nodes (32): Aesthetic Direction (Frontend Design), Frontend Design License (Apache 2.0), Design Thinking, Frontend Aesthetics Guidelines, 1. State the question, 2. Pick the language, 3. Isolate the logic in a portable module, 4. Build the smallest TUI that exposes the state (+24 more)

### Community 14 - "TastingCard Component"
Cohesion: 0.13
Nodes (14): Acciones correctivas, Checklist por dispositivo, Criterio de paso, D1 — macOS Chrome, D2 — macOS Safari, D3 — iPhone Safari, D4 — iPhone Chrome, D5 — Android Chrome ⏳ PENDIENTE (+6 more)

### Community 15 - "Claude Permissions"
Cohesion: 0.50
Nodes (3): permissions, additionalDirectories, allow

### Community 16 - "PWA Icons"
Cohesion: 0.50
Nodes (4): Iconos PWA — launcher y touch icons, apple-touch-icon.png — Icono PWA para iOS, pwa-192x192.png — Icono PWA 192px, pwa-512x512.png — Icono PWA 512px

### Community 17 - "HITL Loop Script"
Cohesion: 0.83
Nodes (3): capture(), step(), hitl-loop.template.sh script

### Community 25 - "Package JSON"
Cohesion: 0.15
Nodes (16): useAuth(), processOperation(), dataUrlToBlob(), storage, uploadWineImage(), supabase, supabaseAnonKey, supabaseUrl (+8 more)

### Community 27 - "README"
Cohesion: 0.09
Nodes (19): Red-Green-Refactor Loop, Tracer Bullet Vertical Slice, Deep Modules, Interface Design for Testability, Designing for Mockability, When to Mock, Refactor Candidates, TDD Skill (+11 more)

### Community 34 - "Community 34"
Cohesion: 0.22
Nodes (8): useTastings(), SectionCardProps, TastingDetail(), ToastState, useToastStore, Toast(), ConsumoQuickForm(), ConsumoQuickFormProps

### Community 35 - "Community 35"
Cohesion: 0.09
Nodes (22): Bordes redondeados, Colores, Espaciado (escala de 4px, valores en px), Frontend — Vinoteca, Hooks principales, Inventario de componentes UI, Layout, Layout y navegación (+14 more)

### Community 36 - "Community 36"
Cohesion: 0.10
Nodes (20): Algoritmo `wine_uid`, Cadena a hashear, Componente `AnalysisProgress`, Detección de duplicados tras el análisis, Fase 1 — Identificar (`callScanIdentificar`), Fase 2 — Analizar (`callScanAnalizar`), Flujo de escaneo — Vinoteca, Guardado final (+12 more)

### Community 37 - "Community 37"
Cohesion: 0.11
Nodes (18): Archivos clave, Arquitectura del workflow (8 nodos), Bugs corregidos en esta sesión, Commits de esta sesión, Contexto de referencia, Credenciales n8n, Estado actual del workflow n8n, Estado del frontend (+10 more)

### Community 38 - "Community 38"
Cohesion: 0.12
Nodes (16): Diagnose, Feedback Loop (Diagnose Phase 1), Fix and Regression Test Phase (Diagnose Phase 5), Hypothesise Phase (Diagnose Phase 3), Instrument Phase (Diagnose Phase 4), Iterate on the loop itself, Non-deterministic bugs, Phase 1 — Build a feedback loop (+8 more)

### Community 39 - "Community 39"
Cohesion: 0.13
Nodes (14): 1. Sommelier — Chat libre, 2. Sommelier — Maridaje, 3. Sommelier — Enriquecimiento, 4. Scan — Identificar, 5. Scan — Analizar, 6. Stats — Insight, Backend n8n — Vinoteca, Cliente HTTP (`src/lib/n8n.ts`) (+6 more)

### Community 40 - "Community 40"
Cohesion: 0.14
Nodes (13): Call-graph collapse, Candidate card, Cross-section (good for layered shallowness), Diagram patterns, Hand-built boxes-and-arrows (when Mermaid's layout fights you), Header, HTML Report Format, Mass diagram (good for "interface as wide as implementation") (+5 more)

### Community 41 - "Community 41"
Cohesion: 0.15
Nodes (12): Almacenamiento offline — Vinoteca, Carga inicial, Cola de sincronización (`SyncOperation`), Escritura (createWine / updateWine / deleteWine), Esquema, IndexedDB — base de datos offline (`src/lib/idb.ts`), `localStorage` — wrapper tipado (`src/lib/storage.ts`), Operaciones disponibles (+4 more)

### Community 42 - "Community 42"
Cohesion: 0.17
Nodes (11): Arquitectura — Vinoteca, Configuración PWA, Descripción general, Diagrama de flujo de datos, Estructura de rutas, Flujo de autenticación, Patrón offline-first, Rutas protegidas (requieren sesión activa) (+3 more)

### Community 43 - "Community 43"
Cohesion: 0.17
Nodes (11): Backfill de `wine_uid`, Base de datos — Vinoteca, Campo `wine_uid`: algoritmo de generación, Función `generateWineUid`, Función `normalizeWineText`, Lookup por `wine_uid`, Patrones de consulta en el código, Tabla `tastings` (+3 more)

### Community 44 - "Community 44"
Cohesion: 0.17
Nodes (11): Autenticación, Cliente (`src/lib/supabase.ts`), Configuración del proyecto en el dashboard, Consultas representativas, Función `fetchImageAsDataUrl` (`src/lib/storage.ts`), Función `uploadWineImage` (`src/lib/storage.ts`), Row Level Security (RLS), Supabase Storage (+3 more)

### Community 45 - "Community 45"
Cohesion: 0.18
Nodes (10): ChatMessage, ChatBubble(), ChatBubbleProps, inlineFormat(), renderMarkdown(), ChatBubbleProps, TastingChat Component, TASTING_CONTEXT Structured Prompt (+2 more)

### Community 46 - "Community 46"
Cohesion: 0.18
Nodes (11): Archivos clave, Cambios publicados en esta sesión, Commits de esta sesión, Contexto de referencia, Estado del workflow n8n (`EtTezN27e9tqvOjS`), Flujo actual, Handoff: Vinoteca — Sesión 2026-06-12, Migración Supabase (ya aplicada) (+3 more)

### Community 47 - "Community 47"
Cohesion: 0.18
Nodes (11): Archivos clave modificados esta sesión, Barra de navegación inferior (`src/components/ui/Layout.tsx`), Commits de esta sesión, Contexto de referencia, Estado actual, Handoff: Vinoteca — Sesión 2026-06-13, Layouts duplicados (fix en misma sesión), Pendientes (+3 more)

### Community 48 - "Community 48"
Cohesion: 0.18
Nodes (11): 1. Gather context, 2. Explore the codebase (optional), 3. Draft vertical slices, 4. Quiz the user, 5. Publish the issues to the issue tracker, Acceptance criteria, Blocked by, Parent (+3 more)

### Community 49 - "Community 49"
Cohesion: 0.18
Nodes (11): Bad agent brief, Behavioral, not procedural, Complete acceptance criteria, Durability over precision, Examples, Explicit scope boundaries, Good agent brief (bug), Good agent brief (enhancement) (+3 more)

### Community 50 - "Community 50"
Cohesion: 0.20
Nodes (9): Archivos clave, Decisiones de diseño tomadas en esta sesión, Estado actual, Estado del proyecto, Handoff — Vinoteca — 2026-06-23, Lo que se implementó en V1.2, Pendientes técnicos pre-existentes (V1.1), Próximos pasos sugeridos (+1 more)

### Community 51 - "Community 51"
Cohesion: 0.20
Nodes (9): 1. Planning, 2. Tracer Bullet, 3. Incremental Loop, 4. Refactor, Anti-Pattern: Horizontal Slices, Checklist Per Cycle, Philosophy, Test-Driven Development (+1 more)

### Community 52 - "Community 52"
Cohesion: 0.22
Nodes (9): Archivos clave, Cambios sin commitear (esta sesión), Commit de esta sesión, Contexto de referencia, Handoff: Vinoteca — Sesión 2026-06-11, Migración Supabase aplicada, Pendientes, Proyecto (+1 more)

### Community 53 - "Community 53"
Cohesion: 0.22
Nodes (9): 1. Fix scroll del modal de edición, 2. Pantalla de progreso durante el análisis del vino, Arquitectura relevante, Bloqueante pendiente: Login, Estado actual, Lo que se hizo en esta sesión, Suggested skills, Tareas pendientes (sin urgencia) (+1 more)

### Community 54 - "Community 54"
Cohesion: 0.22
Nodes (8): 1. In-process, 2. Local-substitutable, 3. Remote but owned (Ports & Adapters), 4. True external (Mock), Deepening, Dependency categories, Seam discipline, Testing strategy: replace, don't layer

### Community 55 - "Community 55"
Cohesion: 0.25
Nodes (7): 1. Explore, 2. Present findings and ask, 3. Confirm and edit, 4. Write, 5. Done, Process, Setup Matt Pocock's Skills

### Community 56 - "Community 56"
Cohesion: 0.29
Nodes (5): Agent skills, Architecture, Commands, Environment variables, graphify

### Community 57 - "Community 57"
Cohesion: 0.29
Nodes (6): 1. Explore, 2. Present candidates as an HTML report, 3. Grilling loop, Glossary, Improve Codebase Architecture, Process

### Community 58 - "Community 58"
Cohesion: 0.33
Nodes (5): ADR 0003 — wine_uid como identificador canónico de vino, Alternativas descartadas, Consecuencias, Contexto, Decisión

### Community 59 - "Community 59"
Cohesion: 0.33
Nodes (5): Before exploring, read these, Domain Docs, File structure, Flag ADR conflicts, Use the glossary's vocabulary

### Community 60 - "Community 60"
Cohesion: 0.33
Nodes (4): AnalysisProgress — Overlay de progreso animado durante análisis, Workflow n8n: vinoteca-stats-insight (ZcK7uQdi8lu3gcpa), Fix barra de navegación inferior — contraste del tab activo, OpenRouter + Gemma 3 27B Agent AI en n8n stats workflow

### Community 61 - "Community 61"
Cohesion: 0.33
Nodes (5): CONTEXT.md — Vinoteca, Data model summary, Glossary, Missing glossary terms, Routes and their domain meaning

### Community 62 - "Community 62"
Cohesion: 0.33
Nodes (5): Roadmap — Vinoteca, V1.1 — En curso, V1.2 — Completada ✅, V1 — Completada ✅, V2 — Planificada

### Community 63 - "Community 63"
Cohesion: 0.33
Nodes (5): 1. Frame the problem space, 2. Spawn sub-agents, 3. Present and compare, Interface Design, Process

### Community 64 - "Community 64"
Cohesion: 0.33
Nodes (5): Language, Principles, Rejected framings, Relationships, Terms

### Community 65 - "Community 65"
Cohesion: 0.33
Nodes (5): Before exploring, read these, Domain Docs, File structure, Flag ADR conflicts, Use the glossary's vocabulary

### Community 66 - "Community 66"
Cohesion: 0.40
Nodes (4): ADR-0001: Migrate from Expo (React Native) to Vite PWA, Consequences, Context, Decision

### Community 67 - "Community 67"
Cohesion: 0.40
Nodes (4): ADR 0004 — GPT solo cuando el vino no existe, Consecuencias, Contexto, Decisión

### Community 68 - "Community 68"
Cohesion: 0.40
Nodes (4): ADR 0005 — QR como primera estrategia de identificación, Consecuencias, Contexto, Decisión

### Community 69 - "Community 69"
Cohesion: 0.40
Nodes (4): Auto-Clarity Exception, Examples, Persistence, Rules

### Community 70 - "Community 70"
Cohesion: 0.40
Nodes (5): Advertencias (falsos positivos, no bloquean), Estado del workflow n8n (`EtTezN27e9tqvOjS`), Flujo, Nodos destacados, Variables de entorno en n8n (configuradas en Portainer)

### Community 71 - "Community 71"
Cohesion: 0.40
Nodes (5): Estado actual, Flujo de escaneo (Scan.tsx), useWines.ts (fix `96b4790`), WineDetail.tsx, WineForm.tsx (fix `96b4790`)

### Community 72 - "Community 72"
Cohesion: 0.40
Nodes (4): Conventions, Issue tracker: GitHub, When a skill says "fetch the relevant ticket", When a skill says "publish to the issue tracker"

### Community 73 - "Community 73"
Cohesion: 0.40
Nodes (4): Conventions, Issue tracker: GitLab, When a skill says "fetch the relevant ticket", When a skill says "publish to the issue tracker"

### Community 74 - "Community 74"
Cohesion: 0.40
Nodes (4): Conventions, Issue tracker: Local Markdown, When a skill says "fetch the relevant ticket", When a skill says "publish to the issue tracker"

### Community 75 - "Community 75"
Cohesion: 0.50
Nodes (3): Consequences, Considered Options, Wine label scanning delegated to n8n

### Community 76 - "Community 76"
Cohesion: 0.50
Nodes (3): Expanding the ESLint configuration, React Compiler, React + TypeScript + Vite

### Community 79 - "Community 79"
Cohesion: 0.11
Nodes (17): 1. QA manual de V1.3.2 en iPhone, 2. V1.3.3 — UX polish del scanner, Arquitectura de la cámara, Contexto del proyecto, Estado actual: V1.3.2 completa y publicada, Ficheros clave modificados en V1.3.2, Handoff — Vinoteca V1.3.2 QA + V1.3.3 (2026-06-24), Los tres commits de V1.3.2 (+9 more)

### Community 83 - "Community 83"
Cohesion: 0.40
Nodes (4): applyFilter(), Catas(), Filter, FILTERS

### Community 84 - "Community 84"
Cohesion: 0.23
Nodes (6): WineDetail(), WineState, Wine, TYPE_LABELS, WineCardProps, WineFormProps

## Knowledge Gaps
- **523 isolated node(s):** `name`, `private`, `version`, `type`, `dev` (+518 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **14 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `Theme` connect `UI Components & Design System` to `Offline-First Sync Engine`, `Wine & Tasting Data Hooks`, `n8n AI Integration Layer`, `Community 34`, `Wine Statistics Engine`, `Scan & Camera Pipeline`, `Community 45`, `Community 83`, `Community 84`?**
  _High betweenness centrality (0.015) - this node is a cross-community bridge._
- **Why does `Wine` connect `Community 84` to `UI Components & Design System`, `Offline-First Sync Engine`, `Wine & Tasting Data Hooks`, `Community 34`, `n8n AI Integration Layer`, `Wine Statistics Engine`, `Scan & Camera Pipeline`, `Community 45`, `Community 83`, `Package JSON`?**
  _High betweenness centrality (0.005) - this node is a cross-community bridge._
- **Why does `Domain Glossary (Vinoteca)` connect `ADRs & Agent Docs` to `README`?**
  _High betweenness centrality (0.004) - this node is a cross-community bridge._
- **Are the 2 inferred relationships involving `getDB()` (e.g. with `useSync()` and `syncQueue Function (main)`) actually correct?**
  _`getDB()` has 2 INFERRED edges - model-reasoned connections that need verification._
- **What connects `name`, `private`, `version` to the rest of the system?**
  _524 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `UI Components & Design System` be split into smaller, more focused modules?**
  _Cohesion score 0.08912655971479501 - nodes in this community are weakly interconnected._
- **Should `Offline-First Sync Engine` be split into smaller, more focused modules?**
  _Cohesion score 0.09306122448979592 - nodes in this community are weakly interconnected._