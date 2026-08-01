# Diseño — Fase 9: Estadísticas (cierre)

## Contexto

Fase 9 del roadmap (`docs/roadmap/fase-09-estadisticas.md`) lleva marcada ⬜ Pendiente, pero la base técnica ya existe y está bastante avanzada: `src/hooks/useStats.ts` calcula métricas básicas (total vinos, total catas, puntuación media, mejor vino, distribución por tipo, top 5 regiones, distribución por añadas/décadas, evolución de catas 6 meses), `src/pages/Stats.tsx` las renderiza con Recharts siguiendo el sistema editorial de la app, y `callStatsInsight` en `src/lib/n8n.ts` ya conecta con el endpoint de IA (`POST /webhook/vinoteca/stats/insight`), con caché de 24h en `localStorage`.

Lo que falta para cerrar formalmente la fase, según la sección "Pendiente" del propio roadmap:

1. **Incorporar datos de colección personal** (`precio`, `num_botellas`) — hoy no se usan en absoluto en las estadísticas.
2. **Rediseño visual** — el actual ya sigue el theme, pero todas las secciones pesan igual visualmente; no hay jerarquía que destaque lo más relevante.

## Alcance de esta fase

### Datos nuevos (en `useStats.ts` / helpers)

- **`valorEstimado`**: suma de `precio × num_botellas` de **todos** los vinos alguna vez registrados (incluidos los marcados `consumido = true`) — decisión del usuario: representa el valor histórico total invertido en la colección, no solo el stock actual. Vinos sin `precio` (null) se excluyen de la suma pero no rompen el cálculo.
- **`totalBotellas`**: suma de `num_botellas` de todos los vinos (misma filosofía "histórico total" que `valorEstimado`, por consistencia).
- **`distribucionUva`**: agrupación por el campo `uva` tal cual está guardado (texto libre, sin parsear mezclas/blends — mismo criterio simple que ya usa `topRegiones` para `region`), top 5 por conteo. Vinos sin `uva` se agrupan bajo la etiqueta `"Sin uva especificada"` (mismo patrón que `topRegiones` usa `"Sin región"`) y compiten por el top 5 igual que cualquier otro valor.
- **`distribucionBodega`**: agrupación por el campo `bodega`, mismo patrón (etiqueta `"Sin bodega"` para nulos), top 5.

Nota explícita: no se parsean variedades múltiples en un mismo campo `uva` (ej. "Tempranillo, Merlot" cuenta como una única etiqueta, no se reparte entre ambas). Es una simplificación deliberada acorde a YAGNI; si en el futuro se quiere desglosar blends, es una mejora aislada.

### Arquitectura

Se sigue el mismo patrón ya establecido en Fase 8 para Catas (`src/lib/catasHelpers.ts` + `src/hooks/useCatasState.ts`): extraer los cálculos a funciones puras en un nuevo `src/lib/statsHelpers.ts`, y que `useStats.ts` las orqueste. Funciones a extraer (incluyendo las que ya existen en el hook, para que todo el cálculo quede en un solo sitio testeable):

- `classifyWine`, `decadeOf`, `buildEvolucion` (ya existen en `useStats.ts`, se mueven tal cual)
- `computeValorEstimado(wines)`
- `computeTotalBotellas(wines)`
- `computeDistribucionPorCampo(wines, campo: 'uva' | 'bodega', top = 5)` — una función genérica reutilizable para uva/bodega/región (siguiendo el mismo patrón que ya usa `topRegiones`), en vez de triplicar la lógica de agrupar+ordenar+cortar.

`useStats.ts` pasa de contener toda la lógica a ser un orquestador fino: hace el fetch de `wines`/`tastings` y llama a las funciones de `statsHelpers.ts` para construir el objeto `StatsData` (ampliado con los 4 campos nuevos).

### Rediseño visual (`Stats.tsx`)

