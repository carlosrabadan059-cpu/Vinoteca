import { useEffect, useRef, useReducer, useCallback, useState } from 'react'
import { theme } from '../../constants/theme'
import type { CaptureSource } from '../../lib/captureSource'
import { applyAdjustments, autoEnhance, estimateSharpness, SHARPNESS_THRESHOLD } from '../../lib/imageQuality'

// ── Máquina de estados ────────────────────────────────────────────────────

type CameraState =
  | { status: 'IDLE' }
  | { status: 'REQUESTING' }
  | { status: 'ACTIVE';  stream: MediaStream | null }
  | { status: 'PREVIEW'; stream: MediaStream | null; dataUrl: string }
  | { status: 'ERROR';   message: string }

type CameraAction =
  | { type: 'REQUEST' }
  | { type: 'STREAM_READY'; stream: MediaStream | null }
  | { type: 'CAPTURE';      dataUrl: string }
  | { type: 'SET_PREVIEW_IMAGE'; dataUrl: string }
  | { type: 'RETAKE' }
  | { type: 'ERROR';        message: string }

function cameraReducer(state: CameraState, action: CameraAction): CameraState {
  switch (action.type) {
    case 'REQUEST':      return { status: 'REQUESTING' }
    case 'STREAM_READY': return { status: 'ACTIVE', stream: action.stream }
    case 'CAPTURE':
      if (state.status !== 'ACTIVE') return state
      return { status: 'PREVIEW', stream: state.stream, dataUrl: action.dataUrl }
    case 'SET_PREVIEW_IMAGE':
      if (state.status !== 'PREVIEW') return state
      return { ...state, dataUrl: action.dataUrl }
    case 'RETAKE':
      if (state.status !== 'PREVIEW') return state
      return { status: 'ACTIVE', stream: state.stream }
    case 'ERROR': return { status: 'ERROR', message: action.message }
    default:      return state
  }
}

// ── Props ─────────────────────────────────────────────────────────────────

export interface CameraViewProps {
  source:    CaptureSource
  hint?:     string
  onCapture: (dataUrl: string) => void
  onCancel:  () => void
  onError:   (err: Error) => void
}

// ── Componente ────────────────────────────────────────────────────────────

