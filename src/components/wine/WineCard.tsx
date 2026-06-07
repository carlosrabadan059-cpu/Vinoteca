import { theme } from '../../constants/theme'
import type { Wine } from '../../types'

interface WineCardProps {
  wine: Wine
  onClick: () => void
}

export default function WineCard({ wine, onClick }: WineCardProps) {
  const subtitle = [wine.bodega, wine.anada].filter(Boolean).join(' · ')
  const meta     = [wine.region, wine.denominacion].filter(Boolean).join(' · ')

  return (
    <div
      onClick={onClick}
      className="flex items-center gap-3 rounded-xl p-3 cursor-pointer active:opacity-75 transition-opacity"
      style={{
        background:   theme.colors.surface,
        border:       '1px solid #3A2A2E',
        borderLeft:   `3px solid ${theme.colors.gold}`,
      }}
    >
      {/* Thumbnail */}
      <div
        className="flex-shrink-0 rounded-lg overflow-hidden flex items-center justify-center"
        style={{ width: 64, height: 64, background: '#3A2A2E' }}
      >
        {wine.imagen_frontal_url ? (
          <img
            src={wine.imagen_frontal_url}
            alt={wine.nombre}
            className="w-full h-full object-cover"
          />
        ) : (
          <span style={{ fontSize: '1.75rem' }}>🍷</span>
        )}
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0">
        <p
          className="font-semibold leading-snug truncate"
          style={{ color: theme.colors.cream, fontSize: theme.font.base }}
        >
          {wine.nombre}
        </p>
        {subtitle && (
          <p
            className="text-sm mt-0.5 truncate"
            style={{ color: theme.colors.muted }}
          >
            {subtitle}
          </p>
        )}
        {meta && (
          <p
            className="truncate"
            style={{ color: theme.colors.muted, fontSize: '0.75rem', marginTop: 2 }}
          >
            {meta}
          </p>
        )}
      </div>
    </div>
  )
}
