# "Foto de estudio" (mejora de fotografías con IA) — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Añadir una acción manual "Foto de estudio" en la ficha del vino que genera, con la API de imágenes de OpenAI (vía n8n), una versión de fondo homogéneo de la foto — con vista previa antes de aplicar y sin sobrescribir nunca ni el original ni generaciones anteriores.

**Architecture:** Migración Supabase con 5 columnas nuevas en `wines`. Nuevo workflow n8n (Webhook → Code → OpenAI edición de imagen → Code → Respond, mismo patrón que `Vinoteca – Wine Enrich`) usando la credencial `OpenAI Carlos` ya existente. Cliente: `callImprovePhoto()` nuevo en `src/lib/n8n.ts`, `uploadWineImage()` generalizado en `src/lib/storage.ts`, y toda la UI/orquestación en `src/pages/WineDetail.tsx` (ajustando `savePhoto()` ya existente + nuevo flujo con vista previa).

**Tech Stack:** TypeScript, React 19, Supabase (Postgres + Storage), n8n (workflow SDK vía MCP), OpenAI API (edición de imágenes). Sin test runner en el repo — verificación vía `npx tsc -b` + prueba manual. `npx tsc --noEmit` es un no-op silencioso aquí (tsconfig raíz solution-style) — usar siempre `npx tsc -b`.

---

## Estructura de archivos

| Archivo | Cambio |
|---|---|
| `supabase/migrations/<timestamp>_wine_photo_studio.sql` (nuevo) | 5 columnas nuevas en `wines` |
| `src/types/index.ts` (modificar) | Nuevos campos en `Wine` |
| `src/lib/storage.ts` (modificar) | `uploadWineImage`: `side` pasa de unión fija a `string` |
| `src/lib/n8n.ts` (modificar) | Nueva `callImprovePhoto()` |
| Workflow n8n "Vinoteca – Wine Improve Photo" (nuevo, vía MCP) | Recibe una URL de imagen, la procesa con OpenAI, devuelve el dataUrl resultante |
| `src/pages/WineDetail.tsx` (modificar) | Ajuste de `savePhoto()` + nueva acción "Foto de estudio" con vista previa |
| `docs/roadmap.md` (modificar) | Registrar el trabajo |

**No se toca:** `src/pages/Scan.tsx` (congelado), `src/components/ui/CameraView.tsx`, workflows n8n `wine/identify`, `wine/enrich`, `Scan Identificar`.

---

## Task 1: Migración de esquema

**Files:**
- Create: `supabase/migrations/<timestamp>_wine_photo_studio.sql` (el timestamp lo genera `supabase migration new`, formato `YYYYMMDDHHMMSS`)

- [ ] **Step 1: Crear el archivo de migración**

```bash
cd "/Volumes/SSD Externo/Proyectos/Antigravity/Vinoteca"
supabase migration new wine_photo_studio
```

Esto crea `supabase/migrations/<timestamp>_wine_photo_studio.sql` vacío. Edítalo con este contenido exacto:

```sql
-- "Foto de estudio": mejora de fotografías de vino con IA.
-- imagen_original_url es la fuente de verdad de si el original ya está
-- protegido en Storage (no image_version, que solo describe qué versión
-- de pipeline generó la imagen ACTUAL — un dato podría llegar a
-- image_version='studio_v1' por una restauración o edición manual sin que
-- el archivo original esté realmente a salvo).
alter table public.wines
  add column imagen_original_url    text,
  add column image_version          text not null default 'original',
  add column image_style            text,
  add column image_source           text,
  add column image_processing_state text not null default 'original';
```

- [ ] **Step 2: Aplicar la migración**

```bash
supabase db push
```

Expected: confirma que la migración `<timestamp>_wine_photo_studio` se aplicó sin errores contra el proyecto remoto vinculado. Si el comando falla porque el proyecto no está vinculado (`supabase link` nunca se corrió en este entorno), instruye al usuario para que ejecute `supabase db push` él mismo desde su máquina, o aplique el SQL de arriba manualmente desde el SQL Editor del dashboard de Supabase — en ese caso, marca este Step como completado con una nota explícita de que requiere acción manual del usuario, y continúa con el resto del plan (el resto del código puede escribirse y compilar sin que la migración esté aplicada todavía).

