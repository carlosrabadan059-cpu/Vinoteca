-- V3.1 — Glosario personal del tutor de cata.
-- Términos que el tutor (n8n vinoteca-cata-tutor) enseña al revisar una
-- sección de la ficha y que el usuario decide guardar.

create table public.glossary_terms (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null default auth.uid() references auth.users (id) on delete cascade,
  termino     text not null check (btrim(termino) <> ''),
  definicion  text not null check (btrim(definicion) <> ''),
  categoria   text not null default 'general'
              check (categoria in ('vista', 'nariz', 'boca', 'general')),
  wine_id     uuid references public.wines (id) on delete set null,
  created_at  timestamptz not null default now(),
  -- Clave de deduplicación: PostgREST solo admite on_conflict sobre columnas,
  -- no sobre un índice de expresión, así que se materializa aquí.
  termino_key text generated always as (lower(btrim(termino))) stored,
  constraint glossary_terms_user_termino_key unique (user_id, termino_key)
);

create index glossary_terms_wine_id_idx on public.glossary_terms using btree (wine_id);

alter table public.glossary_terms enable row level security;

create policy "select_own_glossary_terms" on public.glossary_terms
  for select to authenticated using ((select auth.uid()) = user_id);

create policy "insert_own_glossary_terms" on public.glossary_terms
  for insert to authenticated with check ((select auth.uid()) = user_id);

create policy "update_own_glossary_terms" on public.glossary_terms
  for update to authenticated using ((select auth.uid()) = user_id);

create policy "delete_own_glossary_terms" on public.glossary_terms
  for delete to authenticated using ((select auth.uid()) = user_id);

grant select, insert, update, delete on table public.glossary_terms to authenticated;
