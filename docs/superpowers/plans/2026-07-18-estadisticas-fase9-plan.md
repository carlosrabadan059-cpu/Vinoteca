# Fase 9 — Estadísticas: Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Cerrar la Fase 9 del roadmap incorporando datos de colección personal (valor estimado, botellas, uva, bodega) a las estadísticas, y rediseñando `Stats.tsx` con un hero de valor e insight IA promovido, según el spec aprobado en `docs/superpowers/specs/2026-07-18-estadisticas-fase9-design.md`.

**Architecture:** Se extrae toda la lógica de cálculo de `src/hooks/useStats.ts` a funciones puras en un nuevo `src/lib/statsHelpers.ts` (mismo patrón que `src/lib/catasHelpers.ts` de Fase 8), el hook queda como un orquestador fino, y `src/pages/Stats.tsx` se reordena/rediseña reutilizando esas funciones sin cambiar de librería de gráficas (Recharts).

**Tech Stack:** React 19 + TypeScript, Recharts (ya instalado), Supabase JS client. No hay test runner configurado en el proyecto (`npx tsc --noEmit` es la única verificación automatizada); cada tarea se verifica con type-check y, en la tarea final, con una prueba manual en `npm run dev`.

---

### Task 1: Extraer helpers puros a `src/lib/statsHelpers.ts`

**Files:**
- Create: `src/lib/statsHelpers.ts`

- [ ] **Step 1: Crear el archivo con todas las funciones puras**

Copia `classifyWine`, `decadeOf` y `buildEvolucion` tal cual están hoy en `src/hooks/useStats.ts` (líneas 17–70), y añade las funciones nuevas de colección/distribución genérica/mejor vino/puntuación media. Contenido completo del archivo:

```typescript
import type { Wine, Tasting } from '../types'

// ── Clasificación de tipo por nombre/uva ──────────────────────────────────────

const TINTOS    = ['tempranillo', 'garnacha', 'cabernet', 'merlot', 'syrah', 'malbec', 'monastrell', 'mencía', 'tinto', 'negro', 'cariñena', 'bobal', 'prieto']
const BLANCOS   = ['albariño', 'verdejo', 'chardonnay', 'sauvignon', 'riesling', 'viura', 'blanco', 'torrontés', 'godello', 'macabeo', 'moscatel', 'gewürz']
const ROSADOS   = ['rosado', 'rosé', 'clarete']
const ESPUMOSOS = ['cava', 'champagne', 'champán', 'espumoso', 'prosseco', 'prosecco', 'frizzante', 'crémant']
const DULCES    = ['dulce', 'pedro ximénez', 'px', 'moscatel', 'sauternes', 'ice wine', 'vendimia tardía']

export function classifyWine(wine: Wine): string {
  const haystack = [wine.nombre, wine.uva, wine.tipo, wine.denominacion]
    .filter(Boolean)
    .join(' ')
    .toLowerCase()

  if (ESPUMOSOS.some(k => haystack.includes(k))) return 'Espumoso'
  if (DULCES.some(k => haystack.includes(k)))    return 'Dulce'
  if (ROSADOS.some(k => haystack.includes(k)))   return 'Rosado'
  if (BLANCOS.some(k => haystack.includes(k)))   return 'Blanco'
  if (TINTOS.some(k => haystack.includes(k)))    return 'Tinto'
  return 'Sin clasificar'
}

export function decadeOf(anada: number | null): string {
  if (anada === null) return 'Sin añada'
  return `${Math.floor(anada / 10) * 10}s`
}

const MES_SHORT = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic']

export interface EvolucionRow {
  mes: string
  cantidad: number
  mediaScore: number | null
}

export function buildEvolucion(tastings: Tasting[]): EvolucionRow[] {
  const now  = new Date()
  const rows: EvolucionRow[] = []

  for (let i = 5; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1)
    const mes = MES_SHORT[d.getMonth()]
    const year = d.getFullYear()
    const month = d.getMonth()

    const inMonth = tastings.filter(t => {
      const td = new Date(t.fecha)
      return td.getFullYear() === year && td.getMonth() === month
    })

    const scored = inMonth.filter(t => t.puntuacion !== null)
    const mediaScore = scored.length > 0
      ? scored.reduce((s, t) => s + (t.puntuacion ?? 0), 0) / scored.length
      : null

    rows.push({ mes, cantidad: inMonth.length, mediaScore: mediaScore !== null ? Math.round(mediaScore * 10) / 10 : null })
  }

  return rows
}

// ── Puntuación media y mejor vino ──────────────────────────────────────────────

export function computePuntuacionMedia(tastings: Tasting[]): number | null {
  const scored = tastings.filter(t => t.puntuacion !== null)
  if (scored.length === 0) return null
  return Math.round(scored.reduce((s, t) => s + (t.puntuacion ?? 0), 0) / scored.length * 10) / 10
}

export interface MejorVino {
  nombre: string
  puntuacion: number
}

export function computeMejorVino(wines: Wine[], tastings: Tasting[]): MejorVino | null {
  const scored = tastings.filter(t => t.puntuacion !== null)
  if (scored.length === 0) return null
  const best = scored.reduce((a, b) => (b.puntuacion ?? 0) > (a.puntuacion ?? 0) ? b : a)
  const wine = wines.find(w => w.id === best.wine_id)
  if (!wine) return null
  return { nombre: wine.nombre, puntuacion: best.puntuacion! }
}

// ── Distribución por tipo ────────────────────────────────────────────────────

export interface TipoEntry {
  tipo: string
  count: number
}

export function computeDistribucionTipos(wines: Wine[]): TipoEntry[] {
  const map: Record<string, number> = {}
  wines.forEach(w => {
    const tipo = classifyWine(w)
    map[tipo] = (map[tipo] ?? 0) + 1
  })
  return Object.entries(map)
    .map(([tipo, count]) => ({ tipo, count }))
    .sort((a, b) => b.count - a.count)
}

// ── Distribución por añadas/décadas ────────────────────────────────────────────

const DECADE_ORDER = ['1970s', '1980s', '1990s', '2000s', '2010s', '2020s', 'Sin añada']

export interface DecadaEntry {
  decada: string
  count: number
}

export function computeDistribucionAnadas(wines: Wine[]): DecadaEntry[] {
  const map: Record<string, number> = {}
  wines.forEach(w => {
    const d = decadeOf(w.anada)
    map[d] = (map[d] ?? 0) + 1
  })
  return DECADE_ORDER
    .filter(d => map[d])
    .map(decada => ({ decada, count: map[decada] }))
}

// ── Distribución genérica por campo de texto (región, uva, bodega) ────────────

export interface DistribucionEntry {
  label: string
  count: number
}

export function computeDistribucionPorCampo(
  wines: Wine[],
  campo: 'region' | 'uva' | 'bodega',
  sinDatoLabel: string,
  top = 5
): DistribucionEntry[] {
  const map: Record<string, number> = {}
  wines.forEach(w => {
    const valor = w[campo]?.trim() || sinDatoLabel
    map[valor] = (map[valor] ?? 0) + 1
  })
  return Object.entries(map)
    .map(([label, count]) => ({ label, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, top)
}

// ── Datos de colección personal (precio, num_botellas) ─────────────────────────

export function computeValorEstimado(wines: Wine[]): number {
  return wines.reduce((sum, w) => sum + (w.precio ?? 0) * w.num_botellas, 0)
}

export function computeTotalBotellas(wines: Wine[]): number {
  return wines.reduce((sum, w) => sum + w.num_botellas, 0)
}
```

