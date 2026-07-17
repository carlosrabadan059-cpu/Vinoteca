import { useEffect, useState, useCallback } from 'react'
import { supabase } from '../lib/supabase'
import { useAuthStore } from '../store/authStore'
import type { UserSettings } from '../types'

export function useSettings() {
  const { user } = useAuthStore()
  const [settings, setSettings] = useState<UserSettings | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchSettings = useCallback(async () => {
    if (!user) {
      setSettings(null)
      setLoading(false)
      return
    }
    setLoading(true)
    const { data, error } = await supabase
      .from('user_settings')
      .select('*')
      .eq('user_id', user.id)
      .single()
    if (error) setError(error.message)
    else setSettings(data as UserSettings)
    setLoading(false)
  }, [user])

  useEffect(() => {
    fetchSettings()
  }, [fetchSettings])

  async function updateSettings(
    fields: Partial<
      Pick<
        UserSettings,
        | 'theme'
        | 'language'
        | 'currency'
        | 'timezone'
        | 'date_format'
        | 'notifications_email'
        | 'notifications_push'
        | 'camera_preferences'
        | 'ai_preferences'
        | 'privacy_preferences'
      >
    >
  ) {
    if (!user) throw new Error('No hay sesión activa')
    const { data, error } = await supabase
      .from('user_settings')
      .update({ ...fields, updated_at: new Date().toISOString() })
      .eq('user_id', user.id)
      .select()
      .single()
    if (error) throw error
    setSettings(data as UserSettings)
  }

  return { settings, loading, error, updateSettings, refetch: fetchSettings }
}
