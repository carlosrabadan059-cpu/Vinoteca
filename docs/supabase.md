# Supabase — Vinoteca

**Infraestructura:** self-hosted (migrado desde Supabase Cloud el 2026-08-19), corriendo en Docker en el host `debian` propio, detrás de un túnel Cloudflare (`cloudflared`, gestionado desde el dashboard de Zero Trust — no hay `config.yml` local).

## Variables de entorno

```
VITE_SUPABASE_URL=https://supabase-api.rabadanhouse.space
VITE_SUPABASE_ANON_KEY=<publishable key o anon key legacy>
```

Ambas variables están prefijadas con `VITE_` para que Vite las inyecte en el bundle en tiempo de compilación vía `import.meta.env`. `VITE_SUPABASE_URL` en **producción (Vercel)** debe ser `https://supabase-api.rabadanhouse.space` — no confundir con `https://supabase.rabadanhouse.space`, que es el hostname de **Studio** (la UI de administración), no de la API. Usar el de Studio como `VITE_SUPABASE_URL` deja la app sin poder autenticar ni consultar datos.

En **desarrollo local** (`.env`) el proyecto sigue apuntando a Supabase Cloud (`xagsblgwvfitqkzjtwyc.supabase.co`) — no se ha migrado local todavía; solo producción usa el self-hosted.

## Rutas Cloudflare Tunnel (host `debian`)

| Hostname público | Servicio destino | Uso |
|---|---|---|
| `supabase.rabadanhouse.space` | `http://100.115.74.107:3000` (Tailscale) | Studio (admin UI) |
| `supabase-api.rabadanhouse.space` | `http://127.0.0.1:8000` | Kong / API (REST, Auth, Realtime, Storage) — **esta es la que usa la app** |

`docker-compose.yml` del stack Supabase (`/srv/docker/supabase/` en el host) publica el puerto 8000 de Kong con **dos** bindings simultáneos: `127.0.0.1:8000:8000` (para el túnel Cloudflare público) y `100.115.74.107:8000:8000` (acceso directo por Tailscale, usado por el MCP de Supabase en Claude Code sin necesitar túnel SSH). Si se toca ese `ports:` en el futuro, mantener ambos — quitar el de `127.0.0.1` rompe la API pública silenciosamente (Cloudflare devuelve 502).

## Cliente (`src/lib/supabase.ts`)

```typescript
import { createClient } from '@supabase/supabase-js'

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession:    true,   // guarda la sesión en localStorage
    autoRefreshToken:  true,   // refresca el JWT automáticamente
    detectSessionInUrl: true,  // lee tokens de magic links en la URL
  },
})
```

Una sola instancia exportada. Todos los hooks y funciones de la app la importan directamente desde este módulo.

## Autenticación

Vinoteca usa **email + contraseña** (`signInWithPassword` / `signUp`).

- La sesión se persiste en `localStorage` del navegador.
- Al arrancar la app, `useAuth` llama a `supabase.auth.getSession()` para restaurar la sesión existente.
- La suscripción `onAuthStateChange` mantiene el store sincronizado con cualquier cambio posterior (login, logout, expiración).

**Nota:** La confirmación de email (`Confirm email`) está **activada** en el dashboard de Supabase (Fase 9, gestión de usuarios) — tras `signUp` el usuario debe confirmar desde el correo antes de poder iniciar sesión. `Register.tsx` muestra el mensaje "revisa tu correo" en ese paso.

## Tablas accedidas

| Tabla | Operaciones | Filtro principal |
|-------|------------|-----------------|
| `wines` | SELECT, INSERT, UPDATE, DELETE | `user_id = auth.uid()` |
| `tastings` | SELECT, INSERT, UPDATE, DELETE | `user_id = auth.uid()` |

### Consultas representativas

**Cargar vinos del usuario:**
```typescript
supabase
  .from('wines')
  .select('*')
  .eq('user_id', user.id)
  .order('created_at', { ascending: false })
```

**Búsqueda de texto con paginación:**
```typescript
supabase
  .from('wines')
  .select('*', { count: 'exact' })
  .eq('user_id', user.id)
  .or(`nombre.ilike.%${q}%,bodega.ilike.%${q}%,region.ilike.%${q}%`)
  .order('created_at', { ascending: false })
  .range(from, to)
```

