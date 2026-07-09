# Fase 8 — Catas

## Estado

✅ Completada — v0.8.0 — 2026-07-09

---

## Objetivo

Elevar el sistema de catas de prototipo funcional a experiencia completa y coherente con el resto de la aplicación: historial navegable por vino, edición de catas existentes, distinguir visualmente consumo rápido de cata real, y preparar el sistema para la integración futura con Sommelier IA y estadísticas.

---

## Diagnóstico del estado actual

Las tres pantallas existen y funcionan. El trabajo de esta fase es **rediseñar y completar**, no crear desde cero.

### Lo que ya existe y funciona

| Elemento | Estado |
|---|---|
| Rutas `/catas`, `/catas/nueva`, `/catas/:id` | ✅ Registradas en el router |
| Tipo `Tasting` con todos los campos | ✅ Completo en `src/types/index.ts` |
| `useTastings` hook con CRUD completo | ✅ Create, read, update, delete + offline queue |
| `Catas.tsx` — listado con filtros | ✅ Funciona; necesita rediseño visual y nuevas funciones |
| `NuevaCata.tsx` — selector de vino + chat IA | ✅ Funciona; necesita campo fecha, lugar, ocasión |
| `TastingDetail.tsx` — detalle con secciones | ✅ Funciona; falta edición inline |
| `TastingCard.tsx` — card compacta | ✅ Funciona; consumir tokens del Design System |
| `TastingChat.tsx` — chat guiado por IA | ✅ No tocar (congelado con el pipeline) |

### Lo que falta

| Gap | Impacto |
|---|---|
| "Ver historial completo" en WineDetail no navega | Alto |
| No se puede editar una cata guardada | Alto |
| No hay distinción visual clara entre cata real y consumo rápido | Medio |
| `TastingCard` usa hex hardcodeados (`#3A2A2E`) | Medio |
| `Catas.tsx` tiene lógica de negocio mezclada con JSX | Medio |
| `NuevaCata.tsx` no expone campos `fecha`, `lugar`, `ocasion`, `botella_terminada` | Medio |
| No hay animaciones/tokens del Design System en páginas de catas | Bajo |
| `TastingDetail.tsx` no tiene botón compartir alineado con el DS | Bajo |

---

## Flujo completo del usuario

### Entrada desde Bodega / WineDetail

```
WineDetail → [Registrar cata] → /catas/nueva?wineId=xxx   (ya funciona)
WineDetail → [Ver historial completo · N catas →] → /catas?wineId=xxx  (pendiente)
```

### Listado de catas (`/catas`)

```
/catas
  ├── Header: título + stat total + FAB nueva cata
  ├── Filtros: Todas | Esta semana | Este mes | Mejor puntuadas | Por vino (nuevo)
  ├── Lista de TastingCard (con wineMap para nombre del vino)
  └── Estado vacío diferenciado
```

Si llega con `?wineId=xxx` (desde WineDetail):
- Precarga el filtro de vino
- Muestra título "Historial de [nombre del vino]"
- Botón "← Volver al vino" en vez del FAB general

### Nueva cata (`/catas/nueva`)

```
/catas/nueva[?wineId=xxx]
  ├── Paso 1: selección de vino (ya funciona)
  ├── [Nuevo] Tipo: Cata completa | Consumo rápido
  ├── [Nuevo] Metadatos opcionales: fecha, lugar, ocasión, botella terminada
  └── Paso 2: TastingChat guiado (ya funciona) — solo si es cata completa
       Si consumo rápido: formulario simplificado (puntuación rápida + nota breve)
```

### Detalle de cata (`/catas/:id`)

```
/catas/:id
  ├── Header: ← Volver | Editar | Eliminar
  ├── Puntuación + fecha + tipo badge (Cata / Consumo rápido)
  ├── Banner vino (link a /bodega/:id)
  ├── Secciones: Color, Aroma, Boca, Maridaje
  ├── [Nuevo] Metadatos: lugar, ocasión, botella terminada
  ├── Chat history colapsable
  └── Compartir
```

### Edición de cata

