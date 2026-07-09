# Spec de diseño — Fase 7: Gestión de Bodega

**Fecha:** 2026-07-09  
**Estado:** Congelado ✓  
**Prototipo:** https://claude.ai/code/artifact/2eae07a4-9e59-44c2-a564-ba62526fa192 (v4)  
**Archivos afectados:** `src/pages/Bodega.tsx`, `src/components/wine/WineCard.tsx`

---

## Resumen

Rediseño completo de la pantalla de bodega. Reemplaza el layout de lista vertical (un card por fila) por un sistema dual grid/lista con búsqueda instantánea con autocomplete, filtros avanzados, agrupación opcional, y estadísticas de colección en el header.

---

## Tokens de color (sin cambios)

```
--bg:        #0D0608
--surface:   #1A0F11
--surface2:  #211419
--border:    #2E1E22
--primary:   #722F37
--primary-border: #8B3A44   ← nuevo: borde chip activo (+10% luminosidad)
--gold:      #C9A84C
--cream:     #F5F0E8
--muted:     #7A6266
--muted2:    #4A3438
--muted3:    #5A4448
```

---

## Estado global ampliado

El componente `Bodega` gestiona el siguiente estado local (sin Zustand salvo para `total`):

| Estado | Tipo | Descripción |
|---|---|---|
| `wines` | `Wine[]` | Lista activa tras filtros |
| `view` | `'grid' \| 'list'` | Vista seleccionada (persiste en localStorage) |
| `searchOpen` | `boolean` | Panel de búsqueda visible |
| `query` | `string` | Texto del input |
| `debouncedQ` | `string` | Texto con 300ms debounce |
| `suggestions` | `Suggestion[]` | Resultados de autocomplete |
| `tipoFilter` | `string \| null` | Chip de tipo activo |
| `favoritoFilter` | `boolean` | Chip favoritos activo |
| `stockFilter` | `boolean` | Chip "En stock" activo |
| `groupBy` | `GroupKey \| null` | Agrupación activa |
| `sortBy` | `SortKey` | Criterio de ordenación |
| `filterPanelOpen` | `boolean` | Panel filtros+orden visible |
| `anadaRange` | `[number, number]` | Rango de años para filtro añada |
| `page` | `number` | Página actual (infinite scroll) |
| `hasMore` | `boolean` | Si quedan más páginas |
| `loading` | `boolean` | Carga inicial |
| `loadingMore` | `boolean` | Carga de página adicional |
| `refreshing` | `boolean` | Pull-to-refresh activo |
| `fabHidden` | `boolean` | FAB oculto durante scroll |

```typescript
type SortKey = 'created_at_desc' | 'nombre_asc' | 'bodega_asc' | 'anada_asc' | 'anada_desc' | 'precio_desc' | 'num_botellas_desc'
type GroupKey = 'bodega' | 'region' | 'denominacion' | 'anada' | 'tipo' | 'ubicacion'

interface Suggestion {
  emoji: '🍷' | '🏛️' | '📍' | '🏷️'
  type: 'VINO' | 'BODEGA' | 'REGIÓN' | 'D.O.'
  label: string
  field: 'nombre' | 'bodega' | 'region' | 'denominacion'
  value: string
}
```

---

## Estructura de pantallas

### 1. Header sticky

Siempre visible. Contiene:

**Fila 1 — Título + acciones**
- Título: `Mi Bodega Personal` (Georgia serif, "Personal" en itálica gold)
- Icono búsqueda (lupa) — abre panel búsqueda
- Icono filtros (embudo) — abre panel filtros+orden; si hay filtros activos, puntito rojo sobre el icono

**Fila 2 — Collection summary** (solo cuando `!searchOpen`)  
Tres stats en columna: número protagonista (Georgia 1.6rem, weight 300) + etiqueta pequeña debajo (0.55rem uppercase). Los tres stats son: total vinos, total botellas, total bodegas distintas. Calculados desde `wines` en client-side. Animación `countUp` al montar.

**Fila 3 — Chips de filtro rápido** (solo cuando `!searchOpen`)  
`Todos | Tinto | Blanco | Rosado | Espumoso | Dulce | ─ | ⭐ Favoritos | En stock`  
Scroll horizontal. Chip activo: `background: var(--primary)`, `border-color: var(--primary-border)`. Chip favoritos activo: `background: rgba(201,168,76,0.15)`, `border-color: rgba(201,168,76,0.7)`, `color: var(--gold)`.

**Fila 4 — Sort + view toggle** (solo cuando `!searchOpen && wines.length > 0`)  
- Botón de ordenación: etiqueta del sort activo + chevron → abre panel filtros  
- Toggle grid/lista (dos botones, el activo con `background: var(--surface2)`)

### 2. Panel de búsqueda

Se activa al pulsar la lupa. El header muestra solo título + X para cerrar.

**Modo vacío** (query === ''):
- Input con placeholder `"Buscar vino, bodega, DO o región…"`
- Sección "Búsquedas recientes" (máx 5, guardadas en localStorage)
- Sección "Bodegas frecuentes" (top 5 bodegas por `num_botellas`)
- Sección "Añadidos recientemente" (3 últimos wines por `created_at`)
- Sección "Últimos vinos vistos" (3 wines visitados, guardados en localStorage)

