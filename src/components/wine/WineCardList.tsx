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
