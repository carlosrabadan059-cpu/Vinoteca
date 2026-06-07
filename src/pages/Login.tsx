import { useState, type FormEvent } from 'react'
import { Link, Navigate } from 'react-router-dom'
import { useAuthStore } from '../store/authStore'
import { theme } from '../constants/theme'

export default function Login() {
  const { session, loading: authLoading, login } = useAuthStore()
  const [email, setEmail]       = useState('')
  const [password, setPassword] = useState('')
  const [error, setError]       = useState('')
  const [loading, setLoading]   = useState(false)

  if (!authLoading && session) return <Navigate to="/bodega" replace />

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      await login(email, password)
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Error al iniciar sesión')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div
      className="flex min-h-dvh items-center justify-center px-6"
      style={{ background: theme.colors.dark }}
    >
      <form onSubmit={handleSubmit} className="w-full max-w-sm flex flex-col gap-4">
        <div className="text-center mb-2">
          <h1 className="text-3xl font-bold" style={{ color: theme.colors.primary }}>Vinoteca</h1>
          <p className="mt-1 text-sm" style={{ color: theme.colors.gold }}>Tu bodega personal</p>
        </div>

        <input
          type="email"
          placeholder="Email"
          value={email}
          onChange={e => setEmail(e.target.value)}
          required
          className="w-full px-4 py-3 rounded-xl outline-none text-base"
          style={{ background: theme.colors.surface, color: theme.colors.cream, border: '1px solid #3A2A2E' }}
        />
        <input
          type="password"
          placeholder="Contraseña"
          value={password}
          onChange={e => setPassword(e.target.value)}
          required
          className="w-full px-4 py-3 rounded-xl outline-none text-base"
          style={{ background: theme.colors.surface, color: theme.colors.cream, border: '1px solid #3A2A2E' }}
        />

        {error && (
          <p className="text-sm" style={{ color: '#D32F2F' }}>{error}</p>
        )}

        <button
          type="submit"
          disabled={loading}
          className="w-full py-3 rounded-xl font-semibold text-base transition-opacity disabled:opacity-60 disabled:cursor-not-allowed"
          style={{ background: theme.colors.primary, color: theme.colors.cream }}
        >
          {loading ? 'Entrando...' : 'Entrar'}
        </button>

        <Link
          to="/register"
          className="text-center text-sm"
          style={{ color: theme.colors.muted }}
        >
          ¿No tienes cuenta?{' '}
          <span style={{ color: theme.colors.primary }}>Regístrate</span>
        </Link>
      </form>
    </div>
  )
}
