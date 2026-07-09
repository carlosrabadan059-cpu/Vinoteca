# Fase 7 — Gestión de Bodega: Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Reescribir `src/pages/Bodega.tsx` con vista dual grid/lista, búsqueda con autocomplete, filtros avanzados, agrupación, estadísticas de colección y FAB inteligente, alineado al prototipo v4 congelado.

**Architecture:** `Bodega.tsx` gestiona todo el estado local; dos componentes de card extraídos (`WineCardGrid`, `WineCardList`); la lógica de datos se extiende en `useWines.ts` con nuevos filtros en la query de Supabase. Sin Zustand nuevo — solo `useWineStore` para `total`. Todos los estilos consumen tokens de `src/constants/theme.ts` — sin hex hardcodeados.

**Tech Stack:** React 19, TypeScript, Vite, inline styles con tokens de `theme`, Supabase PostgREST, React Router v7.

---

## Prerequisito: Design System congelado ✅

`src/constants/theme.ts` fue ampliado como paso previo a este plan. Contiene todos los tokens necesarios. Los componentes de Fase 7 importan `theme` desde ahí — **nunca hex literales**.

Los tokens clave para esta fase:

```typescript
import theme, { injectKeyframes } from '../constants/theme'

// Colores usados en Bodega
theme.colors.bg           // '#0D0608'
theme.colors.surface      // '#1A0F11'
theme.colors.surface2     // '#211419'
theme.colors.border       // '#2E1E22'
theme.colors.borderActive // '#3A2428'
theme.colors.primary      // '#722F37'
theme.colors.primaryBorder// '#8B3A44'
theme.colors.gold         // '#C9A84C'
theme.colors.goldSubtle   // 'rgba(201,168,76,0.15)'
theme.colors.goldBorder   // 'rgba(201,168,76,0.7)'
theme.colors.cream        // '#F5F0E8'
theme.colors.text         // '#E8E0D8'
theme.colors.muted        // '#7A6266'
theme.colors.muted2       // '#4A3438'
theme.colors.muted3       // '#5A4448'
theme.colors.warning      // '#E8A045'
theme.colors.warningBorder// 'rgba(232,160,69,0.4)'

// Dimensiones
theme.sizes.cardGridImageHeight // 158
theme.sizes.cardListThumbWidth  // 52
theme.sizes.cardListThumbHeight // 68
theme.sizes.fabSize             // 52
theme.sizes.fabBottomOffset     // 76

// Gradientes
theme.gradients.cardImageOverlay
theme.gradients.shimmer
theme.gradients.bgGlow

// Filtros de imagen
theme.imageFilters.wineLabel // 'brightness(1.08) contrast(1.05)'

// Animaciones
theme.animation.durationFast    // '0.15s'
theme.animation.durationSlow    // '0.35s'
theme.animation.durationSkeleton// '2.2s'
theme.animation.easingSpring    // 'cubic-bezier(0.34,1.56,0.64,1)'
theme.animation.fabScrollDelay  // 600
theme.animation.cardStagger     // 40

// Shadows
theme.shadows.fab   // '0 4px 20px rgba(114,47,55,0.5)'

// Radios
theme.radius.xs  // 4
theme.radius.sm  // 6
theme.radius.md  // 8
theme.radius.xl  // 14
theme.radius.pill// 9999
```

---

## Tipos compartidos

Definidos en `useWines.ts` (Task 3) y reutilizados en `Bodega.tsx`:

```typescript
export type SortKey =
  | 'created_at_desc'
  | 'nombre_asc'
  | 'bodega_asc'
  | 'anada_asc'
  | 'anada_desc'
  | 'precio_desc'
  | 'num_botellas_desc'

// Local a Bodega.tsx:
type GroupKey = 'bodega' | 'region' | 'denominacion' | 'anada' | 'tipo' | 'ubicacion'

interface Suggestion {
  emoji: string
  typeLabel: 'VINO' | 'BODEGA' | 'REGIÓN' | 'D.O.'
  label: string
  field: 'nombre' | 'bodega' | 'region' | 'denominacion'
  value: string
}
```

---

## Archivos a crear o modificar

| Archivo | Acción | Responsabilidad |
|---|---|---|
| `src/constants/theme.ts` | ✅ Hecho | Design system completo |
| `src/components/wine/WineCardGrid.tsx` | Crear | Card en vista cuadrícula |
| `src/components/wine/WineCardList.tsx` | Crear | Card en vista lista |
| `src/hooks/useWines.ts` | Modificar | Extender `WineFilters` + `listWines` con filtros Supabase |
| `src/pages/Bodega.tsx` | Reescribir | Pantalla principal con todo el estado y UI |

---

## Task 1: Crear `WineCardGrid`

**Archivos:**
- Crear: `src/components/wine/WineCardGrid.tsx`

- [ ] **Paso 1: Crear el componente**

```tsx
// src/components/wine/WineCardGrid.tsx
import theme from '../../constants/theme'
import type { Wine } from '../../types'

interface Props {
  wine: Wine
  index: number
  onClick: () => void
}

export default function WineCardGrid({ wine, index, onClick }: Props) {
  const t = theme
  const stockNum = wine.num_botellas ?? 0
  const stockState = stockNum === 0 ? 'out' : stockNum <= 2 ? 'low' : 'ok'

  return (
    <div
      onClick={onClick}
      role="button"
      tabIndex={0}
      onKeyDown={e => e.key === 'Enter' && onClick()}
      style={{
        background: t.colors.surface,
        border: `1px solid ${t.colors.border}`,
        borderRadius: t.radius.xl,
        overflow: 'hidden',
        cursor: 'pointer',
        animation: `cardIn ${t.animation.durationSlow} ease both`,
        animationDelay: `${index * t.animation.cardStagger}ms`,
      }}
    >
      {/* Zona imagen */}
      <div style={{ position: 'relative', height: t.sizes.cardGridImageHeight, background: '#110809', overflow: 'hidden' }}>
        {wine.imagen_frontal_url ? (
          <img
            src={wine.imagen_frontal_url}
            alt={wine.nombre}
            style={{ width: '100%', height: '100%', objectFit: 'contain', filter: t.imageFilters.wineLabel }}
          />
        ) : (
          <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: t.colors.border }}>
            <svg width="38" height="38" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round">
              <path d="M8 22h8M12 11v11M5 3h14l-2 7a5 5 0 0 1-10 0L5 3z"/>
            </svg>
          </div>
        )}
        <div style={{ position: 'absolute', inset: 0, background: t.gradients.cardImageOverlay }} />

        {/* Badge tipo */}
        {wine.tipo && (
          <div style={{
            position: 'absolute', top: 8, left: 8,
            ...t.typography.badge,
            textTransform: 'uppercase', color: t.colors.gold,
            padding: '2px 6px', border: t.borders.gold,
            borderRadius: t.radius.xs, backdropFilter: 'blur(4px)',
            background: 'rgba(13,6,8,0.5)',
          }}>
            {wine.tipo}
          </div>
        )}

        {/* Badge favorito */}
        {wine.favorito && (
          <div style={{ position: 'absolute', top: 8, right: 8, color: t.colors.gold }}>
            <svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor" stroke="currentColor" strokeWidth="1.5">
              <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
            </svg>
          </div>
        )}

        {/* Badge stock */}
        <div style={{
          position: 'absolute', bottom: 7, right: 7,
          ...t.typography.badgeStock,
          background: 'rgba(13,6,8,0.75)',
          color: stockState === 'out' ? t.colors.muted : stockState === 'low' ? t.colors.warning : t.colors.cream,
          padding: '1px 6px', borderRadius: t.radius.pill,
          border: `1px solid ${stockState === 'low' ? t.colors.warningBorder : t.colors.border}`,
          backdropFilter: 'blur(4px)',
          textDecoration: stockState === 'out' ? 'line-through' : 'none',
        }}>
          ×{stockNum}
        </div>
      </div>

      {/* Cuerpo */}
      <div style={{ padding: '8px 10px 10px' }}>
        <div style={{
          ...t.typography.cardTitleGrid,
          color: t.colors.cream, marginBottom: 3,
          overflow: 'hidden', display: '-webkit-box',
          WebkitLineClamp: 2, WebkitBoxOrient: 'vertical',
        }}>
          {wine.nombre}
        </div>
        {wine.bodega && (
          <div style={{
            ...t.typography.cardSubtitle, color: t.colors.gold,
            overflow: 'hidden', whiteSpace: 'nowrap', textOverflow: 'ellipsis', marginBottom: 3,
          }}>
            {wine.bodega}
          </div>
        )}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 2 }}>
          <span style={{ ...t.typography.cardMetaGrid, color: t.colors.muted2, overflow: 'hidden', whiteSpace: 'nowrap', textOverflow: 'ellipsis' }}>
            {[wine.region, wine.denominacion].filter(Boolean).join(' · ')}
          </span>
          {wine.anada && (
            <span style={{ ...t.typography.cardAnadaSmall, color: t.colors.muted, flexShrink: 0 }}>
              {wine.anada}
            </span>
          )}
        </div>
      </div>
    </div>
  )
}
```