- [ ] **Step 3: Regenerar tipos si el proyecto usa generación automática**

Este repo no usa `supabase gen types` (los tipos de `Wine` en `src/types/index.ts` están escritos a mano) — no hace falta ningún paso de generación aquí, los tipos se actualizan manualmente en la Task 2.

- [ ] **Step 4: Commit**

```bash
git add supabase/migrations/
git commit -m "feat(db): columnas para \"Foto de estudio\" (imagen_original_url, image_version, image_style, image_source, image_processing_state)"
```

---

## Task 2: Tipos TypeScript

**Files:**
- Modify: `src/types/index.ts:1-31`

- [ ] **Step 1: Añadir los 5 campos nuevos a `Wine`**

El interface `Wine` termina hoy así:

```ts
export interface Wine {
  id: string
  user_id: string
  nombre: string
  bodega: string | null
  anada: number | null
  region: string | null
  denominacion: string | null
  uva: string | null
  tipo: string | null
  alcohol: string | null
  crianza: string | null
  descripcion: string | null
  url_bodega: string | null
  temp_servicio: string | null
  contiene: string | null
  volumen: string | null
  imagen_frontal_url: string | null
  imagen_trasera_url: string | null
  qr_fuente: string | null
  wine_uid: string | null
  created_at: string
  synced_at: string | null
  // Colección personal
  precio:       number | null
  num_botellas: number
  ubicacion:    string | null
  fecha_compra: string | null
  favorito:     boolean
  consumido:    boolean
}
```

Reemplázalo por (se añaden los 5 campos nuevos justo después de `imagen_trasera_url`):

```ts
export interface Wine {
  id: string
  user_id: string
  nombre: string
  bodega: string | null
  anada: number | null
  region: string | null
  denominacion: string | null
  uva: string | null
  tipo: string | null
  alcohol: string | null
  crianza: string | null
  descripcion: string | null
  url_bodega: string | null
  temp_servicio: string | null
  contiene: string | null
  volumen: string | null
  imagen_frontal_url: string | null
  imagen_trasera_url: string | null
  // "Foto de estudio" — mejora de imagen con IA
  imagen_original_url:    string | null
  image_version:          string
  image_style:            string | null
  image_source:           string | null
  image_processing_state: string
  qr_fuente: string | null
  wine_uid: string | null
  created_at: string
  synced_at: string | null
  // Colección personal
  precio:       number | null
  num_botellas: number
  ubicacion:    string | null
  fecha_compra: string | null
  favorito:     boolean
  consumido:    boolean
}
```

- [ ] **Step 2: Verificar tipos**

Run: `npx tsc -b`
Expected: fallará en varios sitios que construyen un objeto `Wine` sin estos campos (p. ej. `src/hooks/useWines.ts`, en `createWine`). Eso es intencional y se corrige en la Task 6 y en este mismo paso si aparecen errores fuera del alcance de `WineDetail.tsx` — en ese caso, añade los 5 campos con sus valores por defecto (`imagen_original_url: null`, `image_version: 'original'`, `image_style: null`, `image_source: null`, `image_processing_state: 'original'`) donde `tsc -b` señale que faltan, y vuelve a compilar hasta que no queden errores.

- [ ] **Step 3: Commit**

```bash
git add src/types/index.ts
```

No hagas commit todavía si el Step 2 tocó otros archivos (p. ej. `useWines.ts`) — inclúyelos en el mismo commit:

```bash
git add -A
git commit -m "feat(types): campos de \"Foto de estudio\" en Wine"
```

---

## Task 3: `uploadWineImage` acepta cualquier nombre de archivo

**Files:**
- Modify: `src/lib/storage.ts:38-60`

- [ ] **Step 1: Generalizar el tipo de `side`**

`src/lib/storage.ts` tiene hoy:

```ts
export async function uploadWineImage(
  dataUrl: string,
  userId: string,
  wineId: string,
  side: 'frontal' | 'trasera'
): Promise<string> {
```

Cámbialo a:

```ts
export async function uploadWineImage(
  dataUrl: string,
  userId: string,
  wineId: string,
  side: string
): Promise<string> {
```

El resto de la función no cambia — sigue construyendo `path = \`${userId}/${wineId}/${side}.jpg\`` igual que antes. Es un cambio de tipo puramente aditivo: cualquier código que ya llamaba a esta función con `'frontal'` o `'trasera'` (incluido `src/pages/Scan.tsx`, congelado) sigue compilando y comportándose exactamente igual, porque esos literales siguen siendo valores válidos de `string`.

