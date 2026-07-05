import { useState, useEffect, useRef } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import Layout from '../components/ui/Layout'
import Modal from '../components/ui/Modal'
import Button from '../components/ui/Button'
import Spinner from '../components/ui/Spinner'
import WineForm from '../components/wine/WineForm'
import ConsumoQuickForm from '../components/wine/ConsumoQuickForm'
import { useWines } from '../hooks/useWines'
import { useTastings } from '../hooks/useTastings'
import { useToastStore } from '../store/toastStore'
import { theme } from '../constants/theme'
import type { Tasting, Wine } from '../types'

// ── Stars ────────────────────────────────────────────────────────────────────

function Stars({ value, size = 16 }: { value: number; size?: number }) {
  return (
    <div style={{ display: 'flex', gap: 3 }}>
      {[1, 2, 3, 4, 5].map(i => (
        <svg key={i} width={size} height={size} viewBox="0 0 24 24"
          fill={i <= value ? theme.colors.gold : 'rgba(201,168,76,0.2)'}
          stroke={i <= value ? theme.colors.gold : 'rgba(201,168,76,0.2)'}
          strokeWidth="1.1">
          <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
        </svg>
      ))}
    </div>
  )
}

// ── Tasting card (formato ficha) ──────────────────────────────────────────────

function TastingCard({ tasting }: { tasting: Tasting }) {
  const navigate = useNavigate()
  const fecha = new Date(tasting.fecha).toLocaleDateString('es-ES', { month: 'short', year: 'numeric' })
  const scoreOn5 = tasting.puntuacion ? Math.round((tasting.puntuacion / 100) * 5) : null
  const preview = tasting.notas_cata
    ? tasting.notas_cata.slice(0, 120) + (tasting.notas_cata.length > 120 ? '…' : '')
    : null

  return (
    <div
      onClick={() => navigate(`/catas/${tasting.id}`)}
      style={{
        background: theme.colors.surface,
        padding: '12px 14px',
        display: 'flex', gap: 12, alignItems: 'flex-start',
        cursor: 'pointer',
      }}
    >
      <span style={{ fontSize: '0.67rem', color: theme.colors.muted, whiteSpace: 'nowrap', paddingTop: 1, minWidth: 50 }}>
        {fecha}
      </span>
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 3 }}>
        {scoreOn5 !== null && <Stars value={scoreOn5} size={11} />}
        {preview && (
          <p style={{
            fontSize: '0.77rem', color: theme.colors.muted, lineHeight: 1.45,
            display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden',
          }}>
            {preview}
          </p>
        )}
      </div>
    </div>
  )
}

// ── Colapsable Mi colección ───────────────────────────────────────────────────

