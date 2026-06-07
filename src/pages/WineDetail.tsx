import { useState, useEffect } from 'react'
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

type ImageTab = 'frontal' | 'trasera'

export default function WineDetail() {
  const { id }     = useParams<{ id: string }>()
  const navigate   = useNavigate()
  const toast      = useToastStore()

  const { getWine, updateWine, deleteWine } = useWines()
  const { tastings, loading: tastingsLoading } = useTastings(id)

  const [wine,        setWine]        = useState<Wine | null>(null)
  const [loadingWine, setLoadingWine] = useState(true)
  const [imageTab,    setImageTab]    = useState<ImageTab>('frontal')
  const [menuOpen,    setMenuOpen]    = useState(false)
  const [editOpen,    setEditOpen]    = useState(false)
  const [deleteOpen,  setDeleteOpen]  = useState(false)
  const [saving,      setSaving]      = useState(false)
  const [deleting,    setDeleting]    = useState(false)

  useEffect(() => {
    if (!id) return
    getWine(id).then(w => {
      setWine(w)
      setLoadingWine(false)
    })
  }, [id]) // eslint-disable-line react-hooks/exhaustive-deps

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

  const hasFrontal = !!wine?.imagen_frontal_url
  const hasTrasera = !!wine?.imagen_trasera_url
  const hasBoth    = hasFrontal && hasTrasera

  const avgPuntuacion = tastings.length
    ? Math.round(
        tastings.reduce((acc, t) => acc + (t.puntuacion ?? 0), 0) /
        tastings.filter(t => t.puntuacion !== null).length
      )
    : null

  if (loadingWine) {
    return (
      <Layout>
        <div className="flex h-full items-center justify-center" style={{ minHeight: '60vh' }}>
          <Spinner />
        </div>
      </Layout>
    )
  }

  if (!wine) {
    return (
      <Layout>
        <div className="flex flex-col items-center gap-4 py-16 px-6 text-center">
          <span style={{ fontSize: '3rem' }}>🍷</span>
          <p style={{ color: theme.colors.muted }}>No encontramos este vino</p>
          <Button onClick={() => navigate('/bodega')}>Volver a la bodega</Button>
        </div>
      </Layout>
    )
  }

  const wineFields: { label: string; value: string | number | null | undefined }[] = [
    { label: 'Bodega',            value: wine.bodega },
    { label: 'Añada',             value: wine.anada },
    { label: 'Región',            value: wine.region },
    { label: 'Denominación',      value: wine.denominacion },
    { label: 'Uva',               value: wine.uva },
  ]

  return (
    <Layout>
      {/* Header */}
      <div className="flex items-center justify-between px-4 pt-4 pb-2">
        <button
          onClick={() => navigate('/bodega')}
          className="flex items-center gap-1 text-sm font-medium"
          style={{ color: theme.colors.gold }}
        >
          ← Volver
        </button>
        <h1
          className="flex-1 text-center font-semibold truncate px-3"
          style={{ color: theme.colors.cream, fontSize: theme.font.base }}
        >
          {wine.nombre}
        </h1>
        <div className="relative">
          <button
            onClick={() => setMenuOpen(o => !o)}
            className="p-2 text-xl"
            style={{ color: theme.colors.muted }}
          >
            ⋮
          </button>
          {menuOpen && (
            <div
              className="absolute right-0 top-8 z-20 rounded-xl shadow-xl min-w-36 overflow-hidden"
              style={{ background: theme.colors.surface, border: '1px solid #3A2A2E' }}
            >
              <button
                className="w-full text-left px-4 py-3 text-sm active:opacity-70"
                style={{ color: theme.colors.cream }}
                onClick={() => { setMenuOpen(false); setEditOpen(true) }}
              >
                ✏️ Editar
              </button>
              <button
                className="w-full text-left px-4 py-3 text-sm active:opacity-70"
                style={{ color: '#D32F2F' }}
                onClick={() => { setMenuOpen(false); setDeleteOpen(true) }}
              >
                🗑 Eliminar
              </button>
            </div>
          )}
        </div>
      </div>

      <div className="px-4 flex flex-col gap-5 pb-24">

        {/* Sección 1: Imágenes */}
        <div>
          {hasBoth && (
            <div className="flex gap-1 mb-2">
              {(['frontal', 'trasera'] as ImageTab[]).map(tab => (
                <button
                  key={tab}
                  onClick={() => setImageTab(tab)}
                  className="flex-1 py-1.5 text-sm font-medium rounded-lg transition-colors capitalize"
                  style={{
                    background: imageTab === tab ? theme.colors.gold : theme.colors.surface,
                    color:      imageTab === tab ? theme.colors.dark : theme.colors.muted,
                  }}
                >
                  {tab.charAt(0).toUpperCase() + tab.slice(1)}
                </button>
              ))}
            </div>
          )}

          <div
            className="w-full rounded-xl overflow-hidden flex items-center justify-center"
            style={{ background: '#3A2A2E', height: 220 }}
          >
            {(hasBoth ? imageTab === 'frontal' : hasFrontal) && wine.imagen_frontal_url ? (
              <img src={wine.imagen_frontal_url} alt="Etiqueta frontal" className="h-full object-contain" />
            ) : hasTrasera && wine.imagen_trasera_url ? (
              <img src={wine.imagen_trasera_url} alt="Etiqueta trasera" className="h-full object-contain" />
            ) : (
              <span style={{ fontSize: '4rem' }}>🍾</span>
            )}
          </div>
        </div>

        {/* Sección 2: Datos del vino */}
        <div className="rounded-xl p-4 flex flex-col gap-3" style={{ background: theme.colors.surface, border: '1px solid #3A2A2E' }}>
          <h2 className="font-semibold" style={{ color: theme.colors.gold }}>Datos del vino</h2>
          {wineFields.filter(f => f.value !== null && f.value !== undefined && f.value !== '').map(({ label, value }) => (
            <div key={label} className="flex justify-between items-center gap-3">
              <span className="text-sm" style={{ color: theme.colors.muted }}>{label}</span>
              <span className="text-sm font-medium text-right" style={{ color: theme.colors.cream }}>{value}</span>
            </div>
          ))}
          <Button
            variant="secondary"
            className="mt-1"
            onClick={() => setEditOpen(true)}
          >
            Editar
          </Button>
        </div>

        {/* Sección 3: Catas */}
        <div className="flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <h2 className="font-semibold" style={{ color: theme.colors.gold }}>Mis catas</h2>
            {avgPuntuacion !== null && !isNaN(avgPuntuacion) && (
              <span
                className="px-3 py-1 rounded-full font-bold text-sm"
                style={{ background: theme.colors.surface, color: theme.colors.gold, border: `1px solid ${theme.colors.gold}` }}
              >
                {avgPuntuacion} pts media
              </span>
            )}
          </div>

          {tastingsLoading ? (
            <div className="flex justify-center py-4"><Spinner size={24} /></div>
          ) : tastings.length === 0 ? (
            <div className="flex flex-col items-center gap-3 py-8 text-center rounded-xl" style={{ background: theme.colors.surface, border: '1px solid #3A2A2E' }}>
              <p style={{ color: theme.colors.muted }}>Aún no has catado este vino</p>
              <Button
                variant="secondary"
                onClick={() => navigate(`/catas/nueva?wineId=${wine.id}`)}
              >
                Catar ahora
              </Button>
            </div>
          ) : (
            <>
              {tastings.map(t => <TastingMiniCard key={t.id} tasting={t} />)}
              <Button
                variant="secondary"
                onClick={() => navigate(`/catas/nueva?wineId=${wine.id}`)}
              >
                + Registrar nueva cata
              </Button>
            </>
          )}
        </div>
      </div>

      {/* Modal edición */}
      <Modal open={editOpen} onClose={() => setEditOpen(false)} title="Editar vino">
        <WineForm
          initialData={wine}
          onSubmit={handleUpdate}
          loading={saving}
        />
      </Modal>

      {/* Modal eliminación */}
      <Modal open={deleteOpen} onClose={() => setDeleteOpen(false)} title="Eliminar vino">
        <p className="text-sm" style={{ color: theme.colors.muted }}>
          ¿Eliminar <span style={{ color: theme.colors.cream }}>{wine.nombre}</span> de tu bodega? Esta acción no se puede deshacer.
        </p>
        <div className="flex gap-3 mt-2">
          <Button
            variant="secondary"
            className="flex-1"
            onClick={() => setDeleteOpen(false)}
            disabled={deleting}
          >
            Cancelar
          </Button>
          <Button
            className="flex-1"
            style={{ background: '#D32F2F', color: theme.colors.cream }}
            loading={deleting}
            onClick={handleDelete}
          >
            Eliminar
          </Button>
        </div>
      </Modal>

      {/* Overlay para cerrar menú */}
      {menuOpen && (
        <div className="fixed inset-0 z-10" onClick={() => setMenuOpen(false)} />
      )}
    </Layout>
  )
}
