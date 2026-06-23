import { useEffect, useState } from 'react'
import { theme } from '../../constants/theme'

interface ModalProps {
  open: boolean
  onClose: () => void
  title?: string
  children: React.ReactNode
}

export default function Modal({ open, onClose, title, children }: ModalProps) {
  const [visible,  setVisible]  = useState(false)
  const [animated, setAnimated] = useState(false)

  useEffect(() => {
    if (open) {
      setVisible(true)
      requestAnimationFrame(() => requestAnimationFrame(() => setAnimated(true)))
    } else {
      setAnimated(false)
      const t = setTimeout(() => setVisible(false), 280)
      return () => clearTimeout(t)
    }
  }, [open])

  useEffect(() => {
    if (!open) return
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [open, onClose])

  if (!visible) return null

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center"
      style={{
        background: animated ? 'rgba(0,0,0,0.6)' : 'rgba(0,0,0,0)',
        transition: 'background 280ms ease',
      }}
      onClick={onClose}
    >
      <div
        className="flex flex-col"
        style={{
          background:   theme.colors.surface,
          width:        'calc(100% - 40px)',
          maxWidth:     480,
          maxHeight:    '85dvh',
          height:       'auto',
          borderRadius: '20px 20px 20px 20px',
          marginBottom: 16,
          transform:    animated ? 'translateY(0)' : 'translateY(110%)',
          transition:   'transform 300ms cubic-bezier(0.32, 0.72, 0, 1)',
        }}
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