- [ ] **Paso 2: Verificar TypeScript**

```bash
cd /Users/carlosrabadan/Antigravity/Vinoteca && npx tsc --noEmit 2>&1 | head -30
```

Esperado: sin output (0 errores).

- [ ] **Paso 3: Commit**

```bash
git add src/components/wine/WineCardGrid.tsx
git commit -m "feat(bodega): añadir WineCardGrid — consume tokens de theme"
```

---

## Task 2: Crear `WineCardList`

**Archivos:**
- Crear: `src/components/wine/WineCardList.tsx`

- [ ] **Paso 1: Crear el componente**

```tsx
// src/components/wine/WineCardList.tsx
import theme from '../../constants/theme'
import type { Wine } from '../../types'

interface Props {
  wine: Wine
  index: number
  onClick: () => void
}

export default function WineCardList({ wine, index, onClick }: Props) {
  const t = theme
  const stockNum = wine.num_botellas ?? 0
  const stockLow = stockNum <= 2 && stockNum > 0
  const stockOut = stockNum === 0

  return (
    <div
      onClick={onClick}
      role="button"
      tabIndex={0}
      onKeyDown={e => e.key === 'Enter' && onClick()}
      style={{
        background: t.colors.surface,
        border: `1px solid ${t.colors.border}`,
        borderRadius: t.radius.xl,
        display: 'flex', alignItems: 'center', gap: 12,
        padding: '10px 14px 10px 10px',
        cursor: 'pointer',
        animation: `cardIn ${t.animation.durationBase} ease both`,
        animationDelay: `${index * t.animation.cardStagger}ms`,
      }}
    >
      {/* Thumbnail */}
      <div style={{
        width: t.sizes.cardListThumbWidth,
        height: t.sizes.cardListThumbHeight,
        borderRadius: t.radius.sm,
        background: '#110809', overflow: 'hidden', flexShrink: 0,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        border: `1px solid ${t.colors.border}`,
      }}>
        {wine.imagen_frontal_url ? (
          <img
            src={wine.imagen_frontal_url}
            alt={wine.nombre}
            style={{ width: '100%', height: '100%', objectFit: 'contain', filter: t.imageFilters.wineLabel }}
          />
        ) : (
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={t.colors.border} strokeWidth="1" strokeLinecap="round" strokeLinejoin="round">
            <path d="M8 22h8M12 11v11M5 3h14l-2 7a5 5 0 0 1-10 0L5 3z"/>
          </svg>
        )}
      </div>

      {/* Info */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{
          ...t.typography.cardTitleList,
          color: t.colors.cream, marginBottom: 2,
          whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
        }}>
          {wine.nombre}
        </div>
        {wine.bodega && (
          <div style={{
            ...t.typography.cardSubtitle, color: t.colors.gold,
            whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
          }}>
            {wine.bodega}
          </div>
        )}
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 4 }}>
          {wine.tipo && (
            <span style={{
              ...t.typography.badgeStock,
              letterSpacing: '0.1em',
              textTransform: 'uppercase', color: t.colors.muted3,
              background: t.colors.surface2, padding: '1px 6px',
              borderRadius: t.radius.xs, border: `1px solid ${t.colors.border}`,
            }}>
              {wine.tipo}
            </span>
          )}
          {wine.region && (
            <span style={{
              ...t.typography.cardMetaList, color: t.colors.muted3,
              whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
            }}>
              {wine.region}
            </span>
          )}
        </div>
      </div>

      {/* Derecha */}
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 6, flexShrink: 0 }}>
        {wine.anada && (
          <span style={{
            ...t.typography.cardAnada, color: t.colors.muted, fontVariantNumeric: 'tabular-nums',
          }}>
            {wine.anada}
          </span>
        )}
        <span style={{
          ...t.typography.badgeStockList,
          color: stockOut ? t.colors.muted : stockLow ? t.colors.warning : t.colors.cream,
          background: t.colors.surface2,
          border: `1px solid ${stockLow ? t.colors.warningBorder : t.colors.border}`,
          borderRadius: t.radius.pill, padding: '2px 8px',
          fontVariantNumeric: 'tabular-nums',
          textDecoration: stockOut ? 'line-through' : 'none',
        }}>
          ×{stockNum}
        </span>
        {wine.favorito && (
          <span style={{ color: t.colors.gold }}>
            <svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor" stroke="currentColor" strokeWidth="1.5">
              <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
            </svg>
          </span>
        )}
      </div>
    </div>
  )
}
```

- [ ] **Paso 2: Verificar TypeScript**

```bash
cd /Users/carlosrabadan/Antigravity/Vinoteca && npx tsc --noEmit 2>&1 | head -30
```

Esperado: sin output.

- [ ] **Paso 3: Commit**

```bash
git add src/components/wine/WineCardList.tsx
git commit -m "feat(bodega): añadir WineCardList — consume tokens de theme"
```

