import { theme } from '../../constants/theme'

interface CardProps {
  children: React.ReactNode
  className?: string
  onClick?: () => void
}

export default function Card({ children, className = '', onClick }: CardProps) {
  return (
    <div
      className={`rounded-xl p-4 ${onClick ? 'cursor-pointer active:opacity-80' : ''} ${className}`}
      style={{ background: theme.colors.surface, border: '1px solid #3A2A2E' }}
      onClick={onClick}
    >
      {children}
    </div>
  )
}
