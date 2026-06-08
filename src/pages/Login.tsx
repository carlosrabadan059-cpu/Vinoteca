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
      className="flex flex-col min-h-dvh"
      style={{ background: 'radial-gradient(ellipse at 50% 0%, #3D1A0F 0%, #1A0A06 40%, #0D0608 75%)' }}
    >
      {/* Hero zona — botella editorial */}
      <div
        className="relative flex-shrink-0 flex items-end justify-center overflow-hidden"
        style={{ height: '52vh', minHeight: 280 }}
      >
        {/* Fondo ahumado */}
        <div
          className="absolute inset-0"
          style={{
            background: 'radial-gradient(ellipse at 50% 30%, #2A1418 0%, #0D0608 70%)',
          }}
        />

        {/* Botella */}
        <img
          src="/bottle-hero.png"
          alt="Château Margaux"
          className="relative z-10"
          style={{
            height: '90%',
            maxHeight: 380,
            objectFit: 'contain',
            filter: 'drop-shadow(0 20px 60px rgba(0,0,0,0.8))',
          }}
        />

        {/* Gradiente de fusión hacia el formulario */}
        <div
          className="absolute inset-x-0 bottom-0 z-20"
          style={{
            height: 120,
            background: `linear-gradient(to bottom, transparent, ${theme.colors.dark})`,
          }}
        />
      </div>

      {/* Formulario */}
      <div className="flex-1 flex flex-col justify-start px-6 pt-2 pb-10">
        {/* Cabecera editorial */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center gap-2 mb-3">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={theme.colors.primary} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M8 22h8M12 11v11M5 3h14l-2 7a5 5 0 0 1-10 0L5 3z"/>
            </svg>
            <span
              className="text-editorial"
              style={{ fontSize: '0.65rem', letterSpacing: '0.18em', textTransform: 'uppercase', color: theme.colors.muted }}
            >
              Vinoteca
            </span>
          </div>
          <h1
            className="text-editorial"
            style={{ fontSize: '2rem', fontWeight: 700, color: theme.colors.cream, lineHeight: 1.1 }}
          >
            Tu bodega<br />
            <span style={{ fontStyle: 'italic', color: theme.colors.gold }}>personal</span>
          </h1>
        </div>

        <form onSubmit={handleSubmit} className="w-full max-w-sm mx-auto flex flex-col gap-3">
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
          <input
            type="password"
            placeholder="Contraseña"
            value={password}
            onChange={e => setPassword(e.target.value)}
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
            {loading ? 'Entrando…' : 'Entrar'}
          </button>

          <Link
            to="/register"
            className="text-center text-sm mt-2"
            style={{ color: theme.colors.muted }}
          >
            ¿No tienes cuenta?{' '}
            <span style={{ color: theme.colors.gold }}>Regístrate</span>
          </Link>
        </form>
      </div>
    </div>
  )
}