---

## Task 3: Extender `useWines` con nuevos filtros

**Archivos:**
- Modificar: `src/hooks/useWines.ts`

- [ ] **Paso 1: Reemplazar la interfaz `WineFilters` existente (línea ~19)**

```typescript
// ANTES
export interface WineFilters {
  tipo?: string
  region?: string
  query?: string
  page?: number
}
```

```typescript
// DESPUÉS — pegar justo encima de la función useWines
export type SortKey =
  | 'created_at_desc'
  | 'nombre_asc'
  | 'bodega_asc'
  | 'anada_asc'
  | 'anada_desc'
  | 'precio_desc'
  | 'num_botellas_desc'

export interface WineFilters {
  query?:     string
  tipo?:      string
  favorito?:  boolean
  stock?:     boolean   // filtra num_botellas > 0 en Supabase
  anada_min?: number
  anada_max?: number
  page?:      number
  sort?:      SortKey
}
```

- [ ] **Paso 2: Reemplazar el cuerpo completo de la función `listWines`**

Localizar `async function listWines` y reemplazar su cuerpo completo:

```typescript
async function listWines(filters: WineFilters = {}): Promise<Wine[]> {
  if (!user) throw new Error('No autenticado')

  const {
    query, tipo, favorito, stock,
    anada_min, anada_max,
    page = 0, sort = 'created_at_desc',
  } = filters
  const from = page * PAGE_SIZE
  const to   = from + PAGE_SIZE - 1

  const sortMap: Record<SortKey, { column: string; ascending: boolean }> = {
    created_at_desc:   { column: 'created_at',  ascending: false },
    nombre_asc:        { column: 'nombre',       ascending: true  },
    bodega_asc:        { column: 'bodega',       ascending: true  },
    anada_asc:         { column: 'anada',        ascending: true  },
    anada_desc:        { column: 'anada',        ascending: false },
    precio_desc:       { column: 'precio',       ascending: false },
    num_botellas_desc: { column: 'num_botellas', ascending: false },
  }
  const { column, ascending } = sortMap[sort]

  let q = supabase
    .from('wines')
    .select('*', page === 0 ? { count: 'exact' } : undefined)
    .eq('user_id', user.id)
    .order(column, { ascending })
    .range(from, to)

  if (query?.trim()) {
    const safe = query.trim().replace(/[%_]/g, '\\$&')
    q = q.or(
      `nombre.ilike.%${safe}%,bodega.ilike.%${safe}%,region.ilike.%${safe}%,denominacion.ilike.%${safe}%`
    )
  }
  if (tipo)            q = q.eq('tipo', tipo)
  if (favorito === true) q = q.eq('favorito', true)
  if (stock === true)  q = q.gt('num_botellas', 0)
  if (anada_min !== undefined) q = q.gte('anada', anada_min)
  if (anada_max !== undefined) q = q.lte('anada', anada_max)

  const { data, count, error: dbError } = await q
  if (dbError) throw dbError

  if (page === 0 && count !== null) setTotal(count)
  return (data ?? []) as Wine[]
}
```

- [ ] **Paso 3: Verificar TypeScript**

```bash
cd /Users/carlosrabadan/Antigravity/Vinoteca && npx tsc --noEmit 2>&1
```

Esperado: sin output.

- [ ] **Paso 4: Commit**

```bash
git add src/hooks/useWines.ts
git commit -m "feat(bodega): extender WineFilters con tipo, favorito, stock, añada y sort"
```

---

## Task 4: Reescribir `Bodega.tsx` — imports, tipos, constantes y helpers

- [ ] **Paso 1: Reemplazar todo el contenido de `src/pages/Bodega.tsx` con el bloque de cabecera**

```tsx
import { useState, useEffect, useRef, useCallback, useMemo, type CSSProperties } from 'react'
import { useNavigate } from 'react-router-dom'
import Layout from '../components/ui/Layout'
import WineCardGrid from '../components/wine/WineCardGrid'
import WineCardList from '../components/wine/WineCardList'
import { useWines } from '../hooks/useWines'
import { useWineStore } from '../store/wineStore'
import theme, { injectKeyframes } from '../constants/theme'
import type { Wine } from '../types'
import type { SortKey } from '../hooks/useWines'

// ── Tipos locales ────────────────────────────────────────────────────────────
type GroupKey = 'bodega' | 'region' | 'denominacion' | 'anada' | 'tipo' | 'ubicacion'

interface Suggestion {
  emoji: string
  typeLabel: 'VINO' | 'BODEGA' | 'REGIÓN' | 'D.O.'
  label: string
  field: 'nombre' | 'bodega' | 'region' | 'denominacion'
  value: string
}

// ── Constantes ───────────────────────────────────────────────────────────────
const t = theme   // alias corto, solo dentro de este módulo
const TIPOS = ['Tinto', 'Blanco', 'Rosado', 'Espumoso', 'Dulce'] as const
const PAGE_SIZE = 20
const CURRENT_YEAR = new Date().getFullYear()

const SORT_OPTIONS: { key: SortKey; label: string }[] = [
  { key: 'created_at_desc',   label: 'Añadidos recientemente' },
  { key: 'nombre_asc',        label: 'Nombre A–Z' },
  { key: 'bodega_asc',        label: 'Bodega A–Z' },
  { key: 'anada_asc',         label: 'Añada ↑ (más antiguo)' },
  { key: 'anada_desc',        label: 'Añada ↓ (más reciente)' },
  { key: 'precio_desc',       label: 'Precio ↓' },
  { key: 'num_botellas_desc', label: 'Stock ↓' },
]

const GROUP_OPTIONS: { key: GroupKey; label: string }[] = [
  { key: 'bodega',       label: 'Bodega' },
  { key: 'region',       label: 'D.O. + Región' },
  { key: 'denominacion', label: 'Denominación' },
  { key: 'anada',        label: 'Añada' },
  { key: 'tipo',         label: 'Tipo' },
  { key: 'ubicacion',    label: 'Ubicación' },
]

// ── Helpers ──────────────────────────────────────────────────────────────────
function unique<T>(arr: T[]): T[] {
  return Array.from(new Set(arr))
}

function getSuggestions(query: string, wines: Wine[]): Suggestion[] {
  const q = query.toLowerCase().trim()
  if (!q) return []
  const results: Suggestion[] = []

  unique(wines.map(w => w.nombre))
    .filter(n => n.toLowerCase().includes(q)).slice(0, 2)
    .forEach(n => results.push({ emoji: '🍷', typeLabel: 'VINO',   label: n, field: 'nombre',       value: n }))
  unique(wines.map(w => w.bodega).filter(Boolean) as string[])
    .filter(b => b.toLowerCase().includes(q)).slice(0, 1)
    .forEach(b => results.push({ emoji: '🏛️', typeLabel: 'BODEGA', label: b, field: 'bodega',       value: b }))
  unique(wines.map(w => w.region).filter(Boolean) as string[])
    .filter(r => r.toLowerCase().includes(q)).slice(0, 1)
    .forEach(r => results.push({ emoji: '📍', typeLabel: 'REGIÓN', label: r, field: 'region',       value: r }))
  unique(wines.map(w => w.denominacion).filter(Boolean) as string[])
    .filter(d => d.toLowerCase().includes(q)).slice(0, 1)
    .forEach(d => results.push({ emoji: '🏷️', typeLabel: 'D.O.',   label: d, field: 'denominacion', value: d }))

  return results.slice(0, 4)
}

function groupWines(wines: Wine[], key: GroupKey): { label: string; wines: Wine[] }[] {
  const map = new Map<string, Wine[]>()
  for (const w of wines) {
    const raw = w[key]
    const label = raw !== null && raw !== undefined ? String(raw) : '(sin valor)'
    if (!map.has(label)) map.set(label, [])
    map.get(label)!.push(w)
  }
  return Array.from(map.entries()).map(([label, wines]) => ({ label, wines }))
}

// ── Componentes auxiliares ────────────────────────────────────────────────────
function FilterSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div style={{ marginBottom: 32 }}>
      <div style={{ marginBottom: 10, paddingBottom: 8, borderBottom: `1px solid ${t.colors.border}` }}>
        <span style={{
          ...t.typography.sectionTitle,
          textTransform: 'uppercase', color: t.colors.cream,
        }}>
          {title}
        </span>
      </div>
      {children}
    </div>
  )
}

function FilterChip({ label, active, onClick }: { label: string; active: boolean; onClick: () => void }) {
  return (
    <button onClick={onClick} style={{
      padding: '5px 13px', borderRadius: t.radius.pill, fontFamily: t.typography.chipLabel.fontFamily,
      border: `1px solid ${active ? t.colors.primaryBorder : t.colors.border}`,
      background: active ? t.colors.primary : 'transparent',
      color: active ? t.colors.cream : t.colors.muted,
      fontSize: t.typography.chipLabel.fontSize, fontWeight: active ? 600 : 400, cursor: 'pointer',
    }}>
      {label}
    </button>
  )
}
```

