# Roadmap — Vinoteca

## V1 — Completada ✅

- [x] **OCR** — Captura de foto frontal/trasera, análisis con GPT-4o Vision vía n8n (`/scan/analizar`)
- [x] **GPT** — Extracción de campos del vino (nombre, bodega, añada, región, uva, descripción, etc.) desde etiqueta
- [x] **Storage** — CRUD completo de vinos en Supabase, imágenes en bucket `wine-labels`, IndexedDB offline, cola de sync
- [x] **wine_uid** — SHA-256 de `normalizeWineText(nombre)|normalizeWineText(bodega)|añada`, algoritmo idéntico en frontend y n8n

También incluido en V1:
- Autenticación Supabase (email + contraseña)
- Lista de bodega con búsqueda, filtros y scroll infinito
- Catas: formulario, puntuación, notas, historial de chat
- Sommelier: chat con enrutamiento de intención (maridaje / enriquecimiento / libre)
- Estadísticas con Recharts + insight narrativo vía n8n
- PWA instalable con Service Worker (Workbox NetworkFirst)
- Tema centralizado (`src/constants/theme.ts`)

---

## V1.1 — En curso

- [ ] **Identificación rápida** — Fase 1 del scan: `POST /webhook/vinoteca/scan/identificar` (OCR → wine_uid → lookup Supabase). Si el vino existe, no llama a GPT.
- [ ] **QR cache** — Primera forma de identificación antes de wine_uid. Lookup por `qr_fuente` en la bodega del usuario.
- [ ] **Caché inteligente** — (pendiente de especificar)

Pendientes técnicos de V1 que deben resolverse en V1.1:
- Migrar `TastingChat` de llamada directa a OpenAI → n8n webhook (expone API key en cliente)
- Backfill de `wine_uid` para vinos con `wine_uid = NULL` (script comentado en `wineDuplicates.ts`)
- Resolver `processOperation` duplicado (en `useSync.ts` y `main.tsx`)
- Consolidar `ChatBubble` duplicado (`src/components/wine/` vs `src/components/ui/`)
- Completar offline sync automático al reconectar (estructuras IDB listas, flujo no activado)

---

## V2 — Planificada

- [ ] **Recomendaciones IA** — (pendiente de especificar)
- [ ] **Compartir bodega** — (pendiente de especificar)
