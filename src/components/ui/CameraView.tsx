import { useEffect, useRef, useReducer, useCallback, useState } from 'react'
import { BrowserMultiFormatReader } from '@zxing/browser'
import { theme } from '../../constants/theme'
import type { CaptureSource } from '../../lib/captureSource'

// ── Máquina de estados ────────────────────────────────────────────────────

type CameraState =
  | { status: 'IDLE' }
  | { status: 'REQUESTING' }
  | { status: 'ACTIVE';      stream: MediaStream | null }
  | { status: 'PREVIEW';     stream: MediaStream | null; dataUrl: string }
  | { status: 'SCANNING_QR'; stream: MediaStream | null }
  | { status: 'QR_FOUND' }
  | { status: 'ERROR';       message: string }

type CameraAction =
  | { type: 'REQUEST' }
  | { type: 'STREAM_READY';  stream: MediaStream | null }
  | { type: 'CAPTURE';       dataUrl: string }
  | { type: 'RETAKE' }
  | { type: 'QR_FOUND' }
  | { type: 'ERROR';         message: string }
  | { type: 'RESET' }

function cameraReducer(state: CameraState, action: CameraAction): CameraState {
  switch (action.type) {
    case 'REQUEST':
      return { status: 'REQUESTING' }
    case 'STREAM_READY':
      return { status: 'ACTIVE', stream: action.stream }
    case 'CAPTURE':
      if (state.status !== 'ACTIVE' && state.status !== 'SCANNING_QR') return state
      return { status: 'PREVIEW', stream: state.stream, dataUrl: action.dataUrl }
    case 'RETAKE':
      if (state.status !== 'PREVIEW') return state
      return { status: 'ACTIVE', stream: state.stream }
    case 'QR_FOUND':
      return { status: 'QR_FOUND' }
    case 'ERROR':
      return { status: 'ERROR', message: action.message }
    case 'RESET':
      return { status: 'IDLE' }
    default:
      return state
  }
}

// ── Props ─────────────────────────────────────────────────────────────────

export interface CameraViewProps {
  source: CaptureSource
  hint?: string
  enableQR?: boolean
  onCapture:     (dataUrl: string) => void
  onCancel:      () => void
  onError:       (err: Error) => void
  onQrDetected?: (code: string) => void
}

// ── Componente ────────────────────────────────────────────────────────────

