# Fase 11 — Optimización

## Estado

🚧 En desarrollo — 5 de 5 subsistemas implementados; OCR dado por validado informalmente (2026-08-19, ver Decisiones técnicas). Queda la verificación manual en dispositivo de las 4 líneas de 2026-08-02.

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

---

## Pendiente

- Verificación manual en el dispositivo de las cuatro líneas ya implementadas (rendimiento, offline, accesibilidad, animaciones) — ver sección "Verificación manual pendiente" más abajo.
- `muted2`/`muted3` sin auditar en contraste (ver nota de accesibilidad arriba).

---

## Verificación manual pendiente (en el dispositivo)

- **Rendimiento:** scroll largo en Bodega/Catas sigue fluido; las tarjetas fuera de pantalla no rompen el layout al reaparecer.
- **Offline:** DevTools → Network → Offline, editar Perfil o Ajustes, volver Online — confirmar que se sincroniza (además de la verificación ya pendiente de wines/tastings de la Fase 11 parte 1).
- **Accesibilidad:** navegar con teclado (Tab) y comprobar que el anillo dorado de foco aparece en botones e inputs; contraste del texto secundario a simple vista.
- **Animaciones:** transición sutil al cambiar de pestaña/ruta; feedback de opacidad al tocar botones y tarjetas; con "Reducir movimiento" activado en iOS, confirmar que las animaciones se acortan a casi nada.

## Criterio de finalización

La app funciona fluida con 500+ vinos, opera en modo offline y el pipeline OCR ha sido validado con colección real — ✅ cumplido informalmente (28 vinos reales sin incidencias, 2026-08-19; ver Decisiones técnicas).
