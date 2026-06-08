import { useEffect, useState, useCallback } from 'react'
import {
  BarChart, Bar, Cell, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid,
  LineChart, Line, Legend,
} from 'recharts'
import Layout from '../components/ui/Layout'
import Spinner from '../components/ui/Spinner'
import { useStats } from '../hooks/useStats'
import { callStatsInsight } from '../lib/n8n'
import type { StatsPayload } from '../lib/n8n'
import { theme } from '../constants/theme'

// ── Skeleton ──────────────────────────────────────────────────────────────────
function Skel({ h = 120 }: { h?: number }) {
  return (
    <div
      className="w-full rounded-xl animate-pulse"
      style={{ height: h, background: theme.colors.surface }}
    />
  )
}

// ── Metric icons ──────────────────────────────────────────────────────────────
function IconWine() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={theme.colors.gold} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" style={{ opacity: 0.7 }}>
      <path d="M8 22h8M12 11v11M5 3h14l-2 7a5 5 0 0 1-10 0L5 3z"/>
    </svg>
  )
}
function IconBook() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={theme.colors.gold} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" style={{ opacity: 0.7 }}>
      <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"/><path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"/>
    </svg>
  )
}
function IconStar() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={theme.colors.gold} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" style={{ opacity: 0.7 }}>
      <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
    </svg>
  )
}
function IconTrophy() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={theme.colors.gold} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" style={{ opacity: 0.7 }}>
      <path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6"/><path d="M18 9h1.5a2.5 2.5 0 0 0 0-5H18"/><path d="M4 22h16"/><path d="M10 14.66V17c0 .55-.47.98-.97 1.21C7.85 18.75 7 20.24 7 22"/><path d="M14 14.66V17c0 .55.47.98.97 1.21C16.15 18.75 17 20.24 17 22"/><path d="M18 2H6v7a6 6 0 0 0 12 0V2z"/>
    </svg>
  )
}

// ── Metric card ───────────────────────────────────────────────────────────────
function MetricCard({
  icon,
  value,
  label,
}: {
  icon: React.ReactNode
  value: string
  label: string
}) {
  return (
    <div
      className="flex flex-col items-center justify-center gap-2 rounded-xl p-4"
      style={{ background: theme.colors.surface, border: `1px solid ${theme.colors.border}` }}
    >
      {icon}
      <span
        className="text-editorial font-bold"
        style={{ fontSize: '1.75rem', color: theme.colors.gold, lineHeight: 1 }}
      >
        {value}
      </span>
      <span
        className="text-center"
        style={{ fontSize: '0.65rem', letterSpacing: '0.08em', textTransform: 'uppercase', color: theme.colors.muted }}
      >
        {label}
      </span>
    </div>
  )
}

// ── Section wrapper ───────────────────────────────────────────────────────────
function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-3">
      <h2
        style={{
          fontSize: '0.65rem',
          letterSpacing: '0.14em',
          textTransform: 'uppercase',
          color: theme.colors.muted,
          fontWeight: 500,
        }}
      >
        {title}
      </h2>
      {children}
    </div>
  )
}

// ── Insight cache ─────────────────────────────────────────────────────────────
const INSIGHT_KEY = 'vinoteca-insight'
const INSIGHT_TTL = 24 * 60 * 60 * 1000

function loadCachedInsight(): string | null {
  try {
    const raw = localStorage.getItem(INSIGHT_KEY)
    if (!raw) return null
    const { text, ts } = JSON.parse(raw) as { text: string; ts: number }
    if (Date.now() - ts > INSIGHT_TTL) return null
    return text
  } catch {
    return null
  }
}

function saveInsight(text: string) {
  localStorage.setItem(INSIGHT_KEY, JSON.stringify({ text, ts: Date.now() }))
}

// ─────────────────────────────────────────────────────────────────────────────

