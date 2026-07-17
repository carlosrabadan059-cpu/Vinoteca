create extension if not exists "pg_trgm" with schema "public";


  create table "public"."tastings" (
    "id" uuid not null default extensions.uuid_generate_v4(),
    "user_id" uuid not null,
    "wine_id" uuid not null,
    "fecha" date not null default CURRENT_DATE,
    "puntuacion" integer,
    "notas_cata" text,
    "aroma" text,
    "color_descripcion" text,
    "maridaje" text,
    "chat_history" jsonb default '[]'::jsonb,
    "created_at" timestamp with time zone default now(),
    "es_consumo_rapido" boolean not null default false,
    "botella_terminada" boolean not null default false,
    "ocasion" text,
    "lugar" text
      );


alter table "public"."tastings" enable row level security;


  create table "public"."wines" (
    "id" uuid not null default extensions.uuid_generate_v4(),
    "user_id" uuid not null,
    "nombre" text not null,
    "bodega" text,
    "anada" integer,
    "region" text,
    "denominacion" text,
    "uva" text,
    "imagen_frontal_url" text,
    "imagen_trasera_url" text,
    "created_at" timestamp with time zone default now(),
    "synced_at" timestamp with time zone,
    "tipo" text,
    "alcohol" text,
    "crianza" text,
    "descripcion" text,
    "url_bodega" text,
    "temp_servicio" text,
    "contiene" text,
    "volumen" text,
    "qr_fuente" text,
    "wine_uid" text,
    "precio" numeric,
    "num_botellas" integer not null default 1,
    "ubicacion" text,
    "fecha_compra" date,
    "favorito" boolean not null default false,
    "consumido" boolean not null default false
      );


alter table "public"."wines" enable row level security;

CREATE INDEX tastings_fecha_idx ON public.tastings USING btree (fecha DESC);

CREATE UNIQUE INDEX tastings_pkey ON public.tastings USING btree (id);

CREATE INDEX tastings_user_id_idx ON public.tastings USING btree (user_id);

CREATE INDEX tastings_wine_id_idx ON public.tastings USING btree (wine_id);

CREATE INDEX wines_anada_idx ON public.wines USING btree (anada);

CREATE INDEX wines_bodega_idx ON public.wines USING btree (bodega);

CREATE UNIQUE INDEX wines_pkey ON public.wines USING btree (id);

CREATE INDEX wines_qr_fuente_idx ON public.wines USING btree (qr_fuente) WHERE (qr_fuente IS NOT NULL);

CREATE INDEX wines_search_trgm_idx ON public.wines USING gin ((((((nombre || ' '::text) || COALESCE(bodega, ''::text)) || ' '::text) || COALESCE(region, ''::text))) public.gin_trgm_ops);

CREATE INDEX wines_user_created_idx ON public.wines USING btree (user_id, created_at DESC);

CREATE INDEX wines_user_id_idx ON public.wines USING btree (user_id);

CREATE INDEX wines_user_nombre_bodega_idx ON public.wines USING btree (user_id, lower(nombre), lower(bodega));

CREATE INDEX wines_user_wine_uid_idx ON public.wines USING btree (user_id, wine_uid);

alter table "public"."tastings" add constraint "tastings_pkey" PRIMARY KEY using index "tastings_pkey";

alter table "public"."wines" add constraint "wines_pkey" PRIMARY KEY using index "wines_pkey";

alter table "public"."tastings" add constraint "tastings_puntuacion_check" CHECK (((puntuacion >= 1) AND (puntuacion <= 100))) not valid;

alter table "public"."tastings" validate constraint "tastings_puntuacion_check";

alter table "public"."tastings" add constraint "tastings_user_id_fkey" FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE not valid;

alter table "public"."tastings" validate constraint "tastings_user_id_fkey";

alter table "public"."tastings" add constraint "tastings_wine_id_fkey" FOREIGN KEY (wine_id) REFERENCES public.wines(id) ON DELETE CASCADE not valid;

alter table "public"."tastings" validate constraint "tastings_wine_id_fkey";

