import type { Tasting } from '../types'

export type FilterKey = 'all' | 'week' | 'month' | 'top' | 'rapido'

export const FILTERS: { id: FilterKey; label: string }[] = [
  { id: 'all',    label: 'Todas' },
  { id: 'week',   label: 'Esta semana' },
  { id: 'month',  label: 'Este mes' },
  { id: 'top',    label: 'Mejor puntuadas' },
  { id: 'rapido', label: '⚡ Rápidas' },
]

export function applyFilter(tastings: Tasting[], filter: FilterKey): Tasting[] {
  const now = new Date()
  if (filter === 'week') {
    const cutoff = new Date(now)
    cutoff.setDate(now.getDate() - 7)
    return tastings.filter(t => new Date(t.fecha) >= cutoff)
  }
  if (filter === 'month') {
    const cutoff = new Date(now)
    cutoff.setDate(now.getDate() - 30)
    return tastings.filter(t => new Date(t.fecha) >= cutoff)
  }
  if (filter === 'top') {
    return [...tastings].sort((a, b) => (b.puntuacion ?? 0) - (a.puntuacion ?? 0))
  }
  if (filter === 'rapido') {
    return tastings.filter(t => t.es_consumo_rapido)
  }
  return tastings
}