export default function Stats() {
  const { stats, loading, error, refresh } = useStats()

  const [insight,        setInsight]        = useState<string | null>(loadCachedInsight)
  const [insightLoading, setInsightLoading] = useState(false)
  const [insightError,   setInsightError]   = useState<string | null>(null)

  const [pulling,    setPulling]    = useState(false)
  const [pullStartY, setPullStartY] = useState(0)

  useEffect(() => { refresh() }, [refresh])

  const fetchInsight = useCallback(async (force = false) => {
    if (!stats) return
    if (!force) {
      const cached = loadCachedInsight()
      if (cached) { setInsight(cached); return }
    }
    setInsightLoading(true)
    setInsightError(null)
    try {
      const payload: StatsPayload = {
        totalVinos:        stats.totalVinos,
        totalCatas:        stats.totalCatas,
        puntuacionMedia:   stats.puntuacionMedia ?? 0,
        topRegiones:       stats.topRegiones,
        distribucionTipos: stats.distribucionTipos,
        anadas:            stats.distribucionAnadas,
        mejorVino:         stats.mejorVino,
      }
      const { insight: text } = await callStatsInsight(payload)
      setInsight(text)
      saveInsight(text)
    } catch (e) {
      setInsightError(e instanceof Error ? e.message : 'Error al analizar')
    } finally {
      setInsightLoading(false)
    }
  }, [stats])

  function onTouchStart(e: React.TouchEvent) { setPullStartY(e.touches[0].clientY) }
  function onTouchEnd(e: React.TouchEvent) {
    const delta = e.changedTouches[0].clientY - pullStartY
    if (delta > 80 && !loading) { setPulling(true); refresh().finally(() => setPulling(false)) }
  }

  const isEmpty = !loading && stats && stats.totalVinos === 0

  const tipoColor: Record<string, string> = {
    Tinto:            theme.colors.primary,
    Blanco:           '#D4C87A',
    Rosado:           '#C97AA0',
    Espumoso:         '#7ABCC9',
    Dulce:            theme.colors.gold,
    'Sin clasificar': theme.colors.muted,
  }

  const maxDecada = stats
    ? Math.max(...stats.distribucionAnadas.map(d => d.count), 0)
    : 0

  return (
    <Layout>
      <div
        className="flex flex-col gap-6 px-5 pb-28"
        onTouchStart={onTouchStart}
        onTouchEnd={onTouchEnd}
      >
        {/* ── Header editorial ──────────────────────────────────── */}
        <div className="pt-6">
          <div className="flex items-start justify-between">
            <div>
              <p
                style={{
                  fontSize: '0.65rem',
                  letterSpacing: '0.16em',
                  textTransform: 'uppercase',
                  color: theme.colors.muted,
                  marginBottom: 4,
                }}
              >
                Análisis de bodega
              </p>
              <h1
                className="text-editorial"
                style={{ fontSize: theme.font['2xl'], fontWeight: 700, color: theme.colors.cream, lineHeight: 1.1 }}
              >
                Estadísticas
              </h1>
            </div>
            {pulling && <Spinner size={18} />}
          </div>
          <div
            style={{
              height: 1,
              marginTop: 16,
              background: `linear-gradient(to right, ${theme.colors.gold}40, transparent)`,
            }}
          />
        </div>

        {/* Error */}
        {error && (
          <p style={{ fontSize: theme.font.sm, color: '#D32F2F' }}>{error}</p>
        )}

        {/* ── Estado vacío ──────────────────────────────────────── */}
        {isEmpty && (
          <div className="flex flex-col items-center gap-5 py-16 text-center">
            <div className="relative flex items-center justify-center">
              <div
                className="absolute"
                style={{
                  width: 120,
                  height: 120,
                  borderRadius: '50%',
                  background: `radial-gradient(circle, ${theme.colors.gold}10 0%, transparent 70%)`,
                }}
              />
              {/* Bar chart SVG icon */}
              <svg
                width="52" height="52"
                viewBox="0 0 24 24"
                fill="none"
                stroke={theme.colors.gold}
                strokeWidth="1"
                strokeLinecap="round"
                strokeLinejoin="round"
                style={{ opacity: 0.5 }}
              >
                <line x1="18" y1="20" x2="18" y2="10"/>
                <line x1="12" y1="20" x2="12" y2="4"/>
                <line x1="6" y1="20" x2="6" y2="14"/>
                <line x1="2" y1="20" x2="22" y2="20"/>
              </svg>
            </div>
            <div>
              <p
                className="text-editorial font-semibold"
                style={{ fontSize: theme.font.lg, color: theme.colors.cream }}
              >
                Aún no hay datos
              </p>
              <p style={{ fontSize: theme.font.sm, color: theme.colors.muted, marginTop: 6 }}>
                Añade vinos a tu bodega para ver tus estadísticas
              </p>
            </div>
          </div>
        )}

        {/* ── 1. Resumen rápido ─────────────────────────────────── */}
        {loading ? (
          <div className="grid grid-cols-2 gap-3">
            {Array.from({ length: 4 }).map((_, i) => <Skel key={i} h={100} />)}
          </div>
        ) : stats && !isEmpty ? (
          <div className="grid grid-cols-2 gap-3">
            <MetricCard icon={<IconWine />}  value={String(stats.totalVinos)}  label="Vinos en bodega" />
            <MetricCard icon={<IconBook />}  value={String(stats.totalCatas)}  label="Catas registradas" />
            <MetricCard
              icon={<IconStar />}
              value={stats.puntuacionMedia !== null ? stats.puntuacionMedia.toFixed(1) : '—'}
              label="Puntuación media"
            />
            <MetricCard
              icon={<IconTrophy />}
              value={stats.mejorVino ? String(stats.mejorVino.puntuacion) : '—'}
              label={stats.mejorVino ? stats.mejorVino.nombre : 'Mejor puntuado'}
            />
          </div>
        ) : null}

        {/* ── 2 + 3: Tipos y Regiones ───────────────────────────── */}
        {!isEmpty && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

            <Section title="Distribución por tipo">
              {loading ? <Skel h={180} /> : stats && (
                <div
                  className="rounded-xl p-4"
                  style={{ background: theme.colors.surface, border: `1px solid ${theme.colors.border}` }}
                >
                  <ResponsiveContainer width="100%" height={160}>
                    <BarChart
                      data={stats.distribucionTipos}
                      layout="vertical"
                      margin={{ left: 8, right: 24, top: 4, bottom: 4 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" stroke={theme.colors.border} horizontal={false} />
                      <XAxis type="number" tick={{ fill: theme.colors.muted, fontSize: 11 }} axisLine={false} tickLine={false} />
                      <YAxis type="category" dataKey="tipo" tick={{ fill: theme.colors.cream, fontSize: 12 }} axisLine={false} tickLine={false} width={80} />
                      <Tooltip
                        contentStyle={{ background: theme.colors.surface, border: `1px solid ${theme.colors.gold}40`, borderRadius: 8 }}
                        labelStyle={{ color: theme.colors.cream }}
                        itemStyle={{ color: theme.colors.gold }}
                        cursor={{ fill: theme.colors.border }}
                      />
                      <Bar dataKey="count" radius={[0, 4, 4, 0]}>
                        {stats.distribucionTipos.map((entry) => (
                          <Cell key={entry.tipo} fill={tipoColor[entry.tipo] ?? theme.colors.primary} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              )}
            </Section>

            <Section title="Top 5 regiones">
              {loading ? <Skel h={180} /> : stats && (
                <div
                  className="rounded-xl p-4 flex flex-col gap-3"
                  style={{ background: theme.colors.surface, border: `1px solid ${theme.colors.border}` }}
                >
                  {stats.topRegiones.length === 0 ? (
                    <p style={{ fontSize: theme.font.sm, color: theme.colors.muted }}>Sin datos de región</p>
                  ) : (
                    stats.topRegiones.map(({ region, count }) => {
                      const maxCount = stats.topRegiones[0].count
                      const pct = Math.round((count / maxCount) * 100)
                      return (
                        <div key={region} className="flex flex-col gap-1">
                          <div className="flex justify-between" style={{ fontSize: theme.font.sm }}>
                            <span style={{ color: theme.colors.cream }}>{region}</span>
                            <span style={{ color: theme.colors.muted }}>{count}</span>
                          </div>
                          <div className="w-full rounded-full overflow-hidden" style={{ height: 4, background: theme.colors.border }}>
                            <div
                              className="h-full rounded-full"
                              style={{ width: `${pct}%`, background: theme.colors.gold, transition: 'width 0.6s ease' }}
                            />
                          </div>
                        </div>
                      )
                    })
                  )}
                </div>
              )}
            </Section>
          </div>
        )}

        {/* ── 4 + 5: Añadas y Evolución ─────────────────────────── */}
        {!isEmpty && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

            <Section title="Distribución por añadas">
              {loading ? <Skel h={180} /> : stats && (
                <div
                  className="rounded-xl p-4"
                  style={{ background: theme.colors.surface, border: `1px solid ${theme.colors.border}` }}
                >
                  <ResponsiveContainer width="100%" height={160}>
                    <BarChart
                      data={stats.distribucionAnadas}
                      margin={{ left: 0, right: 0, top: 4, bottom: 4 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" stroke={theme.colors.border} vertical={false} />
                      <XAxis dataKey="decada" tick={{ fill: theme.colors.muted, fontSize: 11 }} axisLine={false} tickLine={false} />
                      <YAxis allowDecimals={false} tick={{ fill: theme.colors.muted, fontSize: 11 }} axisLine={false} tickLine={false} />
                      <Tooltip
                        contentStyle={{ background: theme.colors.surface, border: `1px solid ${theme.colors.gold}40`, borderRadius: 8 }}
                        labelStyle={{ color: theme.colors.cream }}
                        itemStyle={{ color: theme.colors.gold }}
                        cursor={{ fill: theme.colors.border }}
                      />
                      <Bar dataKey="count" radius={[4, 4, 0, 0]} stroke={theme.colors.gold} strokeWidth={1}>
                        {stats.distribucionAnadas.map((entry) => (
                          <Cell
                            key={entry.decada}
                            fill={entry.count === maxDecada ? theme.colors.gold : theme.colors.surface2}
                          />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              )}
            </Section>

            <Section title="Evolución de catas (6 meses)">
              {loading ? <Skel h={180} /> : stats && (
                <div
                  className="rounded-xl p-4"
                  style={{ background: theme.colors.surface, border: `1px solid ${theme.colors.border}` }}
                >
                  {stats.totalCatas === 0 ? (
                    <p className="text-center py-8" style={{ fontSize: theme.font.sm, color: theme.colors.muted }}>
                      Aún no hay catas registradas
                    </p>
                  ) : (
                    <ResponsiveContainer width="100%" height={160}>
                      <LineChart data={stats.evolucionCatas} margin={{ left: 0, right: 16, top: 4, bottom: 4 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke={theme.colors.border} />
                        <XAxis dataKey="mes" tick={{ fill: theme.colors.muted, fontSize: 11 }} axisLine={false} tickLine={false} />
                        <YAxis yAxisId="left"  allowDecimals={false} tick={{ fill: theme.colors.gold,    fontSize: 11 }} axisLine={false} tickLine={false} />
                        <YAxis yAxisId="right" orientation="right"   tick={{ fill: theme.colors.primary, fontSize: 11 }} axisLine={false} tickLine={false} domain={[0, 100]} />
                        <Tooltip
                          contentStyle={{ background: theme.colors.surface, border: `1px solid ${theme.colors.gold}40`, borderRadius: 8 }}
                          labelStyle={{ color: theme.colors.cream }}
                        />
                        <Legend wrapperStyle={{ fontSize: 11, color: theme.colors.muted }} />
                        <Line yAxisId="left"  type="monotone" dataKey="cantidad"    name="Catas"             stroke={theme.colors.gold}    strokeWidth={2} dot={{ fill: theme.colors.gold,    r: 3 }} activeDot={{ r: 5 }} />
                        <Line yAxisId="right" type="monotone" dataKey="mediaScore"  name="Puntuación media"  stroke={theme.colors.primary}  strokeWidth={2} dot={{ fill: theme.colors.primary,  r: 3 }} connectNulls={false} activeDot={{ r: 5 }} />
                      </LineChart>
                    </ResponsiveContainer>
                  )}
                </div>
              )}
            </Section>
          </div>
        )}

        {/* ── 6. Insight IA ─────────────────────────────────────── */}
        {!isEmpty && (
          <Section title="Análisis de tu colección">
            <div
              className="rounded-xl p-4 flex flex-col gap-3"
              style={{ background: theme.colors.surface, border: `1px solid ${theme.colors.gold}40` }}
            >
              <div className="flex items-center gap-2">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={theme.colors.gold} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M12 2a10 10 0 1 0 10 10A10 10 0 0 0 12 2z"/><path d="M12 8v4l3 3"/>
                </svg>
                <span
                  style={{ fontSize: theme.font.sm, fontWeight: 600, color: theme.colors.cream }}
                >
                  Sommelier IA
                </span>
              </div>

              {insightLoading ? (
                <div className="flex items-center gap-3 py-4">
                  <Spinner size={18} />
                  <p style={{ fontSize: theme.font.sm, color: theme.colors.muted }}>Analizando tu colección…</p>
                </div>
              ) : insight ? (
                <>
                  <p
                    style={{ fontSize: theme.font.sm, color: theme.colors.cream, lineHeight: 1.6 }}
                  >
                    {insight}
                  </p>
                  <button
                    onClick={() => fetchInsight(true)}
                    style={{ fontSize: '0.7rem', color: theme.colors.muted, alignSelf: 'flex-end' }}
                  >
                    Actualizar análisis
                  </button>
                </>
              ) : (
                <>
                  {insightError && (
                    <p style={{ fontSize: '0.75rem', color: '#D32F2F' }}>{insightError}</p>
                  )}
                  <button
                    onClick={() => fetchInsight(false)}
                    disabled={loading || !stats}
                    className="w-full py-3 rounded-xl font-semibold disabled:opacity-50"
                    style={{
                      background: theme.colors.gold,
                      color: theme.colors.dark,
                      fontSize: theme.font.base,
                    }}
                  >
                    Analizar mi colección
                  </button>
                </>
              )}
            </div>
          </Section>
        )}
      </div>
    </Layout>
  )
}
