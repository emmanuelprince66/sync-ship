import { fileURLToPath, URL } from 'node:url'
import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'
import { defineConfig, loadEnv } from 'vite'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')
  return {
    plugins: [
      react(),
      tailwindcss(),
      // Installable app + offline app shell. API and Geoapify calls always go to the network (never cached).
      VitePWA({
        registerType: 'autoUpdate', // a new upload replaces the old version on the next visit, no prompt
        injectRegister: 'script-defer',
        includeAssets: ['favicon.png', 'apple-touch-icon.png', 'brand/*.png'],
        manifest: {
          id: '/',
          name: 'Sync Go',
          short_name: 'Sync Go',
          description: 'Shipments, pickups, tracking and your wallet in one place.',
          start_url: '/',
          scope: '/',
          display: 'standalone',
          theme_color: '#09261C',
          background_color: '#F6F8F6',
          icons: [
            { src: '/icons/icon-192.png', sizes: '192x192', type: 'image/png', purpose: 'any' },
            { src: '/icons/icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'any' },
            { src: '/icons/icon-512-maskable.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
          ],
        },
        workbox: {
          // App shell only: the built JS/CSS/HTML, fonts and icons.
          globPatterns: ['**/*.{js,css,html,woff,woff2,png,svg,ico,webmanifest}'],
          // The Nigeria address data (~8 MB) loads on demand when an address form opens; precaching it would
          // cost every visitor that much mobile data.
          globIgnores: ['**/assets/address-*.js'],
          maximumFileSizeToCacheInBytes: 5 * 1024 * 1024,
          cleanupOutdatedCaches: true,
          clientsClaim: true,
          skipWaiting: true,
          navigateFallback: '/index.html',
          navigateFallbackDenylist: [/^\/api\//],
          runtimeCaching: [
            { urlPattern: ({ url }) => url.pathname.startsWith('/api/'), handler: 'NetworkOnly' },
            { urlPattern: ({ url }) => url.hostname.endsWith('geoapify.com'), handler: 'NetworkOnly' },
          ],
        },
        devOptions: { enabled: false },
      }),
    ],
    resolve: { alias: { '@': fileURLToPath(new URL('./src', import.meta.url)) } },
    server: {
      port: 5174,
      // Dev-only proxy so the browser avoids CORS while we talk to the Sync360 API.
      proxy: {
        '/api/v1': { target: env.VITE_API_PROXY_TARGET || 'https://api.sync360.africa', changeOrigin: true, secure: true },
      },
    },
  }
})
