# Supabase — Vinoteca

## Variables de entorno

```
VITE_SUPABASE_URL=https://<proyecto>.supabase.co
VITE_SUPABASE_ANON_KEY=<anon_public_key>
```

Ambas variables están prefijadas con `VITE_` para que Vite las inyecte en el bundle en tiempo de compilación vía `import.meta.env`.

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

**Nota:** La confirmación de email (`Confirm email`) debe estar **desactivada** en el dashboard de Supabase para que el registro funcione sin paso de validación de correo.

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

## Configuración del proyecto en el dashboard

- **URL:** Visible en `Settings → API → Project URL`
- **Anon key:** Visible en `Settings → API → Project API keys → anon public`
- **Service role key:** Solo para n8n (entorno Portainer), nunca en el cliente
- **Email confirm:** Desactivar en `Authentication → Providers → Email → Confirm email`
