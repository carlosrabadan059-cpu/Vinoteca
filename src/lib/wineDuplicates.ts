import { supabase } from './supabase'
import type { Wine } from '../types'

export function normalizeWineText(value: string | null | undefined): string {
  if (!value) return ''
  return value
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[.,\-_/]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

export async function generateWineUid(input: {
  nombre: string | null
  bodega: string | null
  anada: number | null
}): Promise<string> {
  const raw = [
    normalizeWineText(input.nombre),
    normalizeWineText(input.bodega),
    input.anada !== null ? String(input.anada) : 'unknown-year',
  ].join('|')

  const encoded = new TextEncoder().encode(raw)
  const hashBuffer = await crypto.subtle.digest('SHA-256', encoded)
  const hashArray = Array.from(new Uint8Array(hashBuffer))
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('')
}

export interface DuplicateResult {
  exactDuplicate: Wine | null
  similarWines: Wine[]
}

export async function findDuplicateWine(
  wine: {
    nombre: string | null
    bodega: string | null
    anada: number | null
  },
  userId: string
): Promise<DuplicateResult> {
  // Ruta rápida: buscar por wine_uid si podemos generarlo
  const uid = await generateWineUid(wine)

  const { data: uidMatches, error: uidError } = await supabase
    .from('wines')
    .select('*')
    .eq('user_id', userId)
    .eq('wine_uid', uid)

  if (!uidError && uidMatches && uidMatches.length > 0) {
    const exact = wine.anada !== null ? (uidMatches[0] as Wine) : null
    const similar = wine.anada === null ? (uidMatches as Wine[]) : []
    return { exactDuplicate: exact, similarWines: similar }
  }

  // Fallback: comparación normalizada para vinos sin wine_uid (registros antiguos)
  const { data, error } = await supabase
    .from('wines')
    .select('*')
    .eq('user_id', userId)
    .is('wine_uid', null)

  if (error || !data) return { exactDuplicate: null, similarWines: [] }

  const normNombre = normalizeWineText(wine.nombre)
  const normBodega = normalizeWineText(wine.bodega)

  const matches = (data as Wine[]).filter((w) => {
    return (
      normalizeWineText(w.nombre) === normNombre &&
      normalizeWineText(w.bodega) === normBodega
    )
  })

  if (matches.length === 0) return { exactDuplicate: null, similarWines: [] }

  if (wine.anada === null) {
    return { exactDuplicate: null, similarWines: matches }
  }

  const exact = matches.find((w) => w.anada === wine.anada) ?? null
  const similar = matches.filter((w) => w.anada !== wine.anada)

  return { exactDuplicate: exact, similarWines: similar }
}

// Backfill opcional: calcular wine_uid para vinos existentes sin él.
// Usar desde la consola del navegador o un script de migración cuando sea necesario:
// const wines = await supabase.from('wines').select('id,nombre,bodega,anada').is('wine_uid', null)
// for (const w of wines.data) {
//   const uid = await generateWineUid(w)
//   await supabase.from('wines').update({ wine_uid: uid }).eq('id', w.id)
// }
