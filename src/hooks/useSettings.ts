import { useEffect, useState, useCallback } from 'react'
import { supabase } from '../lib/supabase'
import { randomUUID } from '../lib/uuid'
import { addToQueue, getQueueCount } from '../lib/idb'
import { useAuthStore } from '../store/authStore'
import { useSyncStore } from '../store/syncStore'
import type { UserSettings, SyncOperation } from '../types'

export function useSettings() {
  const { user } = useAuthStore()
  const { setPending } = useSyncStore()
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
    const updated_at = new Date().toISOString()

    // UI optimista, igual que useWines/useTastings
    if (settings) setSettings({ ...settings, ...fields, updated_at })

    try {
      const { data, error } = await supabase
        .from('user_settings')
        .update({ ...fields, updated_at })
        .eq('user_id', user.id)
        .select()
        .single()
      if (error) throw error
      setSettings(data as UserSettings)
    } catch {
      // Falló (sin conexión u otro error transitorio): encolar para sync posterior,
      // mismo patrón que useWines/useTastings — main.tsx sincroniza al reconectar.
      const op: SyncOperation = {
        id:         randomUUID(),
        table:      'user_settings',
        action:     'update',
        idColumn:   'user_id',
        data:       { user_id: user.id, ...fields, updated_at },
        created_at: updated_at,
        retries:    0,
      }
      await addToQueue(op)
      setPending(await getQueueCount())
    }
  }

  return { settings, loading, error, updateSettings, refetch: fetchSettings }
}
