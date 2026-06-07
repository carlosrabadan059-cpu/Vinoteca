import { create } from 'zustand'

interface SyncState {
  pendingCount: number
  isSyncing:    boolean
  lastSyncAt:   string | null
  isOnline:     boolean
  setPending:   (count: number) => void
  setIsSyncing: (syncing: boolean) => void
  setLastSync:  (at: string) => void
  setIsOnline:  (online: boolean) => void
}

export const useSyncStore = create<SyncState>((set) => ({
  pendingCount: 0,
  isSyncing:    false,
  lastSyncAt:   null,
  isOnline:     navigator.onLine,
  setPending:   (pendingCount) => set({ pendingCount }),
  setIsSyncing: (isSyncing)   => set({ isSyncing }),
  setLastSync:  (lastSyncAt)  => set({ lastSyncAt }),
  setIsOnline:  (isOnline)    => set({ isOnline }),
}))
