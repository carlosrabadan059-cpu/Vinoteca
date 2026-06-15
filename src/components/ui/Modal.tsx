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
        className="w-full max-w-lg rounded-t-2xl flex flex-col"
        style={{ background: theme.colors.surface, maxHeight: '90dvh' }}
        onClick={e => e.stopPropagation()}
      >
        {title && (
          <div className="px-6 pt-6 pb-4 flex-shrink-0" style={{ borderBottom: `1px solid ${theme.colors.border}` }}>
            <h2 className="text-lg font-semibold" style={{ color: theme.colors.cream }}>{title}</h2>
          </div>
        )}
        <div className="flex-1 overflow-y-auto px-6 py-4 flex flex-col gap-4">
          {children}
        </div>
      </div>
    </div>
  )
}
