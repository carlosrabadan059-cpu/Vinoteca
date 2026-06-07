import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import Layout from '../components/ui/Layout'
import Spinner from '../components/ui/Spinner'
import ImageCapture from '../components/wine/ImageCapture'
import WineForm from '../components/wine/WineForm'
import { analyzeWineLabel } from '../lib/openai'
import { useWines } from '../hooks/useWines'
import { theme } from '../constants/theme'
import type { Wine } from '../types'

type Step = 'frontal' | 'trasera' | 'review' | 'done'

const STEPS = ['Foto frontal', 'Foto trasera', 'Revisar', 'Guardar'] as const

function stepIndex(step: Step) {
  return ['frontal', 'trasera', 'review', 'done'].indexOf(step)
}

export default function Scan() {
  const navigate = useNavigate()
  const { createWine, loading: saving, status: saveStatus } = useWines()

  const [step,         setStep]         = useState<Step>('frontal')
  const [frontImage,   setFrontImage]   = useState<string | null>(null)
  const [backImage,    setBackImage]    = useState<string | null>(null)
  const [analyzing,    setAnalyzing]    = useState(false)
  const [formData,     setFormData]     = useState<Partial<Wine>>({})
  const [analysisWarn, setAnalysisWarn] = useState(false)  // IA no pudo leer
  const [toast,        setToast]        = useState<{ msg: string; kind: 'green' | 'yellow' } | null>(null)

  // Holds the in-flight analysis promise so review step can await it
  const analysisRef = useRef<Promise<Partial<Wine>> | null>(null)

  function showToast(msg: string, kind: 'green' | 'yellow', ms = 3000) {
    setToast({ msg, kind })
    setTimeout(() => setToast(null), ms)
  }

  // ── Step 1: photo captured ─────────────────────────────────────────────────
  function handleFrontalCapture(dataUrl: string) {
    setFrontImage(dataUrl)
    setAnalyzing(true)
    setFormData({})
    setAnalysisWarn(false)

    analysisRef.current = analyzeWineLabel(dataUrl)
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
  }

  // ── Step 2 → 3 ────────────────────────────────────────────────────────────
  function proceedToReview() {
    setStep('review')
  }

  // ── Step 3 → save ─────────────────────────────────────────────────────────
  async function handleSave(data: Partial<Wine>) {
    // Wait for analysis if somehow still running
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

  // Reset if user navigates back to start manually
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
      {/* ── Stepper ─────────────────────────────────────────────── */}
      <div className="flex items-center px-5 pt-5 pb-3 gap-1">
        {STEPS.map((label, i) => (
          <div key={label} className="flex items-center" style={{ flex: i < STEPS.length - 1 ? '1 1 0' : undefined }}>
            <div className="flex flex-col items-center gap-1">
              <div
                className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold shrink-0"
                style={{
                  background: i === activeIdx
                    ? theme.colors.gold
                    : i < activeIdx
                      ? theme.colors.primary
                      : theme.colors.surface,
                  color: i === activeIdx ? theme.colors.dark : theme.colors.cream,
                  border: i === activeIdx ? `2px solid ${theme.colors.gold}` : 'none',
                }}
              >
                {i < activeIdx ? '✓' : i + 1}
              </div>
              <span
                className="text-xs text-center whitespace-nowrap"
                style={{ color: i === activeIdx ? theme.colors.gold : theme.colors.muted }}
              >
                {label}
              </span>
            </div>
            {i < STEPS.length - 1 && (
              <div
                className="flex-1 h-px mx-1 mb-4"
                style={{ background: i < activeIdx ? theme.colors.primary : '#3A2A2E' }}
              />
            )}
          </div>
        ))}
      </div>

      {/* ── Content ─────────────────────────────────────────────── */}
      <div className="px-5 pb-8 flex flex-col gap-5">

        {/* Step 1: Foto frontal */}
        {step === 'frontal' && (
          <>
            <h2 className="text-lg font-semibold" style={{ color: theme.colors.cream }}>
              Foto de la etiqueta frontal
            </h2>
            <ImageCapture
              label="Etiqueta frontal"
              imageDataUrl={frontImage ?? undefined}
              onCapture={handleFrontalCapture}
            />
            {frontImage && (
              <button
                className="w-full py-3 rounded-xl font-semibold text-base"
                style={{ background: theme.colors.primary, color: theme.colors.cream }}
                onClick={() => setStep('trasera')}
              >
                Continuar
              </button>
            )}
          </>
        )}

        {/* Step 2: Foto trasera */}
        {step === 'trasera' && (
          <>
            <h2 className="text-lg font-semibold" style={{ color: theme.colors.cream }}>
              Foto de la etiqueta trasera
              <span className="text-sm font-normal ml-2" style={{ color: theme.colors.muted }}>
                (opcional)
              </span>
            </h2>

            {analyzing && (
              <div className="flex items-center gap-3 px-4 py-3 rounded-xl" style={{ background: theme.colors.surface }}>
                <Spinner size={20} />
                <span className="text-sm" style={{ color: theme.colors.muted }}>
                  Analizando etiqueta con IA…
                </span>
              </div>
            )}

            <ImageCapture
              label="Etiqueta trasera"
              imageDataUrl={backImage ?? undefined}
              onCapture={(url) => { setBackImage(url) }}
              optional
            />

            <div className="flex gap-3 mt-1">
              <button
                className="flex-1 py-3 rounded-xl font-semibold text-sm"
                style={{ background: theme.colors.surface, color: theme.colors.muted, border: '1px solid #3A2A2E' }}
                onClick={proceedToReview}
              >
                Omitir
              </button>
              {backImage && (
                <button
                  className="flex-1 py-3 rounded-xl font-semibold text-sm"
                  style={{ background: theme.colors.primary, color: theme.colors.cream }}
                  onClick={proceedToReview}
                >
                  Continuar
                </button>
              )}
            </div>
          </>
        )}

        {/* Step 3: Revisar */}
        {step === 'review' && (
          <>
            <h2 className="text-lg font-semibold" style={{ color: theme.colors.cream }}>
              Revisa los datos
            </h2>

            {analyzing ? (
              <div className="flex flex-col items-center gap-4 py-12">
                <Spinner />
                <p className="text-sm" style={{ color: theme.colors.muted }}>Analizando etiqueta con IA…</p>
              </div>
            ) : (
              <>
                {analysisWarn && (
                  <div
                    className="px-4 py-3 rounded-xl text-sm"
                    style={{
                      background: `${theme.colors.gold}18`,
                      border:     `1px solid ${theme.colors.gold}`,
                      color:      theme.colors.gold,
                    }}
                  >
                    No pudimos leer la etiqueta, completa los datos manualmente
                  </div>
                )}
                <WineForm
                  initialData={formData}
                  onSubmit={handleSave}
                  loading={saving}
                />
              </>
            )}
          </>
        )}

        {/* Step 4: Saving spinner */}
        {step === 'done' && (
          <div className="flex flex-col items-center gap-4 py-16">
            <Spinner />
            <p className="text-sm" style={{ color: theme.colors.muted }}>
              {saveStatus ?? 'Guardando en tu bodega…'}
            </p>
          </div>
        )}
      </div>

      {/* ── Toast ───────────────────────────────────────────────── */}
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
