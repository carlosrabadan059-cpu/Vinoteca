-- Permite a cada usuario borrar sus propias fotos de etiquetas (bucket wine-labels).
-- Hasta ahora solo había políticas de INSERT, SELECT y UPDATE, así que cualquier
-- borrado hecho con la sesión del usuario fallaba en silencio. El botón «Girar foto»
-- sube un archivo nuevo y borra el antiguo; sin esta política el antiguo quedaba huérfano.
-- Mismo criterio que las demás: solo la carpeta propia (<user_id>/...).

create policy "Users can delete wine labels"
on storage.objects
for delete
to authenticated
using (
  bucket_id = 'wine-labels'
  and (storage.foldername(name))[1] = (auth.uid())::text
);
