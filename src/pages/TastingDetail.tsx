import { useState, useEffect } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import Layout from '../components/ui/Layout'
import Modal from '../components/ui/Modal'
import Button from '../components/ui/Button'
import Spinner from '../components/ui/Spinner'
import TastingEditForm from '../components/wine/TastingEditForm'
import { useTastings } from '../hooks/useTastings'
import { useWines } from '../hooks/useWines'
import { useToastStore } from '../store/toastStore'
import { theme } from '../constants/theme'
import type { Tasting, Wine } from '../types'

function ScoreBadge({ score }: { score: number | null }) {
  const bg =
    score === null    ? theme.colors.surface :
    score >= 90       ? theme.colors.gold    :
    score >= 70       ? theme.colors.primary : theme.colors.scoreNeutral

  const color =
    score === null    ? theme.colors.muted :
    score >= 90       ? theme.colors.dark   : theme.colors.cream

  return (
    <div
      className="flex items-center justify-center rounded-full font-bold"
      style={{ width: 72, height: 72, background: bg, color, fontSize: '1.5rem', flexShrink: 0 }}
    >
      {score ?? '–'}
    </div>
  )
}

interface SectionCardProps {
  icon: string
  title: string
  content: string | null
}

function SectionCard({ icon, title, content }: SectionCardProps) {
  if (!content) return null
  return (
    <div className="rounded-xl p-4" style={{ background: theme.colors.surface, border: `1px solid ${theme.colors.borderSubtle}` }}>
      <p className="text-xs font-semibold mb-2" style={{ color: theme.colors.muted }}>
        {icon} {title}
      </p>
      <p className="text-sm leading-relaxed" style={{ color: theme.colors.cream }}>{content}</p>
    </div>
  )
}

