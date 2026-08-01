# Fase 9 — Estadísticas

## Estado

✅ Completada (2026-07-18)

Verificación de código completa: `npx tsc -b` limpio (nota: `npx tsc --noEmit` es un no-op silencioso en este repo — ver `CLAUDE.md`), servidor de desarrollo arranca sin errores. **Pendiente de verificación manual en pantalla** por el usuario (navegar a `/stats` con datos reales y confirmar que el hero, la tira de métricas, el insight IA y las listas de top uva/bodega se ven correctamente).

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

Ver el spec completo en [`docs/superpowers/specs/2026-07-18-estadisticas-fase9-design.md`](../superpowers/specs/2026-07-18-estadisticas-fase9-design.md) y el plan de implementación en [`docs/superpowers/plans/2026-07-18-estadisticas-fase9-plan.md`](../superpowers/plans/2026-07-18-estadisticas-fase9-plan.md).

Resumen:
- Valor estimado del inventario y total de botellas (nuevas métricas hero, calculadas a partir de `precio`/`num_botellas`).
- Distribución por uva y por bodega (top 5), sumadas a la ya existente distribución por región.
- `src/hooks/useStats.ts` refactorizado como orquestador fino sobre `src/lib/statsHelpers.ts` (funciones puras, mismo patrón que `catasHelpers.ts` de Fase 8).
- `Stats.tsx` rediseñada: hero de valor, insight IA promovido, agrupación en "Tu colección"/"Tu actividad".

---

## Decisiones de diseño

Ver `docs/superpowers/specs/2026-07-18-estadisticas-fase9-design.md` para el detalle completo (mockup aprobado, arquitectura de datos, criterios de agrupación "sin especificar"). Resumen de las decisiones clave tomadas con el usuario:
- El valor estimado y el total de botellas cuentan **todas** las botellas alguna vez registradas (incluidas las consumidas), como valor histórico invertido en la colección, no solo el stock actual.
- No se parsean variedades múltiples en el campo `uva` (blends cuentan como una única etiqueta).

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
