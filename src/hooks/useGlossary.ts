import { useState, useCallback } from 'react'
import { supabase } from '../lib/supabase'
import { useAuthStore } from '../store/authStore'
import type { GlossaryCategoria, GlossaryTerm } from '../types'

/**
 * Glosario personal del tutor de cata. Solo online: son apuntes de aprendizaje,
 * no merecen pasar por la cola offline.
 */
export function useGlossary() {
  const { user } = useAuthStore()
  const [terms,   setTerms]   = useState<GlossaryTerm[]>([])
  const [loading, setLoading] = useState(false)

  const listTerms = useCallback(async () => {
    if (!user) return
    setLoading(true)
    try {
      const { data, error } = await supabase
        .from('glossary_terms')
        .select('id, user_id, termino, definicion, categoria, wine_id, created_at')
        .eq('user_id', user.id)
        .order('termino', { ascending: true })
      if (error) throw error
      setTerms((data ?? []) as GlossaryTerm[])
    } finally {
      setLoading(false)
    }
  }, [user])

  /** Guarda términos; los que ya estaban (sin distinguir mayúsculas) se ignoran. */
  async function saveTerms(
    items: { termino: string; definicion: string }[],
    ctx: { categoria: GlossaryCategoria; wine_id: string | null },
  ): Promise<void> {
    if (!user || !items.length) return
    const rows = items.map(i => ({
      user_id:    user.id,
      termino:    i.termino.trim(),
      definicion: i.definicion.trim(),
      categoria:  ctx.categoria,
      wine_id:    ctx.wine_id,
    }))
    const { error } = await supabase
      .from('glossary_terms')
      .upsert(rows, { onConflict: 'user_id,termino_key', ignoreDuplicates: true })
    if (error) throw error
  }

  async function deleteTerm(id: string): Promise<void> {
    const { error } = await supabase.from('glossary_terms').delete().eq('id', id)
    if (error) throw error
    setTerms(prev => prev.filter(t => t.id !== id))
  }

  return { terms, loading, listTerms, saveTerms, deleteTerm }
}
