import { type CSSProperties } from 'react'
import { useNavigate } from 'react-router-dom'
import Layout from '../components/ui/Layout'
import WineCardGrid from '../components/wine/WineCardGrid'
import WineCardList from '../components/wine/WineCardList'
import theme from '../constants/theme'
import { useBodegaState } from '../hooks/useBodegaState'
import { TIPOS, SORT_OPTIONS, GROUP_OPTIONS } from '../lib/bodegaHelpers'
import type { Wine } from '../types'

const t = theme

// ── Componentes auxiliares de filtros ─────────────────────────────────────────

function FilterSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div style={{ marginBottom: 32 }}>
      <div style={{ marginBottom: 10, paddingBottom: 8, borderBottom: `1px solid ${t.colors.border}` }}>
        <span style={{ ...t.typography.sectionTitle, textTransform: 'uppercase', color: t.colors.cream }}>
          {title}
        </span>
      </div>
      {children}
    </div>
  )
}

function FilterChip({ label, active, onClick }: { label: string; active: boolean; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      style={{
        padding: '5px 13px',
        borderRadius: t.radius.pill,
        fontFamily: t.typography.chipLabel.fontFamily,
        fontSize: t.typography.chipLabel.fontSize,
        fontWeight: active ? 600 : 400,
        border: `1px solid ${active ? t.colors.primaryBorder : t.colors.border}`,
        background: active ? t.colors.primary : 'transparent',
        color: active ? t.colors.cream : t.colors.muted,
        cursor: 'pointer',
      }}
    >
      {label}
    </button>
  )
}

// ── Helpers de render ─────────────────────────────────────────────────────────

const shimmerStyle: CSSProperties = {
  background: t.gradients.shimmer,
  backgroundSize: '200% 100%',
  animation: `shimmer ${t.animation.durationSkeleton} ease-in-out infinite`,
  borderRadius: t.radius.sm,
}

function renderCards(list: Wine[], view: 'grid' | 'list', startIndex: number, onClickWine: (id: string) => void) {
  if (view === 'grid') {
    return (
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
        {list.map((w, i) => (
          <WineCardGrid key={w.id} wine={w} index={startIndex + i} onClick={() => onClickWine(w.id)} />
        ))}
      </div>
    )
  }
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      {list.map((w, i) => (
        <WineCardList key={w.id} wine={w} index={startIndex + i} onClick={() => onClickWine(w.id)} />
      ))}
    </div>
  )
}

// ── Componente principal ──────────────────────────────────────────────────────