- [ ] **Step 2: Verificar que compila**

Run: `cd "/Volumes/SSD Externo/PROYECTOS/Antigravity/Vinoteca" && npx tsc --noEmit`
Expected: sin salida (sin errores). `useStats.ts` y `Stats.tsx` todavía no importan de este archivo, así que no debe haber errores nuevos ni relacionados con duplicados (los nombres de función siguen existiendo también en `useStats.ts` hasta la Tarea 2, pero al estar en módulos distintos no colisionan).

- [ ] **Step 3: Commit**

```bash
cd "/Volumes/SSD Externo/PROYECTOS/Antigravity/Vinoteca"
git add src/lib/statsHelpers.ts
git commit -m "feat(stats): extraer helpers puros de estadísticas a statsHelpers.ts"
```

---

### Task 2: Reescribir `src/hooks/useStats.ts` como orquestador fino

**Files:**
- Modify: `src/hooks/useStats.ts` (reescritura completa del archivo, 168 líneas actuales)

- [ ] **Step 1: Reemplazar todo el contenido del archivo**

```typescript
import { useState, useCallback } from 'react'
import { supabase } from '../lib/supabase'
import { useAuthStore } from '../store/authStore'
import type { Wine, Tasting } from '../types'
import {
  computeValorEstimado,
  computeTotalBotellas,
  computeDistribucionPorCampo,
  computeDistribucionTipos,
  computeDistribucionAnadas,
  computePuntuacionMedia,
  computeMejorVino,
  buildEvolucion,
  type DistribucionEntry,
  type TipoEntry,
  type DecadaEntry,
  type EvolucionRow,
  type MejorVino,
} from '../lib/statsHelpers'

export interface StatsData {
  totalVinos: number
  totalBotellas: number
  valorEstimado: number
  totalCatas: number
  puntuacionMedia: number | null
  mejorVino: MejorVino | null
  distribucionTipos: TipoEntry[]
  topRegiones: DistribucionEntry[]
  distribucionUva: DistribucionEntry[]
  distribucionBodega: DistribucionEntry[]
  distribucionAnadas: DecadaEntry[]
  evolucionCatas: EvolucionRow[]
}

export function useStats() {
  const [stats,   setStats]   = useState<StatsData | null>(null)
  const [loading, setLoading] = useState(false)
  const [error,   setError]   = useState<string | null>(null)

  const { user } = useAuthStore()

  const refresh = useCallback(async () => {
    if (!user) return
    setLoading(true)
    setError(null)

    try {
      const [winesRes, tastingsRes] = await Promise.all([
        supabase.from('wines').select('*').eq('user_id', user.id),
        supabase.from('tastings').select('*').eq('user_id', user.id).order('fecha', { ascending: false }),
      ])

      if (winesRes.error)    throw winesRes.error
      if (tastingsRes.error) throw tastingsRes.error

      const wines    = (winesRes.data    ?? []) as Wine[]
      const tastings = (tastingsRes.data ?? []) as Tasting[]

      setStats({
        totalVinos:         wines.length,
        totalBotellas:      computeTotalBotellas(wines),
        valorEstimado:      computeValorEstimado(wines),
        totalCatas:         tastings.length,
        puntuacionMedia:    computePuntuacionMedia(tastings),
        mejorVino:          computeMejorVino(wines, tastings),
        distribucionTipos:  computeDistribucionTipos(wines),
        topRegiones:        computeDistribucionPorCampo(wines, 'region', 'Sin región'),
        distribucionUva:    computeDistribucionPorCampo(wines, 'uva', 'Sin uva especificada'),
        distribucionBodega: computeDistribucionPorCampo(wines, 'bodega', 'Sin bodega'),
        distribucionAnadas: computeDistribucionAnadas(wines),
        evolucionCatas:     buildEvolucion(tastings),
      })
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Error al cargar estadísticas')
    } finally {
      setLoading(false)
    }
  }, [user])

  return { stats, loading, error, refresh }
}
```

