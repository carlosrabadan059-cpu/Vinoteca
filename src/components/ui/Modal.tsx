import { useEffect } from 'react'
import { theme } from '../../constants/theme'

interface ModalProps {
  open: boolean
  onClose: () => void
  title?: string
  children: React.ReactNode
}

export default function Modal({ open, onClose, title, children }: ModalProps) {
  useEffect(() => {
    if (!open) return
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [open, onClose])

  if (!open) return null

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center"
      style={{ background: 'rgba(0,0,0,0.6)' }}
      onClick={onClose}
    >
      <div
        className="w-full max-w-lg rounded-t-2xl p-6 flex flex-col gap-4"
        style={{ background: theme.colors.surface }}
        onClick={e => e.stopPropagation()}
      >
        {title && (
          <h2 className="text-lg font-semibold" style={{ color: theme.colors.cream }}>{title}</h2>
        )}
        {children}
      </div>
    </div>
  )
}