Aprobado por el usuario a partir del mockup: `https://claude.ai/code/artifact/9f1931b7-9204-43fd-8d70-286a05bbbfdd` (mockup con datos de ejemplo, HTML/CSS estático — la implementación real usa Recharts como hoy, no se sustituye la librería).

Estructura nueva de `Stats.tsx`, de arriba a abajo:

1. **Hero de valor**: reemplaza el grid 2×2 de métricas como elemento principal. Número protagonista en `theme.typography.heroTitle`/serif grande mostrando `valorEstimado` formateado con `Intl.NumberFormat('es-ES', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 })`, con subtítulo mostrando `totalBotellas` ("148 botellas registradas..."). Fondo con el mismo tratamiento de card oscura con acento sutil que ya usa el resto de la app (sin gradientes nuevos fuera del sistema — reutilizar `theme.gradients`/`theme.colors` existentes). Si `valorEstimado` es 0 (ningún vino tiene `precio`), el hero muestra un estado degradado simple ("Añade precios a tus vinos para ver el valor de tu bodega") en vez de "0 €".
2. **Fila de métricas secundarias**: los 4 `MetricCard` actuales (vinos distintos, catas, puntuación media, mejor vino) se mantienen pero más compactos, en una fila bajo el hero en vez de ser el elemento principal.
3. **Insight IA**: se sube de posición (era la última sección, pasa a ir justo debajo de las métricas secundarias). El componente y su lógica (`fetchInsight`, caché en `localStorage`, botón "Analizar"/"Actualizar análisis") no cambian, solo su posición en el layout.
4. **Grupo "Tu colección"**: encabezado de grupo (`theme.typography` — estilo itálico serif como en el mockup, o el `sectionTitle`/`groupHeader` ya definidos si encajan mejor) agrupando: distribución por tipo (ya existe, se mantiene con Recharts), **top uvas** (nuevo, mismo patrón visual que el "Top 5 regiones" actual — barras horizontales con porcentaje), **top bodegas** (nuevo, mismo patrón), distribución por añadas (ya existe, se mantiene).
5. **Grupo "Tu actividad"**: encabezado de grupo agrupando evolución de catas (ya existe, se mantiene con Recharts).

`topRegiones` se mantiene donde está hoy (dentro de "Tu colección", junto a tipo/uva/bodega) — no se retira, solo se reordena junto a los nuevos bloques de uva/bodega ya que son del mismo tipo de dato.

No se necesita ninguna librería nueva: Recharts ya cubre las gráficas de barras/líneas; las listas de top uva/bodega usan el mismo patrón de barras de progreso HTML/CSS que ya usa `topRegiones` (sin SVG a medida).

### Payload del insight IA (`StatsPayload`)

Se añaden `valorEstimado` y `totalBotellas` al payload que se envía a `callStatsInsight`, para que el análisis de la IA pueda mencionar el valor de la colección si es relevante. El endpoint de n8n es externo y no se modifica en esta fase — los campos nuevos se envían igualmente; si el prompt de n8n no los usa, no rompe nada (JSON adicional ignorado). No se toca ningún workflow n8n en este trabajo.

## Fuera de alcance

- Desglose de variedades en campos `uva` con múltiples uvas (blends).
- Modificar el workflow n8n de `stats/insight` para que use explícitamente los campos nuevos del payload.
- Cambios en el modelo de datos de Supabase (todo se calcula client-side a partir de `wines`/`tastings`, sin migraciones).
- Tema claro (sigue como placeholder documentado en `docs/gestion-usuarios-cuentas.md`).

## Verificación

- `npx tsc --noEmit`
- Prueba manual en `npm run dev`: `/stats` con una cuenta que tenga vinos con `precio`/`num_botellas`/`uva`/`bodega` variados, y con una cuenta vacía (verificar que el estado vacío existente sigue funcionando y que `valorEstimado`/`totalBotellas` no rompen con 0 vinos).
- Confirmar que el insight IA sigue funcionando (llamada a n8n) con el payload ampliado.
