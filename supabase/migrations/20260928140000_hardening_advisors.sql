-- Avisos de seguridad del linter de Supabase (2026-09-28).
--
-- 1. handle_new_user() y protect_profile_role_plan() son funciones de trigger
--    SECURITY DEFINER. Por el EXECUTE por defecto de PUBLIC, anon y
--    authenticated podían llamarlas vía /rest/v1/rpc. Los triggers no
--    necesitan ese permiso: se ejecutan con el de la tabla.
revoke execute on function public.handle_new_user()            from public, anon, authenticated;
revoke execute on function public.protect_profile_role_plan()  from public, anon, authenticated;

-- 2. pg_trgm fuera del esquema expuesto public. El índice wines_search_trgm_idx
--    referencia el operator class por OID y sigue funcionando; "extensions" ya
--    está en el search_path de la base de datos.
alter extension pg_trgm set schema extensions;
