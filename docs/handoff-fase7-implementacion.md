# Handoff — Fase 7: Implementación de Bodega (Tasks 1–7)

**Fecha:** 2026-07-09  
**Repo:** `/Users/carlosrabadan/Antigravity/Vinoteca`  
**Rama:** `master`  
**Último commit:** `e8da926`

---

## Estado actual

El Design System v1 está **completamente congelado y pusheado**. Tres commits recientes lo cierran:

| Commit | Contenido |
|---|---|
| `13522f2` | Design System v1: colors, spacing, radius, borders, shadows, gradients, imageFilters, animation, zIndex, sizes |
| `3770ba5` | Escala tipográfica semántica (26 tokens en `theme.typography`) + plan actualizado con spreads |
| `e8da926` | Reglas de gobernanza y tabla de uso tipográfico en cabecera de `theme.ts` |

**No hay ninguna tarea de implementación empezada.** Los componentes nuevos `WineCardGrid.tsx` y `WineCardList.tsx` NO existen aún.

---

## Artefactos de referencia

- **Spec de diseño (congelada):** `docs/superpowers/specs/2026-07-09-bodega-fase7-design.md`
- **Plan de implementación completo:** `docs/superpowers/plans/2026-07-09-bodega-fase7.md`
- **Design System:** `src/constants/theme.ts`
- **Hook de datos:** `src/hooks/useWines.ts`
- **Página actual (a reescribir):** `src/pages/Bodega.tsx`
- **Componente existente (deprecated tras Fase 7):** `src/components/wine/WineCard.tsx`

El plan contiene el código completo de cada tarea con tokens `t.typography.*` ya aplicados. **Leer el plan antes de implementar.**

---

## Tasks pendientes (en orden estricto)

### Task 1 — `src/components/wine/WineCardGrid.tsx` (NUEVO)
Card de vino en vista grid (2 columnas). Ver plan Task 1 para código completo.

Características clave:
- Imagen 158px, `object-fit: contain`, `filter: brightness(1.08) contrast(1.05)`
- Overlay gradiente negro bottom→top
- Badge tipo top-left (gold), badge stock bottom-right, badge favorito top-right
- Animación `cardIn` staggered por índice
- Tipografía: `...t.typography.cardTitleGrid`, `cardSubtitle`, `cardMetaGrid`, `cardAnadaSmall`, `badge`, `badgeStock`

### Task 2 — `src/components/wine/WineCardList.tsx` (NUEVO)
Card de vino en vista lista. Ver plan Task 2 para código completo.

Características clave:
- Thumbnail 52×68px, `border-radius: 6px`
- Nombre (Georgia bold) + bodega (gold) + chip tipo + región
- Derecha: añada thin, stock badge, estrella si favorito
- Tipografía: `...t.typography.cardTitleList`, `cardSubtitle`, `badgeStockList`, `cardAnada`, `cardMetaList`

### Task 3 — Modificar `src/hooks/useWines.ts`
Exportar `SortKey`, extender `WineFilters`, reescribir `listWines` con sortMap y chaining de filtros Supabase.

Interfaz nueva de `WineFilters`:
```typescript
export type SortKey = 'created_at_desc' | 'nombre_asc' | 'bodega_asc' | 'anada_asc' | 'anada_desc' | 'precio_desc' | 'num_botellas_desc'

export interface WineFilters {
  query?:     string
  tipo?:      string
  favorito?:  boolean
  consumido?: boolean
  stock?:     boolean      // num_botellas > 0
  anada_min?: number
  anada_max?: number
  page?:      number
  sort?:      SortKey
}
```

`listWines` debe encadenar `.eq()`, `.gt()`, `.gte()`, `.lte()`, `.or()` según los filtros activos. Ver plan Task 3 para implementación completa.

### Task 4 — `src/pages/Bodega.tsx` — imports, tipos, constantes, helpers
Añadir: imports de WineCardGrid/WineCardList/SortKey/WineFilters, tipos locales (`Suggestion`, `GroupKey`), constantes (`TIPOS`, `SORT_OPTIONS`, `GROUP_OPTIONS`), funciones helper (`getSuggestions`, `groupWines`, `unique`, `FilterSection`, `FilterChip`).

