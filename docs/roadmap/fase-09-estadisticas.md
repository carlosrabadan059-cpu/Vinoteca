# Fase 9 — Estadísticas

## Estado

✅ Completada (2026-08-02)

Verificación de código completa: `npx tsc -b` limpio (nota: `npx tsc --noEmit` es un no-op silencioso en este repo — ver `CLAUDE.md`). **Verificación manual en pantalla completada** por el usuario en producción (`/stats`): hero de valor, tira de métricas y distribuciones se ven correctamente. Durante la prueba se detectaron y corrigieron tres problemas:
- Service Worker de la PWA sirviendo un bundle desactualizado que impedía que el botón "Analizar mi colección" reaccionara — mitigado navegando en pestaña privada; el propio `autoUpdate` del SW se encarga de refrescarlo en uso normal.
- El workflow n8n `vinoteca-stats-insight` fallaba con "rate limit reached" porque el nodo `OpenRouter Model` usaba un modelo gratuito de OpenRouter — corregido en n8n (fuera de este repo) cambiando a un modelo de pago de OpenAI.
- El botón "Actualizar análisis" no daba ninguna señal visual de éxito y estaba estilizado como texto plano (se seleccionaba al tocar en móvil en vez de activarse) — corregido en `src/pages/Stats.tsx`: ahora es una pastilla con icono y confirmación visual "✓ Actualizado" (commits `6b47840`, `81951e3`).

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

Nada — ambos puntos originales (rediseño visual e incorporación de precio/num_botellas) están hechos y verificados en producción.

---

## Criterio de finalización

El usuario puede ver un resumen visual de su colección con distribuciones, valor estimado e insight narrativo de la IA.