- [ ] **Step 2: Verificar que compila**

Run: `cd "/Volumes/SSD Externo/PROYECTOS/Antigravity/Vinoteca" && npx tsc --noEmit`
Expected: **errores en `src/pages/Stats.tsx`** — es esperado en este punto, porque `Stats.tsx` todavía usa `stats.topRegiones.map(({ region, count }) => ...)` y el campo ahora se llama `label`, no `region`. Estos errores se resuelven en la Tarea 4. Confirma que los únicos errores mostrados están en `src/pages/Stats.tsx`, no en `useStats.ts` ni en `statsHelpers.ts`.

- [ ] **Step 3: Commit**

```bash
cd "/Volumes/SSD Externo/PROYECTOS/Antigravity/Vinoteca"
git add src/hooks/useStats.ts
git commit -m "refactor(stats): useStats.ts pasa a orquestar statsHelpers.ts"
```

(Se commitea aunque `tsc` marque errores en `Stats.tsx`, porque ese archivo se corrige en la Tarea 4 — es un paso intermedio esperado dentro del mismo plan, no un estado final roto sin arreglar.)

---

### Task 3: Ampliar `StatsPayload` en `src/lib/n8n.ts`

**Files:**
- Modify: `src/lib/n8n.ts:110-118`

- [ ] **Step 1: Añadir los dos campos nuevos al payload**

Localiza el bloque actual (líneas 110–118):

```typescript
export interface StatsPayload {
  totalVinos: number
  totalCatas: number
  puntuacionMedia: number
  topRegiones: { region: string; count: number }[]
  distribucionTipos: { tipo: string; count: number }[]
  anadas: { decada: string; count: number }[]
  mejorVino: { nombre: string; puntuacion: number } | null
}
```

Reemplázalo por:

```typescript
export interface StatsPayload {
  totalVinos: number
  totalBotellas: number
  valorEstimado: number
  totalCatas: number
  puntuacionMedia: number
  topRegiones: { region: string; count: number }[]
  distribucionTipos: { tipo: string; count: number }[]
  anadas: { decada: string; count: number }[]
  mejorVino: { nombre: string; puntuacion: number } | null
}
```

No se toca `callStatsInsight` (líneas 175-179) ni ninguna otra función del archivo — el endpoint de n8n recibe el JSON ampliado sin más cambios.

- [ ] **Step 2: Verificar que compila**

Run: `cd "/Volumes/SSD Externo/PROYECTOS/Antigravity/Vinoteca" && npx tsc --noEmit`
Expected: los mismos errores de `src/pages/Stats.tsx` que en la Tarea 2 (todavía no corregido), más un error nuevo en `Stats.tsx` porque el objeto `payload: StatsPayload` que construye `fetchInsight` ya no cumple el tipo (le faltan `totalBotellas`/`valorEstimado`). Confirma que no hay errores en `n8n.ts`.

- [ ] **Step 3: Commit**

```bash
cd "/Volumes/SSD Externo/PROYECTOS/Antigravity/Vinoteca"
git add src/lib/n8n.ts
git commit -m "feat(stats): ampliar StatsPayload con valorEstimado y totalBotellas"
```

---

### Task 4: Rediseñar `src/pages/Stats.tsx`

**Files:**
- Modify: `src/pages/Stats.tsx` (reescritura completa del archivo, 503 líneas actuales)

