import { supabase } from './supabase'
import { getQueue, removeFromQueue, updateQueueItem, getQueueCount } from './idb'
import { useSyncStore } from '../store/syncStore'
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
      }
    }
  }
  setPending(await getQueueCount())
  setIsSyncing(false)
  setLastSync(new Date().toISOString())
}
