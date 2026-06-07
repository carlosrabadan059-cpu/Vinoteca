import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import Layout from '../components/ui/Layout'
import TastingCard from '../components/wine/TastingCard'
import Button from '../components/ui/Button'
import { useTastings } from '../hooks/useTastings'
import { useWines } from '../hooks/useWines'
import { theme } from '../constants/theme'
import type { Tasting, Wine } from '../types'

type Filter = 'all' | 'week' | 'month' | 'top'

const FILTERS: { id: Filter; label: string }[] = [
  { id: 'all',   label: 'Todas' },
  { id: 'week',  label: 'Esta semana' },
  { id: 'month', label: 'Este mes' },
  { id: 'top',   label: 'Mejor puntuadas' },
]

function applyFilter(tastings: Tasting[], filter: Filter): Tasting[] {
  const now = new Date()
  if (filter === 'week') {
    const week = new Date(now)
    week.setDate(now.getDate() - 7)
    return tastings.filter(t => new Date(t.fecha) >= week)
  }
  if (filter === 'month') {
    const month = new Date(now)
    month.setDate(now.getDate() - 30)
    return tastings.filter(t => new Date(t.fecha) >= month)
  }
  if (filter === 'top') {
    return [...tastings].sort((a, b) => (b.puntuacion ?? 0) - (a.puntuacion ?? 0))
  }
  return tastings
}

export default function Catas() {
  const navigate = useNavigate()
  const [filter,    setFilter]    = useState<Filter>('all')
  const [wineMap,   setWineMap]   = useState<Record<string, Wine>>({})

  const { tastings, loading, listTastings } = useTastings()
  const { getWine } = useWines()

  useEffect(() => {
    listTastings().catch(() => null)
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  // Cargar nombres de vinos para las cards
  useEffect(() => {
    const missing = tastings.filter(t => !wineMap[t.wine_id])
    if (!missing.length) return

    const uniqueIds = [...new Set(missing.map(t => t.wine_id))]
    uniqueIds.forEach(id => {
      getWine(id).then(w => {
        if (w) setWineMap(prev => ({ ...prev, [id]: w }))
      })
    })
  }, [tastings]) // eslint-disable-line react-hooks/exhaustive-deps

  const visible = applyFilter(tastings, filter)

  return (
    <Layout>
      {/* Header */}
      <div className="flex items-center justify-between px-4 pt-5 pb-3">
        <div className="flex items-center gap-2">
          <h1 className="font-bold" style={{ color: theme.colors.gold, fontSize: theme.font['2xl'] }}>
            Mis Catas
          </h1>
          {tastings.length > 0 && (
            <span
              className="px-2 py-0.5 rounded-full text-xs font-bold"
              style={{ background: theme.colors.surface, color: theme.colors.muted }}
            >
              {tastings.length}
            </span>
          )}
        </div>
        <button
          onClick={() => navigate('/catas/nueva')}
          className="w-9 h-9 rounded-full flex items-center justify-center text-xl"
          style={{ background: theme.colors.primary }}
        >
          <span style={{ color: theme.colors.cream, fontSize: '1.25rem', lineHeight: 1 }}>+</span>
        </button>
      </div>

      {/* Filtros */}
      <div className="flex gap-2 px-4 pb-3 overflow-x-auto" style={{ scrollbarWidth: 'none' }}>
        {FILTERS.map(f => (
          <button
            key={f.id}
            onClick={() => setFilter(f.id)}
            className="flex-shrink-0 px-3 py-1.5 rounded-full text-sm font-medium transition-colors"
            style={{
              background: filter === f.id ? theme.colors.gold : theme.colors.surface,
              color:      filter === f.id ? theme.colors.dark  : theme.colors.muted,
              border:     `1px solid ${filter === f.id ? theme.colors.gold : '#3A2A2E'}`,
            }}
          >
            {f.label}
          </button>
        ))}
      </div>

      <div className="px-4 pb-24 flex flex-col gap-3">
        {loading ? (
          // Skeleton
          Array.from({ length: 4 }).map((_, i) => (
            <div
              key={i}
              className="h-20 rounded-xl animate-pulse"
              style={{ background: theme.colors.surface }}
            />
          ))
        ) : visible.length === 0 ? (
          // Estado vacío
          <div className="flex flex-col items-center gap-4 py-20 text-center">
            <span style={{ fontSize: '3.5rem' }}>🍷</span>
            <p className="font-semibold" style={{ color: theme.colors.cream }}>
              {filter === 'all'
                ? 'Aún no has registrado ninguna cata'
                : 'No hay catas para este período'}
            </p>
            {filter === 'all' && (
              <Button onClick={() => navigate('/catas/nueva')}>
                Registrar tu primera cata
              </Button>
            )}
          </div>
        ) : (
          visible.map(t => (
            <TastingCard
              key={t.id}
              tasting={t}
              wineName={wineMap[t.wine_id]?.nombre ?? '—'}
              onClick={() => navigate(`/catas/${t.id}`)}
            />
          ))
        )}
      </div>
    </Layout>
  )
}
