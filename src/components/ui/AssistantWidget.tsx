import { useEffect, useRef, useState } from 'react'
import { theme } from '../../constants/theme'
import { callAyudaChat } from '../../lib/n8n'
import ChatBubble from './ChatBubble'
import SuggestionChips from './SuggestionChips'
import Spinner from './Spinner'
import type { ChatMessage } from '../../types'

const SUGGESTIONS = [
  '¿Cómo añado un vino nuevo?',
  '¿Cómo escaneo una etiqueta?',
  '¿Cómo registro una cata?',
  '¿Cómo cambio entre vista grid y lista?',
]

function SommelierIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="8" r="3.5" />
      <path d="M5 21v-1a7 7 0 0 1 14 0v1" />
      <path d="M9.5 12.5l2.5 1.5 2.5-1.5z" fill="currentColor" stroke="none" />
    </svg>
  )
}

export default function AssistantWidget() {
  const [open, setOpen] = useState(false)
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [input, setInput] = useState('')
  const [thinking, setThinking] = useState(false)
  const bottomRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (open) bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [open, messages, thinking])

  async function sendMessage(text: string) {
    if (!text.trim() || thinking) return

    const userMsg: ChatMessage = { role: 'user', content: text }
    const next = [...messages, userMsg].slice(-20)
    setMessages(next)
    setInput('')
    setThinking(true)

    try {
      const reply = await callAyudaChat(next, text)
      const assistantMsg: ChatMessage = { role: 'assistant', content: reply }
      setMessages(prev => [...prev, assistantMsg].slice(-20))
    } catch (err) {
      const errorMsg: ChatMessage = {
        role: 'assistant',
        content: err instanceof Error ? `Error: ${err.message}` : 'Ha ocurrido un error. Inténtalo de nuevo.',
      }
      setMessages(prev => [...prev, errorMsg])
    } finally {
      setThinking(false)
      inputRef.current?.focus()
    }
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      sendMessage(input)
    }
  }

  function handleClose() {
    setOpen(false)
    setMessages([])
    setInput('')
  }

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-label="Abrir ayudante de la app"
        style={{
          position: 'fixed',
          left: 16,
          bottom: `calc(${theme.sizes.fabBottomOffset}px + env(safe-area-inset-bottom, 0px))`,
          width: 44,
          height: 44,
          borderRadius: theme.radius.pill,
          background: theme.colors.primary,
          color: theme.colors.cream,
          border: 'none',
          boxShadow: theme.shadows.fab,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: theme.zIndex.fab,
          opacity: 0.55,
          transition: `opacity ${theme.animation.durationBase} ${theme.animation.easingSmooth}`,
          WebkitTapHighlightColor: 'transparent',
        }}
        onTouchStart={e => { e.currentTarget.style.opacity = '1' }}
        onMouseEnter={e => { e.currentTarget.style.opacity = '1' }}
        onMouseLeave={e => { e.currentTarget.style.opacity = '0.55' }}
      >
        <SommelierIcon />
      </button>
    )
  }

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: theme.zIndex.modal,
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'flex-end',
      }}
    >
      <div
        onClick={handleClose}
        style={{ position: 'absolute', inset: 0, background: 'rgba(13,6,8,0.7)' }}
      />

      <div
        style={{
          position: 'relative',
          display: 'flex',
          flexDirection: 'column',
          maxHeight: '75dvh',
          background: theme.colors.dark,
          borderTop: `1px solid ${theme.colors.border}`,
          borderTopLeftRadius: theme.radius['2xl'],
          borderTopRightRadius: theme.radius['2xl'],
          boxShadow: theme.shadows.modal,
        }}
      >
        <div className="flex items-center justify-between px-4 pt-4 pb-2 flex-shrink-0">
          <div className="flex items-center gap-2">
            <span style={{ color: theme.colors.gold }}><SommelierIcon /></span>
            <h2 className="font-bold" style={{ color: theme.colors.gold, fontSize: theme.font.lg }}>
              Ayudante
            </h2>
          </div>
          <button
            type="button"
            onClick={handleClose}
            aria-label="Cerrar ayudante"
            style={{ color: theme.colors.iconMuted, background: 'transparent', border: 'none', lineHeight: 0, padding: 4 }}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-4 pb-2 flex flex-col gap-3">
          {messages.length === 0 && !thinking && (
            <div className="flex flex-col gap-3 pt-2">
              <p className="text-sm" style={{ color: theme.colors.muted }}>
                Pregúntame cómo usar la app: añadir vinos, escanear etiquetas, registrar catas...
              </p>
              <SuggestionChips suggestions={SUGGESTIONS} onSelect={sendMessage} />
            </div>
          )}

          {messages.map((msg, i) => (
            <ChatBubble key={i} message={msg} />
          ))}

          {thinking && (
            <div className="flex justify-start">
              <div
                className="rounded-2xl px-4 py-3 flex gap-1 items-center"
                style={{
                  background: theme.colors.surface,
                  border: `1px solid ${theme.colors.gold}30`,
                  borderBottomLeftRadius: 4,
                }}
              >
                {[0, 1, 2].map(i => (
                  <span
                    key={i}
                    className="inline-block w-1.5 h-1.5 rounded-full"
                    style={{ background: theme.colors.muted, animation: `pulse 1.2s ease-in-out ${i * 0.2}s infinite` }}
                  />
                ))}
              </div>
            </div>
          )}

          <div ref={bottomRef} />
        </div>

        <div
          className="flex-shrink-0 px-4"
          style={{ paddingBottom: 'calc(1rem + env(safe-area-inset-bottom))' }}
        >
          <div
            className="flex gap-2 items-center rounded-xl px-3 py-2"
            style={{ background: theme.colors.surface, border: '1px solid #3A2A2E' }}
          >
            <input
              ref={inputRef}
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Pregunta cómo usar la app..."
              disabled={thinking}
              className="flex-1 bg-transparent outline-none text-sm"
              style={{ color: theme.colors.cream }}
            />
            {thinking ? (
              <Spinner size={20} />
            ) : (
              <button
                onClick={() => sendMessage(input)}
                disabled={!input.trim()}
                className="flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center disabled:opacity-40"
                style={{ background: theme.colors.primary }}
              >
                <span style={{ color: theme.colors.cream, fontSize: '0.875rem' }}>↑</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
