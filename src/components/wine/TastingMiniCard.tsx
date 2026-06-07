import { useNavigate } from 'react-router-dom'
import { theme } from '../../constants/theme'
import type { Tasting } from '../../types'

interface TastingMiniCardProps {
  tasting: Tasting
}

export default function TastingMiniCard({ tasting }: TastingMiniCardProps) {
  const navigate = useNavigate()

  const fecha = new Date(tasting.fecha).toLocaleDateString('es-ES', {
    day:   'numeric',
    month: 'short',
    year:  'numeric',
  })

  const preview = tasting.notas_cata
    ? tasting.notas_cata.slice(0, 60) + (tasting.notas_cata.length > 60 ? '…' : '')
    : null

  return (
    <div
      onClick={() => navigate(`/catas/${tasting.id}`)}
      className="rounded-xl p-3 cursor-pointer active:opacity-75 transition-opacity"
      style={{ background: theme.colors.surface, border: '1px solid #3A2A2E' }}
    >
      <div className="flex items-center justify-between">
        <span className="text-sm" style={{ color: theme.colors.muted }}>{fecha}</span>
        {tasting.puntuacion !== null && (
          <span
            className="px-2 py-0.5 rounded-full text-sm font-bold"
            style={{ background: '#3A2A2E', color: theme.colors.gold }}
          >
            {tasting.puntuacion} pts
          </span>
        )}
      </div>
      {preview && (
        <p className="text-sm mt-1" style={{ color: theme.colors.cream }}>
          {preview}
        </p>
      )}
    </div>
  )
}
