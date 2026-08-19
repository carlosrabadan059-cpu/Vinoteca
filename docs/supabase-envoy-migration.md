# Migración del gateway self-hosted: Kong → Envoy

**Estado:** planificada, no iniciada. **Desbloqueada** (2026-08-19) — la verificación manual de la Fase 11 (`docs/roadmap/fase-11-optimizacion.md`) que la retenía ya se cerró.

## Por qué

El 2026-08-19 la app estuvo caída en producción por un bug en `kong.yml`: los consumers (`anon`, `service_role`, `DASHBOARD`) tenían credenciales (`keyauth_credentials`) pero no grupo ACL (`acls:`) asignado, así que el plugin `acl` de cada ruta rechazaba toda petición con `403 "You cannot consume this service"` aunque la API key fuera correcta. Detalle completo en `docs/supabase.md` (sección "Kong — grupos ACL de los consumers").

Supabase ahora ofrece **Envoy** como gateway alternativo para self-hosting, mantenido oficialmente. Elimina esta clase de bug de raíz: no tiene una lista separada de "consumers" con credenciales + grupos que puede desincronizarse — valida las API keys directamente contra las variables de entorno (`ANON_KEY`, `SERVICE_ROLE_KEY`, `SUPABASE_PUBLISHABLE_KEY`, `SUPABASE_SECRET_KEY`) con una regla de acceso por ruta declarada una sola vez. Fuente: [Envoy API Gateway](https://supabase.com/docs/guides/self-hosting/self-hosted-envoy) (docs oficiales de Supabase, consultadas vía MCP el 2026-08-19).

## Qué cambia

- El stack pasa de `docker compose up -d` a `docker compose -f docker-compose.yml -f docker-compose.envoy.yml up -d` — Envoy sustituye a Kong en el mismo puerto (8000) como servicio `api-gw`. El alias de red `kong` se mantiene, así que Studio/Edge Functions (que referencian `kong:8000` internamente) siguen funcionando sin tocarlos.
- Config declarativa pasa de `volumes/api/kong.yml` a `volumes/api/envoy/{envoy.yaml, cds.yaml, lds.template.yaml}` + `docker-entrypoint.sh` (que renderiza `lds.template.yaml` → `lds.yaml` sustituyendo variables de entorno al arrancar, igual que hacía `kong-entrypoint.sh`).
- Nada cambia en el túnel Cloudflare (`supabase-api.rabadanhouse.space` → `127.0.0.1:8000`, `supabase.rabadanhouse.space` → Studio por Tailscale) — Envoy escucha en el mismo puerto, así que las rutas publicadas no se tocan.

## Riesgo a vigilar: el binding doble de puerto es una customización nuestra

`docker-compose.envoy.yml` es un override oficial — probablemente no incluye el binding doble de host que añadimos hoy (`127.0.0.1:8000:8000` + `100.115.74.107:8000:8000`, uno para el túnel Cloudflare y otro para acceso directo por Tailscale al MCP). Hay que **revisar el `ports:` del servicio `api-gw`/`envoy` en el override tras aplicarlo** y reintroducir ambos bindings si el override los pisa con el valor por defecto. Sin esto, se repite el mismo apagón de hoy (502 en el dominio público) o se pierde el acceso directo del MCP por Tailscale.

## Plan (fases)

### 0. Comprobaciones previas (no destructivas)

En el `debian`:
```bash
cd /srv/docker/supabase
grep -c '^ANON_KEY_ASYMMETRIC=' .env
grep -c '^SERVICE_ROLE_KEY_ASYMMETRIC=' .env
ls utils/add-new-auth-keys.sh utils/generate-keys.sh 2>&1
```
Si `ANON_KEY_ASYMMETRIC`/`SERVICE_ROLE_KEY_ASYMMETRIC` no están seteados (probable, dado que este stack viene de un dump restaurado de Supabase Cloud y no de un `setup.sh` fresco), Envoy arrancará en **modo legacy-only**: solo acepta `ANON_KEY`/`SERVICE_ROLE_KEY` (JWT HS256), no las keys opacas `sb_publishable_*`/`sb_secret_*`. Esto es aceptable para no romper nada (la app ya usa `sb_publishable_...` como `VITE_SUPABASE_ANON_KEY` en producción — habría que confirmar si legacy-only sigue aceptando esa key opaca, o si hay que volver a la `ANON_KEY` JWT clásica ahí; revisar el comportamiento real en el paso de verificación antes de dar por cerrada la migración). Si los scripts `utils/*.sh` no existen en este directorio (posible, si el stack no viene de un clone completo del repo de Supabase), generar las asymmetric keys puede requerir clonar `supabase/supabase` aparte solo para tomar prestado ese script — evaluarlo en el momento, no asumir ahora.

### 1. Backup

```bash
cd /srv/docker/supabase
cp docker-compose.yml docker-compose.yml.pre-envoy.bak
cp -r volumes/api volumes/api.pre-envoy.bak
```

### 2. Descargar `docker-compose.envoy.yml` y los ficheros de `volumes/api/envoy/`

No están en este directorio todavía (el stack se instaló antes de que Envoy existiera como opción). Descargarlos del repo oficial (`supabase/supabase`, directorio `docker/`), misma versión/rama que el resto del stack ya desplegado — no mezclar versiones de compose.

### 3. Aplicar el override y reintroducir el binding doble de puerto

```bash
docker compose -f docker-compose.yml -f docker-compose.envoy.yml up -d
```
Después, comprobar `ports:` del servicio `api-gw` (ver sección de riesgo arriba) y corregir si hace falta, igual que se hizo hoy para Kong (commit `4d2efc6`/`d1ee5b4` del repo de la app documentan el patrón, aunque el fix en sí fue en el host, no en este repo).

### 4. Volver a habilitar el acceso MCP por Tailscale

Equivalente al `ip-restriction` que editamos hoy en `kong.yml`, pero en `volumes/api/envoy/lds.template.yaml`: localizar la ruta `prefix: /mcp`, comentar el bloque `rbac` que deniega (`action: DENY`), descomentar el bloque `allow_local` de abajo, y añadir la IP de Tailscale del Mac (`100.101.11.125`) junto a `127.0.0.1`/`::1` como `direct_remote_ip`. Reiniciar con:
```bash
docker compose -f docker-compose.yml -f docker-compose.envoy.yml restart api-gw
```

Nota: la guía oficial de Supabase para exponer MCP solo contempla **VPN o túnel SSH** — nunca exposición directa a Internet. Tailscale es una VPN mesh, así que el enfoque actual (acceso directo por Tailscale con allow-list de IP) ya cumple esa recomendación; no hace falta volver al túnel SSH.

### 5. Verificar (mismo checklist que se usó hoy para validar el fix de Kong)

```bash
curl -sS -w "\nHTTP %{http_code}\n" https://supabase-api.rabadanhouse.space/auth/v1/health
curl -sS -w "\nHTTP %{http_code}\n" "https://supabase-api.rabadanhouse.space/rest/v1/wines?select=id&limit=1" -H "apikey: <la key configurada en VITE_SUPABASE_ANON_KEY de Vercel>"
```
Y desde Claude Code: `mcp__supabase__list_tables` para confirmar que el MCP sigue respondiendo por Tailscale. Probar login real en `https://vinoteca-ten.vercel.app` antes de dar la migración por cerrada.

### 6. Rollback

Si algo falla y no se resuelve rápido:
```bash
docker compose -f docker-compose.envoy.yml down
docker compose up -d
```
(vuelve a Kong con la config ya arreglada hoy, sin tocar `docker-compose.yml` — el override simplemente deja de aplicarse). Los backups de `docker-compose.yml.pre-envoy.bak` y `volumes/api.pre-envoy.bak` quedan como red de seguridad adicional si algo más se tocó por error.

## Referencias

- [Envoy API Gateway](https://supabase.com/docs/guides/self-hosting/self-hosted-envoy) — arquitectura, rutas, hardening, troubleshooting
- [New API Keys and Asymmetric Authentication](https://supabase.com/docs/guides/self-hosting/self-hosted-auth-keys) — keys opacas vs. legacy, por qué hacen falta las cuatro variables para modo opaco completo
- [Enabling MCP Server Access](https://supabase.com/docs/guides/self-hosting/enable-mcp) — versión Kong y Envoy en pestañas paralelas
- `docs/supabase.md` — estado actual (Kong) de esta misma infraestructura
