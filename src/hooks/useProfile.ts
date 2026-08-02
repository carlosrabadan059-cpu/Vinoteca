import { useEffect, useState, useCallback } from 'react'
import { supabase } from '../lib/supabase'
import { randomUUID } from '../lib/uuid'
import { addToQueue, getQueueCount } from '../lib/idb'
import { useAuthStore } from '../store/authStore'
import { useSyncStore } from '../store/syncStore'
import type { Profile, SyncOperation } from '../types'

export function useProfile() {
  const { user } = useAuthStore()
  const { setPending } = useSyncStore()
  const [profile, setProfile] = useState<Profile | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchProfile = useCallback(async () => {
    if (!user) {
      setProfile(null)
      setLoading(false)
      return
    }
    setLoading(true)
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single()
    if (error) setError(error.message)
    else setProfile(data as Profile)
    setLoading(false)
  }, [user])

  useEffect(() => {
    fetchProfile()
  }, [fetchProfile])

  async function updateProfile(
    fields: Partial<Pick<Profile, 'display_name' | 'avatar_url' | 'country' | 'locale'>>
  ) {
    if (!user) throw new Error('No hay sesión activa')
    const updated_at = new Date().toISOString()

    // UI optimista, igual que useWines/useTastings
    if (profile) setProfile({ ...profile, ...fields, updated_at })

    try {
      const { data, error } = await supabase
        .from('profiles')
        .update({ ...fields, updated_at })
        .eq('id', user.id)
        .select()
        .single()
      if (error) throw error
      setProfile(data as Profile)
    } catch {
      // Falló (sin conexión u otro error transitorio): encolar para sync posterior,
      // mismo patrón que useWines/useTastings — main.tsx sincroniza al reconectar.
      const op: SyncOperation = {
        id:         randomUUID(),
        table:      'profiles',
        action:     'update',
        idColumn:   'id',
        data:       { id: user.id, ...fields, updated_at },
        created_at: updated_at,
        retries:    0,
      }
      await addToQueue(op)
      setPending(await getQueueCount())
    }
  }

  return { profile, loading, error, updateProfile, refetch: fetchProfile }
}
