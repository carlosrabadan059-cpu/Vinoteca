import { useState, useEffect, useRef } from 'react'
import { theme } from '../../constants/theme'
import type { Wine } from '../../types'

interface WineFormProps {
  initialData:         Partial<Wine>
  onSubmit:            (data: Partial<Wine>) => void
  loading:             boolean
  identifyConfidence?: number   // 0–1; drives the global chip
  imageUrl?:           string   // miniatura en el resumen
  editMode?:           boolean  // true cuando se edita un vino existente
}

// ── Field status ──────────────────────────────────────────────────────────────
type FieldStatus = 'auto' | 'edited' | 'review' | 'empty'

function deriveStatus(original: string | number | boolean | null | undefined, current: string | number | boolean | null | undefined): FieldStatus {
  const orig = original !== null && original !== undefined && original !== '' ? String(original) : ''
  const curr = current  !== null && current  !== undefined && current  !== '' ? String(current)  : ''
  if (curr === '') return 'empty'
  if (orig === '' && curr !== '') return 'edited'
  if (curr !== orig) return 'edited'
  return 'auto'
}

function FieldStatusBadge({ status }: { status: FieldStatus }) {
  if (status === 'empty') return null
  if (status === 'auto')
    return <span style={{ fontSize: '0.62rem', color: theme.colors.muted, opacity: 0.55, fontWeight: 600 }}>✓</span>
  if (status === 'edited')
    return <span style={{ fontSize: '0.62rem', color: '#7EB3E0', fontWeight: 600 }}>✏</span>
  if (status === 'review')
    return <span style={{ fontSize: '0.62rem', color: '#E07070', fontWeight: 600 }}>⚠</span>
  return null
}

// ── Collapsible section ───────────────────────────────────────────────────────
function Section({
  title, meta, defaultOpen, children,
}: {
  title: string
  meta?: string
  defaultOpen: boolean
  children: React.ReactNode
}) {
  const [open, setOpen] = useState(defaultOpen)
  const bodyRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!bodyRef.current) return
    if (open) {
      bodyRef.current.style.maxHeight = bodyRef.current.scrollHeight + 400 + 'px'
    } else {
      bodyRef.current.style.maxHeight = '0'
    }
  }, [open])

  return (
    <div style={{
      margin: '0 14px 10px',
      borderRadius: theme.radius.xl,
      border: `1px solid ${theme.colors.border}`,
      overflow: 'hidden',
      background: theme.colors.surface,
    }}>
      <button
        type="button"
        onClick={() => setOpen(o => !o)}
        style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          width: '100%', padding: '12px 16px', cursor: 'pointer',
          background: 'transparent', border: 'none', color: 'inherit', gap: 8,
          WebkitTapHighlightColor: 'transparent',
        }}
      >
        <span style={{ fontSize: '0.68rem', fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', color: theme.colors.muted }}>
          {title}
        </span>
        <span style={{ display: 'flex', alignItems: 'center', gap: 8, marginLeft: 'auto' }}>
          {meta && <span style={{ fontSize: '0.68rem', color: theme.colors.muted, opacity: 0.6 }}>{meta}</span>}
          <svg
            width="14" height="14" viewBox="0 0 24 24" fill="none"
            stroke={theme.colors.muted} strokeWidth="2.5" strokeLinecap="round"
            style={{ transform: open ? 'rotate(0deg)' : 'rotate(-90deg)', transition: 'transform 0.22s ease', flexShrink: 0 }}
          >
            <polyline points="6 9 12 15 18 9"/>
          </svg>
        </span>
      </button>
      <div
        ref={bodyRef}
        style={{
          overflow: 'hidden',
          transition: 'max-height 0.28s ease',
          maxHeight: defaultOpen ? 2000 : 0,
        }}
      >
        {children}
      </div>
    </div>
  )
}

// ── Field row (shared layout) ─────────────────────────────────────────────────
function FieldRow({
  label, status, children, error,
}: {
  label: string
  status?: FieldStatus
  children: React.ReactNode
  error?: boolean
}) {
  return (
    <div style={{
      display: 'grid',
      gridTemplateColumns: '108px 1fr auto',
      alignItems: 'center',
      padding: '0 16px',
      minHeight: 50,
      gap: 8,
      borderTop: `1px solid ${theme.colors.border}`,
      background: error ? 'rgba(211,47,47,0.05)' : 'transparent',
      transition: 'background 0.12s',
    }}>
      <label style={{
        fontSize: '0.75rem',
        color: error ? '#E07070' : theme.colors.muted,
        whiteSpace: 'nowrap',
        padding: '13px 0',
      }}>
        {label}
      </label>
      {children}
      {status !== undefined && <FieldStatusBadge status={status} />}
    </div>
  )
}