- [ ] **Paso 2: Verificar compilación parcial**

```bash
cd /Users/carlosrabadan/Antigravity/Vinoteca && npx tsc --noEmit 2>&1 | head -20
```

Esperado: errores por componente incompleto — normal en este paso.

---

## Task 5: Reescribir `Bodega.tsx` — estado y lógica

- [ ] **Paso 1: Añadir al final de `Bodega.tsx` el componente principal con estado**

```tsx
export default function Bodega() {
  const navigate      = useNavigate()
  const { listWines } = useWines()
  const { total }     = useWineStore()

  // Inyectar keyframes una sola vez
  useEffect(() => { injectKeyframes() }, [])

  // Vista
  const [view, setView] = useState<'grid' | 'list'>(() =>
    (localStorage.getItem('bodega_view') as 'grid' | 'list') ?? 'grid'
  )

  // Búsqueda
  const [searchOpen,  setSearchOpen]  = useState(false)
  const [query,       setQuery]       = useState('')
  const [debouncedQ,  setDebouncedQ]  = useState('')
  const [suggestions, setSuggestions] = useState<Suggestion[]>([])

  // Filtros rápidos
  const [tipoFilter,     setTipoFilter]     = useState<string | null>(null)
  const [favoritoFilter, setFavoritoFilter] = useState(false)
  const [stockFilter,    setStockFilter]    = useState(false)

  // Filtros del panel
  const [anadaRange,  setAnadaRange]  = useState<[number, number]>([1900, CURRENT_YEAR])
  const [anadaActive, setAnadaActive] = useState(false)
  const [groupBy,     setGroupBy]     = useState<GroupKey | null>(null)
  const [sortBy,      setSortBy]      = useState<SortKey>('created_at_desc')
  const [filterPanelOpen, setFilterPanelOpen] = useState(false)

  // Datos
  const [wines,       setWines]       = useState<Wine[]>([])
  const [page,        setPage]        = useState(0)
  const [hasMore,     setHasMore]     = useState(true)
  const [loading,     setLoading]     = useState(true)
  const [loadingMore, setLoadingMore] = useState(false)
  const [refreshing,  setRefreshing]  = useState(false)

  // FAB
  const [fabHidden, setFabHidden] = useState(false)

  // Refs
  const searchRef   = useRef<HTMLInputElement>(null)
  const sentinelRef = useRef<HTMLDivElement>(null)
  const touchStartY = useRef(0)

  // Debounce
  useEffect(() => {
    const timer = setTimeout(() => setDebouncedQ(query), 300)
    return () => clearTimeout(timer)
  }, [query])

  // Sugerencias client-side
  useEffect(() => {
    setSuggestions(query.length >= 2 ? getSuggestions(query, wines) : [])
  }, [query, wines])

  // Recargar al cambiar filtros
  useEffect(() => {
    load(0, true)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debouncedQ, tipoFilter, favoritoFilter, stockFilter, anadaActive, anadaRange, sortBy])

  // Focus en búsqueda
  useEffect(() => {
    if (searchOpen) setTimeout(() => searchRef.current?.focus(), 50)
  }, [searchOpen])

  // Persistir vista
  useEffect(() => { localStorage.setItem('bodega_view', view) }, [view])

  // FAB inteligente
  useEffect(() => {
    let timer: ReturnType<typeof setTimeout>
    const handler = () => {
      setFabHidden(true)
      clearTimeout(timer)
      timer = setTimeout(() => setFabHidden(false), t.animation.fabScrollDelay)
    }
    window.addEventListener('scroll', handler, { passive: true })
    return () => { window.removeEventListener('scroll', handler); clearTimeout(timer) }
  }, [])

  // Pull-to-refresh
  useEffect(() => {
    const onStart = (e: TouchEvent) => { touchStartY.current = e.touches[0].clientY }
    const onEnd   = (e: TouchEvent) => {
      const main = document.querySelector('main')
      if (!main || main.scrollTop > 8) return
      const delta = e.changedTouches[0].clientY - touchStartY.current
      if (delta > 80 && !refreshing) { setRefreshing(true); load(0, true) }
    }
    window.addEventListener('touchstart', onStart, { passive: true })
    window.addEventListener('touchend',   onEnd,   { passive: true })
    return () => {
      window.removeEventListener('touchstart', onStart)
      window.removeEventListener('touchend',   onEnd)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [refreshing])

  async function load(pageNum: number, reset: boolean) {
    if (reset) { setLoading(true); setPage(0) }
    else         setLoadingMore(true)
    try {
      const results = await listWines({
        query:     debouncedQ || undefined,
        tipo:      tipoFilter ?? undefined,
        favorito:  favoritoFilter || undefined,
        stock:     stockFilter   || undefined,
        anada_min: anadaActive ? anadaRange[0] : undefined,
        anada_max: anadaActive ? anadaRange[1] : undefined,
        page:      pageNum,
        sort:      sortBy,
      })
      setWines(prev => reset ? results : [...prev, ...results])
      setHasMore(results.length === PAGE_SIZE)
      if (!reset) setPage(pageNum)
    } catch { /* datos locales siguen visibles */ }
    finally {
      setLoading(false)
      setLoadingMore(false)
      setRefreshing(false)
    }
  }

  const loadMore = useCallback(() => {
    if (loadingMore || !hasMore) return
    load(page + 1, false)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, hasMore, loadingMore])

  useEffect(() => {
    const el = sentinelRef.current
    if (!el || !hasMore) return
    const obs = new IntersectionObserver(
      entries => { if (entries[0].isIntersecting) loadMore() },
      { threshold: 0.1 }
    )
    obs.observe(el)
    return () => obs.disconnect()
  }, [loadMore, hasMore])

  // Stats client-side
  const totalBotellas = useMemo(() => wines.reduce((s, w) => s + (w.num_botellas ?? 0), 0), [wines])
  const totalBodegas  = useMemo(() => new Set(wines.map(w => w.bodega).filter(Boolean)).size, [wines])

  // Derivados
  const hasActiveFilters = !!(tipoFilter || favoritoFilter || stockFilter || anadaActive)
  const sortLabel = SORT_OPTIONS.find(o => o.key === sortBy)?.label ?? ''
  const grouped   = useMemo(() => groupBy ? groupWines(wines, groupBy) : null, [wines, groupBy])

  function clearFilters() {
    setTipoFilter(null); setFavoritoFilter(false); setStockFilter(false)
    setAnadaActive(false); setAnadaRange([1900, CURRENT_YEAR])
    setSortBy('created_at_desc'); setGroupBy(null)
  }

  function applySuggestion(s: Suggestion) {
    setQuery(s.value); setDebouncedQ(s.value); setSuggestions([])
  }

  function closeSearch() { setSearchOpen(false); setQuery(''); setSuggestions([]) }
```