- [ ] **Step 2: Verificar que `Scan.tsx` no cambia de comportamiento**

Run: `grep -n "uploadWineImage" src/pages/Scan.tsx`
Expected: dos llamadas, con `'frontal'` y `'trasera'` literales sin cambios — confirma que no hiciste ninguna edición en ese archivo.

- [ ] **Step 3: Verificar tipos**

Run: `npx tsc -b`
Expected: sin errores relacionados con `uploadWineImage` (los que puedan quedar de la Task 2 ya deberían estar resueltos).

- [ ] **Step 4: Commit**

```bash
git add src/lib/storage.ts
git commit -m "feat(storage): uploadWineImage acepta cualquier nombre de archivo, no solo frontal/trasera"
```

---

## Task 4: Cliente n8n — `callImprovePhoto`

**Files:**
- Modify: `src/lib/n8n.ts`

- [ ] **Step 1: Añadir la función**

En `src/lib/n8n.ts`, justo después de `callStatsInsight` (la última función del archivo, líneas 193-197), añade:

```ts
export async function callImprovePhoto(
  imagenOriginalUrl: string
): Promise<{ imageDataUrl: string }> {
  return post<{ imageDataUrl: string }>('vinoteca/wine/improve-photo', {
    imagen_original_url: imagenOriginalUrl,
  })
}
```

Sigue exactamente el mismo patrón que `callStatsInsight`/`callMaridaje`: usa el helper `post<T>()` ya existente en este archivo (con su timeout de 60s y manejo de errores ya implementado), sin duplicar nada.

- [ ] **Step 2: Verificar tipos**

Run: `npx tsc -b`
Expected: sin errores.

- [ ] **Step 3: Commit**

```bash
git add src/lib/n8n.ts
git commit -m "feat(n8n): cliente callImprovePhoto para \"Foto de estudio\""
```

---

## Task 5: Workflow n8n "Vinoteca – Wine Improve Photo"

Esta tarea se ejecuta enteramente a través de las herramientas MCP de n8n (`mcp__n8n__*`), no editando archivos del repo. El workflow sigue el mismo patrón de tres capas que ya usa `Vinoteca – Wine Enrich` (`Webhook → Code (preparar) → OpenAI → Code (validar) → Respond`) — antes de escribir nada, lee ese workflow existente como referencia de estilo:

```
mcp__n8n__get_workflow_details con workflowId "rV1BrlPmkUB87jnn"
```

**Antes de escribir ningún nodo, sigue el proceso obligatorio del propio servidor MCP de n8n** (documentado en las instrucciones del servidor): `get_sdk_reference` primero, luego `get_workflow_best_practices` para las técnicas relevantes (`content_generation` y `document_processing`), luego `search_nodes` para localizar el nodo de OpenAI en modo edición de imagen, y **`get_node_types` con los discriminadores exactos que devuelva `search_nodes`** antes de fijar ningún parámetro — no adivines nombres de parámetros del nodo de imagen; es la única parte de este plan donde el nombre exacto de un parámetro no se puede conocer sin consultarlo primero.

- [ ] **Step 1: Descubrir el SDK y las técnicas**

```
mcp__n8n__get_sdk_reference (sin argumentos, o con section="guidelines"/"design" si el tool lo pide)
mcp__n8n__get_workflow_best_practices con technique "document_processing"
```
(La técnica `content_generation` ya se consultó durante el diseño — su guía dice que el nodo OpenAI de n8n soporta generación/edición de imágenes con la misma credencial de tipo `openAiApi` que ya usan `Wine Identify`/`Wine Enrich`.)

- [ ] **Step 2: Localizar el nodo de edición de imagen**

```
mcp__n8n__search_nodes con queries incluyendo algo como ["openai image edit", "http request", "code"]
```

Anota el `nodeId` exacto y los discriminadores (`resource`/`operation`) que devuelva para el nodo de OpenAI en modo imagen/edición — probablemente `@n8n/n8n-nodes-langchain.openAi` con `resource: "image"` y `operation: "edit"` o similar, pero **confírmalo con la búsqueda real, no lo des por hecho**.

