import { useState, useEffect, useRef, useCallback, useMemo } from 'react'
import { useWines } from './useWines'
import { useWineStore } from '../store/wineStore'
import theme, { injectKeyframes } from '../constants/theme'
import { getSuggestions, groupWines } from '../lib/bodegaHelpers'
import type { GroupKey, Suggestion } from '../lib/bodegaHelpers'
import type { SortKey } from './useWines'
import type { Wine } from '../types'

const PAGE_SIZE = 20
const CURRENT_YEAR = new Date().getFullYear()

export interface BodegaState {
  // Vista
  view: 'grid' | 'list'
  setView: (v: 'grid' | 'list') => void

  // Búsqueda
  searchOpen: boolean
  setSearchOpen: (open: boolean) => void
  query: string
  setQuery: (q: string) => void
  suggestions: Suggestion[]
  applySuggestion: (s: Suggestion) => void
  closeSearch: () => void
  searchRef: React.RefObject<HTMLInputElement | null>

  // Filtros rápidos
  tipoFilter: string | null
  setTipoFilter: (tipo: string | null) => void
  favoritoFilter: boolean
  setFavoritoFilter: (v: boolean | ((prev: boolean) => boolean)) => void
  stockFilter: boolean
  setStockFilter: (v: boolean | ((prev: boolean) => boolean)) => void

  // Panel de filtros
  filterPanelOpen: boolean
  setFilterPanelOpen: (open: boolean | ((prev: boolean) => boolean)) => void
  anadaRange: [number, number]
  setAnadaRange: (range: [number, number]) => void
  anadaActive: boolean
  setAnadaActive: (v: boolean) => void
  groupBy: GroupKey | null
  setGroupBy: (key: GroupKey | null) => void
  sortBy: SortKey
  setSortBy: (key: SortKey) => void

  // Datos
  wines: Wine[]
  page: number
  hasMore: boolean
  loading: boolean
  loadingMore: boolean
  refreshing: boolean
  sentinelRef: React.RefObject<HTMLDivElement | null>

  // FAB
  fabHidden: boolean

  // Derivados
  total: number
  totalBotellas: number
  totalBodegas: number
  hasActiveFilters: boolean
  grouped: { label: string; wines: Wine[] }[] | null
  sortLabel: string
  CURRENT_YEAR: number

  // Acciones
  clearFilters: () => void
}

