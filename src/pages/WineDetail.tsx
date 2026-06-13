import { useState, useEffect, useRef } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import Layout from '../components/ui/Layout'
import Modal from '../components/ui/Modal'
import Button from '../components/ui/Button'
import Spinner from '../components/ui/Spinner'
import WineForm from '../components/wine/WineForm'
import TastingMiniCard from '../components/wine/TastingMiniCard'
import { useWines } from '../hooks/useWines'
import { useTastings } from '../hooks/useTastings'
import { useToastStore } from '../store/toastStore'
import { theme } from '../constants/theme'
import type { Wine } from '../types'

function StarRating({ value }: { value: number }) {
  return (
    <div className="flex gap-0.5">
      {[1, 2, 3, 4, 5].map(i => (
        <svg key={i} width="14" height="14" viewBox="0 0 24 24" fill={i <= value ? theme.colors.gold : 'none'} stroke={theme.colors.gold} strokeWidth="1.5">
          <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
        </svg>
      ))}
    </div>
  )
}

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
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false)
      }
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


  const avgPuntuacion = tastings.length && tastings.some(t => t.puntuacion !== null)
    ? Math.round(
        tastings.reduce((acc, t) => acc + (t.puntuacion ?? 0), 0) /
        tastings.filter(t => t.puntuacion !== null).length
      )
    : null

  const scoreOn5 = avgPuntuacion ? Math.round((avgPuntuacion / 100) * 5) : null

  const imageUrl = wine?.imagen_frontal_url

  return (
    <Layout>
      {loadingWine ? (
        <div className="flex h-full items-center justify-center" style={{ minHeight: '60vh' }}>
          <Spinner />
        </div>
      ) : !wine ? (
        <div className="flex flex-col items-center gap-4 py-16 px-6 text-center">
          <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke={theme.colors.border} strokeWidth="1" strokeLinecap="round" strokeLinejoin="round">
            <path d="M8 22h8M12 11v11M5 3h14l-2 7a5 5 0 0 1-10 0L5 3z"/>
          </svg>
          <p style={{ color: theme.colors.muted }}>No encontramos este vino</p>
          <Button onClick={() => navigate('/bodega')}>Volver a la bodega</Button>
        </div>
      ) : <>
      {/* Hero */}
      <div className="relative w-full" style={{ height: 320 }}>
        {imageUrl ? (
          <img
            src={imageUrl}
            alt={wine.nombre}
            className="w-full h-full object-cover"
            style={{ opacity: 0.75 }}
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center" style={{ background: '#110809' }}>
            <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke={theme.colors.border} strokeWidth="0.75" strokeLinecap="round" strokeLinejoin="round">
              <path d="M8 22h8M12 11v11M5 3h14l-2 7a5 5 0 0 1-10 0L5 3z"/>
            </svg>
          </div>
        )}

        {/* Gradient */}
        <div
          className="absolute inset-0"
          style={{
            background: 'linear-gradient(to bottom, rgba(13,6,8,0.6) 0%, rgba(13,6,8,0.2) 40%, rgba(13,6,8,0.85) 80%, #0D0608 100%)',
          }}
        />

        {/* Top controls */}
        <div className="absolute top-4 left-4 right-4 flex items-center justify-between z-10">
          <button
            onClick={() => navigate('/bodega')}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium"
            style={{ background: 'rgba(13,6,8,0.5)', color: theme.colors.cream, backdropFilter: 'blur(8px)' }}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="m15 18-6-6 6-6"/>
            </svg>
            Volver
          </button>


          <div className="relative" ref={menuRef}>
            <button
              onClick={() => setMenuOpen(o => !o)}
              className="w-8 h-8 rounded-full flex items-center justify-center"
              style={{ background: 'rgba(13,6,8,0.5)', color: theme.colors.cream, backdropFilter: 'blur(8px)' }}
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                <circle cx="12" cy="5" r="1.5"/><circle cx="12" cy="12" r="1.5"/><circle cx="12" cy="19" r="1.5"/>
              </svg>
            </button>
            {menuOpen && (
              <div
                className="absolute right-0 top-9 z-20 rounded-xl shadow-2xl min-w-36 overflow-hidden"
                style={{ background: theme.colors.surface2, border: `1px solid ${theme.colors.border}` }}
              >
                <button
                  className="w-full text-left px-4 py-3 text-sm active:opacity-70 flex items-center gap-2"
                  style={{ color: theme.colors.cream, minHeight: 48 }}
                  onClick={() => { setMenuOpen(false); setEditOpen(true) }}
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
                    <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
                  </svg>
                  Editar
                </button>
                <button
                  className="w-full text-left px-4 py-3 text-sm active:opacity-70 flex items-center gap-2"
                  style={{ color: '#E05050', minHeight: 48 }}
                  onClick={() => { setMenuOpen(false); setDeleteOpen(true) }}
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/><path d="M10 11v6M14 11v6"/><path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/>
                  </svg>
                  Eliminar
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Wine identity over hero */}
        <div className="absolute bottom-0 left-0 right-0 px-5 pb-5 z-10">
          <h1
            className="text-editorial"
            style={{
              fontSize:   '1.75rem',
              fontWeight: 700,
              color:      theme.colors.cream,
              lineHeight: 1.15,
              marginBottom: 4,
            }}
          >
            {wine.nombre}
          </h1>
          {wine.bodega && (
            <p style={{ fontSize: '0.85rem', color: theme.colors.gold, fontWeight: 500 }}>
              {wine.bodega}{wine.region ? ` · ${wine.region}` : ''}
            </p>
          )}
        </div>
      </div>

      {/* Body */}
      <div className="px-5 flex flex-col gap-5 pb-28" style={{ background: theme.colors.dark }}>

        {/* Score + CTA */}
        <div className="flex items-center justify-between pt-2">
          {scoreOn5 !== null ? (
            <div className="flex items-center gap-3">
              <span
                className="text-editorial"
                style={{ fontSize: '2.5rem', fontWeight: 700, color: theme.colors.cream, lineHeight: 1 }}
              >
                {avgPuntuacion}
              </span>
              <div>
                <StarRating value={scoreOn5} />
                <p style={{ fontSize: '0.7rem', color: theme.colors.muted, marginTop: 3 }}>
                  media de {tastings.filter(t => t.puntuacion !== null).length} cata{tastings.length !== 1 ? 's' : ''}
                </p>
              </div>
            </div>
          ) : (
            <div />
          )}
          <button
            onClick={() => navigate(`/catas/nueva?wineId=${wine.id}`)}
            className="px-5 py-2.5 rounded-full font-semibold text-sm"
            style={{ background: theme.colors.primary, color: theme.colors.cream }}
          >
            + Catar
          </button>
        </div>

        {/* Divider */}
        <div style={{ height: 1, background: theme.colors.border }} />

        {/* Descripción */}
        {wine.descripcion && (
          <p style={{ fontSize: '0.9rem', color: theme.colors.muted, lineHeight: 1.6, fontStyle: 'italic' }}>
            "{wine.descripcion}"
          </p>
        )}

        {/* Datos del vino */}
        {(() => {
          const filasPrincipales = [
            { label: 'Bodega',       value: wine.bodega },
            { label: 'Añada',        value: wine.anada },
            { label: 'Región',       value: wine.region },
            { label: 'Denominación', value: wine.denominacion },
            { label: 'Uva',          value: wine.uva },
          ].filter(f => f.value !== null && f.value !== undefined && f.value !== '')

          const filasDetalle = [
            { label: 'Crianza',      value: wine.crianza },
            { label: 'Alcohol',      value: wine.alcohol },
            { label: 'Volumen',      value: wine.volumen },
            { label: 'T. servicio',  value: wine.temp_servicio },
            { label: 'Contiene',     value: wine.contiene },
          ].filter(f => f.value !== null && f.value !== undefined && f.value !== '')

          if (filasPrincipales.length === 0 && filasDetalle.length === 0) return null

          const allFilas = [...filasPrincipales, ...filasDetalle]

          return (
            <div className="flex flex-col gap-3">
              <h2 className="text-editorial" style={{ fontSize: '1rem', fontWeight: 600, color: theme.colors.cream, letterSpacing: '0.02em' }}>
                Datos del vino
              </h2>
              <div className="rounded-xl overflow-hidden" style={{ border: `1px solid ${theme.colors.border}` }}>
                {allFilas.map(({ label, value }, i, arr) => (
                  <div
                    key={label}
                    className="flex justify-between items-start px-4 py-3 gap-4"
                    style={{
                      borderBottom: i < arr.length - 1 ? `1px solid ${theme.colors.border}` : 'none',
                      background: i % 2 === 0 ? theme.colors.surface : 'transparent',
                    }}
                  >
                    <span style={{ fontSize: '0.8rem', color: theme.colors.muted, flexShrink: 0 }}>{label}</span>
                    <span style={{ fontSize: '0.85rem', fontWeight: 500, color: theme.colors.cream, textAlign: 'right' }}>{value}</span>
                  </div>
                ))}
              </div>

              {/* URL bodega */}
              {wine.url_bodega && (
                <a
                  href={wine.url_bodega.startsWith('http') ? wine.url_bodega : `https://${wine.url_bodega}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-center gap-2 text-sm py-2.5 rounded-xl"
                  style={{ color: theme.colors.gold, border: `1px solid ${theme.colors.gold}40` }}
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="12" cy="12" r="10"/><line x1="2" y1="12" x2="22" y2="12"/>
                    <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/>
                  </svg>
                  {wine.url_bodega.replace(/^https?:\/\//, '')}
                </a>
              )}

              <button
                onClick={() => setEditOpen(true)}
                className="text-sm py-2 text-center rounded-xl transition-colors"
                style={{ color: theme.colors.muted, border: `1px solid ${theme.colors.border}` }}
              >
                Editar información
              </button>
            </div>
          )
        })()}

        {/* Divider */}
        <div style={{ height: 1, background: theme.colors.border }} />

        {/* Mis catas */}
        <div className="flex flex-col gap-3">
          <h2
            className="text-editorial"
            style={{ fontSize: '1rem', fontWeight: 600, color: theme.colors.cream }}
          >
            Mis catas
          </h2>

          {tastingsLoading ? (
            <div className="flex justify-center py-4"><Spinner size={24} /></div>
          ) : tastings.length === 0 ? (
            <div
              className="flex flex-col items-center gap-3 py-8 text-center rounded-xl"
              style={{ background: theme.colors.surface, border: `1px solid ${theme.colors.border}` }}
            >
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke={theme.colors.border} strokeWidth="1" strokeLinecap="round" strokeLinejoin="round">
                <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"/><path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"/>
              </svg>
              <p style={{ color: theme.colors.muted, fontSize: '0.85rem' }}>Aún no has catado este vino</p>
              <Button variant="secondary" onClick={() => navigate(`/catas/nueva?wineId=${wine.id}`)}>
                Catar ahora
              </Button>
            </div>
          ) : (
            <>
              {tastings.map(t => <TastingMiniCard key={t.id} tasting={t} />)}
              <button
                onClick={() => navigate(`/catas/nueva?wineId=${wine.id}`)}
                className="text-sm py-2.5 text-center rounded-xl"
                style={{ color: theme.colors.muted, border: `1px solid ${theme.colors.border}` }}
              >
                + Registrar nueva cata
              </button>
            </>
          )}
        </div>
      </div>

      {/* Modales */}
      <Modal open={editOpen} onClose={() => setEditOpen(false)} title="Editar vino">
        <WineForm initialData={wine} onSubmit={handleUpdate} loading={saving} />
      </Modal>

      <Modal open={deleteOpen} onClose={() => setDeleteOpen(false)} title="Eliminar vino">
        <p className="text-sm" style={{ color: theme.colors.muted }}>
          ¿Eliminar <span style={{ color: theme.colors.cream }}>{wine.nombre}</span> de tu bodega? Esta acción no se puede deshacer.
        </p>
        <div className="flex gap-3 mt-2">
          <Button variant="secondary" className="flex-1" onClick={() => setDeleteOpen(false)} disabled={deleting}>
            Cancelar
          </Button>
          <Button className="flex-1" style={{ background: '#D32F2F', color: theme.colors.cream }} loading={deleting} onClick={handleDelete}>
            Eliminar
          </Button>
        </div>
      </Modal>
      </>}
    </Layout>
  )
}
