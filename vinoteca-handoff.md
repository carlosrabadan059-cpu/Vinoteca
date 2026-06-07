# Handoff: Vinoteca PWA

**Última actualización:** 2026-06-07  
**Repo:** `/Users/carlosrabadan/Antigravity/Vinoteca`  
**Rama:** `master`

---

## Stack

- **Vite + React 19 + TypeScript**
- **Supabase** — auth + DB (tablas `wines`, `tastings`), sesión via `localStorage`
- **OpenAI** — `gpt-4o-mini` client-side en `src/lib/openai.ts` (`dangerouslyAllowBrowser: true`)
- **n8n** — orquesta las llamadas IA de Sommelier y Stats via webhooks (`src/lib/n8n.ts`)
- **React Router v7** — dos layouts: `AuthLayout` y `TabsLayout`
- **vite-plugin-pwa** — Workbox `NetworkFirst` para Supabase, manifest con `theme_color: #722F37`
- **Zustand** — stores: `wineStore`, `tastingStore`, `authStore`, `toastStore`, `syncStore`
- **recharts** — gráficos del dashboard de estadísticas

Rutas activas: `/bodega`, `/bodega/:id`, `/scan`, `/catas`, `/catas/nueva`, `/catas/:id`, `/sommelier`, `/stats`  
Auth: `/login`, `/register`

Variables de entorno (`.env`, no commiteado):
```
VITE_SUPABASE_URL=https://xagsblgwvfitqkzjtwyc.supabase.co
VITE_SUPABASE_ANON_KEY=...
VITE_OPENAI_API_KEY=...
VITE_N8N_BASE_URL=https://n8n.rabadanhouse.space
```

Comandos: `npm run dev` · `npm run build` · `npx tsc --noEmit`

---

## Fases completadas

### Fase 0 — Migración Expo → Vite PWA
Stack anterior era Expo SDK 56 (React Native). Se migró a web-only PWA. Archivos del proyecto Expo eliminados (`App.tsx`, `app.json`, `index.ts`, assets de Android/iOS).

### Fase 1 — Setup de agent skills (2026-06-06)
- `/setup-matt-pocock-skills` ejecutado
- Issue tracker: **GitHub** (`gh` CLI) → `docs/agents/issue-tracker.md`
- Triage labels: defaults 5 etiquetas → `docs/agents/triage-labels.md`
- Domain docs: single-context → `docs/agents/domain.md`
- `CONTEXT.md` creado en raíz con glosario del dominio
- ADRs en `docs/adr/` (0001 y 0002 ya escritos)
- ⚠️ El bloque `## Agent skills` de `CLAUDE.md` puede haberse perdido en una reescritura — verificar

### Fase 2 — Core app (bodega + scan + catas básico)
- Auth completo (login, register, `useAuth`, `useAuthStore`)
- `useWines` + `wineStore`: CRUD completo, búsqueda, paginación
- `Bodega.tsx`: lista con búsqueda, skeleton, estado vacío
- `WineDetail.tsx`: imágenes tabs, datos, mini-catas
- `Scan.tsx`: captura foto (frontal + trasera), análisis con OpenAI vision (`analyzeWineLabel`), formulario de revisión, guardado con `createWine`
- Componentes UI: `Button`, `Card`, `Input`, `Modal`, `Spinner`, `Toast`, `Badge`, `Layout`
- Componentes wine: `WineCard`, `WineForm`, `ImageCapture`, `TastingForm`, `TastingMiniCard`

### Fase 3 — Módulo de catas guiadas por IA
- `useTastings` + `tastingStore`: CRUD completo contra Supabase
- `TastingChat.tsx`: chat 4 fases (Color → Aroma → Boca → Conclusión), detecta `CATA_COMPLETA` + JSON, botón "Guardar cata" gold
- `TastingCard.tsx`: badge circular puntuación (gold ≥90, primary ≥70, muted <70)
- `Catas.tsx`: lista con filtros chips (Todas / Esta semana / Este mes / Mejor puntuadas), skeleton, estado vacío
- `NuevaCata.tsx`: buscador de vino con debounce, banner del vino, monta `TastingChat`
- `TastingDetail.tsx`: badge puntuación, tarjetas Color/Aroma/Boca/Maridaje, chat colapsable, Web Share API, modal eliminación

### Fase 4 — Sommelier IA via n8n (2026-06-07)
Configuración MCP: `.mcp.json` en raíz del proyecto + `enableAllProjectMcpServers: true` en `~/.claude/settings.json`. JWT audience `mcp-server-api` (distinto al REST API key).

Workflows creados y activos:

