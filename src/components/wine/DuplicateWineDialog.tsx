import { useNavigate } from 'react-router-dom'
import Modal from '../ui/Modal'
import Button from '../ui/Button'
import { theme } from '../../constants/theme'
import type { Wine } from '../../types'

interface DuplicateWineDialogProps {
  mode: 'exact' | 'similar' | null
  exactDuplicate: Wine | null
  similarWines: Wine[]
  onSaveAnyway: () => void
  onCancel: () => void
}

function WineRow({ wine }: { wine: Wine }) {
  return (
    <div
      className="flex items-center gap-3 rounded-xl overflow-hidden"
      style={{ background: theme.colors.surface2, border: `1px solid ${theme.colors.border}` }}
    >
      <div
        className="flex-shrink-0 flex items-center justify-center"
        style={{ width: 52, height: 64, background: '#110809' }}
      >
        {wine.imagen_frontal_url ? (
          <img
            src={wine.imagen_frontal_url}
            alt={wine.nombre}
            style={{ width: '100%', height: '100%', objectFit: 'contain', opacity: 0.9 }}
          />
        ) : (
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={theme.colors.border} strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M8 22h8M12 11v11M5 3h14l-2 7a5 5 0 0 1-10 0L5 3z"/>
          </svg>
        )}
      </div>

      <div className="flex-1 py-3 pr-3 min-w-0">
        <p
          className="truncate font-semibold leading-tight"
          style={{ fontSize: theme.font.base, color: theme.colors.cream }}
        >
          {wine.nombre}
        </p>
        {wine.bodega && (
          <p
            className="truncate"
            style={{ fontSize: theme.font.sm, color: theme.colors.gold, marginTop: 1 }}
          >
            {wine.bodega}
          </p>
        )}
      </div>

      {wine.anada && (
        <span
          className="flex-shrink-0 pr-4"
          style={{
            fontSize: '1.4rem',
            fontWeight: 300,
            color: theme.colors.muted,
            lineHeight: 1,
            fontFamily: "'Playfair Display', Georgia, serif",
          }}
        >
          {wine.anada}
        </span>
      )}
    </div>
  )
}

export default function DuplicateWineDialog({
  mode,
  exactDuplicate,
  similarWines,
  onSaveAnyway,
  onCancel,
}: DuplicateWineDialogProps) {
  const navigate = useNavigate()
  const isExact = mode === 'exact'

  const title = isExact
    ? 'Este vino ya está en tu bodega'
    : 'Hemos encontrado vinos parecidos'

  const subtitle = isExact
    ? 'Ya tienes guardado este vino con la misma bodega y la misma añada.'
    : 'No hemos podido confirmar la añada.'

  const winesShown: Wine[] = isExact
    ? (exactDuplicate ? [exactDuplicate] : [])
    : similarWines

  return (
    <Modal open={mode !== null} onClose={onCancel} title={title}>
      {/* Subtitle */}
      <p style={{ fontSize: theme.font.sm, color: theme.colors.muted, marginTop: -4 }}>
        {subtitle}
      </p>

      {/* Wine list */}
      {winesShown.length > 0 && (
        <div className="flex flex-col gap-2">
          {winesShown.map(w => <WineRow key={w.id} wine={w} />)}
        </div>
      )}

      {/* Divider */}
      <div style={{ height: 1, background: theme.colors.border }} />

      {/* Actions */}
      <div className="flex flex-col gap-2 pb-2">
        {isExact ? (
          <>
            <Button
              variant="primary"
              className="w-full"
              onClick={() => {
                onCancel()
                navigate(`/bodega/${exactDuplicate!.id}`)
              }}
            >
              Ver ficha
            </Button>
            <Button
              variant="secondary"
              className="w-full"
              onClick={onSaveAnyway}
            >
              Guardar como nuevo
            </Button>
            <Button
              variant="ghost"
              className="w-full"
              onClick={onCancel}
            >
              Cancelar
            </Button>
          </>
        ) : (
          <>
            <Button
              variant="primary"
              className="w-full"
              onClick={() => {
                onCancel()
                navigate(`/bodega/${similarWines[0].id}`)
              }}
            >
              Revisar
            </Button>
            <Button
              variant="secondary"
              className="w-full"
              onClick={onSaveAnyway}
            >
              Guardar igualmente
            </Button>
            <Button
              variant="ghost"
              className="w-full"
              onClick={onCancel}
            >
              Cancelar
            </Button>
          </>
        )}
      </div>
    </Modal>
  )
}
