# Diseño — Mejoras de calidad de imagen en la captura de cámara

## Contexto

Vinoteca es una PWA (web, `getUserMedia()` vía `src/lib/captureSource.ts`), no una app nativa. Se investigó qué controles reales de hardware de cámara (enfoque, exposición, brillo) son accesibles desde el navegador, con foco en el dispositivo real de prueba del usuario (iPhone/Safari):

- La `ImageCapture` API (`getPhotoCapabilities`/`getPhotoSettings` — brillo, contraste, ISO, balance de blancos) **no está soportada en Safari, ni iOS ni macOS**, en ninguna versión (verificado en caniuse.com/imagecapture).
- Incluso el nivel más básico, `MediaStreamTrack.getCapabilities()` (usado hoy en `captureSource.ts` para un zoom ya preparado pero no activado), **no devuelve ninguna capacidad de zoom ni torch en iOS** — ni en Safari ni en Chrome-sobre-iOS, porque ambos corren sobre el motor WKWebView, que no expone estos controles a ninguna web.
- Conclusión: no existe ninguna vía web para dar control real de enfoque/exposición/brillo de hardware en el dispositivo del usuario. La única vía real sería empaquetar la app como nativa (Capacitor + plugin de cámara nativo) — explícitamente descartado por el usuario, fuera de alcance.

Dado que el control de hardware no es viable, el alcance se redirige a **correcciones de imagen por software, aplicadas después de la captura**, que sí son 100% viables con el Canvas 2D nativo del navegador (ya en uso hoy para la rotación en `CameraView.tsx`) y no dependen de ninguna capacidad de hardware.

Este trabajo no encaja en ninguna de las 5 líneas ya definidas en el alcance de Fase 11 (`docs/roadmap/fase-11-optimizacion.md`: rendimiento, offline, accesibilidad, animaciones, pruebas OCR) — se trackea fuera de la numeración del roadmap, siguiendo el mismo criterio ya usado para "Gestión de usuarios y cuentas" (ver `docs/roadmap.md`, sección "Fuera de numeración").

## Restricción de compatibilidad

`src/pages/Scan.tsx` está congelado (`docs/roadmap.md`, sección "Congelado": *"No tocar: Scan.tsx..."*, pendiente de validación del pipeline OCR con colección real de etiquetas). `CameraView.tsx` y `captureSource.ts` no están en esa lista y sí se pueden modificar — son componentes de captura/UI reutilizables, separados del pipeline de identificación/enriquecimiento que es lo que está pendiente de validar. Condición explícita del usuario: **el comportamiento actual de `Scan.tsx` no puede romperse**.

Esto se garantiza así: `Scan.tsx` consume `CameraView` únicamente a través de su prop `onCapture: (dataUrl: string) => void` (confirmado en `src/pages/Scan.tsx:625-629`, que además aplica su propia `compressImage()` sobre el resultado). Las tres mejoras se implementan enteramente dentro del paso `PREVIEW` de `CameraView.tsx`, antes de que se llame a `onCapture` — el dataUrl final que recibe `onCapture` sigue siendo un JPEG normal, con exactamente la misma forma que hoy. `Scan.tsx` no requiere ningún cambio.

## Alcance

Las tres mejoras se añaden al paso `PREVIEW` ya existente en `CameraView.tsx` (hoy solo tiene los botones "Repetir" / "Usar foto" / "Girar"), usando únicamente Canvas 2D nativo — sin librerías nuevas.

### 1. Detector de foto borrosa

Al entrar en el estado `PREVIEW`, se calcula automáticamente una estimación de nitidez sobre la imagen capturada: se reduce a una versión pequeña en escala de grises (p. ej. 200px de ancho, para que el cálculo sea barato) y se mide la varianza de un filtro Laplaciano sobre esos píxeles — a mayor varianza, más nitidez; una foto borrosa tiene bordes suaves y por tanto varianza baja. Si el resultado cae por debajo de un umbral, se muestra un aviso no bloqueante (p. ej. una etiqueta "Puede estar borrosa" cerca del botón "Repetir"). El usuario puede ignorar el aviso y confirmar igualmente — nunca bloquea el flujo.

### 2. Ajuste manual de brillo

Un slider nuevo en la barra de PREVIEW (junto a "Girar"), rango razonable (p. ej. -50 a +50, 0 = sin cambio). Al mover el slider, la imagen mostrada en el `<img>` de previsualización se ajusta en tiempo real vía CSS `filter: brightness(...)` (ligero, sin recodificar nada mientras se ajusta). Al confirmar ("Usar foto"), el valor de brillo elegido se hornea en la imagen final junto con la rotación, en una sola pasada de canvas (ver sección "Composición final").

### 3. Corrección automática ("Auto-mejorar")

Un botón en la barra de PREVIEW que aplica un auto-estiramiento de histograma: analiza la luminosidad de la imagen, encuentra sus valores mínimo y máximo reales, y re-escala el rango completo a 0-255 (normalización de contraste estándar, sin librerías — un recorrido de píxeles sobre un canvas). Es especialmente útil para las fotos de etiquetas de vino, que suelen tomarse con luz cálida/tenue de bodega. Es un botón de "aplicar una vez" (no un slider) — si el resultado no gusta, "Repetir" vuelve a la foto original sin aplicar nada.

### Composición final (al confirmar)

Hoy `handleConfirm` en `CameraView.tsx` solo hornea la rotación si `previewRotation !== 0`, recomponiendo la imagen en un canvas. Se amplía esa misma función para que, en una única pasada de canvas, aplique: rotación (si la hay) + brillo manual (si se ajustó) + auto-mejora (si se aplicó, ya horneada en el estado de la imagen en memoria desde que se pulsó el botón). Si el usuario no tocó nada, el comportamiento es idéntico al actual (se llama a `onCapture(state.dataUrl)` sin pasar por canvas, igual que hoy).

## Fuera de alcance

- Cualquier control de hardware real (enfoque, exposición, ISO, balance de blancos, torch/flash) — confirmado inviable en el dispositivo del usuario vía web.
- Empaquetado nativo (Capacitor u otro) — explícitamente descartado por el usuario.
- Zoom óptico o digital durante la captura en vivo (zoom mientras se ve el visor) — no estaba en el alcance pedido; el zoom ya preparado en `captureSource.ts` (`setZoom`/`getZoomCapabilities`) no se activa en este trabajo porque no devuelve capacidades en iOS de todos modos.
- Cambios en `src/pages/Scan.tsx` (congelado) o en los workflows n8n `wine/identify`/`wine/enrich`.
- Edición/reemplazo de fotos de vinos ya guardados, múltiples fotos por vino, preferencias de cámara en Ajustes — mejoras identificadas en la misma sesión pero no elegidas para este diseño; quedan para un diseño posterior si se retoman.

## Verificación

- `npx tsc -b`.
- Prueba manual: entrar en `/scan`, tomar una foto, confirmar que aparecen el slider de brillo, el botón "Auto-mejorar" y (si la foto sale borrosa a propósito, p. ej. moviendo el móvil al disparar) el aviso de nitidez.
- Confirmar que "Repetir" descarta cualquier ajuste de brillo/auto-mejora aplicado y vuelve a un estado limpio.
- Confirmar que el flujo sin tocar ningún control nuevo (solo "Usar foto" directamente) produce exactamente el mismo resultado que antes de este cambio — mismo tamaño/calidad de imagen, sin regresión.
- Probar también el flujo de "manual" (`Scan.tsx?manual=1`, añadido en la fase de gestión de usuarios) para confirmar que no se ve afectado.
