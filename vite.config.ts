import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { VitePWA } from 'vite-plugin-pwa'

// Los patrones de caché del service worker se derivan de VITE_SUPABASE_URL en vez de
// fijar un dominio (antes `*.supabase.co`, que dejó de coincidir al migrar a self-hosted).
const escapeRegExp = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')
  // Sin VITE_SUPABASE_URL (p. ej. un build de preview sin variables) el patrón no coincide con nada.
  const supabaseOrigin = env.VITE_SUPABASE_URL ? escapeRegExp(new URL(env.VITE_SUPABASE_URL).origin) : '(?!)'

  return {
    plugins: [
      react(),
      tailwindcss(),
      VitePWA({
        registerType: 'autoUpdate',
        includeAssets: ['favicon.ico', 'apple-touch-icon.png', 'mask-icon.svg'],
        manifest: {
          name: 'Vinoteca',
          short_name: 'Vinoteca',
          description: 'Tu bodega personal de vinos',
          theme_color: '#722F37',
          background_color: '#1A0A0E',
          display: 'standalone',
          orientation: 'portrait',
          icons: [
            { src: 'pwa-192x192.png', sizes: '192x192', type: 'image/png' },
            { src: 'pwa-512x512.png', sizes: '512x512', type: 'image/png' },
            { src: 'pwa-512x512.png', sizes: '512x512', type: 'image/png', purpose: 'any maskable' },
          ],
        },
        workbox: {
          globPatterns: ['**/*.{js,css,html,ico,png,svg,woff2}'],
          runtimeCaching: [
            {
              urlPattern: new RegExp(`^${supabaseOrigin}/rest/v1/`, 'i'),
              handler: 'NetworkFirst',
              options: {
                cacheName: 'supabase-api',
                networkTimeoutSeconds: 5,
                expiration: { maxEntries: 100, maxAgeSeconds: 86400 },
              },
            },
            {
              urlPattern: new RegExp(`^${supabaseOrigin}/storage/v1/`, 'i'),
              handler: 'CacheFirst',
              options: {
                cacheName: 'supabase-storage',
                expiration: { maxEntries: 200, maxAgeSeconds: 604800 },
              },
            },
          ],
        },
      }),
    ],
  }
})
