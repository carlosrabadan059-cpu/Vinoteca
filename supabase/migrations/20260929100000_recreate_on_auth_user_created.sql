-- Trigger perdido en la migración a self-hosted (el esquema auth no se migra
-- con supabase/migrations). Crea la fila de profiles y user_settings al
-- registrarse un usuario nuevo. handle_new_user() es idempotente.
drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();
