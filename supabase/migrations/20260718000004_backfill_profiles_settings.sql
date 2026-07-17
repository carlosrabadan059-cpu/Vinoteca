-- Fase 9: no todos los usuarios pasaron por el trigger on_auth_user_created
-- (la(s) cuenta(s) existente(s) se crearon antes de que exista). Este
-- backfill genera las filas de profiles/user_settings que falten, con los
-- mismos valores por defecto que usaría el trigger.

insert into public.profiles (id)
select u.id
from auth.users u
left join public.profiles p on p.id = u.id
where p.id is null;

insert into public.user_settings (user_id)
select p.id
from public.profiles p
left join public.user_settings s on s.user_id = p.id
where s.user_id is null;