Este archivo cambia en 5 aspectos respecto al actual, todos aplicados en un único reemplazo completo:
1. Import de `type { StatsData }` desde `../hooks/useStats` y `type { DistribucionEntry }` desde `../lib/statsHelpers`.
2. Nuevo componente `Hero` (valor estimado + botellas, con estado degradado si `valorEstimado === 0`).
3. Nuevo componente `GroupTitle` (encabezados "Tu colección" / "Tu actividad").
4. Nuevo componente `TopBarList` reutilizable (sustituye el bloque de barras que hoy solo usa "Top 5 regiones"; ahora lo reutilizan también uva y bodega).
5. Reordenación del JSX: Hero → tira de métricas compacta (4 en fila) → Insight IA (subido) → grupo "Tu colección" (tipo, top regiones, top uvas, top bodegas, añadas) → grupo "Tu actividad" (evolución de catas). El payload de `fetchInsight` se actualiza para usar `label` en vez de `region` y para incluir los dos campos nuevos.

- [ ] **Step 1: Reemplazar todo el contenido del archivo**

```tsx
import { useEffect, useState, useCallback } from 'react'
import {
  BarChart, Bar, Cell, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid,
  LineChart, Line, Legend,
} from 'recharts'
import Layout from '../components/ui/Layout'
import Spinner from '../components/ui/Spinner'
import { useStats, type StatsData } from '../hooks/useStats'
import { callStatsInsight } from '../lib/n8n'
import type { StatsPayload } from '../lib/n8n'
import type { DistribucionEntry } from '../lib/statsHelpers'
import { theme } from '../constants/theme'

const eur = new Intl.NumberFormat('es-ES', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 })

// ── Skeleton ──────────────────────────────────────────────────────────────────
function Skel({ h = 120 }: { h?: number }) {
  return (
    <div
      className="w-full rounded-xl animate-pulse"
      style={{ height: h, background: theme.colors.surface }}
    />
  )
}

// ── Metric icons ──────────────────────────────────────────────────────────────
function IconWine() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={theme.colors.gold} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" style={{ opacity: 0.7 }}>
      <path d="M8 22h8M12 11v11M5 3h14l-2 7a5 5 0 0 1-10 0L5 3z"/>
    </svg>
  )
}
function IconBook() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={theme.colors.gold} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" style={{ opacity: 0.7 }}>
      <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"/><path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"/>
    </svg>
  )
}
function IconStar() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={theme.colors.gold} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" style={{ opacity: 0.7 }}>
      <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
    </svg>
  )
}
function IconTrophy() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={theme.colors.gold} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" style={{ opacity: 0.7 }}>
      <path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6"/><path d="M18 9h1.5a2.5 2.5 0 0 0 0-5H18"/><path d="M4 22h16"/><path d="M10 14.66V17c0 .55-.47.98-.97 1.21C7.85 18.75 7 20.24 7 22"/><path d="M14 14.66V17c0 .55.47.98.97 1.21C16.15 18.75 17 20.24 17 22"/><path d="M18 2H6v7a6 6 0 0 0 12 0V2z"/>
    </svg>
  )
}

// ── Hero: valor estimado de la bodega ───────────────────────────────────────────
function Hero({ stats }: { stats: StatsData }) {
  const hasValor = stats.valorEstimado > 0
  return (
    <div
      className="relative rounded-2xl p-6 overflow-hidden"
      style={{
        background: `linear-gradient(180deg, ${theme.colors.surface2} 0%, ${theme.colors.surface} 100%)`,
        border: `1px solid ${theme.colors.borderActive}`,
      }}
    >
      <p style={{ fontSize: '0.7rem', letterSpacing: '0.14em', textTransform: 'uppercase', color: theme.colors.gold, opacity: 0.85, marginBottom: 8 }}>
        Valor de tu bodega
      </p>
      {hasValor ? (
        <>
          <div className="text-editorial" style={{ fontFamily: theme.font.serif, fontWeight: 300, fontSize: '3rem', lineHeight: 1, color: theme.colors.cream }}>
            {eur.format(stats.valorEstimado)}
          </div>
          <p style={{ fontSize: theme.font.sm, color: theme.colors.muted, marginTop: 8 }}>
            <span style={{ color: theme.colors.text, fontWeight: 600 }}>{stats.totalBotellas} botellas</span> registradas desde que empezaste tu colección
          </p>
        </>
      ) : (
        <p style={{ fontSize: theme.font.sm, color: theme.colors.muted }}>
          Añade precios a tus vinos para ver el valor de tu bodega
        </p>
      )}
    </div>
  )
}

// ── Metric card (tira secundaria) ───────────────────────────────────────────────
function MetricCard({
  icon,
  value,
  label,
}: {
  icon: React.ReactNode
  value: string
  label: string
}) {
  return (
    <div
      className="flex flex-col items-center justify-center gap-1.5 rounded-xl p-3"
      style={{ background: theme.colors.surface, border: `1px solid ${theme.colors.border}` }}
    >
      {icon}
      <span className="text-editorial font-bold" style={{ fontSize: '1.3rem', color: theme.colors.gold, lineHeight: 1 }}>
        {value}
      </span>
      <span className="text-center" style={{ fontSize: '0.58rem', letterSpacing: '0.06em', textTransform: 'uppercase', color: theme.colors.muted }}>
        {label}
      </span>
    </div>
  )
}

// ── Section wrapper ───────────────────────────────────────────────────────────
function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-3">
      <h2
        style={{
          fontSize: '0.65rem',
          letterSpacing: '0.14em',
          textTransform: 'uppercase',
          color: theme.colors.muted,
          fontWeight: 500,
        }}
      >
        {title}
      </h2>
      {children}
    </div>
  )
}

// ── Group title ("Tu colección" / "Tu actividad") ──────────────────────────────
function GroupTitle({ children }: { children: React.ReactNode }) {
  return (
    <h2
      className="text-editorial"
      style={{ fontFamily: theme.font.serif, fontStyle: 'italic', fontSize: '1.05rem', color: theme.colors.gold, margin: 0 }}
    >
      {children}
    </h2>
  )
}

// ── Top bar list (regiones / uvas / bodegas) ────────────────────────────────────
function TopBarList({ items, emptyLabel }: { items: DistribucionEntry[]; emptyLabel: string }) {
  return (
    <div
      className="rounded-xl p-4 flex flex-col gap-3"
      style={{ background: theme.colors.surface, border: `1px solid ${theme.colors.border}` }}
    >
      {items.length === 0 ? (
        <p style={{ fontSize: theme.font.sm, color: theme.colors.muted }}>{emptyLabel}</p>
      ) : (
        items.map(({ label, count }) => {
          const maxCount = items[0].count
          const pct = Math.round((count / maxCount) * 100)
          return (
            <div key={label} className="flex flex-col gap-1">
              <div className="flex justify-between" style={{ fontSize: theme.font.sm }}>
                <span style={{ color: theme.colors.cream }}>{label}</span>
                <span style={{ color: theme.colors.muted }}>{count}</span>
              </div>
              <div className="w-full rounded-full overflow-hidden" style={{ height: 4, background: theme.colors.border }}>
                <div
                  className="h-full rounded-full"
                  style={{ width: `${pct}%`, background: theme.colors.gold, transition: 'width 0.6s ease' }}
                />
              </div>
            </div>
          )
        })
      )}
    </div>
  )
}

// ── Insight cache ─────────────────────────────────────────────────────────────
const INSIGHT_KEY = 'vinoteca-insight'
const INSIGHT_TTL = 24 * 60 * 60 * 1000

function loadCachedInsight(): string | null {
  try {
    const raw = localStorage.getItem(INSIGHT_KEY)
    if (!raw) return null
    const { text, ts } = JSON.parse(raw) as { text: string; ts: number }
    if (Date.now() - ts > INSIGHT_TTL) return null
    return text
  } catch {
    return null
  }
}

function saveInsight(text: string) {
  localStorage.setItem(INSIGHT_KEY, JSON.stringify({ text, ts: Date.now() }))
}

// ─────────────────────────────────────────────────────────────────────────────

export default function Stats() {
  const { stats, loading, error, refresh } = useStats()

  const [insight,        setInsight]        = useState<string | null>(loadCachedInsight)
  const [insightLoading, setInsightLoading] = useState(false)
  const [insightError,   setInsightError]   = useState<string | null>(null)

  const [pulling,    setPulling]    = useState(false)
  const [pullStartY, setPullStartY] = useState(0)

  useEffect(() => { refresh() }, [refresh])

  const fetchInsight = useCallback(async (force = false) => {
    if (!stats) return
    if (!force) {
      const cached = loadCachedInsight()
      if (cached) { setInsight(cached); return }
    }
    setInsightLoading(true)
    setInsightError(null)
    try {
      const payload: StatsPayload = {
        totalVinos:        stats.totalVinos,
        totalBotellas:     stats.totalBotellas,
        valorEstimado:     stats.valorEstimado,
        totalCatas:        stats.totalCatas,
        puntuacionMedia:   stats.puntuacionMedia ?? 0,
        topRegiones:       stats.topRegiones.map(r => ({ region: r.label, count: r.count })),
        distribucionTipos: stats.distribucionTipos,
        anadas:            stats.distribucionAnadas,
        mejorVino:         stats.mejorVino,
      }
      const { insight: text } = await callStatsInsight(payload)
      setInsight(text)
      saveInsight(text)
    } catch (e) {
      setInsightError(e instanceof Error ? e.message : 'Error al analizar')
    } finally {
      setInsightLoading(false)
    }
  }, [stats])

  function onTouchStart(e: React.TouchEvent) { setPullStartY(e.touches[0].clientY) }
  function onTouchEnd(e: React.TouchEvent) {
    const delta = e.changedTouches[0].clientY - pullStartY
    if (delta > 80 && !loading) { setPulling(true); refresh().finally(() => setPulling(false)) }
  }

  const isEmpty = !loading && stats && stats.totalVinos === 0

  const tipoColor: Record<string, string> = {
    Tinto:            theme.colors.primary,
    Blanco:           '#D4C87A',
    Rosado:           '#C97AA0',
    Espumoso:         '#7ABCC9',
    Dulce:            theme.colors.gold,
    'Sin clasificar': theme.colors.muted,
  }

  const maxDecada = stats
    ? Math.max(...stats.distribucionAnadas.map(d => d.count), 0)
    : 0

  return (
    <Layout>
      <div
        className="flex flex-col gap-6 px-5 pb-28"
        onTouchStart={onTouchStart}
        onTouchEnd={onTouchEnd}
      >
        {/* ── Header editorial ──────────────────────────────────── */}
        <div className="pt-6">
          <div className="flex items-start justify-between">
            <div>
              <p
                style={{
                  fontSize: '0.65rem',
                  letterSpacing: '0.16em',
                  textTransform: 'uppercase',
                  color: theme.colors.muted,
                  marginBottom: 4,
                }}
              >
                Análisis de bodega
              </p>
              <h1
                className="text-editorial"
                style={{ fontSize: theme.font['2xl'], fontWeight: 700, color: theme.colors.cream, lineHeight: 1.1 }}
              >
                Estadísticas
              </h1>
            </div>
            {pulling && <Spinner size={18} />}
          </div>
          <div
            style={{
              height: 1,
              marginTop: 16,
              background: `linear-gradient(to right, ${theme.colors.gold}40, transparent)`,
            }}
          />
        </div>

        {/* Error */}
        {error && (
          <p style={{ fontSize: theme.font.sm, color: '#D32F2F' }}>{error}</p>
        )}

        {/* ── Estado vacío ──────────────────────────────────────── */}
        {isEmpty && (
          <div className="flex flex-col items-center gap-5 py-16 text-center">
            <div className="relative flex items-center justify-center">
              <div
                className="absolute"
                style={{
                  width: 120,
                  height: 120,
                  borderRadius: '50%',
                  background: `radial-gradient(circle, ${theme.colors.gold}10 0%, transparent 70%)`,
                }}
              />
              <svg
                width="52" height="52"
                viewBox="0 0 24 24"
                fill="none"
                stroke={theme.colors.gold}
                strokeWidth="1"
                strokeLinecap="round"
                strokeLinejoin="round"
                style={{ opacity: 0.5 }}
              >
                <line x1="18" y1="20" x2="18" y2="10"/>
                <line x1="12" y1="20" x2="12" y2="4"/>
                <line x1="6" y1="20" x2="6" y2="14"/>
                <line x1="2" y1="20" x2="22" y2="20"/>
              </svg>
            </div>
            <div>
              <p className="text-editorial font-semibold" style={{ fontSize: theme.font.lg, color: theme.colors.cream }}>
                Aún no hay datos
              </p>
              <p style={{ fontSize: theme.font.sm, color: theme.colors.muted, marginTop: 6 }}>
                Añade vinos a tu bodega para ver tus estadísticas
              </p>
            </div>
          </div>
        )}

        {/* ── Hero: valor de la bodega ───────────────────────────── */}
        {!isEmpty && (loading ? <Skel h={140} /> : stats && <Hero stats={stats} />)}

        {/* ── Tira de métricas secundarias ──────────────────────── */}
        {loading ? (
          <div className="grid grid-cols-4 gap-2">
            {Array.from({ length: 4 }).map((_, i) => <Skel key={i} h={90} />)}
          </div>
        ) : stats && !isEmpty ? (
          <div className="grid grid-cols-4 gap-2">
            <MetricCard icon={<IconWine />}  value={String(stats.totalVinos)}  label="Vinos distintos" />
            <MetricCard icon={<IconBook />}  value={String(stats.totalCatas)}  label="Catas" />
            <MetricCard
              icon={<IconStar />}
              value={stats.puntuacionMedia !== null ? stats.puntuacionMedia.toFixed(1) : '—'}
              label="Puntuación media"
            />
            <MetricCard
              icon={<IconTrophy />}
              value={stats.mejorVino ? String(stats.mejorVino.puntuacion) : '—'}
              label={stats.mejorVino ? stats.mejorVino.nombre : 'Mejor puntuado'}
            />
          </div>
        ) : null}

        {/* ── Insight IA (promovido) ────────────────────────────── */}
        {!isEmpty && (
          <Section title="Análisis de tu colección">
            <div
              className="rounded-xl p-4 flex flex-col gap-3"
              style={{ background: theme.colors.surface, border: `1px solid ${theme.colors.gold}40` }}
            >
              <div className="flex items-center gap-2">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={theme.colors.gold} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M12 2a10 10 0 1 0 10 10A10 10 0 0 0 12 2z"/><path d="M12 8v4l3 3"/>
                </svg>
                <span style={{ fontSize: theme.font.sm, fontWeight: 600, color: theme.colors.cream }}>
                  Sommelier IA
                </span>
              </div>

              {insightLoading ? (
                <div className="flex items-center gap-3 py-4">
                  <Spinner size={18} />
                  <p style={{ fontSize: theme.font.sm, color: theme.colors.muted }}>Analizando tu colección…</p>
                </div>
              ) : insight ? (
                <>
                  <p style={{ fontSize: theme.font.sm, color: theme.colors.cream, lineHeight: 1.6 }}>
                    {insight}
                  </p>
                  <button
                    onClick={() => fetchInsight(true)}
                    style={{ fontSize: '0.7rem', color: theme.colors.muted, alignSelf: 'flex-end' }}
                  >
                    Actualizar análisis
                  </button>
                </>
              ) : (
                <>
                  {insightError && (
                    <p style={{ fontSize: '0.75rem', color: '#D32F2F' }}>{insightError}</p>
                  )}
                  <button
                    onClick={() => fetchInsight(false)}
                    disabled={loading || !stats}
                    className="w-full py-3 rounded-xl font-semibold disabled:opacity-50"
                    style={{
                      background: theme.colors.gold,
                      color: theme.colors.dark,
                      fontSize: theme.font.base,
                    }}
                  >
                    Analizar mi colección
                  </button>
                </>
              )}
            </div>
          </Section>
        )}

        {/* ── Grupo: Tu colección ────────────────────────────────── */}
        {!isEmpty && (
          <div className="flex flex-col gap-6">
            <GroupTitle>Tu colección</GroupTitle>

            <Section title="Distribución por tipo">
              {loading ? <Skel h={180} /> : stats && (
                <div
                  className="rounded-xl p-4"
                  style={{ background: theme.colors.surface, border: `1px solid ${theme.colors.border}` }}
                >
                  <ResponsiveContainer width="100%" height={160}>
                    <BarChart
                      data={stats.distribucionTipos}
                      layout="vertical"
                      margin={{ left: 8, right: 24, top: 4, bottom: 4 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" stroke={theme.colors.border} horizontal={false} />
                      <XAxis type="number" tick={{ fill: theme.colors.muted, fontSize: 11 }} axisLine={false} tickLine={false} />
                      <YAxis type="category" dataKey="tipo" tick={{ fill: theme.colors.cream, fontSize: 12 }} axisLine={false} tickLine={false} width={80} />
                      <Tooltip
                        contentStyle={{ background: theme.colors.surface, border: `1px solid ${theme.colors.gold}40`, borderRadius: 8 }}
                        labelStyle={{ color: theme.colors.cream }}
                        itemStyle={{ color: theme.colors.gold }}
                        cursor={{ fill: theme.colors.border }}
                      />
                      <Bar dataKey="count" radius={[0, 4, 4, 0]}>
                        {stats.distribucionTipos.map((entry) => (
                          <Cell key={entry.tipo} fill={tipoColor[entry.tipo] ?? theme.colors.primary} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              )}
            </Section>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Section title="Top 5 regiones">
                {loading ? <Skel h={180} /> : stats && (
                  <TopBarList items={stats.topRegiones} emptyLabel="Sin datos de región" />
                )}
              </Section>

              <Section title="Top uvas">
                {loading ? <Skel h={180} /> : stats && (
                  <TopBarList items={stats.distribucionUva} emptyLabel="Sin datos de uva" />
                )}
              </Section>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Section title="Top bodegas">
                {loading ? <Skel h={180} /> : stats && (
                  <TopBarList items={stats.distribucionBodega} emptyLabel="Sin datos de bodega" />
                )}
              </Section>

              <Section title="Distribución por añadas">
                {loading ? <Skel h={180} /> : stats && (
                  <div
                    className="rounded-xl p-4"
                    style={{ background: theme.colors.surface, border: `1px solid ${theme.colors.border}` }}
                  >
                    <ResponsiveContainer width="100%" height={160}>
                      <BarChart
                        data={stats.distribucionAnadas}
                        margin={{ left: 0, right: 0, top: 4, bottom: 4 }}
                      >
                        <CartesianGrid strokeDasharray="3 3" stroke={theme.colors.border} vertical={false} />
                        <XAxis dataKey="decada" tick={{ fill: theme.colors.muted, fontSize: 11 }} axisLine={false} tickLine={false} />
                        <YAxis allowDecimals={false} tick={{ fill: theme.colors.muted, fontSize: 11 }} axisLine={false} tickLine={false} />
                        <Tooltip
                          contentStyle={{ background: theme.colors.surface, border: `1px solid ${theme.colors.gold}40`, borderRadius: 8 }}
                          labelStyle={{ color: theme.colors.cream }}
                          itemStyle={{ color: theme.colors.gold }}
                          cursor={{ fill: theme.colors.border }}
                        />
                        <Bar dataKey="count" radius={[4, 4, 0, 0]} stroke={theme.colors.gold} strokeWidth={1}>
                          {stats.distribucionAnadas.map((entry) => (
                            <Cell
                              key={entry.decada}
                              fill={entry.count === maxDecada ? theme.colors.gold : theme.colors.surface2}
                            />
                          ))}
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                )}
              </Section>
            </div>
          </div>
        )}

        {/* ── Grupo: Tu actividad ────────────────────────────────── */}
        {!isEmpty && (
          <div className="flex flex-col gap-6">
            <GroupTitle>Tu actividad</GroupTitle>

            <Section title="Evolución de catas (6 meses)">
              {loading ? <Skel h={180} /> : stats && (
                <div
                  className="rounded-xl p-4"
                  style={{ background: theme.colors.surface, border: `1px solid ${theme.colors.border}` }}
                >
                  {stats.totalCatas === 0 ? (
                    <p className="text-center py-8" style={{ fontSize: theme.font.sm, color: theme.colors.muted }}>
                      Aún no hay catas registradas
                    </p>
                  ) : (
                    <ResponsiveContainer width="100%" height={160}>
                      <LineChart data={stats.evolucionCatas} margin={{ left: 0, right: 16, top: 4, bottom: 4 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke={theme.colors.border} />
                        <XAxis dataKey="mes" tick={{ fill: theme.colors.muted, fontSize: 11 }} axisLine={false} tickLine={false} />
                        <YAxis yAxisId="left"  allowDecimals={false} tick={{ fill: theme.colors.gold,    fontSize: 11 }} axisLine={false} tickLine={false} />
                        <YAxis yAxisId="right" orientation="right"   tick={{ fill: theme.colors.primary, fontSize: 11 }} axisLine={false} tickLine={false} domain={[0, 100]} />
                        <Tooltip
                          contentStyle={{ background: theme.colors.surface, border: `1px solid ${theme.colors.gold}40`, borderRadius: 8 }}
                          labelStyle={{ color: theme.colors.cream }}
                        />
                        <Legend wrapperStyle={{ fontSize: 11, color: theme.colors.muted }} />
                        <Line yAxisId="left"  type="monotone" dataKey="cantidad"    name="Catas"             stroke={theme.colors.gold}    strokeWidth={2} dot={{ fill: theme.colors.gold,    r: 3 }} activeDot={{ r: 5 }} />
                        <Line yAxisId="right" type="monotone" dataKey="mediaScore"  name="Puntuación media"  stroke={theme.colors.primary}  strokeWidth={2} dot={{ fill: theme.colors.primary,  r: 3 }} connectNulls={false} activeDot={{ r: 5 }} />
                      </LineChart>
                    </ResponsiveContainer>
                  )}
                </div>
              )}
            </Section>
          </div>
        )}
      </div>
    </Layout>
  )
}
```

