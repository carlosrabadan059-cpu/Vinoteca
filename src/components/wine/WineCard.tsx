import { theme } from '../../constants/theme'
import type { Wine } from '../../types'

interface WineCardProps {
  wine: Wine
  onClick: () => void
}

const TYPE_LABELS: Record<string, string> = {
  Tinto:    'Red',
  Blanco:   'White',
  Rosado:   'Rosé',
  Espumoso: 'Sparkling',
  Dulce:    'Sweet',
}

export default function WineCard({ wine, onClick }: WineCardProps) {
  const location = [wine.region, wine.denominacion].filter(Boolean).join(' · ')
  const typeLabel = wine.tipo ? (TYPE_LABELS[wine.tipo] ?? wine.tipo) : null

  return (
    <div
      onClick={onClick}
      className="cursor-pointer active:opacity-80 transition-opacity overflow-hidden rounded-xl"
      style={{
        background: theme.colors.surface,
        border: `1px solid ${theme.colors.border}`,
      }}
    >
      {/* Image zone */}
      <div
        className="w-full relative overflow-hidden"
        style={{ height: 180, background: '#110809' }}
      >
        {wine.imagen_frontal_url ? (
          <img
            src={wine.imagen_frontal_url}
            alt={wine.nombre}
            className="w-full h-full object-contain"
            style={{ opacity: 0.9 }}
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke={theme.colors.border} strokeWidth="1" strokeLinecap="round" strokeLinejoin="round">
              <path d="M8 22h8M12 11v11M5 3h14l-2 7a5 5 0 0 1-10 0L5 3z"/>
            </svg>
          </div>
        )}

        {/* Gradient overlay */}
        <div
          className="absolute inset-0"
          style={{
            background: 'linear-gradient(to top, rgba(13,6,8,0.95) 0%, rgba(13,6,8,0.3) 60%, transparent 100%)',
          }}
        />

        {/* Type badge */}
        {typeLabel && (
          <div
            className="absolute top-3 left-3"
            style={{
              fontSize:      '0.6rem',
              fontWeight:    600,
              letterSpacing: '0.12em',
              textTransform: 'uppercase',
              color:         theme.colors.gold,
              padding:       '3px 8px',
              border:        `1px solid ${theme.colors.gold}`,
              borderRadius:  2,
              backdropFilter: 'blur(4px)',
              background:    'rgba(13,6,8,0.4)',
            }}
          >
            {typeLabel}
          </div>
        )}
      </div>

      {/* Info */}
      <div className="px-4 pt-2 pb-4">
        <h3
          className="text-editorial leading-tight"
          style={{
            fontSize:   '1.125rem',
            fontWeight: 600,
            color:      theme.colors.cream,
            marginBottom: 2,
          }}
        >
          {wine.nombre}
        </h3>

        <div className="flex items-center justify-between mt-1">
          <div>
            {wine.bodega && (
              <p style={{ fontSize: '0.8rem', color: theme.colors.gold, fontWeight: 500 }}>
                {wine.bodega}
              </p>
            )}
            {location && (
              <p style={{ fontSize: '0.75rem', color: theme.colors.muted, marginTop: 1 }}>
                {location}
              </p>
            )}
          </div>
          {wine.anada && (
            <span
              style={{
                fontSize:   '1.5rem',
                fontWeight: 300,
                color:      theme.colors.muted,
                lineHeight: 1,
                fontFamily: "'Playfair Display', Georgia, serif",
              }}
            >
              {wine.anada}
            </span>
          )}
        </div>
      </div>
    </div>
  )
}
