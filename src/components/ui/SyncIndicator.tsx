import { useState } from 'react'
import { useSyncStore } from '../../store/syncStore'
import { theme } from '../../constants/theme'
import SyncModal from './SyncModal'

export default function SyncIndicator() {
  const { isOnline, isSyncing, pendingCount } = useSyncStore()
  const [modalOpen, setModalOpen] = useState(false)

  // Todo sincronizado y online: sin indicador
  if (isOnline && !isSyncing && pendingCount === 0) return null

  if (!isOnline) {
    return (
      <div
        style={{
          display:      'flex',
          alignItems:   'center',
          gap:          6,
          padding:      '3px 10px',
          borderRadius: theme.radii.sm,
          background:   theme.colors.surface,
          border:       '1px solid rgba(220,53,69,0.4)',
          fontSize:     '0.7rem',
          color:        '#ff6b7a',
          fontWeight:   500,
        }}
      >
        <span
          style={{
            width: 7, height: 7,
            borderRadius: '50%',
            background: '#dc3545',
            animation: 'pulse 1.5s infinite',
            flexShrink: 0,
          }}
        />
        Sin conexión
      </div>
    )
  }

  if (isSyncing) {
    return (
      <div
        style={{
          display:      'flex',
          alignItems:   'center',
          gap:          6,
          padding:      '3px 10px',
          borderRadius: theme.radii.sm,
          background:   theme.colors.surface,
          fontSize:     '0.7rem',
          color:        theme.colors.muted,
          fontWeight:   500,
        }}
      >
        <span
          style={{
            width: 7, height: 7,
            borderRadius: '50%',
            background: theme.colors.muted,
            animation: 'spin 1s linear infinite',
            flexShrink: 0,
          }}
        />
        Sincronizando...
      </div>
    )
  }

  // pendingCount > 0 y online
  return (
    <>
      <button
        onClick={() => setModalOpen(true)}
        style={{
          display:      'flex',
          alignItems:   'center',
          gap:          6,
          padding:      '3px 10px',
          borderRadius: theme.radii.sm,
          background:   theme.colors.surface,
          border:       '1px solid rgba(212,175,55,0.4)',
          fontSize:     '0.7rem',
          color:        theme.colors.gold,
          fontWeight:   500,
          cursor:       'pointer',
        }}
      >
        <span
          style={{
            width: 7, height: 7,
            borderRadius: '50%',
            background: theme.colors.gold,
            flexShrink: 0,
          }}
        />
        {pendingCount} pendiente{pendingCount !== 1 ? 's' : ''}
      </button>
      <SyncModal open={modalOpen} onClose={() => setModalOpen(false)} />
    </>
  )
}