- [ ] **Step 3: Obtener los tipos exactos**

```
mcp__n8n__get_node_types con los nodeIds encontrados en el Step 2 (incluyendo los discriminadores), más "n8n-nodes-base.webhook", "n8n-nodes-base.code", "n8n-nodes-base.httpRequest" y "n8n-nodes-base.respondToWebhook"
```

Usa exactamente los nombres de parámetro que devuelva esta llamada al construir el workflow — no los que aparezcan en el ejemplo de `Wine Enrich` de arriba para el nodo de chat, que es un nodo distinto (`resource`/`operation` de texto, no de imagen).

- [ ] **Step 4: Localizar la credencial OpenAI**

```
mcp__n8n__list_credentials con query "OpenAI Carlos"
```

Anota su `id` — es la credencial que ya usan `Wine Identify`/`Wine Enrich`, no crees una nueva.

- [ ] **Step 5: Construir el workflow**

Nombre: `Vinoteca – Wine Improve Photo`. Estructura (mismo patrón de capas que `Wine Enrich`, adaptado a imagen):

1. **Webhook** (`n8n-nodes-base.webhook`) — `httpMethod: POST`, `path: "vinoteca/wine/improve-photo"`, `responseMode: "responseNode"`. Recibe `{ imagen_original_url: string }` en el body.
2. **Code — "Preparar Contexto"** (`n8n-nodes-base.code`) — extrae y valida `imagen_original_url` del body, lanza error si falta:
   ```js
   const body = $input.first().json.body ?? {}
   const imagenOriginalUrl = body.imagen_original_url ?? null
   if (!imagenOriginalUrl) throw new Error('imagen_original_url es obligatorio')
   return [{ json: { imagen_original_url: imagenOriginalUrl } }]
   ```
3. **Código/HTTP Request para descargar la imagen como binario** — usa el patrón que indique `get_workflow_best_practices("document_processing")` para convertir una URL en datos binarios (probablemente un nodo `HTTP Request` apuntando a `={{ $json.imagen_original_url }}` con `Response Format: File`). Sigue la guía de "Binary Data Handling" ya señalada en `content_generation`: para subir/editar imágenes, usa datos binarios, no URLs, en el nodo de OpenAI.
4. **Nodo OpenAI, modo edición de imagen** — usa el `nodeId`/discriminadores exactos del Step 2/3, la credencial del Step 4, y como prompt una variable con nombre propio (un nodo `Set`/`Edit Fields` previo llamado o etiquetado `PHOTO_STYLE_STUDIO_V1`, o el propio campo de prompt del nodo con ese valor fijo) — el prompt en sí:
   ```
   Reemplaza el fondo de esta fotografía de una botella de vino por un fondo oscuro,
   liso, tipo estudio fotográfico profesional — homogéneo con el resto de una colección
   de fotos de botellas. No modifiques la botella, su etiqueta, ni su posición.
   ```
   El punto importante no es el texto exacto del prompt (se puede ajustar tras probar resultados reales), sino que **viva en un único lugar nombrado `PHOTO_STYLE_STUDIO_V1`**, no repetido/inline en varios sitios.
5. **Code — "Preparar Respuesta"** (`n8n-nodes-base.code`) — convierte la imagen binaria resultante de OpenAI a dataUrl base64:
   ```js
   const binary = $input.first().binary?.data
   if (!binary) throw new Error('OpenAI no devolvió una imagen')
   const mime = binary.mimeType || 'image/png'
   return [{ json: { imageDataUrl: `data:${mime};base64,${binary.data}` } }]
   ```
   (Ajusta el nombre de la propiedad binaria si el nodo de OpenAI la nombra distinto — confírmalo con la salida real de una ejecución de prueba en el Step 6.)
6. **Respond** (`n8n-nodes-base.respondToWebhook`) — `responseCode: 200`, cuerpo `{ imageDataUrl }`, mismo patrón de headers que `Wine Enrich` (`Content-Type: application/json`).

Usa `mcp__n8n__create_workflow_from_code` (o el tool equivalente que indique `get_sdk_reference`) para crearlo como **draft**.

- [ ] **Step 6: Publicar y probar**

```
mcp__n8n__publish_workflow
mcp__n8n__execute_workflow (modo manual) con { imagen_original_url: "<una URL real de wine-labels de una foto existente>" }
mcp__n8n__get_execution para inspeccionar el resultado
```