export default function CameraView({
  source,
  hint = 'Centra la etiqueta en el marco',
  enableQR = false,
  onCapture,
  onCancel,
  onError,
  onQrDetected,
}: CameraViewProps) {
  const [state, dispatch] = useReducer(cameraReducer, { status: 'IDLE' })
  const videoRef       = useRef<HTMLVideoElement>(null)
  const streamRef      = useRef<MediaStream | null>(null)
  const readerRef      = useRef<BrowserMultiFormatReader | null>(null)
  const lastDetected   = useRef<string | null>(null)
  const qrActiveRef    = useRef(false)

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
      stopQrLoop()
      if (streamRef.current) {
        source.stop(streamRef.current)
        streamRef.current = null
      }
    }
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  // Conectar stream al <video> y arrancar QR una vez que srcObject está asignado
  useEffect(() => {
    if (!videoRef.current || !('stream' in state)) return
    videoRef.current.srcObject = state.stream
    if (enableQR && state.status === 'ACTIVE') {
      startQrLoop()
    }
  }, [state]) // eslint-disable-line react-hooks/exhaustive-deps

  // Parar QR cuando el estado deja de ser ACTIVE
  useEffect(() => {
    if (state.status !== 'ACTIVE') {
      stopQrLoop()
    }
  }, [state.status]) // eslint-disable-line react-hooks/exhaustive-deps

  function stopQrLoop() {
    qrActiveRef.current = false
    readerRef.current = null
  }

  function startQrLoop() {
    if (qrActiveRef.current) return
    if (!videoRef.current) return

    const video = videoRef.current

    const begin = () => {
      if (!qrActiveRef.current) return
      if (video.paused) video.play().catch(() => {})

      lastDetected.current = null
      const reader = new BrowserMultiFormatReader()
      readerRef.current = reader

      ;(async () => {
        while (qrActiveRef.current) {
          try {
            const result = await reader.decodeOnceFromVideoElement(video)

            if (!qrActiveRef.current) break
            const code = result.getText()
            if (code && code !== lastDetected.current) {
              qrActiveRef.current = false
              readerRef.current = null
              video.pause()
              lastDetected.current = code
              dispatch({ type: 'QR_FOUND' })
              onQrDetected?.(code)
            }
          } catch {
            if (!qrActiveRef.current) break
            await new Promise(r => setTimeout(r, 300))
          }
        }
      })()
    }

    // Esperar a que el vídeo tenga frames antes de arrancar ZXing
    qrActiveRef.current = true
    if (video.readyState >= 2) {
      begin()
    } else {
      video.addEventListener('canplay', begin, { once: true })
    }
  }


  const handleCapture = useCallback(async () => {
    if (!videoRef.current) return
    if (state.status !== 'ACTIVE' && state.status !== 'SCANNING_QR') return
    try {
      // Leer ángulo AHORA — antes de que el usuario devuelva el teléfono a portrait normal
      const _win = window as Window & { orientation?: number }
      const angle =
        typeof _win.orientation === 'number'
          ? _win.orientation
          : (window.screen?.orientation?.angle ?? 0)
      console.log('[capture] window.orientation:', _win.orientation, '| screen.orientation.angle:', window.screen?.orientation?.angle, '| resolved angle:', angle)
      console.log('[capture] video size:', videoRef.current.videoWidth, 'x', videoRef.current.videoHeight)
      const dataUrl = await source.captureFrame(videoRef.current, angle)
      dispatch({ type: 'CAPTURE', dataUrl })
    } catch (err) {
      const error = err instanceof Error ? err : new Error(String(err))
      dispatch({ type: 'ERROR', message: error.message })
      onError(error)
    }
  }, [source, state.status, onError])

  const [previewRotation, setPreviewRotation] = useState(0)

  const handleConfirm = useCallback(() => {
    if (state.status !== 'PREVIEW') return
    if (previewRotation === 0) {
      onCapture(state.dataUrl)
      return
    }
    // Aplicar rotación acumulada al canvas antes de entregar
    const img = new Image()
    img.onload = () => {
      const swap = previewRotation === 90 || previewRotation === 270
      const canvas = document.createElement('canvas')
      canvas.width  = swap ? img.height : img.width
      canvas.height = swap ? img.width  : img.height
      const ctx = canvas.getContext('2d')!
      ctx.translate(canvas.width / 2, canvas.height / 2)
      ctx.rotate((previewRotation * Math.PI) / 180)
      ctx.drawImage(img, -img.width / 2, -img.height / 2)
      onCapture(canvas.toDataURL('image/jpeg', 0.85))
    }
    img.src = state.dataUrl
  }, [state, onCapture, previewRotation])

  const handleRotate = useCallback(() => {
    setPreviewRotation(r => (r + 180) % 360)
  }, [])

  const handleRetake = useCallback(() => {
    setPreviewRotation(0)
    dispatch({ type: 'RETAKE' })
  }, [])

  const isCapturing = state.status === 'ACTIVE' || state.status === 'SCANNING_QR'

  // ── Render ───────────────────────────────────────────────────────────────

  return (
    <div
      className="fixed inset-0 z-50 flex flex-col"
      style={{ background: theme.colors.dark }}
    >
      {/* Video / Preview */}
      <div className="relative flex-1 overflow-hidden">

        {/* Stream de cámara */}
        <video
          ref={videoRef}
          autoPlay
          playsInline
          muted
          className="absolute inset-0 w-full h-full object-cover"
          style={{
            display: state.status === 'PREVIEW' ? 'none' : 'block',
          }}
        />

        {/* Preview del frame capturado */}
        {state.status === 'PREVIEW' && (
          <img
            src={state.dataUrl}
            alt="Foto capturada"
            className="absolute inset-0 w-full h-full object-cover"
            style={{ transform: `rotate(${previewRotation}deg)`, transition: 'transform 300ms ease' }}
          />
        )}

        {/* Estado REQUESTING */}
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

        {/* Estado ERROR */}
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

        {/* Estado QR_FOUND */}
        {state.status === 'QR_FOUND' && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-3">
            <div
              className="w-8 h-8 rounded-full border-2 border-t-transparent animate-spin"
              style={{ borderColor: `${theme.colors.gold} transparent transparent transparent` }}
            />
            <p style={{ fontSize: theme.font.sm, color: theme.colors.muted }}>
              Identificando QR…
            </p>
          </div>
        )}

        {/* Marco de ayuda — visible en ACTIVE y SCANNING_QR */}
        {isCapturing && (
          <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
            <div
              style={{
                width:        '72%',
                aspectRatio:  '3 / 4',
                border:       `2px solid ${theme.colors.gold}`,
                borderRadius: 16,
                opacity:      0.7,
                position:     'relative',
              }}
            >
              {/* Esquinas */}
              {[
                { top: -2, left: -2, borderTop: `3px solid ${theme.colors.gold}`, borderLeft: `3px solid ${theme.colors.gold}`, borderRadius: '12px 0 0 0' },
                { top: -2, right: -2, borderTop: `3px solid ${theme.colors.gold}`, borderRight: `3px solid ${theme.colors.gold}`, borderRadius: '0 12px 0 0' },
                { bottom: -2, left: -2, borderBottom: `3px solid ${theme.colors.gold}`, borderLeft: `3px solid ${theme.colors.gold}`, borderRadius: '0 0 0 12px' },
                { bottom: -2, right: -2, borderBottom: `3px solid ${theme.colors.gold}`, borderRight: `3px solid ${theme.colors.gold}`, borderRadius: '0 0 12px 0' },
              ].map((s, i) => (
                <div key={i} className="absolute" style={{ width: 24, height: 24, ...s }} />
              ))}
            </div>

            {/* Hint / indicador QR */}
            <p
              className="mt-5 px-4 py-2 rounded-full text-xs font-medium"
              style={{
                background: 'rgba(13,6,8,0.7)',
                color:      theme.colors.muted,
                backdropFilter: 'blur(8px)',
              }}
            >
              {enableQR ? 'Buscando QR…' : hint}
            </p>
          </div>
        )}

        {/* Botón cancelar — siempre visible */}
        <button
          onClick={onCancel}
          className="absolute top-4 left-4 flex items-center justify-center rounded-full"
          style={{
            width:      40,
            height:     40,
            background: 'rgba(13,6,8,0.7)',
            backdropFilter: 'blur(8px)',
            border:     `1px solid ${theme.colors.border}`,
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
        className="flex-shrink-0 flex items-center justify-center gap-8 py-6"
        style={{ background: 'rgba(13,6,8,0.9)', backdropFilter: 'blur(12px)' }}
      >
        {state.status === 'PREVIEW' ? (
          <>
            {/* Repetir */}
            <button
              onClick={handleRetake}
              className="flex flex-col items-center gap-1"
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

            {/* Confirmar */}
            <button
              onClick={handleConfirm}
              className="flex flex-col items-center gap-1"
            >
              <div
                className="flex items-center justify-center rounded-full"
                style={{ width: 72, height: 72, background: theme.colors.primary }}
              >
                <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke={theme.colors.cream} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="20 6 9 17 4 12"/>
                </svg>
              </div>
              <span style={{ fontSize: '0.65rem', color: theme.colors.cream }}>Usar foto</span>
            </button>

            {/* Rotar 180° */}
            <button
              onClick={handleRotate}
              className="flex flex-col items-center gap-1"
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
          /* Shutter — deshabilitado en QR_FOUND */
          <button
            onClick={handleCapture}
            disabled={!isCapturing}
            aria-label="Tomar foto"
            style={{ position: 'relative', width: 76, height: 76 }}
          >
            <div
              className="absolute inset-0 rounded-full"
              style={{ border: `2px solid ${theme.colors.primary}`, opacity: 0.5 }}
            />
            <div
              className="absolute rounded-full"
              style={{ inset: 6, border: `1px solid rgba(201,168,76,0.3)` }}
            />
            <div
              className="absolute rounded-full flex items-center justify-center"
              style={{
                inset:      10,
                background: isCapturing ? theme.colors.primary : theme.colors.border,
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
  )
}
