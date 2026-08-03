# Diseño — "Foto de estudio": mejora de fotografías con IA

## Contexto

En la ficha de un vino (`WineDetail.tsx`), tras implementar la función de reemplazar/añadir la foto de un vino ya guardado (`docs/superpowers/specs/2026-08-03-reemplazar-foto-vino-design.md`), el usuario comparó una foto recién tomada con las demás fotos de su bodega y notó que las antiguas tienen un fondo oscuro/limpio uniforme mientras la nueva muestra la habitación real donde se tomó. Se confirmó investigando el código que la app nunca ha hecho ningún procesado de imagen más allá de compresión/rotación/brillo (`src/lib/imageQuality.ts`) — el aspecto limpio de las fotos antiguas es solo porque se fotografiaron sobre un fondo liso, no por ningún tratamiento.

Esta función añade una vía manual para generar, con IA (API de imágenes de OpenAI), una versión "de estudio" de la foto de un vino: mismo fondo homogéneo en toda la colección, sin tocar la botella. No es únicamente "quitar el fondo" — es la base de un sistema más amplio de mejora fotográfica (iluminación, nitidez, encuadre…) que podrá crecer en el futuro sin rediseñarse.

## Restricciones

No se modifica: `src/pages/Scan.tsx` (congelado), `src/components/ui/CameraView.tsx`, ni los workflows n8n de OCR/Identify/Enrich. Esta funcionalidad es completamente independiente de ese pipeline.

**Único ajuste sobre una función ya entregada:** la función de reemplazar/añadir foto (`savePhoto()` en `WineDetail.tsx`, ya en producción) cambia la ruta de Storage a la que sube la foto — ver sección "Ajuste en 'Cambiar/Añadir foto'" más abajo. Es necesario para que "conservar siempre el original" sea una garantía real y no solo una promesa de nomenclatura.

## Arquitectura

```
Foto de estudio (WineDetail.tsx)
        │
        ▼
callImprovePhoto(imagen_original_url, image_style)   [nuevo, src/lib/n8n.ts]
        │
        ▼
Webhook n8n — "Vinoteca – Wine Improve Photo" (nuevo workflow)
        │
        ├─ Descarga la imagen de imagen_original_url
        ├─ Nodo OpenAI (edición de imagen), credencial "OpenAI Carlos" (ya existente en n8n,
        │    misma que usan Wine Identify/Wine Enrich — no hace falta credencial nueva)
        ├─ Prompt tomado de una variable con nombre propio en el workflow: PHOTO_STYLE_STUDIO_V1
        │    (nunca escrito inline en los parámetros del nodo IA — cambiar el prompt en el
        │    futuro es editar un único nodo/variable)
        └─ Responde con la imagen generada (dataUrl)
        │
        ▼
WineDetail.tsx recibe el dataUrl → Modal de vista previa
        │
   ┌────┴────┐
Cancelar   Usar esta fotografía
   │            │
  (nada)        ▼
          uploadWineImage(dataUrl, user.id, wine.id, `studio-${Date.now()}`)
                │
                ▼
          updateWine(wine.id, {
            imagen_frontal_url:      nuevaUrl,
            image_version:           'studio_v1',
            image_style:             'PHOTO_STYLE_STUDIO_V1',
            image_source:            'ai_studio',
            image_processing_state:  'completed',
          })
```

## Esquema de datos

Nueva migración en `supabase/migrations/`:

```sql
alter table wines
  add column imagen_original_url    text,
  add column image_version          text not null default 'original',
  add column image_style            text,
  add column image_source           text,
  add column image_processing_state text not null default 'original';
```

Sin backfill de datos históricos con valores inventados: para vinos existentes estos campos empiezan vacíos o con su valor por defecto, y se rellenan correctamente la primera vez que el vino interactúa con este sistema (ver flujo más abajo). No se sabe con certeza cómo se obtuvo la foto de un vino ya existente (cámara, galería, ¿ya venía de un editor externo?), así que `image_source` no se rellena a ciegas.

**Responsabilidad de cada campo:**
- `imagen_original_url` — **fuente de verdad** de si el original ya está protegido. Si tiene valor, el original está a salvo en Storage y nunca se sobrescribe. Si es `null`, hace falta crearlo antes de procesar. (No se usa `image_version` para esto — un dato podría llegar a `image_version = 'studio_v1'` por una restauración, migración o edición manual en Supabase sin que el archivo original esté realmente protegido; `imagen_original_url` es la única señal fiable porque describe un hecho de Storage, no un estado derivado.)
- `image_version` — generación del pipeline que produjo la imagen actual (`original`, `studio_v1`, futuro `studio_v2`…). Determina qué lógica/versión de código la generó.
- `image_style` — el prompt exacto usado (`PHOTO_STYLE_STUDIO_V1`, futuro `PHOTO_STYLE_LIGHT_V1`…). Varias variantes de estilo pueden compartir una misma `image_version`, así que este campo no es redundante con aquel.
- `image_source` — cómo se obtuvo la imagen actualmente activa: `'camera' | 'gallery' | 'ai_studio'`.
- `image_processing_state` — `'original' | 'processing' | 'completed' | 'failed'`. Persistido en BD (no solo en estado de React) para poder diagnosticar un proceso interrumpido si el usuario cierra la app a mitad de una generación.

## Flujo detallado

### Ajuste en "Cambiar/Añadir foto" (`savePhoto()` en `WineDetail.tsx`)

Al tomar/elegir una foto real nueva (cámara o galería), es la nueva línea base — cualquier versión de estudio anterior queda descartada a propósito:

- Sube a la ruta fija `${userId}/${wineId}/original.jpg` (antes: `frontal.jpg`).
- `imagen_frontal_url` e `imagen_original_url` pasan a apuntar ambos a esa URL (aún no hay nada generado por IA, así que "actual" y "original" son literalmente el mismo archivo).
- `image_version: 'original'`, `image_style: null`, `image_source: 'camera'|'gallery'`, `image_processing_state: 'original'`.

Esta ruta (`original.jpg`) es la única que "Cambiar/Añadir foto" tiene permitido sobrescribir — es una sustitución deliberada del usuario, de naturaleza distinta a una transformación de IA. Las salidas de "Foto de estudio", en cambio, nunca se sobrescriben (ver siguiente sección).

### "Foto de estudio"

Nueva entrada en el menú "⋯" de `WineDetail.tsx`, visible solo si `wine.imagen_frontal_url` tiene valor.

1. **Preparar el original si hace falta:** si `wine.imagen_original_url == null` (vino creado por `Scan.tsx`, que no lo rellena — está congelado y fuera de esta funcionalidad), se copia primero el `imagen_frontal_url` actual a `${userId}/${wineId}/original.jpg` y se guarda esa URL en `imagen_original_url` antes de continuar. Reutiliza `fetchImageAsDataUrl()` (ya existente en `src/lib/storage.ts`) para descargar el archivo actual como dataUrl y `uploadWineImage()` para subirlo a la nueva ruta.
2. `updateWine(wine.id, { image_processing_state: 'processing' })` — persistido antes de llamar a n8n.
3. `callImprovePhoto(imagen_original_url)` → n8n descarga esa imagen (siempre el original, nunca una versión ya procesada — evita degradación por IA-sobre-IA y da resultados consistentes si en el futuro cambia el prompt o el modelo), genera la nueva imagen con el prompt `PHOTO_STYLE_STUDIO_V1`, devuelve un dataUrl.
4. **Si falla el paso anterior:** `updateWine(wine.id, { image_processing_state: 'failed' })`, toast de error ("No se pudo mejorar la fotografía"), nada más cambia — la ficha sigue mostrando la foto que tenía.
5. **Si funciona:** se muestra un Modal de vista previa con la imagen generada y dos botones:
   - **Cancelar** — `updateWine(wine.id, { image_processing_state: previousState })`, restaurando el valor que tenía antes del paso 2 (capturado en memoria al iniciar el flujo). Así `'processing'` solo queda persistido cuando el proceso se interrumpió de verdad (cerrar la app, perder conexión), nunca tras una cancelación explícita — mantiene útil la señal de diagnóstico.
   - **Usar esta fotografía** — `uploadWineImage(dataUrl, user.id, wine.id, `studio-${Date.now()}`)` (ruta nueva y única, nunca pisa una generación anterior) → `updateWine(wine.id, { imagen_frontal_url: nuevaUrl, image_version: 'studio_v1', image_style: 'PHOTO_STYLE_STUDIO_V1', image_source: 'ai_studio', image_processing_state: 'completed' })`.

**Mensaje durante el procesamiento:** "Mejorando fotografía… Esto puede tardar unos segundos." (variante del overlay de carga ya existente en `WineDetail.tsx`).

### Cambios en `src/lib/storage.ts`

`uploadWineImage(dataUrl, userId, wineId, side)`: el tipo de `side` pasa de la unión fija `'frontal' | 'trasera'` a `string` — cambio aditivo. `Scan.tsx` (congelado) sigue llamándolo con los literales `'frontal'`/`'trasera'` sin ningún cambio de comportamiento ni de firma rota.

### Cambios en `src/lib/n8n.ts`

Nueva función `callImprovePhoto(imagenOriginalUrl: string): Promise<string>` que llama al webhook del nuevo workflow y devuelve el dataUrl generado — mismo patrón que `callStatsInsight`/`callMaridaje`/`callSommelierChat` ya existentes en ese archivo.

## Verificación previa a implementar (grep, no requiere n8n)

Antes de escribir código, confirmar con un grep que ningún otro archivo del repo reconstruye la ruta de Storage `${userId}/${wineId}/frontal.jpg` directamente (en vez de leer la URL guardada en `imagen_frontal_url`) — de ser así, el cambio de `savePhoto()` a la ruta `original.jpg` lo rompería.

## Fuera de alcance

- Restaurar la fotografía original desde la UI (el dato queda preservado en `imagen_original_url`, pero no hay botón para "volver a la original" en esta primera versión).
- Comparar antes/después en la vista previa (se muestra solo la imagen candidata).
- Múltiples estilos seleccionables por el usuario (`PHOTO_STYLE_LIGHT_V1` y similares) — solo existe `PHOTO_STYLE_STUDIO_V1` en esta versión; el esquema ya soporta añadir más sin migración adicional.
- Regeneración masiva de toda la colección de una vez.
- Límite de reintentos o control de coste más allá de que la acción sea manual.
- Aplicar esto a `imagen_trasera_url` — no se muestra en `WineDetail.tsx`.

## Verificación

- `npx tsc -b`.
- Migración aplicada (`supabase migration up` o vía dashboard) y confirmada con `list_tables`/`execute_sql` antes de probar en la app.
- Prueba manual: vino con foto antigua (sin `imagen_original_url`) → "Foto de estudio" → confirma que primero se crea `original.jpg` y luego se genera/aplica la versión de estudio. Repetir "Foto de estudio" una segunda vez sobre el mismo vino → confirma que parte de `imagen_original_url` (no de la versión de estudio anterior) y que la generación previa sigue existiendo en Storage (no se pisó). Cancelar en la vista previa → nada cambia. "Cambiar/Añadir foto" tras tener ya una versión de estudio → confirma que resetea `image_version`/`image_style`/`image_source`/`image_processing_state` correctamente.