Expected: la ejecución termina en éxito y `imageDataUrl` contiene un dataUrl `data:image/...;base64,...` no vacío. Si el nodo de OpenAI devuelve un formato distinto al asumido en el Step 5 (URL en vez de binario, por ejemplo), ajusta el Code node de "Preparar Respuesta" según la salida real — no asumas el formato sin haberlo visto en una ejecución real.

- [ ] **Step 7: Anotar el webhook path para la Task 6**

Confirma que el path público coincide con `vinoteca/wine/improve-photo` (el mismo que usa `callImprovePhoto` en la Task 4) — si `N8N_BASE`/`VITE_N8N_BASE_URL` del cliente apunta al mismo host que el resto de webhooks de Vinoteca, no hace falta ningún cambio adicional en el cliente.

---

## Task 6: `WineDetail.tsx` — ajuste de `savePhoto` + "Foto de estudio"

**Files:**
- Modify: `src/pages/WineDetail.tsx`

### Parte A — Ajustar `savePhoto()` (foto real nueva = nueva línea base)

- [ ] **Step 1: Añadir el import de `callImprovePhoto` y `fetchImageAsDataUrl`**

`src/pages/WineDetail.tsx:14` tiene hoy:

```tsx
import { uploadWineImage } from '../lib/storage'
```

Cámbialo por:

```tsx
import { uploadWineImage, fetchImageAsDataUrl } from '../lib/storage'
```

Y añade, junto al resto de imports de `../lib/` (después de la línea del import de `captureSource`):

```tsx
import { callImprovePhoto } from '../lib/n8n'
```

- [ ] **Step 2: Reescribir `savePhoto()`**

`src/pages/WineDetail.tsx:233-246` tiene hoy:

```tsx
  async function savePhoto(dataUrl: string) {
    if (!wine || !user || uploadingPhoto) return
    setUploadingPhoto(true)
    try {
      const url = await uploadWineImage(dataUrl, user.id, wine.id, 'frontal')
      await updateWine(wine.id, { imagen_frontal_url: url })
      setWine(w => (w ? { ...w, imagen_frontal_url: url } : w))
      toast.show('Foto actualizada')
    } catch {
      toast.show('Error al subir la foto', 'error')
    } finally {
      setUploadingPhoto(false)
    }
  }
```

Reemplázalo por (sube a `original.jpg` en vez de `frontal.jpg`, resetea los 5 campos nuevos porque es una foto real nueva no procesada por IA, y recibe la fuente como segundo parámetro explícito — no se puede inferir de `showCamera`, porque cuando `savePhoto` se ejecuta desde `handleCameraCapture`, `showCamera` ya se puso en `false` en su primera línea, ver Step 3):

```tsx
  async function savePhoto(dataUrl: string, source: 'camera' | 'gallery') {
    if (!wine || !user || uploadingPhoto) return
    setUploadingPhoto(true)
    try {
      const url = await uploadWineImage(dataUrl, user.id, wine.id, 'original')
      const fields = {
        imagen_frontal_url:     url,
        imagen_original_url:    url,
        image_version:          'original',
        image_style:            null,
        image_source:           source,
        image_processing_state: 'original',
      }
      await updateWine(wine.id, fields)
      setWine(w => (w ? { ...w, ...fields } : w))
      toast.show('Foto actualizada')
    } catch {
      toast.show('Error al subir la foto', 'error')
    } finally {
      setUploadingPhoto(false)
    }
  }
```

- [ ] **Step 3: Actualizar las dos llamadas a `savePhoto`**

`src/pages/WineDetail.tsx:248-259` tiene hoy:

```tsx
  async function handleCameraCapture(dataUrl: string) {
    setShowCamera(false)
    const compressed = await compressImage(dataUrl)
    await savePhoto(compressed)
  }

  async function handleGalleryPick() {
    const raw = await pickFromGallery()
    if (!raw) return
    const compressed = await compressImage(raw)
    await savePhoto(compressed)
  }
```

Reemplázalo por:

```tsx
  async function handleCameraCapture(dataUrl: string) {
    setShowCamera(false)
    const compressed = await compressImage(dataUrl)
    await savePhoto(compressed, 'camera')
  }

  async function handleGalleryPick() {
    const raw = await pickFromGallery()
    if (!raw) return
    const compressed = await compressImage(raw)
    await savePhoto(compressed, 'gallery')
  }
```

