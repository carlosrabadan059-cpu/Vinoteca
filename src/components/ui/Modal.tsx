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
        style={{ background: theme.colors.surface, maxHeight: '90dvh', height: 'auto' }}
        onClick={e => e.stopPropagation()}
      >
        {title && (
          <div className="px-6 pt-6 pb-4 flex-shrink-0" style={{ borderBottom: `1px solid ${theme.colors.border}` }}>
            <h2 className="text-lg font-semibold" style={{ color: theme.colors.cream }}>{title}</h2>
          </div>
        )}
        <div style={{ overflowY: 'auto', WebkitOverflowScrolling: 'touch', padding: '1rem 1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {children}
        </div>
      </div>
    </div>
  )
}
