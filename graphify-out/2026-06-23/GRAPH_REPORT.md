# Graph Report - .  (2026-06-23)

## Corpus Check
- 124 files · ~67,586 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 455 nodes · 909 edges · 34 communities (21 shown, 13 thin omitted)
- Extraction: 95% EXTRACTED · 5% INFERRED · 0% AMBIGUOUS · INFERRED: 43 edges (avg confidence: 0.8)
- Token cost: 0 input · 0 output

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
- [[_COMMUNITY_Caveman Skill|Caveman Skill]]
- [[_COMMUNITY_Hero Image|Hero Image]]
- [[_COMMUNITY_React Asset|React Asset]]
- [[_COMMUNITY_Vite Asset|Vite Asset]]
- [[_COMMUNITY_Zoom Out Skill|Zoom Out Skill]]

## God Nodes (most connected - your core abstractions)
1. `Theme` - 39 edges
2. `Wine` - 30 edges
3. `useWines()` - 26 edges
4. `supabase` - 22 edges
5. `getDB()` - 19 edges
6. `useAuthStore` - 18 edges
7. `Tasting` - 18 edges
8. `compilerOptions` - 17 edges
9. `compilerOptions` - 16 edges
10. `router` - 13 edges

## Surprising Connections (you probably didn't know these)
- `index.html — Punto de entrada HTML` --references--> `favicon.svg — Icono copa de vino`  [EXTRACTED]
  index.html → public/favicon.svg
- `Sommelier Intent Routing (maridaje/enriquecimiento/chat)` --semantically_similar_to--> `Scan Two-Phase Analysis (identify then full analyze)`  [INFERRED] [semantically similar]
  src/pages/Sommelier.tsx → src/pages/Scan.tsx
- `Grill Me Skill` --semantically_similar_to--> `Grill With Docs Skill`  [INFERRED] [semantically similar]
  .agents/skills/grill-me/SKILL.md → .agents/skills/grill-with-docs/SKILL.md
- `Write-a-Skill Skill` --semantically_similar_to--> `TDD Skill`  [INFERRED] [semantically similar]
  .agents/skills/write-a-skill/SKILL.md → .agents/skills/tdd/SKILL.md
- `Triage Skill` --references--> `Triage Labels Mapping`  [EXTRACTED]
  .agents/skills/triage/SKILL.md → docs/agents/triage-labels.md

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

## Communities (34 total, 13 thin omitted)

### Community 0 - "UI Components & Design System"
Cohesion: 0.05
Nodes (44): App (Root Component), UI Design System (theme-driven components), Theme, useTastings(), VinotecaDB, DuplicateResult, applyFilter(), Catas() (+36 more)

### Community 1 - "Offline-First Sync Engine"
Cohesion: 0.10
Nodes (36): Offline-First Sync Pattern, Offline-First Sync Pattern, processOperation(), useSync(), clearLocalWines(), clearQueue(), getDB(), getLocalTastings() (+28 more)

### Community 2 - "Wine & Tasting Data Hooks"
Cohesion: 0.13
Nodes (25): useAuth(), useTastings Hook, useWines(), WineFilters, addToQueue(), dataUrlToBlob(), fetchImageAsDataUrl(), storage (+17 more)

### Community 3 - "n8n AI Integration Layer"
Cohesion: 0.09
Nodes (28): Sommelier Intent Routing (maridaje/enriquecimiento/chat), callEnriquecimiento(), callMaridaje(), callScanAnalizar(), callScanIdentificar(), callSommelierChat(), callStatsInsight(), N8N_BASE (+20 more)

### Community 4 - "Package Dependencies"
Cohesion: 0.06
Nodes (33): dependencies, idb, react, react-dom, react-router-dom, recharts, @supabase/supabase-js, zustand (+25 more)

### Community 5 - "ADRs & Agent Docs"
Cohesion: 0.11
Nodes (32): ADR: AI Assistants via n8n, ADR: Scan Workflow via n8n, Agent Domain Docs Config, Issue Tracker Config (GitHub), Triage Labels Mapping, AFK Agent, Asistente de Cata, Bodega (User Wine Cellar) (+24 more)

### Community 6 - "Developer Skills (Diagnose)"
Cohesion: 0.10
Nodes (29): Diagnose Skill, Feedback Loop (Diagnose Phase 1), Fix and Regression Test Phase (Diagnose Phase 5), Hypothesise Phase (Diagnose Phase 3), Instrument Phase (Diagnose Phase 4), Reproduce Phase (Diagnose Phase 2), Grill Me Skill, ADR Format (+21 more)