const fieldValueStyle: React.CSSProperties = {
  fontSize: '0.875rem',
  fontWeight: 500,
  color: theme.colors.cream,
  background: 'transparent',
  border: 'none',
  outline: 'none',
  width: '100%',
  padding: '13px 0',
  caretColor: theme.colors.gold,
  fontFamily: 'inherit',
  WebkitAppearance: 'none',
}

const emptyValueStyle: React.CSSProperties = {
  ...fieldValueStyle,
  color: theme.colors.muted,
  opacity: 0.45,
  fontStyle: 'italic',
}

// ── Sub-section divider ───────────────────────────────────────────────────────
function SubDivider({ label }: { label: string }) {
  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: 10,
      padding: '10px 16px 8px',
      borderTop: `1px solid ${theme.colors.border}`,
    }}>
      <span style={{
        fontSize: '0.62rem', fontWeight: 700, letterSpacing: '0.1em',
        textTransform: 'uppercase', color: theme.colors.muted, opacity: 0.5, whiteSpace: 'nowrap',
      }}>
        {label}
      </span>
      <div style={{ flex: 1, height: 1, background: theme.colors.border }} />
    </div>
  )
}

// ── Confidence chip ───────────────────────────────────────────────────────────
function ConfChip({ confidence, manual }: { confidence: number | undefined; manual: boolean }) {
  let color = '#6DBF78', dotColor = '#4CAF50', label = 'Información verificada'
  if (manual) {
    color = theme.colors.gold; dotColor = theme.colors.gold; label = 'Entrada manual'
  } else if (confidence === undefined || confidence < 0.4) {
    color = '#E07070'; dotColor = '#D32F2F'; label = 'Revisión recomendada'
  } else if (confidence < 0.75) {
    color = theme.colors.gold; dotColor = theme.colors.gold; label = 'Información parcial'
  }
  return (
    <div style={{
      display: 'inline-flex', alignItems: 'center', gap: 6,
      padding: '4px 10px', borderRadius: theme.radius.full,
      fontSize: '0.67rem', fontWeight: 600, letterSpacing: '0.05em',
      color, border: `1px solid ${color}44`,
      background: `${dotColor}1A`,
      whiteSpace: 'nowrap',
    }}>
      <div style={{ width: 7, height: 7, borderRadius: '50%', background: dotColor, flexShrink: 0 }} />
      {label}
    </div>
  )
}

