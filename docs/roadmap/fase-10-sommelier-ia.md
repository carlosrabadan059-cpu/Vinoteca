# Fase 10 — Sommelier IA

## Estado

✅ Completada (2026-08-02)

Verificación de código completa: `npx tsc -b --force` limpio. Los dos workflows n8n modificados se verificaron con ejecuciones manuales exitosas vía MCP (execution ids `475682`, `475683`), confirmando que la IA usa correctamente el perfil de gusto y el `intentHint`. Una revisión holística final encontró que la búsqueda por ocasión no estaba realmente conectada en `detectIntent()` (bloqueador) — corregido en el commit `fd7a9a6` antes de cerrar la fase. **Pendiente de verificación manual en pantalla** por el usuario (navegar a `/sommelier` con una cuenta con catas variadas y probar las 5 capacidades).

---

## Objetivo

Mejorar la experiencia del Sommelier IA con recomendaciones personalizadas basadas en el historial de catas del usuario, búsqueda por ocasión y comparativas entre vinos.

---

## Alcance

- Recomendaciones personalizadas basadas en historial de catas
- Búsqueda por ocasión ("vino para cena romántica", "para un asado de verano")
- Comparativas entre vinos de la colección
- Contexto de catas del usuario en todas las respuestas del Sommelier
- Maridajes inversos (dado un vino, qué platos recomienda)

---

## Funcionalidades

Ver el spec completo en [`docs/superpowers/specs/2026-08-02-sommelier-ia-fase10-design.md`](../superpowers/specs/2026-08-02-sommelier-ia-fase10-design.md) y el plan de implementación en [`docs/superpowers/plans/2026-08-02-sommelier-ia-fase10-plan.md`](../superpowers/plans/2026-08-02-sommelier-ia-fase10-plan.md).

Resumen:
- Nuevo `src/lib/sommelierHelpers.ts` con `buildTasteProfile(wines, tastings)` — perfil de gusto resumido (vinos mejor valorados, tipo/regiones preferidas, puntuación media, ocasiones frecuentes), mismo patrón de helper puro que `statsHelpers.ts`/`catasHelpers.ts`.
- Nuevo `src/hooks/useSommelier.ts` que orquesta la carga y expone `tasteProfile`.
- `src/lib/n8n.ts`: `callSommelierChat`/`callMaridaje` ampliados con `tasteProfile` opcional; `callSommelierChat` gana además `intentHint` (`'comparativa' | 'maridaje-inverso'`).
- `src/pages/Sommelier.tsx`: `detectIntent()` reconoce ahora `comparativa`, `maridaje-inverso` y búsqueda por ocasión (reutilizando la intención `maridaje` existente), todo por lenguaje natural en el chat, sin UI nueva.
- Workflows n8n `vinoteca-sommelier-chat` y `vinoteca-sommelier-maridaje` ampliados (vía MCP, fuera del repo) para recibir `tasteProfile`/`intentHint` y usarlos en el prompt.

---

## Decisiones de diseño

Ver `docs/superpowers/specs/2026-08-02-sommelier-ia-fase10-design.md` para el detalle completo. Resumen de las decisiones clave:
- Las 5 capacidades del roadmap se resuelven con un único cambio de fondo (perfil de gusto + router de intención ampliado), reutilizando los 3 workflows n8n existentes — no se crean workflows nuevos.
- Comparativas y maridaje inverso se disparan por lenguaje natural en el chat existente (no hay UI dedicada de selección de vinos).
- El perfil de gusto (`TasteProfile`) es un resumen calculado en el cliente, no el historial completo de catas — mantiene el payload ligero.
- Desviaciones conocidas respecto al spec original, aceptadas conscientemente tras la revisión holística de cierre (no bloquean el uso normal):
  - `regionesPreferidas` exige un mínimo de 2 catas por región (igual que `tipoPreferido`), no 1 como decía el spec inicial — evita ruido estadístico con una sola cata.
  - `vinosMejorValorados` puede repetir el mismo vino si tiene varias catas bien puntuadas (ordena por cata, no por vino único).
  - `useSommelier` no comparte caché con `useWines`/`wineStore` (hace su propio fetch de `wines`), y no tiene ruta offline como sí tiene `useWines` — el perfil de gusto requiere red.

---

## Decisiones técnicas

- Los tres endpoints del Sommelier ya estaban activos: `chat`, `maridaje`, `enriquecimiento` — todos reutilizados, ninguno nuevo.
- **Nota de esta fase (fix aplicado, no parte del diseño original):** durante la implementación se detectó que `vinoteca-sommelier-maridaje` tenía el nodo de IA conectado al mismo modelo gratuito de OpenRouter con rate-limit ya visto en Fase 9 — corregido reconectando el nodo OpenAI de pago ya existente.

---

## Criterio de finalización

El Sommelier puede hacer recomendaciones personalizadas basándose en el gusto demostrado del usuario a través de su historial de catas.
