# Fase 3 — Enriquecimiento

## Estado

✅ Completada · Pipeline congelado pendiente validación masiva

---

## Objetivo

Después de identificar el vino, enriquecer su ficha con datos técnicos (uva, crianza, alcohol, temperatura de servicio, URL de bodega, imagen) obtenidos de fuentes externas.

---

## Alcance

- Endpoint `wine/enrich` en n8n
- Fuentes de datos externas: ficha técnica oficial, DO, distribuidores, Vivino
- Sistema de trazabilidad por campo (`FieldTrace`)
- Integración en `Scan.tsx` como segunda fase del pipeline (tras identificación)

---

## Funcionalidades

- **callScanEnriquecer** (`src/lib/n8n.ts`): `POST /webhook/vinoteca/wine/enrich` con `wine_uid`
- **EnrichResponse** (`src/types/index.ts`): campos `uva`, `crianza`, `alcohol`, `temp_servicio`, `url_bodega`, `imagen_url`, `region`, `denominacion`, `descripcion`, cada uno como `FieldTrace`
- **FieldTrace** (`src/types/index.ts`): valor + fuente + URL + prioridad + fecha + confianza (`high`/`medium`/`low`) + posibles conflictos
- **SourceType**: `official_winery` | `technical_sheet` | `do_oficial` | `distributor` | `vivino` | `other`
- Indicadores de confianza en WineForm: el formulario muestra la fuente y nivel de confianza de cada campo enriquecido

---

## Decisiones de diseño

- El enriquecimiento nunca sobreescribe la identidad del vino
- Si hay conflictos entre fuentes, se almacenan en `alternatives[]` del `FieldTrace`
- El usuario puede editar manualmente cualquier campo enriquecido

---

## Decisiones técnicas

- Prioridad de fuentes: `official_winery` (1) > `technical_sheet` (2) > `do_oficial` (3) > `distributor` (4) > `vivino` (5) > `other` (6)
- n8n busca en paralelo en múltiples fuentes y resuelve conflictos por prioridad
- ✅ **Ampliación region/denominación/descripción + página completa de la bodega** (2026-08-27): el workflow n8n "Vinoteca – Wine Enrich" (`rV1BrlPmkUB87jnn`) ya no se limita a los snippets de Brave Search — dos nodos nuevos (`Descargar Página Candidata` → `Extraer Texto de Página`) descargan y limpian el HTML de la página oficial de la bodega candidata, y ese texto completo se añade al grounding que recibe `OpenAI Enrich`. Esto permite rellenar tres campos nuevos con la misma garantía anti-invención ya vigente para el resto (si no hay confirmación real en el texto, el campo queda `null`): `region`, `denominacion` (extraídos igual que `uva`/`crianza`/etc., con fallback extractivo de Brave Search en `Fusionar Campos` si la primera pasada de OpenAI no los confirma) y `descripcion` (párrafo de síntesis de 2-4 frases, generado EXCLUSIVAMENTE a partir del contenido de la página oficial descargada — nunca de la memoria de OpenAI ni de snippets sueltos; si la descarga falla o no aporta contenido sustancial, `descripcion` queda `null`). De paso se corrigió `precio`, que el workflow ya calculaba desde Brave Search pero el frontend descartaba silenciosamente — ahora se aplica en el merge de `Scan.tsx`. Verificado end-to-end contra el webhook real de producción con "La Chanin" (Cható Gañán): `region` = "Sierra de Gredos", `descripcion` con el párrafo real sobre viñedo/elaboración y `source_url` apuntando a `chatoganan.es`, `precio` = 16.95 — todos con FieldTrace correcto. Nueva columna `wines.descripcion_fuente_url` (migración Supabase) sostiene la nota de atribución ("Fuente: dominio.com") que ahora se muestra bajo la descripción en `WineDetail.tsx`.

---

## Pendiente

- Validación masiva con colección real (pipeline congelado)
- ~~Añadir fuentes: Brave Search, DO oficial scraping mejorado~~ — Brave Search ya estaba integrado desde antes de esta fase; el scraping de la página oficial de la bodega se añadió el 2026-08-27 (ver Decisiones técnicas). DO oficial scraping dedicado sigue sin implementarse.

---

## Criterio de finalización

✅ Los campos técnicos del vino aparecen pre-rellenados con su fuente y nivel de confianza visibles.
