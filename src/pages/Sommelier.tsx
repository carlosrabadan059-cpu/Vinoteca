import { useState, useEffect, useRef } from 'react'
import Layout from '../components/ui/Layout'
import ChatBubble from '../components/ui/ChatBubble'
import SuggestionChips from '../components/ui/SuggestionChips'
import Spinner from '../components/ui/Spinner'
import { callSommelierChat, callMaridaje, callEnriquecimiento } from '../lib/n8n'
import { useWineStore } from '../store/wineStore'
import { useWines } from '../hooks/useWines'
import { theme } from '../constants/theme'
import type { ChatMessage } from '../types'
import type { WineCollection } from '../lib/n8n'

const SUGGESTIONS = [
  '¿Qué vino abro esta noche con carne?',
  '¿Cuál es el vino más especial de mi bodega?',
  '¿Qué maridarías con un pescado al horno?',
  'Cuéntame sobre el Priorat',
]

const MARIDAJE_KEYWORDS = [
  'maridar', 'marida', 'combina', 'acompaña', 'con qué vino',
  'para cenar', 'para comer', 'maridaje',
]

const DO_KEYWORDS = [
  'rioja', 'ribera', 'priorat', 'rías baixas', 'rueda', 'jerez', 'cava',
  'penedès', 'bierzo', 'toro', 'somontano', 'jumilla', 'yecla', 'valdepeñas',
  'manchuela', 'terra alta', 'empordà', 'denominación', 'denominacion',
  'd.o.', 'doc',
]

function buildWineCollection(wines: ReturnType<typeof useWineStore.getState>['wines']): WineCollection[] {
  return wines.slice(0, 50).map(w => ({
    id:           w.id,
    nombre:       w.nombre,
    bodega:       w.bodega,
    anada:        w.anada,
    region:       w.region,
    uva:          w.uva,
    denominacion: w.denominacion,
  }))
}

function detectIntent(text: string): 'maridaje' | 'enriquecimiento' | 'chat' {
  const lower = text.toLowerCase()
  if (MARIDAJE_KEYWORDS.some(k => lower.includes(k))) return 'maridaje'
  if (DO_KEYWORDS.some(k => lower.includes(k)))       return 'enriquecimiento'
  return 'chat'
}

function extractPlato(text: string): string {
  const lower = text.toLowerCase()
  for (const kw of ['maridar con ', 'combina con ', 'acompaña a ', 'con ', 'para ']) {
    const idx = lower.indexOf(kw)
    if (idx !== -1) return text.slice(idx + kw.length).trim()
  }
  return text
}

export default function Sommelier() {
  const [messages,  setMessages]  = useState<ChatMessage[]>([])
  const [input,     setInput]     = useState('')
  const [thinking,  setThinking]  = useState(false)
  const bottomRef  = useRef<HTMLDivElement>(null)
  const inputRef   = useRef<HTMLInputElement>(null)

  const { wines }     = useWineStore()
  const { listWines } = useWines()

  useEffect(() => {
    if (wines.length === 0) listWines().catch(() => null)
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, thinking])

  async function sendMessage(text: string) {
    if (!text.trim() || thinking) return

    const userMsg: ChatMessage = { role: 'user', content: text }
    const next = [...messages, userMsg].slice(-20)
    setMessages(next)
    setInput('')
    setThinking(true)

    const wineCollection = buildWineCollection(wines)
    const intent = detectIntent(text)

    try {
      let reply: string

      if (intent === 'maridaje') {
        const plato = extractPlato(text)
        const result = await callMaridaje(plato, wineCollection)
        reply = result.recomendacion

      } else if (intent === 'enriquecimiento') {
        const doMatch = DO_KEYWORDS.find(k => text.toLowerCase().includes(k))
        const denominacion = doMatch
          ? text.slice(text.toLowerCase().indexOf(doMatch)).split(/[\s,.]/, 3).join(' ')
          : text

        const [chatResult, enrichResult] = await Promise.allSettled([
          callSommelierChat(next, wineCollection, text),
          callEnriquecimiento(denominacion),
        ])

        const chatPart   = chatResult.status   === 'fulfilled' ? chatResult.value    : ''
        const enrichPart = enrichResult.status === 'fulfilled' ? enrichResult.value.info : ''
        reply = [chatPart, enrichPart].filter(Boolean).join('\n\n')

      } else {
        reply = await callSommelierChat(next, wineCollection, text)
      }

      const assistantMsg: ChatMessage = { role: 'assistant', content: reply }
      setMessages(prev => [...prev, assistantMsg].slice(-20))
    } catch (err) {
      const assistantMsg: ChatMessage = {
        role:    'assistant',
        content: err instanceof Error ? `Error: ${err.message}` : 'Ha ocurrido un error. Inténtalo de nuevo.',
      }
      setMessages(prev => [...prev, assistantMsg])
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

  return (
    <Layout>
      {/* Header */}
      <div className="flex items-center justify-between px-4 pt-5 pb-3 flex-shrink-0">
        <h1 className="font-bold" style={{ color: theme.colors.gold, fontSize: theme.font['2xl'] }}>
          Sommelier
        </h1>
        {messages.length > 0 && (
          <button
            onClick={() => setMessages([])}
            className="text-sm"
            style={{ color: theme.colors.muted }}
          >
            🗑 Limpiar
          </button>
        )}
      </div>

      {/* Mensajes */}
      <div className="flex-1 overflow-y-auto px-4 pb-2 flex flex-col gap-3">
        {messages.length === 0 && !thinking && (
          <div className="flex flex-col gap-3 pt-2">
            <p className="text-sm" style={{ color: theme.colors.muted }}>
              Pregúntame sobre tu bodega o sobre vinos en general.
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
                background:             theme.colors.surface,
                border:                 `1px solid ${theme.colors.gold}30`,
                borderBottomLeftRadius: 4,
              }}
            >
              {[0, 1, 2].map(i => (
                <span
                  key={i}
                  className="inline-block w-1.5 h-1.5 rounded-full"
                  style={{
                    background: theme.colors.muted,
                    animation:  `pulse 1.2s ease-in-out ${i * 0.2}s infinite`,
                  }}
                />
              ))}
            </div>
          </div>
        )}

        <div ref={bottomRef} />
      </div>

      {/* Input fijo */}
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
            placeholder="Pregunta al sommelier..."
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
    </Layout>
  )
}