**Lookup por `wine_uid`:**
```typescript
supabase
  .from('wines')
  .select('*')
  .eq('user_id', userId)
  .eq('wine_uid', uid)
```

## Row Level Security (RLS)

El patrón de código asume que RLS está activo con políticas que restringen el acceso por `user_id = auth.uid()`. Todas las consultas del cliente incluyen `.eq('user_id', user.id)` como filtro explícito, aunque con RLS bien configurado este filtro sería redundante.

La excepción es el workflow n8n de `scan/identificar`, que opera con la **service role key** (configurada como variable de entorno en Portainer) y por tanto tiene acceso sin restricciones RLS.

## Supabase Storage

**Bucket:** `wine-labels`

Usado para almacenar las fotos de etiquetas de vinos.

### Función `uploadWineImage` (`src/lib/storage.ts`)

```typescript
uploadWineImage(dataUrl, userId, wineId, side: 'frontal' | 'trasera'): Promise<string>
```

**Ruta del archivo:** `{userId}/{wineId}/{side}.jpg`

**Comportamiento:**
1. Convierte el data URL base64 a `Blob` (JPEG).
2. Sube al bucket `wine-labels` con `upsert: true` (sobreescribe si existe).
3. Genera una URL firmada con validez de **10 años** (`TEN_YEARS_SECONDS = 60 * 60 * 24 * 365 * 10`).
4. Devuelve la URL firmada, que se guarda en `wines.imagen_frontal_url` o `wines.imagen_trasera_url`.

**Estrategia Workbox para Storage:**

```
*.supabase.co/storage/v1/*  →  CacheFirst
  cacheName: 'supabase-storage'
  maxEntries: 200
  maxAgeSeconds: 604800  (7 días)
```

Las imágenes se sirven desde caché offline después de la primera descarga.

### Función `fetchImageAsDataUrl` (`src/lib/storage.ts`)

Descarga una imagen desde cualquier URL y la convierte a data URL (base64). Usada para re-enviar imágenes almacenadas a n8n si es necesario.

## Configuración del proyecto (self-hosted)

- **URL / Anon key:** vía MCP (`mcp__supabase__get_project_url` / `get_publishable_keys`) o `/srv/docker/supabase/.env` en el host `debian` (`ANON_KEY`, `SUPABASE_PUBLISHABLE_KEY`)
- **Service role key:** solo para n8n (entorno Portainer), nunca en el cliente
- **Email confirm:** activado (heredado de la config de Cloud tras la migración)
- **Studio (UI admin):** `https://supabase.rabadanhouse.space` (Dashboard user/pass en `.env`: `DASHBOARD_USERNAME` / `DASHBOARD_PASSWORD`)

### Kong (`volumes/api/kong.yml`) — grupos ACL de los consumers

Cada ruta de Kong (`rest-v1`, `auth-v1`, `graphql-v1`, etc.) tiene un plugin `acl` con un `allow:` (p.ej. `admin`, `anon`). Para que una API key funcione, el `consumer` correspondiente en el bloque `consumers:` necesita **tanto** `keyauth_credentials` (la key) **como** `acls: - group: <nombre>` (la pertenencia al grupo) — faltar el segundo bloque hace que Kong acepte la key pero rechace la petición igualmente, con `403 "You cannot consume this service"`. Se encontró y corrigió el 2026-08-19: los consumers `anon`, `service_role` y `DASHBOARD` no tenían `acls:` asignado (causa desconocida, probablemente una regeneración de `kong.yml` que no preservó ese bloque). Backup previo al fix: `volumes/api/kong.yml.bak3`.

`kong.yml` no se usa directamente — se monta como `temp.yml` y `kong-entrypoint.sh` sustituye las variables (`$SUPABASE_ANON_KEY`, etc.) generando el `kong.yml` real en `/usr/local/kong/kong.yml` dentro del contenedor en cada arranque. Cambios en `kong.yml` requieren `docker compose up -d --force-recreate kong` para aplicarse.
