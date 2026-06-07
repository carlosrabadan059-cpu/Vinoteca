import { useState, type FormEvent } from 'react'
import { Link, Navigate } from 'react-router-dom'
import { useAuthStore } from '../store/authStore'
import { theme } from '../constants/theme'

export default function Register() {
  const { session, loading: authLoading, register } = useAuthStore()
  const [email, setEmail]       = useState('')
  const [password, setPassword] = useState('')
  const [error, setError]       = useState('')
  const [loading, setLoading]   = useState(false)
  const [success, setSuccess]   = useState(false)

  if (!authLoading && session) return <Navigate to="/bodega" replace />

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    if (password.length < 6) {
      setError('La contraseña debe tener al menos 6 caracteres')
      return
    }
    setError('')
    setLoading(true)
    try {
      await register(email, password)
      setSuccess(true)
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Error al registrarse')
    } finally {
      setLoading(false)
    }
  }

  if (success) {
    return (
      <div
        className="flex min-h-dvh items-center justify-center px-6 flex-col gap-4 text-center"
        style={{ background: theme.colors.dark }}
      >
        <h2 className="text-2xl font-bold" style={{ color: theme.colors.primary }}>¡Cuenta creada!</h2>
        <p style={{ color: theme.colors.cream }}>Revisa tu email para confirmar tu cuenta.</p>
        <Link to="/login" style={{ color: theme.colors.gold }}>Volver al inicio de sesión</Link>
      </div>
    )
  }

  return (
    <div
      className="flex min-h-dvh items-center justify-center px-6"
      style={{ background: theme.colors.dark }}
    >
      <form onSubmit={handleSubmit} className="w-full max-w-sm flex flex-col gap-4">
        <div className="text-center mb-2">
          <h1 className="text-3xl font-bold" style={{ color: theme.colors.primary }}>Crear cuenta</h1>
          <p className="mt-1 text-sm" style={{ color: theme.colors.gold }}>Empieza tu bodega personal</p>
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
          placeholder="Contraseña (mín. 6 caracteres)"
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
          {loading ? 'Creando cuenta...' : 'Crear cuenta'}
        </button>

        <Link
          to="/login"
          className="text-center text-sm"
          style={{ color: theme.colors.muted }}
        >
          ¿Ya tienes cuenta?{' '}
          <span style={{ color: theme.colors.primary }}>Inicia sesión</span>
        </Link>
      </form>
    </div>
  )
}
