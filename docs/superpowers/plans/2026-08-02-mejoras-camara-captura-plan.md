# Mejoras de calidad de imagen en la captura de cámara — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Añadir tres correcciones de imagen por software (aviso de foto borrosa, brillo manual, auto-mejora de contraste) al paso de previsualización de la cámara, sin tocar `src/pages/Scan.tsx`.

**Architecture:** Toda la lógica de análisis y manipulación de píxeles se extrae a un módulo puro nuevo, `src/lib/imageQuality.ts` (mismo patrón que `statsHelpers.ts`/`sommelierHelpers.ts`/`syncQueue.ts`), con tres funciones que reciben y devuelven dataUrls. `src/components/ui/CameraView.tsx` las orquesta desde su estado `PREVIEW` ya existente. El contrato hacia fuera (`onCapture(dataUrl: string)`) no cambia, así que `Scan.tsx` (congelado) no requiere ninguna modificación.

**Tech Stack:** TypeScript, React 19, Canvas 2D nativo. Sin librerías nuevas. Sin test runner en el repo — verificación vía `npx tsc -b` + prueba manual.

---

## Estructura de archivos

| Archivo | Responsabilidad |
|---|---|
| `src/lib/imageQuality.ts` (nuevo) | Funciones puras sobre dataUrls: medir nitidez, auto-mejorar contraste, aplicar rotación+brillo. Sin React, sin dependencias del componente. |
| `src/components/ui/CameraView.tsx` (modificar) | Estado de UI de los tres controles nuevos y su orquestación en el paso `PREVIEW`. |
| `docs/roadmap.md` (modificar) | Registrar el trabajo en la sección "Fuera de numeración". |

**No se toca:** `src/pages/Scan.tsx` (congelado), `src/lib/captureSource.ts`, `src/hooks/useCamera.ts`.

---

## Task 1: Módulo puro `src/lib/imageQuality.ts`

**Files:**
- Create: `src/lib/imageQuality.ts`

- [ ] **Step 1: Crear el archivo completo**