### Community 7 - "Wine Statistics Engine"
Cohesion: 0.09
Nodes (12): BLANCOS, classifyWine(), DULCES, ESPUMOSOS, MES_SHORT, ROSADOS, StatsData, TINTOS (+4 more)

### Community 8 - "Scan & Camera Pipeline"
Cohesion: 0.12
Nodes (18): Animated Overlay Pattern, Duplicate Wine Detection Flow, Scan Two-Phase Analysis (identify then full analyze), compressImage(), pickFile(), useCamera(), BarrelHero(), CameraButton() (+10 more)

### Community 9 - "TypeScript App Config"
Cohesion: 0.11
Nodes (18): compilerOptions, allowImportingTsExtensions, erasableSyntaxOnly, jsx, lib, module, moduleDetection, moduleResolution (+10 more)

### Community 10 - "TypeScript Node Config"
Cohesion: 0.11
Nodes (17): compilerOptions, allowImportingTsExtensions, erasableSyntaxOnly, lib, module, moduleDetection, moduleResolution, noEmit (+9 more)

### Community 11 - "Session Handoffs & Features"
Cohesion: 0.17
Nodes (16): AnalysisProgress — Overlay de progreso animado durante análisis, Generación de imagen studio con gpt-image-1, Workflow n8n: Vinoteca Scan Analizar (EtTezN27e9tqvOjS), Workflow n8n: vinoteca-stats-insight (ZcK7uQdi8lu3gcpa), Fix barra de navegación inferior — contraste del tab activo, OpenRouter + Gemma 3 27B Agent AI en n8n stats workflow, Fixes para Safari iOS (polyfill randomUUID, webkit scroll), Flujo de Escaneo de Etiqueta (4 pasos) (+8 more)

### Community 12 - "Skills Lock Registry"
Cohesion: 0.25
Nodes (7): computedHash, skillPath, source, sourceType, skills, frontend-design, version

### Community 13 - "Frontend Design & Prototyping"
Cohesion: 0.33
Nodes (6): Aesthetic Direction (Frontend Design), Frontend Design License (Apache 2.0), Frontend Design Skill, Logic Prototype, Prototype Skill, UI Prototype

### Community 14 - "TastingCard Component"
Cohesion: 0.60
Nodes (4): scoreBg(), scoreColor(), TastingCard(), TastingCardProps

### Community 15 - "Claude Permissions"
Cohesion: 0.50
Nodes (3): permissions, additionalDirectories, allow

### Community 16 - "PWA Icons"
Cohesion: 0.50
Nodes (4): Iconos PWA — launcher y touch icons, apple-touch-icon.png — Icono PWA para iOS, pwa-192x192.png — Icono PWA 192px, pwa-512x512.png — Icono PWA 512px

### Community 17 - "HITL Loop Script"
Cohesion: 0.83
Nodes (3): capture(), step(), hitl-loop.template.sh script

## Knowledge Gaps
- **161 isolated node(s):** `PreToolUse`, `allow`, `additionalDirectories`, `name`, `private` (+156 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **13 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `Theme` connect `UI Components & Design System` to `Offline-First Sync Engine`, `Wine & Tasting Data Hooks`, `n8n AI Integration Layer`, `Wine Statistics Engine`, `Scan & Camera Pipeline`, `TastingCard Component`?**
  _High betweenness centrality (0.055) - this node is a cross-community bridge._
- **Why does `Wine` connect `UI Components & Design System` to `Offline-First Sync Engine`, `Wine & Tasting Data Hooks`, `n8n AI Integration Layer`, `Wine Statistics Engine`, `Scan & Camera Pipeline`?**
  _High betweenness centrality (0.024) - this node is a cross-community bridge._
- **Why does `useWines()` connect `Wine & Tasting Data Hooks` to `UI Components & Design System`, `Offline-First Sync Engine`, `n8n AI Integration Layer`, `Scan & Camera Pipeline`?**
  _High betweenness centrality (0.016) - this node is a cross-community bridge._
- **Are the 2 inferred relationships involving `getDB()` (e.g. with `useSync()` and `syncQueue Function (main)`) actually correct?**
  _`getDB()` has 2 INFERRED edges - model-reasoned connections that need verification._
- **What connects `PreToolUse`, `allow`, `additionalDirectories` to the rest of the system?**
  _162 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `UI Components & Design System` be split into smaller, more focused modules?**
  _Cohesion score 0.05201292976785189 - nodes in this community are weakly interconnected._
- **Should `Offline-First Sync Engine` be split into smaller, more focused modules?**
  _Cohesion score 0.09948979591836735 - nodes in this community are weakly interconnected._