# Arquitectura — Vinoteca

## Descripción general

Vinoteca es una PWA de bodega personal de vinos. El usuario fotografía etiquetas, la app identifica el vino vía n8n/OpenAI, guarda la ficha en Supabase y permite anotar catas. Funciona offline mediante IndexedDB y una cola de sincronización.

## Stack tecnológico

| Capa | Tecnología | Versión |
|------|-----------|---------|
| Build | Vite | ^8.0 |
| UI framework | React | ^19.2 |
| Tipado | TypeScript | ~6.0 |
| Estilos | Tailwind CSS (vite plugin) | ^4.3 |
| Routing | React Router DOM | ^7.17 |
| Estado global | Zustand | ^5.0 |
| Base de datos | Supabase (PostgreSQL) | @supabase/supabase-js ^2.107 |
| Offline storage | IndexedDB vía `idb` | ^8.0 |
| Gráficas | Recharts | ^3.8 |
| PWA | vite-plugin-pwa + Workbox | ^1.3 |
| AI backend | n8n (self-hosted) | n8n.rabadanhouse.space |

## Estructura de rutas

### Rutas públicas

| Ruta | Componente | Descripción |
|------|-----------|-------------|
| `/login` | `Login` | Formulario de acceso |
| `/register` | `Register` | Registro de cuenta |
| `/` | — | Redirige a `/bodega` |

### Rutas protegidas (requieren sesión activa)

Envueltas por `ProtectedRoute`, que muestra un spinner mientras carga y redirige a `/login` si no hay sesión.

| Ruta | Componente | Descripción |
|------|-----------|-------------|
| `/bodega` | `Bodega` | Lista paginada de vinos con filtros |
| `/bodega/:id` | `WineDetail` | Detalle y edición de un vino |
| `/scan` | `Scan` | Captura de fotos y análisis de etiqueta |
| `/catas` | `Catas` | Lista de catas con filtros |
| `/catas/nueva` | `NuevaCata` | Formulario de nueva cata |
| `/catas/:id` | `TastingDetail` | Detalle de una cata |
| `/sommelier` | `Sommelier` | Chat de maridaje y enriquecimiento |
| `/stats` | `Stats` | Estadísticas y gráficas de la bodega |

## Flujo de autenticación

```
App arranca
  └─► useAuthStore (Zustand)
        └─► supabase.auth.getSession()   ← lee localStorage
              ├─ sesión encontrada → session = Session, loading = false
              └─ no encontrada    → session = null,    loading = false

onAuthStateChange (suscripción activa)
  └─► actualiza session en authStore automáticamente

ProtectedRoute
  ├─ loading=true  → <Spinner />
  ├─ session=null  → <Navigate to="/login" />
  └─ session≠null  → <Outlet /> (renderiza ruta protegida)
```

La sesión se persiste en `localStorage` (opción `persistSession: true` del cliente Supabase). El token se refresca automáticamente (`autoRefreshToken: true`).

## Patrón offline-first

```
Usuario realiza acción (crear/editar/borrar vino o cata)
  │
  ├─► 1. Guardado inmediato en IndexedDB (wines_local / tastings_local)
  │         → UI actualizada al instante, sin esperar red
  │
  ├─► 2. Intento de escritura en Supabase
  │     ├─ Éxito → marca synced_at, no añade a la cola
  │     └─ Error → añade SyncOperation a sync_queue en IDB
  │
  └─► 3. useSync.syncToSupabase()
            ├─ Lee sync_queue completa
            ├─ Procesa cada operación contra Supabase
            ├─ Éxito → removeFromQueue
            └─ Error → incrementa retries (máx 3, luego descarta)
```

La carga inicial sigue el patrón: IDB local primero (respuesta inmediata) → Supabase (si hay red) → merge (pending local + datos remotos).

## Configuración PWA

**Registro del Service Worker:** `registerType: 'autoUpdate'` — el SW se actualiza automáticamente en segundo plano.

**Estrategias Workbox:**

| Patrón de URL | Estrategia | Cache | TTL |
|---------------|-----------|-------|-----|
| `*.supabase.co/rest/v1/*` | NetworkFirst | `supabase-api` | 24h, max 100 entradas |
| `*.supabase.co/storage/v1/*` | CacheFirst | `supabase-storage` | 7 días, max 200 entradas |
| Assets estáticos (js/css/html/png/svg/woff2) | Precache | — | Controlado por SW |

**Manifest:**

```json
{
  "name": "Vinoteca",
  "short_name": "Vinoteca",
  "theme_color": "#722F37",
  "background_color": "#1A0A0E",
  "display": "standalone",
  "orientation": "portrait"
}
```

## Diagrama de flujo de datos

```
┌─────────────────────────────────────────────────────────────┐
│                         CLIENTE (PWA)                        │
│                                                              │
│  React Pages  ──► Zustand Stores ──► React Components       │
│       │               │                                      │
│       ▼               ▼                                      │
│   useWines()      wineStore          IndexedDB (idb)         │
│   useTastings()   tastingStore  ◄──► wines_local             │
│   useSync()       syncStore         tastings_local           │
│   useAuth()       authStore         sync_queue               │
│       │                                                      │
│       ▼                                                      │
│   src/lib/n8n.ts ──────────────────────────────────────────► n8n
│   src/lib/supabase.ts ────────────────────────────────────► Supabase
│   src/lib/storage.ts  ──────────► Supabase Storage (imágenes)
└─────────────────────────────────────────────────────────────┘

Servicios externos:
  ┌──────────────┐   ┌──────────────────────────────┐
  │   Supabase   │   │   n8n (rabadanhouse.space)   │
  │  PostgreSQL  │   │  ┌──────────────────────┐    │
  │  Auth        │   │  │ /sommelier/chat      │    │
  │  Storage     │   │  │ /sommelier/maridaje  │    │
  └──────────────┘   │  │ /sommelier/enriquec. │    │
                     │  │ /scan/identificar    │    │
                     │  │ /scan/analizar       │    │
                     │  │ /stats/insight       │    │
                     │  └──────────────────────┘    │
                     │     └──► OpenAI (GPT-4o)     │
                     └──────────────────────────────┘
```

## Servicios externos

| Servicio | Rol | Configuración |
|---------|-----|--------------|
| **Supabase** | Auth, PostgreSQL, Storage de imágenes | `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY` |
| **n8n** | Backend AI: escaneo de etiquetas, sommelier, estadísticas | `VITE_N8N_BASE_URL` |
| **OpenAI** | Usado por n8n internamente (GPT-4o / gpt-image-1) | Credencial en n8n, no en el cliente |
