import { useState } from 'react'
import ScaleInput from '../ui/ScaleInput'
import Spinner from '../ui/Spinner'
import TutorPanel from './TutorPanel'
import { theme } from '../../constants/theme'
import { BOCA_ESCALAS, FINAL_OPCIONES, describeBoca } from '../../lib/cuadernoHelpers'
import type { JournalSheetData } from '../../lib/cuadernoHelpers'
import { callCataTutor } from '../../lib/n8n'
import type { TutorFeedback, TutorNotaPro, TutorSeccion } from '../../lib/n8n'
import { useGlossary } from '../../hooks/useGlossary'
import { useToastStore } from '../../store/toastStore'
import type { Wine } from '../../types'

interface JournalSheetFormProps {
  initial:        JournalSheetData
  /** Solo los vinos de la bodega tienen botellas que descontar. */
  showBottleDone: boolean
  saving:         boolean
  submitLabel?:   string
  onSubmit:       (data: JournalSheetData) => void
  /** Con el vino, cada sección ofrece la revisión del tutor de cata. */
  wine?:          Wine
}

interface TutorState {
  loading:  boolean
  error:    string | null
  feedback: TutorFeedback | null
}

const t = theme

const sectionTitle: React.CSSProperties = {
  fontSize: t.font.xs, letterSpacing: '0.16em', textTransform: 'uppercase',
  color: t.colors.gold, fontWeight: 700, marginBottom: 8,
}
const labelStyle: React.CSSProperties = {
  fontSize: t.font.xs, letterSpacing: '0.08em', textTransform: 'uppercase',
  color: t.colors.muted, fontWeight: 600, display: 'block', marginBottom: 4,
}
const inputStyle: React.CSSProperties = {
  background: t.colors.surface, border: `1px solid ${t.colors.borderSubtle}`,
  borderRadius: t.radius.md, color: t.colors.cream, fontSize: t.font.sm,
  padding: '8px 10px', width: '100%', outline: 'none', fontFamily: 'inherit',
}

function Section({ title, action, children }: { title: string; action?: React.ReactNode; children: React.ReactNode }) {
  return (
    <section className="flex flex-col gap-3 pb-4" style={{ borderBottom: `1px solid ${t.colors.borderDivider}` }}>
      <div className="flex items-center justify-between gap-2">
        <p style={{ ...sectionTitle, marginBottom: 0 }}>{title}</p>
        {action}
      </div>
      {children}
    </section>
  )
}

