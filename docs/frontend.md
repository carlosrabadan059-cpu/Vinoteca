# Frontend — Vinoteca

## Páginas y rutas

| Página | Ruta | Archivo | Descripción |
|--------|------|---------|-------------|
| Login | `/login` | `src/pages/Login.tsx` | Formulario email + contraseña |
| Register | `/register` | `src/pages/Register.tsx` | Registro de cuenta nueva |
| Bodega | `/bodega` | `src/pages/Bodega.tsx` | Lista paginada (20/página), búsqueda por texto, filtro por tipo (Tinto/Blanco/Rosado/Espumoso/Dulce), pull-to-refresh, scroll infinito con IntersectionObserver |
| WineDetail | `/bodega/:id` | `src/pages/WineDetail.tsx` | Detalle completo del vino, modal de edición con `WineForm` |
| Scan | `/scan` | `src/pages/Scan.tsx` | Captura de foto frontal/trasera, análisis en dos fases vía n8n, formulario de revisión |
| Catas | `/catas` | `src/pages/Catas.tsx` | Lista de catas con filtros: Todas / Esta semana / Este mes / Mejor puntuadas |
| NuevaCata | `/catas/nueva` | `src/pages/NuevaCata.tsx` | Formulario para iniciar una nueva sesión de cata |
| TastingDetail | `/catas/:id` | `src/pages/TastingDetail.tsx` | Detalle de cata con chat asistente (`TastingChat`) |
| Sommelier | `/sommelier` | `src/pages/Sommelier.tsx` | Chat con enrutamiento de intención: maridaje / enriquecimiento / chat libre |
| Stats | `/stats` | `src/pages/Stats.tsx` | Gráficas (Recharts): distribución por tipo, regiones top, añadas por década, puntuación media, insight generado por n8n |

## Layout y navegación

### ProtectedRoute

`src/router/index.tsx` define un `ProtectedRoute` que:
1. Lee `{ session, loading }` de `useAuthStore`
2. Muestra `<Spinner />` mientras `loading === true` (fondo `#1A0A0E`)
3. Redirige a `/login` si no hay sesión
4. Renderiza `<Outlet />` si hay sesión

### Layout

`src/components/ui/Layout.tsx` es el shell de cada página protegida. Incluye la barra de navegación inferior con las pestañas principales.

## Inventario de componentes UI

### `src/components/ui/`

| Componente | Descripción |
|-----------|-------------|
| `AnalysisProgress.tsx` | Overlay a pantalla completa durante el análisis de etiqueta. Barra de progreso simulada (0→70% en 10s, 70→95% lento, salta a 100% al terminar). Fases de texto rotativas cada 3s. Estado de éxito (verde, cierre a 600ms) y estado de error con "Reintentar". Animación de entrada/salida de 300ms (fade + translateY). |
| `Badge.tsx` | Etiqueta de estado (ej. tipo de vino, región) |
| `Button.tsx` | Botón temático con variantes |
| `Card.tsx` | Contenedor de tarjeta con borde y superficie |
| `ChatBubble.tsx` | Burbuja de mensaje para el chat del Sommelier |
| `Input.tsx` | Campo de texto temático |
| `Layout.tsx` | Shell de página con navegación inferior |
| `Modal.tsx` | Bottom sheet con `maxHeight: 90dvh`, título fijo, contenido scrollable (`overflowY: auto`, `-webkit-overflow-scrolling: touch`) |
| `Spinner.tsx` | Indicador de carga circular |
| `SuggestionChips.tsx` | Chips de sugerencias predefinidas para el chat |
| `SyncIndicator.tsx` | Indicador visual del estado de sincronización offline |
| `SyncModal.tsx` | Modal con detalle de operaciones pendientes en la cola de sync |
| `Toast.tsx` | Notificación temporal |

### `src/components/wine/`

