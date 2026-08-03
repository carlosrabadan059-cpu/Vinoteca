# Diseño — Reemplazar la foto de un vino ya guardado

## Contexto

En la Bodega, cada vino muestra su foto frontal (`wines.imagen_frontal_url`) en las tarjetas y en la ficha (`WineDetail.tsx`). Cuando la foto tomada al añadir el vino sale mal encuadrada (torcida, mal iluminada, etc.), hoy no hay forma de corregirla sin eliminar el vino y volver a crearlo desde cero — lo que además perdería catas, notas y el resto de datos ya guardados.

Este trabajo se identificó en la sesión de mejoras de cámara del 2026-08-02 (`docs/superpowers/specs/2026-08-02-mejoras-camara-captura-design.md`, sección "Fuera de alcance": *"Edición/reemplazo de fotos de vinos ya guardados... quedan para un diseño posterior si se retoman"*) y se retoma ahora.

Es la primera de dos mejoras de cámara independientes planificadas en esta sesión; la segunda (indicador de nivel/horizonte en la captura en vivo) tiene su propio spec por separado.

## Restricción de compatibilidad

`src/pages/Scan.tsx` está congelado (`docs/roadmap.md`, sección "Congelado") — no se toca. Este trabajo no lo necesita: vive enteramente en `WineDetail.tsx`, reutilizando `CameraView.tsx` (ya no cubierto por el freeze desde la fase de mejoras de cámara) exactamente como ya la usa `Scan.tsx`, sin modificarla.

## Alcance

### Punto de entrada

Nueva entrada en el menú "⋯" de `WineDetail.tsx` (el mismo menú que hoy solo tiene "Eliminar vino"), con el icono de cámara que ya usa el resto de la app. La etiqueta es dinámica: **"Cambiar foto"** si `wine.imagen_frontal_url` ya tiene valor, **"Añadir foto"** si es `null` — mismo flujo técnico en ambos casos, solo cambia el texto. Solo aplica a la foto frontal — `imagen_trasera_url` existe en el modelo de datos pero `WineDetail.tsx` nunca la muestra, así que queda fuera de alcance.

### Flujo de captura

Al tocar la entrada del menú se muestra un pequeño selector con dos opciones — **"Hacer foto"** y **"Desde galería"** — porque en `Scan.tsx` esa elección no vive dentro de `CameraView.tsx` (que no tiene botón de galería propio), sino en una pantalla previa que decide entre abrir la cámara en vivo o `useCamera().pickFromGallery()` directamente. Aquí no hace falta replicar la pantalla-hero completa de `Scan.tsx` (con visor de fondo, botón de disparo grande, etc.) — basta un selector ligero con las dos opciones, coherente con el resto de acciones puntuales de `WineDetail.tsx`.

- **"Hacer foto"** → abre `CameraView` (`source={getUserMediaSource()}`, `hint="Centra la etiqueta frontal"`), con todo lo que ya trae: slider de brillo, "Auto-mejorar", detector de foto borrosa. Al confirmar con "Usar foto" (que ya actúa como paso de confirmación explícito — no se añade un modal adicional) se recibe el `dataUrl` en `onCapture`.
- **"Desde galería"** → `useCamera().pickFromGallery()` directamente, sin pasar por `CameraView`; si el usuario cancela el selector de archivos, la función devuelve `null` y no se hace nada.

En ambos casos, una vez se tiene el `dataUrl` de la foto elegida:

1. `compressImage(dataUrl)` — el mismo helper de `src/hooks/useCamera.ts` que usa `Scan.tsx` (corrige orientación EXIF, redimensiona a 1200px de ancho máximo). Mismo pipeline técnico, mismas especificaciones de imagen que una foto añadida al crear el vino.
2. `uploadWineImage(dataUrl, user.id, wine.id, 'frontal')` (`src/lib/storage.ts`) — ya usa `upsert: true`, así que sobreescribe el archivo existente en el bucket `wine-labels` sin dejar basura ni requerir un borrado previo.
3. `updateWine(wine.id, { imagen_frontal_url: nuevaUrl })` (`src/hooks/useWines.ts`) — hook ya existente, con UI optimista y cola de sync offline si falla. Solo se actualiza este campo; nombre, bodega, añada, catas y el resto de datos del vino quedan intactos.

Al cancelar (botón ✕ de `CameraView` o `onCancel`), no se sube ni se guarda nada — la foto anterior permanece exactamente igual.

### Consistencia visual con el resto de fotos

El fondo oscuro (`#110809`), el filtro `brightness(1.08) contrast(1.05)` y el degradado de superposición que dan a todas las fotos de vino su aspecto uniforme **no están horneados en la imagen** — son estilos que `WineCardGrid.tsx`, `WineCardList.tsx` y el hero de `WineDetail.tsx` aplican en el momento de renderizar, a cualquier `imagen_frontal_url` sea cual sea su origen. Como este flujo solo cambia el valor de ese campo y reutiliza el mismo `compressImage()` que ya usa `Scan.tsx`, la foto reemplazada queda automáticamente con el mismo aspecto que el resto — no requiere ningún tratamiento adicional.

### Manejo de errores

Si `uploadWineImage` falla (p. ej. sin conexión — a diferencia de los campos de texto, una imagen no se puede encolar de forma realista en IndexedDB por su tamaño), se muestra un toast de error (`useToastStore`, ya usado en el resto de la página) y no se llama a `updateWine` — la foto anterior se mantiene sin cambios, no se pierde nada.

## Fuera de alcance

- Foto trasera (`imagen_trasera_url`) — no se muestra en `WineDetail.tsx`, no aplica.
- Historial de fotos anteriores / deshacer tras confirmar — la sustitución en Storage con `upsert` es irreversible salvo repitiendo el proceso con la foto correcta.
- Recorte o edición manual más allá de lo que ya ofrece `CameraView` (brillo, auto-mejora).
- Subida de imagen en cola offline — si falla por falta de conexión, el usuario debe reintentar cuando vuelva a tener red.

## Verificación

- `npx tsc -b`.
- Prueba manual: abrir un vino con foto, menú "⋯" → "Cambiar foto" → tomar/seleccionar foto → "Usar foto" → confirmar que la ficha y las tarjetas de Bodega muestran la foto nueva con el mismo fondo/estilo que el resto, y que nombre/bodega/añada/catas no cambiaron.
- Confirmar que "Cancelar" en la cámara no altera la foto existente.
- Confirmar que un vino sin foto también puede añadírsela por primera vez desde este mismo menú (mismo flujo, `imagen_frontal_url` pasa de `null` a la nueva URL).
