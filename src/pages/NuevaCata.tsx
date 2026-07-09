import { useState, useEffect, useRef } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import Layout from '../components/ui/Layout'
import TastingChat from '../components/wine/TastingChat'
import Spinner from '../components/ui/Spinner'
import { useTastings } from '../hooks/useTastings'
import { useWines } from '../hooks/useWines'
import { useWineStore } from '../store/wineStore'
import { useToastStore } from '../store/toastStore'
import { theme } from '../constants/theme'
import type { Wine } from '../types'
import type { TastingResult } from '../components/wine/TastingChat'

type TastingMode = 'completa' | 'rapido'

interface Meta {
  fecha:             string
  lugar:             string
  ocasion:           string
  botella_terminada: boolean
}

function todayISO() {
  return new Date().toISOString().slice(0, 10)
}

// ── Selector de modo ────────────────────────────────────────────────────────

interface ModeSelectorProps {
  mode: TastingMode
  onChange: (m: TastingMode) => void
}

function ModeSelector({ mode, onChange }: ModeSelectorProps) {
  const t = theme
  const options: { id: TastingMode; emoji: string; label: string; sub: string }[] = [
    { id: 'completa', emoji: '🍷', label: 'Cata completa',   sub: 'Guiada por IA, análisis detallado' },
    { id: 'rapido',   emoji: '⚡', label: 'Consumo rápido', sub: 'Solo puntuación y nota breve' },
  ]
  return (
    <div className="flex flex-col gap-2">
      <p style={{ fontSize: t.font.xs, letterSpacing: '0.1em', textTransform: 'uppercase', color: t.colors.muted, fontWeight: 600 }}>
        Tipo de registro
      </p>
      <div className="flex gap-2">
        {options.map(o => {
          const active = mode === o.id
          return (
            <button
              key={o.id}
              onClick={() => onChange(o.id)}
              className="flex-1 flex flex-col items-start gap-1 rounded-xl px-3 py-3 text-left transition-all"
              style={{
                background: active ? t.colors.primary + '22' : t.colors.surface,
                border:     `1px solid ${active ? t.colors.primaryBorder : t.colors.borderSubtle}`,
              }}
            >
              <span style={{ fontSize: t.font.base }}>{o.emoji}</span>
              <p style={{ fontSize: t.font.sm, fontWeight: 600, color: active ? t.colors.cream : t.colors.text }}>
                {o.label}
              </p>
              <p style={{ fontSize: t.font.xs, color: t.colors.muted, lineHeight: 1.4 }}>
                {o.sub}
              </p>
            </button>
          )
        })}
      </div>
    </div>
  )
}

// ── Sección de metadatos colapsable ─────────────────────────────────────────

interface MetaSectionProps {
  meta:     Meta
  onChange: (m: Meta) => void
}

function MetaSection({ meta, onChange }: MetaSectionProps) {
  const [open, setOpen] = useState(false)
  const t = theme

  const set = <K extends keyof Meta>(k: K, v: Meta[K]) =>
    onChange({ ...meta, [k]: v })

  const inputStyle = {
    background: t.colors.surface,
    border:     `1px solid ${t.colors.borderSubtle}`,
    borderRadius: t.radius.md,
    color:      t.colors.cream,
    fontSize:   t.font.sm,
    padding:    '8px 10px',
    width:      '100%',
    outline:    'none',
  } as React.CSSProperties

  const labelStyle = {
    fontSize:      t.font.xs,
    letterSpacing: '0.08em',
    textTransform: 'uppercase' as const,
    color:         t.colors.muted,
    fontWeight:    600,
    display:       'block',
    marginBottom:  4,
  }

  return (
    <div>
      <button
        onClick={() => setOpen(o => !o)}
        className="flex items-center gap-2 w-full"
        style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}
      >
        <span style={{ fontSize: t.font.xs, letterSpacing: '0.1em', textTransform: 'uppercase', color: t.colors.muted, fontWeight: 600 }}>
          Detalles adicionales
        </span>
        <span style={{ fontSize: t.font.xs, color: t.colors.muted, marginLeft: 'auto' }}>
          {open ? '▲' : '▼'}
        </span>
      </button>

      {open && (
        <div className="flex flex-col gap-3 mt-3">
          {/* Fecha */}
          <div>
            <label style={labelStyle}>Fecha</label>
            <input
              type="date"
              value={meta.fecha}
              onChange={e => set('fecha', e.target.value)}
              style={inputStyle}
            />
          </div>

          {/* Lugar */}
          <div>
            <label style={labelStyle}>Lugar</label>
            <input
              type="text"
              value={meta.lugar}
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
              value={meta.ocasion}
              onChange={e => set('ocasion', e.target.value)}
              placeholder="Cena romántica, celebración, martes cualquiera…"
              style={inputStyle}
            />
          </div>

          {/* Botella terminada */}
          <button
            onClick={() => set('botella_terminada', !meta.botella_terminada)}
            className="flex items-center gap-3 rounded-xl px-3 py-3 w-full text-left"
            style={{
              background: meta.botella_terminada ? t.colors.primary + '18' : t.colors.surface,
              border:     `1px solid ${meta.botella_terminada ? t.colors.primaryBorder : t.colors.borderSubtle}`,
            }}
          >
            <span style={{ fontSize: t.font.lg }}>{meta.botella_terminada ? '🍾' : '🍷'}</span>
            <div>
              <p style={{ fontSize: t.font.sm, fontWeight: 600, color: t.colors.cream }}>
                Botella terminada
              </p>
              <p style={{ fontSize: t.font.xs, color: t.colors.muted }}>
                {meta.botella_terminada ? 'Sí, la acabamos' : 'Quedó vino en la botella'}
              </p>
            </div>
            <div
              className="ml-auto flex-shrink-0"
              style={{
                width: 20, height: 20, borderRadius: '50%',
                background: meta.botella_terminada ? t.colors.primary : 'transparent',
                border: `2px solid ${meta.botella_terminada ? t.colors.primaryBorder : t.colors.borderSubtle}`,
              }}
            />
          </button>
        </div>
      )}
    </div>
  )
}

