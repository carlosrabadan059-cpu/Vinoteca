import { syncQueue } from '../lib/syncQueue'

export function useSync() {
  return { syncToSupabase: syncQueue }
}
