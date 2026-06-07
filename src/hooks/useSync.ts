import { supabase } from '../lib/supabase'
import {
  getQueue,
  removeFromQueue,
  updateQueueItem,
  getQueueCount,
} from '../lib/idb'
import { useSyncStore } from '../store/syncStore'
import type { SyncOperation } from '../types'

export function useSync() {
  const { setPending, setIsSyncing, setLastSync } = useSyncStore()

  async function syncToSupabase(): Promise<void> {
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

    const remaining = await getQueueCount()
    setPending(remaining)
    setIsSyncing(false)
    setLastSync(new Date().toISOString())
  }

  return { syncToSupabase }
}

async function processOperation(op: SyncOperation): Promise<void> {
  const { table, action, data } = op
  const d = data as Record<string, unknown>

  if (action === 'insert') {
    const { error } = await supabase.from(table).insert(d)
    if (error) throw error
  } else if (action === 'update') {
    const { error } = await supabase.from(table).update(d).eq('id', d.id as string)
    if (error) throw error
  } else if (action === 'delete') {
    const { error } = await supabase.from(table).delete().eq('id', d.id as string)
    if (error) throw error
  }
}