export default function JournalSheetForm({ initial, showBottleDone, saving, submitLabel = 'Guardar en el cuaderno', onSubmit, wine }: JournalSheetFormProps) {
  const [d, setD] = useState<JournalSheetData>(initial)
  const set = <K extends keyof JournalSheetData>(k: K, v: JournalSheetData[K]) => setD(prev => ({ ...prev, [k]: v }))

  // ── Tutor de cata ──────────────────────────────────────────────────────────
  const [tutor,    setTutor]    = useState<Partial<Record<TutorSeccion, TutorState>>>({})
  // Notas profesionales de Brave: se piden una vez y se reenvían en las demás secciones
  const [notasPro, setNotasPro] = useState<TutorNotaPro[]>([])
  const { saveTerms } = useGlossary()
  const toast = useToastStore()

  const respuestaDe = (s: TutorSeccion) =>
    s === 'vista' ? (d.color_descripcion ?? '').trim()
    : s === 'nariz' ? (d.aroma ?? '').trim()
    : describeBoca(d)

  async function revisar(seccion: TutorSeccion) {
    if (!wine) return
    setTutor(prev => ({ ...prev, [seccion]: { loading: true, error: null, feedback: null } }))
    try {
      const fb = await callCataTutor({
        seccion,
        respuesta: respuestaDe(seccion),
        wine: {
          nombre: wine.nombre, bodega: wine.bodega, anada: wine.anada, tipo: wine.tipo, uva: wine.uva,
          region: wine.region, denominacion: wine.denominacion, crianza: wine.crianza,
        },
        notasPro,
      })
      if (fb.notasPro?.length) setNotasPro(fb.notasPro)
      setTutor(prev => ({ ...prev, [seccion]: { loading: false, error: null, feedback: { ...fb, notasPro: fb.notasPro ?? [] } } }))
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err)
      setTutor(prev => ({ ...prev, [seccion]: { loading: false, error: msg, feedback: null } }))
    }
  }

  function usarVersion(seccion: TutorSeccion) {
    const texto = tutor[seccion]?.feedback?.version_pro
    if (!texto) return
    if (seccion === 'vista') set('color_descripcion', texto)
    else if (seccion === 'nariz') set('aroma', texto)
    // Boca no tiene campo de texto propio: la frase se añade a las notas
    else set('notas_cata', d.notas_cata ? `${d.notas_cata}\n${texto}` : texto)
  }

  async function guardarTerminos(seccion: TutorSeccion, terms: TutorFeedback['terminos']) {
    try {
      await saveTerms(terms, { categoria: seccion, wine_id: wine?.id ?? null })
      toast.show(terms.length === 1 ? 'Guardado en tu glosario' : `${terms.length} términos guardados en tu glosario`)
    } catch (err) {
      toast.show(err instanceof Error ? err.message : 'No se pudo guardar en el glosario', 'error')
      throw err
    }
  }

  function revisarBoton(seccion: TutorSeccion) {
    if (!wine) return undefined
    const vacio = !respuestaDe(seccion)
    const cargando = tutor[seccion]?.loading
    return (
      <button
        type="button"
        onClick={() => revisar(seccion)}
        disabled={vacio || cargando}
        title={vacio ? 'Escribe primero lo que percibes' : 'Revisar con el sumiller'}
        className="rounded-full px-3 py-1"
        style={{
          fontSize: t.font.xs, cursor: vacio || cargando ? 'not-allowed' : 'pointer',
          background: 'transparent', color: t.colors.gold, border: `1px solid ${t.colors.goldBorder}`,
          opacity: vacio ? 0.4 : 1,
        }}
      >
        🎓 Revisar
      </button>
    )
  }

  function panel(seccion: TutorSeccion, useLabel: string) {
    const st = tutor[seccion]
    if (!st) return null
    return (
      <TutorPanel
        key={st.feedback?.version_pro ?? String(st.loading)}
        feedback={st.feedback}
        loading={st.loading}
        error={st.error}
        useLabel={useLabel}
        onUseVersion={() => usarVersion(seccion)}
        onSaveTerms={terms => guardarTerminos(seccion, terms)}
        onClose={() => setTutor(prev => { const next = { ...prev }; delete next[seccion]; return next })}
      />
    )
  }
  const text = (k: 'lugar' | 'con_quien' | 'ocasion' | 'color_descripcion' | 'aroma' | 'maridaje' | 'notas_cata') =>
    ({ value: d[k] ?? '', onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => set(k, e.target.value || null) })

  return (
    <form
      className="flex flex-col gap-4"
      onSubmit={e => { e.preventDefault(); onSubmit(d) }}
    >
      <Section title="Cuándo y dónde">
        <div className="flex gap-2">
          <div style={{ flex: 1 }}>
            <label style={labelStyle}>Fecha</label>
            <input type="date" value={d.fecha} onChange={e => set('fecha', e.target.value)} style={inputStyle} required />
          </div>
          <div style={{ flex: 1 }}>
            <label style={labelStyle}>Lugar</label>
            <input type="text" {...text('lugar')} placeholder="Restaurante, casa…" style={inputStyle} />
          </div>
        </div>
        <div className="flex gap-2">
          <div style={{ flex: 1 }}>
            <label style={labelStyle}>Con quién</label>
            <input type="text" {...text('con_quien')} placeholder="Ana, amigos…" style={inputStyle} />
          </div>
          <div style={{ flex: 1 }}>
            <label style={labelStyle}>Ocasión</label>
            <input type="text" {...text('ocasion')} placeholder="Cumpleaños, cena…" style={inputStyle} />
          </div>
        </div>
      </Section>

      <Section title="Vista" action={revisarBoton('vista')}>
        <input type="text" {...text('color_descripcion')} placeholder="Rubí intenso, ribete violáceo, limpio…" style={inputStyle} />
        {panel('vista', 'Usar esta versión')}
      </Section>

      <Section title="Nariz" action={revisarBoton('nariz')}>
        <input type="text" {...text('aroma')} placeholder="Fruta negra, cuero, vainilla…" style={inputStyle} />
        {panel('nariz', 'Usar esta versión')}
      </Section>

      <Section title="Boca" action={revisarBoton('boca')}>
        {BOCA_ESCALAS.map(s => (
          <ScaleInput
            key={s.key}
            label={s.label}
            minLabel={s.min}
            maxLabel={s.max}
            value={d[s.key]}
            onChange={v => set(s.key, v)}
          />
        ))}
        <div className="flex items-center justify-between">
          <span style={{ fontSize: t.font.sm, fontWeight: 600, color: t.colors.text }}>Final</span>
          <div className="flex gap-2">
            {FINAL_OPCIONES.map(o => {
              const active = d.final === o.id
              return (
                <button
                  key={o.id}
                  type="button"
                  onClick={() => set('final', active ? null : o.id)}
                  className="px-3 py-1 rounded-full"
                  style={{
                    fontSize: t.font.sm, cursor: 'pointer',
                    background: active ? t.colors.gold : 'transparent',
                    color:      active ? t.colors.dark : t.colors.muted,
                    border:     `1px solid ${active ? t.colors.gold : t.colors.border}`,
                  }}
                >
                  {o.label}
                </button>
              )
            })}
          </div>
        </div>
        {panel('boca', 'Añadir a mis notas')}
      </Section>

      <Section title="Valoración">
        <div>
          <div className="flex items-center justify-between mb-1">
            <span style={labelStyle}>Puntuación</span>
            <span style={{ fontSize: d.puntuacion === null ? t.font.sm : t.font.xl, fontWeight: 700, color: d.puntuacion === null ? t.colors.muted : t.colors.gold, fontFamily: t.font.serif }}>
              {d.puntuacion ?? 'sin puntuar'}
            </span>
          </div>
          <input
            type="range" min={50} max={100}
            value={d.puntuacion ?? 75}
            onChange={e => set('puntuacion', Number(e.target.value))}
            style={{ width: '100%', accentColor: t.colors.primary }}
            aria-label="Puntuación de 50 a 100"
          />
        </div>
        <div>
          <label style={labelStyle}>Maridaje</label>
          <input type="text" {...text('maridaje')} placeholder="Cordero asado, quesos curados…" style={inputStyle} />
        </div>
        <div>
          <label style={labelStyle}>Notas</label>
          <textarea {...text('notas_cata')} rows={4} placeholder="Impresión general, si lo volverías a beber…" style={{ ...inputStyle, resize: 'none', lineHeight: 1.6 }} />
        </div>
      </Section>

      {showBottleDone && (
        <label className="flex items-center gap-3" style={{ fontSize: t.font.sm, color: t.colors.text, cursor: 'pointer' }}>
          <input
            type="checkbox"
            checked={d.botella_terminada}
            onChange={e => set('botella_terminada', e.target.checked)}
            style={{ accentColor: t.colors.primary, width: 18, height: 18 }}
          />
          Botella terminada (descuenta una de la bodega)
        </label>
      )}

      <button
        type="submit"
        disabled={saving}
        className="rounded-xl font-semibold flex items-center justify-center gap-2"
        style={{
          background: t.colors.primary, color: t.colors.cream, fontSize: t.font.base,
          padding: '13px 0', border: 'none', boxShadow: `0 4px 24px ${t.colors.primary}40`,
          opacity: saving ? 0.6 : 1, cursor: saving ? 'not-allowed' : 'pointer',
        }}
      >
        {saving ? <><Spinner size={16} /><span>Guardando…</span></> : submitLabel}
      </button>
    </form>
  )
}
