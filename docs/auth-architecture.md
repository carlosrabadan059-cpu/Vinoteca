# Arquitectura de autenticación e identidad

Ver también [`docs/fase-09-auth.md`](fase-09-auth.md) para el handoff de implementación.

## Diagrama de tablas

```
Supabase Auth (auth.users)   — identidad, credenciales, sesión
        │
        ▼
profiles                     — identidad de aplicación, estable (1 fila por usuario)
        │
        ▼
user_settings                — preferencias y configuración, cambian con frecuencia (1:1 con profiles)
        │
        ▼
Datos de Vinoteca (wines, tastings — siguen colgando de user_id, sin cambios)
```

## Responsabilidades por tabla

### `auth.users` (gestionada por Supabase)

Credenciales, email, hash de contraseña, metadata de sesión. La app nunca escribe directamente en esta tabla salvo a través del SDK de Auth (`supabase.auth.*`).

### `profiles`

Identidad **estable** de la aplicación — cambia poco:

| Columna | Descripción |
|---------|-------------|
| `id` | = `auth.users.id` |
| `display_name`, `avatar_url`, `country`, `locale` | Identidad visible |
| `role` | `user \| premium \| family \| admin` — reservado, sin lógica activa |
| `plan` | `free \| premium \| family` — reservado, sin lógica activa |
| `last_login_at` | Actualizado por el cliente tras cada login |
| `created_at`, `updated_at` | Auditoría |

`role` y `plan` están protegidos por el trigger `protect_profile_role_plan_trigger`: cualquier `UPDATE` desde el cliente (rol `authenticated`) que intente cambiarlos se revierte silenciosamente a su valor anterior. Solo una llamada con `service_role` (futuro backend/función de administración) puede modificarlos — esa vía **no está implementada** en esta fase.

### `user_settings`

Preferencias y configuración — cambia **con frecuencia**, 1:1 con `profiles`:

| Columna | Descripción |
|---------|-------------|
| `theme`, `language`, `currency`, `timezone`, `date_format` | Preferencias de UI simples |
| `notifications_email`, `notifications_push` | Booleanos |
| `camera_preferences`, `ai_preferences`, `privacy_preferences` | `jsonb`, inicializados a `{}`, sin estructura interna definida — contenedores abiertos para funcionalidades futuras sin requerir migración |

Separar `user_settings` de `profiles` significa que **añadir una preferencia nueva nunca requiere tocar la tabla de identidad**.

### `wines`, `tastings`

Sin cambios de esquema. Cuelgan de `user_id = auth.uid()`, con RLS que aísla completamente los datos de cada usuario.

## Flujo de autenticación

1. **Registro** (`Register.tsx` → `authStore.register`) → `supabase.auth.signUp`. Trigger `on_auth_user_created` en `auth.users` crea automáticamente `profiles` + `user_settings` con sus valores por defecto.
2. **Verificación de email** (pendiente de activar en el dashboard) → el usuario confirma desde el correo antes de poder iniciar sesión.
3. **Login** (`Login.tsx` → `authStore.login`) → `signInWithPassword`, y actualiza `profiles.last_login_at` en segundo plano.
4. **Recuperar contraseña**: `ForgotPassword.tsx` → `authStore.requestPasswordReset` → `resetPasswordForEmail` → email con enlace a `/restablecer` → `ResetPassword.tsx` → `authStore.updatePassword` → `auth.updateUser({ password })`.
5. **Cambio de contraseña ya logueado**: mismo `authStore.updatePassword`, invocado desde `Ajustes.tsx`.
6. **Logout**: `authStore.logout`, invocado desde `Ajustes.tsx`.
7. **Persistencia de sesión**: sin cambios — `localStorage`, `autoRefreshToken: true` (`src/lib/supabase.ts`).

## Responsabilidades por componente

| Componente | Gestiona | No gestiona |
|------------|----------|--------------|
| `src/store/authStore.ts` | Sesión, login/logout/registro, reset/cambio de contraseña, `last_login_at` | Nombre, avatar, preferencias |
| `src/hooks/useProfile.ts` | `profiles`: nombre, avatar, país, idioma; lectura de `role`/`plan` | Sesión, preferencias |
| `src/hooks/useSettings.ts` | `user_settings`: tema, idioma, notificaciones, preferencias JSON | Sesión, identidad |
| `src/hooks/useWines.ts`, `useTastings.ts` | Datos de negocio (vinos, catas) | Identidad, sesión, preferencias |

Principio: **no mezclar lógica de autenticación con lógica de negocio**, y dentro del perfil, **no mezclar identidad con preferencias**. Cada capa tiene una única responsabilidad y una única tabla.

## RLS

- `wines`, `tastings`: una política por comando (`SELECT`/`INSERT`/`UPDATE`/`DELETE`) restringida a `user_id = auth.uid()`. Ver `supabase/migrations/20260718000001_wines_tastings_rls_hardening.sql`.
- `profiles`: `SELECT`/`UPDATE` restringidos a `id = auth.uid()`. `role`/`plan` protegidos además por trigger (ver arriba) — la RLS por sí sola no bastaba para evitar auto-escalado de forma robusta.
- `user_settings`: `SELECT`/`UPDATE` restringidos a `user_id = auth.uid()`.
- Ninguna de las tres tablas tiene política de `INSERT`/`DELETE` para el cliente — las filas de `profiles`/`user_settings` nacen vía trigger y mueren vía `on delete cascade` desde `auth.users`.
- Storage: bucket `wine-labels` y bucket `avatars`, ambos con políticas por prefijo `{userId}/...`.

## Explícitamente fuera de alcance (preparado, no implementado)

El modelo de datos queda preparado para lo siguiente sin requerir migraciones disruptivas, pero nada de esto tiene lógica de aplicación activa en esta fase:

- **Planes Premium**: columna `plan` existe; ninguna restricción de uso/facturación implementada.
- **Cuentas Family / bodega compartida**: modelo previsto (no creado):
  ```
  Casa (household)
    ↓
  Usuarios (miembros, vía tabla puente household_members con rol)
    ↓
  Bodega compartida (wines/tastings referenciando household_id, columna nullable aditiva)
  ```
  Al introducirse, `household_id` sería una columna nullable en `wines`/`tastings` — no rompe el modelo actual de `user_id`.
- **Panel de administración**: columna `role` incluye `admin`; no existe ninguna UI ni política que dé acceso a datos de otros usuarios. La única vía prevista para cambiar `role`/`plan` de una cuenta es una función `service_role`, sin implementar.
- **Pagos, gestión de dispositivos**: sin modelo de datos todavía.
- **Preferencias avanzadas de IA/cámara/privacidad**: campos `jsonb` existen en `user_settings`, sin estructura interna definida ni UI.

## Estrategia de compatibilidad con usuarios existentes

El trigger `on_auth_user_created` solo se dispara para altas nuevas. La migración `20260718000004_backfill_profiles_settings.sql` genera las filas faltantes de `profiles`/`user_settings` para cualquier cuenta creada antes de esta fase, usando los mismos valores por defecto que el trigger.