**Modo activo** (query.length ≥ 2):
- Input con botón ✕ para limpiar
- Dropdown de sugerencias pegado al input (border-radius 0 0 14px 14px)
  - Máx 4 resultados: 🍷 VINO, 🏛️ BODEGA, 📍 REGIÓN, 🏷️ D.O.
  - Match substring resaltado en `var(--gold)` + weight 600
  - Al pulsar: fija el filtro correspondiente y cierra el dropdown
- Lista de resultados debajo del dropdown

### 3. Panel filtros + orden (bottom sheet)

Animación `slideUp`. Contiene:

- **Colección:** chips ⭐ Favoritos / En stock / Sin stock / Consumidos
- **Tipo:** chips Todos / Tinto / Blanco / Rosado / Espumoso / Dulce
- **Añada:** dos inputs numéricos "Desde" / "Hasta" (min 1900, max año actual)
- **Agrupar por:** chips Ninguno / Bodega / D.O. + Región / Añada / Tipo / Ubicación
- **Ordenar por:** lista de opciones con check en la activa
- Botón primario "Ver resultados (N)"
- Botón secundario "Restablecer filtros"

Títulos de sección: `font-size: 0.78rem`, uppercase, weight 800, `var(--cream)`.

### 4. Vista Grid

`display: grid; grid-template-columns: 1fr 1fr; gap: 12px`

**WineCard Grid** (`WineCardGrid`):
- Imagen: 158px, `object-fit: contain`, `filter: brightness(1.08) contrast(1.05)`
- Overlay gradiente negro bottom→top
- Badge tipo: top-left (0.55rem, gold, borde gold)
- Badge stock: bottom-right pequeño (`×N`), `.low` si N≤2, `.out` tachado si N=0
- Badge favorito: top-right (estrella gold) — solo si `wine.favorito === true`
- Cuerpo: nombre (Georgia 0.92rem), bodega (gold 0.7rem), fila meta (región izq, añada der)
- Animación entrada: `cardIn` (fade + translateY 10px), staggered por índice

### 5. Vista Lista

`display: flex; flex-direction: column; gap: 8px`

**WineCard Lista** (`WineCardList`):
- Thumbnail: 52×68px, `border-radius: 6px`, misma imagen con filter
- Info: nombre (Georgia 0.97rem bold), bodega (gold), fila sub con chip tipo (var(--muted3)) + región (var(--muted3))
- Derecha: añada (Georgia 1.1rem weight 300 muted), stock badge, estrella si favorito
- Hint de swipe arriba de la lista: "Desliza para acciones rápidas →" (muted2, itálica)

### 6. Agrupación

Cuando `groupBy !== null`, los wines se agrupan antes de renderizar.

**Group header:**
```
┌─────────────────────────────────────────┐
│ BODEGA MUGA ─────────────────── 3 refs  │
└─────────────────────────────────────────┘
```
- Label: 0.72rem, weight 800, uppercase, `var(--cream)`
- Línea: `flex:1; height:1px; background: rgba(46,30,34,0.6)`
- Count: 0.65rem, muted, pill `var(--surface2)`
- Margen: `36px 0 14px` (primer grupo: `4px 0 14px`)

### 7. Estado vacío

Dos variantes:

**Con filtros activos:**
- Icono copa (48px, var(--border))
- Título: "Sin resultados"
- Subtítulo: "No hemos encontrado ningún vino con esos filtros."
- Botón: "Limpiar filtros" (transparent, border var(--border))

**Sin filtros (bodega vacía):**
- Icono copa (48px)
- Título: "Tu bodega está vacía"
- Subtítulo: "Empieza escaneando la etiqueta de tu primer vino"
- Botón primario: "Escanear vino" → `/scan`
- Link secundario: "o añadir un vino manualmente" → `/anadir`

### 8. Skeleton de carga

Grid 2 columnas. Cada card: imagen 158px + 3 líneas de texto.  
Animación `shimmer`: `background: linear-gradient(90deg, var(--border) 25%, #3A2428 50%, var(--border) 75%); background-size: 200%; animation: shimmer 2.2s ease-in-out infinite`.  
Stats del header también en skeleton mientras carga.

### 9. FAB

- Posición: `fixed bottom-[76px] right-[16px]` (sobre la bottom nav)
- Icono cámara → navega a `/scan`
- Auto-hide: se oculta al scroll (`transform: translateY(20px) scale(0.85); opacity:0`), reaparece 600ms después de detenerse

---

## Lógica de datos

### `listWines` ampliado

La query a Supabase debe soportar los nuevos filtros. Extensión de `WineFilters`:

```typescript
interface WineFilters {
  query?:      string
  tipo?:       string
  favorito?:   boolean
  consumido?:  boolean
  stock?:      boolean       // num_botellas > 0
  anada_min?:  number
  anada_max?:  number
  page?:       number
  sort?:       SortKey
}
```

