import Layout from '../components/ui/Layout'
import TastingCard from '../components/wine/TastingCard'
import { useCatasState } from '../hooks/useCatasState'
import { FILTERS } from '../lib/catasHelpers'
import { JOURNAL_TIPOS, isInCellar } from '../lib/cuadernoHelpers'
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

const selectStyle: React.CSSProperties = {
  background: theme.colors.surface, color: theme.colors.cream, fontSize: theme.font.sm,
  border: `1px solid ${theme.colors.borderSubtle}`, borderRadius: theme.radius.md,
  padding: '8px 10px', outline: 'none', minWidth: 0,
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
              {s.wineTitle ?? 'Mi cuaderno'}
              {s.filtered.length > 0 && (
                <span className="ml-2" style={{ fontSize: t.font.sm, fontWeight: 500, color: t.colors.muted, verticalAlign: 'middle' }}>
                  {s.filtered.length}
                </span>
              )}
            </h1>
          </div>

          {!s.wineIdFilter && (
            <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={() => s.navigate('/glosario')}
              className="flex items-center justify-center rounded-full shrink-0"
              style={{ width: 42, height: 42, background: t.colors.surface, border: `1px solid ${t.colors.borderSubtle}`, fontSize: t.font.lg }}
              aria-label="Mi glosario"
              title="Mi glosario"
            >
              📖
            </button>
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
            </div>
          )}
        </div>

        <div style={{ height: 1, marginTop: 16, background: `linear-gradient(to right, ${t.colors.gold}40, transparent)` }} />
      </div>

      {/* ── Índice del cuaderno: pestañas por tipo ─────────────── */}
      {!s.wineIdFilter && (
        <div className="flex px-5 overflow-x-auto" style={{ scrollbarWidth: 'none', borderBottom: `1px solid ${t.colors.border}` }} role="tablist" aria-label="Índice por tipo">
          {JOURNAL_TIPOS.map(tipo => {
            const active = s.journal.tipo === tipo
            return (
              <button
                key={tipo}
                role="tab"
                aria-selected={active}
                onClick={() => s.setJournal({ ...s.journal, tipo })}
                className="flex-shrink-0 px-3 py-2"
                style={{
                  fontSize: t.font.sm, fontWeight: active ? 700 : 500, letterSpacing: '0.04em',
                  color: active ? t.colors.gold : t.colors.muted, background: 'none', border: 'none',
                  borderBottom: `2px solid ${active ? t.colors.gold : 'transparent'}`, marginBottom: -1, cursor: 'pointer',
                }}
              >
                {tipo}
              </button>
            )
          })}
        </div>
      )}

      {/* ── Búsqueda + región / uva ───────────────────────────── */}
      {!s.wineIdFilter && (
        <div className="flex flex-col gap-2 px-5 pt-3 pb-3">
          <input
            type="search"
            value={s.journal.query}
            onChange={e => s.setJournal({ ...s.journal, query: e.target.value })}
            placeholder="Buscar vino, bodega, lugar, con quién…"
            aria-label="Buscar en el cuaderno"
            style={{ ...selectStyle, width: '100%' }}
          />
          {(s.facets.regiones.length > 0 || s.facets.uvas.length > 0) && (
            <div className="flex gap-2">
              <select
                value={s.journal.region ?? ''}
                onChange={e => s.setJournal({ ...s.journal, region: e.target.value || null })}
                aria-label="Filtrar por región"
                style={{ ...selectStyle, flex: 1 }}
              >
                <option value="">Todas las regiones</option>
                {s.facets.regiones.map(r => <option key={r} value={r}>{r}</option>)}
              </select>
              <select
                value={s.journal.uva ?? ''}
                onChange={e => s.setJournal({ ...s.journal, uva: e.target.value || null })}
                aria-label="Filtrar por uva"
                style={{ ...selectStyle, flex: 1 }}
              >
                <option value="">Todas las uvas</option>
                {s.facets.uvas.map(u => <option key={u} value={u}>{u}</option>)}
              </select>
            </div>
          )}
        </div>
      )}

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
                  : s.filter === 'all' && s.journal.tipo === 'Todos' && !s.journal.region && !s.journal.uva && !s.journal.query
                    ? 'Tu cuaderno está en blanco'
                    : 'No hay catas con estos filtros'}
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
              fromOutside={!!s.wineMap[tasting.wine_id] && !isInCellar(s.wineMap[tasting.wine_id])}
              onClick={() => s.navigate(`/catas/${tasting.id}`)}
            />
          ))
        )}
      </div>
    </Layout>
  )
}
