import { useState, type FormEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuthStore } from '../store/authStore'
import { theme } from '../constants/theme'

export default function ResetPassword() {
  const { updatePassword } = useAuthStore()
  const navigate = useNavigate()
  const [password, setPassword]   = useState('')
  const [confirm, setConfirm]     = useState('')
  const [error, setError]         = useState('')
  const [loading, setLoading]     = useState(false)

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setError('')
    if (password !== confirm) {
      setError('Las contraseñas no coinciden')
      return
    }
    setLoading(true)
    try {
      await updatePassword(password)
      navigate('/bodega', { replace: true })
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Error al restablecer la contraseña')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div
      className="flex flex-col min-h-dvh justify-center px-6"
      style={{ background: 'radial-gradient(ellipse at 50% 0%, #3D1A0F 0%, #1A0A06 40%, #0D0608 75%)' }}
    >
      <div className="w-full max-w-sm mx-auto flex flex-col gap-3">
        <h1
          className="text-editorial text-center mb-2"
          style={{ fontSize: '1.5rem', fontWeight: 700, color: theme.colors.cream }}
        >
          Nueva contraseña
        </h1>

        <form onSubmit={handleSubmit} className="flex flex-col gap-3">
          <input
            type="password"
            placeholder="Nueva contraseña"
            value={password}
            onChange={e => setPassword(e.target.value)}
            required
            minLength={6}
            className="w-full px-4 py-3 rounded-xl outline-none text-base"
            style={{
              background: theme.colors.surface,
              color:      theme.colors.cream,
              border:     `1px solid ${theme.colors.border}`,
            }}
          />
          <input
            type="password"
            placeholder="Confirmar contraseña"
            value={confirm}
            onChange={e => setConfirm(e.target.value)}
            required
            minLength={6}
            className="w-full px-4 py-3 rounded-xl outline-none text-base"
            style={{
              background: theme.colors.surface,
              color:      theme.colors.cream,
              border:     `1px solid ${theme.colors.border}`,
            }}
          />

          {error && (
            <p className="text-sm" style={{ color: '#D32F2F' }}>{error}</p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 rounded-xl font-semibold text-base transition-opacity disabled:opacity-60 disabled:cursor-not-allowed mt-1"
            style={{ background: theme.colors.primary, color: theme.colors.cream }}
          >
            {loading ? 'Guardando…' : 'Guardar contraseña'}
          </button>
        </form>
      </div>
    </div>
  )
}
