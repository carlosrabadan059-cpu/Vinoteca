import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import Layout from '../components/ui/Layout'
import TastingCard from '../components/wine/TastingCard'
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

function WineGlassSVG() {
  return (
    <svg
      width="64" height="64"
      viewBox="0 0 24 24"
      fill="none"
      stroke={theme.colors.primary}
      strokeWidth="1"
      strokeLinecap="round"
      strokeLinejoin="round"
      style={{ opacity: 0.6 }}
    >
      <path d="M8 22h8M12 11v11M5 3h14l-2 7a5 5 0 0 1-10 0L5 3z"/>
    </svg>
  )
}

export default function Catas() {
  const navigate = useNavigate()
  const [filter,  setFilter]  = useState<Filter>('all')
  const [wineMap, setWineMap] = useState<Record<string, Wine>>({})

  const { tastings, loading, listTastings } = useTastings()
  const { getWine } = useWines()

  useEffect(() => {
    listTastings().catch(() => null)
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

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
      {/* ── Header editorial ──────────────────────────────────── */}
      <div className="px-5 pt-6 pb-4">
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
              Diario de cata
            </p>
            <h1
              className="text-editorial"
              style={{ fontSize: theme.font['2xl'], fontWeight: 700, color: theme.colors.cream, lineHeight: 1.1 }}
            >
              Mis Catas
              {tastings.length > 0 && (
                <span
                  className="ml-2"
                  style={{
                    fontSize: '0.75rem',
                    fontWeight: 500,
                    color: theme.colors.muted,
                    verticalAlign: 'middle',
                  }}
                >
                  {tastings.length}
                </span>
              )}
            </h1>
          </div>

          {/* Nueva cata FAB */}
          <button
            onClick={() => navigate('/catas/nueva')}
            className="flex items-center justify-center rounded-full shrink-0"
            style={{
              width: 42,
              height: 42,
              background: theme.colors.primary,
              boxShadow: `0 4px 20px ${theme.colors.primary}50`,
            }}
            aria-label="Nueva cata"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={theme.colors.cream} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
            </svg>
          </button>
        </div>

        {/* Divisor dorado */}
        <div
          style={{
            height: 1,
            marginTop: 16,
            background: `linear-gradient(to right, ${theme.colors.gold}40, transparent)`,
          }}
        />
      </div>

      {/* ── Filtros ───────────────────────────────────────────── */}
      <div className="flex gap-2 px-5 pb-4 overflow-x-auto" style={{ scrollbarWidth: 'none' }}>
        {FILTERS.map(f => (
          <button
            key={f.id}
            onClick={() => setFilter(f.id)}
            className="flex-shrink-0 px-3 py-1.5 rounded-full font-medium transition-all"
            style={{
              fontSize: '0.75rem',
              letterSpacing: '0.04em',
              background: filter === f.id ? theme.colors.gold : 'transparent',
              color:      filter === f.id ? theme.colors.dark  : theme.colors.muted,
              border:     `1px solid ${filter === f.id ? theme.colors.gold : theme.colors.border}`,
            }}
          >
            {f.label}
          </button>
        ))}
      </div>

      {/* ── Content ───────────────────────────────────────────── */}
      <div className="px-5 pb-28 flex flex-col gap-3">
        {loading ? (
          Array.from({ length: 4 }).map((_, i) => (
            <div
              key={i}
              className="h-20 rounded-xl animate-pulse"
              style={{ background: theme.colors.surface }}
            />
          ))
        ) : visible.length === 0 ? (
          // ── Estado vacío editorial ──────────────────────────
          <div className="flex flex-col items-center gap-5 py-16 text-center">
            {/* Decorative arc + glass */}
            <div className="relative flex items-center justify-center">
              <div
                className="absolute"
                style={{
                  width: 120,
                  height: 120,
                  borderRadius: '50%',
                  background: `radial-gradient(circle, ${theme.colors.primary}18 0%, transparent 70%)`,
                }}
              />
              <WineGlassSVG />
            </div>

            <div>
              <p
                className="text-editorial font-semibold"
                style={{ fontSize: theme.font.lg, color: theme.colors.cream }}
              >
                {filter === 'all'
                  ? 'Aún no has registrado ninguna cata'
                  : 'No hay catas para este período'}
              </p>
              {filter === 'all' && (
                <p style={{ fontSize: theme.font.sm, color: theme.colors.muted, marginTop: 6 }}>
                  Cada copa tiene una historia — empieza a contarla
                </p>
              )}
            </div>

            {filter === 'all' && (
              <button
                onClick={() => navigate('/catas/nueva')}
                className="px-6 py-3 rounded-xl font-semibold"
                style={{
                  background: theme.colors.primary,
                  color: theme.colors.cream,
                  fontSize: theme.font.base,
                  boxShadow: `0 4px 24px ${theme.colors.primary}40`,
                }}
              >
                Registrar tu primera cata
              </button>
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