- Desde `TastingDetail`, botón "Editar" abre un formulario inline o modal
- Campos editables: puntuación, notas, aroma, color, maridaje, lugar, ocasión, fecha, botella_terminada
- No se puede re-lanzar el chat de IA en una cata ya guardada

---

## Division en Tasks

### Task 1 — Design System en componentes existentes

**Objetivo:** eliminar hardcodes en `TastingCard.tsx` y `TastingDetail.tsx`. No cambiar lógica ni estructura.

**Archivos:**
- `src/components/wine/TastingCard.tsx` — `#3A2A2E` → `t.colors.border`
- `src/pages/TastingDetail.tsx` — `#3A2A2E`, `#D32F2F`, `#4A3A3E` → tokens

**Tokens nuevos a añadir en `theme.ts` si no existen:**
- `colors.danger` — rojo de acciones destructivas (`#D32F2F`)
- `colors.scoreNeutral` — fondo de score sin puntuación (`#4A3A3E`)

Verificar con `grep -rn '#[0-9A-Fa-f]'` en los archivos afectados antes de cerrar.

---

### Task 2 — Historial de catas desde WineDetail

**Objetivo:** conectar el botón "Ver historial completo" a `/catas?wineId=xxx`.

**Archivos:**
- `src/pages/WineDetail.tsx` — línea ~534: `navigate('/catas')` → `navigate(\`/catas?wineId=${wine.id}\`)`

**Archivos secundarios:**
- `src/pages/Catas.tsx` — leer `?wineId` de `useSearchParams`, filtrar el listado, cambiar título

---

### Task 3 — Refactorizar Catas.tsx

**Objetivo:** extraer lógica a hook y helpers. Bodega.tsx es el modelo a seguir.

**Crear:**
- `src/lib/catasHelpers.ts` — tipos, constantes de filtros, función `applyFilter`
- `src/hooks/useCatasState.ts` — estado reactivo: filtro activo, wineId param, wineMap, loading

**Resultado:** `Catas.tsx` queda como composición pura, sin lógica de negocio.

**Restricción:** no cambiar el diseño visual en esta task, solo la arquitectura.

---

### Task 4 — Campos adicionales en NuevaCata

**Objetivo:** exponer `fecha`, `lugar`, `ocasion`, `botella_terminada`, y el tipo de registro (cata completa vs. consumo rápido) antes de lanzar el chat.

**Flujo:**
1. Usuario selecciona vino
2. Aparece sección de metadatos (colapsable por defecto, expandible)
   - Fecha: input date (default: hoy)
   - Tipo: toggle "Cata completa / Consumo rápido"
   - Lugar (texto libre, opcional)
   - Ocasión (texto libre, opcional)
   - Botella terminada (checkbox)
3. Si "Cata completa": continúa con TastingChat (flujo actual)
4. Si "Consumo rápido": formulario simplificado (slider puntuación 0–100, textarea nota)

**Archivos:**
- `src/pages/NuevaCata.tsx`

**No tocar:** `TastingChat.tsx` — congelado con el pipeline de IA.

---

### Task 5 — Edición de cata existente

**Objetivo:** permitir editar todos los campos de una cata ya guardada desde `TastingDetail`.

**Diseño:** modo edición inline (no modal separado). Botón "Editar" en el header convierte las secciones en campos editables. Botón "Guardar" llama a `updateTasting`.

**Archivos:**
- `src/pages/TastingDetail.tsx` — añadir modo `editing: boolean`, inputs controlados por sección

**Hook:** `useTastings.updateTasting` ya existe y soporta offline — no modificar.

---

### Task 6 — Distinción visual consumo rápido vs. cata completa

**Objetivo:** que el usuario identifique a primera vista el tipo de registro.

**Afecta:**
- `TastingCard.tsx` — badge sutil "Consumo" cuando `es_consumo_rapido === true`
- `TastingDetail.tsx` — badge en el header de puntuación
- `Catas.tsx` (filtro) — posibilidad de filtrar por tipo

---

### Task 7 — Cierre y validación de Fase 8

