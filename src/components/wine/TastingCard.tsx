import { theme } from '../../constants/theme'
import type { Tasting } from '../../types'

interface TastingCardProps {
  tasting: Tasting
  wineName: string
  onClick?: () => void
}

function scoreBg(score: number | null): string {
  if (score === null) return theme.colors.surface
  if (score >= 90) return theme.colors.gold
  if (score >= 70) return theme.colors.primary
  return theme.colors.scoreNeutral
}

function scoreColor(score: number | null): string {
  if (score === null) return theme.colors.muted
  if (score >= 90) return theme.colors.dark
  return theme.colors.cream
}

export default function TastingCard({ tasting, wineName, onClick }: TastingCardProps) {
  const fecha = new Date(tasting.fecha).toLocaleDateString('es-ES', {
    day:   'numeric',
    month: 'short',
    year:  'numeric',
  })

  const preview = tasting.notas_cata
    ? tasting.notas_cata.slice(0, 80) + (tasting.notas_cata.length > 80 ? '…' : '')
    : null

  return (
    <div
      onClick={onClick}
      className="flex items-center gap-3 rounded-xl p-3 cursor-pointer active:opacity-75 transition-opacity"
      style={{ background: theme.colors.surface, border: `1px solid ${theme.colors.borderSubtle}` }}
    >
      {/* Badge puntuación */}
      <div
        className="flex-shrink-0 flex items-center justify-center rounded-full font-bold"
        style={{
          width:      48,
          height:     48,
          background: scoreBg(tasting.puntuacion),
          color:      scoreColor(tasting.puntuacion),
          fontSize:   tasting.puntuacion !== null ? '1rem' : '1.25rem',
        }}
      >
        {tasting.puntuacion !== null ? tasting.puntuacion : '–'}
      </div>

      {/* Contenido */}
      <div className="flex-1 min-w-0">
        <p className="font-semibold truncate text-sm" style={{ color: theme.colors.cream }}>
          {wineName}
        </p>
        <p className="text-xs" style={{ color: theme.colors.muted }}>{fecha}</p>
        {preview && (
          <p className="text-xs mt-0.5 line-clamp-2" style={{ color: theme.colors.muted }}>
            {preview}
          </p>
        )}
      </div>
    </div>
  )
}
