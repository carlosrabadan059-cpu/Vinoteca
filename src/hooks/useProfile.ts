import { useEffect, useState, useCallback } from 'react'
import { supabase } from '../lib/supabase'
import { useAuthStore } from '../store/authStore'
import type { Profile } from '../types'

export function useProfile() {
  const { user } = useAuthStore()
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
    const { data, error } = await supabase
      .from('profiles')
      .update({ ...fields, updated_at: new Date().toISOString() })
      .eq('id', user.id)
      .select()
      .single()
    if (error) throw error
    setProfile(data as Profile)
  }

  return { profile, loading, error, updateProfile, refetch: fetchProfile }
}