alter table "public"."wines" add constraint "wines_anada_check" CHECK (((anada >= 1800) AND ((anada)::numeric <= EXTRACT(year FROM now())))) not valid;

alter table "public"."wines" validate constraint "wines_anada_check";

alter table "public"."wines" add constraint "wines_user_id_fkey" FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE not valid;

alter table "public"."wines" validate constraint "wines_user_id_fkey";

create or replace view "public"."tastings_with_wine" as  SELECT t.id,
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
    w.nombre AS wine_nombre,
    w.bodega AS wine_bodega,
    w.anada AS wine_anada,
    w.region AS wine_region,
    w.uva AS wine_uva
   FROM (public.tastings t
     JOIN public.wines w ON ((w.id = t.wine_id)));


grant delete on table "public"."tastings" to "anon";

grant insert on table "public"."tastings" to "anon";

grant references on table "public"."tastings" to "anon";

grant select on table "public"."tastings" to "anon";

grant trigger on table "public"."tastings" to "anon";

grant truncate on table "public"."tastings" to "anon";

grant update on table "public"."tastings" to "anon";

grant delete on table "public"."tastings" to "authenticated";

grant insert on table "public"."tastings" to "authenticated";

grant references on table "public"."tastings" to "authenticated";

grant select on table "public"."tastings" to "authenticated";

grant trigger on table "public"."tastings" to "authenticated";

grant truncate on table "public"."tastings" to "authenticated";

grant update on table "public"."tastings" to "authenticated";

grant delete on table "public"."tastings" to "service_role";

grant insert on table "public"."tastings" to "service_role";

grant references on table "public"."tastings" to "service_role";

grant select on table "public"."tastings" to "service_role";

grant trigger on table "public"."tastings" to "service_role";

grant truncate on table "public"."tastings" to "service_role";

grant update on table "public"."tastings" to "service_role";

grant delete on table "public"."wines" to "anon";

grant insert on table "public"."wines" to "anon";

grant references on table "public"."wines" to "anon";

grant select on table "public"."wines" to "anon";

grant trigger on table "public"."wines" to "anon";

grant truncate on table "public"."wines" to "anon";

grant update on table "public"."wines" to "anon";

grant delete on table "public"."wines" to "authenticated";

grant insert on table "public"."wines" to "authenticated";

grant references on table "public"."wines" to "authenticated";

grant select on table "public"."wines" to "authenticated";

grant trigger on table "public"."wines" to "authenticated";

grant truncate on table "public"."wines" to "authenticated";

grant update on table "public"."wines" to "authenticated";

grant delete on table "public"."wines" to "service_role";

grant insert on table "public"."wines" to "service_role";

grant references on table "public"."wines" to "service_role";

grant select on table "public"."wines" to "service_role";

grant trigger on table "public"."wines" to "service_role";

grant truncate on table "public"."wines" to "service_role";

grant update on table "public"."wines" to "service_role";


  create policy "delete_own_tastings"
  on "public"."tastings"
  as permissive
  for delete
  to public
using ((auth.uid() = user_id));



  create policy "insert_own_tastings"
  on "public"."tastings"
  as permissive
  for insert
  to public
with check ((auth.uid() = user_id));



  create policy "select_own_tastings"
  on "public"."tastings"
  as permissive
  for select
  to public
using ((auth.uid() = user_id));



  create policy "update_own_tastings"
  on "public"."tastings"
  as permissive
  for update
  to public
using ((auth.uid() = user_id));



  create policy "delete_own_wines"
  on "public"."wines"
  as permissive
  for delete
  to public
using ((auth.uid() = user_id));



  create policy "insert_own_wines"
  on "public"."wines"
  as permissive
  for insert
  to public
with check ((auth.uid() = user_id));



  create policy "select_own_wines"
  on "public"."wines"
  as permissive
  for select
  to public
using ((auth.uid() = user_id));



  create policy "update_own_wines"
  on "public"."wines"
  as permissive
  for update
  to public
using ((auth.uid() = user_id));