```ts
// Utilidades de calidad de imagen sobre dataUrls JPEG.
// Funciones puras: reciben un dataUrl y devuelven un número o un dataUrl nuevo.
// No dependen de React ni del DOM más allá de <canvas> y <img> en memoria.

/** Por debajo de esta varianza laplaciana la foto se considera potencialmente borrosa. */
export const SHARPNESS_THRESHOLD = 60

/** Ancho al que se reduce la imagen para medir nitidez (suficiente y barato de calcular). */
const SHARPNESS_SAMPLE_WIDTH = 200

/** Porcentaje de píxeles descartados en cada extremo del histograma al auto-mejorar. */
const HISTOGRAM_CLIP_RATIO = 0.01

/** Rango mínimo de luminosidad para que auto-mejorar tenga sentido. */
const MIN_HISTOGRAM_RANGE = 8

/** Calidad JPEG de salida — misma que usaba CameraView antes de este módulo. */
const JPEG_QUALITY = 0.85

function loadImage(dataUrl: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.onload  = () => resolve(img)
    img.onerror = () => reject(new Error('No se pudo cargar la imagen'))
    img.src = dataUrl
  })
}

/**
 * Estima la nitidez de la imagen como la varianza de un filtro laplaciano
 * sobre una versión reducida en escala de grises. Valores altos = más nitidez.
 * Devuelve 0 si la imagen no se puede analizar.
 */
export async function estimateSharpness(dataUrl: string): Promise<number> {
  try {
    const img = await loadImage(dataUrl)
    const scale = img.width > SHARPNESS_SAMPLE_WIDTH ? SHARPNESS_SAMPLE_WIDTH / img.width : 1
    const w = Math.max(3, Math.round(img.width  * scale))
    const h = Math.max(3, Math.round(img.height * scale))

    const canvas = document.createElement('canvas')
    canvas.width  = w
    canvas.height = h
    const ctx = canvas.getContext('2d', { willReadFrequently: true })
    if (!ctx) return 0
    ctx.drawImage(img, 0, 0, w, h)

    const { data } = ctx.getImageData(0, 0, w, h)
    const gray = new Float32Array(w * h)
    for (let i = 0, p = 0; i < data.length; i += 4, p++) {
      gray[p] = data[i] * 0.299 + data[i + 1] * 0.587 + data[i + 2] * 0.114
    }

    let sum = 0
    let sumSq = 0
    let n = 0
    for (let y = 1; y < h - 1; y++) {
      for (let x = 1; x < w - 1; x++) {
        const p = y * w + x
        const lap = gray[p - w] + gray[p + w] + gray[p - 1] + gray[p + 1] - 4 * gray[p]
        sum   += lap
        sumSq += lap * lap
        n++
      }
    }
    if (n === 0) return 0
    const mean = sum / n
    return sumSq / n - mean * mean
  } catch {
    return 0
  }
}

/**
 * Auto-estiramiento de histograma (auto-niveles): normaliza el rango de
 * luminosidad de la imagen a 0-255, descartando el 1% de píxeles extremos.
 * Útil para etiquetas fotografiadas con luz cálida o tenue.
 * Si la imagen ya está bien distribuida (o falla el análisis), devuelve el dataUrl original.
 */
export async function autoEnhance(dataUrl: string): Promise<string> {
  try {
    const img = await loadImage(dataUrl)
    const canvas = document.createElement('canvas')
    canvas.width  = img.width
    canvas.height = img.height
    const ctx = canvas.getContext('2d', { willReadFrequently: true })
    if (!ctx) return dataUrl
    ctx.drawImage(img, 0, 0)

    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height)
    const data = imageData.data

    const hist = new Uint32Array(256)
    for (let i = 0; i < data.length; i += 4) {
      const lum = (data[i] * 0.299 + data[i + 1] * 0.587 + data[i + 2] * 0.114) | 0
      hist[lum]++
    }

    const total = (data.length / 4) | 0
    const clip = Math.max(1, Math.floor(total * HISTOGRAM_CLIP_RATIO))

    let acc = 0
    let lo = 0
    for (let v = 0; v < 256; v++) {
      acc += hist[v]
      if (acc > clip) { lo = v; break }
    }
    acc = 0
    let hi = 255
    for (let v = 255; v >= 0; v--) {
      acc += hist[v]
      if (acc > clip) { hi = v; break }
    }

    if (hi - lo < MIN_HISTOGRAM_RANGE) return dataUrl

    const scale = 255 / (hi - lo)
    const lut = new Uint8ClampedArray(256)
    for (let v = 0; v < 256; v++) lut[v] = (v - lo) * scale

    for (let i = 0; i < data.length; i += 4) {
      data[i]     = lut[data[i]]
      data[i + 1] = lut[data[i + 1]]
      data[i + 2] = lut[data[i + 2]]
    }

    ctx.putImageData(imageData, 0, 0)
    return canvas.toDataURL('image/jpeg', JPEG_QUALITY)
  } catch {
    return dataUrl
  }
}

export interface ImageAdjustments {
  /** Grados de rotación: 0 o 180 (los únicos que produce CameraView). */
  rotation: number
  /** Ajuste de brillo, -50 a 50. 0 = sin cambio. */
  brightness: number
}

/**
 * Aplica rotación y brillo en una sola pasada de canvas.
 * El brillo se aplica por manipulación de píxeles (no ctx.filter) para que el
 * resultado sea idéntico en todos los navegadores.
 * Si falla, devuelve el dataUrl original en vez de romper el flujo de captura.
 */
export async function applyAdjustments(
  dataUrl: string,
  { rotation, brightness }: ImageAdjustments
): Promise<string> {
  if (rotation === 0 && brightness === 0) return dataUrl
  try {
    const img = await loadImage(dataUrl)
    const canvas = document.createElement('canvas')
    canvas.width  = img.width
    canvas.height = img.height
    const ctx = canvas.getContext('2d', { willReadFrequently: true })
    if (!ctx) return dataUrl

    if (rotation !== 0) {
      ctx.translate(canvas.width / 2, canvas.height / 2)
      ctx.rotate((rotation * Math.PI) / 180)
      ctx.drawImage(img, -img.width / 2, -img.height / 2)
      ctx.setTransform(1, 0, 0, 1, 0, 0)
    } else {
      ctx.drawImage(img, 0, 0)
    }

    if (brightness !== 0) {
      const delta = brightness * 2.55
      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height)
      const data = imageData.data
      const lut = new Uint8ClampedArray(256)
      for (let v = 0; v < 256; v++) lut[v] = v + delta
      for (let i = 0; i < data.length; i += 4) {
        data[i]     = lut[data[i]]
        data[i + 1] = lut[data[i + 1]]
        data[i + 2] = lut[data[i + 2]]
      }
      ctx.putImageData(imageData, 0, 0)
    }

    return canvas.toDataURL('image/jpeg', JPEG_QUALITY)
  } catch {
    return dataUrl
  }
}
```

