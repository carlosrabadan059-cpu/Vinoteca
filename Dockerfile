# ── Build ────────────────────────────────────────────────────────────────────
FROM node:24-alpine AS build
WORKDIR /app

# Vite incrusta las VITE_* en el bundle al compilar. Pueden llegar como build args
# (Dokploy: "Build-time Arguments") o en un .env del contexto de build (Dokploy lo
# genera desde "Environment Settings"); Vite lee ese .env solo.
ARG VITE_SUPABASE_URL
ARG VITE_SUPABASE_ANON_KEY
ARG VITE_N8N_BASE_URL

COPY package.json package-lock.json ./
RUN npm ci
COPY . .
RUN test -n "$VITE_SUPABASE_URL" || grep -qs '^VITE_SUPABASE_URL=.' .env \
    || (echo "Falta VITE_SUPABASE_URL (ni build arg ni .env)" && exit 1)
RUN npm run build

# ── Serve ────────────────────────────────────────────────────────────────────
FROM nginx:1.27-alpine
COPY docker/nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /app/dist /usr/share/nginx/html
EXPOSE 80