export default function Bodega() {
  const navigate = useNavigate()
  const s = useBodegaState()

  const onClickWine = (id: string) => navigate(`/bodega/${id}`)

  return (
    <Layout>
      {/* Fondo glow */}
      <div style={{
        position: 'fixed', inset: 0, pointerEvents: 'none', zIndex: t.zIndex.bg,
        background: t.gradients.bgGlow,
      }} />

      <div style={{ position: 'relative', zIndex: t.zIndex.content }}>

        {/* ── HEADER STICKY ──────────────────────────────────────────────────── */}
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
              <button
                onClick={() => { s.setSearchOpen(!s.searchOpen); s.setFilterPanelOpen(false) }}
                style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '4px 2px',
                  color: s.searchOpen ? t.colors.gold : '#9A7E82' }}
                aria-label="Buscar"
              >
                <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/>
                </svg>
              </button>
              <button
                onClick={() => { s.setFilterPanelOpen(o => !o); s.setSearchOpen(false) }}
                style={{ position: 'relative', background: 'none', border: 'none', cursor: 'pointer', padding: '4px 2px',
                  color: s.filterPanelOpen ? t.colors.gold : '#9A7E82' }}
                aria-label="Filtros y orden"
              >
                <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="21" y1="6" x2="3" y2="6"/><line x1="15" y1="12" x2="9" y2="12"/><line x1="17" y1="18" x2="7" y2="18"/>
                </svg>
                {s.hasActiveFilters && (
                  <span style={{ position: 'absolute', top: 2, right: 0, width: 6, height: 6, borderRadius: '50%', background: t.colors.primary }} />
                )}
              </button>
            </div>
          </div>

          {/* Fila 2: stats */}
          {!s.searchOpen && (
            <div style={{
              display: 'flex', gap: 20, alignItems: 'flex-start',
              marginBottom: 14, paddingBottom: 12, borderBottom: `1px solid ${t.colors.border}`,
            }}>
              {s.loading ? (
                [48, 56, 52].map((w, i) => (
                  <div key={i} style={{ ...shimmerStyle, width: w, height: 38 }} />
                ))
              ) : (
                [
                  { num: s.total,         label: 'Vinos'    },
                  { num: s.totalBotellas, label: 'Botellas' },
                  { num: s.totalBodegas,  label: 'Bodegas'  },
                ].map(({ num, label }) => (
                  <div key={label} style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', gap: 1 }}>
                    <span style={{ ...t.typography.statNumber, color: t.colors.cream, animation: 'countUp 0.4s ease both' }}>
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
          {!s.searchOpen && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, paddingBottom: 8, overflowX: 'auto', scrollbarWidth: 'none' } as CSSProperties}>
              <button
                onClick={() => { s.setTipoFilter(null); s.setFavoritoFilter(false); s.setStockFilter(false) }}
                style={{
                  flexShrink: 0, padding: '5px 13px', borderRadius: t.radius.pill,
                  fontFamily: t.typography.chipLabel.fontFamily,
                  fontSize: t.typography.chipLabel.fontSize,
                  fontWeight: !s.tipoFilter && !s.favoritoFilter && !s.stockFilter ? 600 : 400,
                  border: `1px solid ${!s.tipoFilter && !s.favoritoFilter && !s.stockFilter ? t.colors.primaryBorder : t.colors.border}`,
                  background: !s.tipoFilter && !s.favoritoFilter && !s.stockFilter ? t.colors.primary : 'transparent',
                  color: !s.tipoFilter && !s.favoritoFilter && !s.stockFilter ? t.colors.cream : t.colors.muted,
                  cursor: 'pointer',
                }}
              >
                Todos
              </button>
              {TIPOS.map(tipo => (
                <button
                  key={tipo}
                  onClick={() => s.setTipoFilter(s.tipoFilter === tipo ? null : tipo)}
                  style={{
                    flexShrink: 0, padding: '5px 13px', borderRadius: t.radius.pill,
                    fontFamily: t.typography.chipLabel.fontFamily,
                    fontSize: t.typography.chipLabel.fontSize,
                    fontWeight: s.tipoFilter === tipo ? 600 : 400,
                    border: `1px solid ${s.tipoFilter === tipo ? t.colors.primaryBorder : t.colors.border}`,
                    background: s.tipoFilter === tipo ? t.colors.primary : 'transparent',
                    color: s.tipoFilter === tipo ? t.colors.cream : t.colors.muted,
                    cursor: 'pointer',
                  }}
                >
                  {tipo}
                </button>
              ))}
              <div style={{ width: 1, height: 18, background: t.colors.border, flexShrink: 0 }} />
              <button
                onClick={() => s.setFavoritoFilter(f => !f)}
                style={{
                  flexShrink: 0, padding: '5px 13px', borderRadius: t.radius.pill,
                  fontFamily: t.typography.chipLabel.fontFamily,
                  fontSize: t.typography.chipLabel.fontSize,
                  fontWeight: s.favoritoFilter ? 600 : 400,
                  border: `1px solid ${s.favoritoFilter ? t.colors.goldBorder : t.colors.border}`,
                  background: s.favoritoFilter ? t.colors.goldSubtle : 'transparent',
                  color: s.favoritoFilter ? t.colors.gold : t.colors.muted,
                  cursor: 'pointer',
                }}
              >
                ⭐ Favoritos
              </button>
              <button
                onClick={() => s.setStockFilter(v => !v)}
                style={{
                  flexShrink: 0, padding: '5px 13px', borderRadius: t.radius.pill,
                  fontFamily: t.typography.chipLabel.fontFamily,
                  fontSize: t.typography.chipLabel.fontSize,
                  fontWeight: s.stockFilter ? 600 : 400,
                  border: `1px solid ${s.stockFilter ? t.colors.primaryBorder : t.colors.border}`,
                  background: s.stockFilter ? t.colors.primary : 'transparent',
                  color: s.stockFilter ? t.colors.cream : t.colors.muted,
                  cursor: 'pointer',
                }}
              >
                En stock
              </button>
            </div>
          )}

          {/* Fila 4: sort label + view toggle */}
          {!s.searchOpen && !s.loading && s.wines.length > 0 && (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '2px 0' }}>
              <button
                onClick={() => s.setFilterPanelOpen(o => !o)}
                style={{ display: 'flex', alignItems: 'center', gap: 6, background: 'none', border: 'none', cursor: 'pointer',
                  color: t.colors.muted, fontSize: t.typography.sortLabel.fontSize, fontFamily: t.typography.sortLabel.fontFamily }}
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M3 6h18M7 12h10M10 18h4"/>
                </svg>
                {s.sortLabel}
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="6 9 12 15 18 9"/>
                </svg>
              </button>
              <div style={{ display: 'flex', background: t.colors.surface, border: `1px solid ${t.colors.border}`, borderRadius: t.radius.md, overflow: 'hidden' }}>
                {(['grid', 'list'] as const).map(v => (
                  <button
                    key={v}
                    aria-pressed={s.view === v}
                    onClick={() => s.setView(v)}
                    style={{
                      background: s.view === v ? t.colors.surface2 : 'none',
                      border: 'none', cursor: 'pointer', padding: '6px 10px',
                      display: 'flex', alignItems: 'center',
                      color: s.view === v ? t.colors.cream : t.colors.muted,
                      fontFamily: 'inherit',
                    }}
                  >
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

          {/* Panel búsqueda */}
          {s.searchOpen && (
            <>
              <div style={{
                display: 'flex', alignItems: 'center', gap: 8,
                background: t.colors.surface,
                border: `1px solid ${t.colors.gold}`,
                borderBottom: s.suggestions.length > 0 ? 'none' : `1px solid ${t.colors.gold}`,
                borderRadius: s.suggestions.length > 0 ? `${t.radius.xl}px ${t.radius.xl}px 0 0` : t.radius.xl,
                padding: '10px 14px',
              }}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={t.colors.muted} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/>
                </svg>
                <input
                  ref={s.searchRef}
                  value={s.query}
                  onChange={e => s.setQuery(e.target.value)}
                  placeholder="Buscar vino, bodega, DO o región…"
                  style={{ flex: 1, background: 'none', border: 'none', outline: 'none',
                    color: t.colors.cream, fontSize: t.font.base, fontFamily: 'inherit' }}
                />
                {s.query && (
                  <button
                    onClick={() => s.setQuery('')}
                    style={{ background: t.colors.surface2, border: 'none', cursor: 'pointer',
                      color: t.colors.muted, fontSize: t.font.xs, padding: '2px 6px', borderRadius: t.radius.xs }}
                  >
                    ✕
                  </button>
                )}
              </div>
              {s.suggestions.length > 0 && (
                <div role="listbox" style={{
                  background: t.colors.surface,
                  border: `1px solid ${t.colors.gold}`,
                  borderTop: 'none',
                  borderRadius: `0 0 ${t.radius.xl}px ${t.radius.xl}px`,
                  overflow: 'hidden', marginBottom: 10,
                }}>
                  {s.suggestions.map((sug, i) => (
                    <div
                      key={i}
                      role="option"
                      aria-selected={false}
                      onClick={() => s.applySuggestion(sug)}
                      style={{
                        display: 'flex', alignItems: 'center', gap: 10,
                        padding: '11px 14px', ...t.typography.body, color: t.colors.cream,
                        borderBottom: i < s.suggestions.length - 1 ? `1px solid ${t.colors.border}` : 'none',
                        cursor: 'pointer',
                      }}
                    >
                      <span style={{ ...t.typography.suggestionEmoji, width: 20, textAlign: 'center' }}>{sug.emoji}</span>
                      <span style={{
                        ...t.typography.suggestionType, textTransform: 'uppercase',
                        color: t.colors.muted2, background: t.colors.surface2,
                        padding: '2px 6px', borderRadius: t.radius.xs, flexShrink: 0,
                      }}>
                        {sug.typeLabel}
                      </span>
                      <span>{sug.label}</span>
                    </div>
                  ))}
                </div>
              )}
            </>
          )}
        </div>

        {/* ── PANEL FILTROS ──────────────────────────────────────────────────── */}
        {s.filterPanelOpen && (
          <div style={{ padding: '8px 20px 24px', animation: 'slideUp 0.25s ease both' }}>
            <FilterSection title="Colección">
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 7 }}>
                <FilterChip label="⭐ Favoritos" active={s.favoritoFilter} onClick={() => s.setFavoritoFilter(f => !f)} />
                <FilterChip label="En stock"    active={s.stockFilter}    onClick={() => s.setStockFilter(v => !v)} />
              </div>
            </FilterSection>
            <FilterSection title="Tipo">
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 7 }}>
                <FilterChip label="Todos" active={!s.tipoFilter} onClick={() => s.setTipoFilter(null)} />
                {TIPOS.map(tipo => (
                  <FilterChip key={tipo} label={tipo} active={s.tipoFilter === tipo}
                    onClick={() => s.setTipoFilter(s.tipoFilter === tipo ? null : tipo)} />
                ))}
              </div>
            </FilterSection>
            <FilterSection title="Añada">
              <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
                {(['Desde', 'Hasta'] as const).map((lbl, idx) => (
                  <div key={lbl} style={{ flex: 1, background: t.colors.surface, border: `1px solid ${t.colors.border}`, borderRadius: t.radius.md, padding: '10px 12px' }}>
                    <div style={{ ...t.typography.micro, color: t.colors.muted, marginBottom: 2, textTransform: 'uppercase' }}>{lbl}</div>
                    <input
                      type="number"
                      min={1900}
                      max={s.CURRENT_YEAR}
                      value={s.anadaRange[idx]}
                      onChange={e => {
                        const val = Number(e.target.value)
                        s.setAnadaRange(idx === 0 ? [val, s.anadaRange[1]] : [s.anadaRange[0], val])
                        s.setAnadaActive(true)
                      }}
                      style={{ background: 'none', border: 'none', outline: 'none',
                        color: t.colors.cream, ...t.typography.inputAnada, width: '100%' }}
                    />
                  </div>
                ))}
              </div>
            </FilterSection>
            <FilterSection title="Agrupar por">
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 7 }}>
                <FilterChip label="Ninguno" active={!s.groupBy} onClick={() => s.setGroupBy(null)} />
                {GROUP_OPTIONS.map(o => (
                  <FilterChip key={o.key} label={o.label} active={s.groupBy === o.key}
                    onClick={() => s.setGroupBy(s.groupBy === o.key ? null : o.key)} />
                ))}
              </div>
            </FilterSection>
            <FilterSection title="Ordenar por">
              <div style={{ background: t.colors.surface, border: `1px solid ${t.colors.border}`, borderRadius: t.radius.xl, overflow: 'hidden' }}>
                {SORT_OPTIONS.map((o, i) => (
                  <div
                    key={o.key}
                    onClick={() => s.setSortBy(o.key)}
                    style={{
                      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                      padding: '13px 16px', fontSize: t.font.base,
                      color: s.sortBy === o.key ? t.colors.gold : t.colors.cream,
                      borderBottom: i < SORT_OPTIONS.length - 1 ? `1px solid ${t.colors.border}` : 'none',
                      cursor: 'pointer',
                    }}
                  >
                    {o.label}
                    {s.sortBy === o.key && (
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={t.colors.gold} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                        <polyline points="20 6 9 17 4 12"/>
                      </svg>
                    )}
                  </div>
                ))}
              </div>
            </FilterSection>
            <button
              onClick={() => s.setFilterPanelOpen(false)}
              style={{ width: '100%', padding: 14, background: t.colors.primary, color: t.colors.cream,
                border: 'none', borderRadius: t.radius.xl, ...t.typography.button, cursor: 'pointer', marginBottom: 12 }}
            >
              Ver resultados ({s.total})
            </button>
            <button
              onClick={s.clearFilters}
              style={{ width: '100%', padding: 10, background: 'transparent', color: t.colors.muted,
                border: `1px solid ${t.colors.border}`, borderRadius: t.radius.xl,
                ...t.typography.body, fontFamily: t.typography.button.fontFamily, cursor: 'pointer' }}
            >
              Restablecer filtros
            </button>
          </div>
        )}

        {/* Meta resultados */}
        {!s.loading && !s.searchOpen && s.wines.length > 0 && (
          <p style={{ ...t.typography.micro, color: t.colors.muted, padding: '4px 20px 6px' }}>
            <strong style={{ color: t.colors.cream }}>{s.total}</strong> vino{s.total !== 1 ? 's' : ''}
            {s.groupBy && ` · Agrupados por ${GROUP_OPTIONS.find(o => o.key === s.groupBy)?.label?.toLowerCase()}`}
          </p>
        )}

        {/* ── CONTENIDO ──────────────────────────────────────────────────────── */}
        <div style={{ padding: '0 16px 120px' }} aria-busy={s.loading}>

          {/* Skeleton */}
          {s.loading && (
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

          {/* Pull-to-refresh */}
          {s.refreshing && (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 8, color: t.colors.muted, fontSize: t.font.xs, gap: 6 }}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
                style={{ animation: 'spin 1s linear infinite' }}>
                <path d="M21 12a9 9 0 1 1-6.219-8.56"/>
              </svg>
              Actualizando…
            </div>
          )}

          {/* Estado vacío */}
          {!s.loading && s.wines.length === 0 && (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16, padding: '60px 32px', textAlign: 'center' }}>
              <svg width="52" height="52" viewBox="0 0 24 24" fill="none" stroke={t.colors.border} strokeWidth="0.8" strokeLinecap="round" strokeLinejoin="round">
                <path d="M8 22h8M12 11v11M5 3h14l-2 7a5 5 0 0 1-10 0L5 3z"/>
              </svg>
              {s.hasActiveFilters || s.query ? (
                <>
                  <div>
                    <div style={{ ...t.typography.heroTitle, color: t.colors.cream }}>Sin resultados</div>
                    <p style={{ ...t.typography.body, color: t.colors.muted, marginTop: 8 }}>
                      No hemos encontrado ningún vino<br/>con esos filtros.
                    </p>
                  </div>
                  <button
                    onClick={s.clearFilters}
                    style={{ background: 'transparent', color: t.colors.muted, border: `1px solid ${t.colors.border}`,
                      padding: '12px 28px', borderRadius: 24, ...t.typography.button, cursor: 'pointer' }}
                  >
                    Limpiar filtros
                  </button>
                </>
              ) : (
                <>
                  <div>
                    <div style={{ ...t.typography.heroTitle, color: t.colors.cream }}>Tu bodega está vacía</div>
                    <p style={{ ...t.typography.body, color: t.colors.muted, marginTop: 8 }}>
                      Empieza escaneando la etiqueta<br/>de tu primer vino
                    </p>
                  </div>
                  <button
                    onClick={() => navigate('/scan')}
                    style={{ background: t.colors.primary, color: t.colors.cream, border: 'none',
                      padding: '12px 28px', borderRadius: 24, ...t.typography.button, cursor: 'pointer' }}
                  >
                    Escanear vino
                  </button>
                  <button
                    onClick={() => navigate('/anadir')}
                    style={{ ...t.typography.bodySmall, color: t.colors.muted, background: 'none', border: 'none',
                      cursor: 'pointer', fontFamily: t.typography.button.fontFamily,
                      textDecoration: 'underline', textUnderlineOffset: 3 }}
                  >
                    o añadir un vino manualmente
                  </button>
                </>
              )}
            </div>
          )}

          {/* Hint swipe (lista sin agrupación) */}
          {!s.loading && s.wines.length > 0 && s.view === 'list' && !s.groupBy && (
            <p style={{ ...t.typography.caption, color: t.colors.muted2, textAlign: 'right', paddingBottom: 6, fontStyle: 'italic' }}>
              Desliza para acciones rápidas →
            </p>
          )}

          {/* Cards con agrupación */}
          {!s.loading && s.grouped && s.grouped.map((group, gi) => (
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
              {renderCards(group.wines, s.view, gi * 10, onClickWine)}
            </div>
          ))}
          {!s.loading && !s.grouped && renderCards(s.wines, s.view, 0, onClickWine)}

          {/* Infinite scroll sentinel */}
          <div ref={s.sentinelRef} style={{ height: 8 }} />
          {s.loadingMore && (
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

        {/* ── FAB ────────────────────────────────────────────────────────────── */}
        <button
          onClick={() => navigate('/scan')}
          aria-label="Añadir vino mediante cámara"
          style={{
            position: 'fixed', bottom: t.sizes.fabBottomOffset, right: 16,
            width: t.sizes.fabSize, height: t.sizes.fabSize, borderRadius: '50%',
            background: t.colors.primary, color: t.colors.cream,
            border: 'none', cursor: 'pointer',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            boxShadow: t.shadows.fab, zIndex: t.zIndex.fab,
            transition: `transform ${t.animation.durationBase} ${t.animation.easingSpring}, opacity ${t.animation.durationBase} ease`,
            transform: s.fabHidden ? 'translateY(20px) scale(0.85)' : 'translateY(0) scale(1)',
            opacity:   s.fabHidden ? 0 : 1,
            pointerEvents: s.fabHidden ? 'none' : 'auto',
          }}
        >
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/>
            <circle cx="12" cy="13" r="4"/>
          </svg>
        </button>

      </div>
    </Layout>
  )
}