- [ ] **Step 2: Verificar tipos**

Run: `npx tsc -b`
Expected: sin errores (ni salida)

IMPORTANTE: NO uses `npx tsc --noEmit` bajo ninguna circunstancia — en este repo es un no-op silencioso (el `tsconfig.json` raíz es "solution-style", con `"files": []`, solo `"references"`), sale con código 0 sin comprobar nada real. El único comando de verificación válido es `npx tsc -b`.

- [ ] **Step 3: Commit**

```bash
git add src/lib/imageQuality.ts
git commit -m "feat(camera): módulo puro de calidad de imagen (nitidez, auto-niveles, ajustes)"
```

---

## Task 2: Slider de brillo + rewire de `handleConfirm`

**Files:**
- Modify: `src/components/ui/CameraView.tsx`

Contexto: el componente ya tiene un estado `previewRotation` y un `handleConfirm` que hornea la rotación en un canvas inline. Esta task mueve ese horneado al helper `applyAdjustments` (creado en Task 1) y le añade el brillo. La barra inferior pasa de ser una única fila a una columna con una fila de ajustes encima de la fila de botones.

- [ ] **Step 1: Añadir el import del helper**

En el bloque de imports del tope de `src/components/ui/CameraView.tsx`, que hoy es:

```ts
import { useEffect, useRef, useReducer, useCallback, useState } from 'react'
import { theme } from '../../constants/theme'
import type { CaptureSource } from '../../lib/captureSource'
```

añadir una línea al final:

```ts
import { applyAdjustments } from '../../lib/imageQuality'
```

- [ ] **Step 2: Añadir el estado de brillo junto al de rotación**

Buscar la línea que declara el estado de rotación (justo encima de `handleConfirm`):

```ts
  const [previewRotation, setPreviewRotation] = useState(0)
```

y reemplazarla por:

```ts
  const [previewRotation, setPreviewRotation] = useState(0)
  const [brightness,      setBrightness]      = useState(0)
```

- [ ] **Step 3: Reescribir `handleConfirm` para usar el helper**

Reemplazar la función `handleConfirm` completa, que hoy es:

```ts
  const handleConfirm = useCallback(() => {
    if (state.status !== 'PREVIEW') return
    if (previewRotation === 0) {
      onCapture(state.dataUrl)
      return
    }
    const img = new Image()
    img.onload = () => {
      const canvas = document.createElement('canvas')
      canvas.width  = img.width
      canvas.height = img.height
      const ctx = canvas.getContext('2d')!
      ctx.translate(canvas.width / 2, canvas.height / 2)
      ctx.rotate((previewRotation * Math.PI) / 180)
      ctx.drawImage(img, -img.width / 2, -img.height / 2)
      onCapture(canvas.toDataURL('image/jpeg', 0.85))
    }
    img.src = state.dataUrl
  }, [state, onCapture, previewRotation])
```

por:

