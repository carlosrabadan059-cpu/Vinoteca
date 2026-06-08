import { NavLink } from 'react-router-dom'
import { theme } from '../../constants/theme'
import Toast from './Toast'
import SyncIndicator from './SyncIndicator'
import { useAuthStore } from '../../store/authStore'

const tabs = [
  {
    to: '/bodega',
    label: 'Bodega',
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M8 3H6a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V5a2 2 0 0 0-2-2h-2"/>
        <path d="M8 3a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v1H8V3z"/>
        <path d="M12 12v4m-2-2h4"/>
      </svg>
    ),
  },
  {
    to: '/scan',
    label: 'Añadir',
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/>
        <circle cx="12" cy="13" r="4"/>
      </svg>
    ),
  },
  {
    to: '/catas',
    label: 'Catas',
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"/>
        <path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"/>
      </svg>
    ),
  },
  {
    to: '/sommelier',
    label: 'Sommelier',
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 2a5 5 0 1 0 0 10A5 5 0 0 0 12 2z"/>
        <path d="M12 12c-5.33 0-8 2.67-8 4v2h16v-2c0-1.33-2.67-4-8-4z"/>
      </svg>
    ),
  },
  {
    to: '/stats',
    label: 'Stats',
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <line x1="18" y1="20" x2="18" y2="10"/>
        <line x1="12" y1="20" x2="12" y2="4"/>
        <line x1="6" y1="20" x2="6" y2="14"/>
      </svg>
    ),
  },
]

interface LayoutProps {
  children: React.ReactNode
}

export default function Layout({ children }: LayoutProps) {
  const { logout } = useAuthStore()

  return (
    <div
      className="flex flex-col h-dvh"
      style={{
        background: 'radial-gradient(ellipse at 50% 0%, #3D1A0F 0%, #1A0A06 40%, #0D0608 75%)',
      }}
    >
      <Toast />

      {/* Header editorial */}
      <header
        style={{
          display:        'flex',
          alignItems:     'center',
          justifyContent: 'space-between',
          padding:        '10px 20px',
          background:     theme.colors.dark,
          borderBottom:   `1px solid ${theme.colors.border}`,
          minHeight:      48,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          {/* Wine glass icon */}
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={theme.colors.primary} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M8 22h8M12 11v11M5 3h14l-2 7a5 5 0 0 1-10 0L5 3z"/>
          </svg>
          <span
            className="text-editorial"
            style={{
              fontSize:      '0.75rem',
              fontWeight:    400,
              color:         theme.colors.muted,
              letterSpacing: '0.12em',
              textTransform: 'uppercase',
            }}
          >
            Vinoteca
          </span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <SyncIndicator />
          <button
            onClick={logout}
            aria-label="Cerrar sesión"
            style={{ color: theme.colors.muted, lineHeight: 0 }}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/>
              <polyline points="16 17 21 12 16 7"/>
              <line x1="21" y1="12" x2="9" y2="12"/>
            </svg>
          </button>
        </div>
      </header>

      <main className="flex-1 overflow-y-auto">
        {children}
      </main>

      {/* Bottom nav */}
      <nav
        style={{
          display:       'flex',
          background:    theme.colors.surface,
          borderTop:     `1px solid ${theme.colors.border}`,
          paddingBottom: 'env(safe-area-inset-bottom)',
        }}
      >
        {tabs.map(({ to, label, icon }) => (
          <NavLink
            key={to}
            to={to}
            className="flex-1 flex flex-col items-center gap-1 py-2.5 no-underline transition-colors"
            style={({ isActive }) => ({
              color:   isActive ? theme.colors.gold : theme.colors.muted,
            })}
          >
            {icon}
            <span style={{ fontSize: '0.625rem', letterSpacing: '0.06em', textTransform: 'uppercase', fontWeight: 500 }}>
              {label}
            </span>
          </NavLink>
        ))}
      </nav>
    </div>
  )
}
