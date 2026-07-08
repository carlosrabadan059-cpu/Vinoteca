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
- **EnrichResponse** (`src/types/index.ts`): campos `uva`, `crianza`, `alcohol`, `temp_servicio`, `url_bodega`, `imagen_url`, cada uno como `FieldTrace`
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

---

## Pendiente

- Validación masiva con colección real (pipeline congelado)
- Añadir fuentes: Brave Search, DO oficial scraping mejorado

---

## Criterio de finalización

✅ Los campos técnicos del vino aparecen pre-rellenados con su fuente y nivel de confianza visibles.