```ts
  const handleConfirm = useCallback(async () => {
    if (state.status !== 'PREVIEW') return
    // Camino rápido: sin ajustes, se entrega el dataUrl tal cual (comportamiento original)
    if (previewRotation === 0 && brightness === 0) {
      onCapture(state.dataUrl)
      return
    }
    const adjusted = await applyAdjustments(state.dataUrl, {
      rotation:   previewRotation,
      brightness,
    })
    onCapture(adjusted)
  }, [state, onCapture, previewRotation, brightness])
```

- [ ] **Step 4: Resetear el brillo al repetir la foto**

Reemplazar `handleRetake`, que hoy es:

```ts
  const handleRetake = useCallback(() => {
    setPreviewRotation(0)
    dispatch({ type: 'RETAKE' })
  }, [])
```

por:

```ts
  const handleRetake = useCallback(() => {
    setPreviewRotation(0)
    setBrightness(0)
    dispatch({ type: 'RETAKE' })
  }, [])
```

- [ ] **Step 5: Resetear el brillo también al capturar una foto nueva**

En `handleCapture`, reemplazar el bloque `try` completo, que hoy es:

```ts
    try {
      const _win = window as Window & { orientation?: number }
      const angle =
        typeof _win.orientation === 'number'
          ? _win.orientation
          : (window.screen?.orientation?.angle ?? 0)
      const dataUrl = await source.captureFrame(videoRef.current, angle)
      dispatch({ type: 'CAPTURE', dataUrl })
    } catch (err) {
```

por:

```ts
    try {
      const _win = window as Window & { orientation?: number }
      const angle =
        typeof _win.orientation === 'number'
          ? _win.orientation
          : (window.screen?.orientation?.angle ?? 0)
      const dataUrl = await source.captureFrame(videoRef.current, angle)
      setPreviewRotation(0)
      setBrightness(0)
      dispatch({ type: 'CAPTURE', dataUrl })
    } catch (err) {
```

- [ ] **Step 6: Previsualización en vivo del brillo sobre el `<img>`**

Reemplazar el bloque de previsualización, que hoy es:

```tsx
        {state.status === 'PREVIEW' && (
          <img
            src={state.dataUrl}
            alt="Foto capturada"
            className="absolute inset-0 w-full h-full object-cover"
            style={{ transform: `rotate(${previewRotation}deg)`, transition: 'transform 300ms ease' }}
          />
        )}
```

por:

```tsx
        {state.status === 'PREVIEW' && (
          <img
            src={state.dataUrl}
            alt="Foto capturada"
            className="absolute inset-0 w-full h-full object-cover"
            style={{
              transform:  `rotate(${previewRotation}deg)`,
              filter:     brightness !== 0 ? `brightness(${1 + brightness / 100})` : undefined,
              transition: 'transform 300ms ease, filter 120ms linear',
            }}
          />
        )}
```

- [ ] **Step 7: Reestructurar la barra inferior en columna y añadir el slider**

Reemplazar la apertura de la barra inferior, que hoy es:

```tsx
      {/* Barra inferior */}
      <div
        className="flex-shrink-0 flex items-center justify-center gap-8 py-6"
        style={{ background: 'rgba(13,6,8,0.9)', backdropFilter: 'blur(12px)' }}
      >
        {state.status === 'PREVIEW' ? (
```

por:

```tsx
      {/* Barra inferior */}
      <div
        className="flex-shrink-0 flex flex-col"
        style={{ background: 'rgba(13,6,8,0.9)', backdropFilter: 'blur(12px)' }}
      >
        {state.status === 'PREVIEW' && (
          <div className="flex items-center gap-3 px-6 pt-4">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={theme.colors.muted} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
              <circle cx="12" cy="12" r="4"/>
              <path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M6.34 17.66l-1.41 1.41M19.07 4.93l-1.41 1.41"/>
            </svg>
            <input
              type="range"
              min={-50}
              max={50}
              step={1}
              value={brightness}
              onChange={e => setBrightness(Number(e.target.value))}
              aria-label="Ajustar brillo"
              className="flex-1"
              style={{ accentColor: theme.colors.gold }}
            />
            <span
              style={{ fontSize: '0.65rem', color: theme.colors.muted, width: 32, textAlign: 'right', fontVariantNumeric: 'tabular-nums' }}
            >
              {brightness > 0 ? `+${brightness}` : brightness}
            </span>
          </div>
        )}

        <div className="flex items-center justify-center gap-8 py-6">
        {state.status === 'PREVIEW' ? (
```