export default function CameraView({
  source,
  hint = 'Centra la etiqueta en el marco',
  onCapture,
  onCancel,
  onError,
}: CameraViewProps) {
  const [state, dispatch] = useReducer(cameraReducer, { status: 'IDLE' })
  const videoRef  = useRef<HTMLVideoElement>(null)
  const streamRef = useRef<MediaStream | null>(null)

  // Iniciar fuente al montar
  useEffect(() => {
    let cancelled = false

    async function start() {
      dispatch({ type: 'REQUEST' })
      try {
        const stream = await source.start()
        if (cancelled) { source.stop(stream); return }
        streamRef.current = stream
        dispatch({ type: 'STREAM_READY', stream })
      } catch (err) {
        if (cancelled) return
        const error = err instanceof Error ? err : new Error(String(err))
        dispatch({ type: 'ERROR', message: error.message })
        onError(error)
      }
    }

    start()

    return () => {
      cancelled = true
      if (streamRef.current) {
        source.stop(streamRef.current)
        streamRef.current = null
      }
    }
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  // Conectar stream al <video>
  useEffect(() => {
    if (videoRef.current && 'stream' in state) {
      videoRef.current.srcObject = state.stream
    }
  }, [state])

  // Analizar nitidez al entrar en previsualización (no bloquea el flujo)
  useEffect(() => {
    if (state.status !== 'PREVIEW') { setIsBlurry(false); return }
    let cancelled = false
    estimateSharpness(state.dataUrl).then(sharpness => {
      if (cancelled) return
      // Log temporal para calibrar SHARPNESS_THRESHOLD con fotos reales
      console.debug('[camera] nitidez estimada:', Math.round(sharpness))
      setIsBlurry(sharpness > 0 && sharpness < SHARPNESS_THRESHOLD)
    })
    return () => { cancelled = true }
  }, [state])

  const handleCapture = useCallback(async () => {
    if (!videoRef.current || state.status !== 'ACTIVE') return
    try {
      const _win = window as Window & { orientation?: number }
      const angle =
        typeof _win.orientation === 'number'
          ? _win.orientation
          : (window.screen?.orientation?.angle ?? 0)
      const dataUrl = await source.captureFrame(videoRef.current, angle)
      setPreviewRotation(0)
      setBrightness(0)
      setEnhanced(false)
      dispatch({ type: 'CAPTURE', dataUrl })
    } catch (err) {
      const error = err instanceof Error ? err : new Error(String(err))
      dispatch({ type: 'ERROR', message: error.message })
      onError(error)
    }
  }, [source, state.status, onError])

  const [previewRotation, setPreviewRotation] = useState(0)
  const [brightness,      setBrightness]      = useState(0)
  const [confirming,      setConfirming]      = useState(false)
  const [enhanced,        setEnhanced]        = useState(false)
  const [enhancing,       setEnhancing]       = useState(false)
  const [isBlurry,        setIsBlurry]        = useState(false)

  const handleConfirm = useCallback(async () => {
    if (state.status !== 'PREVIEW' || confirming || enhancing) return
    // Camino rápido: sin ajustes, se entrega el dataUrl tal cual (comportamiento original)
    if (previewRotation === 0 && brightness === 0) {
      setConfirming(true)
      onCapture(state.dataUrl)
      return
    }
    setConfirming(true)
    try {
      const adjusted = await applyAdjustments(state.dataUrl, {
        rotation:   previewRotation,
        brightness,
      })
      onCapture(adjusted)
    } catch {
      // applyAdjustments ya devuelve el original ante fallo; si aun así lanza,
      // permitimos reintentar en vez de dejar el botón bloqueado
      setConfirming(false)
    }
  }, [state, onCapture, previewRotation, brightness, confirming, enhancing])

  const handleRotate = useCallback(() => {
    setPreviewRotation(r => (r + 180) % 360)
  }, [])

  const handleEnhance = useCallback(async () => {
    if (state.status !== 'PREVIEW' || enhanced || enhancing || confirming) return
    setEnhancing(true)
    try {
      const improved = await autoEnhance(state.dataUrl)
      dispatch({ type: 'SET_PREVIEW_IMAGE', dataUrl: improved })
      setEnhanced(true)
    } finally {
      setEnhancing(false)
    }
  }, [state, enhanced, enhancing, confirming])

  const handleRetake = useCallback(() => {
    setPreviewRotation(0)
    setBrightness(0)
    setConfirming(false)
    setEnhanced(false)
    dispatch({ type: 'RETAKE' })
  }, [])

  // ── Render ───────────────────────────────────────────────────────────────

  return (
    <div
      className="fixed inset-0 z-50 flex flex-col"
      style={{ background: theme.colors.dark }}
    >
      {/* Video / Preview */}
      <div className="relative flex-1 overflow-hidden">

        <video
          ref={videoRef}
          autoPlay
          playsInline
          muted
          className="absolute inset-0 w-full h-full object-cover"
          style={{ display: state.status === 'PREVIEW' ? 'none' : 'block' }}
        />

        {state.status === 'PREVIEW' && (
          <img
            src={state.dataUrl}
            alt="Foto capturada"
            className="absolute inset-0 w-full h-full object-cover"
            style={{
              transform:  `rotate(${previewRotation}deg)`,
              filter:     brightness !== 0 ? `brightness(${1 + brightness / 100})` : undefined,
              transition: 'transform 300ms ease, filter 120ms linear',
            }}
          />
        )}

        {state.status === 'PREVIEW' && isBlurry && (
          <div
            role="status"
            aria-live="polite"
            className="absolute flex items-center gap-2 rounded-full px-3 py-2"
            style={{
              top: 16, left: '50%', transform: 'translateX(-50%)',
              background: 'rgba(13,6,8,0.85)',
              border: `1px solid ${theme.colors.gold}`,
              backdropFilter: 'blur(8px)',
            }}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={theme.colors.gold} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 9v4M12 17h.01"/><path d="M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/>
            </svg>
            <span style={{ fontSize: '0.7rem', color: theme.colors.cream }}>
              Puede estar borrosa
            </span>
          </div>
        )}

        {state.status === 'REQUESTING' && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-3">
            <div
              className="w-8 h-8 rounded-full border-2 border-t-transparent animate-spin"
              style={{ borderColor: `${theme.colors.gold} transparent transparent transparent` }}
            />
            <p style={{ fontSize: theme.font.sm, color: theme.colors.muted }}>
              Iniciando cámara…
            </p>
          </div>
        )}

        {state.status === 'ERROR' && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 px-8 text-center">
            <p style={{ fontSize: theme.font.base, color: theme.colors.cream }}>
              No se pudo acceder a la cámara
            </p>
            <p style={{ fontSize: theme.font.sm, color: theme.colors.muted }}>
              {state.message}
            </p>
          </div>
        )}

        {/* Marco de ayuda */}
        {state.status === 'ACTIVE' && (
          <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
            <div
              style={{
                width:       '72%',
                aspectRatio: '3 / 4',
                border:      `2px solid ${theme.colors.gold}`,
                borderRadius: 16,
                opacity:     0.7,
                position:    'relative',
              }}
            >
              {[
                { top: -2, left: -2,  borderTop:    `3px solid ${theme.colors.gold}`, borderLeft:  `3px solid ${theme.colors.gold}`, borderRadius: '12px 0 0 0' },
                { top: -2, right: -2, borderTop:    `3px solid ${theme.colors.gold}`, borderRight: `3px solid ${theme.colors.gold}`, borderRadius: '0 12px 0 0' },
                { bottom: -2, left: -2,  borderBottom: `3px solid ${theme.colors.gold}`, borderLeft:  `3px solid ${theme.colors.gold}`, borderRadius: '0 0 0 12px' },
                { bottom: -2, right: -2, borderBottom: `3px solid ${theme.colors.gold}`, borderRight: `3px solid ${theme.colors.gold}`, borderRadius: '0 0 12px 0' },
              ].map((s, i) => (
                <div key={i} className="absolute" style={{ width: 24, height: 24, ...s }} />
              ))}
            </div>
            <p
              className="mt-5 px-4 py-2 rounded-full text-xs font-medium"
              style={{ background: 'rgba(13,6,8,0.7)', color: theme.colors.muted, backdropFilter: 'blur(8px)' }}
            >
              {hint}
            </p>
          </div>
        )}

        {/* Botón cancelar */}
        <button
          onClick={onCancel}
          disabled={confirming || enhancing}
          className="absolute top-4 left-4 flex items-center justify-center rounded-full disabled:opacity-40"
          style={{
            width:  40, height: 40,
            background: 'rgba(13,6,8,0.7)',
            backdropFilter: 'blur(8px)',
            border: `1px solid ${theme.colors.border}`,
          }}
          aria-label="Cerrar cámara"
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={theme.colors.cream} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
          </svg>
        </button>
      </div>

      {/* Barra inferior */}
      <div
        className="flex-shrink-0 flex flex-col"
        style={{ background: 'rgba(13,6,8,0.9)', backdropFilter: 'blur(12px)' }}
      >
        {state.status === 'PREVIEW' && (
          <div className="flex items-center gap-3 px-6 pt-4">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={theme.colors.muted} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
              <circle cx="12" cy="12" r="4"/>
              <path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M6.34 17.66l-1.41 1.41M19.07 4.93l-1.41 1.41"/>
            </svg>
            <input
              type="range"
              min={-50}
              max={50}
              step={1}
              value={brightness}
              onChange={e => setBrightness(Number(e.target.value))}
              disabled={confirming || enhancing}
              aria-label="Ajustar brillo"
              className="flex-1 disabled:opacity-40"
              style={{ accentColor: theme.colors.gold }}
            />
            <span
              style={{ fontSize: '0.65rem', color: theme.colors.muted, width: 32, textAlign: 'right', fontVariantNumeric: 'tabular-nums' }}
            >
              {brightness > 0 ? `+${brightness}` : brightness}
            </span>

            <button
              onClick={handleEnhance}
              disabled={enhanced || enhancing || confirming}
              className="flex items-center gap-1.5 rounded-full disabled:opacity-40"
              style={{
                flexShrink:  0,
                padding:     '6px 12px',
                fontSize:    '0.65rem',
                color:       enhanced ? theme.colors.gold : theme.colors.cream,
                background:  'rgba(255,255,255,0.06)',
                border:      `1px solid ${enhanced ? theme.colors.gold : theme.colors.border}`,
                WebkitTapHighlightColor: 'transparent',
              }}
            >
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 3l1.9 5.1L19 10l-5.1 1.9L12 17l-1.9-5.1L5 10l5.1-1.9z"/>
              </svg>
              {enhancing ? 'Mejorando…' : enhanced ? 'Mejorada' : 'Auto-mejorar'}
            </button>
          </div>
        )}

        <div className="flex items-center justify-center gap-8 py-6">
        {state.status === 'PREVIEW' ? (
          <>
            <button
              onClick={handleRetake}
              disabled={confirming || enhancing}
              className="flex flex-col items-center gap-1 disabled:opacity-40"
              style={{ color: theme.colors.muted }}
            >
              <div
                className="flex items-center justify-center rounded-full"
                style={{ width: 48, height: 48, border: `1px solid ${theme.colors.border}`, background: 'rgba(255,255,255,0.05)' }}
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="1 4 1 10 7 10"/><path d="M3.51 15a9 9 0 1 0 .49-3.63"/>
                </svg>
              </div>
              <span style={{ fontSize: '0.65rem' }}>Repetir</span>
            </button>

            <button
              onClick={handleConfirm}
              disabled={confirming || enhancing}
              className="flex flex-col items-center gap-1 disabled:opacity-60"
            >
              <div
                className="flex items-center justify-center rounded-full"
                style={{ width: 72, height: 72, background: theme.colors.primary }}
              >
                <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke={theme.colors.cream} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="20 6 9 17 4 12"/>
                </svg>
              </div>
              <span style={{ fontSize: '0.65rem', color: theme.colors.cream }}>
                {confirming ? 'Procesando…' : 'Usar foto'}
              </span>
            </button>

            <button
              onClick={handleRotate}
              disabled={confirming || enhancing}
              className="flex flex-col items-center gap-1 disabled:opacity-40"
              style={{ color: theme.colors.muted }}
            >
              <div
                className="flex items-center justify-center rounded-full"
                style={{ width: 48, height: 48, border: `1px solid ${theme.colors.border}`, background: 'rgba(255,255,255,0.05)' }}
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M12 2a10 10 0 1 0 10 10"/><polyline points="22 2 22 8 16 8"/>
                </svg>
              </div>
              <span style={{ fontSize: '0.65rem' }}>Girar</span>
            </button>
          </>
        ) : (
          <button
            onClick={handleCapture}
            disabled={state.status !== 'ACTIVE'}
            aria-label="Tomar foto"
            style={{ position: 'relative', width: 76, height: 76 }}
          >
            <div className="absolute inset-0 rounded-full" style={{ border: `2px solid ${theme.colors.primary}`, opacity: 0.5 }} />
            <div className="absolute rounded-full" style={{ inset: 6, border: `1px solid rgba(201,168,76,0.3)` }} />
            <div
              className="absolute rounded-full flex items-center justify-center"
              style={{
                inset:      10,
                background: state.status === 'ACTIVE' ? theme.colors.primary : theme.colors.border,
                transition: 'background 200ms ease',
              }}
            >
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={theme.colors.cream} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/>
                <circle cx="12" cy="13" r="4"/>
              </svg>
            </div>
          </button>
        )}
        </div>
      </div>
    </div>
  )
}
