-- "Foto de estudio": mejora de fotografías de vino con IA.
-- imagen_original_url es la fuente de verdad de si el original ya está
-- protegido en Storage (no image_version, que solo describe qué versión
-- de pipeline generó la imagen ACTUAL — un dato podría llegar a
-- image_version='studio_v1' por una restauración o edición manual sin que
-- el archivo original esté realmente a salvo).
alter table public.wines
  add column imagen_original_url    text,
  add column image_version          text not null default 'original',
  add column image_style            text,
  add column image_source           text,
  add column image_processing_state text not null default 'original';
