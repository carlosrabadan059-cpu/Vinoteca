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
    <div className="flex items-center gap-3 rounded-xl p-3" style={{ background: theme.colors.surface, border: '1px solid #3A2A2E' }}>
      <div className="flex-shrink-0 rounded-lg animate-pulse" style={{ width: 64, height: 64, background: '#3A2A2E' }} />
      <div className="flex-1 flex flex-col gap-2">
        <div className="h-4 rounded animate-pulse" style={{ background: '#3A2A2E', width: '60%' }} />
        <div className="h-3 rounded animate-pulse" style={{ background: '#3A2A2E', width: '40%' }} />
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

  const searchRef  = useRef<HTMLInputElement>(null)
  const sentinelRef = useRef<HTMLDivElement>(null)
  const touchStartY = useRef(0)

  // Debounce search
  useEffect(() => {
    const t = setTimeout(() => setDebouncedQ(query), 300)
    return () => clearTimeout(t)
  }, [query])

  // Reset and reload when filters change
  useEffect(() => {
    load(0, true)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debouncedQ, tipoFilter])

  // Auto-focus search input
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

      const filtered = tipoFilter
        ? results.filter(w => w.tipo === tipoFilter)
        : results

      setWines(prev => reset ? filtered : [...prev, ...filtered])
      setHasMore(results.length === PAGE_SIZE)
      if (!reset) setPage(pageNum)
    } catch {
      // silent — connection errors handled by useWines
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

  // Infinite scroll sentinel
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

  // Pull-to-refresh
  useEffect(() => {
    function onTouchStart(e: TouchEvent) {
      touchStartY.current = e.touches[0].clientY
    }
    function onTouchEnd(e: TouchEvent) {
      const main = document.querySelector('main')
      if (!main || main.scrollTop > 8) return
      const delta = e.changedTouches[0].clientY - touchStartY.current
      if (delta > 80 && !refreshing) {
        setRefreshing(true)
        load(0, true)
      }
    }
    window.addEventListener('touchstart', onTouchStart, { passive: true })
    window.addEventListener('touchend', onTouchEnd, { passive: true })
    return () => {
      window.removeEventListener('touchstart', onTouchStart)
      window.removeEventListener('touchend', onTouchEnd)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [refreshing])

  function closeSearch() {
    setSearchOpen(false)
    setQuery('')
  }

  const hasFilter = !!debouncedQ || !!tipoFilter

  return (
    <Layout>
      {/* Pull-to-refresh indicator */}
      {refreshing && (
        <div className="flex justify-center py-2" style={{ background: theme.colors.dark }}>
          <Spinner size={20} />
        </div>
      )}

      {/* Header */}
      <div className="flex items-center justify-between px-5 pt-5 pb-3">
        <div className="flex items-center gap-2">
          <h1 className="text-2xl font-bold" style={{ color: theme.colors.gold }}>Mi Bodega</h1>
          <span
            className="rounded-full px-2 py-0.5 text-xs font-semibold"
            style={{ background: '#3A2A2E', color: theme.colors.muted }}
          >
            {total}
          </span>
        </div>
        <button
          onClick={() => setSearchOpen(o => !o)}
          className="p-2 rounded-lg transition-colors"
          style={{ color: searchOpen ? theme.colors.gold : theme.colors.cream }}
          aria-label="Buscar"
        >
          🔍
        </button>
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
              border:     '1px solid #3A2A2E',
            }}
          />
          <button
            onClick={closeSearch}
            className="p-2 text-sm font-semibold"
            style={{ color: theme.colors.muted }}
          >
            ✕
          </button>
        </div>
      )}

      {/* Filter chips */}
      <div
        className="flex gap-2 px-4 pb-3 overflow-x-auto"
        style={{ scrollbarWidth: 'none' } as React.CSSProperties}
      >
        {TIPOS.map(tipo => {
          const active = tipo === 'Todos' ? tipoFilter === null : tipoFilter === tipo
          return (
            <button
              key={tipo}
              onClick={() => setTipoFilter(tipo === 'Todos' ? null : tipo)}
              className="px-3 py-1.5 rounded-full text-sm font-medium whitespace-nowrap flex-shrink-0 transition-colors"
              style={{
                background: active ? theme.colors.gold : theme.colors.surface,
                color:      active ? theme.colors.dark : theme.colors.muted,
                border:     '1px solid #3A2A2E',
              }}
            >
              {tipo}
            </button>
          )
        })}
      </div>

      {/* Content */}
      <div className="px-4 flex flex-col gap-3 pb-28">
        {loading ? (
          Array.from({ length: 6 }).map((_, i) => <WineSkeleton key={i} />)
        ) : wines.length === 0 ? (
          <div className="flex flex-col items-center gap-4 py-16 text-center">
            <span style={{ fontSize: '3rem' }}>🍷</span>
            {hasFilter ? (
              <p style={{ color: theme.colors.muted }}>
                No encontramos vinos con ese criterio
              </p>
            ) : (
              <>
                <p className="font-medium" style={{ color: theme.colors.cream }}>
                  Tu bodega está vacía
                </p>
                <button
                  onClick={() => navigate('/scan')}
                  className="px-6 py-3 rounded-xl font-semibold"
                  style={{ background: theme.colors.primary, color: theme.colors.cream }}
                >
                  Añade tu primer vino
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
        className="fixed bottom-20 right-5 w-14 h-14 rounded-full flex items-center justify-center shadow-xl z-30 transition-opacity active:opacity-80"
        style={{ background: theme.colors.primary }}
        aria-label="Añadir vino"
      >
        <span style={{ fontSize: '1.5rem' }}>📷</span>
      </button>
    </Layout>
  )
}
