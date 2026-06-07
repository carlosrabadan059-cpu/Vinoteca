import { useEffect, useState, useCallback } from 'react'
import {
  BarChart, Bar, Cell, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid,
  LineChart, Line, Legend,
} from 'recharts'
import Layout from '../components/ui/Layout'
import Spinner from '../components/ui/Spinner'
import Button from '../components/ui/Button'
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

// ── Metric card ───────────────────────────────────────────────────────────────
function MetricCard({ icon, value, label }: { icon: string; value: string; label: string }) {
  return (
    <div
      className="flex flex-col items-center justify-center gap-1 rounded-xl p-4"
      style={{ background: theme.colors.surface, border: '1px solid #3A2A2E' }}
    >
      <span style={{ fontSize: '1.5rem' }}>{icon}</span>
      <span className="font-bold" style={{ fontSize: '1.75rem', color: theme.colors.gold }}>{value}</span>
      <span className="text-xs text-center" style={{ color: theme.colors.muted }}>{label}</span>
    </div>
  )
}

// ── Section wrapper ───────────────────────────────────────────────────────────
function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-3">
      <h2 className="font-semibold text-sm" style={{ color: theme.colors.muted }}>{title}</h2>
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

  const [insight,         setInsight]         = useState<string | null>(loadCachedInsight)
  const [insightLoading,  setInsightLoading]   = useState(false)
  const [insightError,    setInsightError]     = useState<string | null>(null)

  // Pull-to-refresh via pointer (mobile)
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
        totalVinos:       stats.totalVinos,
        totalCatas:       stats.totalCatas,
        puntuacionMedia:  stats.puntuacionMedia ?? 0,
        topRegiones:      stats.topRegiones,
        distribucionTipos: stats.distribucionTipos,
        anadas:           stats.distribucionAnadas,
        mejorVino:        stats.mejorVino,
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

  // Touch pull-to-refresh
  function onTouchStart(e: React.TouchEvent) { setPullStartY(e.touches[0].clientY) }
  function onTouchEnd(e: React.TouchEvent) {
    const delta = e.changedTouches[0].clientY - pullStartY
    if (delta > 80 && !loading) { setPulling(true); refresh().finally(() => setPulling(false)) }
  }

  const isEmpty = !loading && stats && stats.totalVinos === 0

  // ── Colores para el gráfico de tipos ──────────────────────────────────────
  const tipoColor: Record<string, string> = {
    Tinto:          theme.colors.primary,
    Blanco:         '#D4C87A',
    Rosado:         '#C97AA0',
    Espumoso:       '#7ABCC9',
    Dulce:          theme.colors.gold,
    'Sin clasificar': theme.colors.muted,
  }

  // ── Décadas: resaltar la mayor ────────────────────────────────────────────
  const maxDecada = stats
    ? Math.max(...(stats.distribucionAnadas.map(d => d.count)), 0)
    : 0

  return (
    <Layout>
      <div
        className="flex flex-col gap-6 px-4 pt-5 pb-24"
        onTouchStart={onTouchStart}
        onTouchEnd={onTouchEnd}
      >
        {/* Header */}
        <div className="flex items-center justify-between">
          <h1 className="font-bold" style={{ color: theme.colors.gold, fontSize: theme.font['2xl'] }}>
            Estadísticas
          </h1>
          {pulling && <Spinner size={18} />}
        </div>

        {/* Error */}
        {error && (
          <p className="text-sm" style={{ color: '#D32F2F' }}>{error}</p>
        )}

        {/* Estado vacío */}
        {isEmpty && (
          <div className="flex flex-col items-center gap-4 py-20 text-center">
            <span style={{ fontSize: '4rem' }}>📊</span>
            <p className="font-semibold" style={{ color: theme.colors.cream }}>Aún no hay datos</p>
            <p className="text-sm" style={{ color: theme.colors.muted }}>
              Añade vinos a tu bodega para ver tus estadísticas
            </p>
          </div>
        )}

        {/* ── 1. Resumen rápido ─────────────────────────────────────────────── */}
        {loading ? (
          <div className="grid grid-cols-2 gap-3">
            {Array.from({ length: 4 }).map((_, i) => <Skel key={i} h={100} />)}
          </div>
        ) : stats && !isEmpty ? (
          <div className="grid grid-cols-2 gap-3">
            <MetricCard icon="🍷" value={String(stats.totalVinos)} label="Vinos en bodega" />
            <MetricCard icon="📖" value={String(stats.totalCatas)} label="Catas registradas" />
            <MetricCard
              icon="⭐"
              value={stats.puntuacionMedia !== null ? stats.puntuacionMedia.toFixed(1) : '—'}
              label="Puntuación media"
            />
            <MetricCard
              icon="🏆"
              value={stats.mejorVino ? String(stats.mejorVino.puntuacion) : '—'}
              label={stats.mejorVino ? stats.mejorVino.nombre : 'Mejor puntuado'}
            />
          </div>
        ) : null}

        {/* ── 2 + 3: Tipos y Regiones en grid tablet ───────────────────────── */}
        {!isEmpty && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

            {/* 2. Distribución por tipo */}
            <Section title="DISTRIBUCIÓN POR TIPO">
              {loading ? <Skel h={180} /> : stats && (
                <div
                  className="rounded-xl p-4"
                  style={{ background: theme.colors.surface, border: '1px solid #3A2A2E' }}
                >
                  <ResponsiveContainer width="100%" height={160}>
                    <BarChart
                      data={stats.distribucionTipos}
                      layout="vertical"
                      margin={{ left: 8, right: 24, top: 4, bottom: 4 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" stroke="#3A2A2E" horizontal={false} />
                      <XAxis type="number" tick={{ fill: theme.colors.muted, fontSize: 11 }} axisLine={false} tickLine={false} />
                      <YAxis type="category" dataKey="tipo" tick={{ fill: theme.colors.cream, fontSize: 12 }} axisLine={false} tickLine={false} width={80} />
                      <Tooltip
                        contentStyle={{ background: theme.colors.surface, border: `1px solid ${theme.colors.gold}40`, borderRadius: 8 }}
                        labelStyle={{ color: theme.colors.cream }}
                        itemStyle={{ color: theme.colors.gold }}
                        cursor={{ fill: '#3A2A2E' }}
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

            {/* 3. Top 5 regiones */}
            <Section title="TOP 5 REGIONES">
              {loading ? <Skel h={180} /> : stats && (
                <div
                  className="rounded-xl p-4 flex flex-col gap-3"
                  style={{ background: theme.colors.surface, border: '1px solid #3A2A2E' }}
                >
                  {stats.topRegiones.length === 0 ? (
                    <p className="text-sm" style={{ color: theme.colors.muted }}>Sin datos de región</p>
                  ) : (
                    stats.topRegiones.map(({ region, count }) => {
                      const maxCount = stats.topRegiones[0].count
                      const pct = Math.round((count / maxCount) * 100)
                      return (
                        <div key={region} className="flex flex-col gap-1">
                          <div className="flex justify-between text-sm">
                            <span style={{ color: theme.colors.cream }}>{region}</span>
                            <span style={{ color: theme.colors.muted }}>{count}</span>
                          </div>
                          <div className="w-full rounded-full overflow-hidden" style={{ height: 6, background: '#3A2A2E' }}>
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

        {/* ── 4 + 5: Añadas y Evolución en grid tablet ─────────────────────── */}
        {!isEmpty && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

            {/* 4. Distribución por décadas */}
            <Section title="DISTRIBUCIÓN POR AÑADAS">
              {loading ? <Skel h={180} /> : stats && (
                <div
                  className="rounded-xl p-4"
                  style={{ background: theme.colors.surface, border: '1px solid #3A2A2E' }}
                >
                  <ResponsiveContainer width="100%" height={160}>
                    <BarChart
                      data={stats.distribucionAnadas}
                      margin={{ left: 0, right: 0, top: 4, bottom: 4 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" stroke="#3A2A2E" vertical={false} />
                      <XAxis dataKey="decada" tick={{ fill: theme.colors.muted, fontSize: 11 }} axisLine={false} tickLine={false} />
                      <YAxis allowDecimals={false} tick={{ fill: theme.colors.muted, fontSize: 11 }} axisLine={false} tickLine={false} />
                      <Tooltip
                        contentStyle={{ background: theme.colors.surface, border: `1px solid ${theme.colors.gold}40`, borderRadius: 8 }}
                        labelStyle={{ color: theme.colors.cream }}
                        itemStyle={{ color: theme.colors.gold }}
                        cursor={{ fill: '#3A2A2E' }}
                      />
                      <Bar
                        dataKey="count"
                        radius={[4, 4, 0, 0]}
                        stroke={theme.colors.gold}
                        strokeWidth={1}
                      >
                        {stats.distribucionAnadas.map((entry) => (
                          <Cell
                            key={entry.decada}
                            fill={entry.count === maxDecada ? theme.colors.gold : theme.colors.surface}
                          />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              )}
            </Section>

            {/* 5. Evolución de catas */}
            <Section title="EVOLUCIÓN DE CATAS (6 MESES)">
              {loading ? <Skel h={180} /> : stats && (
                <div
                  className="rounded-xl p-4"
                  style={{ background: theme.colors.surface, border: '1px solid #3A2A2E' }}
                >
                  {stats.totalCatas === 0 ? (
                    <p className="text-sm py-8 text-center" style={{ color: theme.colors.muted }}>
                      Aún no hay catas registradas
                    </p>
                  ) : (
                    <ResponsiveContainer width="100%" height={160}>
                      <LineChart data={stats.evolucionCatas} margin={{ left: 0, right: 16, top: 4, bottom: 4 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#3A2A2E" />
                        <XAxis dataKey="mes" tick={{ fill: theme.colors.muted, fontSize: 11 }} axisLine={false} tickLine={false} />
                        <YAxis yAxisId="left"  allowDecimals={false} tick={{ fill: theme.colors.gold,    fontSize: 11 }} axisLine={false} tickLine={false} />
                        <YAxis yAxisId="right" orientation="right"   tick={{ fill: theme.colors.primary, fontSize: 11 }} axisLine={false} tickLine={false} domain={[0, 100]} />
                        <Tooltip
                          contentStyle={{ background: theme.colors.surface, border: `1px solid ${theme.colors.gold}40`, borderRadius: 8 }}
                          labelStyle={{ color: theme.colors.cream }}
                        />
                        <Legend wrapperStyle={{ fontSize: 11, color: theme.colors.muted }} />
                        <Line
                          yAxisId="left"
                          type="monotone"
                          dataKey="cantidad"
                          name="Catas"
                          stroke={theme.colors.gold}
                          strokeWidth={2}
                          dot={{ fill: theme.colors.gold, r: 3 }}
                          activeDot={{ r: 5 }}
                        />
                        <Line
                          yAxisId="right"
                          type="monotone"
                          dataKey="mediaScore"
                          name="Puntuación media"
                          stroke={theme.colors.primary}
                          strokeWidth={2}
                          dot={{ fill: theme.colors.primary, r: 3 }}
                          connectNulls={false}
                          activeDot={{ r: 5 }}
                        />
                      </LineChart>
                    </ResponsiveContainer>
                  )}
                </div>
              )}
            </Section>
          </div>
        )}

        {/* ── 6. Insight IA ─────────────────────────────────────────────────── */}
        {!isEmpty && (
          <Section title="ANÁLISIS DE TU COLECCIÓN">
            <div
              className="rounded-xl p-4 flex flex-col gap-3"
              style={{ background: theme.colors.surface, border: `1px solid ${theme.colors.gold}40` }}
            >
              <div className="flex items-center gap-2">
                <span style={{ fontSize: '1.25rem' }}>🤖</span>
                <span className="font-semibold text-sm" style={{ color: theme.colors.cream }}>Sommelier IA</span>
              </div>

              {insightLoading ? (
                <div className="flex items-center gap-3 py-4">
                  <Spinner size={18} />
                  <p className="text-sm" style={{ color: theme.colors.muted }}>Analizando tu colección...</p>
                </div>
              ) : insight ? (
                <>
                  <p
                    className="text-sm leading-relaxed"
                    style={{ color: theme.colors.cream, animation: 'fadeIn 0.4s ease' }}
                  >
                    {insight}
                  </p>
                  <button
                    onClick={() => fetchInsight(true)}
                    className="text-xs self-end"
                    style={{ color: theme.colors.muted }}
                  >
                    Actualizar análisis
                  </button>
                </>
              ) : (
                <>
                  {insightError && (
                    <p className="text-xs" style={{ color: '#D32F2F' }}>{insightError}</p>
                  )}
                  <Button
                    onClick={() => fetchInsight(false)}
                    style={{ background: theme.colors.gold, color: theme.colors.dark }}
                    disabled={loading || !stats}
                  >
                    Analizar mi colección
                  </Button>
                </>
              )}
            </div>
          </Section>
        )}
      </div>
    </Layout>
  )
}
