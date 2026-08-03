# Reemplazar la foto de un vino ya guardado — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Añadir una entrada al menú "⋯" de la ficha del vino que permite reemplazar (o añadir por primera vez) solo la foto frontal, sin tocar el resto de los datos del vino.

**Architecture:** Todo el trabajo vive en `src/pages/WineDetail.tsx`, reutilizando piezas ya existentes sin modificarlas: `CameraView.tsx` para la captura en vivo, `useCamera().pickFromGallery()` para el origen galería (que en `Scan.tsx` vive fuera de `CameraView`, no dentro — confirmado leyendo `CameraView.tsx`, que no tiene ningún botón de galería propio), `uploadWineImage()` (ya soporta `upsert: true`) y `updateWine()` (ya trae UI optimista y cola de sync offline). No se introduce ningún archivo nuevo ni se toca `src/pages/Scan.tsx` (congelado).

**Tech Stack:** TypeScript, React 19. Sin librerías nuevas. Sin test runner en el repo — verificación vía `npx tsc -b` + prueba manual.

---

## Estructura de archivos

| Archivo | Cambio |
|---|---|
| `src/pages/WineDetail.tsx` (modificar) | Nueva entrada de menú, selector de origen (cámara/galería), captura, subida y guardado. |
| `docs/roadmap.md` (modificar) | Registrar el trabajo en la sección "Fuera de numeración". |

**No se toca:** `src/pages/Scan.tsx` (congelado), `src/components/ui/CameraView.tsx`, `src/lib/captureSource.ts`, `src/hooks/useCamera.ts`, `src/lib/storage.ts`, `src/hooks/useWines.ts`.

Es una sola tarea porque todo el cambio vive en un único archivo ya cargado en memoria por el propio proceso (`WineDetail.tsx`), con estado y JSX fuertemente acoplados — partirlo en más de un paso dejaría funciones sin usar a medio camino, lo que `tsc -b` rechaza (`noUnusedLocals: true` en `tsconfig.app.json`).

---

## Task 1: Reemplazar/añadir foto desde la ficha del vino

**Files:**
- Modify: `src/pages/WineDetail.tsx`

- [ ] **Step 1: Añadir los imports necesarios**

En `src/pages/WineDetail.tsx:1-13`, el bloque de imports es hoy:

```tsx
import { useState, useEffect, useRef } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import Layout from '../components/ui/Layout'
import Modal from '../components/ui/Modal'
import Button from '../components/ui/Button'
import Spinner from '../components/ui/Spinner'
import WineForm from '../components/wine/WineForm'
import ConsumoQuickForm from '../components/wine/ConsumoQuickForm'
import { useWines } from '../hooks/useWines'
import { useTastings } from '../hooks/useTastings'
import { useToastStore } from '../store/toastStore'
import { theme } from '../constants/theme'
import type { Tasting, Wine } from '../types'
```

Reemplázalo por:

```tsx
import { useState, useEffect, useRef, useMemo } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import Layout from '../components/ui/Layout'
import Modal from '../components/ui/Modal'
import Button from '../components/ui/Button'
import Spinner from '../components/ui/Spinner'
import CameraView from '../components/ui/CameraView'
import WineForm from '../components/wine/WineForm'
import ConsumoQuickForm from '../components/wine/ConsumoQuickForm'
import { useWines } from '../hooks/useWines'
import { useTastings } from '../hooks/useTastings'
import { useCamera } from '../hooks/useCamera'
import { getUserMediaSource } from '../lib/captureSource'
import { uploadWineImage } from '../lib/storage'
import { useToastStore } from '../store/toastStore'
import { useAuthStore } from '../store/authStore'
import { theme } from '../constants/theme'
import type { Tasting, Wine } from '../types'
```

- [ ] **Step 2: Añadir estado y hooks nuevos**

En `src/pages/WineDetail.tsx:157-173`, el componente empieza hoy así:

```tsx
export default function WineDetail() {
  const { id }   = useParams<{ id: string }>()
  const navigate = useNavigate()
  const toast    = useToastStore()

  const { getWine, updateWine, deleteWine } = useWines()
  const { tastings, loading: tastingsLoading } = useTastings(id)

  const [wine,        setWine]        = useState<Wine | null>(null)
  const [loadingWine, setLoadingWine] = useState(true)
  const [menuOpen,    setMenuOpen]    = useState(false)
  const [editOpen,    setEditOpen]    = useState(false)
  const [deleteOpen,  setDeleteOpen]  = useState(false)
  const [consumoOpen, setConsumoOpen] = useState(false)
  const [saving,      setSaving]      = useState(false)
  const [deleting,    setDeleting]    = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)
```

Reemplázalo por (añade `useAuthStore`, `useCamera`, y cinco estados nuevos: `photoSourceOpen`, `showCamera`, `uploadingPhoto`):

