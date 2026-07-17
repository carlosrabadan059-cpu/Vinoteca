import { useState, type FormEvent } from 'react'
import { Link } from 'react-router-dom'
import { useAuthStore } from '../store/authStore'
import { theme } from '../constants/theme'

export default function ForgotPassword() {
  const { requestPasswordReset } = useAuthStore()
  const [email, setEmail]   = useState('')
  const [error, setError]   = useState('')
  const [loading, setLoading] = useState(false)
  const [sent, setSent]     = useState(false)

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      await requestPasswordReset(email)
      setSent(true)
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Error al solicitar la recuperación')
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
          Recuperar contraseña
        </h1>

        {sent ? (
          <p className="text-sm text-center" style={{ color: theme.colors.text }}>
            Si existe una cuenta con ese email, te hemos enviado un enlace para restablecer la contraseña.
          </p>
        ) : (
          <form onSubmit={handleSubmit} className="flex flex-col gap-3">
            <input
              type="email"
              placeholder="Email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              required
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
              {loading ? 'Enviando…' : 'Enviar enlace'}
            </button>
          </form>
        )}

        <Link
          to="/login"
          className="text-center text-sm mt-2"
          style={{ color: theme.colors.muted }}
        >
          Volver a iniciar sesión
        </Link>
      </div>
    </div>
  )
}
