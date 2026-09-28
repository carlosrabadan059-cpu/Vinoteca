import { useState, useEffect, useMemo } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { useTastings } from './useTastings'
import { supabase } from '../lib/supabase'
import { useWineStore } from '../store/wineStore'
import { applyFilter } from '../lib/catasHelpers'
import type { FilterKey } from '../lib/catasHelpers'
import { applyJournalFilters, journalFacets, EMPTY_JOURNAL_FILTERS } from '../lib/cuadernoHelpers'
import type { JournalFilters } from '../lib/cuadernoHelpers'
import type { Wine } from '../types'

export interface CatasState {
  // Navegación
  navigate:      ReturnType<typeof useNavigate>
  wineIdFilter:  string | null

  // Filtro temporal/puntuación
  filter:        FilterKey
  setFilter:     (f: FilterKey) => void

  // Índice del cuaderno (tipo, región, uva, búsqueda)
  journal:       JournalFilters
  setJournal:    (f: JournalFilters) => void
  facets:        { regiones: string[]; uvas: string[] }

  // Datos
  loading:       boolean
  wineMap:       Record<string, Wine>
  filtered:      ReturnType<typeof useTastings>['tastings']
  visible:       ReturnType<typeof useTastings>['tastings']

  // Derivados contextuales
  wineTitle:     string | null
  newCataHref:   string
}

export function useCatasState(): CatasState {
  const navigate = useNavigate()
  const [params] = useSearchParams()
  const wineIdFilter = params.get('wineId') ?? null

  const [filter,  setFilter]  = useState<FilterKey>('all')
  const [journal, setJournal] = useState<JournalFilters>(EMPTY_JOURNAL_FILTERS)
  // Vinos pedidos a Supabase; se combinan con los del store local al derivar
  const [fetched, setFetched] = useState<Record<string, Wine>>({})
  const storeWines = useWineStore(st => st.wines)

  const { tastings, loading, listTastings } = useTastings()

  useEffect(() => {
    listTastings().catch(() => null)
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  const wineMap = useMemo<Record<string, Wine>>(
    () => ({ ...Object.fromEntries(storeWines.map(w => [w.id, w])), ...fetched }),
    [storeWines, fetched],
  )

  // Una sola consulta para los wine_id que no estén en el store (antes, un getWine por id)
  useEffect(() => {
    const toFetch = [...new Set(tastings.map(t => t.wine_id))].filter(id => !wineMap[id])
    if (!toFetch.length || !navigator.onLine) return
    supabase.from('wines').select('*').in('id', toFetch).then(({ data }) => {
      if (data?.length) setFetched(prev => ({ ...prev, ...Object.fromEntries((data as Wine[]).map(w => [w.id, w])) }))
    })
  }, [tastings]) // eslint-disable-line react-hooks/exhaustive-deps

  const filtered = wineIdFilter
    ? tastings.filter(t => t.wine_id === wineIdFilter)
    : tastings

  const facets  = useMemo(() => journalFacets(filtered, wineMap), [filtered, wineMap])
  const visible = applyFilter(applyJournalFilters(filtered, wineMap, journal), filter)
  const wineTitle  = wineIdFilter ? (wineMap[wineIdFilter]?.nombre ?? null) : null
  const newCataHref = wineIdFilter ? `/catas/nueva?wineId=${wineIdFilter}` : '/catas/nueva'

  return {
    navigate,
    wineIdFilter,
    filter,
    setFilter,
    journal,
    setJournal,
    facets,
    loading,
    wineMap,
    filtered,
    visible,
    wineTitle,
    newCataHref,
  }
}
