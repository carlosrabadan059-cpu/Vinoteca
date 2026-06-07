import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
import { useSyncStore } from './store/syncStore'
import { getQueue, removeFromQueue, updateQueueItem, getQueueCount } from './lib/idb'
import { supabase } from './lib/supabase'
import type { SyncOperation } from './types'

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

async function syncQueue(): Promise<void> {
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
      } else {
        await updateQueueItem(op.id, op.retries + 1)
      }
    }
  }
  setPending(await getQueueCount())
  setIsSyncing(false)
  setLastSync(new Date().toISOString())
}

window.addEventListener('online',  () => { useSyncStore.getState().setIsOnline(true);  syncQueue().catch(console.error) })
window.addEventListener('offline', () => { useSyncStore.getState().setIsOnline(false) })

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
