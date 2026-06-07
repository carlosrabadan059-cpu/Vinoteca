import { create } from 'zustand'
import type { Tasting } from '../types'

interface TastingState {
  tastings: Tasting[]
  setTastings: (tastings: Tasting[]) => void
  addTasting: (tasting: Tasting) => void
  updateTasting: (tasting: Tasting) => void
  removeTasting: (id: string) => void
}

export const useTastingStore = create<TastingState>((set) => ({
  tastings: [],
  setTastings:   (tastings) => set({ tastings }),
  addTasting:    (tasting)  => set((s) => ({ tastings: [tasting, ...s.tastings] })),
  updateTasting: (tasting)  => set((s) => ({ tastings: s.tastings.map(t => t.id === tasting.id ? tasting : t) })),
  removeTasting: (id)       => set((s) => ({ tastings: s.tastings.filter(t => t.id !== id) })),
}))