// ── Formulario de consumo rápido ─────────────────────────────────────────────

interface QuickFormProps {
  onSave:  (puntuacion: number | null, notas: string) => void
  saving:  boolean
}

function QuickForm({ onSave, saving }: QuickFormProps) {
  const [score, setScore] = useState<number>(75)
  const [notas, setNotas] = useState('')
  const [hasScore, setHasScore] = useState(false)
  const t = theme

  function scoreColor(s: number) {
    if (s >= 90) return t.colors.gold
    if (s >= 75) return t.colors.success
    return t.colors.muted
  }

  return (
    <div className="flex flex-col gap-4">
      {/* Puntuación */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <p style={{ fontSize: t.font.xs, letterSpacing: '0.1em', textTransform: 'uppercase', color: t.colors.muted, fontWeight: 600 }}>
            Puntuación
          </p>
          {hasScore ? (
            <span style={{ fontSize: t.font.xl, fontWeight: 700, color: scoreColor(score), fontFamily: t.font.serif }}>
              {score}
            </span>
          ) : (
            <span style={{ fontSize: t.font.sm, color: t.colors.muted }}>sin puntuar</span>
          )}
        </div>
        <input
          type="range"
          min={50}
          max={100}
          value={score}
          onChange={e => { setScore(Number(e.target.value)); setHasScore(true) }}
          style={{ width: '100%', accentColor: t.colors.primary }}
        />
        <div className="flex justify-between mt-1">
          <span style={{ fontSize: t.font.xs, color: t.colors.muted }}>50</span>
          <span style={{ fontSize: t.font.xs, color: t.colors.muted }}>100</span>
        </div>
      </div>

      {/* Nota breve */}
      <div>
        <label style={{ fontSize: t.font.xs, letterSpacing: '0.1em', textTransform: 'uppercase', color: t.colors.muted, fontWeight: 600, display: 'block', marginBottom: 6 }}>
          Nota breve
        </label>
        <textarea
          value={notas}
          onChange={e => setNotas(e.target.value)}
          placeholder="¿Qué te ha parecido? Una frase es suficiente…"
          rows={3}
          style={{
            width:        '100%',
            background:   t.colors.surface,
            border:       `1px solid ${t.colors.borderSubtle}`,
            borderRadius: t.radius.md,
            color:        t.colors.cream,
            fontSize:     t.font.sm,
            padding:      '10px 12px',
            outline:      'none',
            resize:       'none',
            lineHeight:   1.6,
          }}
        />
      </div>

      <button
        onClick={() => onSave(hasScore ? score : null, notas)}
        disabled={saving}
        className="rounded-xl font-semibold flex items-center justify-center gap-2"
        style={{
          background:    t.colors.primary,
          color:         t.colors.cream,
          fontSize:      t.font.base,
          padding:       '13px 0',
          boxShadow:     `0 4px 24px ${t.colors.primary}40`,
          opacity:       saving ? 0.6 : 1,
          border:        'none',
          cursor:        saving ? 'not-allowed' : 'pointer',
        }}
      >
        {saving ? <><Spinner size={16} /><span>Guardando…</span></> : 'Guardar consumo'}
      </button>
    </div>
  )
}

// ── Página principal ─────────────────────────────────────────────────────────

export default function NuevaCata() {
  const navigate        = useNavigate()
  const [params]        = useSearchParams()
  const initialWineId   = params.get('wineId') ?? ''
  const toast           = useToastStore()

  const { createTasting }      = useTastings()
  const { getWine, loadWines } = useWines()
  const { wines: allWines }    = useWineStore()

  const [wine,    setWine]    = useState<Wine | null>(null)
  const [loading, setLoading] = useState(false)
  const [saving,  setSaving]  = useState(false)
  const [query,   setQuery]   = useState('')
  const [open,    setOpen]    = useState(false)
  const [mode,    setMode]    = useState<TastingMode>('completa')
  const [meta,    setMeta]    = useState<Meta>({
    fecha:             todayISO(),
    lugar:             '',
    ocasion:           '',
    botella_terminada: false,
  })

  const inputRef = useRef<HTMLInputElement>(null)
  const dropRef  = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (allWines.length === 0) loadWines().catch(() => null)
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (!initialWineId) return
    setLoading(true)
    getWine(initialWineId)
      .then(w => { if (w) setWine(w) })
      .finally(() => setLoading(false))
  }, [initialWineId]) // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (dropRef.current && !dropRef.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const filtered = query.trim()
    ? allWines.filter(w =>
        w.nombre.toLowerCase().includes(query.toLowerCase()) ||
        w.bodega?.toLowerCase().includes(query.toLowerCase()) ||
        w.region?.toLowerCase().includes(query.toLowerCase())
      )
    : allWines

  function buildMetaPayload() {
    return {
      fecha:             meta.fecha || todayISO(),
      lugar:             meta.lugar.trim()   || null,
      ocasion:           meta.ocasion.trim() || null,
      botella_terminada: meta.botella_terminada,
    }
  }

  // Consumo rápido: guardar directo
  async function handleQuickSave(puntuacion: number | null, notas: string) {
    if (!wine) return
    setSaving(true)
    try {
      const tasting = await createTasting({
        wine_id:           wine.id,
        puntuacion,
        notas_cata:        notas.trim() || null,
        es_consumo_rapido: true,
        ...buildMetaPayload(),
      })
      toast.show('Consumo guardado')
      navigate(`/catas/${tasting.id}`, { replace: true })
    } catch {
      toast.show('Error al guardar', 'error')
      setSaving(false)
    }
  }

  // Cata completa: viene del TastingChat
  async function handleComplete(data: TastingResult) {
    if (!wine) return
    setSaving(true)
    try {
      const tasting = await createTasting({
        wine_id:           wine.id,
        puntuacion:        data.puntuacion,
        notas_cata:        data.notas_cata,
        aroma:             data.aroma,
        color_descripcion: data.color_descripcion,
        maridaje:          data.maridaje,
        chat_history:      data.chat_history,
        es_consumo_rapido: false,
        ...buildMetaPayload(),
      })
      toast.show('Cata guardada')
      navigate(`/catas/${tasting.id}`, { replace: true })
    } catch {
      toast.show('Error al guardar la cata', 'error')
      setSaving(false)
    }
  }

  const t = theme

  return (
    <Layout>
      {/* Header */}
      <div className="flex items-center gap-3 px-4 pt-5 pb-3 flex-shrink-0">
        <button
          onClick={() => navigate(-1)}
          className="text-sm font-medium"
          style={{ color: t.colors.gold }}
        >
          ← Volver
        </button>
        <h1
          className="flex-1 font-semibold truncate"
          style={{ color: t.colors.cream, fontSize: t.font.lg }}
        >
          Nueva cata
        </h1>
      </div>

      {/* Fase 1: selección de vino */}
      {!wine && (
        <div className="px-4 flex flex-col gap-3 pb-24">
          {loading ? (
            <div className="flex justify-center py-12"><Spinner /></div>
          ) : (
            <>
              <p className="text-sm" style={{ color: t.colors.muted }}>
                ¿Qué vino vas a catar hoy?
              </p>

              <div ref={dropRef} style={{ position: 'relative' }}>
                <div
                  className="flex items-center gap-2 rounded-xl px-3 py-2"
                  style={{ background: t.colors.surface, border: `1px solid ${open ? t.colors.gold + '80' : t.colors.borderSubtle}` }}
                >
                  <span style={{ color: t.colors.muted }}>🔍</span>
                  <input
                    ref={inputRef}
                    value={query}
                    onChange={e => { setQuery(e.target.value); setOpen(true) }}
                    onFocus={() => setOpen(true)}
                    placeholder="Busca o selecciona un vino..."
                    className="flex-1 bg-transparent outline-none text-sm"
                    style={{ color: t.colors.cream }}
                    autoFocus
                  />
                  {allWines.length === 0
                    ? <Spinner size={16} />
                    : (
                      <button
                        onMouseDown={e => { e.preventDefault(); setOpen(o => !o) }}
                        style={{ color: t.colors.muted, fontSize: '0.75rem', lineHeight: 1, padding: '4px' }}
                      >
                        {open ? '▲' : '▼'}
                      </button>
                    )
                  }
                </div>

                {open && filtered.length > 0 && (
                  <div
                    className="absolute left-0 right-0 rounded-xl overflow-hidden"
                    style={{
                      top:        'calc(100% + 6px)',
                      background: t.colors.surface,
                      border:     `1px solid ${t.colors.borderSubtle}`,
                      maxHeight:  '55vh',
                      overflowY:  'auto',
                      zIndex:     50,
                    }}
                  >
                    {filtered.map(w => (
                      <button
                        key={w.id}
                        onMouseDown={() => { setWine(w); setQuery(''); setOpen(false) }}
                        className="w-full flex items-center gap-3 px-3 py-3 text-left active:opacity-75"
                        style={{ borderBottom: `1px solid ${t.colors.borderDivider}` }}
                      >
                        <span style={{ fontSize: '1.25rem', flexShrink: 0 }}>🍾</span>
                        <div className="min-w-0 flex-1">
                          <p className="font-medium text-sm truncate" style={{ color: t.colors.cream }}>
                            {w.nombre}{w.anada ? ` ${w.anada}` : ''}
                          </p>
                          {w.bodega && (
                            <p className="text-xs truncate" style={{ color: t.colors.muted }}>{w.bodega}</p>
                          )}
                        </div>
                      </button>
                    ))}
                  </div>
                )}

                {open && query.trim() && filtered.length === 0 && (
                  <div
                    className="absolute left-0 right-0 rounded-xl px-4 py-4 text-center text-sm"
                    style={{ top: 'calc(100% + 6px)', background: t.colors.surface, border: `1px solid ${t.colors.borderSubtle}`, color: t.colors.muted, zIndex: 50 }}
                  >
                    No se encontraron vinos
                  </div>
                )}
              </div>
            </>
          )}
        </div>
      )}

      {/* Fase 2: metadatos + selector de modo */}
      {wine && mode === 'completa' && !saving && (
        <div className="flex flex-col px-4 pb-6" style={{ flex: 1, minHeight: 0 }}>
          {/* Banner vino */}
          <WineBanner wine={wine} onClear={() => setWine(null)} />

          {/* Metadatos colapsables */}
          <div className="mb-4">
            <MetaSection meta={meta} onChange={setMeta} />
          </div>

          {/* Selector de modo */}
          <div className="mb-4">
            <ModeSelector mode={mode} onChange={setMode} />
          </div>

          {/* Chat de cata completa */}
          <TastingChat wine={wine} onComplete={handleComplete} />
        </div>
      )}

      {wine && mode === 'rapido' && (
        <div className="px-4 pb-24 flex flex-col gap-4">
          {/* Banner vino */}
          <WineBanner wine={wine} onClear={() => setWine(null)} />

          {/* Metadatos colapsables */}
          <MetaSection meta={meta} onChange={setMeta} />

          {/* Selector de modo */}
          <ModeSelector mode={mode} onChange={setMode} />

          {/* Formulario rápido */}
          <QuickForm onSave={handleQuickSave} saving={saving} />
        </div>
      )}

      {/* Guardando cata completa */}
      {wine && saving && mode === 'completa' && (
        <div className="flex flex-col items-center gap-3 py-16">
          <Spinner />
          <p className="text-sm" style={{ color: t.colors.muted }}>Guardando cata…</p>
        </div>
      )}
    </Layout>
  )
}

// ── Banner del vino seleccionado ─────────────────────────────────────────────

function WineBanner({ wine, onClear }: { wine: Wine; onClear: () => void }) {
  const t = theme
  return (
    <div
      className="flex items-center gap-3 rounded-xl px-3 py-2 mb-4 flex-shrink-0"
      style={{ background: t.colors.surface, border: `1px solid ${t.colors.gold}40` }}
    >
      <span style={{ fontSize: '1.5rem' }}>🍷</span>
      <div className="flex-1 min-w-0">
        <p className="font-semibold text-sm truncate" style={{ color: t.colors.cream }}>
          {wine.nombre}{wine.anada ? ` ${wine.anada}` : ''}
        </p>
        {wine.bodega && (
          <p className="text-xs truncate" style={{ color: t.colors.muted }}>{wine.bodega}</p>
        )}
      </div>
      <button onClick={onClear} className="text-xs flex-shrink-0" style={{ color: t.colors.muted }}>
        cambiar
      </button>
    </div>
  )
}
