import { useState, useEffect, type FormEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import Layout from '../components/ui/Layout'
import Spinner from '../components/ui/Spinner'
import { useSettings } from '../hooks/useSettings'
import { useAuthStore } from '../store/authStore'
import { theme } from '../constants/theme'

const inputStyle = {
  background: theme.colors.surface,
  color:      theme.colors.cream,
  border:     `1px solid ${theme.colors.border}`,
}

function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <h2
      className="uppercase mt-4"
      style={{ fontSize: '0.7rem', letterSpacing: '0.1em', color: theme.colors.muted, fontWeight: 700 }}
    >
      {children}
    </h2>
  )
}

export default function Ajustes() {
  const navigate = useNavigate()
  const { logout, updatePassword } = useAuthStore()
  const { settings, loading, updateSettings } = useSettings()

  const [theme_, setTheme_]         = useState<'system' | 'light' | 'dark'>('dark')
  const [language, setLanguage]     = useState('es')
  const [notifEmail, setNotifEmail] = useState(true)
  const [notifPush, setNotifPush]   = useState(true)
  const [saving, setSaving]         = useState(false)
  const [message, setMessage]       = useState('')

  const [newPassword, setNewPassword] = useState('')
  const [pwdSaving, setPwdSaving]     = useState(false)
  const [pwdMessage, setPwdMessage]   = useState('')

  useEffect(() => {
    if (!settings) return
    setTheme_(settings.theme)
    setLanguage(settings.language)
    setNotifEmail(settings.notifications_email)
    setNotifPush(settings.notifications_push)
  }, [settings?.user_id])

  async function handleSave(e: FormEvent) {
    e.preventDefault()
    setSaving(true)
    setMessage('')
    try {
      await updateSettings({
        theme: theme_,
        language,
        notifications_email: notifEmail,
        notifications_push: notifPush,
      })
      setMessage('Ajustes guardados')
    } catch (err: unknown) {
      setMessage(err instanceof Error ? err.message : 'Error al guardar')
    } finally {
      setSaving(false)
    }
  }

  async function handlePasswordChange(e: FormEvent) {
    e.preventDefault()
    setPwdSaving(true)
    setPwdMessage('')
    try {
      await updatePassword(newPassword)
      setNewPassword('')
      setPwdMessage('Contraseña actualizada')
    } catch (err: unknown) {
      setPwdMessage(err instanceof Error ? err.message : 'Error al cambiar la contraseña')
    } finally {
      setPwdSaving(false)
    }
  }

  async function handleLogout() {
    await logout()
    navigate('/login', { replace: true })
  }

  return (
    <Layout>
      <div className="px-5 py-6 max-w-sm mx-auto flex flex-col gap-2 pb-16">
        <h1
          className="text-editorial"
          style={{ fontSize: '1.25rem', fontWeight: 700, color: theme.colors.cream }}
        >
          Ajustes
        </h1>

        {loading || !settings ? (
          <div className="flex justify-center py-10"><Spinner /></div>
        ) : (
          <>
            <SectionTitle>Apariencia</SectionTitle>
            <form onSubmit={handleSave} className="flex flex-col gap-3">
              <select
                value={theme_}
                onChange={e => setTheme_(e.target.value as typeof theme_)}
                className="w-full px-4 py-3 rounded-xl outline-none text-base"
                style={inputStyle}
              >
                <option value="system">Sistema (próximamente)</option>
                <option value="light">Claro (próximamente)</option>
                <option value="dark">Oscuro</option>
              </select>
              <p className="text-xs" style={{ color: theme.colors.muted }}>
                Por ahora la app solo tiene diseño oscuro. Tu preferencia se guarda para cuando esté disponible.
              </p>

              <select
                value={language}
                onChange={e => setLanguage(e.target.value)}
                className="w-full px-4 py-3 rounded-xl outline-none text-base"
                style={inputStyle}
              >
                <option value="es">Español</option>
                <option value="en">English</option>
              </select>

              <SectionTitle>Notificaciones</SectionTitle>
              <label className="flex items-center justify-between text-sm py-1" style={{ color: theme.colors.text }}>
                Email
                <input type="checkbox" checked={notifEmail} onChange={e => setNotifEmail(e.target.checked)} />
              </label>
              <label className="flex items-center justify-between text-sm py-1" style={{ color: theme.colors.text }}>
                Push
                <input type="checkbox" checked={notifPush} onChange={e => setNotifPush(e.target.checked)} />
              </label>

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

            <SectionTitle>Datos y privacidad</SectionTitle>
            <p className="text-sm" style={{ color: theme.colors.muted }}>
              Exportar mis datos — próximamente.
            </p>
            <p className="text-sm" style={{ color: theme.colors.muted }}>
              Política de privacidad — próximamente.
            </p>

            <SectionTitle>Cuenta</SectionTitle>
            <form onSubmit={handlePasswordChange} className="flex flex-col gap-3">
              <input
                type="password"
                placeholder="Nueva contraseña"
                value={newPassword}
                onChange={e => setNewPassword(e.target.value)}
                minLength={6}
                className="w-full px-4 py-3 rounded-xl outline-none text-base"
                style={inputStyle}
              />
              {pwdMessage && (
                <p className="text-sm" style={{ color: theme.colors.gold }}>{pwdMessage}</p>
              )}
              <button
                type="submit"
                disabled={pwdSaving || newPassword.length < 6}
                className="w-full py-3 rounded-xl font-semibold text-base transition-opacity disabled:opacity-60 disabled:cursor-not-allowed"
                style={{ background: theme.colors.surface2, color: theme.colors.cream, border: `1px solid ${theme.colors.border}` }}
              >
                {pwdSaving ? 'Cambiando…' : 'Cambiar contraseña'}
              </button>
            </form>

            <button
              onClick={handleLogout}
              className="w-full py-3 rounded-xl font-semibold text-base mt-2"
              style={{ background: 'transparent', color: theme.colors.error, border: `1px solid ${theme.colors.error}` }}
            >
              Cerrar sesión
            </button>

            <button
              disabled
              className="w-full py-3 rounded-xl font-semibold text-base mt-1 opacity-40 cursor-not-allowed"
              style={{ background: 'transparent', color: theme.colors.muted, border: `1px solid ${theme.colors.border}` }}
            >
              Eliminar cuenta — próximamente
            </button>
          </>
        )}
      </div>
    </Layout>
  )
}
