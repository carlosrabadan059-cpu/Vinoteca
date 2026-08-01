import { useState, useCallback } from 'react'
import { supabase } from '../lib/supabase'
import { useAuthStore } from '../store/authStore'
import type { Wine, Tasting } from '../types'
import { buildTasteProfile, type TasteProfile } from '../lib/sommelierHelpers'

export function useSommelier() {
  const [tasteProfile, setTasteProfile] = useState<TasteProfile | null>(null)
  const [loaded, setLoaded] = useState(false)

  const { user } = useAuthStore()

  const loadTasteProfile = useCallback(async () => {
    if (!user) return
    try {
      const [winesRes, tastingsRes] = await Promise.all([
        supabase.from('wines').select('*').eq('user_id', user.id),
        supabase.from('tastings').select('*').eq('user_id', user.id),
      ])

      if (winesRes.error)    throw winesRes.error
      if (tastingsRes.error) throw tastingsRes.error

      const wines    = (winesRes.data    ?? []) as Wine[]
      const tastings = (tastingsRes.data ?? []) as Tasting[]

      setTasteProfile(buildTasteProfile(wines, tastings))
    } catch {
      setTasteProfile(null)
    } finally {
      setLoaded(true)
    }
  }, [user])

  return { tasteProfile, loaded, loadTasteProfile }
}
