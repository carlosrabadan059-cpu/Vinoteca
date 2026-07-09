import Layout from '../components/ui/Layout'
import TastingCard from '../components/wine/TastingCard'
import { useCatasState } from '../hooks/useCatasState'
import { FILTERS } from '../lib/catasHelpers'
import { theme } from '../constants/theme'

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
  const s = useCatasState()
  const t = theme

  return (
    <Layout>
      {/* ── Header editorial ──────────────────────────────────── */}
      <div className="px-5 pt-6 pb-4">
        {s.wineIdFilter && (
          <button
            onClick={() => s.navigate(-1)}
            style={{ fontSize: t.font.sm, color: t.colors.gold, background: 'none', border: 'none', cursor: 'pointer', padding: '0 0 12px', display: 'block' }}
          >
            ← Volver al vino
          </button>
        )}
        <div className="flex items-start justify-between">
          <div>
            <p style={{ fontSize: t.font['2xs'], letterSpacing: '0.16em', textTransform: 'uppercase', color: t.colors.muted, marginBottom: 4 }}>
              {s.wineIdFilter ? 'Historial de catas' : 'Diario de cata'}
            </p>
            <h1 className="text-editorial" style={{ fontSize: t.font['2xl'], fontWeight: 700, color: t.colors.cream, lineHeight: 1.1 }}>
              {s.wineTitle ?? 'Mis Catas'}
              {s.filtered.length > 0 && (
                <span className="ml-2" style={{ fontSize: t.font.sm, fontWeight: 500, color: t.colors.muted, verticalAlign: 'middle' }}>
                  {s.filtered.length}
                </span>
              )}
            </h1>
          </div>

          {!s.wineIdFilter && (
            <button
              onClick={() => s.navigate('/catas/nueva')}
              className="flex items-center justify-center rounded-full shrink-0"
              style={{ width: 42, height: 42, background: t.colors.primary, boxShadow: `0 4px 20px ${t.colors.primary}50` }}
              aria-label="Nueva cata"
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={t.colors.cream} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
              </svg>
            </button>
          )}
        </div>

        <div style={{ height: 1, marginTop: 16, background: `linear-gradient(to right, ${t.colors.gold}40, transparent)` }} />
      </div>

      {/* ── Filtros ───────────────────────────────────────────── */}
      <div className="flex gap-2 px-5 pb-4 overflow-x-auto" style={{ scrollbarWidth: 'none' }}>
        {FILTERS.map(f => (
          <button
            key={f.id}
            onClick={() => s.setFilter(f.id)}
            className="flex-shrink-0 px-3 py-1.5 rounded-full font-medium transition-all"
            style={{
              fontSize:   t.font.sm,
              letterSpacing: '0.04em',
              background: s.filter === f.id ? t.colors.gold      : 'transparent',
              color:      s.filter === f.id ? t.colors.dark       : t.colors.muted,
              border:     `1px solid ${s.filter === f.id ? t.colors.gold : t.colors.border}`,
            }}
          >
            {f.label}
          </button>
        ))}
      </div>

      {/* ── Contenido ─────────────────────────────────────────── */}
      <div className="px-5 pb-28 flex flex-col gap-3">
        {s.loading ? (
          Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-20 rounded-xl animate-pulse" style={{ background: t.colors.surface }} />
          ))
        ) : s.visible.length === 0 ? (
          <div className="flex flex-col items-center gap-5 py-16 text-center">
            <div className="relative flex items-center justify-center">
              <div className="absolute" style={{ width: 120, height: 120, borderRadius: '50%', background: `radial-gradient(circle, ${t.colors.primary}18 0%, transparent 70%)` }} />
              <WineGlassSVG />
            </div>
            <div>
              <p className="text-editorial font-semibold" style={{ fontSize: t.font.lg, color: t.colors.cream }}>
                {s.wineIdFilter
                  ? 'Este vino no tiene catas registradas'
                  : s.filter === 'all'
                    ? 'Aún no has registrado ninguna cata'
                    : 'No hay catas para este período'}
              </p>
              {!s.wineIdFilter && s.filter === 'all' && (
                <p style={{ fontSize: t.font.sm, color: t.colors.muted, marginTop: 6 }}>
                  Cada copa tiene una historia — empieza a contarla
                </p>
              )}
            </div>
            {s.filter === 'all' && (
              <button
                onClick={() => s.navigate(s.newCataHref)}
                className="px-6 py-3 rounded-xl font-semibold"
                style={{ background: t.colors.primary, color: t.colors.cream, fontSize: t.font.base, boxShadow: `0 4px 24px ${t.colors.primary}40` }}
              >
                {s.wineIdFilter ? 'Registrar una cata' : 'Registrar tu primera cata'}
              </button>
            )}
          </div>
        ) : (
          s.visible.map(tasting => (
            <TastingCard
              key={tasting.id}
              tasting={tasting}
              wineName={s.wineMap[tasting.wine_id]?.nombre ?? '—'}
              onClick={() => s.navigate(`/catas/${tasting.id}`)}
            />
          ))
        )}
      </div>
    </Layout>
  )
}
