# Fase 11 — Optimización

## Estado

✅ Completada (2026-08-19) — 5 de 5 subsistemas implementados y verificados en dispositivo. OCR dado por validado informalmente; verificación manual de rendimiento/offline/accesibilidad/animaciones superada con una salvedad menor en rendimiento (ver Decisiones técnicas). Ambos cabos sueltos que quedaban abiertos (refresco de imágenes, contraste `muted2`/`muted3`) se cerraron el 2026-08-20 — no queda nada pendiente de esta fase salvo la migración Envoy, ya fuera de su alcance.

---

## Objetivo

Preparar Vinoteca para uso intensivo: rendimiento, modo offline completo, sincronización, accesibilidad y pruebas masivas del pipeline OCR.

---

## Alcance

- Rendimiento: virtualización de listas largas, caché de imágenes
- Offline completo: sync automático al reconectar (estructura IDB lista, flujo no activado)
- Accesibilidad: foco de teclado, roles ARIA, contraste
- Animaciones: transiciones de pantalla, micro-interacciones
- Pruebas masivas del pipeline OCR V1.4 con colección real de etiquetas

---

## Funcionalidades

*(Por definir)*

---

## Decisiones de diseño

*(Por definir)*

---

## Decisiones técnicas

- `useSync.ts` y `idb.ts` existen — el listener `online` de `main.tsx` sincroniza automáticamente; `useSync().syncToSupabase()` también se usa manualmente desde `src/components/ui/SyncModal.tsx`
- ✅ **Rendimiento** (2026-08-02): la Bodega ya paginaba con scroll infinito (`PAGE_SIZE = 20` en `useBodegaState.ts`), lo que acota la carga inicial pero no libera DOM fuera de pantalla al hacer scroll. En vez de introducir una librería de virtualización (arriesgado sin poder verificar visualmente el layout de grid/lista con agrupación en el dispositivo), se usó `content-visibility: auto` + `contain-intrinsic-size` nativo del navegador en `WineCardGrid`/`WineCardList`/`TastingCard` — el navegador salta layout/paint de las tarjetas fuera de pantalla sin tocar la estructura del DOM ni el scroll infinito existentes. Las imágenes de las tarjetas usan `loading="lazy" decoding="async"` (el cacheo en sí ya lo cubre Workbox `CacheFirst` en `vite.config.ts` para `supabase.co/storage`).
- ✅ **Offline completo** (2026-08-02): `useWines`/`useTastings` ya encolaban sus escrituras al fallar; `useProfile`/`useSettings` no lo hacían (fallaban en silencio sin conexión). Ahora ambos siguen el mismo patrón (UI optimista + `addToQueue` en el `catch`). `SyncOperation.table` se amplió a `'profiles' | 'user_settings'` y se añadió `idColumn` opcional (`user_settings` usa `user_id` como PK, no `id`) — `processOperation` en `syncQueue.ts` ahora filtra por esa columna en vez de asumir siempre `'id'`.
- ✅ **Animaciones** (2026-08-02): `injectKeyframes()` solo se llamaba desde `useBodegaState.ts`; `SyncIndicator.tsx`/`WineForm.tsx` usan esas mismas animaciones sin garantizar que estuvieran inyectadas si el usuario entraba por una ruta distinta a `/bodega`. Movido a `Layout.tsx` (se renderiza en todas las páginas autenticadas). Añadida una transición de página (`pageFade`, fade + translateY sutil) al contenedor de `<main>`, con `key={location.pathname}` para que se re-dispare también en rutas con parámetro (`/bodega/:id`, `/catas/:id`). Micro-interacción táctil global (`:active { opacity: 0.75 }`) en `button` y `[role="button"]` — la mayoría de botones no tenían ningún feedback al pulsar; con opacidad en vez de `transform` para no interferir con el FAB de `Bodega.tsx`, que ya anima su propio `transform`. Todo respeta `prefers-reduced-motion` (ya cubierto por la regla existente en `KEYFRAMES_CSS`).
- ✅ **Accesibilidad** (2026-08-02): no existía ningún estilo `:focus-visible` global — varios inputs usan `outline-none` de Tailwind sin sustituto, dejando la navegación por teclado sin indicador de foco. Añadida una regla global en `index.css` (ver ADR de esa decisión más abajo). `aria-live="polite"`/`role="status"` en el aviso de foto borrosa de `CameraView.tsx`. `aria-label` en los dos botones icon-only sin nombre accesible detectados (menú "⋯" de `WineDetail.tsx`, toggle grid/lista de `Bodega.tsx`) — el resto de botones con icono ya incluían texto visible. `theme.colors.muted` (#7A6266, contraste 3.6:1 sobre el fondo) no cumplía WCAG AA (4.5:1) para texto normal; ajustado a #9E7F84 (≥4.5:1 sobre bg/surface/surface2), mismo tono. `muted2`/`muted3` quedan sin tocar — se usan también para separadores puramente decorativos y cambiarlos a ciegas (sin poder verificar visualmente en el dispositivo) es más arriesgado que el beneficio; pendiente de auditar con más detalle si se retoma esta línea.
- ✅ `processOperation`/`syncQueue` consolidados en `src/lib/syncQueue.ts` (2026-08-02) — `main.tsx` y `useSync.ts` ya no duplican la lógica
- ✅ `ChatBubble` de `src/components/wine/` era código muerto (nadie lo importaba) — eliminado (2026-08-02); la versión activa sigue en `src/components/ui/ChatBubble.tsx`
- ~~TastingChat hace llamada directa a OpenAI~~ — ya resuelto desde antes de esta fase (commit `011a94b`), `TastingChat.tsx` usa `callSommelierChat` (n8n) igual que el resto de features de IA. Nota eliminada por estar desactualizada.
- ✅ **OCR — validación dada por buena informalmente** (2026-08-19): no se llegó a montar la validación masiva estructurada planificada (muestra deliberada + métricas de acierto), pero el pipeline lleva **28 vinos reales registrados sin incidencias** en uso normal de la app (17 confirmados el 2026-08-04 + 11 más el 2026-08-19). Decisión del usuario: dar la fase por validada con esta evidencia de uso real en vez de construir la validación masiva aparte.
- ✅ **Verificación manual en dispositivo — completada** (2026-08-19): las 14 comprobaciones de rendimiento/offline/accesibilidad/animaciones se hicieron en dispositivo real. Todo correcto salvo una salvedad menor: en los puntos de scroll rápido y cambio grid/lista (Rendimiento 2/3 y 3/3), el refresco de las imágenes de las tarjetas tardaba algo más de lo esperado en ocasiones al reaparecer en pantalla.
- ✅ **Fix — refresco de imágenes lento** (2026-08-19, confirmado en dispositivo 2026-08-20): causa raíz, `content-visibility: auto` en el contenedor de la tarjeta impide que el navegador calcule a tiempo la distancia del `<img>` al viewport, así que `loading="lazy"` no puede adelantar la carga — la imagen solo empezaba a cargar cuando la tarjeta ya era renderizable, justo al entrar en pantalla, perdiendo el margen de precarga. Quitado `loading="lazy"` de `WineCardGrid.tsx`/`WineCardList.tsx` (se mantiene `decoding="async"`); `content-visibility: auto` ya cubre por sí solo el "no renderizar tarjetas fuera de pantalla", así que el lazy-loading nativo era redundante ahí y estaba siendo contraproducente. El usuario confirmó en dispositivo real que el retraso en scroll rápido ya no aparece.
- ✅ **Auditoría de contraste `muted2`/`muted3`** (2026-08-20, commit `c067323`): ambos tokens rondaban 1.6–2.25:1 de contraste contra `bg`/`surface`/`surface2`, muy por debajo del mínimo WCAG AA de 4.5:1 para texto pequeño (meta región en `WineCardGrid.tsx`, chip tipo/región en `WineCardList.tsx`, pill de sugerencias y hint de swipe en `Bodega.tsx`). Nuevos valores `muted2: #AC7982` y `muted3: #A77E85`, verificados >4.5:1 en el peor caso (fondo `surface2`) contra los tres fondos. Trade-off aceptado: en un fondo tan oscuro, forzar 4.5:1 en varios tonos "apagados" a la vez los comprime cerca de la misma luminosidad que `muted` — no hay margen para mantener tres tonos claramente distintos y cumplir WCAG AA simultáneamente, así que se priorizó legibilidad sobre la sutileza de la jerarquía visual original. Confirmado visualmente por el usuario antes de publicar.

---

## Pendiente

*(Ningún cabo suelto de esta fase — los dos últimos, refresco de imágenes y contraste `muted2`/`muted3`, se cerraron el 2026-08-20, ver Decisiones técnicas)*

La migración de gateway (Kong → Envoy) planificada en [`docs/supabase-envoy-migration.md`](../supabase-envoy-migration.md) queda desbloqueada: la verificación manual que la retenía ya se completó (2026-08-19). Es la única pieza de trabajo abierta relacionada con esta fase, y se deja deliberadamente para una ventana de tiempo más amplia por tocar producción — estimación ~45–90 min si no hay sorpresas, hasta 2.5 h con el riesgo conocido de las asymmetric keys (ver el propio documento, sección "Comprobaciones previas").

---

## Verificación manual (en el dispositivo) — ✅ completada 2026-08-19

- **Rendimiento:** scroll largo en Bodega/Catas sigue fluido; las tarjetas fuera de pantalla no rompen el layout al reaparecer. ⚠️ Salvedad menor: el refresco de imágenes tarda algo más en ocasiones tras scroll rápido y al cambiar entre vista grid/lista.
- **Offline:** confirmado — editar Perfil/Ajustes offline y reconectar sincroniza correctamente.
- **Accesibilidad:** confirmado — anillo de foco visible por teclado, contraste correcto a simple vista.
- **Animaciones:** confirmado — transición sutil al cambiar de pestaña/ruta, feedback de opacidad al tocar, "Reducir movimiento" en iOS acorta las animaciones correctamente.

## Criterio de finalización

La app funciona fluida con 500+ vinos, opera en modo offline y el pipeline OCR ha sido validado con colección real — ✅ cumplido: OCR validado informalmente (28 vinos reales sin incidencias) y verificación manual en dispositivo completada, ambos 2026-08-19 (ver Decisiones técnicas).