- [ ] **Step 2: Verificar que compila sin errores**

Run: `cd "/Volumes/SSD Externo/PROYECTOS/Antigravity/Vinoteca" && npx tsc --noEmit`
Expected: sin salida (sin errores). Todos los errores intermedios de las Tareas 2 y 3 quedan resueltos.

- [ ] **Step 3: Commit**

```bash
cd "/Volumes/SSD Externo/PROYECTOS/Antigravity/Vinoteca"
git add src/pages/Stats.tsx
git commit -m "feat(stats): rediseñar Stats.tsx con hero de valor, insight promovido y top uva/bodega"
```

---

### Task 5: Verificación manual y cierre de la fase

**Files:**
- Modify: `docs/roadmap.md` (marcar Fase 9 como completada)
- Modify: `docs/roadmap/fase-09-estadisticas.md` (rellenar Funcionalidades/Decisiones, marcar Estado)

- [ ] **Step 1: Arrancar el servidor de desarrollo**

Run: `cd "/Volumes/SSD Externo/PROYECTOS/Antigravity/Vinoteca" && npm run dev`
Expected: arranca sin errores en `http://localhost:5173`.

- [ ] **Step 2: Probar manualmente `/stats` con datos**

Con una cuenta que tenga vinos con `precio`, `num_botellas`, `uva` y `bodega` variados (y alguna cata registrada), navega a `/stats` y confirma:
- El hero muestra un valor en euros con formato `1.234 €` (sin decimales) y el número de botellas.
- La tira de 4 métricas se ve en una fila sin desbordar en móvil.
- La tarjeta de "Sommelier IA" aparece justo debajo de las métricas, antes de "Tu colección".
- "Top uvas" y "Top bodegas" muestran barras de progreso igual que "Top 5 regiones" (mismo estilo, con las variedades/bodegas reales de la cuenta).
- Pulsa "Analizar mi colección" y confirma que la llamada a n8n no falla (revisa la consola del navegador si hay error de red/CORS — en ese caso el problema es del endpoint n8n, no del código de este plan).

