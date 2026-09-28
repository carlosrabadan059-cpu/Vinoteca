import { supabase } from './supabase'
import { getQueue, removeFromQueue, updateQueueItem, getQueueCount, removeLocalWine, removeLocalTasting } from './idb'
import { useSyncStore } from '../store/syncStore'
import { useWineStore } from '../store/wineStore'
import { useTastingStore } from '../store/tastingStore'
import type { SyncOperation } from '../types'

export async function processOperation(op: SyncOperation): Promise<void> {
  const { table, action, data, idColumn = 'id' } = op
  const d = data as Record<string, unknown>
  if (action === 'insert') {
    const { error } = await supabase.from(table).insert(d)
    if (error) throw error
  } else if (action === 'update') {
    const { error } = await supabase.from(table).update(d).eq(idColumn, d[idColumn] as string)
    if (error) throw error
  } else if (action === 'delete') {
    const { error } = await supabase.from(table).delete().eq(idColumn, d[idColumn] as string)
    if (error) throw error
  }
}

export async function syncQueue(): Promise<void> {
  const { setIsSyncing, setPending, setLastSync } = useSyncStore.getState()
  const queue = await getQueue()
  if (queue.length === 0) return

  setIsSyncing(true)
  for (const op of queue) {
    try {
      await processOperation(op)
      await removeFromQueue(op.id)
    } catch {
      if (op.retries >= 2) {
        await removeFromQueue(op.id)
        console.error('Sync failed after 3 retries, dropping:', op)
      } else {
        await updateQueueItem(op.id, op.retries + 1)
        // Parar: las operaciones siguientes pueden depender de esta (p. ej. la
        // cata de un vino de fuera creado offline necesita que el vino exista).
        break
      }
    }
  }
  setPending(await getQueueCount())
  setIsSyncing(false)
  setLastSync(new Date().toISOString())
}

/**
 * Descarta operaciones pendientes sin enviarlas (p. ej. duplicados creados sin
 * conexión). Si se descarta el alta de un vino, se descartan también las
 * operaciones que dependen de él (sus catas y ediciones). Borra las copias
 * locales para que la próxima carga use la versión del servidor.
 */
export async function discardOperations(ids: string[]): Promise<void> {
  const queue   = await getQueue()
  const discard = new Set(ids)

  const droppedWineIds = new Set(
    queue.filter(op => discard.has(op.id) && op.table === 'wines' && op.action === 'insert')
      .map(op => (op.data as Record<string, unknown>).id as string)
  )
  for (const op of queue) {
    const d = op.data as Record<string, unknown>
    if (droppedWineIds.has(d.wine_id as string) || (op.table === 'wines' && droppedWineIds.has(d.id as string))) {
      discard.add(op.id)
    }
  }

  for (const op of queue.filter(o => discard.has(o.id))) {
    const id = (op.data as Record<string, unknown>).id as string | undefined
    await removeFromQueue(op.id)
    if (!id) continue
    if (op.table === 'wines') {
      await removeLocalWine(id)
      if (op.action === 'insert') useWineStore.getState().removeWine(id)
    } else if (op.table === 'tastings') {
      await removeLocalTasting(id)
      if (op.action === 'insert') useTastingStore.getState().removeTasting(id)
    }
  }

  useSyncStore.getState().setPending(await getQueueCount())
}