function ColeccionPanel({ wine }: { wine: Wine }) {
  const [open, setOpen] = useState(false)
  const bodyRef = useRef<HTMLDivElement>(null)
  const [height, setHeight] = useState(0)

  useEffect(() => {
    if (bodyRef.current) setHeight(bodyRef.current.scrollHeight)
  }, [wine])

  const rows = [
    { k: 'Botellas',        v: wine.num_botellas != null ? `${wine.num_botellas} ${wine.num_botellas === 1 ? 'botella' : 'botellas'}` : null },
    { k: 'Ubicación',       v: wine.ubicacion },
    { k: 'Precio',          v: wine.precio != null ? `${wine.precio} €` : null },
    { k: 'Fecha de compra', v: wine.fecha_compra },
  ].filter(r => r.v !== null)

  const summaryParts: string[] = []
  if (wine.num_botellas) summaryParts.push(`${wine.num_botellas} ${wine.num_botellas === 1 ? 'botella' : 'botellas'}`)
  if (wine.ubicacion) summaryParts.push(wine.ubicacion)
  const summary = summaryParts.length ? summaryParts.join(' · ') : 'Sin datos de colección'

  return (
    <div style={{ border: `1px solid ${theme.colors.border}`, borderRadius: 12, overflow: 'hidden' }}>
      {/* Header */}
      <button
        type="button"
        onClick={() => setOpen(o => !o)}
        style={{
          width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '13px 14px', background: theme.colors.surface,
          border: 'none', cursor: 'pointer', gap: 10, textAlign: 'left',
        }}
      >
        <span style={{ fontSize: '0.82rem', fontWeight: 600, color: theme.colors.cream, flexShrink: 0 }}>
          Mi colección
        </span>
        <span style={{
          fontSize: '0.74rem', color: theme.colors.muted,
          flex: 1, textAlign: 'right', paddingRight: 6,
          overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
        }}>
          {summary}
        </span>
        <svg
          width="16" height="16" viewBox="0 0 24 24" fill="none"
          stroke={theme.colors.muted} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
          style={{ flexShrink: 0, transition: 'transform 0.22s ease', transform: open ? 'rotate(180deg)' : 'none' }}
        >
          <path d="m6 9 6 6 6-6" />
        </svg>
      </button>

      {/* Body */}
      <div style={{
        maxHeight: open ? height : 0,
        overflow: 'hidden',
        transition: 'max-height 0.28s ease',
      }}>
        <div ref={bodyRef}>
          {rows.length === 0 ? (
            <div style={{ padding: '12px 14px', borderTop: `1px solid ${theme.colors.border}` }}>
              <span style={{ fontSize: '0.78rem', color: theme.colors.muted, opacity: 0.5 }}>Sin datos de colección</span>
            </div>
          ) : rows.map((r, i) => (
            <div
              key={r.k}
              style={{
                display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                padding: '10px 14px', gap: 12,
                borderTop: `1px solid ${theme.colors.border}`,
                background: i % 2 === 0 ? theme.colors.surface2 : 'transparent',
              }}
            >
              <span style={{ fontSize: '0.74rem', color: theme.colors.muted }}>{r.k}</span>
              <span style={{ fontSize: '0.82rem', fontWeight: 500, color: theme.colors.cream, fontVariantNumeric: 'tabular-nums' }}>{r.v}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

// ── Main ─────────────────────────────────────────────────────────────────────

export default function WineDetail() {
  const { id }   = useParams<{ id: string }>()
  const navigate = useNavigate()
  const toast    = useToastStore()

  const { getWine, updateWine, deleteWine } = useWines()
  const { tastings, loading: tastingsLoading } = useTastings(id)

  const [wine,        setWine]        = useState<Wine | null>(null)
  const [loadingWine, setLoadingWine] = useState(true)
  const [menuOpen,    setMenuOpen]    = useState(false)
  const [editOpen,    setEditOpen]    = useState(false)
  const [deleteOpen,  setDeleteOpen]  = useState(false)
  const [consumoOpen, setConsumoOpen] = useState(false)
  const [saving,      setSaving]      = useState(false)
  const [deleting,    setDeleting]    = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!id) return
    getWine(id).then(w => { setWine(w); setLoadingWine(false) })
  }, [id]) // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (!menuOpen) return
    function handleOutside(e: MouseEvent | TouchEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) setMenuOpen(false)
    }
    document.addEventListener('mousedown', handleOutside)
    document.addEventListener('touchstart', handleOutside)
    return () => {
      document.removeEventListener('mousedown', handleOutside)
      document.removeEventListener('touchstart', handleOutside)
    }
  }, [menuOpen])

  async function handleUpdate(data: Partial<Wine>) {
    if (!wine) return
    setSaving(true)
    try {
      const updated = await updateWine(wine.id, data)
      setWine(updated)
      setEditOpen(false)
      toast.show('Vino actualizado correctamente')
    } catch {
      toast.show('Error al actualizar el vino', 'error')
    } finally {
      setSaving(false)
    }
  }

  async function handleDelete() {
    if (!wine) return
    setDeleting(true)
    try {
      await deleteWine(wine.id)
      toast.show('Vino eliminado de tu bodega', 'error')
      navigate('/bodega', { replace: true })
    } catch {
      toast.show('Error al eliminar el vino', 'error')
      setDeleting(false)
    }
  }

  // Últimas 3 catas (excluye consumos rápidos para el rating)
  const catasReales = tastings.filter(t => !t.es_consumo_rapido)
  const ultimasTres = tastings.slice(0, 3)
  const avgPuntuacion = catasReales.length && catasReales.some(t => t.puntuacion !== null)
    ? Math.round(catasReales.reduce((acc, t) => acc + (t.puntuacion ?? 0), 0) / catasReales.filter(t => t.puntuacion !== null).length)
    : null
  const scoreOn5 = avgPuntuacion ? Math.round((avgPuntuacion / 100) * 5) : null

  if (loadingWine) {
    return (
      <Layout>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '60vh' }}>
          <Spinner />
        </div>
      </Layout>
    )
  }

  if (!wine) {
    return (
      <Layout>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16, padding: '64px 24px', textAlign: 'center' }}>
          <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke={theme.colors.border} strokeWidth="1" strokeLinecap="round" strokeLinejoin="round">
            <path d="M8 22h8M12 11v11M5 3h14l-2 7a5 5 0 0 1-10 0L5 3z" />
          </svg>
          <p style={{ color: theme.colors.muted }}>No encontramos este vino</p>
          <Button onClick={() => navigate('/bodega')}>Volver a la bodega</Button>
        </div>
      </Layout>
    )
  }

  // Características — solo campos con valor
  const caracteristicas = [
    { label: 'Tipo',           value: wine.tipo },
    { label: 'Uva',            value: wine.uva },
    { label: 'Crianza',        value: wine.crianza },
    { label: 'Alcohol',        value: wine.alcohol },
    { label: 'T. servicio',    value: wine.temp_servicio },
    { label: 'Región',         value: wine.region },
    { label: 'D.O. / I.G.P.', value: wine.denominacion },
  ].filter(f => f.value)

  // Información del vino — solo campos con valor
  const tieneInfo = wine.descripcion || wine.url_bodega

  const urlDisplay = wine.url_bodega
    ? wine.url_bodega.replace(/^https?:\/\//, '')
    : null

  return (
    <Layout>
      {/* ── 1. Hero ─────────────────────────────────────────────────────────── */}
      <div style={{ position: 'relative', height: 238, overflow: 'hidden', background: '#110809' }}>
        {wine.imagen_frontal_url ? (
          <img
            src={wine.imagen_frontal_url}
            alt={wine.nombre}
            style={{ width: '100%', height: '100%', objectFit: 'cover', objectPosition: 'center 40%', opacity: 0.85 }}
          />
        ) : (
          <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <svg width="56" height="56" viewBox="0 0 24 24" fill="none" stroke={theme.colors.border} strokeWidth="0.75" strokeLinecap="round" strokeLinejoin="round">
              <path d="M8 22h8M12 11v11M5 3h14l-2 7a5 5 0 0 1-10 0L5 3z" />
            </svg>
          </div>
        )}

        {/* Gradiente */}
        <div style={{
          position: 'absolute', inset: 0,
          background: 'linear-gradient(to bottom,rgba(13,6,8,0.40) 0%,rgba(13,6,8,0.05) 25%,rgba(13,6,8,0.72) 62%,#0D0608 100%)',
        }} />

        {/* Top controls */}
        <div style={{ position: 'absolute', top: 0, left: 0, right: 0, display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '14px 16px', zIndex: 10 }}>
          <button
            onClick={() => navigate('/bodega')}
            style={{
              display: 'flex', alignItems: 'center', gap: 6, padding: '7px 13px',
              borderRadius: 999, background: 'rgba(13,6,8,0.52)', backdropFilter: 'blur(10px)',
              border: 'none', color: theme.colors.cream, fontSize: '0.82rem', fontWeight: 500, cursor: 'pointer',
            }}
          >
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <path d="m15 18-6-6 6-6" />
            </svg>
            Bodega
          </button>

          <div ref={menuRef} style={{ position: 'relative' }}>
            <button
              onClick={() => setMenuOpen(o => !o)}
              style={{
                width: 34, height: 34, borderRadius: '50%',
                background: 'rgba(13,6,8,0.52)', backdropFilter: 'blur(10px)',
                border: 'none', color: theme.colors.cream, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer',
              }}
            >
              <svg width="17" height="17" viewBox="0 0 24 24" fill="currentColor">
                <circle cx="12" cy="5" r="1.5" /><circle cx="12" cy="12" r="1.5" /><circle cx="12" cy="19" r="1.5" />
              </svg>
            </button>
            {menuOpen && (
              <div style={{
                position: 'absolute', right: 0, top: 38, zIndex: 20,
                borderRadius: 12, minWidth: 160, overflow: 'hidden',
                background: theme.colors.surface2, border: `1px solid ${theme.colors.border}`,
                boxShadow: '0 8px 24px rgba(0,0,0,0.5)',
              }}>
                {wine.url_bodega && (
                  <a
                    href={wine.url_bodega.startsWith('http') ? wine.url_bodega : `https://${wine.url_bodega}`}
                    target="_blank" rel="noopener noreferrer"
                    style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '12px 16px', color: theme.colors.cream, fontSize: '0.85rem', textDecoration: 'none', minHeight: 48 }}
                    onClick={() => setMenuOpen(false)}
                  >
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <circle cx="12" cy="12" r="10" /><line x1="2" y1="12" x2="22" y2="12" />
                      <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
                    </svg>
                    Web oficial
                  </a>
                )}
                <button
                  style={{ width: '100%', textAlign: 'left', display: 'flex', alignItems: 'center', gap: 8, padding: '12px 16px', color: '#E05050', fontSize: '0.85rem', background: 'none', border: 'none', cursor: 'pointer', minHeight: 48, borderTop: `1px solid ${theme.colors.border}` }}
                  onClick={() => { setMenuOpen(false); setDeleteOpen(true) }}
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="3 6 5 6 21 6" /><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" />
                    <path d="M10 11v6M14 11v6" /><path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2" />
                  </svg>
                  Eliminar vino
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Identidad */}
        <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, padding: '0 16px 14px', zIndex: 10 }}>
          {wine.tipo && (
            <div style={{ fontSize: '0.62rem', letterSpacing: '0.13em', textTransform: 'uppercase', color: theme.colors.gold, fontWeight: 600, marginBottom: 4, opacity: 0.9 }}>
              {wine.tipo}
            </div>
          )}
          <h1 style={{ fontFamily: "Georgia, 'Times New Roman', serif", fontSize: '1.65rem', fontWeight: 700, color: theme.colors.cream, lineHeight: 1.1, marginBottom: 4 }}>
            {wine.nombre}
          </h1>
          {wine.bodega && (
            <div style={{ fontSize: '0.8rem', color: theme.colors.gold, fontWeight: 500, opacity: 0.9, marginBottom: 2 }}>
              {wine.bodega}
            </div>
          )}
          {(wine.denominacion || wine.region || wine.anada) && (
            <div style={{ fontSize: '0.7rem', color: theme.colors.muted, opacity: 0.75 }}>
              {[wine.denominacion || wine.region, wine.anada].filter(Boolean).join(' · ')}
            </div>
          )}
        </div>
      </div>

      {/* ── Cuerpo ──────────────────────────────────────────────────────────── */}
      <div style={{ background: theme.colors.dark, paddingBottom: 110 }}>

        {/* ── 2. Acciones ─────────────────────────────────────────────────── */}
        <div style={{ display: 'flex', gap: 7, padding: '14px 16px 0' }}>
          <button
            onClick={() => navigate(`/catas/nueva?wineId=${wine.id}`)}
            style={{ flex: 1.1, padding: '11px 10px', borderRadius: 999, background: theme.colors.primary, color: theme.colors.cream, fontSize: '0.83rem', fontWeight: 600, border: 'none', cursor: 'pointer' }}
          >
            Catar
          </button>
          <button
            onClick={() => setConsumoOpen(true)}
            style={{ flex: 1, padding: '11px 10px', borderRadius: 999, background: 'transparent', color: theme.colors.cream, fontSize: '0.83rem', fontWeight: 500, border: `1px solid ${theme.colors.border}`, cursor: 'pointer' }}
          >
            Consumir
          </button>
          <button
            onClick={() => setEditOpen(true)}
            style={{ flex: 1, padding: '11px 10px', borderRadius: 999, background: 'transparent', color: theme.colors.gold, fontSize: '0.83rem', fontWeight: 500, border: `1px solid rgba(201,168,76,0.32)`, cursor: 'pointer' }}
          >
            Editar
          </button>
        </div>

        {/* ── 3. Características ──────────────────────────────────────────── */}
        {caracteristicas.length > 0 && (
          <div style={{ padding: '18px 16px 0' }}>
            <div style={{ height: 1, background: theme.colors.border, marginBottom: 18 }} />
            <div style={{ fontSize: '0.68rem', letterSpacing: '0.1em', textTransform: 'uppercase', color: theme.colors.muted, fontWeight: 600, marginBottom: 11 }}>
              Características
            </div>
            <div style={{ border: `1px solid ${theme.colors.border}`, borderRadius: 12, overflow: 'hidden' }}>
              {caracteristicas.map(({ label, value }, i) => (
                <div
                  key={label}
                  style={{
                    display: 'flex', justifyContent: 'space-between', alignItems: 'baseline',
                    padding: '10px 14px', gap: 12,
                    background: i % 2 === 0 ? theme.colors.surface : 'transparent',
                    borderTop: i > 0 ? `1px solid ${theme.colors.border}` : 'none',
                  }}
                >
                  <span style={{ fontSize: '0.74rem', color: theme.colors.muted, flexShrink: 0, whiteSpace: 'nowrap' }}>{label}</span>
                  <span style={{ fontSize: '0.82rem', fontWeight: 500, color: theme.colors.cream, textAlign: 'right' }}>{value}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ── 4. Información del vino ─────────────────────────────────────── */}
        {tieneInfo && (
          <div style={{ padding: '18px 16px 0' }}>
            <div style={{ height: 1, background: theme.colors.border, marginBottom: 18 }} />
            <div style={{ fontSize: '0.68rem', letterSpacing: '0.1em', textTransform: 'uppercase', color: theme.colors.muted, fontWeight: 600, marginBottom: 11 }}>
              Información del vino
            </div>
            {wine.descripcion && (
              <p style={{ fontSize: '0.84rem', color: theme.colors.cream, lineHeight: 1.65, opacity: 0.88, marginBottom: wine.url_bodega ? 10 : 0 }}>
                {wine.descripcion}
              </p>
            )}
            {urlDisplay && (
              <a
                href={wine.url_bodega!.startsWith('http') ? wine.url_bodega! : `https://${wine.url_bodega}`}
                target="_blank" rel="noopener noreferrer"
                style={{
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 7,
                  padding: '10px 14px', borderRadius: 10,
                  border: `1px solid rgba(201,168,76,0.25)`, color: theme.colors.gold,
                  fontSize: '0.78rem', background: 'transparent', textDecoration: 'none',
                  marginTop: wine.descripcion ? 0 : 0,
                }}
              >
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="12" r="10" /><line x1="2" y1="12" x2="22" y2="12" />
                  <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
                </svg>
                {urlDisplay}
              </a>
            )}
          </div>
        )}

        {/* ── 5. Notas personales ─────────────────────────────────────────── */}
        <div style={{ padding: '18px 16px 0' }}>
          <div style={{ height: 1, background: theme.colors.border, marginBottom: 18 }} />
          <div style={{ fontSize: '0.68rem', letterSpacing: '0.1em', textTransform: 'uppercase', color: theme.colors.muted, fontWeight: 600, marginBottom: 11 }}>
            Notas personales
          </div>
          <div style={{ background: theme.colors.surface, border: `1px solid ${theme.colors.border}`, borderRadius: 12, padding: '13px 14px' }}>
            {wine.descripcion ? (
              <p style={{ fontSize: '0.84rem', color: theme.colors.muted, lineHeight: 1.6, fontStyle: 'italic' }}>
                "{wine.descripcion}"
              </p>
            ) : (
              <p style={{ fontSize: '0.8rem', color: theme.colors.muted, opacity: 0.38, fontStyle: 'italic' }}>
                Sin notas personales
              </p>
            )}
          </div>
        </div>

        {/* ── 6. Últimas catas ────────────────────────────────────────────── */}
        <div style={{ padding: '18px 16px 0' }}>
          <div style={{ height: 1, background: theme.colors.border, marginBottom: 18 }} />
          <div style={{ fontSize: '0.68rem', letterSpacing: '0.1em', textTransform: 'uppercase', color: theme.colors.muted, fontWeight: 600, marginBottom: 11 }}>
            Últimas catas
          </div>

          {tastingsLoading ? (
            <div style={{ display: 'flex', justifyContent: 'center', padding: '16px 0' }}><Spinner size={24} /></div>
          ) : ultimasTres.length === 0 ? (
            <div style={{
              background: theme.colors.surface, border: `1px solid ${theme.colors.border}`,
              borderRadius: 12, padding: '28px 16px',
              display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10, textAlign: 'center',
            }}>
              <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke={theme.colors.border} strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z" /><path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z" />
              </svg>
              <p style={{ fontSize: '0.81rem', color: theme.colors.muted }}>Aún no has catado este vino</p>
              <button
                onClick={() => navigate(`/catas/nueva?wineId=${wine.id}`)}
                style={{ marginTop: 4, padding: '8px 18px', borderRadius: 999, background: 'transparent', color: theme.colors.gold, fontSize: '0.8rem', border: `1px solid rgba(201,168,76,0.32)`, cursor: 'pointer' }}
              >
                Catar ahora
              </button>
            </div>
          ) : (
            <>
              {scoreOn5 !== null && (
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
                  <Stars value={scoreOn5} size={17} />
                  <span style={{ fontSize: '0.7rem', color: theme.colors.muted }}>
                    media de {catasReales.filter(t => t.puntuacion !== null).length} cata{catasReales.length !== 1 ? 's' : ''}
                  </span>
                </div>
              )}
              <div style={{ border: `1px solid ${theme.colors.border}`, borderRadius: 12, overflow: 'hidden' }}>
                {ultimasTres.map((t, i) => (
                  <div key={t.id} style={{ borderTop: i > 0 ? `1px solid ${theme.colors.border}` : 'none' }}>
                    <TastingCard tasting={t} />
                  </div>
                ))}
              </div>
              {tastings.length > 3 && (
                <button
                  style={{ display: 'block', width: '100%', textAlign: 'center', marginTop: 10, padding: '8px 0', fontSize: '0.76rem', color: theme.colors.gold, background: 'none', border: 'none', cursor: 'pointer' }}
                >
                  Ver historial completo · {tastings.length} catas →
                </button>
              )}
            </>
          )}
        </div>

        {/* ── 7. Mi colección (colapsable) ────────────────────────────────── */}
        <div style={{ padding: '18px 16px 0' }}>
          <div style={{ height: 1, background: theme.colors.border, marginBottom: 18 }} />
          <ColeccionPanel wine={wine} />
        </div>

      </div>

      {/* ── Modales ─────────────────────────────────────────────────────────── */}
      <Modal open={editOpen} onClose={() => setEditOpen(false)} title="Editar vino">
        <WineForm initialData={wine} onSubmit={handleUpdate} loading={saving} />
      </Modal>

      <ConsumoQuickForm open={consumoOpen} wineId={wine.id} onClose={() => setConsumoOpen(false)} />

      <Modal open={deleteOpen} onClose={() => setDeleteOpen(false)} title="Eliminar vino">
        <p style={{ fontSize: '0.875rem', color: theme.colors.muted }}>
          ¿Eliminar <span style={{ color: theme.colors.cream }}>{wine.nombre}</span> de tu bodega? Esta acción no se puede deshacer.
        </p>
        <div style={{ display: 'flex', gap: 12, marginTop: 8 }}>
          <Button variant="secondary" className="flex-1" onClick={() => setDeleteOpen(false)} disabled={deleting}>
            Cancelar
          </Button>
          <Button className="flex-1" style={{ background: '#D32F2F', color: theme.colors.cream }} loading={deleting} onClick={handleDelete}>
            Eliminar
          </Button>
        </div>
      </Modal>
    </Layout>
  )
}