- [ ] **Step 8: Cerrar el `<div>` nuevo de la fila de botones**

Al final de la barra inferior, reemplazar el cierre actual, que hoy es:

```tsx
        )}
      </div>
    </div>
  )
}
```

por:

```tsx
        )}
        </div>
      </div>
    </div>
  )
}
```

- [ ] **Step 9: Verificar tipos**

Run: `npx tsc -b`
Expected: sin errores. Si hay CUALQUIER error, detente e informa BLOCKED con el error exacto en vez de intentar arreglarlo por tu cuenta.

- [ ] **Step 10: Commit**

```bash
git add src/components/ui/CameraView.tsx
git commit -m "feat(camera): slider de brillo en previsualización y horneado vía imageQuality"
```

---

## Task 3: Botón "Auto-mejorar"

**Files:**
- Modify: `src/components/ui/CameraView.tsx`

Contexto: el auto-estiramiento de histograma se aplica *sobre la imagen en memoria* (reemplaza el `dataUrl` del estado `PREVIEW`), no en el momento de confirmar. Por eso hace falta una acción nueva en el reducer. Es de un solo uso: una vez aplicado, el botón queda deshabilitado; "Repetir" es la vía para descartarlo.

- [ ] **Step 1: Añadir la acción al reducer**

Reemplazar el tipo `CameraAction`, que hoy es:

```ts
type CameraAction =
  | { type: 'REQUEST' }
  | { type: 'STREAM_READY'; stream: MediaStream | null }
  | { type: 'CAPTURE';      dataUrl: string }
  | { type: 'RETAKE' }
  | { type: 'ERROR';        message: string }
```

por:

```ts
type CameraAction =
  | { type: 'REQUEST' }
  | { type: 'STREAM_READY'; stream: MediaStream | null }
  | { type: 'CAPTURE';      dataUrl: string }
  | { type: 'SET_PREVIEW_IMAGE'; dataUrl: string }
  | { type: 'RETAKE' }
  | { type: 'ERROR';        message: string }
```

Y en `cameraReducer`, reemplazar el bloque del case `CAPTURE`, que hoy es:

```ts
    case 'CAPTURE':
      if (state.status !== 'ACTIVE') return state
      return { status: 'PREVIEW', stream: state.stream, dataUrl: action.dataUrl }
```

por:

```ts
    case 'CAPTURE':
      if (state.status !== 'ACTIVE') return state
      return { status: 'PREVIEW', stream: state.stream, dataUrl: action.dataUrl }
    case 'SET_PREVIEW_IMAGE':
      if (state.status !== 'PREVIEW') return state
      return { ...state, dataUrl: action.dataUrl }
```

- [ ] **Step 2: Ampliar el import del helper**

Reemplazar la línea de import añadida en la Task 2:

```ts
import { applyAdjustments } from '../../lib/imageQuality'
```

por:

```ts
import { applyAdjustments, autoEnhance } from '../../lib/imageQuality'
```

- [ ] **Step 3: Añadir el estado del auto-mejorado**

Reemplazar el bloque de estado de la Task 2:

```ts
  const [previewRotation, setPreviewRotation] = useState(0)
  const [brightness,      setBrightness]      = useState(0)
```

por:

```ts
  const [previewRotation, setPreviewRotation] = useState(0)
  const [brightness,      setBrightness]      = useState(0)
  const [enhanced,        setEnhanced]        = useState(false)
  const [enhancing,       setEnhancing]       = useState(false)
```

- [ ] **Step 4: Añadir el handler**

