-- Fase 9: tablas de identidad (profiles) y preferencias (user_settings),
-- separadas de auth.users y entre sí. profiles guarda solo información
-- estable; user_settings guarda todo lo que cambia con frecuencia.

create table public.profiles (
  id            uuid primary key references auth.users(id) on delete cascade,
  display_name  text,
  avatar_url    text,
  country       text,
  locale        text not null default 'es',
  role          text not null default 'user'  check (role in ('user', 'premium', 'family', 'admin')),
  plan          text not null default 'free'  check (plan in ('free', 'premium', 'family')),
  last_login_at timestamptz,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

create table public.user_settings (
  user_id              uuid primary key references public.profiles(id) on delete cascade,
  theme                text not null default 'dark' check (theme in ('system', 'light', 'dark')),
  language             text not null default 'es',
  currency             text not null default 'EUR',
  timezone             text not null default 'UTC',
  date_format          text not null default 'DD/MM/YYYY',
  notifications_email  boolean not null default true,
  notifications_push   boolean not null default true,
  camera_preferences   jsonb not null default '{}'::jsonb,
  ai_preferences       jsonb not null default '{}'::jsonb,
  privacy_preferences  jsonb not null default '{}'::jsonb,
  created_at           timestamptz not null default now(),
  updated_at           timestamptz not null default now()
);

alter table public.profiles enable row level security;
alter table public.user_settings enable row level security;

-- profiles: cada usuario lee y edita su propia fila.
create policy profiles_select_own on public.profiles
  for select using (id = auth.uid());

create policy profiles_update_own on public.profiles
  for update using (id = auth.uid())
  with check (id = auth.uid());

-- user_settings: cada usuario lee y edita únicamente su propia fila.
create policy user_settings_select_own on public.user_settings
  for select using (user_id = auth.uid());

create policy user_settings_update_own on public.user_settings
  for update using (user_id = auth.uid())
  with check (user_id = auth.uid());

-- Sin políticas de INSERT/DELETE para el cliente: ambas filas nacen y mueren
-- junto con auth.users vía trigger (siguiente migración) y el on delete cascade.

-- role/plan quedan protegidos por trigger (no por RLS): un usuario podría en
-- teoría enviar un UPDATE que incluya role/plan sin cambiarlos y pasaría la
-- policy de arriba; el trigger revierte cualquier intento de modificarlos
-- desde el cliente, dejando la única vía de cambio a una función/rol con
-- privilegios elevados (service role) que se implementará junto al futuro
-- panel de administración (fuera de alcance de esta fase).
create or replace function public.protect_profile_role_plan()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if auth.role() <> 'service_role' then
    new.role := old.role;
    new.plan := old.plan;
  end if;
  return new;
end;
$$;

create trigger protect_profile_role_plan_trigger
  before update on public.profiles
  for each row
  execute function public.protect_profile_role_plan();