export default function TastingDetail() {
  const { id }     = useParams<{ id: string }>()
  const navigate   = useNavigate()
  const toast      = useToastStore()

  const { getTasting, updateTasting, deleteTasting } = useTastings()
  const { getWine }                                  = useWines()

  const [tasting,      setTasting]      = useState<Tasting | null>(null)
  const [wine,         setWine]         = useState<Wine | null>(null)
  const [loadingPage,  setLoadingPage]  = useState(true)
  const [editing,      setEditing]      = useState(false)
  const [deleteOpen,   setDeleteOpen]   = useState(false)
  const [deleting,     setDeleting]     = useState(false)
  const [chatExpanded, setChatExpanded] = useState(false)

  useEffect(() => {
    if (!id) return
    getTasting(id).then(async t => {
      if (t) {
        setTasting(t)
        const w = await getWine(t.wine_id)
        setWine(w)
      }
      setLoadingPage(false)
    })
  }, [id]) // eslint-disable-line react-hooks/exhaustive-deps

  async function handleEdit(fields: Partial<Tasting>) {
    if (!tasting) return
    const updated = await updateTasting(tasting.id, fields)
    setTasting(updated)
    setEditing(false)
    toast.show('Cata actualizada')
  }

  async function handleDelete() {
    if (!tasting) return
    setDeleting(true)
    try {
      await deleteTasting(tasting.id)
      toast.show('Cata eliminada', 'error')
      navigate('/catas', { replace: true })
    } catch {
      toast.show('Error al eliminar la cata', 'error')
      setDeleting(false)
    }
  }

  function handleShare() {
    if (!tasting) return
    const lines = [
      wine ? `🍷 ${wine.nombre}${wine.anada ? ` ${wine.anada}` : ''}` : '',
      wine?.bodega ? `🏠 ${wine.bodega}` : '',
      tasting.puntuacion !== null ? `⭐ Puntuación: ${tasting.puntuacion}/100` : '',
      tasting.color_descripcion ? `🎨 Color: ${tasting.color_descripcion}` : '',
      tasting.aroma ? `👃 Aroma: ${tasting.aroma}` : '',
      tasting.notas_cata ? `👄 Boca: ${tasting.notas_cata}` : '',
      tasting.maridaje ? `🍽️ Maridaje: ${tasting.maridaje}` : '',
    ].filter(Boolean).join('\n')

    const copyToClipboard = (text: string) => {
      if (navigator.clipboard) {
        navigator.clipboard.writeText(text)
          .then(() => toast.show('Copiado al portapapeles'))
          .catch(() => fallbackCopy(text))
      } else {
        fallbackCopy(text)
      }
    }

    const fallbackCopy = (text: string) => {
      const el = document.createElement('textarea')
      el.value = text
      el.style.position = 'fixed'
      el.style.opacity = '0'
      document.body.appendChild(el)
      el.focus()
      el.select()
      try {
        document.execCommand('copy')
        toast.show('Copiado al portapapeles')
      } catch {
        toast.show('No se pudo copiar', 'error')
      }
      document.body.removeChild(el)
    }

    if (navigator.share && lines && /Mobi|Android/i.test(navigator.userAgent)) {
      navigator.share({ title: wine?.nombre ?? 'Cata de vino', text: lines })
        .then(() => toast.show('Cata compartida'))
        .catch(() => copyToClipboard(lines))
    } else {
      copyToClipboard(lines)
    }
  }

  const fecha = tasting
    ? new Date(tasting.fecha).toLocaleDateString('es-ES', {
        weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
      })
    : ''

  return (
    <Layout>
      {loadingPage ? (
        <div className="flex h-full items-center justify-center" style={{ minHeight: '60vh' }}>
          <Spinner />
        </div>
      ) : !tasting ? (
        <div className="flex flex-col items-center gap-4 py-16 px-6 text-center">
          <span style={{ fontSize: '3rem' }}>📖</span>
          <p style={{ color: theme.colors.muted }}>No encontramos esta cata</p>
          <Button onClick={() => navigate('/catas')}>Volver a catas</Button>
        </div>
      ) : <>
      {/* Header */}
      <div className="flex items-center justify-between px-4 pt-4 pb-2">
        <button
          onClick={() => editing ? setEditing(false) : navigate('/catas')}
          className="flex items-center gap-1 text-sm font-medium"
          style={{ color: theme.colors.gold }}
        >
          ← {editing ? 'Cancelar' : 'Volver'}
        </button>
        <div className="flex items-center gap-3">
          {!editing && (
            <button
              onClick={() => setEditing(true)}
              className="text-sm font-medium"
              style={{ color: theme.colors.cream }}
            >
              Editar
            </button>
          )}
          {!editing && (
            <button
              onClick={() => setDeleteOpen(true)}
              className="text-sm"
              style={{ color: theme.colors.errorStrong }}
            >
              Eliminar
            </button>
          )}
        </div>
      </div>

      {/* Modo edición */}
      {editing && (
        <div className="px-4 pb-24 flex flex-col gap-4">
          <TastingEditForm
            tasting={tasting}
            onSave={handleEdit}
            onCancel={() => setEditing(false)}
          />
        </div>
      )}

      {/* Modo lectura */}
      {!editing && (
      <div className="px-4 pb-24 flex flex-col gap-4">

        {/* Puntuación + fecha */}
        <div className="flex items-center gap-4">
          <ScoreBadge score={tasting.puntuacion} />
          <div>
            <p className="font-semibold capitalize" style={{ color: theme.colors.cream, fontSize: theme.font.base }}>
              {fecha}
            </p>
            {tasting.puntuacion !== null && (
              <p className="text-sm" style={{ color: theme.colors.muted }}>
                {tasting.puntuacion >= 90 ? 'Excepcional' :
                 tasting.puntuacion >= 80 ? 'Muy bueno'   :
                 tasting.puntuacion >= 70 ? 'Bueno'       :
                 tasting.puntuacion >= 60 ? 'Aceptable'   : 'Básico'}
              </p>
            )}
          </div>
        </div>

        {/* Banner vino */}
        {wine ? (
          <Link
            to={`/bodega/${wine.id}`}
            className="flex items-center gap-3 rounded-xl px-3 py-3 no-underline active:opacity-75"
            style={{ background: theme.colors.surface, border: `1px solid ${theme.colors.gold}40` }}
          >
            <span style={{ fontSize: '1.5rem' }}>🍾</span>
            <div className="flex-1 min-w-0">
              <p className="font-semibold text-sm truncate" style={{ color: theme.colors.cream }}>
                {wine.nombre}{wine.anada ? ` · ${wine.anada}` : ''}
              </p>
              {wine.bodega && (
                <p className="text-xs truncate" style={{ color: theme.colors.muted }}>{wine.bodega}</p>
              )}
            </div>
            <span style={{ color: theme.colors.muted, fontSize: '1rem' }}>›</span>
          </Link>
        ) : null}

        {/* Secciones */}
        <SectionCard icon="🎨" title="Color"    content={tasting.color_descripcion} />
        <SectionCard icon="👃" title="Aroma"    content={tasting.aroma} />
        <SectionCard icon="👄" title="Boca"     content={tasting.notas_cata} />
        <SectionCard icon="🍽️" title="Maridaje" content={tasting.maridaje} />

        {/* Chat history */}
        {tasting.chat_history.length > 0 && (
          <div className="rounded-xl overflow-hidden" style={{ background: theme.colors.surface, border: `1px solid ${theme.colors.borderSubtle}` }}>
            <button
              className="w-full flex items-center justify-between px-4 py-3"
              onClick={() => setChatExpanded(e => !e)}
            >
              <span className="text-sm font-semibold" style={{ color: theme.colors.cream }}>
                💬 Ver conversación ({tasting.chat_history.length} mensajes)
              </span>
              <span style={{ color: theme.colors.muted }}>{chatExpanded ? '▲' : '▼'}</span>
            </button>

            {chatExpanded && (
              <div className="px-4 pb-4 flex flex-col gap-2 border-t" style={{ borderColor: theme.colors.borderSubtle }}>
                <div style={{ height: 12 }} />
                {tasting.chat_history.map((msg, i) => {
                  const isUser = msg.role === 'user'
                  const content = msg.role === 'assistant'
                    ? msg.content.split('CATA_COMPLETA')[0].trim()
                    : msg.content
                  if (!content) return null
                  return (
                    <div key={i} className={`flex ${isUser ? 'justify-end' : 'justify-start'}`}>
                      <div
                        className="max-w-xs rounded-2xl px-3 py-2 text-sm leading-relaxed"
                        style={{
                          background: isUser ? theme.colors.primary : theme.colors.borderSubtle,
                          color:      theme.colors.cream,
                          borderBottomRightRadius: isUser ? 4 : undefined,
                          borderBottomLeftRadius:  isUser ? undefined : 4,
                        }}
                      >
                        {content}
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        )}

        {/* Compartir */}
        <Button variant="secondary" onClick={handleShare}>
          Compartir cata
        </Button>
      </div>
      )}

      {/* Modal eliminación */}
      <Modal open={deleteOpen} onClose={() => setDeleteOpen(false)} title="Eliminar cata">
        <p className="text-sm" style={{ color: theme.colors.muted }}>
          ¿Eliminar esta cata? La acción no se puede deshacer.
        </p>
        <div className="flex gap-3 mt-4">
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
            style={{ background: theme.colors.errorStrong, color: theme.colors.cream }}
            loading={deleting}
            onClick={handleDelete}
          >
            Eliminar
          </Button>
        </div>
      </Modal>
      </>}
    </Layout>
  )
}
