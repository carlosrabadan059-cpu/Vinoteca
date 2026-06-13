import { useEffect, useState } from 'react'
import { useSyncStore } from '../../store/syncStore'
import { useSync } from '../../hooks/useSync'
import { getQueue } from '../../lib/idb'
import { useToastStore } from '../../store/toastStore'
import { theme } from '../../constants/theme'
import type { SyncOperation } from '../../types'

interface Props {
  open:    boolean
  onClose: () => void
}

const TABLE_ICON: Record<string, string> = {
  wines:    '🍷',
  tastings: '📖',
}

const ACTION_LABEL: Record<string, string> = {
  insert: 'Nuevo',
  update: 'Editado',
  delete: 'Eliminado',
}

export default function SyncModal({ open, onClose }: Props) {
  const { isSyncing, isOnline, pendingCount } = useSyncStore()
  const { syncToSupabase }                    = useSync()
  const { show: showToast }                   = useToastStore()
  const [ops, setOps] = useState<SyncOperation[]>([])

  useEffect(() => {
    if (open) {
      getQueue().then(setOps)
    }
  }, [open, pendingCount])

  // Cerrar automáticamente si la cola queda vacía tras sync
  useEffect(() => {
    if (open && pendingCount === 0 && ops.length > 0) {
      showToast('Todo sincronizado', 'success')
      setOps([])
      onClose()
    }
  }, [pendingCount, open, ops.length, showToast, onClose])

  if (!open) return null

  async function handleSync() {
    await syncToSupabase()
    setOps(await getQueue())
  }

  function itemName(op: SyncOperation): string {
    const d = op.data as Record<string, unknown>
    return (d.nombre as string) ?? (d.id as string) ?? '—'
  }

  return (
    <div
      style={{
        position:   'fixed', inset: 0, zIndex: 50,
        background: 'rgba(0,0,0,0.6)',
        display:    'flex', alignItems: 'flex-end', justifyContent: 'center',
      }}
      onClick={onClose}
    >
      <div
        style={{
          width:        '100%',
          maxWidth:     480,
          background:   theme.colors.surface,
          borderRadius: `${theme.radius.lg} ${theme.radius.lg} 0 0`,
          padding:      '20px 16px',
          paddingBottom: 'max(20px, env(safe-area-inset-bottom))',
        }}
        onClick={e => e.stopPropagation()}
      >
        <h3 style={{ color: theme.colors.cream, fontWeight: 600, marginBottom: 4, fontSize: '1rem' }}>
          Cambios pendientes de sync
        </h3>
        <p style={{ color: theme.colors.muted, fontSize: '0.75rem', marginBottom: 16 }}>
          {ops.length} operación{ops.length !== 1 ? 'es' : ''} en cola
        </p>

        {ops.length === 0 ? (
          <p style={{ color: theme.colors.muted, textAlign: 'center', padding: '16px 0' }}>
            Sin cambios pendientes
          </p>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 16, maxHeight: 240, overflowY: 'auto' }}>
            {ops.map(op => (
              <div
                key={op.id}
                style={{
                  display:      'flex',
                  alignItems:   'center',
                  gap:          10,
                  background:   theme.colors.dark,
                  borderRadius: theme.radius.sm,
                  padding:      '8px 12px',
                }}
              >
                <span style={{ fontSize: '1.1rem' }}>{TABLE_ICON[op.table] ?? '📄'}</span>
                <div style={{ flex: 1 }}>
                  <span style={{ color: theme.colors.cream, fontSize: '0.8rem', fontWeight: 500 }}>
                    {itemName(op)}
                  </span>
                  {op.retries > 0 && (
                    <span style={{ color: theme.colors.muted, fontSize: '0.7rem', marginLeft: 6 }}>
                      · intento {op.retries + 1}
                    </span>
                  )}
                </div>
                <span
                  style={{
                    fontSize:     '0.65rem',
                    fontWeight:   600,
                    color:        op.action === 'delete' ? '#ff6b7a' : theme.colors.gold,
                    background:   op.action === 'delete' ? 'rgba(220,53,69,0.15)' : 'rgba(212,175,55,0.15)',
                    padding:      '2px 6px',
                    borderRadius: theme.radius.sm,
                  }}
                >
                  {ACTION_LABEL[op.action]}
                </span>
              </div>
            ))}
          </div>
        )}

        <div style={{ display: 'flex', gap: 10 }}>
          <button
            onClick={handleSync}
            disabled={isSyncing || !isOnline}
            style={{
              flex:         1,
              padding:      '10px 0',
              borderRadius: theme.radius.md,
              background:   isSyncing || !isOnline ? '#3A2A2E' : theme.colors.primary,
              color:        isSyncing || !isOnline ? theme.colors.muted : '#fff',
              fontWeight:   600,
              fontSize:     '0.85rem',
              border:       'none',
              cursor:       isSyncing || !isOnline ? 'default' : 'pointer',
            }}
          >
            {isSyncing ? 'Sincronizando...' : !isOnline ? 'Sin conexión' : 'Sincronizar ahora'}
          </button>
          <button
            onClick={onClose}
            style={{
              padding:      '10px 16px',
              borderRadius: theme.radius.md,
              background:   theme.colors.dark,
              color:        theme.colors.muted,
              fontWeight:   500,
              fontSize:     '0.85rem',
              border:       'none',
              cursor:       'pointer',
            }}
          >
            Cerrar
          </button>
        </div>
      </div>
    </div>
  )
}