export function useBodegaState(): BodegaState {
  const { listWines } = useWines()
  const { total }     = useWineStore()

  // Inyectar keyframes una sola vez
  useEffect(() => { injectKeyframes() }, [])

  // Vista
  const [view, setViewState] = useState<'grid' | 'list'>(() =>
    (localStorage.getItem('bodega_view') as 'grid' | 'list') ?? 'grid'
  )
  const setView = (v: 'grid' | 'list') => setViewState(v)
  useEffect(() => { localStorage.setItem('bodega_view', view) }, [view])

  // Búsqueda
  const [searchOpen,  setSearchOpen]  = useState(false)
  const [query,       setQuery]       = useState('')
  const [debouncedQ,  setDebouncedQ]  = useState('')
  const [suggestions, setSuggestions] = useState<Suggestion[]>([])
  const searchRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedQ(query), 300)
    return () => clearTimeout(timer)
  }, [query])

  useEffect(() => {
    setSuggestions(query.length >= 2 ? getSuggestions(query, wines) : [])
    // wines referenciado dentro del efecto — se actualiza con el estado wines
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [query])

  useEffect(() => {
    if (searchOpen) setTimeout(() => searchRef.current?.focus(), 50)
  }, [searchOpen])

  // Filtros rápidos
  const [tipoFilter,     setTipoFilter]     = useState<string | null>(null)
  const [favoritoFilter, setFavoritoFilter] = useState(false)
  const [stockFilter,    setStockFilter]    = useState(false)

  // Panel de filtros
  const [anadaRange,      setAnadaRange]      = useState<[number, number]>([1900, CURRENT_YEAR])
  const [anadaActive,     setAnadaActive]     = useState(false)
  const [groupBy,         setGroupBy]         = useState<GroupKey | null>(null)
  const [sortBy,          setSortBy]          = useState<SortKey>('created_at_desc')
  const [filterPanelOpen, setFilterPanelOpen] = useState(false)

  // Datos
  const [wines,       setWines]       = useState<Wine[]>([])
  const [page,        setPage]        = useState(0)
  const [hasMore,     setHasMore]     = useState(true)
  const [loading,     setLoading]     = useState(true)
  const [loadingMore, setLoadingMore] = useState(false)
  const [refreshing,  setRefreshing]  = useState(false)
  const sentinelRef = useRef<HTMLDivElement>(null)

  // FAB
  const [fabHidden, setFabHidden] = useState(false)
  const t = theme

  // Recargar al cambiar filtros
  useEffect(() => {
    load(0, true)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debouncedQ, tipoFilter, favoritoFilter, stockFilter, anadaActive, anadaRange, sortBy])

  // FAB inteligente
  useEffect(() => {
    let timer: ReturnType<typeof setTimeout>
    const handler = () => {
      setFabHidden(true)
      clearTimeout(timer)
      timer = setTimeout(() => setFabHidden(false), t.animation.fabScrollDelay)
    }
    window.addEventListener('scroll', handler, { passive: true })
    return () => { window.removeEventListener('scroll', handler); clearTimeout(timer) }
  }, [t.animation.fabScrollDelay])

  // Pull-to-refresh
  const touchStartY = useRef(0)
  useEffect(() => {
    const onStart = (e: TouchEvent) => { touchStartY.current = e.touches[0].clientY }
    const onEnd   = (e: TouchEvent) => {
      const main = document.querySelector('main')
      if (!main || main.scrollTop > 8) return
      const delta = e.changedTouches[0].clientY - touchStartY.current
      if (delta > 80 && !refreshing) { setRefreshing(true); load(0, true) }
    }
    window.addEventListener('touchstart', onStart, { passive: true })
    window.addEventListener('touchend',   onEnd,   { passive: true })
    return () => {
      window.removeEventListener('touchstart', onStart)
      window.removeEventListener('touchend',   onEnd)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [refreshing])

  // Infinite scroll
  const loadMore = useCallback(() => {
    if (loadingMore || !hasMore) return
    load(page + 1, false)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, hasMore, loadingMore])

  useEffect(() => {
    const el = sentinelRef.current
    if (!el || !hasMore) return
    const obs = new IntersectionObserver(
      entries => { if (entries[0].isIntersecting) loadMore() },
      { threshold: 0.1 }
    )
    obs.observe(el)
    return () => obs.disconnect()
  }, [loadMore, hasMore])

  async function load(pageNum: number, reset: boolean) {
    if (reset) { setLoading(true); setPage(0) }
    else         setLoadingMore(true)
    try {
      const results = await listWines({
        query:     debouncedQ || undefined,
        tipo:      tipoFilter ?? undefined,
        favorito:  favoritoFilter || undefined,
        stock:     stockFilter   || undefined,
        anada_min: anadaActive ? anadaRange[0] : undefined,
        anada_max: anadaActive ? anadaRange[1] : undefined,
        page:      pageNum,
        sort:      sortBy,
      })
      setWines(prev => reset ? results : [...prev, ...results])
      setHasMore(results.length === PAGE_SIZE)
      if (!reset) setPage(pageNum)
    } catch { /* datos locales siguen visibles */ }
    finally {
      setLoading(false)
      setLoadingMore(false)
      setRefreshing(false)
    }
  }

  // Stats client-side
  const totalBotellas = useMemo(
    () => wines.reduce((s, w) => s + (w.num_botellas ?? 0), 0),
    [wines],
  )
  const totalBodegas = useMemo(
    () => new Set(wines.map(w => w.bodega).filter(Boolean)).size,
    [wines],
  )

  // Derivados
  const hasActiveFilters = !!(tipoFilter || favoritoFilter || stockFilter || anadaActive)
  const sortLabel = useMemo(
    () => {
      const SORT_LABELS: Record<SortKey, string> = {
        created_at_desc:   'Añadidos recientemente',
        nombre_asc:        'Nombre A–Z',
        bodega_asc:        'Bodega A–Z',
        anada_asc:         'Añada ↑ (más antiguo)',
        anada_desc:        'Añada ↓ (más reciente)',
        precio_desc:       'Precio ↓',
        num_botellas_desc: 'Stock ↓',
      }
      return SORT_LABELS[sortBy]
    },
    [sortBy],
  )
  const grouped = useMemo(
    () => groupBy ? groupWines(wines, groupBy) : null,
    [wines, groupBy],
  )

  function clearFilters() {
    setTipoFilter(null)
    setFavoritoFilter(false)
    setStockFilter(false)
    setAnadaActive(false)
    setAnadaRange([1900, CURRENT_YEAR])
    setSortBy('created_at_desc')
    setGroupBy(null)
  }

  function applySuggestion(s: Suggestion) {
    setQuery(s.value)
    setDebouncedQ(s.value)
    setSuggestions([])
  }

  function closeSearch() {
    setSearchOpen(false)
    setQuery('')
    setSuggestions([])
  }

  return {
    view, setView,
    searchOpen, setSearchOpen,
    query, setQuery,
    suggestions, applySuggestion, closeSearch, searchRef,
    tipoFilter, setTipoFilter,
    favoritoFilter, setFavoritoFilter,
    stockFilter, setStockFilter,
    filterPanelOpen, setFilterPanelOpen,
    anadaRange, setAnadaRange,
    anadaActive, setAnadaActive,
    groupBy, setGroupBy,
    sortBy, setSortBy,
    wines, page, hasMore, loading, loadingMore, refreshing, sentinelRef,
    fabHidden,
    total, totalBotellas, totalBodegas,
    hasActiveFilters, grouped, sortLabel,
    CURRENT_YEAR,
    clearFilters,
  }
}