// ── Main component ────────────────────────────────────────────────────────────
export default function WineForm({ initialData, onSubmit, loading, identifyConfidence, imageUrl, editMode }: WineFormProps) {
  const normalize = (d: Partial<Wine>): Partial<Wine> => ({
    num_botellas: 1,
    favorito:     false,
    consumido:    false,
    ...d,
  })

  const [data,      setData]      = useState<Partial<Wine>>(normalize(initialData))
  const [original,  setOriginal]  = useState<Partial<Wine>>(normalize(initialData))
  const [attempted, setAttempted] = useState(false)
  const [obs,       setObs]       = useState(initialData.descripcion ?? '')

  useEffect(() => {
    setData(normalize(initialData))
    setOriginal(normalize(initialData))
    setObs(initialData.descripcion ?? '')
    setAttempted(false)
  }, [initialData])

  const isManual = !identifyConfidence && Object.values(initialData).every(v => v === null || v === undefined || v === '')

  function set(field: keyof Wine, value: string | number | null) {
    setData(d => ({ ...d, [field]: value === '' ? null : value }))
  }

  function st(field: keyof Wine): FieldStatus {
    return deriveStatus(original[field], data[field])
  }

  // Characteristics: open if any field has data
  const hasCharacteristics = !!(initialData.tipo || initialData.uva || initialData.crianza || initialData.alcohol || initialData.temp_servicio || initialData.volumen || initialData.contiene)

  const nombreVacio = !data.nombre?.trim()
  const nombreError = attempted && nombreVacio

  // Char counter for obs
  const OBS_MAX = 500

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setAttempted(true)
    if (nombreVacio) return
    onSubmit({
      ...data,
      descripcion: obs || null,
    })
  }

  // ── URL: link vs editable ─────────────────────────────────────────────────
  const hasUrlAuto = !!initialData.url_bodega
  const urlDisplay = (data.url_bodega ?? '').replace(/^https?:\/\//, '')

  return (
    <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column' }}>

      {/* ── Global confidence ─────────────────────────────────────────────── */}
      <div style={{ padding: '8px 14px 4px', display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 4 }}>
        <ConfChip confidence={identifyConfidence} manual={isManual} />
        {!isManual && (
          <span style={{ fontSize: '0.65rem', color: theme.colors.muted, opacity: 0.6 }}>
            {identifyConfidence !== undefined && identifyConfidence >= 0.75
              ? '✓ Información verificada automáticamente'
              : identifyConfidence !== undefined
                ? '⚠ Algunos datos requieren revisión'
                : '✓ Información extraída de la etiqueta'}
          </span>
        )}
      </div>

      {/* ── Summary card ─────────────────────────────────────────────────── */}
      <div style={{
        margin: '4px 14px 10px',
        background: theme.colors.surface2,
        border: `1px solid ${theme.colors.border}`,
        borderRadius: theme.radius.xl,
        padding: '14px 16px',
        display: 'flex', alignItems: 'flex-start', gap: 14,
      }}>
        {/* Thumb */}
        <div style={{
          width: 44, height: 58, borderRadius: 9,
          background: theme.colors.dark, flexShrink: 0,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          border: `1px solid ${theme.colors.border}`, overflow: 'hidden',
        }}>
          {imageUrl
            ? <img src={imageUrl} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            : (
              <svg width="20" height="24" viewBox="0 0 24 24" fill="none" stroke="#3D1A10" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M8 22h8M12 11v11M5 3h14l-2 7a5 5 0 0 1-10 0L5 3z"/>
              </svg>
            )
          }
        </div>
        {/* Text */}
        <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', gap: 3 }}>
          <div style={{
            fontFamily: 'Georgia, serif', fontSize: '1.05rem', fontWeight: 700,
            color: theme.colors.cream, lineHeight: 1.2,
            whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
          }}>
            {data.nombre || '—'}
          </div>
          <div style={{ fontSize: '0.75rem', color: theme.colors.gold, fontWeight: 500 }}>
            {data.bodega || '—'}
          </div>
          <div style={{ fontSize: '0.7rem', color: theme.colors.muted, marginTop: 1 }}>
            {[data.denominacion, data.region].filter(Boolean).join(' · ') || '—'}
          </div>
        </div>
        {/* Añada */}
        <div style={{
          fontFamily: 'Georgia, serif', fontSize: '1.6rem', fontWeight: 700,
          color: theme.colors.muted, letterSpacing: '-0.03em', lineHeight: 1, flexShrink: 0,
        }}>
          {data.anada ?? '—'}
        </div>
      </div>

      {/* ── IDENTIDAD (always open) ───────────────────────────────────────── */}
      <div style={{
        margin: '0 14px 10px',
        borderRadius: theme.radius.xl,
        border: `1px solid ${theme.colors.border}`,
        overflow: 'hidden',
        background: theme.colors.surface,
      }}>
        <div style={{ padding: '11px 16px 0', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <span style={{ fontSize: '0.65rem', fontWeight: 700, letterSpacing: '0.13em', textTransform: 'uppercase', color: theme.colors.gold, opacity: 0.85 }}>
            Identidad del vino
          </span>
          {!isManual && (
            <span style={{ fontSize: '0.65rem', color: theme.colors.muted, opacity: 0.7 }}>
              {identifyConfidence !== undefined && identifyConfidence >= 0.75 ? 'Revisada automáticamente' : 'Completa los campos vacíos'}
            </span>
          )}
        </div>

        {/* Nombre */}
        <div style={{
          display: 'grid', gridTemplateColumns: '108px 1fr auto',
          alignItems: 'center', padding: '0 16px', minHeight: 54,
          gap: 8, borderTop: `1px solid ${theme.colors.border}`, marginTop: 10,
          background: nombreError ? 'rgba(211,47,47,0.05)' : 'transparent',
        }}>
          <label style={{ fontSize: '0.75rem', color: nombreError ? '#E07070' : theme.colors.muted, padding: '13px 0', whiteSpace: 'nowrap' }}>
            Nombre <span style={{ color: theme.colors.gold, fontSize: '0.65rem' }}>✦</span>
          </label>
          <input
            style={{ ...fieldValueStyle, fontSize: '1rem', fontWeight: 600, ...(nombreError ? { caretColor: '#E07070' } : {}) }}
            value={data.nombre ?? ''}
            onChange={e => set('nombre', e.target.value)}
            placeholder="Nombre del vino"
          />
          <FieldStatusBadge status={isManual ? 'empty' : st('nombre')} />
        </div>
        {nombreError && (
          <div style={{ padding: '0 16px 8px', fontSize: '0.68rem', color: '#E07070' }}>
            El nombre es obligatorio
          </div>
        )}

        <FieldRow label="Bodega" status={isManual ? undefined : st('bodega')}>
          <input style={data.bodega ? fieldValueStyle : emptyValueStyle} value={data.bodega ?? ''} onChange={e => set('bodega', e.target.value || null)} placeholder="—" />
        </FieldRow>
        <FieldRow label="Añada" status={isManual ? undefined : st('anada')}>
          <input
            style={data.anada ? fieldValueStyle : emptyValueStyle}
            type="number" inputMode="numeric"
            value={data.anada ?? ''}
            onChange={e => set('anada', e.target.value === '' ? null : Number(e.target.value))}
            onBlur={e => {
              const v = parseInt(e.target.value)
              if (!isNaN(v) && (v < 1800 || v > new Date().getFullYear() + 1)) set('anada', null)
            }}
            placeholder="—"
          />
        </FieldRow>
        <FieldRow label="Región" status={isManual ? undefined : st('region')}>
          <input style={data.region ? fieldValueStyle : emptyValueStyle} value={data.region ?? ''} onChange={e => set('region', e.target.value || null)} placeholder="—" />
        </FieldRow>
        <FieldRow label="DO / IGP" status={isManual ? undefined : st('denominacion')}>
          <input style={data.denominacion ? fieldValueStyle : emptyValueStyle} value={data.denominacion ?? ''} onChange={e => set('denominacion', e.target.value || null)} placeholder="Sin especificar" />
        </FieldRow>
      </div>

      {/* ── CARACTERÍSTICAS (auto-open if data present) ───────────────────── */}
      <Section
        title="Características"
        meta={(() => {
          const fields = [data.tipo, data.uva, data.crianza, data.alcohol, data.temp_servicio, data.volumen, data.contiene]
          const filled = fields.filter(Boolean).length
          return `${filled} / ${fields.length}`
        })()}
        defaultOpen={hasCharacteristics}
      >
        {/* Tipo */}
        <div style={{
          display: 'grid', gridTemplateColumns: '108px 1fr auto',
          alignItems: 'center', padding: '0 16px', minHeight: 50,
          gap: 8, borderTop: `1px solid ${theme.colors.border}`,
        }}>
          <label style={{ fontSize: '0.75rem', color: theme.colors.muted, padding: '13px 0' }}>Tipo</label>
          <select
            style={{
              ...fieldValueStyle,
              appearance: 'none', WebkitAppearance: 'none', cursor: 'pointer',
              backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%237A6A6E' stroke-width='2.5'%3E%3Cpolyline points='6 9 12 15 18 9'/%3E%3C/svg%3E")`,
              backgroundRepeat: 'no-repeat', backgroundPosition: 'right 0 center', paddingRight: 16,
            }}
            value={data.tipo ?? ''}
            onChange={e => set('tipo', e.target.value || null)}
          >
            <option value="">—</option>
            {['Tinto','Blanco','Rosado','Espumoso','Dulce','Fortificado','Naranja'].map(t => <option key={t}>{t}</option>)}
          </select>
          <FieldStatusBadge status={isManual ? 'empty' : st('tipo')} />
        </div>
        <FieldRow label="Uva" status={isManual ? undefined : st('uva')}>
          <input style={data.uva ? fieldValueStyle : emptyValueStyle} value={data.uva ?? ''} onChange={e => set('uva', e.target.value || null)} placeholder="—" />
        </FieldRow>
        <FieldRow label="Crianza" status={isManual ? undefined : st('crianza')}>
          <input style={data.crianza ? fieldValueStyle : emptyValueStyle} value={data.crianza ?? ''} onChange={e => set('crianza', e.target.value || null)} placeholder="—" />
        </FieldRow>
        <FieldRow label="Alcohol" status={isManual ? undefined : st('alcohol')}>
          <input style={data.alcohol ? fieldValueStyle : emptyValueStyle} value={data.alcohol ?? ''} onChange={e => set('alcohol', e.target.value || null)} placeholder="Ej: 14,5%" />
        </FieldRow>
        <FieldRow label="T. servicio" status={isManual ? undefined : st('temp_servicio')}>
          <input style={data.temp_servicio ? fieldValueStyle : emptyValueStyle} value={data.temp_servicio ?? ''} onChange={e => set('temp_servicio', e.target.value || null)} placeholder="Ej: 16–18 °C" />
        </FieldRow>
        <FieldRow label="Volumen" status={isManual ? undefined : st('volumen')}>
          <input style={data.volumen ? fieldValueStyle : emptyValueStyle} value={data.volumen ?? ''} onChange={e => set('volumen', e.target.value || null)} placeholder="Ej: 75 cl" />
        </FieldRow>
        <FieldRow label="Contiene" status={isManual ? undefined : st('contiene')}>
          <input style={data.contiene ? fieldValueStyle : emptyValueStyle} value={data.contiene ?? ''} onChange={e => set('contiene', e.target.value || null)} placeholder="Ej: sulfitos" />
        </FieldRow>
      </Section>

      {/* ── INFORMACIÓN ADICIONAL (always closed) ────────────────────────── */}
      <Section title="Información adicional" defaultOpen={false}>

        <SubDivider label="Información del vino" />
        {/* Espacio reservado: imagen adicional (Fase 6) */}

        {/* URL: always editable in editMode, link when auto otherwise */}
        {hasUrlAuto && !editMode ? (
          <div style={{
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            padding: '0 16px', minHeight: 50,
            borderTop: `1px solid ${theme.colors.border}`, cursor: 'pointer',
          }}
            onClick={() => {
              const url = data.url_bodega ?? ''
              window.open(url.startsWith('http') ? url : `https://${url}`, '_blank', 'noopener')
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke={theme.colors.gold} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10"/><line x1="2" y1="12" x2="22" y2="12"/>
                <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/>
              </svg>
              <span style={{ fontSize: '0.75rem', color: theme.colors.muted }}>Web bodega</span>
              <span style={{ fontSize: '0.85rem', color: theme.colors.gold, fontWeight: 500 }}>{urlDisplay}</span>
            </div>
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke={theme.colors.muted} strokeWidth="2" strokeLinecap="round" style={{ opacity: 0.5 }}>
              <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/>
              <polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/>
            </svg>
          </div>
        ) : (
          <FieldRow label="Web bodega">
            <input style={data.url_bodega ? fieldValueStyle : emptyValueStyle} value={data.url_bodega ?? ''} onChange={e => set('url_bodega', e.target.value || null)} placeholder="—" inputMode="url" />
          </FieldRow>
        )}

        <SubDivider label="Mi colección" />
        {/* Espacio reservado: valoración ★, fecha compra, favorito, consumido (Fases 8–9) */}

        {/* Precio */}
        <div style={{
          display: 'grid', gridTemplateColumns: '108px 1fr auto',
          alignItems: 'center', padding: '0 16px', minHeight: 50,
          gap: 8, borderTop: `1px solid ${theme.colors.border}`,
        }}>
          <label style={{ fontSize: '0.75rem', color: theme.colors.muted, padding: '13px 0' }}>Precio</label>
          <div style={{ position: 'relative', display: 'flex', alignItems: 'center', width: '100%' }}>
            <input
              style={{ ...fieldValueStyle, ...(data.precio != null ? {} : { color: theme.colors.muted, opacity: 0.45, fontStyle: 'italic' }), fontVariantNumeric: 'tabular-nums', paddingRight: data.precio != null ? 20 : 0 }}
              value={data.precio != null ? String(data.precio) : ''}
              onChange={e => {
                const v = e.target.value.replace(/[^0-9.,]/g, '')
                setData(d => ({ ...d, precio: v === '' ? null : parseFloat(v.replace(',', '.')) || null }))
              }}
              placeholder="—"
              inputMode="decimal"
            />
            {data.precio != null && (
              <span style={{ position: 'absolute', right: 0, fontSize: '0.85rem', color: theme.colors.muted, opacity: 0.7, pointerEvents: 'none' }}>€</span>
            )}
          </div>
        </div>

        {/* Botellas: stepper */}
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '0 16px', minHeight: 50, borderTop: `1px solid ${theme.colors.border}`,
        }}>
          <span style={{ fontSize: '0.75rem', color: theme.colors.muted }}>Botellas</span>
          <div style={{ display: 'flex', alignItems: 'center' }}>
            {(['−', String(data.num_botellas ?? 1), '+'] as const).map((item, i) => {
              const isBtn = item === '−' || item === '+'
              return isBtn ? (
                <button
                  key={i} type="button"
                  onClick={() => setData(d => ({ ...d, num_botellas: Math.max(0, (d.num_botellas ?? 1) + (item === '+' ? 1 : -1)) }))}
                  style={{
                    width: 36, height: 32, border: `1px solid ${theme.colors.border}`,
                    background: theme.colors.surface2, color: theme.colors.cream,
                    fontSize: '1.1rem', cursor: 'pointer',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    borderRadius: i === 0 ? '8px 0 0 8px' : '0 8px 8px 0',
                  }}
                >
                  {item}
                </button>
              ) : (
                <div key={i} style={{
                  width: 44, height: 32, textAlign: 'center',
                  fontSize: '0.9rem', fontWeight: 600, color: theme.colors.cream,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  borderTop: `1px solid ${theme.colors.border}`, borderBottom: `1px solid ${theme.colors.border}`,
                  fontVariantNumeric: 'tabular-nums',
                }}>
                  {item}
                </div>
              )
            })}
          </div>
        </div>

        {/* Ubicación */}
        <FieldRow label="Ubicación">
          <input
            style={data.ubicacion ? fieldValueStyle : emptyValueStyle}
            value={data.ubicacion ?? ''}
            onChange={e => set('ubicacion', e.target.value || null)}
            placeholder="Ej: Estantería A"
            list="ubicaciones-suggestions"
          />
          <datalist id="ubicaciones-suggestions">
            {['Estantería A','Estantería B','Bodega','Nevera'].map(u => <option key={u} value={u} />)}
          </datalist>
        </FieldRow>

        {/* Fecha de compra */}
        <FieldRow label="F. compra">
          <input
            style={data.fecha_compra ? fieldValueStyle : emptyValueStyle}
            type="date"
            value={data.fecha_compra ?? ''}
            onChange={e => set('fecha_compra', e.target.value || null)}
            placeholder="—"
          />
        </FieldRow>

        {/* Observaciones */}
        <div style={{
          display: 'flex', flexDirection: 'column',
          padding: '0 16px', borderTop: `1px solid ${theme.colors.border}`,
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', paddingTop: 12 }}>
            <span style={{ fontSize: '0.75rem', color: theme.colors.muted }}>Observaciones</span>
            <span style={{ fontSize: '0.62rem', color: theme.colors.muted, opacity: 0.5 }}>
              {obs.length} / {OBS_MAX}
            </span>
          </div>
          <textarea
            value={obs}
            onChange={e => setObs(e.target.value.slice(0, OBS_MAX))}
            placeholder="Notas personales, maridaje, impresiones…"
            rows={4}
            style={{
              ...fieldValueStyle,
              resize: 'none', lineHeight: 1.55,
              paddingTop: 8, paddingBottom: 14,
              ...(obs ? {} : { color: theme.colors.muted, opacity: 0.45, fontStyle: 'italic' }),
            }}
          />
        </div>
      </Section>

      {/* ── Submit ────────────────────────────────────────────────────────── */}
      <div style={{ padding: '4px 14px 0' }}>
        <button
          type="submit"
          disabled={loading || (attempted && nombreVacio)}
          style={{
            width: '100%', padding: 17,
            borderRadius: theme.radius.full,
            background: loading ? theme.colors.surface2 : theme.colors.primary,
            color: theme.colors.cream, border: 'none',
            fontFamily: 'inherit', fontSize: '0.92rem', fontWeight: 600, letterSpacing: '0.03em',
            cursor: loading ? 'not-allowed' : 'pointer',
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
            opacity: loading ? 0.6 : 1, transition: 'opacity 0.15s',
          }}
        >
          {loading ? (
            <>
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"
                style={{ animation: 'wf-spin 0.8s linear infinite' }}>
                <path d="M21 12a9 9 0 1 1-6.219-8.56"/>
              </svg>
              Guardando…
            </>
          ) : (
            <>
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"/>
                <polyline points="17 21 17 13 7 13 7 21"/><polyline points="7 3 7 8 15 8"/>
              </svg>
              {editMode ? 'Guardar cambios' : 'Añadir a mi bodega'}
            </>
          )}
        </button>
      </div>

      <style>{`@keyframes wf-spin { to { transform: rotate(360deg); } }`}</style>
    </form>
  )
}
