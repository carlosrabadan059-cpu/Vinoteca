-- Fase 9: al registrarse un usuario en auth.users, se crean automáticamente
-- su fila de profiles y su fila de user_settings con los valores por
-- defecto. Nunca depende de React para existir (evita estados huérfanos si
-- la app falla justo después del signUp).

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id)
  values (new.id)
  on conflict (id) do nothing;

  insert into public.user_settings (user_id)
  values (new.id)
  on conflict (user_id) do nothing;

  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;

create trigger on_auth_user_created
  after insert on auth.users
  for each row
  execute function public.handle_new_user();

-- Bucket de avatares de perfil, con el mismo patrón de rutas por usuario que
-- wine-labels ({userId}/...).
insert into storage.buckets (id, name, public)
values ('avatars', 'avatars', true)
on conflict (id) do nothing;

do $$
begin
  if not exists (
    select 1 from pg_policies
    where schemaname = 'storage' and tablename = 'objects' and policyname = 'avatars_read_own_v9'
  ) then
    create policy avatars_read_own_v9 on storage.objects
      for select using (
        bucket_id = 'avatars'
        and (storage.foldername(name))[1] = auth.uid()::text
      );
  end if;

  if not exists (
    select 1 from pg_policies
    where schemaname = 'storage' and tablename = 'objects' and policyname = 'avatars_write_own_v9'
  ) then
    create policy avatars_write_own_v9 on storage.objects
      for insert with check (
        bucket_id = 'avatars'
        and (storage.foldername(name))[1] = auth.uid()::text
      );
  end if;

  if not exists (
    select 1 from pg_policies
    where schemaname = 'storage' and tablename = 'objects' and policyname = 'avatars_update_own_v9'
  ) then
    create policy avatars_update_own_v9 on storage.objects
      for update using (
        bucket_id = 'avatars'
        and (storage.foldername(name))[1] = auth.uid()::text
      );
  end if;

  if not exists (
    select 1 from pg_policies
    where schemaname = 'storage' and tablename = 'objects' and policyname = 'avatars_delete_own_v9'
  ) then
    create policy avatars_delete_own_v9 on storage.objects
      for delete using (
        bucket_id = 'avatars'
        and (storage.foldername(name))[1] = auth.uid()::text
      );
  end if;
end $$;