| Workflow | ID n8n | Webhook |
|---|---|---|
| `vinoteca-sommelier-chat` | `Yd2Llg4eRLaAD21I` | `POST /webhook/vinoteca/sommelier/chat` |
| `vinoteca-sommelier-maridaje` | `yMlzaK784fz1VHzz` | `POST /webhook/vinoteca/sommelier/maridaje` |
| `vinoteca-sommelier-enriquecimiento` | `dUq4iL2FvkIR0Awl` | `POST /webhook/vinoteca/sommelier/enriquecimiento` |

Frontend:
- `src/lib/n8n.ts`: cliente POST con timeout 30s para los 3 webhooks + `WineCollection` interface
- `ChatBubble.tsx`: burbuja con fade-in, alineación por rol
- `SuggestionChips.tsx`: chips scrollables con borde gold
- `Sommelier.tsx`: chat libre, detección de intención (maridaje / enriquecimiento / chat general), historial 20 mensajes, suggestions chips al iniciar, botón limpiar

### Fase 5 — Dashboard de estadísticas (2026-06-07)

Workflow n8n:

| Workflow | ID n8n | Webhook |
|---|---|---|
| `vinoteca-stats-insight` | `ZcK7uQdi8lu3gcpa` | `POST /webhook/vinoteca/stats/insight` |

Frontend:
- `src/hooks/useStats.ts`: carga `wines` + `tastings` en paralelo, calcula localmente tipos (clasificación por keywords), décadas, top 5 regiones, evolución 6 meses
- `Stats.tsx`: grid 2×2 métricas, barras horizontales por tipo (recharts, colores por varietal), barras de progreso regiones, histograma décadas (decade máxima en gold), línea dual evolución catas (2 ejes Y), insight IA con caché localStorage 24h
- `Layout.tsx`: 5º tab `📊 Stats` añadido

---

## Pendientes conocidos

- **`## Agent skills` en `CLAUDE.md`** — verificar si sobrevivió a la última reescritura; si no, recuperar de `docs/agents/`
- **Primer commit y remote GitHub** — todo el código de `src/`, `docs/`, etc. está sin versionar; hasta tener remote, los comandos `gh` fallan
- **Eliminar `dangerouslyAllowBrowser: true`** — una vez que las catas también pasen por n8n (en lugar de llamar a OpenAI directamente desde `TastingChat`), se puede retirar la clave OpenAI del cliente
- **`.mcp.json` no debe commitearse** — contiene JWT live; está en `.gitignore` (verificar)
- **`useSync.ts`** — stub de Fase 1, sin implementar; la sincronización offline pendiente

---

## Arquitectura de datos Supabase

Tablas:
- `wines` — campos: `id`, `user_id`, `nombre`, `bodega`, `anada`, `region`, `denominacion`, `uva`, `tipo`, `imagen_frontal_url`, `imagen_trasera_url`, `created_at`, `synced_at`
- `tastings` — campos: `id`, `user_id`, `wine_id`, `fecha`, `puntuacion`, `notas_cata`, `aroma`, `color_descripcion`, `maridaje`, `chat_history` (jsonb), `created_at`

Credencial OpenAI usada en n8n: ID `C7ixyEhpJV5Tm38Z` ("OpenAI account"), modelo `gpt-4o`.

---

## Probar los webhooks de n8n

```bash
# Sommelier chat
curl -s -X POST https://n8n.rabadanhouse.space/webhook/vinoteca/sommelier/chat \
  -H "Content-Type: application/json" \
  -d '{"messages":[],"wineCollection":[],"userMessage":"¿Qué es el Priorat?"}' | jq .

# Maridaje
curl -s -X POST https://n8n.rabadanhouse.space/webhook/vinoteca/sommelier/maridaje \
  -H "Content-Type: application/json" \
  -d '{"plato":"chuletón","wineCollection":[],"ocasion":"cena familiar"}' | jq .

# Enriquecimiento DO
curl -s -X POST https://n8n.rabadanhouse.space/webhook/vinoteca/sommelier/enriquecimiento \
  -H "Content-Type: application/json" \
  -d '{"denominacion":"Ribera del Duero","region":"Castilla y León","uva":"Tempranillo"}' | jq .

# Stats insight
curl -s -X POST https://n8n.rabadanhouse.space/webhook/vinoteca/stats/insight \
  -H "Content-Type: application/json" \
  -d '{"totalVinos":20,"totalCatas":8,"puntuacionMedia":85.5,"topRegiones":[{"region":"Rioja","count":8}],"distribucionTipos":[{"tipo":"Tinto","count":15}],"anadas":[{"decada":"2010s","count":12}],"mejorVino":{"nombre":"Vega Sicilia","puntuacion":96}}' | jq .
```