### Parte B — "Foto de estudio"

- [ ] **Step 4: Añadir estado nuevo**

`src/pages/WineDetail.tsx:180-182` tiene hoy:

```tsx
  const [photoSourceOpen, setPhotoSourceOpen] = useState(false)
  const [showCamera,      setShowCamera]      = useState(false)
  const [uploadingPhoto,  setUploadingPhoto]  = useState(false)
```

Añade debajo (mismo bloque):

```tsx
  const [photoSourceOpen, setPhotoSourceOpen] = useState(false)
  const [showCamera,      setShowCamera]      = useState(false)
  const [uploadingPhoto,  setUploadingPhoto]  = useState(false)
  const [improvingPhoto,  setImprovingPhoto]  = useState(false)
  const [previewPhotoUrl, setPreviewPhotoUrl] = useState<string | null>(null)
```

`improvingPhoto` cubre tanto "generando con IA" como "guardando tras confirmar en la vista previa" — es el mismo tipo de overlay de carga que `uploadingPhoto`, pero con su propio mensaje. `previewPhotoUrl` es el dataUrl devuelto por la IA, pendiente de confirmación; `null` significa que no hay vista previa abierta.

- [ ] **Step 5: Añadir la función `handleImprovePhoto` y sus acompañantes**

Primero, añade un `useRef` junto a `menuRef` (línea 183) para poder restaurar `image_processing_state` si el usuario cancela la vista previa (no se puede leer de `wine.image_processing_state` en ese momento porque ya se sobrescribió a `'processing'` antes de mostrar la vista previa):

```tsx
  const menuRef = useRef<HTMLDivElement>(null)
  const prevProcessingStateRef = useRef<string>('original')
```

Justo después de `handleGalleryPick` (que termina en la línea 259 tras el Step 3 de arriba), añade estas tres funciones:

```tsx
  async function handleImprovePhoto() {
    if (!wine || !user || improvingPhoto) return
    setImprovingPhoto(true)
    prevProcessingStateRef.current = wine.image_processing_state
    try {
      let originalUrl = wine.imagen_original_url

      // Backfill: vinos de antes de esta funcionalidad (p. ej. creados por Scan.tsx)
      // no tienen imagen_original_url — hay que crearlo antes de procesar.
      if (!originalUrl) {
        if (!wine.imagen_frontal_url) throw new Error('El vino no tiene foto')
        const currentDataUrl = await fetchImageAsDataUrl(wine.imagen_frontal_url)
        originalUrl = await uploadWineImage(currentDataUrl, user.id, wine.id, 'original')
        await updateWine(wine.id, { imagen_original_url: originalUrl })
        setWine(w => (w ? { ...w, imagen_original_url: originalUrl } : w))
      }

      await updateWine(wine.id, { image_processing_state: 'processing' })
      setWine(w => (w ? { ...w, image_processing_state: 'processing' } : w))

      const { imageDataUrl } = await callImprovePhoto(originalUrl)
      setPreviewPhotoUrl(imageDataUrl)
    } catch {
      await updateWine(wine.id, { image_processing_state: 'failed' })
      setWine(w => (w ? { ...w, image_processing_state: 'failed' } : w))
      toast.show('No se pudo mejorar la fotografía', 'error')
    } finally {
      setImprovingPhoto(false)
    }
  }

  async function handleCancelPreview() {
    setPreviewPhotoUrl(null)
    if (!wine) return
    const restored = prevProcessingStateRef.current
    await updateWine(wine.id, { image_processing_state: restored })
    setWine(w => (w ? { ...w, image_processing_state: restored } : w))
  }

  async function handleConfirmPreview() {
    if (!wine || !user || !previewPhotoUrl || improvingPhoto) return
    setImprovingPhoto(true)
    try {
      const url = await uploadWineImage(previewPhotoUrl, user.id, wine.id, `studio-${Date.now()}`)
      const fields = {
        imagen_frontal_url:     url,
        image_version:          'studio_v1',
        image_style:            'PHOTO_STYLE_STUDIO_V1',
        image_source:           'ai_studio',
        image_processing_state: 'completed',
      }
      await updateWine(wine.id, fields)
      setWine(w => (w ? { ...w, ...fields } : w))
      setPreviewPhotoUrl(null)
      toast.show('Fotografía mejorada')
    } catch {
      toast.show('No se pudo guardar la fotografía', 'error')
    } finally {
      setImprovingPhoto(false)
    }
  }
```

