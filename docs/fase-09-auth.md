# Handoff — Fase 9: Gestión de usuarios y cuentas

**Fecha:** 2026-07-18
**Rama:** `master`

---

## Estado del proyecto

La Fase 9 deja la app lista para producción desde el punto de vista de cuentas: registro, login, recuperación de contraseña, perfil, ajustes, y una tabla de identidad (`profiles`) separada de una tabla de preferencias (`user_settings`), preparadas para futuras funcionalidades (Premium, Family, admin) sin requerir migraciones disruptivas.

El modelo de datos de vino no cambia: `Usuario → Bodega → Vinos → Catas` sigue siendo estrictamente privado por usuario, sin nada compartido.

Ver también [`docs/auth-architecture.md`](auth-architecture.md) para la arquitectura completa.

---

## Qué se implementó

### Migraciones (`supabase/migrations/`)

| Archivo | Propósito |
|---------|-----------|
| `20260718000000_baseline.sql` | Esquema real capturado con `supabase db diff --linked --use-migra` (el motor por defecto `pg-delta` de esta versión de la CLI no detectaba diferencias correctamente; `migra` sí). Primera migración versionada auditable del proyecto. |
| `20260718000001_wines_tastings_rls_hardening.sql` | Verificación (assert), no cambio de esquema: el baseline confirmó que `wines`/`tastings` ya tenían una política RLS por comando (`select_own_wines`, `delete_own_tastings`, etc.), incluido el `DELETE` de `tastings` que el cliente (`src/hooks/useTastings.ts`) no filtra por `user_id` en el código. |
| `20260718000002_profiles_user_settings.sql` | Crea `profiles` (identidad estable) y `user_settings` (preferencias), con RLS propia y un trigger `protect_profile_role_plan_trigger` que impide cambiar `role`/`plan` desde el cliente. |
| `20260718000003_handle_new_user_trigger.sql` | Trigger `on_auth_user_created` en `auth.users`: crea automáticamente `profiles` + `user_settings` al registrarse (idempotente, `on conflict do nothing`). Crea el bucket de Storage `avatars` con políticas por prefijo `{userId}/...`. |
| `20260718000004_backfill_profiles_settings.sql` | Rellena `profiles`/`user_settings` para cuentas creadas antes de que existiera el trigger. |

### Flujo de autenticación

- **Login / registro / logout**: ya existían (`src/store/authStore.ts`), sin cambios de comportamiento.
- **Verificación de email**: `Register.tsx` ya mostraba el mensaje "revisa tu correo" tras `signUp`; falta activar **Confirm email** en el dashboard de Supabase (Authentication → Providers → Email) — no configurable vía migración SQL.
- **Recuperar contraseña**: `authStore.requestPasswordReset(email)` (usa `resetPasswordForEmail`, redirige a `/restablecer`) + página `src/pages/ForgotPassword.tsx`.
- **Cambio de contraseña**: `authStore.updatePassword(password)` (usa `auth.updateUser`), usado tanto en `src/pages/ResetPassword.tsx` (tras el enlace de recuperación) como en `src/pages/Ajustes.tsx` (ya logueado).
- **`last_login_at`**: `authStore.login()` actualiza `profiles.last_login_at` tras un login exitoso, en segundo plano (no bloquea el login si falla).
- Rutas públicas nuevas: `/recuperar`, `/restablecer` (`src/router/index.tsx`).

### Perfil y ajustes

| Archivo | Responsabilidad |
|---------|------------------|
| `src/hooks/useProfile.ts` | Lee/actualiza `profiles` (`display_name`, `avatar_url`, `country`, `locale`; `role`/`plan` solo lectura). |
| `src/hooks/useSettings.ts` | Lee/actualiza `user_settings` (tema, idioma, notificaciones, y los campos `jsonb` preparados). |
| `src/pages/Perfil.tsx` (`/perfil`) | Nombre, foto (sube a bucket `avatars`), país, idioma. Badge de plan informativo. |
| `src/pages/Ajustes.tsx` (`/ajustes`) | Tema, idioma, notificaciones, placeholders de exportar datos/privacidad, cambio de contraseña, cerrar sesión, eliminar cuenta (placeholder). |

Navegación: `src/components/ui/Layout.tsx` sustituye el botón de logout del header por dos iconos (perfil, ajustes); el logout se movió a `Ajustes.tsx`.

### Tipos

`src/types/index.ts`: nuevos `Profile`, `UserSettings`, `UserRole`, `UserPlan`.

### Limpieza

`src/hooks/useAuth.ts` eliminado (duplicado sin usar; el router siempre usó `useAuthStore`).

---

## Decisiones tomadas

- **`role`/`plan` protegidos por trigger, no por RLS `WITH CHECK`**: una subquery en `WITH CHECK` que se referencia a sí misma para comparar "valor anterior" es propensa a errores de visibilidad MVCC. Un trigger `BEFORE UPDATE` que revierte silenciosamente cualquier cambio a `role`/`plan` salvo que la llamada venga del `service_role` es más simple y correcto.
- **Preferencias abiertas vía `jsonb`**: `camera_preferences`, `ai_preferences`, `privacy_preferences` se guardan como `jsonb` vacío (`{}`) sin definir su estructura interna todavía, para no requerir migraciones cuando se añadan funcionalidades futuras de IA/cámara/privacidad.
- **`last_login_at` actualizado desde el cliente, no desde un trigger de Auth**: evita depender de webhooks de Supabase Auth; es un best-effort que no bloquea el login si falla.
- **Navegación a Perfil/Ajustes en el header, no en la bottom nav**: la bottom nav ya tiene 5 tabs; añadir 2 más la sobrecargaría en móvil.

## Pendiente / fuera de alcance

Ver sección "Explícitamente fuera de alcance" en [`docs/auth-architecture.md`](auth-architecture.md): Premium, Family/bodega compartida, panel de administración, pagos, gestión de dispositivos, preferencias avanzadas de IA/cámara.

Pasos manuales pendientes en el dashboard de Supabase (no automatizables vía migración):
- Activar "Confirm email" en Authentication → Providers → Email.
- Verificar plantillas de email de recuperación de contraseña (idioma, remitente).
