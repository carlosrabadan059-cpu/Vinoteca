import { useState } from 'react'
import Button from '../ui/Button'
import Spinner from '../ui/Spinner'
import { theme } from '../../constants/theme'
import type { Tasting } from '../../types'

interface EditFields {
  fecha:             string
  puntuacion:        number | null
  notas_cata:        string
  color_descripcion: string
  aroma:             string
  maridaje:          string
  lugar:             string
  ocasion:           string
  botella_terminada: boolean
}

interface TastingEditFormProps {
  tasting:  Tasting
  onSave:   (fields: Partial<Tasting>) => Promise<void>
  onCancel: () => void
}

function toFields(t: Tasting): EditFields {
  return {
    fecha:             t.fecha,
    puntuacion:        t.puntuacion,
    notas_cata:        t.notas_cata        ?? '',
    color_descripcion: t.color_descripcion ?? '',
    aroma:             t.aroma             ?? '',
    maridaje:          t.maridaje          ?? '',
    lugar:             t.lugar             ?? '',
    ocasion:           t.ocasion           ?? '',
    botella_terminada: t.botella_terminada,
  }
}

function scoreColor(s: number) {
  const t = theme
  if (s >= 90) return t.colors.gold
  if (s >= 75) return t.colors.success
  return t.colors.muted
}

