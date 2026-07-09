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
