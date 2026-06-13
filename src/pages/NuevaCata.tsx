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

export default function NuevaCata() {
  const navigate        = useNavigate()
  const [params]        = useSearchParams()
  const initialWineId   = params.get('wineId') ?? ''
  const toast           = useToastStore()

  const { createTasting }    = useTastings()
  const { getWine, loadWines } = useWines()
  const { wines: allWines }  = useWineStore()

  const [wine,    setWine]    = useState<Wine | null>(null)
  const [loading, setLoading] = useState(false)
  const [saving,  setSaving]  = useState(false)
  const [query,   setQuery]   = useState('')
  const [open,    setOpen]    = useState(false)
  const inputRef  = useRef<HTMLInputElement>(null)
  const dropRef   = useRef<HTMLDivElement>(null)

  // Cargar todos los vinos al montar
  useEffect(() => {
    if (allWines.length === 0) loadWines().catch(() => null)
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  // Si viene con wineId, seleccionar directamente
  useEffect(() => {
    if (!initialWineId) return
    setLoading(true)
    getWine(initialWineId)
      .then(w => { if (w) setWine(w) })
      .finally(() => setLoading(false))
  }, [initialWineId]) // eslint-disable-line react-hooks/exhaustive-deps

  // Cerrar desplegable al hacer click fuera
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
      })
      toast.show('Cata guardada')
      navigate(`/catas/${tasting.id}`, { replace: true })
    } catch {
      toast.show('Error al guardar la cata', 'error')
      setSaving(false)
    }
  }

  return (
    <Layout>
      {/* Header */}
      <div className="flex items-center gap-3 px-4 pt-5 pb-3 flex-shrink-0">
        <button
          onClick={() => navigate(-1)}
          className="text-sm font-medium"
          style={{ color: theme.colors.gold }}
        >
          ← Volver
        </button>
        <h1
          className="flex-1 font-semibold truncate"
          style={{ color: theme.colors.cream, fontSize: theme.font.lg }}
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
              <p className="text-sm" style={{ color: theme.colors.muted }}>
                ¿Qué vino vas a catar hoy?
              </p>

              {/* Desplegable con filtro */}
              <div ref={dropRef} style={{ position: 'relative' }}>
                <div
                  className="flex items-center gap-2 rounded-xl px-3 py-2"
                  style={{ background: theme.colors.surface, border: `1px solid ${open ? theme.colors.gold + '80' : '#3A2A2E'}` }}
                >
                  <span style={{ color: theme.colors.muted }}>🔍</span>
                  <input
                    ref={inputRef}
                    value={query}
                    onChange={e => { setQuery(e.target.value); setOpen(true) }}
                    onFocus={() => setOpen(true)}
                    placeholder="Busca o selecciona un vino..."
                    className="flex-1 bg-transparent outline-none text-sm"
                    style={{ color: theme.colors.cream }}
                    autoFocus
                  />
                  {allWines.length === 0
                    ? <Spinner size={16} />
                    : (
                      <button
                        onMouseDown={e => { e.preventDefault(); setOpen(o => !o) }}
                        style={{ color: theme.colors.muted, fontSize: '0.75rem', lineHeight: 1, padding: '4px' }}
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
                      top: 'calc(100% + 6px)',
                      background: theme.colors.surface,
                      border: '1px solid #3A2A2E',
                      maxHeight: '55vh',
                      overflowY: 'auto',
                      zIndex: 50,
                    }}
                  >
                    {filtered.map(w => (
                      <button
                        key={w.id}
                        onMouseDown={() => { setWine(w); setQuery(''); setOpen(false) }}
                        className="w-full flex items-center gap-3 px-3 py-3 text-left active:opacity-75"
                        style={{ borderBottom: '1px solid #2A1A1E' }}
                      >
                        <span style={{ fontSize: '1.25rem', flexShrink: 0 }}>🍾</span>
                        <div className="min-w-0 flex-1">
                          <p className="font-medium text-sm truncate" style={{ color: theme.colors.cream }}>
                            {w.nombre}{w.anada ? ` ${w.anada}` : ''}
                          </p>
                          {w.bodega && (
                            <p className="text-xs truncate" style={{ color: theme.colors.muted }}>{w.bodega}</p>
                          )}
                        </div>
                      </button>
                    ))}
                  </div>
                )}

                {open && query.trim() && filtered.length === 0 && (
                  <div
                    className="absolute left-0 right-0 rounded-xl px-4 py-4 text-center text-sm"
                    style={{ top: 'calc(100% + 6px)', background: theme.colors.surface, border: '1px solid #3A2A2E', color: theme.colors.muted, zIndex: 50 }}
                  >
                    No se encontraron vinos
                  </div>
                )}
              </div>
            </>
          )}
        </div>
      )}

      {/* Fase 2: banner del vino + chat */}
      {wine && (
        <div className="flex flex-col px-4 pb-6" style={{ flex: 1, minHeight: 0 }}>
          {/* Banner vino */}
          <div
            className="flex items-center gap-3 rounded-xl px-3 py-2 mb-4 flex-shrink-0"
            style={{ background: theme.colors.surface, border: `1px solid ${theme.colors.gold}40` }}
          >
            <span style={{ fontSize: '1.5rem' }}>🍷</span>
            <div className="flex-1 min-w-0">
              <p className="font-semibold text-sm truncate" style={{ color: theme.colors.cream }}>
                {wine.nombre}{wine.anada ? ` ${wine.anada}` : ''}
              </p>
              {wine.bodega && (
                <p className="text-xs truncate" style={{ color: theme.colors.muted }}>{wine.bodega}</p>
              )}
            </div>
            <button
              onClick={() => setWine(null)}
              className="text-xs flex-shrink-0"
              style={{ color: theme.colors.muted }}
            >
              cambiar
            </button>
          </div>

          {/* Chat de cata */}
          {saving ? (
            <div className="flex flex-col items-center gap-3 py-16">
              <Spinner />
              <p className="text-sm" style={{ color: theme.colors.muted }}>Guardando cata...</p>
            </div>
          ) : (
            <TastingChat wine={wine} onComplete={handleComplete} />
          )}
        </div>
      )}
    </Layout>
  )
}
