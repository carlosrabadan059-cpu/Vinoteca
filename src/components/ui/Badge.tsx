import { theme } from '../../constants/theme'

interface BadgeProps {
  children: React.ReactNode
  variant?: 'gold' | 'muted' | 'primary'
}

export default function Badge({ children, variant = 'muted' }: BadgeProps) {
  const color =
    variant === 'gold'    ? theme.colors.gold :
    variant === 'primary' ? theme.colors.primary :
                            theme.colors.muted

  return (
    <span
      className="inline-block px-2 py-0.5 rounded-full text-xs font-medium"
      style={{ color, border: `1px solid ${color}`, background: `${color}18` }}
    >
      {children}
    </span>
  )
}
