import { useState } from 'react'
import Spinner from '../ui/Spinner'
import { theme } from '../../constants/theme'
import type { TutorFeedback } from '../../lib/n8n'

interface TutorPanelProps {
  feedback:     TutorFeedback | null
  loading:      boolean
  error:        string | null
  /** Aplica la versión del sumiller al campo de la sección. */
  onUseVersion: () => void
  useLabel:     string
  onSaveTerms:  (terms: TutorFeedback['terminos']) => Promise<void>
  onClose:      () => void
}

const t = theme

// El modelo a veces marca negritas con ** en texto plano: se quitan.
const plain = (s: string) => s.replace(/\*\*/g, '')

const heading: React.CSSProperties = {
  fontSize: t.font.xs, letterSpacing: '0.08em', textTransform: 'uppercase',
  color: t.colors.muted, fontWeight: 600, marginBottom: 4,
}

function smallButton(active = false): React.CSSProperties {
  return {
    fontSize: t.font.xs, cursor: 'pointer', borderRadius: t.radius.full, padding: '4px 10px',
    background: active ? t.colors.gold : 'transparent',
    color:      active ? t.colors.dark : t.colors.gold,
    border:     `1px solid ${t.colors.goldBorder}`,
  }
}

/** Corrección del tutor de cata para una sección de la ficha. */
export default function TutorPanel({ feedback, loading, error, onUseVersion, useLabel, onSaveTerms, onClose }: TutorPanelProps) {
  const [openTerm, setOpenTerm] = useState<string | null>(null)
  const [saved,    setSaved]    = useState<Set<string>>(new Set())
  const [saving,   setSaving]   = useState(false)
  const [used,     setUsed]     = useState(false)
  const [showPro,  setShowPro]  = useState(false)

  const container: React.CSSProperties = {
    background: t.colors.surface2, border: `1px solid ${t.colors.goldBorder}`,
    borderRadius: t.radius.md, padding: 12, fontSize: t.font.sm, color: t.colors.text, lineHeight: 1.5,
  }

  if (loading) {
    return (
      <div className="flex items-center gap-2" style={container}>
        <Spinner size={14} />
        <span style={{ color: t.colors.muted }}>El sumiller está revisando tu descripción…</span>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex items-start justify-between gap-2" style={{ ...container, borderColor: t.colors.error }}>
        <span style={{ color: t.colors.error }}>No se pudo revisar: {error}</span>
        <button type="button" onClick={onClose} style={{ ...smallButton(), border: 'none' }} aria-label="Cerrar">✕</button>
      </div>
    )
  }

  if (!feedback) return null

  const pending = feedback.terminos.filter(x => !saved.has(x.termino.toLowerCase()))

  async function save(terms: TutorFeedback['terminos']) {
    setSaving(true)
    try {
      await onSaveTerms(terms)
      setSaved(prev => new Set([...prev, ...terms.map(x => x.termino.toLowerCase())]))
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="flex flex-col gap-3" style={container}>
      <div className="flex items-start justify-between gap-2">
        <p style={{ color: t.colors.cream }}>🎓 {plain(feedback.valoracion)}</p>
        <button type="button" onClick={onClose} style={{ background: 'none', border: 'none', color: t.colors.muted, cursor: 'pointer' }} aria-label="Cerrar revisión">✕</button>
      </div>

      {feedback.falta.length > 0 && (
        <div>
          <p style={heading}>Fíjate también en</p>
          <ul className="flex flex-col gap-1">
            {feedback.falta.map((f, i) => (
              <li key={i} className="flex gap-2">
                <span style={{ color: t.colors.gold }}>·</span><span>{plain(f)}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {feedback.version_pro && (
        <div>
          <p style={heading}>Cómo lo diría un sumiller</p>
          <p style={{ fontStyle: 'italic', color: t.colors.cream }}>«{plain(feedback.version_pro)}»</p>
          <button
            type="button"
            className="mt-2"
            disabled={used}
            onClick={() => { onUseVersion(); setUsed(true) }}
            style={{ ...smallButton(used), opacity: used ? 0.7 : 1 }}
          >
            {used ? '✓ Aplicado' : useLabel}
          </button>
        </div>
      )}

      {feedback.terminos.length > 0 && (
        <div>
          <p style={heading}>Vocabulario</p>
          <div className="flex flex-wrap gap-2">
            {feedback.terminos.map(term => {
              const isSaved = saved.has(term.termino.toLowerCase())
              return (
                <button
                  key={term.termino}
                  type="button"
                  onClick={() => setOpenTerm(openTerm === term.termino ? null : term.termino)}
                  style={{
                    ...smallButton(openTerm === term.termino),
                    color: openTerm === term.termino ? t.colors.dark : t.colors.cream,
                  }}
                >
                  {isSaved ? '✓ ' : ''}{term.termino}
                </button>
              )
            })}
          </div>
          {openTerm && (() => {
            const term = feedback.terminos.find(x => x.termino === openTerm)
            if (!term) return null
            const isSaved = saved.has(term.termino.toLowerCase())
            return (
              <div className="mt-2 flex flex-col gap-2">
                <p><strong style={{ color: t.colors.gold }}>{term.termino}:</strong> {plain(term.definicion)}</p>
                {!isSaved && (
                  <button type="button" disabled={saving} onClick={() => save([term])} style={{ ...smallButton(), alignSelf: 'flex-start' }}>
                    Guardar en mi glosario
                  </button>
                )}
              </div>
            )
          })()}
          {pending.length > 1 && (
            <button type="button" disabled={saving} onClick={() => save(pending)} className="mt-2" style={smallButton()}>
              {saving ? 'Guardando…' : `📖 Guardar los ${pending.length} en mi glosario`}
            </button>
          )}
        </div>
      )}

      {(feedback.comparacion_pro || feedback.notasPro.length > 0) && (
        <div>
          <button
            type="button"
            onClick={() => setShowPro(v => !v)}
            style={{ ...heading, background: 'none', border: 'none', padding: 0, cursor: 'pointer', color: t.colors.gold }}
          >
            {showPro ? '▾' : '▸'} Lo que dicen los profesionales
          </button>
          {showPro && (
            <div className="flex flex-col gap-2">
              <p>{feedback.comparacion_pro ? plain(feedback.comparacion_pro) : 'No hay notas de cata de este vino concreto; estas son las fuentes encontradas.'}</p>
              <ol className="flex flex-col gap-1" style={{ fontSize: t.font.xs }}>
                {feedback.notasPro.map((n, i) => (
                  <li key={n.url}>
                    [{i + 1}]{' '}
                    <a href={n.url} target="_blank" rel="noopener noreferrer" style={{ color: t.colors.gold, textDecoration: 'underline' }}>
                      {n.titulo || n.url}
                    </a>
                  </li>
                ))}
              </ol>
            </div>
          )}
        </div>
      )}

      {feedback.siguiente && (
        <p style={{ color: t.colors.muted, borderTop: `1px solid ${t.colors.border}`, paddingTop: 8 }}>
          ➜ {plain(feedback.siguiente)}
        </p>
      )}
    </div>
  )
}