| Componente | Descripción |
|-----------|-------------|
| `ChatBubble.tsx` | Burbuja de mensaje para el chat de cata (duplicado con `ui/ChatBubble`) |
| `DuplicateWineDialog.tsx` | Diálogo que avisa cuando se detecta un vino duplicado al guardar |
| `ImageCapture.tsx` | Captura de imagen desde cámara o galería |
| `TastingCard.tsx` | Tarjeta resumen de una cata en la lista |
| `TastingChat.tsx` | Chat asistente integrado en el detalle de cata (usa `askOpenAI` directamente, pendiente de migrar a n8n) |
| `TastingForm.tsx` | Formulario de datos de cata (puntuación, aromas, notas) |
| `TastingMiniCard.tsx` | Versión compacta de tarjeta de cata |
| `WineCard.tsx` | Tarjeta de vino para la vista de bodega con imagen |
| `WineForm.tsx` | Formulario completo de vino (14+ campos) usado en edición y revisión tras scan |

## Sistema de tema

Todas las constantes de diseño se exportan desde `src/constants/theme.ts`. Nunca se usan valores hex directos en los componentes.

### Colores

```typescript
theme.colors.primary  = '#8B1A2A'  // Rojo vino principal
theme.colors.gold     = '#C9A84C'  // Dorado (acentos)
theme.colors.cream    = '#F0EBE1'  // Crema (texto sobre oscuro)
theme.colors.dark     = '#0D0608'  // Fondo más oscuro
theme.colors.surface  = '#1A0E10'  // Superficie de tarjetas
theme.colors.surface2 = '#221318'  // Superficie secundaria
theme.colors.muted    = '#7A6A6E'  // Texto secundario
theme.colors.border   = '#2E1A1E'  // Bordes
```

### Espaciado (escala de 4px, valores en px)

```typescript
theme.spacing.xs  = 4
theme.spacing.sm  = 8
theme.spacing.md  = 16
theme.spacing.lg  = 24
theme.spacing.xl  = 32
theme.spacing.xxl = 48
```

### Bordes redondeados

```typescript
theme.radius.sm   = 4
theme.radius.md   = 8
theme.radius.lg   = 12
theme.radius.xl   = 16
theme.radius.full = 9999
```

### Tipografía

```typescript
theme.font.sm   = '0.875rem'
theme.font.base = '1rem'
theme.font.lg   = '1.125rem'
theme.font.xl   = '1.25rem'
theme.font['2xl'] = '1.5rem'
theme.font['3xl'] = '1.875rem'
```

## Hooks principales

### `useAuth` (`src/hooks/useAuth.ts`)

Hook local que mantiene `{ session, user, loading }` sincronizados con Supabase. Expone `login()`, `register()`, `logout()`. La sesión se obtiene con `getSession()` al montar y se suscribe a `onAuthStateChange`.

### `useAuthStore` (`src/store/authStore.ts`)

Store Zustand global para la sesión. `ProtectedRoute` y otros componentes que necesitan acceso rápido a `session`/`user` lo leen directamente del store.

### `useWines` (`src/hooks/useWines.ts`)

Hook principal para operaciones CRUD de vinos. Orquesta: IDB local → Supabase → merge. Funciones: `loadWines()`, `listWines(filters)`, `getWine(id)`, `createWine(data, images)`, `updateWine()`, `deleteWine()`. Usa `useWineStore`, `useAuthStore`, `useSyncStore`.

### `useTastings` (`src/hooks/useTastings.ts`)

Similar a `useWines` pero para catas. Funciones: `listTastings()`, `createTasting()`, `updateTasting()`.

### `useSync` (`src/hooks/useSync.ts`)

Expone `syncToSupabase()`. Lee la cola IDB (`sync_queue`), procesa cada `SyncOperation` (insert/update/delete) contra Supabase, gestiona reintentos (máx 3) y actualiza `syncStore`.

### `useCamera` (`src/hooks/useCamera.ts`)

Abstrae la captura de imagen desde cámara del dispositivo o selección desde galería.

### `useStats` (`src/hooks/useStats.ts`)

Calcula las estadísticas agregadas de la bodega para la página `Stats`.

## React Router v7

Configurado en `src/router/index.tsx` con `createBrowserRouter`. Dos grupos:

1. **Rutas públicas** — sin wrapper de autenticación
2. **Rutas protegidas** — envueltas por `<ProtectedRoute>` que usa `useAuthStore`

El router se monta en `src/main.tsx` con `<RouterProvider router={router} />`.
