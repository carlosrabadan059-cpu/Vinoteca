import { NavLink } from 'react-router-dom'
import { theme } from '../../constants/theme'
import Toast from './Toast'
import SyncIndicator from './SyncIndicator'

const tabs = [
  { to: '/bodega',    label: 'Bodega',    icon: '🍷' },
  { to: '/scan',      label: 'Añadir',    icon: '📷' },
  { to: '/catas',     label: 'Catas',     icon: '📖' },
  { to: '/sommelier', label: 'Sommelier', icon: '🤖' },
  { to: '/stats',     label: 'Stats',     icon: '📊' },
]

interface LayoutProps {
  children: React.ReactNode
}

export default function Layout({ children }: LayoutProps) {
  return (
    <div className="flex flex-col h-dvh" style={{ background: theme.colors.dark }}>
      <Toast />
      <header
        style={{
          display:        'flex',
          justifyContent: 'flex-end',
          alignItems:     'center',
          padding:        '6px 12px',
          background:     theme.colors.dark,
          minHeight:      32,
        }}
      >
        <SyncIndicator />
      </header>
      <main className="flex-1 overflow-y-auto">
        {children}
      </main>

      <nav
        className="flex border-t"
        style={{
          background: theme.colors.surface,
          borderColor: '#3A2A2E',
          paddingBottom: 'env(safe-area-inset-bottom)',
        }}
      >
        {tabs.map(({ to, label, icon }) => (
          <NavLink
            key={to}
            to={to}
            className="flex-1 flex flex-col items-center gap-0.5 py-2 no-underline"
            style={({ isActive }) => ({
              color:      isActive ? theme.colors.gold : theme.colors.muted,
              fontWeight: isActive ? 600 : 400,
              fontSize:   '0.75rem',
            })}
          >
            <span style={{ fontSize: '1.375rem', lineHeight: 1 }}>{icon}</span>
            {label}
          </NavLink>
        ))}
      </nav>
    </div>
  )
}