- [ ] **Step 6: Añadir la entrada de menú "Foto de estudio"**

`src/pages/WineDetail.tsx` tiene hoy, dentro del menú desplegable, el botón "Cambiar foto"/"Añadir foto" seguido directamente de "Eliminar vino":

```tsx
                <button
                  style={{ width: '100%', textAlign: 'left', display: 'flex', alignItems: 'center', gap: 8, padding: '12px 16px', color: theme.colors.cream, fontSize: '0.85rem', background: 'none', border: 'none', cursor: 'pointer', minHeight: 48, borderTop: `1px solid ${theme.colors.border}` }}
                  onClick={() => { setMenuOpen(false); setPhotoSourceOpen(true) }}
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" />
                    <circle cx="12" cy="13" r="4" />
                  </svg>
                  {wine.imagen_frontal_url ? 'Cambiar foto' : 'Añadir foto'}
                </button>
                <button
                  style={{ width: '100%', textAlign: 'left', display: 'flex', alignItems: 'center', gap: 8, padding: '12px 16px', color: '#E05050', fontSize: '0.85rem', background: 'none', border: 'none', cursor: 'pointer', minHeight: 48, borderTop: `1px solid ${theme.colors.border}` }}
                  onClick={() => { setMenuOpen(false); setDeleteOpen(true) }}
                >
```

Inserta la nueva entrada entre ambas — visible solo si el vino ya tiene foto:

```tsx
                <button
                  style={{ width: '100%', textAlign: 'left', display: 'flex', alignItems: 'center', gap: 8, padding: '12px 16px', color: theme.colors.cream, fontSize: '0.85rem', background: 'none', border: 'none', cursor: 'pointer', minHeight: 48, borderTop: `1px solid ${theme.colors.border}` }}
                  onClick={() => { setMenuOpen(false); setPhotoSourceOpen(true) }}
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" />
                    <circle cx="12" cy="13" r="4" />
                  </svg>
                  {wine.imagen_frontal_url ? 'Cambiar foto' : 'Añadir foto'}
                </button>
                {wine.imagen_frontal_url && (
                  <button
                    style={{ width: '100%', textAlign: 'left', display: 'flex', alignItems: 'center', gap: 8, padding: '12px 16px', color: theme.colors.gold, fontSize: '0.85rem', background: 'none', border: 'none', cursor: 'pointer', minHeight: 48, borderTop: `1px solid ${theme.colors.border}` }}
                    onClick={() => { setMenuOpen(false); handleImprovePhoto() }}
                  >
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83" />
                    </svg>
                    Foto de estudio
                  </button>
                )}
                <button
                  style={{ width: '100%', textAlign: 'left', display: 'flex', alignItems: 'center', gap: 8, padding: '12px 16px', color: '#E05050', fontSize: '0.85rem', background: 'none', border: 'none', cursor: 'pointer', minHeight: 48, borderTop: `1px solid ${theme.colors.border}` }}
                  onClick={() => { setMenuOpen(false); setDeleteOpen(true) }}
                >
```

- [ ] **Step 7: Añadir el Modal de vista previa y el overlay de "Mejorando fotografía…"**

`src/pages/WineDetail.tsx` termina hoy así (desde el overlay de `uploadingPhoto` hasta el cierre):

```tsx
      {uploadingPhoto && (
        <div style={{
          position: 'fixed', inset: 0, zIndex: 60,
          background: 'rgba(13,6,8,0.6)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          <Spinner />
        </div>
      )}
    </Layout>
  )
}
```

Reemplázalo por (añade el Modal de vista previa y separa el overlay de subida del de mejora, con mensajes distintos):

