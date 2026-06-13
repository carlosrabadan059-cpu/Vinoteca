import { useState, useEffect, useRef } from 'react'
import { callSommelierChat } from '../../lib/n8n'
import { theme } from '../../constants/theme'
import Button from '../ui/Button'
import type { Wine, ChatMessage } from '../../types'

export interface TastingResult {
  puntuacion: number | null
  notas_cata: string | null
  aroma: string | null
  color_descripcion: string | null
  maridaje: string | null
  chat_history: ChatMessage[]
}

interface TastingChatProps {
  wine: Wine
  onComplete: (data: TastingResult) => void
}

const TASTING_CONTEXT =
  'MODO CATA ESTRUCTURADA: Guía al usuario por una cata profesional haciendo UNA sola pregunta a la vez en este orden exacto:\n' +
  '1. Color (capa, tonalidad, brillo, limpidez)\n' +
  '2. Aroma (frutas, especias, madera, tierra, intensidad)\n' +
  '3. Boca (acidez, taninos, cuerpo, persistencia, equilibrio)\n' +
  '4. Conclusión (puntuación 1-100 y maridaje sugerido)\n' +
  'Tras cada respuesta da feedback técnico breve (1-2 frases) y avanza a la siguiente fase. ' +
  "Cuando termines las 4 fases escribe exactamente 'CATA_COMPLETA' seguido de un JSON en una línea: " +
  '{ "puntuacion": number, "notas_cata": string, "aroma": string, "color_descripcion": string, "maridaje": string }.'

function parseCataCompleta(text: string): Omit<TastingResult, 'chat_history'> | null {
  const idx = text.indexOf('CATA_COMPLETA')
  if (idx === -1) return null
  const jsonPart = text.slice(idx + 'CATA_COMPLETA'.length).trim()
  const match = jsonPart.match(/\{[\s\S]*\}/)
  if (!match) return null
  try {
    return JSON.parse(match[0]) as Omit<TastingResult, 'chat_history'>
  } catch {
    return null
  }
}

export default function TastingChat({ wine, onComplete }: TastingChatProps) {
  const [messages,  setMessages]  = useState<ChatMessage[]>([])
  const [input,     setInput]     = useState('')
  const [thinking,  setThinking]  = useState(false)
  const [completed, setCompleted] = useState<Omit<TastingResult, 'chat_history'> | null>(null)
  const bottomRef = useRef<HTMLDivElement>(null)
  const inputRef  = useRef<HTMLInputElement>(null)
  const initialized = useRef(false)

  useEffect(() => {
    if (initialized.current) return
    initialized.current = true
    const openingContent = `${TASTING_CONTEXT}\n\nQuiero registrar una cata de ${wine.nombre}${wine.anada ? ` ${wine.anada}` : ''}${wine.bodega ? ` de ${wine.bodega}` : ''}.`
    const opening: ChatMessage = { role: 'user', content: openingContent }
    sendToAI([opening])
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, thinking])

  async function sendToAI(history: ChatMessage[]) {
    setMessages(history)
    setThinking(true)
    try {
      const userMessage = history[history.length - 1]?.content ?? ''
      const reply = await callSommelierChat(history, [], userMessage)
      const assistantMsg: ChatMessage = { role: 'assistant', content: reply }
      const next = [...history, assistantMsg]
      setMessages(next)

      const parsed = parseCataCompleta(reply)
      if (parsed) {
        setCompleted(parsed)
      }
    } catch (err) {
      const detail = err instanceof Error ? err.message : String(err)
      const errMsg: ChatMessage = { role: 'assistant', content: `Error: ${detail}` }
      setMessages(prev => [...prev, errMsg])
    } finally {
      setThinking(false)
    }
  }

  async function handleSend() {
    const text = input.trim()
    if (!text || thinking || completed) return
    setInput('')
    const userMsg: ChatMessage = { role: 'user', content: text }
    const next = [...messages, userMsg]
    await sendToAI(next)
    inputRef.current?.focus()
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  function handleGuardar() {
    if (!completed) return
    onComplete({ ...completed, chat_history: messages })
  }

  // Mensajes visibles: ocultar el primer mensaje del usuario (el de apertura automática)
  const visibleMessages = messages.slice(1)

  return (
    <div className="flex flex-col" style={{ minHeight: 0 }}>
      {/* Mensajes */}
      <div className="flex flex-col gap-3 pb-4">
        {visibleMessages.map((msg, i) => {
          const isUser = msg.role === 'user'
          // Ocultar el bloque CATA_COMPLETA del assistant
          const content = msg.role === 'assistant'
            ? msg.content.split('CATA_COMPLETA')[0].trim()
            : msg.content

          if (!content) return null

          return (
            <div
              key={i}
              className={`flex ${isUser ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className="max-w-xs rounded-2xl px-4 py-2.5 text-sm leading-relaxed"
                style={{
                  background: isUser ? theme.colors.primary : theme.colors.surface,
                  color:      theme.colors.cream,
                  borderBottomRightRadius: isUser ? 4 : undefined,
                  borderBottomLeftRadius:  isUser ? undefined : 4,
                  border: isUser ? 'none' : '1px solid #3A2A2E',
                }}
              >
                {content}
              </div>
            </div>
          )
        })}

        {thinking && (
          <div className="flex justify-start">
            <div
              className="rounded-2xl px-4 py-3 flex gap-1 items-center"
              style={{ background: theme.colors.surface, border: '1px solid #3A2A2E', borderBottomLeftRadius: 4 }}
            >
              {[0, 1, 2].map(i => (
                <span
                  key={i}
                  className="inline-block w-1.5 h-1.5 rounded-full"
                  style={{
                    background: theme.colors.muted,
                    animation: `pulse 1.2s ease-in-out ${i * 0.2}s infinite`,
                  }}
                />
              ))}
            </div>
          </div>
        )}

        <div ref={bottomRef} />
      </div>

      {/* Input o botón guardar */}
      {completed ? (
        <div className="pt-2">
          <Button
            className="w-full"
            style={{ background: theme.colors.gold, color: theme.colors.dark }}
            onClick={handleGuardar}
          >
            Guardar cata
          </Button>
        </div>
      ) : (
        <div
          className="flex gap-2 items-center rounded-xl px-3 py-2"
          style={{ background: theme.colors.surface, border: '1px solid #3A2A2E' }}
        >
          <input
            ref={inputRef}
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Escribe tu respuesta..."
            disabled={thinking}
            className="flex-1 bg-transparent outline-none text-sm"
            style={{ color: theme.colors.cream }}
          />
          <button
            onClick={handleSend}
            disabled={!input.trim() || thinking}
            className="flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center disabled:opacity-40"
            style={{ background: theme.colors.primary }}
          >
            <span style={{ color: theme.colors.cream, fontSize: '0.875rem' }}>↑</span>
          </button>
        </div>
      )}
    </div>
  )
}