Justo después de `handleRotate` (la función que hoy hace `setPreviewRotation(r => (r + 180) % 360)`), añadir:

```ts
  const handleEnhance = useCallback(async () => {
    if (state.status !== 'PREVIEW' || enhanced || enhancing) return
    setEnhancing(true)
    try {
      const improved = await autoEnhance(state.dataUrl)
      dispatch({ type: 'SET_PREVIEW_IMAGE', dataUrl: improved })
      setEnhanced(true)
    } finally {
      setEnhancing(false)
    }
  }, [state, enhanced, enhancing])
```

- [ ] **Step 5: Resetear el estado de auto-mejorado en retake y en captura nueva**

Reemplazar `handleRetake`, que tras la Task 2 es:

```ts
  const handleRetake = useCallback(() => {
    setPreviewRotation(0)
    setBrightness(0)
    dispatch({ type: 'RETAKE' })
  }, [])
```

por:

```ts
  const handleRetake = useCallback(() => {
    setPreviewRotation(0)
    setBrightness(0)
    setEnhanced(false)
    dispatch({ type: 'RETAKE' })
  }, [])
```

Y en `handleCapture`, reemplazar las dos líneas de reset añadidas en la Task 2:

```ts
      setPreviewRotation(0)
      setBrightness(0)
      dispatch({ type: 'CAPTURE', dataUrl })
```

por:

```ts
      setPreviewRotation(0)
      setBrightness(0)
      setEnhanced(false)
      dispatch({ type: 'CAPTURE', dataUrl })
```

- [ ] **Step 6: Añadir el botón a la fila de ajustes**

En la fila de ajustes creada en la Task 2, reemplazar el `<span>` del valor de brillo y el cierre del div, que hoy es:

```tsx
            <span
              style={{ fontSize: '0.65rem', color: theme.colors.muted, width: 32, textAlign: 'right', fontVariantNumeric: 'tabular-nums' }}
            >
              {brightness > 0 ? `+${brightness}` : brightness}
            </span>
          </div>
        )}
```

por:

```tsx
            <span
              style={{ fontSize: '0.65rem', color: theme.colors.muted, width: 32, textAlign: 'right', fontVariantNumeric: 'tabular-nums' }}
            >
              {brightness > 0 ? `+${brightness}` : brightness}
            </span>

            <button
              onClick={handleEnhance}
              disabled={enhanced || enhancing}
              className="flex items-center gap-1.5 rounded-full disabled:opacity-40"
              style={{
                flexShrink:  0,
                padding:     '6px 12px',
                fontSize:    '0.65rem',
                color:       enhanced ? theme.colors.gold : theme.colors.cream,
                background:  'rgba(255,255,255,0.06)',
                border:      `1px solid ${enhanced ? theme.colors.gold : theme.colors.border}`,
                WebkitTapHighlightColor: 'transparent',
              }}
            >
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 3l1.9 5.1L19 10l-5.1 1.9L12 17l-1.9-5.1L5 10l5.1-1.9z"/>
              </svg>
              {enhancing ? 'Mejorando…' : enhanced ? 'Mejorada' : 'Auto-mejorar'}
            </button>
          </div>
        )}
```

- [ ] **Step 7: Verificar tipos**

Run: `npx tsc -b`
Expected: sin errores. Si hay CUALQUIER error, detente e informa BLOCKED con el error exacto.

- [ ] **Step 8: Commit**

```bash
git add src/components/ui/CameraView.tsx
git commit -m "feat(camera): botón auto-mejorar con auto-niveles de histograma"
```

---

## Task 4: Aviso de foto borrosa

**Files:**
- Modify: `src/components/ui/CameraView.tsx`

Contexto: al entrar en `PREVIEW` se mide la nitidez en segundo plano y, si queda por debajo del umbral, se muestra un aviso **no bloqueante** — el usuario puede confirmar la foto igualmente.

- [ ] **Step 1: Ampliar el import del helper**

Reemplazar la línea de import de la Task 3:

```ts
import { applyAdjustments, autoEnhance } from '../../lib/imageQuality'
```