Igual que Task 7 de Fase 7:
- `npm run build` limpio
- Grep de hardcodes
- Sin TODO/FIXME
- CHANGELOG actualizado con v0.8.0
- Roadmap: Fase 8 → ✅
- Commit + push

---

## Componentes reutilizables (no crear de nuevo)

| Componente | Dónde está | Cómo se usa |
|---|---|---|
| `TastingCard` | `src/components/wine/TastingCard.tsx` | Listado en `Catas.tsx` y en `WineDetail.tsx` |
| `TastingChat` | `src/components/wine/TastingChat.tsx` | Solo en `NuevaCata.tsx` — no tocar |
| `Layout` | `src/components/ui/Layout.tsx` | Wrapper de todas las páginas |
| `Modal` | `src/components/ui/Modal.tsx` | Confirmación de eliminación |
| `Button` | `src/components/ui/Button.tsx` | Acciones |
| `Spinner` | `src/components/ui/Spinner.tsx` | Loading states |
| `injectKeyframes` | `src/constants/theme.ts` | Animaciones `cardIn`, `slideUp` |

---

## Hooks a ampliar

| Hook | Cambio previsto |
|---|---|
| `useTastings` | Añadir `loadTastingsForWine(wineId)` si el filtro por `?wineId` necesita una carga específica (evaluar en Task 3) |
| `useWines` | Sin cambios previstos |

---

## Cambios en Supabase

La tabla `tastings` ya tiene todos los campos necesarios (`lugar`, `ocasion`, `botella_terminada`, `es_consumo_rapido`). **No se prevé ninguna migración de schema** para esta fase.

Verificar antes de Task 4 con:
```sql
SELECT column_name, data_type FROM information_schema.columns
WHERE table_name = 'tastings' ORDER BY ordinal_position;
```

---

## Dependencias con fases anteriores

| Dependencia | Origen | Estado |
|---|---|---|
| Tipo `Tasting` completo | Fase 6 | ✅ Disponible |
| `useTastings` con CRUD + offline | Fase 4/6 | ✅ Disponible |
| Design System v1 congelado | Pre-Fase 7 | ✅ Disponible |
| `TastingChat` con pipeline IA | Fase 4 | ✅ Congelado — no tocar |
| `WineDetail` con sección "Últimas catas" | Fase 6 | ✅ Disponible — solo conectar ruta |
| `useWines.getWine` | Fase 3/5 | ✅ Disponible |

---

## Preparación para fases posteriores

### Fase 9 — Estadísticas
Los campos que se añaden en esta fase (`lugar`, `ocasion`, `botella_terminada`, `es_consumo_rapido`) son los que alimentarán los dashboards de Fase 9. Asegurarse de que se guardan correctamente en Supabase.

### Fase 10 — Sommelier IA
`TastingChat.tsx` ya tiene el hook de la IA. En Fase 10 se enviará el historial de catas como contexto al Sommelier para personalizar respuestas. El campo `chat_history` en `Tasting` ya lo almacena.

---

## Riesgos técnicos

| Riesgo | Probabilidad | Mitigación |
|---|---|---|
| `wineMap` en `Catas.tsx` hace N peticiones individuales a `getWine` | Media | En Task 3, cargar todos los vinos del usuario de una vez con `useWineStore` en lugar de peticiones individuales |
| Edición inline en `TastingDetail` puede superar 300 líneas | Media | Extraer el formulario de edición a un componente `TastingEditForm` si supera el límite |
| `NuevaCata.tsx` tiene hardcodes (`#3A2A2E`, `#2A1A1E`) | Alta | Tokenizar en Task 1 o al inicio de Task 4 |

---

## Criterio de finalización

- El usuario puede navegar al historial completo de catas de un vino desde WineDetail.
- El usuario puede registrar una cata completa o un consumo rápido con campos adicionales (fecha, lugar, ocasión).
- El usuario puede editar cualquier campo de una cata ya guardada.
- El usuario puede eliminar una cata (ya funciona).
- La distinción visual entre cata completa y consumo rápido es clara en el listado y en el detalle.
- Build limpia, sin hardcodes, sin errores TypeScript.