- [ ] **Paso 2: Verificar compilación parcial**

```bash
cd /Users/carlosrabadan/Antigravity/Vinoteca && npx tsc --noEmit 2>&1 | head -20
```

---

## Task 6: Reescribir `Bodega.tsx` — JSX completo

- [ ] **Paso 1: Añadir el return JSX al final del componente (continúa en `Bodega.tsx`)**

```tsx
  // ── Render helpers ─────────────────────────────────────────────────────────
  function renderCards(list: Wine[], startIndex = 0) {
    if (view === 'grid') {
      return (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
          {list.map((w, i) => (
            <WineCardGrid key={w.id} wine={w} index={startIndex + i}
              onClick={() => navigate(`/bodega/${w.id}`)} />
          ))}
        </div>
      )
    }
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {list.map((w, i) => (
          <WineCardList key={w.id} wine={w} index={startIndex + i}
            onClick={() => navigate(`/bodega/${w.id}`)} />
        ))}
      </div>
    )
  }

  const shimmerStyle: CSSProperties = {
    background: t.gradients.shimmer,
    backgroundSize: '200% 100%',
    animation: `shimmer ${t.animation.durationSkeleton} ease-in-out infinite`,
    borderRadius: t.radius.sm,
  }

  return (
    <Layout>
      {/* Fondo glow */}
      <div style={{
        position: 'fixed', inset: 0, pointerEvents: 'none', zIndex: t.zIndex.bg,
        background: t.gradients.bgGlow,
      }} />

      <div style={{ position: 'relative', zIndex: t.zIndex.content }}>

        {/* ── HEADER STICKY ──────────────────────────────────────────────── */}
        <div style={{
          position: 'sticky', top: 0, zIndex: t.zIndex.header,
          background: t.colors.bg, padding: '10px 20px 0',
        }}>

          {/* Fila 1: título + acciones */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
            <h1 style={{ ...t.typography.pageTitle, color: t.colors.cream }}>
              Mi Bodega <em style={{ fontStyle: 'italic', color: t.colors.gold }}>Personal</em>
            </h1>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <button onClick={() => { setSearchOpen(o => !o); setFilterPanelOpen(false) }}
                style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '4px 2px',
                  color: searchOpen ? t.colors.gold : '#9A7E82' }}
                aria-label="Buscar">
                <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/>
                </svg>
              </button>
              <button onClick={() => { setFilterPanelOpen(o => !o); setSearchOpen(false) }}
                style={{ position: 'relative', background: 'none', border: 'none', cursor: 'pointer', padding: '4px 2px',
                  color: filterPanelOpen ? t.colors.gold : '#9A7E82' }}
                aria-label="Filtros y orden">
                <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="21" y1="6" x2="3" y2="6"/><line x1="15" y1="12" x2="9" y2="12"/><line x1="17" y1="18" x2="7" y2="18"/>
                </svg>
                {hasActiveFilters && (
                  <span style={{ position: 'absolute', top: 2, right: 0, width: 6, height: 6, borderRadius: '50%', background: t.colors.primary }} />
                )}
              </button>
            </div>
          </div>

          {/* Fila 2: stats */}
          {!searchOpen && (
            <div style={{
              display: 'flex', gap: 20, alignItems: 'flex-start',
              marginBottom: 14, paddingBottom: 12, borderBottom: `1px solid ${t.colors.border}`,
            }}>
              {loading ? (
                <>
                  {[48, 56, 52].map((w, i) => (
                    <div key={i} style={{ ...shimmerStyle, width: w, height: 38 }} />
                  ))}
                </>
              ) : (
                [
                  { num: total,         label: 'Vinos'   },
                  { num: totalBotellas, label: 'Botellas' },
                  { num: totalBodegas,  label: 'Bodegas'  },
                ].map(({ num, label }) => (
                  <div key={label} style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', gap: 1 }}>
                    <span style={{
                      ...t.typography.statNumber,
                      color: t.colors.cream,
                      animation: 'countUp 0.4s ease both',
                    }}>
                      {num}
                    </span>
                    <span style={{ ...t.typography.statLabel, color: t.colors.muted, textTransform: 'uppercase' }}>
                      {label}
                    </span>
                  </div>
                ))
              )}
            </div>
          )}

          {/* Fila 3: chips de filtro rápido */}
          {!searchOpen && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, paddingBottom: 8, overflowX: 'auto', scrollbarWidth: 'none' } as CSSProperties}>
              {/* Todos */}
              <button onClick={() => { setTipoFilter(null); setFavoritoFilter(false); setStockFilter(false) }}
                style={{
                  flexShrink: 0, padding: '5px 13px', borderRadius: t.radius.pill,
                  fontFamily: t.typography.chipLabel.fontFamily,
                  border: `1px solid ${!tipoFilter && !favoritoFilter && !stockFilter ? t.colors.primaryBorder : t.colors.border}`,
                  background: !tipoFilter && !favoritoFilter && !stockFilter ? t.colors.primary : 'transparent',
                  color: !tipoFilter && !favoritoFilter && !stockFilter ? t.colors.cream : t.colors.muted,
                  fontSize: t.typography.chipLabel.fontSize,
                  fontWeight: !tipoFilter && !favoritoFilter && !stockFilter ? 600 : 400, cursor: 'pointer',
                }}>
                Todos
              </button>
              {TIPOS.map(tipo => (
                <button key={tipo} onClick={() => setTipoFilter(tipoFilter === tipo ? null : tipo)}
                  style={{
                    flexShrink: 0, padding: '5px 13px', borderRadius: t.radius.pill,
                    fontFamily: t.typography.chipLabel.fontFamily,
                    border: `1px solid ${tipoFilter === tipo ? t.colors.primaryBorder : t.colors.border}`,
                    background: tipoFilter === tipo ? t.colors.primary : 'transparent',
                    color: tipoFilter === tipo ? t.colors.cream : t.colors.muted,
                    fontSize: t.typography.chipLabel.fontSize,
                    fontWeight: tipoFilter === tipo ? 600 : 400, cursor: 'pointer',
                  }}>
                  {tipo}
                </button>
              ))}
              <div style={{ width: 1, height: 18, background: t.colors.border, flexShrink: 0 }} />
              {/* Favoritos */}
              <button onClick={() => setFavoritoFilter(f => !f)}
                style={{
                  flexShrink: 0, padding: '5px 13px', borderRadius: t.radius.pill,
                  fontFamily: t.typography.chipLabel.fontFamily,
                  border: `1px solid ${favoritoFilter ? t.colors.goldBorder : t.colors.border}`,
                  background: favoritoFilter ? t.colors.goldSubtle : 'transparent',
                  color: favoritoFilter ? t.colors.gold : t.colors.muted,
                  fontSize: t.typography.chipLabel.fontSize,
                  fontWeight: favoritoFilter ? 600 : 400, cursor: 'pointer',
                }}>
                ⭐ Favoritos
              </button>
              {/* En stock */}
              <button onClick={() => setStockFilter(s => !s)}
                style={{
                  flexShrink: 0, padding: '5px 13px', borderRadius: t.radius.pill,
                  fontFamily: t.typography.chipLabel.fontFamily,
                  border: `1px solid ${stockFilter ? t.colors.primaryBorder : t.colors.border}`,
                  background: stockFilter ? t.colors.primary : 'transparent',
                  color: stockFilter ? t.colors.cream : t.colors.muted,
                  fontSize: t.typography.chipLabel.fontSize,
                  fontWeight: stockFilter ? 600 : 400, cursor: 'pointer',
                }}>
                En stock
              </button>
            </div>
          )}

          {/* Fila 4: sort + view toggle */}
          {!searchOpen && !loading && wines.length > 0 && (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '2px 0' }}>
              <button onClick={() => setFilterPanelOpen(o => !o)}
                style={{ display: 'flex', alignItems: 'center', gap: 6, background: 'none', border: 'none', cursor: 'pointer', color: t.colors.muted, fontSize: t.typography.sortLabel.fontSize, fontFamily: t.typography.sortLabel.fontFamily }}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M3 6h18M7 12h10M10 18h4"/>
                </svg>
                {sortLabel}
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="6 9 12 15 18 9"/>
                </svg>
              </button>
              <div style={{ display: 'flex', background: t.colors.surface, border: `1px solid ${t.colors.border}`, borderRadius: t.radius.md, overflow: 'hidden' }}>
                {(['grid', 'list'] as const).map(v => (
                  <button key={v} aria-pressed={view === v} onClick={() => setView(v)}
                    style={{
                      background: view === v ? t.colors.surface2 : 'none', fontFamily: 'inherit',
                      border: 'none', cursor: 'pointer', padding: '6px 10px', display: 'flex', alignItems: 'center',
                      color: view === v ? t.colors.cream : t.colors.muted,
                    }}>
                    {v === 'grid' ? (
                      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/>
                        <rect x="3" y="14" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/>
                      </svg>
                    ) : (
                      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <line x1="8" y1="6" x2="21" y2="6"/><line x1="8" y1="12" x2="21" y2="12"/><line x1="8" y1="18" x2="21" y2="18"/>
                        <circle cx="3.5" cy="6" r="1.5"/><circle cx="3.5" cy="12" r="1.5"/><circle cx="3.5" cy="18" r="1.5"/>
                      </svg>
                    )}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* ── PANEL BÚSQUEDA ────────────────────────────────────────────── */}
          {searchOpen && (
            <>
              <div style={{
                display: 'flex', alignItems: 'center', gap: 8, background: t.colors.surface,
                border: `1px solid ${t.colors.gold}`,
                borderBottom: suggestions.length > 0 ? 'none' : `1px solid ${t.colors.gold}`,
                borderRadius: suggestions.length > 0 ? `${t.radius.xl}px ${t.radius.xl}px 0 0` : t.radius.xl,
                padding: '10px 14px',
              }}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={t.colors.muted} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/>
                </svg>
                <input ref={searchRef} value={query} onChange={e => setQuery(e.target.value)}
                  placeholder="Buscar vino, bodega, DO o región…"
                  style={{ flex: 1, background: 'none', border: 'none', outline: 'none', color: t.colors.cream, fontSize: t.font.base, fontFamily: 'inherit' }}
                />
                {query && (
                  <button onClick={() => { setQuery(''); setSuggestions([]) }}
                    style={{ background: t.colors.surface2, border: 'none', cursor: 'pointer', color: t.colors.muted, fontSize: t.font.xs, padding: '2px 6px', borderRadius: t.radius.xs }}>
                    ✕
                  </button>
                )}
              </div>
              {suggestions.length > 0 && (
                <div role="listbox" style={{
                  background: t.colors.surface, border: `1px solid ${t.colors.gold}`,
                  borderTop: 'none', borderRadius: `0 0 ${t.radius.xl}px ${t.radius.xl}px`,
                  overflow: 'hidden', marginBottom: 10,
                }}>
                  {suggestions.map((s, i) => (
                    <div key={i} role="option" aria-selected={false} onClick={() => applySuggestion(s)}
                      style={{
                        display: 'flex', alignItems: 'center', gap: 10,
                        padding: '11px 14px', ...t.typography.body, color: t.colors.cream,
                        borderBottom: i < suggestions.length - 1 ? `1px solid ${t.colors.border}` : 'none',
                        cursor: 'pointer',
                      }}>
                      <span style={{ ...t.typography.suggestionEmoji, width: 20, textAlign: 'center' }}>{s.emoji}</span>
                      <span style={{
                        ...t.typography.suggestionType, textTransform: 'uppercase',
                        color: t.colors.muted2, background: t.colors.surface2, padding: '2px 6px',
                        borderRadius: t.radius.xs, flexShrink: 0,
                      }}>
                        {s.typeLabel}
                      </span>
                      <span>{s.label}</span>
                    </div>
                  ))}
                </div>
              )}
            </>
          )}
        </div>

        {/* ── PANEL FILTROS ─────────────────────────────────────────────────── */}
        {filterPanelOpen && (
          <div style={{ padding: '8px 20px 24px', animation: 'slideUp 0.25s ease both' }}>
            <FilterSection title="Colección">
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 7 }}>
                <FilterChip label="⭐ Favoritos" active={favoritoFilter} onClick={() => setFavoritoFilter(f => !f)} />
                <FilterChip label="En stock"    active={stockFilter}    onClick={() => setStockFilter(s => !s)} />
              </div>
            </FilterSection>
            <FilterSection title="Tipo">
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 7 }}>
                <FilterChip label="Todos" active={!tipoFilter} onClick={() => setTipoFilter(null)} />
                {TIPOS.map(tipo => (
                  <FilterChip key={tipo} label={tipo} active={tipoFilter === tipo}
                    onClick={() => setTipoFilter(tipoFilter === tipo ? null : tipo)} />
                ))}
              </div>
            </FilterSection>
            <FilterSection title="Añada">
              <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
                {(['Desde', 'Hasta'] as const).map((lbl, idx) => (
                  <div key={lbl} style={{ flex: 1, background: t.colors.surface, border: `1px solid ${t.colors.border}`, borderRadius: t.radius.md, padding: '10px 12px' }}>
                    <div style={{ ...t.typography.micro, color: t.colors.muted, marginBottom: 2, textTransform: 'uppercase' }}>{lbl}</div>
                    <input type="number" min={1900} max={CURRENT_YEAR} value={anadaRange[idx]}
                      onChange={e => {
                        const val = Number(e.target.value)
                        setAnadaRange(prev => idx === 0 ? [val, prev[1]] : [prev[0], val])
                        setAnadaActive(true)
                      }}
                      style={{ background: 'none', border: 'none', outline: 'none', color: t.colors.cream, ...t.typography.inputAnada, width: '100%' }}
                    />
                  </div>
                ))}
              </div>
            </FilterSection>
            <FilterSection title="Agrupar por">
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 7 }}>
                <FilterChip label="Ninguno" active={!groupBy} onClick={() => setGroupBy(null)} />
                {GROUP_OPTIONS.map(o => (
                  <FilterChip key={o.key} label={o.label} active={groupBy === o.key}
                    onClick={() => setGroupBy(groupBy === o.key ? null : o.key)} />
                ))}
              </div>
            </FilterSection>
            <FilterSection title="Ordenar por">
              <div style={{ background: t.colors.surface, border: `1px solid ${t.colors.border}`, borderRadius: t.radius.xl, overflow: 'hidden' }}>
                {SORT_OPTIONS.map((o, i) => (
                  <div key={o.key} onClick={() => setSortBy(o.key)}
                    style={{
                      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                      padding: '13px 16px', fontSize: t.font.base,
                      color: sortBy === o.key ? t.colors.gold : t.colors.cream,
                      borderBottom: i < SORT_OPTIONS.length - 1 ? `1px solid ${t.colors.border}` : 'none',
                      cursor: 'pointer',
                    }}>
                    {o.label}
                    {sortBy === o.key && (
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={t.colors.gold} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                        <polyline points="20 6 9 17 4 12"/>
                      </svg>
                    )}
                  </div>
                ))}
              </div>
            </FilterSection>
            <button onClick={() => setFilterPanelOpen(false)}
              style={{ width: '100%', padding: 14, background: t.colors.primary, color: t.colors.cream, border: 'none', borderRadius: t.radius.xl, ...t.typography.button, cursor: 'pointer', marginBottom: 12 }}>
              Ver resultados ({total})
            </button>
            <button onClick={clearFilters}
              style={{ width: '100%', padding: 10, background: 'transparent', color: t.colors.muted, border: `1px solid ${t.colors.border}`, borderRadius: t.radius.xl, ...t.typography.body, fontFamily: t.typography.button.fontFamily, cursor: 'pointer' }}>
              Restablecer filtros
            </button>
          </div>
        )}

        {/* Meta resultados */}
        {!loading && !searchOpen && wines.length > 0 && (
          <p style={{ ...t.typography.micro, color: t.colors.muted, padding: '4px 20px 6px' }}>
            <strong style={{ color: t.colors.cream }}>{total}</strong> vino{total !== 1 ? 's' : ''}
            {groupBy && ` · Agrupados por ${GROUP_OPTIONS.find(o => o.key === groupBy)?.label?.toLowerCase()}`}
          </p>
        )}

        {/* ── CONTENIDO ──────────────────────────────────────────────────── */}
        <div style={{ padding: '0 16px 120px' }} aria-busy={loading}>

          {/* Skeleton */}
          {loading && (
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} style={{ background: t.colors.surface, border: `1px solid ${t.colors.border}`, borderRadius: t.radius.xl, overflow: 'hidden' }}>
                  <div style={{ ...shimmerStyle, height: t.sizes.cardGridImageHeight }} />
                  <div style={{ padding: 10, display: 'flex', flexDirection: 'column', gap: 6 }}>
                    <div style={{ ...shimmerStyle, height: 10, width: '70%' }} />
                    <div style={{ ...shimmerStyle, height: 10, width: '50%' }} />
                    <div style={{ ...shimmerStyle, height: 10, width: '40%' }} />
                  </div>
                </div>
              ))}
            </div>
          )}

          {refreshing && (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 8, color: t.colors.muted, fontSize: t.font.xs, gap: 6 }}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ animation: 'spin 1s linear infinite' }}>
                <path d="M21 12a9 9 0 1 1-6.219-8.56"/>
              </svg>
              Actualizando…
            </div>
          )}

          {/* Empty state */}
          {!loading && wines.length === 0 && (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16, padding: '60px 32px', textAlign: 'center' }}>
              <svg width="52" height="52" viewBox="0 0 24 24" fill="none" stroke={t.colors.border} strokeWidth="0.8" strokeLinecap="round" strokeLinejoin="round">
                <path d="M8 22h8M12 11v11M5 3h14l-2 7a5 5 0 0 1-10 0L5 3z"/>
              </svg>
              {hasActiveFilters || debouncedQ ? (
                <>
                  <div>
                    <div style={{ ...t.typography.heroTitle, color: t.colors.cream }}>Sin resultados</div>
                    <p style={{ ...t.typography.body, color: t.colors.muted, marginTop: 8 }}>No hemos encontrado ningún vino<br/>con esos filtros.</p>
                  </div>
                  <button onClick={clearFilters}
                    style={{ background: 'transparent', color: t.colors.muted, border: `1px solid ${t.colors.border}`, padding: '12px 28px', borderRadius: 24, ...t.typography.button, cursor: 'pointer' }}>
                    Limpiar filtros
                  </button>
                </>
              ) : (
                <>
                  <div>
                    <div style={{ ...t.typography.heroTitle, color: t.colors.cream }}>Tu bodega está vacía</div>
                    <p style={{ ...t.typography.body, color: t.colors.muted, marginTop: 8 }}>Empieza escaneando la etiqueta<br/>de tu primer vino</p>
                  </div>
                  <button onClick={() => navigate('/scan')}
                    style={{ background: t.colors.primary, color: t.colors.cream, border: 'none', padding: '12px 28px', borderRadius: 24, ...t.typography.button, cursor: 'pointer' }}>
                    Escanear vino
                  </button>
                  <button onClick={() => navigate('/anadir')}
                    style={{ ...t.typography.bodySmall, color: t.colors.muted, background: 'none', border: 'none', cursor: 'pointer', fontFamily: t.typography.button.fontFamily, textDecoration: 'underline', textUnderlineOffset: 3 }}>
                    o añadir un vino manualmente
                  </button>
                </>
              )}
            </div>
          )}

          {/* Hint swipe (vista lista) */}
          {!loading && wines.length > 0 && view === 'list' && !groupBy && (
            <p style={{ ...t.typography.caption, color: t.colors.muted2, textAlign: 'right', paddingBottom: 6, fontStyle: 'italic' }}>
              Desliza para acciones rápidas →
            </p>
          )}

          {/* Cards con agrupación */}
          {!loading && grouped && grouped.map((group, gi) => (
            <div key={group.label}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, margin: gi === 0 ? '4px 0 14px' : '36px 0 14px' }}>
                <span style={{ ...t.typography.groupHeader, textTransform: 'uppercase', color: t.colors.cream, whiteSpace: 'nowrap' }}>
                  {group.label}
                </span>
                <div style={{ flex: 1, height: 1, background: 'rgba(46,30,34,0.6)' }} />
                <span style={{ ...t.typography.micro, color: t.colors.muted, background: t.colors.surface2, padding: '2px 8px', borderRadius: t.radius.pill }}>
                  {group.wines.length} {group.wines.length === 1 ? 'referencia' : 'referencias'}
                </span>
              </div>
              {renderCards(group.wines, gi * 10)}
            </div>
          ))}
          {!loading && !grouped && renderCards(wines)}

          {/* Infinite scroll */}
          <div ref={sentinelRef} style={{ height: 8 }} />
          {loadingMore && (
            <div style={{ display: 'flex', justifyContent: 'center', padding: 16 }}>
              <div style={{
                width: 24, height: 24, borderRadius: '50%',
                border: `2px solid ${t.colors.border}`,
                borderTopColor: t.colors.primary,
                animation: 'spin 0.8s linear infinite',
              }} />
            </div>
          )}
        </div>

        {/* ── FAB ──────────────────────────────────────────────────────────── */}
        <button onClick={() => navigate('/scan')}
          aria-label="Añadir vino mediante cámara"
          style={{
            position: 'fixed', bottom: t.sizes.fabBottomOffset, right: 16,
            width: t.sizes.fabSize, height: t.sizes.fabSize, borderRadius: '50%',
            background: t.colors.primary, color: t.colors.cream, border: 'none', cursor: 'pointer',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            boxShadow: t.shadows.fab, zIndex: t.zIndex.fab,
            transition: `transform ${t.animation.durationBase} ${t.animation.easingSpring}, opacity ${t.animation.durationBase} ease`,
            transform: fabHidden ? 'translateY(20px) scale(0.85)' : 'translateY(0) scale(1)',
            opacity:   fabHidden ? 0 : 1,
            pointerEvents: fabHidden ? 'none' : 'auto',
          }}>
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/>
            <circle cx="12" cy="13" r="4"/>
          </svg>
        </button>

      </div>
    </Layout>
  )
}
```