por:

```ts
import { applyAdjustments, autoEnhance, estimateSharpness, SHARPNESS_THRESHOLD } from '../../lib/imageQuality'
```

- [ ] **Step 2: Añadir el estado de nitidez**

Reemplazar el bloque de estado de la Task 3:

```ts
  const [previewRotation, setPreviewRotation] = useState(0)
  const [brightness,      setBrightness]      = useState(0)
  const [enhanced,        setEnhanced]        = useState(false)
  const [enhancing,       setEnhancing]       = useState(false)
```

por:

```ts
  const [previewRotation, setPreviewRotation] = useState(0)
  const [brightness,      setBrightness]      = useState(0)
  const [enhanced,        setEnhanced]        = useState(false)
  const [enhancing,       setEnhancing]       = useState(false)
  const [isBlurry,        setIsBlurry]        = useState(false)
```

- [ ] **Step 3: Medir la nitidez al entrar en PREVIEW**

Justo después del `useEffect` que conecta el stream al `<video>` (el que tiene `[state]` como dependencia y hace `videoRef.current.srcObject = state.stream`), añadir:

```ts
  // Analizar nitidez al entrar en previsualización (no bloquea el flujo)
  useEffect(() => {
    if (state.status !== 'PREVIEW') { setIsBlurry(false); return }
    let cancelled = false
    estimateSharpness(state.dataUrl).then(sharpness => {
      if (cancelled) return
      // Log temporal para calibrar SHARPNESS_THRESHOLD con fotos reales
      console.debug('[camera] nitidez estimada:', Math.round(sharpness))
      setIsBlurry(sharpness > 0 && sharpness < SHARPNESS_THRESHOLD)
    })
    return () => { cancelled = true }
  }, [state])
```

- [ ] **Step 4: Mostrar el aviso sobre la previsualización**

Justo después del bloque `{state.status === 'PREVIEW' && (<img ... />)}` (el de la previsualización, dentro del contenedor `relative flex-1 overflow-hidden`), añadir:

```tsx
        {state.status === 'PREVIEW' && isBlurry && (
          <div
            className="absolute flex items-center gap-2 rounded-full px-3 py-2"
            style={{
              top: 16, left: '50%', transform: 'translateX(-50%)',
              background: 'rgba(13,6,8,0.85)',
              border: `1px solid ${theme.colors.gold}`,
              backdropFilter: 'blur(8px)',
            }}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={theme.colors.gold} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 9v4M12 17h.01"/><path d="M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/>
            </svg>
            <span style={{ fontSize: '0.7rem', color: theme.colors.cream }}>
              Puede estar borrosa
            </span>
          </div>
        )}
```

- [ ] **Step 5: Verificar tipos**

Run: `npx tsc -b`
Expected: sin errores. Si hay CUALQUIER error, detente e informa BLOCKED con el error exacto.

- [ ] **Step 6: Commit**

```bash
git add src/components/ui/CameraView.tsx
git commit -m "feat(camera): aviso no bloqueante de foto potencialmente borrosa"
```

---

## Task 5: Verificación manual y registro en el roadmap

**Files:**
- Modify: `docs/roadmap.md`

- [ ] **Step 1: Verificación de código completa**

Run: `npx tsc -b --force`
Expected: sin errores.

- [ ] **Step 2: Prueba manual**

Arrancar `npm run dev` y comprobar en `/scan`:

1. Tomar una foto → aparece la fila de ajustes (slider de brillo + botón "Auto-mejorar") sobre los botones "Repetir / Usar foto / Girar".
2. Mover el slider → la previsualización cambia de brillo en vivo y el número a la derecha del slider se actualiza.
3. Pulsar "Auto-mejorar" → la imagen gana contraste, el botón pasa a "Mejorada" y queda deshabilitado.
4. Pulsar "Girar" → sigue funcionando como antes, combinado con el brillo.
5. Pulsar "Repetir" → vuelve a la cámara y, al capturar de nuevo, el slider está a 0 y "Auto-mejorar" vuelve a estar disponible.
6. Tomar una foto movida a propósito → aparece el aviso "Puede estar borrosa", pero "Usar foto" sigue funcionando.
7. Tomar una foto **sin tocar ningún control** y confirmar → el vino se escanea exactamente igual que antes de este cambio (sin regresión).
8. Abrir `/scan?manual=1` → el flujo manual sigue funcionando igual.

