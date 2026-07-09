import { useState, useEffect } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { useTastings } from './useTastings'
import { useWines } from './useWines'
import { applyFilter } from '../lib/catasHelpers'
import type { FilterKey } from '../lib/catasHelpers'
import type { Wine } from '../types'

export interface CatasState {
  // Navegación
  navigate:      ReturnType<typeof useNavigate>
  wineIdFilter:  string | null

  // Filtro activo
  filter:        FilterKey
  setFilter:     (f: FilterKey) => void

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
  const [wineMap, setWineMap] = useState<Record<string, Wine>>({})

  const { tastings, loading, listTastings } = useTastings()
  const { getWine } = useWines()

  useEffect(() => {
    listTastings().catch(() => null)
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  // Carga incremental del wineMap solo para los wine_id que faltan
  useEffect(() => {
    const missing = tastings.filter(t => !wineMap[t.wine_id])
    if (!missing.length) return
    const uniqueIds = [...new Set(missing.map(t => t.wine_id))]
    uniqueIds.forEach(id => {
      getWine(id).then(w => {
        if (w) setWineMap(prev => ({ ...prev, [id]: w }))
      })
    })
  }, [tastings]) // eslint-disable-line react-hooks/exhaustive-deps

  const filtered = wineIdFilter
    ? tastings.filter(t => t.wine_id === wineIdFilter)
    : tastings

  const visible    = applyFilter(filtered, filter)
  const wineTitle  = wineIdFilter ? (wineMap[wineIdFilter]?.nombre ?? null) : null
  const newCataHref = wineIdFilter ? `/catas/nueva?wineId=${wineIdFilter}` : '/catas/nueva'

  return {
    navigate,
    wineIdFilter,
    filter,
    setFilter,
    loading,
    wineMap,
    filtered,
    visible,
    wineTitle,
    newCataHref,
  }
}
