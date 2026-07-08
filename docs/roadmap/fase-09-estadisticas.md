# Fase 9 — Estadísticas

## Estado

⬜ Pendiente

---

## Objetivo

Ofrecer al usuario una vista analítica de su colección: distribución por tipo, DO, uva, añada, valor estimado del inventario y evolución temporal.

---

## Alcance

- Número total de botellas y valor estimado del inventario
- Distribución por DO / región / uva / bodega
- Distribución por tipo de vino
- Evolución por añada / décadas
- Puntuaciones medias
- Insight narrativo generado por IA (ya implementado en n8n, endpoint `stats/insight`)

---

## Funcionalidades

*(Por definir en la sesión de diseño de la fase)*

La base técnica existe: `useStats`, `Stats.tsx` y `callStatsInsight` en `src/lib/n8n.ts` están implementados con Recharts y el endpoint de n8n activo.

---

## Decisiones de diseño

*(Por definir)*

---

## Decisiones técnicas

- Recharts ya está instalado y en uso
- Endpoint n8n `POST /webhook/vinoteca/stats/insight` activo

---

## Pendiente

- Rediseño visual completo de la pantalla Stats.tsx
- Incorporar datos de colección personal (precio, num_botellas) en las estadísticas

---

## Criterio de finalización

El usuario puede ver un resumen visual de su colección con distribuciones, valor estimado e insight narrativo de la IA.