```tsx
export default function WineDetail() {
  const { id }   = useParams<{ id: string }>()
  const navigate = useNavigate()
  const toast    = useToastStore()

  const { getWine, updateWine, deleteWine } = useWines()
  const { tastings, loading: tastingsLoading } = useTastings(id)
  const { user } = useAuthStore()
  const { pickFromGallery, compressImage } = useCamera()

  const [wine,           setWine]           = useState<Wine | null>(null)
  const [loadingWine,    setLoadingWine]    = useState(true)
  const [menuOpen,       setMenuOpen]       = useState(false)
  const [editOpen,       setEditOpen]       = useState(false)
  const [deleteOpen,     setDeleteOpen]     = useState(false)
  const [consumoOpen,    setConsumoOpen]    = useState(false)
  const [saving,         setSaving]         = useState(false)
  const [deleting,       setDeleting]       = useState(false)
  const [photoSourceOpen, setPhotoSourceOpen] = useState(false)
  const [showCamera,      setShowCamera]      = useState(false)
  const [uploadingPhoto,  setUploadingPhoto]  = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)

  const cameraSource = useMemo(() => getUserMediaSource(), [showCamera])
```

- [ ] **Step 3: Añadir las funciones de captura y guardado**

En `src/pages/WineDetail.tsx`, justo después de `handleDelete` (hoy termina en la línea 219 con `}`, seguido de la línea en blanco y el comentario `// Últimas 3 catas...`), añade estas tres funciones nuevas entre `handleDelete` y ese comentario:

```tsx
  async function savePhoto(dataUrl: string) {
    if (!wine || !user) return
    setUploadingPhoto(true)
    try {
      const url = await uploadWineImage(dataUrl, user.id, wine.id, 'frontal')
      const updated = await updateWine(wine.id, { imagen_frontal_url: url })
      setWine(updated)
      toast.show('Foto actualizada')
    } catch {
      toast.show('Error al subir la foto', 'error')
    } finally {
      setUploadingPhoto(false)
    }
  }

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

Confirma que el archivo queda así en esa zona (orden: `handleUpdate`, `handleDelete`, `savePhoto`, `handleCameraCapture`, `handleGalleryPick`, comentario `// Últimas 3 catas...`).

- [ ] **Step 4: Añadir la entrada al menú "⋯"**

En `src/pages/WineDetail.tsx`, dentro del menú desplegable, hoy el bloque `{wine.url_bodega && (...)}` va seguido directamente del botón "Eliminar vino":

```tsx
                {wine.url_bodega && (
                  <a
                    href={wine.url_bodega.startsWith('http') ? wine.url_bodega : `https://${wine.url_bodega}`}
                    target="_blank" rel="noopener noreferrer"
                    style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '12px 16px', color: theme.colors.cream, fontSize: '0.85rem', textDecoration: 'none', minHeight: 48 }}
                    onClick={() => setMenuOpen(false)}
                  >
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <circle cx="12" cy="12" r="10" /><line x1="2" y1="12" x2="22" y2="12" />
                      <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
                    </svg>
                    Web oficial
                  </a>
                )}
                <button
                  style={{ width: '100%', textAlign: 'left', display: 'flex', alignItems: 'center', gap: 8, padding: '12px 16px', color: '#E05050', fontSize: '0.85rem', background: 'none', border: 'none', cursor: 'pointer', minHeight: 48, borderTop: `1px solid ${theme.colors.border}` }}
                  onClick={() => { setMenuOpen(false); setDeleteOpen(true) }}
                >
```

Inserta un nuevo botón entre ambos, para que quede así (nota el nuevo bloque entre el cierre de `{wine.url_bodega && (...)}` y el botón "Eliminar vino", que no cambia):

```tsx
                {wine.url_bodega && (
                  <a
                    href={wine.url_bodega.startsWith('http') ? wine.url_bodega : `https://${wine.url_bodega}`}
                    target="_blank" rel="noopener noreferrer"
                    style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '12px 16px', color: theme.colors.cream, fontSize: '0.85rem', textDecoration: 'none', minHeight: 48 }}
                    onClick={() => setMenuOpen(false)}
                  >
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <circle cx="12" cy="12" r="10" /><line x1="2" y1="12" x2="22" y2="12" />
                      <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
                    </svg>
                    Web oficial
                  </a>
                )}
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

El resto de ese botón ("Eliminar vino", su SVG y su cierre) no cambia.

- [ ] **Step 5: Añadir el selector de origen, la cámara y el indicador de subida**

En `src/pages/WineDetail.tsx`, el archivo termina hoy así (desde el modal de eliminar hasta el cierre):

```tsx
      <Modal open={deleteOpen} onClose={() => setDeleteOpen(false)} title="Eliminar vino">
        <p style={{ fontSize: '0.875rem', color: theme.colors.muted }}>
          ¿Eliminar <span style={{ color: theme.colors.cream }}>{wine.nombre}</span> de tu bodega? Esta acción no se puede deshacer.
        </p>
        <div style={{ display: 'flex', gap: 12, marginTop: 8 }}>
          <Button variant="secondary" className="flex-1" onClick={() => setDeleteOpen(false)} disabled={deleting}>
            Cancelar
          </Button>
          <Button className="flex-1" style={{ background: '#D32F2F', color: theme.colors.cream }} loading={deleting} onClick={handleDelete}>
            Eliminar
          </Button>
        </div>
      </Modal>
    </Layout>
  )
}
```

