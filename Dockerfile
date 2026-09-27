# ── Build ────────────────────────────────────────────────────────────────────
FROM node:24-alpine AS build
WORKDIR /app

# Vite incrusta las VITE_* en el bundle al compilar: deben llegar como build args
# (en Dokploy: "Build-time Arguments"), no solo como variables de runtime.
ARG VITE_SUPABASE_URL
ARG VITE_SUPABASE_ANON_KEY
ARG VITE_N8N_BASE_URL
ENV VITE_SUPABASE_URL=$VITE_SUPABASE_URL \
    VITE_SUPABASE_ANON_KEY=$VITE_SUPABASE_ANON_KEY \
    VITE_N8N_BASE_URL=$VITE_N8N_BASE_URL

COPY package.json package-lock.json ./
RUN npm ci
COPY . .
RUN test -n "$VITE_SUPABASE_URL" || (echo "Falta el build arg VITE_SUPABASE_URL" && exit 1)
RUN npm run build

# ── Serve ────────────────────────────────────────────────────────────────────
FROM nginx:1.27-alpine
COPY docker/nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /app/dist /usr/share/nginx/html
EXPOSE 80
