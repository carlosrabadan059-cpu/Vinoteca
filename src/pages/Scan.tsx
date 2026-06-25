import { useState, useEffect, useRef, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import Layout from '../components/ui/Layout'
import Spinner from '../components/ui/Spinner'
import WineForm from '../components/wine/WineForm'
import AnalysisProgress from '../components/ui/AnalysisProgress'
import DuplicateWineDialog from '../components/wine/DuplicateWineDialog'
import CameraView from '../components/ui/CameraView'
import { callScanAnalizar, callScanIdentificar, callScanIdentificarQR } from '../lib/n8n'
import { useWines } from '../hooks/useWines'
import { useCamera } from '../hooks/useCamera'
import { getUserMediaSource } from '../lib/captureSource'
import { findDuplicateWine } from '../lib/wineDuplicates'
import { theme } from '../constants/theme'
import type { Wine } from '../types'
import { useAuthStore } from '../store/authStore'

type Step = 'frontal' | 'trasera' | 'review' | 'done'

const STEPS = ['Foto frontal', 'Foto trasera', 'Revisar', 'Guardar'] as const

function stepIndex(step: Step) {
  return ['frontal', 'trasera', 'review', 'done'].indexOf(step)
}

// ── Barrel hero background ─────────────────────────────────────────────────
function BarrelHero({ children }: { children: React.ReactNode }) {
  return (
    <div
      className="relative w-full overflow-hidden flex flex-col items-center justify-between"
      style={{ height: '56vh', minHeight: 320 }}
    >
      {/* Atmospheric background — dark wine cellar gradient */}
      <div
        className="absolute inset-0"
        style={{
          background: `
            radial-gradient(ellipse at 50% 0%, #3D1A0F 0%, #1A0A06 45%, #0D0608 100%)
          `,
        }}
      />
      {/* Barrel row — pure CSS decorative */}
      <div className="absolute inset-0 flex items-center justify-center opacity-10 overflow-hidden" aria-hidden>
        <svg viewBox="0 0 360 200" width="360" height="200" style={{ opacity: 0.6 }}>
          {[0, 80, 160, 240, 320].map((x) => (
            <g key={x} transform={`translate(${x - 20}, 20)`}>
              <ellipse cx="40" cy="90" rx="38" ry="88" fill="none" stroke="#C9A84C" strokeWidth="2"/>
              <ellipse cx="40" cy="90" rx="22" ry="88" fill="none" stroke="#C9A84C" strokeWidth="1" opacity="0.5"/>
              <line x1="2" y1="30" x2="78" y2="30" stroke="#C9A84C" strokeWidth="1.5"/>
              <line x1="2" y1="150" x2="78" y2="150" stroke="#C9A84C" strokeWidth="1.5"/>
            </g>
          ))}
        </svg>
      </div>
      {/* Tunnel vignette */}
      <div
        className="absolute inset-0"
        style={{
          background: 'radial-gradient(ellipse at 50% 50%, transparent 30%, rgba(13,6,8,0.7) 100%)',
        }}
      />
      {/* Bottom fade to dark */}
      <div
        className="absolute inset-x-0 bottom-0"
        style={{ height: 100, background: `linear-gradient(to bottom, transparent, ${theme.colors.dark})` }}
      />
      {children}
    </div>
  )
}

// ── Camera trigger button ─────────────────────────────────────────────────
function CameraButton({ onCamera, onGallery }: { onCamera: () => void; onGallery: () => void }) {
  return (
    <div className="relative z-10 flex flex-col items-center gap-5 pb-4">
      {/* Main shutter */}
      <button
        type="button"
        onClick={onCamera}
        className="relative flex items-center justify-center"
        style={{ width: 76, height: 76 }}
        aria-label="Tomar foto"
      >
        {/* Outer ring */}
        <div
          className="absolute inset-0 rounded-full"
          style={{ border: `2px solid ${theme.colors.primary}`, opacity: 0.5 }}
        />
        {/* Middle ring */}
        <div
          className="absolute rounded-full"
          style={{ inset: 6, border: `1px solid rgba(201,168,76,0.3)`, borderRadius: 9999 }}
        />
        {/* Inner filled disc */}
        <div
          className="absolute rounded-full flex items-center justify-center"
          style={{ inset: 10, background: theme.colors.primary }}
        >
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={theme.colors.cream} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/>
            <circle cx="12" cy="13" r="4"/>
          </svg>
        </div>
      </button>

      {/* Gallery secondary */}
      <button
        type="button"
        onClick={onGallery}
        className="flex items-center gap-2 px-4 py-2 rounded-full text-xs font-medium"
        style={{
          background: 'rgba(26,14,16,0.8)',
          color: theme.colors.muted,
          border: `1px solid ${theme.colors.border}`,
          backdropFilter: 'blur(8px)',
        }}
      >
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
          <rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/>
        </svg>
        Desde galería
      </button>
    </div>
  )
}


export default function Scan() {
  const navigate = useNavigate()
  const { createWine, loading: saving, status: saveStatus } = useWines()
  const { takePhoto, pickFromGallery, compressImage } = useCamera()
  const { user } = useAuthStore()

  const [step,         setStep]         = useState<Step>('frontal')
  const [cameraTarget, setCameraTarget] = useState<'frontal' | 'trasera' | null>(null)
  const [frontImage,   setFrontImage]   = useState<string | null>(null)
  const [backImage,    setBackImage]    = useState<string | null>(null)
  const [analyzing,     setAnalyzing]     = useState(false)
  const [formData,      setFormData]      = useState<Partial<Wine>>({})
  const [studioUrl,     setStudioUrl]     = useState<string | null>(null)
  const [analysisWarn,  setAnalysisWarn]  = useState(false)
  const [analysisError, setAnalysisError] = useState(false)
  const [notWineError,  setNotWineError]  = useState(false)
  const [toast,        setToast]        = useState<{ msg: string; kind: 'green' | 'yellow' } | null>(null)

  const [analysisPhase, setAnalysisPhase] = useState<'identifying' | 'analyzing'>('identifying')

  // Estado del diálogo de duplicados
  const [dupMode,        setDupMode]        = useState<'exact' | 'similar' | null>(null)
  const [dupExact,       setDupExact]       = useState<Wine | null>(null)
  const [dupSimilar,     setDupSimilar]     = useState<Wine[]>([])
  const pendingSaveRef = useRef<{ data: Partial<Wine> } | null>(null)

  const analysisRef  = useRef<Promise<unknown> | null>(null)
  const qrHandledRef = useRef(false)
  // Incrementado cada vez que la cámara se cierra — invalida llamadas QR en vuelo
  const qrSessionRef = useRef(0)

  const cameraSource = useMemo(() => getUserMediaSource(), [cameraTarget])

  function showToast(msg: string, kind: 'green' | 'yellow', ms = 3000) {
    setToast({ msg, kind })
    setTimeout(() => setToast(null), ms)
  }

  function handleCameraOpen(target: 'frontal' | 'trasera') {
    if (typeof navigator.mediaDevices?.getUserMedia === 'function') {
      setCameraTarget(target)
    } else {
      handleCameraFallback(target)
    }
  }

  async function handleCameraFallback(target: 'frontal' | 'trasera') {
    const raw = await takePhoto()
    if (!raw) return
    handleImageReady(await compressImage(raw), target)
  }

  async function handleGallery(target: 'frontal' | 'trasera') {
    const raw = await pickFromGallery()
    if (!raw) return
    handleImageReady(await compressImage(raw), target)
  }

  function handleImageReady(dataUrl: string, target: 'frontal' | 'trasera') {
    if (target === 'frontal') {
      setNotWineError(false)
      setFrontImage(dataUrl)
      setStep('trasera')
    } else {
      setBackImage(dataUrl)
    }
  }

  async function handleQrDetected(qrData: string) {
    if (qrHandledRef.current) return
    if (!user) return
    qrHandledRef.current = true

    // Capturar la sesión actual — si cambia antes de que resuelva el await,
    // el usuario ya canceló y cualquier efecto secundario debe descartarse
    const session = qrSessionRef.current

    setCameraTarget(null)
    setStep('review')
    setAnalysisPhase('identifying')
    setAnalyzing(true)

    try {
      const result = await callScanIdentificarQR(qrData, user.id)

      // El usuario canceló mientras esperábamos — no hacer nada
      if (qrSessionRef.current !== session) return

      setAnalyzing(false)
      if (result.found) {
        navigate(`/bodega/${result.wine_id}`)
      } else {
        // QR no reconocido — continuar con OCR usando las imágenes ya capturadas
        setAnalysisPhase('analyzing')
        if (frontImage) launchAnalysis(frontImage, backImage ?? undefined)
      }
    } catch {
      if (qrSessionRef.current !== session) return
      setAnalyzing(false)
      // Error en n8n — continuar con OCR igualmente
      setAnalysisPhase('analyzing')
      if (frontImage) launchAnalysis(frontImage, backImage ?? undefined)
    }
  }

  function launchAnalysis(front: string, back?: string) {
    setAnalyzing(true)
    setFormData({})
    setAnalysisWarn(false)
    setAnalysisError(false)
    setNotWineError(false)

    analysisRef.current = callScanAnalizar(front, back)
      .then(result => {
        if (result.is_wine === false) {
          setAnalyzing(false)
          setStep('frontal')
          setNotWineError(true)
          return {}
        }

        const isEmpty = !result.nombre && !result.bodega && !result.region && !result.uva
        if (isEmpty) {
          setAnalyzing(false)
          setStep('frontal')
          setNotWineError(true)
          return {}
        }

        const wineData: Partial<Wine> = {
          nombre:       result.nombre       ?? undefined,
          bodega:       result.bodega       ?? undefined,
          anada:        result.anada        ?? undefined,
          region:       result.region       ?? undefined,
          denominacion: result.denominacion ?? undefined,
          uva:          result.uva          ?? undefined,
          tipo:         result.tipo         ?? undefined,
          alcohol:      result.alcohol      ?? undefined,
          crianza:      result.crianza      ?? undefined,
          descripcion:  result.descripcion  ?? undefined,
          url_bodega:   result.url_bodega   ?? undefined,
          temp_servicio: result.temp_servicio ?? undefined,
          contiene:     result.contiene     ?? undefined,
          volumen:      result.volumen      ?? undefined,
          imagen_frontal_url: result.imagen_url   ?? undefined,
          imagen_trasera_url: result.imagen_trasera_url ?? undefined,
        }
        setFormData(wineData)
        setStudioUrl(result.imagen_url ?? null)
        setAnalysisWarn(isEmpty)
        setAnalyzing(false)
        return wineData
      })
      .catch(() => {
        setFormData({})
        setStudioUrl(null)
        setAnalysisWarn(true)
        setAnalysisError(true)
        setAnalyzing(false)
        return {}
      })
  }

  async function proceedToReview() {
    if (!frontImage) return
    setStep('review')

    // ── Fase 1: intentar identificar sin análisis completo ────────────────────
    if (navigator.onLine && user) {
      setAnalysisPhase('identifying')
      setAnalyzing(true)

      try {
        const result = await callScanIdentificar(frontImage, user.id)
        if (result.found) {
          setAnalyzing(false)
          navigate(`/bodega/${result.wine_id}`)
          return
        }
      } catch {
        // Fase 1 falló (n8n no disponible, timeout, etc.) — continuar con análisis completo
      }
    }

    // ── Fase 2: análisis completo ─────────────────────────────────────────────
    setAnalysisPhase('analyzing')
    launchAnalysis(frontImage, backImage ?? undefined)
  }

  async function handleSave(data: Partial<Wine>, skipDuplicateCheck = false) {
    if (analyzing) await analysisRef.current
    try {
      setStep('done')
      const wine = await createWine(
        data,
        { frontal: studioUrl ?? frontImage ?? undefined },
        { skipDuplicateCheck }
      )
      if (wine.synced_at === null) {
        showToast('Guardado localmente, se sincronizará cuando tengas conexión', 'yellow', 4000)
        setTimeout(() => navigate('/bodega'), 2000)
      } else {
        showToast('¡Vino guardado en tu bodega!', 'green', 2500)
        setTimeout(() => navigate('/bodega'), 1200)
      }
    } catch (err) {
      const errMsg = err instanceof Error ? err.message : ''

      if ((errMsg === 'DUPLICATE_WINE' || errMsg === 'SIMILAR_WINE') && user) {
        setStep('review')
        pendingSaveRef.current = { data }
        const { exactDuplicate, similarWines } = await findDuplicateWine(
          { nombre: data.nombre ?? null, bodega: data.bodega ?? null, anada: data.anada ?? null },
          user.id
        )
        setDupExact(exactDuplicate)
        setDupSimilar(similarWines)
        setDupMode(errMsg === 'DUPLICATE_WINE' ? 'exact' : 'similar')
        return
      }

      console.error('[handleSave] error:', err)
      setStep('review')
      showToast(`Error: ${errMsg || 'Error desconocido'}`, 'yellow', 6000)
    }
  }

  function handleDupSaveAnyway() {
    setDupMode(null)
    if (pendingSaveRef.current) {
      handleSave(pendingSaveRef.current.data, true)
      pendingSaveRef.current = null
    }
  }

  function handleDupCancel() {
    setDupMode(null)
    pendingSaveRef.current = null
  }

  useEffect(() => {
    if (step === 'frontal') {
      setFrontImage(null)
      setBackImage(null)
      setFormData({})
      setStudioUrl(null)
      setAnalysisWarn(false)
      setAnalysisPhase('identifying')
      qrHandledRef.current = false
      qrSessionRef.current++
      // notWineError se mantiene para mostrarlo en el step frontal; se limpia al tomar nueva foto
    }
  }, [step])

  const activeIdx = stepIndex(step)

  return (
    <Layout>
      {/* ── Stepper editorial ─────────────────────────────────── */}
      <div className="flex items-center justify-center px-6 pt-4 pb-2 gap-3">
        {STEPS.map((label, i) => (
          <div key={label} className="flex flex-col items-center gap-1">
            <div
              className="w-2 h-2 rounded-full"
              style={{
                background: i === activeIdx
                  ? theme.colors.gold
                  : i < activeIdx
                    ? theme.colors.primary
                    : theme.colors.border,
                transform: i === activeIdx ? 'scale(1.4)' : 'scale(1)',
                transition: 'all 0.2s ease',
              }}
            />
            <span
              style={{
                fontSize: '0.55rem',
                letterSpacing: '0.08em',
                textTransform: 'uppercase',
                color: i === activeIdx ? theme.colors.gold : theme.colors.muted,
                opacity: i === activeIdx ? 1 : 0.6,
              }}
            >
              {label}
            </span>
          </div>
        ))}
      </div>

      {/* ── Steps content ──────────────────────────────────────── */}

      {/* Step 1 & 2: Camera hero */}
      {(step === 'frontal' || step === 'trasera') && (
        <>
          {notWineError && step === 'frontal' && (
            <div
              className="mx-5 mt-3 px-4 py-3 rounded-xl text-sm font-medium"
              style={{
                background: 'rgba(220,38,38,0.12)',
                border: '1px solid rgba(220,38,38,0.4)',
                color: '#f87171',
              }}
            >
              No hemos detectado una botella de vino. Asegúrate de que la etiqueta sea visible y vuelve a intentarlo.
            </div>
          )}
          <BarrelHero>

            {/* Preview thumbnail if captured */}
            {step === 'trasera' && frontImage && (
              <div
                className="relative z-10 mt-3"
                style={{ width: 52, height: 52, borderRadius: 10, overflow: 'hidden', border: `1px solid ${theme.colors.gold}40` }}
              >
                <img src={frontImage} alt="frontal" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                <div className="absolute inset-0" style={{ background: 'rgba(0,0,0,0.25)' }} />
                <svg
                  className="absolute inset-0 m-auto"
                  width="14" height="14" viewBox="0 0 24 24" fill="none"
                  stroke={theme.colors.gold} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"
                >
                  <polyline points="20 6 9 17 4 12"/>
                </svg>
              </div>
            )}


            <CameraButton
              onCamera={() => handleCameraOpen(step)}
              onGallery={() => handleGallery(step)}
            />
          </BarrelHero>

          {/* Step 2 action bar */}
          {step === 'trasera' && (
            <div className="flex gap-3 px-5 pt-5">
              <button
                className="flex-1 py-3 rounded-xl text-sm font-semibold"
                style={{ background: theme.colors.surface, color: theme.colors.muted, border: `1px solid ${theme.colors.border}` }}
                onClick={proceedToReview}
              >
                Omitir
              </button>
              {backImage && (
                <button
                  className="flex-1 py-3 rounded-xl text-sm font-semibold"
                  style={{ background: theme.colors.primary, color: theme.colors.cream }}
                  onClick={proceedToReview}
                >
                  Continuar
                </button>
              )}
            </div>
          )}
        </>
      )}

      {/* Step 3: Revisar */}
      {step === 'review' && (
        <div className="px-5 pt-5 pb-10 flex flex-col gap-5">
          <div>
            <h2
              className="text-editorial"
              style={{ fontSize: theme.font['2xl'], fontWeight: 700, color: theme.colors.cream, lineHeight: 1.1 }}
            >
              Revisa los datos
            </h2>
            <p style={{ fontSize: theme.font.sm, color: theme.colors.muted, marginTop: 4 }}>
              La IA ha extraído esta información — corrígela si es necesario
            </p>
          </div>

          {analysisWarn && !analyzing && (
            <div
              className="px-4 py-3 rounded-xl text-sm"
              style={{
                background: `${theme.colors.gold}14`,
                border:     `1px solid ${theme.colors.gold}50`,
                color:      theme.colors.gold,
              }}
            >
              No pudimos leer la etiqueta — completa los datos manualmente
            </div>
          )}
          {!analyzing && (
            <WineForm
              initialData={formData}
              onSubmit={handleSave}
              loading={saving}
            />
          )}
        </div>
      )}

      {/* Step 4: Saving */}
      {step === 'done' && (
        <div className="flex flex-col items-center gap-4 py-20">
          <Spinner />
          <p style={{ fontSize: theme.font.sm, color: theme.colors.muted }}>
            {saveStatus ?? 'Guardando en tu bodega…'}
          </p>
        </div>
      )}

      {/* ── Toast ─────────────────────────────────────────────── */}
      {toast && (
        <div
          className="fixed left-4 right-4 bottom-24 px-4 py-3 rounded-xl text-sm font-medium z-50 shadow-lg"
          style={{
            background: toast.kind === 'green' ? '#22c55e' : theme.colors.gold,
            color:      toast.kind === 'green' ? '#fff'    : theme.colors.dark,
          }}
        >
          {toast.msg}
        </div>
      )}

      <AnalysisProgress
        open={analyzing}
        completed={!analyzing && !analysisError && Object.keys(formData).length > 0}
        error={analysisError}
        phase={analysisPhase}
        onRetry={() => {
          setAnalysisError(false)
          setAnalysisPhase('analyzing')
          if (frontImage) launchAnalysis(frontImage, backImage ?? undefined)
        }}
      />

      <DuplicateWineDialog
        mode={dupMode}
        exactDuplicate={dupExact}
        similarWines={dupSimilar}
        onSaveAnyway={handleDupSaveAnyway}
        onCancel={handleDupCancel}
      />

      {cameraTarget && (
        <CameraView
          source={cameraSource}
          hint={cameraTarget === 'frontal' ? 'Centra la etiqueta frontal' : 'Centra la etiqueta trasera'}
          enableQR={cameraTarget === 'trasera'}
          onQrDetected={handleQrDetected}
          onCapture={async dataUrl => {
            const compressed = await compressImage(dataUrl)
            setCameraTarget(null)
            handleImageReady(compressed, cameraTarget)
          }}
          onCancel={() => { qrSessionRef.current++; setCameraTarget(null) }}
          onError={() => {
            setCameraTarget(null)
            handleCameraFallback(cameraTarget)
          }}
        />
      )}
    </Layout>
  )
}
