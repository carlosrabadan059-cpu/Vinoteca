-- Fase 9: verificación de RLS en wines/tastings.
--
-- El baseline capturado en 20260718000000_baseline.sql confirma que ambas
-- tablas ya tienen RLS activo y una política por comando (select/insert/
-- update/delete) restringida a auth.uid() = user_id:
--   wines:    select_own_wines, insert_own_wines, update_own_wines, delete_own_wines
--   tastings: select_own_tastings, insert_own_tastings, update_own_tastings, delete_own_tastings
--
-- En particular, el DELETE de public.tastings (que src/hooks/useTastings.ts
-- no filtra por user_id en el cliente) SÍ está cubierto por
-- delete_own_tastings. No se requiere ninguna política adicional.
--
-- Este archivo deja constancia, como parte del historial de migraciones, de
-- la verificación realizada en esta fase (ver docs/fase-09-auth.md).

do $$
begin
  assert exists (
    select 1 from pg_policies
    where schemaname = 'public' and tablename = 'wines' and cmd = 'DELETE'
  ), 'Falta política DELETE en public.wines';

  assert exists (
    select 1 from pg_policies
    where schemaname = 'public' and tablename = 'tastings' and cmd = 'DELETE'
  ), 'Falta política DELETE en public.tastings';
end $$;