Filtro de stock se implementa client-side si el dataset es pequeño (< 200 vinos), o con `.gt('num_botellas', 0)` en Supabase si es grande.

### Autocomplete de sugerencias

Se ejecuta en client-side sobre los wines ya cargados en memoria (sin nueva petición a Supabase):

```typescript
function getSuggestions(query: string, wines: Wine[]): Suggestion[] {
  const q = query.toLowerCase().trim()
  const names    = unique(wines.map(w => w.nombre)).filter(n => n.toLowerCase().includes(q)).slice(0,2)
  const bodegas  = unique(wines.map(w => w.bodega).filter(Boolean)).filter(b => b!.toLowerCase().includes(q)).slice(0,1)
  const regions  = unique(wines.map(w => w.region).filter(Boolean)).filter(r => r!.toLowerCase().includes(q)).slice(0,1)
  const dos      = unique(wines.map(w => w.denominacion).filter(Boolean)).filter(d => d!.toLowerCase().includes(q)).slice(0,1)
  // max 4 resultados en total, orden: VINO, BODEGA, REGIÓN, D.O.
}
```

### Estadísticas del header

Calculadas en client desde el store o desde la respuesta paginada:
- **Vinos**: `total` del store (count de Supabase con filtro activo)
- **Botellas**: `wines.reduce((s, w) => s + w.num_botellas, 0)` — estimación local
- **Bodegas**: `new Set(wines.map(w => w.bodega).filter(Boolean)).size` — estimación local

### Persistencia de vista

```typescript
const savedView = localStorage.getItem('bodega_view') as 'grid' | 'list' | null
const [view, setView] = useState<'grid' | 'list'>(savedView ?? 'grid')
// Al cambiar: localStorage.setItem('bodega_view', newView)
```

---

## Estructura de componentes

```
Bodega (src/pages/Bodega.tsx)
├── BodegaHeader (inline)
│   ├── CollectionSummary (inline)
│   ├── FilterChips (inline)
│   └── SortViewRow (inline)
├── SearchPanel (inline)
│   ├── SearchInput
│   ├── SuggestionDropdown (inline)
│   ├── QuickAccessSection (inline)
│   └── WineCardList items
├── FilterPanel (inline, bottom sheet)
├── ResultsMeta (inline, una línea)
├── WineGrid (inline)
│   ├── GroupHeader (inline, cuando groupBy activo)
│   └── WineCardGrid (src/components/wine/WineCardGrid.tsx) ← NUEVO
├── WineListView (inline)
│   ├── GroupHeader (inline)
│   └── WineCardList (src/components/wine/WineCardList.tsx) ← NUEVO
├── EmptyState (inline)
├── SkeletonGrid (inline)
├── InfiniteScrollSentinel (div ref)
└── FAB (button fixed)
```

Los dos nuevos componentes de card (`WineCardGrid`, `WineCardList`) sustituyen al `WineCard` actual. `WineCard` queda deprecated pero no se elimina hasta confirmar que ningún otro screen lo usa.

---

## Animaciones

| Animación | Keyframe | Uso |
|---|---|---|
| `cardIn` | `opacity 0→1 + translateY 10→0` | Entrada de cards, stagger 40ms/card |
| `countUp` | `opacity 0→1 + translateY 6→0` | Stats del header al montar |
| `slideUp` | `opacity 0→1 + translateY 16→0` | Panel filtros al abrir |
| `shimmer` | `background-position 200%→-200%` | Skeleton, 2.2s infinite |

Todas respetan `prefers-reduced-motion: reduce` (desactivar si está activo).

---

## Accesibilidad

- Chips de filtro: `role="radio"` dentro de `role="radiogroup"`
- Toggle grid/lista: `aria-pressed` en cada botón
- FAB: `aria-label="Añadir vino mediante cámara"`
- Suggestions: `role="listbox"` + `aria-activedescendant`
- Skeleton: `aria-busy="true"` en el contenedor

---

## Lo que NO cambia

- `src/hooks/useWines.ts` — se extiende `WineFilters`, no se rompe la interfaz
- `src/store/wineStore.ts` — sin cambios
- `src/types/index.ts` — sin cambios
- Pipeline V1.4 congelado — `Scan.tsx`, `IdentifyResponse`, `EnrichResponse` intactos
- Ruta `/bodega` — sin cambios de routing

---

## Criterios de aceptación

1. Grid y lista funcionan con toggle; la vista elegida persiste entre sesiones
2. Búsqueda filtra en ≤ 300ms (debounce) con resultados en tiempo real
3. Autocomplete muestra sugerencias con emoji por tipo de campo
4. Filtros acumulables: tipo + favorito + stock + añada se combinan con AND
5. Agrupación reordena visualmente sin nueva petición a Supabase
6. Skeleton con shimmer visible durante la carga inicial
7. FAB se oculta al hacer scroll y reaparece 600ms después de detenerse
8. Estado vacío diferencia "sin resultados" de "bodega vacía"
9. Stats del header animados al montar; en skeleton durante carga
10. TypeScript limpio: `npx tsc --noEmit` sin errores
