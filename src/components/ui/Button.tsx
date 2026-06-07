import { theme } from '../../constants/theme'

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost'
  loading?: boolean
}

export default function Button({
  variant = 'primary',
  loading = false,
  disabled,
  children,
  className = '',
  style,
  ...props
}: ButtonProps) {
  const variantStyle: React.CSSProperties =
    variant === 'primary'   ? { background: theme.colors.primary, color: theme.colors.cream } :
    variant === 'secondary' ? { background: 'transparent', color: theme.colors.cream, border: `1px solid ${theme.colors.muted}` } :
                              { background: 'transparent', color: theme.colors.muted }

  return (
    <button
      disabled={loading || disabled}
      className={`px-4 py-3 rounded-xl font-semibold text-base transition-opacity disabled:opacity-60 disabled:cursor-not-allowed ${className}`}
      style={{ ...variantStyle, ...style }}
      {...props}
    >
      {loading ? <span className="spinner" style={{ width: 18, height: 18, borderWidth: 2, display: 'inline-block' }} /> : children}
    </button>
  )
}