### Task 5 — `src/pages/Bodega.tsx` — estado y lógica de datos
Todos los `useState`, `useEffect`, función `load`, callbacks de scroll/touch (infinite scroll, pull-to-refresh, FAB auto-hide). Ver plan Task 5.

### Task 6 — `src/pages/Bodega.tsx` — JSX completo
El return completo: header sticky con stats y chips, panel búsqueda con autocomplete, panel filtros (bottom sheet), grid/lista con agrupación, estado vacío, skeleton, FAB. Ver plan Task 6.

### Task 7 — Build, docs, commit, push
```bash
npm run build
# Actualizar docs/CHANGELOG.md → entrada v0.7.0
# Actualizar docs/ROADMAP.md → Fase 7 ✅
git add -p
git commit -m "feat(bodega): Fase 7 — gestión de bodega con grid/lista, filtros y búsqueda"
git push origin master
```

---

## Convenciones críticas

| Regla | Detalle |
|---|---|
| Alias de theme | `const t = theme` al inicio de cada componente |
| Tipografía | `...t.typography.tokenName` — nunca fontSize/fontWeight/fontFamily literales |
| Colores | `t.colors.XXX` — nunca hex hardcodeados |
| Espaciado | `t.spacing[N]` — nunca píxeles literales salvo valores únicos de layout |
| TypeScript | `npx tsc --noEmit` debe pasar a 0 errores antes de cada commit |
| Commit + push | Obligatorio al finalizar cada tarea o grupo de tareas |

---

## Arquitectura del estado en Bodega.tsx

Ver `docs/superpowers/specs/2026-07-09-bodega-fase7-design.md` §"Estado global ampliado" para la tabla completa de useState con tipos.

Resumen de los más importantes:
- `view: 'grid' | 'list'` — persiste en `localStorage('bodega_view')`
- `wines: Wine[]` — resultado filtrado activo
- `query / debouncedQ` — búsqueda con 300ms debounce
- `tipoFilter / favoritoFilter / stockFilter` — chips rápidos
- `groupBy: GroupKey | null` — agrupación visual
- `sortBy: SortKey` — ordenación activa
- `page / hasMore / loading / loadingMore` — paginación infinita
- `fabHidden` — FAB auto-hide al hacer scroll

---

## Animaciones (keyframes ya en theme.ts)

`cardIn`, `countUp`, `slideUp`, `shimmer` están definidas en `KEYFRAMES_CSS` dentro de `theme.ts` e inyectadas vía `injectKeyframes()`. Llamar `injectKeyframes()` una sola vez en el componente raíz o en `Bodega.tsx`.

---

## Congelado — NO tocar

- `src/pages/Scan.tsx`
- Workflows n8n: identify, enrich, save
- Tipos `IdentifyResponse` / `EnrichResponse`
- Pipeline V1.4 completo

---

## Definition of Done (Fase 7)

Una tarea se considera completada **únicamente** cuando cumple todos estos criterios:

- [ ] Compila sin errores (`npx tsc --noEmit` → 0 errores)
- [ ] No introduce warnings nuevos
- [ ] No utiliza colores hardcodeados (solo `t.colors.*`)
- [ ] No define tipografía fuera de `theme.typography` (sin fontSize/fontWeight/fontFamily literales)
- [ ] No añade estilos inline salvo casos excepcionales justificados
- [ ] Reutiliza componentes existentes siempre que sea posible
- [ ] Mantiene estructura y comportamiento definidos en el prototipo aprobado (`docs/superpowers/specs/2026-07-09-bodega-fase7-design.md`)
- [ ] No modifica el Design System salvo necesidad justificada
- [ ] Incluye estados de carga, vacío y error (cuando aplique)
- [ ] El código queda preparado para reutilización en fases posteriores
- [ ] Commit realizado con mensaje descriptivo
- [ ] Push a `master` realizado

---

## Suggested skills

Para ejecutar las tasks del plan, invocar:

```
/superpowers:executing-plans
```

El plan en `docs/superpowers/plans/2026-07-09-bodega-fase7.md` ya tiene el formato de checkboxes compatible con `executing-plans`. Empezar desde Task 1.

Si se necesita revisar código antes de implementar:
```
/code-review
```
