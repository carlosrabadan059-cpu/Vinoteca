import { useState, useEffect, type FormEvent, type ChangeEvent } from 'react'
import Layout from '../components/ui/Layout'
import Spinner from '../components/ui/Spinner'
import { useProfile } from '../hooks/useProfile'
import { useAuthStore } from '../store/authStore'
import { supabase } from '../lib/supabase'
import { theme } from '../constants/theme'

const inputStyle = {
  background: theme.colors.surface,
  color:      theme.colors.cream,
  border:     `1px solid ${theme.colors.border}`,
}

export default function Perfil() {
  const { user } = useAuthStore()
  const { profile, loading, updateProfile } = useProfile()
  const [displayName, setDisplayName] = useState('')
  const [country, setCountry]         = useState('')
  const [locale, setLocale]           = useState('es')
  const [saving, setSaving]           = useState(false)
  const [uploading, setUploading]     = useState(false)
  const [message, setMessage]         = useState('')

  useEffect(() => {
    if (!profile) return
    setDisplayName(profile.display_name ?? '')
    setCountry(profile.country ?? '')
    setLocale(profile.locale)
  }, [profile?.id])

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setSaving(true)
    setMessage('')
    try {
      await updateProfile({ display_name: displayName || null, country: country || null, locale })
      setMessage('Perfil actualizado')
    } catch (err: unknown) {
      setMessage(err instanceof Error ? err.message : 'Error al guardar')
    } finally {
      setSaving(false)
    }
  }

  async function handleAvatarChange(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file || !user) return
    setUploading(true)
    setMessage('')
    try {
      const path = `${user.id}/avatar.jpg`
      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(path, file, { upsert: true, contentType: file.type })
      if (uploadError) throw uploadError

      const { data } = supabase.storage.from('avatars').getPublicUrl(path)
      await updateProfile({ avatar_url: `${data.publicUrl}?t=${Date.now()}` })
      setMessage('Foto actualizada')
    } catch (err: unknown) {
      setMessage(err instanceof Error ? err.message : 'Error al subir la foto')
    } finally {
      setUploading(false)
    }
  }

  return (
    <Layout>
      <div className="px-5 py-6 max-w-sm mx-auto flex flex-col gap-4">
        <h1
          className="text-editorial"
          style={{ fontSize: '1.25rem', fontWeight: 700, color: theme.colors.cream }}
        >
          Perfil
        </h1>

        {loading || !profile ? (
          <div className="flex justify-center py-10"><Spinner /></div>
        ) : (
          <>
            <div className="flex flex-col items-center gap-2">
              <div
                className="rounded-full overflow-hidden flex items-center justify-center"
                style={{ width: 88, height: 88, background: theme.colors.surface2, border: `1px solid ${theme.colors.border}` }}
              >
                {profile.avatar_url ? (
                  <img src={profile.avatar_url} alt="" className="w-full h-full object-cover" />
                ) : (
                  <span style={{ color: theme.colors.muted, fontSize: '1.5rem' }}>
                    {(profile.display_name || user?.email || '?')[0]?.toUpperCase()}
                  </span>
                )}
              </div>
              <label
                className="text-sm cursor-pointer"
                style={{ color: theme.colors.gold }}
              >
                {uploading ? 'Subiendo…' : 'Cambiar foto'}
                <input type="file" accept="image/*" onChange={handleAvatarChange} className="hidden" disabled={uploading} />
              </label>
            </div>

            <div>
              <span className="text-xs" style={{ color: theme.colors.muted }}>{user?.email}</span>
              <span
                className="ml-2 text-xs px-2 py-0.5 rounded-full"
                style={{ background: theme.colors.goldSubtle, color: theme.colors.gold, border: `1px solid ${theme.colors.goldBorder}` }}
              >
                {profile.plan}
              </span>
            </div>

            <form onSubmit={handleSubmit} className="flex flex-col gap-3">
              <input
                type="text"
                placeholder="Nombre"
                value={displayName}
                onChange={e => setDisplayName(e.target.value)}
                className="w-full px-4 py-3 rounded-xl outline-none text-base"
                style={inputStyle}
              />
              <input
                type="text"
                placeholder="País"
                value={country}
                onChange={e => setCountry(e.target.value)}
                className="w-full px-4 py-3 rounded-xl outline-none text-base"
                style={inputStyle}
              />
              <select
                value={locale}
                onChange={e => setLocale(e.target.value)}
                className="w-full px-4 py-3 rounded-xl outline-none text-base"
                style={inputStyle}
              >
                <option value="es">Español</option>
                <option value="en">English</option>
              </select>

              {message && (
                <p className="text-sm" style={{ color: theme.colors.gold }}>{message}</p>
              )}

              <button
                type="submit"
                disabled={saving}
                className="w-full py-3 rounded-xl font-semibold text-base transition-opacity disabled:opacity-60 disabled:cursor-not-allowed"
                style={{ background: theme.colors.primary, color: theme.colors.cream }}
              >
                {saving ? 'Guardando…' : 'Guardar'}
              </button>
            </form>
          </>
        )}
      </div>
    </Layout>
  )
}
