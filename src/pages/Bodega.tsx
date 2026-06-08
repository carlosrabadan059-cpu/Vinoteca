import { useState, useEffect, useRef, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import Layout from '../components/ui/Layout'
import WineCard from '../components/wine/WineCard'
import Spinner from '../components/ui/Spinner'
import { useWines } from '../hooks/useWines'
import { useWineStore } from '../store/wineStore'
import { theme } from '../constants/theme'
import type { Wine } from '../types'

const TIPOS = ['Todos', 'Tinto', 'Blanco', 'Rosado', 'Espumoso', 'Dulce']
const PAGE_SIZE = 20

function WineSkeleton() {
  return (
    <div className="overflow-hidden rounded-xl animate-pulse" style={{ background: theme.colors.surface, border: `1px solid ${theme.colors.border}` }}>
      <div style={{ height: 180, background: '#1A0E10' }} />
      <div className="px-4 py-3 flex flex-col gap-2">
        <div className="h-4 rounded" style={{ background: theme.colors.border, width: '65%' }} />
        <div className="h-3 rounded" style={{ background: theme.colors.border, width: '45%' }} />
      </div>
    </div>
  )
}

export default function Bodega() {
  const navigate   = useNavigate()
  const { listWines } = useWines()
  const { total }  = useWineStore()

  const [wines,       setWines]       = useState<Wine[]>([])
  const [page,        setPage]        = useState(0)
  const [hasMore,     setHasMore]     = useState(true)
  const [loading,     setLoading]     = useState(true)
  const [loadingMore, setLoadingMore] = useState(false)
  const [refreshing,  setRefreshing]  = useState(false)
  const [searchOpen,  setSearchOpen]  = useState(false)
  const [query,       setQuery]       = useState('')
  const [debouncedQ,  setDebouncedQ]  = useState('')
  const [tipoFilter,  setTipoFilter]  = useState<string | null>(null)

  const searchRef   = useRef<HTMLInputElement>(null)
  const sentinelRef = useRef<HTMLDivElement>(null)
  const touchStartY = useRef(0)

  useEffect(() => {
    const t = setTimeout(() => setDebouncedQ(query), 300)
    return () => clearTimeout(t)
  }, [query])

  useEffect(() => {
    load(0, true)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debouncedQ, tipoFilter])

  useEffect(() => {
    if (searchOpen) searchRef.current?.focus()
  }, [searchOpen])

  async function load(pageNum: number, reset: boolean) {
    if (reset) {
      setLoading(true)
      setPage(0)
    } else {
      setLoadingMore(true)
    }
    try {
      const results = await listWines({ query: debouncedQ, page: pageNum })
      const filtered = tipoFilter ? results.filter(w => w.tipo === tipoFilter) : results
      setWines(prev => reset ? filtered : [...prev, ...filtered])
      setHasMore(results.length === PAGE_SIZE)
      if (!reset) setPage(pageNum)
    } catch {
      // silent
    } finally {
      setLoading(false)
      setLoadingMore(false)
      setRefreshing(false)
    }
  }

  const loadMore = useCallback(() => {
    if (loadingMore || !hasMore) return
    load(page + 1, false)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, hasMore, loadingMore])

  useEffect(() => {
    const el = sentinelRef.current
    if (!el || !hasMore) return
    const observer = new IntersectionObserver(
      entries => { if (entries[0].isIntersecting) loadMore() },
      { threshold: 0.1 }
    )
    observer.observe(el)
    return () => observer.disconnect()
  }, [loadMore, hasMore])

  useEffect(() => {
    function onTouchStart(e: TouchEvent) { touchStartY.current = e.touches[0].clientY }
    function onTouchEnd(e: TouchEvent) {
      const main = document.querySelector('main')
      if (!main || main.scrollTop > 8) return
      const delta = e.changedTouches[0].clientY - touchStartY.current
      if (delta > 80 && !refreshing) { setRefreshing(true); load(0, true) }
    }
    window.addEventListener('touchstart', onTouchStart, { passive: true })
    window.addEventListener('touchend', onTouchEnd, { passive: true })
    return () => {
      window.removeEventListener('touchstart', onTouchStart)
      window.removeEventListener('touchend', onTouchEnd)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [refreshing])

  function closeSearch() { setSearchOpen(false); setQuery('') }
  const hasFilter = !!debouncedQ || !!tipoFilter

  return (
    <Layout>
      {refreshing && (
        <div className="flex justify-center py-2" style={{ background: theme.colors.dark }}>
          <Spinner size={20} />
        </div>
      )}

      {/* Header */}
      <div className="px-5 pt-6 pb-4">
        <p
          style={{
            fontSize:      '0.6rem',
            fontWeight:    600,
            letterSpacing: '0.15em',
            textTransform: 'uppercase',
            color:         theme.colors.muted,
            marginBottom:  6,
          }}
        >
          Colección curada
        </p>
        <div className="flex items-end justify-between">
          <h1
            className="text-editorial"
            style={{ fontSize: '2rem', fontWeight: 700, color: theme.colors.cream, lineHeight: 1.1 }}
          >
            Mi Bodega<br />
            <span style={{ fontStyle: 'italic', color: theme.colors.gold }}>Personal</span>
          </h1>
          <div className="flex items-center gap-3 pb-1">
            {total > 0 && (
              <span style={{ fontSize: '0.75rem', color: theme.colors.muted }}>
                {total} vino{total !== 1 ? 's' : ''}
              </span>
            )}
            <button
              onClick={() => setSearchOpen(o => !o)}
              style={{ color: searchOpen ? theme.colors.gold : theme.colors.muted }}
              aria-label="Buscar"
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/>
              </svg>
            </button>
          </div>
        </div>
      </div>

      {/* Search bar */}
      {searchOpen && (
        <div className="px-4 pb-3 flex items-center gap-2">
          <input
            ref={searchRef}
            value={query}
            onChange={e => setQuery(e.target.value)}
            placeholder="Nombre, bodega o región…"
            className="flex-1 px-4 py-2.5 rounded-xl text-sm outline-none"
            style={{
              background: theme.colors.surface,
              color:      theme.colors.cream,
              border:     `1px solid ${theme.colors.border}`,
            }}
          />
          <button onClick={closeSearch} className="p-2 text-sm" style={{ color: theme.colors.muted }}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <path d="M18 6 6 18M6 6l12 12"/>
            </svg>
          </button>
        </div>
      )}

      {/* Filter chips */}
      <div
        className="flex gap-2 px-4 pb-4 overflow-x-auto"
        style={{ scrollbarWidth: 'none' } as React.CSSProperties}
      >
        {TIPOS.map(tipo => {
          const active = tipo === 'Todos' ? tipoFilter === null : tipoFilter === tipo
          return (
            <button
              key={tipo}
              onClick={() => setTipoFilter(tipo === 'Todos' ? null : tipo)}
              className="px-3 py-1.5 rounded-full text-sm whitespace-nowrap flex-shrink-0 transition-all"
              style={{
                background:    active ? theme.colors.gold : 'transparent',
                color:         active ? theme.colors.dark : theme.colors.muted,
                border:        `1px solid ${active ? theme.colors.gold : theme.colors.border}`,
                fontWeight:    active ? 600 : 400,
                letterSpacing: '0.02em',
                fontSize:      '0.8rem',
              }}
            >
              {tipo}
            </button>
          )
        })}
      </div>

      {/* Content */}
      <div className="px-4 flex flex-col gap-4 pb-28">
        {loading ? (
          Array.from({ length: 4 }).map((_, i) => <WineSkeleton key={i} />)
        ) : wines.length === 0 ? (
          <div className="flex flex-col items-center gap-5 py-20 text-center">
            <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke={theme.colors.border} strokeWidth="1" strokeLinecap="round" strokeLinejoin="round">
              <path d="M8 22h8M12 11v11M5 3h14l-2 7a5 5 0 0 1-10 0L5 3z"/>
            </svg>
            {hasFilter ? (
              <p style={{ color: theme.colors.muted, fontSize: '0.9rem' }}>
                No encontramos vinos con ese criterio
              </p>
            ) : (
              <>
                <div>
                  <p className="text-editorial" style={{ color: theme.colors.cream, fontSize: '1.25rem', fontWeight: 600 }}>
                    Tu bodega está vacía
                  </p>
                  <p style={{ color: theme.colors.muted, fontSize: '0.85rem', marginTop: 4 }}>
                    Empieza escaneando tu primer vino
                  </p>
                </div>
                <button
                  onClick={() => navigate('/scan')}
                  className="px-8 py-3 rounded-full font-semibold"
                  style={{ background: theme.colors.primary, color: theme.colors.cream, fontSize: '0.9rem' }}
                >
                  Escanear vino
                </button>
              </>
            )}
          </div>
        ) : (
          <>
            {wines.map(wine => (
              <WineCard
                key={wine.id}
                wine={wine}
                onClick={() => navigate(`/bodega/${wine.id}`)}
              />
            ))}
            <div ref={sentinelRef} className="h-2" />
            {loadingMore && (
              <div className="flex justify-center py-4">
                <Spinner size={24} />
              </div>
            )}
          </>
        )}
      </div>

      {/* FAB */}
      <button
        onClick={() => navigate('/scan')}
        className="fixed bottom-20 right-5 w-14 h-14 rounded-full flex items-center justify-center shadow-2xl z-30 transition-opacity active:opacity-80"
        style={{ background: theme.colors.primary }}
        aria-label="Añadir vino"
      >
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={theme.colors.cream} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/>
          <circle cx="12" cy="13" r="4"/>
        </svg>
      </button>
    </Layout>
  )
}
