import { create } from 'zustand'
import type { Wine } from '../types'

interface WineState {
  wines: Wine[]
  total: number
  loading: boolean
  error: string | null
  setWines: (wines: Wine[]) => void
  addWine: (wine: Wine) => void
  updateWine: (wine: Wine) => void
  removeWine: (id: string) => void
  setTotal: (total: number) => void
  setLoading: (loading: boolean) => void
  setError: (error: string | null) => void
}

export const useWineStore = create<WineState>((set) => ({
  wines: [],
  total: 0,
  loading: false,
  error: null,
  setWines:   (wines)   => set({ wines }),
  addWine:    (wine)    => set((s) => ({ wines: [wine, ...s.wines], total: s.total + 1 })),
  updateWine: (wine)    => set((s) => ({ wines: s.wines.map(w => w.id === wine.id ? wine : w) })),
  removeWine: (id)      => set((s) => ({ wines: s.wines.filter(w => w.id !== id), total: Math.max(0, s.total - 1) })),
  setTotal:   (total)   => set({ total }),
  setLoading: (loading) => set({ loading }),
  setError:   (error)   => set({ error }),
}))