Anotar en la consola del navegador los valores de `[camera] nitidez estimada:` de fotos nítidas y borrosas reales. Si el umbral `SHARPNESS_THRESHOLD = 60` de `src/lib/imageQuality.ts` no discrimina bien con esas fotos reales, ajustarlo a un valor entre los observados y volver a probar.

- [ ] **Step 3: Registrar el trabajo en `docs/roadmap.md`**

En la sección "Fuera de numeración", reemplazar la tabla actual:

```md
| Fecha | Nombre | Documento |
|-------|--------|-----------|
| 2026-07-18 | Gestión de usuarios y cuentas (auth, perfil, ajustes, RLS) | [gestion-usuarios-cuentas.md](gestion-usuarios-cuentas.md), [auth-architecture.md](auth-architecture.md) |
```

por:

```md
| Fecha | Nombre | Documento |
|-------|--------|-----------|
| 2026-07-18 | Gestión de usuarios y cuentas (auth, perfil, ajustes, RLS) | [gestion-usuarios-cuentas.md](gestion-usuarios-cuentas.md), [auth-architecture.md](auth-architecture.md) |
| 2026-08-02 | Mejoras de calidad de imagen en la captura de cámara (brillo, auto-niveles, aviso de borrosa) | [spec](superpowers/specs/2026-08-02-mejoras-camara-captura-design.md), [plan](superpowers/plans/2026-08-02-mejoras-camara-captura-plan.md) |
```

- [ ] **Step 4: Commit**

```bash
git add docs/roadmap.md
git commit -m "docs: registrar mejoras de cámara en el roadmap"
```

---

## Self-Review (ya aplicado por el autor del plan)

**Cobertura del spec:**
- Detector de foto borrosa (varianza laplaciana sobre versión reducida en grises, aviso no bloqueante) → Task 1 (`estimateSharpness`) + Task 4 (UI).
- Ajuste manual de brillo (slider, preview en vivo por CSS, horneado al confirmar) → Task 1 (`applyAdjustments`) + Task 2 (UI y rewire).
- Corrección automática (auto-estiramiento de histograma, aplicar una vez) → Task 1 (`autoEnhance`) + Task 3 (UI).
- Composición final en una sola pasada de canvas, preservando el camino rápido → Task 2, Step 3.
- No tocar `Scan.tsx` → ninguna task lo modifica; el contrato `onCapture(dataUrl: string)` se mantiene idéntico.
- Sin librerías nuevas → solo Canvas 2D nativo.
- Verificación incluyendo `?manual=1` → Task 5, Step 2, punto 8.

**Placeholder scan:** ninguno — cada step tiene el código completo o el comando exacto. El umbral de nitidez tiene un valor concreto (60) y una instrucción concreta de calibración con datos observables.

**Consistencia de tipos:** `applyAdjustments(dataUrl, { rotation, brightness })` (Task 1) se llama con esa forma exacta en Task 2 Step 3. `autoEnhance(dataUrl): Promise<string>` (Task 1) se usa en Task 3 Step 4. `estimateSharpness(dataUrl): Promise<number>` y `SHARPNESS_THRESHOLD` (Task 1) se usan en Task 4 Step 3. La acción `SET_PREVIEW_IMAGE` se declara en el tipo `CameraAction` y se maneja en el reducer en la misma task (Task 3, Step 1) antes de despacharse (Step 4).

**Nota sobre el orden de tasks:** las tasks 2, 3 y 4 modifican el mismo archivo de forma incremental y algunos steps reemplazan código introducido por la task anterior — deben ejecutarse en orden.
