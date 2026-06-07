import { theme } from '../../constants/theme'

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string
  error?: string
}

export default function Input({ label, error, className = '', style, ...props }: InputProps) {
  return (
    <div className="flex flex-col gap-1">
      {label && (
        <label className="text-sm font-medium" style={{ color: theme.colors.muted }}>
          {label}
        </label>
      )}
      <input
        className={`w-full px-4 py-3 rounded-xl outline-none text-base ${className}`}
        style={{
          background: theme.colors.surface,
          color:      theme.colors.cream,
          border:     `1px solid ${error ? '#D32F2F' : '#3A2A2E'}`,
          ...style,
        }}
        {...props}
      />
      {error && <p className="text-sm" style={{ color: '#D32F2F' }}>{error}</p>}
    </div>
  )
}
