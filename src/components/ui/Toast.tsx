import { useToastStore } from '../../store/toastStore'
import { theme } from '../../constants/theme'

export default function Toast() {
  const { message, type, hide } = useToastStore()

  if (!message) return null

  return (
    <div
      className="fixed top-4 left-4 right-4 z-50 px-4 py-3 rounded-xl text-sm font-medium shadow-lg flex items-center justify-between"
      style={{
        background: type === 'success' ? '#2D5A27' : '#7A1A1A',
        color: theme.colors.cream,
      }}
      onClick={hide}
    >
      <span>{message}</span>
      <span style={{ color: theme.colors.muted, marginLeft: 12 }}>✕</span>
    </div>
  )
}
