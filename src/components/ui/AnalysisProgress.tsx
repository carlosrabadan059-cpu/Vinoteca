import { useEffect, useRef, useState } from 'react'
import { theme } from '../../constants/theme'
import Button from './Button'

interface AnalysisProgressProps {
  open: boolean
  completed: boolean
  error: boolean
  onRetry: () => void
  phase?: 'identifying' | 'analyzing'
}

const PHASES_IDENTIFYING = [
  '🔍 Buscando en tu bodega...',
  '📷 Leyendo la etiqueta...',
  '🍷 Identificando el vino...',
]

const PHASES_ANALYZING = [
  '📷 Analizando etiquetas...',
  '🤖 Interpretando información...',
  '🍷 Identificando el vino...',
  '🖼️ Preparando imagen...',
  '📚 Completando ficha...',
  '✅ Finalizando...',
]

const TRANSITION_MS = 300

export default function AnalysisProgress({ open, completed, error, onRetry, phase = 'analyzing' }: AnalysisProgressProps) {
  const PHASES = phase === 'identifying' ? PHASES_IDENTIFYING : PHASES_ANALYZING
  const [progress,  setProgress]  = useState(0)
  const [phaseIdx,  setPhaseIdx]  = useState(0)
  const [mounted,   setMounted]   = useState(false)  // DOM presente
  const [shown,     setShown]     = useState(false)  // opacity/transform animado

  const startTimeRef  = useRef<number | null>(null)
  const progressRef   = useRef(0)
  const tickRef       = useRef<ReturnType<typeof setInterval> | null>(null)
  const phaseRef      = useRef<ReturnType<typeof setInterval> | null>(null)
  const completedRef  = useRef(false)

  function clearTimers() {
    if (tickRef.current)  clearInterval(tickRef.current)
    if (phaseRef.current) clearInterval(phaseRef.current)
    tickRef.current  = null
    phaseRef.current = null
  }

  function startTimers() {
    startTimeRef.current = Date.now()
    tickRef.current = setInterval(() => {
      if (completedRef.current) return
      const elapsed = Date.now() - (startTimeRef.current ?? Date.now())
      const next = elapsed < 10_000
        ? (elapsed / 10_000) * 70
        : Math.min(progressRef.current + 0.05, 95)
      progressRef.current = next
      setProgress(next)
    }, 100)

    phaseRef.current = setInterval(() => {
      if (completedRef.current) return
      setPhaseIdx(i => (i + 1) % PHASES.length)
    }, 3_000)
  }

  // Abrir
  useEffect(() => {
    if (!open) return
    setProgress(0)
    setPhaseIdx(0)
    progressRef.current  = 0
    completedRef.current = false
    setMounted(true)
    // Fade in: montar primero, luego en el siguiente frame activar la transición
    const t = setTimeout(() => setShown(true), 16)
    startTimers()
    return () => clearTimeout(t)
  }, [open]) // eslint-disable-line react-hooks/exhaustive-deps

  // Cerrar con fade out
  function dismiss() {
    setShown(false)
    setTimeout(() => {
      setMounted(false)
      setProgress(0)
      setPhaseIdx(0)
    }, TRANSITION_MS)
  }

  // Completado: barra a 100% → esperar 600ms → fade out
  useEffect(() => {
    if (!completed) return
    completedRef.current = true
    clearTimers()
    setProgress(100)
    const t = setTimeout(dismiss, 600)
    return () => clearTimeout(t)
  }, [completed]) // eslint-disable-line react-hooks/exhaustive-deps

  // Error: detener animación, mantener visible
  useEffect(() => {
    if (!error) return
    completedRef.current = true
    clearTimers()
  }, [error])

  if (!mounted) return null

  const isCompleted = completed && progress >= 100
  const isError     = error && !completed

  return (
    <div
      className="fixed inset-0 z-50 flex flex-col items-center justify-center gap-6 px-8"
      style={{
        background: theme.colors.dark,
        opacity:    shown ? 1 : 0,
        transform:  shown ? 'translateY(0)' : 'translateY(16px)',
        transition: `opacity ${TRANSITION_MS}ms ease, transform ${TRANSITION_MS}ms ease`,
      }}
    >
      {/* Icono copa */}
      <svg
        width="56" height="56"
        viewBox="0 0 24 24"
        fill="none"
        stroke={isError ? '#E05050' : isCompleted ? '#22c55e' : theme.colors.primary}
        strokeWidth="1"
        strokeLinecap="round"
        strokeLinejoin="round"
        style={{ transition: 'stroke 0.4s ease' }}
      >
        <path d="M8 22h8M12 11v11M5 3h14l-2 7a5 5 0 0 1-10 0L5 3z"/>
      </svg>

      {/* Título */}
      <h2
        className="text-editorial text-center"
        style={{ fontSize: '1.4rem', fontWeight: 700, color: theme.colors.cream, lineHeight: 1.2 }}
      >
        {isError
          ? 'No se ha podido analizar el vino.'
          : isCompleted
            ? 'Ficha creada correctamente'
            : phase === 'identifying' ? 'Identificando vino...' : 'Analizando etiqueta...'}
      </h2>

      {/* Descripción (solo estado normal) */}
      {!isError && !isCompleted && (
        <p className="text-center" style={{ fontSize: '0.875rem', color: theme.colors.muted, lineHeight: 1.6 }}>
          Estamos creando la ficha del vino.{'\n'}
          Este proceso suele tardar entre 10 y 20 segundos.
        </p>
      )}

      {/* Barra de progreso */}
      {!isError && (
        <div style={{ width: '100%', maxWidth: 320 }}>
          <div
            style={{
              height: 6,
              borderRadius: 9999,
              background: theme.colors.border,
              overflow: 'hidden',
            }}
          >
            <div
              style={{
                height: '100%',
                borderRadius: 9999,
                background: isCompleted ? '#22c55e' : theme.colors.primary,
                width: `${progress}%`,
                transition: 'width 0.3s ease, background 0.4s ease',
              }}
            />
          </div>
        </div>
      )}

      {/* Fase rotativa (solo estado normal) */}
      {!isError && !isCompleted && (
        <p style={{ fontSize: '0.8rem', color: theme.colors.muted, minHeight: '1.2em' }}>
          {PHASES[phaseIdx]}
        </p>
      )}

      {/* Botón reintentar (solo error) */}
      {isError && (
        <Button onClick={onRetry} style={{ marginTop: 8 }}>
          Reintentar
        </Button>
      )}
    </div>
  )
}
