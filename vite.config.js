import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      injectRegister: 'auto',
      includeAssets: ['icon.svg', 'icon-192.png', 'icon-512.png', 'apple-touch-icon.png'],
      manifest: {
        name: 'Naša Hrvatska — Our Croatia',
        short_name: 'Naša Hrvatska',
        description: 'Interactive Croatian language learning with vocabulary, grammar, games, and cultural immersion',
        start_url: '/',
        display: 'standalone',
        background_color: '#fffbeb',
        theme_color: '#0e7490',
        orientation: 'any',
        icons: [
          { src: 'icon-192.png', sizes: '192x192', type: 'image/png' },
          { src: 'icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'any maskable' },
          { src: 'icon.svg', sizes: 'any', type: 'image/svg+xml' }
        ]
      },
      workbox: {
        skipWaiting: true,
        clientsClaim: true,
        globPatterns: ['**/*.{js,css,html,svg,ico}'],
        runtimeCaching: [
          {
            urlPattern: /\/audio\/.*\.(mp3|ogg|wav)$/i,
            handler: 'CacheFirst',
            options: {
              cacheName: 'audio-cache',
              expiration: { maxEntries: 300, maxAgeSeconds: 60 * 60 * 24 * 90 },
              rangeRequests: true,
              cacheableResponse: { statuses: [0, 200, 206] }
            }
          },
          {
            urlPattern: /^https:\/\/fonts\.(googleapis|gstatic)\.com\/.*/i,
            handler: 'CacheFirst',
            options: {
              cacheName: 'google-fonts-cache',
              expiration: { maxEntries: 20, maxAgeSeconds: 60 * 60 * 24 * 365 },
              cacheableResponse: { statuses: [0, 200] }
            }
          },
          {
            urlPattern: /^https:\/\/.*\.firebaseio\.com\/.*/i,
            handler: 'NetworkOnly'
          },
          {
            urlPattern: /^https:\/\/firestore\.googleapis\.com\/.*/i,
            handler: 'NetworkOnly'
          }
        ],
        navigateFallback: '/index.html',
        navigateFallbackDenylist: [/^\/\.netlify/, /^\/netlify/, /^\/_/]
      }
    })
  ],
  build: {
    outDir: 'dist',
    sourcemap: false,
    minify: 'esbuild',
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes('node_modules/firebase')) return 'vendor-firebase';
          if (id.includes('node_modules/react-dom') || id.includes('node_modules/react/')) return 'vendor-react';
        }
      }
    }
  }
});