export default function TastingEditForm({ tasting, onSave, onCancel }: TastingEditFormProps) {
  const [fields,  setFields]  = useState<EditFields>(toFields(tasting))
  const [saving,  setSaving]  = useState(false)
  const [hasScore, setHasScore] = useState(tasting.puntuacion !== null)

  const t = theme

  const set = <K extends keyof EditFields>(k: K, v: EditFields[K]) =>
    setFields(prev => ({ ...prev, [k]: v }))

  async function handleSave() {
    setSaving(true)
    await onSave({
      fecha:             fields.fecha,
      puntuacion:        hasScore ? fields.puntuacion : null,
      notas_cata:        fields.notas_cata.trim()        || null,
      color_descripcion: fields.color_descripcion.trim() || null,
      aroma:             fields.aroma.trim()             || null,
      maridaje:          fields.maridaje.trim()          || null,
      lugar:             fields.lugar.trim()             || null,
      ocasion:           fields.ocasion.trim()           || null,
      botella_terminada: fields.botella_terminada,
    })
    setSaving(false)
  }

  const inputStyle: React.CSSProperties = {
    background:   t.colors.surface,
    border:       `1px solid ${t.colors.borderSubtle}`,
    borderRadius: t.radius.md,
    color:        t.colors.cream,
    fontSize:     t.font.sm,
    padding:      '8px 10px',
    width:        '100%',
    outline:      'none',
  }

  const labelStyle: React.CSSProperties = {
    fontSize:      t.font.xs,
    letterSpacing: '0.08em',
    textTransform: 'uppercase',
    color:         t.colors.muted,
    fontWeight:    600,
    display:       'block',
    marginBottom:  4,
  }

  const textareaStyle: React.CSSProperties = {
    ...inputStyle,
    resize:     'none',
    lineHeight: 1.6,
  }

  return (
    <div className="flex flex-col gap-4">

      {/* Puntuación */}
      <div className="rounded-xl p-4" style={{ background: t.colors.surface, border: `1px solid ${t.colors.borderSubtle}` }}>
        <div className="flex items-center justify-between mb-3">
          <label style={labelStyle}>Puntuación</label>
          {hasScore ? (
            <span style={{ fontSize: t.font.xl, fontWeight: 700, color: scoreColor(fields.puntuacion ?? 75), fontFamily: t.font.serif }}>
              {fields.puntuacion ?? 75}
            </span>
          ) : (
            <span style={{ fontSize: t.font.sm, color: t.colors.muted }}>sin puntuar</span>
          )}
        </div>
        <input
          type="range"
          min={50}
          max={100}
          value={fields.puntuacion ?? 75}
          onChange={e => { set('puntuacion', Number(e.target.value)); setHasScore(true) }}
          style={{ width: '100%', accentColor: t.colors.primary }}
        />
        <div className="flex justify-between mt-1">
          <span style={{ fontSize: t.font.xs, color: t.colors.muted }}>50</span>
          <span style={{ fontSize: t.font.xs, color: t.colors.muted }}>100</span>
        </div>
        {hasScore && (
          <button
            onClick={() => { setHasScore(false); set('puntuacion', null) }}
            style={{ fontSize: t.font.xs, color: t.colors.muted, background: 'none', border: 'none', cursor: 'pointer', marginTop: 6, padding: 0 }}
          >
            Quitar puntuación
          </button>
        )}
      </div>

      {/* Notas de cata */}
      <div>
        <label style={labelStyle}>Notas de cata / Boca</label>
        <textarea
          rows={3}
          value={fields.notas_cata}
          onChange={e => set('notas_cata', e.target.value)}
          placeholder="Impresiones en boca…"
          style={textareaStyle}
        />
      </div>

      {/* Color */}
      <div>
        <label style={labelStyle}>Color</label>
        <textarea
          rows={2}
          value={fields.color_descripcion}
          onChange={e => set('color_descripcion', e.target.value)}
          placeholder="Descripción del color…"
          style={textareaStyle}
        />
      </div>

      {/* Aroma */}
      <div>
        <label style={labelStyle}>Aroma</label>
        <textarea
          rows={2}
          value={fields.aroma}
          onChange={e => set('aroma', e.target.value)}
          placeholder="Aromas percibidos…"
          style={textareaStyle}
        />
      </div>

      {/* Maridaje */}
      <div>
        <label style={labelStyle}>Maridaje</label>
        <input
          type="text"
          value={fields.maridaje}
          onChange={e => set('maridaje', e.target.value)}
          placeholder="¿Con qué lo maridaste?"
          style={inputStyle}
        />
      </div>

      <div style={{ height: 1, background: t.colors.borderDivider }} />

      {/* Fecha */}
      <div>
        <label style={labelStyle}>Fecha</label>
        <input
          type="date"
          value={fields.fecha}
          onChange={e => set('fecha', e.target.value)}
          style={inputStyle}
        />
      </div>

      {/* Lugar */}
      <div>
        <label style={labelStyle}>Lugar</label>
        <input
          type="text"
          value={fields.lugar}
          onChange={e => set('lugar', e.target.value)}
          placeholder="Restaurante, casa, evento…"
          style={inputStyle}
        />
      </div>

      {/* Ocasión */}
      <div>
        <label style={labelStyle}>Ocasión</label>
        <input
          type="text"
          value={fields.ocasion}
          onChange={e => set('ocasion', e.target.value)}
          placeholder="Cena, celebración…"
          style={inputStyle}
        />
      </div>

      {/* Botella terminada */}
      <button
        onClick={() => set('botella_terminada', !fields.botella_terminada)}
        className="flex items-center gap-3 rounded-xl px-3 py-3 w-full text-left"
        style={{
          background: fields.botella_terminada ? t.colors.primary + '18' : t.colors.surface,
          border:     `1px solid ${fields.botella_terminada ? t.colors.primaryBorder : t.colors.borderSubtle}`,
        }}
      >
        <span style={{ fontSize: t.font.lg }}>{fields.botella_terminada ? '🍾' : '🍷'}</span>
        <div>
          <p style={{ fontSize: t.font.sm, fontWeight: 600, color: t.colors.cream }}>Botella terminada</p>
          <p style={{ fontSize: t.font.xs, color: t.colors.muted }}>
            {fields.botella_terminada ? 'Sí, la acabamos' : 'Quedó vino en la botella'}
          </p>
        </div>
        <div
          className="ml-auto flex-shrink-0"
          style={{
            width: 20, height: 20, borderRadius: '50%',
            background: fields.botella_terminada ? t.colors.primary : 'transparent',
            border: `2px solid ${fields.botella_terminada ? t.colors.primaryBorder : t.colors.borderSubtle}`,
          }}
        />
      </button>

      {/* Acciones */}
      <div className="flex gap-3 pt-2">
        <Button variant="secondary" className="flex-1" onClick={onCancel} disabled={saving}>
          Cancelar
        </Button>
        <Button
          className="flex-1 flex items-center justify-center gap-2"
          onClick={handleSave}
          disabled={saving}
        >
          {saving ? <><Spinner size={16} /><span>Guardando…</span></> : 'Guardar cambios'}
        </Button>
      </div>
    </div>
  )
}
