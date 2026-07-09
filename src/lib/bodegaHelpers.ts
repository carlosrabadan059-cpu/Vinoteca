import type { Wine } from '../types'
import type { SortKey } from '../hooks/useWines'

// ── Tipos locales de la vista Bodega ─────────────────────────────────────────

export type GroupKey = 'bodega' | 'region' | 'denominacion' | 'anada' | 'tipo' | 'ubicacion'

export interface Suggestion {
  emoji: string
  typeLabel: 'VINO' | 'BODEGA' | 'REGIÓN' | 'D.O.'
  label: string
  field: 'nombre' | 'bodega' | 'region' | 'denominacion'
  value: string
}

// ── Constantes de presentación ────────────────────────────────────────────────

export const TIPOS = ['Tinto', 'Blanco', 'Rosado', 'Espumoso', 'Dulce'] as const

export const SORT_OPTIONS: { key: SortKey; label: string }[] = [
  { key: 'created_at_desc',   label: 'Añadidos recientemente' },
  { key: 'nombre_asc',        label: 'Nombre A–Z' },
  { key: 'bodega_asc',        label: 'Bodega A–Z' },
  { key: 'anada_asc',         label: 'Añada ↑ (más antiguo)' },
  { key: 'anada_desc',        label: 'Añada ↓ (más reciente)' },
  { key: 'precio_desc',       label: 'Precio ↓' },
  { key: 'num_botellas_desc', label: 'Stock ↓' },
]

export const GROUP_OPTIONS: { key: GroupKey; label: string }[] = [
  { key: 'bodega',       label: 'Bodega' },
  { key: 'region',       label: 'D.O. + Región' },
  { key: 'denominacion', label: 'Denominación' },
  { key: 'anada',        label: 'Añada' },
  { key: 'tipo',         label: 'Tipo' },
  { key: 'ubicacion',    label: 'Ubicación' },
]

// ── Funciones puras ───────────────────────────────────────────────────────────

export function unique<T>(arr: T[]): T[] {
  return Array.from(new Set(arr))
}

export function getSuggestions(query: string, wines: Wine[]): Suggestion[] {
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

export function groupWines(
  wines: Wine[],
  key: GroupKey,
): { label: string; wines: Wine[] }[] {
  const map = new Map<string, Wine[]>()
  for (const w of wines) {
    const raw = w[key]
    const label = raw !== null && raw !== undefined ? String(raw) : '(sin valor)'
    if (!map.has(label)) map.set(label, [])
    map.get(label)!.push(w)
  }
  return Array.from(map.entries()).map(([label, wines]) => ({ label, wines }))
}
