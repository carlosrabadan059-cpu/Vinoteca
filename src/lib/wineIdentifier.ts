import { supabase } from './supabase'
import { generateWineUid } from './wineDuplicates'
import type { Wine } from '../types'

export type IdentifyResult =
  | { found: true;  wine: Wine }
  | { found: false }

// ── Buscar por wine_uid ───────────────────────────────────────────────────────

export async function identifyByWineUid(
  input: { nombre: string | null; bodega: string | null; anada: number | null },
  userId: string
): Promise<IdentifyResult> {
  const uid = await generateWineUid(input)

  const { data, error } = await supabase
    .from('wines')
    .select('*')
    .eq('user_id', userId)
    .eq('wine_uid', uid)
    .limit(1)
    .single()

  if (error || !data) return { found: false }
  return { found: true, wine: data as Wine }
}