- [ ] **Paso 2: Verificar TypeScript limpio**

```bash
cd /Users/carlosrabadan/Antigravity/Vinoteca && npx tsc --noEmit 2>&1
```

Esperado: sin output.

- [ ] **Paso 3: Commit**

```bash
git add src/pages/Bodega.tsx
git commit -m "feat(bodega): reescritura completa Fase 7 — dual view, búsqueda, filtros, agrupación"
```

---

## Task 7: Verificación final, documentación y push

- [ ] **Paso 1: Build de producción**

```bash
cd /Users/carlosrabadan/Antigravity/Vinoteca && npm run build 2>&1 | tail -20
```

Esperado: `✓ built in X.XXs` sin errores.

- [ ] **Paso 2: Actualizar `docs/CHANGELOG.md`** — añadir al inicio:

```markdown
## v0.7.0 — 2026-07-09

### Fase 7 — Gestión de Bodega

- Vista dual grid/lista con toggle persistente (localStorage)
- Búsqueda instantánea con autocomplete: 🍷 VINO · 🏛️ BODEGA · 📍 REGIÓN · 🏷️ D.O.
- Filtros combinables: tipo, favoritos, stock, rango de añada
- Agrupación por bodega, región, denominación, añada, tipo o ubicación
- Ordenación: 7 criterios (fecha, nombre, bodega, añada, precio, stock)
- Stats de colección en header con animación countUp
- Skeleton con shimmer durante la carga inicial
- FAB inteligente: se oculta al scroll, reaparece 600ms después
- Estado vacío diferenciado: sin resultados vs. bodega vacía
- Design System congelado en `src/constants/theme.ts`: todos los tokens de color, tipografía, espaciado, radio, sombras, gradientes, animaciones y dimensiones
- Nuevos componentes: `WineCardGrid`, `WineCardList`
- `listWines` extendido con filtros Supabase: tipo, favorito, stock, añada_min/max, sort
```

