# Changelog — Vinoteca

Todas las versiones relevantes del proyecto se documentan aquí.

---

## v0.7.0 — 2026-07-09

### Fase 7 — Gestión de Bodega

**Nuevos componentes**
- `WineCardGrid` — card de vino en vista cuadrícula (2 columnas), imagen 158px, badges de tipo/favorito/stock, animación staggered
- `WineCardList` — card de vino en vista lista, thumbnail 52×68px, columna de info y columna de métricas

**Pantalla Bodega rediseñada**
- Vista dual grid/lista con toggle persistente en `localStorage`
- Búsqueda instantánea con debounce 300ms y autocomplete client-side (🍷 VINO · 🏛️ BODEGA · 📍 REGIÓN · 🏷️ D.O.)
- Chips de filtro rápido: tipo de vino, favoritos, en stock
- Panel de filtros avanzado: rango de añada, agrupación, ordenación
- Agrupación por bodega, región, denominación, añada, tipo o ubicación
- Ordenación: 7 criterios (fecha añadido, nombre, bodega, añada ↑↓, precio, stock)
- Stats de colección en header (vinos, botellas, bodegas) con animación countUp
- Skeleton con shimmer durante la carga inicial (6 cards)
- FAB inteligente: se oculta al hacer scroll, reaparece 600ms después
- Pull-to-refresh táctil
- Infinite scroll con `IntersectionObserver`
- Estado vacío diferenciado: bodega vacía vs. sin resultados con filtros activos

**Hook `useWines` extendido**
- `SortKey` exportado como tipo público reutilizable
- `WineFilters` ampliado: `tipo`, `favorito`, `stock`, `anada_min`, `anada_max`, `sort`
- `listWines` con `sortMap` interno y chaining de filtros Supabase PostgREST
- Búsqueda extendida a `denominacion` (antes solo nombre/bodega/región)

**Arquitectura**
- `src/lib/bodegaHelpers.ts` — tipos (`GroupKey`, `Suggestion`), constantes (`TIPOS`, `SORT_OPTIONS`, `GROUP_OPTIONS`) y funciones puras (`getSuggestions`, `groupWines`, `unique`) sin dependencias de React
- `src/hooks/useBodegaState.ts` — todo el estado reactivo y efectos de la pantalla Bodega, desacoplados del componente
- `src/pages/Bodega.tsx` — composición pura; sin lógica de negocio ni efectos directos

**Design System**
- Congelado en `src/constants/theme.ts` (v1)
- Nuevos tokens: `colors.imageBg` (`#110809`) y `colors.iconMuted` (`#9A7E82`)
- Keyframes: `cardIn`, `countUp`, `slideUp`, `shimmer`, `spin` — inyectados una sola vez vía `injectKeyframes()`
- Todos los componentes consumen exclusivamente tokens del Design System

---

## v0.6.0 — 2026-07-04

### Fase 6 — WineDetail rediseñado

- Reescritura completa de `WineDetail.tsx`
- Hero 238px con gradiente, acciones, características, información, notas personales, últimas catas, panel colección colapsable
- 6 columnas de colección personal añadidas a la tabla `wines`: `precio`, `num_botellas`, `ubicacion`, `fecha_compra`, `favorito`, `consumido`

---

## v0.5.0 — 2026-06-25

### Fase 5 — WineForm rediseñado

- Secciones agrupadas, stepper de confianza, campos de colección personal integrados
- Schema migration aplicada en Supabase

---

## v0.4.0 — 2026-06-18

### Fase 4 — WineForm y backend Sommelier

- WineForm completo con validación
- 3 workflows n8n del Sommelier activos

---

## v0.3.0 — 2026-06-13

### Fase 3 — Enriquecimiento

- Pipeline V1.4 de enriquecimiento completado

---

## v0.2.0 — 2026-06-11

### Fase 2 — Identificación

- Pipeline V1.4 de identificación completado

---

## v0.1.0 — 2026-06-10

### Fase 1 — Captura y OCR

- Proyecto iniciado, captura de etiquetas con OCR