- [ ] **Step 3: Probar el estado vacío**

Con una cuenta sin vinos (o creando una nueva cuenta de prueba), navega a `/stats` y confirma que sigue mostrando "Aún no hay datos" sin que el Hero ni las métricas rompan nada (no debe aparecer un hero con "0 €" ni errores en consola).

- [ ] **Step 4: Actualizar el roadmap**

En `docs/roadmap.md`, mueve la fila de la Fase 9 de la tabla "Pendientes" a "Completadas":

```markdown
| ✅ Fase 9 | Estadísticas | [fase-09-estadisticas.md](roadmap/fase-09-estadisticas.md) |
```

(elimínala de la tabla "Pendientes" correspondientemente).

En `docs/roadmap/fase-09-estadisticas.md`, cambia la línea 5 de `⬜ Pendiente` a `✅ Completada`, y rellena la sección "Funcionalidades" (línea 26-30) y "Decisiones de diseño" (línea 34-36) con un resumen breve apuntando a `docs/superpowers/specs/2026-07-18-estadisticas-fase9-design.md` como referencia completa, en vez de dejarlas con "(Por definir...)".

- [ ] **Step 5: Commit final**

```bash
cd "/Volumes/SSD Externo/PROYECTOS/Antigravity/Vinoteca"
git add docs/roadmap.md docs/roadmap/fase-09-estadisticas.md
git commit -m "docs: cerrar Fase 9 — Estadísticas en el roadmap"
git push origin master
```