- [ ] **Paso 3: Actualizar `docs/ROADMAP.md`** — marcar Fase 7:

```markdown
✅ Fase 7 — Gestión de bodega (v0.7.0, 2026-07-09)
```

- [ ] **Paso 4: Commit documentación**

```bash
git add docs/CHANGELOG.md docs/ROADMAP.md \
        docs/superpowers/specs/2026-07-09-bodega-fase7-design.md \
        docs/superpowers/plans/2026-07-09-bodega-fase7.md
git commit -m "docs: changelog v0.7.0, roadmap Fase 7, spec y plan de implementación"
```

- [ ] **Paso 5: Push**

```bash
git push origin master
```

---

## Checklist de aceptación — verificar manualmente en `npm run dev`

- [ ] Grid y lista funcionan; toggle cambia la vista; al recargar se recuerda la elegida
- [ ] Escribir en búsqueda filtra resultados en ≤ 300ms (debounce)
- [ ] Al escribir ≥ 2 caracteres aparecen sugerencias con emoji correcto por tipo
- [ ] Combinar chip Tinto + ⭐ Favoritos muestra solo tintos favoritos
- [ ] Activar agrupación por bodega agrupa los cards visualmente sin fetch visible
- [ ] Al cargar se ve skeleton 2×3 con shimmer antes de los cards reales
- [ ] Al hacer scroll el FAB desaparece; al detenerse reaparece tras 600ms
- [ ] Con bodega vacía: "Tu bodega está vacía" + botón "Escanear vino"
- [ ] Con filtros activos y 0 resultados: "Sin resultados" + "Limpiar filtros"
- [ ] Stats (vinos/botellas/bodegas) aparecen con animación countUp al montar
- [ ] Ningún hex hardcodeado en `WineCardGrid.tsx`, `WineCardList.tsx` ni `Bodega.tsx`
