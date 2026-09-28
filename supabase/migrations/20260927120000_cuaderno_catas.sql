-- V3 — Cuaderno de catas (estilo Moleskine Wine Journal).
-- Un solo cuaderno para todo lo que se bebe: vinos de la bodega y "vinos de
-- fuera" (restaurante, casa de amigos). Los de fuera viven en la misma tabla
-- wines con en_bodega = false, para reutilizar ficha, fotos, IA y catas.
-- Ver docs/adr/0008-cuaderno-unico-flag-en-bodega.md.

alter table public.wines
  add column en_bodega boolean not null default true;

create index wines_user_en_bodega_idx on public.wines using btree (user_id, en_bodega);

-- Ficha guiada: Vista = color_descripcion y Nariz = aroma (ya existen).
-- Todo nullable: las catas antiguas y el consumo rápido siguen siendo válidos.
alter table public.tastings
  add column dulzor    smallint,
  add column acidez    smallint,
  add column tanino    smallint,
  add column cuerpo    smallint,
  add column final     text,
  add column con_quien text,
  add column foto_url  text;

alter table public.tastings
  add constraint tastings_dulzor_check check (dulzor between 1 and 5),
  add constraint tastings_acidez_check check (acidez between 1 and 5),
  add constraint tastings_tanino_check check (tanino between 1 and 5),
  add constraint tastings_cuerpo_check check (cuerpo between 1 and 5),
  add constraint tastings_final_check  check (final in ('corto', 'medio', 'largo'));

-- Columnas nuevas al final (create or replace view solo permite añadir).
create or replace view public.tastings_with_wine
  with (security_invoker = true) as
  select t.id,
    t.user_id,
    t.wine_id,
    t.fecha,
    t.puntuacion,
    t.notas_cata,
    t.aroma,
    t.color_descripcion,
    t.maridaje,
    t.chat_history,
    t.created_at,
    w.nombre as wine_nombre,
    w.bodega as wine_bodega,
    w.anada  as wine_anada,
    w.region as wine_region,
    w.uva    as wine_uva,
    t.dulzor,
    t.acidez,
    t.tanino,
    t.cuerpo,
    t.final,
    t.con_quien,
    t.foto_url,
    w.en_bodega as wine_en_bodega
  from public.tastings t
    join public.wines w on w.id = t.wine_id;
