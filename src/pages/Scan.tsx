import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import Layout from '../components/ui/Layout'
import Spinner from '../components/ui/Spinner'
import WineForm from '../components/wine/WineForm'
import { analyzeWineLabel } from '../lib/openai'
import { useWines } from '../hooks/useWines'
import { useCamera } from '../hooks/useCamera'
import { theme } from '../constants/theme'
import type { Wine } from '../types'

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

// ── Step badge ────────────────────────────────────────────────────────────
function StepBadge({ label }: { label: string }) {
  return (
    <div
      className="relative z-10 mt-auto mb-0 px-4 py-1.5 rounded-full text-xs font-semibold tracking-widest uppercase"
      style={{
        background: 'rgba(13,6,8,0.75)',
        color: theme.colors.gold,
        border: `1px solid rgba(201,168,76,0.4)`,
        backdropFilter: 'blur(10px)',
        letterSpacing: '0.14em',
      }}
    >
      {label}
    </div>
  )
}

export default function Scan() {
  const navigate = useNavigate()
  const { createWine, loading: saving, status: saveStatus } = useWines()
  const { takePhoto, pickFromGallery, compressImage } = useCamera()

  const [step,         setStep]         = useState<Step>('frontal')
  const [frontImage,   setFrontImage]   = useState<string | null>(null)
  const [backImage,    setBackImage]    = useState<string | null>(null)
  const [analyzing,    setAnalyzing]    = useState(false)
  const [formData,     setFormData]     = useState<Partial<Wine>>({})
  const [analysisWarn, setAnalysisWarn] = useState(false)
  const [toast,        setToast]        = useState<{ msg: string; kind: 'green' | 'yellow' } | null>(null)

  const analysisRef = useRef<Promise<Partial<Wine>> | null>(null)

  function showToast(msg: string, kind: 'green' | 'yellow', ms = 3000) {
    setToast({ msg, kind })
    setTimeout(() => setToast(null), ms)
  }

  async function handleCapture(source: 'camera' | 'gallery', target: 'frontal' | 'trasera') {
    const raw = source === 'camera' ? await takePhoto() : await pickFromGallery()
    if (!raw) return
    const compressed = await compressImage(raw)

    if (target === 'frontal') {
      setFrontImage(compressed)
      setAnalyzing(true)
      setFormData({})
      setAnalysisWarn(false)

      analysisRef.current = analyzeWineLabel(compressed)
        .then(result => {
          const isEmpty = !result.nombre && !result.bodega && !result.region && !result.uva
          setFormData(result)
          setAnalysisWarn(isEmpty)
          setAnalyzing(false)
          return result
        })
        .catch(() => {
          setFormData({})
          setAnalysisWarn(true)
          setAnalyzing(false)
          return {}
        })

      setStep('trasera')
    } else {
      setBackImage(compressed)
    }
  }

  function proceedToReview() { setStep('review') }

  async function handleSave(data: Partial<Wine>) {
    if (analyzing) await analysisRef.current
    try {
      setStep('done')
      const wine = await createWine(data, {
        frontal: frontImage ?? undefined,
        trasera: backImage  ?? undefined,
      })
      if (wine.synced_at === null) {
        showToast('Guardado localmente, se sincronizará cuando tengas conexión', 'yellow', 4000)
        setTimeout(() => navigate('/bodega'), 2000)
      } else {
        showToast('¡Vino guardado en tu bodega!', 'green', 2500)
        setTimeout(() => navigate('/bodega'), 1200)
      }
    } catch {
      setStep('review')
      showToast('Error al guardar. Inténtalo de nuevo.', 'yellow', 3500)
    }
  }

  useEffect(() => {
    if (step === 'frontal') {
      setFrontImage(null)
      setBackImage(null)
      setFormData({})
      setAnalysisWarn(false)
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

            {analyzing && step === 'trasera' && (
              <div
                className="relative z-10 flex items-center gap-2 px-3 py-1.5 rounded-full text-xs"
                style={{
                  background: 'rgba(13,6,8,0.75)',
                  color: theme.colors.muted,
                  border: `1px solid ${theme.colors.border}`,
                  backdropFilter: 'blur(8px)',
                }}
              >
                <Spinner size={12} />
                Analizando con IA…
              </div>
            )}

            <CameraButton
              onCamera={() => handleCapture('camera', step)}
              onGallery={() => handleCapture('gallery', step)}
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

          {analyzing ? (
            <div className="flex flex-col items-center gap-4 py-16">
              <Spinner />
              <p style={{ fontSize: theme.font.sm, color: theme.colors.muted }}>Analizando etiqueta con IA…</p>
            </div>
          ) : (
            <>
              {analysisWarn && (
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
              <WineForm
                initialData={formData}
                onSubmit={handleSave}
                loading={saving}
              />
            </>
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
    </Layout>
  )
}
