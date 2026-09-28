import { useEffect, useMemo, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import Layout from '../components/ui/Layout'
import Spinner from '../components/ui/Spinner'
import { useGlossary } from '../hooks/useGlossary'
import { useWineStore } from '../store/wineStore'
import { useToastStore } from '../store/toastStore'
import { theme } from '../constants/theme'
import type { GlossaryCategoria } from '../types'

const t = theme

const CATEGORIAS: { id: GlossaryCategoria | 'todas'; label: string }[] = [
  { id: 'todas',   label: 'Todas' },
  { id: 'vista',   label: 'Vista' },
  { id: 'nariz',   label: 'Nariz' },
  { id: 'boca',    label: 'Boca' },
  { id: 'general', label: 'General' },
]

/** Glosario personal: los términos que el tutor de cata ha ido enseñando. */
export default function Glosario() {
  const navigate = useNavigate()
  const { terms, loading, listTerms, deleteTerm } = useGlossary()
  const wines = useWineStore(st => st.wines)
  const toast = useToastStore()
  const [categoria, setCategoria] = useState<GlossaryCategoria | 'todas'>('todas')
  const [query,     setQuery]     = useState('')

  useEffect(() => {
    listTerms().catch(err => toast.show(err instanceof Error ? err.message : 'No se pudo cargar el glosario', 'error'))
  }, [listTerms]) // eslint-disable-line react-hooks/exhaustive-deps

  const wineName = useMemo(() => Object.fromEntries(wines.map(w => [w.id, w.nombre])), [wines])

  const visible = terms.filter(term => {
    if (categoria !== 'todas' && term.categoria !== categoria) return false
    const q = query.trim().toLowerCase()
    return !q || term.termino.toLowerCase().includes(q) || term.definicion.toLowerCase().includes(q)
  })

  async function handleDelete(id: string, termino: string) {
    if (!window.confirm(`¿Borrar «${termino}» de tu glosario?`)) return
    try {
      await deleteTerm(id)
    } catch (err) {
      toast.show(err instanceof Error ? err.message : 'No se pudo borrar', 'error')
    }
  }

  return (
    <Layout>
      <div className="px-5 pt-6 pb-4">
        <button
          onClick={() => navigate(-1)}
          className="mb-3"
          style={{ fontSize: t.font.sm, color: t.colors.gold, background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}
        >
          ← Volver
        </button>
        <p style={{ fontSize: t.font['2xs'], letterSpacing: '0.16em', textTransform: 'uppercase', color: t.colors.muted, marginBottom: 4 }}>
          Lo que has aprendido catando
        </p>
        <h1 className="text-editorial" style={{ fontSize: t.font['2xl'], fontWeight: 700, color: t.colors.cream, lineHeight: 1.1 }}>
          Mi glosario
          {terms.length > 0 && (
            <span className="ml-2" style={{ fontSize: t.font.sm, fontWeight: 500, color: t.colors.muted, verticalAlign: 'middle' }}>
              {terms.length}
            </span>
          )}
        </h1>
        <div style={{ height: 1, marginTop: 16, background: `linear-gradient(to right, ${t.colors.gold}40, transparent)` }} />
      </div>

      <div className="px-5 flex flex-col gap-3 pb-24">
        <input
          type="search"
          value={query}
          onChange={e => setQuery(e.target.value)}
          placeholder="Buscar término…"
          style={{
            background: t.colors.surface, border: `1px solid ${t.colors.borderSubtle}`, borderRadius: t.radius.md,
            color: t.colors.cream, fontSize: t.font.sm, padding: '8px 10px', outline: 'none', width: '100%',
          }}
        />

        <div className="flex gap-2 overflow-x-auto" style={{ scrollbarWidth: 'none' }}>
          {CATEGORIAS.map(c => {
            const active = categoria === c.id
            return (
              <button
                key={c.id}
                onClick={() => setCategoria(c.id)}
                className="px-3 py-1 rounded-full shrink-0"
                style={{
                  fontSize: t.font.sm, cursor: 'pointer',
                  background: active ? t.colors.gold : 'transparent',
                  color:      active ? t.colors.dark : t.colors.muted,
                  border:     `1px solid ${active ? t.colors.gold : t.colors.border}`,
                }}
              >
                {c.label}
              </button>
            )
          })}
        </div>

        {loading && <div className="flex justify-center py-8"><Spinner /></div>}

        {!loading && terms.length === 0 && (
          <p style={{ color: t.colors.muted, fontSize: t.font.sm, lineHeight: 1.6, paddingTop: 16 }}>
            Aún no has guardado ningún término. Al rellenar una página del cuaderno, pulsa «🎓 Revisar» en Vista, Nariz o Boca
            y guarda el vocabulario que te enseñe el sumiller.
          </p>
        )}

        {!loading && terms.length > 0 && visible.length === 0 && (
          <p style={{ color: t.colors.muted, fontSize: t.font.sm, paddingTop: 16 }}>Ningún término coincide con la búsqueda.</p>
        )}

        {visible.map(term => (
          <article
            key={term.id}
            className="rounded-xl p-3 flex flex-col gap-1"
            style={{ background: t.colors.surface, border: `1px solid ${t.colors.borderSubtle}` }}
          >
            <div className="flex items-start justify-between gap-2">
              <h2 style={{ fontSize: t.font.base, fontWeight: 700, color: t.colors.gold, fontFamily: t.font.serif }}>{term.termino}</h2>
              <button
                onClick={() => handleDelete(term.id, term.termino)}
                aria-label={`Borrar ${term.termino}`}
                style={{ background: 'none', border: 'none', color: t.colors.muted, cursor: 'pointer', fontSize: t.font.sm }}
              >
                ✕
              </button>
            </div>
            <p style={{ fontSize: t.font.sm, color: t.colors.text, lineHeight: 1.5 }}>{term.definicion}</p>
            <p style={{ fontSize: t.font.xs, color: t.colors.muted }}>
              {term.categoria !== 'general' && <span style={{ textTransform: 'capitalize' }}>{term.categoria}</span>}
              {term.wine_id && wineName[term.wine_id] && (
                <>
                  {term.categoria !== 'general' && ' · '}
                  aprendido con <Link to={`/bodega/${term.wine_id}`} style={{ color: t.colors.gold }}>{wineName[term.wine_id]}</Link>
                </>
              )}
            </p>
          </article>
        ))}
      </div>
    </Layout>
  )
}