Reemplázalo por (añade el modal selector de origen, el overlay de `CameraView`, y el indicador de subida, todos antes del `</Layout>`):

```tsx
      <Modal open={deleteOpen} onClose={() => setDeleteOpen(false)} title="Eliminar vino">
        <p style={{ fontSize: '0.875rem', color: theme.colors.muted }}>
          ¿Eliminar <span style={{ color: theme.colors.cream }}>{wine.nombre}</span> de tu bodega? Esta acción no se puede deshacer.
        </p>
        <div style={{ display: 'flex', gap: 12, marginTop: 8 }}>
          <Button variant="secondary" className="flex-1" onClick={() => setDeleteOpen(false)} disabled={deleting}>
            Cancelar
          </Button>
          <Button className="flex-1" style={{ background: '#D32F2F', color: theme.colors.cream }} loading={deleting} onClick={handleDelete}>
            Eliminar
          </Button>
        </div>
      </Modal>

      <Modal
        open={photoSourceOpen}
        onClose={() => setPhotoSourceOpen(false)}
        title={wine.imagen_frontal_url ? 'Cambiar foto' : 'Añadir foto'}
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          <Button variant="secondary" onClick={() => { setPhotoSourceOpen(false); setShowCamera(true) }}>
            Hacer foto
          </Button>
          <Button variant="secondary" onClick={() => { setPhotoSourceOpen(false); handleGalleryPick() }}>
            Desde galería
          </Button>
        </div>
      </Modal>

      {showCamera && (
        <CameraView
          source={cameraSource}
          hint="Centra la etiqueta frontal"
          onCapture={handleCameraCapture}
          onCancel={() => setShowCamera(false)}
          onError={() => { setShowCamera(false); toast.show('No se pudo acceder a la cámara', 'error') }}
        />
      )}

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

- [ ] **Step 6: Verificar tipos**

Run: `npx tsc -b`
Expected: sin salida (sin errores). Si aparece `'X' is declared but its value is never read`, revisa que las cinco funciones/estados nuevos (`photoSourceOpen`, `showCamera`, `uploadingPhoto`, `cameraSource`, `savePhoto`, `handleCameraCapture`, `handleGalleryPick`) estén todos referenciados en el JSX de los Steps 4 y 5.

- [ ] **Step 7: Prueba manual**

Con `npm run dev`:

1. Abre un vino que ya tenga foto → menú "⋯" → confirma que la entrada dice **"Cambiar foto"**.
2. Toca "Cambiar foto" → aparece el selector con "Hacer foto" / "Desde galería".
3. "Hacer foto" → se abre la cámara en vivo (con slider de brillo, auto-mejora y detector de borrosidad, ya existentes en `CameraView`) → toma la foto → "Usar foto" → confirma que aparece el spinner de subida brevemente y luego el toast "Foto actualizada", que la ficha (hero) y la tarjeta en Bodega muestran la foto nueva con el mismo fondo/estilo que el resto, y que nombre/bodega/añada/catas no cambiaron.
4. Repite el flujo eligiendo "Desde galería" en vez de la cámara.
5. Abre un vino sin foto → confirma que la entrada del menú dice **"Añadir foto"** y que el flujo completo funciona igual, pasando de `imagen_frontal_url: null` a la nueva URL.
6. Abre el selector y toca fuera del modal (o el cierre) sin elegir nada → confirma que no se sube ni se guarda nada y la foto anterior sigue igual.
7. Abre la cámara y pulsa cancelar (✕) → confirma que no se sube ni se guarda nada.
8. Confirma que `Scan.tsx` (añadir un vino nuevo desde cero) sigue funcionando exactamente igual que antes.

- [ ] **Step 8: Commit**

```bash
git add src/pages/WineDetail.tsx
git commit -m "feat(wine-detail): permitir reemplazar/añadir la foto de un vino guardado"
```

---

## Task 2: Registrar el trabajo en el roadmap

**Files:**
- Modify: `docs/roadmap.md`

- [ ] **Step 1: Añadir la fila a "Fuera de numeración"**

En `docs/roadmap.md`, la tabla de "Fuera de numeración" tiene hoy esta última fila:

```markdown
| 2026-08-02 | Mejoras de calidad de imagen en la captura de cámara (brillo, auto-niveles, aviso de borrosa) | [spec](superpowers/specs/2026-08-02-mejoras-camara-captura-design.md), [plan](superpowers/plans/2026-08-02-mejoras-camara-captura-plan.md) |
```

Añade debajo una fila nueva:

```markdown
| 2026-08-03 | Reemplazar/añadir la foto de un vino ya guardado desde la ficha | [spec](superpowers/specs/2026-08-03-reemplazar-foto-vino-design.md), [plan](superpowers/plans/2026-08-03-reemplazar-foto-vino-plan.md) |
```

- [ ] **Step 2: Commit**

```bash
git add docs/roadmap.md
git commit -m "docs: registrar reemplazar/añadir foto de vino en el roadmap"
```