```tsx
      {uploadingPhoto && (
        <div style={{
          position: 'fixed', inset: 0, zIndex: 60,
          background: 'rgba(13,6,8,0.6)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          <Spinner />
        </div>
      )}

      {improvingPhoto && !previewPhotoUrl && (
        <div style={{
          position: 'fixed', inset: 0, zIndex: 60,
          background: 'rgba(13,6,8,0.6)',
          display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 12,
        }}>
          <Spinner />
          <p style={{ color: theme.colors.cream, fontSize: '0.85rem', textAlign: 'center', padding: '0 24px' }}>
            Mejorando fotografía…<br />
            <span style={{ color: theme.colors.muted, fontSize: '0.75rem' }}>Esto puede tardar unos segundos.</span>
          </p>
        </div>
      )}

      <Modal
        open={previewPhotoUrl !== null}
        onClose={handleCancelPreview}
        title="Vista previa"
      >
        {previewPhotoUrl && (
          <>
            <img
              src={previewPhotoUrl}
              alt="Vista previa de la foto mejorada"
              style={{ width: '100%', borderRadius: 12, background: '#110809' }}
            />
            <div style={{ display: 'flex', gap: 12, marginTop: 12 }}>
              <Button variant="secondary" className="flex-1" onClick={handleCancelPreview} disabled={improvingPhoto}>
                Cancelar
              </Button>
              <Button className="flex-1" loading={improvingPhoto} onClick={handleConfirmPreview}>
                Usar esta fotografía
              </Button>
            </div>
          </>
        )}
      </Modal>
    </Layout>
  )
}
```

- [ ] **Step 8: Verificar tipos**

Run: `npx tsc -b`
Expected: sin errores. Si `Button`/`Modal` no aceptan alguna prop usada arriba (p. ej. `loading` en `Button`), revisa `src/components/ui/Button.tsx`/`Modal.tsx` para confirmar los nombres exactos de sus props antes de ajustar.

- [ ] **Step 9: Prueba manual**

Con `npm run dev` (y la migración de la Task 1 ya aplicada):

1. Vino con foto ya guardada, sin `imagen_original_url` (uno de los que ya tenías antes de esta sesión) → "⋯" → "Foto de estudio" → confirma que primero crea `original.jpg`/`imagen_original_url` en segundo plano y luego aparece "Mejorando fotografía…".
2. Cuando termine, confirma que aparece la vista previa con la imagen generada, sin que la ficha haya cambiado todavía.
3. "Usar esta fotografía" → confirma que la ficha y la tarjeta en Bodega muestran la nueva imagen, con el mismo estilo que el resto de tu colección.
4. Repite "Foto de estudio" una segunda vez sobre el mismo vino → confirma (revisando la tabla `wines` en Supabase o los logs de red) que la llamada a n8n usa la misma `imagen_original_url` de antes, no la versión de estudio recién generada.
5. En el paso de vista previa, pulsa "Cancelar" → confirma que la ficha no cambia y que una nueva pulsación de "Foto de estudio" no queda bloqueada.
6. "Cambiar foto" (tomar una foto real nueva) sobre un vino que ya tenía una versión de estudio aplicada → confirma que `image_version` vuelve a `'original'` y que una "Foto de estudio" posterior parte de la foto real recién tomada, no de la versión de estudio antigua.
7. Confirma que `Scan.tsx` (añadir un vino nuevo desde cero) sigue funcionando exactamente igual que antes.

- [ ] **Step 10: Commit**

```bash
git add src/pages/WineDetail.tsx
git commit -m "feat(wine-detail): \"Foto de estudio\" — mejora de fotografía con IA con vista previa"
```

---

## Task 7: Documentación

**Files:**
- Modify: `docs/roadmap.md`

- [ ] **Step 1: Añadir la fila a "Fuera de numeración"**

En `docs/roadmap.md`, la tabla de "Fuera de numeración" tiene hoy esta última fila:

```markdown
| 2026-08-03 | Reemplazar/añadir la foto de un vino ya guardado desde la ficha | [spec](superpowers/specs/2026-08-03-reemplazar-foto-vino-design.md), [plan](superpowers/plans/2026-08-03-reemplazar-foto-vino-plan.md) |
```

Añade debajo:

```markdown
| 2026-08-03 | "Foto de estudio" — mejora de fotografías de vino con IA (OpenAI vía n8n) | [spec](superpowers/specs/2026-08-03-foto-estudio-ia-design.md), [plan](superpowers/plans/2026-08-03-foto-estudio-ia-plan.md) |
```

- [ ] **Step 2: Commit**

```bash
git add docs/roadmap.md
git commit -m "docs: registrar \"Foto de estudio\" en el roadmap"
```
